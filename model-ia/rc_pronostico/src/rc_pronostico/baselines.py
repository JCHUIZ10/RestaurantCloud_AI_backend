"""Baselines de comparación (D-09), calculados con el mismo código en experimento y servicio."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .variables import Serie, _sin_avisos, mismos_dias, primer_valor


def baselines(historial: pd.DataFrame, calendario: dict[str, Any] | None, filas: pd.DataFrame) -> pd.DataFrame:
    """Baselines para cada fila de `filas` (necesita `producto_id`, `fecha_corte`, `h`).

    - `ingenuo`: último valor del mismo día de la semana ≤ d, y(t − 7·⌈h/7⌉) (el más
      reciente disponible si ese día estuvo cerrado).
    - `media_mismo_dia`: media de los últimos 4 valores del mismo día de la semana.
    - `p90_mismo_dia`: percentil 90 de los últimos 8 (P90 del baseline).
    - `n_mismo_dia`: cuántos de esos 8 valores existen (con menos de 4, el P90 es el P50).

    Solo mira posiciones ≤ d; si se pasa un historial con datos posteriores, se ignoran.
    """
    corte_max = pd.to_datetime(filas["fecha_corte"]).max()
    s = Serie(historial[pd.to_datetime(historial["fecha"]) <= corte_max], calendario)
    idx_d = s.posicion(pd.to_datetime(filas["fecha_corte"]))
    pidx = np.array([s.productos.index(p) for p in filas["producto_id"]], dtype=int)
    h = filas["h"].to_numpy(dtype=int)
    md = mismos_dias(s.Y, idx_d, pidx, h)
    return pd.DataFrame(
        {
            "ingenuo": primer_valor(md),
            "media_mismo_dia": _sin_avisos(np.nanmean, md[:, :4], axis=1),
            "p90_mismo_dia": _sin_avisos(np.nanpercentile, md, 90, axis=1),
            "n_mismo_dia": (~np.isnan(md)).sum(axis=1),
        },
        index=filas.index,
    )
