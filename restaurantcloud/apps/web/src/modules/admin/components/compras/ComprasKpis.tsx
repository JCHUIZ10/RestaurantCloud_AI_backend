import React from 'react';
import { ShoppingBag, TrendingUp, Receipt, ShieldCheck, Clock } from 'lucide-react';
import { FichasCompraKPIsDTO } from '@/types/admin';

interface ComprasKpisProps {
  kpis: FichasCompraKPIsDTO;
  cargando?: boolean;
}

export const ComprasKpis: React.FC<ComprasKpisProps> = ({ kpis, cargando = false }) => {
  if (cargando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl border border-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Gasto Total del Mes */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Gasto Total Mes (Octubre)
          </p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">
            S/ {kpis.gasto_mes_total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{kpis.variacion_gasto_mes_pct}% vs mes anterior</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
          <ShoppingBag className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Total Compras / Fichas */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Fichas Registradas
          </p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">
            {kpis.total_compras_mes}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Comprobantes liquidados este mes
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
          <Receipt className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Crédito Fiscal IGV */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Crédito Fiscal (IGV 18%)
          </p>
          <p className="mt-1.5 text-2xl font-bold text-indigo-900">
            S/ {kpis.facturas_con_igv_monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-indigo-600 font-medium">
            Facturas válidas para SUNAT
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Créditos Pendientes */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Compras a Crédito (30d)
          </p>
          <p className="mt-1.5 text-2xl font-bold text-amber-900">
            S/ {kpis.creditos_pendientes_monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-amber-700 font-medium">
            Por amortizar a proveedores
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
