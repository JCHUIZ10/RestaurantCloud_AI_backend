import type {
  LocalConciliacionDTO,
  MesaConciliacionDTO,
  RecursosConciliacionDTO,
  SeleccionConservarDTO,
} from '@/types/propietarioCambiarPlan';

export type Limites = RecursosConciliacionDTO['plan_destino']['limites'];

export interface Seleccion {
  locales: Set<string>;
  pisos: Set<string>;
  mesas: Set<string>;
  usuarios: Set<string>;
}

export const ROLES_ORDEN = ['admin_local', 'cajero', 'cocina', 'mozo'] as const;

export const ETIQUETA_ROL: Record<string, string> = {
  admin_local: 'Administrador',
  cajero: 'Cajeros',
  cocina: 'Cocina',
  mozo: 'Mozos',
};

const ROL_SINGULAR: Record<string, string> = { cajero: 'cajero', cocina: 'personal de cocina', mozo: 'mozo' };

export const aConjuntos = (s: SeleccionConservarDTO): Seleccion => ({
  locales: new Set(s.locales_ids),
  pisos: new Set(s.pisos_ids),
  mesas: new Set(s.mesas_ids),
  usuarios: new Set(s.usuarios_ids),
});

export const aDto = (s: Seleccion): SeleccionConservarDTO => ({
  locales_ids: [...s.locales],
  pisos_ids: [...s.pisos],
  mesas_ids: [...s.mesas],
  usuarios_ids: [...s.usuarios],
});

export const copiar = (s: Seleccion): Seleccion => ({
  locales: new Set(s.locales),
  pisos: new Set(s.pisos),
  mesas: new Set(s.mesas),
  usuarios: new Set(s.usuarios),
});

/** Firma estable de una selección para saber si el usuario cambió algo. */
export const firma = (s: Seleccion): string =>
  JSON.stringify([...Object.values(s)].map((conjunto) => [...conjunto].sort()));

export const mesasDe = (local: LocalConciliacionDTO): MesaConciliacionDTO[] => local.pisos.flatMap((p) => p.mesas);

export const asientos = (mesas: MesaConciliacionDTO[]): number => mesas.reduce((n, m) => n + m.capacidad, 0);

export interface ConflictoSede {
  pisos: boolean;
  mesas: boolean;
  personal: boolean;
}

/** Lo que la sede tiene hoy frente a lo que admite el plan de destino. */
export const conflictoSede = (local: LocalConciliacionDTO, limites: Limites): ConflictoSede => ({
  pisos: local.pisos.length > limites.max_pisos,
  mesas: mesasDe(local).length > limites.max_mesas,
  personal: local.personal.length > limites.max_usuarios,
});

export const tieneConflicto = (c: ConflictoSede): boolean => c.pisos || c.mesas || c.personal;

export const hayConflictoLocales = (datos: RecursosConciliacionDTO): boolean =>
  datos.locales.length > datos.plan_destino.limites.max_locales;

export interface ConteoSede {
  pisos: number;
  mesas: number;
  asientos: number;
  personal: number;
  porRol: Record<string, number>;
}

export const conteoSede = (local: LocalConciliacionDTO, sel: Seleccion): ConteoSede => {
  const mesas = mesasDe(local).filter((m) => sel.mesas.has(m.id));
  const personal = local.personal.filter((u) => sel.usuarios.has(u.id));
  const porRol: Record<string, number> = {};
  personal.forEach((u) => {
    porRol[u.rol] = (porRol[u.rol] ?? 0) + 1;
  });
  return {
    pisos: local.pisos.filter((p) => sel.pisos.has(p.id)).length,
    mesas: mesas.length,
    asientos: asientos(mesas),
    personal: personal.length,
    porRol,
  };
};

export const conteoActual = (local: LocalConciliacionDTO): ConteoSede => {
  const mesas = mesasDe(local);
  const porRol: Record<string, number> = {};
  local.personal.forEach((u) => {
    porRol[u.rol] = (porRol[u.rol] ?? 0) + 1;
  });
  return { pisos: local.pisos.length, mesas: mesas.length, asientos: asientos(mesas), personal: local.personal.length, porRol };
};

