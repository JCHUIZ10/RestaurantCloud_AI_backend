import React from 'react';
import { Flame, MapPin, Radio, AlertCircle } from 'lucide-react';

interface KdsConfigHeaderProps {
  sedeNombre?: string;
  isDirty: boolean;
  sseConectado?: boolean;
}

export const KdsConfigHeader: React.FC<KdsConfigHeaderProps> = ({
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
            <span className="text-aurea-copper font-semibold">Tiempos de Cocina y KDS (CU-ADMIN-18)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0 shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-aurea-navy flex items-center gap-2">
                Tiempos de Cocina y Semáforo KDS
              </h1>
              <p className="text-xs text-aurea-navy/70 mt-0.5">
                Calibración reactiva de umbrales cromáticos (verde, ámbar y rojo), pase caliente y alertas acústicas de la sede.
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

          {/* Badge de Estado en Vivo */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              sseConectado
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${sseConectado ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span>{sseConectado ? 'Sincronizado' : 'Sincronizando...'}</span>
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
