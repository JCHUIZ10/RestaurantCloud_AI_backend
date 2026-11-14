import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Plus,
  Receipt,
  Sparkles,
  CalendarOff,
  CalendarRange,
} from 'lucide-react';
import { FlujoCajaResumenDTO, PeriodoFlujoCaja } from '@/types/admin';
import { hoyServidorStr } from '@/shared/utils';
import { agruparCurva } from './agruparCurva';

interface FlujoCajaDashboardViewProps {
  resumen: FlujoCajaResumenDTO;
  periodoSeleccionado: PeriodoFlujoCaja;
  /** Rango vigente (YYYY-MM-DD); solo se edita con el periodo personalizado */
  fechaDesde: string;
  fechaHasta: string;
  onCambiarPeriodo: (periodo: PeriodoFlujoCaja, desde?: string, hasta?: string) => void;
  onAbrirModalGasto: () => void;
}

const MAX_DIAS_RANGO = 366;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const formatFechaCorta = (fecha: string): string => {
  const partes = fecha.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
};

const soles = (monto: number): string =>
  `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const solesEnteros = (monto: number): string => `S/ ${monto.toFixed(0)}`;

const nombreMesActual = (): string => {
  const mes = new Date().toLocaleDateString('es-PE', { month: 'long' });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
};

/**
 * Variación frente al periodo anterior, con el signo y el color que le corresponden. Sin periodo anterior
 * con qué comparar (`null`) no se inventa un "0 %": se dice que no hay comparativo.
 */
export const ChipVariacion: React.FC<{ valor: number | null; subidaEsBuena: boolean }> = ({ valor, subidaEsBuena }) => {
  if (valor === null) {
    return (
      <span
        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700"
        title="El periodo anterior de la misma duración no tuvo movimientos con qué comparar"
      >
        Sin comparativo
      </span>
    );
  }

  const sube = valor > 0;
  const baja = valor < 0;
  const bueno = sube ? subidaEsBuena : baja ? !subidaEsBuena : null;
  const clase =
    bueno === null
      ? 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'
      : bueno
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
      : 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800';

  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${clase}`}
      title="Frente al periodo anterior de la misma duración"
    >
      {baja ? <TrendingDown className="w-3 h-3" aria-hidden="true" /> : <TrendingUp className="w-3 h-3" aria-hidden="true" />}
      <span>
        {sube ? '+' : ''}
        {valor}%
      </span>
    </span>
  );
};

const CLASE_BOTON_PERIODO = (activo: boolean): string =>
  `px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
    activo
      ? 'bg-aurea-navy text-white shadow-sm'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
  }`;

