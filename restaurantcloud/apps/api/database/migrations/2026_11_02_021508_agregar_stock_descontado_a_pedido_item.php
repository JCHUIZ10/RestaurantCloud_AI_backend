<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Las BDs creadas con initdb antes de 2026-11-02 no tienen esta columna, que las
 * funciones fn_inventario_* usan para no descontar dos veces la receta de un ítem.
 * En BDs nuevas ya viene en 02_schema_ddl.sql y esta migración no hace nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE pedido_item ADD COLUMN IF NOT EXISTS stock_descontado BOOL NOT NULL DEFAULT false');
    }

    public function down(): void
    {
        // Sin reversión: la columna es parte del esquema base.
    }
};
