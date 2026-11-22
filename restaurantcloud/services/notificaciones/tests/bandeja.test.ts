/**
 * Bandeja del navegador contra MongoDB real: quién ve qué (empresa, sede, rol y usuario), leído por
 * usuario, validación de parámetros y errores de autenticación en las cinco rutas.
 */

import type { FastifyInstance } from 'fastify';
import { ObjectId, type Collection, type Document } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { aplicarEsquema } from '../src/datos/esquema.js';
import { esVisible, filtroVisible, type ContextoBandeja } from '../src/datos/bandeja.js';
import { COLECCION_AVISOS } from '../src/datos/mongo.js';
import {
  ADMIN,
  CLAVES,
  COCINERO,
  EMPRESA,
  MOZO,
  OTRA_EMPRESA,
  OTRA_SEDE,
  OTRO_MOZO,
  PROPIETARIO,
  SEDE,
  avisoDe,
  conBearer,
  conectarPruebas,
  configPrueba,
  emitirToken,
  type ConexionesPrueba,
  type OpcionesToken,
} from './ayudas.js';

let conexiones: ConexionesPrueba;
let app: FastifyInstance;
let avisos: Collection<Document>;

beforeAll(async () => {
  conexiones = conectarPruebas();
  await aplicarEsquema(conexiones.dbAdmin);
  avisos = conexiones.dbAdmin.collection(COLECCION_AVISOS);
  app = crearApp({ config: configPrueba({ jwtPublicKey: CLAVES.publica }), db: conexiones.dbApp, logs: false });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  await conexiones?.cerrar();
});

const rol = (r: string, local: string, empresa = EMPRESA) => ({
  empresa_id: empresa,
  local_id: local,
  destinatario: { tipo: 'rol', rol: r, usuario_id: null },
});
const usuario = (id: string, local: string, empresa = EMPRESA) => ({
  empresa_id: empresa,
  local_id: local,
  destinatario: { tipo: 'usuario', rol: null, usuario_id: id },
});

/** Un aviso por cada combinación que importa; el título es la letra para reconocerlos. */
async function sembrar(): Promise<Record<string, string>> {
  const base = Date.now();
  const filas: Record<string, Record<string, unknown>> = {
    A: rol('mozo', SEDE),
    B: rol('mozo', OTRA_SEDE),
    C: rol('mozo', SEDE, OTRA_EMPRESA),
    D: rol('admin_local', SEDE),
    E: usuario(MOZO, SEDE),
    F: usuario(OTRO_MOZO, SEDE),
    G: rol('propietario', SEDE),
    H: rol('propietario', OTRA_SEDE),
    I: rol('propietario', SEDE, OTRA_EMPRESA),
    J: usuario(MOZO, SEDE, OTRA_EMPRESA),
  };
  const ids: Record<string, string> = {};
  let n = 0;
  for (const [letra, datos] of Object.entries(filas)) {
    const resultado = await avisos.insertOne(
      avisoDe({ ...datos, titulo: letra, creada_en: new Date(base - (10 - n++) * 1000) }),
    );
    ids[letra] = resultado.insertedId.toHexString();
  }
  return ids;
}

beforeEach(async () => {
  await avisos.deleteMany({});
});

async function llamar(
  metodo: 'GET' | 'PATCH' | 'POST',
  url: string,
  opciones: OpcionesToken | null,
  cabeceras: Record<string, string> = {},
) {
  const token = opciones === null ? {} : conBearer(await emitirToken(opciones));
  const respuesta = await app.inject({ method: metodo, url, headers: { ...token, ...cabeceras } });
  return { status: respuesta.statusCode, cuerpo: respuesta.json() };
}

const titulos = (cuerpo: { datos: { titulo: string }[] }) => cuerpo.datos.map((a) => a.titulo).sort();

const COMO = {
  mozo: { sub: MOZO, rol: 'mozo' },
  otroMozo: { sub: OTRO_MOZO, rol: 'mozo' },
  admin: { sub: ADMIN, rol: 'admin_local' },
  cocina: { sub: COCINERO, rol: 'cocina' },
  propietario: { sub: PROPIETARIO, rol: 'propietario', local_id: null },
  propietarioAjeno: { sub: PROPIETARIO, rol: 'propietario', local_id: null, empresa_id: OTRA_EMPRESA },
} satisfies Record<string, OpcionesToken>;

