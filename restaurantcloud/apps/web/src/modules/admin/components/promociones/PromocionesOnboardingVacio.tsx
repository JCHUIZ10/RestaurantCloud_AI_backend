import React from 'react';
import {
  Tag,
  Sparkles,
  Zap,
  Plus,
  Calendar,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface PromocionesOnboardingVacioProps {
  esFiltroActivo: boolean;
  onLimpiarFiltros?: () => void;
  onCargarPlantillaInauguracion: () => void;
  onCrearDesdeCero: () => void;
}

export const PromocionesOnboardingVacio: React.FC<PromocionesOnboardingVacioProps> = ({
  esFiltroActivo,
  onLimpiarFiltros,
  onCargarPlantillaInauguracion,
  onCrearDesdeCero,
}) => {
  if (esFiltroActivo) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm text-center flex flex-col items-center justify-center space-y-3 my-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          No se encontraron promociones con los filtros seleccionados
        </h4>
        <p className="text-xs text-slate-500 max-w-md">
          Prueba cambiando el estado seleccionado, alternando el tipo de descuento o limpiando el texto de búsqueda.
        </p>
        {onLimpiarFiltros && (
          <button
            onClick={onLimpiarFiltros}
            className="mt-2 px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto my-6 animate-in fade-in duration-300">
      {/* Icono central de cabecera */}
      <div className="w-16 h-16 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
        <Tag className="w-8 h-8" />
      </div>

      {/* Textos explicativos */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          DINAMIZACIÓN COMERCIAL
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Comienza a premiar a tus clientes en sede
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed mx-auto">
          Configura promociones para aperturas, días tranquilos o dinamizar turnos. Totalmente sincronizadas con la pantalla de cobro en Caja (<code className="text-slate-700 font-mono text-xs">CU-CAJA-02</code>) y la precuenta digital en salón (<code className="text-slate-700 font-mono text-xs">CU-MOZO-08</code>).
        </p>
      </div>

      {/* Tarjeta Destacada: Plantilla Oficial Recomendada para Inauguración */}
      <div className="w-full bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 rounded-2xl border-2 border-amber-300 p-5 text-left shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
              <Zap className="w-3 h-3 text-amber-700" />
              Recomendada para Apertura de Local
            </span>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🎉 Plantilla: Descuento de Inauguración (15% OFF)</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              15% de descuento en toda la carta durante los primeros 30 días, sin límite de usos ni topes, aplicable de lunes a domingo.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold text-slate-700">
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <Percent className="w-3 h-3 text-amber-600" />
                Descuento: 15%
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-600" />
                Vigencia: 30 Días
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Sin restricciones
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCargarPlantillaInauguracion}
            className="sm:self-center shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-all shadow-md shadow-amber-600/20"
          >
            <Zap className="w-4 h-4 fill-white" />
            Cargar Plantilla en 1 Clic
          </button>
        </div>
      </div>

      {/* Separador */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          O si prefieres
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Botón secundario: Crear desde cero */}
      <button
        type="button"
        onClick={onCrearDesdeCero}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
      >
        <Plus className="w-4 h-4" />
        Crear Promoción Personalizada desde Cero
      </button>
    </div>
  );
};
