"""Caso de uso: recuperar una ejecución guardada (ficha, GET /interno/pronosticos/{id})."""

from app.aplicacion.puertos import RegistroEjecuciones
from app.aplicacion.tipos import ParametrosPronostico, ResultadoPronostico
from app.dominio.advertencias import advertencias
from app.aplicacion.errores import ErrorNoEncontrado


def consultar_ejecucion(
    ejecucion_id: str, empresa_id: str, local_id: str, *, registro: RegistroEjecuciones, parametros: ParametrosPronostico
) -> ResultadoPronostico:
    ejecucion = registro.obtener(ejecucion_id, empresa_id, local_id)
    if ejecucion is None:
        # No se distingue «no existe» de «es de otro local» para no revelar que existe.
        raise ErrorNoEncontrado("La ejecución no existe.")
    return ResultadoPronostico(
        ejecucion,
        advertencias(ejecucion.datos_actualizados_hasta, ejecucion.datos_hasta, parametros.zona_horaria),
        nueva=False,
    )
