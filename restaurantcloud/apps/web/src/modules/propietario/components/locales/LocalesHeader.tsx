import React from 'react';
import { CuotaPlanLocalesDTO } from '@/types/propietarioLocales';
import { Button } from '@/components/ui/Button';
import { Plus, Building2, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface LocalesHeaderProps {
  cuota: CuotaPlanLocalesDTO | null;
  onAbrirCrear: () => void;
}

export const LocalesHeader: React.FC<LocalesHeaderProps> = ({
  cuota,
  onAbrirCrear,
}) => {
  const localesActivos = cuota?.locales_activos ?? 0;
  const localesPermitidos = cuota?.locales_permitidos ?? 3;
  const cuposDisponibles = cuota?.cupos_disponibles ?? 0;
  const limiteAlcanzado = cuota?.limite_alcanzado ?? false;
  const porcentaje = Math.round(
    (localesActivos / Math.max(1, localesPermitidos)) * 100
  );

  return (
    <header className="space-y-6">
      {/* Breadcrumb & Titular */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav
            aria-label="Migas de pan"
            className="text-[11px] font-mono uppercase tracking-wider text-aurea-navy/60 mb-1"
          >
            Configuración &gt;{' '}
            <span className="text-aurea-copper font-semibold">Mis Locales</span>
          </nav>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-aurea-navy font-bold tracking-tight">
            Gestión de Locales y Sedes
          </h1>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 mt-1">
            Administra las sucursales físicas de tu empresa, asigna administradores o gestiona cada sede directamente.
          </p>
        </div>

        {/* Botón de Alta Condicionado */}
        <div>
          {limiteAlcanzado ? (
            <div className="flex flex-col items-end gap-1.5">
              <Button
                type="button"
                disabled
                className="bg-slate-300 text-slate-500 cursor-not-allowed font-bold text-xs sm:text-sm shadow-none flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Nuevo Local</span>
              </Button>
              <Link
                to={ROUTES.PROPIETARIO_SUSCRIPCION}
                className="text-[11px] text-aurea-copper hover:text-aurea-navy font-bold flex items-center gap-1 underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Límite de plan alcanzado ({localesActivos}/{localesPermitidos}). Mejorar a Enterprise →
              </Link>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onAbrirCrear}
              className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 py-2.5 px-5"
            >
              <Plus className="w-4 h-4 text-aurea-copper" />
              <span>+ Registrar Nuevo Local</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Progreso de Cuota (Plan Pro / Starter / Enterprise) */}
      <div className="bg-white rounded-2xl p-5 border-2 border-aurea-copper/25 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-aurea-navy">
            <Building2 className="w-4 h-4 text-aurea-copper" />
            <span>
              Locales activos: {localesActivos} de {localesPermitidos} permitidos en tu Plan {cuota?.plan_nombre || 'Pro'} ({porcentaje}% consumido)
            </span>
          </div>

          <span className="font-mono text-[11px] text-aurea-navy/60">
            {cuposDisponibles > 0
              ? `${cuposDisponibles} cupo(s) disponible(s)`
              : 'Cupos agotados'}
          </span>
        </div>

        {/* Barra Visual */}
        <div
          role="progressbar"
          aria-valuenow={localesActivos}
          aria-valuemin={0}
          aria-valuemax={localesPermitidos}
          className="w-full h-3 rounded-full bg-aurea-ivory border border-aurea-copper/20 overflow-hidden"
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              porcentaje >= 100
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-aurea-copper to-aurea-champagne'
            }`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>

        {cuota?.downgrade_programado && (
          <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Existe un cambio de plan programado con un límite menor de locales.</span>
          </div>
        )}
      </div>
    </header>
  );
};
