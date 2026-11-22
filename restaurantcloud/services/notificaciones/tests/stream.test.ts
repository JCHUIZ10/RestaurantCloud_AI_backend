/**
 * Canal SSE con el servidor escuchando de verdad: cabeceras, entrega inmediata, aislamiento por
 * empresa, sede, rol y usuario, latido y cierre al vencer el token.
 */

import type { FastifyInstance } from 'fastify';
import type { Collection, Document } from 'mongodb';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { aplicarEsquema } from '../src/datos/esquema.js';
import { COLECCION_AVISOS } from '../src/datos/mongo.js';
import {
  CLAVES,
  COCINERO,
  EMPRESA,
  MOZO,
  OTRA_EMPRESA,
  OTRA_SEDE,
  OTRO_MOZO,
  SEDE,
  cabecerasFirmadas,
  conBearer,
  conectarPruebas,
  configPrueba,
  emitirToken,
  sobre,
  type ConexionesPrueba,
  type OpcionesToken,
} from './ayudas.js';
import * as e from './ejemplos.js';

let conexiones: ConexionesPrueba;
let app: FastifyInstance;
let avisos: Collection<Document>;
let url: string;
const abiertos: Flujo[] = [];

beforeAll(async () => {
  conexiones = conectarPruebas();
  await aplicarEsquema(conexiones.dbAdmin);
  avisos = conexiones.dbAdmin.collection(COLECCION_AVISOS);
  app = crearApp({
    config: configPrueba({ jwtPublicKey: CLAVES.publica, latidoSegundos: 1 }),
    db: conexiones.dbApp,
    logs: false,
  });
  url = await app.listen({ host: '127.0.0.1', port: 0 });
});

afterAll(async () => {
  await app?.close();
  await conexiones?.cerrar();
});

beforeEach(async () => {
  await avisos.deleteMany({});
});

afterEach(() => {
  for (const flujo of abiertos.splice(0)) flujo.cerrar();
});

interface EventoSse {
  evento: string;
  id: string | null;
  datos: any;
}

/** Lector mínimo de SSE sobre fetch: acumula el texto y separa los eventos. */
class Flujo {
  texto = '';
  terminado = false;
  readonly controlador = new AbortController();
  status = 0;
  cabeceras = new Headers();

