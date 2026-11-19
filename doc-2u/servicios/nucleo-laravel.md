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

Motor: PostgreSQL del núcleo (migraciones de Laravel). El esquema actual no se modifica; se agregan dos tablas.

| Tabla | Propósito |
|---|---|
| `outbox_event` (existente, sin cambios) | Un evento por hecho de negocio, insertado en la misma transacción |
| `outbox_entrega` (nueva) | Una fila por evento y servicio destino, con el estado de su envío |
| `recomendacion_reposicion` (nueva) | Cada insumo recomendado a partir de un pronóstico y la decisión del administrador |

```sql
CREATE TABLE outbox_entrega (
    id                 uuid PRIMARY KEY DEFAULT fn_uuid_v8(),
    evento_id          uuid NOT NULL REFERENCES outbox_event (id) ON DELETE CASCADE,
    destino            varchar(40) NOT NULL,        -- 'ms-analitica', 'ms-notificaciones'
    estado             varchar(12) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','entregado','fallido')),
    intentos           smallint NOT NULL DEFAULT 0,
    proximo_intento_en timestamptz NOT NULL DEFAULT now(),
    ultimo_error       text,
    entregado_en       timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    motivo_fallo       varchar(20)                  -- clase del último fallo
                       CHECK (motivo_fallo IN ('no_disponible','no_autorizado','sin_configurar',
                                               'error_receptor','rechazado')),
    fallos_receptor    smallint NOT NULL DEFAULT 0, -- fallos que cuentan contra el límite de intentos
    fallando_desde     timestamptz,                 -- primer fallo de la racha actual
    reenvios           smallint NOT NULL DEFAULT 0, -- veces devuelta a pendiente por un operador
    UNIQUE (evento_id, destino)
);
CREATE INDEX ix_outbox_entrega_pendiente
    ON outbox_entrega (proximo_intento_en) WHERE estado = 'pendiente';
CREATE INDEX ix_outbox_entrega_fallido
    ON outbox_entrega (destino, created_at) WHERE estado = 'fallido';

CREATE TABLE recomendacion_reposicion (
    id                uuid PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id          uuid NOT NULL REFERENCES local (id) ON DELETE CASCADE,
    ejecucion_id      uuid NOT NULL,                -- ejecución en ms-pronóstico (sin clave foránea)
    insumo_id         uuid NOT NULL REFERENCES insumo (id) ON DELETE CASCADE,
    consumo_previsto  numeric(12,3) NOT NULL,       -- pronóstico × receta
    stock_al_calcular numeric(12,3) NOT NULL,
    cantidad_sugerida numeric(12,3) NOT NULL CHECK (cantidad_sugerida >= 0),
    estado            varchar(12) NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','aceptada','ajustada','descartada')),
    cantidad_final    numeric(12,3),
    decidido_por      uuid REFERENCES usuario (id) ON DELETE SET NULL,
    decidido_en       timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (ejecucion_id, insumo_id)
);
CREATE INDEX ix_recomendacion_local ON recomendacion_reposicion (local_id, created_at DESC);
```

**Decisiones de diseño**

- **Por qué una tabla de entregas.** Un evento puede ir a dos servicios y uno puede fallar mientras el otro lo recibe. Con el estado por destino, se reintenta solo el que falló. `outbox_event` conserva su función actual (incluida la generación del PDF del comprobante, que no cambia).
- **Qué destinos recibe cada tipo de evento** se define en configuración; al insertar el evento se crean sus filas de entrega en la misma transacción.
- **Reintentos según la causa del fallo.** `intentos` cuenta todos los envíos y aleja `proximo_intento_en` (1, 2, 4… hasta 60 minutos), pero solo algunos fallos acercan la entrega a `fallido`:

  | Respuesta del destino | `motivo_fallo` | Qué ocurre |
  |---|---|---|
  | Sin conexión, timeout, 502/503/504 | `no_disponible` | No gasta intentos. Pasa a `fallido` tras `EVENTOS_HORIZONTE_DIAS` (7) fallando sin interrupción |
  | 401/403 | `no_autorizado` | Igual: es una configuración que se corrige en el servidor |
  | Destino sin URL o secreto | `sin_configurar` | Igual |
  | 500 u otro 4xx | `error_receptor` | Cuenta en `fallos_receptor`; a los 8 pasa a `fallido` |
  | 422 | `rechazado` | Pasa a `fallido` al instante |

  Con esto, un mantenimiento largo de un microservicio no deja entregas fallidas: los eventos se entregan solos cuando vuelve.
