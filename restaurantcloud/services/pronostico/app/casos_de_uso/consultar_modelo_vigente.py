"""Caso de uso: qué modelo usará el próximo pronóstico de un local (ficha, GET /interno/modelos/vigente)."""

from app.casos_de_uso.puertos import ModelosVigentes
from app.casos_de_uso.tipos import EstadoModelo


def consultar_modelo_vigente(empresa_id: str, local_id: str, *, modelos: ModelosVigentes) -> EstadoModelo:
    """Revisa el puntero en ese momento, sin esperar el intervalo de revisión. Un local sin modelo no es un error."""
    return modelos.estado(empresa_id, local_id)
