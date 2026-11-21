"""Permisos mínimos del usuario de la aplicación, tabla por tabla.

La ficha dice que las ejecuciones y las predicciones solo se agregan, nunca se modifican. Aquí lo
hace cumplir la base: el usuario del servicio puede leer e insertar en `ejecucion` y `prediccion`, pero
no actualizar ni borrar. En `modelo_version` solo puede cambiar el estado de una versión.

El nombre del usuario llega en `APP_DB_USER` (lo define el compose o la prueba); el administrador
que ejecuta las migraciones es quien concede los permisos.

Revision ID: 0002
Revises: 0001
"""

import os
import re

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _usuario() -> str:
    nombre = os.environ.get("APP_DB_USER", "")
    if not re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", nombre):
        raise RuntimeError("Falta APP_DB_USER (usuario de la aplicación) o no es un nombre válido.")
    return f'"{nombre}"'


def upgrade() -> None:
    usuario = _usuario()
    op.execute(f"GRANT SELECT, INSERT ON ejecucion, prediccion TO {usuario}")
    op.execute(f"GRANT SELECT, INSERT ON modelo_version TO {usuario}")
    op.execute(f"GRANT UPDATE (estado, retirado_en) ON modelo_version TO {usuario}")


def downgrade() -> None:
    usuario = _usuario()
    op.execute(f"REVOKE ALL ON ejecucion, prediccion, modelo_version FROM {usuario}")
