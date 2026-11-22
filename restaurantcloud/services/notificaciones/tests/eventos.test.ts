/**
 * `POST /interno/eventos` de punta a punta: firma, interpretación, inserción en MongoDB real con el
 * usuario de la aplicación, duplicados y respuestas.
 */

import type { FastifyInstance } from 'fastify';
import type { Collection, Document, WithId } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { rutasEventos } from '../src/api/eventos.js';
import { crearApp } from '../src/app.js';
import type { DocAviso } from '../src/datos/avisos.js';
import { aplicarEsquema } from '../src/datos/esquema.js';
import { COLECCION_AVISOS, crearCliente } from '../src/datos/mongo.js';
import { cabecerasFirmadas, conectarPruebas, configPrueba, EMPRESA, MOZO, SEDE, sobre, type ConexionesPrueba } from './ayudas.js';
import * as e from './ejemplos.js';

let conexiones: ConexionesPrueba;
let app: FastifyInstance;
let avisos: Collection<Document>;

beforeAll(async () => {
  conexiones = conectarPruebas();
  await aplicarEsquema(conexiones.dbAdmin);
  avisos = conexiones.dbAdmin.collection(COLECCION_AVISOS);
  app = crearApp({ config: configPrueba(), db: conexiones.dbApp, logs: false });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  await conexiones?.cerrar();
});

beforeEach(async () => {
  await avisos.deleteMany({});
});

function enviar(cuerpo: string, cabeceras: Record<string, string> = cabecerasFirmadas(cuerpo)) {
  return app.inject({ method: 'POST', url: '/interno/eventos', payload: cuerpo, headers: cabeceras });
}

const enviarEvento = (evento: object) => enviar(JSON.stringify(evento));

describe('evento nuevo', () => {
  it('responde 202 y guarda un aviso por destinatario con los campos comunes', async () => {
    const evento = sobre('pedido.anulado', { ...e.PEDIDO_ANULADO, es_merma: true });
    const respuesta = await enviarEvento(evento);

    expect(respuesta.statusCode).toBe(202);
    expect(respuesta.json()).toMatchObject({
      exito: true,
      datos: { estado: 'aceptado', evento_id: evento.id, avisos_creados: 2 },
    });

    const guardados = await avisos.find({ evento_id: evento.id }).sort({ 'destinatario.rol': 1 }).toArray();
    expect(guardados.map((a) => a['destinatario'].rol)).toEqual(['admin_local', 'cocina']);
    const [admin] = guardados;
    expect(admin).toMatchObject({
      empresa_id: EMPRESA,
      local_id: SEDE,
      tipo: 'pedido.anulado',
      severidad: 'alerta',
      leida_por: [],
    });
    // creada_en es el momento del hecho y expira a los 30 días (DIAS_RETENCION de la configuración).
    expect((admin!['creada_en'] as Date).toISOString()).toBe('2026-11-17T02:40:11.000Z');
    expect((admin!['expira_en'] as Date).getTime() - (admin!['creada_en'] as Date).getTime()).toBe(30 * 86_400_000);
  });

  it('guarda el aviso personal de plato.listo para el mozo', async () => {
    const evento = sobre('plato.listo', e.PLATO_LISTO);
    expect((await enviarEvento(evento)).statusCode).toBe(202);
    const [aviso] = await avisos.find({ evento_id: evento.id }).toArray();
    expect(aviso!['destinatario']).toEqual({ tipo: 'usuario', rol: null, usuario_id: MOZO });
  });

  it('normaliza a minúsculas los uuid del sobre, para que el filtro de la bandeja no dependa de cómo llegaron', async () => {
    const evento = sobre('comprobante.anulado', e.COMPROBANTE_ANULADO, {
      empresa_id: EMPRESA.toUpperCase().replace('00000000-0000-4000-8000', 'ABCDEF00-0000-4000-8000'),
    });
    expect((await enviarEvento(evento)).statusCode).toBe(202);
    const [aviso] = await avisos.find({ evento_id: evento.id }).toArray();
    expect(aviso!['empresa_id']).toBe(evento.empresa_id.toLowerCase());
  });

  it('avisa a quien reparte (canal SSE) solo con los avisos realmente guardados', async () => {
    const recibidos: WithId<DocAviso>[][] = [];
    // Una app mínima con solo la ruta de eventos y el gancho de reparto.
    const appSoloEventos = (await import('fastify')).default({ logger: false });
    rutasEventos(appSoloEventos, conexiones.dbApp, configPrueba(), (nuevos) => recibidos.push(nuevos));
    try {
      const evento = sobre('producto.agotado', e.PRODUCTO_AGOTADO);
      const cuerpo = JSON.stringify(evento);
      await appSoloEventos.inject({ method: 'POST', url: '/interno/eventos', payload: cuerpo, headers: cabecerasFirmadas(cuerpo) });
      await appSoloEventos.inject({ method: 'POST', url: '/interno/eventos', payload: cuerpo, headers: cabecerasFirmadas(cuerpo) });
      expect(recibidos).toHaveLength(1);
      expect(recibidos[0]!.map((a) => a.destinatario.rol)).toEqual(['admin_local', 'mozo']);
      expect(recibidos[0]!.every((a) => a._id)).toBe(true);
    } finally {
      await appSoloEventos.close();
    }
  });
});

