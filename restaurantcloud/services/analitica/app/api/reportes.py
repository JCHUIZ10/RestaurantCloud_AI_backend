"""Reportes de ventas y desempeño (CU-ADMIN-13), detallados en la ficha de ms-analítica, sección 3.

Rutas públicas: llegan por Kong con el JWT del núcleo. La empresa y la sede salen de
`contexto_de_sede`; ninguna consulta usa un identificador que venga en la URL.
"""

from datetime import date
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.datos import reportes as datos
from app.datos import series as datos_series
from app.datos.db import transaccion
from app.dominio.reportes import (
    PlatoParaMatriz,
    clasificar_menu,
    dividir,
    periodo_anterior,
    porcentaje,
    redondear,
    validar_rango_reporte,
    variacion_pct,
)
from app.dominio.series import RangoInvalido
from app.soporte.jwt import Contexto, contexto_de_sede
from app.soporte.respuestas import ErrorApi, respuesta_ok

ROLES_REPORTES = ("admin_local", "propietario")
MODULO_AVANZADO = "reportes_avanzados"

router = APIRouter(prefix="/api/v1/analitica", tags=["reportes"])

_sede = contexto_de_sede(ROLES_REPORTES)
_sede_avanzada = contexto_de_sede(ROLES_REPORTES, MODULO_AVANZADO)


def _validar(desde: date, hasta: date) -> None:
    try:
        validar_rango_reporte(desde, hasta)
    except RangoInvalido as error:
        raise ErrorApi(422, "ERR_RANGO_INVALIDO", str(error), {"desde": str(desde), "hasta": str(hasta)}) from None


def _cabecera(contexto: Contexto, desde: date, hasta: date) -> dict:
    return {"local_id": str(contexto.local_id), "desde": desde.isoformat(), "hasta": hasta.isoformat()}


def _indicadores(conexion, contexto: Contexto, desde: date, hasta: date) -> dict:
    t = datos.totales(conexion, contexto.empresa_id, contexto.local_id, desde, hasta)
    medios = datos.por_medio_pago(conexion, contexto.empresa_id, contexto.local_id, desde, hasta)
    tipos = datos.por_tipo(conexion, contexto.empresa_id, contexto.local_id, desde, hasta)
    return {
        "desde": desde.isoformat(),
        "hasta": hasta.isoformat(),
        "ventas_total": redondear(t.ventas_total),
        "comprobantes": t.comprobantes,
        "dias_con_ventas": t.dias_con_ventas,
        "comprobantes_por_dia": dividir(t.comprobantes, t.dias_con_ventas, 1),
        "ticket_promedio": dividir(t.ventas_total, t.comprobantes),
        "comensales": t.comensales,
        "ticket_por_comensal": dividir(t.total_con_comensales, t.comensales),
        "descuentos": redondear(t.descuentos),
        "anulados": {"comprobantes": t.anulados_comprobantes, "total": redondear(t.anulados_total)},
        "por_medio_pago": [
            {
                "medio_pago": g.clave,
                "comprobantes": g.comprobantes,
                "total": redondear(g.total),
                "porcentaje": porcentaje(g.total, t.ventas_total),
            }
            for g in medios
        ],
        "por_tipo": [{"tipo": g.clave, "comprobantes": g.comprobantes, "total": redondear(g.total)} for g in tipos],
    }


@router.get("/ventas/resumen")
def resumen(desde: date, hasta: date, comparar: bool = True, contexto: Contexto = Depends(_sede)):
    """Indicadores del periodo (pestaña 1) y, con `comparar`, los del periodo anterior de igual duración."""
    _validar(desde, hasta)
    with transaccion() as conexion:
        actual = _indicadores(conexion, contexto, desde, hasta)
        anterior = _indicadores(conexion, contexto, *periodo_anterior(desde, hasta)) if comparar else None
        ultimo = datos_series.ultimo_evento_en(conexion, contexto.empresa_id, contexto.local_id)

    variacion = None
    if anterior is not None:
        claves = ("ventas_total", "comprobantes", "ticket_promedio", "ticket_por_comensal")
        variacion = {c: variacion_pct(actual[c], anterior[c]) for c in claves}

    zona = ZoneInfo(get_settings().zona_horaria)
    return respuesta_ok(
        {
            **_cabecera(contexto, desde, hasta),
            "actual": {k: v for k, v in actual.items() if k not in ("desde", "hasta")},
            "anterior": anterior,
            "variacion_pct": variacion,
            "ultimo_evento_en": ultimo.astimezone(zona).isoformat(timespec="seconds") if ultimo else None,
        }
    )


@router.get("/ventas/por-hora")
def por_hora(desde: date, hasta: date, contexto: Contexto = Depends(_sede)):
    """Curva horaria del periodo: siempre 24 franjas, con ceros donde no hubo ventas."""
    _validar(desde, hasta)
    with transaccion() as conexion:
        franjas = datos.por_hora(
            conexion, contexto.empresa_id, contexto.local_id, desde, hasta, get_settings().zona_horaria
        )
        dias = datos.totales(conexion, contexto.empresa_id, contexto.local_id, desde, hasta).dias_con_ventas

    por_hora_ = {f.hora: f for f in franjas}
    completas = [
        {
            "hora": hora,
            "comprobantes": por_hora_[hora].comprobantes if hora in por_hora_ else 0,
            "total": redondear(por_hora_[hora].total) if hora in por_hora_ else 0.0,
            "promedio_por_dia": dividir(por_hora_[hora].total, dias) if hora in por_hora_ else 0.0,
        }
        for hora in range(24)
    ]
    # La de mayor total; ante un empate, la más temprana (`max` conserva la primera).
    punta = max(franjas, key=lambda f: f.total, default=None)
    return respuesta_ok(
        {
            **_cabecera(contexto, desde, hasta),
            "dias_con_ventas": dias,
            "franjas": completas,
            "hora_punta": {"hora": punta.hora, "total": redondear(punta.total)} if punta else None,
        }
    )


