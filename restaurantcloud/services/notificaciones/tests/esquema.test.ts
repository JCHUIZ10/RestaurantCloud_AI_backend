/**
 * Esquema de la colección contra MongoDB real: validador, índices, idempotencia y permisos del
 * usuario de la aplicación.
 */

import { MongoServerError, type Collection, type Document } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { aplicarEsquema, INDICES } from '../src/datos/esquema.js';
import { COLECCION_AVISOS } from '../src/datos/mongo.js';
import { avisoValido, conectarPruebas, type ConexionesPrueba } from './ayudas.js';

const VALIDACION_FALLIDA = 121;
const CLAVE_DUPLICADA = 11000;
const NO_AUTORIZADO = 13;

let conexiones: ConexionesPrueba;
let avisosApp: Collection<Document>;

async function codigoDeError(promesa: Promise<unknown>): Promise<number | undefined> {
  try {
    await promesa;
  } catch (error) {
    if (error instanceof MongoServerError) return error.code as number;
    throw error;
  }
  return undefined;
}

beforeAll(async () => {
  conexiones = conectarPruebas();
  // Se parte de una base vacía para comprobar también la creación de la colección.
  await conexiones.dbAdmin.collection(COLECCION_AVISOS).drop().catch(() => undefined);
  avisosApp = conexiones.dbApp.collection(COLECCION_AVISOS);
});

afterAll(async () => {
  await conexiones?.cerrar();
});

describe('aplicarEsquema', () => {
  it('crea la colección y los índices, y repetirlo no cambia nada', async () => {
    const primera = await aplicarEsquema(conexiones.dbAdmin);
    expect(primera.coleccion).toBe('creada');
    expect(primera.indicesCreados).toEqual(INDICES.map((i) => i.name));

    const segunda = await aplicarEsquema(conexiones.dbAdmin);
    expect(segunda.coleccion).toBe('actualizada');
    expect(segunda.indicesCreados).toEqual([]);
    expect(segunda.indicesExistentes).toEqual(INDICES.map((i) => i.name));
  });

  it('deja los índices con la definición de la ficha', async () => {
    const indices = await conexiones.dbAdmin.collection(COLECCION_AVISOS).listIndexes().toArray();
    const porNombre = new Map(indices.map((i) => [i['name'] as string, i]));

    expect(porNombre.get('evento_destinatario_unico')?.['unique']).toBe(true);
    expect(porNombre.get('evento_destinatario_unico')?.['key']).toEqual({
      evento_id: 1,
      'destinatario.rol': 1,
      'destinatario.usuario_id': 1,
    });
    expect(porNombre.get('caducidad')?.['expireAfterSeconds']).toBe(0);
    expect(porNombre.get('bandeja_usuario')?.['partialFilterExpression']).toEqual({ 'destinatario.tipo': 'usuario' });
    expect(porNombre.get('bandeja_rol')?.['key']).toEqual({ local_id: 1, 'destinatario.rol': 1, creada_en: -1 });
  });

  it('informa el conflicto si un índice existe con otra definición, sin cambiarlo', async () => {
    const coleccion = conexiones.dbAdmin.collection(COLECCION_AVISOS);
    await coleccion.dropIndex('caducidad');
    await coleccion.createIndex({ expira_en: 1 }, { name: 'caducidad', expireAfterSeconds: 3600 });
    try {
      await expect(aplicarEsquema(conexiones.dbAdmin)).rejects.toThrow();
      const indice = (await coleccion.listIndexes().toArray()).find((i) => i['name'] === 'caducidad');
      expect(indice?.['expireAfterSeconds']).toBe(3600);
    } finally {
      await coleccion.dropIndex('caducidad');
      await aplicarEsquema(conexiones.dbAdmin);
    }
  });
});

