"""Días con ventas del local en la ventana de cada ejecución.

Sirve para que el núcleo distinga un local que recién empieza (pocos días con ventas) de uno con historial,
y le muestre al usuario en qué nivel está su predicción (doc-2u/03-prediccion-en-locales-nuevos.md, N-1).
Es nulo en las ejecuciones anteriores a esta migración y en las fallidas, que no llegaron a leer la serie.

El usuario de la aplicación ya puede insertar en `ejecucion` (migración 0002): no hace falta conceder nada.

Revision ID: 0003
Revises: 0002
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE ejecucion ADD COLUMN dias_con_ventas integer CHECK (dias_con_ventas >= 0)")


def downgrade() -> None:
    op.execute("ALTER TABLE ejecucion DROP COLUMN dias_con_ventas")
