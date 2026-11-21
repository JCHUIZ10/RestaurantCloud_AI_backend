import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { useAuthStore } from '@/stores/authStore';

/** Plan sin predicción: una invitación, no un error. */
export const SinPlanPrediccion: React.FC = () => {
  const rol = useAuthStore((s) => s.usuario?.rol);
  const puedeCambiar = rol === 'propietario';

  return (
    <section aria-labelledby="titulo-sin-plan" className="relative overflow-hidden bg-aurea-navy text-aurea-ivory rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto space-y-5">
      <span aria-hidden="true" className="absolute -right-16 -top-16 w-56 h-56 rounded-full border border-aurea-copper/30" />
      <h2 id="titulo-sin-plan" className="relative font-serif text-3xl sm:text-4xl leading-tight">Anticípate a tu semana</h2>
      <ul className="relative space-y-3 text-base text-aurea-ivory/90">
        <li>Cuánto venderás de cada plato, día por día.</li>
        <li>La compra sugerida, lista por proveedor.</li>
        <li>Menos insumos que se pierden y menos platos agotados.</li>
      </ul>
      <p className="relative text-sm text-aurea-ivory/75">Incluida en los planes Pro y Enterprise.</p>
      {puedeCambiar ? (
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

interface PrimeraVezProps {
  onCalcular: () => void;
  calculando: boolean;
}

/** Aún no se calculó ninguna semana. */
export const PrimeraVezPrediccion: React.FC<PrimeraVezProps> = ({ onCalcular, calculando }) => (
  <section aria-labelledby="titulo-primera-vez" className="bg-white border border-aurea-copper/40 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto flex flex-col items-start gap-4">
    <span className="w-14 h-14 rounded-2xl bg-aurea-champagne/50 text-aurea-navy flex items-center justify-center" aria-hidden="true">
      <CalendarClock className="w-7 h-7" />
    </span>
    <h2 id="titulo-primera-vez" className="font-serif text-3xl text-aurea-navy leading-tight">Calcula tu primera semana</h2>
    <p className="text-base text-tinta-600">
      Miramos cómo has vendido y te decimos qué se viene. Si todavía vendes poco, igual te avisamos qué insumos están por debajo de tu mínimo.
    </p>
    <Button size="lg" onClick={onCalcular} loading={calculando}>Calcular mi semana</Button>
  </section>
);

/** Mientras se calcula: la forma de lo que va a aparecer. */
export const CalculandoPrediccion: React.FC = () => (
  <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
    <p className="text-sm font-semibold text-aurea-navy">Calculando tu semana… esto toma unos segundos.</p>
    <Skeleton className="h-72 rounded-3xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
    <Skeleton className="h-32" />
    <Skeleton className="h-32" />
  </div>
);
