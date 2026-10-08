# CU-ADMIN-02: Gestionar Categorías de la Carta

Especificación técnica de interfaz de usuario, arquitectura de información, estados UX y contratos de API para la organización de secciones del menú, ordenamiento para comanda móvil de mozos y disponibilidad en **RestaurantCloud AI**.

---

## 1. Ficha Técnica del Caso de Uso

| Atributo | Detalle |
| :--- | :--- |
| **Código CU** | `CU-ADMIN-02` |
| **Nombre** | Gestionar categorías de la carta |
| **Actor(es)** | `administrador_local` (gestión exclusiva de la carta de su sede asignada) |
| **Dispositivo / Viewport** | Responsive Desktop (`1440x900`), Tablet (`768x1024`), Mobile (`375x812`) |
| **Precondición** | El local se encuentra en estado `activo` (`CU-PROP-04`) y el usuario tiene sesión iniciada con rol `admin_local` vinculado a esa sede (`CU-PROP-05`). |
| **Postcondición** | Secciones del menú creadas, ordenadas visualmente por posición (`orden ASC`), visibilidad conmutada para comanda móvil y protección estricta contra borrado accidental de categorías con platos. |

---

## 2. Diagrama de Flujo y Secuencia

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador del Local
    participant FE as Frontend Dashboard
    participant BE as Backend (Go Core API)
    participant DB as PostgreSQL (RLS)

    %% 1. Listado de Categorías con conteo de platos
    A->>FE: 1. Ingresa a "Categorías de la Carta"
    FE->>BE: GET /api/v1/admin/categorias
    BE->>DB: SET app.tenant_id = :empresa_id;<br/>SELECT c.*, COUNT(p.id) as total_productos, COUNT(CASE WHEN p.disponibilidad = 'disponible' THEN 1 END) as disponibles<br/>FROM categoria_producto c LEFT JOIN producto p ON p.categoria_id = c.id<br/>WHERE c.local_id = :admin_local_id GROUP BY c.id ORDER BY c.orden ASC
    DB-->>BE: Retorna lista de categorías con métricas de platos
    BE-->>FE: 200 OK (apiresponse.Response con CategoriasListDTO)
    FE->>A: Renderiza Vista 1: Tabla de Categorías con orden, contadores y switches

    %% 2. Aprovisionamiento Automático o Estado Inicial
    Note over A,FE: Si la sede fue creada con plantilla en CU-PROP-04 (Pollería, Cevichería o Chifa),<br/>las categorías ya aparecen precargadas en la tabla.<br/>Si fue creada "En Blanco", se muestra el estado de bienvenida guiando a crear la primera sección.

    %% 3. Creación / Edición Individual
    alt Administrador crea o edita una categoría manual
        A->>FE: 3. Clic en "[ + Nueva Categoría ]" o "[ Editar ]"
        FE->>A: Despliega Vista 2: Modal de Creación / Edición
        A->>FE: Ingresa nombre "Entradas Criollas", orden 1, activa true
        FE->>BE: PUT /api/v1/admin/categorias/{id} {nombre: "Entradas Criollas", orden: 1, activa: true}
        BE->>DB: Valida UNIQUE(local_id, LOWER(nombre)) + UPDATE categoria_producto
        DB-->>BE: Registro guardado
        BE-->>FE: 200 OK (apiresponse.Response con CategoriaDetalleDTO)
        FE->>A: Actualiza la fila en la tabla de inmediato
    end

    %% 4. Reordenamiento en Lote (Drag-and-Drop)
    alt Administrador reordena las pestañas
        A->>FE: 4. Arrastra una fila usando el icono (≡)
        FE->>BE: PATCH /api/v1/admin/categorias/reordenar [{"id": "uuid-1", "orden": 1}, {"id": "uuid-2", "orden": 2}]
        BE->>DB: Actualiza atómicamente el orden en una transacción
        DB-->>BE: Transacción confirmada
        BE-->>FE: 200 OK (apiresponse.Response con {mensaje: "Orden actualizado"})
        FE->>A: Notificación sutil confirmando nuevo orden en comandas
    end

    %% 5. Eliminación con Bloqueo de Seguridad y Reasignación
    alt Administrador intenta eliminar categoría con productos asociados
        A->>FE: 5. Clic en "Eliminar" de "Pollos a la Brasa"
        FE->>BE: DELETE /api/v1/admin/categorias/{id}
        BE->>DB: SELECT COUNT(*), ARRAY_AGG(nombre) FROM producto WHERE categoria_id = :id AND local_id = :admin_local_id
        alt Conteo de platos > 0 (Bloqueo de Seguridad)
            DB-->>BE: Conteo = 8 platos encontrados
            BE-->>FE: 409 Conflict (ERR_CATEGORIA_CON_PRODUCTOS con lista de 8 platos)
            FE->>A: Despliega Vista 4: Modal de Bloqueo y Reasignación Asistida
            A->>FE: Elige categoría receptora "Porciones y Combos" y pulsa "[ Reasignar 8 Platos y Eliminar ]"
            FE->>BE: POST /api/v1/admin/categorias/{id}/reasignar-y-eliminar {"nueva_categoria_id": "uuid-destino"}
            BE->>DB: BEGIN; UPDATE producto SET categoria_id = :destino WHERE categoria_id = :id; DELETE FROM categoria_producto WHERE id = :id; COMMIT;
            DB-->>BE: Transacción atómica completada
            BE-->>FE: 200 OK (apiresponse.Response con ReasignacionResultDTO)
            FE->>A: Remueve la categoría y muestra Toast: "8 platos movidos a Porciones y Combos"
        else Conteo de platos = 0 (Categoría vacía)
            BE->>DB: DELETE FROM categoria_producto WHERE id = :id AND local_id = :admin_local_id
            DB-->>BE: Eliminación confirmada
            BE-->>FE: 200 OK (apiresponse.Response con {mensaje: "Categoría eliminada"})
            FE->>A: Remueve la fila de la tabla sin pasos adicionales
        end
    end
