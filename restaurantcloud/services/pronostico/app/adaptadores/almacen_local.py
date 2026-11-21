"""AlmacenArtefactos sobre una carpeta (file://). La nube llega con la etapa 8 (gs://)."""

from pathlib import Path

from app.casos_de_uso.puertos import ErrorAlmacen


class AlmacenLocal:
    def __init__(self, raiz: Path):
        self._raiz = Path(raiz).resolve()

    def leer(self, ruta: str) -> bytes:
        destino = (self._raiz / ruta).resolve()
        # Una ruta con `..` o absoluta no puede salir de la raíz del repositorio.
        if not destino.is_relative_to(self._raiz):
            raise ErrorAlmacen(f"Ruta fuera del repositorio: {ruta!r}")
        try:
            return destino.read_bytes()
        except OSError as error:
            raise ErrorAlmacen(f"No se pudo leer {ruta!r}: {error.strerror or type(error).__name__}") from None

    def disponible(self) -> bool:
        try:
            return self._raiz.is_dir()
        except OSError:
            return False
