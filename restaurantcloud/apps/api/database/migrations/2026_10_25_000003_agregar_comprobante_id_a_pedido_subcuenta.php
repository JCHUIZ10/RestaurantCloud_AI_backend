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
            -- 1. Agregar columna comprobante_id a pedido_subcuenta de forma idempotente
            ALTER TABLE pedido_subcuenta
                ADD COLUMN IF NOT EXISTS comprobante_id UUID REFERENCES comprobante(id) ON DELETE SET NULL;

            -- 2. Crear índice para acelerar consultas de comprobantes por subcuenta
            CREATE INDEX IF NOT EXISTS idx_pedido_subcuenta_comprobante_id
                ON pedido_subcuenta(comprobante_id);

            -- 3. Asegurar restricción de métodos de pago operativos en metodo_pago_local
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'chk_metodo_pago_local_codigo_operativo'
                      AND conrelid = 'metodo_pago_local'::regclass
                ) THEN
                    ALTER TABLE metodo_pago_local
                    ADD CONSTRAINT chk_metodo_pago_local_codigo_operativo
                    CHECK (codigo IN ('efectivo', 'tarjeta', 'billetera_digital'));
                END IF;
            END $$;
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP INDEX IF EXISTS idx_pedido_subcuenta_comprobante_id;

            ALTER TABLE pedido_subcuenta
                DROP COLUMN IF EXISTS comprobante_id;
        SQL);
    }
};
