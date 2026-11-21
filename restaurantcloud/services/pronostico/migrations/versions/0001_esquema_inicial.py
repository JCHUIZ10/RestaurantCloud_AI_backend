"""Esquema inicial de ms-pronóstico: las 3 tablas del diseño (doc-2u/servicios/ms-pronostico.md, sección 2).

Revision ID: 0001
Revises:
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TABLAS = [
    """
    CREATE TABLE modelo_version (
        id                uuid PRIMARY KEY,
        empresa_id        uuid NOT NULL,
        local_id          uuid NOT NULL,
        algoritmo         varchar(80) NOT NULL,
        version_variables varchar(10) NOT NULL,
        datos_desde       date NOT NULL,
        datos_hasta       date NOT NULL,
        metricas          jsonb NOT NULL DEFAULT '{}',
        ficha             jsonb NOT NULL,
        artefacto_uri     text NOT NULL,
        artefacto_sha256  char(64) NOT NULL,
        estado            varchar(10) NOT NULL CHECK (estado IN ('vigente','retirado')),
        publicado_en      timestamptz NOT NULL,
        registrado_en     timestamptz NOT NULL DEFAULT now(),
        retirado_en       timestamptz
    )
    """,
    "CREATE UNIQUE INDEX uq_modelo_vigente ON modelo_version (local_id) WHERE estado = 'vigente'",
    """
    CREATE TABLE ejecucion (
        id                       uuid PRIMARY KEY,
        solicitud_id             uuid NOT NULL,
        empresa_id               uuid NOT NULL,
        local_id                 uuid NOT NULL,
        solicitada_por           uuid NOT NULL,
        modelo_version_id        uuid REFERENCES modelo_version (id),
        version_rc_pronostico    varchar(20) NOT NULL,
        jornada_actual           date NOT NULL,
        fecha_inicio             date NOT NULL,
        horizonte_dias           smallint NOT NULL CHECK (horizonte_dias BETWEEN 1 AND 7),
        datos_desde              date,
        datos_hasta              date,
        huella_datos             char(64),
        calendario               jsonb NOT NULL DEFAULT '{}',
        datos_actualizados_hasta timestamptz,
        estado                   varchar(12) NOT NULL CHECK (estado IN ('completada','fallida')),
        error                    varchar(40),
        duracion_ms              integer,
        creada_en                timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX ix_ejecucion_local ON ejecucion (local_id, creada_en DESC)",
    "CREATE UNIQUE INDEX uq_ejecucion_solicitud ON ejecucion (solicitud_id) WHERE estado = 'completada'",
    """
    CREATE TABLE prediccion (
        ejecucion_id    uuid NOT NULL REFERENCES ejecucion (id) ON DELETE CASCADE,
        producto_id     uuid NOT NULL,
        fecha           date NOT NULL,
        producto_nombre varchar(150) NOT NULL,
        unidades_p50    numeric(10,2) NOT NULL CHECK (unidades_p50 >= 0),
        unidades_p90    numeric(10,2) NOT NULL,
        metodo          varchar(14) NOT NULL
                        CHECK (metodo IN ('modelo','baseline','cerrado','sin_historial')),
        motivo          varchar(40)
                        CHECK (motivo IN ('historial_minimo','modelo_no_disponible',
                                          'producto_no_visto','historial_reciente_insuficiente')),
        PRIMARY KEY (ejecucion_id, producto_id, fecha),
        CHECK (unidades_p90 >= unidades_p50),
        CHECK ((metodo = 'baseline') = (motivo IS NOT NULL))
    )
    """,
]


def upgrade() -> None:
    for sentencia in TABLAS:
        op.execute(sentencia)


def downgrade() -> None:
    op.execute("DROP TABLE prediccion")
    op.execute("DROP TABLE ejecucion")
    op.execute("DROP TABLE modelo_version")
