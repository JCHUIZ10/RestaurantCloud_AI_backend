import numpy as np
import pandas as pd
import pytest

from rc_pronostico.baselines import baselines
from rc_pronostico.calendario import dias_cerrados, marcas_feriado
from rc_pronostico.variables import (
    LISTA_VARIABLES, codigos_producto, filas_entrenamiento, filas_prediccion,
)

INICIO = pd.Timestamp("2024-01-01")  # lunes
DIAS = 120


def historial(dias=DIAS, productos=("a", "b"), semilla=0):
    rng = np.random.default_rng(semilla)
    fechas = pd.date_range(INICIO, periods=dias)
    filas = []
    for k, p in enumerate(productos):
        for i, f in enumerate(fechas):
            filas.append((p, f, int(rng.poisson(10 + 5 * k + 4 * (f.day_of_week >= 5)))))
    return pd.DataFrame(filas, columns=["producto_id", "fecha", "unidades"])


CAL = {"dias_cerrados": ["2024-02-10"], "feriados": ["2024-02-14", "2024-03-20"]}


def con_cerrado(h):
    h = h.copy()
    h.loc[h.fecha == "2024-02-10", "unidades"] = 0
    return h


def serie(h, p):
    return h[h.producto_id == p].set_index("fecha")["unidades"].astype(float)


def test_sin_fuga_ignora_datos_posteriores_al_corte():
    h = con_cerrado(historial())
    corte = pd.Timestamp("2024-03-15")
    a = filas_entrenamiento(h, CAL, corte)
    h2 = h.copy()
    h2.loc[h2.fecha > corte, "unidades"] = 9999  # el futuro cambia de forma radical
    b = filas_entrenamiento(h2, CAL, corte)
    pd.testing.assert_frame_equal(a, b)
    assert a["fecha_objetivo"].max() <= corte


def test_ningun_objetivo_posterior_al_corte_ni_cerrado_ni_arranque():
    h = con_cerrado(historial())
    f = filas_entrenamiento(h, CAL, "2024-04-01", dias_arranque=35)
    assert f["fecha_objetivo"].max() <= pd.Timestamp("2024-04-01")
    assert f["fecha_objetivo"].min() >= INICIO + pd.Timedelta(days=35)
    assert (f["fecha_objetivo"] != "2024-02-10").all()
    assert (f["fecha_corte"] < f["fecha_objetivo"]).all()
    assert f["h"].between(1, 8).all()


def test_variables_contra_calculo_independiente():
    h = con_cerrado(historial())
    f = filas_entrenamiento(h, CAL, "2024-04-01")
    fila = f[(f.producto_id == "b") & (f.fecha_corte == "2024-03-10") & (f.h == 3)].iloc[0]
    s = serie(h, "b")
    s[pd.Timestamp("2024-02-10")] = np.nan
    d, t = pd.Timestamp("2024-03-10"), pd.Timestamp("2024-03-13")
    ult7 = s[d - pd.Timedelta(days=6): d]
    ult28 = s[d - pd.Timedelta(days=27): d]
    assert [fila[f"lag{j}"] for j in range(7)] == list(ult7.iloc[::-1])
    assert fila.media_7 == pytest.approx(ult7.mean())
    assert fila.media_28 == pytest.approx(ult28.mean())
    assert fila.desv_28 == pytest.approx(ult28.std(ddof=1))
    assert fila.tendencia == pytest.approx(ult7.mean() / ult28.mean())
    assert fila.ultimo_mismo_dia == s[t - pd.Timedelta(days=7)]
    assert fila.media_mismo_dia_4 == pytest.approx(
        np.mean([s[t - pd.Timedelta(days=7 * k)] for k in (1, 2, 3, 4)]))
    assert (fila.dia_semana, fila.dia_mes, fila.mes) == (t.day_of_week, 13, 3)
    assert fila.y == serie(h, "b")[t]


def test_h8_usa_el_mismo_dia_de_14_dias_antes():
    h = historial()
    f = filas_entrenamiento(h, None, "2024-04-01")
    fila = f[(f.producto_id == "a") & (f.fecha_corte == "2024-03-10") & (f.h == 8)].iloc[0]
    t = pd.Timestamp("2024-03-18")
    assert fila.ultimo_mismo_dia == serie(h, "a")[t - pd.Timedelta(days=14)]


