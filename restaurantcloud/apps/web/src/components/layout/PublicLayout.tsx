import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-aurea-ivory text-aurea-navy">
      <header className="border-b border-aurea-copper/20 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl tracking-wide font-normal text-aurea-navy">
              ÁUREA
            </span>
          </div>
          <p className="text-xs text-aurea-copper font-medium hidden sm:block">
            Una experiencia para disfrutar
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-aurea-copper/20 bg-white/60 py-6 text-center text-xs text-aurea-navy/70">
        <p className="font-serif text-sm text-aurea-navy mb-1">ÁUREA</p>
        <p>© {new Date().getFullYear()} RestaurantCloud AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
