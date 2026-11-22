/**
 * Esquema de la colección de avisos (ficha del servicio, sección 2): validador `$jsonSchema` e
 * índices. Es el equivalente de las migraciones de Alembic de los servicios Python.
 *
 * Lo aplica un proceso de una sola pasada con el usuario administrador (`src/esquema.ts`); el
 * servicio no tiene permiso para cambiarlo. Aplicarlo varias veces deja siempre el mismo resultado:
 * crea la colección si no existe, si existe reemplaza su validador (`collMod`) y crea los índices
 * que falten. Un índice que ya existe con otra definición no se toca: se informa el conflicto,
 * porque cambiar un índice único o el TTL es una decisión, no algo que deba pasar solo.
 */

import type { Db, Document, IndexDescription } from 'mongodb';
import { COLECCION_AVISOS } from './mongo.js';

const UUID = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

export const ROLES_CON_BANDEJA = ['propietario', 'admin_local', 'cajero', 'mozo', 'cocina'] as const;
export const SEVERIDADES = ['info', 'alerta', 'critica'] as const;

export const VALIDADOR: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'evento_id',
      'empresa_id',
      'local_id',
      'destinatario',
      'tipo',
      'severidad',
      'titulo',
      'mensaje',
      'datos',
      'leida_por',
      'creada_en',
      'expira_en',
    ],
    properties: {
      evento_id: { bsonType: 'string', pattern: UUID },
      empresa_id: { bsonType: 'string', pattern: UUID },
      local_id: { bsonType: 'string', pattern: UUID },
      destinatario: {
        bsonType: 'object',
        required: ['tipo', 'rol', 'usuario_id'],
        additionalProperties: false,
        properties: {
          tipo: { enum: ['rol', 'usuario'] },
          rol: { enum: [...ROLES_CON_BANDEJA, null] },
          usuario_id: { bsonType: ['string', 'null'] },
        },
        // Un aviso a un rol no nombra a una persona, y uno personal no se dirige a un rol.
        oneOf: [
          {
            properties: {
              tipo: { enum: ['rol'] },
              rol: { bsonType: 'string' },
              usuario_id: { bsonType: 'null' },
            },
          },
          {
            properties: {
              tipo: { enum: ['usuario'] },
              rol: { bsonType: 'null' },
              usuario_id: { bsonType: 'string', pattern: UUID },
            },
          },
        ],
      },
      tipo: { bsonType: 'string', minLength: 1, maxLength: 60 },
      severidad: { enum: [...SEVERIDADES] },
      titulo: { bsonType: 'string', minLength: 1, maxLength: 120 },
      mensaje: { bsonType: 'string', minLength: 1, maxLength: 1000 },
      datos: { bsonType: 'object' },
      leida_por: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['usuario_id', 'en'],
          additionalProperties: false,
          properties: {
            usuario_id: { bsonType: 'string', pattern: UUID },
            en: { bsonType: 'date' },
          },
        },
      },
      creada_en: { bsonType: 'date' },
      expira_en: { bsonType: 'date' },
    },
  },
};

export const INDICES: IndexDescription[] = [
  {
    // Bandeja de los avisos dirigidos a un rol en una sede.
    name: 'bandeja_rol',
    key: { local_id: 1, 'destinatario.rol': 1, creada_en: -1 },
  },
  {
    // Bandeja del propietario: su rol en todas las sedes de su empresa.
    name: 'bandeja_rol_empresa',
    key: { empresa_id: 1, 'destinatario.rol': 1, creada_en: -1 },
  },
  {
    // Bandeja de los avisos personales; solo indexa esos.
    name: 'bandeja_usuario',
    key: { 'destinatario.usuario_id': 1, creada_en: -1 },
    partialFilterExpression: { 'destinatario.tipo': 'usuario' },
  },
  {
    // Un mismo evento no crea dos veces el mismo aviso: reemplaza a una tabla de eventos procesados.
    name: 'evento_destinatario_unico',
    key: { evento_id: 1, 'destinatario.rol': 1, 'destinatario.usuario_id': 1 },
    unique: true,
  },
  {
    // MongoDB borra el aviso cuando llega `expira_en`.
    name: 'caducidad',
    key: { expira_en: 1 },
    expireAfterSeconds: 0,
  },
];

export interface ResultadoEsquema {
  coleccion: 'creada' | 'actualizada';
  indicesCreados: string[];
  indicesExistentes: string[];
}

export async function aplicarEsquema(db: Db): Promise<ResultadoEsquema> {
  const existe = (await db.listCollections({ name: COLECCION_AVISOS }, { nameOnly: true }).toArray()).length > 0;

  if (existe) {
    await db.command({
      collMod: COLECCION_AVISOS,
      validator: VALIDADOR,
      validationLevel: 'strict',
      validationAction: 'error',
    });
  } else {
    await db.createCollection(COLECCION_AVISOS, {
      validator: VALIDADOR,
      validationLevel: 'strict',
      validationAction: 'error',
    });
  }

  const coleccion = db.collection(COLECCION_AVISOS);
  const previos = new Set((await coleccion.listIndexes().toArray()).map((i) => String(i['name'])));
  // createIndexes no hace nada con un índice idéntico y falla si el nombre existe con otra
  // definición (IndexOptionsConflict o IndexKeySpecsConflict): ese error llega al llamador.
  await coleccion.createIndexes(INDICES);

  const nombres = INDICES.map((i) => i.name as string);
  return {
    coleccion: existe ? 'actualizada' : 'creada',
    indicesCreados: nombres.filter((n) => !previos.has(n)),
    indicesExistentes: nombres.filter((n) => previos.has(n)),
  };
}
