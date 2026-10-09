# RestaurantCloud AI

## Modelo de Datos — Versión Inicial

## 1. Estrategia de multi-tenancy y consideraciones clave

* **Esquema único compartido:** todas las empresas (*tenants*) conviven en las mismas tablas, aisladas mediante `empresa_id` (directo o heredado a través de `local_id`).
* Se recomienda activar **Row-Level Security (RLS)** en PostgreSQL sobre `empresa_id` para que el aislamiento entre *tenants* lo garantice la base de datos, no solo el código de la aplicación.
* `usuario.correo` es único **por empresa** (`UNIQUE(empresa_id, correo)`), permitiendo que una misma persona tenga cuentas independientes en distintos restaurantes/empresas (resuelto en login mediante `CU-AUTH-01`).
* Toda tabla operativa de un local incluye `local_id`, y a través de `local.empresa_id` se resuelve el *tenant* — no es necesario duplicar `empresa_id` en cada tabla hija de `local`.
* Los identificadores primarios (`id`) se recomiendan como **UUID** para entidades transaccionales y operativas para evitar colisiones y facilitar la sincronización por *tenant*. Las tablas de catálogo (`plan.id`) utilizan identificador numérico secuencial (`int`: 1 = Starter, 2 = Pro, 3 = Enterprise) para simplificar comparaciones de jerarquía de nivel y reglas de negocio.
* Las políticas y parámetros de reserva viven en la tabla dedicada 1:1 `politicas_reserva` (asociada a `local_id`), evitando sobrecargar la entidad `local` y aprovisionándose únicamente para empresas en planes superiores (Pro y Enterprise), lo que optimiza el tamaño de tupla y la tasa de aciertos de caché en PostgreSQL.
* `horario_atencion` y `horario_excepcion` permiten múltiples turnos por día y cierres puntuales, sin sobrecargar la tabla `local`.
* **Política de preservación no destructiva (*Soft Archival*):** Cuando una empresa reduce su plan (*downgrade*), los recursos excedentes (`local`, `piso`, `mesa`, `usuario`) nunca se eliminan físicamente de la base de datos (`DELETE` estrictamente prohibido). En su lugar, se conmutan a `estado = 'inactivo'`. Esto garantiza la integridad referencial de auditoría, ventas históricas y reportes contables, permitiendo reactivarlos en un solo clic si el restaurante vuelve a mejorar su plan en el futuro.

---

## 2. Detalle de entidades

### 2.1 Plataforma y suscripción

#### `plan`

Catálogo de planes de suscripción (1: Starter, 2: Pro, 3: Enterprise).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | int | PK | Identificador numérico secuencial (1, 2, 3) |
| `nombre` | varchar | — | Starter, Pro, Enterprise |
| `precio_mensual` | decimal | — | Tarifa mensual estándar |
| `precio_anual` | decimal | — | Tarifa con descuento anual |
| `max_locales` | int | — | Límite de locales permitidos por empresa |
| `max_pisos` | int | — | Límite de pisos/áreas por local |
| `max_mesas` | int | — | Límite de mesas por local |
| `max_usuarios` | int | — | Límite de cuentas de personal activas por empresa |
| `incluye_prediccion_ia` | bool | — | Habilita forecasting de demanda |
| `incluye_asistente_ia` | bool | — | Habilita asistente conversacional |
| `incluye_reportes_avanzados` | bool | — | Habilita exportación y reportes avanzados |
| `incluye_reservas` | bool | — | Habilita el módulo de reservas |
| `created_at` | timestamp | — | Fecha de creación del plan |

#### `suscripcion`

Ciclo de vida de facturación, estado y programación de planes SaaS (vía Stripe).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único de la suscripción |
| `empresa_id` | UUID | FK -> empresa | Empresa titular de la suscripción |
| `plan_id` | int | FK -> plan | Plan actualmente activo |
| `proximo_plan_id` | int | FK -> plan (nullable) | Plan programado para fin de ciclo (downgrade) |
| `fecha_inicio` | timestamp | — | Inicio del periodo de facturación actual |
| `fecha_fin_periodo` | timestamp | — | Fin del periodo (fecha de corte/renovación) |
| `estado` | enum | — | activa, en_gracia, pendiente_ajuste, cancelada |
| `recursos_conciliados` | bool | DEFAULT false | Indica si el usuario completó la conciliación de downgrade |
| `config_downgrade` | jsonb | nullable | IDs de locales, pisos, mesas y personal a mantener activos |
| `stripe_subscription_id` | varchar | — | Referencia a la suscripción activa en Stripe |
| `stripe_schedule_id` | varchar | nullable | Referencia al Subscription Schedule programado en Stripe |
| `created_at` | timestamp | — | Fecha de creación del registro |

#### `empresa`

