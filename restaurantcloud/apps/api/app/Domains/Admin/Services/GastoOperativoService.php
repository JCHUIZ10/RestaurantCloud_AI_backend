<?php

namespace App\Domains\Admin\Services;

use App\Domains\Admin\Exceptions\FinanzasException;
use App\Domains\Caja\Services\EgresoGavetaService;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Gastos operativos de la sede (CU-ADMIN-14): alquiler, servicios, limpieza, caja chica, etc.
 *
 * Un gasto pagado con efectivo de la gaveta además deja un asiento de egreso en el turno abierto
 * (ver EgresoGavetaService). Un gasto mal registrado no se borra: se anula con motivo y deja de contar
 * en el flujo de caja y en el efectivo esperado del turno.
 */
class GastoOperativoService
{
    /** Códigos de comprobante admitidos para un gasto; el front muestra la etiqueta de cada uno. */
    public const TIPOS_COMPROBANTE = ['factura', 'boleta', 'recibo_honorarios', 'recibo_servicios', 'recibo_interno'];

    public function __construct(private EgresoGavetaService $egresosGaveta) {}

    /**
     * Gastos del rango, incluidos los anulados (se muestran tachados para que quede el rastro).
     *
     * @param  array{desde: string, hasta: string}  $rango
     * @return list<array<string, mixed>>
     */
    public function listar(string $localId, array $rango): array
    {
        return $this->consultaBase()
            ->where('g.local_id', $localId)
            ->whereBetween('g.fecha', [$rango['desde'], $rango['hasta']])
            ->orderByDesc('g.fecha')
            ->orderByDesc('g.created_at')
            ->get()
            ->map(fn ($fila): array => $this->mapear($fila))
            ->all();
    }

    /**
     * @param  array{categoria: string, monto: float|int|string, origen_fondos: string, proveedor_nombre: string, tipo_comprobante?: ?string, numero_documento?: ?string, descripcion: string, fecha: string}  $datos
     * @return array<string, mixed> el gasto registrado
     *
     * @throws FinanzasException si el gasto es en efectivo y no hay turno abierto, no alcanza el efectivo o la fecha no es de hoy.
     */
    public function registrar(string $localId, string $usuarioId, array $datos): array
    {
        $monto = round((float) $datos['monto'], 2);
        $enEfectivo = $datos['origen_fondos'] === 'efectivo_caja';
        $gastoId = (string) Str::uuid();

        DB::transaction(function () use ($localId, $usuarioId, $datos, $monto, $enEfectivo, $gastoId): void {
            $caja = $enEfectivo ? $this->egresosGaveta->reservar($localId, $monto, $datos['fecha']) : null;
            $ahora = now();

            DB::table('gasto_manual')->insert([
                'id' => $gastoId,
                'local_id' => $localId,
                'categoria' => $datos['categoria'],
                'monto' => $monto,
                'origen_fondos' => $datos['origen_fondos'],
                'caja_id' => $caja?->id,
                'proveedor_nombre' => trim($datos['proveedor_nombre']),
                'tipo_comprobante' => $this->textoOpcional($datos['tipo_comprobante'] ?? null) ?? 'recibo_interno',
                'numero_documento' => $this->textoOpcional($datos['numero_documento'] ?? null),
                'descripcion' => trim($datos['descripcion']),
                'fecha' => $datos['fecha'],
                'registrado_por' => $usuarioId,
                'created_at' => $ahora,
            ]);

            if ($caja) {
                $this->egresosGaveta->registrarMovimiento(
                    $caja,
                    EgresoGavetaService::TIPO_GASTO,
                    $monto,
                    $gastoId,
                    'Gasto de caja: '.trim($datos['proveedor_nombre'])
                );
            }

            $this->auditar($localId, $usuarioId, 'gasto.registrado', $gastoId, [
                'categoria' => $datos['categoria'],
                'monto' => $monto,
                'origen_fondos' => $datos['origen_fondos'],
                'caja_id' => $caja?->id,
            ]);
        });

        return $this->mapear($this->consultaBase()->where('g.id', $gastoId)->first());
    }

