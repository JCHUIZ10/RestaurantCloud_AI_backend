"""AlmacenArtefactos sobre Google Cloud Storage (`gs://`)."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

from google.api_core.exceptions import GoogleAPIError, NotFound
from google.auth.exceptions import DefaultCredentialsError
from google.cloud import storage

from app.aplicacion.puertos import ErrorAlmacen, RutaInexistente

_UNIDAD_WINDOWS = re.compile(r"^[A-Za-z]:")


def parsear_uri_gcs(uri: str) -> tuple[str, str]:
    """Extrae `(bucket, prefijo)` de una URI `gs://bucket[/prefijo]`."""
    parsed = urlparse(uri)
    if parsed.scheme != "gs" or not parsed.netloc:
        raise ValueError(f"URI de Cloud Storage no válida: {uri!r}")
    return parsed.netloc, parsed.path.strip("/")


def _normalizar_ruta(ruta: str) -> str:
    if not ruta or "\\" in ruta or ruta.startswith("/") or _UNIDAD_WINDOWS.match(ruta):
        raise ErrorAlmacen(f"Ruta fuera del repositorio: {ruta!r}")
    partes = ruta.split("/")
    if any(parte in ("", ".", "..") for parte in partes):
        raise ErrorAlmacen(f"Ruta fuera del repositorio: {ruta!r}")
    return "/".join(partes)


class AlmacenGcs:
    """Lee artefactos desde un bucket de Google Cloud Storage."""

    def __init__(
        self,
        bucket: str,
        prefijo: str = "",
        *,
        anonimo: bool = False,
        timeout: float = 10.0,
        client: Any | None = None,
    ):
        if not bucket or "/" in bucket:
            raise ValueError(f"Nombre de bucket no válido: {bucket!r}")
        self._bucket = bucket
        self._prefijo = prefijo.strip("/")
        self._anonimo = anonimo
        self._timeout = timeout
        self._client = client

    def _obtener_cliente(self) -> Any:
        if self._client is None:
            try:
                self._client = (
                    storage.Client.create_anonymous_client()
                    if self._anonimo
                    else storage.Client()
                )
            except (DefaultCredentialsError, GoogleAPIError, OSError) as error:
                raise ErrorAlmacen(
                    f"No se pudo inicializar el cliente de Cloud Storage: {error}"
                ) from None
        return self._client

    def _clave(self, ruta: str) -> str:
        limpia = _normalizar_ruta(ruta)
        return f"{self._prefijo}/{limpia}" if self._prefijo else limpia

    def leer(self, ruta: str) -> bytes:
        clave = self._clave(ruta)
        try:
            cliente = self._obtener_cliente()
            blob = cliente.bucket(self._bucket).blob(clave)
            return blob.download_as_bytes(timeout=self._timeout)
        except NotFound:
            raise RutaInexistente(f"No existe {ruta!r}") from None
        except ErrorAlmacen:
            raise
        except (GoogleAPIError, DefaultCredentialsError, OSError, ValueError) as error:
            raise ErrorAlmacen(f"No se pudo leer {ruta!r}: {error}") from None

    def disponible(self) -> bool:
        try:
            cliente = self._obtener_cliente()
            blobs = cliente.list_blobs(
                self._bucket,
                prefix=self._prefijo or None,
                max_results=1,
                timeout=self._timeout,
            )
            next(iter(blobs), None)
            return True
        except Exception:  # noqa: BLE001 - /health nunca debe lanzar excepción
            return False
