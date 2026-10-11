# RestaurantCloud AI — Contexto y Diseño del Proyecto

> Este documento resume el contexto de negocio, decisiones de diseño y arquitectura acordadas para el proyecto. **No incluye** el detalle de casos de uso (documento aparte) ni los contratos de API (documentos aparte, sujetos a evolución). Sirve como referencia base para el desarrollo asistido por IA.

---

## 1. Descripción del proyecto

**RestaurantCloud AI** es una plataforma SaaS multiempresa (multi-tenant) para la gestión integral de restaurantes: locales, mesas, reservas, carta, pedidos, cocina, inventario, compras, ventas, clientes y reportes, con un componente de IA (forecasting de demanda + recomendaciones de inventario, y a futuro un asistente conversacional).

**Plazo de desarrollo:** 1 mes (MVP). Las decisiones de diseño priorizan **velocidad de implementación sin sacrificar seguridad multiempresa**, dejando funcionalidades avanzadas para fases futuras cuando el costo de desarrollo no se justificaba en el corto plazo.

**Despliegue:** inicia en una VPS única (Docker Compose) con migración natural a la nube (mismos contenedores, sin rediseño).

---

## 2. Actores del sistema

| Rol | Alcance |
| --- | --- |
| Administrador SaaS | Plataforma completa (todas las empresas) |
| Propietario del restaurante | Su empresa y todos sus locales |
| Administrador del local | Un local específico |
| Mozo | Operación de mesas, pedidos y reservas de un local |
| Cocina | Preparación de pedidos e inventario de un local |
| Cajero | Cobro, caja y comprobantes de un local |
| Cliente | Consulta de carta y comprobante (sin cuenta, acceso vía QR) |

El detalle completo de casos de uso por actor está en un documento aparte.

---

## 3. Modelo de negocio (SaaS)

- **Planes por niveles:** Catálogo con IDs enteros (1 = Starter, 2 = Pro, 3 = Enterprise) que combina límites de **4 recursos clave** (`max_locales`, `max_pisos`, `max_mesas`, `max_usuarios`) con módulos de IA como diferenciador (forecasting de demanda y asistente conversacional solo en planes superiores).
- **Registro de empresa (Onboarding):** Autoservicio público enfocado inicialmente en el mercado peruano mediante validación estricta de **RUC** (RUC 20 Persona Jurídica o RUC 10 Persona Natural con Negocio, exactamente 11 dígitos numéricos). Incorpora verificación previa mediante código OTP al buzón de correo del propietario antes de proceder al pago para garantizar que las credenciales sean válidas. La persistencia temporal del formulario se maneja en **Redis** (`registro:onboarding:<UUID>`, TTL 30 min) y `sessionStorage`, manteniendo PostgreSQL completamente limpio hasta que Stripe confirme el cobro.
- **Cambio de plan (Upgrade y Downgrade):**
  - **Upgrade (Escalar a plan superior):** Efectivo de forma inmediata con previsualización transparente del cobro prorrateado de Stripe (`POST /simular-upgrade`) y habilitación instantánea de nuevos límites y módulos de IA.
  - **Downgrade (Reducir a plan inferior):** Programado para el final del ciclo de facturación actual, garantizando que el usuario conserve acceso total a lo que ya pagó durante el mes en curso. Aplica una **política de congelamiento preventivo de creación** ($\min(\text{actual}, \text{futuro})$) y un **asistente de conciliación jerárquica en cascada** (`Locales` → `Pisos` → `Mesas` → `Personal`) bajo un principio de **preservación no destructiva (*soft-archiving*)**, conmutando excedentes a `estado = 'inactivo'` sin jamás eliminar (`DELETE`) registros ni historial de ventas.
- **Cobro recurrente y Dunning:** Administrado mediante una tabla relacional dedicada `suscripcion` vinculada a Stripe Billing (métodos tokenizados vía SetupIntent). Si un cobro mensual falla, se activa un periodo de gracia (Dunning) de 5 días con reintentos automáticos y alertas visuales al propietario, evitando suspender la operación en salón de mozos y cocina hasta agotar la gestión de cobro.

---

## 4. Multi-tenancy y seguridad

**Decisión:** esquema único compartido + `empresa_id` como tenant + **Row-Level Security (RLS) en PostgreSQL**, en lugar de esquema-por-tenant.

**Justificación:**

- RLS falla "cerrado" (si no se fija el tenant, no se ven datos de nadie) — el esquema-por-tenant falla "abierto" (un `search_path` mal cambiado puede filtrar datos de otra empresa silenciosamente), riesgo agravado con *connection pooling*.
- Migraciones y reportes cross-tenant (panel del Admin SaaS) son mucho más simples con esquema único.

