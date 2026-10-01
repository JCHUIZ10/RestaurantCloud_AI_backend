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

- **Planes por niveles:** Starter, Pro, Enterprise — combinando límites de recursos (locales, mesas, pisos) con features de IA como diferenciador (forecasting y asistente solo en planes pagos superiores).
- **Registro de empresa:** autoservicio público, con pago vía **Stripe** (único método de pago habilitado para el MVP; se descartó el pago con moneda digital/QR + verificación manual por complejidad operativa, pero **se reutilizará ese esquema en el futuro módulo de reserva online con depósito**).
- **Cambio de plan:** *upgrade* inmediato (prorrateado); *downgrade* al finalizar el ciclo de facturación actual, y solo si el uso actual no excede los límites del nuevo plan.
- **Cobro recurrente:** vía método de pago guardado en Stripe (tokenizado) — la plataforma nunca almacena datos de tarjeta directamente.

---

## 4. Multi-tenancy y seguridad

**Decisión:** esquema único compartido + `empresa_id` como tenant + **Row-Level Security (RLS) en PostgreSQL**, en lugar de esquema-por-tenant.

**Justificación:**

- RLS falla "cerrado" (si no se fija el tenant, no se ven datos de nadie) — el esquema-por-tenant falla "abierto" (un `search_path` mal cambiado puede filtrar datos de otra empresa silenciosamente), riesgo agravado con *connection pooling*.
- Migraciones y reportes cross-tenant (panel del Admin SaaS) son mucho más simples con esquema único.

**Implementación:** un middleware central (capa `auth/` del backend) resuelve `empresa_id` del JWT y ejecuta `SET app.tenant_id` antes de cada consulta. Ningún módulo de negocio filtra manualmente por tenant — lo garantiza la base de datos.

**Usuarios y correo:** `usuario.correo` es único **por empresa** (`UNIQUE(empresa_id, correo)`), no global — una misma persona puede tener cuentas independientes en distintas empresas de la plataforma (sin compartir sesión ni contexto). Si el login coincide con más de una cuenta (mismo correo y contraseña en dos empresas), el sistema pide seleccionar la empresa antes de emitir el token.

---

## 5. Arquitectura

**Tipo:** orientada a servicios simple (no monolito puro, no microservicios completos) — un **monolito modular** para el core de negocio + un servicio separado solo para IA (stack distinto).

```

Nginx (reverse proxy, SSL)
 ├── Core API (Go)         → toda la lógica de negocio, único acceso de escritura a la BD
 ├── AI Service (Python/FastAPI) → forecasting + RAG, acceso de solo lectura a la BD
 └── PostgreSQL (esquema único + RLS)

```

- **Core API → AI Service:** HTTP interno, no expuesto a internet, protegido con API key interna simple.
- **AI Service:** nunca implementa lógica de tenant/autenticación propia — recibe `empresa_id`/`local_id` ya resueltos por el Core API.
- **Notificaciones:** **SSE (Server-Sent Events)**, no WebSocket ni polling — el flujo es unidireccional (servidor → cliente), SSE es nativo en HTTP (sin librerías extra en Go) y el navegador reconecta solo (`EventSource`). Requiere `proxy_buffering off` en Nginx para esa ruta.
- **PHP fue descartado** del stack — todo el backend de negocio es Go; Python solo para IA.
- **Despliegue:** cada servicio en su propio contenedor Docker desde el día 1 (`docker-compose` en la VPS), migrable tal cual a un orquestador en la nube (ECS/Kubernetes/Cloud Run) sin rediseño. Nunca hardcodear host/credenciales — todo vía variables de entorno.

### Estilo de arquitectura del Core API (Go)

Clean Architecture simplificada, organizada **por dominio** (no por capa técnica), con comunicación entre módulos por **interfaces (puertos)**, nunca importando implementaciones concretas entre sí:

```

restaurantcloud-core-api/
├── cmd/api/main.go              // Wiring manual de dependencias
├── internal/
│   ├── empresas/  locales/  mesas/  reservas/
│   ├── pedidos/   cocina/   inventario/  compras/
│   ├── caja/      reportes/ notificaciones/
│   └── auth/      (JWT + middleware de tenant vía RLS)
├── pkg/
│   ├── apiresponse/   (envoltorio estándar de respuestas)
│   ├── apierror/      (errores tipados con código HTTP)
│   └── validator/  logger/
├── platform/
│   ├── database/postgres.go
│   └── router/router.go         (chi)
├── config/
├── migrations/
└── docker-compose.yml
```

Cada módulo de dominio contiene: `domain.go` (entidades + interfaces), `service.go` (lógica de negocio, testeable sin BD real), `repository_pg.go` (implementación concreta), `handler.go` (HTTP).

**Formato estándar de respuesta de API** (usado en todos los endpoints):

```json
{ "exito": true, "datos": { ... }, "meta": { "timestamp": "..." } }
{ "exito": false, "errores": [{ "codigo": "...", "mensaje": "..." }], "meta": { "timestamp": "..." } }
```

**Convenciones:** rutas versionadas (`/api/v1/...`), `context.Context` como primer parámetro en toda función de service/repository, DTOs de entrada/salida separados de las entidades de dominio, `golangci-lint` desde el inicio.

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
| 1 | Auth + multi-tenant (RLS) + Empresas/Locales/Usuarios. Frontend: login, navegación por rol. |
| 2 | Núcleo operativo: Mesas → Pedidos → Cocina → Caja (con notificaciones SSE). |
| 3 | Reservas + Inventario/Compras (insumos, recetas, proveedores, fichas de compra). |
| 4 | Reportes, flujo de caja, IA (forecasting) si el tiempo alcanza, y despliegue en VPS. |

**Fuera de alcance del MVP (diferido a futuro):**

- Reserva y pedido realizados directamente por el Cliente (quedan a cargo exclusivo del Mozo).
- Asistente conversacional de IA para el Cliente (solo si sobra tiempo).
- Gestión de proveedores como catálogo avanzado, fidelización de clientes, control de asistencia/turnos de personal, soporte técnico del Admin SaaS con acceso a datos operativos de un tenant.

---

## 9. Documentos relacionados (no incluidos aquí)

- Casos de uso completos por actor (documento aparte, en evolución).
- Modelo de datos detallado (campos, tipos, restricciones por entidad).
- Contratos de API (Base / Núcleo operativo / Reservas-Inventario-Reportes) — documentos de diseño sujetos a mejora conforme avance la implementación.
