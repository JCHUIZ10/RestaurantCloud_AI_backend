"""Interfaces que los casos de uso necesitan del mundo exterior.

Hay un puerto solo donde existen dos implementaciones: la real y una de prueba, o la de hoy y la de
la nube. Los adaptadores que las cumplen viven en `app/adaptadores/`.
"""

from datetime import date
from typing import Protocol

from app.casos_de_uso.tipos import EjecucionGuardada, ModeloEnUso, NuevaEjecucion, SerieVentas


class ErrorAlmacen(Exception):
    """El almacén no pudo leer la ruta pedida (no existe, no es legible o está fuera de la raíz)."""


class FuenteNoDisponible(Exception):
    """La fuente de la serie no respondió a tiempo, respondió un error o rechazó la firma."""


class RespuestaInvalida(Exception):
    """La fuente respondió, pero no con la forma pactada."""


class SolicitudYaCompletada(Exception):
    """Ya existe una ejecución completada con ese `solicitud_id` (un reintento concurrente ganó)."""


class AlmacenArtefactos(Protocol):
    """Repositorio de modelos (D-22): lee bytes de una ruta relativa a su raíz.

    Las rutas usan `/` y son relativas, por ejemplo `modelos/{local_id}/vigente.json`. Cambiar de
    proveedor (carpeta, Cloud Storage, otro) es escribir un adaptador de esta interfaz.
    """

    def leer(self, ruta: str) -> bytes:
        """Contenido de `ruta`. Lanza `ErrorAlmacen` si no se puede leer."""
        ...

    def disponible(self) -> bool:
        """Si la raíz del repositorio responde. No lanza."""
        ...


class SondaBd(Protocol):
    """Pregunta si la base propia responde."""

    def responde(self) -> bool:
        """No lanza: ante cualquier fallo devuelve False."""
        ...


class FuenteSeries(Protocol):
    """Serie de ventas diarias por producto de un local (hoy, `GET /interno/series/ventas-diarias`)."""

    def ventas_diarias(self, empresa_id: str, local_id: str, desde: date, hasta: date) -> SerieVentas:
        """Todos los productos del local entre `desde` y `hasta`, ambos incluidos.

        Lanza `FuenteNoDisponible` o `RespuestaInvalida`.
        """
        ...


class RegistroEjecuciones(Protocol):
    """Ejecuciones y predicciones guardadas. Solo se agrega: nunca se modifica lo ya guardado."""

    def guardar(self, ejecucion: NuevaEjecucion) -> None:
        """Guarda la ejecución y sus predicciones en una sola transacción.

        Lanza `SolicitudYaCompletada` si ya hay una completada con el mismo `solicitud_id`.
        """
        ...

    def buscar_completada(self, solicitud_id: str) -> EjecucionGuardada | None: ...

    def obtener(self, ejecucion_id: str, empresa_id: str, local_id: str) -> EjecucionGuardada | None:
        """La ejecución, solo si es de esa empresa y ese local."""
        ...


class Reloj(Protocol):
    def hoy(self) -> date:
        """El día de hoy en la zona horaria del servicio."""
        ...


class ModelosVigentes(Protocol):
    """Modelo que se usará para pronosticar un local."""

    def obtener(self, empresa_id: str, local_id: str) -> ModeloEnUso | None:
        """`None` si no hay un modelo vigente utilizable: se pronostica con el baseline. No lanza."""
        ...
