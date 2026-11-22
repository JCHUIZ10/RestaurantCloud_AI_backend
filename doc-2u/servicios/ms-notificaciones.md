# ms-notificaciones

Estructura y reglas comunes: [README.md](README.md).

**Estado:** implementada y probada (etapa 7 cerrada). Pruebas: `services/notificaciones` (226, contra MongoDB real) y `restaurantcloud/scripts/smoke-notificaciones.sh` (129 comprobaciones de punta a punta: acciones reales del núcleo, bandeja y SSE por Kong, reenvío sin duplicados, aislamiento, tokens y firmas fuera de regla y caída del servicio).

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Bandeja de avisos por usuario y rol, estado leído/no leído y entrega en tiempo real (CU-TRANS-01) |
| **Stack** | Node.js 22, TypeScript, Fastify |
| **Base de datos** | MongoDB propia |
| **Código** | `restaurantcloud/services/notificaciones` |
| **Puerto local** | 8003 |
| **Prefijo en el gateway** | `/api/v1/notificaciones` |
| **Despliegue** | VM en la Unidad II; Cloud Run en la Unidad III |

## 2. Datos que gestiona

Motor: MongoDB. Reglas comunes: [README.md](README.md), sección 2.1.

Una sola colección, `notificaciones`, con un documento por aviso y destinatario:

```json
{
  "_id": "ObjectId",
  "evento_id": "0f8b6c1e-2a4d-4c8e-9b1a-6f2d3e4a5b6c",
  "empresa_id": "00000000-0000-4000-8000-000000000001",
  "local_id": "00000000-0000-4000-8000-000000000010",
  "destinatario": { "tipo": "rol", "rol": "admin_local", "usuario_id": null },
  "tipo": "comprobante.anulado",
  "severidad": "alerta",
  "titulo": "Comprobante anulado",
  "mensaje": "Carlos Ríos anuló un comprobante por S/ 75.00.",
  "datos": { "comprobante_id": "7c1d9e42-…", "total": 75.00 },
  "leida_por": [ { "usuario_id": "…", "en": "2026-11-16T21:45:00-05:00" } ],
  "creada_en": "2026-11-16T21:40:11-05:00",
  "expira_en": "2026-12-16T21:40:11-05:00"
}
```

| Campo | Descripción |
|---|---|
| `evento_id` | Evento que originó el aviso |
| `destinatario` | `tipo` es `rol` (todos los usuarios de ese rol en el local) o `usuario` (una persona) |
| `tipo` | Tipo del evento de origen; determina el título, el mensaje y la forma de `datos` |
| `severidad` | `info`, `alerta` o `critica` |
| `datos` | Campos propios de cada tipo, para que la interfaz enlace con el recurso |
| `leida_por` | Usuarios que ya lo leyeron y cuándo |
| `expira_en` | Fecha en que MongoDB lo borra |

**Índices**

| Nombre | Índice | Para qué |
|---|---|---|
| `bandeja_rol` | `{ local_id: 1, "destinatario.rol": 1, creada_en: -1 }` | Bandeja de los avisos dirigidos a un rol en una sede |
| `bandeja_rol_empresa` | `{ empresa_id: 1, "destinatario.rol": 1, creada_en: -1 }` | Bandeja del propietario, que ve su rol en todas las sedes de la empresa (excepción a «los índices empiezan por `local_id`»: su consulta no tiene sede) |
| `bandeja_usuario` | `{ "destinatario.usuario_id": 1, creada_en: -1 }` (parcial: solo destinatario `usuario`) | Bandeja de los avisos personales |
| `evento_destinatario_unico` | `{ evento_id: 1, "destinatario.rol": 1, "destinatario.usuario_id": 1 }` **único** | Un mismo evento no crea dos veces el mismo aviso |
| `caducidad` | `{ expira_en: 1 }` con `expireAfterSeconds: 0` (TTL) | Borrado automático |

El esquema está en `src/datos/esquema.ts`; lo aplica `src/esquema.ts` (servicio `notificaciones-migraciones`), se puede repetir sin efecto y no cambia un índice que exista con otra definición: informa el conflicto y falla.

**Decisiones de diseño**

