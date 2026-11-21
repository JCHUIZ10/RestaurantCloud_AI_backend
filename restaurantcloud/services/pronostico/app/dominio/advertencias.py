"""Avisos que acompañan a un pronóstico sin cambiar su resultado."""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

# Si la última venta que ms-analítica recibió es más vieja que esto, puede estar sin recibir ventas.
TOLERANCIA_DATOS_DIAS = 3


def advertencias(actualizados_hasta: datetime | None, datos_hasta: date | None, zona: str) -> list[str]:
    """`datos_desactualizados` si ms-analítica no informa su última venta o esta es anterior a
    `datos_hasta − 3 días`. Los días sin ventas por una falla de entrega llegan en 0 y la regla de
    respaldo los toma como cierres: el aviso permite sospecharlo."""
    if datos_hasta is None:
        return []
    if actualizados_hasta is None:
        return ["datos_desactualizados"]
    ultimo_dia = actualizados_hasta.astimezone(ZoneInfo(zona)).date()
    if ultimo_dia < datos_hasta - timedelta(days=TOLERANCIA_DATOS_DIAS):
        return ["datos_desactualizados"]
    return []
