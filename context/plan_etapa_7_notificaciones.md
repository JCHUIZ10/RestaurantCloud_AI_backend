# Plan: etapa 7, ms-notificaciones

## Contexto

La guía exige un tercer microservicio, y CU-TRANS-01 (avisos del sistema) está diseñado pero nunca se implementó. Hoy el núcleo inserta directamente en la tabla `notificacion` desde 5 sitios (`CajaController:256`, `CocinaController:1139` y `:1229`, `MozoController:3490` y `:3636`), y **nada la lee**: la campana de administración (`DropdownCampanaNotificaciones.tsx`) consulta `adminService.getNotificacionesCampana()`, que en modo real devuelve `[]` (`realApiServices.ts:1337`). La infraestructura ya está lista: `mongo-notificaciones` en el compose, `services/notificaciones/` vacío, el destino `ms-notificaciones` en `config/eventos.php` (sin URL) y `comprobante.anulado` y `pedido.anulado` ya suscritos.

Resultado esperado: el núcleo deja de guardar avisos y publica eventos. ms-notificaciones (Node 22, TypeScript, Fastify y MongoDB) los convierte en avisos por rol o por usuario, los expone en una bandeja y los entrega en tiempo real por SSE a través de Kong. La campana de React aparece en todos los roles.

## Decisiones (respuesta a tu duda)

**Alcance de eventos: la base, `plato.listo` y `caja.cerrada` con diferencia.** Es lo que mejor justifica el servicio sin inflar la etapa:

- **SSE y Node:** `plato.listo` es el aviso frecuente que debe llegar en el momento (cocina → mozo). Sin él, el tiempo real no se justifica.
- **MongoDB:** siete tipos con `datos` distintos (comprobante, ítem, producto, caja, mesa). Ahí el documento flexible tiene sentido.
- **Reparto:** un evento crea avisos para varios destinatarios. `pedido.anulado` va a cocina y al administrador; `caja.cerrada` va al administrador y al propietario, y así el propietario también tiene bandeja. `plato.listo` es personal, para el mozo de la mesa.
- **Fuera:** reservas (el aviso útil, «reserva próxima», necesita un programador de tareas), `pronostico.generado` (decidido) y la alerta de entregas fallidas (queda en Pendientes).

**Tabla `notificacion`: no se sigue escribiendo, y se retira.** Escribir en los dos lados daría dos fuentes de verdad, una que nadie lee y otra que sí. El registro ya existe en otros dos sitios: el evento en `outbox_event` y la acción en `log_auditoria`. Hay precedente en `2026_11_10_000001_retirar_modulo_incidentes.php`, y la rama `monolito` conserva la versión anterior. El único sitio que **lee** la tabla es la deduplicación de `notificarTurnoPrevioPendiente`, que pasa a consultar `log_auditoria` (acción `caja.turno_previo.aviso_administracion` con el mismo `entidad_id`). Se pierde un matiz: antes se volvía a avisar cuando el anterior estaba leído; ahora se avisa una sola vez por turno pendiente.

**Otras decisiones que fija la 7.0:**
- **JWT del canal SSE:** se usa `fetch` con lectura de flujo y `Authorization: Bearer`. Kong lo valida como cualquier ruta y no hace falta un ticket. El servidor cierra el flujo al llegar el `exp` del token (evento `renovar`), y el cliente renueva el JWT con `jwtServicios` y se reconecta.
- **Una sola instancia:** el reparto se hace en memoria y se documenta el límite (`01-arquitectura`, sección de riesgos).
- **Bandeja del propietario:** avisos dirigidos a `propietario` en toda su empresa. `X-Local-Id` es opcional y sirve para filtrar por sede. Los demás roles ven su sede y su rol, más sus avisos personales.
- **Leído por usuario:** se guarda en `leida_por` con `$addToSet`, como dice la ficha.
- **Tipo desconocido en `/interno/eventos`:** responde 202 y lo ignora, para que el outbox no lo marque como fallido. Un sobre mal formado responde 422.

## Pasos

