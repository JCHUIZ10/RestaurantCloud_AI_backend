import React from 'react';
import { Coins, FileMinus2, Receipt } from 'lucide-react';
import { formatPEN, cn } from '@/shared/utils';
import type { MedioPagoCodigo, ResumenTurnoComprobantesDTO } from '@/types/caja';
import { ICONOS_MEDIO_PAGO } from './comprobanteFormato';

interface ResumenTurnoComprobantesProps {
  resumen: ResumenTurnoComprobantesDTO;
  medioActivo: 'todos' | MedioPagoCodigo;
  onSeleccionarMedio: (medio: 'todos' | MedioPagoCodigo) => void;
}

/**
 * Resumen del turno por medio de pago. Los montos no dependen de los filtros de la tabla;
 * pulsar un medio filtra el listado (y volver a pulsarlo quita el filtro).
 */
export const ResumenTurnoComprobantes: React.FC<ResumenTurnoComprobantesProps> = ({
  resumen,
  medioActivo,
  onSeleccionarMedio,
}) => {
  return (
    <section aria-label="Resumen del turno" className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-6 gap-3">
      <>
        {resumen.por_medio.map((medio) => {
          const Icono = ICONOS_MEDIO_PAGO[medio.codigo];
          const activo = medioActivo === medio.codigo;

          return (
            <button
              key={medio.codigo}
              type="button"
              aria-pressed={activo}
              onClick={() => onSeleccionarMedio(activo ? 'todos' : medio.codigo)}
              className={cn(
                'p-3.5 rounded-2xl border text-left transition-all shadow-xs min-h-tactil',
                'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/60',
                activo
                  ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
              )}
            >
              <span className="flex items-center gap-2 text-xs uppercase font-bold text-slate-500">
                <Icono className="w-4 h-4 text-amber-600" aria-hidden="true" />
                {medio.nombre}
              </span>
              <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-xl font-mono font-extrabold text-slate-900">{formatPEN(medio.neto)}</span>
                <span className="text-xs text-slate-500">
                  {medio.operaciones} {medio.operaciones === 1 ? 'cobro' : 'cobros'}
                </span>
              </span>
            </button>
          );
        })}
      </>

      <>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="flex items-center gap-2 text-xs uppercase font-bold text-slate-500">
            <Receipt className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            Total facturado neto
          </span>
          <span className="mt-1.5 block text-xl font-mono font-extrabold text-slate-900">
            {formatPEN(resumen.total_neto)}
          </span>
          <span className="text-xs text-slate-500">
            {resumen.vigentes_count} {resumen.vigentes_count === 1 ? 'comprobante vigente' : 'comprobantes vigentes'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
          <span className="flex items-center gap-2 text-xs uppercase font-bold text-rose-700">
            <FileMinus2 className="w-4 h-4" aria-hidden="true" />
            Extornado con NC
          </span>
          <span className="mt-1.5 block text-xl font-mono font-extrabold text-rose-700">
            {formatPEN(resumen.notas_credito.monto)}
          </span>
          <span className="text-xs text-rose-700/80">
            {resumen.notas_credito.count} {resumen.notas_credito.count === 1 ? 'nota de crédito' : 'notas de crédito'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <span className="flex items-center gap-2 text-xs uppercase font-bold text-amber-800">
            <Coins className="w-4 h-4" aria-hidden="true" />
            Efectivo en gaveta
          </span>
          <span className="mt-1.5 block text-xl font-mono font-extrabold text-amber-900">
            {formatPEN(resumen.efectivo_gaveta)}
          </span>
          <span className="text-xs text-amber-800/80">Fondo + cobros − devoluciones</span>
        </div>
      </>
    </section>
  );
};
