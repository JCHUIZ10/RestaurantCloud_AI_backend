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
            CREATE TABLE IF NOT EXISTS incidente (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                codigo VARCHAR(20) NOT NULL UNIQUE,
                titulo VARCHAR(120) NOT NULL,
                categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('servicio_cliente', 'disciplinario', 'rotura_merma', 'seguridad_higiene', 'caja_dinero', 'otro')),
                descripcion TEXT NOT NULL,
                medidas_inmediatas TEXT,
                fecha_hora TIMESTAMPTZ NOT NULL,
                gravedad VARCHAR(20) NOT NULL CHECK (gravedad IN ('baja', 'media', 'alta')),
                foto_url VARCHAR(255),
                empleado_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
                registrado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_revision', 'resuelto')),
                visto_por_propietario BOOL NOT NULL DEFAULT false,
                fecha_visto TIMESTAMPTZ,
                nota_propietario TEXT,
                motivo_revision TEXT,
                resolucion_nota TEXT,
                resuelto_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                fecha_resolucion TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS notificacion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
                local_id UUID REFERENCES local(id) ON DELETE CASCADE,
                usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
                rol_destinatario VARCHAR(30) CHECK (rol_destinatario IN ('mozo', 'cocina', 'cajero', 'admin_local', 'propietario')),
                tipo VARCHAR(50) NOT NULL,
                prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
                titulo VARCHAR(120) NOT NULL,
                mensaje TEXT NOT NULL,
                entidad_tipo VARCHAR(50),
                entidad_id UUID,
                leida BOOL NOT NULL DEFAULT false,
                fecha_leida TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS log_auditoria (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
                local_id UUID REFERENCES local(id) ON DELETE CASCADE,
                usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
                accion VARCHAR(100) NOT NULL,
                entidad_tipo VARCHAR(60) NOT NULL,
                entidad_id UUID NOT NULL,
                detalle JSONB,
                fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS pedido_anulacion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
                pedido_item_id UUID REFERENCES pedido_item(id) ON DELETE CASCADE,
                tipo_anulacion VARCHAR(30) NOT NULL CHECK (tipo_anulacion IN ('item_individual', 'comanda_completa')),
                mesa_id UUID NOT NULL REFERENCES mesa(id) ON DELETE RESTRICT,
                mesa_numero VARCHAR(50) NOT NULL,
                producto_id UUID REFERENCES producto(id) ON DELETE SET NULL,
                producto_nombre VARCHAR(120),
                cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
                precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                monto_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                mozo_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                anulado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                motivo_categoria VARCHAR(30) NOT NULL CHECK (motivo_categoria IN ('error_registro', 'demora_cliente', 'queja_calidad', 'cambio_plato', 'retiro_sin_consumo', 'otro')),
                motivo_detalle TEXT NOT NULL CHECK (LENGTH(motivo_detalle) >= 10),
                pedido_created_at TIMESTAMPTZ NOT NULL,
                anulado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                minutos_espera INT NOT NULL,
                estado_anterior VARCHAR(30) NOT NULL,
                es_merma BOOL NOT NULL DEFAULT false,
                costo_merma DECIMAL(10, 2),
                revisado BOOL NOT NULL DEFAULT false,
                revisado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                revisado_at TIMESTAMPTZ,
                notas_supervision TEXT,
                incidente_id UUID REFERENCES incidente(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS snapshot_stock_diario (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                stock_cantidad DECIMAL(12, 3) NOT NULL,
                estuvo_agotado BOOL NOT NULL DEFAULT false,
                CONSTRAINT uq_snapshot_stock_diario UNIQUE (insumo_id, local_id, fecha)
            );

            CREATE TRIGGER trg_set_updated_at_incidente BEFORE UPDATE ON incidente FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS snapshot_stock_diario CASCADE;
            DROP TABLE IF EXISTS pedido_anulacion CASCADE;
            DROP TABLE IF EXISTS log_auditoria CASCADE;
            DROP TABLE IF EXISTS notificacion CASCADE;
            DROP TABLE IF EXISTS incidente CASCADE;
        SQL);
    }
};
