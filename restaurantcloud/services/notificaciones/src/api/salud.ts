import type { FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';
import { comprobarConexion } from '../datos/mongo.js';
import { responderOk } from '../soporte/respuestas.js';

/** Estado del servicio. Sin autenticación; comprueba que MongoDB responde (503 si no). */
export function rutasSalud(app: FastifyInstance, db: Db, zona: string): void {
  app.get('/health', async (_request, reply) => {
    await comprobarConexion(db);
    return responderOk(reply, { estado: 'ok', servicio: 'ms-notificaciones' }, zona);
  });
}