Tenant de la plataforma: cada restaurante registrado.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK (tenant_id) | Identificador único de la empresa |
| `razon_social` | varchar | — | Nombre legal de la empresa |
| `tipo_identidad_fiscal` | enum | — | RUC_20 (Persona Jurídica), RUC_10 (Persona Natural) |
| `ruc` | varchar(11) | UNIQUE | Identificador fiscal exacto de 11 dígitos numéricos |
| `correo_contacto` | varchar | — | Correo de contacto general |
| `telefono` | varchar | — | Teléfono de contacto |
| `plan_id` | int | FK -> plan | Plan de suscripción activo (desnormalizado) |
| `ultima_suscripcion_id` | UUID | FK -> suscripcion (nullable) | Referencia a la suscripción activa más reciente |
| `estado` | enum | — | activa, suspendida, pendiente_baja |
| `stripe_customer_id` | varchar | — | Referencia al cliente en Stripe |
| `fecha_registro` | timestamp | — | Fecha de alta en la plataforma |

#### `pago`

Historial de cobros de suscripción SaaS (vía Stripe).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del pago |
| `empresa_id` | UUID | FK -> empresa | Empresa que paga |
| `suscripcion_id` | UUID | FK -> suscripcion (nullable) | Suscripción asociada al cobro |
| `plan_id` | int | FK -> plan | Plan vigente al momento del cobro |
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
| `correo` | varchar | UNIQUE(empresa_id, correo) | Único por empresa; permite multi-cuenta |
| `password_hash` | varchar | — | Contraseña cifrada |
| `telefono` | varchar(20) | nullable | Teléfono celular / WhatsApp para coordinación y bienvenida |
| `rol` | enum | — | admin_saas, propietario, admin_local, mozo, cocina, cajero |
| `estado` | enum | — | activo, inactivo, pendiente_activacion |
| `ultimo_login` | timestamp | nullable | Fecha y hora del último inicio de sesión |
| `created_at` | timestamp | — | Fecha de creación |

##### Reglas de Integridad y Operatividad del Personal (`CU-ADMIN-08`):
1. **Control de Cuota SaaS de Usuarios:** El registro y reactivación de colaboradores valida en tiempo real la cuota contratada (`COUNT(usuario WHERE empresa_id = :id AND estado = 'activo') < plan.max_usuarios`). Si se alcanza el límite, la creación se rechaza hasta ampliar el plan (`CU-PROP-02`).
2. **Sesión Continua por Turno:** El colaborador se autentica una sola vez al inicio de su servicio con correo y contraseña. El sistema expide un token con vigencia del turno (8-12 horas) sin interrupciones entre mesas o comandas.
3. **Salvaguarda de Reasignación Atómica de Mesas (Mozos):** La desactivación de un mozo con pedidos en curso (`pedido.estado NOT IN ('cobrado', 'cancelado')`) exige obligatoriamente transferir sus mesas a otro mozo activo (`UPDATE pedido SET mozo_id = :sustituto WHERE mozo_id = :desactivado`) dentro de la misma transacción de desactivación para evitar pedidos huérfanos.
4. **Bloqueo de Desactivación con Turno de Caja Abierto (Cajeros):** Si un cajero mantiene una caja activa sin cerrar, se bloquea su desactivación hasta que se efectúe el cierre y arqueo en `CU-ADMIN-15`.

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
| `distrito` | varchar | — | Distrito de ubicación |
| `ciudad` | varchar | — | Ciudad / Región (ej. Lima) |
| `telefono` | varchar | — | Teléfono del local |
| `zona_horaria` | varchar | DEFAULT 'America/Lima' | Zona horaria del local |
| `moneda` | varchar(3) | DEFAULT 'PEN' | Moneda base de operación (Soles) |
| `giro_negocio` | enum | DEFAULT 'en_blanco' | Giro culinario del local: polleria, cevicheria, chifa, en_blanco |
| `estado` | enum | — | activo, inactivo |

#### `horario_atencion`

Horario semanal del local; permite soporte para turno continuo o múltiples turnos partidos por día (ej. Almuerzo y Cena).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `local_id` | UUID | FK -> local (ON DELETE CASCADE) | Local al que pertenece |
| `dia_semana` | smallint | CHECK (dia_semana BETWEEN 1 AND 7) | 1: Lunes … 7: Domingo |
| `nombre_turno` | varchar(50) | NOT NULL DEFAULT 'Principal' | Nombre identificador del turno (ej. "Almuerzo", "Cena") |
| `atiende` | bool | NOT NULL DEFAULT true | Si el local abre ese día |
| `hora_inicio` | time | NOT NULL | Inicio del turno de atención |
| `hora_fin` | time | NOT NULL | Fin del turno de atención (soporta cruce de medianoche) |
| `created_at` | timestamp | DEFAULT NOW() | Fecha de creación |
| `updated_at` | timestamp | DEFAULT NOW() | Fecha de última modificación |

Restricción de unicidad: `UNIQUE(local_id, dia_semana, hora_inicio)`.

#### `horario_excepcion`

Cierres o cambios puntuales de horario (feriados oficiales, inventario, mantenimiento o eventos privados).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `local_id` | UUID | FK -> local (ON DELETE CASCADE) | Local afectado |
| `fecha` | date | NOT NULL | Fecha de la excepción |
| `cerrado` | bool | NOT NULL DEFAULT true | True si el local cierra todo el día; False si es horario especial |
| `hora_inicio` | time | nullable | Inicio de atención especial (si `cerrado = false`) |
| `hora_fin` | time | nullable | Fin de atención especial (si `cerrado = false`) |
| `motivo` | varchar(150) | NOT NULL | Motivo descriptivo (ej. "Navidad", "Inventario") |
| `created_by` | UUID | FK -> usuario (ON DELETE SET NULL) | Administrador o usuario que programó la excepción |
| `created_at` | timestamp | DEFAULT NOW() | Fecha de registro |

