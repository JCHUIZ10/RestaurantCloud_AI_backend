from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.dependencias import contenedor
from app.api.vistas import vista_modelo
from app.casos_de_uso.consultar_modelo_vigente import consultar_modelo_vigente
from app.casos_de_uso.contenedor import Contenedor
from app.soporte.firma import verificar_firma
from app.soporte.respuestas import respuesta_ok

router = APIRouter(prefix="/interno", tags=["interno"], dependencies=[Depends(verificar_firma)])


@router.get("/modelos/vigente")
def modelo_vigente(empresa_id: UUID, local_id: UUID, c: Contenedor = Depends(contenedor)):
    """Modelo que usará el próximo pronóstico del local y con qué métricas pasó la puerta de calidad."""
    estado = consultar_modelo_vigente(str(empresa_id), str(local_id), modelos=c.modelos)
    return respuesta_ok(vista_modelo(estado, str(local_id), c.parametros.zona_horaria))