**Implementación:** un middleware central del backend resuelve `empresa_id` y el rol desde la sesión autenticada; dentro de **cada transacción** ejecuta `SET LOCAL app.current_empresa_id` (y, cuando corresponda, el contexto de rol). El cliente nunca envía ni decide el tenant. El usuario de aplicación de PostgreSQL no debe tener `BYPASSRLS`; ningún módulo de negocio filtra manualmente por tenant — lo garantiza la base de datos.

**Usuarios y correo:** `usuario.correo` es único **por empresa** (`UNIQUE(empresa_id, correo)`), no global — una misma persona puede tener cuentas independientes en distintas empresas de la plataforma (sin compartir sesión ni contexto). Si el login coincide con más de una cuenta (mismo correo y contraseña en dos empresas), el sistema pide seleccionar la empresa antes de emitir el token.

---

## 5. Arquitectura

**Tipo:** monolito modular **API-first** para el core de negocio, con frontend SPA separado a nivel de código. No se crean microservicios por módulo: se conserva una única fuente de verdad transaccional y un despliegue coordinado. El servicio de IA es la única separación prevista, y se incorpora cuando esa funcionalidad entre al producto.

```

Nginx (reverse proxy, SSL, mismo dominio)
 ├── Frontend SPA (Vue 3 + TypeScript + Vite) → interfaces de salón, KDS, caja y gestión
 ├── Laravel API modular (`/api/v1`)           → lógica de negocio y único acceso de escritura a la BD
 ├── Laravel Octane / SSE                      → streams persistentes de eventos en tiempo real
 ├── Worker de colas Laravel                   → correos, Stripe, PDFs, exportaciones y tareas diferidas
 ├── Redis 7                                   → sesiones, caché, rate limit, colas y Pub/Sub
 ├── PostgreSQL 16 (esquema único + RLS)       → datos transaccionales
 ├── MinIO                                     → documentos, PDFs, imágenes y exportaciones privadas
 └── AI Service (Python/FastAPI, fase posterior) → forecasting + RAG, acceso de solo lectura

```

- **Frontend y backend:** viven en el mismo repositorio, pipeline y despliegue inicial, pero son aplicaciones separadas (`apps/web` y `apps/api`). Nginx las expone bajo el mismo dominio para evitar complejidad innecesaria de CORS y permitir autenticación de stream basada en cookies seguras. El frontend consume exclusivamente contratos REST versionados y SSE; puede desplegarse o evolucionar de forma independiente más adelante.
- **Laravel API → AI Service:** HTTP interno, no expuesto a internet, protegido con API key interna simple. El servicio de IA no bloquea el MVP y solo se habilita cuando forecasting o RAG sea necesario.
- **AI Service:** nunca implementa lógica de tenant/autenticación propia — recibe `empresa_id`/`local_id` ya resueltos por Laravel y no tiene acceso de escritura a la base de datos.
- **Gestión de Sesiones, Tokens y Caché (Redis):** Para evitar la saturación de PostgreSQL por *table bloat* (MVCC dead tuples) y escrituras continuas en WAL debido a creación/eliminación de datos efímeros:
  - **Tokens de sesión / Refresh Tokens:** Almacenados en Redis con TTL nativo (7 a 15 días), permitiendo revocación inmediata y rotación sin consultar la BD relacional. Para la SPA del mismo origen se priorizan cookies seguras con Laravel Sanctum; los tokens de integración externa se gestionan por separado.
  - **Tokens temporales de selección multi-cuenta:** Emitidos como JWTs *stateless* de vida ultracorta (3-5 min) validados en CPU, sin necesidad de persistencia.
  - **Tokens de un solo uso (OTP / Reseteo de contraseña / Magic Link de Invitación):** Gestionados en Redis con consumo atómico (`GETDEL`) y TTL específico (15 min para OTP de autenticación/recuperación; 24 horas para tokens de activación de personal invitado) para mitigar ataques de repetición y prescindir de contraseñas provisionales en texto claro.
  - **Lista negra (Blacklist) de JWTs:** Clave temporal en Redis con TTL equivalente al tiempo de expiración restante del access token al cerrar sesión o al desactivar a un usuario por parte del propietario.
  - **Rate Limiting y Caché de APIs externas:** Control de intentos de autenticación (fuerza bruta) y caché de consultas de DNI/RUC (RENIEC/SUNAT).
