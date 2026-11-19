"""Consultas de la serie de ventas diarias por producto."""

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Connection, text


@dataclass
class PuntoDeSerie:
    fecha: date
    unidades: int
    ingreso: Decimal


@dataclass
class SerieDeProducto:
    producto_id: UUID
    nombre: str
    categoria_nombre: str | None
    primera_venta: date
    serie: list[PuntoDeSerie] = field(default_factory=list)


def ventas_diarias(
    conexion: Connection,
    empresa_id: UUID,
    local_id: UUID,
    desde: date,
    hasta: date,
    producto_ids: list[UUID] | None,
) -> list[SerieDeProducto]:
    """Serie continua por producto: cada jornada entre su primera venta (o `desde`) y `hasta`.

    Las jornadas sin ventas salen con 0, de modo que el modelo no tiene que rellenar huecos.
    Las ventas anuladas ya están descontadas del agregado.
    """
    filtro_productos = "AND producto_id = ANY(:producto_ids)" if producto_ids else ""
    filas = conexion.execute(
        text(
            f"""
            WITH productos AS (
                SELECT producto_id, nombre, categoria_nombre, primera_venta
                FROM producto_visto
                WHERE empresa_id = :empresa_id AND local_id = :local_id
                  AND primera_venta <= :hasta
                  {filtro_productos}
            )
            SELECT p.producto_id, p.nombre, p.categoria_nombre, p.primera_venta,
                   dia.fecha::date AS fecha,
                   COALESCE(v.unidades, 0) AS unidades,
                   COALESCE(v.ingreso, 0)  AS ingreso
            FROM productos p
            CROSS JOIN LATERAL generate_series(
                GREATEST(p.primera_venta, CAST(:desde AS date))::timestamp,
                CAST(:hasta AS date)::timestamp,
                interval '1 day'
            ) AS dia(fecha)
            LEFT JOIN venta_diaria_producto v
                   ON v.local_id = :local_id
                  AND v.empresa_id = :empresa_id
                  AND v.producto_id = p.producto_id
                  AND v.fecha_operativa = dia.fecha::date
            ORDER BY p.nombre, p.producto_id, dia.fecha
            """
        ),
        {
            "empresa_id": empresa_id,
            "local_id": local_id,
            "desde": desde,
            "hasta": hasta,
            **({"producto_ids": producto_ids} if producto_ids else {}),
        },
    ).all()

    series: dict[UUID, SerieDeProducto] = {}
    for fila in filas:
        serie = series.setdefault(
            fila.producto_id,
            SerieDeProducto(fila.producto_id, fila.nombre, fila.categoria_nombre, fila.primera_venta),
        )
        serie.serie.append(PuntoDeSerie(fila.fecha, fila.unidades, fila.ingreso))
    return list(series.values())


def ultimo_evento_en(conexion: Connection, empresa_id: UUID, local_id: UUID) -> datetime | None:
    """Cuándo llegó la última venta del local: indica qué tan al día están los datos."""
    return conexion.execute(
        text("SELECT max(recibido_en) FROM venta WHERE empresa_id = :empresa_id AND local_id = :local_id"),
        {"empresa_id": empresa_id, "local_id": local_id},
    ).scalar_one()
