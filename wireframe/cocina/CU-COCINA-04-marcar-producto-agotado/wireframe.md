# Especificación de Wireframes: CU-COCINA-04 - Marcar Producto como Agotado / Disponible

## 1. Metadatos del Caso de Uso

- **Identificador:** `CU-COCINA-04`
- **Nombre:** Marcar producto como agotado / disponible (Gestión táctil de quiebres de cocina)
- **Módulo:** Cocina (Kitchen Display System - KDS)
- **Actor Principal:** Cocinero / Chef de Partida / Jefe de Cocina (`rol: cocina`, `rol: admin_local`)
- **Dispositivo Objetivo:** Monitor Táctil KDS de Cocina / Tablet Industrial de Partida (Resolución base: 1440x900 px, Grayscale Blueprint, WCAG 2.1 AA).
- **Precondiciones:**
  - El local cuenta con servicio activo.
  - El producto está registrado en la carta de la sede (`producto.local_id = :local_id`).
  - Existen o no pedidos culinarios en curso para el plato seleccionado.

---

## 2. Índice de Vistas Wireframe

| Vista | Archivo de Imagen | Descripción Funcional |
|---|---|---|
| **Vista 1** | `wf_cocina_04_modal_disponibilidad_platos.jpg` | Modal táctil de gestión de disponibilidad de carta en KDS. Pestañas de partidas culinarias, contador de platos apagados, switches táctiles grandes para apagar o reactivar con 1 toque y distinción de origen de quiebre (Automático por Stock en `CU-COCINA-03` vs Manual en Cocina). |
| **Vista 2** | `wf_cocina_04_dialogo_resolucion_ordenes_fuego.jpg` | Diálogo táctil de resolución de fuego activo ante quiebre. Maneja el caso crítico donde hay $N$ porciones en preparación activa y el insumo solo alcanza para $K$ platos ($K < N$). Selector numérico ultra rápido FIFO y ajuste fino comanda por comanda, enlazado con la alerta reactiva a salón (`CU-MOZO-07`). |

---

## 3. Especificación Detallada de Vistas

### Vista 1: Modal Táctil de Disponibilidad de Platos (`wf_cocina_04_modal_disponibilidad_platos.jpg`)

#### Propósito:
Permitir a la brigada de cocina apagar temporalmente cualquier plato de la carta en menos de 3 segundos cuando detecta falta de insumo o merma, o reactivarlo de inmediato cuando llega la reposición, sin intermediación de computadoras administrativas ni fricción burocrática.

#### Componentes Principales:
1. **Acceso Rápido en Barra Superior KDS:**
   - Botón permanente en el header de `CU-COCINA-01`: `[ 🚫 GESTIÓN DE QUIEBRES / AGOTADOS (3) ]`.
   - Contador en vivo en rojo/carbón con la cantidad de platos de cocina actualmente fuera de servicio en la sede.
2. **Cabecera del Modal:**
   - Título: *Gestión Táctil de Disponibilidad de Platos* (`CU-COCINA-04`).
   - Subtítulo descriptivo de sincronización en tiempo real.
   - Badge contador: *3 de 18 Platos Apagados*.
   - Botón de cierre táctil `[ ✕ ]` de 40x40px.
3. **Barra de Partidas Culinarias (Pestañas Táctiles):**
   - Botones táctiles de 44px de altura con badges de conteo y alertas de platos apagados por sección:
     - `Todas (18)`
     - `🔥 Brasas & Carnes (5)`
     - `🍳 Salteados & Wok (2 apagados)`
     - `🐟 Pescados & Mariscos (1 apagado)`
     - `🍟 Entradas & Guarniciones (5)`
   - Buscador táctil con teclado integrado para filtrar al instante por nombre o ingrediente clave.
4. **Tarjetas de Platos Culinarios (Grid de 2 Columnas):**
   - **Plato Disponible:**
     - Nombre de plato y categoría.
     - Receta clave resumida y stock estimado.
     - Botón de acción táctil: `[ 🚫 MARCAR COMO AGOTADO (Falta Insumo) ]` (Carbón sólido `#111827`, texto blanco, alto 48px).
   - **Plato Apagado Manualmente:**
     - Nombre tachado, fondo sutil con tinte de aviso.
     - Badge: `[ ⚠️ Apagado Manual en Cocina (Hace 12 min por Marco V.) ]`.
     - Botón de reactivación táctil: `[ ↺ REACTIVAR A DISPONIBLE (Llegó Insumo) ]` (Verde esmeralda `#059669`, alto 48px).
   - **Plato Agotado Automáticamente por Stock Cero ([`CU-COCINA-03`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cocina/CU-COCINA-03-descuento-automatico-insumos/wireframe.md)):**
     - Badge: `[ 🤖 Quiebre Automático por Stock: Insumo "Limón fresco" en 0 kg ]`.
     - Estado bloqueado: `[ 🔒 Bloqueado por Stock Teórico (Requiere recepción en compras) ]`.
