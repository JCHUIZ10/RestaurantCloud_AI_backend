/**
 * Formato de respuesta común a todos los servicios (doc-2u/servicios/README.md, sección 2), el
 * mismo que `App\Support\ApiResponse` del núcleo, para que el frontend trate igual a todos.
 */

import type { FastifyError, FastifyInstance, FastifyReply } from 'fastify';
import { MongoError } from 'mongodb';
import { instanteConZona } from './fechas.js';

export class ErrorApi extends Error {
  override name = 'ErrorApi';

  constructor(
    readonly status: number,
    readonly codigo: string,
    mensaje: string,
    readonly detalles: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }
}

export function meta(zona: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { timestamp: instanteConZona(new Date(), zona), ...extra };
}

export function cuerpoOk(datos: unknown, zona: string, metaExtra: Record<string, unknown> = {}) {
  return { exito: true, datos, meta: meta(zona, metaExtra) };
}

export function cuerpoError(codigo: string, mensaje: string, zona: string, detalles: Record<string, unknown> = {}) {
  return { exito: false, errores: [{ codigo, mensaje, detalles }], meta: meta(zona) };
}

export function responderOk(
  reply: FastifyReply,
  datos: unknown,
  zona: string,
  status = 200,
  metaExtra: Record<string, unknown> = {},
) {
  return reply.code(status).send(cuerpoOk(datos, zona, metaExtra));
}

/**
 * Errores de conexión con MongoDB: el servidor no se encuentra, la red se cortó o el cliente está
 * cerrado. Un error de la consulta en sí (validación del esquema, clave duplicada) no entra aquí.
 */
export function esBaseNoDisponible(error: unknown): boolean {
  if (!(error instanceof MongoError)) return false;
  return [
    'MongoServerSelectionError',
    'MongoNetworkError',
    'MongoNetworkTimeoutError',
    'MongoNotConnectedError',
    'MongoTopologyClosedError',
  ].includes(error.name);
}

export function registrarManejadores(app: FastifyInstance, zona: string): void {
  app.setErrorHandler((error: FastifyError | ErrorApi | Error, request, reply) => {
    if (error instanceof ErrorApi) {
      return reply.code(error.status).send(cuerpoError(error.codigo, error.message, zona, error.detalles));
    }

    if (esBaseNoDisponible(error)) {
      request.log.error({ err: error }, 'MongoDB no disponible');
      return reply.code(503).send(cuerpoError('ERR_BD_NO_DISPONIBLE', 'La base de datos no está disponible.', zona));
    }

    const errorFastify = error as FastifyError;
    if (errorFastify.validation) {
      const campos = errorFastify.validation.map((v) => ({
        campo: (v.instancePath || String(v.params?.['missingProperty'] ?? '')).replace(/^\//, '').replaceAll('/', '.'),
        motivo: v.message ?? 'no es válido',
      }));
      return reply
        .code(422)
        .send(cuerpoError('ERR_VALIDACION', 'Los datos enviados no son válidos.', zona, { campos }));
    }

    // Cuerpo que no es JSON, tipo de contenido no admitido, cuerpo demasiado grande…
    if (errorFastify.statusCode && errorFastify.statusCode >= 400 && errorFastify.statusCode < 500) {
      return reply
        .code(errorFastify.statusCode)
        .send(cuerpoError('ERR_PETICION_INVALIDA', 'La petición no está bien formada.', zona));
    }

    request.log.error({ err: error }, 'Error no controlado');
    return reply.code(500).send(cuerpoError('ERR_INTERNO', 'Ocurrió un error inesperado.', zona));
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send(cuerpoError('ERR_RUTA_NO_ENCONTRADA', 'La ruta no existe.', zona));
  });
}
