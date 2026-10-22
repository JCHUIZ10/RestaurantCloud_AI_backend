-- Actualización idempotente para bases creadas antes de restringir el catálogo POS.
-- No afecta transferencias de compras ni gastos: solo metodo_pago_local.

BEGIN;

UPDATE comprobante
SET metodo_pago_id = NULL,
    updated_at = NOW()
WHERE metodo_pago_id IN (
    SELECT id
    FROM metodo_pago_local
    WHERE codigo = 'transferencia'
);

DELETE FROM metodo_pago_local
WHERE codigo = 'transferencia';

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
END
$$;

COMMIT;
