"""Qué hacer con cada evento que llega del núcleo (doc-2u/servicios/ms-analitica.md, sección 2)."""

import json
from typing import Literal

from pydantic import BaseModel, ValidationError
from sqlalchemy import Connection

from app.datos import anulaciones, ventas
from app.datos.eventos import registrar_evento_procesado
from app.dominio.eventos import (
    MODELOS_V1,
    VERSION_SOPORTADA,
    ComprobanteAnulado,
    PedidoAnulado,
    Sobre,
    VentaRegistrada,
)

Resultado = Literal["aceptado", "duplicado"]


class EventoInvalido(Exception):
    """El sobre o los datos no cumplen el contrato: es un error del emisor y reintentar no lo arregla."""

    def __init__(self, mensaje: str, campos: list[dict] | None = None):
        super().__init__(mensaje)
        self.campos = campos or []


def _campos(error: ValidationError) -> list[dict]:
    return [{"campo": ".".join(str(p) for p in e["loc"]), "motivo": e["msg"]} for e in error.errors()]


def interpretar(cuerpo: bytes) -> tuple[Sobre, BaseModel | None]:
    """Valida el sobre y los datos. Devuelve `(sobre, None)` si el tipo de evento no lo usa este servicio."""
    try:
        sobre = Sobre.model_validate(json.loads(cuerpo))
    except json.JSONDecodeError:
        raise EventoInvalido("El cuerpo no es un JSON válido.") from None
    except ValidationError as error:
        raise EventoInvalido("El sobre del evento no es válido.", _campos(error)) from None

    modelo = MODELOS_V1.get(sobre.tipo)
    if modelo is None:
        return sobre, None
    if sobre.version != VERSION_SOPORTADA:
        raise EventoInvalido(f"La versión {sobre.version} de {sobre.tipo} no está soportada.")
    try:
        return sobre, modelo.model_validate(sobre.datos)
    except ValidationError as error:
        raise EventoInvalido(f"Los datos de {sobre.tipo} no son válidos.", _campos(error)) from None


def procesar(conexion: Connection, sobre: Sobre, datos: BaseModel) -> Resultado:
    """Aplica el evento y lo registra como procesado, en la transacción de `conexion`."""
    if not registrar_evento_procesado(conexion, sobre.id, sobre.tipo):
        return "duplicado"

    if isinstance(datos, VentaRegistrada):
        _venta_registrada(conexion, sobre, datos)
    elif isinstance(datos, ComprobanteAnulado):
        _comprobante_anulado(conexion, sobre, datos)
    elif isinstance(datos, PedidoAnulado):
        anulaciones.insertar_anulacion(conexion, sobre.empresa_id, sobre.local_id, datos.model_dump())
    return "aceptado"


def _venta_registrada(conexion: Connection, sobre: Sobre, datos: VentaRegistrada) -> None:
    ventas.bloquear_comprobante(conexion, datos.comprobante_id)
    # Si la anulación llegó antes que la venta, la venta entra ya anulada y no suma a la serie.
    anulada_en = ventas.tomar_anulacion_pendiente(conexion, datos.comprobante_id)

    insertada = ventas.insertar_venta(
        conexion, sobre.empresa_id, sobre.local_id, datos.model_dump(exclude={"items"}), anulada_en
    )
    if not insertada:
        return  # el mismo comprobante llegó en otro evento: no se duplica

    items = [item.model_dump() for item in datos.items]
    ventas.insertar_items(conexion, sobre.local_id, datos.comprobante_id, datos.fecha_operativa, items)
    totales = ventas.totales_de_items(items)
    ventas.registrar_productos_vistos(conexion, sobre.empresa_id, sobre.local_id, datos.fecha_operativa, totales)

    if anulada_en is None:
        ventas.sumar_al_agregado_diario(
            conexion, sobre.empresa_id, sobre.local_id, datos.fecha_operativa, totales, signo=1
        )
    else:
        ventas.borrar_anulacion_pendiente(conexion, datos.comprobante_id)


def _comprobante_anulado(conexion: Connection, sobre: Sobre, datos: ComprobanteAnulado) -> None:
    ventas.bloquear_comprobante(conexion, datos.comprobante_id)

    jornada = ventas.marcar_venta_anulada(
        conexion, sobre.empresa_id, sobre.local_id, datos.comprobante_id, datos.fecha
    )
    if jornada is not None:
        totales = ventas.totales_de_la_venta(conexion, sobre.local_id, datos.comprobante_id)
        ventas.sumar_al_agregado_diario(conexion, sobre.empresa_id, sobre.local_id, jornada, totales, signo=-1)
    elif not ventas.existe_venta(conexion, sobre.empresa_id, sobre.local_id, datos.comprobante_id):
        # La venta aún no llegó (los eventos pueden llegar desordenados): se guarda para aplicarla después.
        ventas.guardar_anulacion_pendiente(conexion, datos.comprobante_id, datos.fecha)
    # Si la venta ya estaba anulada, no hay nada más que hacer.
