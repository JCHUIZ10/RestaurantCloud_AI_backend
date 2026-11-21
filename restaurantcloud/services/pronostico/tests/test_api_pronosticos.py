"""POST y GET /interno/pronosticos de punta a punta por HTTP, con la base real y ms-analítica simulada."""

import json
import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.adaptadores.bd.conexion import get_engine
from app.main import crear_app
from tests.ayudas import (
    EMPRESA, LOCAL, OTRO_LOCAL, PRODUCTO_A, PRODUCTO_B, PRODUCTO_C, USUARIO, cabeceras_firmadas, contenedor_de_prueba,
    id_nuevo, series_caidas, series_con_formato_roto, series_normales,
)


def _cuerpo(**cambios) -> dict:
    cuerpo = {
        "solicitud_id": id_nuevo(), "empresa_id": EMPRESA, "local_id": LOCAL, "solicitada_por": USUARIO,
        "jornada_actual": "2026-11-20", "horizonte_dias": 7, "dias_cerrados": ["2026-11-25"],
        "productos": [
            {"producto_id": PRODUCTO_A, "nombre": "Ceviche Clásico"},
            {"producto_id": PRODUCTO_B, "nombre": "Lomo Saltado Criollo"},
            {"producto_id": PRODUCTO_C, "nombre": "Plato nuevo sin ventas"},
        ],
    }
    cuerpo.update(cambios)
    return cuerpo


def _app(tmp_path, **kw) -> TestClient:
    return TestClient(crear_app(contenedor_de_prueba(get_engine(), tmp_path, **kw)))


def _post(cliente, cuerpo: dict, **kw):
    contenido = json.dumps(cuerpo).encode()
    return cliente.post("/interno/pronosticos", content=contenido, headers=cabeceras_firmadas(contenido, **kw))


def _get(cliente, ejecucion_id, empresa=EMPRESA, local=LOCAL, firmar=True):
    consulta = f"empresa_id={empresa}&local_id={local}"
    cabeceras = cabeceras_firmadas(consulta.encode()) if firmar else {}
    return cliente.get(f"/interno/pronosticos/{ejecucion_id}?{consulta}", headers=cabeceras)


@pytest.fixture
def cliente(tmp_path):
    return _app(tmp_path)


# --- POST ---


def test_crea_el_pronostico_y_responde_201_con_la_forma_de_la_ficha(cliente):
    respuesta = _post(cliente, _cuerpo())

    assert respuesta.status_code == 201
    datos = respuesta.json()["datos"]
    assert respuesta.json()["exito"] is True
    assert datos["estado"] == "completada" and datos["modelo"] is None
    assert (datos["fecha_inicio"], datos["horizonte_dias"]) == ("2026-11-21", 7)
    assert datos["datos"]["desde"] == "2025-11-20" and datos["datos"]["hasta"] == "2026-11-19"
    assert len(datos["datos"]["huella"]) == 64
    assert datos["historial"] == {"dias_con_ventas": 364}
    assert datos["datos"]["actualizados_hasta"].endswith("-05:00")
    assert datos["resumen"] == {"modelo": 0, "baseline": 12, "cerrado": 3, "sin_historial": 6}
    assert datos["advertencias"] == []

    # Un bloque por plato, ordenados por nombre, y cada uno con sus 7 días en orden.
    assert [p["nombre"] for p in datos["predicciones"]] == ["Ceviche Clásico", "Lomo Saltado Criollo", "Plato nuevo sin ventas"]
    ceviche = datos["predicciones"][0]
    assert ceviche["producto_id"] == PRODUCTO_A
    assert [d["fecha"] for d in ceviche["dias"]] == [f"2026-11-{n}" for n in range(21, 28)]
    assert ceviche["dias"][0]["metodo"] == "baseline" and ceviche["dias"][0]["motivo"] == "modelo_no_disponible"
    assert ceviche["dias"][4] == {"fecha": "2026-11-25", "p50": 0.0, "p90": 0.0, "metodo": "cerrado", "motivo": None}
    assert datos["predicciones"][2]["dias"][0]["metodo"] == "sin_historial"


