"""Validación del JWT y resolución de la sede (etapa 6.2). Sin base de datos: usa una app mínima con la dependencia."""

import time

import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.config import get_settings
from app.soporte import jwt as modulo_jwt
from app.soporte.jwt import Contexto, contexto_de_sede
from app.soporte.respuestas import registrar_manejadores
from tests.ayudas import (
    CLAVE_PRIVADA_PEM,
    EMPRESA,
    LOCAL,
    OTRO_LOCAL,
    cabecera_bearer,
    claims_jwt,
    emitir_jwt,
)


@pytest.fixture(scope="module")
def ruta():
    """Una ruta de reportes simulada: roles de reporte y módulo `reportes_avanzados`."""
    app = FastAPI()
    registrar_manejadores(app)

    @app.get("/basico")
    def basico(contexto: Contexto = Depends(contexto_de_sede(("admin_local", "propietario")))):
        return {"empresa_id": str(contexto.empresa_id), "local_id": str(contexto.local_id)}

    @app.get("/avanzado")
    def avanzado(
        contexto: Contexto = Depends(contexto_de_sede(("admin_local", "propietario"), "reportes_avanzados")),
    ):
        return {"local_id": str(contexto.local_id)}

    return TestClient(app)


def _codigo(respuesta) -> str:
    return respuesta.json()["errores"][0]["codigo"]


def test_un_token_valido_da_la_sede_y_la_empresa_del_token(ruta):
    respuesta = ruta.get("/basico", headers=cabecera_bearer())

    assert respuesta.status_code == 200
    assert respuesta.json() == {"empresa_id": EMPRESA, "local_id": LOCAL}


def test_sin_token_o_con_esquema_distinto_responde_401(ruta):
    assert _codigo(ruta.get("/basico")) == "ERR_TOKEN_INVALIDO"
    assert ruta.get("/basico", headers={"Authorization": f"Basic {emitir_jwt()}"}).status_code == 401
    assert ruta.get("/basico", headers={"Authorization": "Bearer "}).status_code == 401
    assert _codigo(ruta.get("/basico", headers=cabecera_bearer("no.es.un-jwt"))) == "ERR_TOKEN_INVALIDO"


def test_un_token_caducado_responde_401_con_su_propio_codigo(ruta):
    token = emitir_jwt(exp=int(time.time()) - 120)

    respuesta = ruta.get("/basico", headers=cabecera_bearer(token))

    assert respuesta.status_code == 401
    assert _codigo(respuesta) == "ERR_TOKEN_EXPIRADO"


def test_la_tolerancia_de_reloj_acepta_un_token_que_caduco_hace_unos_segundos(ruta):
    assert ruta.get("/basico", headers=cabecera_bearer(emitir_jwt(exp=int(time.time()) - 5))).status_code == 200


def test_un_token_que_aun_no_es_valido_se_rechaza(ruta):
    token = emitir_jwt(nbf=int(time.time()) + 300)

    assert ruta.get("/basico", headers=cabecera_bearer(token)).status_code == 401


def test_firmado_con_otra_clave_se_rechaza(ruta):
    otra = rsa.generate_private_key(public_exponent=65537, key_size=2048).private_bytes(
        serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
    )

    respuesta = ruta.get("/basico", headers=cabecera_bearer(emitir_jwt(clave=otra)))

    assert respuesta.status_code == 401
    assert _codigo(respuesta) == "ERR_TOKEN_INVALIDO"


def test_claims_alterados_invalidan_la_firma(ruta):
    cabecera, claims, firma = emitir_jwt(rol="admin_local").split(".")
    alterados = pyjwt.utils.base64url_encode(
        pyjwt.utils.base64url_decode(claims).replace(b"admin_local", b"propietario")
    ).decode()

    assert ruta.get("/basico", headers=cabecera_bearer(f"{cabecera}.{alterados}.{firma}")).status_code == 401


def test_un_token_sin_firma_alg_none_se_rechaza(ruta):
    sin_firma = pyjwt.encode(claims_jwt(), key=None, algorithm="none")

    assert ruta.get("/basico", headers=cabecera_bearer(sin_firma)).status_code == 401


def test_un_token_hs256_firmado_con_la_clave_publica_se_rechaza(ruta):
    # Ataque de confusión de algoritmo: HS256 usando como secreto la clave pública, que es conocida.
    publica = get_settings().jwt_public_key.replace("\\n", "\n").encode()
    claims = claims_jwt()
    cabecera = pyjwt.utils.base64url_encode(b'{"alg":"HS256","typ":"JWT"}')
    cuerpo = pyjwt.utils.base64url_encode(pyjwt.api_jws.json.dumps(claims).encode())
    import hashlib
    import hmac

    firma = pyjwt.utils.base64url_encode(hmac.new(publica, cabecera + b"." + cuerpo, hashlib.sha256).digest())
    falso = (cabecera + b"." + cuerpo + b"." + firma).decode()

    assert ruta.get("/basico", headers=cabecera_bearer(falso)).status_code == 401


