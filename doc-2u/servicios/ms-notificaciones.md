# ms-notificaciones

Estructura y reglas comunes: [README.md](README.md).

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

| Índice | Para qué |
|---|---|
| `{ local_id: 1, "destinatario.rol": 1, creada_en: -1 }` | Bandeja de los avisos dirigidos a un rol |
| `{ "destinatario.usuario_id": 1, creada_en: -1 }` (parcial: solo destinatario `usuario`) | Bandeja de los avisos personales |
| `{ evento_id: 1, "destinatario.rol": 1, "destinatario.usuario_id": 1 }` **único** | Un mismo evento no crea dos veces el mismo aviso |
| `{ expira_en: 1 }` con `expireAfterSeconds: 0` (TTL) | Borrado automático |

**Decisiones de diseño**

- **Por qué un documento y no tablas.** Cada tipo de aviso lleva `datos` distintos (un comprobante, un plato, una reserva, un pronóstico). En un modelo relacional haría falta una tabla por tipo o una columna genérica; aquí es el uso natural del motor.
- **El índice único reemplaza a una colección de eventos procesados.** Si el mismo evento llega dos veces, la segunda inserción choca con el índice y se descarta.
- **Un evento puede crear varios avisos** (por ejemplo, uno para `admin_local` y otro para `cajero`): un documento por destinatario.
- **`leida_por` dentro del documento.** Un aviso a un rol lo leen como mucho los usuarios de ese rol en un local, que son pocos, así que la lista no crece sin control. Marcar como leído es una sola operación (`$addToSet`).
- **Validación.** La colección tiene un validador de esquema (`$jsonSchema`) que exige los campos comunes y los valores permitidos de `destinatario.tipo` y `severidad`; `datos` queda libre.
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

Roles: todos los usuarios autenticados. Cada uno ve solo los avisos de su empresa y local dirigidos a su usuario o a su rol.

_Detalle de cada endpoint: por completar con la plantilla del README._

## 4. Eventos

Consume todos los eventos marcados para ms-notificaciones en el [catálogo](eventos.md). Por cada tipo define a qué rol se dirige el aviso y su texto. No publica eventos.

## 5. Dependencias y fallos

| Depende de | Si no responde |
|---|---|
| Su MongoDB | Responde 503 |
| Eventos del núcleo | Los avisos llegan con retraso cuando el outbox reintente |

Si ms-notificaciones cae, la operación del restaurante no se detiene: solo dejan de llegar avisos.

## 6. Configuración

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de escucha |
| `MONGODB_URI` | Conexión a su MongoDB |
| `JWT_PUBLIC_KEY` | Clave pública para validar los JWT |
| `SECRETO_INTERNO` | Secreto HMAC para `/interno` |
| `DIAS_RETENCION` | Días antes de que un aviso caduque |

## 7. Decisiones abiertas

- Cómo recibe el JWT el canal SSE: `EventSource` del navegador no permite cabeceras; se usa `fetch` con lectura de flujo o un ticket de un solo uso en la URL.
- Reparto de avisos entre varias instancias (por ahora, una sola instancia).
- Qué pasa con la tabla `notificacion` del núcleo y las inserciones actuales de caja, cocina y mozo: se reemplazan por eventos.