```

---

## 3. Especificación de Pantallas y Wireframes Blueprint

### Vista 1: Directorio y Gestión de Categorías (`wf_admin_02_directorio_categorias.jpg`)

![Directorio y Gestión de Categorías](assets/wf_admin_02_directorio_categorias.jpg)

#### Layout Estructural ASCII (Desktop 1440x900)
```text
+----------------------------------------------------------------------------------------------------+
| RESTAURANTCLOUD AI   | Portal Administrador > Carta y Menú > Categorías        [ Sede: Miraflores] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
| Categorías de la Carta                                                                             |
| Organiza las secciones del menú, orden de visualización para mozos y disponibilidad                |
|----------------------------------------------------------------------------------------------------|
|                                                                                                    |
| +-------------------------+ +-------------------------+ +----------------------------------------+ |
| | CATEGORÍAS ACTIVAS      | | TOTAL PRODUCTOS EN CARTA| | ALERTAS DE CARTA                       | |
| | [ 6 ] secciones en menú | | [ 48 ] platos y bebidas | | [ 1 ] categoría vacía                  | |
| | Visibles en comanda     | | 45 disponibles, 3 agot. | | Postres de Temporada sin platos aún    | |
| +-------------------------+ +-------------------------+ +----------------------------------------+ |
|                                                                                                    |
| [ Todas (7) ] [ Activas (6) ] [ Ocultas (1) ]                                   [ + Nueva Categoría]
| +------------------------------------------------------------------------------------------------+ |
| | ORDEN   | NOMBRE DE CATEGORÍA      | PRODUCTOS VINCULADOS     | VISIBILIDAD      | ACCIONES    | |
| |---------+--------------------------+--------------------------+------------------+-------------| |
| | [≡  1 ] | Pollos a la Brasa        | [ 8 prod. disponibles  ] | [●] Visible      | [Edit][Elim]| |
| | [≡  2 ] | Porciones y Combos       | [ 12 prod. (1 agotado) ] | [●] Visible      | [Edit][Elim]| |
| | [≡  3 ] | Guarniciones y Papas     | [ 6 prod. disponibles  ] | [●] Visible      | [Edit][Elim]| |
| | [≡  4 ] | Ensaladas y Adicionales  | [ 5 prod. disponibles  ] | [●] Visible      | [Edit][Elim]| |
| | [≡  5 ] | Bebidas y Cremas         | [ 17 prod. disponibles ] | [●] Visible      | [Edit][Elim]| |
| | [≡  6 ] | Postres de Temporada     | [ 0 prod. (Vacía)      ] | [○] Oculta       | [Edit][Elim]| |
| |------------------------------------------------------------------------------------------------| |
| | [i] El orden configurado aquí determina la disposición de pestañas en comanda móvil de mozos.  | |
| |     Protección activa: Bloqueo de eliminación si la categoría contiene platos.                 | |
| +------------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

