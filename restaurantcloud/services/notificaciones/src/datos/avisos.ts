/**
 * Escritura de avisos en la colección `notificaciones`.
 *
 * El índice único `evento_id + destinatario` hace el trabajo de una tabla de eventos procesados: si el
 * mismo evento llega dos veces, la segunda inserción de cada aviso choca con el índice y se descarta.
 * Se inserta sin orden (`ordered: false`) para que un duplicado no impida guardar los demás avisos
 * del mismo evento; así un reintento completa un evento que quedó guardado a medias.
 */

import { MongoBulkWriteError, ObjectId, type Db, type WithId } from 'mongodb';
import type { Destinatario, Severidad } from '../dominio/reglas.js';
import { COLECCION_AVISOS } from './mongo.js';

const CLAVE_DUPLICADA = 11000;

export interface DocAviso {
  evento_id: string;
  empresa_id: string;
  local_id: string;
  destinatario: Destinatario;
  tipo: string;
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  datos: Record<string, unknown>;
  leida_por: { usuario_id: string; en: Date }[];
  creada_en: Date;
  expira_en: Date;
}

export interface ResultadoInsercion {
  /** Avisos nuevos, con su `_id`: los que el canal SSE debe repartir. */
  insertados: WithId<DocAviso>[];
  duplicados: number;
}

export async function insertarAvisos(db: Db, avisos: DocAviso[]): Promise<ResultadoInsercion> {
  if (avisos.length === 0) return { insertados: [], duplicados: 0 };

  // El _id se asigna aquí para saber cuál de los documentos quedó guardado aunque falle otro.
  const documentos: WithId<DocAviso>[] = avisos.map((aviso) => ({ _id: new ObjectId(), ...aviso }));
  try {
    await db.collection<DocAviso>(COLECCION_AVISOS).insertMany(documentos, { ordered: false });
    return { insertados: documentos, duplicados: 0 };
  } catch (error) {
    if (!(error instanceof MongoBulkWriteError)) throw error;
    const fallos = Array.isArray(error.writeErrors) ? error.writeErrors : [error.writeErrors];
    // Solo los duplicados son esperables; cualquier otro fallo (validador, red) se propaga.
    if (fallos.length === 0 || fallos.some((f) => f.code !== CLAVE_DUPLICADA)) throw error;
    const repetidos = new Set(fallos.map((f) => f.index));
    return {
      insertados: documentos.filter((_, i) => !repetidos.has(i)),
      duplicados: repetidos.size,
    };
  }
}
