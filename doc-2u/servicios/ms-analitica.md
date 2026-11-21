# ms-analítica

Estructura y reglas comunes: [README.md](README.md).

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Reportes de ventas y desempeño (CU-ADMIN-13) y series de ventas para la IA. Solo lee ventas ya cerradas; no emite comprobantes ni cobra |
| **Stack** | Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PyJWT. La serie y los reportes se calculan en SQL; pandas se incorporaría con la exportación (Unidad III) |
| **Base de datos** | PostgreSQL propia |
| **Código** | `restaurantcloud/services/analitica` |
| **Puerto local** | 8001 |
| **Prefijo en el gateway** | `/api/v1/analitica` |
| **Despliegue** | VM en la Unidad II; Cloud Run en la Unidad III |

## 2. Datos que gestiona

Motor: PostgreSQL. Reglas comunes: [README.md](README.md), sección 2.1.

```mermaid
erDiagram
    venta ||--|{ venta_item : contiene
    venta_item }o--|| producto_visto : "referencia"
    producto_visto ||--o{ venta_diaria_producto : "agrega"
    venta {
        uuid comprobante_id PK
        uuid local_id
        date fecha_operativa
        varchar estado
    }
    venta_item {
        bigint id PK
        uuid comprobante_id FK
        uuid producto_id
        int cantidad
    }
    producto_visto {
        uuid producto_id PK
        date primera_venta
    }
    venta_diaria_producto {
        uuid local_id PK
        uuid producto_id PK
        date fecha_operativa PK
        int unidades
    }
    anulacion {
        uuid anulacion_id PK
        uuid local_id
    }
    evento_procesado {
        uuid evento_id PK
    }
    anulacion_pendiente {
        uuid comprobante_id PK
    }
```

| Tabla | Tipo | Propósito |
|---|---|---|
| `venta` | Base | Una fila por comprobante cobrado |
| `venta_item` | Base | Una fila por plato de cada comprobante |
| `anulacion` | Base | Ítems y comandas anulados antes del cobro |
| `producto_visto` | Derivada | Último nombre y categoría conocidos de cada producto, y su primera venta |
| `venta_diaria_producto` | Derivada | Unidades e ingreso por local, producto y jornada. Es la serie que consume la IA |
| `evento_procesado` | Técnica | Eventos ya aplicados |
| `anulacion_pendiente` | Técnica | Anulaciones que llegaron antes que su venta |

