"""Cuerpo de POST /interno/pronosticos (ficha, sección 3)."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, StrictInt, field_validator

from app.aplicacion.tipos import ProductoPedido, SolicitudPronostico


class ProductoEntrada(BaseModel):
    producto_id: UUID
    nombre: str = Field(min_length=1, max_length=150)


class PronosticoEntrada(BaseModel):
    solicitud_id: UUID
    empresa_id: UUID
    local_id: UUID
    solicitada_por: UUID
    jornada_actual: date
    fecha_inicio: date | None = None
    horizonte_dias: StrictInt = Field(ge=1, le=7)
    productos: list[ProductoEntrada] = Field(min_length=1, max_length=500)
    dias_cerrados: list[date] = Field(default_factory=list, max_length=60)

    @field_validator("productos")
    @classmethod
    def _sin_repetidos(cls, productos: list[ProductoEntrada]) -> list[ProductoEntrada]:
        ids = [p.producto_id for p in productos]
        if len(set(ids)) != len(ids):
            raise ValueError("hay productos repetidos")
        return productos

    def a_solicitud(self) -> SolicitudPronostico:
        return SolicitudPronostico(
            solicitud_id=str(self.solicitud_id),
            empresa_id=str(self.empresa_id),
            local_id=str(self.local_id),
            solicitada_por=str(self.solicitada_por),
            jornada_actual=self.jornada_actual,
            fecha_inicio=self.fecha_inicio,
            horizonte_dias=self.horizonte_dias,
            productos=tuple(ProductoPedido(str(p.producto_id), p.nombre) for p in self.productos),
            dias_cerrados=tuple(self.dias_cerrados),
        )
