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
            CREATE TABLE IF NOT EXISTS reserva (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                cliente_nombre VARCHAR(100) NOT NULL,
                cliente_telefono VARCHAR(20) NOT NULL,
                fecha_hora TIMESTAMPTZ NOT NULL,
                num_personas INT NOT NULL CHECK (num_personas > 0),
                estado VARCHAR(20) NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'bloqueada', 'atendida', 'cancelada', 'no_show')),
                creado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                excepcion_id UUID REFERENCES horario_excepcion(id) ON DELETE SET NULL,
                motivo_cancelacion TEXT,
                notificado_cliente BOOL NOT NULL DEFAULT false,
                metodo_notificacion VARCHAR(20) NOT NULL DEFAULT 'ninguno' CHECK (metodo_notificacion IN ('ninguno', 'whatsapp', 'llamada', 'presencial')),
                notificado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                fecha_notificado TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS reserva_mesa (
                reserva_id UUID NOT NULL REFERENCES reserva(id) ON DELETE CASCADE,
                mesa_id UUID NOT NULL REFERENCES mesa(id) ON DELETE CASCADE,
                PRIMARY KEY (reserva_id, mesa_id)
            );

            CREATE TABLE IF NOT EXISTS promocion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
                valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
                tope_maximo_descuento DECIMAL(10, 2) CHECK (tope_maximo_descuento > 0),
                monto_minimo_consumo DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (monto_minimo_consumo >= 0),
                dias_semana SMALLINT[] DEFAULT '{1,2,3,4,5,6,7}',
                hora_inicio TIME,
                hora_fin TIME,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                limite_usos INT CHECK (limite_usos > 0),
                usos_actuales INT NOT NULL DEFAULT 0 CHECK (usos_actuales >= 0),
                activa BOOL NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_promocion_local_nombre UNIQUE (local_id, LOWER(nombre)),
                CONSTRAINT chk_promocion_fechas CHECK (fecha_inicio <= fecha_fin)
            );

            CREATE TABLE IF NOT EXISTS metodo_pago_local (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                codigo VARCHAR(30) NOT NULL,
                nombre VARCHAR(60) NOT NULL,
                activo BOOL NOT NULL DEFAULT true,
                comision_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 50.00),
                datos_adicionales JSONB DEFAULT '{}'::jsonb,
                icono VARCHAR(30) NOT NULL DEFAULT 'wallet',
                orden INT NOT NULL DEFAULT 1 CHECK (orden >= 1),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_metodo_pago_local UNIQUE (local_id, codigo)
            );

            CREATE TABLE IF NOT EXISTS pedido (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                numero_comanda INT NOT NULL,
                mesa_id UUID NOT NULL REFERENCES mesa(id) ON DELETE RESTRICT,
                mozo_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                estado VARCHAR(20) NOT NULL DEFAULT 'enviado' CHECK (estado IN ('borrador', 'enviado', 'cuenta_pedida', 'cobrado', 'anulado')),
                comensales INT NOT NULL DEFAULT 1 CHECK (comensales > 0),
                precuenta_generada_at TIMESTAMPTZ,
                promocion_id UUID REFERENCES promocion(id) ON DELETE RESTRICT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS pedido_item (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
                producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
                cantidad INT NOT NULL CHECK (cantidad > 0),
                precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
                nota_cocina VARCHAR(200),
                estado VARCHAR(20) NOT NULL DEFAULT 'en_cola' CHECK (estado IN ('en_cola', 'en_preparacion', 'listo', 'entregado', 'no_disponible', 'anulado')),
                numero_ronda INT NOT NULL DEFAULT 1 CHECK (numero_ronda >= 1),
                motivo_anulacion VARCHAR(255),
                anulado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                es_merma BOOL NOT NULL DEFAULT false,
                fecha_inicio_coccion TIMESTAMPTZ,
                fecha_listo_cocina TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT chk_cocina_tiempos_coherentes CHECK (fecha_listo_cocina IS NULL OR fecha_inicio_coccion IS NULL OR fecha_listo_cocina >= fecha_inicio_coccion)
            );

            CREATE TRIGGER trg_set_updated_at_reserva BEFORE UPDATE ON reserva FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_promocion BEFORE UPDATE ON promocion FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_metodo_pago_local BEFORE UPDATE ON metodo_pago_local FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_pedido BEFORE UPDATE ON pedido FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_pedido_item BEFORE UPDATE ON pedido_item FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS pedido_item CASCADE;
            DROP TABLE IF EXISTS pedido CASCADE;
            DROP TABLE IF EXISTS metodo_pago_local CASCADE;
            DROP TABLE IF EXISTS promocion CASCADE;
            DROP TABLE IF EXISTS reserva_mesa CASCADE;
            DROP TABLE IF EXISTS reserva CASCADE;
        SQL);
    }
};