  async abrir(opciones: OpcionesToken, extra: Record<string, string> = {}): Promise<this> {
    const token = await emitirToken(opciones);
    const respuesta = await fetch(`${url}/api/v1/notificaciones/stream`, {
      headers: { ...conBearer(token), ...extra },
      signal: this.controlador.signal,
    });
    this.status = respuesta.status;
    this.cabeceras = respuesta.headers;
    if (respuesta.status !== 200) {
      this.texto = await respuesta.text();
      this.terminado = true;
      return this;
    }
    const lector = respuesta.body!.getReader();
    const decodificador = new TextDecoder();
    void (async () => {
      try {
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          this.texto += decodificador.decode(value, { stream: true });
        }
      } catch {
        // Cancelado por el cliente.
      }
      this.terminado = true;
    })();
    abiertos.push(this);
    return this;
  }

  get eventos(): EventoSse[] {
    return this.texto
      .split('\n\n')
      .map((bloque) => bloque.split('\n'))
      .filter((lineas) => lineas.some((l) => l.startsWith('event: ')))
      .map((lineas) => ({
        evento: lineas.find((l) => l.startsWith('event: '))!.slice(7),
        id: lineas.find((l) => l.startsWith('id: '))?.slice(4) ?? null,
        datos: JSON.parse(lineas.find((l) => l.startsWith('data: '))!.slice(6)),
      }));
  }

  avisos(): EventoSse[] {
    return this.eventos.filter((x) => x.evento === 'aviso');
  }

  async esperar(condicion: () => boolean, ms = 3000): Promise<void> {
    const limite = Date.now() + ms;
    while (!condicion()) {
      if (Date.now() > limite) throw new Error(`Tiempo agotado esperando el flujo. Recibido:\n${this.texto}`);
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  cerrar(): void {
    this.controlador.abort();
  }
}

const abrir = (opciones: OpcionesToken = {}, extra: Record<string, string> = {}) => new Flujo().abrir(opciones, extra);
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function publicar(tipo: string, datos: Record<string, unknown>, cambios: Record<string, unknown> = {}) {
  const cuerpo = JSON.stringify(sobre(tipo, datos, cambios));
  return app.inject({ method: 'POST', url: '/interno/eventos', payload: cuerpo, headers: cabecerasFirmadas(cuerpo) });
}

describe('apertura del canal', () => {
  it('responde con las cabeceras del flujo y avisa que está conectado', async () => {
    const flujo = await abrir();
    expect(flujo.status).toBe(200);
    expect(flujo.cabeceras.get('content-type')).toContain('text/event-stream');
    expect(flujo.cabeceras.get('cache-control')).toBe('no-cache');
    expect(flujo.cabeceras.get('x-accel-buffering')).toBe('no');
    expect(flujo.cabeceras.get('x-request-id')).toBeTruthy();
    await flujo.esperar(() => flujo.eventos.length > 0);
    expect(flujo.eventos[0]!.evento).toBe('conectado');
    expect(flujo.eventos[0]!.datos.expira_en).toMatch(/-05:00$/);
  });

  it('un token inválido recibe el error en JSON, sin abrir el canal', async () => {
    const respuesta = await fetch(`${url}/api/v1/notificaciones/stream`);
    expect(respuesta.status).toBe(401);
    expect(respuesta.headers.get('content-type')).toContain('application/json');
    await respuesta.text();
    const rol = await abrir({ rol: 'admin_saas', empresa_id: null, local_id: null });
    expect(rol.status).toBe(403);
  });

  it('no reenvía lo anterior: solo los avisos creados desde que se abrió', async () => {
    await publicar('plato.listo', e.PLATO_LISTO);
    const flujo = await abrir();
    await pausa(150);
    expect(flujo.avisos()).toHaveLength(0);
  });

  it('envía un latido como comentario cuando no hay tráfico', async () => {
    const flujo = await abrir();
    await flujo.esperar(() => flujo.texto.includes(': latido\n\n'), 2500);
  });
});

describe('entrega de avisos', () => {
  it('el aviso llega al instante, con la forma de la bandeja y su id', async () => {
    const flujo = await abrir();
    await flujo.esperar(() => flujo.eventos.length > 0);

    const inicio = Date.now();
    const respuesta = await publicar('plato.listo', e.PLATO_LISTO);
    expect(respuesta.statusCode).toBe(202);
    await flujo.esperar(() => flujo.avisos().length > 0, 2000);
    expect(Date.now() - inicio).toBeLessThan(2000);

    const [aviso] = flujo.avisos();
    expect(aviso!.datos).toMatchObject({ tipo: 'plato.listo', severidad: 'info', leida: false, leida_en: null, local_id: SEDE });
    expect(aviso!.id).toBe(aviso!.datos.id);
    const guardado = await avisos.findOne({});
    expect(guardado!._id.toHexString()).toBe(aviso!.id);
    expect(Object.keys(aviso!.datos)).not.toContain('empresa_id');
    expect(Object.keys(aviso!.datos)).not.toContain('leida_por');
  });

  it('cada conexión recibe solo lo que su bandeja mostraría (empresa, sede, rol y usuario)', async () => {
    const mozo = await abrir({ sub: MOZO, rol: 'mozo' });
    const otroMozo = await abrir({ sub: OTRO_MOZO, rol: 'mozo' });
    const cocina = await abrir({ sub: COCINERO, rol: 'cocina' });
    const mozoOtraSede = await abrir({ sub: COCINERO, rol: 'mozo', local_id: OTRA_SEDE });
    const mozoOtraEmpresa = await abrir({ sub: MOZO, rol: 'mozo', empresa_id: OTRA_EMPRESA });
    const todos = [mozo, otroMozo, cocina, mozoOtraSede, mozoOtraEmpresa];
    for (const f of todos) await f.esperar(() => f.eventos.length > 0);

    // Un plato agotado va a admin_local y a todos los mozos de la sede.
    await publicar('producto.agotado', e.PRODUCTO_AGOTADO);
    await mozo.esperar(() => mozo.avisos().length === 1);
    await otroMozo.esperar(() => otroMozo.avisos().length === 1);
    await pausa(150);
    expect([cocina, mozoOtraSede, mozoOtraEmpresa].map((f) => f.avisos().length)).toEqual([0, 0, 0]);

    // Un plato listo es personal: solo el mozo de la comanda.
    await publicar('plato.listo', e.PLATO_LISTO);
    await mozo.esperar(() => mozo.avisos().length === 2);
    await pausa(150);
    expect(otroMozo.avisos()).toHaveLength(1);
    expect(mozo.avisos().map((a) => a.datos.tipo)).toEqual(['producto.agotado', 'plato.listo']);
    expect([cocina, mozoOtraSede, mozoOtraEmpresa].map((f) => f.avisos().length)).toEqual([0, 0, 0]);
  });

  it('un evento de otra sede o de otra empresa no llega a quien tiene la misma función', async () => {
    const mozo = await abrir({ sub: MOZO, rol: 'mozo' });
    await mozo.esperar(() => mozo.eventos.length > 0);
    await publicar('producto.agotado', e.PRODUCTO_AGOTADO, { local_id: OTRA_SEDE });
    await publicar('producto.agotado', e.PRODUCTO_AGOTADO, { empresa_id: OTRA_EMPRESA });
    await pausa(200);
    expect(mozo.avisos()).toHaveLength(0);
    expect(await avisos.countDocuments({})).toBe(4);
  });

  it('un evento repetido no vuelve a avisar', async () => {
    const flujo = await abrir();
    await flujo.esperar(() => flujo.eventos.length > 0);
    const cuerpo = JSON.stringify(sobre('plato.listo', e.PLATO_LISTO));
    const enviar = () =>
      app.inject({ method: 'POST', url: '/interno/eventos', payload: cuerpo, headers: cabecerasFirmadas(cuerpo) });
    expect((await enviar()).statusCode).toBe(202);
    expect((await enviar()).statusCode).toBe(200);
    await flujo.esperar(() => flujo.avisos().length === 1);
    await pausa(150);
    expect(flujo.avisos()).toHaveLength(1);
  });

  it('el propietario recibe los avisos de toda su empresa; con X-Local-Id, solo los de esa sede', async () => {
    const propietario = await abrir({ rol: 'propietario', local_id: null });
    const soloOtraSede = await abrir({ rol: 'propietario', local_id: null }, { 'x-local-id': OTRA_SEDE });
    for (const f of [propietario, soloOtraSede]) await f.esperar(() => f.eventos.length > 0);
    await publicar('caja.cerrada', e.CAJA_CERRADA);
    await propietario.esperar(() => propietario.avisos().length === 1);
    await pausa(150);
    expect(soloOtraSede.avisos()).toHaveLength(0);
  });

  it('un cliente que se desconecta no afecta al resto ni al evento', async () => {
    const quedo = await abrir();
    const fuera = await abrir();
    for (const f of [quedo, fuera]) await f.esperar(() => f.eventos.length > 0);
    fuera.cerrar();
    await pausa(100);
    expect((await publicar('plato.listo', e.PLATO_LISTO)).statusCode).toBe(202);
    await quedo.esperar(() => quedo.avisos().length === 1);
  });
});

describe('vencimiento del token', () => {
  it('con el token por vencer, avisa con «renovar» y cierra el canal', async () => {
    // Vencido hace 5 s: aún dentro de la tolerancia de 30 s, así que se acepta y se cierra enseguida.
    const flujo = await abrir({ vigencia: -5 });
    await flujo.esperar(() => flujo.terminado, 2000);
    expect(flujo.eventos.map((x) => x.evento)).toEqual(['conectado', 'renovar']);
    expect(flujo.eventos[1]!.datos).toEqual({ motivo: 'token_por_vencer' });
  });

  it('un token vigente mantiene el canal hasta 30 s antes de exp, y ahí lo cierra', async () => {
    const inicio = Date.now();
    const flujo = await abrir({ vigencia: 32 });
    await pausa(500);
    expect(flujo.terminado).toBe(false);
    await flujo.esperar(() => flujo.terminado, 4000);
    expect(Date.now() - inicio).toBeGreaterThan(500);
    expect(flujo.eventos.at(-1)!.evento).toBe('renovar');
  });

  it('tras cerrarse por vencimiento ya no recibe avisos', async () => {
    const flujo = await abrir({ vigencia: -5 });
    await flujo.esperar(() => flujo.terminado, 2000);
    await publicar('plato.listo', e.PLATO_LISTO);
    await pausa(100);
    expect(flujo.avisos()).toHaveLength(0);
  });
});

describe('apagado', () => {
  it('app.close() termina los canales abiertos de forma ordenada, sin esperar al cliente', async () => {
    const otra = crearApp({ config: configPrueba({ jwtPublicKey: CLAVES.publica }), db: conexiones.dbApp, logs: false });
    const direccion = await otra.listen({ host: '127.0.0.1', port: 0 });
    const respuesta = await fetch(`${direccion}/api/v1/notificaciones/stream`, {
      headers: conBearer(await emitirToken()),
    });
    expect(respuesta.status).toBe(200);
    const lector = respuesta.body!.getReader();
    await lector.read(); // evento «conectado»

    const cierre = await Promise.race([otra.close().then(() => 'cerrado'), pausa(3000).then(() => 'colgado')]);
    expect(cierre).toBe('cerrado');
    // El flujo acaba limpio (fin de datos), no con la conexión cortada a la fuerza.
    await expect(lector.read()).resolves.toMatchObject({ done: true });
  });
});