```sql
CREATE TABLE venta (
    comprobante_id   uuid PRIMARY KEY,              -- lo asigna el núcleo
    empresa_id       uuid NOT NULL,
    local_id         uuid NOT NULL,
    pedido_id        uuid NOT NULL,
    tipo             varchar(15) NOT NULL CHECK (tipo IN ('boleta','factura','nota_venta')),
    fecha            timestamptz NOT NULL,
    fecha_operativa  date NOT NULL,
    mozo_id          uuid NOT NULL,
    mozo_nombre      varchar(150) NOT NULL,
    comensales       smallint,
    medio_pago       varchar(20) NOT NULL CHECK (medio_pago IN ('efectivo','tarjeta','billetera_digital')),
    subtotal_consumo numeric(12,2) NOT NULL,
    descuento        numeric(12,2) NOT NULL DEFAULT 0,
    monto_recargo    numeric(12,2) NOT NULL DEFAULT 0,
    total            numeric(12,2) NOT NULL,
    promocion_id     uuid,
    estado           varchar(10) NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','anulada')),
    anulada_en       timestamptz,
    recibido_en      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_venta_local_jornada ON venta (local_id, fecha_operativa);
CREATE INDEX ix_venta_local_fecha   ON venta (local_id, fecha);                    -- ventas por hora
CREATE INDEX ix_venta_local_mozo    ON venta (local_id, mozo_id, fecha_operativa); -- desempeño

CREATE TABLE venta_item (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    comprobante_id   uuid NOT NULL REFERENCES venta (comprobante_id) ON DELETE CASCADE,
    local_id         uuid NOT NULL,                 -- copiado de venta para filtrar sin JOIN
    fecha_operativa  date NOT NULL,
    producto_id      uuid NOT NULL,
    producto_nombre  varchar(150) NOT NULL,
    categoria_id     uuid,
    categoria_nombre varchar(100),
    cantidad         integer NOT NULL CHECK (cantidad > 0),
    precio_unitario  numeric(10,2) NOT NULL,
    subtotal         numeric(12,2) NOT NULL,
    costo_estandar   numeric(10,2)
);
CREATE INDEX ix_item_local_producto ON venta_item (local_id, producto_id, fecha_operativa);
CREATE INDEX ix_item_comprobante    ON venta_item (comprobante_id);

CREATE TABLE producto_visto (
    producto_id      uuid PRIMARY KEY,
    empresa_id       uuid NOT NULL,
    local_id         uuid NOT NULL,
    nombre           varchar(150) NOT NULL,
    categoria_nombre varchar(100),
    primera_venta    date NOT NULL,
    ultima_venta     date NOT NULL
);
CREATE INDEX ix_producto_local ON producto_visto (local_id);

CREATE TABLE venta_diaria_producto (
    local_id        uuid NOT NULL,
    producto_id     uuid NOT NULL,
    fecha_operativa date NOT NULL,
    empresa_id      uuid NOT NULL,
    unidades        integer NOT NULL,
    ingreso         numeric(14,2) NOT NULL,
    PRIMARY KEY (local_id, producto_id, fecha_operativa)
);

CREATE TABLE anulacion (
    anulacion_id       uuid PRIMARY KEY,            -- lo asigna el núcleo
    empresa_id         uuid NOT NULL,
    local_id           uuid NOT NULL,
    pedido_id          uuid NOT NULL,
    pedido_item_id     uuid,
    producto_id        uuid,
    producto_nombre    varchar(150),
    cantidad           integer NOT NULL,
    monto_total        numeric(12,2) NOT NULL,
    tipo_anulacion     varchar(30) NOT NULL,
    motivo_categoria   varchar(50),
    es_merma           boolean NOT NULL DEFAULT false,
    costo_merma        numeric(10,2),
    minutos_espera     integer,
    mozo_id            uuid,
    mozo_nombre        varchar(150),
    anulado_por_id     uuid,
    anulado_por_nombre varchar(150),
    anulado_en         timestamptz NOT NULL,
    fecha_operativa    date NOT NULL
);
CREATE INDEX ix_anulacion_local_jornada ON anulacion (local_id, fecha_operativa);

CREATE TABLE evento_procesado (
    evento_id    uuid PRIMARY KEY,
    tipo         varchar(60) NOT NULL,
    procesado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE anulacion_pendiente (
    comprobante_id uuid PRIMARY KEY,
    anulada_en     timestamptz NOT NULL,
    recibido_en    timestamptz NOT NULL DEFAULT now()
);
```

**Decisiones de diseño**

- **Claves naturales del núcleo.** `comprobante_id` y `anulacion_id` son la clave primaria: garantizan que una venta no se inserte dos veces aunque fallara `evento_procesado`.
- **Qué pasa al recibir cada evento**, siempre en una sola transacción:
  - `venta.registrada`: inserta `venta` y `venta_item`, actualiza `producto_visto` y suma en `venta_diaria_producto`. Si hay una fila en `anulacion_pendiente` para ese comprobante, aplica la anulación y la borra.
  - `comprobante.anulado`: marca la venta como `anulada` y resta sus ítems de `venta_diaria_producto`. Si la venta aún no existe, guarda la fila en `anulacion_pendiente`.
  - `pedido.anulado`: inserta en `anulacion`.
- **Un solo agregado.** Solo se materializa la serie diaria por producto, porque es la consulta más frecuente y la que usa la IA. Los demás reportes (por hora, por mozo, ranking) se calculan sobre `venta` y `venta_item` con sus índices. Se agregan más tablas derivadas solo si una consulta resulta lenta.
- **Reconstruible.** `venta_diaria_producto` y `producto_visto` se pueden recalcular desde `venta` y `venta_item` (ventas con estado `vigente`).
- **Desnormalización deliberada.** `local_id` y `fecha_operativa` se copian en `venta_item` para que las consultas por producto no necesiten unir con `venta`. Los nombres se guardan como estaban al vender: un reporte histórico no cambia si después se renombra el plato.
- **Sin datos de comensales.**
- **Retención:** `evento_procesado` puede purgarse pasados 30 días; el resto se conserva.

## 3. API

