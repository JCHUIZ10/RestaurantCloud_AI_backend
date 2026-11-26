import pytest
from google.api_core.exceptions import GoogleAPIError, NotFound

from app.adaptadores.almacenamiento.gcs import AlmacenGcs, parsear_uri_gcs
from app.aplicacion.puertos import ErrorAlmacen, RutaInexistente
from app.composicion import crear_almacen


class _FakeBlob:
    def __init__(self, claves: dict[str, bytes | Exception], clave: str):
        self._claves = claves
        self._clave = clave

    def download_as_bytes(self, timeout: float = 10.0) -> bytes:
        valor = self._claves.get(self._clave)
        if valor is None:
            raise NotFound(f"No existe {self._clave}")
        if isinstance(valor, Exception):
            raise valor
        return valor


class _FakeBucket:
    def __init__(self, claves: dict[str, bytes | Exception]):
        self._claves = claves

    def blob(self, clave: str) -> _FakeBlob:
        return _FakeBlob(self._claves, clave)


class _FakeClient:
    def __init__(
        self,
        claves: dict[str, bytes | Exception] | None = None,
        *,
        error_list: Exception | None = None,
    ):
        self._claves = claves or {}
        self._error_list = error_list
        self.ultima_consulta_list: dict | None = None

    def bucket(self, nombre: str) -> _FakeBucket:
        return _FakeBucket(self._claves)

    def list_blobs(self, bucket: str, prefix: str | None = None, max_results: int = 1, timeout: float = 10.0):
        self.ultima_consulta_list = {
            "bucket": bucket,
            "prefix": prefix,
            "max_results": max_results,
            "timeout": timeout,
        }
        if self._error_list is not None:
            raise self._error_list
        return iter([])


def test_parsea_uri_gcs_con_y_sin_prefijo():
    assert parsear_uri_gcs("gs://rc-modelos-demo-aurea") == ("rc-modelos-demo-aurea", "")
    assert parsear_uri_gcs("gs://rc-modelos-demo-aurea/") == ("rc-modelos-demo-aurea", "")
    assert parsear_uri_gcs("gs://rc-modelos-demo-aurea/qa/v1/") == ("rc-modelos-demo-aurea", "qa/v1")


@pytest.mark.parametrize("uri", ["gs://", "https://storage.googleapis.com/bucket", "file:///repo"])
def test_rechaza_uris_gcs_invalidas(uri):
    with pytest.raises(ValueError):
        parsear_uri_gcs(uri)


def test_lee_bytes_con_y_sin_prefijo():
    cliente = _FakeClient(
        {
            "modelos/local-1/vigente.json": b'{"modelo_version":"v1"}',
            "qa/modelos/local-1/vigente.json": b'{"modelo_version":"v2"}',
        }
    )

    assert AlmacenGcs("mi-bucket", client=cliente).leer("modelos/local-1/vigente.json") == b'{"modelo_version":"v1"}'
    assert (
        AlmacenGcs("mi-bucket", "qa", client=cliente).leer("modelos/local-1/vigente.json")
        == b'{"modelo_version":"v2"}'
    )


def test_objeto_inexistente_lanza_ruta_inexistente():
    cliente = _FakeClient()

    with pytest.raises(RutaInexistente):
        AlmacenGcs("mi-bucket", client=cliente).leer("modelos/local-1/vigente.json")


def test_error_de_api_lanza_error_almacen():
    cliente = _FakeClient({"modelos/local-1/vigente.json": GoogleAPIError("timeout")})

    with pytest.raises(ErrorAlmacen):
        AlmacenGcs("mi-bucket", client=cliente).leer("modelos/local-1/vigente.json")


@pytest.mark.parametrize(
    "ruta",
    [
        "",
        "../secreto.txt",
        "modelos/../../secreto.txt",
        "/etc/passwd",
        "C:/Windows/win.ini",
        r"modelos\local-1\vigente.json",
    ],
)
def test_rechaza_rutas_fuera_del_repositorio(ruta):
    cliente = _FakeClient()

    with pytest.raises(ErrorAlmacen):
        AlmacenGcs("mi-bucket", client=cliente).leer(ruta)


def test_disponible_usa_list_blobs_y_no_lanza():
    cliente_ok = _FakeClient()
    almacen_ok = AlmacenGcs("mi-bucket", "qa", timeout=3.5, client=cliente_ok)
    assert almacen_ok.disponible() is True
    assert cliente_ok.ultima_consulta_list == {
        "bucket": "mi-bucket",
        "prefix": "qa",
        "max_results": 1,
        "timeout": 3.5,
    }

    cliente_fallo = _FakeClient(error_list=GoogleAPIError("sin red"))
    assert AlmacenGcs("mi-bucket", client=cliente_fallo).disponible() is False


def test_gs_uri_elige_el_almacen_gcs():
    almacen = crear_almacen("gs://rc-modelos-demo-aurea/qa", gcs_anonimo=True, gcs_timeout=7.0)

    assert isinstance(almacen, AlmacenGcs)
    assert almacen._bucket == "rc-modelos-demo-aurea"
    assert almacen._prefijo == "qa"
    assert almacen._anonimo is True
    assert almacen._timeout == 7.0
