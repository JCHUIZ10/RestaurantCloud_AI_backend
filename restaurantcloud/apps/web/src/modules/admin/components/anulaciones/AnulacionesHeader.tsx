import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  LayoutGrid,
  FileX2,
} from 'lucide-react';
import { AnulacionesKPIsDTO } from '@/types/admin';

interface AnulacionesHeaderProps {
  fecha: string;
  onCambiarFecha: (nuevaFecha: string) => void;
  kpis: AnulacionesKPIsDTO;
}

export const AnulacionesHeader: React.FC<AnulacionesHeaderProps> = ({
  fecha,
  onCambiarFecha,
  kpis,
}) => {
  const formatearFechaCabecera = (f: string) => {
    // Si coincide con 2026-10-09, mostramos "Hoy, 09 de Octubre 2026"
    const partes = f.split('-');
    if (partes.length === 3) {
      const fechaObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      const nombreMes = fechaObj.toLocaleString('es-PE', { month: 'long' });
      const dia = partes[2];
      const anio = partes[0];
      return `${dia} de ${nombreMes} ${anio}`;
    }
    return f;
  };

  const handleRetrocederDia = () => {
    const d = new Date(fecha);
    d.setDate(d.getDate() - 1);
    onCambiarFecha(d.toISOString().slice(0, 10));
  };

  const handleAvanzarDia = () => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + 1);
    onCambiarFecha(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6">
      {/* Título Principal y Selector de Fecha */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aurea-copper">
            <span>Auditoría de Sala y Control de Mermas</span>
            <span>•</span>
            <span>CU-ADMIN-12</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-aurea-navy tracking-tight mt-1">
            Auditoría de Anulaciones del Local
          </h1>
          <p className="text-sm text-aurea-navy/70 mt-1 max-w-2xl">
            Supervisión inmutable de platos y comandas canceladas en salón, trazabilidad temporal
            de espera y control contable de mermas culinarias.
          </p>
        </div>

        {/* Selector Táctil de Fecha y Atajos Rápidos */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="inline-flex items-center rounded-xl bg-white border border-slate-200/90 shadow-sm p-1 text-xs">
            <button
              onClick={handleRetrocederDia}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 font-semibold text-aurea-navy">
              <Calendar className="w-4 h-4 text-aurea-copper" />
              <span>{formatearFechaCabecera(fecha)}</span>
            </div>
            <button
              onClick={handleAvanzarDia}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 gap-1 border border-slate-200/60">
            <button
              onClick={() => onCambiarFecha('2026-10-09')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fecha === '2026-10-09'
                  ? 'bg-white text-aurea-navy shadow-sm'
                  : 'hover:text-aurea-navy hover:bg-white/50'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => onCambiarFecha('2026-10-08')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fecha === '2026-10-08'
                  ? 'bg-white text-aurea-navy shadow-sm'
                  : 'hover:text-aurea-navy hover:bg-white/50'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => onCambiarFecha('2026-10-02')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fecha === '2026-10-02'
                  ? 'bg-white text-aurea-navy shadow-sm'
                  : 'hover:text-aurea-navy hover:bg-white/50'
              }`}
            >
              7 Días
            </button>
          </div>
        </div>
      </div>

      {/* 4 Tarjetas KPI Operativas del Día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Anulaciones */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Anulaciones
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-serif text-aurea-navy">
                  {kpis.total_anulaciones}
                </span>
                <span className="text-xs text-slate-500">
                  {kpis.total_anulaciones === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-slate-100 text-aurea-navy flex items-center justify-center border border-slate-200">
              <FileX2 className="w-5 h-5 text-aurea-copper" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {kpis.pendientes_revision > 0 ? (
                <strong className="text-amber-700 font-semibold">
                  ● {kpis.pendientes_revision} pendientes de revisar
                </strong>
              ) : (
                <span className="text-emerald-700 font-semibold">✓ Todas revisadas</span>
              )}
            </span>
          </div>
        </div>

        {/* KPI 2: Monto Acumulado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Monto Acumulado
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-serif text-rose-600">
                  S/ {kpis.monto_total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Venta bruta cancelada en salón</span>
          </div>
        </div>

        {/* KPI 3: Con Merma Cocina */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Con Merma Culinaria
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-bold font-serif ${
                    kpis.con_merma_cantidad > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {kpis.con_merma_cantidad}
                </span>
                <span className="text-xs text-slate-500">
                  {kpis.con_merma_cantidad === 1 ? 'plato' : 'platos'}
                </span>
              </div>
            </div>

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                kpis.con_merma_cantidad > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            {kpis.costo_merma_total > 0 ? (
              <span>
                Costo teórico de insumos:{' '}
                <strong className="text-amber-800">S/ {kpis.costo_merma_total.toFixed(2)}</strong>
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">Sin pérdidas de insumos</span>
            )}
          </div>
        </div>

        {/* KPI 4: Mesas Afectadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Mesas Afectadas
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-serif text-aurea-navy">
                  {kpis.mesas_afectadas}
                </span>
                <span className="text-xs text-slate-500">
                  {kpis.mesas_afectadas === 1 ? 'mesa' : 'mesas'}
                </span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-slate-100 text-aurea-navy flex items-center justify-center border border-slate-200">
              <LayoutGrid className="w-5 h-5 text-aurea-copper" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Incluye mesas combinadas agrupadas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
