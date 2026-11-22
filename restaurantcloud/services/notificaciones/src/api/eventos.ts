/**
 * `POST /interno/eventos`: recibe un evento firmado del núcleo y lo convierte en avisos
 * (ficha del servicio, sección 3).
 *
 * El cuerpo llega como bytes, sin parsear: la firma se comprueba sobre los bytes exactos y antes de
 * interpretar nada. Las respuestas son las mismas que las de ms-analítica: 202 `aceptado`,
 * 200 `duplicado` y 200 `ignorado`.
 */

import type { FastifyInstance } from 'fastify';
import type { Db, WithId } from 'mongodb';
import type { Config } from '../config.js';
import { insertarAvisos, type DocAviso } from '../datos/avisos.js';
import { construirAvisos, EventoInvalido, interpretar } from '../dominio/procesador.js';
import { verificarFirma } from '../soporte/firma.js';
import { ErrorApi, responderOk } from '../soporte/respuestas.js';

/** Se llama con los avisos recién guardados; el canal SSE (7.4) los reparte a las conexiones abiertas. */
export type AlInsertar = (avisos: WithId<DocAviso>[]) => void;

export function rutasEventos(app: FastifyInstance, db: Db, config: Config, alInsertar: AlInsertar = () => {}): void {
  // Plugin propio: el parser de bytes vale solo para estas rutas; el resto sigue recibiendo JSON.
  // Cualquier tipo de contenido llega como bytes: la firma decide, y el JSON se interpreta después.
  app.register(async (interno) => {
    interno.removeAllContentTypeParsers();
    interno.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, cuerpo, hecho) => {
      hecho(null, cuerpo);
    });

    interno.post('/interno/eventos', async (request, reply) => {
      const cuerpo = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
      verificarFirma(request.headers, cuerpo, {
        secreto: config.secretoInterno,
        toleranciaSegundos: config.firmaToleranciaSegundos,
      });

      let interpretacion;
      try {
        interpretacion = interpretar(cuerpo);
      } catch (error) {
        if (error instanceof EventoInvalido) {
          throw new ErrorApi(422, 'ERR_EVENTO_INVALIDO', error.message, { campos: error.campos });
        }
        throw error;
      }

      const { sobre } = interpretacion;
      const base = { evento_id: sobre.id };
      if (interpretacion.estado === 'ignorado') {
        return responderOk(reply, { estado: 'ignorado', ...base, avisos_creados: 0 }, config.zonaHoraria);
      }

      const avisos = construirAvisos(sobre, interpretacion.tipo, interpretacion.datos, config.diasRetencion);
      if (avisos.length === 0) {
        return responderOk(reply, { estado: 'ignorado', ...base, avisos_creados: 0 }, config.zonaHoraria);
      }

      // La inserción termina antes de responder: un 202 significa que los avisos quedaron guardados.
      const { insertados, duplicados } = await insertarAvisos(db, avisos);
      if (insertados.length === 0) {
        return responderOk(reply, { estado: 'duplicado', ...base, avisos_creados: 0 }, config.zonaHoraria);
      }

      request.log.info(
        { evento_id: sobre.id, tipo: sobre.tipo, avisos_creados: insertados.length, duplicados },
        'Evento convertido en avisos',
      );
      alInsertar(insertados);
      return responderOk(
        reply,
        { estado: 'aceptado', ...base, avisos_creados: insertados.length },
        config.zonaHoraria,
        202,
      );
    });
  });
}
