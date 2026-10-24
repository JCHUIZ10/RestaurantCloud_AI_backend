import React from 'react';
import { Plus, Receipt, Store } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ComprasHeaderProps {
  onNuevaCompra: () => void;
}

export const ComprasHeader: React.FC<ComprasHeaderProps> = ({ onNuevaCompra }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const localNombre = usuario?.local?.nombre || usuario?.empresa?.nombre || 'Sede Principal';

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-gray-200">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full w-fit mb-1.5 border border-primary-200">
          <Store className="w-3.5 h-3.5" />
          <span>{localNombre}</span>
          <span className="text-gray-300">•</span>
          <span>CU-ADMIN-06</span>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Fichas de Compra de Insumos
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Registro de comprobantes de ingreso, actualización inmediata de existencias y control de costos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onNuevaCompra}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-aurea-navy text-white hover:bg-aurea-navy/90 rounded-lg font-medium text-sm active:text-white hover:bg-aurea-navy/50 transition-colors shadow-sm active:scale-95 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-aurea-champagne" />
          <span>Registrar Compra</span>
        </button>
      </div>
    </header>
  );
};
