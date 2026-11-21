"""El caso de uso completo con la base real y una fuente de series falsa."""

import uuid
from datetime import date, datetime, timezone
from types import SimpleNamespace

import numpy as np
import pytest
from sqlalchemy import text

from app.adaptadores.bd.conexion import get_engine
from app.casos_de_uso.consultar_ejecucion import consultar_ejecucion
from app.casos_de_uso.generar_pronostico import generar_pronostico
from app.casos_de_uso.tipos import ModeloEnUso, ProductoPedido, SolicitudPronostico
from app.dominio.errores import (
    ErrorAnaliticaNoDisponible,
    ErrorFechasInvalidas,
    ErrorNoEncontrado,
    ErrorSerieInvalida,
    ErrorValidacion,
)
from rc_pronostico.variables import LISTA_VARIABLES
from tests.ayudas import (
    EMPRESA, HOY, LOCAL, OTRO_LOCAL, PARAMETROS, PRODUCTO_A, PRODUCTO_B, PRODUCTO_C, USUARIO, RelojFijo, SeriesFalsas,
    contenedor_de_prueba, id_nuevo, serie_sintetica, series_caidas, series_con_formato_roto, series_normales,
)

PEDIDOS = (
    ProductoPedido(PRODUCTO_A, "Ceviche Clásico"),
    ProductoPedido(PRODUCTO_B, "Lomo Saltado Criollo"),
    ProductoPedido(PRODUCTO_C, "Plato nuevo sin ventas"),
)


def solicitud(**cambios) -> SolicitudPronostico:
    datos = dict(
        solicitud_id=id_nuevo(), empresa_id=EMPRESA, local_id=LOCAL, solicitada_por=USUARIO, jornada_actual=HOY,
        fecha_inicio=None, horizonte_dias=7, productos=PEDIDOS, dias_cerrados=(date(2026, 11, 25),),
    )
    datos.update(cambios)
    return SolicitudPronostico(**datos)


@pytest.fixture
def ejecutar(tmp_path):
    def _ejecutar(s: SolicitudPronostico, **kw):
        c = contenedor_de_prueba(get_engine(), tmp_path, **kw)
        return generar_pronostico(s, series=c.series, registro=c.registro, modelos=c.modelos, reloj=c.reloj, parametros=PARAMETROS)

    return _ejecutar


def _filas(bd, sql, **p):
    return bd.execute(text(sql), p).mappings().all()


def test_pronostico_con_baseline_de_punta_a_punta(ejecutar, bd):
    resultado = ejecutar(solicitud())

    e = resultado.ejecucion
    assert resultado.nueva is True and e.estado == "completada"
    assert e.modelo is None  # sin modelo vigente: todo es baseline
    assert (e.fecha_inicio, e.horizonte_dias) == (date(2026, 11, 21), 7)
    assert (e.datos_desde, e.datos_hasta) == (date(2025, 11, 20), date(2026, 11, 19))
    assert len(e.huella_datos) == 64
    assert len(e.predicciones) == 3 * 7

    por_plato = {}
    for p in e.predicciones:
        por_plato.setdefault(p.producto_id, []).append(p)
    # A y B se pronostican con el baseline, y dicen por qué: no hay modelo.
    for plato in (PRODUCTO_A, PRODUCTO_B):
        dias = {p.fecha: p for p in por_plato[plato]}
        assert dias[date(2026, 11, 21)].metodo == "baseline" and dias[date(2026, 11, 21)].motivo == "modelo_no_disponible"
        assert dias[date(2026, 11, 21)].p50 > 0 and dias[date(2026, 11, 21)].p90 >= dias[date(2026, 11, 21)].p50
        # El cierre que envió el núcleo se respeta y no lleva motivo.
        assert (dias[date(2026, 11, 25)].p50, dias[date(2026, 11, 25)].p90) == (0, 0)
        assert dias[date(2026, 11, 25)].metodo == "cerrado" and dias[date(2026, 11, 25)].motivo is None
    # C no tiene ventas: sin_historial, salvo el día cerrado.
    c = {p.fecha: p for p in por_plato[PRODUCTO_C]}
    assert c[date(2026, 11, 22)].metodo == "sin_historial" and c[date(2026, 11, 22)].p50 == 0
    assert c[date(2026, 11, 25)].metodo == "cerrado"

    # Quedó guardado exactamente eso.
    ejecucion = _filas(bd, "SELECT * FROM ejecucion")[0]
    assert ejecucion["estado"] == "completada" and ejecucion["modelo_version_id"] is None
    assert ejecucion["jornada_actual"] == HOY and ejecucion["version_rc_pronostico"] == "0.1.0"
    assert ejecucion["duracion_ms"] >= 0
    assert _filas(bd, "SELECT count(*) AS n FROM prediccion")[0]["n"] == 21


