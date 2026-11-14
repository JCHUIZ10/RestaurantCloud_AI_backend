<?php

namespace App\Domains\Caja\Services;

use App\Domains\Caja\Exceptions\CierreTurnoException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Cierre formal de turno de caja y generación del Reporte Z (CU-CAJA-05).
 *
 * Es la única implementación del cierre: la usa el cajero desde el POS y, para el cierre
 * de rescate, la administración de la sede.
 */
class CierreTurnoService
{
    public function __construct(
        private HistorialComprobantesService $historial,
        private ReporteZDigitalService $reporteZDigital,
    ) {}

    /**
     * Cierra el turno abierto de la sede y devuelve el Reporte Z archivado.
     *
     * Todo ocurre bajo un bloqueo de la fila de caja: dos cierres simultáneos (dos pestañas,
     * cajero y admin_local) se serializan y el segundo ya encuentra el turno cerrado, así que no se
     * duplica el Reporte Z ni su registro de auditoría. El resumen se calcula dentro del bloqueo para
     * que las cifras del Z correspondan exactamente al estado que se cierra.
     *
     * Cierre de rescate: si se indica `$justificacionForzado`, el cierre lo ejecuta la administración
     * ($usuarioId / $usuarioNombre) sobre el turno `$cajaId` de otro cajero. Aplican las mismas reglas
     * (mesas activas), la justificación hace de comentario de la discrepancia y el Z queda marcado.
     *
     * @return array<string, mixed> Reporte Z
     *
     * @throws CierreTurnoException si no hay turno abierto, hay mesas activas o falta justificar la discrepancia.
     */
    public function cerrar(
        string $localId,
        string $usuarioId,
        string $usuarioNombre,
        float $montoRealFisico,
        ?string $comentarioDiscrepancia,
        ?string $notasCierre,
        ?string $cajaId = null,
        ?string $justificacionForzado = null,
    ): array {
        $esForzado = $justificacionForzado !== null;

        $resultado = DB::transaction(function () use ($localId, $usuarioId, $usuarioNombre, $montoRealFisico, $comentarioDiscrepancia, $notasCierre, $cajaId, $justificacionForzado, $esForzado): array {
            $caja = DB::table('caja')
                ->where('local_id', $localId)
                ->where('estado', 'abierta')
                ->when($cajaId !== null, fn ($query) => $query->where('id', $cajaId))
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                throw $this->cajaNoAbierta();
            }

            $cajeroNombre = DB::table('usuario')->where('id', $caja->cajero_id)->value('nombre');

            // Regla Poka-Yoke: no cerrar con mesas activas o con comensales
            $mesasActivasPendientes = (int) DB::table('pedido as p')
                ->where('p.local_id', $localId)
                ->whereIn('p.estado', ['borrador', 'enviado', 'cuenta_pedida'])
                ->count();

            if ($mesasActivasPendientes > 0) {
                throw new CierreTurnoException(
                    'ERR_SALON_CON_MESAS_ACTIVAS',
                    "No se puede cerrar caja: existen {$mesasActivasPendientes} mesas con pedidos activos pendientes de cobro en el salón.",
                    409
                );
            }

            $comprobantes = DB::table('comprobante')
                ->where('caja_id', $caja->id)
                ->where('estado', 'emitido')
                ->get();

            $resumen = $this->historial->resumenTurno($caja);
            $porMedio = collect($resumen['por_medio'])->keyBy('codigo');

            $ingresosEfectivo = (float) $resumen['efectivo']['ingresos_brutos'];
            $egresosDevolucionNC = (float) $resumen['efectivo']['egresos_devolucion'];
            $egresosGastoCaja = (float) $resumen['efectivo']['egresos_gasto_caja'];
            $egresosCompraCaja = (float) $resumen['efectivo']['egresos_compra_caja'];
            $montoApertura = (float) $caja->monto_apertura;
            $efectivoEsperado = (float) $resumen['efectivo']['esperado'];
            $discrepancia = round($montoRealFisico - $efectivoEsperado, 2);

            if ($esForzado) {
                // La justificación de la administración respalda la diferencia (si la hay) y queda en las notas
                $comentarioDiscrepancia = abs($discrepancia) > 0.001 ? $justificacionForzado : null;
                $notasCierre = "Cierre forzado por administración ({$usuarioNombre}): {$justificacionForzado}";
            }

            // Validación de justificación obligatoria si hay discrepancia (mínimo 10 caracteres)
            if (abs($discrepancia) > 0.001) {
                if (empty($comentarioDiscrepancia) || mb_strlen($comentarioDiscrepancia) < 10) {
                    throw new CierreTurnoException(
                        'ERR_DISCREPANCIA_SIN_JUSTIFICAR',
                        'Existe una diferencia entre el efectivo real y el esperado; el comentario justificativo es obligatorio (mínimo 10 caracteres).',
                        422
                    );
                }
            }

            $aperturaTime = Carbon::parse($caja->fecha_apertura);
            $cierreTime = now();
            $diff = $aperturaTime->diff($cierreTime);
            $duracionStr = sprintf('%dh %02dm %02ds', $diff->h + ($diff->days * 24), $diff->i, $diff->s);

            $boletasEmitidas = (int) $comprobantes->where('tipo', 'boleta')->count();
            $facturasEmitidas = (int) $comprobantes->where('tipo', 'factura')->count();
            $notasVentaEmitidas = (int) $comprobantes->where('tipo', 'nota_venta')->count();
            $notasCreditoEmitidas = (int) DB::table('comprobante')->where('caja_id', $caja->id)->where('tipo', 'nota_credito')->count();
            $comprobantesAnulados = (int) DB::table('comprobante')->where('caja_id', $caja->id)->where('estado', 'anulado')->count();

            $tarjetasPosTotal = (float) $porMedio['tarjeta']['neto'];
            $billeterasTotal = (float) $porMedio['billetera_digital']['neto'];
            $otrosCobrosTotal = round((float) $resumen['total_neto'] - (float) $porMedio['efectivo']['neto'] - $tarjetasPosTotal - $billeterasTotal, 2);

            $totalNetoFacturado = (float) $resumen['total_neto'];
            $baseImponible = (float) $resumen['base_imponible'];
            $igv18 = (float) $resumen['igv'];

            $local = DB::table('local as l')
                ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
                ->where('l.id', $localId)
                ->select(['l.nombre as local_nombre', 'e.ruc as empresa_ruc', 'e.id as empresa_id'])
                ->first();
            $localNombre = $local ? $local->local_nombre : 'Áurea';
            $empresaRuc = $local ? $local->empresa_ruc : '20609876543';
            $empresaId = $local ? $local->empresa_id : (string) Str::uuid();

            $reporteZ = [
                'caja_id' => $caja->id,
                'turno_correlativo' => (int) $caja->correlativo,
                'local_nombre' => $localNombre,
                'empresa_ruc' => $empresaRuc,
                'cajero_nombre' => $cajeroNombre ?? $usuarioNombre,
                'fecha_apertura' => $aperturaTime->toIso8601String(),
                'fecha_cierre' => $cierreTime->toIso8601String(),
                'duracion_turno' => $duracionStr,
                'monto_apertura' => $montoApertura,
                'efectivo_esperado' => $efectivoEsperado,
                'efectivo_real_contado' => $montoRealFisico,
                'discrepancia' => $discrepancia,
                'comentario_discrepancia' => $comentarioDiscrepancia,
                'total_ventas_efectivo' => $ingresosEfectivo,
                'total_efectivo_neto' => round((float) $porMedio['efectivo']['neto'], 2),
                'total_tarjetas_pos' => $tarjetasPosTotal,
                'total_billeteras_digital' => $billeterasTotal,
                'otros_medios_total' => $otrosCobrosTotal,
                // Medios que se mostraron ese día: el Reporte Z queda inmutable con ellos
                'medios_visibles' => $resumen['medios_visibles'],
                'notas_credito_detalle' => $resumen['notas_credito_detalle'],
                'ventas_por_tipo' => $resumen['por_tipo'],
                'descuentos_turno' => $resumen['descuentos'],
                'recargo_tarjetas' => (float) $porMedio['tarjeta']['recargo'],
                'recargo_billeteras' => (float) $porMedio['billetera_digital']['recargo'],
                'total_recargos' => (float) $resumen['total_recargos'],
                'ingreso_consumo' => (float) $resumen['ingreso_consumo'],
                'total_devoluciones_efectivo' => round($egresosDevolucionNC, 2),
                // Gastos pagados con efectivo de la gaveta: se descuentan del esperado igual que las devoluciones
                'total_gastos_caja_efectivo' => round($egresosGastoCaja, 2),
                'total_compras_caja_efectivo' => round($egresosCompraCaja, 2),
                'gastos_caja_detalle' => $resumen['gastos_caja_detalle'],
                'total_neto_facturado' => round($totalNetoFacturado, 2),
                'base_imponible_gravada' => round($baseImponible, 2),
                'igv_18' => round($igv18, 2),
                'boletas_emitidas' => $boletasEmitidas,
                'facturas_emitidas' => $facturasEmitidas,
                'notas_venta_emitidas' => $notasVentaEmitidas,
                'notas_credito_emitidas' => $notasCreditoEmitidas,
                'comprobantes_anulados' => $comprobantesAnulados,
                'notas_cierre' => $notasCierre,
                'url_descarga_pdf' => "/api/v1/caja/turnos/{$caja->id}/reporte-z/pdf",
            ];

            if ($esForzado) {
                $reporteZ['cierre_forzado'] = true;
                $reporteZ['cerrado_por_nombre'] = $usuarioNombre;
                $reporteZ['justificacion_forzado'] = $justificacionForzado;
            }

            // El estado en la condición es una segunda defensa: si la fila ya no está abierta, no se cierra dos veces.
            $filasCerradas = DB::table('caja')
                ->where('id', $caja->id)
                ->where('estado', 'abierta')
                ->update([
                    'estado' => 'cerrada',
                    'fecha_cierre' => $cierreTime,
                    'monto_esperado' => $efectivoEsperado,
                    'monto_real' => $montoRealFisico,
                    'discrepancia' => $discrepancia,
                    'comentario_discrepancia' => $comentarioDiscrepancia,
                    'notas_cierre' => $notasCierre,
                    'updated_at' => now(),
                ]);

            if ($filasCerradas !== 1) {
                throw $this->cajaNoAbierta();
            }

            DB::table('caja_movimiento')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $caja->id,
                'local_id' => $localId,
                'tipo' => 'cierre',
                'monto' => $montoRealFisico,
                'metodo_pago' => 'efectivo',
                'descripcion' => 'Cierre formal de turno #'.str_pad((string) $caja->correlativo, 3, '0', STR_PAD_LEFT),
                'created_at' => now(),
            ]);

