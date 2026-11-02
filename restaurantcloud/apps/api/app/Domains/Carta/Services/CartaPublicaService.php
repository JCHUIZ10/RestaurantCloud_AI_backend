<?php

namespace App\Domains\Carta\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Domains\Promociones\Services\PromocionService;
use Carbon\Carbon;
use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * CU-CLIENTE-01: Carta digital pública de una sede, consultada por su slug sin sesión.
 * Solo expone datos aptos para el comensal: nunca costos, recetas ni márgenes.
 */
class CartaPublicaService
{
    /** Tope de desactualización cuando algún cambio no invalida la caché de forma explícita. */
    private const TTL_SEGUNDOS = 60;

    public function __construct(
        private TenantStorageService $almacenamiento,
        private PromocionService $promociones,
    ) {}

    /**
     * Descarta la carta cacheada de una sede cuando se confirme la transacción en curso, para que
     * ninguna lectura intermedia vuelva a cachear datos anteriores. Se invoca al modificar producto,
     * categoría, promoción o disponibilidad.
     */
    public static function invalidar(string $localId): void
    {
        DB::afterCommit(fn () => Cache::forget(self::clave($localId)));
    }

    /**
     * Las funciones fn_inventario_* de PostgreSQL agotan o reactivan platos sin pasar por los
     * servicios de carta. Indica si su respuesta reporta algún plato con cambio de disponibilidad.
     *
     * @param  array<string, mixed>  $respuesta  JSON decodificado que devuelve la función
     */
    public static function cambiaDisponibilidad(array $respuesta): bool
    {
        foreach (['platos_bloqueados_en_carta', 'quiebres_generados', 'platos_reactivados', 'platos_agotados'] as $clave) {
            if (! empty($respuesta[$clave])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $respuesta  JSON decodificado que devuelve la función fn_inventario_*
     */
    public static function invalidarTrasInventario(string $localId, array $respuesta): void
    {
        if (self::cambiaDisponibilidad($respuesta)) {
            self::invalidar($localId);
        }
    }

    private static function clave(string $localId): string
    {
        return "carta_publica:{$localId}";
    }

    /**
     * @return array{sede: array<string, mixed>, promociones: list<array<string, mixed>>, categorias: list<array<string, mixed>>}|null
     */
    public function obtenerPorSlug(string $slug): ?array
    {
        $local = $this->conContextoPublico(null, fn () => DB::table('local')
            ->where('slug', $slug)
            ->where('estado', 'activo')
            ->first(['id', 'nombre', 'slug', 'direccion', 'distrito', 'telefono', 'moneda', 'zona_horaria']));

        if (! $local) {
            return null;
        }

        return Cache::remember(
            self::clave($local->id),
            self::TTL_SEGUNDOS,
            fn () => $this->conContextoPublico($local->id, fn () => $this->construir($local)),
        );
    }

    /**
     * Ejecuta la consulta con el contexto RLS de acceso público. Los valores son locales a la
     * transacción, por lo que no se filtran a la siguiente petición que reutilice la conexión (Octane).
     */
    private function conContextoPublico(?string $localId, Closure $consulta): mixed
    {
        return DB::transaction(function () use ($localId, $consulta): mixed {
            DB::select(
                "SELECT set_config('app.public_access', 'true', true), set_config('app.current_local_id', ?, true)",
                [$localId ?? ''],
            );

            return $consulta();
        });
    }

    private function construir(object $local): array
    {
        $ahora = Carbon::now($local->zona_horaria ?: 'America/Lima');

        return [
            'sede' => [
                'id' => $local->id,
                'nombre' => $local->nombre,
                'slug' => $local->slug,
                'direccion' => $local->direccion,
                'distrito' => $local->distrito,
                'telefono' => $local->telefono,
                'moneda' => $local->moneda,
                ...$this->estadoDeAtencion($local->id, $ahora),
            ],
            'promociones' => $this->promocionesVigentes($local->id, $ahora),
            'categorias' => $this->categoriasConPlatos($local->id),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function categoriasConPlatos(string $localId): array
    {
        $productos = DB::table('producto')
            ->where('local_id', $localId)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'categoria_id', 'nombre', 'descripcion', 'precio', 'foto_url', 'disponibilidad']);

        $miniaturas = $this->almacenamiento->miniaturasDisponibles(
            $productos->pluck('foto_url')->filter()->unique()->values()->all()
        );
        $platosPorCategoria = $productos->groupBy('categoria_id');

        return DB::table('categoria_producto')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'orden'])
            ->filter(fn ($categoria) => $platosPorCategoria->has($categoria->id))
            ->map(fn ($categoria): array => [
                'id' => $categoria->id,
                'nombre' => $categoria->nombre,
                'orden' => (int) $categoria->orden,
                'platos' => $platosPorCategoria[$categoria->id]->map(fn ($plato): array => [
                    'id' => $plato->id,
                    'nombre' => $plato->nombre,
                    'descripcion' => $plato->descripcion,
                    'precio' => (float) $plato->precio,
                    'foto_url' => $this->almacenamiento->resolverUrlCatalogo($plato->foto_url),
                    'foto_thumb_url' => $this->almacenamiento->resolverUrlCatalogo($miniaturas[$plato->foto_url] ?? null),
                    'disponibilidad' => $plato->disponibilidad,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * Promociones activas, dentro de su rango de fechas, con cupo disponible y válidas el día de hoy.
     *
     * @return list<array<string, mixed>>
     */
    private function promocionesVigentes(string $localId, Carbon $ahora): array
    {
        return DB::table('promocion')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->orderBy('fecha_fin')
            ->orderBy('nombre')
            ->get()
            ->filter(fn ($promocion) => $this->promociones->calcularEstadoVisual($promocion) === 'vigente')
            ->filter(fn ($promocion) => in_array($ahora->dayOfWeekIso, $this->diasDePromocion($promocion->dias_semana), true))
            ->map(fn ($promocion): array => [
                'id' => $promocion->id,
                'nombre' => $promocion->nombre,
                'descripcion' => $promocion->descripcion,
                'tipo_descuento' => $promocion->tipo_descuento,
                'valor' => (float) $promocion->valor,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<int>
     */
    private function diasDePromocion(?string $diasSemana): array
    {
        $crudo = trim((string) $diasSemana, '{}');

        return $crudo === '' ? [1, 2, 3, 4, 5, 6, 7] : array_map('intval', explode(',', $crudo));
    }

    /**
     * Texto de horario de hoy y si la sede está abierta ahora, considerando feriados y turnos nocturnos.
     *
     * @return array{horario: string, abierto: bool}
     */
    private function estadoDeAtencion(string $localId, Carbon $ahora): array
    {
        $excepcion = DB::table('horario_excepcion')
            ->where('local_id', $localId)
            ->where('fecha', $ahora->toDateString())
            ->first();

        if ($excepcion && $excepcion->cerrado) {
            return ['horario' => 'Cerrado hoy', 'abierto' => false];
        }

        $diaHoy = $ahora->dayOfWeekIso;
        $diaAyer = $diaHoy === 1 ? 7 : $diaHoy - 1;
        $turnos = DB::table('horario_atencion')
            ->where('local_id', $localId)
            ->where('atiende', true)
            ->whereIn('dia_semana', [$diaHoy, $diaAyer])
            ->orderBy('hora_inicio')
            ->get(['dia_semana', 'hora_inicio', 'hora_fin']);

        $turnosHoy = $excepcion && $excepcion->hora_inicio && $excepcion->hora_fin
            ? collect([$excepcion])
            : $turnos->where('dia_semana', $diaHoy);

        if ($turnosHoy->isEmpty()) {
            return ['horario' => 'Cerrado hoy', 'abierto' => false];
        }

        $minutoActual = ($ahora->hour * 60) + $ahora->minute;
        $abierto = $turnosHoy->contains(function ($turno) use ($minutoActual): bool {
            [$inicio, $fin] = $this->rangoEnMinutos($turno);

            return $minutoActual >= $inicio && $minutoActual < $fin;
        });

        // Un turno de ayer que cruzó la medianoche sigue abierto hasta su hora de cierre.
        $abierto = $abierto || $turnos->where('dia_semana', $diaAyer)->contains(function ($turno) use ($minutoActual): bool {
            [$inicio, $fin] = $this->rangoEnMinutos($turno);

            return $fin > 1440 && $minutoActual < $fin - 1440;
        });

        $texto = $turnosHoy
            ->map(fn ($turno): string => $this->formatearHora($turno->hora_inicio).' - '.$this->formatearHora($turno->hora_fin))
            ->implode(' / ');

        return ['horario' => $texto, 'abierto' => $abierto];
    }

    /**
     * @return array{0: int, 1: int} Minutos desde la medianoche; el fin supera 1440 si el turno cruza el día.
     */
    private function rangoEnMinutos(object $turno): array
    {
        $inicio = $this->minutos($turno->hora_inicio);
        $fin = $this->minutos($turno->hora_fin);

        return [$inicio, $fin <= $inicio ? $fin + 1440 : $fin];
    }

    private function minutos(string $hora): int
    {
        [$horas, $minutos] = array_map('intval', explode(':', $hora));

        return ($horas * 60) + $minutos;
    }

    private function formatearHora(string $hora): string
    {
        return Carbon::createFromFormat('H:i:s', strlen($hora) === 5 ? $hora.':00' : $hora)->format('g:i A');
    }
}
