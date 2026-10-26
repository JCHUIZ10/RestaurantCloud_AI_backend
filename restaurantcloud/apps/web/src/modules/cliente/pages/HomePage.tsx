import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProductViews } from '../components/ProductViews';
import '../styles/landing.css';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { registroEmpresaService, PLANES_CANONICOS } from '@/modules/propietario/services/registroEmpresaService';
import { PlanSaaSDTO } from '@/types/registroEmpresa';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Smartphone,
  Receipt,
  Cpu,
  ShieldCheck,
  Zap,
  Check,
} from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';

interface ModuloSaaS {
  id: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  beneficio: string;
  icono: React.ElementType;
}

const MODULOS_SISTEMA: ModuloSaaS[] = [
  {
    id: 'mozo',
    titulo: 'Punto de Venta Mozo',
    subtitulo: 'Toma de Comandas Móvil',
    descripcion: 'Toma pedidos desde cualquier celular o tablet con mapa interactivo de mesas, división de cuentas y validación inmediata de disponibilidad.',
    beneficio: 'Comandas desde el celular',
    icono: Smartphone,
  },
  {
    id: 'kds',
    titulo: 'Sistema KDS Cocina',
    subtitulo: 'Cero Comandas en Papel',
    descripcion: 'Pantalla de preparación en tiempo real sincronizada mediante polling continuo. Tiempos por plato, alertas sonoras y control de agotados.',
    beneficio: 'Pedidos visibles para cocina',
    icono: ChefHat,
  },
  {
    id: 'ia',
    titulo: 'Forecasting con IA',
    subtitulo: 'Predicción de Demanda & Stock',
    descripcion: 'Modelos predictivos que anticipan la afluencia de comensales según histórico, día y clima, recomendando compras exactas de insumos.',
    beneficio: 'Compras según la demanda',
    icono: Cpu,
  },
  {
    id: 'caja',
    titulo: 'Caja & Facturación',
    subtitulo: 'Arqueos Z y Cobros Rápidos',
    descripcion: 'Apertura y cierre de turnos, emisión de comprobantes, cobros divididos multimoneda y conciliación transparente.',
    beneficio: 'Cobros y cierre por turno',
    icono: Receipt,
  },
];

import { TABLA_COMPARATIVA } from '@/shared/data/planesComparativa';

