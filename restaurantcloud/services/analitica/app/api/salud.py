from fastapi import APIRouter
from sqlalchemy import text

from app.datos.db import get_engine
from app.soporte.respuestas import respuesta_ok

router = APIRouter()


@router.get("/health", tags=["salud"])
def health():
    """Estado del servicio. Sin autenticación; comprueba que la base responde."""
    with get_engine().connect() as conexion:
        conexion.execute(text("SELECT 1"))
    return respuesta_ok({"estado": "ok", "servicio": "ms-analitica"})
