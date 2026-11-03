<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * El alta cobra con un PaymentIntent único y no crea suscripciones de Stripe
 * Billing, por lo que stripe_subscription_id y stripe_schedule_id quedaban
 * siempre en NULL. La referencia útil hacia Stripe es empresa.stripe_customer_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE suscripcion
                DROP COLUMN IF EXISTS stripe_subscription_id,
                DROP COLUMN IF EXISTS stripe_schedule_id;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE suscripcion
                ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100),
                ADD COLUMN IF NOT EXISTS stripe_schedule_id VARCHAR(100);
        SQL);
    }
};