- **Por qué un documento y no tablas.** Cada tipo de aviso lleva `datos` distintos (un comprobante, un plato, una reserva, un pronóstico). En un modelo relacional haría falta una tabla por tipo o una columna genérica; aquí es el uso natural del motor.
- **El índice único reemplaza a una colección de eventos procesados.** Si el mismo evento llega dos veces, la segunda inserción choca con el índice y se descarta.
- **Un evento puede crear varios avisos** (por ejemplo, uno para `admin_local` y otro para `cajero`): un documento por destinatario.
- **`leida_por` dentro del documento.** Un aviso a un rol lo leen como mucho los usuarios de ese rol en un local, que son pocos, así que la lista no crece sin control. Marcar como leído es una sola operación (`$addToSet`).
- **Validación.** La colección tiene un validador de esquema (`$jsonSchema`, nivel `strict`, también en las actualizaciones) que exige los campos comunes, uuid en `evento_id`, `empresa_id`, `local_id` y en los usuarios, fechas como `Date`, los valores permitidos de `severidad` y de `destinatario.rol` (solo los cinco roles con bandeja) y la coherencia del destinatario: un aviso a un rol lleva `usuario_id: null` y uno personal lleva `rol: null`. `datos` queda libre.
- **Usuario de la aplicación con un rol propio** (`notificaciones_app`, creado por `infra/mongo/notificaciones/01-usuario.js`): solo `find`, `insert`, `update` y `remove` sobre la colección `notificaciones`, el equivalente del usuario de las bases PostgreSQL. No se usa el rol predefinido `readWrite` porque permite borrar la colección, crear índices y leer otras colecciones. Tampoco puede saltarse el validador (`bypassDocumentValidation`) ni cambiarlo (`collMod`); las pruebas lo comprueban.
- **Caducidad.** `expira_en` se calcula al crear el aviso con `DIAS_RETENCION`.
- **Sin datos de comensales.** Los mensajes pueden nombrar al personal (quién anuló, qué mozo), nunca al cliente.

## 3. API

| Método | Ruta | Propósito | Quién llama |
|---|---|---|---|
| GET | `/api/v1/notificaciones` | Bandeja del usuario, paginada, con filtro de no leídas | Navegador |
| GET | `/api/v1/notificaciones/no-leidas/total` | Contador para la campana | Navegador |
| PATCH | `/api/v1/notificaciones/{id}/leida` | Marca un aviso como leído | Navegador |
| POST | `/api/v1/notificaciones/marcar-todas-leidas` | Marca toda la bandeja como leída | Navegador |
| GET | `/api/v1/notificaciones/stream` | Canal SSE con los avisos nuevos | Navegador |
| POST | `/interno/eventos` | Recepción de eventos | Núcleo, ms-pronóstico |
| GET | `/health` | Estado del servicio | Plataforma |

Roles: `propietario`, `admin_local`, `cajero`, `mozo` y `cocina`. `admin_saas` no tiene empresa ni bandeja: recibe 403 `ERR_ROL_NO_PERMITIDO`. Las rutas no exigen módulo del plan.

**Quién ve qué (regla única).** Un aviso es visible para quien llama si pertenece a **su empresa** (`empresa_id` del JWT, nunca de la URL) y además:

- es personal y va dirigido a su usuario (`destinatario.tipo = "usuario"` y `destinatario.usuario_id = sub`), o
- va dirigido a su rol (`destinatario.tipo = "rol"` y `destinatario.rol = rol` del token) **en su sede** (`local_id` del token).

El propietario no tiene sede en el token: ve los avisos dirigidos al rol `propietario` de **toda su empresa**, y `X-Local-Id` (opcional) los limita a una sede. Un usuario con sede que manda un `X-Local-Id` distinto al de su token recibe 403 `ERR_SEDE_NO_PERMITIDA`. Un aviso de otra empresa, de otra sede o de otro rol responde igual que uno inexistente (404 o ausencia en el listado). La regla vive en una sola función que usan la bandeja, el contador, el marcado y el flujo SSE, para que no se pueda aplicar distinto en cada ruta.

**Lectura por usuario.** Un aviso dirigido a un rol lo leen varias personas, así que «leído» es por usuario: el aviso está leído para quien aparece en `leida_por`. Marcarlo no afecta a los demás.

**Forma de un aviso en la API**

```json
{
  "id": "6740f2a1c3b9d8e7f6a5b4c3",
  "tipo": "pedido.anulado",
  "severidad": "alerta",
  "titulo": "Plato anulado antes del cobro",
  "mensaje": "Carlos Ríos anuló 1 × Lomo saltado (S/ 38.00) de la comanda de Lucía Paredes.",
  "datos": { "pedido_id": "3d367634-…", "anulacion_id": "9b1e…", "monto_total": 38.00 },
  "local_id": "00000000-0000-4000-8000-000000000010",
  "leida": false,
  "leida_en": null,
  "creada_en": "2026-11-16T21:40:11-05:00"
}
```

