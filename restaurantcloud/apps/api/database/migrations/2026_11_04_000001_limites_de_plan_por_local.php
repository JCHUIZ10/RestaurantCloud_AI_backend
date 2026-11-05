<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Los límites de pisos, mesas y personal pasan a medirse por local; solo el número
 * de locales sigue siendo de la empresa. Se redefinen los valores del catálogo y se
 * crean los índices que usan los conteos por local.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            UPDATE plan SET max_pisos = 1, max_mesas = 25, max_usuarios = 6 WHERE id = 1;
            UPDATE plan SET max_pisos = 3, max_mesas = 40, max_usuarios = 12 WHERE id = 2;
            UPDATE plan SET max_pisos = 5, max_mesas = 80, max_usuarios = 25 WHERE id = 3;

            CREATE INDEX IF NOT EXISTS idx_piso_local_estado ON piso(local_id, estado);
            CREATE INDEX IF NOT EXISTS idx_mesa_local_estado ON mesa(local_id, estado);
            CREATE INDEX IF NOT EXISTS idx_usuario_local_estado ON usuario(local_id, estado);
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP INDEX IF EXISTS idx_piso_local_estado;
            DROP INDEX IF EXISTS idx_mesa_local_estado;
            DROP INDEX IF EXISTS idx_usuario_local_estado;

            UPDATE plan SET max_pisos = 1, max_mesas = 25, max_usuarios = 5 WHERE id = 1;
            UPDATE plan SET max_pisos = 6, max_mesas = 60, max_usuarios = 15 WHERE id = 2;
            UPDATE plan SET max_pisos = 50, max_mesas = 600, max_usuarios = 40 WHERE id = 3;
        SQL);
    }
};
