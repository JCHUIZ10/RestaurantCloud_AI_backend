"""ModelosVigentes que nunca tiene modelo: todo se pronostica con el baseline. Sirve para pruebas y para
desplegar sin repositorio de modelos."""

from datetime import datetime, timezone

from app.aplicacion.tipos import EstadoModelo, ModeloEnUso


class SinModelos:
    def obtener(self, empresa_id: str, local_id: str) -> ModeloEnUso | None:
        return None

    def estado(self, empresa_id: str, local_id: str) -> EstadoModelo:
        return EstadoModelo(None, datetime.now(timezone.utc), None)
