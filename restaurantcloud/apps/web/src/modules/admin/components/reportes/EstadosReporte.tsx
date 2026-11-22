import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Receipt } from 'lucide-react';
import { EstadoError, EstadoVacio, Skeleton } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { useAuthStore } from '@/stores/authStore';

/** Estados comunes de las tres pestañas de Reportes. */

interface SinPlanProps {
  titulo: string;
  beneficios: string[];
}

/** La pestaña no está en el plan de la empresa: una invitación, no un error. */
export const SinPlanReportes: React.FC<SinPlanProps> = ({ titulo, beneficios }) => {
  const esPropietario = useAuthStore((s) => s.usuario?.rol === 'propietario');
  return (
    <section aria-labelledby="titulo-sin-plan-reportes" className="relative overflow-hidden bg-aurea-navy text-aurea-ivory rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto space-y-5">
      <span aria-hidden="true" className="absolute -right-16 -top-16 w-56 h-56 rounded-full border border-aurea-copper/30" />
      <h2 id="titulo-sin-plan-reportes" className="relative font-serif text-3xl sm:text-4xl leading-tight">
        {titulo}
      </h2>
      <ul className="relative space-y-3 text-base text-aurea-ivory/90">
        {beneficios.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className="relative text-sm text-aurea-ivory/75">Está en los planes que incluyen reportes avanzados.</p>
      {esPropietario ? (
        <Link
          to={ROUTES.PROPIETARIO_CAMBIAR_PLAN}
          className="relative inline-flex items-center justify-center min-h-12 px-6 rounded-xl bg-aurea-champagne text-aurea-navy font-semibold hover:bg-aurea-champagne/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2 focus-visible:ring-offset-aurea-navy"
        >
          Ver planes
        </Link>
      ) : (
        <p className="relative text-sm text-aurea-champagne">Pídele al propietario de la empresa que cambie de plan.</p>
      )}
    </section>
  );
};

/** Un periodo más amplio al que saltar cuando el elegido no tiene ventas. */
export interface OtroPeriodo {
  etiqueta: string;
  alElegir: () => void;
}

interface SinVentasProps {
  /** Invita a probar con otro periodo; sin él no se muestra ningún botón */
  otroPeriodo?: OtroPeriodo | null;
  titulo?: string;
  descripcion?: string;
}

export const SinVentasReporte: React.FC<SinVentasProps> = ({
  otroPeriodo,
  titulo = 'Todavía no hay ventas en este periodo',
  descripcion = 'Cuando cobres la primera cuenta, aquí verás las ventas, los platos y el trabajo del equipo. Las ventas aparecen unos segundos después del cobro.',
}) => (
  <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm">
    <EstadoVacio
      icono={Receipt}
      titulo={titulo}
      descripcion={descripcion}
      accion={
        otroPeriodo && (
          <button
            type="button"
            onClick={otroPeriodo.alElegir}
            className="min-h-11 px-4 inline-flex items-center gap-2 rounded-xl border border-aurea-copper/50 bg-white text-sm font-semibold text-aurea-navy shadow-sm hover:bg-aurea-champagne/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper"
          >
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            {otroPeriodo.etiqueta}
          </button>
        )
      }
    />
  </div>
);

export const ErrorReporte: React.FC<{ mensaje: string; onReintentar: () => void }> = ({ mensaje, onReintentar }) => (
  <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm">
    <EstadoError titulo="No pudimos cargar los reportes" mensaje={mensaje} onReintentar={onReintentar} />
  </div>
);

/** Mientras carga: la forma de lo que va a aparecer. */
export const CargandoReporte: React.FC<{ variante: 'ventas' | 'platos' | 'equipo' }> = ({ variante }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
    <span className="sr-only">Cargando el reporte…</span>
    <Skeleton className="h-16" />
    {variante === 'ventas' && (
      <>
        <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
          <Skeleton className="h-72 rounded-3xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-32" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </>
    )}
    {variante === 'platos' && (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </>
    )}
    {variante === 'equipo' && (
      <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-64" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </>
    )}
  </div>
);
