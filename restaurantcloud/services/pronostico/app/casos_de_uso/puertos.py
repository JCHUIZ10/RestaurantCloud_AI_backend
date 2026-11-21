"""Interfaces que los casos de uso necesitan del mundo exterior.

Hay un puerto solo donde existen dos implementaciones: la real y una de prueba, o la de hoy y la de
la nube. Los adaptadores que las cumplen viven en `app/adaptadores/`.
"""

from typing import Protocol


class ErrorAlmacen(Exception):
    """El almacén no pudo leer la ruta pedida (no existe, no es legible o está fuera de la raíz)."""


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
