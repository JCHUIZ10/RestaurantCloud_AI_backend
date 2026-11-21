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
    cobertura_dias    smallint NOT NULL CHECK (cobertura_dias IN (3,5,7)),
    consumo_previsto  numeric(12,3) NOT NULL,       -- Σ P50 × receta
    margen_seguridad  numeric(12,3) NOT NULL DEFAULT 0, -- Σ reserva × receta (P90 − P50, con mínimo en días sin modelo)
    stock_al_calcular numeric(12,3) NOT NULL,
    stock_minimo_al_calcular numeric(12,3) NOT NULL DEFAULT 0,
    cantidad_sugerida numeric(12,3) NOT NULL CHECK (cantidad_sugerida >= 0),
    prioridad         varchar(10) NOT NULL DEFAULT 'cubierto' CHECK (prioridad IN ('urgente','pronto','cubierto')),
    motivo            varchar(12) NOT NULL DEFAULT 'consumo' CHECK (motivo IN ('consumo','bajo_minimo')),
    alcanza_dias      smallint,                     -- días seguidos que el stock cubre el consumo más probable
    costo_unitario_al_calcular numeric(10,2) NOT NULL DEFAULT 0,
    proveedor_id      uuid REFERENCES proveedor (id) ON DELETE SET NULL, -- último proveedor del insumo
    estado            varchar(12) NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','aceptada','ajustada','descartada')),
    cantidad_final    numeric(12,3),
    decidido_por      uuid REFERENCES usuario (id) ON DELETE SET NULL,
    decidido_en       timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (ejecucion_id, insumo_id)
);
CREATE INDEX ix_recomendacion_local ON recomendacion_reposicion (local_id, created_at DESC);

