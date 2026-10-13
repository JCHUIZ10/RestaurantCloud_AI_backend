import React from 'react';
import {
  Utensils,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
} from 'lucide-react';
import { KpisCartaDTO } from '@/types/admin';

interface ProductosKpisProps {
  kpis: KpisCartaDTO;
  totalCategorias?: number;
}

export const ProductosKpis: React.FC<ProductosKpisProps> = ({
  kpis,
  totalCategorias = 4,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Platos */}
      <div className="bg-white rounded-2xl border border-aurea-champagne/40 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">
            Total Platos Carta
          </span>
          <div className="w-8 h-8 rounded-lg bg-aurea-navy/5 flex items-center justify-center text-aurea-navy">
            <Utensils className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-serif font-bold text-aurea-navy">
            {kpis.total_productos}
          </span>
          <span className="text-xs text-aurea-navy/60 font-medium">platos / beb.</span>
        </div>
        <p className="mt-1 text-xs text-aurea-navy/60 flex items-center gap-1">
          En {totalCategorias} categorías activas
        </p>
      </div>

      {/* 2. Disponibles Salón */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Disponibles Salón
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-serif font-bold text-emerald-700">
            {kpis.disponibles}
          </span>
          <span className="text-xs text-emerald-600 font-medium">para venta</span>
        </div>
        <p className="mt-1 text-xs text-emerald-600/80">
          En comanda móvil de mozo
        </p>
      </div>

      {/* 3. Agotados por Quiebre */}
      <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
            Agotados / Quiebre
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-serif font-bold text-rose-700">
            {kpis.agotados}
          </span>
          <span className="text-xs text-rose-600 font-medium">pausados</span>
        </div>
        <p className="mt-1 text-xs text-rose-600/80">
          Bloq. automático cocina / bodega
        </p>
      </div>

      {/* 4. Margen Bruto Promedio */}
      <div className="bg-white rounded-2xl border border-aurea-copper/20 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-aurea-copper">
            Margen Bruto Promedio
          </span>
          <div className="w-8 h-8 rounded-lg bg-aurea-champagne/30 flex items-center justify-center text-aurea-copper">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-serif font-bold text-aurea-navy">
            {kpis.margen_promedio}%
          </span>
          <span className="text-xs text-aurea-copper font-medium">rentabilidad</span>
        </div>
        <p className="mt-1 text-xs text-aurea-navy/60">
          Según costo teórico de recetas
        </p>
      </div>
    </div>
  );
};
