<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
CREATE TABLE IF NOT EXISTS outbox_event (
    id UUID PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    local_id UUID REFERENCES local(id) ON DELETE CASCADE,
    agregado_tipo VARCHAR(50) NOT NULL,
    agregado_id UUID NOT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'procesando', 'procesado', 'fallido')),
    intentos SMALLINT NOT NULL DEFAULT 0 CHECK (intentos >= 0),
    disponible_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    procesado_at TIMESTAMPTZ,
    ultimo_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_event_pendientes
    ON outbox_event (estado, disponible_desde, created_at)
    WHERE estado IN ('pendiente', 'fallido');

CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_comprobante_documento
    ON outbox_event (agregado_id, tipo_evento)
    WHERE tipo_evento = 'comprobante.digital.solicitado';

DROP TRIGGER IF EXISTS trg_set_updated_at ON outbox_event;
CREATE TRIGGER trg_set_updated_at
    BEFORE UPDATE ON outbox_event
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
SQL
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS outbox_event CASCADE;');
    }
};
