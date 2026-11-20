import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import HistGradientBoostingRegressor

from rc_pronostico.artefacto import Artefacto
from rc_pronostico.variables import CATEGORICAS, LISTA_VARIABLES, codigos_producto, filas_entrenamiento

INICIO = pd.Timestamp("2024-01-01")  # lunes
DIAS = 150
CAL = {"dias_cerrados": ["2024-02-10", "2024-05-20"], "feriados": ["2024-02-14", "2024-05-01"]}


def serie_sintetica(dias=DIAS, productos=("a", "b"), semilla=0):
    rng = np.random.default_rng(semilla)
    fechas = pd.date_range(INICIO, periods=dias)
    filas = []
    for k, p in enumerate(productos):
        for f in fechas:
            filas.append((p, f, int(rng.poisson(10 + 5 * k + 4 * (f.day_of_week >= 5)))))
    h = pd.DataFrame(filas, columns=["producto_id", "fecha", "unidades"])
    h.loc[h.fecha == "2024-02-10", "unidades"] = 0
    return h


def entrenar_pequeno(historial, calendario=CAL):
    """Un modelo diminuto pero real, para probar el flujo completo sin depender del experimento."""
    cod = codigos_producto(historial)
    f = filas_entrenamiento(historial, calendario, historial.fecha.max(), cod)
    def reg(q):
        return HistGradientBoostingRegressor(loss="quantile", quantile=q, max_iter=30, categorical_features=CATEGORICAS,
                                             early_stopping=False, random_state=2026).fit(f[LISTA_VARIABLES], f.y)
    return reg(0.5), reg(0.9), cod


@pytest.fixture(scope="session")
def historial():
    return serie_sintetica()


@pytest.fixture(scope="session")
def modelos(historial):
    return entrenar_pequeno(historial)


@pytest.fixture
def artefacto(modelos, tmp_path):
    p50, p90, cod = modelos
    return Artefacto(p50, p90, cod, {"modelo_version": "v-test", "variables": list(LISTA_VARIABLES)}, tmp_path)


def peticion(historial, productos, inicio_dias=1, horizonte=7):
    ultimo = historial.fecha.max()
    return {"fecha_inicio": ultimo + pd.Timedelta(days=inicio_dias), "horizonte_dias": horizonte, "productos": list(productos)}