5. **Pie de Control:**
   - Indicador de pulso verde: *"Sincronización SSE en tiempo real activa: Los cambios bloquean o liberan la carta en < 30ms"*.
   - Botón de retorno: `[ ← Volver a Pantalla KDS de Comandas ]`.

---

### Vista 2: Diálogo Táctil de Resolución de Órdenes en Fuego (`wf_cocina_04_dialogo_resolucion_ordenes_fuego.jpg`)

#### Propósito:
Resolver con justicia culinaria y sin desperdicios el apagado de un plato cuando existen porciones activas en la cocina. Evita el dilema de "todo o nada", permitiendo al cocinero aprovechar la mise en place restante para despachar las porciones posibles y derivar a sustitución únicamente las que no se pueden preparar.

#### Estructura y Flujo de Interacción:
1. **Regla de Separación Automática:**
   - **Órdenes `en_cola` (Aún no iniciadas en sartén):** El backend las conmuta de inmediato a `no_disponible` sin requerir decisión del chef, emitiendo la notificación sonora al mozo.
   - **Órdenes `en_preparacion` (En fuego activo):** Se detienen momentáneamente y se presentan en este diálogo táctil.
2. **Paso 1: Selector Táctil Rápido (Contador FIFO):**
   - Pregunta clave: *"¿Para cuántas porciones te alcanza la carne / mise en place disponible?"*
   - Botonera numérica táctil (56px de alto): `[ 0 Ninguno ]` `[ 1 ]` `[ 2 ✓ Seleccionado ]` `[ 3 ]` `[ 4 ]` `[ 5 Todas ]`.
   - **Criterio FIFO Automático:** Al tocar `[ 2 ]`, el sistema asigna de inmediato esas 2 porciones a las comandas con más tiempo de espera en cocina.
3. **Paso 2: Asignación Granular por Comanda (Ajuste Fino Opcional):**
   - Lista táctil de comandas en preparación ordenadas por antigüedad:
     - **Comanda #104 (Mesa 04 - 14 min de espera):** `2x Lomo Saltado` $\rightarrow$ `[ ✓ SE PREPARA EN FUEGO (2 de 2) ]` (Cubierto con la mise en place).
     - **Comanda #105 (Mesa 07 - 9 min de espera):** `2x Lomo Saltado` $\rightarrow$ `[ 🚫 NO ALCANZA - AVISAR MOZO ]` (Alerta sonora a tablet de Carlos D. vía [`CU-MOZO-07`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/wireframe.md)).
     - **Comanda #108 (Mesa 01 - 6 min de espera):** `1x Lomo Saltado` $\rightarrow$ `[ 🚫 NO ALCANZA - AVISAR MOZO ]` (Alerta a tablet de Rosa P. vía [`CU-MOZO-07`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/wireframe.md)).
   - Cada fila incluye botón `[ Cambiar ]` por si el chef necesita alterar la prioridad manualmente.
4. **Paso 3: Motivo y Notificación al Administrador:**
   - Selector de causa: `Falta de insumo fresco` / `Merma imprevista` / `Falla en equipamiento`.
   - Checkbox activo: `[x] Notificar de inmediato al Administrador de Sede (SSE Toast)`.
5. **Botones de Impacto:**
   - Botón Secundario: `[ Cancelar y Mantener en Fuego ]` (Vuelve al estado previo sin cambios).
   - Botón Primario: `[ ⚡ CONFIRMAR Y AVISAR A MOZOS (3 Platos Observados) ]` (Aplica la transacción atómica, actualiza el KDS y emite eventos SSE concurrentes).

---

## 4. Transacciones de Base de Datos y Máquina de Estados

