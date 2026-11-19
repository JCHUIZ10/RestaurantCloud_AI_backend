"""Lo que el generador necesita saber del local: su carta, sus mozos y sus promociones.

La entrega el núcleo con `php artisan carta:exportar` (ver el README del servicio).
"""

from datetime import time
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ProductoCarta(BaseModel):
    producto_id: UUID
    nombre: str
    categoria_id: UUID | None = None
    categoria_nombre: str
    precio: Decimal
    costo_estandar: Decimal = Decimal(0)


class MozoCarta(BaseModel):
    id: UUID
    nombre: str


class PromocionCarta(BaseModel):
    id: UUID
    tipo_descuento: Literal["porcentaje", "monto_fijo"]
    valor: Decimal
    dias_semana: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 6, 7])  # 1 = lunes … 7 = domingo
    hora_inicio: time | None = None
    hora_fin: time | None = None
    monto_minimo_consumo: Decimal = Decimal(0)


class Carta(BaseModel):
    empresa_id: UUID
    local_id: UUID
    productos: list[ProductoCarta] = Field(min_length=1)
    mozos: list[MozoCarta] = Field(min_length=1)
    promociones: list[PromocionCarta] = Field(default_factory=list)
