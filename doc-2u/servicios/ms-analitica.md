# ms-analítica

Estructura y reglas comunes: [README.md](README.md).

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Reportes de ventas y desempeño (CU-ADMIN-13) y series de ventas para la IA. Solo lee ventas ya cerradas; no emite comprobantes ni cobra |
| **Stack** | Python 3.12, FastAPI, pandas |
| **Base de datos** | PostgreSQL propia |
| **Código** | `restaurantcloud/services/analitica` |
| **Puerto local** | 8001 |
| **Prefijo en el gateway** | `/api/v1/analitica` |
| **Despliegue** | VM en la Unidad II; Cloud Run en la Unidad III |

## 2. Datos que gestiona

| Tabla (propuesta) | Propósito |
|---|---|
| `evento_procesado` | Identificadores de eventos ya aplicados, para tolerar duplicados |
| `venta` | Una fila por comprobante: local, fecha y hora, mozo, medio de pago, total, estado (vigente o anulado) |
| `venta_item` | Una fila por plato vendido: producto, categoría, cantidad, precio, costo |
| `venta_diaria_producto` | Agregado por local, jornada y producto: unidades e ingreso. Es la serie que consume la IA |
| `anulacion` | Ítems y comandas anulados antes del cobro, con merma, para el reporte de desempeño |

No guarda nombres, documentos ni teléfonos de comensales.

## 3. API

| Método | Ruta | Propósito | Quién llama |
|---|---|---|---|
| GET | `/api/v1/analitica/ventas/resumen` | Totales del periodo y comparación con el periodo anterior | Navegador |
| GET | `/api/v1/analitica/ventas/por-hora` | Ventas por franja horaria (horas punta) | Navegador |
| GET | `/api/v1/analitica/productos/ranking` | Platos más y menos vendidos y su rentabilidad | Navegador |
| GET | `/api/v1/analitica/personal/desempeno` | Ventas y tickets por mozo | Navegador |
| GET | `/api/v1/analitica/exportar` | Reporte del periodo en Excel o CSV | Navegador |
| GET | `/interno/series/ventas-diarias` | Unidades vendidas por día y producto de un local | ms-pronóstico |
| POST | `/interno/eventos` | Recepción de eventos | Núcleo |
| GET | `/health` | Estado del servicio | Plataforma |

Roles de las rutas públicas: `admin_local` y `propietario`.

Están detallados los dos endpoints de los que depende la IA. Los de reportes se detallan al definir el alcance de CU-ADMIN-13.

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
| 422 | `ERR_EVENTO_INVALIDO` | El sobre o `datos` no cumplen el contrato de esa versión |
| 503 | `ERR_BD_NO_DISPONIBLE` | No se pudo guardar; el emisor debe reintentar |

**Notas**

- Guardar el `id` en `evento_procesado` y aplicar el evento ocurren en una sola transacción: o se hacen ambas cosas o ninguna.
- Un 422 indica un error del emisor que el reintento no arregla; el núcleo lo marca como `fallido` para revisión.

### GET /interno/series/ventas-diarias

**Propósito:** entregar a ms-pronóstico las unidades vendidas por jornada y producto de un local.
**Autenticación:** firma HMAC.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `empresa_id` | query | uuid | sí | Empresa dueña del local |
| `local_id` | query | uuid | sí | Local |
| `desde` | query | día | sí | Primera jornada |
| `hasta` | query | día | sí | Última jornada (incluida) |
| `producto_ids` | query | lista de uuid | no | Limita la respuesta a esos productos |

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
| 422 | `ERR_RANGO_INVALIDO` | `desde` posterior a `hasta`, o rango mayor a 730 días |

**Notas**

- La serie de cada producto es continua: incluye con `unidades: 0` las jornadas sin ventas entre su `primera_venta` y `hasta`. Así el modelo no tiene que rellenar huecos.
- Las ventas anuladas ya están descontadas.
- Un local sin ventas en el rango devuelve `productos: []` con 200; no es un error.
- `ultimo_evento_en` permite a ms-pronóstico saber qué tan al día están los datos y registrarlo en la ejecución.
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
| `JWT_PUBLIC_KEY` | Clave pública para validar los JWT |
| `SECRETO_INTERNO` | Secreto HMAC para `/interno` |
| `ZONA_HORARIA` | `America/Lima` |

## 7. Decisiones abiertas

- Carga inicial: cómo se copian a analítica las ventas anteriores a la activación del servicio (reenviar eventos históricos desde el núcleo).
- Días cerrados y platos agotados: cómo llegan a la IA para no confundirlos con falta de demanda (por ejemplo, que el núcleo los envíe a ms-pronóstico junto con la petición, o un evento diario de disponibilidad).
- Alcance de los reportes de CU-ADMIN-13 que entran en la Unidad II.

Resuelto: el costo del plato viaja en `venta.registrada` (`producto.costo_estandar`), así que la rentabilidad se puede calcular desde la primera versión.
