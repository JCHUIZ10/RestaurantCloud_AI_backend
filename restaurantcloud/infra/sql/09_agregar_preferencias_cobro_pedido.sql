-- CU-CAJA-03A: preferencias de cobro seleccionadas por Mozo para cuenta consolidada.
-- Ejecutar una sola vez en bases locales ya creadas antes de esta versión.
BEGIN;

ALTER TABLE pedido
    ADD COLUMN IF NOT EXISTS medio_pago_sugerido VARCHAR(30),
    ADD COLUMN IF NOT EXISTS numero_operacion_sugerido VARCHAR(100);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_pedido_medio_pago_sugerido'
          AND conrelid = 'pedido'::regclass
    ) THEN
        ALTER TABLE pedido
            ADD CONSTRAINT chk_pedido_medio_pago_sugerido
            CHECK (medio_pago_sugerido IS NULL OR medio_pago_sugerido IN ('efectivo', 'tarjeta', 'billetera_digital'));
    END IF;
END $$;

COMMIT;
