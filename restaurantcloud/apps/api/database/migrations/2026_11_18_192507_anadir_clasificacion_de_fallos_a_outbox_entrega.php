<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Clasificación de los fallos de entrega de eventos a los microservicios.
 *
 * No es lo mismo que el destino esté apagado (el evento está bien y llegará cuando vuelva) que un
 * evento que el destino rechaza o que le provoca un error. Estas columnas permiten tratarlos distinto:
 *   - motivo_fallo: clase del último fallo (no_disponible, no_autorizado, sin_configurar, error_receptor, rechazado).
 *   - fallos_receptor: fallos que sí cuentan contra el límite de intentos (los de clase error_receptor).
 *   - fallando_desde: primer fallo de la racha actual; los fallos transitorios caducan pasado el horizonte.
 *   - reenvios: veces que un operador devolvió la entrega a pendiente con outbox:reenviar-eventos.
 *
 * Idempotente.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE outbox_entrega
                ADD COLUMN IF NOT EXISTS motivo_fallo VARCHAR(20),
                ADD COLUMN IF NOT EXISTS fallos_receptor SMALLINT NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS fallando_desde TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS reenvios SMALLINT NOT NULL DEFAULT 0;

            ALTER TABLE outbox_entrega DROP CONSTRAINT IF EXISTS outbox_entrega_motivo_fallo_check;
            ALTER TABLE outbox_entrega
                ADD CONSTRAINT outbox_entrega_motivo_fallo_check
                CHECK (motivo_fallo IS NULL OR motivo_fallo IN
                    ('no_disponible', 'no_autorizado', 'sin_configurar', 'error_receptor', 'rechazado'));

            -- Los fallidos son los que revisa y reenvía un operador.
            CREATE INDEX IF NOT EXISTS ix_outbox_entrega_fallido
                ON outbox_entrega (destino, created_at) WHERE estado = 'fallido';
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP INDEX IF EXISTS ix_outbox_entrega_fallido;
            ALTER TABLE outbox_entrega DROP CONSTRAINT IF EXISTS outbox_entrega_motivo_fallo_check;
            ALTER TABLE outbox_entrega
                DROP COLUMN IF EXISTS reenvios,
                DROP COLUMN IF EXISTS fallando_desde,
                DROP COLUMN IF EXISTS fallos_receptor,
                DROP COLUMN IF EXISTS motivo_fallo;
        SQL);
    }
};
