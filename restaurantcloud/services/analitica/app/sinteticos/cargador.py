"""Carga y purga de ventas sintéticas en la base de ms-analítica."""

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import Connection, text

from app.datos.db import transaccion
from app.dominio.procesador import aplicar_venta_registrada
from app.sinteticos.carta import Carta
from app.sinteticos.generador import LIMA, DiaGenerado, generar
from app.sinteticos.perfil import Perfil

log = logging.getLogger("sinteticos")


@dataclass(frozen=True)
class Resumen:
    dias: int
    ventas: int
    unidades: int


def hoy_en_lima() -> date:
    return datetime.now(LIMA).date()


def validar_hasta(hasta: date, hoy: date | None = None) -> None:
    """Los datos sintéticos terminan antes de hoy: de hoy en adelante solo debe haber ventas reales."""
    hoy = hoy or hoy_en_lima()
    if hasta >= hoy:
        raise ValueError(f"`hasta` ({hasta}) debe ser anterior a hoy ({hoy}): lo reciente es de ventas reales.")


def restar_meses(fecha: date, meses: int) -> date:
    indice = fecha.year * 12 + (fecha.month - 1) - meses
    anio, mes = divmod(indice, 12)
    mes += 1
    # El día se ajusta al último del mes cuando no existe (31 de marzo menos un mes).
    for dia in (fecha.day, 30, 29, 28):
        try:
            return date(anio, mes, dia)
        except ValueError:
            continue
    raise AssertionError("inalcanzable")


def cargar(
    carta: Carta,
    perfil: Perfil,
    desde: date,
    hasta: date,
    semilla: int,
    por_dia: Callable[[DiaGenerado], None] | None = None,
) -> Resumen:
    """Genera y guarda el rango, una transacción por día. Repetirlo con los mismos argumentos no duplica nada."""
    validar_hasta(hasta)
    dias = ventas = unidades = 0
    for dia in generar(perfil, carta, desde, hasta, semilla):
        with transaccion() as conexion:
            for venta in dia.ventas:
                aplicar_venta_registrada(conexion, carta.empresa_id, carta.local_id, venta)
        dias += 1
        ventas += len(dia.ventas)
        unidades += sum(i.cantidad for v in dia.ventas for i in v.items)
        if por_dia is not None:
            por_dia(dia)
        if dias % 30 == 0:
            log.info("avance: %s días, %s ventas (hasta %s)", dias, ventas, dia.fecha)
    return Resumen(dias, ventas, unidades)


_FILTRO = "empresa_id = :empresa AND local_id = :local AND fecha_operativa <= :hasta"


def _reconstruir_productos_vistos(conexion: Connection, empresa_id: UUID, local_id: UUID) -> None:
    conexion.execute(text("DELETE FROM producto_visto WHERE empresa_id = :e AND local_id = :l"), {"e": empresa_id, "l": local_id})
    conexion.execute(
        text(
            """
            INSERT INTO producto_visto (producto_id, empresa_id, local_id, nombre, categoria_nombre, primera_venta, ultima_venta)
            SELECT DISTINCT ON (producto_id) producto_id, :e, :l, producto_nombre, categoria_nombre,
                   min(fecha_operativa) OVER (PARTITION BY producto_id),
                   max(fecha_operativa) OVER (PARTITION BY producto_id)
            FROM venta_item
            WHERE local_id = :l
            ORDER BY producto_id, fecha_operativa DESC, id DESC
            """
        ),
        {"e": empresa_id, "l": local_id},
    )


def purgar(empresa_id: UUID, local_id: UUID, hasta: date, confirmar: bool) -> dict[str, int]:
    """Borra las ventas, la serie diaria y las anulaciones del local hasta `hasta` (incluida).

    Sin `confirmar` solo cuenta. No distingue entre ventas sintéticas y reales: borra todo lo
    anterior al corte, que es lo que se quiere al reemplazar el histórico sintético por datos reales.
    """
    parametros = {"empresa": empresa_id, "local": local_id, "hasta": hasta}
    with transaccion() as conexion:
        conteo = {
            tabla: conexion.execute(text(f"SELECT count(*) FROM {tabla} WHERE {_FILTRO}"), parametros).scalar_one()
            for tabla in ("venta", "venta_diaria_producto", "anulacion")
        }
        if confirmar:
            for tabla in ("venta", "venta_diaria_producto", "anulacion"):  # venta_item se va en cascada
                conexion.execute(text(f"DELETE FROM {tabla} WHERE {_FILTRO}"), parametros)
            _reconstruir_productos_vistos(conexion, empresa_id, local_id)
    return conteo


def ayer_en_lima() -> date:
    return hoy_en_lima() - timedelta(days=1)
