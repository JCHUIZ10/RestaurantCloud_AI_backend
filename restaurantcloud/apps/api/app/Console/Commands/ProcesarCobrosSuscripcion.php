<?php

namespace App\Console\Commands;

use App\Domains\Suscripcion\Services\CobroSuscripcionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcesarCobrosSuscripcion extends Command
{
    protected $signature = 'suscripciones:procesar-cobros
        {--dry-run : Solo informa lo que haría, sin cobrar ni cambiar estados}';

    protected $description = 'Renueva las suscripciones vencidas, reintenta los cobros en periodo de gracia y suspende las empresas cuya gracia terminó.';

    public function handle(CobroSuscripcionService $cobros): int
    {
        // Comando de plataforma: recorre todos los tenants, por lo que actúa como admin SaaS ante RLS.
        DB::statement("SELECT set_config('app.current_user_role', 'admin_saas', false)");

        $simular = (bool) $this->option('dry-run');

        $resumen = $cobros->procesarVencimientos($simular, fn (string $mensaje) => $this->line($mensaje));

        $this->info(($simular ? '[simulación] ' : '').sprintf(
            'Renovadas: %d · Fallidas: %d · Reintentos OK: %d · Reintentos fallidos: %d · Suspendidas: %d · Sin acción: %d',
            $resumen['renovadas'],
            $resumen['fallidas'],
            $resumen['reintentos_exitosos'],
            $resumen['reintentos_fallidos'],
            $resumen['suspendidas'],
            $resumen['omitidas'],
        ));

        return self::SUCCESS;
    }
}
