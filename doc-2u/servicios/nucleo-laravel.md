# Núcleo (aplicación principal Laravel)

Estructura y reglas comunes: [README.md](README.md). Esta ficha solo describe lo que **cambia** en la aplicación principal para integrarse con los microservicios; sus módulos actuales no se modifican.

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Proceso central del negocio (salón, cocina, caja, inventario, reservas, suscripción) y autenticación. Único componente que escribe en la base del núcleo |
| **Stack** | Laravel 13, PHP 8.3, Octane (FrankenPHP) |
| **Datos** | PostgreSQL, Redis, MinIO |
| **Código** | `restaurantcloud/apps/api` |
| **Puerto local** | 8080 |
| **Prefijo en el gateway** | `/api/v1` (todo lo que no pertenece a un microservicio) |

## 2. Datos nuevos

| Tabla (propuesta) | Propósito |
|---|---|
| `outbox_event` (existente, se generaliza) | Eventos pendientes de enviar a los microservicios |
| `recomendacion_reposicion` | Cada recomendación calculada: ejecución del pronóstico que la originó, insumo, cantidad sugerida y decisión del administrador (aceptada, ajustada o descartada) |

## 3. API nueva o modificada

| Método | Ruta | Cambio | Propósito |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Modificado | La respuesta incluye además el JWT para microservicios |
| POST | `/api/v1/auth/refresh` | Modificado | Renueva también el JWT |
| GET | `/api/v1/auth/clave-publica` | Nuevo | Clave pública con la que se validan los JWT |
| POST | `/api/v1/admin/pronosticos` | Nuevo | Pide un pronóstico a ms-pronóstico y calcula la reposición |
| GET | `/api/v1/admin/pronosticos/ultimo` | Nuevo | Último pronóstico y su recomendación |
| PATCH | `/api/v1/admin/reposiciones/{id}` | Nuevo | El administrador acepta, ajusta o descarta una recomendación |

Roles de las rutas de pronóstico: `admin_local` y `propietario`, y solo si el plan de la empresa incluye `incluye_prediccion_ia`.

_Detalle de cada endpoint: por completar con la plantilla del README._

## 4. Eventos

Publica todos los eventos de origen `nucleo` del [catálogo](eventos.md). Cada uno se inserta en `outbox_event` dentro de la misma transacción del negocio y un worker lo envía después. No consume eventos.

## 5. Dependencias y fallos

| Depende de | Si no responde |
|---|---|
| ms-pronóstico | La pantalla de pronóstico informa que no está disponible; el resto del sistema sigue igual |
| ms-analítica, ms-notificaciones | Los eventos quedan en el outbox y se reintentan |

## 6. Configuración nueva

| Variable | Descripción |
|---|---|
| `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_MINUTOS` | Firma y duración del JWT |
| `PRONOSTICO_URL`, `PRONOSTICO_SECRETO` | Dirección y secreto de ms-pronóstico |
| `ANALITICA_URL`, `ANALITICA_SECRETO` | Destino de eventos |
| `NOTIFICACIONES_URL`, `NOTIFICACIONES_SECRETO` | Destino de eventos |

## 7. Decisiones abiertas

- Tabla de suscripciones evento → servicios destino: en configuración o en base de datos.
- Si aceptar una recomendación crea una ficha de compra en borrador.
- Preparación de RLS: rol `rc_app` y prueba de aislamiento en la base (ver la sección 11 del documento de arquitectura).
