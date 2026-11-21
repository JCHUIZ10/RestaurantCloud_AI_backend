"""Alembic ejecuta las migraciones con el usuario administrador, nunca con el de la aplicación."""

import os

from alembic import context
from sqlalchemy import create_engine, pool

url = os.environ.get("MIGRATIONS_DATABASE_URL")
if not url:
    raise RuntimeError("Falta MIGRATIONS_DATABASE_URL (conexión del usuario administrador).")


def run_migrations_online() -> None:
    engine = create_engine(url, poolclass=pool.NullPool)
    with engine.connect() as conexion:
        context.configure(connection=conexion)
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