`id` es el `_id` de MongoDB en hexadecimal. `leida` y `leida_en` se calculan para quien llama a partir de `leida_por`. `empresa_id`, `evento_id`, `destinatario`, `leida_por` y `expira_en` no se devuelven.

### GET /api/v1/notificaciones

**Propósito:** bandeja de quien llama, de la más reciente a la más antigua.
**Roles:** los cinco con bandeja.
**Autenticación:** JWT.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `solo_no_leidas` | query | booleano | no (`false`) | Devuelve solo los avisos que quien llama aún no leyó |
| `pagina` | query | entero | no (1) | Página, desde 1 |
| `por_pagina` | query | entero | no (20) | De 1 a 50 |
| `X-Local-Id` | cabecera | uuid | no | Solo el propietario: limita la bandeja a una sede |

**Respuesta 200:** `datos` es la lista de avisos; `meta` agrega `total`, `pagina` y `por_pagina`. El orden es `creada_en` descendente y, si empatan, `_id` descendente.

**Errores**

| HTTP | Código | Cuándo |
|---|---|---|
| 401 | `ERR_TOKEN_INVALIDO`, `ERR_TOKEN_EXPIRADO` | Token ausente, inválido o caducado |
| 403 | `ERR_ROL_NO_PERMITIDO`, `ERR_SEDE_NO_PERMITIDA` | Rol sin bandeja; sede distinta a la del token |
| 422 | `ERR_PARAMETRO_INVALIDO` | `pagina` o `por_pagina` fuera de rango, o `X-Local-Id` que no es un uuid |
| 503 | `ERR_BD_NO_DISPONIBLE` | MongoDB no responde |

### GET /api/v1/notificaciones/no-leidas/total

**Propósito:** contador de la campana y respaldo del flujo SSE.
**Respuesta 200:** `datos` = `{ "total": 3, "criticas": 1 }`, con los avisos visibles que quien llama aún no leyó; `criticas` cuenta los de severidad `critica`. Mismos errores y cabecera `X-Local-Id` que el listado.

### PATCH /api/v1/notificaciones/{id}/leida

**Propósito:** marca un aviso como leído por quien llama (`$addToSet` sobre `leida_por`).
**Respuesta 200:** `datos` = `{ "id": "…", "leida": true }`. Es idempotente: marcar dos veces responde igual y no duplica el registro.

**Errores:** los de autenticación, más 404 `ERR_AVISO_NO_ENCONTRADO` si el `id` no existe, no es un identificador válido o el aviso no es visible para quien llama.

### POST /api/v1/notificaciones/marcar-todas-leidas

**Propósito:** marca como leídos todos los avisos visibles que quien llama aún no leyó.
**Respuesta 200:** `datos` = `{ "afectadas": 3 }`. Solo toca los avisos visibles; con `X-Local-Id` (propietario) solo los de esa sede.

### GET /api/v1/notificaciones/stream

**Propósito:** canal SSE con los avisos nuevos, para que la campana se actualice sin consultar.
**Autenticación:** `Authorization: Bearer <JWT>`, como todas las rutas. `EventSource` no permite cabeceras, así que el navegador usa `fetch` con lectura del flujo (decidido; ver la sección 7).

**Respuesta 200:** `Content-Type: text/event-stream`, `Cache-Control: no-cache` y `X-Accel-Buffering: no`. El servidor envía:

| Evento | Cuándo | `data` |
|---|---|---|
| `conectado` | Al abrir el canal | `{ "expira_en": "2026-11-16T21:50:00-05:00" }`, el vencimiento del JWT |
| `aviso` | Se crea un aviso visible para quien llama | El aviso, con la forma de la bandeja (`leida: false`) |
| `renovar` | Faltan menos de 30 s para que venza el JWT | `{ "motivo": "token_por_vencer" }`; el servidor cierra el canal a continuación |
| _comentario_ `: latido` | Cada 25 s sin otro tráfico | Mantiene viva la conexión a través de Kong y de los proxies |