def test_el_reintento_responde_200_con_la_misma_ejecucion(cliente):
    cuerpo = _cuerpo()

    primero = _post(cliente, cuerpo)
    segundo = _post(cliente, cuerpo)

    assert (primero.status_code, segundo.status_code) == (201, 200)
    assert segundo.json()["datos"] == primero.json()["datos"]


def test_el_get_devuelve_lo_mismo_que_el_post(cliente):
    creada = _post(cliente, _cuerpo()).json()["datos"]

    recuperada = _get(cliente, creada["ejecucion_id"])

    assert recuperada.status_code == 200
    assert recuperada.json()["datos"] == creada


def test_sin_firma_responde_401_antes_de_validar_el_cuerpo(cliente):
    respuesta = cliente.post("/interno/pronosticos", content=b"esto no es json")

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FIRMA_INVALIDA"


def test_firma_con_otro_secreto_responde_401(cliente):
    assert _post(cliente, _cuerpo(), secreto="otro").status_code == 401


def test_timestamp_viejo_responde_401(cliente):
    assert _post(cliente, _cuerpo(), timestamp=int(time.time()) - 600).status_code == 401


@pytest.mark.parametrize(
    ("cambios", "campo"),
    [
        ({"horizonte_dias": 8}, "horizonte_dias"),
        ({"horizonte_dias": 0}, "horizonte_dias"),
        ({"horizonte_dias": "7"}, "horizonte_dias"),
        ({"productos": []}, "productos"),
        ({"productos": [{"producto_id": PRODUCTO_A, "nombre": "A"}, {"producto_id": PRODUCTO_A, "nombre": "B"}]}, "productos"),
        ({"productos": [{"producto_id": "no-es-uuid", "nombre": "A"}]}, "productos.0.producto_id"),
        ({"productos": [{"producto_id": PRODUCTO_A, "nombre": ""}]}, "productos.0.nombre"),
        ({"productos": [{"producto_id": PRODUCTO_A, "nombre": "x" * 151}]}, "productos.0.nombre"),
        ({"jornada_actual": "mañana"}, "jornada_actual"),
        ({"solicitud_id": "123"}, "solicitud_id"),
        ({"dias_cerrados": ["no-es-fecha"]}, "dias_cerrados.0"),
    ],
)
def test_un_cuerpo_invalido_responde_422_y_dice_que_campo(cliente, cambios, campo):
    respuesta = _post(cliente, _cuerpo(**cambios))

    assert respuesta.status_code == 422
    error = respuesta.json()["errores"][0]
    assert error["codigo"] == "ERR_VALIDACION"
    assert campo in [c["campo"] for c in error["detalles"]["campos"]]


@pytest.mark.parametrize("campo", ["solicitud_id", "empresa_id", "local_id", "solicitada_por", "jornada_actual", "horizonte_dias", "productos"])
def test_cada_campo_obligatorio_faltante_responde_422(cliente, campo):
    cuerpo = _cuerpo()
    del cuerpo[campo]

    respuesta = _post(cliente, cuerpo)

    assert respuesta.status_code == 422
    assert campo in [c["campo"] for c in respuesta.json()["errores"][0]["detalles"]["campos"]]


def test_un_cuerpo_que_no_es_json_responde_422(cliente):
    contenido = b"{no es json"

    respuesta = cliente.post("/interno/pronosticos", content=contenido, headers=cabeceras_firmadas(contenido))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"


def test_un_cierre_fuera_del_periodo_responde_422_de_validacion(cliente):
    respuesta = _post(cliente, _cuerpo(dias_cerrados=["2027-01-01"]))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"
    assert respuesta.json()["errores"][0]["detalles"]["campos"][0]["campo"] == "dias_cerrados"


