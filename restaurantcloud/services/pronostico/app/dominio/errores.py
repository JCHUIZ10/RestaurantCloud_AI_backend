"""Errores de las reglas del dominio y base de todos los errores de negocio. La capa `api` los traduce a HTTP."""

from typing import Any


class ErrorCasoDeUso(Exception):
    """Base de los errores que un caso de uso comunica a quien lo llama."""

    def __init__(self, mensaje: str, detalles: dict[str, Any] | None = None, ejecucion_id: str | None = None):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.detalles = detalles or {}
        # Si el fallo quedó guardado como ejecución fallida, su id sirve para rastrearlo.
        self.ejecucion_id = ejecucion_id


class ErrorValidacion(ErrorCasoDeUso):
    """Datos de la solicitud que no pasan la validación. `campos` lista cada campo y su motivo."""

    def __init__(self, campos: list[dict[str, str]], mensaje: str = "Los datos enviados no son válidos."):
        super().__init__(mensaje, {"campos": campos})


class ErrorFechasInvalidas(ErrorCasoDeUso):
    """`jornada_actual` o `fecha_inicio` fuera de lo permitido."""
