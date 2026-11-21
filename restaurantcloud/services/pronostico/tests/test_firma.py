"""La firma de /interno es la misma que usa el núcleo. Todavía no hay rutas /interno (llegan con la 5B.2),
así que se prueba con una ruta de ejemplo montada solo en esta prueba."""

import time

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient

from app.adaptadores.almacen_local import AlmacenLocal
from app.casos_de_uso.contenedor import Contenedor
from app.main import crear_app
from app.soporte.firma import calcular_firma, verificar_firma
from tests.ayudas import cabeceras_firmadas


class _Sonda:
    def responde(self) -> bool:
        return True


@pytest.fixture(scope="module")
def protegido(tmp_path_factory):
    app = crear_app(Contenedor(almacen=AlmacenLocal(tmp_path_factory.mktemp("repo")), sonda_bd=_Sonda()))

    @app.post("/interno/ejemplo")
    def post_ejemplo(contenido: bytes = Depends(verificar_firma)):
        return {"recibido": contenido.decode()}

    @app.get("/interno/ejemplo")
    def get_ejemplo(contenido: bytes = Depends(verificar_firma)):
        return {"firmado": contenido.decode()}

    return TestClient(app)


def test_la_firma_coincide_con_la_que_calcula_el_nucleo():
    # Vector calculado con EntregarEventoJob::firmar del núcleo (PHP), incluye un carácter no ASCII.
    assert (
        calcular_firma("1700000000", '{"a":"ñ"}'.encode(), "secreto")
        == "3ce72935c2ac7cc6e572e38c3523cc012e60150d7a0136803d63675d84818387"
    )


def test_una_peticion_bien_firmada_se_acepta(protegido):
    cuerpo = b'{"hola":"mundo"}'

    respuesta = protegido.post("/interno/ejemplo", content=cuerpo, headers=cabeceras_firmadas(cuerpo))

    assert respuesta.status_code == 200
    assert respuesta.json() == {"recibido": '{"hola":"mundo"}'}


def test_sin_cabeceras_de_firma_responde_401(protegido):
    respuesta = protegido.post("/interno/ejemplo", content=b"{}")

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FIRMA_INVALIDA"
    assert respuesta.json()["exito"] is False


def test_firma_incorrecta_responde_401(protegido):
    respuesta = protegido.post("/interno/ejemplo", content=b"{}", headers=cabeceras_firmadas(b"{}", secreto="otro"))

    assert respuesta.status_code == 401


def test_cuerpo_alterado_despues_de_firmar_responde_401(protegido):
    cabeceras = cabeceras_firmadas(b'{"cantidad":1}')

    respuesta = protegido.post("/interno/ejemplo", content=b'{"cantidad":9}', headers=cabeceras)

    assert respuesta.status_code == 401


@pytest.mark.parametrize("desfase", [-301, 301])
def test_timestamp_fuera_de_los_cinco_minutos_responde_401(protegido, desfase):
    cabeceras = cabeceras_firmadas(b"{}", timestamp=int(time.time()) + desfase)

    assert protegido.post("/interno/ejemplo", content=b"{}", headers=cabeceras).status_code == 401


def test_timestamp_dentro_de_tolerancia_se_acepta(protegido):
    cabeceras = cabeceras_firmadas(b"{}", timestamp=int(time.time()) - 290)

    assert protegido.post("/interno/ejemplo", content=b"{}", headers=cabeceras).status_code == 200


def test_timestamp_no_numerico_responde_401(protegido):
    respuesta = protegido.post("/interno/ejemplo", content=b"{}", headers={"X-Timestamp": "ayer", "X-Firma": "abc"})

    assert respuesta.status_code == 401


def test_un_get_se_firma_sobre_su_cadena_de_consulta(protegido):
    consulta = "empresa_id=a&local_id=b"

    respuesta = protegido.get(f"/interno/ejemplo?{consulta}", headers=cabeceras_firmadas(consulta.encode()))

    assert respuesta.status_code == 200
    assert respuesta.json() == {"firmado": consulta}


def test_alterar_un_parametro_del_get_invalida_la_firma(protegido):
    cabeceras = cabeceras_firmadas(b"empresa_id=a&local_id=b")

    respuesta = protegido.get("/interno/ejemplo?empresa_id=a&local_id=OTRO", headers=cabeceras)

    assert respuesta.status_code == 401