#### Reglas de Interacción de la Vista de Directorio
1. **Control de Ordenamiento Ergonómico (`≡`):**
   - El administrador puede alterar la posición de las categorías mediante arrastre táctil/mouse (`drag-and-drop`) o pulsando `Editar`.
   - El orden numérico se sincroniza en milisegundos con la vista del mozo (`CU-MOZO-01`).
2. **Conmutación Inmediata de Visibilidad (`Switch Visible / Oculta`):**
   - Un solo clic en el interruptor conmuta `activa = false`, ocultando todos los productos de esa sección en la carta digital y comanda sin borrarlos.
3. **Métricas de Aforo Gastronómico:**
   - La columna de productos especifica cuántos platos pertenecen a la sección y si existen mermas o ítems agotados temporalmente.

---

### Vista 2: Modal de Creación / Edición de Categoría (`wf_admin_02_crear_editar_modal.jpg`)

![Modal de Creación y Edición](assets/wf_admin_02_crear_editar_modal.jpg)

#### Layout Estructural ASCII
```text
+-------------------------------------------------------------------------------+
| EDITAR CATEGORÍA DE LA CARTA                                              [X] |
| Sede Miraflores | Configura el nombre y visibilidad en salón                  |
+-------------------------------------------------------------------------------+
| 1. Nombre de la Categoría                                                     |
| Identificador único visible en comandas, menú QR y comprobantes               |
| +---------------------------------------------------------------------------+ |
| | Pollos a la Brasa                                                         | |
| +---------------------------------------------------------------------------+ |
|                                                                               |
| 2. Posición de Orden en la Carta                                              |
| Define en qué pestaña se ubicará en la comanda del mozo                       |
| +-------+ +---------------------------------------------------+ +-------+     |
| |  - 1  | |            Posición 1  (Primera pestaña)          | |  + 1  |     |
| +-------+ +---------------------------------------------------+ +-------+     |
|                                                                               |
| 3. Visibilidad en Salón y Comanda Móvil                                       |
| +---------------------------------------------------------------------------+ |
| | [● Switch ON] Categoría activa y visible en comandas de mozos             | |
| |               Si se desactiva, los mozos no podrán solicitar platos de    | |
| |               esta sección temporalmente (ideal para turnos o temporadas).| |
| +---------------------------------------------------------------------------+ |
|                                                                               |
| VISTA PREVIA DE PESTAÑA EN LA COMANDA MÓVIL DEL MOZO:                         |
| +---------------------------------------------------------------------------+ |
| |  [ POLLOS A LA BRASA (8) ]   [ PORCIONES Y COMBOS (12) ]                  | |
| +---------------------------------------------------------------------------+ |
|-------------------------------------------------------------------------------|
|                                            [ Cancelar ]   [ Guardar Cambios ] |
+-------------------------------------------------------------------------------+
```

#### Reglas de Validación
1. **Unicidad de Nombre:** No permite crear dos categorías con el mismo nombre en la sede (validación case-insensitive `LOWER(nombre)`).
2. **Límite de Caracteres:** Máximo 60 caracteres para garantizar legibilidad en pantallas POS y tickets de comandas de cocina.
3. **Previsualización de Pestaña (WYSIWYG):** Muestra el botón interactivo tal como lo verá el personal en salón.

---

### Vista 3: Modal de Bloqueo de Seguridad y Reasignación (`wf_admin_02_bloqueo_eliminar_modal.jpg`)

![Bloqueo de Seguridad y Reasignación](assets/wf_admin_02_bloqueo_eliminar_modal.jpg)

