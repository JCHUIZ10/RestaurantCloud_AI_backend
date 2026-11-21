"""FuenteSeries sobre `GET /interno/series/ventas-diarias` de ms-analítica, con firma HMAC."""

import time
from datetime import date, datetime
from urllib.parse import urlencode

import httpx

from app.casos_de_uso.puertos import FuenteNoDisponible, RespuestaInvalida
from app.casos_de_uso.tipos import ProductoSerie, SerieVentas
from app.soporte.firma import calcular_firma
from app.soporte.request_id import request_id_actual

RUTA = "/interno/series/ventas-diarias"


class AnaliticaHttp:
    def __init__(self, base_url: str, secreto: str, timeout_segundos: float, transport: httpx.BaseTransport | None = None):
        self._secreto = secreto
        self._cliente = httpx.Client(base_url=base_url, timeout=timeout_segundos, transport=transport)

    def ventas_diarias(self, empresa_id: str, local_id: str, desde: date, hasta: date) -> SerieVentas:
        # La firma cubre la cadena de consulta tal como se envía: se arma una vez y se usa igual en la URL.
        consulta = urlencode(
            [("empresa_id", empresa_id), ("local_id", local_id), ("desde", desde.isoformat()), ("hasta", hasta.isoformat())]
        )
        marca = str(int(time.time()))
        cabeceras = {"X-Timestamp": marca, "X-Firma": calcular_firma(marca, consulta.encode(), self._secreto)}
        if (rid := request_id_actual.get()) is not None:
            cabeceras["X-Request-Id"] = rid

        try:
            respuesta = self._cliente.get(f"{RUTA}?{consulta}", headers=cabeceras)
        except httpx.HTTPError as error:
            raise FuenteNoDisponible(f"{type(error).__name__} al llamar a ms-analítica") from None
        if respuesta.status_code != 200:
            # 401 es un error de configuración (secreto distinto); 422, uno nuestro. Ninguno se arregla reintentando.
            raise FuenteNoDisponible(f"ms-analítica respondió {respuesta.status_code}")
        return _interpretar(respuesta)


def _interpretar(respuesta: httpx.Response) -> SerieVentas:
    try:
        datos = respuesta.json()["datos"]
        ultimo = datos["ultimo_evento_en"]
        productos = [
            ProductoSerie(
                producto_id=str(p["producto_id"]).lower(),
                filas=[(date.fromisoformat(f["fecha"]), _entero(f["unidades"])) for f in p["serie"]],
            )
            for p in datos["productos"]
        ]
        return SerieVentas(productos, datetime.fromisoformat(ultimo) if ultimo else None)
    except (ValueError, KeyError, TypeError) as error:
        raise RespuestaInvalida(f"{type(error).__name__}: {error}") from None


def _entero(valor) -> int:
    if isinstance(valor, bool) or not isinstance(valor, int):
        raise ValueError(f"`unidades` debe ser entero: {valor!r}")
    return valor
