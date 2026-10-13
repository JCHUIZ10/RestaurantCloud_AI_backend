import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Eye,
  UtensilsCrossed,
  Sparkles,
  Plus,
  BookOpen,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { ResumenCategoriasDTO } from '@/types/admin';

interface CategoriasHeaderProps {
  localNombre: string;
  resumen: ResumenCategoriasDTO;
  onAbrirNuevaCategoria: () => void;
  onAbrirPlantillas: () => void;
}

export const CategoriasHeader: React.FC<CategoriasHeaderProps> = ({
  localNombre,
  resumen,
  onAbrirNuevaCategoria,
  onAbrirPlantillas,
}) => {
  return (
    <div className="space-y-6">
      {/* Barra de Migas de Pan y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-aurea-navy/60 mb-1.5">
            <span>Administración</span>
            <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
            <span>Carta & Menú</span>
            <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
            <span className="font-semibold text-aurea-navy">Categorías</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-serif text-aurea-navy font-bold tracking-tight">
              Categorías de la Carta
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
              <MapPin className="w-3 h-3 text-aurea-copper" />
              {localNombre}
            </span>
          </div>
          <p className="text-sm text-aurea-navy/70 mt-1 max-w-2xl">
            Organiza las secciones del menú, su visibilidad en el salón y comanda QR, y define la secuencia de pestañas para la toma de pedidos de los mozos.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={ROUTES.ADMIN_CARTA}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-aurea-champagne/80 bg-white hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-semibold transition-all shadow-sm min-h-[44px]"
            title="Ir a gestionar los productos y recetas de la carta"
          >
            <UtensilsCrossed className="w-4 h-4 text-aurea-copper" />
            <span className="hidden sm:inline">Productos y Carta</span>
          </Link>
          <button
            type="button"
            onClick={onAbrirPlantillas}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-aurea-copper/40 bg-white hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-medium transition-colors shadow-sm min-h-[44px]"
            title="Explorar plantillas gastronómicas preconfiguradas"
          >
            <BookOpen className="w-4 h-4 text-aurea-copper" />
            <span className="hidden sm:inline">Plantillas</span> Rápidas
          </button>
          <button
            type="button"
            onClick={onAbrirNuevaCategoria}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-aurea-champagne" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas / KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Categorías */}
        <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/50 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-aurea-champagne/30 text-aurea-navy flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-aurea-copper" />
          </div>
          <div>
            <span className="text-xs font-medium text-aurea-navy/60 uppercase tracking-wider block">
              Total Secciones
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-aurea-navy">
              {resumen.total_categorias}
            </span>
          </div>
        </div>

        {/* Categorías Visibles */}
        <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/50 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-medium text-aurea-navy/60 uppercase tracking-wider block">
              Visibles en Salón
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-serif text-aurea-navy">
                {resumen.categorias_activas}
              </span>
              {resumen.categorias_ocultas > 0 && (
                <span className="text-xs text-amber-600 font-medium">
                  ({resumen.categorias_ocultas} oculta{resumen.categorias_ocultas > 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Platos Vinculados */}
        <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/50 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-aurea-copper/10 text-aurea-copper flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-aurea-copper" />
          </div>
          <div>
            <span className="text-xs font-medium text-aurea-navy/60 uppercase tracking-wider block">
              Platos en Carta
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-aurea-navy">
              {resumen.total_productos_asociados}
            </span>
          </div>
        </div>

        {/* Mayor Catálogo */}
        <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/50 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-aurea-navy/60 uppercase tracking-wider block truncate">
              Mayor Volumen
            </span>
            {resumen.categoria_con_mas_platos ? (
              <div className="truncate">
                <span className="text-sm sm:text-base font-bold text-aurea-navy truncate block">
                  {resumen.categoria_con_mas_platos.nombre}
                </span>
                <span className="text-xs text-aurea-navy/60">
                  {resumen.categoria_con_mas_platos.cantidad} plato(s)
                </span>
              </div>
            ) : (
              <span className="text-sm text-aurea-navy/50 italic">Sin datos</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
