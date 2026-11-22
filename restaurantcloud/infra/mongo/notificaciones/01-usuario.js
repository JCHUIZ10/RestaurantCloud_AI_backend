// Crea (o reconcilia) el usuario de la aplicación de ms-notificaciones, sin privilegios de
// administración, para la base del servicio y la de pruebas.
//
// Es idempotente: se puede ejecutar cuantas veces haga falta y deja siempre el mismo resultado
// (rol, contraseña y permisos se reaplican en cada ejecución).
//
// MongoDB lo ejecuta automáticamente solo al inicializar un volumen vacío. Para aplicarlo sobre un
// volumen que ya existe (por ejemplo, tras cambiar la contraseña en el .env):
//   docker compose exec mongo-notificaciones sh -c \
//     'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
//        --authenticationDatabase admin --quiet --file /docker-entrypoint-initdb.d/01-usuario.js'
//
// El administrador crea la colección, el validador y los índices (`notificaciones-migraciones`).
// El usuario de la aplicación solo lee, inserta, actualiza y borra avisos: es el equivalente de
// SELECT, INSERT, UPDATE y DELETE del usuario de las bases PostgreSQL. A diferencia del rol
// predefinido `readWrite`, no puede borrar la colección, crear índices ni saltarse el validador.

const usuario = process.env.NOTIFICACIONES_MONGO_APP_USER;
const clave = process.env.NOTIFICACIONES_MONGO_APP_PASSWORD;
const base = process.env.MONGO_INITDB_DATABASE;

if (!usuario || !clave || !base) {
  throw new Error(
    'Faltan NOTIFICACIONES_MONGO_APP_USER, NOTIFICACIONES_MONGO_APP_PASSWORD o MONGO_INITDB_DATABASE.',
  );
}

const ROL = 'notificaciones_app';
const COLECCION = 'notificaciones';
const bases = [base, `${base}_test`];

// Un rol definido en una base solo puede dar permisos sobre esa base: se crea uno en cada una.
for (const nombre of bases) {
  const destino = db.getSiblingDB(nombre);
  const privilegios = [
    {
      resource: { db: nombre, collection: COLECCION },
      actions: ['find', 'insert', 'update', 'remove'],
    },
  ];
  if (destino.getRole(ROL)) {
    destino.updateRole(ROL, { privileges: privilegios, roles: [] });
  } else {
    destino.createRole({ role: ROL, privileges: privilegios, roles: [] });
  }
}

// El usuario vive en la base del servicio (`authSource`) y recibe el rol de ambas bases.
const destinoUsuario = db.getSiblingDB(base);
const roles = bases.map((nombre) => ({ role: ROL, db: nombre }));
if (destinoUsuario.getUser(usuario)) {
  destinoUsuario.updateUser(usuario, { pwd: clave, roles });
} else {
  destinoUsuario.createUser({ user: usuario, pwd: clave, roles });
}

print(`Usuario ${usuario} listo con el rol ${ROL} en ${bases.join(' y ')}.`);
