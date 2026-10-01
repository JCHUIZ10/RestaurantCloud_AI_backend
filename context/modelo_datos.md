# RestaurantCloud AI

## Modelo de Datos — Versión Inicial

## 1. Estrategia de multi-tenancy y consideraciones clave

* **Esquema único compartido:** todas las empresas (*tenants*) conviven en las mismas tablas, aisladas mediante `empresa_id` (directo o heredado a través de `local_id`).
* Se recomienda activar **Row-Level Security (RLS)** en PostgreSQL sobre `empresa_id` para que el aislamiento entre *tenants* lo garantice la base de datos, no solo el código de la aplicación.
* `usuario.correo` es único a nivel global de la plataforma (regla de negocio: un usuario pertenece a una sola empresa).
* Toda tabla operativa de un local incluye `local_id`, y a través de `local.empresa_id` se resuelve el *tenant* — no es necesario duplicar `empresa_id` en cada tabla hija de `local`.
* Los identificadores primarios (`id`) se recomiendan como **UUID** para evitar colisiones y facilitar la futura sincronización o particionamiento por *tenant*.
* Las tablas de configuración de reservas (`duracion`, `buffer`, `minutos_bloqueo_previo`, etc.) viven como columnas de `local`, ya que son parámetros por local, no entidades independientes.
* `horario_atencion` y `horario_excepcion` permiten múltiples turnos por día y cierres puntuales, sin sobrecargar la tabla `local`.

---

## 2. Detalle de entidades

### 2.1 Plataforma y suscripción

#### `plan`

Catálogo de planes de suscripción (Starter, Pro, Enterprise).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del plan |
| `nombre` | varchar | — | Starter, Pro, Enterprise |
| `precio` | decimal | — | Precio del plan |
| `periodicidad` | enum | — | mensual, anual |
| `max_locales` | int | — | Límite de locales permitidos |
| `max_mesas` | int | — | Límite de mesas por local |
| `max_pisos` | int | — | Límite de pisos/áreas por local |
| `incluye_prediccion_ia` | bool | — | Habilita forecasting de demanda |
| `incluye_asistente_ia` | bool | — | Habilita asistente conversacional |
| `incluye_reportes_avanzados` | bool | — | Habilita exportación y reportes avanzados |
| `incluye_reservas` | bool | — | Habilita el módulo de reservas |
| `created_at` | timestamp | — | Fecha de creación del plan |

#### `empresa`

Tenant de la plataforma: cada restaurante registrado.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK (tenant_id) | Identificador único de la empresa |
| `razon_social` | varchar | — | Nombre legal de la empresa |
| `ruc` | varchar | UNIQUE | Identificador fiscal |
| `correo_contacto` | varchar | — | Correo de contacto general |
| `telefono` | varchar | — | Teléfono de contacto |
| `plan_id` | UUID | FK -> plan | Plan de suscripción activo |
| `estado` | enum | — | activa, suspendida, pendiente_baja |
| `stripe_customer_id` | varchar | — | Referencia al cliente en Stripe |
| `fecha_registro` | timestamp | — | Fecha de alta en la plataforma |

#### `pago`

Historial de cobros de suscripción SaaS (vía Stripe).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del pago |
| `empresa_id` | UUID | FK -> empresa | Empresa que paga |
| `plan_id` | UUID | FK -> plan | Plan vigente al momento del cobro |
| `monto` | decimal | — | Monto cobrado |
| `fecha` | timestamp | — | Fecha del cobro |
| `estado` | enum | — | exitoso, fallido |
| `stripe_payment_id` | varchar | — | Referencia de la transacción en Stripe |

#### `usuario`

Todos los actores humanos del sistema (Admin SaaS, Propietario, Admin local, Mozo, Cocina, Cajero).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del usuario |
| `empresa_id` | UUID | FK -> empresa (nullable) | Nulo para admin_saas |
| `local_id` | UUID | FK -> local (nullable) | Nulo para propietario y admin_saas |
| `nombre` | varchar | — | Nombre del usuario |
| `correo` | varchar | UNIQUE global | Un correo pertenece a una sola empresa |
| `password_hash` | varchar | — | Contraseña cifrada |
| `rol` | enum | — | admin_saas, propietario, admin_local, mozo, cocina, cajero |
| `estado` | enum | — | activo, inactivo |
| `created_at` | timestamp | — | Fecha de creación |

---

### 2.2 Local y configuración operativa

#### `local`

