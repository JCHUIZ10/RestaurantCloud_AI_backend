/**
 * Aplica el esquema de la colección y termina (servicio `notificaciones-migraciones` del compose).
 *
 * Se ejecuta con el usuario administrador de MongoDB, que solo vive en este proceso: el contenedor
 * que atiende peticiones nunca recibe esas credenciales.
 *
 *   MONGODB_URI, MONGODB_DB, MONGODB_USUARIO, MONGODB_CLAVE, MONGODB_AUTH_SOURCE (normalmente `admin`)
 */

import { aplicarEsquema } from './datos/esquema.js';
import { crearCliente } from './datos/mongo.js';

function variable(nombre: string): string | null {
  const valor = process.env[nombre]?.trim();
  return valor ? valor : null;
}

async function principal(): Promise<void> {
  const uri = variable('MONGODB_URI');
  const base = variable('MONGODB_DB');
  if (!uri || !base) {
    throw new Error('Faltan MONGODB_URI o MONGODB_DB.');
  }

  const cliente = crearCliente({
    uri,
    usuario: variable('MONGODB_USUARIO'),
    clave: variable('MONGODB_CLAVE'),
    authSource: variable('MONGODB_AUTH_SOURCE') ?? 'admin',
    // Al arrancar el compose, MongoDB puede tardar unos segundos más en aceptar conexiones.
    timeoutMs: 30_000,
  });

  try {
    const resultado = await aplicarEsquema(cliente.db(base));
    console.log(JSON.stringify({ nivel: 'info', mensaje: 'Esquema aplicado', base, ...resultado }));
  } finally {
    await cliente.close();
  }
}

principal().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ nivel: 'error', mensaje: 'No se pudo aplicar el esquema', detalle: mensaje }));
  process.exit(1);
});
