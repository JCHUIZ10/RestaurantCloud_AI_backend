import { crearApp } from './app.js';
import { leerConfig } from './config.js';
import { crearCliente } from './datos/mongo.js';

const config = leerConfig();
const cliente = crearCliente({
  uri: config.mongodbUri,
  usuario: config.mongodbUsuario,
  clave: config.mongodbClave,
  authSource: config.mongodbAuthSource,
  timeoutMs: config.mongodbTimeoutMs,
});
const app = crearApp({ config, db: cliente.db(config.mongodbDb) });

let cerrando = false;
async function cerrar(senal: string): Promise<void> {
  if (cerrando) return;
  cerrando = true;
  app.log.info({ senal }, 'Cerrando ms-notificaciones');
  try {
    await app.close();
    await cliente.close();
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'Error al cerrar');
    process.exit(1);
  }
}
process.on('SIGTERM', () => void cerrar('SIGTERM'));
process.on('SIGINT', () => void cerrar('SIGINT'));

try {
  await app.listen({ host: '0.0.0.0', port: config.port });
} catch (error) {
  app.log.error({ err: error }, 'No se pudo iniciar el servidor');
  await cliente.close();
  process.exit(1);
}