### Transición Atómica de Resolución Parcial:
```sql
BEGIN;

-- 1. Actualizar disponibilidad del producto con causal manual y trazabilidad
UPDATE producto
SET disponibilidad = 'agotado',
    motivo_agotado = 'apagado_manual_cocina',
    usuario_modifico_disp_id = :chef_usuario_id,
    fecha_modificacion_disp = NOW(),
    updated_at = NOW()
WHERE id = :producto_id AND local_id = :local_id;

-- 2. Conmutar órdenes en cola a no_disponible vinculando pedido para resolver local_id
UPDATE pedido_item pi
SET estado = 'no_disponible',
    motivo_anulacion = 'quiebre_stock_cocina',
    anulado_por = :chef_usuario_id,
    updated_at = NOW()
FROM pedido p
WHERE pi.pedido_id = p.id
  AND pi.producto_id = :producto_id 
  AND p.local_id = :local_id 
  AND pi.estado = 'en_cola';

-- 3. Conmutar órdenes en fuego no cubiertas a no_disponible con trazabilidad
UPDATE pedido_item
SET estado = 'no_disponible',
    motivo_anulacion = 'quiebre_fuego_parcial',
    anulado_por = :chef_usuario_id,
    updated_at = NOW()
WHERE id IN (:items_en_fuego_no_alcanzados);

-- 4. Mantener órdenes cubiertas en_preparacion (continúan en fuego)
-- (:items_en_fuego_cubiertos permanecen en estado = 'en_preparacion')

-- 5. Registrar alerta institucional en notificacion con empresa_id y rol_destinatario
INSERT INTO notificacion (
    id,
    empresa_id,
    local_id, 
    usuario_id,
    rol_destinatario,
    tipo, 
    prioridad,
    titulo, 
    mensaje, 
    entidad_tipo,
    entidad_id,
    leida,
    created_at
) VALUES (
    fn_uuid_v8(),
    (SELECT empresa_id FROM local WHERE id = :local_id),
    :local_id,
    :admin_local_id,
    'admin_local',
    'quiebre_manual_cocina',
    'media',
    '⚠️ Quiebre manual en cocina: Lomo Saltado Clásico',
    'El Chef Marco V. apagó el plato por falta de insumo. 3 porciones derivadas a salón.',
    'producto',
    :producto_id,
    false,
    NOW()
);

COMMIT;
```

---

## 5. Arquitectura de Eventos Reactivos (SSE)

| Evento SSE | Emisor | Destinatario | Payload Clave | Efecto en UI |
|---|---|---|---|---|
| `plato_agotado_carta` | KDS Cocina | Mozos y Carta QR | `{ producto_id, nombre, motivo }` | Inhabilita el botón de añadir en la tablet del mozo y muestra etiqueta "Agotado" en el QR digital (<30ms). |
| `item_no_disponible_salon` | Backend (KDS) | Tablet Mozo (`CU-MOZO-07`) | `{ pedido_id, pedido_item_id, mesa_numero, plato_nombre }` | Dispara vibración y timbre sonoro persistente en la tablet del mozo titular, abriendo el modal de sustitución o anulación. |
| `alerta_quiebre_admin` | Backend (KDS) | Panel Administrador | `{ producto_id, chef_nombre, motivo, porciones_afectadas }` | Despliega Toast amarillo/ámbar en la esquina del panel admin para gestión de compras urgentes. |
| `plato_reactivado_carta` | KDS Cocina | Mozos y Carta QR | `{ producto_id, nombre }` | Rehabilita el producto instantáneamente en cartas de salón y QR. |

---

## 6. Vinculación con Otros Casos de Uso

- **[`CU-COCINA-01: Ver cola de pedidos entrantes (KDS)`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/wireframe.md):** El botón de acceso rápido vive en la barra superior del KDS. Los platos declarados `no_disponible` desaparecen de las tarjetas de comanda de cocina.
- **[`CU-COCINA-03: Descuento automático de insumos por consumo`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cocina/CU-COCINA-03-descuento-automatico-insumos/wireframe.md):** Cuando un insumo llega a stock 0 en el despacho, el sistema conmuta el plato automáticamente a `agotado`, mostrando el badge de bloqueo por stock en la Vista 1.
- **[`CU-MOZO-07: Atender plato no disponible`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/wireframe.md):** Recibe los ítems no alcanzados y guía al mozo en el cambio por un plato de igual o mayor valor o anulación con motivo.
- **[`CU-ADMIN-04: Gestionar carta y menú`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-04-crear-producto/wireframe.md):** La disponibilidad se refleja en tiempo real en la ficha administrativa del producto.
