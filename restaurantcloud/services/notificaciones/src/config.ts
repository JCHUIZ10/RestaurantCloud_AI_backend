/**
 * Lectura de variables de entorno (ficha del servicio, sección 6).
 *
 * Se valida todo al arrancar: si falta algo obligatorio o un número no es válido, el servicio no
 * arranca y el mensaje dice qué variable revisar, en vez de fallar más tarde en una petición.
 */

export interface Config {
  port: number;
  /** Dirección de MongoDB sin credenciales (por ejemplo `mongodb://mongo-notificaciones:27017`). */
  mongodbUri: string;
  mongodbDb: string;
  /** Usuario de la aplicación: solo lee y escribe avisos, no cambia el esquema. */
  mongodbUsuario: string | null;
  mongodbClave: string | null;
  /** Base donde está definido el usuario (por defecto, la del servicio). */
  mongodbAuthSource: string;
  /** Espera máxima para encontrar el servidor de MongoDB en cada operación. */
  mongodbTimeoutMs: number;
  /** Secreto HMAC compartido con el núcleo para las rutas /interno. */
  secretoInterno: string;
  /** Antigüedad máxima aceptada del X-Timestamp de una petición firmada. */
  firmaToleranciaSegundos: number;
  /** Clave pública PEM de los JWT; sin ella, las rutas del navegador responden 503. */
  jwtPublicKey: string | null;
  jwtEmisor: string;
  jwtAudiencia: string;
  jwtToleranciaSegundos: number;
  diasRetencion: number;
  latidoSegundos: number;
  zonaHoraria: string;
  nivelLog: string;
}

type Entorno = Record<string, string | undefined>;

export class ErrorConfiguracion extends Error {
  override name = 'ErrorConfiguracion';
}

function texto(env: Entorno, nombre: string): string | null {
  const valor = env[nombre]?.trim();
  return valor ? valor : null;
}

function entero(env: Entorno, nombre: string, porDefecto: number, minimo: number, errores: string[]): number {
  const crudo = texto(env, nombre);
  if (crudo === null) return porDefecto;
  if (!/^\d+$/.test(crudo) || Number(crudo) < minimo) {
    errores.push(`${nombre} debe ser un entero mayor o igual a ${minimo} (vale "${crudo}").`);
    return porDefecto;
  }
  return Number(crudo);
}

export function leerConfig(env: Entorno = process.env): Config {
  const errores: string[] = [];
  const obligatoria = (nombre: string): string => {
    const valor = texto(env, nombre);
    if (valor === null) errores.push(`Falta ${nombre}.`);
    return valor ?? '';
  };

  const mongodbDb = obligatoria('MONGODB_DB');
  const config: Config = {
    port: entero(env, 'PORT', 8003, 1, errores),
    mongodbUri: obligatoria('MONGODB_URI'),
    mongodbDb,
    mongodbUsuario: texto(env, 'MONGODB_USUARIO'),
    mongodbClave: texto(env, 'MONGODB_CLAVE'),
    mongodbAuthSource: texto(env, 'MONGODB_AUTH_SOURCE') ?? mongodbDb,
    mongodbTimeoutMs: entero(env, 'MONGODB_TIMEOUT_MS', 3000, 100, errores),
    secretoInterno: obligatoria('SECRETO_INTERNO'),
    firmaToleranciaSegundos: entero(env, 'FIRMA_TOLERANCIA_SEGUNDOS', 300, 1, errores),
    jwtPublicKey: texto(env, 'JWT_PUBLIC_KEY'),
    jwtEmisor: texto(env, 'JWT_EMISOR') ?? 'restaurantcloud-nucleo',
    jwtAudiencia: texto(env, 'JWT_AUDIENCIA') ?? 'restaurantcloud-servicios',
    jwtToleranciaSegundos: entero(env, 'JWT_TOLERANCIA_SEGUNDOS', 30, 0, errores),
    diasRetencion: entero(env, 'DIAS_RETENCION', 30, 1, errores),
    latidoSegundos: entero(env, 'LATIDO_SEGUNDOS', 25, 1, errores),
    zonaHoraria: texto(env, 'ZONA_HORARIA') ?? 'America/Lima',
    nivelLog: texto(env, 'NIVEL_LOG') ?? 'info',
  };

  if ((config.mongodbUsuario === null) !== (config.mongodbClave === null)) {
    errores.push('MONGODB_USUARIO y MONGODB_CLAVE van juntos: falta uno de los dos.');
  }
  try {
    new Intl.DateTimeFormat('es-PE', { timeZone: config.zonaHoraria });
  } catch {
    errores.push(`ZONA_HORARIA no es una zona horaria válida (vale "${config.zonaHoraria}").`);
  }

  if (errores.length > 0) {
    throw new ErrorConfiguracion(`Configuración inválida:\n- ${errores.join('\n- ')}`);
  }
  return config;
}
