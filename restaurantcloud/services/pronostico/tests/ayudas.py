"""Construcción de peticiones firmadas, con el mismo formato que envía el núcleo."""

import time

from app.soporte.firma import calcular_firma
from tests.conftest import SECRETO


def cabeceras_firmadas(contenido: bytes, secreto: str = SECRETO, timestamp: int | None = None) -> dict[str, str]:
    marca = str(int(time.time()) if timestamp is None else timestamp)
    return {"X-Timestamp": marca, "X-Firma": calcular_firma(marca, contenido, secreto)}
