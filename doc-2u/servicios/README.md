# Servicios: fichas y contratos

Esta carpeta tiene una ficha por componente de la arquitectura descrita en [../01-arquitectura-microservicios.md](../01-arquitectura-microservicios.md). Este archivo define las reglas comunes y la estructura que sigue cada contrato.

| Archivo | Contenido |
|---|---|
| [nucleo-laravel.md](nucleo-laravel.md) | Cambios en la aplicación principal: JWT, publicación de eventos y endpoints nuevos |
| [ms-analitica.md](ms-analitica.md) | Reportes de ventas y series para la IA |
| [ms-pronostico.md](ms-pronostico.md) | Pronóstico de demanda (IA) |
| [ms-notificaciones.md](ms-notificaciones.md) | Bandeja de avisos y tiempo real |
| [api-gateway.md](api-gateway.md) | Rutas y políticas de Kong |
| [eventos.md](eventos.md) | Catálogo de eventos asíncronos |

**Estado:** estructura definida. Los endpoints y eventos listados son la propuesta inicial; el detalle de cada uno (cuerpos y errores) se completa antes de implementarlo.

---

## 1. Estructura de la ficha de un servicio

Todas las fichas tienen las mismas secciones, en este orden:

1. **Identificación:** responsabilidad, stack, base de datos, puerto local, prefijo en el gateway y destino de despliegue.
2. **Datos que gestiona:** colecciones o tablas propias y su propósito.
3. **API:** tabla resumen de endpoints y, debajo, el detalle de cada uno.
4. **Eventos:** cuáles consume y cuáles publica, con enlace al catálogo.
5. **Dependencias y fallos:** de quién depende y qué ocurre si esa dependencia no responde.
6. **Configuración:** variables de entorno.
7. **Decisiones abiertas.**

## 2. Convenciones de API (todas las APIs)

Se mantiene el formato que ya usa Laravel (`App\Support\ApiResponse`), para que el frontend trate igual a todos los servicios.

**Rutas.** Prefijo `/api/v1`, sustantivos en plural y en español, identificadores UUID. Los endpoints entre servidores van bajo `/interno` y el gateway no los expone.

**Respuesta correcta:**

```json
{
  "exito": true,
  "datos": { },
  "meta": { "timestamp": "2026-11-16T18:30:00-05:00" }
}
```

**Respuesta con error:**

```json
{
  "exito": false,
  "errores": [
    { "codigo": "ERR_RANGO_INVALIDO", "mensaje": "La fecha inicial es posterior a la final.", "detalles": { } }
  ],
  "meta": { "timestamp": "2026-11-16T18:30:00-05:00" }
}
```

**Códigos HTTP:**

| Código | Cuándo |
|---|---|
| 200 / 201 | Correcto / recurso creado |
| 202 | Evento aceptado para procesar |
| 400 | Petición mal formada |
| 401 | Falta el token o no es válido |
| 403 | El rol no tiene permiso |
| 404 | El recurso no existe **o pertenece a otra empresa** (no se distingue, para no revelar que existe) |
| 409 | Conflicto con el estado actual |
| 422 | Datos que no pasan la validación |
| 503 | Una dependencia no responde |

**Autenticación.**

| Quién llama | Cómo se autentica |
|---|---|
| Navegador → microservicio | `Authorization: Bearer <JWT>`. El servicio valida la firma RS256 y toma `empresa_id`, `local_id` y `rol` del token; nunca del cuerpo ni de la URL |
| Servidor → servidor (`/interno`) | Cabeceras `X-Timestamp` (segundos desde 1970, UTC) y `X-Firma` (HMAC-SHA256 en hexadecimal de `timestamp.cuerpo` con el secreto del servicio destino). La firma se calcula sobre los bytes exactos del cuerpo recibido, sin volver a serializarlo. En una petición GET, que no tiene cuerpo, se firma la cadena de consulta tal como se envía (por ejemplo `empresa_id=…&local_id=…`), de modo que ningún parámetro se puede alterar sin invalidar la firma. Se rechaza si el timestamp tiene más de 5 minutos |

