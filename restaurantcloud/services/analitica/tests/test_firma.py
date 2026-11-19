import time

from app.soporte.firma import calcular_firma
from tests import ayudas
from tests.ayudas import cuerpo_json, enviar, nuevo_id, sobre


def test_la_firma_coincide_con_la_que_calcula_el_nucleo():
    # Vector calculado con EntregarEventoJob::firmar del núcleo (PHP), incluye un carácter no ASCII.
    assert (
        calcular_firma("1700000000", '{"a":"ñ"}'.encode(), "secreto")
        == "3ce72935c2ac7cc6e572e38c3523cc012e60150d7a0136803d63675d84818387"
    )


def _evento():
    return sobre("tipo.desconocido", {}, evento_id=nuevo_id())


def test_sin_cabeceras_de_firma_responde_401(cliente):
    respuesta = cliente.post("/interno/eventos", content=cuerpo_json(_evento()))

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FIRMA_INVALIDA"
    assert respuesta.json()["exito"] is False


def test_firma_incorrecta_responde_401(cliente):
    cuerpo = cuerpo_json(_evento())
    cabeceras = ayudas.cabeceras_firmadas(cuerpo, secreto="otro-secreto")

    respuesta = cliente.post("/interno/eventos", content=cuerpo, headers=cabeceras)

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FIRMA_INVALIDA"


def test_cuerpo_alterado_despues_de_firmar_responde_401(cliente):
    cuerpo = cuerpo_json(_evento())
    cabeceras = ayudas.cabeceras_firmadas(cuerpo)

    respuesta = cliente.post("/interno/eventos", content=cuerpo.replace(b"nucleo", b"hacker"), headers=cabeceras)

    assert respuesta.status_code == 401


def test_timestamp_de_mas_de_cinco_minutos_responde_401(cliente):
    respuesta = enviar(cliente, _evento(), timestamp=int(time.time()) - 301)

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FIRMA_INVALIDA"


def test_timestamp_futuro_fuera_de_tolerancia_responde_401(cliente):
    assert enviar(cliente, _evento(), timestamp=int(time.time()) + 301).status_code == 401


def test_timestamp_dentro_de_tolerancia_se_acepta(cliente):
    assert enviar(cliente, _evento(), timestamp=int(time.time()) - 290).status_code == 200


def test_timestamp_no_numerico_responde_401(cliente):
    cuerpo = cuerpo_json(_evento())

    respuesta = cliente.post(
        "/interno/eventos", content=cuerpo, headers={"X-Timestamp": "ayer", "X-Firma": "abc"}
    )

    assert respuesta.status_code == 401
