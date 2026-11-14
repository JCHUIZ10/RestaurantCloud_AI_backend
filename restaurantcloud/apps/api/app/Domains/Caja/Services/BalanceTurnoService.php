<?php

namespace App\Domains\Caja\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Balance operativo del turno abierto, previo al arqueo (CU-CAJA-05).
 *
 * Lo consume el cajero en su cierre de turno y la administración antes de un cierre de rescate,
 * para que ambos vean exactamente las mismas cifras.
 */
class BalanceTurnoService
{
    public function __construct(private HistorialComprobantesService $historial) {}

    /**
     * Rótulo legible del rol real del usuario que abrió el turno (sin inventar cargos).
     */
    public static function etiquetaRol(?string $rol): string
    {
        return match ($rol) {
            'admin_local' => 'Administrador de sede',
            'propietario' => 'Propietario',
            default => 'Cajero',
        };
    }

    /**
     * Balance del turno abierto de la sede, o null si no hay turno abierto
     * (o si se indicó un turno concreto y no es el abierto).
     *
     * @return array<string, mixed>|null
     */
    public function turnoAbierto(string $localId, ?string $cajaId = null): ?array
    {
        $caja = DB::table('caja as c')
            ->join('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.local_id', $localId)
            ->where('c.estado', 'abierta')
            ->when($cajaId !== null, fn ($query) => $query->where('c.id', $cajaId))
            ->select([
                'c.id',
                'c.local_id',
                'c.cajero_id',
                'u.nombre as cajero_nombre',
                'u.rol as cajero_rol_codigo',
                'c.correlativo',
                'c.monto_apertura',
                'c.notas_apertura',
                'c.fecha_apertura',
            ])
            ->first();

        if (! $caja) {
            return null;
        }

        $local = DB::table('local as l')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->where('l.id', $localId)
            ->select(['l.nombre as local_nombre', 'e.ruc as empresa_ruc'])
            ->first();
        $sedeNombre = $local ? $local->local_nombre : 'Áurea';

        $resumen = $this->historial->resumenTurno($caja);
        $porMedio = collect($resumen['por_medio'])->keyBy('codigo');

        // Efectivo: ingresos brutos (incluye lo luego anulado) menos las salidas de gaveta (devoluciones por NC y gastos).
        // Así Fondo + Ingresos - Egresos = Esperado, que es lo que la interfaz muestra.
        $ingresosEfectivo = (float) $resumen['efectivo']['ingresos_brutos'];
        $efectivoOperaciones = (int) $resumen['efectivo']['operaciones_brutas'];
        $egresosDevolucionNC = (float) $resumen['efectivo']['egresos_devolucion'];
        $egresosGastoCaja = (float) $resumen['efectivo']['egresos_gasto_caja'];
        $egresosCompraCaja = (float) $resumen['efectivo']['egresos_compra_caja'];
        $efectivoEsperado = (float) $resumen['efectivo']['esperado'];
        $montoApertura = (float) $caja->monto_apertura;

        // Tarjeta y billetera se informan netas: sus comprobantes anulados ya no cuentan.
        $tarjetasPosTotal = (float) $porMedio['tarjeta']['neto'];
        $tarjetasOperaciones = (int) $porMedio['tarjeta']['operaciones'];
        $billeterasTotal = (float) $porMedio['billetera_digital']['neto'];
        $billeterasOperaciones = (int) $porMedio['billetera_digital']['operaciones'];

        // Cobros en un medio fuera del catálogo operativo (no deberían existir): lo que sobra del neto.
        $efectivoNeto = (float) $porMedio['efectivo']['neto'];
        $otrosCobrosTotal = round((float) $resumen['total_neto'] - $efectivoNeto - $tarjetasPosTotal - $billeterasTotal, 2);
        $otrosOperaciones = max(0, (int) $resumen['vigentes_count'] - (int) $porMedio['efectivo']['operaciones'] - $tarjetasOperaciones - $billeterasOperaciones);

        // Las NC ya van con total negativo y sus originales anulados no cuentan: el neto es la suma de las ventas vigentes.
        $totalFacturadoNeto = (float) $resumen['total_neto'];
        $baseImponible = (float) $resumen['base_imponible'];
        $igv18 = (float) $resumen['igv'];
        $totalComprobantes = (int) $resumen['vigentes_count'];

        $mesasActivasPendientes = (int) DB::table('pedido as p')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->count();

        $notasCreditoCount = (int) $resumen['notas_credito']['count'];
        $efectivoNc = (int) $porMedio['efectivo']['notas_credito'];
        $tarjetasNc = (int) $porMedio['tarjeta']['notas_credito'];
        $billeterasNc = (int) $porMedio['billetera_digital']['notas_credito'];
        $otrosNc = max(0, $notasCreditoCount - $efectivoNc - $tarjetasNc - $billeterasNc);
        $comprobantesAnuladosCount = (int) $resumen['anulados_count'];

        // Desglose por medio con la misma semántica en todas las filas: bruto - devoluciones = neto.
        // "Otros" se obtiene por diferencia con los totales del turno (cobros en medios fuera del catálogo).
        $efectivoBruto = (float) $porMedio['efectivo']['bruto'];
        $efectivoDevoluciones = (float) $porMedio['efectivo']['devoluciones'];
        $tarjetasBruto = (float) $porMedio['tarjeta']['bruto'];
        $tarjetasDevoluciones = (float) $porMedio['tarjeta']['devoluciones'];
        $billeterasBruto = (float) $porMedio['billetera_digital']['bruto'];
        $billeterasDevoluciones = (float) $porMedio['billetera_digital']['devoluciones'];
        $otrosBruto = round((float) $resumen['total_bruto'] - $efectivoBruto - $tarjetasBruto - $billeterasBruto, 2);
        $otrosDevoluciones = round((float) $resumen['total_devoluciones'] - $efectivoDevoluciones - $tarjetasDevoluciones - $billeterasDevoluciones, 2);

        $totalIngresosBrutos = round((float) $resumen['total_bruto'], 2);
        $totalDevoluciones = round((float) $resumen['total_devoluciones'], 2);
        $totalEgresos = round($egresosDevolucionNC, 2);

        $salonAlDia = ($mesasActivasPendientes === 0);

        $datosTarjeta = DB::table('metodo_pago_local')
            ->where('local_id', $localId)
            ->where('codigo', 'tarjeta')
            ->value('datos_adicionales');
        $datosTarjeta = is_string($datosTarjeta) ? json_decode($datosTarjeta, true) : (array) $datosTarjeta;
        $operadorTarjeta = trim((string) ($datosTarjeta['operador'] ?? '')) ?: null;

        return [
            'caja_id' => $caja->id,
            'turno_correlativo' => (int) $caja->correlativo,
            'cajero_nombre' => $caja->cajero_nombre,
            'cajero_rol' => self::etiquetaRol($caja->cajero_rol_codigo),
            'fecha_apertura' => Carbon::parse($caja->fecha_apertura)->toIso8601String(),
            'monto_apertura' => $montoApertura,
            'ingresos_efectivo' => $ingresosEfectivo,
            'egresos_devolucion_nc' => $egresosDevolucionNC,
            'egresos_gasto_caja' => $egresosGastoCaja,
            'egresos_compra_caja' => $egresosCompraCaja,
            'gastos_caja_detalle' => $resumen['gastos_caja_detalle'],
            'efectivo_esperado' => $efectivoEsperado,
            'tarjetas_pos_total' => $tarjetasPosTotal,
            'tarjetas_operaciones' => $tarjetasOperaciones,
            'operador_tarjeta' => $operadorTarjeta,
            'billeteras_total' => $billeterasTotal,
            'efectivo_operaciones' => $efectivoOperaciones,
            'billeteras_operaciones' => $billeterasOperaciones,
            'otros_cobros_total' => $otrosCobrosTotal,
            'otros_operaciones' => $otrosOperaciones,
            // Solo condiciona qué filas se dibujan: los totales de arriba se envían siempre (en 0 si el medio está oculto)
            'medios_visibles' => $resumen['medios_visibles'],
            'notas_credito_detalle' => $resumen['notas_credito_detalle'],
            'tarjetas_recargo' => (float) $porMedio['tarjeta']['recargo'],
            'billeteras_recargo' => (float) $porMedio['billetera_digital']['recargo'],
            'total_recargos' => (float) $resumen['total_recargos'],
            'ingreso_consumo' => (float) $resumen['ingreso_consumo'],
            'efectivo_neto' => round((float) $porMedio['efectivo']['neto'], 2),
            'efectivo_devoluciones' => $efectivoDevoluciones,
            'tarjetas_bruto' => $tarjetasBruto,
            'tarjetas_devoluciones' => $tarjetasDevoluciones,
            'billeteras_bruto' => $billeterasBruto,
            'billeteras_devoluciones' => $billeterasDevoluciones,
            'otros_bruto' => $otrosBruto,
            'otros_devoluciones' => $otrosDevoluciones,
            'total_ingresos_brutos' => $totalIngresosBrutos,
            'total_devoluciones' => $totalDevoluciones,
            'total_egresos' => $totalEgresos,
            'notas_credito_count' => $notasCreditoCount,
            'efectivo_nc' => $efectivoNc,
            'tarjetas_nc' => $tarjetasNc,
            'billeteras_nc' => $billeterasNc,
            'otros_nc' => $otrosNc,
            'tarjetas_cobros_brutos' => (int) $porMedio['tarjeta']['operaciones_brutas'],
            'billeteras_cobros_brutos' => (int) $porMedio['billetera_digital']['operaciones_brutas'],
            'comprobantes_anulados_count' => $comprobantesAnuladosCount,
            'total_facturado_neto' => round($totalFacturadoNeto, 2),
            'base_imponible' => round($baseImponible, 2),
            'igv_18' => round($igv18, 2),
            'total_comprobantes' => $totalComprobantes,
            'mesas_activas_pendientes' => $mesasActivasPendientes,
            'salon_al_dia' => $salonAlDia,
            'sede_nombre' => $sedeNombre,
        ];
    }
}
