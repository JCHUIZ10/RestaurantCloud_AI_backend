/**
 * N° de operación de las constancias de Yape / Plin. Mismo criterio que el backend
 * (MetodoPagoLocalService::REGEX_NUMERO_OPERACION): 4 a 30 letras, números o guiones.
 */
const REGEX_NUMERO_OPERACION = /^[A-Z0-9-]{4,30}$/;

/** Quita espacios y pasa a mayúsculas. */
export function normalizarNumeroOperacion(numero: string | null | undefined): string {
  return (numero ?? '').replace(/\s+/g, '').toUpperCase();
}

export function esNumeroOperacionValido(numero: string | null | undefined): boolean {
  return REGEX_NUMERO_OPERACION.test(normalizarNumeroOperacion(numero));
}
