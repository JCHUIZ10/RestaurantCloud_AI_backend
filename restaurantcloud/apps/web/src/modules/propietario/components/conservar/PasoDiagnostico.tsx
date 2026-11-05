import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { RecursosConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { conflictoSede, hayConflictoLocales, mesasDe, tieneConflicto } from './logicaConservar';

interface PasoDiagnosticoProps {
  datos: RecursosConciliacionDTO;
}

const formatearFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

/** Qué excede el plan de destino y dónde, antes de decidir nada. */
export const PasoDiagnostico: React.FC<PasoDiagnosticoProps> = ({ datos }) => {
  const { plan_destino: plan } = datos;
  const l = plan.limites;
  const excedeLocales = hayConflictoLocales(datos);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-aurea-navy">Esto es lo que cambia con el Plan {plan.nombre}</h2>
        <p className="mt-1 text-sm text-aurea-navy/70">
          Admite {l.max_locales} {l.max_locales === 1 ? 'local' : 'locales'} y, por cada local, hasta {l.max_pisos} ambientes,{' '}
          {l.max_mesas} mesas y {l.max_usuarios} personas. Solo te pedimos decidir donde hoy superas esos límites.
        </p>
      </div>

      {excedeLocales && (
        <div className="p-4 rounded-2xl border border-estado-alerta-200 bg-estado-alerta-50 text-sm text-estado-alerta-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Tienes <strong>{datos.locales.length} locales</strong> y el plan admite <strong>{l.max_locales}</strong>. Primero
            elegirás cuáles siguen activos.
          </span>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {datos.locales.map((local) => {
          const c = conflictoSede(local, l);
          const mesas = mesasDe(local).length;
          const filas = [
            { etiqueta: 'Ambientes', actual: local.pisos.length, max: l.max_pisos, excede: c.pisos },
            { etiqueta: 'Mesas', actual: mesas, max: l.max_mesas, excede: c.mesas },
            { etiqueta: 'Personal', actual: local.personal.length, max: l.max_usuarios, excede: c.personal },
          ];
          return (
            <li key={local.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-aurea-navy">{local.nombre}</strong>
                {tieneConflicto(c) ? (
                  <span className="text-[11px] font-bold text-estado-alerta-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Requiere decisión
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-estado-ok-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Sin cambios
                  </span>
                )}
              </div>
              <dl className="mt-3 space-y-1.5 text-xs">
                {filas.map((f) => (
                  <div key={f.etiqueta} className="flex items-center justify-between">
                    <dt className="text-aurea-navy/70">{f.etiqueta}</dt>
                    <dd className={f.excede ? 'font-mono font-bold text-estado-alerta-700' : 'font-mono text-aurea-navy'}>
                      {f.actual} / {f.max}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-aurea-copper" aria-hidden="true" />
        <ul className="space-y-1 list-disc pl-4">
          <li>Hasta el <strong>{formatearFecha(datos.fecha_efectiva)}</strong> sigues con todo activo.</li>
          <li>Lo que no conserves pasa a inactivo; <strong>no se borra nada</strong> y podrás reactivarlo con un plan mayor.</li>
          <li>Si dejas cupo libre, se completa con lo más antiguo. Puedes cambiar tu elección hasta esa fecha.</li>
        </ul>
      </div>
    </div>
  );
};
