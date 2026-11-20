import json
import uuid

import pytest
import skops.io as sio

from rc_pronostico import artefacto as art
from rc_pronostico.artefacto import ErrorArtefacto, cargar, cargar_version, publicar, raiz_local, uuid_v7
from rc_pronostico.pronosticar import pronosticar

from conftest import CAL, peticion


def publicar_ok(raiz, modelos, version=None, aprobado=True, local="aurea"):
    p50, p90, cod = modelos
    ficha = {"modelo_version": uuid_v7() if version is None else version, "algoritmo": "test"}
    return publicar(raiz, local, p50, p90, cod, ficha, aprobado)


def test_uuid_v7():
    u = uuid.UUID(uuid_v7(1_700_000_000_123))
    assert u.version == 7 and u.variant == uuid.RFC_4122
    assert u.int >> 80 == 1_700_000_000_123                        # los primeros 48 bits son los ms
    a, b = uuid_v7(1000), uuid_v7(2000)
    assert a < b and uuid_v7(1000) != a                            # ordenados por tiempo, con azar


def test_publicar_y_cargar_ida_y_vuelta(tmp_path, modelos, historial):
    r = publicar_ok(tmp_path, modelos)
    assert r["estado"] == "vigente"
    a = cargar(tmp_path, "aurea")
    assert a.ficha["modelo_version"] == r["modelo_version"] and a.ficha["sha256_modelo"] == r["sha256"]
    pet = peticion(historial, ["a", "b"])
    antes = pronosticar(historial, CAL, pet, a).predicciones
    p50, p90, cod = modelos
    import numpy as np
    from rc_pronostico.variables import LISTA_VARIABLES, filas_prediccion
    X = filas_prediccion(historial, CAL, pet, cod)[LISTA_VARIABLES]
    assert np.array_equal(a.p50.predict(X), p50.predict(X)) and np.array_equal(a.p90.predict(X), p90.predict(X))
    assert a.codigos == cod and len(antes) == 14


def test_la_ficha_lleva_lo_que_pide_el_contrato(tmp_path, modelos):
    r = publicar_ok(tmp_path, modelos)
    ficha = json.loads((tmp_path / "modelos" / "aurea" / r["modelo_version"] / "ficha.json").read_text(encoding="utf-8"))
    for campo in ("modelo_version", "local_id", "variables", "version_variables", "versiones", "sha256_modelo", "aprobado_puerta"):
        assert campo in ficha
    assert {"python", "scikit_learn", "numpy"} <= set(ficha["versiones"])


def test_version_existente_se_rechaza_y_no_cambia(tmp_path, modelos):
    r = publicar_ok(tmp_path, modelos, version="v1")
    antes = (tmp_path / "modelos" / "aurea" / "v1" / "modelo.skops").read_bytes()
    with pytest.raises(ErrorArtefacto, match="ya existe"):
        publicar_ok(tmp_path, modelos, version="v1")
    assert (tmp_path / "modelos" / "aurea" / "v1" / "modelo.skops").read_bytes() == antes
    assert r["modelo_version"] == "v1"


def test_candidato_no_mueve_el_puntero(tmp_path, modelos):
    bueno = publicar_ok(tmp_path, modelos, version="bueno")
    puntero = tmp_path / "modelos" / "aurea" / "vigente.json"
    antes = puntero.read_bytes()
    malo = publicar_ok(tmp_path, modelos, version="malo", aprobado=False)
    assert malo["estado"] == "candidato" and puntero.read_bytes() == antes
    assert cargar(tmp_path, "aurea").ficha["modelo_version"] == "bueno" == bueno["modelo_version"]
    assert (tmp_path / "modelos" / "aurea" / "malo" / "modelo.skops").exists()    # queda en el repositorio


def test_primer_candidato_sin_vigente_no_se_carga(tmp_path, modelos):
    publicar_ok(tmp_path, modelos, version="solo-candidato", aprobado=False)
    with pytest.raises(ErrorArtefacto):
        cargar(tmp_path, "aurea")


