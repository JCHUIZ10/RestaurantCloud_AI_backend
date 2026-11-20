"""Calendario del local: días cerrados y feriados (CONTRATO 2.2, D-05)."""

from __future__ import annotations

from typing import Any, Iterable

import pandas as pd


def _fechas(valores: Iterable[Any] | None) -> pd.DatetimeIndex:
    if valores is None:
        return pd.DatetimeIndex([])
    return pd.DatetimeIndex(pd.to_datetime(list(valores))).normalize()


def feriados(calendario: dict[str, Any] | None) -> pd.DatetimeIndex:
    """Feriados declarados (vacío si no llegan)."""
    return _fechas((calendario or {}).get("feriados"))


def dias_cerrados(historial: pd.DataFrame, calendario: dict[str, Any] | None) -> pd.DatetimeIndex:
    """Días en que el local no abrió.

    Si el calendario trae `dias_cerrados` se usa esa lista. Si no llega (`None` o sin la
    clave), se aplica la regla de respaldo de D-05: cerrado el día en que el local entero
    vendió 0.
    """
    declarados = (calendario or {}).get("dias_cerrados")
    if declarados is not None:
        return _fechas(declarados).unique().sort_values()
    total = historial.groupby("fecha")["unidades"].sum()
    return pd.DatetimeIndex(total.index[total == 0]).sort_values()


def marcas_feriado(fechas: pd.DatetimeIndex, calendario: dict[str, Any] | None) -> pd.DataFrame:
    """`es_feriado`, `vispera_feriado` y `pos_feriado` (0/1) para cada fecha."""
    fer = set(feriados(calendario))
    un_dia = pd.Timedelta(days=1)
    return pd.DataFrame(
        {
            "es_feriado": [int(f in fer) for f in fechas],
            "vispera_feriado": [int((f + un_dia) in fer) for f in fechas],
            "pos_feriado": [int((f - un_dia) in fer) for f in fechas],
        },
        index=fechas,
    )