- **Tiempo real y notificaciones:** **SSE (Server-Sent Events)**, no WebSocket ni polling — el flujo requerido es mayormente unidireccional (servidor → cliente) y el navegador reconecta automáticamente con `EventSource`. Las conexiones persistentes se atienden con Laravel Octane, no con PHP-FPM puro. Redis Pub/Sub distribuye los eventos entre procesos; Nginx debe configurar `proxy_buffering off` y `X-Accel-Buffering: no` para las rutas de stream. Cada stream se autoriza por usuario, empresa, local y rol; se incluyen *heartbeat*, reconexión y `event_id`/`Last-Event-ID`.
- **Consistencia de eventos:** un cambio operativo se confirma primero en PostgreSQL y solo después se publica. Se implementa patrón **Outbox** para registrar eventos de dominio en la misma transacción y procesarlos de forma asíncrona, evitando notificaciones de transacciones fallidas y permitiendo reintentos idempotentes.
- **Trabajos diferidos:** Laravel Queue/Horizon sobre Redis procesa correos, OTP, webhooks de Stripe, generación de comprobantes/PDF, exportaciones, tareas de reserva y reintentos. Ninguna de esas tareas bloquea solicitudes operativas.
- **Archivos y PDFs:** MinIO, compatible con S3, conserva comprobantes, reportes Z, exportaciones, imágenes y adjuntos en un volumen persistente. PostgreSQL guarda solo metadatos y `object_key`; los archivos privados se entregan tras autorización Laravel mediante URL firmada de vida corta o descarga mediada por API. Los volúmenes locales no sustituyen copias de seguridad externas.
- **Despliegue:** cada componente operativo corre en su propio contenedor Docker desde el día 1 (`docker-compose` en la VPS), migrable a la nube sin rediseño. Nunca hardcodear hosts o credenciales — todo vía variables de entorno. PostgreSQL y MinIO requieren backups periódicos cifrados fuera de la VPS.

### Estilo de arquitectura del backend Laravel

Arquitectura modular organizada **por dominio** (no únicamente por capa técnica). Cada módulo encapsula sus acciones, reglas, políticas, DTOs, eventos, consultas y persistencia. Los módulos se comunican mediante contratos y eventos de dominio; no importan implementaciones internas entre sí.

```

restaurantcloud/
├── apps/
│   ├── api/                         // Laravel
│   │   ├── app/Domains/
│   │   │   ├── Auth/       Tenancy/       Empresas/      Locales/
│   │   │   ├── Mesas/      Reservas/      Pedidos/       Cocina/
│   │   │   ├── Inventario/ Compras/       Caja/          Reportes/
│   │   │   ├── Suscripciones/ Notificaciones/ Archivos/
│   │   │   └── Shared/                 // contratos y utilidades transversales
│   │   ├── app/Jobs/                  // colas y procesadores Outbox
│   │   ├── routes/api.php             // rutas /api/v1
│   │   └── database/migrations/
│   └── web/                           // Vue 3 + TypeScript + Vite + Pinia
│       └── src/modules/               // pantallas y estado por dominio
├── services/ai/                       // FastAPI, fase posterior
├── infra/nginx/
└── docker-compose.yml
```

Cada módulo de dominio contiene, según su necesidad: acciones o casos de uso, reglas de negocio, DTOs/Requests/Resources, políticas de autorización, modelos/repositorios, listeners y eventos. Los controladores HTTP son delgados; la lógica crítica se prueba a nivel de acción o servicio.

**Formato estándar de respuesta de API** (usado en todos los endpoints):

```json
{ "exito": true, "datos": { ... }, "meta": { "timestamp": "..." } }
{ "exito": false, "errores": [{ "codigo": "...", "mensaje": "..." }], "meta": { "timestamp": "..." } }
```

**Convenciones:** rutas versionadas (`/api/v1/...`), DTOs/Requests/Resources separados de los modelos de persistencia, respuestas API homogéneas, Policies/Gates por rol y ámbito, transacciones explícitas para operaciones críticas, PHPStan/Larastan + Pint desde el inicio y pruebas automatizadas de reglas de negocio, RLS y autorización.

---

## 6. Modelo de datos (resumen de entidades)

> El detalle completo de campos, tipos y relaciones está en el documento de Modelo de Datos aparte. Aquí solo el mapa general para contexto.

| Módulo | Entidades |
| --- | --- |
| Plataforma/suscripción | `plan`, `empresa`, `pago`, `usuario` |
| Local y configuración | `local`, `horario_atencion`, `horario_excepcion`, `piso`, `mesa` |
| Carta e inventario | `categoria_producto`, `producto`, `insumo`, `producto_insumo` (receta) |
| Proveedores y compras | `proveedor`, `ficha_compra`, `ficha_compra_detalle` |
| Reservas y pedidos | `reserva`, `reserva_mesa`, `pedido`, `pedido_item` |
| Promociones, caja y comprobantes | `promocion`, `caja`, `comprobante`, `gasto_manual` |
| Incidentes, notificaciones y auditoría | `incidente`, `notificacion`, `log_auditoria` |
| Forecasting | `snapshot_stock_diario` (histórico de ventas se calcula agregando `pedido_item` + `comprobante`, sin tabla adicional) |

**Identificadores:** UUID en todas las tablas.
**Recomendación de índices:** compuestos por `(local_id, fecha)` en tablas de alto volumen (`pedido`, `pedido_item`, `snapshot_stock_diario`).

