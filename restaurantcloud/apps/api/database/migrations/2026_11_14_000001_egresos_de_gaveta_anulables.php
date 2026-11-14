<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Egresos de la gaveta anulables y compras de insumos con origen del efectivo (CU-ADMIN-14, CU-ADMIN-06).
 *
 * - gasto_manual: estado + datos de anulación. Un gasto mal registrado se anula con motivo en lugar de
 *   quedar para siempre en el flujo de caja y descontado del efectivo esperado del cajero.
 * - ficha_compra: origen del efectivo (gaveta del turno o caja chica fuera del POS) y turno afectado.
 *   Las compras en efectivo ya registradas nunca tocaron la gaveta, por eso se marcan como caja chica.
 * - caja_movimiento: nuevo tipo 'egreso_compra_insumo' y vínculo con la compra.
 *
 * Idempotente: en BDs nuevas el esquema base ya trae estos cambios.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE gasto_manual
                ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'registrado'
                    CHECK (estado IN ('registrado', 'anulado')),
                ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT,
                ADD COLUMN IF NOT EXISTS anulado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS anulado_at TIMESTAMPTZ;

            ALTER TABLE ficha_compra
                ADD COLUMN IF NOT EXISTS origen_efectivo VARCHAR(20)
                    CHECK (origen_efectivo IN ('gaveta_turno', 'caja_chica')),
                ADD COLUMN IF NOT EXISTS caja_id UUID REFERENCES caja(id) ON DELETE SET NULL;

            UPDATE ficha_compra
               SET origen_efectivo = 'caja_chica'
             WHERE metodo_pago = 'efectivo'
               AND origen_efectivo IS NULL;

            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ficha_compra_origen_efectivo') THEN
                    ALTER TABLE ficha_compra ADD CONSTRAINT chk_ficha_compra_origen_efectivo CHECK (
                        (origen_efectivo IS NULL OR metodo_pago = 'efectivo')
                        AND (origen_efectivo IS DISTINCT FROM 'gaveta_turno' OR caja_id IS NOT NULL)
                    );
                END IF;
            END $$;

            ALTER TABLE caja_movimiento
                ADD COLUMN IF NOT EXISTS ficha_compra_id UUID REFERENCES ficha_compra(id) ON DELETE SET NULL;

            DO $$
            DECLARE
                restriccion RECORD;
                ya_incluido BOOLEAN := FALSE;
            BEGIN
                FOR restriccion IN
                    SELECT conname, pg_get_constraintdef(oid) AS definicion
                      FROM pg_constraint
                     WHERE conrelid = 'caja_movimiento'::regclass
                       AND contype = 'c'
                       AND pg_get_constraintdef(oid) LIKE '%egreso_gasto_manual%'
                LOOP
                    IF restriccion.definicion LIKE '%egreso_compra_insumo%' THEN
                        ya_incluido := TRUE;
                    ELSE
                        EXECUTE format('ALTER TABLE caja_movimiento DROP CONSTRAINT %I', restriccion.conname);
                    END IF;
                END LOOP;

                IF NOT ya_incluido THEN
                    ALTER TABLE caja_movimiento ADD CONSTRAINT caja_movimiento_tipo_check CHECK (
                        tipo IN ('apertura', 'ingreso_venta', 'egreso_devolucion', 'egreso_gasto_manual', 'egreso_compra_insumo', 'cierre')
                    );
                END IF;
            END $$;

            CREATE INDEX IF NOT EXISTS idx_caja_movimiento_ficha_compra
                ON caja_movimiento(ficha_compra_id) WHERE ficha_compra_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_caja_movimiento_gasto_manual
                ON caja_movimiento(gasto_manual_id) WHERE gasto_manual_id IS NOT NULL;
        SQL);
    }

    public function down(): void
    {
        // Sin reversión: perdería los motivos de anulación y el origen del efectivo ya registrados.
    }
};