#### Layout Estructural ASCII
```text
+-------------------------------------------------------------------------------+
| BLOQUEO DE SEGURIDAD: CATEGORÍA CON PLATOS ACTIVOS                        [X] |
| No se puede eliminar directamente para evitar dejar platos huérfanos sin carta|
+-------------------------------------------------------------------------------+
| [!] La categoría "Pollos a la Brasa" tiene 8 productos asociados.             |
|     Para eliminar esta categoría, primero debes reasignar sus productos a     |
|     otra sección de tu carta.                                                 |
|-------------------------------------------------------------------------------|
| Productos que pertenecen a esta categoría (8 en total):                       |
| +---------------------------------------------------------------------------+ |
| | [ 1/4 Pollo Brasa ]  [ 1/2 Pollo Brasa ]  [ 1 Pollo Entero ] [ Mostrito ] | |
| | [ Combo Familiar  ]  [ Alitas a la Brasa] [ Pechuga Broaster][ Combo Parr]| |
| +---------------------------------------------------------------------------+ |
|                                                                               |
| Acción recomendada para resolver el conflicto:                                |
| +---------------------------------------------------------------------------+ |
| | [●] Reasignar automáticamente estos 8 platos a otra categoría:            | |
| | +-----------------------------------------------------------------------+ | |
| | | Porciones y Combos (Categoría destino)                              v | | |
| | +-----------------------------------------------------------------------+ | |
| | Los 8 platos se moverán a 'Porciones y Combos' de inmediato y             | |
| | 'Pollos a la Brasa' se eliminará de forma segura.                         | |
| +---------------------------------------------------------------------------+ |
|-------------------------------------------------------------------------------|
|                             [ Cancelar ]   [ Reasignar 8 Platos y Eliminar ]  |
+-------------------------------------------------------------------------------+
```

#### Reglas del Bloqueo y Reasignación
1. **Contramedida de Integridad:** Se prohíbe que existan platos con `categoria_id = NULL` o apuntando a categorías borradas.
2. **Reasignación Atómica:** Al pulsar `[ Reasignar y Eliminar ]`, el backend envuelve en una sola transacción SQL el update masivo de productos y la eliminación de la categoría.

---

### Vista 4: Estado Inicial / Bienvenida para Local con Carta en Blanco (`wf_admin_02_onboarding_vacio.jpg`)

![Estado Inicial de Bienvenida](assets/wf_admin_02_onboarding_vacio.jpg)

#### Layout Estructural ASCII
```text
+-------------------------------------------------------------------------------+
| RESTAURANTCLOUD AI | Portal Administrador > Carta y Menú > Categorías         |
+-------------------------------------------------------------------------------+
|                                                                               |
|                                   ( CARTA )                                   |
|                                                                               |
|                       Tu Sede Inició con Carta en Blanco                      |
|       Esta sede fue registrada sin plantilla previa. Comienza agregando la    |
|       primera sección de tu menú:                                             |
|                                                                               |
|               +-----------------------------------------------+               |
|               | [ CONFIGURACIÓN PERSONALIZADA ]               |               |
|               | Crear Tu Primera Categoría de Carta           |               |
|               | Define el nombre de tu sección (ej. Entradas),|               |
|               | orden en comanda y visibilidad en salón.      |               |
|               | Ideal para cartas de autor y formatos fusión. |               |
|               |                                               |               |
|               |         [ + Crear Mi Primera Categoría ]      |               |
|               +-----------------------------------------------+               |
|                                                                               |
|   💡 Tip: En el siguiente módulo podrás asignar platos, recetas e insumos.    |
+-------------------------------------------------------------------------------+
```

---

## 4. Catálogo de Estados UX

| Estado | Evento Desencadenante | Respuesta Visual del Sistema |
| :--- | :--- | :--- |
| **Inicial / Onboarding** | Acceso a local nuevo creado en blanco sin categorías (`COUNT = 0`). | Renderiza `wf_admin_02_onboarding_vacio.jpg` orientando a crear la primera sección de carta manual. |
| **Carga / Skeleton** | Petición de listado `GET /api/v1/admin/categorias`. | 6 filas con efecto shimmer en nombre y contadores. |
| **Éxito (Categorías Activas)** | Respuesta `200 OK` del backend. | Renderiza `wf_admin_02_directorio_categorias.jpg` con orden correlativo y switches activos. |
| **Pausa / Oculta** | Administrador apaga switch de visibilidad. | Conmuta switch a gris, texto *"Oculta temporalmente"* y actualiza en tiempo real sin recargar página. |
| **Bloqueo de Seguridad** | Intento de eliminación de categoría con platos (`409 Conflict`). | Despliega modal `wf_admin_02_bloqueo_eliminar_modal.jpg` con lista de platos y selector de reasignación. |
| **Reordenamiento Exitoso** | Administrador suelta fila en nueva posición. | Toast verde sutil: *"Orden de categorías actualizado en comandas"*. |

