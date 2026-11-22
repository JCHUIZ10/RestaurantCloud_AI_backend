/**
 * Conexión con MongoDB.
 *
 * El cliente se crea sin esperar a conectarse: el driver conecta en la primera operación. Así el
 * servicio arranca aunque MongoDB todavía no responda, `/health` informa 503 mientras tanto y,
 * cuando MongoDB vuelve, las peticiones funcionan sin reiniciar nada.
 */

import { MongoClient, type Db, type MongoClientOptions } from 'mongodb';

export const COLECCION_AVISOS = 'notificaciones';

export interface OpcionesConexion {
  uri: string;
  usuario: string | null;
  clave: string | null;
  authSource: string;
  timeoutMs: number;
}

export function crearCliente(opciones: OpcionesConexion): MongoClient {
  const config: MongoClientOptions = {
    serverSelectionTimeoutMS: opciones.timeoutMs,
    connectTimeoutMS: opciones.timeoutMs,
    appName: 'ms-notificaciones',
  };
  // Las credenciales van aparte y no dentro de la URI: así una clave con caracteres especiales
  // (`@`, `:`, `/`) no rompe la dirección ni hay que codificarla.
  if (opciones.usuario !== null && opciones.clave !== null) {
    config.auth = { username: opciones.usuario, password: opciones.clave };
    config.authSource = opciones.authSource;
  }
  return new MongoClient(opciones.uri, config);
}

export async function comprobarConexion(db: Db): Promise<void> {
  await db.command({ ping: 1 });
}
