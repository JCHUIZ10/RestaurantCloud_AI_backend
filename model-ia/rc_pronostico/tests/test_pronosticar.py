import numpy as np
import pandas as pd
import pytest

from rc_pronostico.contrato import ErrorContrato
from rc_pronostico.pronosticar import huella_historial, pronosticar
from rc_pronostico.reglas import decidir, garantias, platos_entrenables

from conftest import CAL, INICIO, peticion


def con_plato(historial, producto, dias_con_venta, valor=5, desde_cola=True):
    """Agrega un plato que solo existe en los últimos `dias_con_venta` días del historial."""
    fechas = pd.date_range(historial.fecha.max() - pd.Timedelta(days=dias_con_venta - 1), periods=dias_con_venta)
    extra = pd.DataFrame({"producto_id": producto, "fecha": fechas, "unidades": valor})
    return pd.concat([historial, extra], ignore_index=True)


def fila(res, producto, dia):
    d = res.predicciones
    return d[(d.producto_id == producto) & (d.fecha == dia)].iloc[0]


def test_decidir_cubre_la_tabla_4_1():
    assert decidir(0, 0, 0, False, True) == ("sin_historial", None)
    assert decidir(100, 56, 0.0, True, True) == ("sin_historial", None)        # nunca vendió
    assert decidir(3, 3, 9, True, True) == ("baseline", "historial_minimo")
    assert decidir(6, 6, 9, True, True)[1] == "historial_minimo"
    assert decidir(7, 7, 9, True, False) == ("baseline", "modelo_no_disponible")
    assert decidir(40, 40, 99, False, True) == ("baseline", "producto_no_visto")
    assert decidir(100, 27, 99, True, True) == ("baseline", "historial_reciente_insuficiente")
    assert decidir(100, 28, 99, True, True) == ("modelo", None)


def test_garantias():
    a, b = garantias([-2.0, 5.123, 3.0], [-1.0, 4.0, 3.456])
    assert a.tolist() == [0.0, 5.12, 3.0]
    assert b.tolist() == [0.0, 5.12, 3.46]            # p90 >= p50 y a 2 decimales
    assert (b >= a).all() and (a >= 0).all()


def test_platos_entrenables(historial):
    h = con_plato(historial, "corto", 30)
    assert platos_entrenables(h) == ["a", "b"]
    assert platos_entrenables(con_plato(historial, "largo", 60)) == ["a", "b", "largo"]


def test_modelo_para_platos_conocidos(historial, artefacto):
    r = pronosticar(historial, CAL, peticion(historial, ["a", "b"]), artefacto)
    d = r.predicciones
    assert len(d) == 14 and (d.metodo == "modelo").all() and d.motivo.isna().all()
    assert (d.p90 >= d.p50).all() and (d.p50 >= 0).all()
    assert r.modelo_version == "v-test" and r.datos_hasta == str(historial.fecha.max().date())


def test_todos_los_platos_pedidos_aparecen_en_orden(historial, artefacto):
    pet = peticion(historial, ["b", "fantasma", "a"], horizonte=3)
    d = pronosticar(historial, CAL, pet, artefacto).predicciones
    assert list(d.producto_id.unique()) == ["b", "fantasma", "a"] and len(d) == 9
    assert (d[d.producto_id == "fantasma"].metodo == "sin_historial").all()
    assert (d[d.producto_id == "fantasma"][["p50", "p90"]] == 0).all().all()


def test_dia_cerrado_futuro_devuelve_cero(historial, artefacto):
    ultimo = historial.fecha.max()                       # 2024-05-29
    cal = {**CAL, "dias_cerrados": CAL["dias_cerrados"] + [str(ultimo + pd.Timedelta(days=2))]}
    d = pronosticar(historial, cal, peticion(historial, ["a"]), artefacto).predicciones
    cerrado = d[d.fecha == ultimo + pd.Timedelta(days=2)].iloc[0]
    assert cerrado.metodo == "cerrado" and cerrado.p50 == 0 and cerrado.p90 == 0 and cerrado.motivo is None
    assert (d[d.fecha != cerrado.fecha].metodo == "modelo").all()


def test_plato_nuevo_con_poco_historial_usa_baseline(historial, artefacto):
    h = con_plato(historial, "nuevo", 20)                # >= 7 días, pero el modelo no lo vio
    d = pronosticar(h, CAL, peticion(h, ["nuevo"]), artefacto).predicciones
    assert (d.metodo == "baseline").all() and (d.motivo == "producto_no_visto").all()
    assert (d.p50 == 5).all()                            # ingenuo estacional de un plato constante
    assert (d.p90 == d.p50).all()                        # menos de 4 mismos días disponibles... o constante


