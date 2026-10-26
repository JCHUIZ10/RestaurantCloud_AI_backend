import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanSaaSDTO } from '@/types/registroEmpresa';
import { PLANES_CANONICOS } from '../../services/registroEmpresaService';
import { TABLA_COMPARATIVA } from '@/shared/data/planesComparativa';
import {
  Check,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Paso1PlanSelectorProps {
  planes: PlanSaaSDTO[];
  planSeleccionadoId: number;
  cicloFacturacion: 'mensual' | 'anual';
  onChangeCiclo: (ciclo: 'mensual' | 'anual') => void;
  onSelectPlan: (planId: number) => void;
  onContinuar: () => void;
  cargando?: boolean;
  error?: string | null;
  onReintentar?: () => void;
}

export const Paso1PlanSelector: React.FC<Paso1PlanSelectorProps> = ({
  planes,
  planSeleccionadoId,
  cicloFacturacion,
  onChangeCiclo,
  onSelectPlan,
  onContinuar,
  cargando = false,
  error = null,
  onReintentar,
}) => {
  const esAnual = cicloFacturacion === 'anual';
  const [mobilePlanTab, setMobilePlanTab] = useState<number>(planSeleccionadoId || 2);

  // =========================================================================
  // 1. ESTADO UX: SKELETON LOADING
  // =========================================================================
  if (cargando) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="h-4 w-44 bg-aurea-champagne/40 rounded-full mx-auto animate-pulse" />
          <div className="h-9 w-80 bg-aurea-champagne/50 rounded-2xl mx-auto animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-aurea-champagne/25 rounded-md mx-auto animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl p-8 border border-aurea-copper/20 shadow-sm animate-pulse space-y-6">
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-4 gap-4 h-48 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. ESTADO UX: ERROR DE CONEXIÓN CON BOTÓN REINTENTAR
  // =========================================================================
  if (error) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-rose-200 shadow-xl space-y-5 max-w-lg mx-auto animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-9 h-9" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-serif font-bold text-aurea-navy">
            No se pudo consultar el catálogo de planes
          </h3>
          <p className="text-xs sm:text-sm text-aurea-navy/70 leading-relaxed">
            {error}
          </p>
        </div>
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="inline-flex items-center gap-2 bg-aurea-navy hover:bg-[#12345e] text-white font-semibold px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-aurea-champagne" />
            <span>Reintentar Conexión</span>
          </button>
        )}
      </div>
    );
  }

  // Planes canónicos de respaldo si no llegaron del backend
  const planesData: PlanSaaSDTO[] = planes.length > 0 ? planes : PLANES_CANONICOS;
  const planStarter: PlanSaaSDTO = planesData.find((p: PlanSaaSDTO) => p.id === 1) || planesData[0];
  const planPro: PlanSaaSDTO = planesData.find((p: PlanSaaSDTO) => p.id === 2 || p.destacado) || planesData[1];
  const planEnterprise: PlanSaaSDTO = planesData.find((p: PlanSaaSDTO) => p.id === 3) || planesData[2];

  const precioStarter = esAnual ? planStarter.precio_anual / 12 : planStarter.precio_mensual;
  const precioPro = esAnual ? planPro.precio_anual / 12 : planPro.precio_mensual;
  const precioEnterprise = esAnual ? planEnterprise.precio_anual / 12 : planEnterprise.precio_mensual;

  const mobileActivePlan =
    mobilePlanTab === 1 ? planStarter : mobilePlanTab === 2 ? planPro : planEnterprise;
  const mobileActivePrice = esAnual
    ? mobileActivePlan.precio_anual / 12
    : mobileActivePlan.precio_mensual;

  const handleSelectAndProceed = (planId: number) => {
    onSelectPlan(planId);
    onContinuar();
  };

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
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Encabezado Editorial Apron */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
          Paso 1: Selección de Suscripción
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
              onClick={() => onChangeCiclo('mensual')}
              className={`relative px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                !esAnual ? 'text-white' : 'text-aurea-navy/70 hover:text-aurea-navy'
              }`}
              aria-pressed={!esAnual}
            >
              {!esAnual && (
                <motion.div
                  layoutId="billingCyclePillPaso1"
                  className="absolute inset-0 bg-aurea-navy rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">Facturación Mensual</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeCiclo('anual')}
              className={`relative px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
                esAnual ? 'text-white' : 'text-aurea-navy/70 hover:text-aurea-navy'
              }`}
              aria-pressed={esAnual}
            >
              {esAnual && (
                <motion.div
                  layoutId="billingCyclePillPaso1"
                  className="absolute inset-0 bg-aurea-navy rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">Facturación Anual</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          VISTA 1: TABLA EDITORIAL DESKTOP (Idéntica a la onepage)
          ======================================================== */}
      <div className="lp-apron-table-container hidden lg:block">
        {/* Fila Cabecera Sticky: Planes, Precios y Botones */}
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
              <button
                type="button"
                onClick={() => handleSelectAndProceed(planStarter.id)}
                className={`w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all cursor-pointer shadow-2xs ${
                  planSeleccionadoId === planStarter.id
                    ? 'bg-aurea-navy text-white hover:bg-[#12345e]'
                    : 'bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900'
                }`}
              >
                {planSeleccionadoId === planStarter.id ? 'Continuar con Starter →' : `Elegir ${planStarter.nombre}`}
              </button>
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
              <button
                type="button"
                onClick={() => handleSelectAndProceed(planPro.id)}
                className={`w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  planSeleccionadoId === planPro.id
                    ? 'bg-aurea-navy text-white hover:bg-[#12345e]'
                    : 'bg-aurea-copper text-white hover:bg-[#c48f5e]'
                }`}
              >
                {planSeleccionadoId === planPro.id ? 'Continuar con Pro →' : `Elegir ${planPro.nombre}`}
              </button>
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
              <button
                type="button"
                onClick={() => handleSelectAndProceed(planEnterprise.id)}
                className={`w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all cursor-pointer shadow-2xs ${
                  planSeleccionadoId === planEnterprise.id
                    ? 'bg-aurea-navy text-white hover:bg-[#12345e]'
                    : 'bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900'
                }`}
              >
                {planSeleccionadoId === planEnterprise.id ? 'Continuar con Enterprise →' : `Elegir ${planEnterprise.nombre}`}
              </button>
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

                {/* Valor Pro (Destacado con sombreado Apron) */}
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

        {/* Fila Inferior Repetidora de Acciones */}
        <div className="lp-apron-bottom-row items-center">
          <div className="lp-apron-cell font-serif text-lg font-bold text-aurea-navy border-r border-aurea-copper/20">
            Empieza con tu restaurante
          </div>
          <div className="px-6 border-r border-aurea-copper/20 flex items-center">
            <button
              type="button"
              onClick={() => handleSelectAndProceed(planStarter.id)}
              className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
            >
              Elegir {planStarter.nombre}
            </button>
          </div>
          <div className="px-6 lp-apron-pro-col flex items-center">
            <button
              type="button"
              onClick={() => handleSelectAndProceed(planPro.id)}
              className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-aurea-copper text-white hover:bg-[#c48f5e] transition-all cursor-pointer shadow-sm"
            >
              Elegir {planPro.nombre}
            </button>
          </div>
          <div className="px-6 flex items-center">
            <button
              type="button"
              onClick={() => handleSelectAndProceed(planEnterprise.id)}
              className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
            >
              Elegir {planEnterprise.nombre}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          VISTA 2: EXPERIENCIA MÓVIL
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
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  mobilePlanTab === tab.id
                    ? 'bg-aurea-navy text-white shadow-xs'
                    : 'text-aurea-navy/70 hover:text-aurea-navy'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjeta de Resumen Activa en Móvil */}
        <div className="bg-white rounded-2xl p-6 border border-aurea-copper/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-copper">
              {mobileActivePlan.id === 2 ? 'Más Elegido' : mobileActivePlan.id === 1 ? 'Para Iniciar' : 'Multi-Sede'}
            </span>
            {planSeleccionadoId === mobileActivePlan.id && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-aurea-navy text-aurea-champagne px-2 py-0.5 rounded-full">
                Seleccionado
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl font-bold text-aurea-navy mt-1">
            {mobileActivePlan.nombre}
          </h3>
          <p className="text-xs text-aurea-navy/70 mt-1">
            {mobileActivePlan.descripcion}
          </p>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-bold text-aurea-copper font-sans">S/</span>
            <span className="text-4xl font-extrabold text-aurea-navy font-sans tracking-tight">
              {Math.floor(mobileActivePrice)}
            </span>
            <span className="text-xs text-aurea-navy/60 font-medium">/ mes</span>
          </div>

          {esAnual && (
            <div className="text-[11px] text-aurea-navy/60 font-medium mt-1">
              S/ {mobileActivePlan.precio_anual.toFixed(2)} al año
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={() => handleSelectAndProceed(mobileActivePlan.id)}
              className={`w-full py-3 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                mobileActivePlan.destacado
                  ? 'bg-aurea-copper text-white hover:bg-[#c48f5e] shadow-sm'
                  : 'bg-white border border-stone-300 hover:border-aurea-copper text-stone-800 shadow-2xs'
              }`}
            >
              <span>Elegir {mobileActivePlan.nombre}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Desglose de Características en Móvil por Categoría */}
          <div className="mt-8 space-y-6">
            {TABLA_COMPARATIVA.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-aurea-copper pb-1 border-b border-aurea-copper/20">
                  {cat.titulo}
                </div>
                <div className="space-y-2.5">
                  {cat.filas.map((fila, fIdx) => {
                    const rawVal =
                      mobilePlanTab === 1
                        ? fila.starter
                        : mobilePlanTab === 2
                        ? fila.pro
                        : fila.enterprise;
                    return (
                      <div key={fIdx} className="flex items-center justify-between py-1 text-xs gap-3">
                        <span className="text-aurea-navy font-medium">{fila.nombre}</span>
                        <span className="text-right shrink-0">
                          {renderValue(rawVal, mobilePlanTab === 2)}
                        </span>
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
};
