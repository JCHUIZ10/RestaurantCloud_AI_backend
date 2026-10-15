import React from 'react';
import { Sparkles, BellRing, Building2, RotateCcw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface DemoPropietarioIncidentesWidgetProps {
  onSimularSseMiraflores: () => void;
  onSimularSseSanIsidro: () => void;
  onRestablecer: () => void;
}

export const DemoPropietarioIncidentesWidget: React.FC<DemoPropietarioIncidentesWidgetProps> = ({
  onSimularSseMiraflores,
  onSimularSseSanIsidro,
  onRestablecer,
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-aurea-navy via-slate-900 to-aurea-navy text-white p-4 sm:p-5 border border-aurea-copper/40 shadow-lg mt-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurea-champagne" />
            <span className="text-xs font-bold uppercase tracking-wider text-aurea-copper">
              Banco de Pruebas QA (CU-PROP-06)
            </span>
          </div>
          <p className="text-xs text-white/70 mt-1 max-w-xl">
            Simula eventos concurrentes en tiempo real del canal Server-Sent Events (SSE) y verifica
            la sincronización multi-sede con el portal de Administrador de Local.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onSimularSseMiraflores}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Simular SSE (Miraflores)</span>
          </button>

          <button
            onClick={onSimularSseSanIsidro}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Simular SSE (San Isidro)</span>
          </button>

          <button
            onClick={onRestablecer}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 active:scale-95"
            title="Restablecer semillas a su estado inicial"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <Link
            to={ROUTES.ADMIN_INCIDENTES}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-aurea-copper text-aurea-navy text-xs font-bold hover:bg-aurea-copper/90 transition-all shadow-sm"
          >
            <span>Ver como Admin de Sede</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