@router.get("/productos/ranking")
def ranking(desde: date, hasta: date, contexto: Contexto = Depends(_sede_avanzada)):
    """Platos por unidades vendidas, su rentabilidad y la matriz de ingeniería de menú (pestaña 2)."""
    _validar(desde, hasta)
    with transaccion() as conexion:
        productos = datos.ventas_por_producto(conexion, contexto.empresa_id, contexto.local_id, desde, hasta)

    unidades_totales = sum(p.unidades for p in productos)
    ingreso_total = sum((p.ingreso for p in productos), Decimal(0))
    umbrales, clasificacion = clasificar_menu(
        [
            PlatoParaMatriz(str(p.producto_id), p.unidades, None if p.costo is None else p.ingreso - p.costo)
            for p in productos
        ]
    )

    categorias: dict[str, dict] = {}
    for p in productos:
        nombre = p.categoria_nombre or "Sin categoría"
        categoria = categorias.setdefault(nombre, {"unidades": 0, "ingreso": Decimal(0)})
        categoria["unidades"] += p.unidades
        categoria["ingreso"] += p.ingreso

    return respuesta_ok(
        {
            **_cabecera(contexto, desde, hasta),
            "productos": [
                {
                    "producto_id": str(p.producto_id),
                    "nombre": p.nombre,
                    "categoria_nombre": p.categoria_nombre,
                    "unidades": p.unidades,
                    "ingreso": redondear(p.ingreso),
                    "participacion_pct": porcentaje(p.unidades, unidades_totales),
                    "costo": redondear(p.costo),
                    "margen": None if p.costo is None else redondear(p.ingreso - p.costo),
                    "margen_unitario": None if p.costo is None else dividir(p.ingreso - p.costo, p.unidades),
                    "clasificacion": clasificacion.get(str(p.producto_id)),
                }
                for p in productos
            ],
            "umbrales": (
                {
                    "popularidad_pct": redondear(umbrales.popularidad_pct, 1),
                    "margen_unitario": redondear(umbrales.margen_unitario),
                }
                if umbrales
                else None
            ),
            "por_categoria": [
                {
                    "categoria_nombre": nombre,
                    "unidades": c["unidades"],
                    "ingreso": redondear(c["ingreso"]),
                    "participacion_pct": porcentaje(c["ingreso"], ingreso_total),
                }
                for nombre, c in sorted(categorias.items(), key=lambda par: (-par[1]["ingreso"], par[0]))
            ],
            "sin_costo": sum(1 for p in productos if p.costo is None),
        }
    )


def _anulaciones(a: datos.AnulacionesDeMozo | None) -> dict:
    if a is None:
        return {"cantidad": 0, "monto": 0.0, "mermas": 0, "costo_merma": 0.0}
    return {"cantidad": a.cantidad, "monto": redondear(a.monto), "mermas": a.mermas, "costo_merma": redondear(a.costo_merma)}


@router.get("/personal/desempeno")
def desempeno(desde: date, hasta: date, contexto: Contexto = Depends(_sede_avanzada)):
    """Ventas, notas de crédito y anulaciones por mozo (pestaña 3)."""
    _validar(desde, hasta)
    with transaccion() as conexion:
        ventas = datos.ventas_por_mozo(conexion, contexto.empresa_id, contexto.local_id, desde, hasta)
        anulaciones = datos.anulaciones_por_mozo(conexion, contexto.empresa_id, contexto.local_id, desde, hasta)

    anulaciones_por_id = {a.mozo_id: a for a in anulaciones if a.mozo_id is not None}
    ventas_por_id = {v.mozo_id: v for v in ventas}

    mozos = []
    for mozo_id in ventas_por_id.keys() | anulaciones_por_id.keys():
        v = ventas_por_id.get(mozo_id)
        a = anulaciones_por_id.get(mozo_id)
        mozos.append(
            {
                "mozo_id": str(mozo_id),
                "mozo_nombre": v.mozo_nombre if v else a.mozo_nombre,
                "comprobantes": v.comprobantes if v else 0,
                "ventas_total": redondear(v.ventas_total) if v else 0.0,
                "ticket_promedio": dividir(v.ventas_total, v.comprobantes) if v else None,
                "comensales": v.comensales if v else 0,
                "comprobantes_anulados": v.comprobantes_anulados if v else 0,
                "anulaciones": _anulaciones(a),
            }
        )
    mozos.sort(key=lambda m: (-m["ventas_total"], m["mozo_nombre"] or "", m["mozo_id"]))

    total_anulaciones = datos.AnulacionesDeMozo(
        None,
        None,
        sum(a.cantidad for a in anulaciones),
        sum((a.monto for a in anulaciones), Decimal(0)),
        sum(a.mermas for a in anulaciones),
        sum((a.costo_merma for a in anulaciones), Decimal(0)),
    )
    return respuesta_ok(
        {
            **_cabecera(contexto, desde, hasta),
            "mozos": mozos,
            "totales": {
                "comprobantes": sum(v.comprobantes for v in ventas),
                "ventas_total": redondear(sum((v.ventas_total for v in ventas), Decimal(0))),
                "anulaciones": _anulaciones(total_anulaciones),
            },
        }
    )
