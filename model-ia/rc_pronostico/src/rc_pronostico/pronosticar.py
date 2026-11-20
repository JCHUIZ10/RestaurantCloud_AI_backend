"""Único punto de entrada que usa el servicio: de historial, calendario y petición a pronóstico."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from .artefacto import Artefacto
from .baselines import baselines
from .contrato import validar_historial, validar_peticion
from .reglas import MIN_MISMO_DIA_P90, VENTANA_RECIENTE, decidir, garantias
from .variables import Serie, filas_prediccion


@dataclass
class Resultado:
    predicciones: pd.DataFrame
    modelo_version: str | None
    datos_desde: str
    datos_hasta: str
    huella_datos: str


def huella_historial(historial: pd.DataFrame) -> str:
    """SHA-256 del historial normalizado (ordenado por plato y día), para reproducir el cálculo."""
    h = historial.loc[:, ["producto_id", "fecha", "unidades"]].copy()
    h["fecha"] = pd.to_datetime(h["fecha"]).dt.strftime("%Y-%m-%d")
    h["producto_id"] = h["producto_id"].astype(str)
    h = h.sort_values(["producto_id", "fecha"], kind="stable")
    return hashlib.sha256(h.to_csv(index=False, lineterminator="\n").encode("utf-8")).hexdigest()


def pronosticar(
    historial: pd.DataFrame,
    calendario: dict[str, Any] | None,
    peticion: dict[str, Any],
    artefacto: Artefacto | None = None,
    hoy=None,
) -> Resultado:
    """Pronostica P50 y P90 por plato y día (CONTRATO 3 y 4).

    Sin `artefacto` (no hay modelo vigente, o no se pudo cargar) todos los platos van al baseline
    con motivo `modelo_no_disponible`. Siempre devuelve una fila por plato pedido y día.
    """
    h = validar_historial(historial, hoy=hoy)
    s = Serie(h, calendario)
    p = validar_peticion(peticion, s.datos_hasta)
    fechas = pd.date_range(p["fecha_inicio"], periods=p["horizonte_dias"], freq="D")
    codigos = artefacto.codigos if artefacto is not None else {}
    cerrados = set(s.cerrados)

    en_hist = [x for x in p["productos"] if x in s.productos]
    decision, col = {}, {}
    for x in en_hist:
        y = s.Y[:, s.productos.index(x)]
        col[x] = y
        decision[x] = decidir(int((~np.isnan(y)).sum()), int((~np.isnan(y[-VENTANA_RECIENTE:])).sum()), float(np.nansum(y)),
                              tiene_modelo=x in codigos, modelo_disponible=artefacto is not None)

    # Filas con variables y baselines de todos los platos con historial
    p50 = {}; p90 = {}
    if en_hist:
        filas = filas_prediccion(h, calendario, {**p, "productos": en_hist}, codigos)
        bl = baselines(h, calendario, filas)
        clave = list(zip(filas.producto_id, filas.fecha_objetivo))
        pos = {k: i for i, k in enumerate(clave)}
        usa_modelo = np.array([decision[x][0] == "modelo" and not c for x, c in zip(filas.producto_id, filas.cerrado)])
        m50 = np.full(len(filas), np.nan); m90 = np.full(len(filas), np.nan)
        if usa_modelo.any():
            X = filas.loc[usa_modelo, artefacto.ficha["variables"]]
            m50[usa_modelo] = artefacto.p50.predict(X)
            m90[usa_modelo] = artefacto.p90.predict(X)
        for x in en_hist:
            metodo, motivo = decision[x]
            abiertos = col[x][~np.isnan(col[x])]
            for f in fechas:
                i = pos[(x, f)]
                if metodo == "modelo":
                    a, b = m50[i], m90[i]
                elif motivo == "historial_minimo":
                    a, b = abiertos.mean(), abiertos.max()
                elif metodo == "baseline":
                    a = bl.ingenuo.iloc[i]
                    if np.isnan(a):   # el mismo día de la semana estuvo cerrado todo el tramo: nivel reciente
                        a = np.nanmean(col[x][-28:])
                    b = bl.p90_mismo_dia.iloc[i] if bl.n_mismo_dia.iloc[i] >= MIN_MISMO_DIA_P90 else a
                else:
                    a = b = 0.0
                p50[(x, f)], p90[(x, f)] = a, b

    filas_salida = []
    for x in p["productos"]:
        for f in fechas:
            if f in cerrados:
                filas_salida.append((x, f, 0.0, 0.0, "cerrado", None))
            elif x not in decision or decision[x][0] == "sin_historial":
                filas_salida.append((x, f, 0.0, 0.0, "sin_historial", None))
            else:
                metodo, motivo = decision[x]
                filas_salida.append((x, f, p50[(x, f)], p90[(x, f)], metodo, motivo))
    out = pd.DataFrame(filas_salida, columns=["producto_id", "fecha", "p50", "p90", "metodo", "motivo"])
    out["p50"], out["p90"] = garantias(out.p50, out.p90)
    return Resultado(out, artefacto.ficha["modelo_version"] if artefacto is not None else None,
                     str(s.fechas[0].date()), str(s.datos_hasta.date()), huella_historial(h))