export const HomePage: React.FC = () => {
  const [esAnual, setEsAnual] = useState(false);
  const [planes, setPlanes] = useState<PlanSaaSDTO[]>([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [mobilePlanTab, setMobilePlanTab] = useState<number>(2);

  useEffect(() => {
    let montado = true;
    registroEmpresaService
      .getPlanes()
      .then((data) => {
        if (montado && data && data.length > 0) {
          setPlanes(data);
        }
      })
      .catch(() => {
        if (montado) setPlanes(PLANES_CANONICOS);
      })
      .finally(() => {
        if (montado) setCargandoPlanes(false);
      });
    return () => {
      montado = false;
    };
  }, []);

  const whatsappUrl = 'https://wa.me/51987654321?text=Hola,%20deseo%20asesoría%20sobre%20RestaurantCloud%20AI%20para%20mi%20restaurante';

  return (
    <div className="w-full overflow-x-clip">
      {/* ========================================================
          SECCIÓN 1: HERO SECTION FOTOGRÁFICO
          ======================================================== */}
      <section className="lp-hero" aria-labelledby="landing-title">
        <figure className="lp-cover-photo">
          <img src="/images/restaurant-hero.jpg" alt="Responsable de restaurante gestionando el servicio y los pedidos desde su tablet en el salón" width="1920" height="960" fetchPriority="high" />
        </figure>
        <div className="lp-hero-layout">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="lp-hero-copy">
            <h1 id="landing-title">Del pedido en mesa<br className="lp-desktop-break" /> al cierre de caja.</h1>
            <p>Toma comandas, envíalas a cocina y cobra desde una misma plataforma. Tu equipo, con la misma información durante todo el turno.</p>
            <div className="lp-hero-actions">
              <a href="#planes" className="lp-main-action">Ver planes <ArrowRight aria-hidden="true" className="w-4 h-4" /></a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="lp-whatsapp"><WhatsAppIcon className="w-5 h-5" /> Consultar por WhatsApp</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 2: AUREA EN PANTALLA (SHOWCASE INTERACTIVO)
          ======================================================== */}
      <section className="lp-showcase" aria-label="Vistas de AUREA">
        <ProductViews />
      </section>

      {/* ========================================================
          SECCIÓN 3: ONBOARDING RÁPIDO & REGISTRO CON RUC
          ======================================================== */}
      <section id="onboarding" className="lp-onboarding py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0B2340] via-[#102B4C] to-[#0B2340] text-aurea-ivory border-t-2 border-b-2 border-aurea-copper/30">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Registro con RUC</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl mx-auto leading-tight">
            Crea la cuenta de tu restaurante
          </h2>

          <p className="font-sans text-base sm:text-lg text-aurea-ivory/80 max-w-2xl mx-auto leading-relaxed">
            Registra tu RUC, verifica tu correo y configura las mesas de tu local.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto pt-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="w-8 h-8 rounded-full bg-aurea-copper/20 text-aurea-champagne font-bold flex items-center justify-center text-sm mb-3">1</span>
              <h4 className="font-semibold text-white mb-1">Ingresa tu RUC</h4>
              <p className="text-xs text-white/70">Validación de 11 dígitos numéricos de tu razón social.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="w-8 h-8 rounded-full bg-aurea-copper/20 text-aurea-champagne font-bold flex items-center justify-center text-sm mb-3">2</span>
              <h4 className="font-semibold text-white mb-1">Verificación OTP</h4>
              <p className="text-xs text-white/70">Código de 6 dígitos directo a tu correo para máxima seguridad.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <span className="w-8 h-8 rounded-full bg-aurea-copper/20 text-aurea-champagne font-bold flex items-center justify-center text-sm mb-3">3</span>
              <h4 className="font-semibold text-white mb-1">Listo para Salón</h4>
              <p className="text-xs text-white/70">Genera tus mesas, cartas y abre tu primer turno inmediatamente.</p>
            </div>
          </div>

          <div className="pt-6">
            <Link to={ROUTES.REGISTRO}>
              <Button variant="secondary" size="lg" className="bg-aurea-champagne text-aurea-navy hover:bg-white font-bold px-8 shadow-xl">
                Crear mi restaurante
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 4: ECOSISTEMA DE MÓDULOS (Del salón a la caja)
          ======================================================== */}
      <section id="modulos" className="lp-modules py-16 px-4 sm:px-6 lg:px-8 bg-[#FFF9F0] border-b border-aurea-copper/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
              Del salón a la caja
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-aurea-navy">
              Un pedido. Todo el equipo al tanto.
            </h2>
            <p className="font-sans text-sm sm:text-base text-aurea-navy/75 leading-relaxed">
              El mozo registra, cocina prepara y caja cobra. Cada área tiene su propia vista de trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULOS_SISTEMA.map((mod) => {
              const Icono = mod.icono;
              return (
                <article key={mod.id} className="lp-module-card">
                  <div className="h-full rounded-2xl bg-white p-6 border-2 border-aurea-copper/25 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-aurea-ivory flex items-center justify-center border border-aurea-copper/40 text-aurea-navy group-hover:scale-110 group-hover:bg-aurea-champagne/40 transition-all">
                        <Icono className="w-6 h-6 text-aurea-copper" />
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-aurea-copper tracking-wider uppercase block">
                          {mod.subtitulo}
                        </span>
                        <h3 className="font-serif text-xl text-aurea-navy mt-1 group-hover:text-aurea-copper transition-colors">
                          {mod.titulo}
                        </h3>
                      </div>

                      <p className="font-sans text-xs sm:text-sm text-aurea-navy/75 leading-relaxed">
                        {mod.descripcion}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-aurea-copper/15 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{mod.beneficio}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 5: EL DIFERENCIADOR — INTELIGENCIA ARTIFICIAL
          ======================================================== */}
      <section id="ia" className="lp-ai relative py-20 px-4 sm:px-6 lg:px-8 bg-aurea-navy text-aurea-ivory overflow-hidden border-t-2 border-b-2 border-aurea-copper/30">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-aurea-copper/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-aurea-champagne/10 rounded-full blur-[90px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-aurea-copper/50 text-xs font-medium text-aurea-champagne">
              <Zap className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Planificación de compras</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-aurea-champagne">
              Prepara el siguiente turno con tu historial de ventas.
            </h2>

            <p className="font-sans text-base sm:text-lg text-aurea-ivory/80 leading-relaxed font-light">
              Revisa los patrones de consumo para planificar insumos y cantidades. El módulo de forecasting reúne la información que necesitas antes de comprar.
            </p>

            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" />
                <p><strong>Cálculo predictivo de comensales:</strong> Proyección de ocupación para almuerzo y cena.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" />
                <p><strong>Desglose de mermas por plato:</strong> Vinculación directa entre recetas e inventario real.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" />
                <p><strong>Asistente inteligente:</strong> Alertas antes de que un producto de alta rotación se agote.</p>
              </div>
            </div>
          </div>

          <figure className="lp-planning-photo">
            <img src="/images/restaurant-owner.png" alt="Restaurador consultando la operación de su local desde una tablet" width="820" height="500" loading="lazy" />
          </figure>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 6: TABLA DE PLANES EDITORIAL (Referencia getapron.com)
          ======================================================== */}
      <section id="planes" className="lp-plans py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9F0] border-b-4 border-aurea-copper">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado Editorial Apron */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
              Planes y Precios
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-aurea-navy tracking-tight">
              Elige el plan ideal para tu restaurante.
            </h2>
            <p className="font-sans text-sm sm:text-base text-aurea-navy/75 leading-relaxed">
              Sin comisiones por comensal, sin contratos forzosos. Cancela o cambia de plan en cualquier momento.
            </p>

            {/* Selector Segmentado de Facturación (Apron Pill Switcher) */}
            <div className="pt-4 flex items-center justify-center">
              <div className="relative inline-flex items-center p-1.5 rounded-full bg-white/90 border border-aurea-copper/30 shadow-xs backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setEsAnual(false)}
                  className={`relative px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                    !esAnual ? 'text-white' : 'text-aurea-navy/70 hover:text-aurea-navy'
                  }`}
                  aria-pressed={!esAnual}
                >
                  {!esAnual && (
                    <motion.div
                      layoutId="billingCyclePill"
                      className="absolute inset-0 bg-aurea-navy rounded-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">Facturación Mensual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEsAnual(true)}
                  className={`relative px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
                    esAnual ? 'text-white' : 'text-aurea-navy/70 hover:text-aurea-navy'
                  }`}
                  aria-pressed={esAnual}
                >
                  {esAnual && (
                    <motion.div
                      layoutId="billingCyclePill"
                      className="absolute inset-0 bg-aurea-navy rounded-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">Facturación Anual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Skeleton durante la carga inicial */}
          {cargandoPlanes && (
            <div className="bg-white rounded-2xl p-8 border border-aurea-copper/20 shadow-sm animate-pulse space-y-6">
              <div className="h-10 w-64 bg-slate-200 rounded-lg" />
              <div className="grid grid-cols-4 gap-4 h-48 bg-slate-100 rounded-xl" />
            </div>
          )}

          {/* Renderizado de Planes Estilo Apron (Desktop Table + Mobile Tabbed Breakdown) */}
          {!cargandoPlanes && (() => {
            const planStarter = planes.find((p) => p.id === 1) || PLANES_CANONICOS[0];
            const planPro = planes.find((p) => p.id === 2 || p.destacado) || PLANES_CANONICOS[1];
            const planEnterprise = planes.find((p) => p.id === 3) || PLANES_CANONICOS[2];

            const precioStarter = esAnual ? planStarter.precio_anual / 12 : planStarter.precio_mensual;
            const precioPro = esAnual ? planPro.precio_anual / 12 : planPro.precio_mensual;
            const precioEnterprise = esAnual ? planEnterprise.precio_anual / 12 : planEnterprise.precio_mensual;

            const mobileActivePlan =
              mobilePlanTab === 1 ? planStarter : mobilePlanTab === 2 ? planPro : planEnterprise;
            const mobileActivePrice = esAnual
              ? mobileActivePlan.precio_anual / 12
              : mobileActivePlan.precio_mensual;

            const renderValue = (val: string | boolean, isProColumn?: boolean) => {
              if (val === true) {
                return (
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isProColumn ? 'text-aurea-navy' : 'text-aurea-navy/80'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isProColumn
                          ? 'bg-aurea-copper/20 text-aurea-navy'
                          : 'bg-stone-200/80 text-stone-700'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Incluido</span>
                  </div>
                );
              }
              if (val === false) {
                return (
                  <span className="text-aurea-navy/20 font-bold text-lg select-none" aria-label="No incluido">
                    —
                  </span>
                );
              }
              return (
                <span
                  className={`text-xs sm:text-sm leading-snug ${
                    isProColumn ? 'font-bold text-aurea-navy' : 'font-medium text-aurea-navy/85'
                  }`}
                >
                  {val}
                </span>
              );
            };

            return (
              <div className="space-y-8">
                {/* ========================================================
                    VISTA 1: TABLA EDITORIAL DESKTOP (Idéntica a getapron.com)
                    ======================================================== */}
                <div className="lp-apron-table-container hidden lg:block">
                  {/* Fila Cabecera Sticky: Planes, Precios y Botones (Estilo getapron.com) */}
                  <div className="lp-apron-header-row lp-apron-sticky-header">
                    {/* Celda 0: Título y descripción de la comparativa */}
                    <div className="lp-apron-header-cell border-r border-aurea-copper/20">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-aurea-copper block mb-2">
                          Planes para restaurantes
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-aurea-navy leading-tight">
                          Compara las funciones completas
                        </h3>
                        <p className="text-xs text-aurea-navy/70 mt-2 leading-relaxed">
                          Todos los planes incluyen Mozo POS, Cocina KDS y Carta QR.
                        </p>
                      </div>
                      <div className="pt-4">
                        <p className="text-xs text-aurea-navy/60 font-medium">
                          Cancela en cualquier momento.
                        </p>
                      </div>
                    </div>

                    {/* Celda 1: Plan Starter */}
                    <div className="lp-apron-header-cell border-r border-aurea-copper/20">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-aurea-copper/10 text-aurea-copper border border-aurea-copper/20 mb-2">
                          Para Iniciar
                        </span>
                        <h4 className="font-serif text-xl font-bold text-aurea-navy">{planStarter.nombre}</h4>
                        <p className="text-[11px] text-aurea-navy/70 mt-1 min-h-[30px] leading-snug">
                          {planStarter.descripcion}
                        </p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-lg font-bold text-aurea-copper font-sans">S/</span>
                          <span className="text-3xl font-extrabold text-aurea-navy font-sans tracking-tight">
                            {Math.floor(precioStarter)}
                          </span>
                          <span className="text-xs text-aurea-navy/60 font-medium">/ mes</span>
                        </div>
                        {esAnual && (
                          <div className="text-[10px] text-aurea-navy/60 font-medium mt-1">
                            S/ {planStarter.precio_anual.toFixed(2)} al año
                          </div>
                        )}
                      </div>
                      <div className="pt-6">
                        <Link
                          to={`/registro?plan=${planStarter.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                          className="block w-full"
                        >
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
                          >
                            Elegir {planStarter.nombre}
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Celda 2: Plan Pro (Más Elegido con sombreado elegante) */}
                    <div className="lp-apron-header-cell lp-apron-pro-col lp-apron-pro-header">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-aurea-copper/15 text-[#8B5A2B] border border-aurea-copper/30 mb-2">
                          Más Elegido
                        </span>
                        <h4 className="font-serif text-xl font-bold text-aurea-navy">{planPro.nombre}</h4>
                        <p className="text-[11px] text-aurea-navy/75 mt-1 min-h-[30px] leading-snug">
                          {planPro.descripcion}
                        </p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-lg font-bold text-aurea-copper font-sans">S/</span>
                          <span className="text-3xl font-extrabold text-aurea-navy font-sans tracking-tight">
                            {Math.floor(precioPro)}
                          </span>
                          <span className="text-xs text-aurea-navy/60 font-medium">/ mes</span>
                        </div>
                        {esAnual && (
                          <div className="text-[10px] text-aurea-navy/60 font-medium mt-1">
                            S/ {planPro.precio_anual.toFixed(2)} al año
                          </div>
                        )}
                      </div>
                      <div className="pt-6">
                        <Link
                          to={`/registro?plan=${planPro.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                          className="block w-full"
                        >
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-aurea-copper text-white hover:bg-[#c48f5e] transition-all cursor-pointer shadow-sm"
                          >
                            Elegir {planPro.nombre}
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Celda 3: Plan Enterprise */}
                    <div className="lp-apron-header-cell">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-aurea-copper/10 text-aurea-copper border border-aurea-copper/20 mb-2">
                          Multi-Sede
                        </span>
                        <h4 className="font-serif text-xl font-bold text-aurea-navy">{planEnterprise.nombre}</h4>
                        <p className="text-[11px] text-aurea-navy/70 mt-1 min-h-[30px] leading-snug">
                          {planEnterprise.descripcion}
                        </p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-lg font-bold text-aurea-copper font-sans">S/</span>
                          <span className="text-3xl font-extrabold text-aurea-navy font-sans tracking-tight">
                            {Math.floor(precioEnterprise)}
                          </span>
                          <span className="text-xs text-aurea-navy/60 font-medium">/ mes</span>
                        </div>
                        {esAnual && (
                          <div className="text-[10px] text-aurea-navy/60 font-medium mt-1">
                            S/ {planEnterprise.precio_anual.toFixed(2)} al año
                          </div>
                        )}
                      </div>
                      <div className="pt-6">
                        <Link
                          to={`/registro?plan=${planEnterprise.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                          className="block w-full"
                        >
                          <button
                            type="button"
                            className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
                          >
                            Elegir {planEnterprise.nombre}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Filas Comparativas Agrupadas por Categoría */}
                  {TABLA_COMPARATIVA.map((cat, catIdx) => (
                    <div key={catIdx}>
                      {/* Cabecera de Categoría */}
                      <div className="lp-apron-category-header">
                        {cat.titulo}
                      </div>

                      {/* Filas de Características */}
                      {cat.filas.map((fila, rowIdx) => (
                        <div key={rowIdx} className="lp-apron-row">
                          {/* Columna Etiqueta */}
                          <div className="lp-apron-cell lp-apron-cell-feature border-r border-aurea-copper/15">
                            <div>
                              <span className="text-sm font-bold text-aurea-navy">{fila.nombre}</span>
                              {fila.subtexto && (
                                <span className="block text-[11px] text-aurea-navy/60 mt-0.5 leading-snug">
                                  {fila.subtexto}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Valor Starter */}
                          <div className="lp-apron-cell lp-apron-cell-value justify-center text-center border-r border-aurea-copper/15">
                            {renderValue(fila.starter)}
                          </div>

                          {/* Valor Pro (Destacado con wash Apron) */}
                          <div className="lp-apron-cell lp-apron-cell-value justify-center text-center lp-apron-pro-col">
                            {renderValue(fila.pro, true)}
                          </div>

                          {/* Valor Enterprise */}
                          <div className="lp-apron-cell lp-apron-cell-value justify-center text-center">
                            {renderValue(fila.enterprise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Fila Inferior Repetidora de Acciones (Apron Bottom Action Row) */}
                  <div className="lp-apron-bottom-row items-center">
                    <div className="lp-apron-cell font-serif text-lg font-bold text-aurea-navy border-r border-aurea-copper/20">
                      Empieza con tu restaurante
                    </div>
                    <div className="px-6 border-r border-aurea-copper/20 flex items-center">
                      <Link
                        to={`/registro?plan=${planStarter.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                        className="w-full"
                      >
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
                        >
                          Elegir {planStarter.nombre}
                        </button>
                      </Link>
                    </div>
                    <div className="px-6 lp-apron-pro-col flex items-center">
                      <Link
                        to={`/registro?plan=${planPro.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                        className="w-full"
                      >
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-aurea-copper text-white hover:bg-[#c48f5e] transition-all cursor-pointer shadow-sm"
                        >
                          Elegir {planPro.nombre}
                        </button>
                      </Link>
                    </div>
                    <div className="px-6 flex items-center">
                      <Link
                        to={`/registro?plan=${planEnterprise.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                        className="w-full"
                      >
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
                        >
                          Elegir {planEnterprise.nombre}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ========================================================
                    VISTA 2: EXPERIENCIA MÓVIL (Pills & Categorías Limpias)
                    ======================================================== */}
                <div className="lg:hidden space-y-6">
                  {/* Selector Segmentado Sticky en Móvil */}
                  <div className="lp-apron-mobile-sticky-tabs">
                    <div className="flex rounded-full bg-white p-1.5 border border-aurea-copper/30 shadow-xs max-w-md mx-auto">
                    {[
                      { id: 1, name: planStarter.nombre },
                      { id: 2, name: `${planPro.nombre} ★` },
                      { id: 3, name: planEnterprise.nombre },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMobilePlanTab(tab.id)}
                        className={`flex-1 py-2 px-1 rounded-full text-xs font-bold transition-all relative cursor-pointer text-center ${
                          mobilePlanTab === tab.id
                            ? 'text-white'
                            : 'text-aurea-navy/70 hover:text-aurea-navy'
                        }`}
                      >
                        {mobilePlanTab === tab.id && (
                          <motion.div
                            layoutId="mobileActivePlanPill"
                            className="absolute inset-0 bg-aurea-navy rounded-full shadow-sm"
                            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10 block truncate">
                          {tab.name}
                        </span>
                      </button>
                    ))}
                    </div>
                  </div>

                  {/* Tarjeta del Plan Activo en Móvil */}
                  <div
                    className={`rounded-2xl p-6 border transition-all ${
                      mobileActivePlan.destacado
                        ? 'bg-white text-aurea-navy border-aurea-copper/50 shadow-md ring-1 ring-aurea-copper/20'
                        : 'bg-white text-aurea-navy border-stone-200 shadow-xs'
                    }`}
                  >
                    {mobileActivePlan.destacado && (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-aurea-copper/15 text-[#8B5A2B] border border-aurea-copper/30 mb-3">
                        Más Elegido por Restaurantes
                      </span>
                    )}

                    <h4 className="font-serif text-2xl font-bold">{mobileActivePlan.nombre}</h4>
                    <p className="text-xs mt-1 leading-relaxed text-aurea-navy/70">
                      {mobileActivePlan.descripcion}
                    </p>

                    <div className="mt-4 pb-4 border-b border-aurea-copper/20 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-aurea-copper font-sans">S/</span>
                      <span className="text-4xl font-extrabold font-sans tracking-tight">
                        {Math.floor(mobileActivePrice)}
                      </span>
                      <span className="text-xs font-medium ml-1 text-aurea-navy/60">
                        / mes + IGV
                      </span>
                    </div>

                    {esAnual && (
                      <div className="text-xs mt-2 font-medium text-aurea-navy/60">
                        S/ {mobileActivePlan.precio_anual.toFixed(2)} facturado al año
                      </div>
                    )}

                    <div className="mt-5">
                      <Link
                        to={`/registro?plan=${mobileActivePlan.id}&ciclo=${esAnual ? 'anual' : 'mensual'}&paso=2`}
                        className="block w-full"
                      >
                        <button
                          type="button"
                          className={`w-full py-3 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            mobileActivePlan.destacado
                              ? 'bg-aurea-copper text-white hover:bg-[#c48f5e] shadow-sm'
                              : 'bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 shadow-2xs'
                          }`}
                        >
                          <span>Elegir {mobileActivePlan.nombre}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>

                    {/* Desglose de Características en Móvil por Categoría */}
                    <div className="mt-8 space-y-6">
                      {TABLA_COMPARATIVA.map((cat, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-aurea-copper pb-1 border-b border-aurea-copper/20">
                            {cat.titulo}
                          </div>
                          <div className="divide-y divide-aurea-copper/10">
                            {cat.filas.map((fila, fIdx) => {
                              const val =
                                mobilePlanTab === 1
                                  ? fila.starter
                                  : mobilePlanTab === 2
                                  ? fila.pro
                                  : fila.enterprise;
                              return (
                                <div key={fIdx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                                  <span className="text-aurea-navy/80">
                                    {fila.nombre}
                                  </span>
                                  <div className="shrink-0 text-right">
                                    {renderValue(val, mobileActivePlan.destacado)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Barra de Reaseguro y Certeza Comercial (Estilo Apron) */}
          <div className="mt-14 pt-8 border-t border-aurea-copper/20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-aurea-navy/75 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>
                <strong>Sin contratos forzosos:</strong> Cancela o cambia de plan cuando quieras.
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>
                <strong>Puesta en marcha asistida:</strong> Digitalizamos tu carta en menos de 24 horas.
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>
                <strong>SUNAT integrado:</strong> Boletas y facturas electrónicas oficiales.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
