"""Variables del modelo (D-07). Único código que las calcula, en el entrenamiento y en el servicio.

Todas se calculan con datos hasta el día de corte `d` para el día objetivo `t = d + h`.
Un día cerrado es dato faltante (NaN), no 0 (D-05).
"""

from __future__ import annotations

import warnings
from typing import Any

import numpy as np
import pandas as pd
from numpy.lib.stride_tricks import sliding_window_view

from .calendario import dias_cerrados, marcas_feriado
from .contrato import validar_historial, validar_peticion

VERSION_VARIABLES = "1"
H_MAX = 8
DIAS_ARRANQUE = 35  # D-10: tramo de arranque, solo para rezagos, no es objetivo
N_MISMO_DIA = 8  # valores del mismo día de la semana que se consultan hacia atrás

LISTA_VARIABLES = [
    "dia_semana", "dia_mes", "mes", "es_feriado", "vispera_feriado", "pos_feriado",
    "h", "producto",
    "lag0", "lag1", "lag2", "lag3", "lag4", "lag5", "lag6",
    "media_7", "media_28", "desv_28",
    "ultimo_mismo_dia", "media_mismo_dia_4",
    "tendencia",
]
CATEGORICAS = ["producto"]


def _sin_avisos(f, *args, **kw):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        return f(*args, **kw)


class Serie:
    """Ventas por día (filas) y plato (columnas), con los días cerrados en NaN."""

    def __init__(self, historial: pd.DataFrame, calendario: dict[str, Any] | None):
        h = validar_historial(historial)
        self.cerrados = dias_cerrados(h, calendario)
        ancho = h.pivot(index="fecha", columns="producto_id", values="unidades").astype(float)
        ancho = ancho.reindex(pd.date_range(ancho.index.min(), ancho.index.max(), freq="D"))
        ancho.loc[ancho.index.intersection(self.cerrados)] = np.nan
        self.fechas: pd.DatetimeIndex = ancho.index
        self.productos: list = list(ancho.columns)
        self.Y: np.ndarray = ancho.to_numpy()
        self.datos_hasta: pd.Timestamp = self.fechas[-1]

    def posicion(self, fechas) -> np.ndarray:
        return self.fechas.get_indexer(pd.DatetimeIndex(fechas))


