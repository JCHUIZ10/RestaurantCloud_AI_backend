import React from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Coins,
  Plus,
  MapPin,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Truck,
} from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { ResumenInventarioDTO } from '@/types/admin';

interface InsumosHeaderProps {
  localNombre: string;
  kpis: ResumenInventarioDTO;
  onAbrirNuevoInsumo: () => void;
}

export const InsumosHeader: React.FC<InsumosHeaderProps> = ({
  localNombre,
  kpis,
  onAbrirNuevoInsumo,
}) => {
  return (
    <div className="space-y-6">
      {/* Barra de Migas de Pan y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-aurea-navy/60 mb-1.5">
            <span>Administración</span>
            <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
            <span>Inventario y Almacén</span>
            <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
            <span className="font-semibold text-aurea-navy">Catálogo de Insumos</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-serif text-aurea-navy font-bold tracking-tight">
              Catálogo de Insumos de Inventario
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
              <MapPin className="w-3 h-3 text-aurea-copper" />
              {localNombre}
            </span>
          </div>
          <p className="text-sm text-aurea-navy/70 mt-1 max-w-3xl">
            Control de existencias físicas, umbrales mínimos, estados operativos y sincronización en tiempo real con recetas culinarias y comandas de cocina.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={ROUTES.ADMIN_PROVEEDORES}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-aurea-champagne/80 bg-white hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-semibold transition-all shadow-sm min-h-[44px]"
            title="Ir a gestionar el directorio de proveedores de insumos"
          >
            <Truck className="w-4 h-4 text-aurea-copper" />
            <span className="hidden sm:inline">Proveedores</span>
          </Link>
          <button
            type="button"
            onClick={onAbrirNuevoInsumo}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: Insumos Activos */}
        <div className="bg-white border border-aurea-champagne/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-aurea-navy/60">
              Insumos Activos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-aurea-navy">
              {kpis.total_activos}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Filtro por defecto
            </span>
          </div>
          <p className="text-xs text-aurea-navy/60 mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-aurea-copper" />
            Disponibles para preparación en recetas
          </p>
        </div>

        {/* KPI 2: En Quiebre / Agotados */}
        <div className="bg-white border border-aurea-champagne/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-aurea-navy/60">
              En Quiebre / Agotados
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                kpis.total_agotados > 0
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-aurea-champagne/30 text-aurea-navy/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-serif font-bold ${
                kpis.total_agotados > 0 ? 'text-rose-700' : 'text-aurea-navy'
              }`}
            >
              {kpis.total_agotados}
            </span>
            {kpis.total_agotados > 0 ? (
              <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Bloquea platos en carta
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Sin quiebres
              </span>
            )}
          </div>
          <p className="text-xs text-aurea-navy/60 mt-1.5">
            {kpis.total_agotados > 0
              ? 'Requiere recuento físico o reposición urgente'
              : 'Existencias suficientes para operación del día'}
          </p>
        </div>

        {/* KPI 3: Valorización Estimada */}
        <div className="bg-white border border-aurea-champagne/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-aurea-navy/60">
              Valorización Estimada
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-aurea-navy">
              S/ {kpis.valorizacion_total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-aurea-navy/60">
              PEN
            </span>
          </div>
          <p className="text-xs text-aurea-navy/60 mt-1.5">
            Calculado sobre el stock actual y costo unitario registrado
          </p>
        </div>
      </div>
    </div>
  );
};
