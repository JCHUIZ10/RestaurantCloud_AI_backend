/**
 * Construcción de la aplicación Fastify. Recibe sus dependencias (configuración y base) para que las
 * pruebas la levanten con una base de prueba sin tocar el entorno.
 */

import Fastify, { LogController, type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { Db } from 'mongodb';
import { rutasEventos } from './api/eventos.js';
import { rutasNotificaciones } from './api/notificaciones.js';
import { rutasSalud } from './api/salud.js';
import type { Config } from './config.js';
import { Reparto } from './dominio/reparto.js';
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
    // Al apagar, los canales SSE abiertos no deben retener el cierre del servidor.
    forceCloseConnections: true,
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header(CABECERA_REQUEST_ID, request.id);
  });

  registrarManejadores(app, config.zonaHoraria);
  rutasSalud(app, db, config.zonaHoraria);
  const reparto = new Reparto();
  // Un fallo al repartir por SSE nunca debe convertir en error un evento ya guardado.
  rutasEventos(app, db, config, (avisos) =>
    reparto.repartir(avisos, (error) => app.log.error({ err: error }, 'No se pudo repartir un aviso por SSE')),
  );
  rutasNotificaciones(app, db, config, reparto);

  return app;
}
