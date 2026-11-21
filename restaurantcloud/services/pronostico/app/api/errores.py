"""Traducción de los errores de los casos de uso al formato de error HTTP del sistema."""

from app.dominio.errores import (
    ErrorAnaliticaNoDisponible,
    ErrorCasoDeUso,
    ErrorFechasInvalidas,
    ErrorNoEncontrado,
    ErrorSerieInvalida,
    ErrorValidacion,
)
from app.soporte.respuestas import ErrorApi

_TRADUCCION: dict[type[ErrorCasoDeUso], tuple[int, str]] = {
    ErrorValidacion: (422, "ERR_VALIDACION"),
    ErrorFechasInvalidas: (422, "ERR_FECHAS_INVALIDAS"),
    ErrorSerieInvalida: (502, "ERR_SERIE_INVALIDA"),
    ErrorAnaliticaNoDisponible: (503, "ERR_ANALITICA_NO_DISPONIBLE"),
    ErrorNoEncontrado: (404, "ERR_NO_ENCONTRADO"),
}


def traducir(error: ErrorCasoDeUso) -> ErrorApi:
    status, codigo = _TRADUCCION.get(type(error), (500, "ERR_INTERNO"))
    detalles = dict(error.detalles)
    if error.ejecucion_id:
        detalles["ejecucion_id"] = error.ejecucion_id
    return ErrorApi(status, codigo, error.mensaje, detalles)
