import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ShieldCheck, Cloud, Server, MessageCircle, ExternalLink, Mail } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-aurea-ivory text-aurea-navy selection:bg-aurea-champagne selection:text-aurea-navy">
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
                <div className="w-8 h-8 rounded-lg bg-aurea-copper/20 flex items-center justify-center border border-aurea-copper/50">
                  <Cloud className="w-4 h-4 text-aurea-champagne" />
                </div>
                <span className="font-serif text-2xl tracking-wide text-white">
                  RestaurantCloud <span className="text-aurea-copper text-lg font-sans font-bold">AI</span>
                </span>
              </div>
              <p className="text-sm text-aurea-ivory/80 leading-relaxed font-sans">
                La plataforma SaaS multi-tenant que unifica la operación de salones, cocina KDS, facturación y proyecciones de demanda predictivas con IA.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PostgreSQL RLS Multi-Tenant Seguro</span>
              </div>
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
                  <a href="/carta" className="hover:text-aurea-copper transition-colors text-aurea-copper flex items-center gap-1">
                    Ver Menú Digital QR (Demo) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 3: Planes y Onboarding */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-aurea-champagne">Suscripción SaaS</h4>
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
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ventas WhatsApp Corporativo</span>
                </a>

                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Mail className="w-4 h-4 text-aurea-copper shrink-0" />
                  <span>soporte@restaurantcloud.pe</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Server className="w-4 h-4 text-aurea-copper shrink-0" />
                  <span>Latencia Perú & Conexión Local &lt; 25ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 font-sans gap-3">
            <p>© {new Date().getFullYear()} RestaurantCloud AI — Plataforma SaaS Multi-Tenant. Todos los derechos reservados.</p>
            <p>Diseñado con el Design System ÁUREA • Compatible con SUNAT y Stripe Billing</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
