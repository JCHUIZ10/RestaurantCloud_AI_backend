/**
 * Utilidades para manejo y generación de enlaces de WhatsApp en formato internacional (E.164)
 * y normalización de números móviles en Perú.
 */

/**
 * Extrae limpiamente los dígitos móviles peruanos (hasta 9) sin importar si la cadena
 * contiene "+51", "51" o espaciado, evitando bucles de re-ingesta durante el tipeo.
 *
 * @param raw Cadena de entrada (ej: "+51 987", "987654321", "51987654321")
 * @returns Cadena con hasta 9 dígitos peruanos limpios
 */
export function extraerDigitosMovilPeru(raw: string): string {
  if (!raw) return '';
  let limpio = raw.trim();

  // Si inicia con el prefijo internacional "+51", removerlo explícitamente primero
  if (limpio.startsWith('+51')) {
    limpio = limpio.substring(3);
  } else {
    // Si viene solo con dígitos y tiene 11 dígitos iniciando con 51 (ej. "51987654321")
    const soloNumeros = limpio.replace(/\D/g, '');
    if (soloNumeros.length === 11 && soloNumeros.startsWith('51')) {
      limpio = soloNumeros.substring(2);
    }
  }

  // Devolver solo dígitos, limitados a los 9 de telefonía móvil peruana
  return limpio.replace(/\D/g, '').slice(0, 9);
}

/**
 * Formatea una cadena de hasta 9 dígitos peruanos en grupos progresivos 3-3-3 ("987 654 321")
 * de manera limpia mientras el usuario escribe o borra.
 *
 * @param digitsOrRaw Cadena con dígitos o teléfono crudo
 * @returns Cadena formateada para la vista (ej: "9", "987", "987 6", "987 654 321")
 */
export function formatearTelefonoPeru(digitsOrRaw: string): string {
  const digits = extraerDigitosMovilPeru(digitsOrRaw);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Genera un enlace canónico de WhatsApp (https://wa.me/51...) a prueba de fallos.
 * Acepta cualquier formato común ("+51 987 654 321", "987654321", "51987654321", "+51987654321")
 * y retorna siempre la URL limpia sin signos '+', espacios ni caracteres no numéricos.
 *
 * @param telefono Número de teléfono móvil
 * @param mensaje Mensaje inicial opcional codificado para la URL
 * @returns URL oficial de WhatsApp wa.me
 */
export function generarEnlaceWhatsApp(telefono: string, mensaje?: string): string {
  const digitos = telefono.replace(/\D/g, '');
  if (!digitos) return '';

  // En Perú el número nacional consta de 9 dígitos.
  // Si ya tiene el código de país 51 al inicio y 11 dígitos en total, se mantiene.
  // En cualquier otro caso, se extraen los últimos 9 dígitos y se añade 51.
  const numeroLimpio =
    digitos.length === 11 && digitos.startsWith('51')
      ? digitos
      : `51${digitos.slice(-9)}`;

  const baseUrl = `https://wa.me/${numeroLimpio}`;
  return mensaje ? `${baseUrl}?text=${encodeURIComponent(mensaje)}` : baseUrl;
}
