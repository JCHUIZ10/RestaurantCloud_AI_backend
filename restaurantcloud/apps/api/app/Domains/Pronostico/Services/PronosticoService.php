<?php

namespace App\Domains\Pronostico\Services;

use App\Domains\Horario\Services\JornadaOperativaService;
use App\Domains\Pronostico\Exceptions\PronosticoException;
use App\Support\Identificador;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Pide a ms-pronóstico la demanda de los platos de la carta de un local y calcula la reposición de insumos.
 *
 * El núcleo conoce lo que ms-pronóstico no: la jornada operativa en curso, los platos activos y los días en
 * que el local no abrirá (horario semanal y excepciones). Siempre pide 7 días y recorta la cobertura (3, 5 o 7)
 * de su lado, así que cada ejecución sirve para cualquiera de las tres.
 *
 * Cada pronóstico se guarda en `solicitud_pronostico` con su nivel (doc-2u/03-prediccion-en-locales-nuevos.md):
 * 0 esperando las primeras ventas, 1 en preparación, 2 casi a punto, 3 al punto (con modelo propio).
 */
class PronosticoService
{
    public const HORIZONTE_DIAS = 7;

    /** Días con ventas desde los que un local deja de estar «en preparación» (4 semanas, como las reglas de rc_pronostico). */
    public const DIAS_NIVEL_2 = 28;

    /** Límite de platos por solicitud en ms-pronóstico. */
    private const MAX_PRODUCTOS = 500;