Restricción: `UNIQUE(local_id, fecha)`.

#### `piso`

Piso o área física dentro de un local (ej. Piso 1, Terraza).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar | — | Nombre del piso/área |
| `columnas` | int | DEFAULT 5 CHECK (columnas BETWEEN 1 AND 12) | Cantidad de columnas de la cuadrícula modular del salón |
| `filas` | int | DEFAULT 3 CHECK (filas BETWEEN 1 AND 10) | Cantidad de filas de la cuadrícula modular del salón |
| `estado` | enum | — | activo, inactivo |

#### `mesa`

Mesa física dentro de un piso/ambiente del local.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `piso_id` | UUID | FK -> piso | Piso o área a la que pertenece |
| `numero` | varchar(10) | — | Identificador o número visible en salón y comandas (ej. "01", "12", "T-01") |
| `capacidad` | int | CHECK (capacidad BETWEEN 1 AND 20) | Número de personas/comensales estándar |
| `forma` | enum | — | `cuadrada`, `redonda`, `rectangular` (representación gráfica en el salón) |
| `posicion_x` | int | DEFAULT 0 | Columna en la grilla visual del salón |
| `posicion_y` | int | DEFAULT 0 | Fila en la grilla visual del salón |
| `permite_union` | bool | DEFAULT true | Si puede combinarse con otra mesa para pedidos de grupos |
| `estado` | enum | — | `activa`, `inactiva`, `bloqueada` |
| `created_at` | timestamp | DEFAULT NOW() | Fecha de creación del registro |
| `updated_at` | timestamp | DEFAULT NOW() | Fecha de última modificación |

##### Resolución de Estados Operativos en Salón (`CU-MOZO-01`):
En el frontend del Mozo, el estado operativo se resuelve dinámicamente combinando la base relacional:
1. **`libre`:** Mesa `activa` sin pedidos activos (`pedido.estado NOT IN ('borrador', 'enviado')`) ni reservas inminentes.
2. **`ocupada`:** Mesa con pedido activo (`pedido.estado IN ('borrador', 'enviado')`).
3. **`cuenta_pedida`:** Mesa ocupada cuyos comensales solicitaron la cuenta; esperando liquidación en Caja.
4. **`bloqueada`:** Mesa `bloqueada` automáticamente por la ventana temporal preventiva de una reserva confirmada (`CU-ADMIN-10: politicas_reserva.minutos_bloqueo_previo`).

##### Índices Compuestos para Salón y Despacho en Vivo:
```sql
CREATE INDEX IF NOT EXISTS idx_pedido_mozo_activo ON pedido(local_id, mozo_id, mesa_id) WHERE estado IN ('borrador', 'enviado');
CREATE INDEX IF NOT EXISTS idx_pedido_item_estado_entrega ON pedido_item(pedido_id, estado) WHERE estado IN ('listo', 'en_preparacion');
CREATE INDEX IF NOT EXISTS idx_reserva_bloqueo_inminente ON reserva(local_id, estado, fecha_hora) WHERE estado = 'confirmada';
```

---

### 2.3 Carta e inventario

#### `categoria_producto`

Categorías de la carta (Bebidas, Entradas, etc.), definidas por local con orden de visualización en el punto de venta / comanda móvil.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar(60) | UNIQUE(local_id, LOWER(nombre)) | Nombre de la categoría (ej. "Entradas", "Pollos a la Brasa") |
| `orden` | int | DEFAULT 0 CHECK (orden >= 0) | Posición de ordenamiento en la visualización de carta/mozo |
| `activa` | bool | DEFAULT true | Visibilidad en comanda móvil de mozos y carta pública |
| `created_at` | timestamp | DEFAULT NOW() | Fecha de creación del registro |
| `updated_at` | timestamp | DEFAULT NOW() | Fecha de última modificación |

#### `producto`

Plato o producto de la carta (requiere obligatoriamente categoría asignada y receta vinculada).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del plato o producto |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `categoria_id` | UUID | FK -> categoria_producto (ON DELETE RESTRICT) | Categoría obligatoria de la carta |
| `nombre` | varchar(100) | UNIQUE(local_id, LOWER(nombre)) | Nombre comercial del producto (ej. "Lomo Saltado Criollo") |
| `descripcion` | text | nullable | Descripción de ingredientes/preparación para carta QR y mozos |
| `precio` | decimal(10, 2) | CHECK (precio >= 0) | Precio de venta al público en salón |
| `moneda` | varchar(3) | DEFAULT 'PEN' | Moneda del precio de venta |
| `foto_url` | varchar(255) | nullable | Imagen del producto para menú digital |
| `disponibilidad` | enum | DEFAULT 'disponible' | `disponible`, `agotado` (sincronizado con stock de insumos) |
| `activo` | bool | DEFAULT true | Archivado lógico (prohibido DELETE físico con ventas históricas) |
| `created_at` | timestamp | DEFAULT NOW() | Fecha de creación del registro |
| `updated_at` | timestamp | DEFAULT NOW() | Fecha de última modificación |

