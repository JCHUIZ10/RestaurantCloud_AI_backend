"""Conexión a la base propia del servicio."""

from functools import lru_cache

from sqlalchemy import Engine, create_engine, text

from app.config import get_settings


@lru_cache
def get_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True)


class SondaBdSql:
    """SondaBd: un `SELECT 1` con la conexión del servicio."""

    def __init__(self, engine: Engine):
        self._engine = engine

    def responde(self) -> bool:
        try:
            with self._engine.connect() as conexion:
                conexion.execute(text("SELECT 1"))
            return True
        except Exception:  # noqa: BLE001 - cualquier fallo de conexión significa "no responde"
            return False
