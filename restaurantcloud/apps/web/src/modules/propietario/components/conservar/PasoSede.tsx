import React, { useState } from 'react';
import { Pestanas } from '@/components/ui';
import type { LocalConciliacionDTO, RecursosConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { conflictoSede, validarSede, type Seleccion } from './logicaConservar';
import { PasoSedeAmbientes } from './PasoSedeAmbientes';
import { PasoSedePersonal } from './PasoSedePersonal';
import type { SeleccionConservar } from './useSeleccionConservar';

type Seccion = 'ambientes' | 'personal';

interface PasoSedeProps {
  datos: RecursosConciliacionDTO;
  local: LocalConciliacionDTO;
  posicion: { actual: number; total: number };
  sel: Seleccion;
  acciones: SeleccionConservar;
}

/** Una pantalla por sede conservada: solo las secciones donde la sede supera el plan. */
export const PasoSede: React.FC<PasoSedeProps> = ({ datos, local, posicion, sel, acciones }) => {
  const limites = datos.plan_destino.limites;
  const conflicto = conflictoSede(local, limites);
  const validacion = validarSede(local, sel, limites);

  const opciones = [
    ...(conflicto.pisos || conflicto.mesas
      ? [{ valor: 'ambientes' as const, etiqueta: 'Ambientes y mesas', alerta: validacion.pisos && validacion.mesas ? undefined : 'bg-estado-alerta-500' }]
      : []),
    ...(conflicto.personal
      ? [{ valor: 'personal' as const, etiqueta: 'Personal', alerta: validacion.personal ? undefined : 'bg-estado-alerta-500' }]
      : []),
  ];
  const [elegida, setElegida] = useState<Seccion>(opciones[0]?.valor ?? 'ambientes');
  const seccion = opciones.some((o) => o.valor === elegida) ? elegida : (opciones[0]?.valor ?? 'ambientes');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-aurea-copper">
          Sede {posicion.actual} de {posicion.total}
        </p>
        <h2 className="font-serif text-xl font-bold text-aurea-navy">{local.nombre}</h2>
        <p className="mt-1 text-sm text-aurea-navy/70">
          El Plan {datos.plan_destino.nombre} admite {limites.max_pisos} ambientes, {limites.max_mesas} mesas y {limites.max_usuarios}{' '}
          personas por sede. Ajusta lo que supera esos límites.
        </p>
      </div>

      {opciones.length > 1 && <Pestanas opciones={opciones} valor={seccion} onCambiar={setElegida} etiqueta="Secciones de la sede" />}

      {seccion === 'ambientes' ? (
        <PasoSedeAmbientes key={local.id} local={local} limites={limites} sel={sel} acciones={acciones} />
      ) : (
        <PasoSedePersonal key={local.id} local={local} limites={limites} sel={sel} acciones={acciones} />
      )}
    </div>
  );
};