def test_historial_minimo_usa_promedio_y_maximo(historial, artefacto):
    h = con_plato(historial, "recien", 3, valor=4)
    h.loc[(h.producto_id == "recien") & (h.fecha == h.fecha.max()), "unidades"] = 9
    d = pronosticar(h, CAL, peticion(h, ["recien"]), artefacto).predicciones
    assert (d.metodo == "baseline").all() and (d.motivo == "historial_minimo").all()
    assert (d.p50 == round((4 + 4 + 9) / 3, 2)).all() and (d.p90 == 9).all()


def test_plato_sin_ventas_es_sin_historial(historial, artefacto):
    h = con_plato(historial, "muerto", 80, valor=0)
    d = pronosticar(h, CAL, peticion(h, ["muerto"]), artefacto).predicciones
    assert (d.metodo == "sin_historial").all() and (d.p50 == 0).all()


def test_pocos_dias_abiertos_recientes_va_al_baseline(historial, artefacto):
    ultimo = historial.fecha.max()
    cerrados = [str(ultimo - pd.Timedelta(days=i)) [:10] for i in range(0, 34)]    # 34 de los últimos 56 días cerrados
    cal = {"dias_cerrados": cerrados, "feriados": []}
    d = pronosticar(historial, cal, peticion(historial, ["a"]), artefacto).predicciones
    assert (d.motivo == "historial_reciente_insuficiente").all() and (d.metodo == "baseline").all()


def test_sin_artefacto_todo_va_al_baseline(historial):
    d = pronosticar(historial, CAL, peticion(historial, ["a", "b"]), None).predicciones
    assert (d.metodo == "baseline").all() and (d.motivo == "modelo_no_disponible").all()
    assert (d.p90 >= d.p50).all() and (d.p50 > 0).all()
    assert pronosticar(historial, CAL, peticion(historial, ["a"]), None).modelo_version is None


def test_baseline_con_p90_de_los_ultimos_8(historial):
    d = pronosticar(historial, CAL, peticion(historial, ["a"], horizonte=1), None).predicciones.iloc[0]
    t = historial.fecha.max() + pd.Timedelta(days=1)
    s = historial[historial.producto_id == "a"].set_index("fecha").unidades.astype(float)
    s[pd.Timestamp("2024-02-10")] = np.nan
    mismos = [s.get(t - pd.Timedelta(days=7 * k), np.nan) for k in range(1, 9)]
    assert d.p50 == mismos[0] and d.p90 == round(np.nanpercentile(mismos, 90), 2)


def test_garantias_con_un_modelo_que_cruza_cuantiles(historial, artefacto):
    class Cruzado:
        def __init__(self, v): self.v = v
        def predict(self, X): return np.full(len(X), self.v)
    artefacto.p50, artefacto.p90 = Cruzado(7.777), Cruzado(3.0)      # p90 < p50
    d = pronosticar(historial, CAL, peticion(historial, ["a"]), artefacto).predicciones
    assert (d.p90 == d.p50).all() and (d.p50 == 7.78).all()
    artefacto.p50, artefacto.p90 = Cruzado(-5.0), Cruzado(-1.0)      # negativos
    d = pronosticar(historial, CAL, peticion(historial, ["a"]), artefacto).predicciones
    assert (d.p50 == 0).all() and (d.p90 == 0).all()


def test_determinista(historial, artefacto):
    pet = peticion(historial, ["a", "b", "x"])
    a = pronosticar(historial, CAL, pet, artefacto)
    b = pronosticar(historial.sample(frac=1, random_state=1), CAL, pet, artefacto)   # otro orden de filas
    pd.testing.assert_frame_equal(a.predicciones, b.predicciones)
    assert a.huella_datos == b.huella_datos == huella_historial(historial)


def test_la_huella_cambia_con_los_datos(historial):
    h2 = historial.copy(); h2.loc[0, "unidades"] += 1
    assert huella_historial(h2) != huella_historial(historial)


def test_rechaza_entradas_fuera_de_contrato(historial, artefacto):
    with pytest.raises(ErrorContrato):
        pronosticar(historial, CAL, peticion(historial, ["a"], inicio_dias=5), artefacto)   # datos viejos
    with pytest.raises(ErrorContrato):
        pronosticar(historial, CAL, peticion(historial, ["a"]), artefacto, hoy=historial.fecha.max())  # incluye hoy
