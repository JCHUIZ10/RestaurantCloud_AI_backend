import React, { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button, CampoBusqueda } from '@/components/ui';
import { cn } from '@/shared/utils';
import type { LocalConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { coberturaPerdida, conteoSede, ETIQUETA_ROL, ROLES_ORDEN, type Limites, type Seleccion } from './logicaConservar';
import type { SeleccionConservar } from './useSeleccionConservar';

interface PasoSedePersonalProps {
  local: LocalConciliacionDTO;
  limites: Limites;
  sel: Seleccion;
  acciones: Pick<SeleccionConservar, 'alternarPersona' | 'marcarRol'>;
}

/** Personal de la sede agrupado por rol, con búsqueda y aviso si un rol operativo se queda sin nadie. */
export const PasoSedePersonal: React.FC<PasoSedePersonalProps> = ({ local, limites, sel, acciones }) => {
  const [busqueda, setBusqueda] = useState('');
  const conteo = conteoSede(local, sel);
  const faltantes = coberturaPerdida(local, sel);
  const texto = busqueda.trim().toLowerCase();
  const cupoLleno = conteo.personal >= limites.max_usuarios;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          role="status"
          className={cn(
            'px-3 py-1 rounded-full text-xs font-bold',
            conteo.personal > limites.max_usuarios
              ? 'bg-estado-error-50 text-estado-error-700'
              : conteo.personal === limites.max_usuarios
                ? 'bg-estado-ok-50 text-estado-ok-700'
                : 'bg-estado-alerta-50 text-estado-alerta-700'
          )}
        >
          Personal de la sede: <span className="font-mono">{conteo.personal} / {limites.max_usuarios}</span>
        </span>
        <CampoBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre" etiqueta="Buscar personal" className="sm:max-w-xs" />
      </div>

      {faltantes.length > 0 && (
        <div role="alert" className="p-3 rounded-xl border border-estado-alerta-200 bg-estado-alerta-50 text-xs text-estado-alerta-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Esta sede se quedaría sin {faltantes.join(' ni ')}. Puedes continuar, pero revisa que la operación no se detenga.</span>
        </div>
      )}

      {ROLES_ORDEN.map((rol) => {
        const delRol = local.personal.filter((u) => u.rol === rol);
        if (delRol.length === 0) return null;
        const visibles = delRol.filter((u) => u.nombre.toLowerCase().includes(texto));
        const conservados = delRol.filter((u) => sel.usuarios.has(u.id)).length;
        const editables = delRol.some((u) => !u.protegido);

        return (
          <section key={rol} aria-label={ETIQUETA_ROL[rol]}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {ETIQUETA_ROL[rol] ?? rol} <span className="font-mono normal-case">({conservados}/{delRol.length})</span>
              </h3>
              {editables && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" disabled={cupoLleno} onClick={() => acciones.marcarRol(local, rol, true)}>
                    Todos
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => acciones.marcarRol(local, rol, false)}>
                    Ninguno
                  </Button>
                </div>
              )}
            </div>

            <ul className="space-y-1.5">
              {visibles.length === 0 && <li className="text-xs text-slate-400">Sin coincidencias.</li>}
              {visibles.map((persona) => {
                const elegido = sel.usuarios.has(persona.id);
                const bloqueado = persona.protegido || (!elegido && cupoLleno);
                return (
                  <li key={persona.id}>
                    <label
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg border text-sm min-h-tactil',
                        elegido ? 'border-aurea-navy bg-aurea-ivory/60' : 'border-slate-200 bg-white',
                        bloqueado ? 'cursor-not-allowed' : 'cursor-pointer',
                        bloqueado && !persona.protegido && 'opacity-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={elegido}
                        disabled={bloqueado}
                        onChange={() => acciones.alternarPersona(local, persona)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium text-aurea-navy truncate">{persona.nombre}</span>
                      {persona.protegido ? (
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                          <Lock className="w-3 h-3" aria-hidden="true" /> Siempre se conserva
                        </span>
                      ) : (
                        !elegido && <span className="ml-auto text-[11px] text-slate-400 shrink-0">Pasa a inactivo</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {local.personal.length === 0 && <p className="text-sm text-slate-500">Esta sede no tiene personal activo.</p>}
    </div>
  );
};
