import uuid

from fastapi.testclient import TestClient

from app.adaptadores.bd.conexion import get_engine
from app.main import crear_app
from tests.ayudas import contenedor_de_prueba


def _cliente(tmp_path, *, repositorio_existe=True, bd_responde=True) -> TestClient:
    contenedor = contenedor_de_prueba(get_engine(), tmp_path, bd_responde=bd_responde, repositorio=repositorio_existe)
    return TestClient(crear_app(contenedor))


def test_health_responde_200_sin_firma_con_el_formato_comun(cliente):
    respuesta = cliente.get("/health")

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["exito"] is True
    assert cuerpo["datos"] == {"estado": "ok", "servicio": "ms-pronostico", "bd": "ok", "repositorio": "ok"}
    assert cuerpo["meta"]["timestamp"].endswith("-05:00")  # America/Lima


def test_health_responde_503_si_la_base_no_responde(tmp_path):
    respuesta = _cliente(tmp_path, bd_responde=False).get("/health")

    assert respuesta.status_code == 503
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_BD_NO_DISPONIBLE"


def test_sin_repositorio_sigue_en_200_pero_degradado(tmp_path):
    # Sin repositorio se pronostica con el baseline: la plataforma no debe reiniciar el servicio por eso.
    respuesta = _cliente(tmp_path, repositorio_existe=False).get("/health")

    assert respuesta.status_code == 200
    assert respuesta.json()["datos"] == {
        "estado": "degradado",
        "servicio": "ms-pronostico",
        "bd": "ok",
        "repositorio": "no_disponible",
    }


def test_el_x_request_id_que_llega_se_devuelve_igual(cliente):
    respuesta = cliente.get("/health", headers={"X-Request-Id": "peticion-abc-123"})

    assert respuesta.headers["X-Request-Id"] == "peticion-abc-123"


def test_si_falta_el_x_request_id_se_genera_uno_distinto_por_peticion(cliente):
    primero = cliente.get("/health").headers["X-Request-Id"]
    segundo = cliente.get("/health").headers["X-Request-Id"]

    assert uuid.UUID(primero) != uuid.UUID(segundo)


def test_el_x_request_id_viaja_tambien_en_las_respuestas_de_error(tmp_path):
    respuesta = _cliente(tmp_path, bd_responde=False).get("/health", headers={"X-Request-Id": "error-777"})

    assert respuesta.status_code == 503
    assert respuesta.headers["X-Request-Id"] == "error-777"
