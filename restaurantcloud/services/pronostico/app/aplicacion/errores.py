"""Errores de los casos de uso que no vienen de una regla del dominio. La capa `api` los traduce a HTTP."""

from app.dominio.errores import ErrorCasoDeUso


class ErrorAnaliticaNoDisponible(ErrorCasoDeUso):
    """ms-analítica no respondió o rechazó la petición."""


class ErrorSerieInvalida(ErrorCasoDeUso):
    """La serie recibida no cumple el contrato del historial (CONTRATO 2.1)."""


class ErrorNoEncontrado(ErrorCasoDeUso):
    """La ejecución no existe, o es de otro local o de otra empresa (no se distingue)."""
