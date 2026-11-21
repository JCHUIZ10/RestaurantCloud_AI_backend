"""Reloj sobre la hora del sistema, en la zona horaria del servicio."""

from datetime import date, datetime
from zoneinfo import ZoneInfo


class RelojSistema:
    def __init__(self, zona_horaria: str):
        self._zona = ZoneInfo(zona_horaria)

    def hoy(self) -> date:
        return datetime.now(self._zona).date()
