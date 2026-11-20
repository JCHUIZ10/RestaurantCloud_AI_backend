"""Reglas por plato (CONTRATO 4.1) y garantías numéricas (CONTRATO 4.2)."""

from __future__ import annotations

import numpy as np
import pandas as pd

DIAS_HISTORIAL_MODELO = 56   # el modelo solo incluye platos con >= 8 semanas de historial al entrenar (D-13)
VENTANA_RECIENTE = 56        # "días abiertos recientes" se mide en los últimos 56 días
MIN_ABIERTOS_RECIENTES = 28  # mínimo de días abiertos en esa ventana para usar el modelo
MIN_ABIERTOS_BASELINE = 7    # con menos, método `historial_minimo`
MIN_MISMO_DIA_P90 = 4        # con menos valores del mismo día, el P90 del baseline es el P50

MOTIVOS = ("historial_minimo", "modelo_no_disponible", "producto_no_visto", "historial_reciente_insuficiente")


def platos_entrenables(historial: pd.DataFrame, minimo: int = DIAS_HISTORIAL_MODELO) -> list:
    """Platos con al menos `minimo` días de historial y alguna venta (D-13)."""
    g = historial.groupby("producto_id")
    ok = (g.size() >= minimo) & (g["unidades"].sum() > 0)
    return sorted(ok.index[ok], key=str)


def decidir(abiertos: int, recientes: int, ventas: float, tiene_modelo: bool, modelo_disponible: bool) -> tuple[str, str | None]:
    """Método y motivo de un plato con historial, sin mirar el día pedido (el cierre se decide antes).

    `abiertos`: días abiertos con historial del plato; `recientes`: los de los últimos 56 días;
    `ventas`: unidades totales; `tiene_modelo`: el plato está en la tabla del artefacto.
    """
    if abiertos == 0 or ventas <= 0:
        return "sin_historial", None
    if abiertos < MIN_ABIERTOS_BASELINE:
        return "baseline", "historial_minimo"
    if not modelo_disponible:
        return "baseline", "modelo_no_disponible"
    if not tiene_modelo:
        return "baseline", "producto_no_visto"
    if recientes < MIN_ABIERTOS_RECIENTES:
        return "baseline", "historial_reciente_insuficiente"
    return "modelo", None


def garantias(p50, p90) -> tuple[np.ndarray, np.ndarray]:
    """Recorte a 0, `p90 >= p50` y redondeo a 2 decimales (CONTRATO 3 y 4.2)."""
    p50 = np.maximum(np.asarray(p50, dtype=float), 0.0)
    p90 = np.maximum(np.maximum(np.asarray(p90, dtype=float), 0.0), p50)
    return np.round(p50, 2), np.round(p90, 2)