#### `insumo`

Insumo/ingrediente gestionado en inventario (catálogo cerrado de 10 unidades de almacén universales, sin taxonomía restrictiva de categoría).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `local_id` | UUID | FK -> local | Local al que pertenece |
| `nombre` | varchar(80) | UNIQUE(local_id, LOWER(nombre)) | Nombre del insumo (ej. "Papa Yungay", "Pollo Entero Crudo") |
| `unidad_medida` | enum | — | Catálogo cerrado: `kg`, `L`, `und`, `botella`, `saco`, `lata`, `caja`, `paquete`, `bidon`, `jaba` |
| `stock_actual` | decimal(12, 3) | DEFAULT 0 CHECK (stock_actual >= 0) | Existencias físicas en almacén |
| `stock_minimo` | decimal(12, 3) | DEFAULT 0 CHECK (stock_minimo >= 0) | Umbral para alertas automáticas de reposición |
| `costo_unitario` | decimal(10, 2) | DEFAULT 0.00 CHECK (costo_unitario >= 0) | Costo de referencia por unidad de almacén |
| `moneda` | varchar(3) | DEFAULT 'PEN' | Moneda del costo unitario |
| `ultimo_proveedor_id` | UUID | FK -> proveedor (nullable) | Último proveedor registrado |
| `fecha_ultima_compra` | timestamp | nullable | Fecha de la última compra |
| `estado` | enum | DEFAULT 'activo' | `activo`, `agotado`, `inactivo` |
| `created_at` | timestamp | DEFAULT NOW() | Fecha de creación |
| `updated_at` | timestamp | DEFAULT NOW() | Fecha de última modificación |

#### `auditoria_stock_ajuste`

Registro auditable de ajustes manuales de stock, recuentos físicos periódicos y mermas directas.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del ajuste |
| `local_id` | UUID | FK -> local | Local donde ocurre el ajuste |
| `insumo_id` | UUID | FK -> insumo | Insumo ajustado |
| `usuario_id` | UUID | FK -> usuario | Usuario responsable del ajuste (Administrador) |
| `stock_anterior` | decimal(12, 3) | — | Stock registrado antes del ajuste |
| `stock_nuevo` | decimal(12, 3) | CHECK (stock_nuevo >= 0) | Stock resultante verificado |
| `diferencia` | decimal(12, 3) | — | Diferencia numérica (stock_nuevo - stock_anterior) |
| `motivo` | enum | — | `conteo_fisico_inventario`, `merma_desperdicio`, `ingreso_manual`, `vencimiento_caducidad`, `rotura_accidente` |
| `notas` | text | nullable | Detalle descriptivo u observaciones del auditor |
| `created_at` | timestamp | DEFAULT NOW() | Fecha y hora exacta del ajuste |

#### `producto_insumo`

Receta: insumos y cantidades que descuenta cada producto vendido (con flexibilidad de rendimiento culinario o cantidad exacta).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `producto_id` | UUID | PK compuesta / FK -> producto (ON DELETE CASCADE) | Producto/plato asociado |
| `insumo_id` | UUID | PK compuesta / FK -> insumo (ON DELETE RESTRICT) | Insumo requerido del inventario |
| `modo_calculo` | enum | DEFAULT 'rendimiento' | `rendimiento` (platos por unidad) o `exacto` (cantidad directa) |
| `rendimiento_platos` | decimal(10, 2) | nullable | Platos que rinde 1 unidad del insumo (ej. 140 para saco de papas) |
| `cantidad_descuenta` | decimal(12, 5) | CHECK (cantidad_descuenta > 0) | Fracción atómica exacta que descuenta del stock por comanda vendida |

---

### 2.4 Proveedores y compras

#### `proveedor`

Directorio de proveedores comerciales registrados por el local (sin RUC, priorizando contacto directo, teléfono/WhatsApp y agilidad operativa).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del proveedor |
| `local_id` | UUID | FK -> local, ON DELETE CASCADE | Local al que pertenece |
| `nombre` | varchar(100) | NOT NULL, UNIQUE(local_id, LOWER(nombre)) | Nombre comercial o razón social |
| `contacto` | varchar(80) | nullable | Persona o vendedor de contacto |
| `telefono` | varchar(20) | nullable | Teléfono o número celular para WhatsApp directo |
| `email` | varchar(100) | nullable | Correo comercial para pedidos o facturación |
| `direccion` | varchar(150) | nullable | Dirección física, mercado o número de puesto |
| `activo` | boolean | NOT NULL DEFAULT true | Estado del proveedor (activo / inactivo) |
| `created_at` | timestamp | NOT NULL DEFAULT NOW() | Fecha y hora de creación |
| `updated_at` | timestamp | NOT NULL DEFAULT NOW() | Fecha y hora de última modificación |

#### `ficha_compra`

