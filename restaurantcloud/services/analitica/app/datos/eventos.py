"""Registro de los eventos ya aplicados (idempotencia de la recepción)."""

from uuid import UUID

from sqlalchemy import Connection, text


def registrar_evento_procesado(conexion: Connection, evento_id: UUID, tipo: str) -> bool:
    """Marca el evento como aplicado. Devuelve False si ya estaba registrado (duplicado).

    Debe ejecutarse en la misma transacción que aplica el evento: o se guardan ambas cosas o ninguna.
    """
    nuevo = conexion.execute(
        text(
            """
            INSERT INTO evento_procesado (evento_id, tipo) VALUES (:id, :tipo)
            ON CONFLICT (evento_id) DO NOTHING
            RETURNING evento_id
            """
        ),
        {"id": evento_id, "tipo": tipo},
    ).first()
    return nuevo is not None
