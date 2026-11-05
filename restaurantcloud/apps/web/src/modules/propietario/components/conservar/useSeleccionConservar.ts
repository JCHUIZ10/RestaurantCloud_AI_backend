import { useCallback, useMemo, useState } from 'react';
import type {
  LocalConciliacionDTO,
  MesaConciliacionDTO,
  PersonaConciliacionDTO,
  PisoConciliacionDTO,
  RecursosConciliacionDTO,
} from '@/types/propietarioCambiarPlan';
import {
  aConjuntos,
  aDto,
  copiar,
  firma,
  generarPasos,
  localesValidos,
  preseleccionarLocal,
  quitarLocal,
  seleccionValida,
  validarSede,
  type Paso,
  type Seleccion,
} from './logicaConservar';

export type ModoMesas = 'todas' | 'ninguna' | 'mayor';

/** Estado y acciones del asistente "qué conservar"; las reglas de cupo viven en logicaConservar. */
export function useSeleccionConservar(datos: RecursosConciliacionDTO) {
  const limites = datos.plan_destino.limites;
  const [inicial] = useState(() => aConjuntos(datos.seleccion));
  const [sel, setSel] = useState<Seleccion>(() => aConjuntos(datos.seleccion));
  const [clave, setClave] = useState('diagnostico');

  const pasos = useMemo(() => generarPasos(datos, sel), [datos, sel]);
  const indice = Math.max(0, pasos.findIndex((p) => p.clave === clave));
  const paso: Paso = pasos[indice];

  const modificar = useCallback((cambio: (siguiente: Seleccion) => void) => {
    setSel((prev) => {
      const siguiente = copiar(prev);
      cambio(siguiente);
      return siguiente;
    });
  }, []);

  const alternarLocal = (local: LocalConciliacionDTO) =>
    modificar((s) => {
      if (s.locales.has(local.id)) quitarLocal(local, s);
      else if (s.locales.size < limites.max_locales) preseleccionarLocal(local, limites, s);
    });

  const alternarPiso = (local: LocalConciliacionDTO, piso: PisoConciliacionDTO) =>
    modificar((s) => {
      if (s.pisos.has(piso.id)) {
        s.pisos.delete(piso.id);
        piso.mesas.forEach((m) => s.mesas.delete(m.id));
      } else if (local.pisos.filter((p) => s.pisos.has(p.id)).length < limites.max_pisos) {
        s.pisos.add(piso.id);
      }
    });

  const mesasConservadas = (local: LocalConciliacionDTO, s: Seleccion) =>
    local.pisos.flatMap((p) => p.mesas).filter((m) => s.mesas.has(m.id)).length;

  const alternarMesa = (local: LocalConciliacionDTO, mesa: MesaConciliacionDTO) =>
    modificar((s) => {
      if (s.mesas.has(mesa.id)) s.mesas.delete(mesa.id);
      else if (mesasConservadas(local, s) < limites.max_mesas) s.mesas.add(mesa.id);
    });

  /** Acciones rápidas sobre las mesas de un ambiente, respetando el cupo de mesas de la sede. */
  const marcarMesas = (local: LocalConciliacionDTO, piso: PisoConciliacionDTO, modo: ModoMesas) =>
    modificar((s) => {
      piso.mesas.forEach((m) => s.mesas.delete(m.id));
      if (modo === 'ninguna' || !s.pisos.has(piso.id)) return;
      const libres = limites.max_mesas - mesasConservadas(local, s);
      const orden = modo === 'mayor' ? [...piso.mesas].sort((a, b) => b.capacidad - a.capacidad) : piso.mesas;
      orden.slice(0, Math.max(0, libres)).forEach((m) => s.mesas.add(m.id));
    });

  const personalConservado = (local: LocalConciliacionDTO, s: Seleccion) =>
    local.personal.filter((u) => s.usuarios.has(u.id)).length;

  const alternarPersona = (local: LocalConciliacionDTO, persona: PersonaConciliacionDTO) =>
    modificar((s) => {
      if (persona.protegido) return;
      if (s.usuarios.has(persona.id)) s.usuarios.delete(persona.id);
      else if (personalConservado(local, s) < limites.max_usuarios) s.usuarios.add(persona.id);
    });

  const marcarRol = (local: LocalConciliacionDTO, rol: string, marcar: boolean) =>
    modificar((s) => {
      const delRol = local.personal.filter((u) => u.rol === rol && !u.protegido);
      if (!marcar) {
        delRol.forEach((u) => s.usuarios.delete(u.id));
        return;
      }
      delRol.forEach((u) => {
        if (!s.usuarios.has(u.id) && personalConservado(local, s) < limites.max_usuarios) s.usuarios.add(u.id);
      });
    });

  const irA = (nuevaClave: string) => setClave(nuevaClave);
  const siguiente = () => pasos[indice + 1] && setClave(pasos[indice + 1].clave);
  const anterior = () => indice > 0 && setClave(pasos[indice - 1].clave);

  const sedeActual = paso.localId ? (datos.locales.find((l) => l.id === paso.localId) ?? null) : null;
  const puedeAvanzar =
    paso.tipo === 'locales'
      ? localesValidos(datos, sel)
      : paso.tipo === 'sede' && sedeActual
        ? validarSede(sedeActual, sel, limites).ok
        : true;

  return {
    sel,
    pasos,
    paso,
    indice,
    sedeActual,
    puedeAvanzar,
    esUltimo: indice === pasos.length - 1,
    modificado: firma(sel) !== firma(inicial),
    valido: seleccionValida(datos, sel),
    dto: () => aDto(sel),
    irA,
    siguiente,
    anterior,
    alternarLocal,
    alternarPiso,
    alternarMesa,
    marcarMesas,
    alternarPersona,
    marcarRol,
  };
}

export type SeleccionConservar = ReturnType<typeof useSeleccionConservar>;
