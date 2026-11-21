"""Forma JSON de una ejecución (la misma en el POST y en el GET)."""

from itertools import groupby
from zoneinfo import ZoneInfo

from app.aplicacion.tipos import EstadoModelo, ResultadoPronostico

METODOS = ("modelo", "baseline", "cerrado", "sin_historial")


def vista_ejecucion(resultado: ResultadoPronostico, zona_horaria: str) -> dict:
    e = resultado.ejecucion
    zona = ZoneInfo(zona_horaria)

    def instante(valor):
        return valor.astimezone(zona).isoformat(timespec="seconds") if valor else None

    resumen = {m: sum(1 for p in e.predicciones if p.metodo == m) for m in METODOS}
    por_plato = [
        {
            "producto_id": producto_id,
            "nombre": filas[0].nombre,
            "dias": [
                {"fecha": f.fecha.isoformat(), "p50": f.p50, "p90": f.p90, "metodo": f.metodo, "motivo": f.motivo}
                for f in filas
            ],
        }
        for producto_id, filas in ((k, list(g)) for k, g in groupby(e.predicciones, key=lambda p: p.producto_id))
    ]
    return {
        "ejecucion_id": e.id,
        "solicitud_id": e.solicitud_id,
        "local_id": e.local_id,
        "estado": e.estado,
        "error": e.error,
        "solicitada_por": e.solicitada_por,
        "creada_en": instante(e.creada_en),
        "fecha_inicio": e.fecha_inicio.isoformat(),
        "horizonte_dias": e.horizonte_dias,
        "modelo": None
        if e.modelo is None
        else {
            "modelo_version": e.modelo.modelo_version,
            "algoritmo": e.modelo.algoritmo,
            "entrenado_hasta": e.modelo.entrenado_hasta.isoformat(),
            "publicado_en": instante(e.modelo.publicado_en),
        },
        "datos": {
            "desde": e.datos_desde.isoformat() if e.datos_desde else None,
            "hasta": e.datos_hasta.isoformat() if e.datos_hasta else None,
            "huella": e.huella_datos,
            "actualizados_hasta": instante(e.datos_actualizados_hasta),
        },
        "historial": {"dias_con_ventas": e.dias_con_ventas},
        "resumen": resumen,
        "advertencias": resultado.advertencias,
        "predicciones": por_plato,
    }


def vista_modelo(estado: EstadoModelo, local_id: str, zona_horaria: str) -> dict:
    zona = ZoneInfo(zona_horaria)
    m = estado.modelo
    return {
        "local_id": local_id,
        "metodo": "baseline" if m is None else "modelo",
        "modelo": None
        if m is None
        else {
            "modelo_version": m.id,
            "algoritmo": m.algoritmo,
            "version_variables": m.version_variables,
            "datos_desde": m.datos_desde.isoformat(),
            "datos_hasta": m.datos_hasta.isoformat(),
            "metricas": m.metricas,
            "artefacto_sha256": m.artefacto_sha256,
            "publicado_en": m.publicado_en.astimezone(zona).isoformat(timespec="seconds"),
        },
        "revisado_en": estado.revisado_en.astimezone(zona).isoformat(timespec="seconds"),
        "ultimo_error": estado.ultimo_error,
    }
