"""Único lugar que conoce los adaptadores concretos y los entrega a la aplicación."""

from rc_pronostico.artefacto import raiz_local

from app.adaptadores.almacen_local import AlmacenLocal
from app.adaptadores.analitica_http import AnaliticaHttp
from app.adaptadores.bd.conexion import SondaBdSql, get_engine
from app.adaptadores.bd.ejecuciones import RegistroEjecucionesSql
from app.adaptadores.bd.modelos import RegistroModelosSql
from app.adaptadores.reloj_sistema import RelojSistema
from app.casos_de_uso.contenedor import Contenedor
from app.casos_de_uso.proveedor_modelos import ProveedorModelos
from app.casos_de_uso.puertos import AlmacenArtefactos
from app.casos_de_uso.tipos import ParametrosPronostico
from app.config import Settings


def crear_almacen(uri: str) -> AlmacenArtefactos:
    """Elige el adaptador según el esquema de `MODELOS_REPOSITORIO`."""
    if uri.startswith("gs://"):
        raise RuntimeError("MODELOS_REPOSITORIO con gs:// llega con la etapa 8 (no hay adaptador todavía).")
    return AlmacenLocal(raiz_local(uri))


def construir_contenedor(settings: Settings) -> Contenedor:
    engine = get_engine()
    almacen = crear_almacen(settings.modelos_repositorio)
    return Contenedor(
        almacen=almacen,
        sonda_bd=SondaBdSql(engine),
        series=AnaliticaHttp(settings.analitica_url, settings.analitica_secreto, settings.analitica_timeout_segundos),
        registro=RegistroEjecucionesSql(engine),
        modelos=ProveedorModelos(
            almacen,
            RegistroModelosSql(engine),
            uri_repositorio=settings.modelos_repositorio,
            revisar_cada_segundos=settings.modelos_revisar_segundos,
            max_en_memoria=settings.modelos_max_en_memoria,
        ),
        reloj=RelojSistema(settings.zona_horaria),
        parametros=ParametrosPronostico(settings.ventana_historial_dias, settings.pais_feriados, settings.zona_horaria),
    )