describe('quién ve qué', () => {
  it.each([
    ['mozo: su rol en su sede y lo personal', COMO.mozo, ['A', 'E']],
    ['otro mozo: el mismo aviso de rol, pero no el personal ajeno', COMO.otroMozo, ['A', 'F']],
    ['administrador: solo lo dirigido a su rol', COMO.admin, ['D']],
    ['cocina: nada de lo sembrado', COMO.cocina, []],
    ['propietario: su rol en toda la empresa, sin la ajena', COMO.propietario, ['G', 'H']],
    ['propietario de otra empresa: solo lo suyo', COMO.propietarioAjeno, ['I']],
  ] as const)('%s', async (_nombre, token, esperados) => {
    await sembrar();
    const { status, cuerpo } = await llamar('GET', '/api/v1/notificaciones', token);
    expect(status).toBe(200);
    expect(titulos(cuerpo)).toEqual([...esperados]);
    expect(cuerpo.meta.total).toBe(esperados.length);
  });

  it('el propietario limita por sede con X-Local-Id', async () => {
    await sembrar();
    const { cuerpo } = await llamar('GET', '/api/v1/notificaciones', COMO.propietario, { 'x-local-id': SEDE });
    expect(titulos(cuerpo)).toEqual(['G']);
    const otra = await llamar('GET', '/api/v1/notificaciones', COMO.propietario, { 'x-local-id': OTRA_SEDE });
    expect(titulos(otra.cuerpo)).toEqual(['H']);
  });

  it('una sede de otra empresa en X-Local-Id no revela nada', async () => {
    await sembrar();
    // OTRA_SEDE existe en los avisos de la empresa propia (H); una sede inventada no devuelve nada.
    const { cuerpo } = await llamar('GET', '/api/v1/notificaciones', COMO.propietario, {
      'x-local-id': '00000000-0000-4000-8000-0000000000ff',
    });
    expect(cuerpo.datos).toEqual([]);
  });

  it('el aviso devuelto no incluye campos internos ni de otros usuarios', async () => {
    await sembrar();
    const { cuerpo } = await llamar('GET', '/api/v1/notificaciones', COMO.admin);
    const aviso = cuerpo.datos[0];
    expect(Object.keys(aviso).sort()).toEqual(
      ['creada_en', 'datos', 'id', 'leida', 'leida_en', 'local_id', 'mensaje', 'severidad', 'tipo', 'titulo'].sort(),
    );
    expect(aviso).toMatchObject({ leida: false, leida_en: null });
    expect(aviso.creada_en).toMatch(/-05:00$/);
  });

  it('la regla en memoria (SSE) y el filtro de MongoDB coinciden en todas las combinaciones', async () => {
    const empresas = [EMPRESA, OTRA_EMPRESA];
    const sedes = [SEDE, OTRA_SEDE];
    const destinos = [
      ...['propietario', 'admin_local', 'cajero', 'mozo', 'cocina'].map((r) => ({ tipo: 'rol', rol: r, usuario_id: null })),
      ...[MOZO, OTRO_MOZO].map((u) => ({ tipo: 'usuario', rol: null, usuario_id: u })),
    ];
    for (const empresa of empresas) {
      for (const sede of sedes) {
        for (const destinatario of destinos) {
          await avisos.insertOne(avisoDe({ empresa_id: empresa, local_id: sede, destinatario }));
        }
      }
    }
    const todos = await avisos.find({}).toArray();
    expect(todos).toHaveLength(2 * 2 * 7);

    const contextos: ContextoBandeja[] = [];
    for (const empresaId of empresas) {
      for (const rolDe of ['propietario', 'admin_local', 'cajero', 'mozo', 'cocina'] as const) {
        for (const usuarioId of [MOZO, OTRO_MOZO]) {
          const sedesDelRol = rolDe === 'propietario' ? [null, SEDE, OTRA_SEDE] : [SEDE, OTRA_SEDE];
          for (const localId of sedesDelRol) contextos.push({ usuarioId, rol: rolDe, empresaId, localId });
        }
      }
    }
    for (const ctx of contextos) {
      const enMongo = (await avisos.find(filtroVisible(ctx)).toArray()).map((a) => a._id.toHexString()).sort();
      const enMemoria = todos
        .filter((a) => esVisible(a as never, ctx))
        .map((a) => a._id.toHexString())
        .sort();
      expect(enMemoria, JSON.stringify(ctx)).toEqual(enMongo);
    }
  });

  it('un rol de sede sin sede en el contexto no abarca la empresa: se corta', () => {
    const ctx = { usuarioId: MOZO, rol: 'mozo', empresaId: EMPRESA, localId: null } as const;
    expect(() => filtroVisible(ctx)).toThrow();
    expect(() => esVisible({ empresa_id: EMPRESA, local_id: SEDE, destinatario: { tipo: 'rol', rol: 'mozo', usuario_id: null } }, ctx)).toThrow();
  });
});

