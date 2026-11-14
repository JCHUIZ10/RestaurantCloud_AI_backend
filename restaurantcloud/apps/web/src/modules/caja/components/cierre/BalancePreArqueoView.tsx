import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Coins,
  CreditCard,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { BalancePreArqueoDTO } from '@/types/caja';
import { esMedioVisible } from '../../utils/mediosVisibles';
import { DetalleNotasCreditoTurno } from './DetalleNotasCreditoTurno';
import { DetalleEgresosCajaTurno } from './DetalleEgresosCajaTurno';
import { ResumenRecargosTurno } from './ResumenRecargosTurno';

interface BalancePreArqueoViewProps {
  balance: BalancePreArqueoDTO;
  onIniciarArqueo: () => void;
  onVolverPos: () => void;
}

export const BalancePreArqueoView: React.FC<BalancePreArqueoViewProps> = ({
  balance,
  onIniciarArqueo,
  onVolverPos,
}) => {
  // Cada fila usa la misma semántica: Ingresos = bruto, Devoluciones = anulado con NC, Neto = bruto - devoluciones.
  // Si el backend es anterior al desglose se usa el cálculo previo.
  const efectivoDevoluciones = balance.efectivo_devoluciones ?? balance.egresos_devolucion_nc;
  const efectivoNeto = balance.efectivo_neto ?? balance.ingresos_efectivo - balance.egresos_devolucion_nc;
  const tarjetasBruto = balance.tarjetas_bruto ?? balance.tarjetas_pos_total;
  const tarjetasDevoluciones = balance.tarjetas_devoluciones ?? 0;
  const billeterasBruto = balance.billeteras_bruto ?? balance.billeteras_total;
  const billeterasDevoluciones = balance.billeteras_devoluciones ?? 0;
  const otrosBruto = balance.otros_bruto ?? balance.otros_cobros_total;
  const otrosDevoluciones = balance.otros_devoluciones ?? 0;
  const totalIngresos =
    balance.total_ingresos_brutos ??
    balance.ingresos_efectivo + tarjetasBruto + billeterasBruto + otrosBruto;
  const totalDevoluciones =
    balance.total_devoluciones ??
    efectivoDevoluciones + tarjetasDevoluciones + billeterasDevoluciones + otrosDevoluciones;
  const mostrarTarjetas = esMedioVisible(balance.medios_visibles, 'tarjeta');
  const mostrarBilleteras = esMedioVisible(balance.medios_visibles, 'billetera_digital');
  // "Otros" solo existe si hubo cobros fuera del catálogo; un cobro de S/ 0 también cuenta como cobro
  const mostrarOtros =
    balance.otros_cobros_total !== 0 || otrosBruto !== 0 || (balance.otros_operaciones ?? 0) > 0;
  const claseDevolucion = (monto: number) => (monto > 0 ? 'text-rose-500' : 'text-slate-400');
  // "N cobros" y, solo si ese medio tuvo notas de crédito, "· M NC"
  const textoOperaciones = (cobros: number, nc: number | undefined) =>
    `${cobros} ${cobros === 1 ? 'cobro' : 'cobros'}${(nc ?? 0) > 0 ? ` · ${nc} NC` : ''}`;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Cabecera Principal de Balance Pre-Arqueo */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-aurea-navy text-white text-xs font-mono font-bold tracking-wide border border-aurea-copper/40">
              Turno #{String(balance.turno_correlativo).padStart(3, '0')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Apertura: {new Date(balance.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} • {balance.cajero_nombre}
            </span>
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            Pre-Arqueo y Balance Operativo del Turno
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Corte de operaciones, conciliación de pagos y verificación previa de gaveta.
          </p>
        </div>

        {/* 3 Píldoras Métricas Superiores */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-center min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">FONDO APERTURA</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              S/ {balance.monto_apertura.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-center min-w-[130px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">TOTAL FACTURADO</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              S/ {balance.total_facturado_neto.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-aurea-copper/10 dark:bg-aurea-copper/20 border border-aurea-copper/40 font-mono text-center min-w-[130px]">
            <span className="text-[10px] uppercase font-bold text-aurea-navy dark:text-aurea-champagne block">
              EFECTIVO GAVETA
            </span>
            <span className="text-sm font-bold text-aurea-navy dark:text-aurea-champagne">
              S/ {balance.efectivo_esperado.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Poka-Yoke: Estado del Salón */}
      {balance.salon_al_dia ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">[✓ SALÓN 100% AL DÍA]</span>
              <span className="text-[11px] opacity-90">
                0 Mesas con comanda activa • Cero pedidos en cola de cocina • {balance.sede_nombre}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 hidden sm:inline">
            Listo para arqueo final
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold block">
                [⚠️ Mesas Pendientes de Cobro: {balance.mesas_activas_pendientes} mesas activas en salón]
              </span>
              <span className="text-[11px] text-rose-700 dark:text-rose-300">
                Regla Poka-Yoke (ERR_SALON_CON_MESAS_ACTIVAS): No es posible cerrar caja mientras existan consumos pendientes de cobro.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onVolverPos}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Ir al Monitor POS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Grid Central en 2 Columnas (Layout Wireframe 50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna Izquierda: Flujo por Método de Pago & Desglose Fiscal SUNAT */}
        <div className="space-y-5">
          {/* Bloque 1: Recaudación y Flujo por Método de Pago */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-aurea-copper" />
                <span>1. Recaudación y Flujo por Método de Pago</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                {balance.total_comprobantes} Transacciones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-left">
                    <th className="pb-2">Método de Pago</th>
                    <th className="pb-2 text-center">Operac.</th>
                    <th className="pb-2 text-right">Ingresos</th>
                    <th className="pb-2 text-right">Devoluciones</th>
                    <th className="pb-2 text-right font-bold">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Coins className="w-3.5 h-3.5 text-aurea-copper" />
                      <span>Efectivo Gaveta</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-500">
                      {textoOperaciones(balance.efectivo_operaciones ?? 0, balance.efectivo_nc)}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600">+ S/ {balance.ingresos_efectivo.toFixed(2)}</td>
                    <td className={`py-2.5 text-right ${claseDevolucion(efectivoDevoluciones)}`}>- S/ {efectivoDevoluciones.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      S/ {efectivoNeto.toFixed(2)}
                    </td>
                  </tr>

                  {mostrarTarjetas && (
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                      <span>Tarjetas POS{balance.operador_tarjeta ? ` (${balance.operador_tarjeta})` : ''}</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-500">
                      {textoOperaciones(balance.tarjetas_cobros_brutos ?? balance.tarjetas_operaciones, balance.tarjetas_nc)}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600">+ S/ {tarjetasBruto.toFixed(2)}</td>
                    <td className={`py-2.5 text-right ${claseDevolucion(tarjetasDevoluciones)}`}>- S/ {tarjetasDevoluciones.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      S/ {balance.tarjetas_pos_total.toFixed(2)}
                    </td>
                  </tr>
                  )}

                  {mostrarBilleteras && (
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                      <span>Billeteras Yape / Plin</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-500">
                      {textoOperaciones(balance.billeteras_cobros_brutos ?? balance.billeteras_operaciones ?? 0, balance.billeteras_nc)}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600">+ S/ {billeterasBruto.toFixed(2)}</td>
                    <td className={`py-2.5 text-right ${claseDevolucion(billeterasDevoluciones)}`}>- S/ {billeterasDevoluciones.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      S/ {balance.billeteras_total.toFixed(2)}
                    </td>
                  </tr>
                  )}

                  {mostrarOtros && (
                  <tr>
                    <td className="py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-amber-500" />
                      <span>Otros Cobros / Transferencias</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-500">
                      {textoOperaciones(balance.otros_operaciones ?? 0, balance.otros_nc)}
                    </td>
                    <td className="py-2.5 text-right text-emerald-600">+ S/ {otrosBruto.toFixed(2)}</td>
                    <td className={`py-2.5 text-right ${claseDevolucion(otrosDevoluciones)}`}>- S/ {otrosDevoluciones.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      S/ {balance.otros_cobros_total.toFixed(2)}
                    </td>
                  </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs">
                    <td className="pt-3 font-sans text-slate-900 dark:text-white uppercase tracking-wider">
                      TOTAL FACTURADO
                    </td>
                    <td className="pt-3 text-center text-slate-500">{balance.total_comprobantes} Docs</td>
                    <td className="pt-3 text-right text-emerald-600">
                      + S/ {totalIngresos.toFixed(2)}
                    </td>
                    <td className="pt-3 text-right text-rose-500">
                      - S/ {totalDevoluciones.toFixed(2)}
                    </td>
                    <td className="pt-3 text-right text-base text-emerald-600 dark:text-emerald-400">
                      S/ {balance.total_facturado_neto.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Consumo vs recargos del turno (solo si hubo recargos) */}
          {(balance.total_recargos ?? 0) > 0 && (
            <ResumenRecargosTurno
              totalNeto={balance.total_facturado_neto}
              recargoTarjetas={balance.tarjetas_recargo ?? 0}
              recargoBilleteras={balance.billeteras_recargo ?? 0}
              totalRecargos={balance.total_recargos ?? 0}
              ingresoConsumo={balance.ingreso_consumo ?? balance.total_facturado_neto}
            />
          )}

          {/* Bloque 2: Desglose Fiscal Oficial SUNAT Perú */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
              2. DESGLOSE FISCAL OFICIAL SUNAT PERÚ
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Base Imponible</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  S/ {balance.base_imponible.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">IGV (18%)</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  S/ {balance.igv_18.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Facturado</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  S/ {balance.total_facturado_neto.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Verificación Poka-Yoke & Acciones */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Verificación Previa al Cierre (Poka-Yoke)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <CheckCircle2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    balance.salon_al_dia ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Salón sin comandas abiertas:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {balance.salon_al_dia
                      ? 'Mesas 100% liquidadas y en estado libre.'
                      : `${balance.mesas_activas_pendientes} mesas con comanda pendiente de cobro.`}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Auditoría de Comprobantes:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {balance.total_comprobantes} comprobante{balance.total_comprobantes === 1 ? '' : 's'} emitido{balance.total_comprobantes === 1 ? '' : 's'}
                    {(balance.comprobantes_anulados_count ?? 0) > 0 ? ` / ${balance.comprobantes_anulados_count} anulado${balance.comprobantes_anulados_count === 1 ? '' : 's'}` : ''}
                    {(balance.notas_credito_count ?? 0) > 0 ? ` (${balance.notas_credito_count} NC)` : ''}.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Conciliación de Flujo de Gaveta:
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Fondo S/ {balance.monto_apertura.toFixed(2)} + Ing S/ {balance.ingresos_efectivo.toFixed(2)} - NC S/ {balance.egresos_devolucion_nc.toFixed(2)}{(balance.egresos_gasto_caja ?? 0) > 0 ? ` - Gastos S/ ${(balance.egresos_gasto_caja ?? 0).toFixed(2)}` : ''}{(balance.egresos_compra_caja ?? 0) > 0 ? ` - Compras S/ ${(balance.egresos_compra_caja ?? 0).toFixed(2)}` : ''} = S/{balance.efectivo_esperado.toFixed(2)} esperado.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalle de notas de crédito del turno (solo si hubo) */}
          {(balance.notas_credito_detalle?.length ?? 0) > 0 && (
            <details className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <summary className="cursor-pointer select-none px-5 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Notas de crédito del turno ({balance.notas_credito_detalle?.length})</span>
                <span className="text-[10px] font-normal text-slate-400 group-open:hidden">Ver detalle</span>
              </summary>
              <div className="px-5 pb-4">
                <DetalleNotasCreditoTurno notas={balance.notas_credito_detalle ?? []} porPagina={5} />
              </div>
            </details>
          )}

          {/* Gastos y compras pagados con efectivo de la gaveta (solo si hubo) */}
          {(balance.gastos_caja_detalle?.length ?? 0) > 0 && (
            <details className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <summary className="cursor-pointer select-none px-5 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Egresos pagados con efectivo de caja ({balance.gastos_caja_detalle?.length})</span>
                <span className="text-[10px] font-normal text-slate-400 group-open:hidden">Ver detalle</span>
              </summary>
              <div className="px-5 pb-4">
                <DetalleEgresosCajaTurno egresos={balance.gastos_caja_detalle ?? []} />
              </div>
            </details>
          )}

          {/* Tarjeta de Inicio de Arqueo y Botones CTA */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-aurea-navy text-white shadow-xl space-y-4">
            <div>
              <span className="text-[10px] font-mono text-aurea-copper uppercase tracking-wider font-bold">
                Paso Siguiente • Cierre Formal
              </span>
              <h4 className="text-base font-bold font-serif text-white mt-0.5">
                Conteo y Arqueo Físico de Gaveta
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Digite el importe contado en efectivo físico para calcular automáticamente diferencias y emitir el Reporte Z oficial.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onVolverPos}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Monitor POS (Esc)</span>
              </button>

              <button
                type="button"
                onClick={onIniciarArqueo}
                disabled={!balance.salon_al_dia}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 text-aurea-navy font-bold text-xs transition-all shadow-lg shadow-aurea-copper/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coins className="w-4 h-4 fill-aurea-navy" />
                <span>Iniciar Arqueo y Cierre de Caja (F8)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pie con atajos de teclado accesibles */}
      <div className="text-center text-[11px] text-slate-400 font-mono py-2">
        <span>Seguridad: El cierre conmuta el turno a &apos;cerrada&apos; y libera el terminal.</span>
        <span className="mx-2">•</span>
        <span>Atajos: <strong>F8</strong> Iniciar Arqueo • <strong>Esc</strong> Volver al POS</span>
      </div>
    </div>
  );
};
