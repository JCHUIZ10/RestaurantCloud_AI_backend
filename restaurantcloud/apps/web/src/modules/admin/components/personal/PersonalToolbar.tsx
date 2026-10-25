import React from 'react';
import { Users } from 'lucide-react';
import { MetricasPersonalDTO } from '@/types/admin';
import { CampoBusqueda, Pestanas } from '@/components/ui';
import { cn } from '@/shared/utils';
import { ORDEN_ROLES, ROLES_PERSONAL } from './rolesPersonal';

interface PersonalToolbarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  rolSeleccionado: string;
  onRolChange: (rol: string) => void;
  estadoSeleccionado: string;
  onEstadoChange: (estado: string) => void;
  metricas?: MetricasPersonalDTO;
}

const CLASE_PESTANA =
  'min-h-tactil inline-flex items-center gap-2 px-3.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-colors';

/** Roles, estado y búsqueda; va dentro de la tarjeta de la tabla. */
export const PersonalToolbar: React.FC<PersonalToolbarProps> = ({
  busqueda,
  onBusquedaChange,
  rolSeleccionado,
  onRolChange,
  estadoSeleccionado,
  onEstadoChange,
  metricas,
}) => {
  const conteos: Record<string, number | undefined> = {
    todos: metricas?.total_empleados,
    mozo: metricas?.mozos_activos,
    cocina: metricas?.cocina_activos,
    cajero: metricas?.cajeros_activos,
  };

  const contador = (valor: string, activa: boolean, claseInactiva: string) =>
    conteos[valor] !== undefined && (
      <span className={cn('px-1.5 rounded-full text-xs font-bold tabular-nums', activa ? 'bg-white/20 text-white' : claseInactiva)}>
        {conteos[valor]}
      </span>
    );

  return (
    <div className="space-y-3">
      {/* Pestañas de Roles Operativos */}
      <div role="group" aria-label="Filtrar por rol" className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
        <button
          type="button"
          aria-pressed={rolSeleccionado === 'todos'}
          onClick={() => onRolChange('todos')}
          className={cn(
            CLASE_PESTANA,
            rolSeleccionado === 'todos'
              ? 'bg-aurea-copper text-white border-aurea-copper shadow-sm'
              : 'bg-white text-aurea-navy/70 border-aurea-champagne hover:bg-aurea-champagne/30'
          )}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          Todos
          {contador('todos', rolSeleccionado === 'todos', 'bg-aurea-champagne/50 text-aurea-navy')}
        </button>

        {ORDEN_ROLES.map((rol) => {
          const r = ROLES_PERSONAL[rol];
          const Icono = r.icono;
          const activa = rolSeleccionado === rol;
          return (
            <button
              key={rol}
              type="button"
              aria-pressed={activa}
              onClick={() => onRolChange(rol)}
              className={cn(CLASE_PESTANA, activa ? cn(r.pestanaActiva, 'shadow-sm') : r.pestanaInactiva)}
            >
              <Icono className={cn('w-4 h-4', activa ? 'text-white' : r.iconoColor)} aria-hidden="true" />
              {r.etiqueta}
              {contador(rol, activa, r.conteoInactivo)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <Pestanas
          etiqueta="Filtrar por estado"
          valor={estadoSeleccionado}
          onCambiar={onEstadoChange}
          opciones={[
            { valor: 'todos', etiqueta: 'Todos' },
            { valor: 'activo', etiqueta: 'Activos', punto: 'bg-estado-ok-500' },
            { valor: 'inactivo', etiqueta: 'Inactivos', punto: 'bg-tinta-400' },
          ]}
          className="self-start lg:self-auto"
        />
        <CampoBusqueda
          valor={busqueda}
          onCambiar={onBusquedaChange}
          placeholder="Buscar por nombre, correo o celular"
          etiqueta="Buscar personal"
          className="lg:max-w-md lg:ml-auto"
        />
      </div>
    </div>
  );
};
