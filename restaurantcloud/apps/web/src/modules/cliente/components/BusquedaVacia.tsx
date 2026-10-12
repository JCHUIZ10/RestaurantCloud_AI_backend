import React from 'react';
import { Utensils, RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BusquedaVaciaProps {
  busqueda: string;
  onReset: () => void;
  telefonoSede?: string;
  nombreSede?: string;
}

export const BusquedaVacia: React.FC<BusquedaVaciaProps> = ({
  busqueda,
  onReset,
  telefonoSede,
  nombreSede,
}) => {
  const whatsappUrl = `https://wa.me/51${telefonoSede || '987654321'}?text=Hola%20${encodeURIComponent(nombreSede || 'al restaurante')},%20consultaba%20si%20preparan%20${encodeURIComponent(busqueda)}`;

  return (
    <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-aurea-champagne/40 border-2 border-aurea-copper/30 flex items-center justify-center mx-auto text-aurea-copper shadow-sm">
        <Utensils className="w-8 h-8" />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-serif text-xl sm:text-2xl text-aurea-navy font-bold">
          No encontramos platos para «{busqueda}»
        </h3>
        <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 leading-relaxed">
          Revisa que el nombre esté bien escrito o explora las categorías gastronómicas de la carta.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onReset}
          className="w-full sm:w-auto gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ver toda la carta</span>
        </Button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Consultar por WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
