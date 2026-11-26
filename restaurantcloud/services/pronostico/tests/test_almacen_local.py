import pytest

from app.adaptadores.almacenamiento.local import AlmacenLocal
from app.aplicacion.puertos import ErrorAlmacen
from app.composicion import crear_almacen


def test_lee_los_bytes_de_una_ruta_relativa(tmp_path):
    (tmp_path / "modelos" / "local-1").mkdir(parents=True)
    (tmp_path / "modelos" / "local-1" / "vigente.json").write_bytes(b'{"modelo_version":"v1"}')

    assert AlmacenLocal(tmp_path).leer("modelos/local-1/vigente.json") == b'{"modelo_version":"v1"}'


def test_un_archivo_que_no_existe_es_un_error_del_almacen(tmp_path):
    with pytest.raises(ErrorAlmacen):
        AlmacenLocal(tmp_path).leer("modelos/local-1/vigente.json")


@pytest.mark.parametrize("ruta", ["../secreto.txt", "modelos/../../secreto.txt", "/etc/passwd", "C:/Windows/win.ini"])
def test_no_se_puede_salir_de_la_raiz_del_repositorio(tmp_path, ruta):
    (tmp_path.parent / "secreto.txt").write_text("no debe leerse")

    with pytest.raises(ErrorAlmacen):
        AlmacenLocal(tmp_path / "repositorio").leer(ruta)


def test_disponible_solo_si_la_raiz_es_una_carpeta(tmp_path):
    (tmp_path / "archivo").write_text("x")

    assert AlmacenLocal(tmp_path).disponible() is True
    assert AlmacenLocal(tmp_path / "no-existe").disponible() is False
    assert AlmacenLocal(tmp_path / "archivo").disponible() is False


def test_file_uri_elige_el_almacen_local(tmp_path):
    almacen = crear_almacen(tmp_path.as_uri())

    assert isinstance(almacen, AlmacenLocal)
    assert almacen.disponible() is True