    /**
     * Anula un gasto con motivo. Un gasto pagado con efectivo de la gaveta solo se anula mientras su turno
     * siga abierto: el Reporte Z de un turno cerrado es inmutable y ya lo incluyó.
     *
     * @return array<string, mixed> el gasto anulado
     *
     * @throws FinanzasException
     */
    public function anular(string $localId, string $usuarioId, string $gastoId, string $motivo): array
    {
        DB::transaction(function () use ($localId, $usuarioId, $gastoId, $motivo): void {
            $gasto = DB::table('gasto_manual')
                ->where('id', $gastoId)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $gasto) {
                throw new FinanzasException('ERR_GASTO_NO_ENCONTRADO', 'El gasto no existe o pertenece a otra sede.', 404);
            }

            if ($gasto->estado === 'anulado') {
                throw new FinanzasException('ERR_GASTO_YA_ANULADO', 'Este gasto ya fue anulado.', 409);
            }

            if ($gasto->origen_fondos === 'efectivo_caja') {
                // Se bloquea el turno: un cierre simultáneo se serializa con esta anulación
                $caja = $gasto->caja_id
                    ? DB::table('caja')->where('id', $gasto->caja_id)->lockForUpdate()->first()
                    : null;

                if (! $caja || $caja->estado !== 'abierta') {
                    throw new FinanzasException(
                        'ERR_GASTO_TURNO_CERRADO',
                        'Este gasto salió de la gaveta de un turno que ya se cerró y su Reporte Z es inmutable, por lo que no se puede anular.',
                        409
                    );
                }
            }

            $ahora = now();
            $motivo = trim($motivo);

            DB::table('gasto_manual')->where('id', $gastoId)->update([
                'estado' => 'anulado',
                'motivo_anulacion' => $motivo,
                'anulado_por' => $usuarioId,
                'anulado_at' => $ahora,
            ]);

            $this->auditar($localId, $usuarioId, 'gasto.anulado', $gastoId, [
                'monto' => (float) $gasto->monto,
                'origen_fondos' => $gasto->origen_fondos,
                'caja_id' => $gasto->caja_id,
                'motivo' => $motivo,
            ]);
        });

        return $this->mapear($this->consultaBase()->where('g.id', $gastoId)->first());
    }

    private function consultaBase(): Builder
    {
        return DB::table('gasto_manual as g')
            ->join('usuario as u', 'u.id', '=', 'g.registrado_por')
            ->leftJoin('usuario as a', 'a.id', '=', 'g.anulado_por')
            ->leftJoin('caja as c', 'c.id', '=', 'g.caja_id')
            ->select([
                'g.id', 'g.local_id', 'g.categoria', 'g.monto', 'g.origen_fondos', 'g.caja_id',
                'c.correlativo as caja_correlativo', 'c.estado as caja_estado', 'g.proveedor_nombre',
                'g.tipo_comprobante', 'g.numero_documento', 'g.descripcion', 'g.fecha', 'g.registrado_por',
                'u.nombre as registrado_por_nombre', 'g.created_at', 'g.estado', 'g.motivo_anulacion',
                'g.anulado_por', 'a.nombre as anulado_por_nombre', 'g.anulado_at',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapear(object $fila): array
    {
        $anulado = $fila->estado === 'anulado';

        return [
            'id' => (string) $fila->id,
            'local_id' => (string) $fila->local_id,
            'categoria' => $fila->categoria,
            'monto' => round((float) $fila->monto, 2),
            'origen_fondos' => $fila->origen_fondos,
            'caja_id' => $fila->caja_id ? (string) $fila->caja_id : null,
            'caja_correlativo' => $fila->caja_correlativo !== null ? (int) $fila->caja_correlativo : null,
            'proveedor_nombre' => $fila->proveedor_nombre,
            'tipo_comprobante' => $fila->tipo_comprobante,
            'numero_documento' => $fila->numero_documento,
            'descripcion' => $fila->descripcion,
            'fecha' => Carbon::parse($fila->fecha)->toDateString(),
            'registrado_por' => (string) $fila->registrado_por,
            'registrado_por_nombre' => $fila->registrado_por_nombre,
            'created_at' => Carbon::parse($fila->created_at)->toIso8601String(),
            'estado' => $fila->estado,
            'motivo_anulacion' => $fila->motivo_anulacion,
            'anulado_por_nombre' => $fila->anulado_por_nombre,
            'anulado_at' => $fila->anulado_at ? Carbon::parse($fila->anulado_at)->toIso8601String() : null,
            // Un gasto en efectivo solo se anula mientras su turno siga abierto
            'puede_anularse' => ! $anulado && ($fila->origen_fondos !== 'efectivo_caja' || $fila->caja_estado === 'abierta'),
        ];
    }

    /** @param  array<string, mixed>  $detalle */
    private function auditar(string $localId, string $usuarioId, string $accion, string $gastoId, array $detalle): void
    {
        DB::table('log_auditoria')->insert([
            'id' => (string) Str::uuid(),
            'empresa_id' => DB::table('local')->where('id', $localId)->value('empresa_id'),
            'local_id' => $localId,
            'usuario_id' => $usuarioId,
            'accion' => $accion,
            'entidad_tipo' => 'gasto_manual',
            'entidad_id' => $gastoId,
            'detalle' => json_encode($detalle),
            'fecha' => now(),
        ]);
    }

    private function textoOpcional(?string $valor): ?string
    {
        $valor = $valor !== null ? trim($valor) : null;

        return $valor === '' ? null : $valor;
    }
}
