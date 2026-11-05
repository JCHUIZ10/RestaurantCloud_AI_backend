import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ListChecks, Loader2, Lock } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import type {
  LocalConciliacionDTO,
  RecursosConciliacionDTO,
  SeleccionConservarDTO,
} from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';

interface ModalAsistenteDowngradeProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Se invoca al guardar la selección para que la página recargue sus datos */
  onGuardado: () => void;
}

interface Seleccion {
  locales: Set<string>;
  pisos: Set<string>;
  mesas: Set<string>;
  usuarios: Set<string>;
}

const PASOS = ['Locales', 'Detalle por sede', 'Resumen'] as const;
const ROL: Record<string, string> = { mozo: 'Mozo', cocina: 'Cocina', cajero: 'Cajero', admin_local: 'Administrador' };

const aConjuntos = (s: SeleccionConservarDTO): Seleccion => ({
  locales: new Set(s.locales_ids),
  pisos: new Set(s.pisos_ids),
  mesas: new Set(s.mesas_ids),
  usuarios: new Set(s.usuarios_ids),
});

const contar = (ids: string[], conjunto: Set<string>) => ids.filter((id) => conjunto.has(id)).length;

const formatearFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const Contador: React.FC<{ usados: number; maximo: number }> = ({ usados, maximo }) => (
  <span className={`font-mono text-xs font-bold ${usados >= maximo ? 'text-amber-700' : 'text-aurea-navy'}`}>
    {usados} / {maximo}
  </span>
);

