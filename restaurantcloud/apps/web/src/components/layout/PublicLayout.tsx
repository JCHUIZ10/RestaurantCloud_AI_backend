import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { ExternalLink, Mail } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const isLanding = useLocation().pathname === '/';
  return (
    <div className={`${isLanding ? 'aurea-landing ' : ''}min-h-screen flex flex-col bg-aurea-ivory text-aurea-navy selection:bg-aurea-champagne selection:text-aurea-navy`}>
      {/* Barra de Navegación Global */}
      <Navbar />

      {/* Contenido Dinámico de la Ruta */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer Corporativo SaaS B2B */}
      <footer className="bg-aurea-navy text-aurea-ivory pt-16 pb-12 border-t-4 border-aurea-copper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            {/* Columna 1: Marca y Propuesta SaaS */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src="/favicon.ico" alt="" width="32" height="32" />
                <span className="font-sans text-xl font-semibold tracking-widest">AUREA</span>
              </div>
              <p className="text-sm text-aurea-ivory/80 leading-relaxed font-sans">
                Comandas, cocina y cobros para el día a día de tu restaurante.
              </p>
            </div>

            {/* Columna 2: Módulos del Software */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-aurea-champagne">Módulos del Sistema</h4>
              <ul className="space-y-2 text-sm text-aurea-ivory/80 font-sans">
                <li>
                  <a href="/#modulos" className="hover:text-aurea-copper transition-colors">
                    Mozo POS Móvil (Celular & Tablet)
                  </a>
                </li>
                <li>
                  <a href="/#modulos" className="hover:text-aurea-copper transition-colors">
                    Cocina KDS en Tiempo Real
                  </a>
                </li>
                <li>
                  <a href="/#ia" className="hover:text-aurea-copper transition-colors">
                    Forecasting de Demanda con IA
                  </a>
                </li>
                <li>
                  <a href="/#modulos" className="hover:text-aurea-copper transition-colors">
                    Caja, Arqueos Z y Facturación
                  </a>
                </li>
                <li>
                  <Link to="/sede/aurea-miraflores/carta" className="hover:text-aurea-copper transition-colors text-aurea-copper flex items-center gap-1">
                    Ver Menú Digital QR (Demo) <ExternalLink className="w-3 h-3" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Planes y Onboarding */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-aurea-champagne">Planes y cuenta</h4>
              <ul className="space-y-2 text-sm text-aurea-ivory/80 font-sans">
                <li>
                  <a href="/#planes" className="hover:text-aurea-copper transition-colors">
                    Plan Starter (1 Sede / 10 Mesas)
                  </a>
                </li>
                <li>
                  <a href="/#planes" className="hover:text-aurea-copper transition-colors">
                    Plan Pro (3 Sedes / IA Forecasting)
                  </a>
                </li>
                <li>
                  <a href="/#planes" className="hover:text-aurea-copper transition-colors">
                    Plan Enterprise (Personalizado)
                  </a>
                </li>
                <li>
                  <a href="/#onboarding" className="hover:text-aurea-copper transition-colors">
                    Registro con RUC & OTP
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 4: Soporte y Ventas */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-aurea-champagne">Atención a Restaurantes</h4>
              <div className="space-y-3 text-sm text-aurea-ivory/80 font-sans">
                <a
                  href="https://wa.me/51987654321?text=Hola,%20deseo%20información%20sobre%20RestaurantCloud%20AI%20para%20mi%20restaurante"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors w-full"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>Consultar por WhatsApp</span>
                </a>

                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Mail className="w-4 h-4 text-aurea-copper shrink-0" />
                  <span>soporte@restaurantcloud.pe</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 font-sans gap-3">
            <p>© {new Date().getFullYear()} AUREA. Todos los derechos reservados.</p>
            <p>Gestión de restaurantes</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
