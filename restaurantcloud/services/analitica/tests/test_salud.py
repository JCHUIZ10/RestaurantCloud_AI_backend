import json
import logging
import uuid

from sqlalchemy.exc import OperationalError

from app.api import salud
from app.soporte.logs import FormatoJson
from app.soporte.request_id import request_id_actual


def test_health_responde_200_sin_firma_con_el_formato_comun(cliente):
    respuesta = cliente.get("/health")

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["exito"] is True
    assert cuerpo["datos"] == {"estado": "ok", "servicio": "ms-analitica"}
    assert cuerpo["meta"]["timestamp"].endswith("-05:00")  # America/Lima


def test_health_responde_503_si_la_base_no_responde(cliente, monkeypatch):
    class BaseCaida:
        def connect(self):
            raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    monkeypatch.setattr(salud, "get_engine", lambda: BaseCaida())

    respuesta = cliente.get("/health")

    assert respuesta.status_code == 503
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_BD_NO_DISPONIBLE"


def test_el_x_request_id_que_llega_se_devuelve_igual(cliente):
    respuesta = cliente.get("/health", headers={"X-Request-Id": "peticion-abc-123"})

    assert respuesta.headers["X-Request-Id"] == "peticion-abc-123"


def test_si_falta_el_x_request_id_se_genera_uno_distinto_por_peticion(cliente):
    primero = cliente.get("/health").headers["X-Request-Id"]
    segundo = cliente.get("/health").headers["X-Request-Id"]

    assert uuid.UUID(primero) != uuid.UUID(segundo)


def test_el_x_request_id_viaja_tambien_en_las_respuestas_de_error(cliente):
    respuesta = cliente.get("/interno/series/ventas-diarias", headers={"X-Request-Id": "error-777"})

    assert respuesta.status_code == 401
    assert respuesta.headers["X-Request-Id"] == "error-777"


def test_los_logs_son_json_y_llevan_el_request_id_de_la_peticion_en_curso():
    registro = logging.LogRecord("app.prueba", logging.INFO, __file__, 1, "evento aplicado", None, None)
    token = request_id_actual.set("peticion-xyz")
    try:
        linea = FormatoJson().format(registro)
    finally:
        request_id_actual.reset(token)

    entrada = json.loads(linea)
    assert entrada["request_id"] == "peticion-xyz"
    assert entrada["mensaje"] == "evento aplicado"
    assert entrada["nivel"] == "INFO"
