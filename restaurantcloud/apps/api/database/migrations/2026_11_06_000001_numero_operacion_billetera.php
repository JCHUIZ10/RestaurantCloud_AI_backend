<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * El N° de operación de Yape/Plin queda registrado con el cobro.
 *
 * - comprobante.numero_operacion: evidencia del pago, única por sede entre comprobantes emitidos
 *   para que una misma constancia no respalde dos cobros.
 * - pedido_subcuenta.numero_operacion_sugerido: el número que el mozo valida al dividir la cuenta,
 *   para que la caja lo reciba prellenado.
 *
 * Idempotente: en BDs nuevas el esquema base ya trae estos cambios.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE comprobante ADD COLUMN IF NOT EXISTS numero_operacion VARCHAR(30);
            ALTER TABLE pedido_subcuenta ADD COLUMN IF NOT EXISTS numero_operacion_sugerido VARCHAR(100);

            CREATE UNIQUE INDEX IF NOT EXISTS uq_comprobante_local_numero_operacion
                ON comprobante(local_id, numero_operacion)
                WHERE numero_operacion IS NOT NULL AND estado = 'emitido';
        SQL);
    }

    public function down(): void
    {
        // Sin reversión: perdería el registro de los números de operación ya cobrados.
    }
};
