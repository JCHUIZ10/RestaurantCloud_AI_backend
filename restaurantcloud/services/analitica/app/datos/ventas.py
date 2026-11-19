"""Acceso a las ventas y a sus agregados.

Toda función recibe `empresa_id` y `local_id` y los aplica en el SQL: es la única capa que toca
estas tablas, así ningún endpoint puede olvidar el filtro de empresa y local.
"""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Connection, text


@dataclass(frozen=True)
class TotalProducto:
    """Unidades e ingreso de un producto dentro de un comprobante."""

    producto_id: UUID
    nombre: str
    categoria_nombre: str | None
    unidades: int
    ingreso: Decimal


def _por_fila(conexion: Connection, sentencia, filas: list[dict]) -> None:
    """Ejecuta la sentencia una vez por fila.

    Un comprobante trae unas pocas filas. `executemany` las envía en modo pipeline, que desde un cliente
    en Windows hacia Docker puede tardar cientos de milisegundos por llamada; fila a fila no.
    """
    for fila in filas:
        conexion.execute(sentencia, fila)


def bloquear_comprobante(conexion: Connection, comprobante_id: UUID) -> None:
    """Serializa los eventos de un mismo comprobante (la venta y su anulación pueden llegar a la vez)."""
    conexion.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:clave, 0))"),
        {"clave": str(comprobante_id)},
    )


def tomar_anulacion_pendiente(conexion: Connection, comprobante_id: UUID) -> datetime | None:
    """Fecha de anulación si la anulación llegó antes que la venta."""
    return conexion.execute(
        text("SELECT anulada_en FROM anulacion_pendiente WHERE comprobante_id = :c"),
        {"c": comprobante_id},
    ).scalar_one_or_none()


def borrar_anulacion_pendiente(conexion: Connection, comprobante_id: UUID) -> None:
    conexion.execute(text("DELETE FROM anulacion_pendiente WHERE comprobante_id = :c"), {"c": comprobante_id})


def guardar_anulacion_pendiente(conexion: Connection, comprobante_id: UUID, anulada_en: datetime) -> None:
    conexion.execute(
        text(
            """
            INSERT INTO anulacion_pendiente (comprobante_id, anulada_en)
            VALUES (:c, :anulada_en)
            ON CONFLICT (comprobante_id) DO NOTHING
            """
        ),
        {"c": comprobante_id, "anulada_en": anulada_en},
    )


def insertar_venta(
    conexion: Connection,
    empresa_id: UUID,
    local_id: UUID,
    valores: dict,
    anulada_en: datetime | None,
) -> bool:
    """Inserta la venta. Devuelve False si ya existía (mismo comprobante)."""
    insertada = conexion.execute(
        text(
            """
            INSERT INTO venta (
                comprobante_id, empresa_id, local_id, pedido_id, tipo, fecha, fecha_operativa,
                mozo_id, mozo_nombre, comensales, medio_pago, subtotal_consumo, descuento,
                monto_recargo, total, promocion_id, estado, anulada_en
            ) VALUES (
                :comprobante_id, :empresa_id, :local_id, :pedido_id, :tipo, :fecha, :fecha_operativa,
                :mozo_id, :mozo_nombre, :comensales, :medio_pago, :subtotal_consumo, :descuento,
                :monto_recargo, :total, :promocion_id, :estado, :anulada_en
            )
            ON CONFLICT (comprobante_id) DO NOTHING
            RETURNING comprobante_id
            """
        ),
        {
            **valores,
            "empresa_id": empresa_id,
            "local_id": local_id,
            "estado": "anulada" if anulada_en else "vigente",
            "anulada_en": anulada_en,
        },
    ).first()
    return insertada is not None


def insertar_items(
    conexion: Connection,
    local_id: UUID,
    comprobante_id: UUID,
    fecha_operativa: date,
    items: list[dict],
) -> None:
    _por_fila(
        conexion,
        text(
            """
            INSERT INTO venta_item (
                comprobante_id, local_id, fecha_operativa, producto_id, producto_nombre,
                categoria_id, categoria_nombre, cantidad, precio_unitario, subtotal, costo_estandar
            ) VALUES (
                :comprobante_id, :local_id, :fecha_operativa, :producto_id, :nombre,
                :categoria_id, :categoria_nombre, :cantidad, :precio_unitario, :subtotal, :costo_estandar
            )
            """
        ),
        [
            {**item, "comprobante_id": comprobante_id, "local_id": local_id, "fecha_operativa": fecha_operativa}
            for item in items
        ],
    )


def totales_de_items(items: list[dict]) -> list[TotalProducto]:
    """Agrupa los ítems de un comprobante por producto (un producto puede repetirse en varias líneas)."""
    acumulado: dict[UUID, TotalProducto] = {}
    for item in items:
        previo = acumulado.get(item["producto_id"])
        acumulado[item["producto_id"]] = TotalProducto(
            producto_id=item["producto_id"],
            nombre=item["nombre"],
            categoria_nombre=item.get("categoria_nombre"),
            unidades=(previo.unidades if previo else 0) + item["cantidad"],
            ingreso=(previo.ingreso if previo else Decimal(0)) + item["subtotal"],
        )
    return list(acumulado.values())


