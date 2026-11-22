/**
 * Contrato de forma de los eventos del núcleo (doc-2u/servicios/contratos).
 *
 * Cada archivo describe la forma de los `datos` de un evento real. Aquí se convierte en un ejemplo y
 * se comprueba que este servicio lo acepta y crea sus avisos. El núcleo verifica el mismo archivo
 * contra lo que realmente emite: si cualquiera de los dos lados cambia sin el otro, una prueba falla.
 * Misma receta que `services/analitica/tests/test_contratos.py`.
 */

import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { aplicarEsquema } from '../src/datos/esquema.js';
import { COLECCION_AVISOS } from '../src/datos/mongo.js';
import { ESQUEMAS_V1 } from '../src/dominio/eventos.js';
import { cabecerasFirmadas, conectarPruebas, configPrueba, sobre, type ConexionesPrueba } from './ayudas.js';

const CONTRATOS = resolve(import.meta.dirname, '..', '..', '..', '..', 'doc-2u', 'servicios', 'contratos');
const ARCHIVOS = readdirSync(CONTRATOS)
  .filter((a) => a.endsWith('.json'))
  .sort();

/**
 * Tipos que este servicio consume pero cuyo contrato aún no genera el núcleo. Vacía desde que el núcleo
 * emite los siete (7.3): un tipo nuevo se anota aquí solo mientras el núcleo no lo emita, y la prueba de
 * abajo exige quitarlo en cuanto aparece su archivo.
 */
const PENDIENTES_DEL_NUCLEO = new Set<string>();

const MUESTRAS: Record<string, () => unknown> = {
  uuid: () => randomUUID(),
  string: () => 'texto de prueba',
  int: () => 1,
  number: () => 12.5,
  bool: () => false,
  date: () => '2026-11-16',
  datetime: () => '2026-11-16T21:14:03-05:00',
  null: () => null,
};

/** Convierte la forma del contrato en un valor concreto. Un texto que no es un tipo es un valor fijo. */
function ejemplo(forma: unknown): unknown {
  if (Array.isArray(forma)) return forma.map(ejemplo);
  if (typeof forma === 'object' && forma !== null) {
    return Object.fromEntries(Object.entries(forma).map(([campo, valor]) => [campo, ejemplo(valor)]));
  }
  const texto = forma as string;
  return texto in MUESTRAS ? MUESTRAS[texto]!() : texto;
}

/** venta.registrada.subcuenta.json -> venta.registrada; comprobante.anulado.json -> comprobante.anulado */
const tipoDe = (archivo: string) => archivo.replace(/\.json$/, '').split('.').slice(0, 2).join('.');

const leer = (archivo: string) => JSON.parse(readFileSync(resolve(CONTRATOS, archivo), 'utf8')) as unknown;

let conexiones: ConexionesPrueba;
let app: FastifyInstance;

beforeAll(async () => {
  conexiones = conectarPruebas();
  await aplicarEsquema(conexiones.dbAdmin);
  app = crearApp({ config: configPrueba(), db: conexiones.dbApp, logs: false });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  await conexiones?.cerrar();
});

beforeEach(async () => {
  await conexiones.dbAdmin.collection(COLECCION_AVISOS).deleteMany({});
});

describe('cobertura de los contratos', () => {
  it('cada tipo que el servicio consume tiene su contrato, salvo los que el núcleo aún no emite', () => {
    const conContrato = new Set(ARCHIVOS.map(tipoDe));
    const sinContrato = Object.keys(ESQUEMAS_V1).filter((t) => !conContrato.has(t) && !PENDIENTES_DEL_NUCLEO.has(t));
    expect(sinContrato).toEqual([]);
  });

  it('la lista de pendientes no tiene tipos que ya tienen contrato (hay que quitarlos)', () => {
    const conContrato = new Set(ARCHIVOS.map(tipoDe));
    expect([...PENDIENTES_DEL_NUCLEO].filter((t) => conContrato.has(t))).toEqual([]);
  });
});

describe.each(ARCHIVOS)('%s', (archivo) => {
  const tipo = tipoDe(archivo);
  const consume = Object.hasOwn(ESQUEMAS_V1, tipo);

  it(consume ? 'el servicio lo acepta y crea al menos un aviso' : 'el servicio lo recibe y lo ignora', async () => {
    const cuerpo = JSON.stringify(sobre(tipo, ejemplo(leer(archivo)) as Record<string, unknown>));
    const respuesta = await app.inject({
      method: 'POST',
      url: '/interno/eventos',
      payload: cuerpo,
      headers: cabecerasFirmadas(cuerpo),
    });

    if (consume) {
      expect(respuesta.statusCode, respuesta.body).toBe(202);
      expect(respuesta.json().datos.avisos_creados).toBeGreaterThanOrEqual(1);
    } else {
      expect(respuesta.statusCode, respuesta.body).toBe(200);
      expect(respuesta.json().datos.estado).toBe('ignorado');
    }
  });
});