---

## 5. Catálogo de Errores Operativos

| Código de Error | HTTP Status | Causa Operativa | Feedback Visual al Usuario |
| :--- | :---: | :--- | :--- |
| `ERR_CATEGORIA_CON_PRODUCTOS` | `409 Conflict` | Se intenta eliminar una categoría que tiene 1 o más platos asociados. | Modal de seguridad con chips de platos afectados y selector de reasignación asistida. |
| `ERR_CATEGORIA_DUPLICADA` | `409 Conflict` | Ya existe una categoría con ese mismo nombre en la sede (`LOWER(nombre)`). | Mensaje rojo bajo el input: *"Ya existe una categoría con este nombre en tu local."* |
| `ERR_CATEGORIA_NO_ENCONTRADA` | `404 Not Found` | Categoría inexistente o de otra sede/tenant. | Toast rojo: *"La categoría solicitada no existe o no pertenece a tu local."* |
| `ERR_PLANTILLA_NO_VALIDA` | `400 Bad Request` | Se envió un código de plantilla no registrado. | Toast de error: *"Plantilla culinaria no reconocida."* |
| `ERR_CATEGORIA_DESTINO_INVALIDA` | `422 Unprocessable` | Se intentó reasignar platos a la misma categoría que se está eliminando. | Alerta: *"Debes seleccionar una categoría de destino distinta a la que vas a eliminar."* |

---

## 6. Contratos de API Go (`pkg/apiresponse`)

### 6.1. Listar Categorías del Local
- **Endpoint:** `GET /api/v1/admin/categorias`
- **Headers:** `Authorization: Bearer <token_jwt>`

#### Respuesta Exitosa (`200 OK`)
```json
{
  "success": true,
  "data": {
    "categorias": [
      {
        "id": "c1a2b3c4-0001-4000-8000-000000000001",
        "nombre": "Pollos a la Brasa",
        "orden": 1,
        "activa": true,
        "total_productos": 8,
        "productos_disponibles": 8,
        "productos_agotados": 0,
        "created_at": "2026-10-02T10:00:00Z",
        "updated_at": "2026-10-02T10:00:00Z"
      },
      {
        "id": "c1a2b3c4-0002-4000-8000-000000000002",
        "nombre": "Porciones y Combos",
        "orden": 2,
        "activa": true,
        "total_productos": 12,
        "productos_disponibles": 11,
        "productos_agotados": 1,
        "created_at": "2026-10-02T10:00:00Z",
        "updated_at": "2026-10-02T10:00:00Z"
      },
      {
        "id": "c1a2b3c4-0006-4000-8000-000000000006",
        "nombre": "Postres de Temporada",
        "orden": 6,
        "activa": false,
        "total_productos": 0,
        "productos_disponibles": 0,
        "productos_agotados": 0,
        "created_at": "2026-10-02T10:00:00Z",
        "updated_at": "2026-10-02T10:00:00Z"
      }
    ],
    "resumen": {
      "total_categorias": 7,
      "activas": 6,
      "ocultas": 1,
      "total_productos": 48
    }
  },
  "message": "Categorías de la carta obtenidas exitosamente",
  "meta": {
    "timestamp": "2026-10-05T07:30:00Z"
  }
}
```

---

### 6.2. Crear Categoría Individual
- **Endpoint:** `POST /api/v1/admin/categorias`
- **Headers:** `Authorization: Bearer <token_jwt>`, `Content-Type: application/json`

#### Request Payload
```json
{
  "nombre": "Pastas Artesanales",
  "orden": 7,
  "activa": true
}
```

