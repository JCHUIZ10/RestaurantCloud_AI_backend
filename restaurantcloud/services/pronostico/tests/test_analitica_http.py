"""El cliente de ms-analítica contra un servidor simulado: firma, formato y cada tipo de fallo."""

from datetime import date, datetime, timezone
from urllib.parse import parse_qs

import httpx
import pytest

from app.adaptadores.analitica_http import AnaliticaHttp
from app.casos_de_uso.puertos import FuenteNoDisponible, RespuestaInvalida
from app.soporte.firma import calcular_firma
from app.soporte.request_id import request_id_actual

SECRETO = "secreto-de-analitica"
EMPRESA = "00000000-0000-4000-8000-000000000001"
LOCAL = "00000000-0000-4000-8000-000000000010"
DESDE, HASTA = date(2025, 11, 20), date(2026, 11, 19)


def _cuerpo(**cambios):
    datos = {
        "local_id": LOCAL, "desde": "2025-11-20", "hasta": "2026-11-19",
        "ultimo_evento_en": "2026-11-19T23:41:12-05:00",
        "productos": [
            {"producto_id": "00000000-0000-4000-8000-000000000431", "nombre": "Ceviche Clásico", "primera_venta": "2025-11-20",
             "serie": [{"fecha": "2025-11-20", "unidades": 14, "ingreso": 532.0}, {"fecha": "2025-11-21", "unidades": 0, "ingreso": 0.0}]},
        ],
    }
    datos.update(cambios)
    return {"exito": True, "datos": datos, "meta": {}}


def _cliente(manejador) -> AnaliticaHttp:
    return AnaliticaHttp("http://analitica", SECRETO, 5, transport=httpx.MockTransport(manejador))


def _ok(solicitud: httpx.Request) -> httpx.Response:
    return httpx.Response(200, json=_cuerpo())


def test_interpreta_la_serie_y_la_ultima_venta():
    serie = _cliente(_ok).ventas_diarias(EMPRESA, LOCAL, DESDE, HASTA)

    assert serie.ultimo_evento_en == datetime(2026, 11, 20, 4, 41, 12, tzinfo=timezone.utc)
    assert len(serie.productos) == 1
    assert serie.productos[0].producto_id == "00000000-0000-4000-8000-000000000431"
    assert serie.productos[0].filas == [(date(2025, 11, 20), 14), (date(2025, 11, 21), 0)]


def test_pide_los_parametros_correctos_firmados_sobre_la_cadena_de_consulta():
    visto = {}

    def manejador(solicitud: httpx.Request) -> httpx.Response:
        visto["ruta"] = solicitud.url.path
        visto["consulta"] = solicitud.url.query
        visto["cabeceras"] = dict(solicitud.headers)
        return httpx.Response(200, json=_cuerpo())

    _cliente(manejador).ventas_diarias(EMPRESA, LOCAL, DESDE, HASTA)

    assert visto["ruta"] == "/interno/series/ventas-diarias"
    assert parse_qs(visto["consulta"].decode()) == {
        "empresa_id": [EMPRESA], "local_id": [LOCAL], "desde": ["2025-11-20"], "hasta": ["2026-11-19"],
    }
    # No filtra productos: la regla de cierres necesita ver las ventas de todo el local.
    assert b"producto_ids" not in visto["consulta"]
    marca = visto["cabeceras"]["x-timestamp"]
    assert visto["cabeceras"]["x-firma"] == calcular_firma(marca, visto["consulta"], SECRETO)


def test_reenvia_el_x_request_id_de_la_peticion_en_curso():
    visto = {}

    def manejador(solicitud):
        visto["rid"] = solicitud.headers.get("x-request-id")
        return httpx.Response(200, json=_cuerpo())

    token = request_id_actual.set("peticion-del-nucleo-42")
    try:
        _cliente(manejador).ventas_diarias(EMPRESA, LOCAL, DESDE, HASTA)
    finally:
        request_id_actual.reset(token)

    assert visto["rid"] == "peticion-del-nucleo-42"


def test_un_local_sin_ventas_es_una_serie_vacia_y_no_un_error():
    serie = _cliente(lambda s: httpx.Response(200, json=_cuerpo(productos=[], ultimo_evento_en=None))).ventas_diarias(
        EMPRESA, LOCAL, DESDE, HASTA
    )

    assert serie.productos == []
    assert serie.ultimo_evento_en is None


@pytest.mark.parametrize("estado", [401, 403, 422, 500, 502, 503])
def test_cualquier_respuesta_que_no_sea_200_es_fuente_no_disponible(estado):
    cliente = _cliente(lambda s: httpx.Response(estado, json={"exito": False}))

    with pytest.raises(FuenteNoDisponible, match=str(estado)):
        cliente.ventas_diarias(EMPRESA, LOCAL, DESDE, HASTA)


@pytest.mark.parametrize("error", [httpx.ConnectError("sin ruta"), httpx.ReadTimeout("lenta"), httpx.RemoteProtocolError("cortó")])
def test_un_fallo_de_red_es_fuente_no_disponible(error):
    def manejador(solicitud):
        raise error

    with pytest.raises(FuenteNoDisponible):
        _cliente(manejador).ventas_diarias(EMPRESA, LOCAL, DESDE, HASTA)


@pytest.mark.parametrize(
    "respuesta",
    [
        httpx.Response(200, content=b"<html>no es json</html>"),
        httpx.Response(200, json={"exito": True}),
        httpx.Response(200, json=_cuerpo(productos=[{"producto_id": "x"}])),
        httpx.Response(200, json=_cuerpo(productos=[{"producto_id": "x", "serie": [{"fecha": "ayer", "unidades": 1}]}])),
        httpx.Response(200, json=_cuerpo(productos=[{"producto_id": "x", "serie": [{"fecha": "2025-11-20", "unidades": 1.5}]}])),
        httpx.Response(200, json=_cuerpo(productos=[{"producto_id": "x", "serie": [{"fecha": "2025-11-20", "unidades": True}]}])),
    ],
)
def test_una_respuesta_con_otra_forma_es_respuesta_invalida(respuesta):
    with pytest.raises(RespuestaInvalida):
        _cliente(lambda s: respuesta).ventas_diarias(EMPRESA, LOCAL, DESDE, HASTA)