def test_el_calendario_guardado_es_la_union_de_cierres_y_los_feriados_usados(ejecutar, bd):
    ejecutar(solicitud())

    calendario = _filas(bd, "SELECT calendario FROM ejecucion")[0]["calendario"]
    # El 25/12/2025 lo detecta la regla de respaldo (todo el local vendió 0); el 25/11/2026 lo envió el núcleo.
    assert calendario["dias_cerrados"] == ["2025-12-25", "2026-11-25"]
    assert "2025-12-25" in calendario["feriados"] and "2026-07-28" in calendario["feriados"]


def test_pide_a_ms_analitica_la_ventana_completa_sin_filtrar_productos(ejecutar):
    series = series_normales()

    ejecutar(solicitud(), series=series)

    assert series.llamadas == [(EMPRESA, LOCAL, date(2025, 11, 20), date(2026, 11, 19))]


def test_un_reintento_con_el_mismo_solicitud_id_devuelve_la_misma_ejecucion_sin_recalcular(ejecutar, bd):
    series = series_normales()
    s = solicitud()

    primera = ejecutar(s, series=series)
    segunda = ejecutar(s, series=series)

    assert primera.nueva is True and segunda.nueva is False
    assert segunda.ejecucion.id == primera.ejecucion.id
    assert len(series.llamadas) == 1  # no volvió a pedir la serie
    assert _filas(bd, "SELECT count(*) AS n FROM ejecucion")[0]["n"] == 1


def test_el_mismo_solicitud_id_de_otro_local_no_devuelve_su_ejecucion(ejecutar):
    s = solicitud()
    ejecutar(s)

    with pytest.raises(ErrorValidacion):
        ejecutar(solicitud(solicitud_id=s.solicitud_id, local_id=OTRO_LOCAL))


def test_dos_pronosticos_con_distinto_solicitud_id_son_dos_ejecuciones(ejecutar, bd):
    ejecutar(solicitud())
    ejecutar(solicitud())

    assert _filas(bd, "SELECT count(*) AS n FROM ejecucion")[0]["n"] == 2


def test_si_ms_analitica_cae_se_guarda_la_ejecucion_fallida_y_se_informa(ejecutar, bd):
    with pytest.raises(ErrorAnaliticaNoDisponible) as error:
        ejecutar(solicitud(), series=series_caidas())

    fallida = _filas(bd, "SELECT * FROM ejecucion")[0]
    assert fallida["estado"] == "fallida" and fallida["error"] == "ERR_ANALITICA_NO_DISPONIBLE"
    assert str(fallida["id"]) == error.value.ejecucion_id  # el error lleva el id para rastrearlo
    assert fallida["datos_desde"] is None and fallida["huella_datos"] is None
    assert _filas(bd, "SELECT count(*) AS n FROM prediccion")[0]["n"] == 0


