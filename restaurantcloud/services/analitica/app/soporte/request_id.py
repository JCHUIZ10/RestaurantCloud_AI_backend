"""X-Request-Id: se conserva el que llega, o se genera uno, y se devuelve en la respuesta."""

import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

CABECERA = "X-Request-Id"

request_id_actual: ContextVar[str | None] = ContextVar("request_id", default=None)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get(CABECERA) or str(uuid.uuid4())
        token = request_id_actual.set(request_id)
        try:
            response = await call_next(request)
        finally:
            request_id_actual.reset(token)
        response.headers[CABECERA] = request_id
        return response
