"""Esquema inicial de ms-analítica: las 7 tablas del diseño (doc-2u/servicios/ms-analitica.md, sección 2).

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
    CREATE TABLE venta (
        comprobante_id   uuid PRIMARY KEY,
        empresa_id       uuid NOT NULL,
        local_id         uuid NOT NULL,
        pedido_id        uuid NOT NULL,
        tipo             varchar(15) NOT NULL CHECK (tipo IN ('boleta','factura','nota_venta')),
        fecha            timestamptz NOT NULL,
        fecha_operativa  date NOT NULL,
        mozo_id          uuid NOT NULL,
        mozo_nombre      varchar(150) NOT NULL,
        comensales       smallint,
        medio_pago       varchar(20) NOT NULL CHECK (medio_pago IN ('efectivo','tarjeta','billetera_digital')),
        subtotal_consumo numeric(12,2) NOT NULL,
        descuento        numeric(12,2) NOT NULL DEFAULT 0,
        monto_recargo    numeric(12,2) NOT NULL DEFAULT 0,
        total            numeric(12,2) NOT NULL,
        promocion_id     uuid,
        estado           varchar(10) NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','anulada')),
        anulada_en       timestamptz,
        recibido_en      timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX ix_venta_local_jornada ON venta (local_id, fecha_operativa)",
    "CREATE INDEX ix_venta_local_fecha ON venta (local_id, fecha)",
    "CREATE INDEX ix_venta_local_mozo ON venta (local_id, mozo_id, fecha_operativa)",
    """
    CREATE TABLE venta_item (
        id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        comprobante_id   uuid NOT NULL REFERENCES venta (comprobante_id) ON DELETE CASCADE,
        local_id         uuid NOT NULL,
        fecha_operativa  date NOT NULL,
        producto_id      uuid NOT NULL,
        producto_nombre  varchar(150) NOT NULL,
        categoria_id     uuid,
        categoria_nombre varchar(100),
        cantidad         integer NOT NULL CHECK (cantidad > 0),
        precio_unitario  numeric(10,2) NOT NULL,
        subtotal         numeric(12,2) NOT NULL,
        costo_estandar   numeric(10,2)
    )
    """,
    "CREATE INDEX ix_item_local_producto ON venta_item (local_id, producto_id, fecha_operativa)",
    "CREATE INDEX ix_item_comprobante ON venta_item (comprobante_id)",
    """
    CREATE TABLE producto_visto (
        producto_id      uuid PRIMARY KEY,
        empresa_id       uuid NOT NULL,
        local_id         uuid NOT NULL,
        nombre           varchar(150) NOT NULL,
        categoria_nombre varchar(100),
        primera_venta    date NOT NULL,
        ultima_venta     date NOT NULL
    )
    """,
    "CREATE INDEX ix_producto_local ON producto_visto (local_id)",
    """
    CREATE TABLE venta_diaria_producto (
        local_id        uuid NOT NULL,
        producto_id     uuid NOT NULL,
        fecha_operativa date NOT NULL,
        empresa_id      uuid NOT NULL,
        unidades        integer NOT NULL,
        ingreso         numeric(14,2) NOT NULL,
        PRIMARY KEY (local_id, producto_id, fecha_operativa)
    )
    """,
    """
    CREATE TABLE anulacion (
        anulacion_id       uuid PRIMARY KEY,
        empresa_id         uuid NOT NULL,
        local_id           uuid NOT NULL,
        pedido_id          uuid NOT NULL,
        pedido_item_id     uuid,
        producto_id        uuid,
        producto_nombre    varchar(150),
        cantidad           integer NOT NULL,
        monto_total        numeric(12,2) NOT NULL,
        tipo_anulacion     varchar(30) NOT NULL,
        motivo_categoria   varchar(50),
        es_merma           boolean NOT NULL DEFAULT false,
        costo_merma        numeric(10,2),
        minutos_espera     integer,
        mozo_id            uuid,
        mozo_nombre        varchar(150),
        anulado_por_id     uuid,
        anulado_por_nombre varchar(150),
        anulado_en         timestamptz NOT NULL,
        fecha_operativa    date NOT NULL
    )
    """,
    "CREATE INDEX ix_anulacion_local_jornada ON anulacion (local_id, fecha_operativa)",
    """
    CREATE TABLE evento_procesado (
        evento_id    uuid PRIMARY KEY,
        tipo         varchar(60) NOT NULL,
        procesado_en timestamptz NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE anulacion_pendiente (
        comprobante_id uuid PRIMARY KEY,
        anulada_en     timestamptz NOT NULL,
        recibido_en    timestamptz NOT NULL DEFAULT now()
    )
    """,
]

ORDEN_DE_BORRADO = [
    "anulacion_pendiente",
    "evento_procesado",
    "anulacion",
    "venta_diaria_producto",
    "producto_visto",
    "venta_item",
    "venta",
]


def upgrade() -> None:
    for sentencia in TABLAS:
        op.execute(sentencia)


def downgrade() -> None:
    for tabla in ORDEN_DE_BORRADO:
        op.execute(f"DROP TABLE IF EXISTS {tabla}")
