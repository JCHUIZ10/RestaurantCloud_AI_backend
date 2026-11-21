from fastapi import Request

from app.aplicacion.contenedor import Contenedor


def contenedor(request: Request) -> Contenedor:
    return request.app.state.contenedor
