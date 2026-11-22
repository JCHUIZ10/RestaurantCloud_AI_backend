/**
 * Construcción de la aplicación Fastify. Recibe sus dependencias (configuración y base) para que las
 * pruebas la levanten con una base de prueba sin tocar el entorno.
 */

import Fastify, { LogController, type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { Db } from 'mongodb';
import { rutasSalud } from './api/salud.js';
import type { Config } from './config.js';
import { CABECERA_REQUEST_ID, generarRequestId } from './soporte/request-id.js';
import { registrarManejadores } from './soporte/respuestas.js';

export interface Dependencias {
  config: Config;
  db: Db;
  /** `false` en las pruebas; por defecto, logs JSON en stdout. */
  logs?: boolean;
}

function opcionesDeLog(config: Config): FastifyServerOptions['logger'] {
  return {
    level: config.nivelLog,
    messageKey: 'mensaje',
    base: { servicio: 'ms-notificaciones' },
    timestamp: () => `,"ts":"${new Date().toISOString()}"`,
    formatters: { level: (nivel: string) => ({ nivel }) },
  };
}

export function crearApp({ config, db, logs = true }: Dependencias): FastifyInstance {
  const app = Fastify({
    logger: logs ? opcionesDeLog(config) : false,
    genReqId: generarRequestId,
    // Como ms-analítica: sin una línea por petición; se registran los errores con su request_id.
    logController: new LogController({ requestIdLogLabel: 'request_id', disableRequestLogging: true }),
    bodyLimit: 256 * 1024,
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header(CABECERA_REQUEST_ID, request.id);
  });

  registrarManejadores(app, config.zonaHoraria);
  rutasSalud(app, db, config.zonaHoraria);

  return app;
}
