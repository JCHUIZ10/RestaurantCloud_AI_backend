<?php

namespace App\Domains\Suscripcion\Services;

use App\Domains\Suscripcion\Exceptions\CambioPlanException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Asistente "qué conservar" del cambio programado: lista los recursos activos de la empresa,
 * propone lo que se conservaría por antigüedad y guarda la selección del propietario, que se
 * aplica al renovar. Se puede editar hasta la fecha efectiva del cambio.
 */
class SeleccionConservarService
{
    private const CLAVES = ['locales_ids', 'pisos_ids', 'mesas_ids', 'usuarios_ids'];

    public function __construct(private ConciliacionRecursosService $conciliacion) {}

    /**
     * @return array<string, mixed>
     */
    public function recursos(string $empresaId): array
    {
        [$suscripcion, $cambio, $plan] = $this->cargar($empresaId);

        return $this->describir($empresaId, $suscripcion, $cambio, $plan);
    }

    /**
     * @param  array<string, list<string>>  $seleccion
     * @return array<string, mixed>
     */
    public function guardar(string $empresaId, array $seleccion): array
    {
        return DB::transaction(function () use ($empresaId, $seleccion): array {
            [$suscripcion, $cambio, $plan] = $this->cargar($empresaId, true);
            $seleccion = $this->normalizar($seleccion);

            $this->validar($empresaId, $plan, $seleccion);

            $config = json_decode((string) $suscripcion->config_downgrade, true) ?: [];
            $config['seleccion'] = $seleccion;

            DB::table('suscripcion')->where('id', $suscripcion->id)->update([
                'config_downgrade' => json_encode($config),
                'recursos_conciliados' => true,
                'updated_at' => now(),
            ]);

            $suscripcion->config_downgrade = json_encode($config);

            return $this->describir($empresaId, $suscripcion, CambioProgramado::de($suscripcion), $plan);
        });
    }

    /**
     * @return array{0: object, 1: array{plan_id: int, ciclo: string, seleccion: array<string, list<string>>|null}, 2: object}
     */
    private function cargar(string $empresaId, bool $bloquear = false): array
    {
        $consulta = DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at');
        $suscripcion = ($bloquear ? $consulta->lockForUpdate() : $consulta)->first();
        $cambio = $suscripcion ? CambioProgramado::de($suscripcion) : null;

        if (! $cambio) {
            throw new CambioPlanException('SIN_CAMBIO_PROGRAMADO', 'No tienes ningún cambio de plan programado.', 409);
        }

        return [$suscripcion, $cambio, DB::table('plan')->where('id', $cambio['plan_id'])->first()];
    }

    /**
     * @param  array<string, mixed>  $seleccion
     * @return array<string, list<string>>
     */
    private function normalizar(array $seleccion): array
    {
        $normalizada = [];
        foreach (self::CLAVES as $clave) {
            $normalizada[$clave] = array_values(array_unique(array_map('strval', (array) ($seleccion[$clave] ?? []))));
        }

        return $normalizada;
    }

    /**
     * @param  array<string, list<string>>  $seleccion
     */
    private function validar(string $empresaId, object $plan, array $seleccion): void
    {
        $locales = DB::table('local')->where('empresa_id', $empresaId)->where('estado', 'activo')->pluck('nombre', 'id');
        $elegidos = $seleccion['locales_ids'];

        if (array_diff($elegidos, $locales->keys()->all()) !== []) {
            $this->rechazar('Hay locales que no pertenecen a tu empresa o ya están inactivos.');
        }
        if (count($elegidos) > (int) $plan->max_locales) {
            $this->rechazar("El Plan {$plan->nombre} admite hasta {$plan->max_locales} locales.");
        }

        $pisos = DB::table('piso')->whereIn('id', $seleccion['pisos_ids'])->where('estado', 'activo')->pluck('local_id', 'id');
        $this->exigirTodos($seleccion['pisos_ids'], $pisos->keys()->all(), 'ambientes');
        $this->exigirDentro($pisos->all(), $elegidos, 'Un ambiente elegido pertenece a un local que no conservas.');
        $this->exigirCupo($pisos->all(), (int) $plan->max_pisos, $locales->all(), 'ambientes');

        $mesas = DB::table('mesa')->whereIn('id', $seleccion['mesas_ids'])->where('estado', '!=', 'inactiva')->get(['id', 'local_id', 'piso_id']);
        $this->exigirTodos($seleccion['mesas_ids'], $mesas->pluck('id')->all(), 'mesas');
        $this->exigirDentro($mesas->pluck('local_id', 'id')->all(), $elegidos, 'Una mesa elegida pertenece a un local que no conservas.');
        if (array_diff($mesas->pluck('piso_id')->all(), $seleccion['pisos_ids']) !== []) {
            $this->rechazar('Una mesa elegida pertenece a un ambiente que no conservas.');
        }
        $this->exigirCupo($mesas->pluck('local_id', 'id')->all(), (int) $plan->max_mesas, $locales->all(), 'mesas');

        $personal = DB::table('usuario')->where('empresa_id', $empresaId)->whereIn('id', $seleccion['usuarios_ids'])
            ->where('estado', 'activo')->where('rol', '!=', 'propietario')->pluck('local_id', 'id');
        $this->exigirTodos($seleccion['usuarios_ids'], $personal->keys()->all(), 'cuentas de personal');
        $this->exigirDentro($personal->all(), $elegidos, 'Una cuenta elegida pertenece a un local que no conservas.');

        // El administrador de cada local conservado siempre cuenta dentro del cupo del local
        $administradores = DB::table('usuario')->where('empresa_id', $empresaId)->whereIn('local_id', $elegidos)
            ->where('estado', 'activo')->where('rol', 'admin_local')->pluck('local_id', 'id');
        $this->exigirCupo($personal->all() + $administradores->all(), (int) $plan->max_usuarios, $locales->all(), 'personas');
    }