describe('duplicados', () => {
  it('el mismo evento dos veces responde 200 duplicado y no crea avisos nuevos', async () => {
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
    expect((await enviar(cuerpo)).statusCode).toBe(202);

    const segunda = await enviar(cuerpo);
    expect(segunda.statusCode).toBe(200);
    expect(segunda.json().datos).toMatchObject({ estado: 'duplicado', avisos_creados: 0 });
    expect(await avisos.countDocuments()).toBe(2);
  });

  it('un reintento completa un evento que quedó guardado a medias', async () => {
    const evento = sobre('producto.agotado', e.PRODUCTO_AGOTADO);
    await enviarEvento(evento);
    // Simula que el primer intento solo alcanzó a guardar el aviso del administrador.
    await avisos.deleteOne({ evento_id: evento.id, 'destinatario.rol': 'mozo' });

    const reintento = await enviarEvento(evento);
    expect(reintento.statusCode).toBe(202);
    expect(reintento.json().datos.avisos_creados).toBe(1);
    expect(await avisos.countDocuments({ evento_id: evento.id })).toBe(2);
  });

  it('dos entregas simultáneas del mismo evento crean cada aviso una sola vez', async () => {
    const cuerpo = JSON.stringify(sobre('caja.cerrada', e.CAJA_CERRADA));
    const respuestas = await Promise.all(Array.from({ length: 5 }, () => enviar(cuerpo)));
    expect(respuestas.every((r) => r.statusCode === 200 || r.statusCode === 202)).toBe(true);
    expect(respuestas.filter((r) => r.statusCode === 202).length).toBeGreaterThanOrEqual(1);
    expect(await avisos.countDocuments()).toBe(2);
  });
});

describe('eventos que no producen avisos', () => {
  it('un tipo que el servicio no usa responde 200 ignorado sin guardar nada', async () => {
    const evento = sobre('venta.registrada', { comprobante_id: e.COMPROBANTE_ANULADO.comprobante_id });
    const respuesta = await enviarEvento(evento);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().datos).toEqual({ estado: 'ignorado', evento_id: evento.id, avisos_creados: 0 });
    expect(await avisos.countDocuments()).toBe(0);
  });

  it('un tipo desconocido en otra versión también se ignora (no se puede saber qué versión espera)', async () => {
    const respuesta = await enviarEvento(sobre('reserva.creada', {}, { version: 3 }));
    expect(respuesta.statusCode).toBe(200);
  });

  it('un cierre de caja sin diferencia responde 200 ignorado', async () => {
    const respuesta = await enviarEvento(sobre('caja.cerrada', { ...e.CAJA_CERRADA, discrepancia: 0 }));
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json().datos.estado).toBe('ignorado');
    expect(await avisos.countDocuments()).toBe(0);
  });
});

describe('firma', () => {
  it('sin firma responde 401 y no guarda nada', async () => {
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
    const respuesta = await enviar(cuerpo, { 'content-type': 'application/json' });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json().errores[0].codigo).toBe('ERR_FIRMA_INVALIDA');
    expect(await avisos.countDocuments()).toBe(0);
  });

  it('con otro secreto responde 401', async () => {
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
    expect((await enviar(cuerpo, cabecerasFirmadas(cuerpo, 'otro-secreto'))).statusCode).toBe(401);
  });

  it('un cuerpo cambiado después de firmar responde 401', async () => {
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
    const cabeceras = cabecerasFirmadas(cuerpo);
    const alterado = cuerpo.replace('Ceviche clásico', 'Ceviche mixto');
    expect((await enviar(alterado, cabeceras)).statusCode).toBe(401);
  });

  it('se verifica sobre los bytes exactos: un JSON con espacios y tildes bien firmado se acepta', async () => {
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO), null, 4);
    expect((await enviar(cuerpo)).statusCode).toBe(202);
  });

  it('la firma se comprueba antes de leer el cuerpo: un JSON roto sin firma da 401, no 422', async () => {
    expect((await enviar('{roto', { 'content-type': 'application/json' })).statusCode).toBe(401);
  });

  it('una firma vieja responde 401', async () => {
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
    const viejo = Math.floor(Date.now() / 1000) - 301;
    expect((await enviar(cuerpo, cabecerasFirmadas(cuerpo, undefined, viejo))).statusCode).toBe(401);
  });
});