Sucursal/local de una empresa.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del local |
| `empresa_id` | UUID | FK -> empresa | Empresa a la que pertenece |
| `nombre` | varchar | — | Nombre del local |
| `direccion` | varchar | — | Dirección física |
| `telefono` | varchar | — | Teléfono del local |
| `zona_horaria` | varchar | — | Zona horaria del local |
| `acepta_reservas` | bool | — | Habilita/deshabilita el módulo de reservas |
| `duracion_reserva_min` | int | — | Duración estándar de una reserva (minutos) |
| `buffer_reserva_min` | int | — | Margen entre reservas consecutivas |
| `tolerancia_no_show_min` | int | — | Minutos de tolerancia antes de marcar no_show |
| `minutos_bloqueo_previo` | int | — | Minutos antes de la reserva en que la mesa se bloquea |
| `margen_recordatorio_min` | int | — | Minutos de anticipación para notificar la reserva |
| `estado` | enum | — | activo, inactivo |

#### `horario_atencion`

Horario semanal del local; permite múltiples turnos por día.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `dia_semana` | enum | — | lunes … domingo |
| `atiende` | bool | — | Si el local abre ese día |
| `hora_inicio` | time | — | Inicio del turno |
| `hora_fin` | time | — | Fin del turno |

#### `horario_excepcion`

Cierres o cambios puntuales de horario (feriados, eventos).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local afectado |
| `fecha` | date | — | Fecha de la excepción |
| `cerrado` | bool | — | Si el local cierra ese día |
| `motivo` | varchar | — | Motivo de la excepción |

#### `piso`

Piso o área física dentro de un local (ej. Piso 1, Terraza).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar | — | Nombre del piso/área |

#### `mesa`

Mesa física dentro de un piso.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `piso_id` | UUID | FK -> piso | Piso/área al que pertenece |
| `etiqueta` | varchar | — | Identificador amigable (ej. "Ventana 2") |
| `capacidad` | int | — | Número de personas |
| `posicion_x` | float | — | Posición horizontal en el plano |
| `posicion_y` | float | — | Posición vertical en el plano |
| `permite_union` | bool | — | Si puede combinarse con otra mesa |
| `estado` | enum | — | activa, inactiva, bloqueada |

---

### 2.3 Carta e inventario

#### `categoria_producto`

Categorías de la carta (Bebidas, Entradas, etc.), definidas por local.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar | — | Nombre de la categoría |

#### `producto`

Plato o producto de la carta.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `categoria_id` | UUID | FK -> categoria_producto | Categoría asignada |
| `nombre` | varchar | — | Nombre del producto |
| `descripcion` | text | — | Descripción |
| `precio` | decimal | — | Precio de venta |
| `foto_url` | varchar | nullable | Imagen del producto |
| `disponibilidad` | enum | — | disponible, agotado |
| `created_at` | timestamp | — | Fecha de creación |

#### `insumo`

Insumo/ingrediente gestionado en inventario.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar | — | Nombre del insumo |
| `unidad_compra` | varchar | — | Unidad en la que se compra (ej. kg) |
| `unidad_consumo` | varchar | — | Unidad en la que se usa en receta (ej. unidad) |
| `factor_conversion` | decimal | — | Equivalencia entre unidad_consumo y unidad_compra |
| `stock_actual` | decimal | — | Stock disponible (en unidad_compra) |
| `stock_minimo` | decimal | — | Umbral para alertas de reposición |
| `ultimo_proveedor_id` | UUID | FK -> proveedor (nullable) | Último proveedor al que se le compró |
| `ultimo_precio` | decimal | nullable | Precio pagado en la última compra |
| `moneda` | varchar | default PEN | Moneda del último precio |
| `fecha_ultima_compra` | timestamp | nullable | Fecha de la última compra registrada |

#### `producto_insumo`

Receta: insumos y cantidades que requiere cada producto.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `producto_id` | UUID | PK compuesta / FK -> producto | Producto asociado |
| `insumo_id` | UUID | PK compuesta / FK -> insumo | Insumo requerido |
| `cantidad_consumo` | decimal | — | Cantidad en unidad_consumo del insumo |

---

### 2.4 Proveedores y compras

#### `proveedor`

Proveedor registrado por el local (creación simple, sin catálogo complejo).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar | — | Nombre del proveedor |
| `contacto` | varchar | nullable | Persona de contacto |
| `telefono` | varchar | nullable | Teléfono del proveedor |

#### `ficha_compra`