Registro de una compra ya realizada físicamente (cierra el ciclo de abastecimiento, incrementa stock, reactiva platos agotados y asienta el egreso contable).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único de la ficha de compra |
| `local_id` | UUID | FK -> local, ON DELETE CASCADE | Local al que pertenece |
| `proveedor_id` | UUID | FK -> proveedor, ON DELETE RESTRICT | Proveedor de la compra (uno solo por ficha) |
| `usuario_id` | UUID | FK -> usuario | Administrador o usuario que registró la compra |
| `tipo_comprobante` | enum | NOT NULL DEFAULT 'factura' | factura, boleta, nota_venta, guia_remision, recibo |
| `numero_comprobante` | varchar(30) | NOT NULL | Serie y número físico (ej. F001-4921) o autogenerado (NV-20261008-0001) |
| `es_autogenerado` | boolean | NOT NULL DEFAULT false | True si el código fue asignado por el sistema al ser nota/recibo sin número |
| `fecha_emision` | date | NOT NULL DEFAULT CURRENT_DATE | Fecha de emisión física del comprobante |
| `metodo_pago` | enum | NOT NULL DEFAULT 'efectivo' | efectivo, transferencia, tarjeta_debito, credito_proveedor |
| `desglosa_igv` | boolean | NOT NULL DEFAULT true | True si desglosa 18% para crédito fiscal (Factura); False si es monto neto |
| `subtotal` | decimal(10,2) | NOT NULL DEFAULT 0.00 | Base imponible o monto neto antes de impuestos |
| `impuestos` | decimal(10,2) | NOT NULL DEFAULT 0.00 | Monto de IGV (18% desglosado si aplica) |
| `total` | decimal(10,2) | NOT NULL CHECK (total >= 0) | Monto total pagado de la compra (coincide con la suma de insumos) |
| `moneda` | varchar(3) | NOT NULL DEFAULT 'PEN' | Código de divisa ISO 4217 (ej. PEN, USD) |
| `estado` | enum | NOT NULL DEFAULT 'registrada' | registrada, anulada |
| `motivo_anulacion` | text | nullable | Justificación obligatoria ingresada por el administrador al anular |
| `anulado_por` | UUID | FK -> usuario, nullable | Administrador que ejecutó la anulación |
| `anulado_at` | timestamp | nullable | Fecha y hora en que se anuló la ficha |
| `notas` | text | nullable | Observaciones de entrega o calidad |
| `created_at` | timestamp | NOT NULL DEFAULT NOW() | Fecha y hora de registro en el sistema |

#### `ficha_compra_detalle`

Insumos reabastecidos incluidos en la ficha de compra.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador del ítem de compra |
| `ficha_compra_id` | UUID | FK -> ficha_compra, ON DELETE CASCADE | Ficha de compra a la que pertenece |
| `insumo_id` | UUID | FK -> insumo, ON DELETE RESTRICT | Insumo reabastecido |
| `cantidad` | decimal(10,4) | NOT NULL CHECK (cantidad > 0) | Cantidad adquirida en unidad de compra |
| `precio_unitario` | decimal(10,4) | NOT NULL CHECK (precio_unitario >= 0) | Precio pagado por unidad de compra |
| `subtotal` | decimal(10,2) | NOT NULL CHECK (subtotal >= 0) | cantidad × precio_unitario |

##### Reglas de Integridad y Transaccionalidad en Anulación de Compras (Plan de Contingencia):
1. **Inmutabilidad y Prohibición de DELETE:** La anulación se procesa conmutando `estado = 'anulada'`, requiriendo `motivo_anulacion` (mín. 10 caracteres), `anulado_por` y `anulado_at`. No se permite eliminación física (`DELETE`) para preservar trazabilidad fiscal y contable.
2. **Protección de Saldo Físico No Negativo:** Al descontar existencias por anulación, el backend ejecuta `stock_actual = GREATEST(0, stock_actual - fcd.cantidad)`. Si durante el intervalo entre compra y anulación se registraron ventas de platos que consumieron parte del lote (`stock_actual < cantidad`), el piso queda fijado en 0 para evitar inconsistencias matemáticas (`CHECK (stock_actual >= 0)`), asentando la discrepancia en `log_auditoria` (`CU-ADMIN-16`).
3. **Cascada de Insumo Agotado a Platos de la Carta:** Si `stock_actual` desciende a 0, `insumo.estado` pasa automáticamente a `'agotado'`. A su vez, el sistema localiza todo `producto` que tenga dicho insumo en su receta (`producto_insumo`) y conmuta `producto.disponibilidad = 'agotado'`, bloqueando inmediatamente comandas en mozo (`CU-MOZO-01`) y carta digital QR.
4. **Contingencia en Cocina (KDS):** Pedidos en curso (`pedido.estado IN ('en_cola', 'en_preparacion')`) que contengan ítems afectados reciben el flag visual `[Observado por quiebre]`, disparando notificación reactiva al mozo asignado.
5. **Reversión Financiera:** El movimiento asociado en `egreso_caja` (`CU-ADMIN-14`) pasa a `estado = 'anulado'`, reponiendo el saldo disponible en la caja chica del turno.

---

### 2.5 Reservas, pedidos y mesas

#### `politicas_reserva`

