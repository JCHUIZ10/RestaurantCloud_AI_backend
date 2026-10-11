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
            CREATE TABLE IF NOT EXISTS cliente (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
                tipo_documento VARCHAR(10) NOT NULL CHECK (tipo_documento IN ('DNI', 'RUC')),
                numero_documento VARCHAR(20) NOT NULL,
                nombre_identificativo VARCHAR(255) NOT NULL,
                telefono VARCHAR(20),
                email VARCHAR(100),
                detalle JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_cliente_empresa_documento UNIQUE (empresa_id, tipo_documento, numero_documento)
            );

            CREATE TABLE IF NOT EXISTS caja (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                cajero_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                correlativo SERIAL NOT NULL,
                fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                monto_apertura DECIMAL(10, 2) NOT NULL CHECK (monto_apertura >= 0.00),
                notas_apertura TEXT,
                fecha_cierre TIMESTAMPTZ,
                monto_esperado DECIMAL(10, 2),
                monto_real DECIMAL(10, 2),
                discrepancia DECIMAL(10, 2),
                comentario_discrepancia TEXT,
                notas_cierre TEXT,
                revisado BOOL NOT NULL DEFAULT false,
                revisado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                revisado_at TIMESTAMPTZ,
                notas_auditoria TEXT,
                estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS comprobante_serie (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_venta', 'nota_credito')),
                serie VARCHAR(10) NOT NULL,
                correlativo_actual INT NOT NULL DEFAULT 0 CHECK (correlativo_actual >= 0),
                activo BOOL NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_comprobante_serie_local UNIQUE (local_id, tipo_comprobante, serie)
            );

            CREATE TABLE IF NOT EXISTS comprobante (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                pedido_id UUID REFERENCES pedido(id) ON DELETE SET NULL,
                caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE RESTRICT,
                cliente_id UUID REFERENCES cliente(id) ON DELETE SET NULL,
                tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('boleta', 'factura', 'nota_venta', 'nota_credito')),
                serie VARCHAR(10) NOT NULL,
                correlativo INT NOT NULL,
                documento_cliente VARCHAR(20),
                nombre_cliente VARCHAR(150) NOT NULL,
                telefono_envio VARCHAR(20),
                email_envio VARCHAR(100),
                metodo_pago_id UUID REFERENCES metodo_pago_local(id) ON DELETE SET NULL,
                medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('tarjeta', 'billetera_digital', 'efectivo')),
                subtotal_consumo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                porcentaje_recargo DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                monto_recargo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                monto_recibido DECIMAL(10, 2),
                vuelto DECIMAL(10, 2),
                total DECIMAL(10, 2) NOT NULL,
                base_imponible DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                igv DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                promocion_id UUID REFERENCES promocion(id) ON DELETE RESTRICT,
                token_qr UUID NOT NULL UNIQUE DEFAULT fn_uuid_v8(),
                impreso BOOL NOT NULL DEFAULT false,
                comprobante_modificado_id UUID REFERENCES comprobante(id) ON DELETE RESTRICT,
                motivo_codigo_sunat VARCHAR(10),
                sustento_motivo TEXT,
                fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                estado VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (estado IN ('emitido', 'anulado')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_comprobante_serie_correlativo UNIQUE (serie, correlativo)
            );

            CREATE TABLE IF NOT EXISTS pedido_subcuenta (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
                numero_subcuenta INT NOT NULL CHECK (numero_subcuenta >= 1),
                promocion_id UUID REFERENCES promocion(id) ON DELETE RESTRICT,
                tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('boleta', 'factura', 'nota_venta')),
                documento_cliente VARCHAR(20),
                nombre_cliente VARCHAR(150) NOT NULL,
                direccion_cliente VARCHAR(255),
                metodo_pago_id UUID REFERENCES metodo_pago_local(id) ON DELETE RESTRICT,
                medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('efectivo', 'tarjeta', 'billetera_digital')),
                subtotal_bruto DECIMAL(10, 2) NOT NULL CHECK (subtotal_bruto > 0),
                descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                monto_recargo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                total DECIMAL(10, 2) NOT NULL CHECK (total > 0),
                estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cobrado', 'anulado')),
                comprobante_id UUID REFERENCES comprobante(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_pedido_subcuenta UNIQUE (pedido_id, numero_subcuenta)
            );

            CREATE TABLE IF NOT EXISTS pedido_subcuenta_item (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                subcuenta_id UUID NOT NULL REFERENCES pedido_subcuenta(id) ON DELETE CASCADE,
                pedido_item_id UUID NOT NULL REFERENCES pedido_item(id) ON DELETE RESTRICT,
                cantidad INT NOT NULL CHECK (cantidad > 0),
                precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
                subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS gasto_manual (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                categoria VARCHAR(60) NOT NULL CHECK (categoria IN ('alquiler', 'servicios_basicos', 'limpieza_aseo', 'mantenimiento', 'caja_chica', 'otros')),
                monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0.00),
                origen_fondos VARCHAR(30) NOT NULL DEFAULT 'transferencia_bancaria' CHECK (origen_fondos IN ('transferencia_bancaria', 'efectivo_caja')),
                caja_id UUID REFERENCES caja(id) ON DELETE SET NULL,
                proveedor_nombre VARCHAR(120) NOT NULL,
                tipo_comprobante VARCHAR(50) DEFAULT 'recibo_interno',
                numero_documento VARCHAR(80),
                descripcion TEXT NOT NULL,
                fecha DATE NOT NULL DEFAULT CURRENT_DATE,
                registrado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS caja_movimiento (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('apertura', 'ingreso_venta', 'egreso_devolucion', 'egreso_gasto_manual', 'cierre')),
                monto DECIMAL(12, 2) NOT NULL,
                metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo',
                comprobante_id UUID REFERENCES comprobante(id) ON DELETE SET NULL,
                gasto_manual_id UUID REFERENCES gasto_manual(id) ON DELETE SET NULL,
                descripcion TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS auditoria_caja_cierre (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                cajero_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                reporte_z_json JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TRIGGER trg_set_updated_at_cliente BEFORE UPDATE ON cliente FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_caja BEFORE UPDATE ON caja FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_comprobante_serie BEFORE UPDATE ON comprobante_serie FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_comprobante BEFORE UPDATE ON comprobante FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_pedido_subcuenta BEFORE UPDATE ON pedido_subcuenta FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS auditoria_caja_cierre CASCADE;
            DROP TABLE IF EXISTS caja_movimiento CASCADE;
            DROP TABLE IF EXISTS gasto_manual CASCADE;
            DROP TABLE IF EXISTS pedido_subcuenta_item CASCADE;
            DROP TABLE IF EXISTS pedido_subcuenta CASCADE;
            DROP TABLE IF EXISTS comprobante CASCADE;
            DROP TABLE IF EXISTS comprobante_serie CASCADE;
            DROP TABLE IF EXISTS caja CASCADE;
            DROP TABLE IF EXISTS cliente CASCADE;
        SQL);
    }
};
