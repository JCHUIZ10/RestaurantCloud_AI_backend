from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import ValidationError

from app.api.dependencias import contenedor
from app.api.errores import traducir
from app.api.esquemas import PronosticoEntrada
from app.api.vistas import vista_ejecucion
from app.casos_de_uso.consultar_ejecucion import consultar_ejecucion
from app.casos_de_uso.contenedor import Contenedor
from app.casos_de_uso.generar_pronostico import generar_pronostico
from app.dominio.errores import ErrorCasoDeUso
from app.soporte.firma import verificar_firma
from app.soporte.respuestas import ErrorApi, respuesta_ok

router = APIRouter(prefix="/interno", tags=["interno"])


@router.post("/pronosticos")
def crear_pronostico(cuerpo: bytes = Depends(verificar_firma), c: Contenedor = Depends(contenedor)):
    """Pronostica los platos pedidos de un local, guarda la ejecución y la devuelve.

    201 si es nueva; 200 si es el reintento de un `solicitud_id` ya completado (misma ejecución).
    La firma se comprueba antes de validar el cuerpo.
    """
    try:
        entrada = PronosticoEntrada.model_validate_json(cuerpo)
    except ValidationError as error:
        campos = [{"campo": ".".join(str(p) for p in e["loc"]), "motivo": e["msg"]} for e in error.errors()]
        raise ErrorApi(422, "ERR_VALIDACION", "Los datos enviados no son válidos.", {"campos": campos}) from None

    try:
        resultado = generar_pronostico(
            entrada.a_solicitud(), series=c.series, registro=c.registro, modelos=c.modelos, reloj=c.reloj,
            parametros=c.parametros,
        )
    except ErrorCasoDeUso as error:
        raise traducir(error) from None
    return respuesta_ok(vista_ejecucion(resultado, c.parametros.zona_horaria), 201 if resultado.nueva else 200)


@router.get("/pronosticos/{ejecucion_id}", dependencies=[Depends(verificar_firma)])
def obtener_pronostico(ejecucion_id: UUID, empresa_id: UUID, local_id: UUID, c: Contenedor = Depends(contenedor)):
    """Recupera una ejecución guardada. Si es de otro local o empresa, responde 404 como si no existiera."""
    try:
        resultado = consultar_ejecucion(
            str(ejecucion_id), str(empresa_id), str(local_id), registro=c.registro, parametros=c.parametros
        )
    except ErrorCasoDeUso as error:
        raise traducir(error) from None
    return respuesta_ok(vista_ejecucion(resultado, c.parametros.zona_horaria))