    public function __construct(
        private PronosticoCliente $cliente,
        private ReposicionService $reposicion,
        private JornadaOperativaService $jornadas,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function generar(string $empresaId, ?string $localId, string $usuarioId, int $cobertura, ?string $solicitudId): array
    {
        $localId = $this->exigirLocal($localId);

        $jornadaActual = $this->jornadas->fechaJornadaDe($localId, now(), 0);
        $inicio = Carbon::parse($jornadaActual)->addDay();

        $pronostico = $this->cliente->generar([
            'solicitud_id' => $solicitudId ?? Identificador::ordenado(),
            'empresa_id' => $empresaId,
            'local_id' => $localId,
            'solicitada_por' => $usuarioId,
            'jornada_actual' => $jornadaActual,
            'fecha_inicio' => $inicio->toDateString(),
            'horizonte_dias' => self::HORIZONTE_DIAS,
            'productos' => $this->productosActivos($localId),
            'dias_cerrados' => $this->diasCerrados($localId, $inicio),
        ]);

        $diasConVentas = $pronostico['historial']['dias_con_ventas'] ?? null;
        $modeloVersion = $pronostico['modelo']['modelo_version'] ?? null;
        $nivel = $this->nivel($diasConVentas, $modeloVersion !== null);

        // Los reintentos con la misma solicitud devuelven la misma ejecución: se conserva el registro original.
        DB::table('solicitud_pronostico')->insertOrIgnore([
            'local_id' => $localId,
            'ejecucion_id' => $pronostico['ejecucion_id'],
            'cobertura_dias' => $cobertura,
            'nivel' => $nivel,
            'dias_con_ventas' => $diasConVentas,
            'modelo_version' => $modeloVersion,
            'solicitada_por' => $usuarioId,
            'created_at' => now(),
        ]);
        $guardada = DB::table('solicitud_pronostico')->where('ejecucion_id', $pronostico['ejecucion_id'])->first();

        return $this->armar($empresaId, $localId, $pronostico, $guardada, $this->reposicion->registrar($localId, $pronostico, (int) $guardada->cobertura_dias));
    }

    /**
     * Último pronóstico del local. Si ms-pronóstico no responde, devuelve igual la reposición (que es del
     * núcleo) con `pronostico = null`.
     *
     * @return array<string, mixed>
     */
    public function ultimo(string $empresaId, ?string $localId): array
    {
        $localId = $this->exigirLocal($localId);

        $ultima = $this->ultimaSolicitud($localId);
        if ($ultima === null) {
            throw new PronosticoException('ERR_SIN_PRONOSTICO', 'Este local todavía no tiene un pronóstico.', 404);
        }

        try {
            $pronostico = $this->cliente->obtener($ultima->ejecucion_id, $empresaId, $localId);
        } catch (PronosticoException) {
            $pronostico = null;
        }

        return $this->armar($empresaId, $localId, $pronostico, $ultima, $this->reposicion->deEjecucion($ultima->ejecucion_id, $localId));
    }

    /**
     * Reposición del último pronóstico, sin consultar a ms-pronóstico (para exportar la lista de compra).
     *
     * @return array{reposicion: list<array<string, mixed>>, cobertura_dias: int}
     */
    public function ultimaReposicion(?string $localId): array
    {
        $localId = $this->exigirLocal($localId);

        $ultima = $this->ultimaSolicitud($localId);
        if ($ultima === null) {
            throw new PronosticoException('ERR_SIN_PRONOSTICO', 'Este local todavía no tiene un pronóstico.', 404);
        }

        return [
            'reposicion' => $this->reposicion->deEjecucion($ultima->ejecucion_id, $localId),
            'cobertura_dias' => (int) $ultima->cobertura_dias,
        ];
    }

    /**
     * Última solicitud de pronóstico de una sede (`null` si nunca pidió uno).
     */
    public function ultimaSolicitud(string $localId): ?object
    {
        return DB::table('solicitud_pronostico')
            ->where('local_id', $localId)
            ->orderByDesc('created_at')
            ->first();
    }

    /**
     * Nivel de la predicción según las ventas del local y si tiene un modelo propio.
     */
    public function nivel(?int $diasConVentas, bool $tieneModelo): int
    {
        return match (true) {
            $diasConVentas === 0 => 0,
            $tieneModelo => 3,
            $diasConVentas !== null && $diasConVentas < self::DIAS_NIVEL_2 => 1,
            default => 2,
        };
    }

    /**
     * @param  array<string, mixed>|null  $pronostico
     * @param  list<array<string, mixed>>  $reposicion
     * @return array<string, mixed>
     */
    private function armar(string $empresaId, string $localId, ?array $pronostico, object $solicitud, array $reposicion): array
    {
        $nivel = (int) $solicitud->nivel;
        $dias = $solicitud->dias_con_ventas === null ? null : (int) $solicitud->dias_con_ventas;

        if ($pronostico !== null) {
            $pronostico['advertencias'] = $this->advertenciasVigentes($localId, $pronostico);
        }

        return [
            'nivel' => $nivel,
            'cobertura_dias' => (int) $solicitud->cobertura_dias,
            'creada_en' => Carbon::parse($solicitud->created_at)->setTimezone(config('app.timezone'))->toIso8601String(),
            'confianza' => $nivel === 3 ? $this->confianza($empresaId, $localId, $solicitud->modelo_version) : null,
            'progreso' => $nivel < 3 ? [
                'dias_con_ventas' => $dias ?? 0,
                // Del nivel 1 al 2 faltan días de ventas; del 2 al 3 depende de entrenar el modelo del local.
                'faltan_para_siguiente' => match ($nivel) {
                    0 => 1,
                    1 => max(1, self::DIAS_NIVEL_2 - ($dias ?? 0)),
                    default => null,
                },
            ] : null,
            'pronostico' => $pronostico,
            'reposicion' => $reposicion,
            'totales' => $this->reposicion->totales($reposicion),
        ];
    }

    /**
     * Precisión del modelo del local, en lenguaje de usuario: cuántos platos se equivoca al día por plato y
     * cuánto mejora respecto de repetir la semana anterior. Las métricas de una versión no cambian.
     *
     * @return array{error_promedio: float, mejora_pct: int}|null
     */
    private function confianza(string $empresaId, string $localId, ?string $modeloVersion): ?array
    {
        if ($modeloVersion === null) {
            return null;
        }

        $metricas = Cache::remember(
            "pronostico:metricas:{$modeloVersion}",
            now()->addDay(),
            fn (): ?array => $this->cliente->metricasDelModelo($empresaId, $localId),
        );

        if (! isset($metricas['mae_modelo'], $metricas['mae_ingenuo']) || (float) $metricas['mae_ingenuo'] <= 0) {
            return null;
        }

        return [
            'error_promedio' => round((float) $metricas['mae_modelo'], 1),
            'mejora_pct' => (int) round((1 - (float) $metricas['mae_modelo'] / (float) $metricas['mae_ingenuo']) * 100),
        ];
    }

    /**
     * ms-pronóstico avisa que no recibe ventas recientes. Solo el núcleo sabe si es cierto: el aviso se
     * conserva únicamente si la sede tiene comprobantes posteriores a lo que ms-analítica llegó a recibir.
     * Un local nuevo, sin ventas, no debe ver un aviso de fallo (N-5).
     *
     * @param  array<string, mixed>  $pronostico
     * @return list<string>
     */
    private function advertenciasVigentes(string $localId, array $pronostico): array
    {
        $advertencias = array_values($pronostico['advertencias'] ?? []);
        if (! in_array('datos_desactualizados', $advertencias, true)) {
            return $advertencias;
        }

        $recibidoHasta = $pronostico['datos']['actualizados_hasta'] ?? null;
        $hayVentasSinRecibir = DB::table('comprobante')
            ->where('local_id', $localId)
            ->where('estado', 'emitido')
            ->when($recibidoHasta !== null, fn ($q) => $q->where('fecha', '>', $recibidoHasta))
            ->exists();

        return $hayVentasSinRecibir
            ? $advertencias
            : array_values(array_diff($advertencias, ['datos_desactualizados']));
    }

    private function exigirLocal(?string $localId): string
    {
        if ($localId === null || $localId === '') {
            throw new PronosticoException(
                'ERR_LOCAL_REQUERIDO',
                'Selecciona una sede para consultar o generar su pronóstico.',
                422,
            );
        }

        return $localId;
    }

    /**
     * @return list<array{producto_id: string, nombre: string}>
     */
    private function productosActivos(string $localId): array
    {
        $productos = DB::table('producto')
            ->where('local_id', $localId)
            ->where('activo', true)
            ->orderBy('nombre')
            ->limit(self::MAX_PRODUCTOS)
            ->get(['id', 'nombre'])
            ->map(fn (object $producto): array => ['producto_id' => $producto->id, 'nombre' => mb_substr($producto->nombre, 0, 150)])
            ->all();

        if ($productos === []) {
            throw new PronosticoException('ERR_SIN_PRODUCTOS', 'La carta no tiene platos activos que pronosticar.', 422);
        }

        return $productos;
    }

    /**
     * Días del periodo en que el local no atiende: sin turnos en el horario semanal o con una excepción de
     * cierre. Un local sin horario configurado no informa cierres, porque no se puede saber cuándo abre.
     *
     * @return list<string>
     */
    private function diasCerrados(string $localId, Carbon $inicio): array
    {
        if (! DB::table('horario_atencion')->where('local_id', $localId)->where('atiende', true)->exists()) {
            return [];
        }

        $cerrados = [];
        for ($i = 0; $i < self::HORIZONTE_DIAS; $i++) {
            $fecha = $inicio->copy()->addDays($i)->toDateString();
            if (! $this->jornadas->resolver($localId, $fecha, 0)['atiende']) {
                $cerrados[] = $fecha;
            }
        }

        return $cerrados;
    }
}
