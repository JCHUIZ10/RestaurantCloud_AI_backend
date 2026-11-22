/**
 * Conexiones de prueba contra el MongoDB real del compose, base `notificaciones_db_test`.
 *
 * Hay dos conexiones, como en ms-analítica: el administrador aplica el esquema y limpia, y el
 * usuario de la aplicación ejecuta lo que hace el servicio. Así las pruebas también comprueban que
 * el servicio funciona con sus permisos reales, sin privilegios de administración.
 */

import { createHmac, generateKeyPairSync, randomUUID, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SignJWT } from 'jose';
import type { Db, MongoClient } from 'mongodb';
import type { Config } from '../src/config.js';
import { crearCliente } from '../src/datos/mongo.js';

export const BASE_PRUEBAS = 'notificaciones_db_test';

/** Lee `.env` del servicio si existe, sin dependencias; las variables del entorno tienen prioridad. */
function cargarEnv(): void {
  let contenido: string;
  try {
    contenido = readFileSync(resolve(import.meta.dirname, '..', '.env'), 'utf8');
  } catch {
    return;
  }
  for (const linea of contenido.split(/\r?\n/)) {
    const coincidencia = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linea);
    if (coincidencia && process.env[coincidencia[1]!] === undefined) {
      process.env[coincidencia[1]!] = coincidencia[2]!;
    }
  }
}

function obligatoria(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    throw new Error(
      `Falta ${nombre} para las pruebas de integración. Ver services/notificaciones/.env.example ` +
        '(el MongoDB del compose debe estar levantado y con el usuario de la aplicación creado).',
    );
  }
  return valor;
}

export interface ConexionesPrueba {
  admin: MongoClient;
  app: MongoClient;
  dbAdmin: Db;
  dbApp: Db;
  cerrar(): Promise<void>;
}

export function conectarPruebas(): ConexionesPrueba {
  cargarEnv();
  const uri = obligatoria('TEST_MONGODB_URI');
  const admin = crearCliente({
    uri,
    usuario: obligatoria('TEST_MONGODB_ADMIN_USUARIO'),
    clave: obligatoria('TEST_MONGODB_ADMIN_CLAVE'),
    authSource: 'admin',
    timeoutMs: 5000,
  });
  const app = crearCliente({
    uri,
    usuario: obligatoria('TEST_MONGODB_APP_USUARIO'),
    clave: obligatoria('TEST_MONGODB_APP_CLAVE'),
    // El usuario está definido en la base del servicio y tiene el rol también en la de pruebas.
    authSource: process.env['TEST_MONGODB_APP_AUTH_SOURCE']?.trim() || 'notificaciones_db',
    timeoutMs: 5000,
  });
  return {
    admin,
    app,
    dbAdmin: admin.db(BASE_PRUEBAS),
    dbApp: app.db(BASE_PRUEBAS),
    async cerrar() {
      await Promise.all([admin.close(), app.close()]);
    },
  };
}

export function configPrueba(cambios: Partial<Config> = {}): Config {
  return {
    port: 0,
    mongodbUri: 'mongodb://localhost:27017',
    mongodbDb: BASE_PRUEBAS,
    mongodbUsuario: null,
    mongodbClave: null,
    mongodbAuthSource: BASE_PRUEBAS,
    mongodbTimeoutMs: 3000,
    secretoInterno: 'secreto-de-prueba',
    firmaToleranciaSegundos: 300,
    jwtPublicKey: null,
    jwtEmisor: 'restaurantcloud-nucleo',
    jwtAudiencia: 'restaurantcloud-servicios',
    jwtToleranciaSegundos: 30,
    diasRetencion: 30,
    latidoSegundos: 25,
    zonaHoraria: 'America/Lima',
    nivelLog: 'silent',
    ...cambios,
  };
}

export const EMPRESA = '00000000-0000-4000-8000-000000000001';
export const SEDE = '00000000-0000-4000-8000-000000000010';
export const MOZO = '00000000-0000-4000-8000-000000000103';
export const SECRETO = 'secreto-de-prueba';

