/** Validación del JWT: lo que se acepta y cada razón de rechazo, con el mismo comportamiento que ms-analítica. */

import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { sesionAutenticada, verificarJwt } from '../src/soporte/jwt.js';
import { ErrorApi } from '../src/soporte/respuestas.js';
import { CLAVES, CLAVES_AJENAS, EMPRESA, MOZO, SEDE, configPrueba, emitirToken } from './ayudas.js';

const cfg = configPrueba({ jwtPublicKey: CLAVES.publica });

async function rechazo(promesa: Promise<unknown>): Promise<ErrorApi> {
  try {
    await promesa;
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorApi);
    return error as ErrorApi;
  }
  throw new Error('Se esperaba un rechazo y el token fue aceptado.');
}

describe('verificarJwt', () => {
  it('acepta un token válido y devuelve la sesión', async () => {
    const sesion = await verificarJwt(await emitirToken(), cfg);
    expect(sesion).toMatchObject({ usuarioId: MOZO, rol: 'mozo', empresaId: EMPRESA, localId: SEDE });
  });

  it('acepta un propietario sin sede', async () => {
    const sesion = await verificarJwt(await emitirToken({ rol: 'propietario', local_id: null }), cfg);
    expect(sesion.localId).toBeNull();
  });

  it('acepta una clave con \\n literales, como llega por variable de entorno', async () => {
    const enUnaLinea = CLAVES.publica.trim().replaceAll('\n', '\\n');
    await expect(verificarJwt(await emitirToken(), configPrueba({ jwtPublicKey: enUnaLinea }))).resolves.toBeTruthy();
  });

  it('un token vencido hace poco entra en la tolerancia; uno vencido hace mucho, no', async () => {
    await expect(verificarJwt(await emitirToken({ vigencia: -10 }), cfg)).resolves.toBeTruthy();
    const error = await rechazo(verificarJwt(await emitirToken({ vigencia: -120 }), cfg));
    expect(error).toMatchObject({ status: 401, codigo: 'ERR_TOKEN_EXPIRADO' });
  });

  it('rechaza una firma de otra clave', async () => {
    const error = await rechazo(verificarJwt(await emitirToken({ claves: CLAVES_AJENAS }), cfg));
    expect(error).toMatchObject({ status: 401, codigo: 'ERR_TOKEN_INVALIDO' });
  });

  it('rechaza un token con el algoritmo cambiado (HS256 con la clave pública como secreto, y none)', async () => {
    const hs = await new SignJWT({ rol: 'mozo', empresa_id: EMPRESA })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(MOZO)
      .setIssuer('restaurantcloud-nucleo')
      .setAudience('restaurantcloud-servicios')
      .setNotBefore(0)
      .setExpirationTime('10m')
      .sign(new TextEncoder().encode(CLAVES.publica));
    expect((await rechazo(verificarJwt(hs, cfg))).codigo).toBe('ERR_TOKEN_INVALIDO');

    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const sinFirma = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: MOZO, rol: 'propietario', empresa_id: EMPRESA })}.`;
    expect((await rechazo(verificarJwt(sinFirma, cfg))).codigo).toBe('ERR_TOKEN_INVALIDO');
  });

  it('rechaza un algoritmo RSA distinto de RS256, aunque la firma sea válida', async () => {
    const rs384 = await new SignJWT({ rol: 'mozo', empresa_id: EMPRESA })
      .setProtectedHeader({ alg: 'RS384' })
      .setSubject(MOZO)
      .setIssuer('restaurantcloud-nucleo')
      .setAudience('restaurantcloud-servicios')
      .setNotBefore(0)
      .setExpirationTime('10m')
      .sign(CLAVES.privada);
    expect((await rechazo(verificarJwt(rs384, cfg))).codigo).toBe('ERR_TOKEN_INVALIDO');
  });

  it('rechaza emisor o audiencia distintos', async () => {
    const otraAudiencia = configPrueba({ jwtPublicKey: CLAVES.publica, jwtAudiencia: 'otro' });
    expect((await rechazo(verificarJwt(await emitirToken(), otraAudiencia))).codigo).toBe('ERR_TOKEN_INVALIDO');
    const otroEmisor = configPrueba({ jwtPublicKey: CLAVES.publica, jwtEmisor: 'otro' });
    expect((await rechazo(verificarJwt(await emitirToken(), otroEmisor))).codigo).toBe('ERR_TOKEN_INVALIDO');
  });

  for (const claim of ['rol', 'empresa_id', 'exp']) it(`rechaza un token sin el claim ${claim}`, async () => {
    const error = await rechazo(verificarJwt(await emitirToken({ sin: [claim] }), cfg));
    expect(error.codigo).toBe('ERR_TOKEN_INVALIDO');
  });

  it('rechaza un token que todavía no es válido (nbf futuro)', async () => {
    const futuro = await new SignJWT({ rol: 'mozo', empresa_id: EMPRESA })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject(MOZO)
      .setIssuer('restaurantcloud-nucleo')
      .setAudience('restaurantcloud-servicios')
      .setNotBefore(Math.floor(Date.now() / 1000) + 3600)
      .setExpirationTime('2h')
      .sign(CLAVES.privada);
    expect((await rechazo(verificarJwt(futuro, cfg))).codigo).toBe('ERR_TOKEN_INVALIDO');
  });

  it('rechaza identificadores que no son uuid (sub, empresa_id, local_id)', async () => {
    for (const opciones of [{ sub: 'no-es-uuid' }, { empresa_id: 'x' }, { local_id: 'x' }]) {
      expect((await rechazo(verificarJwt(await emitirToken(opciones), cfg))).codigo).toBe('ERR_TOKEN_INVALIDO');
    }
  });

  it('sin clave o con una clave mal formada responde 503, no 401', async () => {
    for (const jwtPublicKey of [null, '   ', 'esto no es una clave']) {
      const error = await rechazo(verificarJwt(await emitirToken(), configPrueba({ jwtPublicKey })));
      expect(error).toMatchObject({ status: 503, codigo: 'ERR_JWT_NO_CONFIGURADO' });
    }
  });
});

describe('sesionAutenticada (cabecera Authorization)', () => {
  const pedir = (authorization?: string) =>
    sesionAutenticada({ headers: authorization === undefined ? {} : { authorization } } as never, cfg);

  it('exige el esquema Bearer', async () => {
    const token = await emitirToken();
    expect((await rechazo(pedir())).codigo).toBe('ERR_TOKEN_INVALIDO');
    expect((await rechazo(pedir(`Basic ${token}`))).codigo).toBe('ERR_TOKEN_INVALIDO');
    expect((await rechazo(pedir('Bearer '))).codigo).toBe('ERR_TOKEN_INVALIDO');
    await expect(pedir(`bearer ${token}`)).resolves.toMatchObject({ usuarioId: MOZO });
  });
});