**Otras reglas.**

- Fechas en ISO 8601 con zona horaria; días como `YYYY-MM-DD`. Montos como número con dos decimales.
- Listados paginados con `pagina` y `por_pagina`; la respuesta incluye `meta.total`.
- Toda petición lleva `X-Request-Id` (lo genera el gateway si falta); cada servicio lo escribe en sus logs y lo reenvía en sus llamadas.
- Cada servicio expone `GET /health` sin autenticación y su documentación OpenAPI.

## 2.1 Convenciones de datos (todas las bases)

El modelo de cada servicio está en la sección 2 de su ficha. Estas reglas valen para todos:

**Propiedad y acceso**

- Cada base pertenece a un solo servicio. Nadie más se conecta a ella; los demás obtienen los datos por API o por eventos.
- El servicio se conecta con un usuario propio **sin privilegios de administración**. Las migraciones se ejecutan con otro usuario.
- No hay claves foráneas entre bases. Los identificadores de otros servicios (`producto_id`, `mozo_id`, `local_id`…) se guardan como UUID de referencia, junto con una copia del nombre tal como estaba cuando ocurrió el hecho.

**Multiempresa**

- Toda tabla o colección con datos de negocio lleva `empresa_id` y `local_id`.
- Toda consulta filtra por ellos, con los valores del JWT o de la petición interna firmada. El filtro se aplica en una única capa de acceso a datos, no en cada endpoint.
- Los índices de consulta empiezan por `local_id`.

**Tipos**

- **Identificadores:** la clave de una fila es un UUID ordenado por tiempo (versión 7, o la función `fn_uuid_v8()` del núcleo, que usa la misma estructura): los primeros 48 bits son el instante en milisegundos, así que las filas nuevas se insertan al final del índice de la clave primaria y no lo fragmentan. Un secreto que viaja en una URL o autentica algo (token de QR, token de refresco) es un UUID versión 4 o una cadena aleatoria, nunca un UUID ordenado: este revela cuándo se creó y tiene menos bits aleatorios. En el núcleo, `App\Support\Identificador::ordenado()` y `::aleatorio()`; una prueba impide usar `Str::uuid()` directamente.
- Dinero y cantidades: `numeric`, nunca coma flotante.
- Instantes: `timestamptz` (PostgreSQL) o `Date` (MongoDB), siempre con zona. Jornadas: `date`.
- Estados con valores fijos: restricción `CHECK` (PostgreSQL) o validador de esquema (MongoDB).

**Integridad con eventos**

- Aplicar un evento y registrar que se procesó ocurren en la misma transacción, o se garantiza con un índice único. Recibir el mismo evento dos veces no cambia nada.
- Los datos derivados (agregados) se pueden reconstruir a partir de los datos base del mismo servicio.

**Privacidad**

- Ninguna base de microservicio guarda nombre, documento ni teléfono de comensales.

**Evolución del esquema**

- Los cambios se hacen con migraciones versionadas en la carpeta del servicio: Alembic en los servicios Python y un script de índices y validadores en el servicio con MongoDB. El núcleo sigue con migraciones de Laravel.
- La base se puede reconstruir desde cero solo con las migraciones.

## 3. Estructura del contrato de un endpoint

En la sección «API» de cada ficha, cada endpoint se documenta con esta plantilla:

````markdown
### GET /api/v1/analitica/ventas/resumen

**Propósito:** una frase.
**Roles:** admin_local, propietario.
**Autenticación:** JWT.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| desde | query | fecha | sí | Primer día del rango |

**Respuesta 200**

```json
{ "exito": true, "datos": { } }
```

**Errores**

| HTTP | Código | Cuándo |
|---|---|---|
| 422 | ERR_RANGO_INVALIDO | `desde` es posterior a `hasta` |

