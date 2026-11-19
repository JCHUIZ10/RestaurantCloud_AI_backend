"""Acceso a las anulaciones previas al cobro (ítems y comandas)."""

from uuid import UUID

from sqlalchemy import Connection, text


def insertar_anulacion(conexion: Connection, empresa_id: UUID, local_id: UUID, valores: dict) -> bool:
    """Registra la anulación. Devuelve False si ya existía."""
    insertada = conexion.execute(
        text(
            """
            INSERT INTO anulacion (
                anulacion_id, empresa_id, local_id, pedido_id, pedido_item_id, producto_id, producto_nombre,
                cantidad, monto_total, tipo_anulacion, motivo_categoria, es_merma, costo_merma,
                minutos_espera, mozo_id, mozo_nombre, anulado_por_id, anulado_por_nombre,
                anulado_en, fecha_operativa
            ) VALUES (
                :anulacion_id, :empresa_id, :local_id, :pedido_id, :pedido_item_id, :producto_id, :producto_nombre,
                :cantidad, :monto_total, :tipo_anulacion, :motivo_categoria, :es_merma, :costo_merma,
                :minutos_espera, :mozo_id, :mozo_nombre, :anulado_por_id, :anulado_por_nombre,
                :anulado_en, :fecha_operativa
            )
            ON CONFLICT (anulacion_id) DO NOTHING
            RETURNING anulacion_id
            """
        ),
        {**valores, "empresa_id": empresa_id, "local_id": local_id},
    ).first()
    return insertada is not None