def mismos_dias(Y: np.ndarray, idx_d: np.ndarray, pidx: np.ndarray, h: np.ndarray) -> np.ndarray:
    """Los últimos 8 valores del mismo día de la semana que `t = d + h`, todos ≤ d.

    Columna j = y(t − 7·(⌈h/7⌉ + j)). Fuera del historial o cerrado: NaN.
    """
    k0 = -(-h // 7)
    pos = idx_d[:, None] + h[:, None] - 7 * (k0[:, None] + np.arange(N_MISMO_DIA)[None, :])
    vals = Y[np.clip(pos, 0, None), pidx[:, None]]
    return np.where(pos >= 0, vals, np.nan)


def primer_valor(m: np.ndarray) -> np.ndarray:
    """Primer valor no faltante de cada fila (el más reciente del mismo día)."""
    ok = ~np.isnan(m)
    primero = np.argmax(ok, axis=1)
    return np.where(ok.any(axis=1), m[np.arange(len(m)), primero], np.nan)


def _ventanas(Y: np.ndarray, w: int) -> np.ndarray:
    """(T, P, w): posición j = valor en d − j."""
    pad = np.vstack([np.full((w - 1, Y.shape[1]), np.nan), Y])
    return sliding_window_view(pad, w, axis=0)[..., ::-1]


def _variables(s: Serie, idx_d: np.ndarray, pidx: np.ndarray, h: np.ndarray) -> dict[str, np.ndarray]:
    w28 = _ventanas(s.Y, 28)[idx_d, pidx]  # (n, 28)
    w7 = w28[:, :7]
    media_7 = _sin_avisos(np.nanmean, w7, axis=1)
    media_28 = _sin_avisos(np.nanmean, w28, axis=1)
    n_validos = (~np.isnan(w28)).sum(axis=1)
    var = _sin_avisos(np.nansum, (w28 - media_28[:, None]) ** 2, axis=1) / np.maximum(n_validos - 1, 1)
    desv_28 = np.where(n_validos >= 2, np.sqrt(var), np.nan)
    md = mismos_dias(s.Y, idx_d, pidx, h)
    with np.errstate(divide="ignore", invalid="ignore"):
        tendencia = np.where(media_28 > 0, media_7 / media_28, np.nan)
    out = {f"lag{j}": w7[:, j] for j in range(7)}
    out.update(
        media_7=media_7, media_28=media_28, desv_28=desv_28,
        ultimo_mismo_dia=primer_valor(md),
        media_mismo_dia_4=_sin_avisos(np.nanmean, md[:, :4], axis=1),
        tendencia=tendencia,
    )
    return out


def _armar(s: Serie, idx_d, h, pidx, calendario, codigos) -> pd.DataFrame:
    fechas_t = s.fechas[0] + pd.to_timedelta(idx_d + h, unit="D")
    marcas = marcas_feriado(pd.DatetimeIndex(fechas_t), calendario).reset_index(drop=True)
    productos = np.array(s.productos, dtype=object)[pidx]
    df = pd.DataFrame(
        {
            "producto_id": productos,
            "fecha_corte": s.fechas[0] + pd.to_timedelta(idx_d, unit="D"),
            "fecha_objetivo": fechas_t,
            "dia_semana": fechas_t.day_of_week,
            "dia_mes": fechas_t.day,
            "mes": fechas_t.month,
            "h": h,
            "producto": [codigos.get(p, -1) for p in productos],
        }
    )
    df = pd.concat([df, marcas], axis=1)
    for nombre, valores in _variables(s, idx_d, pidx, h).items():
        df[nombre] = valores
    return df


def codigos_producto(historial: pd.DataFrame) -> dict:
    """Tabla `producto_id → código de categoría` (orden estable)."""
    return {p: i for i, p in enumerate(sorted(historial["producto_id"].unique(), key=str))}


def filas_entrenamiento(
    historial: pd.DataFrame,
    calendario: dict[str, Any] | None,
    corte,
    codigos: dict | None = None,
    dias_arranque: int = DIAS_ARRANQUE,
) -> pd.DataFrame:
    """Filas (corte d, h, plato) con su objetivo `y`, sin ninguna posterior a `corte`.

    Solo entran objetivos `t = d + h ≤ corte`. El historial posterior al corte se descarta
    antes de calcular nada, así que no puede influir. Quedan fuera los objetivos de días
    cerrados y del tramo de arranque.
    """
    corte = pd.Timestamp(corte).normalize()
    h_ = historial[pd.to_datetime(historial["fecha"]) <= corte]
    s = Serie(h_, calendario)
    codigos = codigos or codigos_producto(h_)
    T, P = s.Y.shape
    idx_d, h, pidx = (a.ravel() for a in np.meshgrid(np.arange(T), np.arange(1, H_MAX + 1), np.arange(P), indexing="ij"))
    t = idx_d + h
    ok = (t <= T - 1) & (t >= dias_arranque)
    idx_d, h, pidx, t = idx_d[ok], h[ok], pidx[ok], t[ok]
    y = s.Y[t, pidx]
    ok = ~np.isnan(y)
    idx_d, h, pidx, y = idx_d[ok], h[ok], pidx[ok], y[ok]
    df = _armar(s, idx_d, h, pidx, calendario, codigos)
    df["y"] = y
    assert df["fecha_objetivo"].max() <= corte
    return df.reset_index(drop=True)


def filas_prediccion(
    historial: pd.DataFrame,
    calendario: dict[str, Any] | None,
    peticion: dict[str, Any],
    codigos: dict,
) -> pd.DataFrame:
    """Filas para pronosticar: una por plato con historial y día pedido.

    El corte es `datos_hasta` (último día del historial). Incluye `cerrado` (el día objetivo
    es un día cerrado). Los platos sin historial no aparecen: los resuelve `reglas`.
    """
    s = Serie(historial, calendario)
    p = validar_peticion(peticion, s.datos_hasta)
    fechas = pd.date_range(p["fecha_inicio"], periods=p["horizonte_dias"], freq="D")
    h = (fechas - s.datos_hasta).days.to_numpy()
    pedidos = [x for x in p["productos"] if x in s.productos]
    pos_p = np.array([s.productos.index(x) for x in pedidos], dtype=int)
    idx_d = np.full(len(pos_p) * len(h), len(s.fechas) - 1)
    hh = np.tile(h, len(pos_p))
    pidx = np.repeat(pos_p, len(h))
    df = _armar(s, idx_d, hh, pidx, calendario, codigos)
    df["cerrado"] = df["fecha_objetivo"].isin(s.cerrados)
    return df
