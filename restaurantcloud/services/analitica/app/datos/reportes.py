"""Consultas de los reportes de CU-ADMIN-13.

Toda consulta filtra por `empresa_id` y `local_id`: la empresa sale del JWT, así que una sede de otra
empresa se ve igual que una sede sin ventas. `venta_item` no guarda la empresa; se filtra a través de
su `venta`. Solo cuentan como venta las `vigente`; las `anulada` (nota de crédito) se informan aparte.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Connection, text


@dataclass
class TotalesVentas:
    ventas_total: Decimal
    comprobantes: int
    dias_con_ventas: int
    comensales: int
    total_con_comensales: Decimal
    descuentos: Decimal
    anulados_comprobantes: int
    anulados_total: Decimal


@dataclass
class Grupo:
    clave: str
    comprobantes: int
    total: Decimal


@dataclass
class Franja:
    hora: int
    comprobantes: int
    total: Decimal


@dataclass
class VentaDeProducto:
    producto_id: UUID
    nombre: str
    categoria_nombre: str | None
    unidades: int
    ingreso: Decimal
    costo: Decimal | None  # None si algún ítem del periodo no trae costo_estandar


@dataclass
class VentasDeMozo:
    mozo_id: UUID
    mozo_nombre: str
    comprobantes: int
    ventas_total: Decimal
    comensales: int
    comprobantes_anulados: int


@dataclass
class AnulacionesDeMozo:
    mozo_id: UUID | None
    mozo_nombre: str | None
    cantidad: int
    monto: Decimal
    mermas: int
    costo_merma: Decimal


def _parametros(empresa_id: UUID, local_id: UUID, desde: date, hasta: date) -> dict:
    return {"empresa_id": empresa_id, "local_id": local_id, "desde": desde, "hasta": hasta}


_VENTAS_DEL_PERIODO = """
    FROM venta
    WHERE empresa_id = :empresa_id AND local_id = :local_id
      AND fecha_operativa BETWEEN :desde AND :hasta
