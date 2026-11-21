"""La ficha afirma que pedir 365 días de historial da el mismo pronóstico que pedir todo el historial.

Se comprueba con el modelo real publicado por model-ia (si está en esta máquina) y, siempre, con el baseline.
"""

import json
from datetime import date
from pathlib import Path

import pandas as pd
import pytest
from pandas.testing import assert_frame_equal
from rc_pronostico.artefacto import cargar
from rc_pronostico.pronosticar import pronosticar

from app.dominio.calendario import construir_calendario
from app.dominio.periodo import resolver_periodo
from tests.ayudas import serie_sintetica

REPOSITORIO = Path(__file__).resolve().parents[4] / "model-ia" / "repositorio"
LOCAL_AUREA = "00000000-0000-4000-8000-000000000010"
HOY = date(2026, 11, 20)
CIERRES = (date(2024, 12, 25), date(2025, 1, 1), date(2025, 12, 25), date(2026, 1, 1))
FUTURO = (date(2026, 11, 25),)


def _artefacto():
    if not (REPOSITORIO / "modelos" / LOCAL_AUREA / "vigente.json").exists():
        pytest.skip("No hay modelo publicado en model-ia/repositorio")
    return cargar(REPOSITORIO, LOCAL_AUREA)


def _historial(productos: dict[str, int], desde: date, hasta: date) -> pd.DataFrame:
    serie = serie_sintetica(productos, desde, hasta, CIERRES)
    filas = [(p.producto_id, fecha, u) for p in serie.productos for fecha, u in p.filas]
    return pd.DataFrame(filas, columns=["producto_id", "fecha", "unidades"])


def _pronosticar(productos, ventana_dias, artefacto):
    periodo = resolver_periodo(
        jornada_actual=HOY, fecha_inicio=None, horizonte_dias=7, dias_cerrados=FUTURO, hoy=HOY, ventana_dias=ventana_dias
    )
    historial = _historial(productos, periodo.datos_desde, periodo.datos_hasta)
    historial["fecha"] = pd.to_datetime(historial["fecha"])
    calendario = construir_calendario(historial, FUTURO, "PE", periodo)
    peticion = {"fecha_inicio": periodo.fecha_inicio, "horizonte_dias": 7, "productos": list(productos)}
    return pronosticar(historial, calendario, peticion, artefacto, hoy=HOY)


def test_365_dias_dan_el_mismo_pronostico_que_730_con_el_baseline():
    productos = {"a": 20, "b": 8, "c": 3}

    corto = _pronosticar(productos, 365, None)
    largo = _pronosticar(productos, 730, None)

    assert_frame_equal(corto.predicciones, largo.predicciones)


def test_365_dias_dan_el_mismo_pronostico_que_730_con_el_modelo_real():
    artefacto = _artefacto()
    # Los platos que el modelo conoce, con niveles de venta distintos.
    productos = {p: 5 + (i * 7) % 25 for i, p in enumerate(sorted(artefacto.codigos))}

    corto = _pronosticar(productos, 365, artefacto)
    largo = _pronosticar(productos, 730, artefacto)

    assert (corto.predicciones.metodo == "modelo").sum() > 0, "la prueba debe ejercitar el modelo, no solo el baseline"
    assert_frame_equal(corto.predicciones, largo.predicciones)
    assert corto.huella_datos != largo.huella_datos  # distinto historial, mismo pronóstico


def test_el_modelo_real_responde_con_las_garantias_numericas_del_contrato():
    artefacto = _artefacto()
    productos = {p: 5 + (i * 7) % 25 for i, p in enumerate(sorted(artefacto.codigos))}

    r = _pronosticar(productos, 365, artefacto).predicciones

    assert len(r) == len(productos) * 7
    assert (r.p50 >= 0).all() and (r.p90 >= r.p50).all()
    assert r.p50.round(2).equals(r.p50)
    assert set(r.metodo) == {"modelo", "cerrado"}
    assert (r[r.fecha == "2026-11-25"].metodo == "cerrado").all()
