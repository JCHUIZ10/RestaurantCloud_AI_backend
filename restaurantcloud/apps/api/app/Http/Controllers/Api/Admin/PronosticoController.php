<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Pronostico\Exceptions\PronosticoException;
use App\Domains\Pronostico\Services\PronosticoService;
use App\Domains\Pronostico\Services\ReposicionExportacionService;
use App\Domains\Pronostico\Services\ReposicionService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Pronóstico de demanda y reposición sugerida (CU-ADMIN-07, CU-PROP-08).
 */
class PronosticoController extends Controller
{
    public function __construct(
        private PronosticoService $pronosticos,
        private ReposicionService $reposicion,
        private ReposicionExportacionService $exportacion,
    ) {}

    /**
     * Pide un pronóstico a ms-pronóstico y calcula la reposición para los días de cobertura elegidos.
     */
    public function generar(Request $request): JsonResponse
    {
        $validador = Validator::make($request->all(), [
            'cobertura_dias' => ['sometimes', 'integer', 'in:3,5,7'],
            'solicitud_id' => ['sometimes', 'uuid'],
        ]);
        if ($validador->fails()) {
            return $this->errorDeValidacion($validador->errors()->toArray());
        }

        $usuario = $request->user();

        try {
            $resultado = $this->pronosticos->generar(
                (string) $usuario->empresa_id,
                $usuario->local_id,
                (string) $usuario->id,
                (int) $request->input('cobertura_dias', 7),
                $request->input('solicitud_id'),
            );
        } catch (PronosticoException $e) {
            return $this->error($e);
        }

        return ApiResponse::ok($resultado, 201);
    }

    /**
     * Último pronóstico del local con su reposición sugerida.
     */
    public function ultimo(Request $request): JsonResponse
    {
        $usuario = $request->user();

        try {
            return ApiResponse::ok($this->pronosticos->ultimo((string) $usuario->empresa_id, $usuario->local_id));
        } catch (PronosticoException $e) {
            return $this->error($e);
        }
    }

    /**
     * El administrador acepta, ajusta o descarta una recomendación de reposición.
     */
    public function decidir(Request $request, string $id): JsonResponse
    {
        $validador = Validator::make($request->all(), [
            'estado' => ['required', 'in:aceptada,ajustada,descartada'],
            'cantidad_final' => ['required_if:estado,ajustada', 'nullable', 'numeric', 'min:0', 'max:999999999'],
        ]);
        if ($validador->fails()) {
            return $this->errorDeValidacion($validador->errors()->toArray());
        }

        $usuario = $request->user();
        if (! $usuario->local_id) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Selecciona una sede para decidir una recomendación.', 422);
        }

        try {
            $recomendacion = $this->reposicion->decidir(
                $id,
                $usuario->local_id,
                (string) $usuario->id,
                $request->input('estado'),
                $request->filled('cantidad_final') ? round((float) $request->input('cantidad_final'), 3) : null,
            );
        } catch (PronosticoException $e) {
            return $this->error($e);
        }

        return ApiResponse::ok($recomendacion);
    }

    /**
     * El administrador decide varias recomendaciones a la vez (la pantalla de compra). Todas o ninguna.
     */
    public function decidirLote(Request $request): JsonResponse
    {
        $validador = Validator::make($request->all(), [
            'decisiones' => ['required', 'array', 'min:1', 'max:200'],
            'decisiones.*.id' => ['required', 'uuid', 'distinct'],
            'decisiones.*.estado' => ['required', 'in:aceptada,ajustada,descartada'],
            'decisiones.*.cantidad_final' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
        ]);
        $validador->after(function ($v) use ($request): void {
            foreach ((array) $request->input('decisiones', []) as $i => $d) {
                if (($d['estado'] ?? null) === 'ajustada' && ! isset($d['cantidad_final'])) {
                    $v->errors()->add("decisiones.{$i}.cantidad_final", 'La cantidad final es obligatoria al ajustar.');
                }
            }
        });
        if ($validador->fails()) {
            return $this->errorDeValidacion($validador->errors()->toArray());
        }

        $usuario = $request->user();
        if (! $usuario->local_id) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Selecciona una sede para decidir recomendaciones.', 422);
        }

        $decisiones = array_map(fn (array $d): array => [
            'id' => $d['id'],
            'estado' => $d['estado'],
            'cantidad_final' => isset($d['cantidad_final']) ? round((float) $d['cantidad_final'], 3) : null,
        ], $request->input('decisiones'));

        try {
            return ApiResponse::ok($this->reposicion->decidirLote($decisiones, $usuario->local_id, (string) $usuario->id));
        } catch (PronosticoException $e) {
            return $this->error($e);
        }
    }

    /**
     * Lista de compra del último pronóstico, en Excel o PDF, agrupada por proveedor.
     */
    public function exportar(Request $request): JsonResponse|BinaryFileResponse|Response
    {
        $validador = Validator::make($request->query(), ['formato' => ['sometimes', 'in:xlsx,pdf']]);
        if ($validador->fails()) {
            return $this->errorDeValidacion($validador->errors()->toArray());
        }

        $usuario = $request->user();

        try {
            $ultima = $this->pronosticos->ultimaReposicion($usuario->local_id);
        } catch (PronosticoException $e) {
            return $this->error($e);
        }

        if (! $this->exportacion->hayQueComprar($ultima['reposicion'])) {
            return ApiResponse::error('ERR_SIN_COMPRA', 'No hay nada que comprar: todo está cubierto o descartado.', 404);
        }

        $local = (string) DB::table('local')->where('id', $usuario->local_id)->value('nombre');
        $cabeceras = ['Cache-Control' => 'no-store', 'Access-Control-Expose-Headers' => 'Content-Disposition'];

        if ($request->query('formato', 'xlsx') === 'pdf') {
            $pdf = $this->exportacion->pdf($ultima['reposicion'], $local, $ultima['cobertura_dias'], (string) $usuario->nombre);

            return response($pdf['contenido'], 200, $cabeceras + [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$pdf['nombre'].'"',
            ]);
        }

        $archivo = $this->exportacion->xlsx($ultima['reposicion'], $local, $ultima['cobertura_dias'], (string) $usuario->nombre);

        return response()->download($archivo['ruta'], $archivo['nombre'], $cabeceras + [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function error(PronosticoException $e): JsonResponse
    {
        return ApiResponse::error($e->codigo, $e->getMessage(), $e->status, $e->detalles ?: null);
    }

    /**
     * @param  array<string, list<string>>  $errores
     */
    private function errorDeValidacion(array $errores): JsonResponse
    {
        $campos = [];
        foreach ($errores as $campo => $motivos) {
            $campos[] = ['campo' => $campo, 'motivo' => $motivos[0]];
        }

        return ApiResponse::error('ERR_VALIDACION', 'Los datos enviados no son válidos.', 422, ['campos' => $campos]);
    }
}
