import React from 'react';
import { Truck, Plus, MessageCircle, Receipt, Zap, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';

interface OnboardingProveedoresVacioProps {
  onAbrirNuevoProveedor: () => void;
}

const PILARES: Array<{ icono: LucideIcon; titulo: string; texto: string; color: string }> = [
  { icono: MessageCircle, titulo: 'WhatsApp directo', texto: 'Abre el chat en un toque con el pedido ya escrito.', color: 'bg-estado-ok-100 text-estado-ok-700' },
  { icono: Receipt, titulo: 'Control de costos', texto: 'Revisa lo que pagaste en cada compra y cómo varían los precios.', color: 'bg-aurea-navy/10 text-aurea-navy' },
  { icono: Zap, titulo: 'Alta rápida', texto: 'Nombre y celular bastan; el RUC no es obligatorio.', color: 'bg-aurea-champagne/50 text-aurea-copper' },
];

export const OnboardingProveedoresVacio: React.FC<OnboardingProveedoresVacioProps> = ({ onAbrirNuevoProveedor }) => (
  <div className="bg-white rounded-2xl border border-aurea-copper/30 border-t-4 border-t-aurea-copper shadow-md p-6 sm:p-10 text-center space-y-8">
    <div className="space-y-2">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-aurea-navy text-aurea-champagne ring-1 ring-aurea-copper/40 flex items-center justify-center">
        <Truck className="w-7 h-7" aria-hidden="true" />
      </span>
      <h2 className="font-serif text-2xl font-bold text-aurea-navy">Aún no tienes proveedores</h2>
      <p className="text-sm text-aurea-navy/70 max-w-xl mx-auto">
        Regístralos aquí o al vuelo cuando ingreses una compra.
      </p>
    </div>

    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
      {PILARES.map(({ icono: Icono, titulo, texto, color }) => (
        <li key={titulo} className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne space-y-2">
          <span className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`} aria-hidden="true">
              <Icono className="w-4 h-4" />
            </span>
            <span className="font-semibold text-aurea-navy">{titulo}</span>
          </span>
          <p className="text-sm text-aurea-navy/70">{texto}</p>
        </li>
      ))}
    </ul>

    <Button size="lg" onClick={onAbrirNuevoProveedor} leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}>
      Registrar mi primer proveedor
    </Button>
  </div>
);
