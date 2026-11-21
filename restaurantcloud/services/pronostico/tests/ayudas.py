"""Piezas falsas y constructores para las pruebas."""

import time
import uuid
from datetime import date, datetime, timedelta, timezone

from app.adaptadores.almacenamiento.local import AlmacenLocal
from app.adaptadores.bd.ejecuciones import RegistroEjecucionesSql
from tests.dobles import SinModelos
from app.aplicacion.contenedor import Contenedor
from app.aplicacion.puertos import FuenteNoDisponible, RespuestaInvalida
from app.aplicacion.tipos import ParametrosPronostico, ProductoSerie, SerieVentas
from app.soporte.firma import calcular_firma
from tests.conftest import SECRETO

EMPRESA = "00000000-0000-4000-8000-000000000001"
LOCAL = "00000000-0000-4000-8000-000000000010"
OTRO_LOCAL = "00000000-0000-4000-8000-000000000011"
USUARIO = "019a0000-0000-7000-8000-000000000123"
PRODUCTO_A = "00000000-0000-4000-8000-000000000431"
PRODUCTO_B = "00000000-0000-4000-8000-000000000432"
PRODUCTO_C = "00000000-0000-4000-8000-000000000433"  # sin ninguna venta

HOY = date(2026, 11, 20)
PARAMETROS = ParametrosPronostico(ventana_dias=365, pais_feriados="PE", zona_horaria="America/Lima")


def cabeceras_firmadas(contenido: bytes, secreto: str = SECRETO, timestamp: int | None = None) -> dict[str, str]:
    marca = str(int(time.time()) if timestamp is None else timestamp)
    return {"X-Timestamp": marca, "X-Firma": calcular_firma(marca, contenido, secreto)}


class RelojFijo:
    def __init__(self, hoy: date = HOY):
        self._hoy = hoy

    def hoy(self) -> date:
        return self._hoy


class SondaFalsa:
    def __init__(self, responde: bool = True):
        self._responde = responde

    def responde(self) -> bool:
        return self._responde


def serie_sintetica(
    productos: dict[str, int], desde: date, hasta: date, cierres: tuple[date, ...] = (), ultimo_evento_en=None
) -> SerieVentas:
    """Serie continua. `productos` es {id: nivel base}; vende más los fines de semana. Los `cierres` van en 0."""
    dias = (hasta - desde).days + 1
    series = []
    for producto_id, nivel in productos.items():
        filas = []
        for i in range(dias):
            dia = desde + timedelta(days=i)
            # Depende de la fecha y no de la posición en la ventana: el mismo día vale lo mismo en cualquier rango.
            unidades = 0 if dia in cierres else nivel + (4 if dia.weekday() >= 4 else 0) + (dia.toordinal() * 7 + nivel) % 3
            filas.append((dia, unidades))
        series.append(ProductoSerie(producto_id, filas))
    return SerieVentas(series, ultimo_evento_en or datetime.combine(hasta, datetime.min.time(), tzinfo=timezone.utc))


class SeriesFalsas:
    """FuenteSeries de prueba. `respuesta` es una función (desde, hasta) -> SerieVentas, o una excepción a lanzar."""

    def __init__(self, respuesta):
        self.respuesta = respuesta
        self.llamadas: list[tuple[str, str, date, date]] = []

    def ventas_diarias(self, empresa_id, local_id, desde, hasta):
        self.llamadas.append((empresa_id, local_id, desde, hasta))
        if isinstance(self.respuesta, Exception):
            raise self.respuesta
        return self.respuesta(desde, hasta)


def series_normales(cierres=(date(2025, 12, 25),), **kw) -> SeriesFalsas:
    """A y B venden todos los días de la ventana; C no vende nunca (ms-analítica ni lo lista)."""
    return SeriesFalsas(lambda d, h: serie_sintetica({PRODUCTO_A: 20, PRODUCTO_B: 8}, d, h, cierres, **kw))


def series_caidas() -> SeriesFalsas:
    return SeriesFalsas(FuenteNoDisponible("ConnectError al llamar a ms-analítica"))


def series_con_formato_roto() -> SeriesFalsas:
    return SeriesFalsas(RespuestaInvalida("KeyError: 'productos'"))


def contenedor_de_prueba(engine, tmp_path, *, series=None, reloj=None, modelos=None, bd_responde=True, repositorio=True):
    raiz = tmp_path if repositorio else tmp_path / "no-existe"
    return Contenedor(
        almacen=AlmacenLocal(raiz),
        sonda_bd=SondaFalsa(bd_responde),
        series=series or series_normales(),
        registro=RegistroEjecucionesSql(engine),
        modelos=modelos or SinModelos(),
        reloj=reloj or RelojFijo(),
        parametros=PARAMETROS,
    )


def id_nuevo() -> str:
    return str(uuid.uuid4())