describe('listado y contador', () => {
  it('ordena de la más reciente a la más antigua y pagina', async () => {
    const base = Date.now();
    for (let i = 0; i < 5; i++) {
      await avisos.insertOne(avisoDe({ ...rol('mozo', SEDE), titulo: `n${i}`, creada_en: new Date(base - (5 - i) * 1000) }));
    }
    const primera = await llamar('GET', '/api/v1/notificaciones?por_pagina=2&pagina=1', COMO.mozo);
    expect(primera.cuerpo.datos.map((a: { titulo: string }) => a.titulo)).toEqual(['n4', 'n3']);
    expect(primera.cuerpo.meta).toMatchObject({ total: 5, pagina: 1, por_pagina: 2 });
    const tercera = await llamar('GET', '/api/v1/notificaciones?por_pagina=2&pagina=3', COMO.mozo);
    expect(tercera.cuerpo.datos.map((a: { titulo: string }) => a.titulo)).toEqual(['n0']);
  });

  it('con la misma fecha, desempata por _id descendente', async () => {
    const instante = new Date();
    for (const titulo of ['a', 'b', 'c']) {
      await avisos.insertOne(avisoDe({ ...rol('mozo', SEDE), titulo, creada_en: instante }));
    }
    const { cuerpo } = await llamar('GET', '/api/v1/notificaciones', COMO.mozo);
    expect(cuerpo.datos.map((a: { titulo: string }) => a.titulo)).toEqual(['c', 'b', 'a']);
  });

  it('solo_no_leidas y el contador excluyen lo que ese usuario ya leyó, y cuentan las críticas', async () => {
    await avisos.insertMany([
      avisoDe({ ...rol('mozo', SEDE), titulo: 'leido', severidad: 'critica', leida_por: [{ usuario_id: MOZO, en: new Date() }] }),
      avisoDe({ ...rol('mozo', SEDE), titulo: 'otro-lo-leyo', leida_por: [{ usuario_id: OTRO_MOZO, en: new Date() }] }),
      avisoDe({ ...rol('mozo', SEDE), titulo: 'critico', severidad: 'critica' }),
      avisoDe({ ...rol('mozo', SEDE), titulo: 'normal', severidad: 'info' }),
    ]);
    const soloNuevas = await llamar('GET', '/api/v1/notificaciones?solo_no_leidas=true', COMO.mozo);
    expect(titulos(soloNuevas.cuerpo)).toEqual(['critico', 'normal', 'otro-lo-leyo']);
    expect(soloNuevas.cuerpo.meta.total).toBe(3);

    const todas = await llamar('GET', '/api/v1/notificaciones', COMO.mozo);
    expect(todas.cuerpo.datos.find((a: { titulo: string }) => a.titulo === 'leido')).toMatchObject({ leida: true });
    expect(todas.cuerpo.datos.find((a: { titulo: string }) => a.titulo === 'leido').leida_en).toMatch(/-05:00$/);

    const total = await llamar('GET', '/api/v1/notificaciones/no-leidas/total', COMO.mozo);
    expect(total.cuerpo.datos).toEqual({ total: 3, criticas: 1 });
    const delOtro = await llamar('GET', '/api/v1/notificaciones/no-leidas/total', COMO.otroMozo);
    expect(delOtro.cuerpo.datos).toEqual({ total: 3, criticas: 2 });
  });

  it.each([
    ['pagina=0'],
    ['pagina=-1'],
    ['pagina=abc'],
    ['por_pagina=0'],
    ['por_pagina=51'],
    ['solo_no_leidas=si'],
    ['pagina=1&pagina=2'],
  ])('rechaza %s con 422', async (consulta) => {
    const { status, cuerpo } = await llamar('GET', `/api/v1/notificaciones?${consulta}`, COMO.mozo);
    expect(status).toBe(422);
    expect(cuerpo.errores[0].codigo).toBe('ERR_PARAMETRO_INVALIDO');
  });
});