Registro de una compra ya realizada (no es una orden previa).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `proveedor_id` | UUID | FK -> proveedor | Proveedor de esta compra (uno solo por ficha) |
| `usuario_id` | UUID | FK -> usuario | Administrador que registró la ficha |
| `fecha` | timestamp | — | Fecha de la compra |
| `total` | decimal | — | Monto total de la ficha |

#### `ficha_compra_detalle`

Insumos incluidos en una ficha de compra.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `ficha_compra_id` | UUID | FK -> ficha_compra | Ficha a la que pertenece |
| `insumo_id` | UUID | FK -> insumo | Insumo comprado |
| `cantidad` | decimal | — | Cantidad comprada (unidad_compra) |
| `precio_unitario` | decimal | — | Precio pagado por unidad |
| `subtotal` | decimal | — | cantidad × precio_unitario |

---

### 2.5 Reservas, pedidos y mesas

#### `reserva`

Reserva de mesa gestionada por el Mozo.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `cliente_nombre` | varchar | — | Nombre del cliente |
| `cliente_telefono` | varchar | — | Teléfono del cliente |
| `fecha_hora` | timestamp | — | Fecha y hora reservada |
| `num_personas` | int | — | Cantidad de comensales |
| `estado` | enum | — | confirmada, bloqueada, atendida, cancelada, no_show |
| `creado_por` | UUID | FK -> usuario | Mozo que registró la reserva |

#### `reserva_mesa`

Mesas asignadas a una reserva (permite más de una si se combinan).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `reserva_id` | UUID | PK compuesta / FK -> reserva | Reserva asociada |
| `mesa_id` | UUID | PK compuesta / FK -> mesa | Mesa asignada |

#### `pedido`

Pedido asociado a una mesa.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `mesa_id` | UUID | FK -> mesa | Mesa de origen |
| `mozo_id` | UUID | FK -> usuario | Mozo responsable |
| `estado` | enum | — | borrador, enviado, cobrado, anulado |
| `created_at` | timestamp | — | Fecha de creación |

#### `pedido_item`

Ítem individual dentro de un pedido.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `pedido_id` | UUID | FK -> pedido | Pedido al que pertenece |
| `producto_id` | UUID | FK -> producto | Producto solicitado |
| `cantidad` | int | — | Cantidad solicitada |
| `nota` | varchar | nullable | Nota especial (ej. "sin cebolla") |
| `precio_unitario` | decimal | — | Precio al momento del pedido |
| `estado` | enum | — | en_cola, en_preparacion, listo, entregado, no_disponible, anulado |
| `motivo_anulacion` | varchar | nullable | Motivo si fue anulado |
| `anulado_por` | UUID | FK -> usuario (nullable) | Quién anuló el ítem |
| `es_merma` | bool | default false | Si la anulación ocurrió tras estar listo/entregado |

---

### 2.6 Promociones, caja y comprobantes

#### `promocion`

Promoción configurada por el Administrador del local.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar | — | Nombre de la promoción |
| `descripcion` | text | — | Descripción |
| `tipo_descuento` | enum | — | porcentaje, monto_fijo |
| `valor` | decimal | — | Valor del descuento |
| `fecha_inicio` | date | — | Inicio de vigencia |
| `fecha_fin` | date | — | Fin de vigencia |
| `activa` | bool | — | Si puede aplicarse aunque esté vigente |

#### `caja`

Apertura y cierre de caja por turno/día.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `cajero_id` | UUID | FK -> usuario | Cajero responsable |
| `fecha_apertura` | timestamp | — | Momento de apertura |
| `monto_apertura` | decimal | — | Fondo inicial |
| `fecha_cierre` | timestamp | nullable | Momento de cierre |
| `monto_esperado` | decimal | nullable | Monto calculado por el sistema |
| `monto_real` | decimal | nullable | Monto contado físicamente |
| `discrepancia` | decimal | nullable | Diferencia entre real y esperado |
| `comentario_discrepancia` | text | nullable | Justificación si hay diferencia |
| `estado` | enum | — | abierta, cerrada |

#### `comprobante`

Comprobante digital emitido al cobrar (sin impresión física).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `pedido_id` | UUID | FK -> pedido | Pedido cobrado |
| `caja_id` | UUID | FK -> caja | Caja donde se registró el cobro |
| `tipo` | enum | — | boleta, factura, nota_venta |
| `documento_cliente` | varchar | nullable | DNI/CE (boleta) o RUC (factura) |
| `nombre_cliente` | varchar | nullable | Nombre o razón social |
| `medio_pago` | enum | — | tarjeta, billetera_digital, efectivo |
| `monto_recibido` | decimal | nullable | Monto recibido (si es efectivo) |
| `vuelto` | decimal | nullable | Vuelto entregado |
| `total` | decimal | — | Total cobrado |
| `promocion_id` | UUID | FK -> promocion (nullable) | Promoción aplicada, si hubo |
| `token_qr` | varchar | UNIQUE | Token único e impredecible del enlace QR |
| `fecha` | timestamp | — | Fecha de emisión |
| `estado` | enum | — | emitido, anulado |

