/**
 * Firma de las peticiones servidor a servidor (doc-2u/servicios/README.md, sección 2).
 *
 * `X-Firma` es el HMAC-SHA256 en hexadecimal de `"{X-Timestamp}.{contenido}"` con el secreto del
 * servicio. El contenido son los bytes exactos del cuerpo, sin volver a serializarlo: un JSON con
 * otros espacios u otro orden de claves tiene otra firma. Misma regla que `app/soporte/firma.py` de
 * ms-analítica y que `App\Support\FirmaInterna` del núcleo.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { ErrorApi } from './respuestas.js';

export function calcularFirma(timestamp: string, contenido: Buffer, secreto: string): string {
  return createHmac('sha256', secreto)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), contenido]))
    .digest('hex');
}

function firmaInvalida(motivo: string): ErrorApi {
  return new ErrorApi(401, 'ERR_FIRMA_INVALIDA', motivo);
}

function cabecera(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export interface OpcionesFirma {
  secreto: string;
  toleranciaSegundos: number;
  /** Milisegundos desde 1970; se inyecta en las pruebas. */
  ahora?: number;
}

/** Lanza 401 `ERR_FIRMA_INVALIDA` si la firma falta, no coincide o el timestamp está fuera de plazo. */
export function verificarFirma(
  cabeceras: Record<string, string | string[] | undefined>,
  contenido: Buffer,
  { secreto, toleranciaSegundos, ahora = Date.now() }: OpcionesFirma,
): void {
  const timestamp = cabecera(cabeceras['x-timestamp']);
  const firma = cabecera(cabeceras['x-firma']);
  if (!timestamp || !firma) {
    throw firmaInvalida('Falta la firma de la petición.');
  }

  if (!/^\d{1,12}$/.test(timestamp)) {
    throw firmaInvalida('El timestamp no es válido.');
  }
  // La tolerancia vale hacia atrás y hacia adelante: un reloj adelantado tampoco se acepta sin límite.
  if (Math.abs(ahora / 1000 - Number(timestamp)) > toleranciaSegundos) {
    throw firmaInvalida('El timestamp está fuera del tiempo permitido.');
  }

  const esperada = Buffer.from(calcularFirma(timestamp, contenido, secreto), 'hex');
  const recibida = /^[0-9a-fA-F]{64}$/.test(firma) ? Buffer.from(firma, 'hex') : null;
  // timingSafeEqual exige el mismo largo; una firma mal formada se rechaza antes de comparar.
  if (recibida === null || !timingSafeEqual(esperada, recibida)) {
    throw firmaInvalida('La firma no coincide.');
  }
}
