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
ALTER TABLE pedido
    ADD COLUMN IF NOT EXISTS medio_pago_sugerido VARCHAR(30) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS numero_operacion_sugerido VARCHAR(100) DEFAULT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pedido_medio_pago_sugerido_check'
    ) THEN
        ALTER TABLE pedido ADD CONSTRAINT pedido_medio_pago_sugerido_check
            CHECK (medio_pago_sugerido IS NULL OR medio_pago_sugerido IN ('efectivo', 'tarjeta', 'billetera_digital'));
    END IF;
END $$;
SQL
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
ALTER TABLE pedido
    DROP CONSTRAINT IF EXISTS pedido_medio_pago_sugerido_check,
    DROP COLUMN IF EXISTS medio_pago_sugerido,
    DROP COLUMN IF EXISTS numero_operacion_sugerido;
SQL
        );
    }
};
