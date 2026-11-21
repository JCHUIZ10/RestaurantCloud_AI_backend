"""Qué modelo usa cada local: puntero, caché en memoria, verificación y respaldo (ficha, «Carga del modelo»).

No sabe de dónde vienen los bytes: los pide a un `AlmacenArtefactos`. La seguridad tampoco depende del
proveedor de almacenamiento, porque `rc_pronostico` verifica el SHA-256 de la copia antes de cargarla.
"""

import json
import logging
import re
import threading
import time
import uuid
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass, replace
from datetime import date, datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

from rc_pronostico.artefacto import Artefacto, ErrorArtefacto, cargar_version

from app.aplicacion.puertos import AlmacenArtefactos, ErrorAlmacen, RegistroModelos, RutaInexistente
from app.aplicacion.tipos import EstadoModelo, ModeloEnUso, ModeloRegistrado

logger = logging.getLogger(__name__)

_SHA256 = re.compile(r"[0-9a-f]{64}")


class ErrorModelo(Exception):
    """Un modelo publicado no se puede usar. El mensaje queda en `ultimo_error`."""


@dataclass
class _Entrada:
    uso: ModeloEnUso | None
    info: ModeloRegistrado | None
    sha: str | None
    revisado: float            # instante monotónico de la última revisión
    revisado_en: datetime
    ultimo_error: str | None