CREATE TABLE solicitud_pronostico (            -- una fila por pronóstico pedido, haya o no dejado recomendaciones
    id               uuid PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id         uuid NOT NULL REFERENCES local (id) ON DELETE CASCADE,
    ejecucion_id     uuid NOT NULL UNIQUE,         -- ejecución en ms-pronóstico (sin clave foránea)
    cobertura_dias   smallint NOT NULL CHECK (cobertura_dias IN (3,5,7)),
    nivel            smallint NOT NULL CHECK (nivel BETWEEN 0 AND 3),
    dias_con_ventas  integer CHECK (dias_con_ventas >= 0),
    modelo_version   uuid,
    solicitada_por   uuid REFERENCES usuario (id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_solicitud_pronostico_local ON solicitud_pronostico (local_id, created_at DESC);
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
- **`recomendacion_reposicion` guarda con qué se calculó** (`consumo_previsto`, `margen_seguridad`, `stock_al_calcular` y `cobertura_dias`), para poder explicar la cantidad sugerida aunque el stock cambie después. La crea la migración `2026_11_20_000001`; la `2026_11_21_000001` agrega `prioridad`, `motivo`, `alcanza_dias`, el mínimo y el costo del momento y el último proveedor, y crea `solicitud_pronostico`.
- **Fórmula de la reposición.** Para los primeros `cobertura_dias` días del pronóstico y por insumo: `consumo_previsto = Σ P50 del plato × cantidad por plato`, `margen_seguridad = Σ reserva del plato × cantidad por plato` y `cantidad_sugerida = máx(0, consumo_previsto + margen_seguridad − stock)`. La cantidad por plato es `producto_insumo.cantidad_descuenta`. La reserva de un día es `P90 − P50`; en los días con `metodo = baseline` no baja de `PREDICCION_RESERVA_MINIMA × P50` (35 %, ver abajo). Sumar los P90 de varios días es conservador (la suma de cuantiles no es el cuantil de la suma): se prefiere pedir de más que quedarse sin insumo. Los insumos `inactivo` no entran. Un insumo con stock de sobra queda en la lista con cantidad 0.
- **Redondeo.** Se pide de más antes que de menos: las unidades contables (`und`, `botella`, `lata`, `caja`, `paquete`, `saco`, `bidon`, `jaba`) se redondean hacia arriba al entero y `kg` y `L` hacia arriba a un decimal.
- **Prioridad y días que alcanza.** `alcanza_dias` son los días seguidos, desde el primero, que el stock cubre el consumo más probable (P50) del horizonte de 7 días. `urgente`: el stock ya está por debajo del mínimo o no alcanza ni para el primer día; `pronto`: alcanza menos días que la cobertura; `cubierto`: el resto.
- **Insumos bajo su mínimo** (N-4). Todo insumo activo con `stock_actual < stock_minimo` entra en la lista aunque ninguna receta lo consuma, con `motivo = bajo_minimo`, prioridad `urgente` y la cantidad que lo devuelve a su mínimo. Así un local sin ventas ni pronóstico útil igual recibe avisos.
- **Nivel de la predicción** (N-1). `solicitud_pronostico.nivel` se calcula con `historial.dias_con_ventas` de ms-pronóstico y si el local tiene modelo: 0 sin ventas, 1 con menos de 28 días de ventas, 2 con 28 o más y sin modelo, 3 con modelo propio. Los nombres que ve el usuario están en [03-prediccion-en-locales-nuevos.md](../03-prediccion-en-locales-nuevos.md).
- **Reserva mínima** (N-2). `PREDICCION_RESERVA_MINIMA` (0,35) solo se aplica a los días `baseline` y solo en la reposición: el pronóstico guardado en ms-pronóstico no cambia.
- **Aviso de ventas atrasadas** (N-5). Se conserva `datos_desactualizados` solo si la sede tiene comprobantes emitidos posteriores a `datos.actualizados_hasta`; un local nuevo no ve un aviso de fallo.
- **Precisión del modelo** (N-6). En el nivel 3, `confianza` sale de `GET /interno/modelos/vigente`: `error_promedio` es el MAE del modelo y `mejora_pct` cuánto mejora al ingenuo estacional. Las métricas de una versión no cambian: se guardan en la caché un día por `modelo_version`.
- **La decisión humana queda registrada** (`estado`, `cantidad_final`, quién y cuándo): la recomendación es apoyo a la decisión, nunca una compra automática.
- Ambas tablas siguen las reglas del núcleo: política RLS por `local_id` en `recomendacion_reposicion`, igual que el resto de tablas de sede.

## 3. API nueva o modificada

| Método | Ruta | Cambio | Propósito |
|---|---|---|---|
| POST | `/api/v1/auth/login`, `/auth/seleccionar-cuenta`, `/auth/refresh` | Modificado | La respuesta incluye además el JWT para microservicios (también la activación de cuenta y el autologin del registro) |
| POST | `/api/v1/auth/token-servicios` | Nuevo | Renueva solo el JWT, sin rotar la sesión |
| GET | `/api/v1/auth/clave-publica` | Nuevo | Clave pública con la que se validan los JWT |
| POST | `/api/v1/admin/pronosticos` | Nuevo | Pide un pronóstico a ms-pronóstico y calcula la reposición |
| GET | `/api/v1/admin/pronosticos/ultimo` | Nuevo | Último pronóstico y su recomendación |
| PATCH | `/api/v1/admin/reposiciones/{id}` | Nuevo | El administrador acepta, ajusta o descarta una recomendación |

Roles de las rutas de pronóstico: `admin_local` y `propietario`, y solo si el plan de la empresa incluye `incluye_prediccion_ia`.

### JWT para microservicios

El formato del token y cómo se valida están en [README.md](README.md), sección 2. Lo emite `SesionService`, el único punto que crea sesiones, así que todo inicio de sesión lo trae.

**Respuesta de login, selección de cuenta, refresh, activación y registro:** a los campos actuales (`token`, `refresh_token`, `usuario`) se agregan:

| Campo | Tipo | Descripción |
|---|---|---|
| `jwt` | cadena o `null` | JWT para las rutas de microservicios. `null` si el servidor no tiene claves configuradas o la empresa está suspendida |
| `jwt_expira_en` | fecha y hora o `null` | Caducidad del JWT |

`modulos` se calcula con el plan vigente de la empresa: `prediccion` si `incluye_prediccion_ia`, `reportes_avanzados` si `incluye_reportes_avanzados`.

### POST /api/v1/auth/token-servicios

**Propósito:** entregar un JWT nuevo sin rotar la sesión. El frontend lo llama poco antes de que caduque el anterior, o tras un 401 de un microservicio.
**Roles:** cualquier usuario autenticado.
**Autenticación:** token de sesión.

**Respuesta 200**

```json
{ "exito": true, "datos": { "jwt": "eyJ…", "jwt_expira_en": "2026-11-21T15:10:00-05:00" } }
```

| HTTP | Código | Cuándo |
|---|---|---|
| 401 | `TOKEN_INVALIDO_O_EXPIRADO` | La sesión no existe o caducó (lo responde `auth.redis`) |
| 403 | `EMPRESA_SUSPENDIDA` | La empresa está suspendida |
| 503 | `ERR_JWT_NO_CONFIGURADO` | El servidor no tiene `JWT_PRIVATE_KEY` |

Los datos del usuario salen de la sesión, igual que en el resto de rutas; el plan se lee en cada emisión, así que un cambio de plan llega en la siguiente renovación.

### GET /api/v1/auth/clave-publica

**Propósito:** publicar la clave con la que se validan los JWT, para configurar un servicio o el gateway.
**Autenticación:** ninguna (es pública por diseño).

**Respuesta 200:** `datos` = `{ "algoritmo": "RS256", "kid": "3f2a…", "emisor": "restaurantcloud-nucleo", "audiencia": "restaurantcloud-servicios", "clave_publica": "-----BEGIN PUBLIC KEY-----
…" }`. 503 `ERR_JWT_NO_CONFIGURADO` si no hay claves.

### POST /api/v1/admin/pronosticos

**Propósito:** pedir un pronóstico de los platos activos de la sede a ms-pronóstico y calcular la reposición de insumos.
**Roles:** `admin_local`, `propietario` (con sede seleccionada). **Plan:** `incluye_prediccion_ia`.
**Autenticación:** token de sesión.

| Campo del cuerpo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `cobertura_dias` | 3, 5 o 7 | no (7) | Días de consumo que cubre la reposición |
| `solicitud_id` | uuid | no | Para reintentar sin duplicar: con el mismo id se devuelve la misma ejecución y las mismas recomendaciones. Por defecto el núcleo genera uno |

**Qué envía a ms-pronóstico:** `jornada_actual` (`JornadaOperativaService::fechaJornadaDe`, la misma que usan los eventos), `fecha_inicio = jornada_actual + 1`, `horizonte_dias = 7` (siempre; la cobertura se recorta de este lado), los platos con `activo = true` (hasta 500, por nombre) y `dias_cerrados`: los días del periodo en que `JornadaOperativaService::resolver` dice que el local no atiende (día sin turnos o excepción con `cerrado`). Si el local no tiene ningún horario configurado no envía cierres, porque no puede saber cuándo abre.

**Respuesta 201**

```json
{
  "exito": true,
  "datos": {
    "nivel": 3,
    "cobertura_dias": 3,
    "creada_en": "2026-11-21T14:55:02-05:00",
    "confianza": { "error_promedio": 4.9, "mejora_pct": 24 },
    "progreso": null,
    "pronostico": { "ejecucion_id": "…", "modelo": { }, "historial": { "dias_con_ventas": 360 }, "advertencias": [], "resumen": { "modelo": 140, "baseline": 0, "cerrado": 0, "sin_historial": 0 }, "predicciones": [ ] },
    "reposicion": [
      {
        "id": "…", "insumo_id": "…", "insumo": "Pescado fresco", "unidad_medida": "kg",
        "prioridad": "urgente", "motivo": "consumo", "alcanza_dias": 0,
        "consumo_previsto": 45.61, "margen_seguridad": 18.35, "stock_al_calcular": 15.0, "stock_minimo": 5.0,
        "cantidad_sugerida": 49.0, "estado": "pendiente", "cantidad_final": null, "decidido_en": null,
        "costo_estimado": 1372.0,
        "proveedor": { "id": "…", "nombre": "Mercado Mayorista San Pedro", "precio": 28.0, "ultima_compra": "2026-11-18T…" }
      }
    ],
    "totales": {
      "por_prioridad": { "urgente": 4, "pronto": 9, "cubierto": 3 },
      "costo": 6766.93, "proveedores": 2,
      "decisiones": { "pendientes": 16, "aceptadas": 0, "ajustadas": 0, "descartadas": 0 }
    }
  }
}
```

- `nivel`: 0 a 3 (ver las decisiones). `confianza` solo en el nivel 3; `progreso` (`dias_con_ventas` y `faltan_para_siguiente`, nulo si el paso depende de entrenar el modelo) solo en los niveles 0 a 2.
- `pronostico` es la respuesta de ms-pronóstico, con `advertencias` ya contrastadas con las ventas del núcleo. `reposicion` va ordenada por prioridad y luego por `cantidad_sugerida` descendente.
- `costo_estimado` usa la cantidad decidida (`cantidad_final`) o, si aún no hay decisión, la sugerida, por el precio de la última compra. `proveedor` es nulo si el insumo nunca se compró. `totales` no cuenta lo descartado.

**Errores**

| HTTP | Código | Cuándo |
|---|---|---|
| 403 | `ERR_MODULO_PREDICCION_NO_CONTRATADO` | El plan de la empresa no incluye la predicción; el mensaje nombra los planes que sí |
| 422 | `ERR_VALIDACION` | `cobertura_dias` no es 3, 5 o 7, o `solicitud_id` no es uuid |
| 422 | `ERR_LOCAL_REQUERIDO` | El propietario no seleccionó una sede |
| 422 | `ERR_SIN_PRODUCTOS` | La carta no tiene platos activos |
| 503 | `ERR_PRONOSTICO_NO_DISPONIBLE` | ms-pronóstico no responde, no está configurado o responde un error de servidor |
| 503 | `ERR_ANALITICA_NO_DISPONIBLE` | ms-pronóstico no pudo leer el historial. `detalles.ejecucion_id` identifica la ejecución fallida |
| 502 | `ERR_SERIE_INVALIDA` | El historial no cumple el contrato de ms-pronóstico |
| 502 | `ERR_PRONOSTICO_RECHAZADO` | ms-pronóstico rechazó la firma o la forma de la petición: es un defecto del núcleo, no del usuario |

### GET /api/v1/admin/pronosticos/ultimo

**Propósito:** el último pronóstico con recomendaciones de la sede y su reposición, sin recalcular.
**Roles y plan:** los mismos.

**Respuesta 200:** la misma forma que el `POST` (`nivel`, `confianza`, `progreso`, `pronostico`, `reposicion` con las decisiones ya tomadas y `totales`). El `pronostico` se pide a ms-pronóstico por su `ejecucion_id`; si no responde, la respuesta sigue siendo 200 con `pronostico = null`: la reposición es del núcleo y no depende de él.

**Errores:** 404 `ERR_SIN_PRONOSTICO` si la sede nunca generó uno (cuenta cualquier pronóstico, haya dejado recomendaciones o no), más los 403 y 422 de arriba.

### PATCH /api/v1/admin/reposiciones/{id}

**Propósito:** el administrador acepta, ajusta o descarta una recomendación. No genera ninguna compra.
**Roles y plan:** los mismos.

| Campo del cuerpo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `estado` | `aceptada`, `ajustada` o `descartada` | sí | `aceptada` guarda `cantidad_final = cantidad_sugerida`; `descartada` la deja en nulo |
| `cantidad_final` | número ≥ 0 | solo con `ajustada` | Cantidad que el administrador decide pedir |

**Respuesta 200:** la recomendación con su estado, `cantidad_final` y `decidido_en`; `decidido_por` queda en la tabla.

**Errores:** 404 `ERR_NO_ENCONTRADO` (no existe o es de otra sede, sin distinguir), 409 `ERR_REPOSICION_YA_DECIDIDA` (una decisión no se cambia: queda como registro de quién y cuándo; dos decisiones simultáneas las resuelve la base, gana una), 422 `ERR_VALIDACION`.

### POST /api/v1/admin/reposiciones/decisiones

**Propósito:** decidir varias recomendaciones a la vez (la pantalla de compra). O se guardan todas o ninguna.
**Roles y plan:** los mismos.

**Cuerpo:** `decisiones`, de 1 a 200 elementos `{ id, estado, cantidad_final? }` con las mismas reglas del `PATCH`; los `id` no se repiten.
**Respuesta 200:** las recomendaciones decididas, en el mismo orden.
**Errores:** 404 `ERR_NO_ENCONTRADO` o 409 `ERR_REPOSICION_YA_DECIDIDA` si una falla (no se guarda ninguna), 422 `ERR_VALIDACION` (`detalles.campos[].campo` indica, por ejemplo, `decisiones.0.cantidad_final`).

### GET /api/v1/admin/pronosticos/ultimo/exportar

**Propósito:** descargar la lista de compra del último pronóstico, para llevarla al proveedor.
**Roles y plan:** los mismos.

**Parámetros:** `formato` en la consulta, `xlsx` (por defecto) o `pdf`.
**Respuesta 200:** el archivo `compra_sugerida_<local>_<fecha>`, agrupado por proveedor, con lo que el administrador no descartó (su cantidad decidida o, si no decidió, la sugerida), precio, subtotal y total. Los insumos sin proveedor van en un grupo aparte.
**Errores:** 404 `ERR_SIN_PRONOSTICO`, 404 `ERR_SIN_COMPRA` (todo cubierto o descartado), 422 `ERR_VALIDACION` (formato).

### GET /api/v1/propietario/pronosticos

**Propósito:** la predicción de todas las sedes activas de la empresa (CU-PROP-08).
**Roles:** `propietario`. **Plan:** `incluye_prediccion_ia`.

**Respuesta 200:** `sedes` y `panorama`. Cada sede trae `estado` (`ok`, `sin_pronostico` o `no_disponible` si ms-pronóstico no responde), `nivel`, `dias_con_ventas`, `creada_en`, `cobertura_dias`, un `pronostico` reducido a lo que compara (`fecha_inicio`, `total_semana`, `dias[{fecha, total_p50, total_p90}]`, `platos[{nombre, total_p50}]`, `advertencias`) y el `totales` de su reposición. `panorama` suma por día las sedes con pronóstico. No genera pronósticos: el propietario genera el de una sede con `POST /api/v1/admin/pronosticos` y la cabecera `X-Local-Id`.

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
| `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_MINUTOS` | Claves PEM (se aceptan con `\n` literales, para caber en una línea del `.env`) y duración del JWT (10). Sin clave privada no se emiten JWT. `php artisan jwt:claves` genera un par nuevo |
| `PREDICCION_RESERVA_MINIMA` | Reserva mínima de la reposición en los días sin modelo, como fracción de lo más probable (0,35) |
| `PRONOSTICO_URL`, `PRONOSTICO_SECRETO`, `PRONOSTICO_TIMEOUT_SEGUNDOS` | Dirección y secreto de ms-pronóstico, y espera máxima de su respuesta (30 s). El cliente es `PronosticoCliente`; firma con `App\Support\FirmaInterna`, la misma función que el outbox |
| `ANALITICA_URL`, `ANALITICA_SECRETO` | Destino de eventos. Sin URL, no se crean entregas para ese servicio |
| `NOTIFICACIONES_URL`, `NOTIFICACIONES_SECRETO` | Destino de eventos. Sin URL, no se crean entregas para ese servicio |
| `EVENTOS_MAX_INTENTOS`, `EVENTOS_TIMEOUT_SEGUNDOS` | Fallos del receptor tolerados por entrega (8) y espera de respuesta (5 s) |
| `EVENTOS_HORIZONTE_DIAS` | Días que se espera a un destino que no responde antes de dar la entrega por fallida (7) |

Los destinos de cada tipo de evento se definen en `config/eventos.php` (decidido: configuración, no base de datos). Un destino que no está configurado al publicar el evento no recibe ese evento aunque se configure después.

## 7. Decisiones abiertas

- Si aceptar una recomendación crea una ficha de compra en borrador.
- Preparación de RLS: rol `rc_app` y prueba de aislamiento en la base (ver la sección 11 del documento de arquitectura).
