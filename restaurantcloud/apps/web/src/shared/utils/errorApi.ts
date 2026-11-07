/**
 * Mensaje legible de un error de la API: contrato propio (`errores[0].mensaje`), validación
 * de Laravel (`errors`: primer mensaje del primer campo) o `message`. Si no hay ninguno,
 * devuelve el texto por defecto.
 */
/** Código de negocio del error (`errores[0].codigo`), si la API lo envió. */
export function codigoDeErrorApi(error: unknown): string | undefined {
  return (error as { response?: { data?: any } } | null)?.response?.data?.errores?.[0]?.codigo;
}

export function mensajeDeErrorApi(error: unknown, porDefecto: string): string {
  const data = (error as { response?: { data?: any } } | null)?.response?.data;
  if (!data) return porDefecto;

  const delContrato = data.errores?.[0]?.mensaje;
  const primerCampo = data.errors ? (Object.values(data.errors)[0] as string[] | undefined)?.[0] : undefined;

  return delContrato || primerCampo || data.message || porDefecto;
}
