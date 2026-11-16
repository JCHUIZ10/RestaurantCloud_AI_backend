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

| Colección (propuesta) | Propósito |
|---|---|
| `notificaciones` | Un documento por aviso: empresa, local, destinatario (usuario o rol), tipo, título, mensaje, `datos` propios del tipo, usuarios que lo leyeron y fecha de caducidad (índice TTL) |
| `eventos_procesados` | Identificadores de eventos ya aplicados (con TTL) |

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
