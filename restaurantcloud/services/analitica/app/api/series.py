from datetime import date
from typing import Annotated
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query

from app.config import get_settings
from app.datos import series as datos_series
from app.datos.db import transaccion
from app.dominio.series import RangoInvalido, validar_rango
from app.soporte.firma import verificar_firma
from app.soporte.respuestas import ErrorApi, respuesta_ok

router = APIRouter(prefix="/interno", tags=["interno"], dependencies=[Depends(verificar_firma)])


@router.get("/series/ventas-diarias")
def ventas_diarias(
    empresa_id: UUID,
    local_id: UUID,
    desde: date,
    hasta: date,
    producto_ids: Annotated[list[UUID] | None, Query()] = None,
):
    """Unidades vendidas por jornada y producto de un local (para ms-pronóstico).

    La firma cubre la cadena de consulta completa. `producto_ids` se repite por cada producto:
    `?producto_ids=a&producto_ids=b`.
    """
    try:
        validar_rango(desde, hasta)
    except RangoInvalido as error:
        raise ErrorApi(422, "ERR_RANGO_INVALIDO", str(error), {"desde": str(desde), "hasta": str(hasta)}) from None

    with transaccion() as conexion:
        productos = datos_series.ventas_diarias(conexion, empresa_id, local_id, desde, hasta, producto_ids)
        ultimo = datos_series.ultimo_evento_en(conexion, empresa_id, local_id)

    zona = ZoneInfo(get_settings().zona_horaria)
    return respuesta_ok(
        {
            "local_id": str(local_id),
            "desde": desde.isoformat(),
            "hasta": hasta.isoformat(),
            "ultimo_evento_en": ultimo.astimezone(zona).isoformat(timespec="seconds") if ultimo else None,
            "productos": [
                {
                    "producto_id": str(p.producto_id),
                    "nombre": p.nombre,
                    "categoria_nombre": p.categoria_nombre,
                    "primera_venta": p.primera_venta.isoformat(),
                    "serie": [
                        {"fecha": punto.fecha.isoformat(), "unidades": punto.unidades, "ingreso": float(punto.ingreso)}
                        for punto in p.serie
                    ],
                }
                for p in productos
            ],
        }
    )
