"""ProveedorModelos con el modelo real publicado por model-ia, copiado a un repositorio temporal que sí se puede alterar."""

import json
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path

import pytest
from rc_pronostico.artefacto import uuid_v7
from sqlalchemy import text

from app.adaptadores.almacenamiento.local import AlmacenLocal
from app.adaptadores.bd.conexion import get_engine
from app.adaptadores.bd.modelos import RegistroModelosSql
from app.aplicacion.casos_de_uso.generar_pronostico import generar_pronostico
from app.aplicacion.servicios.proveedor_modelos import ProveedorModelos
from app.aplicacion.tipos import ProductoPedido, SolicitudPronostico
from tests.ayudas import EMPRESA, HOY, LOCAL, PARAMETROS, RelojFijo, SeriesFalsas, USUARIO, id_nuevo, serie_sintetica
from tests.test_equivalencia_ventana import REPOSITORIO

PUNTERO_REAL = REPOSITORIO / "modelos" / LOCAL / "vigente.json"
pytestmark = pytest.mark.skipif(not PUNTERO_REAL.exists(), reason="No hay modelo publicado en model-ia/repositorio")


class Reloj:
    """Reloj monotónico controlable."""

    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t

    def avanzar(self, segundos):
        self.t += segundos


class AlmacenContador(AlmacenLocal):
    def __init__(self, raiz):
        super().__init__(raiz)
        self.lecturas: list[str] = []

    def leer(self, ruta):
        self.lecturas.append(ruta)
        return super().leer(ruta)

    def veces(self, sufijo):
        return sum(1 for r in self.lecturas if r.endswith(sufijo))