class ProveedorModelos:
    """Implementa `ModelosVigentes`."""

    def __init__(
        self,
        almacen: AlmacenArtefactos,
        registro: RegistroModelos,
        *,
        uri_repositorio: str,
        revisar_cada_segundos: float = 60,
        max_en_memoria: int = 50,
        monotonico: Callable[[], float] = time.monotonic,
        ahora: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
    ):
        self._almacen = almacen
        self._registro = registro
        self._uri = uri_repositorio.rstrip("/")
        self._cada = revisar_cada_segundos
        self._max = max_en_memoria
        self._monotonico = monotonico
        self._ahora = ahora
        self._cache: OrderedDict[str, _Entrada] = OrderedDict()
        self._candados: dict[str, threading.Lock] = {}
        self._candado_candados = threading.Lock()

    # --- Puerto ModelosVigentes ---

    def obtener(self, empresa_id: str, local_id: str) -> ModeloEnUso | None:
        return self._revisar(empresa_id, local_id, forzar=False).uso

    def estado(self, empresa_id: str, local_id: str) -> EstadoModelo:
        e = self._revisar(empresa_id, local_id, forzar=True)
        return EstadoModelo(e.info if e.uso else None, e.revisado_en, e.ultimo_error)

    @property
    def cargados(self) -> list[str]:
        """Locales con una entrada en memoria, del menos al más recientemente usado."""
        return list(self._cache)

    # --- Revisión ---

    def _candado(self, local_id: str) -> threading.Lock:
        with self._candado_candados:
            return self._candados.setdefault(local_id, threading.Lock())

    def _revisar(self, empresa_id: str, local_id: str, *, forzar: bool) -> _Entrada:
        # Un candado por local: dos peticiones simultáneas para un local sin cargar lo cargan una sola vez.
        with self._candado(local_id):
            previa = self._cache.get(local_id)
            t = self._monotonico()
            if previa is not None and not forzar and t - previa.revisado < self._cada:
                self._cache.move_to_end(local_id)
                return previa
            try:
                entrada = self._resolver(empresa_id, local_id, previa, t)
            except Exception:  # noqa: BLE001 - este puerto no lanza: ante lo inesperado se pronostica con el baseline
                logger.exception("Error inesperado al revisar el modelo del local %s", local_id)
                entrada = self._sin_modelo(previa, t, "Error inesperado al revisar el modelo.")
            self._cache[local_id] = entrada
            self._cache.move_to_end(local_id)
            while len(self._cache) > self._max:
                self._cache.popitem(last=False)
            return entrada

    def _resolver(self, empresa_id: str, local_id: str, previa: _Entrada | None, t: float) -> _Entrada:
        try:
            puntero = self._leer_puntero(local_id)
        except ErrorModelo as error:
            return self._respaldo(empresa_id, local_id, previa, t, str(error))
        if puntero is None:
            # El local no tiene modelo publicado: es lo normal en un local nuevo, no un error. Solo es
            # un problema si había uno y el puntero desapareció.
            hubo = previa is not None and previa.uso is not None
            return self._respaldo(empresa_id, local_id, previa, t, "El puntero vigente.json ya no existe." if hubo else None)

        version, sha = puntero["modelo_version"], puntero["sha256"]
        if previa is not None and previa.uso is not None and previa.info.id == version and previa.sha == sha:
            return replace(previa, revisado=t, revisado_en=self._ahora(), ultimo_error=None)

        try:
            artefacto = self._cargar(local_id, version, sha)
            info = self._registrar(empresa_id, local_id, version, sha, puntero["publicado_en"], artefacto)
        except (ErrorModelo, ErrorArtefacto, ErrorAlmacen) as error:
            return self._respaldo(empresa_id, local_id, previa, t, f"No se pudo cargar la versión {version}: {error}")
        except Exception:  # noqa: BLE001 - p. ej. la base no responde al registrar el modelo
            logger.exception("No se pudo registrar el modelo %s del local %s", version, local_id)
            return self._respaldo(empresa_id, local_id, previa, t, f"No se pudo registrar la versión {version}.")
        logger.info("Modelo %s cargado para el local %s", version, local_id)
        return _Entrada(ModeloEnUso(artefacto, info.id), info, sha, t, self._ahora(), None)

    def _respaldo(self, empresa_id: str, local_id: str, previa: _Entrada | None, t: float, error: str | None) -> _Entrada:
        """Qué hacer cuando no se puede usar lo que dice el puntero: seguir con el último modelo verificado
        o, si el proceso acaba de arrancar, con el vigente que tiene registrado; si no hay ninguno, el baseline.
        Nunca se usa un modelo sin verificar."""
        if error:
            logger.warning("Modelo del local %s: %s", local_id, error)
        if previa is not None and previa.uso is not None:
            return replace(previa, revisado=t, revisado_en=self._ahora(), ultimo_error=error)

        registrado = None
        try:
            registrado = self._registro.vigente(local_id)
        except Exception:  # noqa: BLE001
            logger.exception("No se pudo consultar el modelo registrado del local %s", local_id)
        if registrado is not None:
            try:
                # Las versiones del repositorio son inmutables: se carga la registrada con su propio SHA-256.
                artefacto = self._cargar(local_id, registrado.id, registrado.artefacto_sha256)
                return _Entrada(ModeloEnUso(artefacto, registrado.id), registrado, registrado.artefacto_sha256, t, self._ahora(), error)
            except (ErrorModelo, ErrorArtefacto, ErrorAlmacen) as fallo:
                error = f"{error + ' ' if error else ''}Tampoco se pudo cargar la versión registrada {registrado.id}: {fallo}"
        return _Entrada(None, None, None, t, self._ahora(), error)

    def _sin_modelo(self, previa: _Entrada | None, t: float, error: str) -> _Entrada:
        if previa is not None and previa.uso is not None:
            return replace(previa, revisado=t, revisado_en=self._ahora(), ultimo_error=error)
        return _Entrada(None, None, None, t, self._ahora(), error)

    # --- Lectura y verificación ---

    def _leer_puntero(self, local_id: str) -> dict | None:
        try:
            crudo = self._almacen.leer(f"modelos/{local_id}/vigente.json")
        except RutaInexistente:
            return None
        except ErrorAlmacen as error:
            raise ErrorModelo(f"No se pudo leer vigente.json: {error}") from None
        try:
            puntero = json.loads(crudo)
            version, sha, publicado = puntero["modelo_version"], puntero["sha256"], puntero["publicado_en"]
            uuid.UUID(version)
            datetime.fromisoformat(publicado)
            if not isinstance(sha, str) or not _SHA256.fullmatch(sha):
                raise ValueError("sha256 no es un SHA-256 en hexadecimal")
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            raise ErrorModelo(f"vigente.json no es válido ({type(error).__name__}: {error})") from None
        return {"modelo_version": version, "sha256": sha, "publicado_en": publicado}

    def _cargar(self, local_id: str, version: str, sha: str) -> Artefacto:
        """Copia la versión del almacén a una carpeta temporal y la carga con `rc_pronostico`, que verifica el
        SHA-256, la versión de scikit-learn y las variables antes de leer el modelo."""
        carpeta = f"modelos/{local_id}/{version}"
        modelo = self._almacen.leer(f"{carpeta}/modelo.skops")
        ficha = self._almacen.leer(f"{carpeta}/ficha.json")
        with TemporaryDirectory(prefix="modelo-") as raiz:
            destino = Path(raiz) / "modelos" / local_id / version
            destino.mkdir(parents=True)
            (destino / "modelo.skops").write_bytes(modelo)
            (destino / "ficha.json").write_bytes(ficha)
            artefacto = cargar_version(raiz, local_id, version, sha_esperado=sha)

        f = artefacto.ficha
        if f.get("aprobado_puerta") is not True:
            raise ErrorModelo("el modelo no pasó la puerta de calidad (D-17)")
        if f.get("local_id") != local_id:
            raise ErrorModelo(f"la ficha es del local {f.get('local_id')!r}, no de {local_id!r}")
        if f.get("modelo_version") != version:
            raise ErrorModelo(f"la ficha dice la versión {f.get('modelo_version')!r}, no {version!r}")
        return artefacto

    def _registrar(self, empresa_id, local_id, version, sha, publicado_en, artefacto: Artefacto) -> ModeloRegistrado:
        f = artefacto.ficha
        info = ModeloRegistrado(
            id=version,
            empresa_id=empresa_id,
            local_id=local_id,
            algoritmo=str(f["algoritmo"])[:80],
            version_variables=str(f["version_variables"]),
            datos_desde=date.fromisoformat(f["datos_desde"]),
            datos_hasta=date.fromisoformat(f["datos_hasta"]),
            metricas=f.get("metricas_validacion", {}),
            ficha=f,
            artefacto_uri=f"{self._uri}/modelos/{local_id}/{version}",
            artefacto_sha256=sha,
            publicado_en=datetime.fromisoformat(publicado_en),
        )
        self._registro.marcar_vigente(info)
        return info