export interface ValidacionSede {
  pisos: boolean;
  mesas: boolean;
  personal: boolean;
  ok: boolean;
}

export const validarSede = (local: LocalConciliacionDTO, sel: Seleccion, limites: Limites): ValidacionSede => {
  const c = conteoSede(local, sel);
  const pisos = c.pisos <= limites.max_pisos;
  const mesas = c.mesas <= limites.max_mesas;
  const personal = c.personal <= limites.max_usuarios;
  return { pisos, mesas, personal, ok: pisos && mesas && personal };
};

/** Roles operativos que tenían gente activa en la sede y se quedarían sin nadie. */
export const coberturaPerdida = (local: LocalConciliacionDTO, sel: Seleccion): string[] => {
  const actual = conteoActual(local).porRol;
  const futuro = conteoSede(local, sel).porRol;
  return Object.keys(ROL_SINGULAR)
    .filter((rol) => (actual[rol] ?? 0) > 0 && (futuro[rol] ?? 0) === 0)
    .map((rol) => ROL_SINGULAR[rol]);
};

export type TipoPaso = 'diagnostico' | 'locales' | 'sede' | 'resumen';

export interface Paso {
  clave: string;
  tipo: TipoPaso;
  titulo: string;
  localId?: string;
}

/** Solo se generan las pantallas donde hay algo que decidir. */
export const generarPasos = (datos: RecursosConciliacionDTO, sel: Seleccion): Paso[] => {
  const limites = datos.plan_destino.limites;
  const pasos: Paso[] = [{ clave: 'diagnostico', tipo: 'diagnostico', titulo: 'Diagnóstico' }];

  if (hayConflictoLocales(datos)) {
    pasos.push({ clave: 'locales', tipo: 'locales', titulo: 'Locales' });
  }
  datos.locales
    .filter((l) => sel.locales.has(l.id) && tieneConflicto(conflictoSede(l, limites)))
    .forEach((l) => pasos.push({ clave: `sede:${l.id}`, tipo: 'sede', titulo: l.nombre, localId: l.id }));

  pasos.push({ clave: 'resumen', tipo: 'resumen', titulo: 'Resumen' });
  return pasos;
};

export const localesValidos = (datos: RecursosConciliacionDTO, sel: Seleccion): boolean =>
  sel.locales.size >= 1 && sel.locales.size <= datos.plan_destino.limites.max_locales;

export const seleccionValida = (datos: RecursosConciliacionDTO, sel: Seleccion): boolean =>
  localesValidos(datos, sel) &&
  datos.locales.filter((l) => sel.locales.has(l.id)).every((l) => validarSede(l, sel, datos.plan_destino.limites).ok);

/** Al conservar un local nuevo se propone lo más antiguo (el orden en que llega de la API) hasta el cupo. */
export const preseleccionarLocal = (local: LocalConciliacionDTO, limites: Limites, sel: Seleccion): void => {
  sel.locales.add(local.id);
  const pisos = local.pisos.slice(0, limites.max_pisos);
  pisos.forEach((p) => sel.pisos.add(p.id));
  pisos
    .flatMap((p) => p.mesas)
    .slice(0, limites.max_mesas)
    .forEach((m) => sel.mesas.add(m.id));
  [...local.personal.filter((u) => u.protegido), ...local.personal.filter((u) => !u.protegido)]
    .slice(0, limites.max_usuarios)
    .forEach((u) => sel.usuarios.add(u.id));
};

export const quitarLocal = (local: LocalConciliacionDTO, sel: Seleccion): void => {
  sel.locales.delete(local.id);
  local.pisos.forEach((p) => {
    sel.pisos.delete(p.id);
    p.mesas.forEach((m) => sel.mesas.delete(m.id));
  });
  local.personal.forEach((u) => sel.usuarios.delete(u.id));
};
