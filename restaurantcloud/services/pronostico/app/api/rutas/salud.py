from fastapi import APIRouter, Depends

from app.api.dependencias import contenedor
from app.aplicacion.casos_de_uso.consultar_salud import consultar_salud
from app.aplicacion.contenedor import Contenedor
from app.soporte.respuestas import ErrorApi, respuesta_ok

router = APIRouter()


@router.get("/health", tags=["salud"])
def health(c: Contenedor = Depends(contenedor)):
    """Estado del servicio, sin autenticación.

    Sin base no se puede guardar ninguna ejecución: 503. Sin repositorio de modelos sí se puede
    pronosticar (con el último modelo verificado o con el baseline): 200 `degradado`.
    """
    salud = consultar_salud(c.sonda_bd, c.almacen)
    if not salud.bd:
        raise ErrorApi(503, "ERR_BD_NO_DISPONIBLE", "La base de datos no está disponible.")
    return respuesta_ok(
        {
            "estado": salud.estado,
            "servicio": "ms-pronostico",
            "bd": "ok",
            "repositorio": "ok" if salud.repositorio else "no_disponible",
        }
    )
