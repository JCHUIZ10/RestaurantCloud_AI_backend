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
            CREATE TABLE IF NOT EXISTS categoria_producto (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                nombre VARCHAR(60) NOT NULL,
                orden INT NOT NULL DEFAULT 0 CHECK (orden >= 0),
                activa BOOL NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_categoria_local_nombre UNIQUE (local_id, LOWER(nombre))
            );

            CREATE TABLE IF NOT EXISTS proveedor (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                contacto VARCHAR(80),
                telefono VARCHAR(20),
                email VARCHAR(100),
                direccion VARCHAR(150),
                activo BOOL NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_proveedor_local_nombre UNIQUE (local_id, LOWER(nombre))
            );

            CREATE TABLE IF NOT EXISTS insumo (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                nombre VARCHAR(80) NOT NULL,
                unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('kg', 'L', 'und', 'botella', 'saco', 'lata', 'caja', 'paquete', 'bidon', 'jaba')),
                stock_actual DECIMAL(12, 3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
                stock_minimo DECIMAL(12, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
                costo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (costo_unitario >= 0),
                moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
                ultimo_proveedor_id UUID REFERENCES proveedor(id) ON DELETE SET NULL,
                fecha_ultima_compra TIMESTAMPTZ,
                estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'agotado', 'inactivo')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_insumo_local_nombre UNIQUE (local_id, LOWER(nombre))
            );

            CREATE TABLE IF NOT EXISTS proveedor_insumo_habitual (
                proveedor_id UUID NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (proveedor_id, insumo_id)
            );

            CREATE TABLE IF NOT EXISTS producto (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                categoria_id UUID NOT NULL REFERENCES categoria_producto(id) ON DELETE RESTRICT,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
                costo_estandar DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (costo_estandar >= 0),
                moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
                foto_url VARCHAR(255),
                disponibilidad VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (disponibilidad IN ('disponible', 'agotado')),
                motivo_agotado VARCHAR(30) CHECK (motivo_agotado IN ('quiebre_stock_receta', 'apagado_manual_cocina', 'decision_admin')),
                usuario_modifico_disp_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
                fecha_modificacion_disp TIMESTAMPTZ,
                requiere_preparacion BOOL NOT NULL DEFAULT true,
                activo BOOL NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_producto_local_nombre UNIQUE (local_id, LOWER(nombre))
            );

            CREATE TABLE IF NOT EXISTS producto_insumo (
                producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE RESTRICT,
                modo_calculo VARCHAR(20) NOT NULL DEFAULT 'rendimiento' CHECK (modo_calculo IN ('rendimiento', 'exacto')),
                rendimiento_platos DECIMAL(10, 2),
                cantidad_descuenta DECIMAL(12, 5) NOT NULL CHECK (cantidad_descuenta > 0),
                PRIMARY KEY (producto_id, insumo_id)
            );

            CREATE TABLE IF NOT EXISTS auditoria_stock_ajuste (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE RESTRICT,
                usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                stock_anterior DECIMAL(12, 3) NOT NULL,
                stock_nuevo DECIMAL(12, 3) NOT NULL CHECK (stock_nuevo >= 0),
                diferencia DECIMAL(12, 3) NOT NULL,
                motivo VARCHAR(40) NOT NULL CHECK (motivo IN ('conteo_fisico_inventario', 'merma_desperdicio', 'ingreso_manual', 'vencimiento_caducidad', 'rotura_accidente', 'inconsistencia_cocina')),
                notas TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS ficha_compra (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                proveedor_id UUID NOT NULL REFERENCES proveedor(id) ON DELETE RESTRICT,
                usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                tipo_comprobante VARCHAR(20) NOT NULL DEFAULT 'factura' CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_venta', 'guia_remision', 'recibo')),
                numero_comprobante VARCHAR(30) NOT NULL,
                es_autogenerado BOOL NOT NULL DEFAULT false,
                fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
                metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta_debito', 'credito_proveedor')),
                desglosa_igv BOOL NOT NULL DEFAULT true,
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                impuestos DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
                moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
                estado VARCHAR(20) NOT NULL DEFAULT 'registrada' CHECK (estado IN ('registrada', 'anulada')),
                motivo_anulacion TEXT,
                anulado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                anulado_at TIMESTAMPTZ,
                notas TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS ficha_compra_detalle (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                ficha_compra_id UUID NOT NULL REFERENCES ficha_compra(id) ON DELETE CASCADE,
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE RESTRICT,
                cantidad DECIMAL(10, 4) NOT NULL CHECK (cantidad > 0),
                precio_unitario DECIMAL(10, 4) NOT NULL CHECK (precio_unitario >= 0),
                subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0)
            );

            CREATE TRIGGER trg_set_updated_at_categoria_producto BEFORE UPDATE ON categoria_producto FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_proveedor BEFORE UPDATE ON proveedor FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_insumo BEFORE UPDATE ON insumo FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_producto BEFORE UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS ficha_compra_detalle CASCADE;
            DROP TABLE IF EXISTS ficha_compra CASCADE;
            DROP TABLE IF EXISTS auditoria_stock_ajuste CASCADE;
            DROP TABLE IF EXISTS producto_insumo CASCADE;
            DROP TABLE IF EXISTS producto CASCADE;
            DROP TABLE IF EXISTS proveedor_insumo_habitual CASCADE;
            DROP TABLE IF EXISTS insumo CASCADE;
            DROP TABLE IF EXISTS proveedor CASCADE;
            DROP TABLE IF EXISTS categoria_producto CASCADE;
        SQL);
    }
};
