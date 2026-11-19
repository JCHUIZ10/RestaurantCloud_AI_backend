"""Sobre común y datos de los eventos que consume ms-analítica (doc-2u/servicios/eventos.md)."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

VERSION_SOPORTADA = 1


class Sobre(BaseModel):
    id: UUID
    tipo: str
    version: int
    ocurrido_en: datetime
    origen: str
    empresa_id: UUID
    local_id: UUID
    datos: dict


class ItemVendido(BaseModel):
    producto_id: UUID
    nombre: str
    categoria_id: UUID | None = None
    categoria_nombre: str | None = None
    cantidad: int = Field(gt=0)
    precio_unitario: Decimal
    subtotal: Decimal
    costo_estandar: Decimal | None = None


class VentaRegistrada(BaseModel):
    comprobante_id: UUID
    pedido_id: UUID
    tipo: Literal["boleta", "factura", "nota_venta"]
    fecha: datetime
    fecha_operativa: date
    mozo_id: UUID
    mozo_nombre: str
    comensales: int | None = None
    medio_pago: Literal["efectivo", "tarjeta", "billetera_digital"]
    subtotal_consumo: Decimal
    descuento: Decimal = Decimal(0)
    monto_recargo: Decimal = Decimal(0)
    total: Decimal
    promocion_id: UUID | None = None
    items: list[ItemVendido] = Field(min_length=1)


class ComprobanteAnulado(BaseModel):
    comprobante_id: UUID
    nota_credito_id: UUID
    fecha: datetime
    motivo_codigo: str
    anulado_por_id: UUID | None = None
    anulado_por_nombre: str | None = None
    total: Decimal


class PedidoAnulado(BaseModel):
    anulacion_id: UUID
    pedido_id: UUID
    pedido_item_id: UUID | None = None
    producto_id: UUID | None = None
    producto_nombre: str | None = None
    cantidad: int
    monto_total: Decimal
    tipo_anulacion: str
    motivo_categoria: str | None = None
    es_merma: bool = False
    costo_merma: Decimal | None = None
    minutos_espera: int | None = None
    mozo_id: UUID | None = None
    mozo_nombre: str | None = None
    anulado_por_id: UUID | None = None
    anulado_por_nombre: str | None = None
    anulado_en: datetime
    fecha_operativa: date


# Tipo de evento → modelo de sus datos (versión 1).
MODELOS_V1: dict[str, type[BaseModel]] = {
    "venta.registrada": VentaRegistrada,
    "comprobante.anulado": ComprobanteAnulado,
    "pedido.anulado": PedidoAnulado,
}