Cada `aviso` lleva `id:` con el id del aviso. El canal solo envía avisos **creados desde que se abrió**: no reenvía lo anterior. Al reconectar, el cliente consulta `GET /no-leidas/total` y la bandeja para ponerse al día. Un JWT que vence con el canal abierto no deja pasar más avisos: el canal se cierra siempre al llegar a `exp`.

**Errores:** 401 y 403 como el listado, antes de abrir el canal.

**Notas:** el reparto a las conexiones abiertas es en memoria y por proceso; con más de una instancia haría falta un canal común (ver la sección 7). Una conexión por pestaña es lo esperado; el servicio no limita cuántas abre un usuario, y el límite de peticiones del gateway las cuenta como peticiones solo al abrirse.

### POST /interno/eventos

**Propósito:** recibe un evento del [catálogo](eventos.md), lo convierte en avisos y los guarda.
**Quién llama:** el núcleo (y, si se decide, ms-pronóstico). Se autentica con `X-Timestamp` y `X-Firma`; el gateway no lo expone.

**Cuerpo:** el sobre común de [README.md](README.md), sección 4.

| HTTP | Cuándo | `datos` |
|---|---|---|
| 202 | Se creó al menos un aviso | `{ "estado": "aceptado", "evento_id": "…", "avisos_creados": 2 }` |
| 200 | El evento ya estaba procesado: todos sus avisos chocaron con el índice único | `{ "estado": "duplicado", "evento_id": "…", "avisos_creados": 0 }` |
| 200 | Tipo de evento que este servicio no convierte en avisos (por ejemplo `venta.registrada`), o evento que no produce ningún aviso (un `caja.cerrada` sin diferencia) | `{ "estado": "ignorado", "evento_id": "…", "avisos_creados": 0 }` |
| 401 | Falta la firma, no coincide o el timestamp está fuera de los 5 minutos | `ERR_FIRMA_INVALIDA` |
| 422 | El cuerpo no es JSON, el sobre no cumple el contrato, la `version` no es la soportada o a `datos` le falta un campo obligatorio o tiene un tipo incorrecto (con la lista en `detalles.campos`) | `ERR_EVENTO_INVALIDO` |
| 503 | MongoDB no responde | `ERR_BD_NO_DISPONIBLE` |

Mismas respuestas que ms-analítica. Un tipo desconocido responde 200 `ignorado` y no 422, para que añadir un evento al núcleo antes que a este servicio no lo marque como fallido (el núcleo da por entregada cualquier respuesta 2xx). La firma se comprueba **antes** de leer el cuerpo, sobre sus bytes exactos. Si un reintento encuentra avisos creados a medias (cayó entre dos inserciones), crea los que faltan y responde 202. Los campos que el servicio no usa se ignoran, así que agregar un campo opcional al evento no rompe nada.

**Fechas del aviso.** `creada_en` es el momento del hecho (`ocurrido_en` del evento), no el de la recepción: si el servicio estuvo caído y los eventos llegan tarde por el outbox, la bandeja los ordena y muestra «hace cuánto» según cuándo ocurrieron. `expira_en` = `creada_en` + `DIAS_RETENCION`.

### GET /health

Sin autenticación. 200 `{ "estado": "ok" }` si MongoDB responde; 503 si no.

## 4. Eventos

Consume todos los eventos marcados para ms-notificaciones en el [catálogo](eventos.md). Por cada tipo define a quién se dirige el aviso y su texto. No publica eventos.

**Tipo de evento → avisos.** Un evento crea un documento por destinatario. `{…}` se reemplaza por el dato del evento. La regla es una función pura por tipo (`src/dominio/reglas.ts`), sin acceso a la base, para probarla sola.

