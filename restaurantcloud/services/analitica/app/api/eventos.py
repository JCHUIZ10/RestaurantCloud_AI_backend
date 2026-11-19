from fastapi import APIRouter, Depends

from app.datos.db import transaccion
from app.dominio.procesador import EventoInvalido, interpretar, procesar
from app.soporte.firma import verificar_firma
from app.soporte.respuestas import ErrorApi, respuesta_ok

router = APIRouter(prefix="/interno", tags=["interno"])


@router.post("/eventos")
def recibir_evento(cuerpo: bytes = Depends(verificar_firma)):
    """Recibe un evento del núcleo y lo aplica a los datos de analítica.

    202 `aceptado` si es nuevo, 200 `duplicado` si ya se había procesado y 200 `ignorado` si es de un
    tipo que este servicio no usa (se responde 200 para que el emisor no lo reintente).
    """
    try:
        sobre, datos = interpretar(cuerpo)
    except EventoInvalido as error:
        raise ErrorApi(422, "ERR_EVENTO_INVALIDO", str(error), {"campos": error.campos}) from None

    if datos is None:
        return respuesta_ok({"estado": "ignorado", "evento_id": str(sobre.id)})

    # La transacción termina (commit) antes de responder: un 202 significa que el evento quedó guardado.
    with transaccion() as conexion:
        resultado = procesar(conexion, sobre, datos)

    return respuesta_ok({"estado": resultado, "evento_id": str(sobre.id)}, 202 if resultado == "aceptado" else 200)