def test_emisor_o_audiencia_distintos_se_rechazan(ruta):
    assert ruta.get("/basico", headers=cabecera_bearer(emitir_jwt(iss="otro-emisor"))).status_code == 401
    assert ruta.get("/basico", headers=cabecera_bearer(emitir_jwt(aud="otro-publico"))).status_code == 401


@pytest.mark.parametrize("claim", ["sub", "rol", "iss", "aud", "exp", "nbf"])
def test_un_token_sin_un_claim_obligatorio_se_rechaza(ruta, claim):
    claims = claims_jwt()
    del claims[claim]
    token = pyjwt.encode(claims, CLAVE_PRIVADA_PEM, algorithm="RS256")

    assert ruta.get("/basico", headers=cabecera_bearer(token)).status_code == 401


def test_un_token_sin_empresa_para_un_rol_de_sede_se_rechaza(ruta):
    assert ruta.get("/basico", headers=cabecera_bearer(emitir_jwt(empresa_id=None))).status_code == 401


def test_un_identificador_mal_formado_en_el_token_se_rechaza(ruta):
    assert ruta.get("/basico", headers=cabecera_bearer(emitir_jwt(empresa_id="no-es-uuid"))).status_code == 401


@pytest.mark.parametrize("rol", ["cajero", "mozo", "cocina", "admin_saas"])
def test_un_rol_sin_permiso_responde_403(ruta, rol):
    respuesta = ruta.get("/basico", headers=cabecera_bearer(rol=rol))

    assert respuesta.status_code == 403
    assert _codigo(respuesta) == "ERR_ROL_NO_PERMITIDO"


def test_el_modulo_del_plan_se_exige_solo_donde_corresponde(ruta):
    sin_modulo = cabecera_bearer(modulos=())

    assert ruta.get("/basico", headers=sin_modulo).status_code == 200
    respuesta = ruta.get("/avanzado", headers=sin_modulo)
    assert respuesta.status_code == 403
    assert _codigo(respuesta) == "ERR_MODULO_NO_INCLUIDO"
    assert ruta.get("/avanzado", headers=cabecera_bearer()).status_code == 200


def test_el_rol_se_comprueba_antes_que_el_modulo(ruta):
    assert _codigo(ruta.get("/avanzado", headers=cabecera_bearer(rol="mozo", modulos=()))) == "ERR_ROL_NO_PERMITIDO"


def test_un_admin_de_sede_no_puede_pedir_otra_sede(ruta):
    respuesta = ruta.get("/basico", headers={**cabecera_bearer(), "X-Local-Id": OTRO_LOCAL})

    assert respuesta.status_code == 403
    assert _codigo(respuesta) == "ERR_SEDE_NO_PERMITIDA"


def test_un_admin_de_sede_puede_repetir_su_propia_sede(ruta):
    assert ruta.get("/basico", headers={**cabecera_bearer(), "X-Local-Id": LOCAL}).status_code == 200


def test_el_propietario_elige_la_sede_con_la_cabecera(ruta):
    propietario = cabecera_bearer(rol="propietario", local_id=None)

    respuesta = ruta.get("/basico", headers={**propietario, "X-Local-Id": OTRO_LOCAL})

    assert respuesta.status_code == 200
    # La empresa sigue siendo la del token: la sede pedida no la cambia.
    assert respuesta.json() == {"empresa_id": EMPRESA, "local_id": OTRO_LOCAL}


def test_el_propietario_sin_cabecera_de_sede_recibe_422(ruta):
    respuesta = ruta.get("/basico", headers=cabecera_bearer(rol="propietario", local_id=None))

    assert respuesta.status_code == 422
    assert _codigo(respuesta) == "ERR_SEDE_REQUERIDA"


def test_una_cabecera_de_sede_mal_formada_recibe_422(ruta):
    respuesta = ruta.get("/basico", headers={**cabecera_bearer(rol="propietario", local_id=None), "X-Local-Id": "xyz"})

    assert respuesta.status_code == 422
    assert _codigo(respuesta) == "ERR_VALIDACION"


def test_la_clave_en_una_linea_con_barras_n_literales_funciona(ruta):
    # Es la forma en que llega del .env y del compose: ya la usa el conftest para todas las pruebas.
    assert "\n" not in get_settings().jwt_public_key
    assert "\\n" in get_settings().jwt_public_key


def test_sin_clave_publica_las_rutas_responden_503(ruta, monkeypatch):
    sin_clave = get_settings().model_copy(update={"jwt_public_key": None})
    monkeypatch.setattr(modulo_jwt, "get_settings", lambda: sin_clave)

    respuesta = ruta.get("/basico", headers=cabecera_bearer())

    assert respuesta.status_code == 503
    assert _codigo(respuesta) == "ERR_JWT_NO_CONFIGURADO"


def test_una_clave_publica_mal_formada_es_503_y_no_401(ruta, monkeypatch):
    rota = get_settings().model_copy(update={"jwt_public_key": "esto no es un PEM"})
    monkeypatch.setattr(modulo_jwt, "get_settings", lambda: rota)

    assert _codigo(ruta.get("/basico", headers=cabecera_bearer())) == "ERR_JWT_NO_CONFIGURADO"


def test_los_endpoints_internos_no_necesitan_jwt(cliente):
    assert cliente.get("/health").status_code == 200
