import React from 'react';
import { Building2, CheckCircle2, AlertTriangle, Store } from 'lucide-react';
import type { MetricasSaaSResumenDTO } from '@/types/saasTenants';

interface KpisSupervisionSaasProps {
  metricas?: MetricasSaaSResumenDTO;
  cargando?: boolean;
}

export const KpisSupervisionSaas: React.FC<KpisSupervisionSaasProps> = ({
  metricas,
  cargando = false,
}) => {
  if (cargando || !metricas) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-aurea-copper/20 animate-pulse space-y-3"
          >
            <div className="h-4 bg-aurea-copper/10 rounded w-1/2" />
            <div className="h-8 bg-aurea-copper/20 rounded w-3/4" />
            <div className="h-4 bg-aurea-copper/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const porcentajeActivas =
    metricas.total_empresas > 0
      ? ((metricas.suscripciones_activas / metricas.total_empresas) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Empresas Registradas */}
      <div className="p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm hover:border-aurea-copper/50 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/70 uppercase tracking-wider">
            Total Empresas
          </span>
          <div className="w-8 h-8 rounded-lg bg-aurea-champagne/40 border border-aurea-copper/30 flex items-center justify-center text-aurea-navy">
            <Building2 className="w-4 h-4 text-aurea-navy" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-serif text-2xl lg:text-3xl font-bold text-aurea-navy">
            {metricas.total_empresas}{' '}
            <span className="text-sm font-sans font-normal text-aurea-navy/60">Empresas</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span>▲ +{metricas.nuevas_empresas_este_mes} este mes</span>
            <span className="text-aurea-navy/50 font-normal">
              (MRR: S/ {metricas.mrr_total_pen.toLocaleString('es-PE', { minimumFractionDigits: 2 })})
            </span>
          </p>
        </div>
      </div>

      {/* KPI 2: Suscripciones Activas & Al Día */}
      <div className="p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm hover:border-aurea-copper/50 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/70 uppercase tracking-wider">
            Suscripciones Activas
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-serif text-2xl lg:text-3xl font-bold text-aurea-navy">
            {metricas.suscripciones_activas}{' '}
            <span className="text-sm font-sans font-normal text-emerald-700">
              ({porcentajeActivas}%)
            </span>
          </div>
          <p className="text-xs text-aurea-navy/70 font-medium mt-1">
            ● Facturación al día en pasarela Stripe
          </p>
        </div>
      </div>

      {/* KPI 3: En Período de Gracia (Dunning) */}
      <div
        className={`p-5 rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${
          metricas.suscripciones_en_gracia > 0
            ? 'bg-amber-50/50 border-amber-300'
            : 'bg-white border-aurea-copper/25'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/70 uppercase tracking-wider">
            En Período de Gracia
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              metricas.suscripciones_en_gracia > 0
                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                : 'bg-aurea-champagne/30 text-aurea-navy/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-serif text-2xl lg:text-3xl font-bold text-amber-900">
            {metricas.suscripciones_en_gracia}{' '}
            <span className="text-sm font-sans font-normal text-amber-800">
              {metricas.suscripciones_en_gracia === 1 ? 'en Gracia' : 'en Gracia (Día 1-5)'}
            </span>
          </div>
          <p className="text-xs text-amber-800 font-medium mt-1">
            {metricas.suscripciones_en_gracia > 0
              ? `⚠️ S/ ${metricas.mrr_en_riesgo_pen.toFixed(2)} MRR en riesgo`
              : '✓ Sin cobros pendientes de pago'}
          </p>
        </div>
      </div>

      {/* KPI 4: Sedes Operativas Conectadas */}
      <div className="p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm hover:border-aurea-copper/50 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/70 uppercase tracking-wider">
            Sedes Operativas Conectadas
          </span>
          <div className="w-8 h-8 rounded-lg bg-aurea-champagne/40 border border-aurea-copper/30 flex items-center justify-center text-aurea-navy">
            <Store className="w-4 h-4 text-aurea-navy" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-serif text-2xl lg:text-3xl font-bold text-aurea-navy">
            {metricas.sedes_operativas_totales}{' '}
            <span className="text-sm font-sans font-normal text-aurea-navy/60">Locales Activos</span>
          </div>
          <p className="text-xs text-aurea-navy/70 font-medium mt-1">
            Promedio: {metricas.promedio_sedes_por_tenant} sedes por cliente
          </p>
        </div>
      </div>
    </div>
  );
};