| Paso | Contenido | Demostrable |
|---|---|---|
| 7.0 Ficha | Detalle de la API en `ms-notificaciones.md` con la plantilla del README. En `eventos.md`, los eventos nuevos y una tabla «tipo → destinatarios, severidad, título y mensaje». Se cierran las 3 decisiones abiertas y se actualiza `api-gateway.md` (ruta del flujo) | El contrato antes que el código |
| 7.1 Esqueleto | Servicio Fastify con salud, sobre de respuestas, `X-Request-Id`, logs, Dockerfile, compose (puerto 8003), usuario de Mongo sin privilegios y un script de esquema (validador e índices, incluido el TTL) | `GET /health` en el contenedor, colección con sus índices |
| 7.2 Recepción | `/interno/eventos` con firma HMAC y reglas puras de tipo a avisos; el duplicado se detecta por el índice único | Eventos de prueba crean avisos y un duplicado no crea otro |
| 7.3 Núcleo | Eventos nuevos y sus contratos JSON, suscripciones, URL de ms-notificaciones en el compose, quitar las 5 inserciones y retirar la tabla | Una acción real en el núcleo produce un aviso en Mongo |
| 7.4 Bandeja y SSE | 5 rutas con JWT, filtro de bandeja en una sola capa, reparto en memoria y flujo SSE con latido | Un cliente con `curl -N` recibe el aviso al instante |
| 7.5 Kong | Servicio `notificaciones` con JWT; el flujo sin búfer y con tiempo de lectura largo; `/interno` oculto | Todo pasa por el puerto 8000 |
| 7.6 React | Maqueta HTML breve (panel y aviso flotante) para aprobar, y después la campana en los dos layouts | Campana en vivo en los 5 roles |
| 7.7 Humo | `scripts/smoke-notificaciones.sh` con evidencias | Prueba de punta a punta para el informe |
| 7.8 Cierre | `plan_seguimiento.md`, fichas, README del servicio y `01-arquitectura` (fila de `notificacion`) | Etapa cerrada |

### 7.1 Esqueleto: `restaurantcloud/services/notificaciones/`

Misma división que ms-analítica: `src/api`, `src/datos`, `src/dominio` y `src/soporte`.

- **Dependencias nuevas (se aprueban con este plan):** `fastify`, `mongodb` (el driver oficial, sin Mongoose: el validador `$jsonSchema` ya está en la base) y `jose` para verificar el JWT. Es el mismo criterio que con PyJWT en ms-analítica: la verificación es la parte delicada y `jose` no tiene dependencias. En desarrollo: `typescript`, `tsx`, `vitest` (ya se usa en el frontend) y `@types/node`. Versiones exactas.
- **`src/datos/esquema.ts`:** se ejecuta como un servicio de una sola pasada, `notificaciones-migraciones` (igual que `analitica-migraciones`). Crea o actualiza el validador (`collMod`) y los 4 índices de la ficha, y se puede repetir sin efecto.
- **Usuario de la aplicación:** `infra/mongo/notificaciones/01-usuario.js` (montado en `docker-entrypoint-initdb.d`) crea un usuario con `readWrite` solo sobre su base. El script de esquema usa el usuario raíz.
- **Variables:** `.env.example` del servicio y del compose, con `NOTIFICACIONES_SECRETO`, `NOTIFICACIONES_PORT`, `DIAS_RETENCION` (30) y el usuario de aplicación de Mongo.
- `.gitattributes` con LF para los `.sh` del servicio, si los hay.

### 7.2 Recepción de eventos

- **`src/soporte/firma.ts`:** traducción de `services/analitica/app/soporte/firma.py`. El HMAC se calcula sobre los bytes exactos del cuerpo; en Fastify se usa `addContentTypeParser('application/json', { parseAs: 'buffer' })` en esa ruta. La comparación es en tiempo constante (`timingSafeEqual`) y la tolerancia, de 5 minutos.
- **`src/soporte/jwt.ts`:** traducción de `app/soporte/jwt.py` con `jose`. El algoritmo queda fijado a RS256, con emisor, audiencia, `exp` y `nbf` (30 s de tolerancia) y los mismos códigos de error (`ERR_TOKEN_INVALIDO`, `ERR_TOKEN_EXPIRADO` y `503 ERR_JWT_NO_CONFIGURADO` con una clave mal formada).
- **`src/dominio/reglas.ts`:** funciones puras que reciben un evento y devuelven los avisos (destinatario, severidad, título, mensaje y `datos`). Sin nombres de comensales.
- **`POST /interno/eventos`:** responde 202 si crea avisos, 200 si todos chocan con el índice único (`E11000`, el evento ya estaba procesado), 422 si el sobre no es válido y 503 si Mongo no responde.
- **Pruebas** contra el Mongo real del compose, con una base `notificaciones_test`: firma (alterada, vencida, ausente), reglas de cada tipo, idempotencia y el **contrato compartido**: cada `doc-2u/servicios/contratos/*.json` se convierte en un ejemplo y se comprueba que se acepta, como hace `services/analitica/tests/test_contratos.py`. La carpeta se monta como en analítica.

### 7.3 Núcleo

