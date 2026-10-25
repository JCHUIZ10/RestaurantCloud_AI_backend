import React from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { Utensils, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';

export const SedeCustomerLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-aurea-navy selection:bg-aurea-champagne">
      {/* Cabecera Móvil/Desktop de la Carta del Restaurante por Slug */}
      <header className="sticky top-0 z-40 bg-[#FFF9F0]/95 backdrop-blur-md border-b border-aurea-copper/25 px-4 sm:px-6 lg:px-8 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-aurea-navy flex items-center justify-center text-aurea-champagne shadow-sm">
              <Utensils className="w-4 h-4 text-aurea-copper" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold block leading-none capitalize">
                {slug ? slug.replace(/-/g, ' ') : 'Restaurante'}
              </span>
              <span className="text-[10px] text-aurea-copper font-medium tracking-tight">
                Carta Digital • RestaurantCloud AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/51987654321"
              target="_blank"
              rel="noreferrer"
              aria-label="Contactar al restaurante"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <a
              href="tel:+51987654321"
              aria-label="Llamar"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Llamar</span>
            </a>
          </div>
        </div>
      </header>

      {/* Contenido de la Carta con ancho max-w-7xl responsivo */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer del Comensal */}
      <footer className="py-6 border-t border-aurea-copper/20 text-center text-xs text-aurea-navy/60 font-sans space-y-1">
        <p>Precios expresados en Soles (PEN S/) con IGV incluido.</p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Link to={ROUTES.HOME} className="text-[11px] text-aurea-copper underline hover:text-aurea-navy flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Conoce RestaurantCloud AI
          </Link>
        </div>
      </footer>
    </div>
  );
};