def test_una_jornada_que_no_es_ayer_ni_hoy_responde_422_de_fechas(cliente):
    respuesta = _post(cliente, _cuerpo(jornada_actual="2026-11-10"))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FECHAS_INVALIDAS"


def test_con_ms_analitica_caida_responde_503_y_deja_el_id_de_la_ejecucion_fallida(tmp_path):
    cliente = _app(tmp_path, series=series_caidas())

    respuesta = _post(cliente, _cuerpo())

    assert respuesta.status_code == 503
    error = respuesta.json()["errores"][0]
    assert error["codigo"] == "ERR_ANALITICA_NO_DISPONIBLE"
    recuperada = _get(cliente, error["detalles"]["ejecucion_id"]).json()["datos"]
    assert recuperada["estado"] == "fallida" and recuperada["error"] == "ERR_ANALITICA_NO_DISPONIBLE"
    assert recuperada["predicciones"] == [] and recuperada["datos"]["huella"] is None


def test_con_una_serie_de_formato_roto_responde_502(tmp_path):
    respuesta = _post(_app(tmp_path, series=series_con_formato_roto()), _cuerpo())

    assert respuesta.status_code == 502
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_SERIE_INVALIDA"


def test_si_la_base_no_responde_al_guardar_responde_503_y_no_devuelve_un_pronostico_sin_guardar(tmp_path, monkeypatch):
    from sqlalchemy.exc import OperationalError

    contenedor = contenedor_de_prueba(get_engine(), tmp_path)

    def sin_base(*_):
        raise OperationalError("INSERT", {}, Exception("connection refused"))

    monkeypatch.setattr(contenedor.registro, "guardar", sin_base)

    respuesta = _post(TestClient(crear_app(contenedor)), _cuerpo())

    assert respuesta.status_code == 503
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_BD_NO_DISPONIBLE"


def test_el_x_request_id_viaja_en_la_respuesta(cliente):
    contenido = json.dumps(_cuerpo()).encode()

    respuesta = cliente.post(
        "/interno/pronosticos", content=contenido, headers={**cabeceras_firmadas(contenido), "X-Request-Id": "pron-123"}
    )

    assert respuesta.headers["X-Request-Id"] == "pron-123"


# --- GET ---


def test_get_sin_firma_responde_401(cliente):
    creada = _post(cliente, _cuerpo()).json()["datos"]

    assert _get(cliente, creada["ejecucion_id"], firmar=False).status_code == 401


def test_get_de_otro_local_o_de_una_ejecucion_inexistente_responde_404_igual(cliente):
    creada = _post(cliente, _cuerpo()).json()["datos"]

    for respuesta in (_get(cliente, creada["ejecucion_id"], local=OTRO_LOCAL), _get(cliente, id_nuevo())):
        assert respuesta.status_code == 404
        assert respuesta.json()["errores"][0]["codigo"] == "ERR_NO_ENCONTRADO"


def test_get_con_parametros_que_no_son_uuid_responde_422(cliente):
    consulta = "empresa_id=x&local_id=y"

    respuesta = cliente.get(f"/interno/pronosticos/{id_nuevo()}?{consulta}", headers=cabeceras_firmadas(consulta.encode()))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"


def test_alterar_el_local_del_get_invalida_la_firma(cliente):
    creada = _post(cliente, _cuerpo()).json()["datos"]
    firmada = f"empresa_id={EMPRESA}&local_id={LOCAL}"

    respuesta = cliente.get(
        f"/interno/pronosticos/{creada['ejecucion_id']}?empresa_id={EMPRESA}&local_id={OTRO_LOCAL}",
        headers=cabeceras_firmadas(firmada.encode()),
    )

    assert respuesta.status_code == 401


def test_las_predicciones_guardadas_cumplen_las_garantias_del_contrato(cliente, bd):
    _post(cliente, _cuerpo())

    malas = bd.execute(text("SELECT count(*) FROM prediccion WHERE unidades_p50 < 0 OR unidades_p90 < unidades_p50")).scalar_one()

    assert malas == 0
