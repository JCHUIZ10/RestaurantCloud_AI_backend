# Catálogo de eventos

Sobre, reglas de entrega y plantilla: [README.md](README.md), sección 4.

## Resumen

| Evento | Emisor | ms-analítica | ms-notificaciones | Cuándo se emite |
|---|---|:---:|:---:|---|
| `venta.registrada` | núcleo | ✔ | | Se cobra una cuenta o subcuenta y se emite el comprobante |
| `comprobante.anulado` | núcleo | ✔ | ✔ | Se emite una nota de crédito |
| `pedido.anulado` | núcleo | ✔ | ✔ | Se anula un ítem o una comanda |
| `plato.listo` | núcleo | | ✔ | Cocina marca un ítem como listo |
| `producto.agotado` | núcleo | | ✔ | Cocina marca un producto como agotado |
| `reserva.creada` | núcleo | | ✔ | Se registra una reserva |
| `reserva.cancelada` | núcleo | | ✔ | Se cancela una reserva o se registra un no-show |
| `caja.cerrada` | núcleo | | ✔ | Se cierra un turno de caja con diferencia en el arqueo |
| `pronostico.generado` | ms-pronóstico | | ✔ | Termina una ejecución de pronóstico. Se implementa con ms-notificaciones (etapa 7) |

La lista es la propuesta inicial. Un evento se agrega solo cuando algún servicio lo necesita.

## Detalle

Están detallados los tres eventos que alimentan a ms-analítica y, a través de ella, a la IA. Los demás se detallan al construir ms-notificaciones.

### venta.registrada (v1)

**Cuándo se emite:** al cobrar una cuenta o una subcuenta, en la misma transacción que crea el comprobante (boleta, factura o nota de venta). Una cuenta dividida produce un evento por cada subcuenta cobrada.
**Emisor:** núcleo. **Receptores:** ms-analítica.

**Datos**

| Campo | Tipo | Descripción |
|---|---|---|
| `comprobante_id` | uuid | Identificador de la venta |
| `pedido_id` | uuid | Comanda a la que pertenece |
| `tipo` | texto | `boleta`, `factura` o `nota_venta` |
| `fecha` | fecha y hora | Momento del cobro |
| `fecha_operativa` | día | Jornada a la que pertenece la venta. Pasada la medianoche sigue siendo la del día anterior mientras dure el turno nocturno. La calcula el núcleo |
| `mozo_id`, `mozo_nombre` | uuid, texto | Mozo de la comanda |
| `comensales` | entero | Personas en la mesa; `null` en una subcuenta |
| `medio_pago` | texto | `efectivo`, `tarjeta` o `billetera_digital` |
| `subtotal_consumo` | número | Suma de los ítems antes de descuento y recargo |
| `descuento` | número | Descuento aplicado |
| `monto_recargo` | número | Recargo por medio de pago |
| `total` | número | Total cobrado |
| `promocion_id` | uuid o `null` | Promoción aplicada |
| `items[]` | lista | Platos del comprobante |
| `items[].producto_id` | uuid | Producto |
| `items[].nombre` | texto | Nombre del producto en el momento de la venta |
| `items[].categoria_id`, `items[].categoria_nombre` | uuid, texto | Categoría en el momento de la venta |
| `items[].cantidad` | entero | Unidades vendidas |
| `items[].precio_unitario` | número | Precio de venta |
| `items[].subtotal` | número | `cantidad × precio_unitario` |
| `items[].costo_estandar` | número o `null` | Costo del plato (`producto.costo_estandar`) en el momento de la venta |

Los nombres de producto, categoría y mozo viajan en el evento para que ms-analítica no tenga que consultar el catálogo del núcleo. No se envían el documento, el nombre ni el teléfono del cliente.

**Ejemplo**

```json
{
  "id": "0f8b6c1e-2a4d-4c8e-9b1a-6f2d3e4a5b6c",
  "tipo": "venta.registrada",
  "version": 1,
  "ocurrido_en": "2026-11-16T21:14:03-05:00",
  "origen": "nucleo",
  "empresa_id": "00000000-0000-4000-8000-000000000001",
  "local_id": "00000000-0000-4000-8000-000000000010",
  "datos": {
    "comprobante_id": "7c1d9e42-5b3a-4f7e-8a2c-1d4e5f6a7b8c",
    "pedido_id": "3d367634-70ce-45d3-96ec-c42c5597b7a5",
    "tipo": "boleta",
    "fecha": "2026-11-16T21:14:03-05:00",
    "fecha_operativa": "2026-11-16",
    "mozo_id": "00000000-0000-4000-8000-000000000103",
    "mozo_nombre": "Lucía Paredes",
    "comensales": 2,
    "medio_pago": "efectivo",
    "subtotal_consumo": 83.00,
    "descuento": 8.00,
    "monto_recargo": 0.00,
    "total": 75.00,
    "promocion_id": null,
    "items": [
      {
        "producto_id": "00000000-0000-4000-8000-000000000431",
        "nombre": "Lomo saltado",
        "categoria_id": "00000000-0000-4000-8000-000000000401",
        "categoria_nombre": "Fondos",
        "cantidad": 2,
        "precio_unitario": 38.00,
        "subtotal": 76.00,
        "costo_estandar": 14.50
      },
      {
        "producto_id": "00000000-0000-4000-8000-000000000435",
        "nombre": "Inca Kola 500ml",
        "categoria_id": "00000000-0000-4000-8000-000000000403",
        "categoria_nombre": "Bebidas",
        "cantidad": 2,
        "precio_unitario": 3.50,
        "subtotal": 7.00,
        "costo_estandar": 3.20
      }
    ]
  }
}
```

