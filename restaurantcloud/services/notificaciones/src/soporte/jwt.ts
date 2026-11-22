/**
 * Validación del JWT de las rutas públicas (doc-2u/servicios/README.md, sección 2).
 *
 * El núcleo emite el token (RS256) y este módulo solo lo valida con la clave pública. Kong ya
 * comprobó firma y caducidad; aquí se vuelve a validar todo, porque el servicio no debe confiar en
 * que la petición haya pasado por el gateway. `empresa_id`, `local_id` y `rol` salen del token,
 * nunca del cuerpo ni de la URL. Traducción de `app/soporte/jwt.py` de ms-analítica.
 */

import { createPublicKey, type KeyObject } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { errors, jwtVerify } from 'jose';
import type { Config } from '../config.js';
import { ErrorApi } from './respuestas.js';

export const ALGORITMO = 'RS256';
const CLAIMS_OBLIGATORIOS = ['exp', 'nbf', 'iss', 'aud', 'sub', 'rol', 'empresa_id'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lo que el servicio sabe de quien llama, ya validado. */
export interface Sesion {
  usuarioId: string;
  rol: string;
  empresaId: string | null;
  localId: string | null;
  /** Vencimiento del token, en segundos desde 1970. */
  exp: number;
}

function tokenInvalido(motivo: string): ErrorApi {
  return new ErrorApi(401, 'ERR_TOKEN_INVALIDO', motivo);
}

function claveMalFormada(): ErrorApi {
  return new ErrorApi(503, 'ERR_JWT_NO_CONFIGURADO', 'La clave pública del token no es válida.');
}

const clavesLeidas = new Map<string, KeyObject>();

function clavePublica(config: Config): KeyObject {
  const pem = config.jwtPublicKey?.trim();
  if (!pem) {
    throw new ErrorApi(503, 'ERR_JWT_NO_CONFIGURADO', 'El servicio no tiene configurada la clave pública del token.');
  }
  const normalizada = pem.replaceAll('\\n', '\n');
  let clave = clavesLeidas.get(normalizada);
  if (!clave) {
    try {
      clave = createPublicKey(normalizada);
    } catch {
      // Una clave mal formada es un error de despliegue, no del cliente.
      throw claveMalFormada();
    }
    clavesLeidas.set(normalizada, clave);
  }
  return clave;
}

function textoUuid(valor: unknown, campo: string): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string' || !UUID.test(valor)) {
    throw tokenInvalido(`El claim ${campo} no es un identificador válido.`);
  }
  return valor.toLowerCase();
}

/** Valida firma RS256, emisor, audiencia, vigencia y claims. Lanza ErrorApi (401 o 503). */
export async function verificarJwt(token: string, config: Config): Promise<Sesion> {
  const clave = clavePublica(config);
  let claims;
  try {
    ({ payload: claims } = await jwtVerify(token, clave, {
      algorithms: [ALGORITMO], // fijo: un token con otro `alg` (none, HS256) se rechaza
      issuer: config.jwtEmisor,
      audience: config.jwtAudiencia,
      clockTolerance: config.jwtToleranciaSegundos,
      requiredClaims: CLAIMS_OBLIGATORIOS,
    }));
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new ErrorApi(401, 'ERR_TOKEN_EXPIRADO', 'El token caducó; renuévalo e intenta de nuevo.');
    }
    if (error instanceof errors.JOSEError) {
      throw tokenInvalido(`El token no es válido (${error.code}).`);
    }
    throw tokenInvalido('El token no es válido.');
  }

  if (typeof claims.rol !== 'string' || typeof claims.sub !== 'string') {
    throw tokenInvalido('Los claims sub y rol deben ser texto.');
  }
  const usuarioId = textoUuid(claims.sub, 'sub');
  const empresaId = textoUuid(claims['empresa_id'], 'empresa_id');
  return {
    usuarioId: usuarioId as string,
    rol: claims.rol,
    empresaId,
    localId: textoUuid(claims['local_id'], 'local_id'),
    exp: claims.exp as number,
  };
}

/** Exige `Authorization: Bearer <JWT>` válido. */
export async function sesionAutenticada(request: FastifyRequest, config: Config): Promise<Sesion> {
  const autorizacion = request.headers.authorization;
  if (!autorizacion) throw tokenInvalido('Falta el token de autorización.');
  const [esquema = '', ...resto] = autorizacion.split(' ');
  const token = resto.join(' ').trim();
  if (esquema.toLowerCase() !== 'bearer' || !token) {
    throw tokenInvalido('La cabecera Authorization debe ser Bearer <token>.');
  }
  return verificarJwt(token, config);
}
