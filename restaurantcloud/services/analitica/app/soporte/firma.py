"""Firma de las peticiones servidor a servidor (doc-2u/servicios/README.md, sección 2).

`X-Firma` es el HMAC-SHA256 en hexadecimal de `"{X-Timestamp}.{contenido}"` con el secreto del servicio.
El contenido son los bytes exactos del cuerpo (POST) o la cadena de consulta tal como llegó (GET, que
no tiene cuerpo); así los parámetros de una consulta tampoco se pueden alterar sin invalidar la firma.
"""

import hashlib
import hmac
import time

from fastapi import Request

from app.config import get_settings
from app.soporte.respuestas import ErrorApi


def calcular_firma(timestamp: str, contenido: bytes, secreto: str) -> str:
    mensaje = timestamp.encode() + b"." + contenido
    return hmac.new(secreto.encode(), mensaje, hashlib.sha256).hexdigest()


def _firma_invalida(motivo: str) -> ErrorApi:
    return ErrorApi(401, "ERR_FIRMA_INVALIDA", motivo)


async def verificar_firma(request: Request) -> bytes:
    """Dependencia de FastAPI: valida la firma y devuelve el contenido firmado."""
    settings = get_settings()
    timestamp = request.headers.get("X-Timestamp")
    firma = request.headers.get("X-Firma")
    if not timestamp or not firma:
        raise _firma_invalida("Falta la firma de la petición.")

    try:
        antiguedad = abs(time.time() - int(timestamp))
    except ValueError:
        raise _firma_invalida("El timestamp no es válido.") from None
    if antiguedad > settings.firma_tolerancia_segundos:
        raise _firma_invalida("El timestamp está fuera del tiempo permitido.")

    if request.method == "GET":
        contenido = request.scope.get("query_string", b"")
    else:
        contenido = await request.body()

    esperada = calcular_firma(timestamp, contenido, settings.secreto_interno)
    if not hmac.compare_digest(esperada, firma.lower()):
        raise _firma_invalida("La firma no coincide.")
    return contenido
