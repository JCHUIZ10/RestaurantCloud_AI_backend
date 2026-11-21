"""Logs en JSON, una línea por registro, con el X-Request-Id de la petición en curso."""

import json
import logging
import sys
from datetime import UTC, datetime

from app.soporte.request_id import request_id_actual


class FormatoJson(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entrada = {
            "ts": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "nivel": record.levelname,
            "logger": record.name,
            "mensaje": record.getMessage(),
            "request_id": request_id_actual.get(),
        }
        if record.exc_info:
            entrada["excepcion"] = self.formatException(record.exc_info)
        return json.dumps(entrada, ensure_ascii=False)


def configurar_logs() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(FormatoJson())
    raiz = logging.getLogger()
    raiz.handlers = [handler]
    raiz.setLevel(logging.INFO)
    # Uvicorn ya usa el formato de la raíz; su log de accesos duplicaría la información.
    logging.getLogger("uvicorn.access").disabled = True
