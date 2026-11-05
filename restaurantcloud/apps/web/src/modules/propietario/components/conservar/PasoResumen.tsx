import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, PowerOff } from 'lucide-react';
import type { RecursosConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { coberturaPerdida, conteoActual, conteoSede, type Seleccion } from './logicaConservar';

interface PasoResumenProps {
  datos: RecursosConciliacionDTO;
  sel: Seleccion;
}

const formatearFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

/** Antes y después de cada sede antes de guardar. */
export const PasoResumen: React.FC<PasoResumenProps> = ({ datos, sel }) => {
  const conservadas = datos.locales.filter((l) => sel.locales.has(l.id));
  const inactivas = datos.locales.filter((l) => !sel.locales.has(l.id));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-aurea-navy">Revisa antes de guardar</h2>
        <p className="mt-1 text-sm text-aurea-navy/70">
          Se aplica el <strong>{formatearFecha(datos.fecha_efectiva)}</strong>, cuando se cobre el Plan {datos.plan_destino.nombre}. Puedes
          volver a editar esta elección hasta esa fecha.
        </p>
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        {conservadas.map((local) => {
          const antes = conteoActual(local);
          const despues = conteoSede(local, sel);
          const faltantes = coberturaPerdida(local, sel);
          const filas = [
            { etiqueta: 'Ambientes', antes: antes.pisos, despues: despues.pisos },
            { etiqueta: 'Mesas', antes: antes.mesas, despues: despues.mesas },
            { etiqueta: 'Asientos', antes: antes.asientos, despues: despues.asientos },
            { etiqueta: 'Personal', antes: antes.personal, despues: despues.personal },
          ];
          return (
            <li key={local.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-estado-ok-700 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Sigue activo
              </div>
              <strong className="block mt-0.5 text-aurea-navy">{local.nombre}</strong>
              <table className="mt-3 w-full text-xs">
                <caption className="sr-only">Cambios en {local.nombre}</caption>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((f) => (
                    <tr key={f.etiqueta}>
                      <th scope="row" className="py-1.5 text-left font-normal text-aurea-navy/70">{f.etiqueta}</th>
                      <td className="py-1.5 text-right font-mono">
                        {f.antes} <ArrowRight className="inline w-3 h-3 text-slate-400" aria-label="pasa a" />{' '}
                        <strong className={f.despues < f.antes ? 'text-estado-alerta-700' : 'text-aurea-navy'}>{f.despues}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {faltantes.length > 0 && (
                <p className="mt-3 p-2.5 rounded-lg bg-estado-alerta-50 border border-estado-alerta-200 text-[11px] text-estado-alerta-800 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  Quedaría sin {faltantes.join(' ni ')}.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {inactivas.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <PowerOff className="w-4 h-4" aria-hidden="true" /> Pasan a inactivos completos
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-aurea-navy">
            {inactivas.map((local) => (
              <li key={local.id}>
                <strong>{local.nombre}</strong>{' '}
                <span className="text-xs text-aurea-navy/60">
                  · {local.pisos.length} ambientes, {conteoActual(local).mesas} mesas, {local.personal.length} personas
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-600">Nada se borra: lo inactivo se puede reactivar si vuelves a un plan con más capacidad.</p>
    </div>
  );
};
