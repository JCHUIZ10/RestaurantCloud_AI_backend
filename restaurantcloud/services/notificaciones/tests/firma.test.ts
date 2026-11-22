import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { calcularFirma, verificarFirma } from '../src/soporte/firma.js';
import { ErrorApi } from '../src/soporte/respuestas.js';

const SECRETO = 'dev_secreto_notificaciones_123';
const AHORA = 1_763_347_211_000; // ms
const TS = String(AHORA / 1000);
const CUERPO = Buffer.from('{"id":"0f8b6c1e-2a4d-4c8e-9b1a-6f2d3e4a5b6c","tipo":"pedido.anulado"}');

const opciones = { secreto: SECRETO, toleranciaSegundos: 300, ahora: AHORA };

function motivo(fn: () => void): string | undefined {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).status).toBe(401);
    expect((error as ErrorApi).codigo).toBe('ERR_FIRMA_INVALIDA');
    return (error as ErrorApi).message;
  }
  return undefined;
}

describe('calcularFirma', () => {
  it('coincide con un HMAC-SHA256 de "timestamp.cuerpo", como lo calcula el núcleo', () => {
    // Valor calculado por separado, con la misma receta que App\Support\FirmaInterna::firmar.
    const esperado = createHmac('sha256', SECRETO).update(`${TS}.${CUERPO.toString()}`).digest('hex');
    expect(calcularFirma(TS, CUERPO, SECRETO)).toBe(esperado);
  });

  it('firma los bytes exactos: un JSON equivalente con otros espacios tiene otra firma', () => {
    const conEspacios = Buffer.from('{ "id": "0f8b6c1e-2a4d-4c8e-9b1a-6f2d3e4a5b6c", "tipo": "pedido.anulado" }');
    expect(calcularFirma(TS, conEspacios, SECRETO)).not.toBe(calcularFirma(TS, CUERPO, SECRETO));
  });
});

describe('verificarFirma', () => {
  const firma = calcularFirma(TS, CUERPO, SECRETO);

  it('acepta una firma correcta, también en mayúsculas', () => {
    expect(motivo(() => verificarFirma({ 'x-timestamp': TS, 'x-firma': firma }, CUERPO, opciones))).toBeUndefined();
    expect(
      motivo(() => verificarFirma({ 'x-timestamp': TS, 'x-firma': firma.toUpperCase() }, CUERPO, opciones)),
    ).toBeUndefined();
  });

  it.each([
    ['sin cabeceras', {}],
    ['sin firma', { 'x-timestamp': TS }],
    ['sin timestamp', { 'x-firma': firma }],
  ])('rechaza una petición %s', (_caso, cabeceras) => {
    expect(motivo(() => verificarFirma(cabeceras, CUERPO, opciones))).toMatch(/Falta la firma/);
  });

  it('rechaza un cuerpo alterado', () => {
    const alterado = Buffer.from(CUERPO.toString().replace('pedido', 'comprobante'));
    expect(motivo(() => verificarFirma({ 'x-timestamp': TS, 'x-firma': firma }, alterado, opciones))).toMatch(
      /no coincide/,
    );
  });

  it('rechaza una firma hecha con otro secreto', () => {
    const ajena = calcularFirma(TS, CUERPO, 'otro-secreto');
    expect(motivo(() => verificarFirma({ 'x-timestamp': TS, 'x-firma': ajena }, CUERPO, opciones))).toMatch(
      /no coincide/,
    );
  });

  it('rechaza la firma de otro timestamp aunque el cuerpo sea el mismo', () => {
    const otroTs = String(Number(TS) - 10);
    const firmaOtroTs = calcularFirma(otroTs, CUERPO, SECRETO);
    expect(motivo(() => verificarFirma({ 'x-timestamp': TS, 'x-firma': firmaOtroTs }, CUERPO, opciones))).toMatch(
      /no coincide/,
    );
  });

  it.each([
    ['vieja (más de 5 minutos atrás)', -301],
    ['del futuro (más de 5 minutos adelante)', 301],
  ])('rechaza una petición %s aunque esté bien firmada', (_caso, desfase) => {
    const ts = String(Number(TS) + desfase);
    const valida = calcularFirma(ts, CUERPO, SECRETO);
    expect(motivo(() => verificarFirma({ 'x-timestamp': ts, 'x-firma': valida }, CUERPO, opciones))).toMatch(
      /fuera del tiempo/,
    );
  });

  it('acepta justo en el límite de la tolerancia', () => {
    const ts = String(Number(TS) - 300);
    const valida = calcularFirma(ts, CUERPO, SECRETO);
    expect(motivo(() => verificarFirma({ 'x-timestamp': ts, 'x-firma': valida }, CUERPO, opciones))).toBeUndefined();
  });

  it.each(['abc', '1.5', '-1763347211', '', ' 1763347211'])('rechaza el timestamp "%s"', (ts) => {
    expect(motivo(() => verificarFirma({ 'x-timestamp': ts, 'x-firma': firma }, CUERPO, opciones))).toBeDefined();
  });

  it.each([
    ['más corta', 'abc123'],
    ['con caracteres que no son hexadecimales', 'z'.repeat(64)],
    ['más larga', `${'a'.repeat(64)}00`],
  ])('rechaza una firma %s sin lanzar otro error', (_caso, mala) => {
    expect(motivo(() => verificarFirma({ 'x-timestamp': TS, 'x-firma': mala }, CUERPO, opciones))).toMatch(
      /no coincide/,
    );
  });
});
