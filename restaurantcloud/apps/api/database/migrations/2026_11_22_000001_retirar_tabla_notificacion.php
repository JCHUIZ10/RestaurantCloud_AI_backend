<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Retira la tabla `notificacion`: los avisos del personal (CU-TRANS-01) pasan a ms-notificaciones.
 *
 * Desde la etapa 7 el núcleo ya no guarda avisos: publica eventos (`outbox_event`) y el microservicio
 * los convierte en avisos en su propia base. Nada leía esta tabla salvo la deduplicación del aviso de
 * turno previo pendiente, que ahora consulta `log_auditoria`.
 *
 * up():   elimina la tabla (el DROP arrastra sus índices y la política RLS p_notificacion_isolation).
 * down(): recrea la estructura tal como la definían 02_schema_ddl.sql, 03_indexes.sql y
 *         04_rls_security.sql. Recupera la estructura, NO los datos.
 *
 * Idempotente: en BDs nuevas el esquema base aún crea la tabla y esta migración la quita.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS notificacion;');
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
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

            CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_leida
                ON notificacion(empresa_id, usuario_id, leida, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notificacion_local_rol
                ON notificacion(empresa_id, local_id, rol_destinatario, leida, created_at DESC);

            ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS p_notificacion_isolation ON notificacion;
            CREATE POLICY p_notificacion_isolation ON notificacion
                FOR ALL
                USING (
                    fn_es_admin_saas() OR (
                        empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
                        AND (
                            usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
                            OR (
                                usuario_id IS NULL
                                AND (local_id IS NULL OR fn_pertenece_tenant(local_id))
                                AND (rol_destinatario IS NULL OR rol_destinatario = NULLIF(current_setting('app.current_user_role', true), ''))
                            )
                        )
                    )
                );
        SQL);
    }
};
