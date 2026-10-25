import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SaasDashboard3D } from '@/components/3d/SaasDashboard3D';
import { TiltCard } from '@/components/ui/TiltCard';
import { Button } from '@/components/ui/Button';
import { formatPEN } from '@/shared/utils';
import { registroEmpresaService } from '@/modules/propietario/services/registroEmpresaService';
import { PlanSaaSDTO } from '@/types/registroEmpresa';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Smartphone,
  Receipt,
  Cpu,
  ShieldCheck,
  Zap,
  MessageCircle,
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
    beneficio: 'Acelera la rotación de mesas en un 35%',
    icono: Smartphone,
  },
  {
    id: 'kds',
    titulo: 'Sistema KDS Cocina',
    subtitulo: 'Cero Comandas en Papel',
    descripcion: 'Pantalla de preparación en tiempo real sincronizada mediante polling continuo. Tiempos por plato, alertas sonoras y control de agotados.',
    beneficio: 'Elimina el 100% de errores de comanda',
    icono: ChefHat,
  },
  {
    id: 'ia',
    titulo: 'Forecasting con IA',
    subtitulo: 'Predicción de Demanda & Stock',
    descripcion: 'Modelos predictivos que anticipan la afluencia de comensales según histórico, día y clima, recomendando compras exactas de insumos.',
    beneficio: 'Reduce mermas de insumos hasta un 28%',
    icono: Cpu,
  },
  {
    id: 'caja',
    titulo: 'Caja & Facturación',
    subtitulo: 'Arqueos Z y Cobros Rápidos',
    descripcion: 'Apertura y cierre de turnos, emisión de comprobantes, cobros divididos multimoneda y conciliación transparente.',
    beneficio: 'Cierre de caja en menos de 3 minutos',
    icono: Receipt,
  },
];

const CARACTERISTICAS_POR_PLAN: Record<number, string[]> = {
  1: [
    'Mozo POS en smartphones',
    'Cocina KDS en tiempo real',
    'Carta digital interactiva QR',
    'Cierre de caja y arqueos Z',
    'Soporte técnico por correo',
  ],
  2: [
    'Todo lo del Plan Starter',
    'Gestión de Reservas de Salón',
    'Módulo IA: Forecasting de Demanda',
    'Recomendaciones inteligentes de stock',
    'Soporte prioritario por WhatsApp',
  ],
  3: [
    'Todo lo del Plan Pro',
    'Asistente Conversacional con IA',
    'Predicción predictiva multi-sede',
    'Integraciones API a medida y ERP',
    'Acuerdo de nivel de servicio (SLA 99.9%)',
  ],
};