/** Deja elegir qué locales, ambientes, mesas y personal siguen activos cuando entre el plan más pequeño. */
export const ModalAsistenteDowngrade: React.FC<ModalAsistenteDowngradeProps> = ({ abierto, onCerrar, onGuardado }) => {
  const [datos, setDatos] = useState<RecursosConciliacionDTO | null>(null);
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [paso, setPaso] = useState(0);
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    setPaso(0);
    propietarioSuscripcionService
      .getRecursosConciliacion()
      .then((res) => {
        if (cancelado) return;
        if (res.exito && res.datos) {
          setDatos(res.datos);
          setSel(aConjuntos(res.datos.seleccion));
        } else {
          setDatos(null);
          setError(res.errores?.[0]?.mensaje ?? 'No se pudieron cargar tus recursos.');
        }
      })
      .catch(() => {
        if (!cancelado) setError('No pudimos conectar con el servidor. Intenta nuevamente.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [abierto]);

  const limites = datos?.plan_destino.limites;

  const alternarLocal = (local: LocalConciliacionDTO) => {
    if (!limites) return;
    setSel((prev) => {
      if (!prev) return prev;
      const siguiente: Seleccion = {
        locales: new Set(prev.locales),
        pisos: new Set(prev.pisos),
        mesas: new Set(prev.mesas),
        usuarios: new Set(prev.usuarios),
      };
      if (siguiente.locales.has(local.id)) {
        siguiente.locales.delete(local.id);
        local.pisos.forEach((p) => {
          siguiente.pisos.delete(p.id);
          p.mesas.forEach((m) => siguiente.mesas.delete(m.id));
        });
        local.personal.forEach((u) => siguiente.usuarios.delete(u.id));
      } else if (siguiente.locales.size < limites.max_locales) {
        siguiente.locales.add(local.id);
        const pisos = local.pisos.slice(0, limites.max_pisos);
        pisos.forEach((p) => siguiente.pisos.add(p.id));
        pisos
          .flatMap((p) => p.mesas)
          .slice(0, limites.max_mesas)
          .forEach((m) => siguiente.mesas.add(m.id));
        [...local.personal.filter((u) => u.protegido), ...local.personal.filter((u) => !u.protegido)]
          .slice(0, limites.max_usuarios)
          .forEach((u) => siguiente.usuarios.add(u.id));
      }
      return siguiente;
    });
  };

  const alternar = (
    campo: 'pisos' | 'mesas' | 'usuarios',
    id: string,
    idsDelLocal: string[],
    maximo: number,
    hijos: { campo: 'mesas'; ids: string[] } | null = null
  ) => {
    setSel((prev) => {
      if (!prev) return prev;
      const conjunto = new Set(prev[campo]);
      const siguiente = { ...prev, [campo]: conjunto };
      if (conjunto.has(id)) {
        conjunto.delete(id);
        if (hijos) {
          const mesas = new Set(prev.mesas);
          hijos.ids.forEach((hijo) => mesas.delete(hijo));
          siguiente.mesas = mesas;
        }
      } else if (contar(idsDelLocal, conjunto) < maximo) {
        conjunto.add(id);
      }
      return siguiente;
    });
  };

  const guardar = async () => {
    if (!sel) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await propietarioSuscripcionService.guardarSeleccionConservar({
        locales_ids: [...sel.locales],
        pisos_ids: [...sel.pisos],
        mesas_ids: [...sel.mesas],
        usuarios_ids: [...sel.usuarios],
      });
      if (res.exito) {
        onGuardado();
        return;
      }
      setError(res.errores?.[0]?.mensaje ?? 'No se pudo guardar la selección.');
    } catch {
      setError('No pudimos conectar con el servidor. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  const sedesConservadas = datos && sel ? datos.locales.filter((l) => sel.locales.has(l.id)) : [];
  const sedeActual = sedesConservadas.find((l) => l.id === sedeId) ?? sedesConservadas[0] ?? null;
  const sinLocales = sel !== null && sel.locales.size === 0;

  const pie = (
    <>
      <Button variant="ghost" disabled={guardando} onClick={onCerrar}>
        Cerrar
      </Button>
      {paso > 0 && (
        <Button variant="outline" disabled={guardando} leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setPaso(paso - 1)}>
          Atrás
        </Button>
      )}
      {paso < PASOS.length - 1 ? (
        <Button disabled={!datos || sinLocales} onClick={() => setPaso(paso + 1)}>
          Siguiente <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      ) : (
        <Button loading={guardando} disabled={!datos || sinLocales} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={guardar}>
          Guardar selección
        </Button>
      )}
    </>
  );

  const cuerpoPaso = () => {
    if (!datos || !sel || !limites) return null;

    if (paso === 0) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              El Plan {datos.plan_destino.nombre} admite hasta {limites.max_locales}{' '}
              {limites.max_locales === 1 ? 'local' : 'locales'}.
            </span>
            <Contador usados={sel.locales.size} maximo={limites.max_locales} />
          </div>
          {datos.locales.map((local) => {
            const elegido = sel.locales.has(local.id);
            const bloqueado = !elegido && sel.locales.size >= limites.max_locales;
            return (
              <label
                key={local.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                  elegido ? 'border-aurea-navy bg-aurea-ivory/60' : 'border-slate-200'
                } ${bloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={elegido} disabled={bloqueado} onChange={() => alternarLocal(local)} />
                  <strong className="text-aurea-navy">{local.nombre}</strong>
                </span>
                <span className="text-[11px] text-slate-500">
                  {local.pisos.length} ambientes · {local.pisos.reduce((n, p) => n + p.mesas.length, 0)} mesas ·{' '}
                  {local.personal.length} personas
                </span>
              </label>
            );
          })}
          <p className="text-[11px] text-slate-500">
            Los locales que no elijas pasan a inactivos con todo lo que contienen; no se borra ningún dato.
          </p>
        </div>
      );
    }

    if (paso === 1 && sedeActual) {
      const idsPisos = sedeActual.pisos.map((p) => p.id);
      const idsMesas = sedeActual.pisos.flatMap((p) => p.mesas.map((m) => m.id));
      const idsPersonal = sedeActual.personal.map((u) => u.id);
      const pisosElegidos = sedeActual.pisos.filter((p) => sel.pisos.has(p.id));

      return (
        <div className="space-y-5">
          {sedesConservadas.length > 1 && (
            <div role="tablist" aria-label="Sede" className="flex flex-wrap gap-2">
              {sedesConservadas.map((sede) => (
                <button
                  key={sede.id}
                  role="tab"
                  type="button"
                  aria-selected={sede.id === sedeActual.id}
                  onClick={() => setSedeId(sede.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                    sede.id === sedeActual.id ? 'bg-aurea-navy text-white border-aurea-navy' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {sede.nombre}
                </button>
              ))}
            </div>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ambientes</h4>
              <Contador usados={contar(idsPisos, sel.pisos)} maximo={limites.max_pisos} />
            </div>
            <div className="space-y-2">
              {sedeActual.pisos.length === 0 && <p className="text-xs text-slate-400">Esta sede no tiene ambientes.</p>}
              {sedeActual.pisos.map((piso) => {
                const elegido = sel.pisos.has(piso.id);
                const bloqueado = !elegido && contar(idsPisos, sel.pisos) >= limites.max_pisos;
                return (
                  <label
                    key={piso.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${
                      elegido ? 'border-aurea-navy bg-aurea-ivory/60' : 'border-slate-200'
                    } ${bloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={elegido}
                      disabled={bloqueado}
                      onChange={() =>
                        alternar('pisos', piso.id, idsPisos, limites.max_pisos, { campo: 'mesas', ids: piso.mesas.map((m) => m.id) })
                      }
                    />
                    <span className="font-medium">{piso.nombre}</span>
                    <span className="ml-auto text-[11px] text-slate-500">{piso.mesas.length} mesas</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mesas</h4>
              <Contador usados={contar(idsMesas, sel.mesas)} maximo={limites.max_mesas} />
            </div>
            {pisosElegidos.length === 0 && <p className="text-xs text-slate-400">Elige un ambiente para ver sus mesas.</p>}
            <div className="space-y-3">
              {pisosElegidos.map((piso) => (
                <div key={piso.id}>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">{piso.nombre}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {piso.mesas.map((mesa) => {
                      const elegida = sel.mesas.has(mesa.id);
                      const bloqueada = !elegida && contar(idsMesas, sel.mesas) >= limites.max_mesas;
                      return (
                        <label
                          key={mesa.id}
                          className={`px-2.5 py-1 rounded-md border text-xs font-mono ${
                            elegida ? 'border-aurea-navy bg-aurea-ivory/60 font-bold' : 'border-slate-200'
                          } ${bloqueada ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={elegida}
                            disabled={bloqueada}
                            onChange={() => alternar('mesas', mesa.id, idsMesas, limites.max_mesas)}
                          />
                          {mesa.numero}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal</h4>
              <Contador usados={contar(idsPersonal, sel.usuarios)} maximo={limites.max_usuarios} />
            </div>
            <div className="space-y-2">
              {sedeActual.personal.length === 0 && <p className="text-xs text-slate-400">Esta sede no tiene personal activo.</p>}
              {sedeActual.personal.map((persona) => {
                const elegido = sel.usuarios.has(persona.id);
                const bloqueado = persona.protegido || (!elegido && contar(idsPersonal, sel.usuarios) >= limites.max_usuarios);
                return (
                  <label
                    key={persona.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${
                      elegido ? 'border-aurea-navy bg-aurea-ivory/60' : 'border-slate-200'
                    } ${bloqueado ? 'cursor-not-allowed' : 'cursor-pointer'} ${bloqueado && !persona.protegido ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={elegido}
                      disabled={bloqueado}
                      onChange={() => alternar('usuarios', persona.id, idsPersonal, limites.max_usuarios)}
                    />
                    <span className="font-medium">{persona.nombre}</span>
                    <span className="text-[11px] text-slate-500">{ROL[persona.rol] ?? persona.rol}</span>
                    {persona.protegido && (
                      <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
                        <Lock className="w-3 h-3" /> Siempre se conserva
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      );
    }

    const todosPisos = datos.locales.flatMap((l) => l.pisos);
    const filas = [
      { etiqueta: 'Locales', activos: datos.locales.length, conservados: sel.locales.size },
      { etiqueta: 'Ambientes', activos: todosPisos.length, conservados: sel.pisos.size },
      { etiqueta: 'Mesas', activos: todosPisos.reduce((n, p) => n + p.mesas.length, 0), conservados: sel.mesas.size },
      { etiqueta: 'Personal', activos: datos.locales.reduce((n, l) => n + l.personal.length, 0), conservados: sel.usuarios.size },
    ];

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs min-w-[20rem]">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="py-2 px-3">Recurso</th>
                <th className="py-2 px-3 text-right">Seguirán activos</th>
                <th className="py-2 px-3 text-right">Pasarán a inactivos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((f) => (
                <tr key={f.etiqueta}>
                  <th scope="row" className="py-2 px-3 font-semibold text-aurea-navy">{f.etiqueta}</th>
                  <td className="py-2 px-3 text-right font-mono">{f.conservados}</td>
                  <td className="py-2 px-3 text-right font-mono text-amber-700">{Math.max(0, f.activos - f.conservados)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Esto se aplica el <strong>{formatearFecha(datos.fecha_efectiva)}</strong>, cuando se cobre el Plan{' '}
          {datos.plan_destino.nombre}. Si dejas cupo libre, se completa con lo más antiguo. Lo que pase a inactivo no se borra:
          podrás reactivarlo si vuelves a un plan con más capacidad. Puedes cambiar esta selección hasta esa fecha.
        </p>
      </div>
    );
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!guardando}
      icono={ListChecks}
      etiqueta="Qué conservar"
      titulo={datos ? `Elige qué conservar en el Plan ${datos.plan_destino.nombre}` : 'Elige qué conservar'}
      descripcion="Hasta el cambio sigues con todo activo. Aquí decides qué seguirá funcionando después."
      tamano="xl"
      pie={pie}
    >
      <div className="space-y-4">
        <ol className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" aria-label="Pasos">
          {PASOS.map((nombre, i) => (
            <li key={nombre} aria-current={i === paso ? 'step' : undefined} className={i === paso ? 'text-aurea-navy' : 'text-slate-400'}>
              {i + 1}. {nombre}
              {i < PASOS.length - 1 && <span className="mx-2 text-slate-300">/</span>}
            </li>
          ))}
        </ol>

        {cargando && (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!cargando && cuerpoPaso()}

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};
