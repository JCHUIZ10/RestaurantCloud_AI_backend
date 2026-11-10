<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Retira el módulo de Incidentes (CU-ADMIN-11 / CU-PROP-06), diferido hasta producción.
 *
 * up():   elimina pedido_anulacion.incidente_id, incidente_bitacora e incidente
 *         (el DROP arrastra sus índices y la política RLS p_incidente_tenant).
 * down(): recrea esa estructura tal como la definían 02_schema_ddl.sql, 03_indexes.sql
 *         y 04_rls_security.sql. Recupera la estructura, NO los datos: los registros
 *         existentes se pierden al ejecutar up().
 *
 * Guía para recrear el módulo:
 *  1. php artisan migrate:rollback (o una migración nueva con el DDL de down()).
 *  2. Código web/API: restaurar desde el commit cd9f315 (último previo al retiro):
 *     páginas y componentes de incidentes (admin y propietario), propietarioIncidentesService,
 *     types/propietario.ts, tipos de incidentes en types/admin.ts, métodos del mockAdminService,
 *     rutas/ROUTES, y el flujo "Escalar a Incidente" de Auditoría de Anulaciones
 *     (ruta escalar-incidente, AnulacionController, AnulacionAuditoriaService, ModalEscalarIncidente).
 *  3. Fotos de evidencia: TenantStorageService::generarKeyPrivado($empresaId, $localId,
 *     'incidentes', $incidenteId, $extension, $archivoId); el prefijo 'privado_incidentes'
 *     del manifest del local debía agregarse otra vez.
 *  4. Especificación funcional: wireframe/administrador/CU-ADMIN-11-incidentes-internos y
 *     wireframe/propietario/CU-PROP-06-incidentes-empresa.
 *
 * Idempotente: en BDs nuevas el esquema base aún crea estas tablas y esta migración las quita.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE pedido_anulacion DROP COLUMN IF EXISTS incidente_id;
            DROP TABLE IF EXISTS incidente_bitacora;
            DROP TABLE IF EXISTS incidente;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE IF NOT EXISTS incidente (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                codigo VARCHAR(20) NOT NULL UNIQUE, -- ej. INC-2026-084
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

            CREATE TABLE IF NOT EXISTS incidente_bitacora (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                incidente_id UUID NOT NULL REFERENCES incidente(id) ON DELETE CASCADE,
                usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
                tipo_evento VARCHAR(30) NOT NULL CHECK (tipo_evento IN (
                    'apertura',
                    'directiva_propietario',
                    'indagacion',
                    'resolucion'
                )),
                nota TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_incidente_bitacora_incidente
                ON incidente_bitacora(incidente_id, created_at ASC);
            CREATE INDEX IF NOT EXISTS idx_incidente_local_fecha
                ON incidente(local_id, fecha_hora DESC);

            ALTER TABLE incidente ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS p_incidente_tenant ON incidente;
            CREATE POLICY p_incidente_tenant ON incidente
                FOR ALL USING (fn_pertenece_tenant(local_id));

            ALTER TABLE pedido_anulacion
                ADD COLUMN IF NOT EXISTS incidente_id UUID REFERENCES incidente(id) ON DELETE SET NULL;
        SQL);
    }
};
