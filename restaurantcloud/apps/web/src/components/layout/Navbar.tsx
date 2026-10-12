import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Cloud, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Ecosistema', href: '/#modulos' },
    { label: 'IA & Forecasting', href: '/#ia' },
    { label: 'Planes & Precios', href: '/#planes' },
    { label: 'Carta Demo QR', href: '/carta' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FFF9F0]/90 backdrop-blur-md border-b border-aurea-copper/25 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logotipo Oficial RestaurantCloud AI */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-aurea-navy flex items-center justify-center border-2 border-aurea-copper/60 shadow-md group-hover:scale-105 transition-transform">
            <Cloud className="w-6 h-6 text-aurea-champagne" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-2xl sm:text-2xl text-aurea-navy tracking-[0.03em] font-normal leading-none">
                RestaurantCloud
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-aurea-copper/20 text-aurea-navy border border-aurea-copper/40">
                AI
              </span>
            </div>
            <span className="font-sans text-[11px] sm:text-xs text-aurea-copper font-medium tracking-tight mt-0.5">
              Software integral con Inteligencia Artificial
            </span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`font-sans text-sm font-medium transition-colors hover:text-aurea-copper ${
                location.pathname === link.href ? 'text-aurea-navy font-semibold' : 'text-aurea-navy/80'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Acciones Rápidas Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-aurea-navy hover:text-aurea-navy/80 hover:bg-aurea-champagne/30 transition-colors"
          >
            <LogIn className="w-4 h-4 text-aurea-copper" />
            Iniciar Sesión
          </Link>

          <a
            href="/#planes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-aurea-ivory bg-aurea-navy hover:bg-opacity-90 shadow-md transition-all group"
          >
            <span>Crear Restaurante</span>
            <ArrowRight className="w-4 h-4 text-aurea-copper group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Botón Hamburguesa Móvil */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/login"
            className="p-2 text-xs font-semibold text-aurea-navy bg-aurea-champagne/40 rounded-lg border border-aurea-copper/30"
          >
            Entrar
          </Link>

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Abrir menú"
            className="p-2.5 rounded-lg text-aurea-navy hover:bg-aurea-champagne/40 transition-colors focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6 text-aurea-copper" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Lateral / Drawer Móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-b border-aurea-copper/20 bg-[#FFF9F0]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-base font-medium text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-aurea-copper/20 flex flex-col gap-2.5">
              <a
                href="/#planes"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-aurea-ivory bg-aurea-navy shadow-md"
              >
                <Sparkles className="w-4 h-4 text-aurea-copper" />
                Registrar Restaurante (Prueba Gratis)
              </a>

              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-aurea-navy border border-aurea-navy/20 hover:bg-aurea-champagne/20"
              >
                <LogIn className="w-4 h-4 text-aurea-copper" />
                Acceso para Propietarios y Personal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