            // El archivo del Z pertenece al cajero del turno, aunque lo cierre otra persona (administración)
            DB::table('auditoria_caja_cierre')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $caja->id,
                'local_id' => $localId,
                'cajero_id' => $caja->cajero_id,
                'reporte_z_json' => json_encode($reporteZ),
                'created_at' => now(),
            ]);

            if ($esForzado) {
                DB::table('log_auditoria')->insert([
                    'id' => (string) Str::uuid(),
                    'empresa_id' => $empresaId,
                    'local_id' => $localId,
                    'usuario_id' => $usuarioId,
                    'accion' => 'turno.cierre_forzado',
                    'entidad_tipo' => 'caja_cierre',
                    'entidad_id' => $caja->id,
                    'detalle' => json_encode([
                        'cajero_id' => $caja->cajero_id,
                        'efectivo_esperado' => $efectivoEsperado,
                        'efectivo_contado' => $montoRealFisico,
                        'discrepancia' => $discrepancia,
                        'justificacion' => $justificacionForzado,
                    ]),
                    'fecha' => now(),
                ]);
            }

            return ['reporte_z' => $reporteZ, 'empresa_id' => $empresaId, 'caja_id' => $caja->id];
        });

        $reporteZ = $resultado['reporte_z'];

        // Generar y persistir inmutablemente el PDF del Reporte Z en MinIO bajo reportes-z.
        // Va fuera de la transacción: si falla, el cierre ya está confirmado y el PDF se regenera bajo demanda.
        try {
            $this->reporteZDigital->generarPdf(
                $resultado['caja_id'],
                $reporteZ,
                $resultado['empresa_id'],
                $localId,
                $usuarioId
            );
        } catch (Throwable $e) {
            Log::warning('No se pudo guardar el PDF de Reporte Z en MinIO: '.$e->getMessage(), [
                'caja_id' => $resultado['caja_id'],
                'local_id' => $localId,
            ]);
        }

        return $reporteZ;
    }

    private function cajaNoAbierta(): CierreTurnoException
    {
        return new CierreTurnoException(
            'ERR_CAJA_NO_ABIERTA',
            'No existe un turno de caja abierto en esta sede para cerrar.',
            409
        );
    }
}
