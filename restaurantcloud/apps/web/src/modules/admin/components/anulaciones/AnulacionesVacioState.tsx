import React from 'react';
import { CheckCircle2, Sparkles, ArrowLeft, Calendar } from 'lucide-react';

interface AnulacionesVacioStateProps {
  fecha: string;
  esFiltroActivo: boolean;
  onLimpiarFiltros?: () => void;
  onVolverAHoy?: () => void;
}

export const AnulacionesVacioState: React.FC<AnulacionesVacioStateProps> = ({
  fecha,
  esFiltroActivo,
  onLimpiarFiltros,
  onVolverAHoy,
}) => {
  if (esFiltroActivo) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No se encontraron registros con los filtros seleccionados</h4>
        <p className="text-xs text-slate-500 max-w-md">
          Prueba cambiando el filtro rápido, seleccionando otro mozo o limpiando el texto de búsqueda.
        </p>
        {onLimpiarFiltros && (
          <button
            onClick={onLimpiarFiltros}
            className="mt-2 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 sm:p-10 border border-emerald-200/80 shadow-sm text-center flex flex-col items-center justify-center space-y-5 max-w-xl mx-auto my-4 animate-in fade-in">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          EXCELENCIA OPERATIVA
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          🎉 Cero Anulaciones Registradas
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Fecha: {fecha} • Servicio fluido en salón
        </p>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
        Todas las comandas registradas en sala por los mozos han avanzado con normalidad hacia cocina, pase y facturación en caja sin cortes ni retractaciones.
      </p>

      {/* 3 mini cards métricas destacadas */}
      <div className="grid grid-cols-3 gap-3 w-full pt-1">
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
          <span className="text-emerald-700 font-extrabold text-sm sm:text-base block">100%</span>
          <span className="text-[10px] text-emerald-800/80 font-medium uppercase tracking-wider block mt-0.5">
            Eficiencia Sala
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <span className="text-slate-800 font-extrabold text-sm sm:text-base block">0</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mt-0.5">
            Comandas Revocadas
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <span className="text-emerald-600 font-extrabold text-sm sm:text-base block">S/ 0.00</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mt-0.5">
            Pérdida por Merma
          </span>
        </div>
      </div>

      {onVolverAHoy && (
        <button
          onClick={onVolverAHoy}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ver fecha de hoy
        </button>
      )}
    </div>
  );
};
