import React from 'react';
import { Users, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/shared/utils';
import { ORDEN_ROLES, ROLES_PERSONAL } from './rolesPersonal';

interface OnboardingPersonalVacioProps {
  onRegistrarPrimero: () => void;
  /** Solo en modo demo: carga el equipo de ejemplo */
  onRestablecerSemillas?: () => void;
}

export const OnboardingPersonalVacio: React.FC<OnboardingPersonalVacioProps> = ({
  onRegistrarPrimero,
  onRestablecerSemillas,
}) => (
  <div className="bg-white rounded-2xl border border-aurea-copper/30 border-t-4 border-t-aurea-copper shadow-md p-6 sm:p-10 text-center space-y-8">
    <div className="space-y-2">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-aurea-navy text-aurea-champagne ring-1 ring-aurea-copper/40 flex items-center justify-center">
        <Users className="w-7 h-7" aria-hidden="true" />
      </span>
      <h2 className="font-serif text-2xl font-bold text-aurea-navy">Arma tu equipo</h2>
      <p className="text-sm text-aurea-navy/70 max-w-xl mx-auto">
        Cada colaborador entra con su propio acceso según su rol. Cada uno ocupa un cupo de tu plan.
      </p>
    </div>

    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
      {ORDEN_ROLES.map((rol) => {
        const r = ROLES_PERSONAL[rol];
        const Icono = r.icono;
        return (
          <li key={rol} className={cn('p-4 rounded-xl border space-y-2', r.tag)}>
            <span className="flex items-center gap-2">
              <span className={cn('w-8 h-8 rounded-lg ring-1 flex items-center justify-center', r.avatar)} aria-hidden="true">
                <Icono className="w-4 h-4" />
              </span>
              <span className="font-semibold">{r.etiqueta}</span>
            </span>
            <p className="text-sm opacity-80">{r.descripcion}</p>
          </li>
        );
      })}
    </ul>

    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Button size="lg" onClick={onRegistrarPrimero} leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}>
        Registrar al primero
      </Button>
      {onRestablecerSemillas && (
        <Button size="lg" variant="outline" onClick={onRestablecerSemillas} leftIcon={<RotateCcw className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}>
          Cargar equipo de ejemplo
        </Button>
      )}
    </div>
  </div>
);