| Método | Ruta | Propósito | Quién llama |
|---|---|---|---|
| GET | `/api/v1/analitica/ventas/resumen` | Totales del periodo y comparación con el periodo anterior | Navegador |
| GET | `/api/v1/analitica/ventas/por-hora` | Ventas por franja horaria (horas punta) | Navegador |
| GET | `/api/v1/analitica/productos/ranking` | Platos más y menos vendidos y su rentabilidad | Navegador |
| GET | `/api/v1/analitica/personal/desempeno` | Ventas y tickets por mozo | Navegador |
| GET | `/api/v1/analitica/exportar` | Reporte del periodo en Excel o CSV (Unidad III, no implementado) | Navegador |
| GET | `/interno/series/ventas-diarias` | Unidades vendidas por día y producto de un local | ms-pronóstico |
| POST | `/interno/eventos` | Recepción de eventos | Núcleo |
| GET | `/health` | Estado del servicio | Plataforma |

Roles de las rutas públicas: `admin_local` y `propietario`.

### Reglas comunes de los reportes (CU-ADMIN-13)

**Autenticación:** JWT ([README.md](README.md), sección 2), validado por Kong y de nuevo por el servicio. **Roles:** `admin_local`, `propietario`; cualquier otro, 403 `ERR_ROL_NO_PERMITIDO`.

**Sede.** `admin_local`: la de su token (si envía un `X-Local-Id` distinto, 403 `ERR_SEDE_NO_PERMITIDA`). `propietario`: la de la cabecera `X-Local-Id` (sin ella, 422 `ERR_SEDE_REQUERIDA`). Toda consulta filtra además por el `empresa_id` del token: una sede de otra empresa responde igual que una sede sin ventas.

**Módulo.** `ventas/resumen` y `ventas/por-hora` están en todos los planes; `productos/ranking` y `personal/desempeno` exigen `reportes_avanzados` en `modulos` (403 `ERR_MODULO_NO_INCLUIDO`).

**Parámetros comunes**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `desde` | query | día | sí | Primera jornada |
| `hasta` | query | día | sí | Última jornada (incluida) |
| `X-Local-Id` | cabecera | uuid | solo propietario | Sede |

**Qué cuenta.** Las jornadas son `fecha_operativa` (la del núcleo, no la fecha del reloj). Una venta cuenta si está `vigente`; las anuladas con nota de crédito se informan aparte. Los montos son `venta.total` (con descuentos y recargos) salvo en el ranking, que usa el subtotal de cada ítem a precio de carta. Los nombres de plato son los últimos vistos (`producto_visto`) y los de mozo, los de su venta más reciente del periodo.

**Errores comunes:** los de autenticación (README, sección 2); 422 `ERR_VALIDACION` (falta un parámetro o no tiene formato); 422 `ERR_RANGO_INVALIDO` (`desde` posterior a `hasta`, o más de 366 días contando ambos extremos); 503 `ERR_BD_NO_DISPONIBLE`.

### GET /api/v1/analitica/ventas/resumen

**Propósito:** indicadores del periodo (pestaña 1) y su comparación con el periodo anterior.

| Parámetro adicional | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `comparar` | booleano | no (`true`) | Calcula también el periodo anterior de la misma duración, que termina el día antes de `desde` |

**Respuesta 200**

```json
{
  "exito": true,
  "datos": {
    "local_id": "…", "desde": "2026-11-01", "hasta": "2026-11-20",
    "actual": {
      "ventas_total": 18452.50, "comprobantes": 412, "dias_con_ventas": 20,
      "comprobantes_por_dia": 20.6, "ticket_promedio": 44.79,
      "comensales": 980, "ticket_por_comensal": 18.83, "descuentos": 120.00,
      "anulados": { "comprobantes": 3, "total": 120.00 },
      "por_medio_pago": [ { "medio_pago": "efectivo", "comprobantes": 170, "total": 7601.30, "porcentaje": 41.2 } ],
      "por_tipo": [ { "tipo": "boleta", "comprobantes": 380, "total": 16820.10 } ]
    },
    "anterior": { "desde": "2026-10-12", "hasta": "2026-10-31", "...": "mismos campos que actual" },
    "variacion_pct": { "ventas_total": 12.4, "comprobantes": 5.1, "ticket_promedio": 6.9, "ticket_por_comensal": 3.0 },
    "ultimo_evento_en": "2026-11-20T23:41:12-05:00"
  }
}
```