class Repo:
    """Un repositorio temporal con el modelo real publicado y utilidades para alterarlo."""

    def __init__(self, raiz: Path):
        self.raiz = raiz
        self.real = json.loads(PUNTERO_REAL.read_text(encoding="utf-8"))
        self.version = self.real["modelo_version"]
        self.sha = self.real["sha256"]
        self.copiar(self.version, self.version)
        self.apuntar(self.version, self.sha, local=LOCAL)

    def carpeta(self, version, local=LOCAL) -> Path:
        return self.raiz / "modelos" / local / version

    def copiar(self, origen, destino, local=LOCAL, **ficha) -> str:
        """Copia una versión real y le cambia campos de la ficha. Devuelve el nombre de la versión."""
        nueva = self.carpeta(destino, local)
        shutil.copytree(REPOSITORIO / "modelos" / LOCAL / origen, nueva)
        f = json.loads((nueva / "ficha.json").read_text(encoding="utf-8"))
        f.update({"modelo_version": destino, "local_id": local, **ficha})
        (nueva / "ficha.json").write_text(json.dumps(f), encoding="utf-8")
        return destino

    def nueva_version(self, local=LOCAL, **ficha) -> str:
        return self.copiar(self.version, uuid_v7(), local, **ficha)

    def corromper(self, version, local=LOCAL):
        archivo = self.carpeta(version, local) / "modelo.skops"
        datos = bytearray(archivo.read_bytes())
        datos[len(datos) // 2] ^= 0xFF
        archivo.write_bytes(bytes(datos))

    def apuntar(self, version, sha=None, local=LOCAL, **extra):
        puntero = {"modelo_version": version, "sha256": sha or self.sha, "publicado_en": "2026-11-20T20:03:42+00:00", **extra}
        self.escribir_puntero(json.dumps(puntero), local)

    def escribir_puntero(self, contenido: str, local=LOCAL):
        destino = self.raiz / "modelos" / local
        destino.mkdir(parents=True, exist_ok=True)
        (destino / "vigente.json").write_text(contenido, encoding="utf-8")


@pytest.fixture
def repo(tmp_path):
    return Repo(tmp_path / "repo")


@pytest.fixture
def reloj():
    return Reloj()


@pytest.fixture
def almacen(repo):
    return AlmacenContador(repo.raiz)


@pytest.fixture
def proveedor(almacen, reloj):
    return crear_proveedor(almacen, reloj)


def crear_proveedor(almacen, reloj, **kw):
    return ProveedorModelos(
        almacen, RegistroModelosSql(get_engine()), uri_repositorio="file:///repositorio", revisar_cada_segundos=60,
        monotonico=reloj, ahora=lambda: datetime(2026, 11, 20, 20, 0, tzinfo=timezone.utc), **kw,
    )


def registrados(bd):
    return {str(f["id"]): f["estado"] for f in bd.execute(text("SELECT id, estado FROM modelo_version")).mappings()}


# --- Carga y caché ---


def test_la_primera_peticion_carga_verifica_y_registra_el_modelo_como_vigente(proveedor, repo, bd):
    uso = proveedor.obtener(EMPRESA, LOCAL)

    assert uso is not None and uso.modelo_version_id == repo.version
    assert len(uso.artefacto.codigos) == 20  # los platos de ÁUREA
    assert registrados(bd) == {repo.version: "vigente"}
    fila = bd.execute(text("SELECT * FROM modelo_version")).mappings().one()
    assert fila["artefacto_sha256"] == repo.sha and fila["empresa_id"] and fila["version_variables"] == "1"
    assert fila["metricas"]["aprobada"] is True and fila["ficha"]["modelo_version"] == repo.version
    assert fila["artefacto_uri"] == f"file:///repositorio/modelos/{LOCAL}/{repo.version}"


def test_dentro_del_intervalo_no_se_vuelve_a_leer_el_almacen(proveedor, almacen, reloj):
    primero = proveedor.obtener(EMPRESA, LOCAL)
    lecturas = len(almacen.lecturas)

    reloj.avanzar(59)
    segundo = proveedor.obtener(EMPRESA, LOCAL)

    assert segundo is primero or segundo.artefacto is primero.artefacto
    assert len(almacen.lecturas) == lecturas


def test_pasado_el_intervalo_solo_se_relee_el_puntero_y_no_el_modelo(proveedor, almacen, reloj):
    proveedor.obtener(EMPRESA, LOCAL)
    assert almacen.veces("modelo.skops") == 1

    reloj.avanzar(61)
    proveedor.obtener(EMPRESA, LOCAL)

    assert almacen.veces("vigente.json") == 2
    assert almacen.veces("modelo.skops") == 1  # el mismo SHA-256: sigue el modelo de memoria


def test_peticiones_simultaneas_de_un_local_sin_cargar_lo_cargan_una_sola_vez(proveedor, almacen):
    resultados = []
    hilos = [threading.Thread(target=lambda: resultados.append(proveedor.obtener(EMPRESA, LOCAL))) for _ in range(8)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()

    assert len(resultados) == 8 and all(r is not None for r in resultados)
    assert almacen.veces("modelo.skops") == 1


# --- Una versión nueva ---


def test_cuando_el_puntero_cambia_carga_la_nueva_version_y_retira_la_anterior(proveedor, repo, reloj, bd):
    antes = proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    repo.apuntar(nueva)

    reloj.avanzar(61)
    despues = proveedor.obtener(EMPRESA, LOCAL)

    assert antes.modelo_version_id == repo.version and despues.modelo_version_id == nueva
    assert registrados(bd) == {repo.version: "retirado", nueva: "vigente"}
    assert bd.execute(text("SELECT retirado_en FROM modelo_version WHERE id = :i"), {"i": repo.version}).scalar_one() is not None


def test_si_el_puntero_vuelve_a_una_version_anterior_esa_fila_vuelve_a_vigente(proveedor, repo, reloj, bd):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    repo.apuntar(nueva)
    reloj.avanzar(61)
    proveedor.obtener(EMPRESA, LOCAL)

    repo.apuntar(repo.version)  # se revierte la publicación
    reloj.avanzar(61)
    uso = proveedor.obtener(EMPRESA, LOCAL)

    assert uso.modelo_version_id == repo.version
    assert registrados(bd) == {repo.version: "vigente", nueva: "retirado"}
    assert bd.execute(text("SELECT retirado_en FROM modelo_version WHERE id = :i"), {"i": repo.version}).scalar_one() is None


def test_estado_revisa_el_puntero_aunque_no_haya_pasado_el_intervalo(proveedor, repo, reloj):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    repo.apuntar(nueva)
    reloj.avanzar(5)  # muy por debajo de los 60 s

    assert proveedor.obtener(EMPRESA, LOCAL).modelo_version_id == repo.version  # lo usual: todavía el anterior
    estado = proveedor.estado(EMPRESA, LOCAL)

    assert estado.modelo.id == nueva and estado.ultimo_error is None
    assert proveedor.obtener(EMPRESA, LOCAL).modelo_version_id == nueva


# --- Lo que no debe usarse: se sigue con el modelo anterior ---


def test_un_archivo_alterado_en_el_repositorio_se_rechaza_por_su_sha256(proveedor, repo, reloj, bd):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    repo.corromper(nueva)
    repo.apuntar(nueva)

    _sigue_el_modelo_anterior(proveedor, repo, reloj, bd, nueva, "SHA-256")


def _sigue_el_modelo_anterior(proveedor, repo, reloj, bd, nueva, contiene):
    reloj.avanzar(61)
    uso = proveedor.obtener(EMPRESA, LOCAL)
    estado = proveedor.estado(EMPRESA, LOCAL)
    assert uso.modelo_version_id == repo.version and estado.modelo.id == repo.version
    assert contiene in estado.ultimo_error and nueva in estado.ultimo_error
    assert registrados(bd) == {repo.version: "vigente"}


@pytest.mark.parametrize(
    ("cambios", "mensaje"),
    [
        ({"aprobado_puerta": False}, "puerta de calidad"),
        ({"local_id": "00000000-0000-4000-8000-000000000011"}, "ficha es del local"),
        ({"versiones": {"scikit_learn": "1.3.0", "python": "3.12.10", "numpy": "2.5.5", "skops": "0.13.0"}}, "scikit-learn"),
        ({"version_variables": "2"}, "variables"),
        ({"variables": ["dia_semana"]}, "variables"),
    ],
)
def test_una_ficha_que_no_corresponde_se_rechaza_y_sigue_el_modelo_anterior(proveedor, repo, reloj, bd, cambios, mensaje):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version(**cambios)
    repo.apuntar(nueva)

    _sigue_el_modelo_anterior(proveedor, repo, reloj, bd, nueva, mensaje)


def test_una_version_cuya_ficha_dice_otro_nombre_se_rechaza(proveedor, repo, reloj, bd):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    otra = uuid_v7()
    f = repo.carpeta(nueva) / "ficha.json"
    f.write_text(json.dumps({**json.loads(f.read_text(encoding="utf-8")), "modelo_version": otra}), encoding="utf-8")
    repo.apuntar(nueva)

    _sigue_el_modelo_anterior(proveedor, repo, reloj, bd, nueva, "la ficha dice la versión")


def test_un_puntero_con_sha256_que_no_coincide_con_el_archivo_se_rechaza(proveedor, repo, reloj, bd):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    repo.apuntar(nueva, sha="0" * 64)

    _sigue_el_modelo_anterior(proveedor, repo, reloj, bd, nueva, "SHA-256")


def test_una_version_que_no_existe_en_el_repositorio_se_rechaza(proveedor, repo, reloj, bd):
    proveedor.obtener(EMPRESA, LOCAL)
    inexistente = uuid_v7()
    repo.apuntar(inexistente)

    _sigue_el_modelo_anterior(proveedor, repo, reloj, bd, inexistente, "No existe")


@pytest.mark.parametrize(
    "puntero",
    [
        "{no es json",
        "[]",
        "{}",
        json.dumps({"modelo_version": "no-es-uuid", "sha256": "a" * 64, "publicado_en": "2026-11-20T20:03:42+00:00"}),
        json.dumps({"modelo_version": "../../etc", "sha256": "a" * 64, "publicado_en": "2026-11-20T20:03:42+00:00"}),
        json.dumps({"modelo_version": uuid_v7(), "sha256": "corto", "publicado_en": "2026-11-20T20:03:42+00:00"}),
        json.dumps({"modelo_version": uuid_v7(), "sha256": "a" * 64, "publicado_en": "ayer"}),
    ],
)
def test_un_puntero_ilegible_o_malformado_no_cambia_el_modelo_en_uso(proveedor, repo, reloj, puntero):
    proveedor.obtener(EMPRESA, LOCAL)
    repo.escribir_puntero(puntero)
    reloj.avanzar(61)

    uso = proveedor.obtener(EMPRESA, LOCAL)
    estado = proveedor.estado(EMPRESA, LOCAL)

    assert uso.modelo_version_id == repo.version
    assert estado.ultimo_error and "vigente.json" in estado.ultimo_error


def test_si_el_puntero_desaparece_se_sigue_con_el_modelo_y_se_avisa(proveedor, repo, reloj):
    proveedor.obtener(EMPRESA, LOCAL)
    (repo.raiz / "modelos" / LOCAL / "vigente.json").unlink()
    reloj.avanzar(61)

    assert proveedor.obtener(EMPRESA, LOCAL).modelo_version_id == repo.version
    assert "ya no existe" in proveedor.estado(EMPRESA, LOCAL).ultimo_error


def test_si_el_repositorio_pierde_la_version_en_uso_sigue_con_la_que_tiene_en_memoria(proveedor, repo, reloj):
    # Distingue el modelo en memoria del recargado desde la versión registrada: aquí no hay de dónde recargar.
    proveedor.obtener(EMPRESA, LOCAL)
    shutil.rmtree(repo.carpeta(repo.version))
    nueva = repo.nueva_version()
    repo.corromper(nueva)
    repo.apuntar(nueva)
    reloj.avanzar(61)

    uso = proveedor.obtener(EMPRESA, LOCAL)

    assert uso is not None and uso.modelo_version_id == repo.version
    assert nueva in proveedor.estado(EMPRESA, LOCAL).ultimo_error


def test_tras_un_reinicio_con_el_puntero_roto_se_usa_la_version_registrada(repo, almacen, reloj, bd):
    crear_proveedor(almacen, reloj).obtener(EMPRESA, LOCAL)  # el proceso anterior cargó y registró el modelo
    repo.escribir_puntero("{roto")  # y después el puntero se dañó

    nuevo = crear_proveedor(almacen, reloj)  # proceso nuevo: sin nada en memoria
    uso = nuevo.obtener(EMPRESA, LOCAL)

    assert uso is not None and uso.modelo_version_id == repo.version
    assert "vigente.json" in nuevo.estado(EMPRESA, LOCAL).ultimo_error


def test_tras_un_reinicio_con_el_repositorio_vacio_se_pronostica_con_el_baseline(repo, almacen, reloj, tmp_path):
    crear_proveedor(almacen, reloj).obtener(EMPRESA, LOCAL)
    vacio = AlmacenContador(tmp_path / "otro-repositorio-vacio")

    nuevo = crear_proveedor(vacio, reloj)

    assert nuevo.obtener(EMPRESA, LOCAL) is None
    assert "Tampoco se pudo cargar la versión registrada" in nuevo.estado(EMPRESA, LOCAL).ultimo_error


def test_un_local_sin_modelo_publicado_no_es_un_error(almacen, reloj, repo):
    local_nuevo = "00000000-0000-4000-8000-0000000000aa"
    proveedor = crear_proveedor(almacen, reloj)

    assert proveedor.obtener(EMPRESA, local_nuevo) is None
    estado = proveedor.estado(EMPRESA, local_nuevo)
    assert estado.modelo is None and estado.ultimo_error is None


def test_no_se_reintenta_en_cada_peticion_un_modelo_que_falla(proveedor, repo, almacen, reloj):
    proveedor.obtener(EMPRESA, LOCAL)
    nueva = repo.nueva_version()
    repo.corromper(nueva)
    repo.apuntar(nueva)
    reloj.avanzar(61)
    proveedor.obtener(EMPRESA, LOCAL)
    lecturas = almacen.veces("modelo.skops")

    for _ in range(20):
        proveedor.obtener(EMPRESA, LOCAL)

    assert almacen.veces("modelo.skops") == lecturas  # esperó otro intervalo en vez de copiar el archivo cada vez


# --- Memoria acotada ---


def test_la_memoria_guarda_como_mucho_n_locales_y_descarta_el_menos_usado(repo, almacen, reloj):
    proveedor = crear_proveedor(almacen, reloj, max_en_memoria=2)
    locales = [f"00000000-0000-4000-8000-0000000000{n}" for n in ("b1", "b2", "b3")]
    for local in locales:
        repo.copiar(repo.version, repo.version, local=local)
        repo.apuntar(repo.version, local=local)

    proveedor.obtener(EMPRESA, locales[0])
    proveedor.obtener(EMPRESA, locales[1])
    proveedor.obtener(EMPRESA, locales[0])  # el primero se usó de nuevo: el segundo pasa a ser el menos usado
    proveedor.obtener(EMPRESA, locales[2])

    assert proveedor.cargados == [locales[0], locales[2]]


# --- De punta a punta con el caso de uso ---


def _solicitud(artefacto) -> tuple[SolicitudPronostico, dict]:
    platos = sorted(artefacto.codigos)
    niveles = {p: 5 + (i * 7) % 25 for i, p in enumerate(platos)}
    return (
        SolicitudPronostico(
            solicitud_id=id_nuevo(), empresa_id=EMPRESA, local_id=LOCAL, solicitada_por=USUARIO, jornada_actual=HOY,
            fecha_inicio=None, horizonte_dias=7, productos=tuple(ProductoPedido(p, f"Plato {i}") for i, p in enumerate(platos)),
            dias_cerrados=(),
        ),
        niveles,
    )


def test_el_pronostico_con_el_modelo_real_usa_metodo_modelo_y_registra_la_version(proveedor, repo, bd):
    from app.adaptadores.bd.ejecuciones import RegistroEjecucionesSql

    solicitud, niveles = _solicitud(proveedor.obtener(EMPRESA, LOCAL).artefacto)
    series = SeriesFalsas(lambda d, h: serie_sintetica(niveles, d, h))

    resultado = generar_pronostico(
        solicitud, series=series, registro=RegistroEjecucionesSql(get_engine()), modelos=proveedor, reloj=RelojFijo(), parametros=PARAMETROS
    )

    e = resultado.ejecucion
    assert e.modelo.modelo_version == repo.version and e.modelo.entrenado_hasta.isoformat() == "2026-11-17"
    assert {p.metodo for p in e.predicciones} == {"modelo"} and len(e.predicciones) == 20 * 7
    assert all(p.p90 >= p.p50 >= 0 for p in e.predicciones)
    assert str(bd.execute(text("SELECT modelo_version_id FROM ejecucion")).scalar_one()) == repo.version


def test_con_el_modelo_roto_el_pronostico_sale_con_el_modelo_anterior_y_no_falla(proveedor, repo, reloj):
    from app.adaptadores.bd.ejecuciones import RegistroEjecucionesSql

    solicitud, niveles = _solicitud(proveedor.obtener(EMPRESA, LOCAL).artefacto)
    nueva = repo.nueva_version()
    repo.corromper(nueva)
    repo.apuntar(nueva)
    reloj.avanzar(61)

    resultado = generar_pronostico(
        solicitud, series=SeriesFalsas(lambda d, h: serie_sintetica(niveles, d, h)),
        registro=RegistroEjecucionesSql(get_engine()), modelos=proveedor, reloj=RelojFijo(), parametros=PARAMETROS,
    )

    assert resultado.ejecucion.modelo.modelo_version == repo.version
    assert {p.metodo for p in resultado.ejecucion.predicciones} == {"modelo"}