def test_dia_cerrado_es_faltante_no_cero():
    h = con_cerrado(historial())
    f = filas_entrenamiento(h, CAL, "2024-04-01")
    # corte 2024-02-10 (cerrado): lag0 es NaN, no 0
    fila = f[(f.producto_id == "a") & (f.fecha_corte == "2024-02-10") & (f.h == 1)].iloc[0]
    assert np.isnan(fila.lag0)
    # el mismo día de la semana que cae en el cierre: se usa el último disponible
    t = pd.Timestamp("2024-02-17")  # sábado, 7 días después del cierre
    fila = f[(f.producto_id == "a") & (f.fecha_objetivo == t) & (f.h == 7)].iloc[0]
    assert fila.ultimo_mismo_dia == serie(h, "a")[pd.Timestamp("2024-02-03")]


def test_respaldo_cierre_cuando_no_hay_lista():
    h = con_cerrado(historial())
    assert list(dias_cerrados(h, None)) == [pd.Timestamp("2024-02-10")]
    assert list(dias_cerrados(h, {"feriados": []})) == [pd.Timestamp("2024-02-10")]
    assert len(dias_cerrados(h, {"dias_cerrados": []})) == 0  # lista vacía manda


def test_marcas_feriado():
    m = marcas_feriado(pd.DatetimeIndex(["2024-02-13", "2024-02-14", "2024-02-15"]), CAL)
    assert m.to_dict("list") == {
        "es_feriado": [0, 1, 0], "vispera_feriado": [1, 0, 0], "pos_feriado": [0, 0, 1]}


def test_baselines():
    h = historial()
    f = filas_entrenamiento(h, None, "2024-04-01")
    b = baselines(h, None, f)
    fila = f[(f.producto_id == "a") & (f.fecha_corte == "2024-03-10") & (f.h == 2)]
    r = b.loc[fila.index[0]]
    s = serie(h, "a")
    t = pd.Timestamp("2024-03-12")
    mismos = [s[t - pd.Timedelta(days=7 * k)] for k in range(1, 9)]
    assert r.ingenuo == mismos[0]
    assert r.media_mismo_dia == pytest.approx(np.mean(mismos[:4]))
    assert r.p90_mismo_dia == pytest.approx(np.percentile(mismos, 90))
    assert r.n_mismo_dia == 8
    assert (b.ingenuo == f.ultimo_mismo_dia).all()  # mismo cálculo que la variable


def test_filas_prediccion():
    h = historial()
    cod = codigos_producto(h)
    ult = h.fecha.max()
    pet = {"fecha_inicio": ult + pd.Timedelta(days=1), "horizonte_dias": 7, "productos": ["a", "b", "nuevo"]}
    f = filas_prediccion(h, CAL, pet, cod)
    assert len(f) == 14  # el plato sin historial no aparece
    assert set(f.h) == set(range(1, 8))
    assert (f.fecha_corte == ult).all()
    assert set(LISTA_VARIABLES) <= set(f.columns)
    assert not f["cerrado"].any()


def test_prediccion_igual_que_entrenamiento():
    """Las variables de una fila de predicción son las que el entrenamiento calcularía."""
    h = historial()
    cod = codigos_producto(h)
    corte = pd.Timestamp("2024-04-10")
    pet = {"fecha_inicio": corte + pd.Timedelta(days=1), "horizonte_dias": 7, "productos": ["a", "b"]}
    f_pred = filas_prediccion(h[h.fecha <= corte], CAL, pet, cod)
    largo = filas_entrenamiento(h, CAL, corte + pd.Timedelta(days=7), cod)
    largo = largo[largo.fecha_corte == corte]
    m = f_pred.merge(largo, on=["producto_id", "fecha_objetivo"], suffixes=("", "_e"))
    assert len(m) == 14
    for v in LISTA_VARIABLES:
        pd.testing.assert_series_equal(m[v].astype(float), m[f"{v}_e"].astype(float), check_names=False)
