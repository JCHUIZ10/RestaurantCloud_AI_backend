import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ROUTES } from '@/router/routes.constants';

// Las anclas (/#seccion) usan <a> nativo para conservar el scroll; las rutas usan Link
const EnlaceNav: React.FC<{
  href: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
}> = ({ href, ...props }) =>
  href.includes('#') ? <a href={href} {...props} /> : <Link to={href} {...props} />;

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const pendingScroll = useRef<(() => void) | null>(null);
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (!isLanding) {
      pendingScroll.current = null;
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      // Separate entry/exit thresholds avoid flicker near the top of the page.
      setIsCompact((compact) => window.scrollY > (compact ? 24 : 80));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(frame);
      pendingScroll.current = null;
    };
  }, [isLanding]);

  const navLinks = [
    { label: 'Funciones', href: '/#modulos' },
    { label: 'IA', href: '/#ia' },
    { label: 'Planes', href: '/#planes' },
    { label: 'Carta demo', href: '/sede/aurea-miraflores/carta' },
  ];

  const scrollAfterMenuClose = (action: () => void) => {
    pendingScroll.current = null;
    if (isOpen) {
      // Removing a focused menu link can interrupt a running browser scroll.
      pendingScroll.current = action;
      setIsOpen(false);
    } else {
      action();
    }
  };

  const handleMenuExit = () => {
    const action = pendingScroll.current;
    pendingScroll.current = null;
    action?.();
  };

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isLanding) {
      setIsOpen(false);
      return;
    }
    event.preventDefault();
    scrollAfterMenuClose(() => {
      if (location.hash) navigate('/', { preventScrollReset: true });
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  };

  const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isLanding || !href.startsWith('/#')) {
      pendingScroll.current = null;
      setIsOpen(false);
      return;
    }
    const section = document.getElementById(href.slice(2));
    if (!section) return;
    event.preventDefault();
    scrollAfterMenuClose(() => {
      navigate(href, { preventScrollReset: true });
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };

  return (
    <header data-compact={isLanding && isCompact} className="sticky top-0 z-50 bg-[#FFF9F0]/90 backdrop-blur-md border-b border-aurea-copper/25 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Use the existing app artwork, rather than reconstructing its identity. */}
        <Link to="/" aria-label="AUREA, ir al inicio" onClick={handleHomeClick} className="public-brand flex shrink-0 items-center gap-2">
          <img src="/favicon.ico" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span aria-hidden="true" className="public-brand-name font-sans text-xl font-semibold tracking-widest text-aurea-navy">AUREA</span>
        </Link>

        {/* Navegación Desktop */}
        <nav className="public-nav-links hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <EnlaceNav
              key={link.label}
              href={link.href}
              aria-label={link.label}
              onClick={(event) => handleSectionClick(event, link.href)}
              className={`font-sans text-sm font-medium transition-colors hover:text-aurea-copper ${
                location.pathname === link.href ? 'text-aurea-navy font-semibold' : 'text-aurea-navy/80'
              }`}
            >
              {link.label}
            </EnlaceNav>
          ))}
        </nav>

        {/* Acciones Rápidas Desktop */}
        <div className="public-nav-actions hidden md:flex items-center gap-3">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-aurea-navy hover:text-aurea-navy/80 hover:bg-aurea-champagne/30 transition-colors"
          >
            <LogIn className="w-4 h-4 text-aurea-copper" />
            Iniciar Sesión
          </Link>

          <Link
            to={ROUTES.REGISTRO}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-aurea-ivory bg-aurea-navy hover:bg-opacity-90 shadow-md transition-all group"
          >
            <span>Crear Restaurante</span>
            <ArrowRight className="w-4 h-4 text-aurea-copper group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Botón Hamburguesa Móvil */}
        <div className="public-nav-mobile flex md:hidden items-center gap-2">
          <Link
            to={ROUTES.LOGIN}
            className="p-2 text-xs font-semibold text-aurea-navy bg-aurea-champagne/40 rounded-lg border border-aurea-copper/30"
          >
            Entrar
          </Link>

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Abrir menú"
            aria-expanded={isOpen}
            aria-controls="public-mobile-menu"
            className="p-2.5 rounded-lg text-aurea-navy hover:bg-aurea-champagne/40 transition-colors focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6 text-aurea-copper" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Lateral / Drawer Móvil */}
      <AnimatePresence onExitComplete={handleMenuExit}>
        {isOpen && (
          <motion.div
            id="public-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="md:hidden border-b border-aurea-copper/20 bg-[#FFF9F0]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <EnlaceNav
                  key={link.label}
                  href={link.href}
                  onClick={(event) => handleSectionClick(event, link.href)}
                  className="px-3 py-2.5 rounded-lg text-base font-medium text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
                >
                  {link.label}
                </EnlaceNav>
              ))}
            </nav>

            <div className="pt-3 border-t border-aurea-copper/20 flex flex-col gap-2.5">
              <Link
                to={ROUTES.REGISTRO}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-aurea-ivory bg-aurea-navy shadow-md"
              >
                <Sparkles className="w-4 h-4 text-aurea-copper" />
                Registrar Restaurante (Prueba Gratis)
              </Link>

              <Link
                to={ROUTES.LOGIN}
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
