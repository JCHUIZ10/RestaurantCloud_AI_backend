import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  MapPin,
  ChevronRight,
  Package,
} from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';

interface ProveedoresHeaderProps {
  localNombre: string;
  onAbrirNuevoProveedor: () => void;
}

export const ProveedoresHeader: React.FC<ProveedoresHeaderProps> = ({
  localNombre,
  onAbrirNuevoProveedor,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-aurea-navy/60 mb-1.5">
          <span>Portal Administrador</span>
          <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
          <span>Abastecimiento</span>
          <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
          <span className="font-semibold text-aurea-navy">Proveedores</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aurea-champagne/30 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper shrink-0 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-serif text-aurea-navy font-bold tracking-tight">
                Directorio de Proveedores Comerciales
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
                <MapPin className="w-3 h-3 text-aurea-copper" />
                {localNombre}
              </span>
            </div>
            <p className="text-sm text-aurea-navy/70 mt-0.5 max-w-3xl">
              Gestión de proveedores, contacto directo WhatsApp, compras históricas y relación de insumos habituales de la sede.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción Superior */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          to={ROUTES.ADMIN_INVENTARIO}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-aurea-champagne/80 hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-semibold transition-all min-h-[44px]"
          title="Ir a gestionar los insumos y stock en bodega"
        >
          <Package className="w-4 h-4 text-aurea-copper" />
          <span className="hidden sm:inline">Insumos & Inventario</span>
        </Link>
        <button
          type="button"
          onClick={onAbrirNuevoProveedor}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>
    </div>
  );
};
