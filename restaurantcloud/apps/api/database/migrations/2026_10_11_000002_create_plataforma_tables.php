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
            CREATE TABLE IF NOT EXISTS plan (
                id INT PRIMARY KEY,
                nombre VARCHAR(50) NOT NULL UNIQUE,
                slug VARCHAR(60) NOT NULL UNIQUE,
                descripcion VARCHAR(255),
                precio_mensual DECIMAL(10, 2) NOT NULL CHECK (precio_mensual >= 0),
                precio_anual DECIMAL(10, 2) NOT NULL CHECK (precio_anual >= 0),
                max_locales INT NOT NULL CHECK (max_locales >= 1),
                max_pisos INT NOT NULL CHECK (max_pisos >= 1),
                max_mesas INT NOT NULL CHECK (max_mesas >= 1),
                max_usuarios INT NOT NULL CHECK (max_usuarios >= 1),
                incluye_reservas BOOL NOT NULL DEFAULT false,
                incluye_reportes_avanzados BOOL NOT NULL DEFAULT false,
                incluye_asistente_ia BOOL NOT NULL DEFAULT false,
                incluye_prediccion_ia BOOL NOT NULL DEFAULT false,
                activo BOOL NOT NULL DEFAULT true,
                visible_publico BOOL NOT NULL DEFAULT true,
                stripe_product_id VARCHAR(100),
                stripe_price_id_mensual VARCHAR(100),
                stripe_price_id_anual VARCHAR(100),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS empresa (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                razon_social VARCHAR(150) NOT NULL,
                tipo_identidad_fiscal VARCHAR(10) NOT NULL CHECK (tipo_identidad_fiscal IN ('RUC_20', 'RUC_10')),
                ruc VARCHAR(11) NOT NULL UNIQUE CHECK (ruc ~ '^[0-9]{11}$'),
                correo_contacto VARCHAR(100) NOT NULL,
                telefono VARCHAR(20) NOT NULL,
                plan_id INT NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
                ultima_suscripcion_id UUID,
                estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'periodo_gracia', 'suspendida', 'pendiente_baja', 'eliminada')),
                origen_alta VARCHAR(30) NOT NULL DEFAULT 'autoservicio_stripe' CHECK (origen_alta IN ('autoservicio_stripe', 'manual_admin')),
                nota_alta TEXT,
                stripe_customer_id VARCHAR(100),
                fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS suscripcion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
                plan_id INT NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
                proximo_plan_id INT REFERENCES plan(id) ON DELETE RESTRICT,
                fecha_inicio TIMESTAMPTZ NOT NULL,
                fecha_fin_periodo TIMESTAMPTZ NOT NULL,
                estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'en_gracia', 'pendiente_ajuste', 'cancelada', 'suspendida')),
                dias_gracia_restantes INT NOT NULL DEFAULT 5 CHECK (dias_gracia_restantes BETWEEN 0 AND 5),
                fecha_corte_gracia TIMESTAMPTZ,
                ultimo_error_cobro TEXT,
                reintentos_stripe_conteo INT NOT NULL DEFAULT 0,
                recursos_conciliados BOOL NOT NULL DEFAULT false,
                config_downgrade JSONB,
                stripe_subscription_id VARCHAR(100),
                stripe_schedule_id VARCHAR(100),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            ALTER TABLE empresa 
                DROP CONSTRAINT IF EXISTS fk_empresa_ultima_suscripcion,
                ADD CONSTRAINT fk_empresa_ultima_suscripcion 
                FOREIGN KEY (ultima_suscripcion_id) REFERENCES suscripcion(id) ON DELETE SET NULL;

            -- 1.3.1 Catálogo Maestro de Ubicación Geográfica Nacional (UBIGEO INEI / SUNAT)
            CREATE TABLE IF NOT EXISTS departamento (
                codigo CHAR(2) PRIMARY KEY,
                nombre VARCHAR(50) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS provincia (
                codigo CHAR(4) PRIMARY KEY,
                departamento_codigo CHAR(2) NOT NULL REFERENCES departamento(codigo) ON DELETE RESTRICT,
                nombre VARCHAR(50) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS distrito (
                codigo CHAR(6) PRIMARY KEY,
                provincia_codigo CHAR(4) NOT NULL REFERENCES provincia(codigo) ON DELETE RESTRICT,
                departamento_codigo CHAR(2) NOT NULL REFERENCES departamento(codigo) ON DELETE RESTRICT,
                nombre VARCHAR(50) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS local (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                slug VARCHAR(100) NOT NULL UNIQUE,
                direccion VARCHAR(200) NOT NULL,
                ubigeo_cod CHAR(6) NOT NULL REFERENCES distrito(codigo) ON DELETE RESTRICT,
                departamento VARCHAR(50) NOT NULL DEFAULT 'Áncash',
                provincia VARCHAR(50) NOT NULL DEFAULT 'Santa',
                distrito VARCHAR(50) NOT NULL DEFAULT 'Chimbote',
                ciudad VARCHAR(100) NOT NULL DEFAULT 'Chimbote',
                referencia VARCHAR(200),
                telefono VARCHAR(20) NOT NULL,
                zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
                moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
                giro_negocio VARCHAR(30) NOT NULL DEFAULT 'en_blanco' CHECK (giro_negocio IN ('polleria', 'cevicheria', 'chifa', 'en_blanco')),
                estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS usuario (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
                local_id UUID REFERENCES local(id) ON DELETE SET NULL,
                nombre VARCHAR(100) NOT NULL,
                correo VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                telefono VARCHAR(20),
                rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin_saas', 'propietario', 'admin_local', 'mozo', 'cocina', 'cajero')),
                estado VARCHAR(25) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'pendiente_activacion')),
                ultimo_login TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_usuario_empresa_correo UNIQUE (empresa_id, correo)
            );

            CREATE TABLE IF NOT EXISTS suscripcion_suspension (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
                suscripcion_id UUID NOT NULL REFERENCES suscripcion(id) ON DELETE CASCADE,
                tipo_evento VARCHAR(30) NOT NULL CHECK (tipo_evento IN ('suspension_temporal', 'baja_definitiva')),
                motivo VARCHAR(100) NOT NULL,
                detalle_justificacion TEXT NOT NULL CHECK (LENGTH(detalle_justificacion) >= 15),
                fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                fecha_reactivacion TIMESTAMPTZ,
                reactivado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                nota_reactivacion TEXT,
                ejecutado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                fecha_eliminacion_programada TIMESTAMPTZ,
                token_portabilidad VARCHAR(255),
                token_portabilidad_expira_at TIMESTAMPTZ,
                estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'resuelta_reactivada', 'ejecutada_baja')),
                creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                actualizado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS pago (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE RESTRICT,
                suscripcion_id UUID REFERENCES suscripcion(id) ON DELETE SET NULL,
                plan_id INT NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
                monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
                fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                estado VARCHAR(20) NOT NULL CHECK (estado IN ('exitoso', 'fallido', 'reembolsado')),
                origen_pago VARCHAR(40) NOT NULL DEFAULT 'stripe' CHECK (origen_pago IN ('stripe', 'transferencia_bancaria', 'deposito_bancario', 'yape_empresa', 'efectivo')),
                stripe_payment_id VARCHAR(100),
                numero_operacion VARCHAR(100),
                nota TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TRIGGER trg_set_updated_at_plan BEFORE UPDATE ON plan FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_empresa BEFORE UPDATE ON empresa FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_suscripcion BEFORE UPDATE ON suscripcion FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_local BEFORE UPDATE ON local FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_usuario BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS pago CASCADE;
            DROP TABLE IF EXISTS suscripcion_suspension CASCADE;
            DROP TABLE IF EXISTS usuario CASCADE;
            DROP TABLE IF EXISTS local CASCADE;
            ALTER TABLE IF EXISTS empresa DROP CONSTRAINT IF EXISTS fk_empresa_ultima_suscripcion;
            DROP TABLE IF EXISTS suscripcion CASCADE;
            DROP TABLE IF EXISTS empresa CASCADE;
            DROP TABLE IF EXISTS plan CASCADE;
        SQL);
    }
};