export const HomePage: React.FC = () => {
  const [esAnual, setEsAnual] = useState(false);
  const [planes, setPlanes] = useState<PlanSaaSDTO[]>([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);

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
        // En caso de error en landing, evitamos bloquear el resto de la página
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
    <div className="w-full overflow-hidden">
      {/* ========================================================
          SECCIÓN 1: HERO SECTION B2B (Software SaaS con IA)
          ======================================================== */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FFF9F0] via-[#FFF6E9] to-[#FFF9F0]">
        {/* Orbes de luz sutiles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-aurea-champagne/25 rounded-full blur-3xl" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-aurea-copper/10 rounded-full blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Columna Izquierda: Propuesta de Valor para el Restaurador */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-6 text-center lg:text-left space-y-6"
          >
            {/* Badge de Plataforma */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aurea-champagne/50 border border-aurea-copper/40 text-xs sm:text-sm font-semibold text-aurea-navy shadow-sm">
              <Sparkles className="w-4 h-4 text-aurea-copper" />
              <span>Plataforma SaaS con IA para Restaurantes</span>
            </div>

            {/* Titular Principal H1 en DM Serif Display */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-aurea-navy tracking-tight leading-[1.08]">
              El sistema operativo integral con{' '}
              <span className="italic text-aurea-copper underline decoration-aurea-champagne decoration-wavy decoration-2">
                IA predictiva
              </span>{' '}
              para tu restaurante.
            </h1>

            {/* Descripción clara de software B2B en DM Sans */}
            <p className="font-sans text-base sm:text-lg text-aurea-navy/85 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Sincroniza en tiempo real tus <strong>mesas, mozos, cocina KDS y caja</strong>. Anticipa la demanda de tus platos y optimiza tus compras antes de que abra el turno.
            </p>

            {/* Llamados a la Acción Principales */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
              <a href="#planes" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto group shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-aurea-navy text-aurea-ivory flex items-center justify-center gap-2.5 font-semibold"
                >
                  <span>Ver Planes & Comenzar</span>
                  <ArrowRight className="w-4 h-4 text-aurea-copper group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-aurea-champagne text-aurea-navy hover:bg-aurea-champagne/80 border border-aurea-copper/30 font-semibold"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>Hablar con Asesor</span>
                </Button>
              </a>
            </div>

            {/* Microcredenciales de Seguridad y Arquitectura */}
            <div className="pt-6 border-t border-aurea-copper/20 grid grid-cols-3 gap-4 text-left font-sans">
              <div>
                <span className="text-sm sm:text-base font-bold text-aurea-navy block">Multi-Tenant</span>
                <span className="text-xs text-aurea-navy/70">PostgreSQL con RLS</span>
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold text-aurea-navy block">Tiempo Real</span>
                <span className="text-xs text-aurea-navy/70">Sin lag</span>
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold text-aurea-navy block">Multi-Dispositivo</span>
                <span className="text-xs text-aurea-navy/70">Celulares, tablets & PC</span>
              </div>
            </div>
          </motion.div>

          {/* Columna Derecha: Dashboard 3D Interactivo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="lg:col-span-6 flex flex-col items-center justify-center"
          >
            <SaasDashboard3D />
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 2: ECOSISTEMA DE MÓDULOS (Bento Grid con 3D Tilt)
          ======================================================== */}
      <section id="modulos" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF9F0] border-t border-aurea-copper/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
              Arquitectura Integral
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-aurea-navy">
              Todo lo que tu restaurante necesita en una sola plataforma
            </h2>
            <p className="font-sans text-sm sm:text-base text-aurea-navy/75 leading-relaxed">
              Diseñado desde cero para erradicar desórdenes entre salón y cocina, agilizar la rotación de clientes y brindarte control absoluto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULOS_SISTEMA.map((mod) => {
              const Icono = mod.icono;
              return (
                <TiltCard key={mod.id} maxAngle={6}>
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
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 3: EL DIFERENCIADOR — INTELIGENCIA ARTIFICIAL
          ======================================================== */}
      <section id="ia" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-aurea-navy text-aurea-ivory overflow-hidden">
        {/* Iluminación ambiental */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-aurea-copper/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-aurea-champagne/10 rounded-full blur-[90px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-aurea-copper/50 text-xs font-medium text-aurea-champagne">
              <Zap className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Motor Exclusivo de Forecasting</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-aurea-champagne">
              La IA que anticipa tus ventas antes de abrir las puertas.
            </h2>

            <p className="font-sans text-base sm:text-lg text-aurea-ivory/80 leading-relaxed font-light">
              Los restaurantes pierden hasta el 15% de sus ingresos por insumos descompuestos o por quedarse sin stock en horas punta. <strong>RestaurantCloud AI</strong> analiza patrones históricos, reservas y calendario para sugerir órdenes de compra precisas.
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

          <div className="lg:col-span-6">
            <div className="rounded-2xl p-6 sm:p-8 bg-white/5 border border-aurea-copper/40 backdrop-blur-md shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs text-aurea-champagne">Simulador de Demanda Semanal</span>
                </div>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80">Viernes a Domingo</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/80">Lomo Saltado Criollo (Plato Estrella)</span>
                    <span className="font-mono text-aurea-copper">+42% demanda</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-aurea-copper w-[84%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/80">Risotto de Hongos & Trufa</span>
                    <span className="font-mono text-aurea-copper">+28% demanda</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-aurea-champagne w-[62%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/80">Coctelería & Bebidas de Autor</span>
                    <span className="font-mono text-aurea-copper">+65% demanda</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[92%]" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-white/90 font-sans leading-relaxed">
                💡 <em>«Generar orden sugerida al proveedor de carnes por 18 kg de lomo fino antes del jueves a las 3:00 pm para asegurar el mejor precio por kilo.»</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 4: CATÁLOGO DE PLANES SAAS Y PRECIOS
          ======================================================== */}
      <section id="planes" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FFF9F0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
              Transparencia Total
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-aurea-navy">
              Planes que escalan con el éxito de tu restaurante
            </h2>
            <p className="font-sans text-sm sm:text-base text-aurea-navy/75 leading-relaxed">
              Sin costos ocultos ni permanencias forzadas. Comienza en Starter y escala a Pro con IA cuando lo requieras.
            </p>

            {/* Toggle Mensual / Anual */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span
                className={`text-sm font-semibold transition-colors ${
                  !esAnual ? 'text-aurea-navy' : 'text-aurea-navy/50'
                }`}
              >
                Facturación Mensual
              </span>
              <button
                type="button"
                onClick={() => setEsAnual(!esAnual)}
                className="w-14 h-7 rounded-full bg-aurea-navy relative p-1 transition-colors focus:outline-none shadow-inner"
                aria-label="Alternar ciclo de facturación"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-aurea-champagne shadow-md transition-transform duration-200 ${
                    esAnual ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`text-sm font-semibold flex items-center gap-2 transition-colors ${
                  esAnual ? 'text-aurea-navy' : 'text-aurea-navy/50'
                }`}
              >
                Facturación Anual
                {/* Solo se muestra si el cálculo arroja ahorro positivo en los planes */}
                {!cargandoPlanes &&
                  Math.max(
                    ...planes.map((p) => {
                      const ahorro = p.precio_mensual * 12 - p.precio_anual;
                      return ahorro > 0 && p.precio_mensual > 0
                        ? Math.floor(ahorro / p.precio_mensual)
                        : 0;
                    }),
                    0
                  ) >= 1 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Ahorra hasta{' '}
                      {Math.max(
                        ...planes.map((p) => {
                          const ahorro = p.precio_mensual * 12 - p.precio_anual;
                          return ahorro > 0 && p.precio_mensual > 0
                            ? Math.floor(ahorro / p.precio_mensual)
                            : 0;
                        }),
                        0
                      )}{' '}
                      meses
                    </span>
                  )}
              </span>
            </div>
          </div>

          {/* Skeleton mientras carga catálogo real de PostgreSQL */}
          {cargandoPlanes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch animate-fadeIn">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl p-8 bg-white border-2 border-aurea-copper/20 shadow-sm animate-pulse space-y-6 flex flex-col justify-between min-h-[500px]"
                >
                  <div className="space-y-4">
                    <div className="h-7 w-36 bg-slate-200 rounded-lg" />
                    <div className="h-3 w-4/5 bg-slate-100 rounded" />
                    <div className="h-10 w-48 bg-aurea-champagne/40 rounded-xl" />
                    <div className="h-32 bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100" />
                    <div className="space-y-2 pt-2">
                      <div className="h-3 w-full bg-slate-100 rounded" />
                      <div className="h-3 w-5/6 bg-slate-100 rounded" />
                      <div className="h-3 w-4/6 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-12 w-full bg-slate-200 rounded-2xl mt-8" />
                </div>
              ))}
            </div>
          )}

          {/* Catálogo real y dinámico de planes */}
          {!cargandoPlanes && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {planes.map((plan) => {
                const precioDisplay = esAnual ? plan.precio_anual / 12 : plan.precio_mensual;
                const costo12Meses = plan.precio_mensual * 12;
                const ahorroSoles = costo12Meses - plan.precio_anual;
                const tieneAhorro = ahorroSoles > 0;
                const mesesAhorro =
                  plan.precio_mensual > 0 ? Math.floor(ahorroSoles / plan.precio_mensual) : 0;
                const caracteristicas = CARACTERISTICAS_POR_PLAN[plan.id] || [
                  'Mozo POS en smartphones',
                  'Cocina KDS en vivo',
                  'Carta digital interactiva QR',
                  'Cierre de caja y arqueos',
                  'Soporte técnico',
                ];

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                      plan.destacado
                        ? 'bg-aurea-navy text-aurea-ivory border-2 border-aurea-copper shadow-2xl scale-105 z-20'
                        : 'bg-white text-aurea-navy border-2 border-aurea-copper/25 shadow-md hover:shadow-xl'
                    }`}
                  >
                    {plan.destacado && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-aurea-copper text-aurea-navy font-bold text-xs uppercase tracking-wider shadow-md">
                        Más Elegido por Restaurantes
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <h3
                          className={`font-serif text-2xl ${
                            plan.destacado ? 'text-aurea-champagne' : 'text-aurea-navy'
                          }`}
                        >
                          {plan.nombre}
                        </h3>
                        <p
                          className={`text-xs mt-1 ${
                            plan.destacado ? 'text-white/70' : 'text-aurea-navy/70'
                          }`}
                        >
                          {plan.descripcion}
                        </p>
                      </div>

                      <div className="flex flex-col pb-4 border-b border-aurea-copper/20">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-bold font-sans">
                            {formatPEN(precioDisplay)}
                          </span>
                          <span
                            className={`text-xs ${
                              plan.destacado ? 'text-white/60' : 'text-aurea-navy/60'
                            }`}
                          >
                            / mes + IGV
                          </span>
                        </div>
                        {esAnual && (
                          <span
                            className={`text-[11px] font-medium block mt-1 ${
                              plan.destacado ? 'text-emerald-300' : 'text-emerald-700'
                            }`}
                          >
                            Cobrado anualmente ({formatPEN(plan.precio_anual)} / año
                            {tieneAhorro
                              ? ` • Ahorras ${
                                  mesesAhorro >= 1
                                    ? `${mesesAhorro} ${mesesAhorro === 1 ? 'mes' : 'meses'}`
                                    : formatPEN(ahorroSoles)
                                }`
                              : ''}
                            )
                          </span>
                        )}
                      </div>

                      {/* Límites de recursos clave */}
                      <div
                        className={`p-4 rounded-xl text-xs space-y-2 font-mono ${
                          plan.destacado ? 'bg-white/10' : 'bg-aurea-ivory'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="opacity-75">Locales:</span>
                          <span className="font-bold">
                            Hasta {plan.max_locales} {plan.max_locales === 1 ? 'Sede' : 'Sedes'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-75">Pisos:</span>
                          <span className="font-bold">
                            Hasta {plan.max_pisos} {plan.max_pisos === 1 ? 'Piso' : 'Pisos'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-75">Mesas:</span>
                          <span className="font-bold">Hasta {plan.max_mesas} Mesas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-75">Personal:</span>
                          <span className="font-bold">Hasta {plan.max_usuarios} Usuarios</span>
                        </div>
                      </div>

                      {/* Lista de características */}
                      <div className="space-y-2.5 pt-2">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider block ${
                            plan.destacado ? 'text-aurea-copper' : 'text-aurea-copper'
                          }`}
                        >
                          Incluye:
                        </span>
                        <ul className="space-y-2 text-xs sm:text-sm">
                          {caracteristicas.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  plan.destacado ? 'text-aurea-copper' : 'text-emerald-600'
                                }`}
                              />
                              <span
                                className={
                                  plan.destacado ? 'text-white/90' : 'text-aurea-navy/80'
                                }
                              >
                                {c}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-8 mt-6 border-t border-aurea-copper/20">
                      <Link
                        to={`${ROUTES.REGISTRO}?plan=${plan.id}&ciclo=${esAnual ? 'anual' : 'mensual'}`}
                        className="block w-full"
                      >
                        <Button
                          variant={plan.destacado ? 'secondary' : 'primary'}
                          size="lg"
                          className={`w-full font-semibold shadow-md ${
                            plan.destacado
                              ? 'bg-aurea-champagne text-aurea-navy hover:bg-white'
                              : 'bg-aurea-navy text-aurea-ivory hover:bg-opacity-90'
                          }`}
                        >
                          Elegir {plan.nombre}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          SECCIÓN 5: ONBOARDING RÁPIDO & SEGURIDAD RLS
          ======================================================== */}
      <section id="onboarding" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0B2340] via-[#102B4C] to-[#0B2340] text-aurea-ivory border-t-2 border-aurea-copper">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Autoservicio Rápido para Empresas Peruanas</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl mx-auto leading-tight">
            Activa tu restaurante en 3 minutos con tu RUC 10 o RUC 20
          </h2>

          <p className="font-sans text-base sm:text-lg text-aurea-ivory/80 max-w-2xl mx-auto leading-relaxed">
            Sin instalaciones complejas de servidores locales. Todo funciona en la nube, protegido con aislamiento de datos a nivel de base de datos (PostgreSQL Row-Level Security).
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
                Comenzar ahora mismo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
