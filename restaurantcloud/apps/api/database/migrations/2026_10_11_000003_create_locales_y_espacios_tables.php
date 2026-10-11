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
            CREATE TABLE IF NOT EXISTS horario_atencion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
                nombre_turno VARCHAR(50) NOT NULL DEFAULT 'Principal',
                atiende BOOL NOT NULL DEFAULT true,
                hora_inicio TIME NOT NULL,
                hora_fin TIME NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_horario_atencion UNIQUE (local_id, dia_semana, hora_inicio)
            );

            CREATE TABLE IF NOT EXISTS horario_excepcion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                cerrado BOOL NOT NULL DEFAULT true,
                hora_inicio TIME,
                hora_fin TIME,
                motivo VARCHAR(150) NOT NULL,
                created_by UUID REFERENCES usuario(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_horario_excepcion UNIQUE (local_id, fecha)
            );

            CREATE TABLE IF NOT EXISTS configuracion_kds (
                local_id UUID PRIMARY KEY REFERENCES local(id) ON DELETE CASCADE,
                tiempo_optimo_verde_min INT NOT NULL DEFAULT 15 CHECK (tiempo_optimo_verde_min BETWEEN 3 AND 60),
                tiempo_alerta_ambar_min INT NOT NULL DEFAULT 25 CHECK (tiempo_alerta_ambar_min BETWEEN 5 AND 120),
                tiempo_maximo_pase_min INT NOT NULL DEFAULT 3 CHECK (tiempo_maximo_pase_min BETWEEN 1 AND 30),
                alerta_sonora_nueva_comanda BOOL NOT NULL DEFAULT true,
                alerta_sonora_comanda_roja BOOL NOT NULL DEFAULT true,
                intervalo_sonido_rojo_seg INT NOT NULL DEFAULT 60 CHECK (intervalo_sonido_rojo_seg BETWEEN 15 AND 300),
                vista_predeterminada VARCHAR(20) NOT NULL DEFAULT 'fifo' CHECK (vista_predeterminada IN ('fifo', 'all_day')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT chk_kds_umbrales_coherentes CHECK (tiempo_alerta_ambar_min > tiempo_optimo_verde_min)
            );

            CREATE TABLE IF NOT EXISTS politicas_reserva (
                local_id UUID PRIMARY KEY REFERENCES local(id) ON DELETE CASCADE,
                acepta_reservas BOOL NOT NULL DEFAULT false,
                duracion_reserva_min INT NOT NULL DEFAULT 90 CHECK (duracion_reserva_min BETWEEN 30 AND 240),
                buffer_reserva_min INT NOT NULL DEFAULT 15 CHECK (buffer_reserva_min BETWEEN 0 AND 60),
                tolerancia_no_show_min INT NOT NULL DEFAULT 15 CHECK (tolerancia_no_show_min BETWEEN 5 AND 60),
                minutos_bloqueo_previo INT NOT NULL DEFAULT 30 CHECK (minutos_bloqueo_previo BETWEEN 0 AND 120),
                margen_recordatorio_min INT NOT NULL DEFAULT 120 CHECK (margen_recordatorio_min >= 0),
                anticipacion_minima_horas INT NOT NULL DEFAULT 2 CHECK (anticipacion_minima_horas BETWEEN 0 AND 48),
                anticipacion_maxima_dias INT NOT NULL DEFAULT 30 CHECK (anticipacion_maxima_dias BETWEEN 1 AND 90),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS piso (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                nombre VARCHAR(60) NOT NULL,
                columnas INT NOT NULL DEFAULT 5 CHECK (columnas BETWEEN 1 AND 12),
                filas INT NOT NULL DEFAULT 3 CHECK (filas BETWEEN 1 AND 10),
                estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS mesa (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                piso_id UUID NOT NULL REFERENCES piso(id) ON DELETE CASCADE,
                numero VARCHAR(10) NOT NULL,
                capacidad INT NOT NULL CHECK (capacidad BETWEEN 1 AND 20),
                forma VARCHAR(20) NOT NULL DEFAULT 'cuadrada' CHECK (forma IN ('cuadrada', 'redonda', 'rectangular')),
                posicion_x INT NOT NULL DEFAULT 0,
                posicion_y INT NOT NULL DEFAULT 0,
                permite_union BOOL NOT NULL DEFAULT true,
                mesa_principal_id UUID REFERENCES mesa(id) ON DELETE SET NULL,
                estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'bloqueada')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_mesa_piso_numero UNIQUE (local_id, piso_id, numero),
                CONSTRAINT chk_mesa_no_auto_referencia CHECK (mesa_principal_id IS NULL OR mesa_principal_id != id)
            );

            CREATE TRIGGER trg_set_updated_at_horario_atencion BEFORE UPDATE ON horario_atencion FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_configuracion_kds BEFORE UPDATE ON configuracion_kds FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_politicas_reserva BEFORE UPDATE ON politicas_reserva FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_piso BEFORE UPDATE ON piso FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
            CREATE TRIGGER trg_set_updated_at_mesa BEFORE UPDATE ON mesa FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TABLE IF EXISTS mesa CASCADE;
            DROP TABLE IF EXISTS piso CASCADE;
            DROP TABLE IF EXISTS politicas_reserva CASCADE;
            DROP TABLE IF EXISTS configuracion_kds CASCADE;
            DROP TABLE IF EXISTS horario_excepcion CASCADE;
            DROP TABLE IF EXISTS horario_atencion CASCADE;
        SQL);
    }
};
