<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Console\Output\OutputInterface;

class ExportarCarta extends Command
{
    protected $signature = 'carta:exportar {local_id : UUID del local}';

    protected $description = 'Entrega en JSON la carta, los mozos y las promociones de un local, para el generador de ventas sintéticas de ms-analítica.';

    public function handle(): int
    {
        $localId = (string) $this->argument('local_id');
        if (! Str::isUuid($localId)) {
            $this->error("«{$localId}» no es un UUID.");

            return self::FAILURE;
        }

        // Comando de plataforma: lee un local sin sesión de usuario, por lo que actúa como admin SaaS ante RLS.
        // El rol se fija solo durante la lectura y se restituye al terminar, aunque haya una transacción envolvente.
        $resultado = DB::transaction(function () use ($localId): array|string {
            $anterior = (string) DB::scalar("SELECT current_setting('app.current_user_role', true)");
            DB::statement("SELECT set_config('app.current_user_role', 'admin_saas', true)");

            try {
                return $this->armarCarta($localId);
            } finally {
                DB::statement("SELECT set_config('app.current_user_role', ?, true)", [$anterior]);
            }
        });

        if (is_string($resultado)) {
            $this->error($resultado);

            return self::FAILURE;
        }

        // Salida sin formato: es JSON para otra herramienta y no debe pasar por las etiquetas de estilo de la consola.
        $this->getOutput()->write(json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), true, OutputInterface::OUTPUT_RAW);

        return self::SUCCESS;
    }

    /**
     * @return array<string, mixed>|string La carta, o el mensaje de por qué no se puede armar.
     */
    private function armarCarta(string $localId): array|string
    {
        $local = DB::table('local')->where('id', $localId)->first(['id', 'empresa_id']);
        if ($local === null) {
            return "No existe el local {$localId}.";
        }

        $productos = DB::table('producto as p')
            ->join('categoria_producto as c', 'c.id', '=', 'p.categoria_id')
            ->where('p.local_id', $localId)
            ->where('p.activo', true)
            ->orderBy('c.orden')
            ->orderBy('p.nombre')
            ->get(['p.id as producto_id', 'p.nombre', 'c.id as categoria_id', 'c.nombre as categoria_nombre', 'p.precio', 'p.costo_estandar'])
            ->all();

        $mozos = DB::table('usuario')
            ->where('local_id', $localId)
            ->where('rol', 'mozo')
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->all();

        if ($productos === [] || $mozos === []) {
            return 'El local necesita al menos un producto activo y un mozo activo.';
        }

        $promociones = DB::table('promocion')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->orderBy('codigo')
            ->get(['id', 'tipo_descuento', 'valor', 'dias_semana', 'hora_inicio', 'hora_fin', 'monto_minimo_consumo'])
            ->map(fn (object $promocion): array => [
                'id' => $promocion->id,
                'tipo_descuento' => $promocion->tipo_descuento,
                'valor' => $promocion->valor,
                'dias_semana' => $this->diasDeSemana($promocion->dias_semana),
                'hora_inicio' => $promocion->hora_inicio,
                'hora_fin' => $promocion->hora_fin,
                'monto_minimo_consumo' => $promocion->monto_minimo_consumo,
            ])
            ->all();

        return [
            'empresa_id' => $local->empresa_id,
            'local_id' => $local->id,
            'productos' => $productos,
            'mozos' => $mozos,
            'promociones' => $promociones,
        ];
    }

    /**
     * PostgreSQL entrega el arreglo como texto: «{1,2,3}».
     *
     * @return list<int>
     */
    private function diasDeSemana(?string $arreglo): array
    {
        $contenido = trim((string) $arreglo, '{}');

        return $contenido === '' ? [] : array_map('intval', explode(',', $contenido));
    }
}