Políticas y parámetros operativos de reservas de mesa por local (relación 1:1 con `local`, aprovisionada y activa exclusivamente para planes Pro y Enterprise con `plan.incluye_reservas = true`).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `local_id` | UUID | PK / FK -> local (ON DELETE CASCADE) | Sede a la que aplica la configuración de reservas |
| `acepta_reservas` | bool | NOT NULL DEFAULT false | Interruptor maestro de recepción de reservas de salón (`CU-ADMIN-10`) |
| `duracion_reserva_min` | int | NOT NULL DEFAULT 90 CHECK (duracion_reserva_min BETWEEN 30 AND 240) | Duración estándar estimada de permanencia por mesa (minutos) |
| `buffer_reserva_min` | int | NOT NULL DEFAULT 15 CHECK (buffer_reserva_min BETWEEN 0 AND 60) | Margen de sanitización y rotación entre reservas consecutivas |
| `tolerancia_no_show_min` | int | NOT NULL DEFAULT 15 CHECK (tolerancia_no_show_min BETWEEN 5 AND 60) | Minutos de espera de cortesía antes de marcar no_show y liberar mesa |
| `minutos_bloqueo_previo` | int | NOT NULL DEFAULT 30 CHECK (minutos_bloqueo_previo BETWEEN 0 AND 120) | Minutos de anticipación en que la mesa pasa a "bloqueada" en salón (`CU-MOZO-01`) |
| `margen_recordatorio_min` | int | NOT NULL DEFAULT 120 CHECK (margen_recordatorio_min >= 0) | Minutos de antelación para alertas preventivas al equipo |
| `anticipacion_minima_horas` | int | NOT NULL DEFAULT 2 CHECK (anticipacion_minima_horas BETWEEN 0 AND 48) | Mínima antelación para solicitar una reserva |
| `anticipacion_maxima_dias` | int | NOT NULL DEFAULT 30 CHECK (anticipacion_maxima_dias BETWEEN 1 AND 90) | Máximo horizonte de días futuros para agendar reserva |
| `created_at` | timestamp with time zone | DEFAULT NOW() | Fecha de creación del registro |
| `updated_at` | timestamp with time zone | DEFAULT NOW() | Fecha de última modificación |

#### `reserva`

Reserva de mesa en salón (gestionada por Mozo o recepción con soporte para resolución de conflictos por cierres).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `local_id` | UUID | FK -> local (ON DELETE CASCADE) | Local al que pertenece |
| `cliente_nombre` | varchar(100) | NOT NULL | Nombre del cliente |
| `cliente_telefono` | varchar(20) | NOT NULL | Teléfono / celular de contacto (Perú +51) |
| `fecha_hora` | timestamp with time zone | NOT NULL | Fecha y hora programada de la reserva |
| `num_personas` | int | NOT NULL CHECK (num_personas > 0) | Cantidad de comensales |
| `estado` | enum | DEFAULT 'confirmada' | `confirmada`, `bloqueada`, `atendida`, `cancelada`, `no_show` |
| `creado_por` | UUID | FK -> usuario (ON DELETE SET NULL) | Colaborador que registró la reserva |
| `excepcion_id` | UUID | nullable FK -> horario_excepcion | Vinculación si fue cancelada por un feriado o cierre extraordinario (`CU-ADMIN-09`) |
| `motivo_cancelacion` | text | nullable | Causa de anulación o cancelación |
| `notificado_cliente` | bool | DEFAULT false | Indica si el comensal fue contactado previamente |
| `metodo_notificacion` | varchar(20) | DEFAULT 'ninguno' CHECK (metodo_notificacion IN ('ninguno', 'whatsapp', 'llamada', 'presencial')) | Canal utilizado para notificar al cliente |
| `notificado_por` | UUID | nullable FK -> usuario | Usuario que ejecutó la llamada o envío de WhatsApp |
| `fecha_notificado` | timestamp with time zone | nullable | Momento exacto de la notificación |
| `created_at` | timestamp with time zone | DEFAULT NOW() | Fecha de creación del registro |
| `updated_at` | timestamp with time zone | DEFAULT NOW() | Fecha de última modificación |

#### `reserva_mesa`

Mesas asignadas a una reserva (permite más de una si se combinan).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `reserva_id` | UUID | PK compuesta / FK -> reserva | Reserva asociada |
| `mesa_id` | UUID | PK compuesta / FK -> mesa | Mesa asignada |

#### `pedido`

Pedido o comanda asociada a una mesa en salón (cuenta abierta de consumo).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del pedido |
| `local_id` | UUID | FK -> local (ON DELETE CASCADE) | Local al que pertenece |
| `mesa_id` | UUID | FK -> mesa (ON DELETE RESTRICT) | Mesa de origen de la comanda |
| `mozo_id` | UUID | FK -> usuario (ON DELETE RESTRICT) | Mozo responsable de la mesa |
| `estado` | enum | DEFAULT 'enviado' | `borrador`, `enviado`, `cobrado`, `anulado` |
| `comensales` | int | DEFAULT 1 CHECK (comensales > 0) | Cantidad de personas en la mesa |
| `created_at` | timestamp with time zone | DEFAULT NOW() | Fecha de creación del pedido |
| `updated_at` | timestamp with time zone | DEFAULT NOW() | Fecha de última modificación |

