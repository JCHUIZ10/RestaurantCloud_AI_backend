<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * El ciclo de facturación solo vivía en la sesión de registro: el dashboard del
 * propietario, el webhook de renovación y la constancia PDF lo necesitan.
 *
 * numero_recibo identifica de forma estable cada pago de suscripción; antes se
 * calculaba al vuelo y no se podía volver a consultar. El DEFAULT con secuencia
 * numera también los pagos existentes al agregar la columna.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE suscripcion
                ADD COLUMN IF NOT EXISTS ciclo_facturacion VARCHAR(10) NOT NULL DEFAULT 'mensual'
                CHECK (ciclo_facturacion IN ('mensual', 'anual'));

            UPDATE suscripcion
               SET ciclo_facturacion = 'anual'
             WHERE fecha_fin_periodo - fecha_inicio > INTERVAL '2 months';

            CREATE SEQUENCE IF NOT EXISTS pago_numero_recibo_seq;

            ALTER TABLE pago
                ADD COLUMN IF NOT EXISTS numero_recibo VARCHAR(30) NOT NULL UNIQUE
                DEFAULT ('RS-' || lpad(nextval('pago_numero_recibo_seq')::text, 8, '0'));

            ALTER SEQUENCE pago_numero_recibo_seq OWNED BY pago.numero_recibo;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE pago DROP COLUMN IF EXISTS numero_recibo;
            DROP SEQUENCE IF EXISTS pago_numero_recibo_seq;
            ALTER TABLE suscripcion DROP COLUMN IF EXISTS ciclo_facturacion;
        SQL);
    }
};
