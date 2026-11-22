/**
 * `/health`, formato de respuesta común y `X-Request-Id`, con la aplicación completa.
 */

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { aplicarEsquema } from '../src/datos/esquema.js';
import { crearCliente } from '../src/datos/mongo.js';
import { conectarPruebas, configPrueba, type ConexionesPrueba } from './ayudas.js';

const ISO_CON_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

let conexiones: ConexionesPrueba;
let app: FastifyInstance;

beforeAll(async () => {
  conexiones = conectarPruebas();
  await aplicarEsquema(conexiones.dbAdmin);
  // La aplicación usa la conexión con los permisos reales del servicio.
  app = crearApp({ config: configPrueba(), db: conexiones.dbApp, logs: false });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  await conexiones?.cerrar();
});

describe('GET /health', () => {
  it('responde 200 con el formato común si MongoDB responde', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/health' });
    expect(respuesta.statusCode).toBe(200);
    const cuerpo = respuesta.json();
    expect(cuerpo).toMatchObject({ exito: true, datos: { estado: 'ok', servicio: 'ms-notificaciones' } });
    expect(cuerpo.meta.timestamp).toMatch(ISO_CON_ZONA);
    expect(cuerpo.meta.timestamp.endsWith('-05:00')).toBe(true);
  });

  it('responde 503 ERR_BD_NO_DISPONIBLE si MongoDB no responde, sin colgarse', async () => {
    // Un puerto donde no escucha nadie y una espera corta.
    const clienteCaido = crearCliente({
      uri: 'mongodb://127.0.0.1:1',
      usuario: null,
      clave: null,
      authSource: 'admin',
      timeoutMs: 300,
    });
    const appCaida = crearApp({ config: configPrueba(), db: clienteCaido.db('x'), logs: false });
    try {
      const inicio = Date.now();
      const respuesta = await appCaida.inject({ method: 'GET', url: '/health' });
      expect(Date.now() - inicio).toBeLessThan(3000);
      expect(respuesta.statusCode).toBe(503);
      expect(respuesta.json()).toMatchObject({
        exito: false,
        errores: [{ codigo: 'ERR_BD_NO_DISPONIBLE', detalles: {} }],
      });
    } finally {
      await appCaida.close();
      await clienteCaido.close();
    }
  });
});

describe('X-Request-Id', () => {
  it('genera uno si la petición no lo trae', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/health' });
    expect(respuesta.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('respeta el que llega', async () => {
    const respuesta = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'kong-0f8b6c1e' },
    });
    expect(respuesta.headers['x-request-id']).toBe('kong-0f8b6c1e');
  });

  it.each([
    ['con saltos de línea', 'abc\r\nnivel: error'],
    ['con espacios', 'uno dos'],
    ['demasiado largo', 'a'.repeat(129)],
  ])('reemplaza uno %s', async (_caso, valor) => {
    const respuesta = await app.inject({ method: 'GET', url: '/health', headers: { 'x-request-id': valor } });
    expect(respuesta.headers['x-request-id']).not.toBe(valor);
    expect(respuesta.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('lo devuelve también en los errores', async () => {
    const respuesta = await app.inject({
      method: 'GET',
      url: '/no-existe',
      headers: { 'x-request-id': 'req-404' },
    });
    expect(respuesta.headers['x-request-id']).toBe('req-404');
  });
});

describe('formato común en errores de Fastify', () => {
  it('una ruta inexistente responde 404 con el formato común', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/api/v1/no-existe' });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toMatchObject({ exito: false, errores: [{ codigo: 'ERR_RUTA_NO_ENCONTRADA' }] });
  });
});
