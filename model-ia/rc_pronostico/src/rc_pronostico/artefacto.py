"""Guardar, publicar y cargar el artefacto del modelo (CONTRATO 5, D-16, D-22).

Formato skops con SHA-256 verificado ANTES de cargar y una lista fija de tipos de confianza.
Estructura del repositorio:

    modelos/{local_id}/{modelo_version}/modelo.skops, ficha.json   (inmutable)
    modelos/{local_id}/vigente.json                                (puntero)
"""

from __future__ import annotations

import hashlib
import json
import os
import platform
import re
import secrets
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from importlib import metadata
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

import numpy as np
import skops.io as sio

from .variables import LISTA_VARIABLES, VERSION_VARIABLES

# Tipos internos de scikit-learn que skops debe aceptar para un HistGradientBoosting cuantil (D-16).
# Lista fija: no se toma de lo que declare el archivo.
TIPOS_CONFIABLES = [
    "functools.partial",
    "sklearn._loss.link.IdentityLink",
    "sklearn._loss.link.Interval",
    "sklearn._loss.loss.PinballLoss",
    "sklearn.ensemble._hist_gradient_boosting.binning._BinMapper",
    "sklearn.ensemble._hist_gradient_boosting.predictor.TreePredictor",
    "sklearn.utils.validation.check_array",
]
_SEGURO = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


class ErrorArtefacto(Exception):
    """El artefacto no se puede publicar o no es seguro o compatible para cargar."""


@dataclass
class Artefacto:
    p50: Any
    p90: Any
    codigos: dict
    ficha: dict
    ruta: Path


def raiz_local(raiz: str | os.PathLike) -> Path:
    """Acepta una ruta local o `file://`. `gs://` queda para la etapa de la nube."""
    texto = str(raiz)
    if texto.startswith("gs://"):
        raise NotImplementedError("gs:// se habilita con la infraestructura de la nube (etapa 8, D-22)")
    if texto.startswith("file://"):
        ruta = unquote(urlparse(texto).path)
        if re.match(r"^/[A-Za-z]:", ruta):   # file:///C:/...
            ruta = ruta[1:]
        return Path(ruta)
    return Path(texto)


def sha256_archivo(ruta: str | os.PathLike) -> str:
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def uuid_v7(ahora_ms: int | None = None) -> str:
    """UUID versión 7: 48 bits de milisegundos, versión, variante y 74 bits aleatorios."""
    ms = int(time.time() * 1000) if ahora_ms is None else ahora_ms
    azar = secrets.randbits(74)
    rand_a, rand_b = azar >> 62, azar & ((1 << 62) - 1)
    valor = (ms & ((1 << 48) - 1)) << 80 | 0x7 << 76 | rand_a << 64 | 0b10 << 62 | rand_b
    h = f"{valor:032x}"
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"


def _seguro(nombre: str, que: str) -> str:
    if not _SEGURO.match(str(nombre)) or ".." in str(nombre):
        raise ErrorArtefacto(f"{que} no válido: {nombre!r}")
    return str(nombre)


def _versiones() -> dict[str, str]:
    return {"python": platform.python_version(), "scikit_learn": metadata.version("scikit-learn"),
            "numpy": np.__version__, "skops": metadata.version("skops")}


