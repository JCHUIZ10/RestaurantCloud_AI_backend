<?php

namespace App\Domains\Pronostico\Services;

use App\Domains\Horario\Services\JornadaOperativaService;
use App\Domains\Pronostico\Exceptions\PronosticoException;
use App\Support\Identificador;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Pide a ms-pronóstico la demanda de los platos de la carta de un local y calcula la reposición de insumos.
 *
 * El núcleo conoce lo que ms-pronóstico no: la jornada operativa en curso, los platos activos y los días en
 * que el local no abrirá (horario semanal y excepciones). Siempre pide 7 días y recorta la cobertura (3, 5 o 7)
 * de su lado, así que cada ejecución sirve para cualquiera de las tres.
 */
class PronosticoService
{
    public const HORIZONTE_DIAS = 7;

    /** Límite de platos por solicitud en ms-pronóstico. */
    private const MAX_PRODUCTOS = 500;

    public function __construct(
        private PronosticoCliente $cliente,
        private ReposicionService $reposicion,
        private JornadaOperativaService $jornadas,
    ) {}

    /**
     * @return array{pronostico: array<string, mixed>, cobertura_dias: int, reposicion: list<array<string, mixed>>}
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

        return [
            'pronostico' => $pronostico,
            'cobertura_dias' => $cobertura,
            'reposicion' => $this->reposicion->registrar($localId, $pronostico, $cobertura),
        ];
    }

    /**
     * Último pronóstico con recomendaciones del local. Si ms-pronóstico no responde, devuelve igual la
     * reposición (que es del núcleo) con `pronostico = null`.
     *
     * @return array{pronostico: array<string, mixed>|null, cobertura_dias: int, creada_en: string, reposicion: list<array<string, mixed>>}
     */
    public function ultimo(string $empresaId, ?string $localId): array
    {
        $localId = $this->exigirLocal($localId);

        $ultima = $this->reposicion->ultimaEjecucion($localId);
        if ($ultima === null) {
            throw new PronosticoException('ERR_SIN_PRONOSTICO', 'Este local todavía no tiene un pronóstico.', 404);
        }

        try {
            $pronostico = $this->cliente->obtener($ultima['ejecucion_id'], $empresaId, $localId);
        } catch (PronosticoException) {
            $pronostico = null;
        }

        return [
            'pronostico' => $pronostico,
            'cobertura_dias' => $ultima['cobertura_dias'],
            'creada_en' => $ultima['creada_en'],
            'reposicion' => $this->reposicion->deEjecucion($ultima['ejecucion_id'], $localId),
        ];
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
