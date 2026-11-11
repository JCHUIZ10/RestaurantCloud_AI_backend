/**
 * Mensaje legible de un error de la API: contrato propio (`errores[0].mensaje`), validación
 * de Laravel (`errors`: primer mensaje del primer campo) o `message`. Si no hay ninguno,
 * devuelve el texto por defecto.
 */
/** Código de negocio del error (`errores[0].codigo`), si la API lo envió. */
export function codigoDeErrorApi(error: unknown): string | undefined {
  return (error as { response?: { data?: any } } | null)?.response?.data?.errores?.[0]?.codigo;
}

/**
 * Todos los mensajes de un error de la API, sin repetidos: los de validación de Laravel (`errors`, uno o más
 * por campo), los del contrato propio (`errores[].mensaje`) o `message`. Lista vacía si no hay ninguno.
 */
export function mensajesDeValidacionApi(error: unknown): string[] {
  const data = (error as { response?: { data?: any } } | null)?.response?.data;
  if (!data) return [];

  const deLaravel = data.errors ? (Object.values(data.errors) as string[][]).flat() : [];
  const delContrato = Array.isArray(data.errores) ? data.errores.map((e: { mensaje?: string }) => e.mensaje) : [];
  const unicos = [...deLaravel, ...delContrato].filter((m): m is string => typeof m === 'string' && m !== '');

  if (unicos.length === 0 && typeof data.message === 'string' && data.message !== '') return [data.message];

  return [...new Set(unicos)];
}

export function mensajeDeErrorApi(error: unknown, porDefecto: string): string {
  const data = (error as { response?: { data?: any } } | null)?.response?.data;
  if (!data) return porDefecto;

  const delContrato = data.errores?.[0]?.mensaje;
  const primerCampo = data.errors ? (Object.values(data.errors)[0] as string[] | undefined)?.[0] : undefined;

  return delContrato || primerCampo || data.message || porDefecto;
}
