"""Formato de respuesta común a todos los servicios (doc-2u/servicios/README.md, sección 2)."""

import logging
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError, InterfaceError, OperationalError

from app.config import get_settings

logger = logging.getLogger(__name__)


class ErrorApi(Exception):
    """Error de negocio o de contrato que se responde con el formato de errores del sistema."""

    def __init__(self, status: int, codigo: str, mensaje: str, detalles: dict[str, Any] | None = None):
        super().__init__(mensaje)
        self.status = status
        self.codigo = codigo
        self.mensaje = mensaje
        self.detalles = detalles or {}


def _meta() -> dict[str, str]:
    zona = ZoneInfo(get_settings().zona_horaria)
    return {"timestamp": datetime.now(zona).isoformat(timespec="seconds")}


def respuesta_ok(datos: Any, status: int = 200) -> JSONResponse:
    return JSONResponse({"exito": True, "datos": datos, "meta": _meta()}, status_code=status)


def respuesta_error(status: int, codigo: str, mensaje: str, detalles: dict[str, Any] | None = None) -> JSONResponse:
    cuerpo = {
        "exito": False,
        "errores": [{"codigo": codigo, "mensaje": mensaje, "detalles": detalles or {}}],
        "meta": _meta(),
    }
    return JSONResponse(cuerpo, status_code=status)


def registrar_manejadores(app: FastAPI) -> None:
    @app.exception_handler(ErrorApi)
    async def _error_api(_: Request, exc: ErrorApi) -> JSONResponse:
        return respuesta_error(exc.status, exc.codigo, exc.mensaje, exc.detalles)

    @app.exception_handler(RequestValidationError)
    async def _validacion(_: Request, exc: RequestValidationError) -> JSONResponse:
        campos = [{"campo": ".".join(str(p) for p in e["loc"]), "motivo": e["msg"]} for e in exc.errors()]
        return respuesta_error(422, "ERR_VALIDACION", "Los datos enviados no son válidos.", {"campos": campos})

    @app.exception_handler(OperationalError)
    @app.exception_handler(InterfaceError)
    async def _bd_no_disponible(_: Request, exc: DBAPIError) -> JSONResponse:
        logger.error("Base de datos no disponible: %s", exc)
        return respuesta_error(503, "ERR_BD_NO_DISPONIBLE", "La base de datos no está disponible.")
