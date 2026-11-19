"""Conexión a la base propia del servicio."""

from collections.abc import Iterator
from contextlib import contextmanager
from functools import lru_cache

from sqlalchemy import Connection, Engine, create_engine

from app.config import get_settings


@lru_cache
def get_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True)


@contextmanager
def transaccion() -> Iterator[Connection]:
    """Una conexión con una sola transacción: confirma al salir sin error y deshace si hay una excepción.

    Se usa dentro del endpoint y no como dependencia con `yield`: así el commit ocurre antes de
    que se envíe la respuesta, y el emisor nunca recibe un 202 de un evento que no se guardó.
    """
    with get_engine().begin() as conexion:
        yield conexion
