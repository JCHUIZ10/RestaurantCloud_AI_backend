"""Único lugar que conoce los adaptadores concretos y los entrega a la aplicación."""

from rc_pronostico.artefacto import raiz_local

from app.adaptadores.almacenamiento.gcs import AlmacenGcs, parsear_uri_gcs
from app.adaptadores.almacenamiento.local import AlmacenLocal
from app.adaptadores.clientes.analitica import AnaliticaHttp
from app.adaptadores.bd.conexion import SondaBdSql, get_engine
from app.adaptadores.bd.ejecuciones import RegistroEjecucionesSql
from app.adaptadores.bd.modelos import RegistroModelosSql
from app.adaptadores.reloj import RelojSistema
from app.aplicacion.contenedor import Contenedor
from app.aplicacion.servicios.proveedor_modelos import ProveedorModelos
from app.aplicacion.puertos import AlmacenArtefactos
from app.aplicacion.tipos import ParametrosPronostico
from app.config import Settings


def crear_almacen(
    uri: str,
    *,
    gcs_anonimo: bool = False,
    gcs_timeout: float = 10.0,
) -> AlmacenArtefactos:
    """Elige el adaptador según el esquema de `MODELOS_REPOSITORIO`."""
    if uri.startswith("gs://"):
        bucket, prefijo = parsear_uri_gcs(uri)
        return AlmacenGcs(bucket, prefijo, anonimo=gcs_anonimo, timeout=gcs_timeout)
    return AlmacenLocal(raiz_local(uri))


def construir_contenedor(settings: Settings) -> Contenedor:
    engine = get_engine()
    almacen = crear_almacen(
        settings.modelos_repositorio,
        gcs_anonimo=settings.modelos_gcs_anonimo,
        gcs_timeout=settings.modelos_gcs_timeout_segundos,
    )
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
