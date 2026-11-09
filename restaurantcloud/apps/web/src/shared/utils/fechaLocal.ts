/**
 * Fechas de calendario `YYYY-MM-DD` en la hora local del dispositivo.
 *
 * Evita `toISOString()`, que devuelve la fecha en UTC: en Lima (UTC-5), desde las 19:00
 * "hoy" pasaría a ser el día siguiente.
 */

/** Fecha local de hoy como `YYYY-MM-DD`. */
export function hoyLocalStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** Suma (o resta) días a una fecha `YYYY-MM-DD` sin pasar por UTC. */
export function sumarDiasStr(fechaStr: string, dias: number): string {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia + dias).toLocaleDateString('en-CA');
}

/** Texto largo de una fecha `YYYY-MM-DD` (ej. "09 de noviembre de 2026"). */
export function fechaLargaStr(fechaStr: string): string {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** "Hoy", "Mañana", "Ayer" o null si la fecha no es cercana a la fecha de referencia. */
export function relativoDeFecha(fechaStr: string, referenciaStr: string = hoyLocalStr()): string | null {
  if (fechaStr === referenciaStr) return 'Hoy';
  if (fechaStr === sumarDiasStr(referenciaStr, 1)) return 'Mañana';
  if (fechaStr === sumarDiasStr(referenciaStr, -1)) return 'Ayer';
  return null;
}

/** Etiqueta para cabeceras: "Hoy, 09 de noviembre de 2026" o solo la fecha larga. */
export function etiquetaRelativaFecha(fechaStr: string, referenciaStr?: string): string {
  const relativo = relativoDeFecha(fechaStr, referenciaStr);
  const larga = fechaLargaStr(fechaStr);
  return relativo ? `${relativo}, ${larga}` : larga;
}