---

## 7. Decisiones de negocio clave (para no contradecir en el desarrollo)

Estas reglas surgieron de iteraciones específicas durante el diseño y son importantes de respetar al implementar:

- **Anulación de pedidos:** se ejecuta **de inmediato**, sin aprobación previa del administrador; este solo recibe una **notificación**. El motivo es siempre obligatorio. Si el ítem ya estaba listo/entregado al anularse, se registra como **merma** (no revierte el consumo de insumos).
- **Unión/división de mesas:** solo mesas con `permite_union = true` pueden combinarse. La **división solo se permite si todas las mesas unidas están desocupadas** (no hay división de cuentas en curso por esta vía — eso es un caso de uso distinto del Cajero).
- **Reservas:** el Mozo asigna la mesa manualmente desde el inicio (no hay asignación automática por proximidad/algoritmo). La mesa se muestra como "reservada" (informativa, no bloquea uso) desde la creación, y pasa a **bloqueada** recién cuando faltan `minutos_bloqueo_previo` (configurable por local) — con notificación al personal en ese momento. No existe lista de espera.
- **Recetas de productos:** son **obligatorias** al crear un producto (insumo + cantidad en `unidad_consumo`). El sistema no exige precisión perfecta desde el día uno — se corrige con ajustes manuales de stock periódicos.
- **Compras:** no existe "orden de compra" previa — se registra una **ficha de compra** después de realizada la compra real. Una ficha pertenece a un solo proveedor. La recomendación de IA solo sugiere cantidades a comprar (basado en el último proveedor/precio conocido) y se puede **descargar**, pero no genera ningún registro dentro del sistema.
- **Promociones:** el administrador las define con rango de vigencia; el sistema las filtra automáticamente por fecha, pero la **aplicación a una cuenta es manual**, decidida por el Cajero (no hay motor de reglas automático).
- **Comprobantes:** sin impresión física. Tres tipos (Boleta, Factura, Nota de venta). Al pedir DNI/RUC, el sistema busca primero en BD local, luego en una **API externa** (RENIEC/SUNAT), y cachea el resultado. El comprobante se entrega como **pantalla + QR con token único e impredecible** (no hay búsqueda pública por documento, por seguridad).
- **Incidentes:** el Administrador de local los registra y gestiona su estado (abierto/en revisión/resuelto); el Propietario los ve consolidados de todos sus locales y puede marcarlos como **"visto"** (campo independiente del estado operativo).
- **Agotamiento de productos:** al marcar un producto agotado, los ítems de pedidos **en cola** se marcan automáticamente como "no disponible" (con notificación al mozo); los ítems **en preparación** requieren que Cocina decida, uno por uno, si puede continuar o no.
- **Flujo de caja:** se calcula como ingresos (ventas) menos egresos (compras + **gastos manuales** registrables), con balance neto — distinto del arqueo diario de caja (que es solo control de efectivo físico).

---

## 8. Plan de desarrollo (4 semanas, backend y frontend en paralelo)

| Semana | Contenido |
| --- | --- |
| 1 | Base de `apps/api` (Laravel) y `apps/web` (Vue): autenticación, multi-tenancy con RLS, Redis, estructura modular, Empresas/Locales/Usuarios y navegación por rol. Preparar Docker, Nginx, MinIO y el contrato `/api/v1`. |
| 2 | Núcleo operativo: Mesas → Pedidos → Cocina → Caja. Implementar Redis Pub/Sub, Outbox, SSE con Octane y las pantallas reactivas de salón/KDS/POS. |
| 3 | Reservas + Inventario/Compras (insumos, recetas, proveedores, fichas de compra), colas para tareas diferidas y generación segura de documentos. |
| 4 | Reportes, flujo de caja, PDFs/exportaciones, backups de PostgreSQL/MinIO, endurecimiento de autorización/RLS y despliegue en VPS. Forecasting con FastAPI solo si el núcleo operativo está estable y el tiempo alcanza. |

**Fuera de alcance del MVP (diferido a futuro):**

- Reserva y pedido realizados directamente por el Cliente (quedan a cargo exclusivo del Mozo).
- Asistente conversacional de IA para el Cliente (solo si sobra tiempo).
- Gestión de proveedores como catálogo avanzado, fidelización de clientes, control de asistencia/turnos de personal, soporte técnico del Admin SaaS con acceso a datos operativos de un tenant.

---

## 9. Documentos relacionados (no incluidos aquí)

- Casos de uso completos por actor (documento aparte, en evolución).
- Modelo de datos detallado (campos, tipos, restricciones por entidad).
- Contratos de API (Base / Núcleo operativo / Reservas-Inventario-Reportes) — documentos de diseño sujetos a mejora conforme avance la implementación.