Los valores del ejemplo son ilustrativos.

**Qué hace cada receptor**

- **ms-analítica:** guarda la venta y sus ítems y suma las unidades y el ingreso al agregado de `fecha_operativa` por producto.

### comprobante.anulado (v1)

**Cuándo se emite:** al emitir una nota de crédito que anula un comprobante ya cobrado.
**Emisor:** núcleo. **Receptores:** ms-analítica, ms-notificaciones.

**Datos**

| Campo | Tipo | Descripción |
|---|---|---|
| `comprobante_id` | uuid | Comprobante anulado (el `comprobante_id` de su `venta.registrada`) |
| `nota_credito_id` | uuid | Nota de crédito emitida |
| `fecha` | fecha y hora | Momento de la anulación |
| `motivo_codigo` | texto | Código de motivo SUNAT |
| `anulado_por_id`, `anulado_por_nombre` | uuid, texto | Usuario que anuló |
| `total` | número | Monto anulado |

**Ejemplo de `datos`**

```json
{
  "comprobante_id": "7c1d9e42-5b3a-4f7e-8a2c-1d4e5f6a7b8c",
  "nota_credito_id": "a91f0c3d-8e2b-4d6a-b7c5-2e3f4a5b6c7d",
  "fecha": "2026-11-16T21:40:10-05:00",
  "motivo_codigo": "01",
  "anulado_por_id": "00000000-0000-4000-8000-000000000105",
  "anulado_por_nombre": "Carlos Ríos",
  "total": 75.00
}
```

**Qué hace cada receptor**

- **ms-analítica:** marca la venta como anulada y resta sus unidades e ingreso del agregado del día de la venta original. Si la venta aún no llegó (los eventos pueden llegar desordenados), guarda la anulación y la aplica cuando llegue.
- **ms-notificaciones:** avisa al administrador del local.

**Comportamiento verificado en el núcleo** (`CajaController::emitirNotaCredito`, el único punto que emite notas de crédito y anula comprobantes):

- **La anulación siempre es total.** La nota de crédito replica todos los ítems y todos los importes del comprobante original en negativo, y el original pasa a `anulado`. No existen anulaciones parciales, por lo que el evento no necesita llevar ítems.
- Un comprobante solo se anula una vez, y no se puede anular una nota de crédito.
- Solo se puede anular dentro del turno de caja en que se cobró, así que la anulación llega poco después de su venta.
- `motivo_codigo` toma los valores `01`, `02` o `06`.
- `items_reingresar_stock` solo decide qué insumos vuelven al inventario; no cambia el monto anulado.
- Si la mesa sigue en servicio, los platos vuelven a quedar pendientes de pago y pueden cobrarse otra vez. Ese nuevo cobro genera un `venta.registrada` con otro `comprobante_id`: ms-analítica resta la venta anulada y suma la nueva, sin tratamiento especial.

### pedido.anulado (v1)

**Cuándo se emite:** al anular un ítem o una comanda **antes del cobro**. Se emite un evento por cada registro de `pedido_anulacion`.
**Emisor:** núcleo. **Receptores:** ms-analítica, ms-notificaciones.

**Datos**

| Campo | Tipo | Descripción |
|---|---|---|
| `anulacion_id` | uuid | Registro de la anulación |
| `pedido_id`, `pedido_item_id` | uuid | Comanda e ítem anulado |
| `producto_id`, `producto_nombre` | uuid, texto | Plato anulado |
| `cantidad` | entero | Unidades anuladas |
| `monto_total` | número | Valor de venta de lo anulado |
| `tipo_anulacion` | texto | Ítem o comanda completa |
| `motivo_categoria` | texto | Motivo |
| `es_merma`, `costo_merma` | booleano, número o `null` | Si el plato ya estaba preparado y cuánto costó |
| `minutos_espera` | entero | Tiempo transcurrido desde el pedido |
| `mozo_id`, `mozo_nombre` | uuid, texto | Mozo de la comanda |
| `anulado_por_id`, `anulado_por_nombre` | uuid, texto | Usuario que anuló |
| `anulado_en` | fecha y hora | Momento de la anulación |
| `fecha_operativa` | día | Jornada a la que pertenece |

**Qué hace cada receptor**

- **ms-analítica:** la registra para el reporte de desempeño (anulaciones y merma por mozo y por plato). No modifica los agregados de ventas, porque lo anulado nunca se vendió.
- **ms-notificaciones:** avisa al administrador del local.
