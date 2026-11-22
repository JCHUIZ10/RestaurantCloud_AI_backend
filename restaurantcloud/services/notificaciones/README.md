# ms-notificaciones

Convierte los eventos del núcleo en avisos para el personal (por rol o por persona), los guarda en una bandeja con estado leído/no leído y los entrega en tiempo real al navegador por SSE (CU-TRANS-01). Contrato: `doc-2u/servicios/ms-notificaciones.md` y `eventos.md` (raíz del repositorio). Este servicio no importa código de otros servicios.

**Stack:** Node.js 22 · TypeScript · Fastify 5 · driver oficial de MongoDB · jose (JWT) · MongoDB propio · vitest.

**Estado (etapa 7 cerrada):** recibe eventos firmados en `POST /interno/eventos` y los convierte en avisos con las reglas de la ficha (siete tipos), sin duplicarlos si llegan dos veces. El núcleo publica los siete eventos y ya no guarda avisos. Expone la bandeja del navegador (5 rutas con JWT) y el canal SSE, ambos por Kong (`/api/v1/notificaciones`); `/interno` y `/health` no se exponen. La campana de React (`apps/web/src/components/notificaciones`) la usan los cinco roles. Límite conocido: una sola instancia, porque el reparto a las conexiones SSE es en memoria.

**Quién ve qué:** `datos/bandeja.ts` es la única capa que decide qué avisos ve cada usuario. `filtroVisible` (MongoDB) y `esVisible` (memoria, para el SSE) expresan la misma regla y una prueba las compara en todas las combinaciones. `dominio/reparto.ts` guarda las conexiones SSE abiertas y reparte cada aviso recién guardado con `esVisible`; `api/notificaciones.ts` valida el JWT (`soporte/jwt.ts`), arma el contexto y abre el canal.

**Cómo se procesa un evento:** `api/eventos.ts` recibe el cuerpo como bytes y comprueba la firma (`soporte/firma.ts`) antes de leerlo; `dominio/procesador.ts` valida el sobre y los datos (`dominio/eventos.ts`, con el vocabulario de los contratos) y aplica la regla del tipo (`dominio/reglas.ts`, funciones puras); `datos/avisos.ts` inserta sin orden y trata el choque con el índice único como «ya procesado».

## Estructura

```
src/
  api/        rutas; validan, llaman a dominio y responden
  dominio/    qué aviso crea cada evento y a quién va (funciones puras)
  datos/      acceso a MongoDB y esquema; aquí vive el filtro de quién ve qué
  soporte/    piezas transversales sin reglas de negocio: respuestas, fechas con zona, X-Request-Id
  config.ts   variables de entorno (se validan todas al arrancar)
  app.ts      construcción de la aplicación con sus dependencias
  main.ts     arranque y cierre ordenado
  esquema.ts  aplica el esquema y termina (servicio notificaciones-migraciones)
tests/        vitest contra MongoDB real
```

Regla de dependencias: `api → dominio → datos`; cualquiera puede usar `soporte`, y `soporte` no importa de las demás capas.

## Cómo correrlo

Con Docker Compose desde `restaurantcloud/`:

```bash
docker compose up -d --build notificaciones   # levanta MongoDB, aplica el esquema y arranca el servicio
curl http://localhost:8003/health
```

`notificaciones-migraciones` aplica el esquema con el usuario administrador y termina; `notificaciones` se conecta con `notificaciones_app`, un rol propio que solo lee, inserta, actualiza y borra avisos (no puede borrar la colección, crear índices ni cambiar o saltarse el validador).

**El usuario de la aplicación** lo crea `infra/mongo/notificaciones/01-usuario.js`, que MongoDB ejecuta solo al inicializar un volumen vacío. En un volumen que ya existe se aplica a mano (es idempotente):

```bash
docker compose exec mongo-notificaciones sh -c \
  'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
     --authenticationDatabase admin --quiet --file /docker-entrypoint-initdb.d/01-usuario.js'
```

Si el volumen se inicializó **sin** las variables del administrador, la imagen activa igual la autenticación pero no hay ningún usuario y ninguna clave funciona. Mientras no exista ningún usuario, MongoDB permite crear el primero desde dentro del contenedor (excepción de localhost):

```bash
docker compose exec mongo-notificaciones sh -c 'mongosh --quiet --eval "db.getSiblingDB(\"admin\").createUser({user: process.env.MONGO_INITDB_ROOT_USERNAME, pwd: process.env.MONGO_INITDB_ROOT_PASSWORD, roles: [{role: \"root\", db: \"admin\"}]})"'
```

y después se aplica el script anterior.

## Pruebas y desarrollo local

Con `mongo-notificaciones` arriba (puerto 27017) y un `.env` en esta carpeta con las variables `TEST_*` de `.env.example` (administrador y usuario de la aplicación):

```bash
npm install
npm test           # vitest contra la base notificaciones_db_test
npm run typecheck  # tsc sin emitir, incluidas las pruebas
```

Las pruebas usan dos conexiones: el administrador aplica el esquema y prepara datos, y el usuario de la aplicación ejecuta lo que hace el servicio, así que también comprueban sus permisos reales.

Para ejecutar el servicio desde el host: `npm run dev` con las variables de `.env.example`.

## Prueba de punta a punta

Con todo el Compose en marcha, desde `restaurantcloud/`:

```bash
./scripts/smoke-notificaciones.sh            # completo, unos 4,5 minutos (incluye apagar y encender el servicio)
./scripts/smoke-notificaciones.sh --rapido   # sin la caída, unos 2 minutos
```

Marca un plato como agotado y anula uno ya preparado por la API real, y comprueba el aviso en la bandeja y en un flujo `curl -N` por Kong, el reenvío sin duplicados, el aislamiento entre empresa, sede, rol y usuario, los tokens y firmas fuera de regla y la caída del servicio. Crea datos con el prefijo `SMOKE` y los limpia al salir (ver el encabezado del script). Las evidencias quedan en `doc-2u/evidencias/smoke-notificaciones/`.
