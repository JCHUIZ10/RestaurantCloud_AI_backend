import React from 'react';
import { CreditCard, MapPin, Radio, AlertCircle } from 'lucide-react';

interface MetodosPagoHeaderProps {
  sedeNombre?: string;
  isDirty: boolean;
  sseConectado?: boolean;
}

export const MetodosPagoHeader: React.FC<MetodosPagoHeaderProps> = ({
  sedeNombre = 'Miraflores (Principal)',
  isDirty,
  sseConectado = true,
}) => {
  return (
    <div className="bg-white border-b border-aurea-copper/20 px-6 py-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Título y migas */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-aurea-navy/60 uppercase tracking-wider mb-1">
            <span>Portal Administrador</span>
            <span>&rsaquo;</span>
            <span>Configuración</span>
            <span>&rsaquo;</span>
            <span className="text-aurea-copper font-semibold">Métodos de Pago y Comisiones (CU-ADMIN-19)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-aurea-navy flex items-center gap-2">
                Métodos de Pago y Comisiones de Sede
              </h1>
              <p className="text-xs text-aurea-navy/70 mt-0.5">
                Administra medios aceptados en salón, pasarelas POS y recargos aplicados al comensal en caja y precuenta.
              </p>
            </div>
          </div>
        </div>

        {/* Badges de Estado */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Badge de Sede Activa */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Sede: {sedeNombre}</span>
          </div>

          {/* Badge de SSE en Vivo */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              sseConectado
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${sseConectado ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span>{sseConectado ? 'SSE: Sincronizado (< 30ms)' : 'SSE: pendiente de implementación'}</span>
          </div>

          {/* Indicador de cambios sin guardar */}
          {isDirty && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Cambios pendientes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
