"""Cierres y feriados con que se calcula un pronóstico (D-05, D-23, ficha sección 3)."""

import holidays
import pandas as pd
from rc_pronostico.calendario import dias_cerrados

from app.dominio.periodo import UN_DIA, Periodo


def construir_calendario(
    historial: pd.DataFrame, cierres_futuros, pais_feriados: str, periodo: Periodo
) -> dict[str, list[str]]:
    """`dias_cerrados` y `feriados` listos para `rc_pronostico`.

    - Cierres = los del historial, detectados con la regla de respaldo de D-05 (el local entero vendió 0),
      **unidos** a los futuros que envía el núcleo. Hay que entregar la unión: cuando `rc_pronostico`
      recibe una lista de cierres, ya no aplica la regla de respaldo.
    - Feriados = los del país con la librería `holidays`, la misma del entrenamiento, limitados al rango
      que importa (historial y periodo, con un día de margen por las marcas de víspera y posterior).
    """
    detectados = {d.date() for d in dias_cerrados(historial, None)}
    cerrados = sorted(detectados | set(cierres_futuros))

    anios = range(periodo.datos_desde.year, periodo.fecha_fin.year + 1)
    desde, hasta = periodo.datos_desde - UN_DIA, periodo.fecha_fin + UN_DIA
    feriados = sorted(d for d in holidays.country_holidays(pais_feriados, years=anios) if desde <= d <= hasta)

    return {"dias_cerrados": [d.isoformat() for d in cerrados], "feriados": [d.isoformat() for d in feriados]}
