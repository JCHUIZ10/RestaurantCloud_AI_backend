/**
 * X-Request-Id: se conserva el que llega (lo genera Kong si falta) o se crea uno, y se devuelve en
 * la respuesta. Un valor que llega con caracteres raros o demasiado largo se reemplaza, para que no
 * se pueda inyectar texto en los logs a través de la cabecera.
 */

import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export const CABECERA_REQUEST_ID = 'x-request-id';

const VALIDO = /^[A-Za-z0-9._:-]{1,128}$/;

export function generarRequestId(request: IncomingMessage): string {
  const recibido = request.headers[CABECERA_REQUEST_ID];
  const valor = Array.isArray(recibido) ? recibido[0] : recibido;
  return valor && VALIDO.test(valor) ? valor : randomUUID();
}
