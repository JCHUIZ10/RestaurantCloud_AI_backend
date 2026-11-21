from fastapi import Request

from app.casos_de_uso.contenedor import Contenedor


def contenedor(request: Request) -> Contenedor:
    return request.app.state.contenedor
