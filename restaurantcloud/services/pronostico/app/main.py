from fastapi import FastAPI

from app.api import pronosticos, salud
from app.casos_de_uso.contenedor import Contenedor
from app.composicion import construir_contenedor
from app.config import get_settings
from app.soporte.logs import configurar_logs
from app.soporte.request_id import RequestIdMiddleware
from app.soporte.respuestas import registrar_manejadores


def crear_app(contenedor: Contenedor | None = None) -> FastAPI:
    configurar_logs()
    app = FastAPI(
        title="ms-pronostico",
        version="0.1.0",
        description="Pronóstico de demanda por plato de RestaurantCloud.",
    )
    app.state.contenedor = contenedor or construir_contenedor(get_settings())
    app.add_middleware(RequestIdMiddleware)
    registrar_manejadores(app)
    app.include_router(salud.router)
    app.include_router(pronosticos.router)
    return app


app = crear_app()