def test_una_solicitud_fallida_se_puede_reintentar_y_completar(ejecutar, bd):
    s = solicitud()
    with pytest.raises(ErrorAnaliticaNoDisponible):
        ejecutar(s, series=series_caidas())

    resultado = ejecutar(s)  # ms-analítica volvió

    assert resultado.nueva is True and resultado.ejecucion.estado == "completada"
    assert [f["estado"] for f in _filas(bd, "SELECT estado FROM ejecucion ORDER BY id")] == ["fallida", "completada"]


def test_una_respuesta_con_formato_roto_se_guarda_como_serie_invalida(ejecutar, bd):
    with pytest.raises(ErrorSerieInvalida):
        ejecutar(solicitud(), series=series_con_formato_roto())

    assert _filas(bd, "SELECT error FROM ejecucion")[0]["error"] == "ERR_SERIE_INVALIDA"


def test_una_serie_con_un_hueco_se_rechaza_como_invalida(ejecutar, bd):
    def con_hueco(desde, hasta):
        serie = serie_sintetica({PRODUCTO_A: 20}, desde, hasta)
        del serie.productos[0].filas[100]
        return serie

    with pytest.raises(ErrorSerieInvalida, match="huecos"):
        ejecutar(solicitud(), series=SeriesFalsas(con_hueco))

    assert _filas(bd, "SELECT estado, error FROM ejecucion")[0]["error"] == "ERR_SERIE_INVALIDA"


def test_una_serie_que_no_termina_ayer_se_rechaza(ejecutar):
    # ms-analítica devolvió datos hasta antier: pronosticar con eso daría un corte equivocado.
    series = SeriesFalsas(lambda d, h: serie_sintetica({PRODUCTO_A: 20}, d, date(2026, 11, 18)))

    with pytest.raises(ErrorSerieInvalida):
        ejecutar(solicitud(), series=series)


def test_una_serie_que_incluye_la_jornada_en_curso_se_rechaza(ejecutar):
    series = SeriesFalsas(lambda d, h: serie_sintetica({PRODUCTO_A: 20}, d, HOY))

    with pytest.raises(ErrorSerieInvalida):
        ejecutar(solicitud(), series=series)


def test_un_local_sin_ventas_en_la_ventana_no_llama_al_modelo_y_todo_es_sin_historial(ejecutar, bd):
    resultado = ejecutar(solicitud(dias_cerrados=()), series=SeriesFalsas(lambda d, h: serie_sintetica({}, d, h)))

    e = resultado.ejecucion
    assert e.estado == "completada" and len(e.predicciones) == 21
    assert {p.metodo for p in e.predicciones} == {"sin_historial"}
    assert e.huella_datos is None and e.modelo is None
    assert (e.datos_desde, e.datos_hasta) == (date(2025, 11, 20), date(2026, 11, 19))


def test_las_fechas_invalidas_se_rechazan_sin_guardar_nada(ejecutar, bd):
    with pytest.raises(ErrorFechasInvalidas):
        ejecutar(solicitud(jornada_actual=date(2026, 11, 10)))
    with pytest.raises(ErrorValidacion):
        ejecutar(solicitud(dias_cerrados=(date(2027, 1, 1),)))

    assert _filas(bd, "SELECT count(*) AS n FROM ejecucion")[0]["n"] == 0


def test_con_la_jornada_de_ayer_se_pide_un_dia_menos_de_datos(ejecutar):
    series = series_normales()

    ejecutar(solicitud(jornada_actual=date(2026, 11, 19), dias_cerrados=()), series=series, reloj=RelojFijo(date(2026, 11, 20)))

    assert series.llamadas[0][3] == date(2026, 11, 18)


def test_una_ultima_venta_vieja_agrega_la_advertencia(ejecutar):
    vieja = datetime(2026, 11, 1, tzinfo=timezone.utc)
    series = SeriesFalsas(lambda d, h: serie_sintetica({PRODUCTO_A: 20}, d, h, ultimo_evento_en=vieja))

    resultado = ejecutar(solicitud(), series=series)

    assert resultado.advertencias == ["datos_desactualizados"]