- `ticket_promedio = ventas_total / comprobantes`. `comprobantes_por_dia` divide entre los días con ventas, para que los días cerrados no bajen el promedio.
- `comensales` suma solo los comprobantes que lo traen (una subcuenta no lo trae), y `ticket_por_comensal` divide el total de esos mismos comprobantes.
- Una métrica sin base para calcularse (cero comprobantes, cero comensales) vale `null`, no 0. `variacion_pct` vale `null` si el valor anterior es 0 o `null`; con `comparar=false`, `anterior` y `variacion_pct` son `null`.
- `por_medio_pago` y `por_tipo` incluyen solo los valores con ventas, ordenados por total descendente.

### GET /api/v1/analitica/ventas/por-hora

**Propósito:** curva horaria del periodo para identificar horas punta (pestaña 1).

**Respuesta 200:** `datos` = `{ local_id, desde, hasta, dias_con_ventas, franjas: [ { "hora": 13, "comprobantes": 96, "total": 4310.20, "promedio_por_dia": 215.51 } ], hora_punta: { "hora": 13, "total": 4310.20 } }`.

- Siempre 24 franjas (0 a 23), con ceros donde no hubo ventas. La hora es la del cobro (`venta.fecha`) en `ZONA_HORARIA`.
- `promedio_por_dia = total / dias_con_ventas`. `hora_punta` es la franja de mayor total (la más temprana si empatan), o `null` sin ventas.

### GET /api/v1/analitica/productos/ranking

**Propósito:** platos más y menos vendidos, su rentabilidad y la matriz de ingeniería de menú (pestaña 2). **Módulo:** `reportes_avanzados`.

**Respuesta 200**

```json
{
  "exito": true,
  "datos": {
    "local_id": "…", "desde": "2026-11-01", "hasta": "2026-11-20",
    "productos": [
      {
        "producto_id": "…", "nombre": "Lomo saltado", "categoria_nombre": "Fondos",
        "unidades": 320, "ingreso": 12160.00, "participacion_pct": 9.8,
        "costo": 4480.00, "margen": 7680.00, "margen_unitario": 24.00,
        "clasificacion": "estrella"
      }
    ],
    "umbrales": { "popularidad_pct": 3.5, "margen_unitario": 19.42 },
    "por_categoria": [ { "categoria_nombre": "Fondos", "unidades": 1400, "ingreso": 50120.00, "participacion_pct": 46.0 } ],
    "sin_costo": 1
  }
}
```

- `productos` va ordenado por unidades descendente; la pantalla toma de ahí los 8 más vendidos y los menos vendidos. `participacion_pct` es la parte de las unidades totales; en `por_categoria`, la parte del ingreso.
- `ingreso` suma el subtotal de los ítems (precio de carta, antes del descuento del comprobante). `costo = Σ costo_estandar × cantidad`; si algún ítem del plato en el periodo no trae `costo_estandar`, `costo`, `margen`, `margen_unitario` y `clasificacion` son `null` y el plato cuenta en `sin_costo`.
- **Ingeniería de menú** (Kasavana y Smith), solo sobre los platos con costo (N): un plato es *popular* si su participación en unidades es al menos el 70 % de la participación media (`0,7 × 100 / N`), y *rentable* si su `margen_unitario` es al menos el margen medio ponderado (`Σ margen / Σ unidades`). `estrella`: popular y rentable; `caballito`: popular y poco rentable; `puzle`: poco popular y rentable; `rezagado`: ninguna de las dos. Con N = 0, `umbrales` es `null`.

### GET /api/v1/analitica/personal/desempeno

**Propósito:** ventas y anulaciones por mozo (pestaña 3). **Módulo:** `reportes_avanzados`.

**Respuesta 200**

```json
{
  "exito": true,
  "datos": {
    "local_id": "…", "desde": "2026-11-01", "hasta": "2026-11-20",
    "mozos": [
      {
        "mozo_id": "…", "mozo_nombre": "Rosa Quispe",
        "comprobantes": 140, "ventas_total": 6320.40, "ticket_promedio": 45.15,
        "comensales": 330, "comprobantes_anulados": 1,
        "anulaciones": { "cantidad": 4, "monto": 96.00, "mermas": 1, "costo_merma": 8.50 }
      }
    ],
    "totales": { "comprobantes": 412, "ventas_total": 18452.50, "anulaciones": { "cantidad": 9, "monto": 210.00, "mermas": 2, "costo_merma": 15.10 } }
  }
}
```

- `mozos` va ordenado por `ventas_total` descendente. Incluye a quien tuvo ventas o anulaciones en el periodo.
- `anulaciones` viene de `pedido.anulado` (ítems o comandas anuladas antes del cobro), atribuida al `mozo_id` de la anulación; `comprobantes_anulados`, de las notas de crédito. Las anulaciones sin mozo cuentan solo en `totales`.


