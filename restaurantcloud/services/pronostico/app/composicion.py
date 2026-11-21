"""Único lugar que conoce los adaptadores concretos y los entrega a la aplicación."""

from rc_pronostico.artefacto import raiz_local

from app.adaptadores.almacen_local import AlmacenLocal
from app.adaptadores.bd.conexion import SondaBdSql, get_engine
from app.casos_de_uso.contenedor import Contenedor
from app.casos_de_uso.puertos import AlmacenArtefactos
from app.config import Settings


def crear_almacen(uri: str) -> AlmacenArtefactos:
    """Elige el adaptador según el esquema de `MODELOS_REPOSITORIO`."""
    if uri.startswith("gs://"):
        raise RuntimeError("MODELOS_REPOSITORIO con gs:// llega con la etapa 8 (no hay adaptador todavía).")
    return AlmacenLocal(raiz_local(uri))


def construir_contenedor(settings: Settings) -> Contenedor:
    return Contenedor(almacen=crear_almacen(settings.modelos_repositorio), sonda_bd=SondaBdSql(get_engine()))