def test_byte_alterado_se_rechaza_antes_de_cargar(tmp_path, modelos, monkeypatch):
    r = publicar_ok(tmp_path, modelos)
    archivo = tmp_path / "modelos" / "aurea" / r["modelo_version"] / "modelo.skops"
    datos = bytearray(archivo.read_bytes()); datos[len(datos) // 2] ^= 1
    archivo.write_bytes(bytes(datos))
    def no_debe_cargar(*a, **k): raise AssertionError("se llamó a skops con un archivo alterado")
    monkeypatch.setattr(art.sio, "load", no_debe_cargar)
    with pytest.raises(ErrorArtefacto, match="SHA-256"):
        cargar(tmp_path, "aurea")


def test_puntero_con_sha_distinto_se_rechaza(tmp_path, modelos):
    publicar_ok(tmp_path, modelos)
    puntero = tmp_path / "modelos" / "aurea" / "vigente.json"
    v = json.loads(puntero.read_text(encoding="utf-8")); v["sha256"] = "0" * 64
    puntero.write_text(json.dumps(v), encoding="utf-8")
    with pytest.raises(ErrorArtefacto, match="SHA-256"):
        cargar(tmp_path, "aurea")


def test_version_distinta_de_scikit_learn_se_rechaza(tmp_path, modelos):
    r = publicar_ok(tmp_path, modelos)
    ruta = tmp_path / "modelos" / "aurea" / r["modelo_version"] / "ficha.json"
    f = json.loads(ruta.read_text(encoding="utf-8")); f["versiones"]["scikit_learn"] = "0.0.1"
    ruta.write_text(json.dumps(f), encoding="utf-8")
    with pytest.raises(ErrorArtefacto, match="scikit-learn"):
        cargar(tmp_path, "aurea")


def test_variables_distintas_se_rechazan(tmp_path, modelos):
    r = publicar_ok(tmp_path, modelos)
    ruta = tmp_path / "modelos" / "aurea" / r["modelo_version"] / "ficha.json"
    f = json.loads(ruta.read_text(encoding="utf-8")); f["version_variables"] = "0"
    ruta.write_text(json.dumps(f), encoding="utf-8")
    with pytest.raises(ErrorArtefacto, match="variables"):
        cargar(tmp_path, "aurea")


def test_tipo_no_confiable_se_rechaza_aunque_la_huella_cuadre(tmp_path, modelos):
    r = publicar_ok(tmp_path, modelos)
    carpeta = tmp_path / "modelos" / "aurea" / r["modelo_version"]

    class Intruso: pass
    sio.dump({"p50": Intruso(), "p90": Intruso(), "codigos_producto": {}}, carpeta / "modelo.skops")
    f = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
    f["sha256_modelo"] = art.sha256_archivo(carpeta / "modelo.skops")        # el atacante también arregla la ficha
    (carpeta / "ficha.json").write_text(json.dumps(f), encoding="utf-8")
    with pytest.raises(ErrorArtefacto, match="skops rechazó"):
        cargar_version(tmp_path, "aurea", r["modelo_version"])


@pytest.mark.parametrize("malo", ["../otro", "a/b", "..", ".oculto", "a\\b", ""])
def test_no_se_sale_del_repositorio(tmp_path, modelos, malo):
    with pytest.raises(ErrorArtefacto):
        cargar_version(tmp_path, malo, "v1")
    with pytest.raises(ErrorArtefacto):
        publicar_ok(tmp_path, modelos, version=malo)


def test_raices(tmp_path):
    assert raiz_local(f"file://{tmp_path.as_posix()}") == tmp_path or raiz_local(f"file:///{tmp_path.as_posix()}") == tmp_path
    assert raiz_local(str(tmp_path)) == tmp_path
    with pytest.raises(NotImplementedError):
        raiz_local("gs://bucket/modelos")


def test_el_puntero_se_escribe_sin_dejar_temporales(tmp_path, modelos):
    publicar_ok(tmp_path, modelos)
    assert not list((tmp_path / "modelos" / "aurea").glob("*.tmp"))