**Notas:** reglas de negocio, límites, caché.
````

## 4. Estructura del contrato de un evento

Todos los eventos viajan como `POST /interno/eventos` del servicio destino, con el mismo sobre:

```json
{
  "id": "0f8b6c1e-…",
  "tipo": "venta.registrada",
  "version": 1,
  "ocurrido_en": "2026-11-16T18:30:00-05:00",
  "origen": "nucleo",
  "empresa_id": "…",
  "local_id": "…",
  "datos": { }
}
```

**Reglas de entrega.**

- El receptor responde `202` si lo acepta. Si ya había procesado ese `id`, responde `200` y no hace nada (así tolera duplicados).
- Cualquier otra respuesta, o no responder en 5 segundos, cuenta como fallo y el emisor reintenta ese destino con espera creciente (1, 2, 4… minutos, hasta 60). Qué pasa después depende de la causa:
  - **El destino no responde** (sin conexión, timeout, 502/503/504), **rechaza la firma** (401/403) **o no está configurado:** no es culpa del evento, no gasta intentos y se sigue esperando. La entrega pasa a `fallida` solo si lleva 7 días fallando sin interrupción.
  - **El destino responde con un error** (500 u otro 4xx): a los 8 intentos la entrega pasa a `fallida`.
  - **El destino responde 422:** el evento no cumple el contrato y reintentarlo no lo arregla; pasa a `fallida` de inmediato.

  El evento en `outbox_event` queda `procesado` cuando todos sus destinos lo recibieron, o `fallido` si alguno quedó `fallida`.
- Mientras un destino no responde, el emisor pausa sus envíos: al vencer cada pausa sale una sola entrega de prueba y, cuando el destino responde, el resto se reenvía en orden cronológico. Un destino caído no satura la cola ni afecta a los demás.
- Las entregas `fallidas` se revisan con `outbox:estado` y se devuelven a pendiente con `outbox:reenviar-eventos`. Reenviar es seguro: el receptor tolera duplicados.
- No se garantiza el orden de llegada. El receptor usa `ocurrido_en` si el orden importa.
- Un cambio incompatible en `datos` sube `version`; agregar campos opcionales no.
- Los eventos no llevan datos personales de comensales (nombre, documento, teléfono).

**Contratos de forma verificados por pruebas.** La carpeta [contratos/](contratos/) tiene un archivo JSON por cada caso de evento real (por ejemplo `venta.registrada.subcuenta.json`) con los campos de `datos` y el tipo de cada uno: `uuid`, `string`, `int`, `number`, `bool`, `date`, `datetime`, `null`, o el valor fijo de un campo enumerado (`tipo`, `medio_pago`…). Los dos lados se verifican contra el mismo archivo sin compartir código:

- El **núcleo** comprueba que lo que emite tiene exactamente esa forma (mismos campos, mismos tipos, mismos nulos).
- Cada **receptor** convierte el archivo en un ejemplo y comprueba que lo acepta con sus propios modelos y lo aplica.

Si un evento cambia sin actualizar el contrato falla la prueba del núcleo, y si el contrato cambia y el receptor no lo acepta falla la del receptor. Cuando el cambio es intencional se regenera el archivo con `docker exec -e ACTUALIZAR_CONTRATOS=1 restaurantcloudIA_api php artisan test tests/Feature/EventosOutboxPublicacionTest.php` y se revisa el diff junto con las pruebas del receptor. Los valores de ejemplo no se guardan: solo la forma.

En [eventos.md](eventos.md), cada evento se documenta con esta plantilla:

````markdown
### venta.registrada (v1)

**Cuándo se emite:** una frase.
**Emisor:** núcleo. **Receptores:** ms-analítica.

**Datos**

| Campo | Tipo | Descripción |
|---|---|---|
| comprobante_id | uuid | … |

**Ejemplo**

```json
{ }
```

**Qué hace cada receptor:** una línea por receptor.
````