#### `gasto_manual`

Egresos operativos que no provienen de una ficha de compra.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `categoria` | varchar | — | Categoría del gasto (ej. alquiler, servicios) |
| `monto` | decimal | — | Monto del gasto |
| `descripcion` | text | — | Detalle del gasto |
| `fecha` | date | — | Fecha del gasto |
| `registrado_por` | UUID | FK -> usuario | Quién lo registró |

---

### 2.7 Incidentes, notificaciones y auditoría

#### `incidente`

Incidente interno registrado por el Administrador del local.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `descripcion` | text | — | Descripción del incidente |
| `fecha_hora` | timestamp | — | Fecha y hora del hecho |
| `gravedad` | enum | — | baja, media, alta |
| `foto_url` | varchar | nullable | Evidencia fotográfica |
| `empleado_id` | UUID | FK -> usuario (nullable) | Empleado involucrado, si aplica |
| `estado` | enum | — | abierto, en_revision, resuelto |
| `visto_por_propietario` | bool | default false | Si el propietario ya lo revisó |
| `fecha_visto` | timestamp | nullable | Momento en que el propietario lo marcó como visto |

#### `notificacion`

Notificaciones internas del sistema (campana).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `usuario_id` | UUID | FK -> usuario | Destinatario |
| `tipo` | varchar | — | Tipo de evento (reserva_proxima, anulacion, stock_critico, etc.) |
| `mensaje` | text | — | Texto de la notificación |
| `entidad_tipo` | varchar | nullable | Tipo de entidad relacionada (pedido, mesa, insumo...) |
| `entidad_id` | UUID | nullable | Identificador de la entidad relacionada |
| `leida` | bool | default false | Si el usuario ya la abrió |
| `created_at` | timestamp | — | Fecha de generación |

#### `log_auditoria`

Registro de acciones sensibles (anulaciones, descuentos, cambios de carta, etc.).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `empresa_id` | UUID | FK -> empresa | Empresa asociada |
| `local_id` | UUID | FK -> local (nullable) | Local asociado, si aplica |
| `usuario_id` | UUID | FK -> usuario | Quién ejecutó la acción |
| `accion` | varchar | — | Tipo de acción realizada |
| `entidad_tipo` | varchar | — | Entidad afectada (pedido, mesa, producto...) |
| `entidad_id` | UUID | — | Identificador de la entidad afectada |
| `detalle` | jsonb | nullable | Detalle adicional en formato estructurado |
| `fecha` | timestamp | — | Fecha del evento |

---

### 2.8 Predicción / forecasting

#### `snapshot_stock_diario`

Fotografía diaria del stock, usada como insumo del modelo de predicción.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `insumo_id` | UUID | FK -> insumo | Insumo registrado |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `fecha` | date | — | Fecha del snapshot |
| `stock_cantidad` | decimal | — | Stock al momento del snapshot |
| `estuvo_agotado` | bool | — | Si el insumo estuvo agotado en algún momento de ese día |

> **Nota:** el historial de ventas por producto/día (fuente principal del forecasting) no requiere una tabla adicional — se calcula agregando `pedido_item` + `comprobante` por fecha y producto.

---

## 4. Recomendaciones para la siguiente etapa

1. **Definir índices compuestos** por `(local_id, fecha)` en las tablas de alto volumen de consulta (`pedido`, `pedido_item`, `snapshot_stock_diario`) para acelerar reportes y forecasting.
2. **Confirmar el motor de base de datos** (se recomienda PostgreSQL por su soporte nativo de Row-Level Security, JSONB y UUID).
2. **Definición de arquitectura de servicios:** cuando se defina la arquitectura, decidir si Go será el único servicio con acceso directo a estas tablas, para evitar duplicar lógica de aislamiento por tenant en dos lenguajes distintos.
4. **Validación de precisión:** las tablas `producto_insumo` y `ficha_compra_detalle` son las de mayor sensibilidad para la precisión del forecasting; conviene validarlas con datos reales apenas se tenga el primer local operando.