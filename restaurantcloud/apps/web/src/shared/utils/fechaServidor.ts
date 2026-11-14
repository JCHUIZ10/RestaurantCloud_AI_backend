import { hoyLocalStr } from './fechaLocal';

/**
 * Fecha de calendario del servidor.
 *
 * Las reglas del backend (un gasto no puede ser de una fecha futura, el efectivo de la gaveta se paga "hoy")
 * usan la fecha de la zona horaria de la aplicación; la del dispositivo puede diferir si el reloj o la zona
 * están mal. Cada respuesta de la API trae `meta.timestamp` (ISO con la zona del servidor): con la última
 * marca y el tiempo transcurrido desde que llegó se estima la hora del servidor sin pedirla aparte.
 */

interface MarcaServidor {
  /** Instante del servidor en ms desde epoch */
  instanteMs: number;
  /** Desfase de la zona del servidor respecto de UTC, en minutos */
  desfaseMin: number;
  /** Reloj del dispositivo (ms) cuando llegó la marca */
  recibidaMs: number;
}

let ultimaMarca: MarcaServidor | null = null;

/** Desfase en minutos de una marca ISO ("…-05:00" → -300, "…Z" → 0); null si no trae zona. */
function desfaseDeMarca(marca: string): number | null {
  if (/Z$/.test(marca)) return 0;
  const m = /([+-])(\d{2}):?(\d{2})$/.exec(marca);
  if (!m) return null;
  const minutos = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === '-' ? -minutos : minutos;
}

/** Guarda la marca de tiempo que devolvió el servidor (la llama el cliente HTTP en cada respuesta). */
export function registrarMarcaServidor(marcaIso: string, ahoraMs: number = Date.now()): void {
  const instanteMs = Date.parse(marcaIso);
  const desfaseMin = desfaseDeMarca(marcaIso);
  if (Number.isNaN(instanteMs) || desfaseMin === null) return;
  ultimaMarca = { instanteMs, desfaseMin, recibidaMs: ahoraMs };
}

/** Olvida la marca guardada (para pruebas). */
export function reiniciarMarcaServidor(): void {
  ultimaMarca = null;
}

/**
 * Hoy en la zona horaria del servidor como `YYYY-MM-DD`.
 * Mientras no haya respondido ninguna petición, usa la fecha local del dispositivo.
 */
export function hoyServidorStr(ahoraMs: number = Date.now()): string {
  if (!ultimaMarca) return hoyLocalStr();
  const instante = ultimaMarca.instanteMs + (ahoraMs - ultimaMarca.recibidaMs);
  // Se desplaza al horario del servidor y se leen los campos UTC, que ya son los de su calendario
  return new Date(instante + ultimaMarca.desfaseMin * 60_000).toISOString().slice(0, 10);
}
