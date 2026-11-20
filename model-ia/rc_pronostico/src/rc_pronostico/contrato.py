"""Validación de la entrada del modelo (CONTRATO, secciones 2.1 y 2.3)."""

from __future__ import annotations

from datetime import date
from typing import Any

import pandas as pd

COLUMNAS_HISTORIAL = ("producto_id", "fecha", "unidades")
HORIZONTE_MAX = 7
MAX_DIAS_INICIO = 2  # fecha_inicio - datos_hasta
MAX_DIAS_FIN = 8  # ultimo dia pronosticado - datos_hasta (D-03)


class ErrorContrato(ValueError):
    """La entrada no cumple el contrato."""


def validar_historial(historial: pd.DataFrame) -> pd.DataFrame:
    """Valida el historial y lo devuelve normalizado y ordenado.

    Reglas: columnas exactas, unidades enteras >= 0 sin nulos, sin duplicados,
    una fila por día y plato sin huecos desde su primera fila, y todos los platos
    terminan el mismo día (`datos_hasta`).
    """
    faltan = [c for c in COLUMNAS_HISTORIAL if c not in historial.columns]
    if faltan:
        raise ErrorContrato(f"Faltan columnas del historial: {faltan}")
    if historial.empty:
        raise ErrorContrato("El historial está vacío")

    h = historial.loc[:, list(COLUMNAS_HISTORIAL)].copy()
    if h.isna().any().any():
        raise ErrorContrato("El historial tiene valores nulos")

    try:
        h["fecha"] = pd.to_datetime(h["fecha"]).dt.normalize()
    except (ValueError, TypeError) as e:
        raise ErrorContrato(f"Fechas no válidas: {e}") from e
    if getattr(h["fecha"].dt, "tz", None) is not None:
        raise ErrorContrato("Las fechas deben ser días sin zona horaria")

    unidades = pd.to_numeric(h["unidades"], errors="coerce")
    if unidades.isna().any() or (unidades % 1 != 0).any():
        raise ErrorContrato("`unidades` debe ser entero")
    if (unidades < 0).any():
        raise ErrorContrato("`unidades` no puede ser negativa")
    h["unidades"] = unidades.astype("int64")

    if h.duplicated(["producto_id", "fecha"]).any():
        raise ErrorContrato("Hay más de una fila por plato y día")

    h = h.sort_values(["producto_id", "fecha"], kind="stable").reset_index(drop=True)

    g = h.groupby("producto_id")["fecha"]
    esperadas = (g.max() - g.min()).dt.days + 1
    if (g.size() != esperadas).any():
        malos = list(esperadas.index[g.size() != esperadas])
        raise ErrorContrato(f"Historial con huecos (no continuo) en: {malos}")
    if g.max().nunique() != 1:
        raise ErrorContrato("Los platos no terminan el mismo día (`datos_hasta`)")
    return h


def datos_hasta(historial: pd.DataFrame) -> pd.Timestamp:
    """Último día completo del historial."""
    return pd.Timestamp(historial["fecha"].max())


def validar_peticion(peticion: dict[str, Any], datos_hasta_: date | pd.Timestamp) -> dict[str, Any]:
    """Valida la petición (2.3) frente al último día con datos."""
    for campo in ("fecha_inicio", "horizonte_dias", "productos"):
        if campo not in peticion:
            raise ErrorContrato(f"Falta `{campo}` en la petición")

    horizonte = peticion["horizonte_dias"]
    if isinstance(horizonte, bool) or not isinstance(horizonte, int):
        raise ErrorContrato("`horizonte_dias` debe ser entero")
    if not 1 <= horizonte <= HORIZONTE_MAX:
        raise ErrorContrato(f"`horizonte_dias` debe estar entre 1 y {HORIZONTE_MAX}")

    productos = list(peticion["productos"])
    if not productos:
        raise ErrorContrato("`productos` está vacío")
    if len(set(productos)) != len(productos):
        raise ErrorContrato("`productos` tiene repetidos")

    inicio = pd.Timestamp(peticion["fecha_inicio"]).normalize()
    hasta = pd.Timestamp(datos_hasta_).normalize()
    dist_inicio = (inicio - hasta).days
    dist_fin = dist_inicio + horizonte - 1
    if dist_inicio < 1:
        raise ErrorContrato("`fecha_inicio` debe ser posterior a `datos_hasta`")
    if dist_inicio > MAX_DIAS_INICIO or dist_fin > MAX_DIAS_FIN:
        raise ErrorContrato(
            "Datos demasiado viejos para la petición: "
            f"inicio a {dist_inicio} d y fin a {dist_fin} d de `datos_hasta` "
            f"(máximos {MAX_DIAS_INICIO} y {MAX_DIAS_FIN})"
        )
    return {"fecha_inicio": inicio, "horizonte_dias": horizonte, "productos": productos}
