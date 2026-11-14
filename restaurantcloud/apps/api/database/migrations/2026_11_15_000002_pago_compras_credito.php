<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Pago de las compras a crédito del proveedor (CU-ADMIN-06, CU-ADMIN-14).
 *
 * Una compra a crédito no sale de ninguna cuenta hasta que se paga. Estas columnas registran el pago:
 * fecha real (`fecha_pago`, la elige la administración, nunca futura), forma de pago, origen del efectivo
 * y, si salió de la gaveta, el turno afectado.
 *
 * Las compras a crédito ya registradas NO se marcan como pagadas: siguen "por pagar" hasta que la
 * administración registre su pago con la fecha real. Las demás compras no cambian.
 *
 * Idempotente: en BDs nuevas el esquema base ya trae estos cambios.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE ficha_compra
                ADD COLUMN IF NOT EXISTS fecha_pago DATE,
                ADD COLUMN IF NOT EXISTS pagada_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS pagada_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS pago_metodo VARCHAR(20) CHECK (pago_metodo IN ('efectivo', 'transferencia', 'tarjeta_debito')),
                ADD COLUMN IF NOT EXISTS pago_origen_efectivo VARCHAR(20) CHECK (pago_origen_efectivo IN ('gaveta_turno', 'caja_chica')),
                ADD COLUMN IF NOT EXISTS pago_caja_id UUID REFERENCES caja(id) ON DELETE SET NULL;
            
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ficha_compra_pago') THEN
                    ALTER TABLE ficha_compra ADD CONSTRAINT chk_ficha_compra_pago CHECK (
                        (fecha_pago IS NULL OR metodo_pago = 'credito_proveedor')
                        AND ((fecha_pago IS NULL) = (pago_metodo IS NULL))
                        AND (pago_origen_efectivo IS NULL OR pago_metodo = 'efectivo')
                        AND (pago_origen_efectivo IS DISTINCT FROM 'gaveta_turno' OR pago_caja_id IS NOT NULL)
                    );
                END IF;
            END $$;
        SQL);
    }

    public function down(): void
    {
        // Sin reversión: las columnas guardan pagos ya realizados.
    }
};