- **`app/Domains/Eventos/Services/EventosNucleo.php`:** métodos nuevos que se llaman dentro de la transacción existente, en lugar de cada `DB::table('notificacion')->insert`:
  - `productoAgotado`: los dos sitios de `CocinaController`, con un campo que distingue el quiebre manual del quiebre con órdenes en fuego.
  - `pedidoItemSustituido`: `MozoController:3490`. Va a cocina como crítico.
  - `turnoPrevioPendiente`: `CajaController:256`. Lleva `hay_admin_local` para que la regla elija el destinatario, como hoy.
  - `platoListo`: en `marcarListoTanda` y `despacharPedido`. **Un evento por comanda y pase, no por ítem**; el detalle exacto se fija en la 7.0.
  - `cajaCerrada`: en `CierreTurnoService`, solo cuando hay diferencia en el arqueo.
  - La inserción de `MozoController:3636` (anulación por quiebre) **se elimina sin evento nuevo**: `registrarAnulacion` ya publica `pedido.anulado`.
- **`config/eventos.php`:** suscripciones de los tipos nuevos a `ms-notificaciones`.
- **Compose:** `NOTIFICACIONES_URL` toma por defecto `http://notificaciones:8003` en `api` y `queue`.
- **Contratos:** un JSON por caso en `doc-2u/servicios/contratos/`, generados con `ACTUALIZAR_CONTRATOS=1` y comprobados en `EventosOutboxPublicacionTest`.
- **Retiro de la tabla:** migración `retirar_tabla_notificacion` (con la política RLS) y cambios en `database/sql/02_schema_ddl.sql:853` y `04_rls_security.sql:111`. Después, `scripts/schema-check.sh`.
- **Pruebas que cambian:** `CajaCoreOperativoTest:308,325`, `CocinaDisponibilidadQuiebresTest:205` y `MozoQuiebreSustitucionTest` pasan de comprobar la tabla a comprobar el evento en `outbox_event`. Antes de tocar `HorarioExcepcionReservasTest` hay que revisarla (probablemente solo menciona `metodo_notificacion`).
- Pint sobre los PHP tocados.

### 7.4 Bandeja y SSE

- **Rutas:** `GET /api/v1/notificaciones` (`pagina`, `por_pagina` y `solo_no_leidas`; `meta.total`), `GET /no-leidas/total` (con `criticas`), `PATCH /{id}/leida` (404 si no es suya), `POST /marcar-todas-leidas` y `GET /stream`.
- **`src/datos/bandeja.ts`:** la **única** capa que arma el filtro: siempre `empresa_id` del token, más el aviso personal (`destinatario.usuario_id = sub`) o el aviso a su rol en su sede. El propietario ve su rol en toda la empresa, con `X-Local-Id` opcional. «Leído» significa que `leida_por.usuario_id` contiene `sub`.
- **`src/dominio/reparto.ts`:** registro en memoria de las conexiones abiertas. Al insertar avisos, cada uno se envía a las conexiones que lo pueden ver, con la misma regla que la bandeja y una sola función compartida.
- **Flujo:** `text/event-stream` con un evento `aviso` por aviso nuevo, un latido como comentario cada 25 s y cierre al llegar el `exp` del JWT con el evento `renovar`. Lleva `X-Accel-Buffering: no`.
- **Pruebas:** aislamiento de empresa, sede, rol y usuario en las 5 rutas, incluida una prueba que recorre todas con datos de otra empresa (la lección de la 6.3); leído por un usuario y no por otro del mismo rol; y el SSE con el servidor escuchando de verdad (recibe el aviso, no recibe el de otra sede y se cierra al vencer el token). Mutaciones: quitar el filtro de empresa, el de rol y la comprobación de `sub` en `leida`.

### 7.5 Kong: `infra/kong/kong.yml.plantilla`

- Servicio `notificaciones` con `jwt`, `cors`, `correlation-id` y `rate-limiting`. Una ruta para `/api/v1/notificaciones` y otra para `/api/v1/notificaciones/stream` con `response_buffering: false` y `read_timeout` de 16 minutos (el JWT vive como mucho 15).
- `/interno` y `/health` no se exponen. Tiempos de conexión cortos, como se fijaron para ms-analítica en la 6.6.
- Kong pasa a depender de que `notificaciones` esté sano.

### 7.6 React: `restaurantcloud/apps/web/src/`

