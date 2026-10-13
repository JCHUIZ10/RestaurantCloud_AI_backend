import React from 'react';
import {
  Users,
  Receipt,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { ProveedoresKPIsDTO } from '@/types/admin';

interface ProveedoresKpisProps {
  kpis: ProveedoresKPIsDTO;
}

export const ProveedoresKpis: React.FC<ProveedoresKpisProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tarjeta 1: Proveedores Activos */}
      <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/80 shadow-sm flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">
            Proveedores Activos
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-serif font-bold text-aurea-navy">
              {kpis.total_activos}
            </span>
            <span className="text-xs text-emerald-700 font-medium">vigentes</span>
          </div>
          <p className="text-xs text-aurea-navy/60 mt-0.5 truncate">
            En agenda activa de sede
          </p>
        </div>
      </div>

      {/* Tarjeta 2: Compras del Mes */}
      <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/80 shadow-sm flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 shrink-0">
          <Receipt className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">
            Compras del Mes
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-serif font-bold text-aurea-navy">
              S/ {kpis.compras_mes_total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-aurea-navy/60 mt-0.5 truncate">
            En {kpis.fichas_mes_total} fichas de compra
          </p>
        </div>
      </div>

      {/* Tarjeta 3: Proveedores Frecuentes */}
      <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/80 shadow-sm flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-aurea-copper/10 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper shrink-0">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">
            Proveedores Frecuentes
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-serif font-bold text-aurea-navy">
              {kpis.proveedores_frecuentes}
            </span>
            <span className="text-xs text-aurea-copper font-medium">regulares</span>
          </div>
          <p className="text-xs text-aurea-navy/60 mt-0.5 truncate">
            Compras semanales continuas
          </p>
        </div>
      </div>

      {/* Tarjeta 4: Contacto Directo */}
      <div className="p-4 rounded-2xl bg-white border border-aurea-champagne/80 shadow-sm flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">
            Contacto Directo
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-serif font-bold text-aurea-navy">
              100%
            </span>
            <span className="text-xs text-emerald-700 font-medium">validados</span>
          </div>
          <p className="text-xs text-aurea-navy/60 mt-0.5 truncate">
            Canal WhatsApp directo OK
          </p>
        </div>
      </div>
    </div>
  );
};