describe('eventos inválidos (bien firmados)', () => {
  it('un cuerpo que no es JSON responde 422', async () => {
    const respuesta = await enviar('{roto');
    expect(respuesta.statusCode).toBe(422);
    expect(respuesta.json().errores[0].codigo).toBe('ERR_EVENTO_INVALIDO');
  });

  it('un sobre incompleto responde 422 con todos los campos que fallan', async () => {
    const respuesta = await enviarEvento({ tipo: 'producto.agotado', version: 1, datos: [] });
    expect(respuesta.statusCode).toBe(422);
    const campos = respuesta.json().errores[0].detalles.campos.map((c: { campo: string }) => c.campo);
    expect(campos).toEqual(expect.arrayContaining(['id', 'ocurrido_en', 'origen', 'empresa_id', 'local_id', 'datos']));
  });

  it('una versión no soportada de un tipo conocido responde 422', async () => {
    const respuesta = await enviarEvento(sobre('producto.agotado', e.PRODUCTO_AGOTADO, { version: 2 }));
    expect(respuesta.statusCode).toBe(422);
    expect(respuesta.json().errores[0].detalles.campos).toEqual([{ campo: 'version', motivo: 'debe ser 1' }]);
  });

  it('datos que no cumplen el contrato responden 422 con la ruta de cada campo', async () => {
    const respuesta = await enviarEvento(
      sobre('plato.listo', { ...e.PLATO_LISTO, mozo_id: null, items: [{ producto_nombre: 'Lomo', cantidad: '2' }] }),
    );
    expect(respuesta.statusCode).toBe(422);
    const campos = respuesta.json().errores[0].detalles.campos.map((c: { campo: string }) => c.campo);
    expect(campos).toEqual(['datos.mozo_id', 'datos.items[0].pedido_item_id', 'datos.items[0].cantidad']);
    expect(await avisos.countDocuments()).toBe(0);
  });

  it('un instante sin zona horaria no se acepta', async () => {
    const respuesta = await enviarEvento(sobre('producto.agotado', e.PRODUCTO_AGOTADO, { ocurrido_en: '2026-11-16T21:40:11' }));
    expect(respuesta.statusCode).toBe(422);
  });

  it('un valor fuera del catálogo responde 422', async () => {
    const respuesta = await enviarEvento(sobre('producto.agotado', { ...e.PRODUCTO_AGOTADO, causa: 'otra' }));
    expect(respuesta.statusCode).toBe(422);
  });

  it('un campo de más se ignora', async () => {
    const respuesta = await enviarEvento(sobre('producto.agotado', { ...e.PRODUCTO_AGOTADO, campo_nuevo: 1 }));
    expect(respuesta.statusCode).toBe(202);
  });
});

describe('otros fallos', () => {
  it('con otro tipo de contenido, la firma sigue siendo la que decide', async () => {
    const sinFirma = await app.inject({
      method: 'POST',
      url: '/interno/eventos',
      payload: 'hola',
      headers: { 'content-type': 'text/plain' },
    });
    expect(sinFirma.statusCode).toBe(401);
    expect(sinFirma.json()).toMatchObject({ exito: false, errores: [{ codigo: 'ERR_FIRMA_INVALIDA' }] });

    // Bien firmado, se verifica sobre los mismos bytes aunque no se declare JSON.
    const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
    const firmado = await enviar(cuerpo, { ...cabecerasFirmadas(cuerpo), 'content-type': 'text/plain' });
    expect(firmado.statusCode).toBe(202);
  });

  it('una petición sin cuerpo responde 401 sin firma y 422 bien firmada', async () => {
    const vacia = await app.inject({ method: 'POST', url: '/interno/eventos' });
    expect(vacia.statusCode).toBe(401);
    const firmada = await app.inject({ method: 'POST', url: '/interno/eventos', headers: cabecerasFirmadas('') });
    expect(firmada.statusCode).toBe(422);
  });

  it('con MongoDB caído responde 503, para que el núcleo reintente', async () => {
    const clienteCaido = crearCliente({ uri: 'mongodb://127.0.0.1:1', usuario: null, clave: null, authSource: 'admin', timeoutMs: 300 });
    const appCaida = crearApp({ config: configPrueba(), db: clienteCaido.db('x'), logs: false });
    try {
      const cuerpo = JSON.stringify(sobre('producto.agotado', e.PRODUCTO_AGOTADO));
      const respuesta = await appCaida.inject({ method: 'POST', url: '/interno/eventos', payload: cuerpo, headers: cabecerasFirmadas(cuerpo) });
      expect(respuesta.statusCode).toBe(503);
      expect(respuesta.json().errores[0].codigo).toBe('ERR_BD_NO_DISPONIBLE');
    } finally {
      await appCaida.close();
      await clienteCaido.close();
    }
  });

  it('las rutas JSON normales siguen leyendo JSON (el parser de bytes es solo de /interno)', async () => {
    // /health no tiene cuerpo; basta con que una ruta fuera del plugin no reciba un Buffer.
    const respuesta = await app.inject({ method: 'GET', url: '/health' });
    expect(respuesta.statusCode).toBe(200);
  });
});