describe('leído por usuario', () => {
  it('marcarlo afecta solo a quien lo hizo, aunque comparta rol', async () => {
    const ids = await sembrar();
    const marcado = await llamar('PATCH', `/api/v1/notificaciones/${ids['A']}/leida`, COMO.mozo);
    expect(marcado).toMatchObject({ status: 200, cuerpo: { datos: { id: ids['A'], leida: true } } });

    const mio = await llamar('GET', '/api/v1/notificaciones', COMO.mozo);
    expect(mio.cuerpo.datos.find((a: { titulo: string }) => a.titulo === 'A').leida).toBe(true);
    const delOtro = await llamar('GET', '/api/v1/notificaciones', COMO.otroMozo);
    expect(delOtro.cuerpo.datos.find((a: { titulo: string }) => a.titulo === 'A').leida).toBe(false);
  });

  it('es idempotente: marcar dos veces no duplica el registro', async () => {
    const ids = await sembrar();
    for (let i = 0; i < 3; i++) {
      const { status } = await llamar('PATCH', `/api/v1/notificaciones/${ids['A']}/leida`, COMO.mozo);
      expect(status).toBe(200);
    }
    const doc = await avisos.findOne({ _id: new ObjectId(ids['A']) });
    expect(doc?.['leida_por']).toHaveLength(1);
    expect(doc?.['leida_por'][0].usuario_id).toBe(MOZO);
  });

  it('dos usuarios del mismo rol dejan cada uno su registro', async () => {
    const ids = await sembrar();
    await llamar('PATCH', `/api/v1/notificaciones/${ids['A']}/leida`, COMO.mozo);
    await llamar('PATCH', `/api/v1/notificaciones/${ids['A']}/leida`, COMO.otroMozo);
    const doc = await avisos.findOne({ _id: new ObjectId(ids['A']) });
    expect(doc?.['leida_por'].map((l: { usuario_id: string }) => l.usuario_id).sort()).toEqual([MOZO, OTRO_MOZO].sort());
  });

  it('un aviso ajeno responde 404 y no se marca (otra sede, otra empresa, otro rol, personal de otro)', async () => {
    const ids = await sembrar();
    for (const letra of ['B', 'C', 'D', 'F', 'G', 'H', 'I', 'J']) {
      const { status, cuerpo } = await llamar('PATCH', `/api/v1/notificaciones/${ids[letra]}/leida`, COMO.mozo);
      expect(status, letra).toBe(404);
      expect(cuerpo.errores[0].codigo).toBe('ERR_AVISO_NO_ENCONTRADO');
    }
    expect(await avisos.countDocuments({ 'leida_por.0': { $exists: true } })).toBe(0);
  });

  it.each(['no-es-un-id', '123', 'zzzzzzzzzzzzzzzzzzzzzzzz', '6740f2a1c3b9d8e7f6a5b4c3'])('responde 404 con el id %s', async (id) => {
    const { status } = await llamar('PATCH', `/api/v1/notificaciones/${id}/leida`, COMO.mozo);
    expect(status).toBe(404);
  });

  it('marcar todas toca solo los avisos visibles y no sin leer ajenos', async () => {
    const ids = await sembrar();
    const { status, cuerpo } = await llamar('POST', '/api/v1/notificaciones/marcar-todas-leidas', COMO.mozo);
    expect(status).toBe(200);
    expect(cuerpo.datos).toEqual({ afectadas: 2 });

    const leidos = (await avisos.find({ 'leida_por.0': { $exists: true } }).toArray()).map((a) => a['titulo']).sort();
    expect(leidos).toEqual(['A', 'E']);
    const otra = await llamar('POST', '/api/v1/notificaciones/marcar-todas-leidas', COMO.mozo);
    expect(otra.cuerpo.datos).toEqual({ afectadas: 0 });
    // El otro mozo conserva A sin leer.
    const total = await llamar('GET', '/api/v1/notificaciones/no-leidas/total', COMO.otroMozo);
    expect(total.cuerpo.datos.total).toBe(2);
    expect(ids['A']).toBeTruthy();
  });

  it('el propietario con X-Local-Id marca solo los de esa sede', async () => {
    await sembrar();
    const { cuerpo } = await llamar('POST', '/api/v1/notificaciones/marcar-todas-leidas', COMO.propietario, {
      'x-local-id': SEDE,
    });
    expect(cuerpo.datos).toEqual({ afectadas: 1 });
    const leidos = (await avisos.find({ 'leida_por.0': { $exists: true } }).toArray()).map((a) => a['titulo']);
    expect(leidos).toEqual(['G']);
  });
});

