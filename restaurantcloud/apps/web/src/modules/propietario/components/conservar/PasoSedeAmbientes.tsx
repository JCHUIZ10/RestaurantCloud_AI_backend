import React, { useState } from 'react';
import { Armchair, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/shared/utils';
import type { LocalConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { asientos, conteoSede, type Limites, type Seleccion } from './logicaConservar';
import { MiniPlanoSeleccion } from './MiniPlanoSeleccion';
import type { SeleccionConservar } from './useSeleccionConservar';

interface PasoSedeAmbientesProps {
  local: LocalConciliacionDTO;
  limites: Limites;
  sel: Seleccion;
  acciones: Pick<SeleccionConservar, 'alternarPiso' | 'alternarMesa' | 'marcarMesas'>;
}

const Contador: React.FC<{ etiqueta: string; usados: number; maximo: number }> = ({ etiqueta, usados, maximo }) => (
  <span
    className={cn(
      'px-3 py-1 rounded-full text-xs font-bold',
      usados > maximo
        ? 'bg-estado-error-50 text-estado-error-700'
        : usados === maximo
          ? 'bg-estado-ok-50 text-estado-ok-700'
          : 'bg-estado-alerta-50 text-estado-alerta-700'
    )}
    role="status"
  >
    {etiqueta}: <span className="font-mono">{usados} / {maximo}</span>
  </span>
);

/** Ambientes de la sede y su plano: se ve dónde está cada mesa y cuántos asientos se mantienen. */
export const PasoSedeAmbientes: React.FC<PasoSedeAmbientesProps> = ({ local, limites, sel, acciones }) => {
  const [pisoId, setPisoId] = useState<string | null>(null);
  const conteo = conteoSede(local, sel);
  const piso =
    local.pisos.find((p) => p.id === pisoId) ?? local.pisos.find((p) => sel.pisos.has(p.id)) ?? local.pisos[0] ?? null;
  const pisoConservado = piso ? sel.pisos.has(piso.id) : false;
  const cupoLleno = conteo.mesas >= limites.max_mesas;

  if (!piso) {
    return <p className="text-sm text-slate-500">Esta sede no tiene ambientes.</p>;
  }

  const mesasPiso = piso.mesas.filter((m) => sel.mesas.has(m.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Contador etiqueta="Ambientes" usados={conteo.pisos} maximo={limites.max_pisos} />
        <Contador etiqueta="Mesas de la sede" usados={conteo.mesas} maximo={limites.max_mesas} />
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-aurea-champagne/40 text-aurea-navy flex items-center gap-1.5">
          <Armchair className="w-3.5 h-3.5" aria-hidden="true" /> {conteo.asientos} asientos se mantienen
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <ul className="space-y-2" aria-label="Ambientes de la sede">
          {local.pisos.map((p) => {
            const conservado = sel.pisos.has(p.id);
            const activo = p.id === piso.id;
            const bloqueado = !conservado && conteo.pisos >= limites.max_pisos;
            const mantenidas = p.mesas.filter((m) => sel.mesas.has(m.id));
            return (
              <li key={p.id}>
                <div
                  className={cn(
                    'p-3 rounded-xl border-2 flex items-center gap-3',
                    activo ? 'border-aurea-navy bg-aurea-ivory/70' : 'border-slate-200 bg-white'
                  )}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={conservado}
                    aria-label={`Conservar ${p.nombre}`}
                    disabled={bloqueado}
                    onClick={() => acciones.alternarPiso(local, p)}
                    className={cn(
                      'w-6 h-6 rounded-md border-2 grid place-items-center shrink-0',
                      conservado ? 'bg-aurea-navy border-aurea-navy text-white' : 'border-slate-300',
                      bloqueado && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {conservado && <Check className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => setPisoId(p.id)} className="min-w-0 flex-1 text-left">
                    <strong className="block text-sm text-aurea-navy truncate">{p.nombre}</strong>
                    <span className="text-[11px] text-aurea-navy/70">
                      {conservado ? `${mantenidas.length} de ${p.mesas.length} mesas · ${asientos(mantenidas)} asientos` : `Pasa a inactivo con sus ${p.mesas.length} mesas`}
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <section aria-label={`Mesas de ${piso.nombre}`} className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-aurea-navy">
              {piso.nombre} <span className="font-normal text-aurea-navy/60">· {mesasPiso.length} de {piso.mesas.length} mesas</span>
            </h3>
            {pisoConservado && (
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => acciones.marcarMesas(local, piso, 'todas')}>
                  Conservar todas
                </Button>
                <Button size="sm" variant="outline" onClick={() => acciones.marcarMesas(local, piso, 'mayor')}>
                  Las de mayor capacidad
                </Button>
                <Button size="sm" variant="ghost" onClick={() => acciones.marcarMesas(local, piso, 'ninguna')}>
                  Ninguna
                </Button>
              </div>
            )}
          </div>

          {!pisoConservado && (
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Este ambiente pasa a inactivo. Actívalo con la casilla de la izquierda para elegir sus mesas.
            </p>
          )}

          <MiniPlanoSeleccion
            piso={piso}
            pisoConservado={pisoConservado}
            mesasConservadas={sel.mesas}
            cupoLleno={cupoLleno}
            onAlternar={(mesa) => acciones.alternarMesa(local, mesa)}
          />
        </section>
      </div>
    </div>
  );
};