#### `pedido_item`

Ítem individual dentro de un pedido despachado a cocina o bar por rondas.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único del ítem |
| `pedido_id` | UUID | FK -> pedido (ON DELETE CASCADE) | Pedido al que pertenece |
| `producto_id` | UUID | FK -> producto (ON DELETE RESTRICT) | Plato o bebida solicitado |
| `cantidad` | int | NOT NULL CHECK (cantidad > 0) | Cantidad de unidades solicitadas |
| `precio_unitario` | decimal(10, 2) | NOT NULL CHECK (precio_unitario >= 0) | Precio unitario congelado al momento del envío |
| `nota_cocina` | varchar(200) | nullable | Indicación de cocina (ej. "Término 3/4, sin cebolla"); semántica `NULL` si estándar |
| `estado` | enum | DEFAULT 'en_cola' | `en_cola`, `en_preparacion`, `listo`, `entregado`, `no_disponible`, `anulado` |
| `numero_ronda` | int | DEFAULT 1 CHECK (numero_ronda >= 1) | Número de ronda (1 = comanda inicial, 2+ = pedidos adicionales) |
| `motivo_anulacion` | varchar(255) | nullable | Justificación si el ítem fue anulado (`CU-MOZO-06`) |
| `anulado_por` | UUID | nullable FK -> usuario | Colaborador que anuló el ítem |
| `es_merma` | bool | DEFAULT false | Si la anulación ocurrió tras estar listo o entregado (merma de inventario) |
| `created_at` | timestamp with time zone | DEFAULT NOW() | Momento de despacho a cocina |
| `updated_at` | timestamp with time zone | DEFAULT NOW() | Momento de último cambio de estado |

---

### 2.6 Promociones, caja y comprobantes

#### `promocion`

Promoción y descuento configurado por el Administrador del local para incentivar ventas y agilizar el cobro en Caja (`CU-CAJA-02`).

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único de la promoción |
| `local_id` | UUID | FK -> local (ON DELETE CASCADE) | Local al que pertenece |
| `nombre` | varchar(100) | NOT NULL, UNIQUE(local_id, LOWER(nombre)) | Nombre comercial de la promoción |
| `descripcion` | text | nullable | Detalle explicativo impreso en comprobantes de venta |
| `tipo_descuento` | enum | NOT NULL | `porcentaje`, `monto_fijo` |
| `valor` | decimal(10, 2) | NOT NULL CHECK (valor > 0) | Valor del porcentaje o monto fijo en Soles |
| `tope_maximo_descuento` | decimal(10, 2) | nullable CHECK (tope_maximo_descuento > 0) | Tope en Soles para porcentajes (NULL si no tiene tope) |
| `monto_minimo_consumo` | decimal(10, 2) | DEFAULT 0.00 CHECK (monto_minimo_consumo >= 0) | Consumo mínimo requerido en cuenta (0.00 = sin mínimo) |
| `dias_semana` | smallint[] | DEFAULT '{1,2,3,4,5,6,7}' | Días aplicables: 1=Lunes .. 7=Domingo (NULL = todos) |
| `hora_inicio` | time | nullable | Inicio de franja Happy Hour (NULL si aplica todo el día) |
| `hora_fin` | time | nullable | Fin de franja Happy Hour |
| `fecha_inicio` | date | NOT NULL | Inicio de vigencia |
| `fecha_fin` | date | NOT NULL | Fin de vigencia (`CHECK (fecha_inicio <= fecha_fin)`) |
| `limite_usos` | int | nullable CHECK (limite_usos > 0) | Límite máximo de usos (NULL = ilimitada durante vigencia) |
| `usos_actuales` | int | NOT NULL DEFAULT 0 CHECK (usos_actuales >= 0) | Conteo de veces aplicada en comprobantes |
| `activa` | bool | NOT NULL DEFAULT true | Switch de activación / pausa inmediata para caja |
| `created_at` | timestamp with time zone | NOT NULL DEFAULT NOW() | Fecha de registro |
| `updated_at` | timestamp with time zone | NOT NULL DEFAULT NOW() | Fecha de última modificación |

##### Reglas de Negocio y Salvaguarda Contable (`CU-ADMIN-17`):
1. **Semántica `NULL` sin Sobreingeniería:** Si `limite_usos` es `NULL`, la campaña es ilimitada. Si `tope_maximo_descuento` es `NULL`, aplica el porcentaje íntegro sin techo. Esto evita columnas booleanas redundantes en PostgreSQL.
2. **Índice Parcial para Caja (`CU-CAJA-02`):** `CREATE INDEX idx_promocion_caja_vigencia ON promocion(local_id, fecha_inicio, fecha_fin) WHERE activa = true;` garantiza que las consultas de cobro en el POS se ejecuten en sub-milisegundos (< 1ms).
3. **Salvaguarda de Integridad Contable (Prohibición de DELETE Físico):** La clave foránea `comprobante.promocion_id REFERENCES promocion(id) ON DELETE RESTRICT` impide que una promoción con ventas pasadas sea borrada de la base de datos (`ERR_PROMOCION_CON_HISTORIAL`). Se debe utilizar el switch de estado (`activa = false`) para pausarla sin quebrar la auditoría contable ni reportes históricos. Si tiene 0 usos (`usos_actuales == 0`), sí se permite el borrado físico.

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