/** Sobre común del evento (doc-2u/servicios/README.md, sección 4). */
export function sobre(tipo: string, datos: Record<string, unknown>, cambios: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    tipo,
    version: 1,
    ocurrido_en: '2026-11-16T21:40:11-05:00',
    origen: 'nucleo',
    empresa_id: EMPRESA,
    local_id: SEDE,
    datos,
    ...cambios,
  };
}

/** Cabeceras de firma como las calcula el núcleo (`App\Support\FirmaInterna`), sobre los bytes exactos. */
export function cabecerasFirmadas(cuerpo: string, secreto = SECRETO, timestamp = Math.floor(Date.now() / 1000)) {
  const ts = String(timestamp);
  return {
    'content-type': 'application/json',
    'x-timestamp': ts,
    'x-firma': createHmac('sha256', secreto).update(`${ts}.${cuerpo}`).digest('hex'),
  };
}

/** Un aviso que cumple el validador; cada prueba cambia lo que necesita. */
export function avisoValido(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  const ahora = new Date();
  return {
    evento_id: '0f8b6c1e-2a4d-4c8e-9b1a-6f2d3e4a5b6c',
    empresa_id: '00000000-0000-4000-8000-000000000001',
    local_id: '00000000-0000-4000-8000-000000000010',
    destinatario: { tipo: 'rol', rol: 'admin_local', usuario_id: null },
    tipo: 'comprobante.anulado',
    severidad: 'alerta',
    titulo: 'Comprobante anulado',
    mensaje: 'Carlos Ríos anuló un comprobante por S/ 75.00.',
    datos: { comprobante_id: '7c1d9e42-5b3a-4f7e-8a2c-1d4e5f6a7b8c', total: 75 },
    leida_por: [],
    creada_en: ahora,
    expira_en: new Date(ahora.getTime() + 30 * 86_400_000),
    ...cambios,
  };
}

// --- JWT de prueba -----------------------------------------------------------------------------

function parDeClaves() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { publica: publicKey.export({ type: 'spki', format: 'pem' }).toString(), privada: privateKey as KeyObject };
}

/** Par de claves con el que se firman los tokens de las pruebas, y otro ajeno para los rechazos. */
export const CLAVES = parDeClaves();
export const CLAVES_AJENAS = parDeClaves();

export const OTRA_EMPRESA = '00000000-0000-4000-8000-000000000002';
export const OTRA_SEDE = '00000000-0000-4000-8000-000000000020';
export const OTRO_MOZO = '00000000-0000-4000-8000-000000000203';
export const ADMIN = '00000000-0000-4000-8000-000000000101';
export const COCINERO = '00000000-0000-4000-8000-000000000104';
export const PROPIETARIO = '00000000-0000-4000-8000-000000000100';

export interface OpcionesToken {
  sub?: string;
  rol?: string;
  empresa_id?: string | null;
  local_id?: string | null;
  /** Segundos de vigencia desde ahora (negativo: ya vencido). */
  vigencia?: number;
  claves?: ReturnType<typeof parDeClaves>;
  /** Claims que se quitan del token. */
  sin?: string[];
}

export async function emitirToken(o: OpcionesToken = {}): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = {
    rol: o.rol ?? 'mozo',
    empresa_id: o.empresa_id === undefined ? EMPRESA : o.empresa_id,
    local_id: o.local_id === undefined ? SEDE : o.local_id,
    modulos: [],
  };
  for (const quitar of o.sin ?? []) delete claims[quitar];
  const jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(o.sub ?? MOZO)
    .setIssuer('restaurantcloud-nucleo')
    .setAudience('restaurantcloud-servicios')
    .setIssuedAt(ahora)
    .setNotBefore(ahora - 5);
  if (!o.sin?.includes('exp')) jwt.setExpirationTime(ahora + (o.vigencia ?? 600));
  return jwt.sign((o.claves ?? CLAVES).privada);
}

export const conBearer = (token: string) => ({ authorization: `Bearer ${token}` });

/** Aviso listo para insertar; cada prueba cambia el destinatario, la sede o la empresa que necesita. */
export function avisoDe(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return avisoValido({ evento_id: randomUUID(), ...cambios });
}