def registrar_productos_vistos(
    conexion: Connection,
    empresa_id: UUID,
    local_id: UUID,
    fecha_operativa: date,
    totales: list[TotalProducto],
) -> None:
    """Último nombre y categoría conocidos de cada producto, y su primera y última venta.

    El nombre solo se reemplaza si esta venta es igual o más reciente que la última registrada:
    los eventos pueden llegar desordenados y no deben pisar un nombre más nuevo.
    """
    _por_fila(
        conexion,
        text(
            """
            INSERT INTO producto_visto (
                producto_id, empresa_id, local_id, nombre, categoria_nombre, primera_venta, ultima_venta
            ) VALUES (:producto_id, :empresa_id, :local_id, :nombre, :categoria_nombre, :fecha, :fecha)
            ON CONFLICT (producto_id) DO UPDATE SET
                primera_venta    = LEAST(producto_visto.primera_venta, EXCLUDED.primera_venta),
                ultima_venta     = GREATEST(producto_visto.ultima_venta, EXCLUDED.ultima_venta),
                nombre           = CASE WHEN EXCLUDED.ultima_venta >= producto_visto.ultima_venta
                                        THEN EXCLUDED.nombre ELSE producto_visto.nombre END,
                categoria_nombre = CASE WHEN EXCLUDED.ultima_venta >= producto_visto.ultima_venta
                                        THEN EXCLUDED.categoria_nombre ELSE producto_visto.categoria_nombre END
            WHERE producto_visto.local_id = EXCLUDED.local_id
              AND producto_visto.empresa_id = EXCLUDED.empresa_id
            """
        ),
        [
            {
                "producto_id": t.producto_id,
                "empresa_id": empresa_id,
                "local_id": local_id,
                "nombre": t.nombre,
                "categoria_nombre": t.categoria_nombre,
                "fecha": fecha_operativa,
            }
            for t in totales
        ],
    )


def sumar_al_agregado_diario(
    conexion: Connection,
    empresa_id: UUID,
    local_id: UUID,
    fecha_operativa: date,
    totales: list[TotalProducto],
    signo: int,
) -> None:
    """Suma (signo = 1) o resta (signo = -1) unidades e ingreso a la serie diaria por producto."""
    _por_fila(
        conexion,
        text(
            """
            INSERT INTO venta_diaria_producto (local_id, producto_id, fecha_operativa, empresa_id, unidades, ingreso)
            VALUES (:local_id, :producto_id, :fecha, :empresa_id, :unidades, :ingreso)
            ON CONFLICT (local_id, producto_id, fecha_operativa) DO UPDATE SET
                unidades = venta_diaria_producto.unidades + EXCLUDED.unidades,
                ingreso  = venta_diaria_producto.ingreso + EXCLUDED.ingreso
            """
        ),
        [
            {
                "local_id": local_id,
                "producto_id": t.producto_id,
                "fecha": fecha_operativa,
                "empresa_id": empresa_id,
                "unidades": signo * t.unidades,
                "ingreso": signo * t.ingreso,
            }
            for t in totales
        ],
    )


def marcar_venta_anulada(
    conexion: Connection,
    empresa_id: UUID,
    local_id: UUID,
    comprobante_id: UUID,
    anulada_en: datetime,
) -> date | None:
    """Pasa la venta de `vigente` a `anulada`. Devuelve su jornada, o None si no había nada que anular."""
    return conexion.execute(
        text(
            """
            UPDATE venta SET estado = 'anulada', anulada_en = :anulada_en
            WHERE comprobante_id = :c AND empresa_id = :empresa_id AND local_id = :local_id
              AND estado = 'vigente'
            RETURNING fecha_operativa
            """
        ),
        {"c": comprobante_id, "empresa_id": empresa_id, "local_id": local_id, "anulada_en": anulada_en},
    ).scalar_one_or_none()


def existe_venta(conexion: Connection, empresa_id: UUID, local_id: UUID, comprobante_id: UUID) -> bool:
    return (
        conexion.execute(
            text(
                "SELECT 1 FROM venta WHERE comprobante_id = :c AND empresa_id = :empresa_id AND local_id = :local_id"
            ),
            {"c": comprobante_id, "empresa_id": empresa_id, "local_id": local_id},
        ).first()
        is not None
    )


def totales_de_la_venta(
    conexion: Connection, local_id: UUID, comprobante_id: UUID
) -> list[TotalProducto]:
    filas = conexion.execute(
        text(
            """
            SELECT producto_id, min(producto_nombre) AS nombre, min(categoria_nombre) AS categoria_nombre,
                   sum(cantidad)::int AS unidades, sum(subtotal) AS ingreso
            FROM venta_item
            WHERE comprobante_id = :c AND local_id = :local_id
            GROUP BY producto_id
            """
        ),
        {"c": comprobante_id, "local_id": local_id},
    ).all()
    return [TotalProducto(f.producto_id, f.nombre, f.categoria_nombre, f.unidades, f.ingreso) for f in filas]