### POST /interno/eventos

**Propósito:** recibir un evento del núcleo y aplicarlo a los datos de analítica.
**Autenticación:** firma HMAC (`X-Timestamp`, `X-Firma`).

**Cuerpo:** el sobre común de eventos (README, sección 4). Tipos aceptados: `venta.registrada`, `comprobante.anulado` y `pedido.anulado`.

**Respuestas**

| HTTP | `datos.estado` | Cuándo |
|---|---|---|
| 202 | `aceptado` | Evento nuevo, aplicado |
| 200 | `duplicado` | Ese `id` ya se había procesado; no se hace nada |
| 200 | `ignorado` | Tipo de evento que este servicio no usa. Se responde 200 para que el emisor no lo reintente |

**Errores**

| HTTP | Código | Cuándo |
|---|---|---|
| 401 | `ERR_FIRMA_INVALIDA` | Falta la firma, no coincide o el timestamp tiene más de 5 minutos |
| 422 | `ERR_EVENTO_INVALIDO` | El cuerpo no es JSON, el sobre está incompleto, la `version` no está soportada, o `datos` no cumple el contrato. `detalles.campos` lista cada campo y su motivo |
| 503 | `ERR_BD_NO_DISPONIBLE` | No se pudo guardar; el emisor debe reintentar |

**Notas**

- Guardar el `id` en `evento_procesado` y aplicar el evento ocurren en una sola transacción, y esa transacción termina antes de responder: un 202 significa que el evento quedó guardado.
- Un 422 indica un error del emisor que el reintento no arregla; el núcleo lo marca como `fallido` para revisión, sin reintentos, y conserva el código de error en `outbox_entrega.ultimo_error`.
- Los eventos de una misma venta pueden llegar a la vez o en desorden. El servicio serializa los eventos de un mismo comprobante, y una anulación que llega antes que su venta queda en `anulacion_pendiente`: al llegar la venta entra ya anulada y no suma a la serie.
- Un evento con el mismo `comprobante_id` o `anulacion_id` que otro ya aplicado, aunque traiga otro `id`, no duplica nada.
- El nombre y la categoría de un producto solo se actualizan con una venta igual o más reciente que la última registrada.

### GET /interno/series/ventas-diarias

**Propósito:** entregar a ms-pronóstico las unidades vendidas por jornada y producto de un local.
**Autenticación:** firma HMAC sobre la cadena de consulta (sección 2 del [README](README.md)), tal como se envía. Sin firma válida responde 401 antes de validar los parámetros.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `empresa_id` | query | uuid | sí | Empresa dueña del local |
| `local_id` | query | uuid | sí | Local |
| `desde` | query | día | sí | Primera jornada |
| `hasta` | query | día | sí | Última jornada (incluida) |
| `producto_ids` | query | lista de uuid | no | Limita la respuesta a esos productos. Se repite el parámetro por cada uno: `producto_ids=a&producto_ids=b` |

**Respuesta 200**

```json
{
  "exito": true,
  "datos": {
    "local_id": "00000000-0000-4000-8000-000000000010",
    "desde": "2026-08-01",
    "hasta": "2026-11-15",
    "ultimo_evento_en": "2026-11-15T23:41:12-05:00",
    "productos": [
      {
        "producto_id": "00000000-0000-4000-8000-000000000431",
        "nombre": "Lomo saltado",
        "categoria_nombre": "Fondos",
        "primera_venta": "2026-08-01",
        "serie": [
          { "fecha": "2026-08-01", "unidades": 14, "ingreso": 532.00 },
          { "fecha": "2026-08-02", "unidades": 0, "ingreso": 0.00 }
        ]
      }
    ]
  },
  "meta": { "timestamp": "2026-11-16T08:00:00-05:00" }
}
```

**Errores**

| HTTP | Código | Cuándo |
|---|---|---|
| 401 | `ERR_FIRMA_INVALIDA` | Firma ausente o incorrecta |
| 422 | `ERR_RANGO_INVALIDO` | `desde` posterior a `hasta`, o rango mayor a 730 días (contando ambos extremos: 730 se acepta y 731 no) |
| 422 | `ERR_VALIDACION` | Falta un parámetro o no tiene el formato esperado (uuid o `YYYY-MM-DD`) |

