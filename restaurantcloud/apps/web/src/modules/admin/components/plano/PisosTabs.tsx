import React from 'react';
import { PisoAdminDTO } from '@/types/admin';
import { Plus, Minus, Grid, Layers, Settings } from 'lucide-react';

interface PisosTabsProps {
  pisos: PisoAdminDTO[];
  pisoActivoId: string;
  onSeleccionarPiso: (pisoId: string) => void;
  onAbrirNuevoPiso: () => void;
  onAbrirEditarPiso?: (piso: PisoAdminDTO) => void;
  onModificarDimensiones: (deltaCol: number, deltaFila: number) => void;
  isUpdatingDimensions?: boolean;
}

export const PisosTabs: React.FC<PisosTabsProps> = ({
  pisos,
  pisoActivoId,
  onSeleccionarPiso,
  onAbrirNuevoPiso,
  onAbrirEditarPiso,
  onModificarDimensiones,
  isUpdatingDimensions = false,
}) => {
  const pisoActivo = pisos.find((p) => p.id === pisoActivoId);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aurea-copper/20 pb-4">
      {/* Pestañas de Ambientes / Pisos con scroll horizontal táctil */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
        {pisos.map((piso) => {
          const activo = piso.id === pisoActivoId;
          const mesasActivas = piso.mesas.filter((m) => m.estado !== 'inactiva').length;

          return (
            <div
              key={piso.id}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activo
                  ? 'bg-aurea-navy text-white shadow-md'
                  : 'bg-white border border-aurea-copper/30 text-aurea-navy/80 hover:bg-aurea-champagne/20'
              }`}
            >
              <button
                type="button"
                onClick={() => onSeleccionarPiso(piso.id)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <span>{piso.nombre}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activo
                      ? 'bg-aurea-copper text-aurea-navy'
                      : 'bg-aurea-ivory text-aurea-navy/70 border border-aurea-copper/20'
                  }`}
                >
                  {mesasActivas}
                </span>
              </button>

              {activo && onAbrirEditarPiso && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAbrirEditarPiso(piso);
                  }}
                  title={`Configurar o eliminar ambiente: ${piso.nombre}`}
                  aria-label={`Configurar ambiente ${piso.nombre}`}
                  className="p-1 -mr-1 rounded-md hover:bg-white/20 text-aurea-champagne hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={onAbrirNuevoPiso}
          aria-label="Registrar nuevo ambiente"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-aurea-copper/50 text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20 text-xs font-semibold whitespace-nowrap transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-aurea-copper" />
          <span>+ Ambiente</span>
        </button>
      </div>

      {/* Controles de Cuadrícula del Salón Activo (Columnas y Filas) */}
      {pisoActivo && (
        <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-aurea-copper/25 shadow-sm text-xs text-aurea-navy self-start md:self-auto">
          <div className="flex items-center gap-1.5 font-semibold text-aurea-navy/70 mr-1">
            <Grid className="w-4 h-4 text-aurea-copper" />
            <span>Cuadrícula:</span>
            <span className="text-aurea-navy font-bold">
              {pisoActivo.columnas} col × {pisoActivo.filas} filas
            </span>
          </div>

          <div className="h-4 w-px bg-aurea-copper/20" />

          {/* Ajuste de Columnas */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-aurea-navy/60 font-medium">Col:</span>
            <button
              onClick={() => onModificarDimensiones(-1, 0)}
              disabled={isUpdatingDimensions || pisoActivo.columnas <= 1}
              title="Quitar columna"
              aria-label="Quitar columna del salón"
              className="p-1 rounded bg-aurea-ivory hover:bg-rose-50 text-aurea-navy hover:text-rose-600 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onModificarDimensiones(1, 0)}
              disabled={isUpdatingDimensions || pisoActivo.columnas >= 12}
              title="Añadir columna"
              aria-label="Añadir columna al salón"
              className="p-1 rounded bg-aurea-ivory hover:bg-emerald-50 text-aurea-navy hover:text-emerald-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="h-4 w-px bg-aurea-copper/20" />

          {/* Ajuste de Filas */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-aurea-navy/60 font-medium">Fil:</span>
            <button
              onClick={() => onModificarDimensiones(0, -1)}
              disabled={isUpdatingDimensions || pisoActivo.filas <= 1}
              title="Quitar fila"
              aria-label="Quitar fila del salón"
              className="p-1 rounded bg-aurea-ivory hover:bg-rose-50 text-aurea-navy hover:text-rose-600 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onModificarDimensiones(0, 1)}
              disabled={isUpdatingDimensions || pisoActivo.filas >= 10}
              title="Añadir fila"
              aria-label="Añadir fila al salón"
              className="p-1 rounded bg-aurea-ivory hover:bg-emerald-50 text-aurea-navy hover:text-emerald-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