| Evento | Destinatario | Severidad | Título | Mensaje |
|---|---|---|---|---|
| `comprobante.anulado` | rol `admin_local` | `alerta` | Comprobante anulado | `{anulado_por_nombre}` anuló un comprobante por S/ `{total}`. |
| `pedido.anulado` | rol `admin_local` | `alerta` | Plato anulado antes del cobro (`Comanda anulada` si `tipo_anulacion` es la comanda completa) | `{anulado_por_nombre}` anuló `{cantidad}` × `{producto_nombre}` (S/ `{monto_total}`) de la comanda de `{mozo_nombre}`. |
| `pedido.anulado` con `es_merma = true` | además, rol `cocina` | `critica` | Plato anulado ya preparado | Se anuló `{cantidad}` × `{producto_nombre}` que ya estaba preparado. Detener o descartar. |
| `pedido.item_sustituido` | rol `cocina` | `critica` | Sustitución urgente: Mesa `{mesa_numero}` | `{producto_original_nombre}` fue sustituido por `{producto_nuevo_nombre}` (`{cantidad}` ×). Prioridad en cocina. |
| `producto.agotado` | roles `admin_local` y `mozo` | `alerta` | Plato agotado: `{producto_nombre}` | `{marcado_por_nombre}` marcó el plato como agotado en cocina. No ofrecerlo. Si `causa` es `resolucion_fuego`, el texto agrega el motivo. |
| `plato.listo` | **usuario** `mozo_id` | `info` | Pedido listo: Mesa `{mesa_numero}` | Listo para llevar: `{cantidad}` × `{producto_nombre}` (una línea por plato, con un máximo de 5 y «y N más»). |
| `caja.turno_previo_pendiente` | rol `admin_local` si `hay_admin_local`; si no, rol `propietario` | `alerta` | Turno #`{turno_correlativo}` pendiente de cierre | `{solicitante_nombre}` no puede abrir turno: el Turno #`{turno_correlativo}` de `{cajero_pendiente_nombre}` sigue abierto. Resuélvelo desde Administración de caja. |
| `caja.cerrada` (solo con diferencia) | roles `admin_local` y `propietario` | `alerta`; `critica` si el faltante supera S/ 100 | Cierre de caja con diferencia | Turno #`{turno_correlativo}` de `{cajero_nombre}`: esperado S/ `{efectivo_esperado}`, contado S/ `{efectivo_contado}` (`{sobrante o faltante}` de S/ `{|discrepancia|}`). Si fue forzado, lo dice. |

Reglas comunes:

- **Los mensajes nombran solo al personal**, nunca al cliente (ni siquiera una reserva lo hará).
- **`datos` del aviso** guarda los identificadores y montos del evento que la interfaz necesita para mostrar el detalle (comanda, mesa, ítem, monto, hora); no se copian campos sin uso.
- **`mesa_numero`** es el texto de la mesa tal como se le muestra al personal (incluye la etiqueta de una unión de mesas).
- **El umbral de S/ 100** del faltante de caja es una constante del servicio, no del evento; si se vuelve configurable, pasa a ser una variable.
- **Varios destinatarios, un evento:** el índice único `evento_id + rol + usuario_id` permite un aviso por cada uno y evita el duplicado al reintentar.
- **Cada evento nuevo** debe agregar su fila a esta tabla, su ficha al catálogo y su contrato en `contratos/`.

## 5. Dependencias y fallos

| Depende de | Si no responde |
|---|---|
| Su MongoDB | Responde 503 |
| Eventos del núcleo | Los avisos llegan con retraso cuando el outbox reintente |
| Clave pública del JWT | Los avisos nuevos siguen llegando por el outbox; las rutas del navegador responden 503 `ERR_JWT_NO_CONFIGURADO` |

Si ms-notificaciones cae, la operación del restaurante no se detiene: solo dejan de llegar avisos. Los eventos esperan en el outbox del núcleo (hasta 7 días) y al volver se crean todos, en orden. Los avisos que **el usuario ve** llegan con ese retraso; no se pierden. Si cae MongoDB, `/interno/eventos` responde 503 y el núcleo reintenta, sin perder nada. Con el canal SSE caído, la campana vuelve a consultar el contador cada 30 s.

## 6. Configuración

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de escucha (8003) |
| `MONGODB_URI` | Dirección de su MongoDB, **sin credenciales** (`mongodb://mongo-notificaciones:27017`) |
| `MONGODB_DB` | Nombre de su base |
| `MONGODB_USUARIO`, `MONGODB_CLAVE` | Usuario de la aplicación (rol `notificaciones_app`, sin privilegios de administración). Van aparte de la URI para que una clave con `@`, `:` o `/` no la rompa |
| `MONGODB_AUTH_SOURCE` | Base donde está definido el usuario; por defecto, `MONGODB_DB` |
| `MONGODB_TIMEOUT_MS` | Espera máxima para encontrar el servidor en cada operación (3000): con MongoDB caído, una petición responde 503 en ese tiempo |
| `JWT_PUBLIC_KEY` | Clave pública PEM para validar los JWT (con `\n` literales o con saltos reales) |
| `JWT_EMISOR`, `JWT_AUDIENCIA` | Valores esperados de `iss` y `aud` (`restaurantcloud-nucleo`, `restaurantcloud-servicios`) |
| `JWT_TOLERANCIA_SEGUNDOS` | Tolerancia de reloj en `exp` y `nbf` (30) |
| `SECRETO_INTERNO` | Secreto HMAC para `/interno` (el `NOTIFICACIONES_SECRETO` del núcleo) |
| `DIAS_RETENCION` | Días antes de que un aviso caduque (30) |
| `LATIDO_SEGUNDOS` | Intervalo del latido del canal SSE (25) |