- **Pausa por destino.** Un fallo que afecta al destino (los tres primeros de la tabla) lo pausa: las entregas pendientes se retienen sin gastar intentos ni timeouts. Al vencer la pausa sale una sola entrega de prueba y, cuando el destino responde, las retenidas se adelantan en orden cronológico. El estado vive en la caché (Redis); si se pierde, el sistema vuelve al comportamiento normal y se degrada de nuevo en el siguiente fallo.
- **Reenvío de fallidos.** Una entrega `fallido` no se reintenta sola. `outbox:reenviar-eventos` la devuelve a pendiente, con los contadores en cero y vencimiento en la fecha de su evento, para que se envíe de la más antigua a la más reciente. Reenvía el evento tal como se guardó, sin reconstruirlo con los datos de hoy. Es seguro porque el receptor tolera duplicados por las claves del núcleo (`comprobante_id`, `anulacion_id`), no solo por `evento_procesado`, que se purga a los 30 días.
- **`recomendacion_reposicion` guarda con qué se calculó** (`consumo_previsto`, `stock_al_calcular`), para poder explicar la cantidad sugerida aunque el stock cambie después.
- **La decisión humana queda registrada** (`estado`, `cantidad_final`, quién y cuándo): la recomendación es apoyo a la decisión, nunca una compra automática.
- Ambas tablas siguen las reglas del núcleo: política RLS por `local_id` en `recomendacion_reposicion`, igual que el resto de tablas de sede.

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

**Implementación** (`app/Domains/Eventos`):

- `PublicadorEventos::publicar` guarda el sobre completo en `outbox_event.payload` y una fila de `outbox_entrega` por destino, sin llamadas de red. `EventosNucleo` arma los `datos` de cada evento a partir de las filas ya guardadas en la transacción.
- Puntos de emisión: `venta.registrada` en `CajaController::cobrar` (cuenta completa y subcuenta), `comprobante.anulado` en `CajaController::emitirNotaCredito` y `pedido.anulado` en cada registro de `pedido_anulacion` de `MozoController` (ítem, comanda completa, comanda vacía y sustitución por quiebre).
- Al confirmar la transacción se encola `EntregarEventoJob` (cola `eventos`) por cada entrega. Si eso falla, o para los reintentos, el comando `outbox:despachar-eventos` (cada minuto) encola las entregas vencidas. Cada entrega encolada queda reservada 2 minutos para no encolarla dos veces.
- `PausaDeDestinos` lleva la pausa por destino y `MotivoFallo` clasifica los fallos.
- Comandos de operación:
  - `outbox:estado`: por destino, pendientes, reintentando, fallidos (con su motivo y tipo de evento), antigüedad del más viejo y si el destino está en pausa.
  - `outbox:reenviar-eventos --destino=…`: devuelve los fallidos a pendiente. Opciones `--desde`, `--hasta`, `--tipo`, `--incluir-rechazados` (los 422 no entran por defecto), `--dry-run` (muestra qué haría sin cambiar nada) y `--forzar` (sin comprobar `/health` del destino). Conviene ejecutar siempre primero con `--dry-run`.
- El flujo `comprobante.digital.solicitado` (PDF del comprobante) no cambia.

## 5. Dependencias y fallos

| Depende de | Si no responde |
|---|---|
| ms-pronóstico | La pantalla de pronóstico informa que no está disponible; el resto del sistema sigue igual |
| ms-analítica, ms-notificaciones | Los eventos quedan en el outbox y se reintentan sin límite de intentos durante 7 días; si vuelve antes, se entregan solos y en orden |

## 6. Configuración nueva

| Variable | Descripción |
|---|---|
| `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_MINUTOS` | Firma y duración del JWT |
| `PRONOSTICO_URL`, `PRONOSTICO_SECRETO` | Dirección y secreto de ms-pronóstico |
| `ANALITICA_URL`, `ANALITICA_SECRETO` | Destino de eventos. Sin URL, no se crean entregas para ese servicio |
| `NOTIFICACIONES_URL`, `NOTIFICACIONES_SECRETO` | Destino de eventos. Sin URL, no se crean entregas para ese servicio |
| `EVENTOS_MAX_INTENTOS`, `EVENTOS_TIMEOUT_SEGUNDOS` | Fallos del receptor tolerados por entrega (8) y espera de respuesta (5 s) |
| `EVENTOS_HORIZONTE_DIAS` | Días que se espera a un destino que no responde antes de dar la entrega por fallida (7) |

Los destinos de cada tipo de evento se definen en `config/eventos.php` (decidido: configuración, no base de datos). Un destino que no está configurado al publicar el evento no recibe ese evento aunque se configure después.

## 7. Decisiones abiertas

- Si aceptar una recomendación crea una ficha de compra en borrador.
- Preparación de RLS: rol `rc_app` y prueba de aislamiento en la base (ver la sección 11 del documento de arquitectura).