"""


def totales(conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date) -> TotalesVentas:
    fila = conexion.execute(
        text(
            f"""
            SELECT
                COALESCE(SUM(total) FILTER (WHERE estado = 'vigente'), 0)               AS ventas_total,
                COUNT(*) FILTER (WHERE estado = 'vigente')                              AS comprobantes,
                COUNT(DISTINCT fecha_operativa) FILTER (WHERE estado = 'vigente')       AS dias_con_ventas,
                COALESCE(SUM(comensales) FILTER (WHERE estado = 'vigente'), 0)          AS comensales,
                COALESCE(SUM(total) FILTER (WHERE estado = 'vigente' AND comensales > 0), 0)
                                                                                        AS total_con_comensales,
                COALESCE(SUM(descuento) FILTER (WHERE estado = 'vigente'), 0)           AS descuentos,
                COUNT(*) FILTER (WHERE estado = 'anulada')                              AS anulados_comprobantes,
                COALESCE(SUM(total) FILTER (WHERE estado = 'anulada'), 0)               AS anulados_total
            {_VENTAS_DEL_PERIODO}
            """
        ),
        _parametros(empresa_id, local_id, desde, hasta),
    ).one()
    return TotalesVentas(**fila._mapping)


def _agrupado(conexion: Connection, columna: str, empresa_id, local_id, desde, hasta) -> list[Grupo]:
    filas = conexion.execute(
        text(
            f"""
            SELECT {columna} AS clave, COUNT(*) AS comprobantes, SUM(total) AS total
            {_VENTAS_DEL_PERIODO}
              AND estado = 'vigente'
            GROUP BY {columna}
            ORDER BY total DESC, clave
            """
        ),
        _parametros(empresa_id, local_id, desde, hasta),
    ).all()
    return [Grupo(f.clave, f.comprobantes, f.total) for f in filas]


def por_medio_pago(conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date) -> list[Grupo]:
    return _agrupado(conexion, "medio_pago", empresa_id, local_id, desde, hasta)


def por_tipo(conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date) -> list[Grupo]:
    return _agrupado(conexion, "tipo", empresa_id, local_id, desde, hasta)


def por_hora(
    conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date, zona_horaria: str
) -> list[Franja]:
    """Solo las horas con ventas; la capa de API completa las 24 franjas."""
    filas = conexion.execute(
        text(
            f"""
            SELECT EXTRACT(HOUR FROM fecha AT TIME ZONE :zona)::int AS hora,
                   COUNT(*) AS comprobantes, SUM(total) AS total
            {_VENTAS_DEL_PERIODO}
              AND estado = 'vigente'
            GROUP BY 1
            ORDER BY 1
            """
        ),
        {**_parametros(empresa_id, local_id, desde, hasta), "zona": zona_horaria},
    ).all()
    return [Franja(f.hora, f.comprobantes, f.total) for f in filas]


def ventas_por_producto(
    conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date
) -> list[VentaDeProducto]:
    """Unidades, ingreso a precio de carta y costo por plato, ordenados por unidades descendente.

    El nombre y la categoría son los últimos vistos (`producto_visto`), para que un plato renombrado
    no aparezca dos veces; si faltara esa fila, se usa el nombre con el que se vendió.
    """
    filas = conexion.execute(
        text(
            """
            SELECT i.producto_id,
                   COALESCE(pv.nombre, MAX(i.producto_nombre))                 AS nombre,
                   COALESCE(pv.categoria_nombre, MAX(i.categoria_nombre))     AS categoria_nombre,
                   SUM(i.cantidad)::int                                       AS unidades,
                   SUM(i.subtotal)                                            AS ingreso,
                   CASE WHEN BOOL_AND(i.costo_estandar IS NOT NULL)
                        THEN SUM(i.costo_estandar * i.cantidad) END           AS costo
            FROM venta_item i
            JOIN venta v ON v.comprobante_id = i.comprobante_id
            LEFT JOIN producto_visto pv
                   ON pv.producto_id = i.producto_id
                  AND pv.empresa_id = :empresa_id AND pv.local_id = :local_id
            WHERE v.empresa_id = :empresa_id AND v.local_id = :local_id
              AND i.local_id = :local_id
              AND i.fecha_operativa BETWEEN :desde AND :hasta
              AND v.estado = 'vigente'
            GROUP BY i.producto_id, pv.nombre, pv.categoria_nombre
            ORDER BY unidades DESC, nombre, i.producto_id
            """
        ),
        _parametros(empresa_id, local_id, desde, hasta),
    ).all()
    return [VentaDeProducto(**f._mapping) for f in filas]


def ventas_por_mozo(
    conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date
) -> list[VentasDeMozo]:
    """Ventas vigentes y notas de crédito por mozo; el nombre es el de su venta más reciente del periodo."""
    filas = conexion.execute(
        text(
            f"""
            SELECT mozo_id,
                   (ARRAY_AGG(mozo_nombre ORDER BY fecha DESC))[1]                   AS mozo_nombre,
                   COUNT(*) FILTER (WHERE estado = 'vigente')                        AS comprobantes,
                   COALESCE(SUM(total) FILTER (WHERE estado = 'vigente'), 0)         AS ventas_total,
                   COALESCE(SUM(comensales) FILTER (WHERE estado = 'vigente'), 0)    AS comensales,
                   COUNT(*) FILTER (WHERE estado = 'anulada')                        AS comprobantes_anulados
            {_VENTAS_DEL_PERIODO}
            GROUP BY mozo_id
            """
        ),
        _parametros(empresa_id, local_id, desde, hasta),
    ).all()
    return [VentasDeMozo(**f._mapping) for f in filas]


def anulaciones_por_mozo(
    conexion: Connection, empresa_id: UUID, local_id: UUID, desde: date, hasta: date
) -> list[AnulacionesDeMozo]:
    """Anulaciones previas al cobro (`pedido.anulado`), agrupadas por mozo; `mozo_id` nulo agrupa las sin mozo."""
    filas = conexion.execute(
        text(
            """
            SELECT mozo_id,
                   (ARRAY_AGG(mozo_nombre ORDER BY anulado_en DESC))[1]      AS mozo_nombre,
                   COUNT(*)                                                 AS cantidad,
                   COALESCE(SUM(monto_total), 0)                            AS monto,
                   COUNT(*) FILTER (WHERE es_merma)                         AS mermas,
                   COALESCE(SUM(costo_merma) FILTER (WHERE es_merma), 0)    AS costo_merma
            FROM anulacion
            WHERE empresa_id = :empresa_id AND local_id = :local_id
              AND fecha_operativa BETWEEN :desde AND :hasta
            GROUP BY mozo_id
            """
        ),
        _parametros(empresa_id, local_id, desde, hasta),
    ).all()
    return [AnulacionesDeMozo(**f._mapping) for f in filas]