    /**
     * @param  list<string>  $pedidos
     * @param  list<string>  $validos
     */
    private function exigirTodos(array $pedidos, array $validos, string $recurso): void
    {
        if (array_diff($pedidos, $validos) !== []) {
            $this->rechazar("Hay {$recurso} que no pertenecen a tu empresa o ya están inactivos.");
        }
    }

    /**
     * @param  array<string, string>  $porLocal  id del recurso => id del local
     * @param  list<string>  $localesElegidos
     */
    private function exigirDentro(array $porLocal, array $localesElegidos, string $mensaje): void
    {
        if (array_diff(array_values($porLocal), $localesElegidos) !== []) {
            $this->rechazar($mensaje);
        }
    }

    /**
     * @param  array<string, string>  $porLocal  id del recurso => id del local
     * @param  array<string, string>  $nombres  id del local => nombre
     */
    private function exigirCupo(array $porLocal, int $maximo, array $nombres, string $recurso): void
    {
        foreach (array_count_values(array_values($porLocal)) as $localId => $cantidad) {
            if ($cantidad > $maximo) {
                $this->rechazar("{$nombres[$localId]} admite hasta {$maximo} {$recurso} en este plan y elegiste {$cantidad}.");
            }
        }
    }

    private function rechazar(string $mensaje): never
    {
        throw new CambioPlanException('SELECCION_INVALIDA', $mensaje, 422);
    }

    /**
     * @param  array{plan_id: int, ciclo: string, seleccion: array<string, list<string>>|null}|null  $cambio
     * @return array<string, mixed>
     */
    private function describir(string $empresaId, object $suscripcion, ?array $cambio, object $plan): array
    {
        $locales = DB::table('local')->where('empresa_id', $empresaId)->where('estado', 'activo')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'nombre']);
        $ids = $locales->pluck('id')->all();

        $pisos = DB::table('piso')->whereIn('local_id', $ids)->where('estado', 'activo')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'local_id', 'nombre', 'columnas', 'filas']);
        $mesas = DB::table('mesa')->whereIn('local_id', $ids)->where('estado', '!=', 'inactiva')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'piso_id', 'numero', 'capacidad', 'forma', 'posicion_x', 'posicion_y']);
        $personal = DB::table('usuario')->where('empresa_id', $empresaId)->whereIn('local_id', $ids)
            ->where('estado', 'activo')->where('rol', '!=', 'propietario')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'local_id', 'nombre', 'rol']);

        $guardada = $cambio['seleccion'] ?? null;

        return [
            'plan_destino' => [
                'id' => (int) $plan->id,
                'nombre' => $plan->nombre,
                'ciclo' => $cambio['ciclo'] ?? 'mensual',
                'limites' => [
                    'max_locales' => (int) $plan->max_locales,
                    'max_pisos' => (int) $plan->max_pisos,
                    'max_mesas' => (int) $plan->max_mesas,
                    'max_usuarios' => (int) $plan->max_usuarios,
                ],
            ],
            'fecha_efectiva' => $suscripcion->fecha_fin_periodo ? Carbon::parse($suscripcion->fecha_fin_periodo)->toIso8601String() : null,
            'dias_restantes' => PeriodoFacturacion::diasRestantes($suscripcion),
            'seleccion_guardada' => $guardada !== null,
            'locales' => $locales->map(fn ($local): array => [
                'id' => $local->id,
                'nombre' => $local->nombre,
                'pisos' => $pisos->where('local_id', $local->id)->map(fn ($piso): array => [
                    'id' => $piso->id,
                    'nombre' => $piso->nombre,
                    'columnas' => (int) $piso->columnas,
                    'filas' => (int) $piso->filas,
                    'mesas' => $mesas->where('piso_id', $piso->id)->map(fn ($mesa): array => [
                        'id' => $mesa->id,
                        'numero' => $mesa->numero,
                        'capacidad' => (int) $mesa->capacidad,
                        'forma' => $mesa->forma,
                        'posicion_x' => (int) $mesa->posicion_x,
                        'posicion_y' => (int) $mesa->posicion_y,
                    ])->values()->all(),
                ])->values()->all(),
                'personal' => $personal->where('local_id', $local->id)->map(fn ($persona): array => [
                    'id' => $persona->id,
                    'nombre' => $persona->nombre,
                    'rol' => $persona->rol,
                    'protegido' => $persona->rol === 'admin_local',
                ])->values()->all(),
            ])->values()->all(),
            'seleccion' => $this->conciliacion->conservados($empresaId, $plan, $guardada),
        ];
    }
}
