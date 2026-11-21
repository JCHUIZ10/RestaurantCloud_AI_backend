from fastapi import FastAPI

from app.api import eventos, reportes, salud, series
from app.soporte.logs import configurar_logs
from app.soporte.request_id import RequestIdMiddleware
from app.soporte.respuestas import registrar_manejadores


def crear_app() -> FastAPI:
    configurar_logs()
    app = FastAPI(
        title="ms-analitica",
        version="0.1.0",
        description="Reportes de ventas y series de demanda de RestaurantCloud.",
    )
    app.add_middleware(RequestIdMiddleware)
    registrar_manejadores(app)
    app.include_router(salud.router)
    app.include_router(eventos.router)
    app.include_router(series.router)
    app.include_router(reportes.router)
    return app


app = crear_app()