Incidente interno operativo, disciplinario o de servicio registrado por la administración de la sede y supervisado corporativamente.

| Campo | Tipo | Clave / Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identificador único |
| `local_id` | UUID | FK -> local | Local/sede en la que ocurrió el incidente |
| `codigo` | varchar(20) | UNIQUE | Código correlativo de seguimiento (ej. `INC-2026-084`) |
| `titulo` | varchar(120) | — | Resumen conciso del hecho para bandejas y alertas |
| `categoria` | enum | — | `servicio_cliente`, `disciplinario`, `rotura_merma`, `seguridad_higiene`, `caja_dinero`, `otro` |
| `descripcion` | text | — | Descripción pormenorizada de lo acontecido |
| `medidas_inmediatas` | text | nullable | Acciones inmediatas correctivas o de contención adoptadas por la sede |
| `fecha_hora` | timestamp | — | Fecha y hora en que ocurrió el hecho |
| `gravedad` | enum | — | `baja`, `media`, `alta` (dispara alertas en tiempo real) |
| `foto_url` | varchar | nullable | Enlace a evidencia multimedia en bucket privado S3 |
| `empleado_id` | UUID | FK -> usuario (nullable) | Colaborador involucrado directamente, si aplica |
| `registrado_por` | UUID | FK -> usuario | Usuario (administrador de sede) que levantó el reporte |
| `estado` | enum | — | `abierto`, `en_revision`, `resuelto` |
| `visto_por_propietario` | bool | default false | Acuse de lectura automático al abrir el detalle |
| `fecha_visto` | timestamp | nullable | Momento exacto del primer acceso de lectura del propietario |
| `nota_propietario` | text | nullable | Directiva u observación ejecutiva del dueño para el administrador |
| `motivo_revision` | text | nullable | Justificación o avance de la investigación interna en sede |
| `resolucion_nota` | text | nullable | Medidas correctivas definitivas y notas de remediación al resolver |
| `resuelto_por` | UUID | FK -> usuario (nullable) | Administrador de sede que ejecutó la resolución definitiva |
| `fecha_resolucion` | timestamp | nullable | Momento exacto del cierre inmutable del incidente |
| `created_at` | timestamp | default NOW() | Fecha de creación del registro |
| `updated_at` | timestamp | default NOW() | Fecha de última modificación operativa o de supervisión |

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

### 2.9 Almacenamiento en memoria y datos efímeros (Redis)

Para evitar la saturación de PostgreSQL por *table bloat* (acumulación de tuplas muertas por MVCC) y escrituras continuas en el log de transacciones (WAL), los datos con alta tasa de creación, lectura y expiración **no se almacenan en tablas relacionales**, sino en **Redis** mediante claves estructuradas con TTL automático (*Time-To-Live*):

| Patrón de Clave (Key) | Tipo de Dato | TTL Sugerido | Descripción y Uso |
| :--- | :--- | :--- | :--- |
| `auth:refresh:<usuario_id>:<token_hash>` | String / Hash | 7 – 15 días | Refresh token opaco para renovación de sesión. Permite rotación y revocación inmediata al cerrar sesión. |
| `auth:blacklist:<jti>` | String (`"revoked"`) | Restante del JWT (~15-30m) | Lista de revocación de Access Tokens (JWT) antes de su expiración natural. |
| `auth:otp:<tipo>:<usuario_id>` | String | 15 minutos | Tokens de restablecimiento de contraseña o verificación de un solo uso; se consumen atómicamente con `GETDEL`. |
| `ratelimit:<ip_o_correo>:<accion>` | Integer (Incr) | 1 – 15 minutos | Conteo de intentos de login o peticiones para mitigar ataques de fuerza bruta. |
| `cache:identidad:<tipo_doc>:<num_doc>` | JSON String | 24 – 48 horas | Caché temporal de consultas a APIs externas de identidad (RENIEC / SUNAT) para comprobantes. |

> **Aclaración de diseño:** El campo `comprobante.token_qr` **sí permanece en PostgreSQL** porque constituye un identificador permanente de acceso al comprobante digital emitido. Por el contrario, los tokens de sesión, códigos OTP y tokens de revocación residen exclusivamente en Redis.

---

## 3. Recomendaciones para la siguiente etapa

1. **Definir índices compuestos** por `(local_id, fecha)` en las tablas de alto volumen de consulta (`pedido`, `pedido_item`, `snapshot_stock_diario`) para acelerar reportes y forecasting.
2. **Confirmar el motor de base de datos:** PostgreSQL 16 con Row-Level Security (RLS) para persistencia relacional y Redis 7 para datos volátiles/sesiones.
3. **Definición de arquitectura de servicios:** Core API (Go) es el único servicio con acceso de escritura a PostgreSQL y acceso a Redis; AI Service solo lee de PostgreSQL.
4. **Validación de precisión:** las tablas `producto_insumo` y `ficha_compra_detalle` son las de mayor sensibilidad para la precisión del forecasting; conviene validarlas con datos reales apenas se tenga el primer local operando.