**Notas**

- La serie de cada producto es continua: incluye con `unidades: 0` las jornadas sin ventas entre `max(primera_venta, desde)` y `hasta`. Así el modelo no tiene que rellenar huecos. Un producto cuya primera venta es posterior a `hasta` no aparece.
- Las ventas anuladas ya están descontadas. Un producto cuya única venta se anuló sigue apareciendo, con ceros desde su `primera_venta`.
- Un local sin ventas en el rango devuelve `productos: []` con 200; no es un error.
- Los productos se ordenan por nombre. Solo se devuelven los del `empresa_id` y `local_id` indicados.
- `ultimo_evento_en` es el instante en que llegó la última venta del local (`MAX(venta.recibido_en)`), en la zona horaria del servicio, o `null` si no hay ventas. Permite a ms-pronóstico saber qué tan al día están los datos y registrarlo en la ejecución.
- Limitación conocida: un cero puede significar que no hubo demanda, que el local estuvo cerrado o que el plato estuvo agotado, y analítica no los distingue. Se resuelve al diseñar las variables del modelo (ver «Decisiones abiertas»).

## 4. Eventos

| Evento | Sentido | Efecto |
|---|---|---|
| [`venta.registrada`](eventos.md) | Consume | Inserta la venta y sus ítems; actualiza el agregado diario |
| [`comprobante.anulado`](eventos.md) | Consume | Marca la venta como anulada y la resta del agregado |
| [`pedido.anulado`](eventos.md) | Consume | Registra la anulación para el reporte de desempeño |

No publica eventos.

## 5. Dependencias y fallos

| Depende de | Si no responde |
|---|---|
| Su PostgreSQL | Responde 503 |
| Eventos del núcleo | Los reportes quedan desactualizados hasta que el outbox reintente; no se pierde información |

Ningún otro componente se detiene si ms-analítica cae, salvo ms-pronóstico, que no podrá generar pronósticos nuevos.

## 6. Configuración

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de escucha |
| `DATABASE_URL` | Conexión a su PostgreSQL (usuario sin privilegios de administración) |
| `JWT_PUBLIC_KEY` | Clave pública PEM para validar los JWT de las rutas de reportes (se acepta con `\n` literales). Sin ella, esas rutas responden 503 `ERR_JWT_NO_CONFIGURADO`; `/interno` y `/health` no la necesitan |
| `JWT_EMISOR`, `JWT_AUDIENCIA` | Valores esperados de `iss` y `aud` (`restaurantcloud-nucleo` y `restaurantcloud-servicios`) |
| `JWT_TOLERANCIA_SEGUNDOS` | Tolerancia de reloj al validar `exp` y `nbf` (30) |
| `SECRETO_INTERNO` | Secreto HMAC para `/interno`; es el mismo `ANALITICA_SECRETO` del núcleo |
| `ZONA_HORARIA` | `America/Lima` |
| `MIGRATIONS_DATABASE_URL` | Conexión del usuario administrador. La usa solo el contenedor `analitica-migraciones`, no el servicio |

## 7. Decisiones abiertas

- Carga inicial de ventas reales: cómo se copian a analítica las anteriores a la activación del servicio (reenviar eventos históricos desde el núcleo con `outbox:reenviar-eventos`). Las sintéticas ya no dependen de esto: ver abajo.
- Días cerrados y platos agotados: cómo llegan a la IA para no confundirlos con falta de demanda (por ejemplo, que el núcleo los envíe a ms-pronóstico junto con la petición, o un evento diario de disponibilidad).

Resuelto: los datos sintéticos de entrenamiento del pronóstico no pasan por el núcleo ni por HTTP. `python -m app.sinteticos generar` los guarda con la misma función de dominio que procesa `venta.registrada`, hasta una fecha de corte, y `purgar` los reemplaza por datos reales (ver el README del servicio). Un local con 24 meses de historial son unas 39 mil ventas y se cargan en menos de 4 minutos.

Resuelto: alcance de CU-ADMIN-13 en la Unidad II. Entran resumen, horas punta, ranking con ingeniería de menú y desempeño por mozo. Quedan fuera exportar (Unidad III), rotación de mesa, upselling, turnos, nota de quiebre de stock y desglose de IGV, porque los eventos no traen esos datos.

Resuelto: el costo del plato viaja en `venta.registrada` (`producto.costo_estandar`), así que la rentabilidad se puede calcular desde la primera versión.
