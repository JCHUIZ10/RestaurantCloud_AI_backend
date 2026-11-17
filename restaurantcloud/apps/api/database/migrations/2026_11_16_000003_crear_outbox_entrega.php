<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Entregas de los eventos del outbox a los microservicios (doc-2u/servicios/nucleo-laravel.md).
 *
 * Un evento de outbox_event puede ir a varios servicios: cada fila registra el envío a uno de ellos,
 * de modo que si uno falla solo se reintenta ese destino. Los destinos de cada tipo de evento se
 * definen en config/eventos.php.
 *
 * Idempotente: en BDs nuevas el esquema base ya trae la tabla.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE IF NOT EXISTS outbox_entrega (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                evento_id UUID NOT NULL REFERENCES outbox_event(id) ON DELETE CASCADE,
                destino VARCHAR(40) NOT NULL,
                estado VARCHAR(12) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'entregado', 'fallido')),
                intentos SMALLINT NOT NULL DEFAULT 0,
                proximo_intento_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ultimo_error TEXT,
                entregado_en TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (evento_id, destino)
            );

            CREATE INDEX IF NOT EXISTS ix_outbox_entrega_pendiente
                ON outbox_entrega (proximo_intento_en) WHERE estado = 'pendiente';
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS outbox_entrega;');
    }
};