def _escribir_atomico(ruta: Path, datos: dict) -> None:
    tmp = ruta.with_name(ruta.name + ".tmp")
    tmp.write_text(json.dumps(datos, indent=1, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, ruta)   # el puntero cambia entero o no cambia


def publicar(raiz, local_id: str, p50, p90, codigos: dict, ficha: dict, aprobado: bool) -> dict[str, Any]:
    """Sube una versión nueva y, solo si `aprobado` (puerta D-17), mueve `vigente.json`.

    Una versión nunca se sobrescribe: si la carpeta existe, se rechaza. Un modelo que no pasa la
    puerta queda como candidato y el puntero no cambia.
    """
    local_id = _seguro(local_id, "local_id")
    version = _seguro(ficha.get("modelo_version", ""), "modelo_version")
    carpeta_local = raiz_local(raiz) / "modelos" / local_id
    carpeta = carpeta_local / version
    carpeta_local.mkdir(parents=True, exist_ok=True)
    try:
        carpeta.mkdir(exist_ok=False)
    except FileExistsError:
        raise ErrorArtefacto(f"La versión {version} ya existe y no se sobrescribe") from None

    archivo = carpeta / "modelo.skops"
    sio.dump({"p50": p50, "p90": p90, "codigos_producto": dict(codigos)}, archivo)
    sha = sha256_archivo(archivo)
    ficha_final = {**ficha, "local_id": local_id, "variables": list(LISTA_VARIABLES), "version_variables": VERSION_VARIABLES,
                   "versiones": _versiones(), "sha256_modelo": sha, "aprobado_puerta": bool(aprobado)}
    (carpeta / "ficha.json").write_text(json.dumps(ficha_final, indent=1, ensure_ascii=False), encoding="utf-8")

    estado = "candidato"
    if aprobado:   # lo último que se escribe
        _escribir_atomico(carpeta_local / "vigente.json", {
            "modelo_version": version, "sha256": sha, "publicado_en": datetime.now(timezone.utc).isoformat(timespec="seconds")})
        estado = "vigente"
    return {"modelo_version": version, "sha256": sha, "estado": estado, "ruta": str(carpeta)}


def cargar_version(raiz, local_id: str, version: str, sha_esperado: str | None = None) -> Artefacto:
    """Carga una versión concreta verificando huella, versión de scikit-learn y variables."""
    carpeta = raiz_local(raiz) / "modelos" / _seguro(local_id, "local_id") / _seguro(version, "modelo_version")
    try:
        ficha = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
        archivo = carpeta / "modelo.skops"
        real = sha256_archivo(archivo)
    except (OSError, ValueError) as e:
        raise ErrorArtefacto(f"No se puede leer la versión {version}: {e}") from None

    if real != ficha.get("sha256_modelo") or (sha_esperado is not None and real != sha_esperado):
        raise ErrorArtefacto("El SHA-256 del modelo no coincide con la ficha o el puntero")
    v = _versiones()
    if ficha.get("versiones", {}).get("scikit_learn") != v["scikit_learn"]:
        raise ErrorArtefacto(f"scikit-learn {v['scikit_learn']} no coincide con el del entrenamiento "
                             f"({ficha.get('versiones', {}).get('scikit_learn')})")
    if ficha.get("version_variables") != VERSION_VARIABLES or ficha.get("variables") != list(LISTA_VARIABLES):
        raise ErrorArtefacto("Las variables del modelo no coinciden con las de rc_pronostico instalado")
    try:
        contenido = sio.load(archivo, trusted=TIPOS_CONFIABLES)   # tras verificar la huella
    except Exception as e:
        raise ErrorArtefacto(f"skops rechazó el archivo: {type(e).__name__}") from None
    if set(contenido) != {"p50", "p90", "codigos_producto"}:
        raise ErrorArtefacto("El contenido del archivo no es el esperado")
    return Artefacto(contenido["p50"], contenido["p90"], contenido["codigos_producto"], ficha, carpeta)


def cargar(raiz, local_id: str) -> Artefacto:
    """Lee `vigente.json` y carga esa versión. Si algo falla, lanza `ErrorArtefacto` (el servicio usa el baseline)."""
    puntero = raiz_local(raiz) / "modelos" / _seguro(local_id, "local_id") / "vigente.json"
    try:
        vig = json.loads(puntero.read_text(encoding="utf-8"))
        return cargar_version(raiz, local_id, vig["modelo_version"], sha_esperado=vig["sha256"])
    except (OSError, ValueError, KeyError) as e:
        raise ErrorArtefacto(f"No hay modelo vigente legible para {local_id}: {e}") from None