describe('aislamiento: todas las rutas con datos de otra empresa', () => {
  it('quien llama no ve, cuenta, marca ni lee nada de una empresa ajena, aunque coincidan sede, rol y usuario', async () => {
    const ids: string[] = [];
    for (const destino of [rol('mozo', SEDE, OTRA_EMPRESA), usuario(MOZO, SEDE, OTRA_EMPRESA)]) {
      const r = await avisos.insertOne(avisoDe({ ...destino, severidad: 'critica' }));
      ids.push(r.insertedId.toHexString());
    }
    const antes = await avisos.find({}).toArray();

    const lista = await llamar('GET', '/api/v1/notificaciones', COMO.mozo);
    expect(lista.cuerpo.datos).toEqual([]);
    expect(lista.cuerpo.meta.total).toBe(0);
    const soloNuevas = await llamar('GET', '/api/v1/notificaciones?solo_no_leidas=true', COMO.mozo);
    expect(soloNuevas.cuerpo.datos).toEqual([]);
    const total = await llamar('GET', '/api/v1/notificaciones/no-leidas/total', COMO.mozo);
    expect(total.cuerpo.datos).toEqual({ total: 0, criticas: 0 });
    for (const id of ids) {
      expect((await llamar('PATCH', `/api/v1/notificaciones/${id}/leida`, COMO.mozo)).status).toBe(404);
    }
    const todas = await llamar('POST', '/api/v1/notificaciones/marcar-todas-leidas', COMO.mozo);
    expect(todas.cuerpo.datos).toEqual({ afectadas: 0 });

    expect(await avisos.find({}).toArray()).toEqual(antes);
  });
});

describe('autenticación y rol en las cinco rutas', () => {
  const RUTAS: ['GET' | 'PATCH' | 'POST', string][] = [
    ['GET', '/api/v1/notificaciones'],
    ['GET', '/api/v1/notificaciones/no-leidas/total'],
    ['PATCH', '/api/v1/notificaciones/6740f2a1c3b9d8e7f6a5b4c3/leida'],
    ['POST', '/api/v1/notificaciones/marcar-todas-leidas'],
    ['GET', '/api/v1/notificaciones/stream'],
  ];

  it.each(RUTAS)('%s %s sin token responde 401', async (metodo, url) => {
    const { status, cuerpo } = await llamar(metodo, url, null);
    expect(status).toBe(401);
    expect(cuerpo.errores[0].codigo).toBe('ERR_TOKEN_INVALIDO');
  });

  it.each(RUTAS)('%s %s con token vencido responde 401 ERR_TOKEN_EXPIRADO', async (metodo, url) => {
    const { status, cuerpo } = await llamar(metodo, url, { vigencia: -3600 });
    expect(status).toBe(401);
    expect(cuerpo.errores[0].codigo).toBe('ERR_TOKEN_EXPIRADO');
  });

  it.each(RUTAS)('%s %s con admin_saas responde 403', async (metodo, url) => {
    const { status, cuerpo } = await llamar(metodo, url, { rol: 'admin_saas', empresa_id: null, local_id: null });
    expect(status).toBe(403);
    expect(cuerpo.errores[0].codigo).toBe('ERR_ROL_NO_PERMITIDO');
  });

  it.each(RUTAS)('%s %s con otra sede en X-Local-Id responde 403', async (metodo, url) => {
    const { status, cuerpo } = await llamar(metodo, url, COMO.mozo, { 'x-local-id': OTRA_SEDE });
    expect(status).toBe(403);
    expect(cuerpo.errores[0].codigo).toBe('ERR_SEDE_NO_PERMITIDA');
  });

  it.each(RUTAS)('%s %s con X-Local-Id que no es uuid responde 422', async (metodo, url) => {
    const { status, cuerpo } = await llamar(metodo, url, COMO.propietario, { 'x-local-id': 'no-es-uuid' });
    expect(status).toBe(422);
    expect(cuerpo.errores[0].codigo).toBe('ERR_PARAMETRO_INVALIDO');
  });

  it('un rol de sede sin sede en el token es inválido, no ve toda la empresa', async () => {
    await sembrar();
    const { status } = await llamar('GET', '/api/v1/notificaciones', { rol: 'mozo', local_id: null });
    expect(status).toBe(401);
  });

  it('el X-Local-Id igual al del token se acepta', async () => {
    const { status } = await llamar('GET', '/api/v1/notificaciones', COMO.mozo, { 'x-local-id': SEDE });
    expect(status).toBe(200);
  });

  it('sin clave pública configurada las rutas del navegador responden 503', async () => {
    const sinClave = crearApp({ config: configPrueba({ jwtPublicKey: null }), db: conexiones.dbApp, logs: false });
    const respuesta = await sinClave.inject({
      method: 'GET',
      url: '/api/v1/notificaciones',
      headers: conBearer(await emitirToken()),
    });
    expect(respuesta.statusCode).toBe(503);
    expect(respuesta.json().errores[0].codigo).toBe('ERR_JWT_NO_CONFIGURADO');
    await sinClave.close();
  });
});
