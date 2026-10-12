import React from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { Utensils, MessageCircle, Phone, ArrowLeft } from 'lucide-react';

export const SedeCustomerLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F0] text-aurea-navy selection:bg-aurea-champagne">
      {/* Cabecera Móvil de la Carta del Restaurante por Slug */}
      <header className="sticky top-0 z-40 bg-[#FFF9F0]/95 backdrop-blur-md border-b border-aurea-copper/25 px-4 py-3 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
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
              className="p-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="tel:+51987654321"
              aria-label="Llamar"
              className="p-2 rounded-full bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Contenido de la Carta */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4">
        <Outlet />
      </main>

      {/* Footer del Comensal */}
      <footer className="py-6 border-t border-aurea-copper/20 text-center text-xs text-aurea-navy/60 font-sans space-y-1">
        <p>Precios expresados en Soles (PEN S/) con IGV incluido.</p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Link to="/" className="text-[11px] text-aurea-copper underline hover:text-aurea-navy flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Conoce RestaurantCloud AI
          </Link>
        </div>
      </footer>
    </div>
  );
};
