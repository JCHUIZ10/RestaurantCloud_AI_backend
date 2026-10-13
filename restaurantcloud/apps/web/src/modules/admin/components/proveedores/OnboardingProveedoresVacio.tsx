import React from 'react';
import {
  Truck,
  Plus,
  MessageCircle,
  Receipt,
  Zap,
} from 'lucide-react';

interface OnboardingProveedoresVacioProps {
  onAbrirNuevoProveedor: () => void;
}

export const OnboardingProveedoresVacio: React.FC<OnboardingProveedoresVacioProps> = ({
  onAbrirNuevoProveedor,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-aurea-champagne/80 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-8">
      {/* Icono Principal */}
      <div className="w-16 h-16 rounded-3xl bg-aurea-champagne/40 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper mx-auto mb-6 shadow-sm">
        <Truck className="w-8 h-8" />
      </div>

      {/* Título y Mensaje */}
      <h2 className="text-2xl font-serif font-bold text-aurea-navy mb-2">
        Tu Directorio de Proveedores está Vacío
      </h2>
      <p className="text-sm text-aurea-navy/70 max-w-lg mx-auto mb-8">
        Registra a tus proveedores comerciales para centralizar su contacto directo por WhatsApp, controlar la evolución de precios de insumos y facilitar la emisión de compras en tu sede.
      </p>

      {/* Tarjetas de Beneficios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
        <div className="p-4 rounded-2xl bg-aurea-ivory/50 border border-aurea-champagne/80">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2.5">
            <MessageCircle className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-aurea-navy mb-1">
            WhatsApp Directo
          </h3>
          <p className="text-[11px] text-aurea-navy/60">
            Abre conversaciones en un clic con pedidos y cotizaciones preformateados.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-aurea-ivory/50 border border-aurea-champagne/80">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2.5">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-aurea-navy mb-1">
            Control de Costos
          </h3>
          <p className="text-[11px] text-aurea-navy/60">
            Audita el historial de precios facturados y detecta variaciones mensuales.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-aurea-ivory/50 border border-aurea-champagne/80">
          <div className="w-8 h-8 rounded-xl bg-aurea-copper/10 text-aurea-copper flex items-center justify-center mb-2.5">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-semibold text-aurea-navy mb-1">
            Sin Burocracia
          </h3>
          <p className="text-[11px] text-aurea-navy/60">
            Alta en menos de 10 segundos sin exigir RUC obligatorio.
          </p>
        </div>
      </div>

      {/* Botón de Acción Principal */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onAbrirNuevoProveedor}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Primer Proveedor</span>
        </button>

        <p className="text-xs text-aurea-navy/50 max-w-md mx-auto">
          💡 <span className="font-medium text-aurea-navy/70">Tip Operativo:</span> También podrás registrarlos directamente "al vuelo" mientras formalizas una Ficha de Compra física (CU-ADMIN-06).
        </p>
      </div>
    </div>
  );
};
