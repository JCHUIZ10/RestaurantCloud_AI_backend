/**
 * Utilidades para el QR oficial de Yape / Plin (estándar EMVCo Merchant-Presented Mode).
 *
 * El QR de cobro lo emite Yape y lleva un identificador de cuenta que no se puede inventar:
 * por eso aquí solo se lee y se valida el QR oficial que sube el local, nunca se genera uno.
 */
import jsQR from 'jsqr';

/**
 * Calcula el checksum CRC16-CCITT con polinomio 0x1021 y valor inicial 0xFFFF.
 * Requerido por la especificación EMVCo (Tag 63).
 */
export function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Longitud máxima aceptada para el contenido de un QR de pago. */
export const QR_PAYLOAD_MAX = 512;

/**
 * Indica si el texto es un payload EMVCo MPM íntegro: inicia con el indicador de formato,
 * termina con el tag 63 y su CRC16 coincide. Descarta URLs u otros QR que no son de pago.
 */
export function esPayloadEmvcoValido(payload: string): boolean {
  if (!payload || payload.length > QR_PAYLOAD_MAX || !payload.startsWith('000201')) return false;
  const corte = payload.length - 4;
  if (corte < 4 || payload.slice(corte - 4, corte) !== '6304') return false;
  return crc16Ccitt(payload.slice(0, corte)) === payload.slice(corte).toUpperCase();
}

/**
 * Lee el contenido del QR presente en una imagen. Devuelve null si no se detecta ninguno.
 */
export async function leerQrDeImagen(archivo: File): Promise<string | null> {
  const bitmap = await createImageBitmap(archivo);
  try {
    // Se reduce el lado mayor para acelerar la lectura sin perder legibilidad
    const escala = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    const { data } = ctx.getImageData(0, 0, ancho, alto);
    return jsQR(data, ancho, alto, { inversionAttempts: 'attemptBoth' })?.data ?? null;
  } finally {
    bitmap.close();
  }
}