export const FlujoCajaDashboardView: React.FC<FlujoCajaDashboardViewProps> = ({
  resumen,
  periodoSeleccionado,
  fechaDesde,
  fechaHasta,
  onCambiarPeriodo,
  onAbrirModalGasto,
}) => {
  const [desdeInput, setDesdeInput] = useState<string>(fechaDesde);
  const [hastaInput, setHastaInput] = useState<string>(fechaHasta);
  const [errorRango, setErrorRango] = useState<string | null>(null);
  const [rangoAbierto, setRangoAbierto] = useState<boolean>(periodoSeleccionado === 'personalizado');

  const esPersonalizado = periodoSeleccionado === 'personalizado';
  const mostrarSelectorRango = rangoAbierto || esPersonalizado;
  const hoyIso = hoyServidorStr();

  const isSuperavit = resumen.balance_neto >= 0;
  const esPeriodoCompletamenteVacio = resumen.ingresos_totales === 0 && resumen.egresos_totales === 0;

  // Participación de cada tipo de egreso dentro del total (no valores fijos)
  const pctInsumos = resumen.egresos_totales > 0 ? Math.round((resumen.compras_insumos_total / resumen.egresos_totales) * 100) : 0;
  const pctGastos = resumen.egresos_totales > 0 ? 100 - pctInsumos : 0;

  // Un rango largo se dibuja agrupado por semana o por mes; el promedio y los días en déficit usan los días reales
  const curvaGrafico = useMemo(() => agruparCurva(resumen.curva_diaria), [resumen.curva_diaria]);

  const { maxValor, diasEnDeficit } = useMemo(
    () => ({
      maxValor: Math.max(1, ...curvaGrafico.puntos.map((p) => Math.max(p.ingresos_dia, p.egresos_dia))),
      diasEnDeficit: resumen.curva_diaria.filter((p) => p.saldo_neto_dia < 0).length,
    }),
    [curvaGrafico, resumen.curva_diaria]
  );

  const tituloGrafico =
    periodoSeleccionado === 'hoy'
      ? `Movimientos operativos de hoy (${formatFechaCorta(resumen.fecha_inicio)})`
      : `Evolución diaria de entradas vs salidas (${formatFechaCorta(resumen.fecha_inicio)} — ${formatFechaCorta(resumen.fecha_fin)})`;
  const sufijoAgrupacion =
    curvaGrafico.agrupacion === 'semana' ? ' · agrupado por semana' : curvaGrafico.agrupacion === 'mes' ? ' · agrupado por mes' : '';

  const handleAplicarRango = () => {
    if (!desdeInput || !hastaInput) {
      setErrorRango('Indica la fecha de inicio y la de fin.');
      return;
    }
    if (hastaInput < desdeInput) {
      setErrorRango('La fecha final no puede ser anterior a la inicial.');
      return;
    }
    const dias = Math.round((new Date(hastaInput).getTime() - new Date(desdeInput).getTime()) / MS_POR_DIA) + 1;
    if (dias > MAX_DIAS_RANGO) {
      setErrorRango(`El rango no puede superar ${MAX_DIAS_RANGO} días.`);
      return;
    }
    setErrorRango(null);
    onCambiarPeriodo('personalizado', desdeInput, hastaInput);
  };

  const handleElegirPeriodo = (periodo: Exclude<PeriodoFlujoCaja, 'personalizado'>) => {
    setRangoAbierto(false);
    setErrorRango(null);
    onCambiarPeriodo(periodo);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de periodo y acciones */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold overflow-x-auto"
            role="group"
            aria-label="Periodo del flujo de caja"
          >
            <button type="button" onClick={() => handleElegirPeriodo('hoy')} className={CLASE_BOTON_PERIODO(periodoSeleccionado === 'hoy')}>
              Hoy
            </button>
            <button type="button" onClick={() => handleElegirPeriodo('semana')} className={CLASE_BOTON_PERIODO(periodoSeleccionado === 'semana')}>
              Semana
            </button>
            <button type="button" onClick={() => handleElegirPeriodo('este_mes')} className={CLASE_BOTON_PERIODO(periodoSeleccionado === 'este_mes')}>
              Este mes ({nombreMesActual()})
            </button>
            <button
              type="button"
              onClick={() => setRangoAbierto(true)}
              aria-expanded={mostrarSelectorRango}
              className={`${CLASE_BOTON_PERIODO(esPersonalizado)} flex items-center gap-1.5`}
            >
              <CalendarRange className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Personalizado</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onAbrirModalGasto}
            className="px-4 py-2 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs transition-all shadow-md shadow-aurea-copper/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar gasto de sede</span>
          </button>
        </div>

        {mostrarSelectorRango && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label htmlFor="flujo-desde" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Desde
              </label>
              <input
                id="flujo-desde"
                type="date"
                value={desdeInput}
                max={hoyIso}
                onChange={(e) => setDesdeInput(e.target.value)}
                className="block px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="flujo-hasta" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Hasta
              </label>
              <input
                id="flujo-hasta"
                type="date"
                value={hastaInput}
                max={hoyIso}
                onChange={(e) => setHastaInput(e.target.value)}
                className="block px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper"
              />
            </div>
            <button
              type="button"
              onClick={handleAplicarRango}
              className="px-4 py-2 rounded-xl bg-aurea-navy hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Aplicar rango
            </button>
            {errorRango && (
              <p role="alert" className="text-xs text-rose-600 font-medium">
                {errorRango}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4 KPIs estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos de salón */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Ingresos salón (cobrados)
            </span>
            <ChipVariacion valor={resumen.delta_ingresos_pct} subidaEsBuena />
          </div>

          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{soles(resumen.ingresos_totales)}</span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            POS:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.ingresos_desglose.tarjeta_pos_monto)} ({resumen.ingresos_desglose.tarjeta_pos_porcentaje}%)
            </strong>{' '}
            • Efectivo:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.ingresos_desglose.efectivo_monto)} ({resumen.ingresos_desglose.efectivo_porcentaje}%)
            </strong>{' '}
            • Yape/Plin:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.ingresos_desglose.billeteras_monto)} ({resumen.ingresos_desglose.billeteras_porcentaje}%)
            </strong>
          </p>
        </div>

        {/* KPI 2: Egresos operativos */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Egresos totales operat.
            </span>
            <ChipVariacion valor={resumen.delta_egresos_pct} subidaEsBuena={false} />
          </div>

          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{soles(resumen.egresos_totales)}</span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Insumos de cocina:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.compras_insumos_total)} ({pctInsumos}%)
            </strong>{' '}
            • Gastos de sede:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.gastos_manuales_total)} ({pctGastos}%)
            </strong>
          </p>
        </div>

        {/* KPI 3: Balance neto */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isSuperavit
              ? 'bg-emerald-950/10 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80'
              : 'bg-rose-950/10 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
              Balance neto operativo
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                isSuperavit
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
              }`}
            >
              {isSuperavit ? '▲ Rentable' : '⚠️ Déficit'}
            </span>
          </div>

          <div className="my-1">
            <span
              className={`text-2xl font-bold font-mono ${
                isSuperavit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {isSuperavit ? '+ ' : '- '}
              {soles(Math.abs(resumen.balance_neto))}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Margen neto:{' '}
            <strong className={isSuperavit ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
              {resumen.margen_neto_porcentaje}%
            </strong>{' '}
            • Cobertura:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {resumen.egresos_totales > 0 ? `S/ ${resumen.ratio_cobertura} por cada S/ 1 de egreso` : 'sin egresos en el periodo'}
            </strong>
          </p>
        </div>

        {/* KPI 4: Conciliación de liquidez */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Efectivo y digital (neto)
            </span>
            <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>

          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {soles(resumen.conciliacion_liquidez.total_disponible)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            En bancos/pasarelas:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.conciliacion_liquidez.en_bancos_monto)}
              {resumen.conciliacion_liquidez.en_bancos_porcentaje != null && ` (${resumen.conciliacion_liquidez.en_bancos_porcentaje}%)`}
            </strong>{' '}
            • Gavetas:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {solesEnteros(resumen.conciliacion_liquidez.en_gavetas_monto)}
              {resumen.conciliacion_liquidez.en_gavetas_porcentaje != null && ` (${resumen.conciliacion_liquidez.en_gavetas_porcentaje}%)`}
            </strong>
            {(resumen.conciliacion_liquidez.pagado_caja_chica_monto ?? 0) > 0 && (
              <>
                {' '}
                • Caja chica pagada:{' '}
                <strong className="text-aurea-copper">−{solesEnteros(resumen.conciliacion_liquidez.pagado_caja_chica_monto ?? 0)}</strong>
              </>
            )}
          </p>
          {(resumen.conciliacion_liquidez.por_pagar_proveedores_monto ?? 0) > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
              Deuda con proveedores (por pagar): {solesEnteros(resumen.conciliacion_liquidez.por_pagar_proveedores_monto ?? 0)}
            </p>
          )}
        </div>
      </div>

      {/* Evolución diaria vs composición de egresos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold font-serif text-slate-900 dark:text-white">{tituloGrafico}
                {sufijoAgrupacion}
              </h2>
              <p className="text-xs text-slate-500">Flujo monetario del periodo, con barras pareadas de entradas y salidas.</p>
            </div>

            {!esPeriodoCompletamenteVacio && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-aurea-navy dark:bg-slate-700 inline-block" />
                  <span className="text-slate-600 dark:text-slate-400">Entradas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-aurea-copper inline-block" />
                  <span className="text-slate-600 dark:text-slate-400">Salidas</span>
                </div>
              </div>
            )}
          </div>

          {esPeriodoCompletamenteVacio ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <CalendarOff className="w-8 h-8 text-slate-400" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Sin movimientos de caja en este período</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                No se registraron ventas de salón ni egresos operativos entre el {formatFechaCorta(resumen.fecha_inicio)} y el{' '}
                {formatFechaCorta(resumen.fecha_fin)}.
              </p>
              <div className="flex items-center gap-2 mt-2">
                {periodoSeleccionado !== 'este_mes' && (
                  <button
                    type="button"
                    onClick={() => handleElegirPeriodo('este_mes')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Ver este mes ({nombreMesActual()})
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAbrirModalGasto}
                  className="px-3.5 py-1.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar gasto de sede</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {curvaGrafico.puntos.map((punto) => {
                  const esDiaVacio = punto.ingresos_dia === 0 && punto.egresos_dia === 0;
                  const alturaIng = Math.min(100, Math.round((punto.ingresos_dia / maxValor) * 100));
                  const alturaEgr = Math.min(100, Math.round((punto.egresos_dia / maxValor) * 100));
                  const saldoNegativo = punto.saldo_neto_dia < 0;

                  return (
                    <div
                      key={punto.fecha}
                      className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all ${
                        esDiaVacio
                          ? 'bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-500 truncate w-full text-center">{punto.etiqueta_dia}</span>

                      <div className="h-32 w-full flex items-end justify-center gap-1.5 pt-2">
                        {esDiaVacio ? (
                          <div
                            className="h-full w-full flex flex-col items-center justify-center text-[10px] text-slate-400 font-mono text-center px-1"
                            title="Día sin operaciones (S/ 0.00)"
                          >
                            <span className="w-6 border-b border-dashed border-slate-300 dark:border-slate-700 block mb-1" />
                            <span>Sin mov.</span>
                          </div>
                        ) : (
                          <>
                            <div
                              style={{ height: `${alturaIng}%` }}
                              className="w-3.5 bg-aurea-navy dark:bg-slate-300 rounded-t-md transition-all"
                              title={`Ingresos: ${soles(punto.ingresos_dia)}`}
                            />
                            <div
                              style={{ height: `${alturaEgr}%` }}
                              className="w-3.5 bg-aurea-copper rounded-t-md transition-all"
                              title={`Egresos: ${soles(punto.egresos_dia)}`}
                            />
                          </>
                        )}
                      </div>

                      <div className="text-center w-full">
                        {esDiaVacio ? (
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">S/ 0.00</span>
                        ) : (
                          <span className={`text-[10px] font-mono font-bold block ${saldoNegativo ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {saldoNegativo ? '-' : '+'}S/ {Math.abs(punto.saldo_neto_dia).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cobertura del periodo */}
              {resumen.egresos_totales > 0 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="leading-relaxed">
                    <strong className="font-semibold">Ratio de cobertura financiera:</strong> por cada S/ 1.00 de egreso operativo, la sede generó{' '}
                    <strong className="font-bold">S/ {resumen.ratio_cobertura}</strong> en ventas de salón.{' '}
                    {diasEnDeficit === 0
                      ? 'Ningún día del periodo cerró en déficit.'
                      : `${diasEnDeficit} ${diasEnDeficit === 1 ? 'día cerró' : 'días cerraron'} con egresos mayores a los ingresos.`}
                    {resumen.curva_diaria.length > 0 && (
                      <span className="block mt-0.5 text-slate-500 dark:text-slate-400">
                        Promedio diario — ingresos: {soles(resumen.ingresos_totales / resumen.curva_diaria.length)} • egresos:{' '}
                        {soles(resumen.egresos_totales / resumen.curva_diaria.length)}.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>Sin índice de cobertura aplicable: no se registraron egresos en el período.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composición de egresos */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold font-serif text-slate-900 dark:text-white">
              Composición de egresos ({soles(resumen.egresos_totales)})
            </h2>
            <p className="text-xs text-slate-500">Insumos de cocina frente a gastos operativos de la sede.</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
                  <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Insumos de cocina (compras)</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{soles(resumen.compras_insumos_total)}</span>
            </div>

            <div className="space-y-1.5 pl-6">
              {resumen.top_insumos_comprados.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Sin compras de insumos en este período.</p>
              ) : (
                resumen.top_insumos_comprados.map((item) => (
                  <div key={item.insumo_id} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="truncate pr-2">• {item.nombre_insumo}</span>
                    <span className="font-mono shrink-0">
                      {soles(item.monto_total)} ({item.porcentaje_de_compras}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200">
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Gastos operativos de sede</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{soles(resumen.gastos_manuales_total)}</span>
            </div>

            <div className="space-y-1.5 pl-6">
              {resumen.gastos_por_categoria.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Sin gastos operativos en este período.</p>
              ) : (
                resumen.gastos_por_categoria.map((gasto) => (
                  <div key={gasto.categoria} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="truncate pr-2">• {gasto.nombre_categoria}</span>
                    <span className="font-mono shrink-0">
                      {soles(gasto.monto_total)} ({gasto.porcentaje_de_gastos}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
