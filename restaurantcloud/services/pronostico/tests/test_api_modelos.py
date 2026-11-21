"""GET /interno/modelos/vigente."""

import pytest
from fastapi.testclient import TestClient

from app.adaptadores.bd.conexion import get_engine
from app.main import crear_app
from tests.ayudas import EMPRESA, LOCAL, OTRO_LOCAL, cabeceras_firmadas, contenedor_de_prueba
from tests.test_proveedor_modelos import PUNTERO_REAL, AlmacenContador, Reloj, Repo, crear_proveedor

pytestmark = pytest.mark.skipif(not PUNTERO_REAL.exists(), reason="No hay modelo publicado en model-ia/repositorio")


@pytest.fixture
def repo(tmp_path):
    return Repo(tmp_path / "repo")


@pytest.fixture
def reloj():
    return Reloj()


@pytest.fixture
def cliente(tmp_path, repo, reloj):
    proveedor = crear_proveedor(AlmacenContador(repo.raiz), reloj)
    return TestClient(crear_app(contenedor_de_prueba(get_engine(), tmp_path, modelos=proveedor)))


def _get(cliente, empresa=EMPRESA, local=LOCAL, firmar=True):
    consulta = f"empresa_id={empresa}&local_id={local}"
    cabeceras = cabeceras_firmadas(consulta.encode()) if firmar else {}
    return cliente.get(f"/interno/modelos/vigente?{consulta}", headers=cabeceras)


def test_devuelve_el_modelo_vigente_con_sus_metricas(cliente, repo):
    respuesta = _get(cliente)

    assert respuesta.status_code == 200
    datos = respuesta.json()["datos"]
    assert (datos["local_id"], datos["metodo"], datos["ultimo_error"]) == (LOCAL, "modelo", None)
    m = datos["modelo"]
    assert m["modelo_version"] == repo.version and m["artefacto_sha256"] == repo.sha
    assert m["algoritmo"].startswith("HistGradientBoostingRegressor") and m["version_variables"] == "1"
    assert (m["datos_desde"], m["datos_hasta"]) == ("2024-11-18", "2026-11-17")
    assert m["metricas"]["aprobada"] is True and m["metricas"]["mae_modelo"] < m["metricas"]["mae_ingenuo"]
    assert m["publicado_en"].endswith("-05:00") and datos["revisado_en"].endswith("-05:00")


def test_un_local_sin_modelo_responde_200_con_baseline(cliente):
    respuesta = _get(cliente, local=OTRO_LOCAL)

    assert respuesta.status_code == 200
    datos = respuesta.json()["datos"]
    assert (datos["metodo"], datos["modelo"], datos["ultimo_error"]) == ("baseline", None, None)


def test_consultarlo_revisa_el_puntero_en_ese_momento(cliente, repo):
    assert _get(cliente).json()["datos"]["modelo"]["modelo_version"] == repo.version
    nueva = repo.nueva_version()
    repo.apuntar(nueva)

    assert _get(cliente).json()["datos"]["modelo"]["modelo_version"] == nueva  # sin esperar los 60 s


def test_muestra_el_ultimo_error_aunque_siga_usando_el_modelo_anterior(cliente, repo):
    _get(cliente)
    nueva = repo.nueva_version()
    repo.corromper(nueva)
    repo.apuntar(nueva)

    datos = _get(cliente).json()["datos"]

    assert datos["metodo"] == "modelo" and datos["modelo"]["modelo_version"] == repo.version
    assert "SHA-256" in datos["ultimo_error"] and nueva in datos["ultimo_error"]


def test_sin_firma_responde_401(cliente):
    assert _get(cliente, firmar=False).status_code == 401


def test_con_parametros_que_no_son_uuid_responde_422(cliente):
    consulta = "empresa_id=x&local_id=y"

    respuesta = cliente.get(f"/interno/modelos/vigente?{consulta}", headers=cabeceras_firmadas(consulta.encode()))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"


def test_sin_los_parametros_responde_422(cliente):
    respuesta = cliente.get("/interno/modelos/vigente", headers=cabeceras_firmadas(b""))

    assert respuesta.status_code == 422
