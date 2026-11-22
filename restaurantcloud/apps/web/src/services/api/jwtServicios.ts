import { apiClient } from './client';

/**
 * JWT para los microservicios (ms-analítica y los que vengan), emitido por el núcleo.
 *
 * Vive 10 minutos y solo en memoria: no se guarda en `localStorage`, así que recargar la página o abrir otra pestaña
 * pide uno nuevo con el token de sesión. `POST /auth/token-servicios` no rota la sesión, por eso dos pestañas
 * pueden renovar a la vez sin invalidarse entre sí.
 */

/** Se renueva cuando faltan menos de 60 s, para que ninguna petición salga con un token a punto de vencer. */
const MARGEN_DE_RENOVACION_MS = 60_000;

interface JwtGuardado {
  jwt: string;
  /** Vencimiento medido con el reloj del dispositivo (ver `instanteDeVencimiento`) */
  venceEnMs: number;
  /** Token de sesión con el que se pidió: si cambia (otra cuenta, otro login), este JWT ya no sirve */
  sesion: string;
}

export class SinSesionError extends Error {
  constructor() {
    super('No hay una sesión iniciada.');
    this.name = 'SinSesionError';
  }
}

let guardado: JwtGuardado | null = null;
let renovacion: { sesion: string; promesa: Promise<string> } | null = null;

const sesionActual = (): string => localStorage.getItem('auth_token') ?? '';

/**
 * Cuándo vence el JWT según el reloj del dispositivo. Se mide contra la hora del servidor (`meta.timestamp`) para
 * que un reloj adelantado o atrasado no haga que el token parezca vencido, o vigente, antes de tiempo.
 */
export function instanteDeVencimiento(expiraEn: string, marcaServidor: string | undefined, ahoraMs: number = Date.now()): number {
  const vence = Date.parse(expiraEn);
  const servidor = marcaServidor ? Date.parse(marcaServidor) : Number.NaN;
  if (Number.isNaN(vence)) return ahoraMs;
  return Number.isNaN(servidor) ? vence : ahoraMs + (vence - servidor);
}

async function pedirJwt(sesion: string): Promise<string> {
  const respuesta = await apiClient.post<{ exito: boolean; datos: { jwt: string; jwt_expira_en: string }; meta?: { timestamp?: string } }>(
    '/auth/token-servicios'
  );
  const { jwt, jwt_expira_en: expiraEn } = respuesta.data.datos;
  guardado = { jwt, venceEnMs: instanteDeVencimiento(expiraEn, respuesta.data.meta?.timestamp), sesion };
  return jwt;
}

/**
 * JWT vigente para la sesión actual; lo renueva si falta poco para que venza. Las peticiones que llegan mientras
 * se renueva comparten esa misma renovación.
 */
export function obtenerJwt(forzar = false): Promise<string> {
  const sesion = sesionActual();
  if (!sesion) return Promise.reject(new SinSesionError());

  if (!forzar && guardado && guardado.sesion === sesion && guardado.venceEnMs - Date.now() > MARGEN_DE_RENOVACION_MS) {
    return Promise.resolve(guardado.jwt);
  }
  if (renovacion && renovacion.sesion === sesion) return renovacion.promesa;

  const promesa = pedirJwt(sesion).finally(() => {
    if (renovacion?.promesa === promesa) renovacion = null;
  });
  renovacion = { sesion, promesa };
  return promesa;
}

/**
 * Módulos del plan que trae el JWT (`modulos`), para que la pantalla muestre desde el principio qué está incluido.
 * Solo es una pista de interfaz: no verifica la firma, y quien decide el acceso es cada servicio. `null` si no se puede leer.
 */
export function modulosDelJwt(jwt: string): string[] | null {
  try {
    const carga = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const modulos = JSON.parse(atob(carga.padEnd(Math.ceil(carga.length / 4) * 4, '='))).modulos;
    return Array.isArray(modulos) ? modulos.filter((m): m is string => typeof m === 'string') : null;
  } catch {
    return null;
  }
}

/** Olvida el JWT guardado (al cerrar sesión y en las pruebas). */
export function olvidarJwt(): void {
  guardado = null;
  renovacion = null;
}
