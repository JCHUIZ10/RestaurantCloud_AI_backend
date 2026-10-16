import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface EstadoVacioTenantsProps {
  tabActiva: string;
  onVerTodas: () => void;
  onRecargar: () => void;
}

export const EstadoVacioTenants: React.FC<EstadoVacioTenantsProps> = ({
  tabActiva,
  onVerTodas,
  onRecargar,
}) => {
  const esGracia = tabActiva === 'periodo_gracia';

  return (
    <div className="bg-white rounded-3xl border border-aurea-copper/25 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm my-4 space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy">
          {esGracia
            ? 'No hay empresas en período de gracia ni cobros pendientes'
            : 'No se encontraron empresas con los filtros aplicados'}
        </h3>
        <p className="text-sm text-aurea-navy/70 max-w-md mx-auto">
          {esGracia
            ? 'Todas las suscripciones activas se encuentran al día con sus pagos en Stripe y canales B2B. No se registran cobros fallidos en el ciclo actual.'
            : 'Intenta limpiar el buscador o seleccionar otra pestaña de estado para inspeccionar la base instalada de restaurantes.'}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onRecargar}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-champagne/30 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Actualizar Estado</span>
        </button>

        {tabActiva !== 'todos' && (
          <button
            onClick={onVerTodas}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-aurea-navy text-white hover:bg-opacity-90 shadow-sm transition-all"
          >
            Ver Todas las Empresas
          </button>
        )}
      </div>
    </div>
  );
};
