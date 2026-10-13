import React from 'react';
import {
  CalendarClock,
  SlidersHorizontal,
  Clock3,
  RotateCcw,
  Building2,
} from 'lucide-react';

interface PoliticasHeaderProps {
  vistaActiva: 'parametros' | 'simulador';
  onCambiarVista: (vista: 'parametros' | 'simulador') => void;
  onRestaurarRecomendados: () => void;
  isGuardando?: boolean;
}

export const PoliticasHeader: React.FC<PoliticasHeaderProps> = ({
  vistaActiva,
  onCambiarVista,
  onRestaurarRecomendados,
  isGuardando = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-aurea-copper/20 p-5 shadow-sm space-y-4">
      {/* Migas de pan e información de sede */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <nav className="flex items-center gap-1.5 text-stone-500 font-medium">
          <span>Portal Administrador</span>
          <span className="text-stone-300">/</span>
          <span>Salón y Mesas</span>
          <span className="text-stone-300">/</span>
          <span className="text-aurea-navy font-semibold">Políticas de Reserva</span>
        </nav>

        <div className="flex items-center gap-2 bg-aurea-ivory px-3 py-1 rounded-full border border-aurea-copper/30 text-stone-700 text-xs">
          <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Sede: <strong className="text-aurea-navy">Miraflores (Principal)</strong></span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>
      </div>

      {/* Título principal y pestañas de vista */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-aurea-navy text-aurea-champagne flex items-center justify-center shadow-sm">
              <CalendarClock className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-aurea-navy tracking-tight">
                Políticas y Parámetros de Reservas
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Regula tiempos de servicio, rotación de comensales y sincronización con el plano de mozos.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones del encabezado: Switcher de Vistas + Restaurar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabs Segmentados */}
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => onCambiarVista('parametros')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaActiva === 'parametros'
                  ? 'bg-white text-aurea-navy font-semibold shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Configuración</span>
            </button>
            <button
              type="button"
              onClick={() => onCambiarVista('simulador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaActiva === 'simulador'
                  ? 'bg-white text-aurea-navy font-semibold shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock3 className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Simulador de Mesa</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                En vivo
              </span>
            </button>
          </div>

          {/* Botón Restaurar Recomendados */}
          <button
            type="button"
            onClick={onRestaurarRecomendados}
            disabled={isGuardando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            title="Restablece los parámetros canónicos sugeridos para salón de restaurante"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Restaurar</span> Recomendados
          </button>
        </div>
      </div>
    </div>
  );
};