- **Maqueta HTML** en `wireframe/usuario/CU-TRANS-01-notificaciones-sistema/` (panel de 440 px, pestañas «No leídas» y «Todas», detalle desplegable, aviso flotante crítico y estado «¡Estás al día!»). Se aprueba y después se pasa a React, como en la 6.5.
- **`services/api/realNotificacionesService.ts`** en `serviceAdapter`, sobre `clienteMicroservicios` (que ya renueva el JWT y reintenta tras un 401).
- **`services/api/flujoNotificaciones.ts`:** lector de SSE sobre `fetch` y `ReadableStream`, sin dependencias. Hace reconexión con espera creciente, renueva el JWT ante el evento `renovar` o un 401 y, si el flujo cae, consulta el total cada 30 s.
- **Componentes:** `components/notificaciones/`, con `CampanaNotificaciones`, `PanelNotificaciones` y `AvisoFlotante` (6 s, `aria-live="assertive"` para los críticos), `Alt+N` y `Esc`. Se montan en `DashboardLayout.tsx` (que reemplaza a `DropdownCampanaNotificaciones` en las líneas 223 y 245, conservando la regla de no montarla dos veces) y en `TerminalLayout.tsx`. Se retiran el componente viejo, `getNotificacionesCampana` y `marcarTodasNotificacionesLeidas` del adaptador falso.
- **Pruebas de vitest:** lector de SSE (eventos partidos entre trozos, latido, `renovar`), reconexión, contador y aviso crítico. Mutaciones en cada uno. Revisión con Playwright a 360, 768 y 1280 px en un rol de terminal y en administración.

### 7.7 Humo: `restaurantcloud/scripts/smoke-notificaciones.sh`

Sigue el estilo de `smoke-gateway.sh`: `--rapido` y `--sin-evidencias`, con evidencias en `doc-2u/evidencias/smoke-notificaciones/<fecha>/`. Recorre:

1. Condiciones previas: contenedores, índices y TTL, y la misma clave pública en todos.
2. Una acción real del núcleo (marcar un plato agotado y anular un ítem) produce el aviso en la bandeja del rol correcto a través de Kong.
3. Un flujo abierto con `curl -N` por Kong recibe el aviso en menos de 2 s.
4. Reenviar el evento con `outbox:reenviar-eventos` no crea otro aviso.
5. Aislamiento entre empresa, sede, rol y usuario. Marcar como leído afecta solo a quien lo hizo.
6. Tokens fuera de regla y firma interna inválida: 401. `/interno` da 404 desde Kong.
7. Caída de ms-notificaciones: el núcleo cobra y anula sin errores, las entregas esperan y, al encender el servicio, los avisos llegan solos.

Limpia lo que crea, o lo marca `SMOKE` como los otros scripts.

## Archivos críticos

- **Nuevos:** `services/notificaciones/**`, `infra/mongo/notificaciones/01-usuario.js`, `scripts/smoke-notificaciones.sh`, `apps/web/src/components/notificaciones/**`, `apps/web/src/services/api/{realNotificacionesService,flujoNotificaciones}.ts` y la migración de retiro.
- **Modificados:** `apps/api/app/Domains/Eventos/Services/EventosNucleo.php`, `config/eventos.php`, `CajaController.php`, `CocinaController.php`, `MozoController.php`, `Domains/Caja/Services/CierreTurnoService.php`, `database/sql/02_schema_ddl.sql`, `04_rls_security.sql`, `docker-compose.yml`, `.env.example`, `infra/kong/kong.yml.plantilla`, `DashboardLayout.tsx`, `TerminalLayout.tsx`, `serviceAdapter`, `doc-2u/servicios/{ms-notificaciones,eventos,api-gateway,nucleo-laravel}.md`, `doc-2u/01-arquitectura-microservicios.md` y `context/plan_seguimiento.md`.
- **Para reutilizar:** `services/analitica/app/soporte/{firma,jwt,respuestas,request_id}.py` (traducir, no importar), `apps/web/src/services/api/{clienteMicroservicios,jwtServicios}.ts`, `App\Domains\Eventos\Services\PublicadorEventos`, `EventosOutboxPublicacionTest` (contratos) y `scripts/smoke-gateway.sh` (estructura y evidencias).

## Verificación

- **Servicio:** `npm test` en `services/notificaciones` contra Mongo real, más `tsc --noEmit`. Mutaciones de los filtros de empresa, rol y usuario, de la firma y del índice único.
- **Núcleo:** las clases afectadas durante el trabajo (`EventosOutboxPublicacionTest`, `CajaCoreOperativoTest`, `CocinaDisponibilidadQuiebresTest`, `MozoQuiebreSustitucionTest`) y la **suite completa** al cerrar (unos 14 min). También `scripts/schema-check.sh`.
- **Frontend:** `npm test`, `npm run build`, `npm run check:ui` y el recorrido con Playwright.
- **Integración:** `./scripts/smoke-notificaciones.sh`. Además, `smoke-gateway.sh --rapido` y `smoke-analitica.sh --rapido` deben seguir en verde, porque Kong y el núcleo cambian.
- **Reglas de trabajo:** commits pequeños por tema, sin coautoría, ningún `git push` sin confirmación y cada cambio de contrato reflejado en `doc-2u/servicios/`.