#### Respuesta Exitosa (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "c1a2b3c4-0007-4000-8000-000000000007",
    "local_id": "l1a2b3c4-0001-4000-8000-000000000001",
    "nombre": "Pastas Artesanales",
    "orden": 7,
    "activa": true,
    "created_at": "2026-10-05T07:31:00Z"
  },
  "message": "Categoría creada exitosamente",
  "meta": {
    "timestamp": "2026-10-05T07:31:00Z"
  }
}
```

---

### 6.3. Cargar Plantilla Gastronómica (1 Clic)
- **Endpoint:** `POST /api/v1/admin/categorias/plantilla`
- **Headers:** `Authorization: Bearer <token_jwt>`, `Content-Type: application/json`

#### Request Payload
```json
{
  "tipo_plantilla": "polleria"
}
```
*Valores admitidos para `tipo_plantilla`: `"polleria"`, `"chifa"`, `"criollo"`, `"cevicheria"`, `"cafeteria"`.*

#### Respuesta Exitosa (`201 Created`)
```json
{
  "success": true,
  "data": {
    "plantilla_aplicada": "polleria",
    "categorias_creadas": [
      { "nombre": "Pollos a la Brasa", "orden": 1 },
      { "nombre": "Porciones y Combos", "orden": 2 },
      { "nombre": "Guarniciones y Papas", "orden": 3 },
      { "nombre": "Ensaladas", "orden": 4 },
      { "nombre": "Bebidas y Cremas", "orden": 5 }
    ],
    "total_creadas": 5
  },
  "message": "Plantilla gastronómica de Pollería & Brasas aplicada exitosamente",
  "meta": {
    "timestamp": "2026-10-05T07:32:00Z"
  }
}
```

---

### 6.4. Reordenar Categorías en Lote
- **Endpoint:** `PATCH /api/v1/admin/categorias/reordenar`
- **Headers:** `Authorization: Bearer <token_jwt>`, `Content-Type: application/json`

#### Request Payload
```json
{
  "items": [
    { "id": "c1a2b3c4-0002-4000-8000-000000000002", "orden": 1 },
    { "id": "c1a2b3c4-0001-4000-8000-000000000001", "orden": 2 },
    { "id": "c1a2b3c4-0003-4000-8000-000000000003", "orden": 3 }
  ]
}
```

#### Respuesta Exitosa (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items_actualizados": 3
  },
  "message": "Orden de categorías actualizado exitosamente",
  "meta": {
    "timestamp": "2026-10-05T07:33:00Z"
  }
}
```

---

### 6.5. Intentar Eliminar Categoría (Verificación de Seguridad)
- **Endpoint:** `DELETE /api/v1/admin/categorias/{id}`
- **Headers:** `Authorization: Bearer <token_jwt>`

#### Respuesta de Error por Bloqueo de Seguridad (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "ERR_CATEGORIA_CON_PRODUCTOS",
    "message": "No se puede eliminar la categoría porque contiene productos activos",
    "details": [
      {
        "categoria_id": "c1a2b3c4-0001-4000-8000-000000000001",
        "categoria_nombre": "Pollos a la Brasa",
        "total_productos": 8,
        "productos_afectados": [
          "1/4 Pollo a la Brasa",
          "1/2 Pollo a la Brasa",
          "1 Pollo Entero",
          "Mostrito Clásico",
          "Combo Familiar Brasa",
          "Alitas a la Brasa",
          "Pechuga Broaster",
          "Combo Parrillero"
        ]
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-05T07:34:00Z"
  }
}
```

---

### 6.6. Reasignar Productos y Eliminar Categoría en Transacción Atómica
- **Endpoint:** `POST /api/v1/admin/categorias/{id}/reasignar-y-eliminar`
- **Headers:** `Authorization: Bearer <token_jwt>`, `Content-Type: application/json`

#### Request Payload
```json
{
  "nueva_categoria_id": "c1a2b3c4-0002-4000-8000-000000000002"
}
```

#### Respuesta Exitosa (`200 OK`)
```json
{
  "success": true,
  "data": {
    "categoria_eliminada_id": "c1a2b3c4-0001-4000-8000-000000000001",
    "categoria_eliminada_nombre": "Pollos a la Brasa",
    "categoria_destino_id": "c1a2b3c4-0002-4000-8000-000000000002",
    "categoria_destino_nombre": "Porciones y Combos",
    "productos_reasignados": 8
  },
  "message": "8 productos reasignados a 'Porciones y Combos' y categoría eliminada exitosamente",
  "meta": {
    "timestamp": "2026-10-05T07:35:00Z"
  }
}
```