describe('validador', () => {
  beforeEach(async () => {
    await avisosApp.deleteMany({});
  });

  it('acepta un aviso a un rol y uno personal', async () => {
    await avisosApp.insertOne(avisoValido());
    await avisosApp.insertOne(
      avisoValido({
        tipo: 'plato.listo',
        severidad: 'info',
        destinatario: { tipo: 'usuario', rol: null, usuario_id: '00000000-0000-4000-8000-000000000103' },
      }),
    );
    expect(await avisosApp.countDocuments()).toBe(2);
  });

  it.each([
    ['una severidad desconocida', { severidad: 'urgente' }],
    ['un evento_id que no es uuid', { evento_id: 'evento-1' }],
    ['una empresa que no es uuid', { empresa_id: 'aurea' }],
    ['un rol sin bandeja', { destinatario: { tipo: 'rol', rol: 'admin_saas', usuario_id: null } }],
    [
      'un aviso a un rol que también nombra a una persona',
      { destinatario: { tipo: 'rol', rol: 'mozo', usuario_id: '00000000-0000-4000-8000-000000000103' } },
    ],
    ['un aviso personal sin persona', { destinatario: { tipo: 'usuario', rol: null, usuario_id: null } }],
    [
      'un aviso personal que también va a un rol',
      { destinatario: { tipo: 'usuario', rol: 'mozo', usuario_id: '00000000-0000-4000-8000-000000000103' } },
    ],
    [
      'un destinatario con campos de más',
      { destinatario: { tipo: 'rol', rol: 'mozo', usuario_id: null, nombre: 'Lucía' } },
    ],
    ['un título de más de 120 caracteres', { titulo: 'x'.repeat(121) }],
    ['una fecha guardada como texto', { creada_en: '2026-11-16T21:40:11-05:00' }],
    ['una lectura sin fecha', { leida_por: [{ usuario_id: '00000000-0000-4000-8000-000000000105' }] }],
  ])('rechaza %s', async (_caso, cambios) => {
    expect(await codigoDeError(avisosApp.insertOne(avisoValido(cambios)))).toBe(VALIDACION_FALLIDA);
  });

  it.each(['datos', 'leida_por', 'expira_en', 'local_id'])('rechaza un aviso sin %s', async (campo) => {
    const aviso = avisoValido();
    delete aviso[campo];
    expect(await codigoDeError(avisosApp.insertOne(aviso))).toBe(VALIDACION_FALLIDA);
  });

  it('valida también las actualizaciones (marcar leída con datos incorrectos)', async () => {
    const { insertedId } = await avisosApp.insertOne(avisoValido());
    const actualizacion = avisosApp.updateOne(
      { _id: insertedId },
      { $addToSet: { leida_por: { usuario_id: 'no-es-uuid', en: new Date() } } },
    );
    expect(await codigoDeError(actualizacion)).toBe(VALIDACION_FALLIDA);
  });
});

describe('índice único', () => {
  beforeEach(async () => {
    await avisosApp.deleteMany({});
  });

  it('impide crear dos veces el aviso de un evento para el mismo destinatario', async () => {
    await avisosApp.insertOne(avisoValido());
    expect(await codigoDeError(avisosApp.insertOne(avisoValido()))).toBe(CLAVE_DUPLICADA);
  });

  it('permite el mismo evento para destinatarios distintos', async () => {
    await avisosApp.insertMany([
      avisoValido(),
      avisoValido({ destinatario: { tipo: 'rol', rol: 'propietario', usuario_id: null } }),
      avisoValido({ destinatario: { tipo: 'usuario', rol: null, usuario_id: '00000000-0000-4000-8000-000000000103' } }),
    ]);
    expect(await avisosApp.countDocuments()).toBe(3);
  });
});

describe('permisos del usuario de la aplicación', () => {
  it('lee, inserta, actualiza y borra avisos', async () => {
    await avisosApp.deleteMany({});
    const { insertedId } = await avisosApp.insertOne(avisoValido());
    await avisosApp.updateOne(
      { _id: insertedId },
      { $addToSet: { leida_por: { usuario_id: '00000000-0000-4000-8000-000000000105', en: new Date() } } },
    );
    expect((await avisosApp.findOne({ _id: insertedId }))?.['leida_por']).toHaveLength(1);
    await avisosApp.deleteOne({ _id: insertedId });
  });

  it('no puede cambiar el validador', async () => {
    const intento = conexiones.dbApp.command({ collMod: COLECCION_AVISOS, validator: {} });
    expect(await codigoDeError(intento)).toBe(NO_AUTORIZADO);
  });

  it('no puede borrar la colección ni crear índices', async () => {
    expect(await codigoDeError(avisosApp.drop())).toBe(NO_AUTORIZADO);
    expect(await codigoDeError(avisosApp.createIndex({ titulo: 1 }))).toBe(NO_AUTORIZADO);
  });

  it('no puede saltarse el validador', async () => {
    const intento = avisosApp.insertOne(avisoValido({ severidad: 'urgente' }), { bypassDocumentValidation: true });
    expect(await codigoDeError(intento)).toBe(NO_AUTORIZADO);
  });

  it('no puede leer otras colecciones de la base', async () => {
    await conexiones.dbAdmin.collection('otra').insertOne({ x: 1 });
    try {
      expect(await codigoDeError(conexiones.dbApp.collection('otra').findOne({}))).toBe(NO_AUTORIZADO);
    } finally {
      await conexiones.dbAdmin.collection('otra').drop();
    }
  });
});
