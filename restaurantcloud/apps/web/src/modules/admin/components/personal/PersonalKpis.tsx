import React from 'react';
import { Sparkles, UserPlus, Users } from 'lucide-react';
import { MetricasPersonalDTO } from '@/types/admin';
import { TarjetaIndicador } from '@/components/ui';
import { cn } from '@/shared/utils';
import { ORDEN_ROLES, ROLES_PERSONAL } from './rolesPersonal';

interface PersonalKpisProps {
  metricas: MetricasPersonalDTO;
}

/** El detalle por rol vive en las pestañas de la tabla; aquí solo el cupo del plan y el equipo activo. */
export const PersonalKpis: React.FC<PersonalKpisProps> = ({ metricas }) => {
  const porcentaje = Math.min(100, metricas.porcentaje_ocupacion);
  const libres = metricas.cupos_disponibles;
  const tonoCupo = libres <= 0 ? 'error' : libres <= 2 ? 'alerta' : 'ok';
  const barra = libres <= 0 ? 'bg-estado-error-500' : libres <= 2 ? 'bg-estado-alerta-500' : 'bg-estado-ok-500';
  const activos = metricas.mozos_activos + metricas.cocina_activos + metricas.cajeros_activos;
  const conteoRol = { mozo: metricas.mozos_activos, cocina: metricas.cocina_activos, cajero: metricas.cajeros_activos };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <TarjetaIndicador
        tono="cobre"
        icono={Sparkles}
        etiqueta={`Cupo ${metricas.plan_nombre}`}
        valor={`${metricas.total_empleados} / ${metricas.max_usuarios_plan}`}
        unidad="usuarios"
      >
        <div className="mt-2.5 h-2 rounded-full bg-aurea-champagne/40 overflow-hidden" aria-hidden="true">
          <div className={cn('h-full rounded-full transition-all', barra)} style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="mt-1 text-xs text-aurea-navy/60">{porcentaje}% ocupado</p>
      </TarjetaIndicador>

      <TarjetaIndicador
        tono={tonoCupo}
        icono={UserPlus}
        etiqueta="Cupos libres"
        valor={libres}
        unidad={libres === 1 ? 'cupo' : 'cupos'}
        detalle={libres <= 0 ? 'Desactiva a alguien para liberar uno' : 'Para registrar nuevo personal'}
      />

      <TarjetaIndicador
        icono={Users}
        etiqueta="Equipo activo"
        valor={activos}
        unidad={activos === 1 ? 'persona' : 'personas'}
        className="sm:col-span-2 lg:col-span-1"
      >
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {ORDEN_ROLES.map((rol) => {
            const r = ROLES_PERSONAL[rol];
            const Icono = r.icono;
            return (
              <li key={rol} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-semibold', r.tag)}>
                <Icono className={cn('w-3.5 h-3.5', r.iconoColor)} aria-hidden="true" />
                {conteoRol[rol]} {r.etiqueta.toLowerCase()}
              </li>
            );
          })}
        </ul>
      </TarjetaIndicador>
    </div>
  );
};