def test_sin_advertencias_si_la_ultima_venta_es_reciente(ejecutar):
    assert ejecutar(solicitud()).advertencias == []


# --- Con un modelo (el cableado; el modelo real se prueba en la 5B.3) ---


class _Predictor:
    def __init__(self, valor):
        self.valor = valor

    def predict(self, X):
        return np.full(len(X), self.valor)


class _ModelosFalsos:
    def __init__(self, modelo_version_id):
        artefacto = SimpleNamespace(
            p50=_Predictor(12.34), p90=_Predictor(17.0), codigos={PRODUCTO_A: 0, PRODUCTO_B: 1},
            ficha={"variables": list(LISTA_VARIABLES), "modelo_version": modelo_version_id},
        )
        self._uso = ModeloEnUso(artefacto, modelo_version_id)

    def obtener(self, empresa_id, local_id):
        return self._uso


def _registrar_modelo(bd) -> str:
    id_ = str(uuid.uuid4())
    bd.execute(
        text(
            """
            INSERT INTO modelo_version (id, empresa_id, local_id, algoritmo, version_variables, datos_desde, datos_hasta,
                                        ficha, artefacto_uri, artefacto_sha256, estado, publicado_en)
            VALUES (:id, :e, :l, 'HistGradientBoostingRegressor, cuantiles 0,5 y 0,9', '1', '2024-11-18', '2026-11-17',
                    '{}', 'file:///repositorio', :sha, 'vigente', '2026-11-20T20:03:42+00:00')
            """
        ),
        {"id": id_, "e": EMPRESA, "l": LOCAL, "sha": "b" * 64},
    )
    bd.commit()
    return id_


def test_con_un_modelo_vigente_usa_sus_cifras_y_guarda_con_que_version_se_calculo(ejecutar, bd):
    modelo_id = _registrar_modelo(bd)

    resultado = ejecutar(solicitud(dias_cerrados=()), modelos=_ModelosFalsos(modelo_id))

    e = resultado.ejecucion
    assert e.modelo.modelo_version == modelo_id and e.modelo.entrenado_hasta == date(2026, 11, 17)
    a = [p for p in e.predicciones if p.producto_id == PRODUCTO_A]
    assert {p.metodo for p in a} == {"modelo"} and {(p.p50, p.p90) for p in a} == {(12.34, 17.0)}
    c = [p for p in e.predicciones if p.producto_id == PRODUCTO_C]
    assert {p.metodo for p in c} == {"sin_historial"}
    assert str(_filas(bd, "SELECT modelo_version_id FROM ejecucion")[0]["modelo_version_id"]) == modelo_id


# --- Consultar una ejecución guardada ---


def test_se_recupera_la_ejecucion_guardada_con_las_mismas_predicciones(ejecutar, tmp_path):
    creada = ejecutar(solicitud())
    registro = contenedor_de_prueba(get_engine(), tmp_path).registro

    recuperada = consultar_ejecucion(creada.ejecucion.id, EMPRESA, LOCAL, registro=registro, parametros=PARAMETROS)

    assert recuperada.nueva is False
    assert recuperada.ejecucion.predicciones == creada.ejecucion.predicciones
    assert recuperada.ejecucion.huella_datos == creada.ejecucion.huella_datos


def test_una_ejecucion_de_otro_local_o_empresa_no_se_distingue_de_una_que_no_existe(ejecutar, tmp_path):
    creada = ejecutar(solicitud())
    registro = contenedor_de_prueba(get_engine(), tmp_path).registro

    for empresa, local, id_ in (
        (EMPRESA, OTRO_LOCAL, creada.ejecucion.id),
        ("00000000-0000-4000-8000-000000000099", LOCAL, creada.ejecucion.id),
        (EMPRESA, LOCAL, id_nuevo()),
    ):
        with pytest.raises(ErrorNoEncontrado):
            consultar_ejecucion(id_, empresa, local, registro=registro, parametros=PARAMETROS)