El esquema (validador e índices) lo crea un proceso de una sola pasada con el usuario administrador de MongoDB, como las migraciones de los servicios Python; el servicio no tiene permiso para cambiarlo. El servicio arranca aunque MongoDB todavía no responda: `/health` da 503 hasta que vuelve, y no hace falta reiniciarlo.

## 7. Decisiones

- **JWT del canal SSE (decidido).** `EventSource` no permite cabeceras, así que el navegador abre el canal con `fetch` y lee el flujo con `Authorization: Bearer`. Se descartó el ticket de un solo uso en la URL: exige un endpoint más, una tabla o caché de tickets y un estado compartido, y el JWT en la URL queda en los logs (Kong ya lo rechaza ahí por política). Como un JWT dura como máximo 15 minutos, el servidor cierra el canal al llegar a `exp` con el evento `renovar`, y el cliente renueva y vuelve a abrir. La reconexión tiene su costo (una consulta de puesta al día), pero se evita un canal abierto con un token vencido.
- **Una sola instancia (decidido).** El reparto es en memoria. Con más de una, un aviso solo llegaría a las conexiones de la instancia que lo recibió. Para escalar se usaría un canal común (Redis o un change stream de MongoDB); queda documentado como límite y no se construye.
- **Tabla `notificacion` del núcleo (decidido): se retira.** El núcleo deja de insertar en ella y publica eventos; la tabla y su política RLS se eliminan. Mantener las dos escrituras daría dos fuentes de verdad, una que nadie lee. El registro de lo ocurrido queda en `outbox_event` y `log_auditoria`.
- **Alcance de tipos (decidido).** Siete tipos de aviso sobre los eventos de la sección 4. Fuera de la etapa 7: `reserva.creada` y `reserva.cancelada`, porque el aviso útil («reserva próxima») requiere un programador de tareas; `pronostico.generado`, porque el pronóstico es síncrono y quien lo pide ya ve el resultado (queda para pronósticos programados); y la alerta por entregas fallidas, que se lee del outbox y no de un evento.
- **Aviso flotante y severidad.** Lo decide la interfaz con la severidad: un aviso `critica` flota 6 s y se anuncia de inmediato al lector de pantalla (`role="alert"`); uno `info` o `alerta` flota 4 s de forma discreta (`role="status"`), porque el mozo necesita «Pedido listo» en el momento y la insignia sola se pierde. Con el panel abierto, los no críticos solo aparecen en la lista. La campana cuenta todos.
- **Dónde va la campana (decidido con la maqueta).** En administración y propietario, siempre visible: en la cabecera de la barra lateral y, en tableta y teléfono, en la barra superior (se monta en un solo sitio según el ancho, para no abrir dos canales). En mozo, cocina y caja es un botón flotante que se muestra solo con avisos sin leer o con el panel abierto; `Alt+N` abre y cierra el panel aunque el botón esté oculto.
- **Abrir el detalle lee el aviso.** El detalle desplegable lo marca como leído pero lo deja a la vista mientras se mira; «Marcar leída» lo saca de «No leídas».
- **Retraso y orden.** `creada_en` es la hora del hecho, no la de la recepción, así que un aviso que llega tarde por una caída se ordena donde le corresponde. El índice TTL de MongoDB borra con hasta un minuto de retraso sobre `expira_en`.
- **Sin deep links (CU-TRANS-01).** Los avisos son autocontenidos: no llevan una ruta ni obligan a navegar.
- **Diferencias con el wireframe CU-TRANS-01**, que se escribió para un backend en Go y PostgreSQL: los endpoints son los de la sección 3 (`/{id}/leida` y `/no-leidas/total` en lugar de `/{id}/leer` y `/resumen`), la prioridad se llama `severidad` (`info`, `alerta`, `critica`, mapeada desde `baja`, `media`/`alta` y `critica`) y el estado de lectura es por usuario (`leida_por`) en lugar de una columna `leida`.
