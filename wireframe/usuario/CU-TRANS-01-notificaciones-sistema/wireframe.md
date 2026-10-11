# Especificación Técnica y Wireframes: CU-TRANS-01: Recibir Notificaciones del Sistema

## 1. Ficha Técnica del Caso de Uso

| Atributo | Detalle |
| :--- | :--- |
| **Código** | `CU-TRANS-01` |
| **Nombre** | **Recibir notificaciones del sistema** (Centro Transversal de Alertas Operativas, Lectura In-Situ y Entrega en Tiempo Real) |
| **Rol / Actor** | **Mozo**, **Cocina**, **Cajero**, **Administrador del Local**, **Propietario** (Transversal a todos los actores autenticados) |
| **Módulo** | Transversal / Sistema & Operaciones en Vivo (`internal/domain/notificacion`) |
| **Objetivo de Negocio** | Proveer a todo el personal del restaurante y gerencia un mecanismo ágil, unificado y no disruptivo para recibir alertas operativas críticas (anulaciones de pedidos, platos agotados, pases calientes listos, mesas por bloquearse, quiebres de insumos, discrepancias de arqueo Z y avisos de suscripción). El diseño garantiza la **máxima continuidad operativa sin navegación forzada**: la lectura y gestión se realiza 100% in-situ en el panel lateral de la campana sin redirigir al usuario fuera de su pantalla activa (protegiendo comandas en curso en salón, pedidos al fuego en KDS o cobros en caja). |
| **Precondiciones** | El usuario cuenta con una sesión activa autenticada con un rol asignado a una empresa y sede específica. Ocurre un evento operativo o administrativo relevante para su perfil funcional. |
| **Postcondiciones** | La notificación es entregada al navegador vía Server-Sent Events (SSE) o polling de respaldo; se incrementa el contador de la campana `[ 🔔 ]`; al interactuar, la notificación se marca como `leida = true` en PostgreSQL con RLS y el contador decrementa en tiempo real. |
| **Tokens de Diseño** | Grayscale Blueprint: `#0F172A` (Primario / Slate Dark), `#1E293B` (Superficie Header), `#F8FAFC` (Canvas), `#FFFFFF` (Superficie Panel), `#E2E8F0` (Bordes), `#CBD5E1` (Borde activo), `#0F172A` (Texto Principal), `#64748B` (Texto Muted), `#94A3B8` (Bordes sutiles), `#334155` (Badges). |
| **Resolución Canónica** | `1440x900` px (Desktop Blueprint, JPG calidad 95). |

---

### Reglas de Negocio y Principios de Diseño

1. **Cero Redirecciones (Sin Deep Linking / No Navigation Loss):**
   - Las notificaciones son **completamente informativas y autocontenidas**. Cada mensaje describe en su totalidad el contexto del evento (ej. *"Mesa 04: 1x Lomo Saltado anulado por el mozo antes de cocción. Comanda #PED-0428 actualizada"*).
   - Ninguna acción dentro del panel de notificaciones redirige a otra URL o vista. Esto es una salvaguarda esencial para el personal en salón y cocina: evita que un mozo pierda su borrador de comanda o que un cocinero pierda la vista del KDS al revisar un aviso.

2. **Lectura y Gestión In-Situ en el Mismo Panel:**
   - Al pulsar la campana global `[ 🔔 (3) ]`, se despliega un panel lateral sobrepuesto (*Flyout Drawer*) de ancho 440px que no altera el estado de la pantalla inferior.
   - Al hacer clic en una tarjeta de notificación no leída o en el botón `"Marcar leída"`, el sistema envía `PATCH /api/v1/notificaciones/{id}/leer`, apaga el punto azul indicador y actualiza el contador de pendientes de inmediato.
   - Al pulsar `"✓ Marcar todas leídas"`, el sistema conmuta masivamente todas las notificaciones del usuario a `leida = true` mediante `POST /api/v1/notificaciones/marcar-todas-leidas`.
   - Las notificaciones extensas cuentan con un botón desplegable `"Ver detalle"` que expande la información en un bloque acordeón dentro del mismo panel, con botón para contraer.

3. **Arquitectura de Transporte Híbrida y Resiliente (SSE + Polling Fallback):**
   - **Canal Primario:** Conexión persistente unidireccional vía **Server-Sent Events (SSE)** al endpoint `GET /api/v1/notificaciones/stream`. Permite latencias de notificación $< 30\text{ ms}$ con consumo de memoria despreciable en el backend Go.
   - **Canal de Respaldo:** Endpoint ultra-ligero `GET /api/v1/notificaciones/resumen` que retorna únicamente `{ "total_no_leidas": 3, "criticas_no_leidas": 1 }`. Se consulta en la carga inicial de la aplicación y periódicamente cada 30 segundos como mecanismo de recuperación si el stream SSE se interrumpe por microcortes de WiFi.

4. **Alertas Flotantes (Toasts Reactivos en Pantalla Viva):**
   - Ante eventos clasificados como `prioridad = 'critica'` (ej. anulación de un plato en preparación en cocina `CU-COCINA-05`, o plato marcado como agotado en pleno servicio `CU-COCINA-04`), el frontend despliega un banner emergente flotante (*Toast*) en la esquina superior derecha.
   - El Toast incluye el aviso en texto destacado, un temporizador de desvanecimiento visual (6 segundos) y un botón de cierre rápido `[ Entendido / Cerrar ]`.
   - El Toast es meramente informativo y flotante: no bloquea los botones del salón ni captura el cursor.

5. **Segmentación y Destinatarios (Aislamiento RLS en PostgreSQL):**
   - **Destinatario Directo:** Notificación asignada a un usuario específico (`usuario_id = '...'`), por ejemplo, aviso al mozo asignado a la mesa cuando su comanda tiene un cambio.
   - **Destinatario Colectivo por Rol:** Notificación asignada a una sede y rol específico (`local_id = '...'` y `rol_destinatario = 'cocina'`), visible para todos los operarios conectados con ese rol en ese local sin duplicar registros.
   - **Aislamiento Multi-Tenant:** Todas las consultas aplican obligatoriamente la política RLS `p_notificacion_tenant` validando `empresa_id = current_setting('app.current_empresa_id')::uuid`.

---

## 2. Diagrama de Flujo y Secuencia Mermaid

```mermaid
sequenceDiagram
    autonumber
    actor OP as 🧑‍🍳 / 🏃 Mozo, Cocina, Cajero o Admin
    participant UI as 💻 Frontend Web (Header & Panel)
    participant SSE as ⚡ Stream SSE (/stream)
    participant API as 🚀 Core API Go (Endpoints REST)
    participant REDIS as 🔴 Redis 7 (Pub/Sub)
    participant BD as 🗄️ PostgreSQL 16 (RLS)

    %% FASE 1: EVENTO DE NEGOCIO Y DIFUSIÓN EN VIVO
    Note over OP, BD: Fase 1: Ocurrencia de Evento Operativo y Broadcast Reactivo
    critical Evento en Salón / Cocina
        API->>BD: INSERT INTO notificacion (empresa_id, local_id, tipo, prioridad, titulo, mensaje, ...)
        BD-->>API: Notificación persistida (ID UUID v8)
        API->>REDIS: PUBLISH notificaciones:<empresa_id>:<local_id> {payload_json}
    end

    REDIS-->>SSE: Mensaje recibido por suscriptor de canal Go
    SSE-->>UI: Evento SSE "notificacion_nueva" (Latencia < 30ms)
    
    rect rgb(240, 249, 255)
        Note over UI: Actualización de UI sin recargar la pantalla
        UI->>UI: Incrementa badge campana [ 🔔 (3) -> (4) ]
        alt Prioridad Crítica
            UI->>UI: Muestra Toast flotante reactivo en esquina superior derecha
            OP->>UI: Lee aviso visual y pulsa [ Entendido / Cerrar ]
        end
    end

    %% FASE 2: APERTURA DEL PANEL DE NOTIFICACIONES
    Note over OP, BD: Fase 2: Apertura del Panel y Lectura In-Situ
    OP->>UI: Clic en campana [ 🔔 (4) ] (o atajo de teclado Alt+N)
    UI->>UI: Despliega Flyout Drawer lateral derecho (440px sobrepuesto)
    UI->>API: GET /api/v1/notificaciones?leida=false&limite=20
    API->>BD: SELECT * FROM notificacion WHERE empresa_id = $1 AND (usuario_id = $2 OR ...) ORDER BY created_at DESC
    BD-->>API: 4 registros de notificaciones
    API-->>UI: 200 OK (apiresponse.Ok([]NotificacionItemDTO))
    UI-->>OP: Renderiza lista de tarjetas (Vista 1: wf_trans_01_flyout_notificaciones.jpg)

    %% FASE 3: DETALLE EXPANDIDO Y MARCADO COMO LEÍDA
    Note over OP, BD: Fase 3: Detalle Expandido y Marcado de Lectura
    OP->>UI: Clic en tarjeta o botón "Ver detalle"
    UI->>UI: Expande acordeón con detalle completo in-situ (Vista 2: wf_trans_01_detalle_expandido.jpg)
    UI->>API: PATCH /api/v1/notificaciones/{id}/leer
    API->>BD: UPDATE notificacion SET leida = true, fecha_leida = NOW() WHERE id = $1
    BD-->>API: Actualización confirmada
    API-->>UI: 200 OK (apiresponse.Ok({id, leida: true}))
    UI->>UI: Apaga dot azul indicador y decrementa contador [ 🔔 (3) ]

    %% FASE 4: MARCADO MASIVO Y CIERRE
    opt Marcado Masivo "Marcar todas leídas"
        OP->>UI: Clic en botón superior [ ✓ Marcar todas leídas ]
        UI->>API: POST /api/v1/notificaciones/marcar-todas-leidas
        API->>BD: UPDATE notificacion SET leida = true, fecha_leida = NOW() WHERE leida = false
        BD-->>API: 3 filas actualizadas
        API-->>UI: 200 OK (apiresponse.Ok({afectadas: 3}))
        UI->>UI: Muestra estado vacío positivo (Vista 4: wf_trans_01_estado_vacio.jpg)
    end

    OP->>UI: Presiona tecla [Esc] o hace clic fuera del panel
    UI->>UI: Cierra panel drawer; la pantalla operativa queda intacta
```

---

## 3. Especificación de Pantallas y Wireframes Blueprint (4 Vistas Estándar)

### Vista 1: Panel Lateral de Notificaciones (*Flyout Drawer*) en Contexto Operativo
- **Archivo Asset:** [`assets/wf_trans_01_flyout_notificaciones.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-TRANS-01-notificaciones-sistema/assets/wf_trans_01_flyout_notificaciones.jpg)
- **Propósito:** Mostrar la apertura del panel de notificaciones directamente sobre la pantalla de trabajo del usuario (ej. plano de salón del Mozo), visualizando los avisos pendientes ordenados cronológicamente sin salir del contexto operativo.

```text
+-------------------------------------------------------------------------------------------------------------------+
| RESTAURANTCLOUD AI   [ MOZO / SALÓN ]   📍 Sede Miraflores (Piso 1)          [ 🔔 Notificaciones (3) ]*  [ Carlos M. ]|
+-------------------------------------------------------------------------------------------------------------------+
|  Plano de Salón — Mesas Asignadas (Monitor en vivo)                 Libres: 6 | Ocupadas: 4 | Cuenta: 1 | Res: 1  |
| +-------------+ +-------------+ +-------------+ +-------------+  +----------------------------------------------+ |
| | Mesa 01     | | Mesa 02     | | Mesa 03     | | Mesa 04     |  | Notificaciones           [3 no leídas]       | |
| | [ LIBRE ]   | | [ RESERVA ] | | [ EN CURSO ]| | [ EN PREP ] |  | [ ✓ Marcar todas leídas ]              [ ✕ ] | |
| | 4 personas  | | 13:30h      | | 3 ítems     | | 1 anulado   |  +----------------------------------------------+ |
| +-------------+ +-------------+ +-------------+ +-------------+  | [ No leídas (3) ]*           [ Todas (12) ]  | |
| +-------------+ +-------------+ +-------------+ +-------------+  +----------------------------------------------+ |
| | Mesa 05     | | Mesa 06     | | Mesa 07     | | Mesa 08     |  | 🔵 [ 🚨 CRÍTICA ] [ Salón ]       Hace 2 min | |
| | [ LIBRE ]   | | [ PRECUENTA]| | [ LIBRE ]   | | [ LIBRE ]   |  | Pedido Mesa 04 Anulado                       | |
| | 2 personas  | | S/ 148.50   | | 6 personas  | | 4 personas  |  | El cliente solicitó cancelar '1x Lomo        | |
| +-------------+ +-------------+ +-------------+ +-------------+  | Saltado' antes de cocción. Comanda #PED-0428 | |
|                                                                  | actualizada. KDS notificado.                 | |
|                                                                  | [ 🔵 No leída ]             [ Marcar leída ] | |
|                                                                  | +------------------------------------------+ |
|                                                                  | 🔵 [ 🍳 COCINA ]                  Hace 8 min | |
|                                                                  | Plato Agotado: Ceviche Clásico               | |
|                                                                  | Cocina declaró quiebre de stock por insumo   | |
|                                                                  | 'Pescado Blanco'. No ofrecer en carta.       | |
|                                                                  | [ 🔵 No leída ]             [ Marcar leída ] | |
|                                                                  | +------------------------------------------+ |
|                                                                  | 🔵 [ 📅 RESERVA ]                Hace 18 min | |
|                                                                  | Mesa 02 próxima a bloquearse                 | |
|                                                                  | Reserva #RES-890 Familia Gómez a las 13:30h. | |
|                                                                  | [ 🔵 No leída ]             [ Marcar leída ] | |
|                                                                  +----------------------------------------------+ |
|                                                                  | Presiona [Esc] para cerrar • Actualización SSE|
+-------------------------------------------------------------------------------------------------------------------+
```

#### Elementos e Interacciones de Vista 1:
| Componente | Tipo | Acción / Comportamiento |
| :--- | :--- | :--- |
| **Botón Campana Cabecera** | Botón con Badge | Alterna la apertura o cierre del panel drawer lateral. Muestra contador de no leídas en vivo. |
| **Pestañas de Filtro** | Tabs | Filtra entre `No leídas (3)` y `Todas (12)` sin realizar recargas completas. |
| **Botón `"✓ Marcar todas leídas"`** | Botón Secundario | Invoca `POST /api/v1/notificaciones/marcar-todas-leidas`, apaga todos los dots y actualiza el contador a 0. |
| **Tarjeta de Notificación** | Card interactiva | Presenta icono de categoría, severidad, título, mensaje descriptivo y hora relativa. |
| **Botón `"Marcar leída"`** | Enlace de acción | Invoca `PATCH /api/v1/notificaciones/:id/leer` para esa notificación específica. |
| **Botón Cerrar `[ ✕ ]`** | Botón icono | Cierra el drawer y restaura el foco a la pantalla de trabajo. |

---

### Vista 2: Detalle Expandido en Panel (*Inline Detail Accordion*)
- **Archivo Asset:** [`assets/wf_trans_01_detalle_expandido.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-TRANS-01-notificaciones-sistema/assets/wf_trans_01_detalle_expandido.jpg)
- **Propósito:** Permitir al usuario inspeccionar los metadatos completos y la explicación detallada de un evento sin abandonar su pantalla ni navegar hacia otra ruta del sistema.

```text
+-------------------------------------------------------------------------------------------------------------------+
| RESTAURANTCLOUD AI   [ MOZO / SALÓN ]   📍 Sede Miraflores (Piso 1)          [ 🔔 Notificaciones (2) ]*  [ Carlos M. ]|
+-------------------------------------------------------------------------------------------------------------------+
|  Plano de Salón — Mesas Asignadas (Monitor en vivo)                 Libres: 6 | Ocupadas: 4 | Cuenta: 1 | Res: 1  |
|                                                                  +----------------------------------------------+ |
|                                                                  | Notificaciones           [2 no leídas]       | |
|                                                                  | [ ✓ Marcar todas leídas ]              [ ✕ ] | |
|                                                                  +----------------------------------------------+ |
|                                                                  | [ Todas (12) ]*            [ No leídas (2) ] | |
|                                                                  +----------------------------------------------+ |
|                                                                  | +------------------------------------------+ | |
|                                                                  | | [ 🚨 CRÍTICA ] [ Salón ]       Hace 3 min| | |
|                                                                  | | Pedido Mesa 04 Anulado                   | | |
|                                                                  | | El comensal solicitó retirar '1x Lomo    | | |
|                                                                  | | Saltado' por cambio de preferencia.      | | |
|                                                                  | | +--------------------------------------+ | | |
|                                                                  | | | Comanda Afectada:   #PED-0428        | | | |
|                                                                  | | | Mesa / Ubicación:   Mesa 04 (Salón)  | | | |
|                                                                  | | | Ítem Cancelado:     1x Lomo Saltado  | | | |
|                                                                  | | | Importe Restado:    S/ 42.00         | | | |
|                                                                  | | | Motivo Registrado:  Cambio de cliente| | | |
|                                                                  | | | Impacto en Cocina:  Detenido en KDS  | | | |
|                                                                  | | | Hora Exacta:        12:15:08         | | | |
|                                                                  | | | [ ▲ Contraer detalle ]               | | | |
|                                                                  | | +--------------------------------------+ | | |
|                                                                  | | ✓ Marcada como leída   Info en pantalla| | |
|                                                                  | +------------------------------------------+ | |
|                                                                  | 🔵 [ 🍳 COCINA ]                  Hace 9 min | |
|                                                                  | Plato Agotado: Ceviche Clásico               | |
|                                                                  | [ 🔵 No leída ]             [ Marcar leída ] | |
|                                                                  +----------------------------------------------+ |
|                                                                  | Lectura in-situ • No interrumpe tu comanda activa|
+-------------------------------------------------------------------------------------------------------------------+
```

#### Elementos e Interacciones de Vista 2:
| Componente | Tipo | Acción / Comportamiento |
| :--- | :--- | :--- |
| **Bloque Acordeón Expandido** | Contenedor embebido | Muestra comanda afectada, mesa, ítem cancelado, impacto en cocina y marca de tiempo exacta sin salir del panel. |
| **Botón `"▲ Contraer detalle"`** | Botón de acción | Repliega el bloque de información extendida devolviendo la tarjeta a su estado compacto. |
| **Indicador de Lectura Automática** | Estado visual | Al desplegar el detalle, la tarjeta se marca automáticamente como leída en base de datos. |

---

### Vista 3: Toast Flotante Reactivo en Pantalla Operativa Viva
- **Archivo Asset:** [`assets/wf_trans_01_toast_aviso_pantalla.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-TRANS-01-notificaciones-sistema/assets/wf_trans_01_toast_aviso_pantalla.jpg)
- **Propósito:** Demostrar cómo una alerta crítica en tiempo real (SSE) aparece sobre la interfaz de trabajo sin robar el foco del teclado, sin bloquear botones del salón ni exigir clics forzosos.

```text
+-------------------------------------------------------------------------------------------------------------------+
| RESTAURANTCLOUD AI   [ MOZO / SALÓN ]   📍 Sede Miraflores (Piso 1)          [ 🔔 Notificaciones (3) ]   [ Carlos M. ]|
+-------------------------------------------------------------------------------------------------------------------+
|  Plano de Salón — Mesas Asignadas (Monitor en vivo)                 Libres: 6 | Ocupadas: 4 | Cuenta: 1 | Res: 1  |
|                                                                                                                   |
| +-------------+ +-------------+ +-------------+ +-------------+  +----------------------------------------------+ |
| | Mesa 01     | | Mesa 02     | | Mesa 03     | | Mesa 04     |  | 🚨 ALERTA CRÍTICA EN VIVO • SSE  Ahora mismo | |
| | [ LIBRE ]   | | [ RESERVA ] | | [ EN CURSO ]| | [ EN PREP ] |  | ¡Atención! Pedido Mesa 04 Anulado           | |
| | 4 personas  | | 13:30h      | | 3 ítems     | | 1 anulado   |  | El mozo Carlos anuló 1x Lomo Saltado de la   | |
| +-------------+ +-------------+ +-------------+ +-------------+  | comanda #PED-0428 por cambio del cliente. Si | |
| +-------------+ +-------------+ +-------------+ +-------------+  | no está en fuego, detener preparación.       | |
| | Mesa 05     | | Mesa 06     | | Mesa 07     | | Mesa 08     |  | [===========.......] [ Entendido / Cerrar ]  | |
| | [ LIBRE ]   | | [ PRECUENTA]| | [ LIBRE ]   | | [ LIBRE ]   |  +----------------------------------------------+ |
| | 2 personas  | | S/ 148.50   | | 6 personas  | | 4 personas  |                                                   |
| +-------------+ +-------------+ +-------------+ +-------------+                                                   |
+-------------------------------------------------------------------------------------------------------------------+
```

#### Elementos e Interacciones de Vista 3:
| Componente | Tipo | Acción / Comportamiento |
| :--- | :--- | :--- |
| **Toast Flotante** | Banner flotante superior | Presenta borde de alto contraste, encabezado de severidad crítica, título y cuerpo con instrucciones concretas. |
| **Barra de Temporizador** | Barra de progreso visual | Indica el tiempo restante antes de que el Toast se desvanezca automáticamente (6 segundos). |
| **Botón `"Entendido / Cerrar"`** | Botón de cierre | Descarta el Toast de forma inmediata sin alterar la pantalla operativa de fondo. |

---

### Vista 4: Estado Vacío Positivo del Panel (*"¡Estás al día!"*)
- **Archivo Asset:** [`assets/wf_trans_01_estado_vacio.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-TRANS-01-notificaciones-sistema/assets/wf_trans_01_estado_vacio.jpg)
- **Propósito:** Presentar un estado visual limpio, tranquilizador y accesible cuando el usuario no tiene notificaciones pendientes o ha marcado todas como leídas.

```text
+-------------------------------------------------------------------------------------------------------------------+
| RESTAURANTCLOUD AI   [ MOZO / SALÓN ]   📍 Sede Miraflores (Piso 1)          [ 🔔 Notificaciones ]       [ Carlos M. ]|
+-------------------------------------------------------------------------------------------------------------------+
|  Plano de Salón — Mesas Asignadas (Monitor en vivo)                 Libres: 6 | Ocupadas: 4 | Cuenta: 1 | Res: 1  |
|                                                                  +----------------------------------------------+ |
|                                                                  | Notificaciones           [0 no leídas]       | |
|                                                                  |                                        [ ✕ ] | |
|                                                                  +----------------------------------------------+ |
|                                                                  | [ No leídas (0) ]*          [ Historial (12) ]| |
|                                                                  +----------------------------------------------+ |
|                                                                  |                                              | |
|                                                                  |                     ( ✓ )                    | |
|                                                                  |                 ¡Estás al día!               | |
|                                                                  |                                              | |
|                                                                  |    No tienes notificaciones pendientes en    | |
|                                                                  |    este momento. Te avisaremos de inmediato  | |
|                                                                  |    si ocurre alguna anulación, aviso de      | |
|                                                                  |    cocina o cambio en salón.                 | |
|                                                                  |                                              | |
|                                                                  |      [ Ver historial de 12 leídas ]          | |
|                                                                  |                                              | |
|                                                                  +----------------------------------------------+ |
|                                                                  | Canal SSE activo • Actualización automática  |
+-------------------------------------------------------------------------------------------------------------------+
```

---

## 4. Matriz de Control de Acceso (RBAC)

El subsistema de notificaciones es transversal, pero el tipo de eventos que recibe cada usuario está estrictamente segmentado según su rol operativo:

| Tipo de Notificación / Evento | Mozo | Cocina | Cajero | Admin Local | Propietario | Regla de Dispersión / Destinatario |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`pedido_anulado`** | ✅ | ✅ | ℹ️ | ✅ | ℹ️ | Notifica a Cocina (`CU-COCINA-05`), al Mozo de la mesa y al Admin (`CU-ADMIN-12`). |
| **`plato_agotado`** | ✅ | — | ℹ️ | ✅ | — | Cocina declara quiebre (`CU-COCINA-04`); notifica a todos los Mozos del local (`CU-MOZO-07`). |
| **`plato_listo`** | ✅ | — | — | — | — | Cocina completa pase caliente (`CU-COCINA-02`); notifica directamente al Mozo asignado a la mesa. |
| **`reserva_proxima`** | ✅ | — | — | ✅ | — | Sistema evalúa 30m previos al bloqueo de mesa (`CU-MOZO-05`); notifica a Mozos y Admin. |
| **`cuenta_solicitada`** | — | — | ✅ | — | — | Mozo solicita precuenta o subdivisión (`CU-MOZO-08`, `CU-MOZO-09`); notifica al Cajero del POS. |
| **`stock_critico`** | — | ✅ | — | ✅ | ℹ️ | Insumo culinario llega a stock mínimo (`CU-ADMIN-03`); notifica a Cocina y Administrador. |
| **`incidente_nuevo`** | — | — | — | ✅ | ✅ | Administrador registra incidente operativo (`CU-ADMIN-11`); notifica al Propietario (`CU-PROP-06`). |
| **`arqueo_discrepancia`** | — | — | — | ✅ | ✅ | Cierre Z con diferencia de efectivo (`CU-CAJA-05`); notifica a Administrador y Propietario (`CU-ADMIN-14`). |
| **`suscripcion_gracia`** | — | — | — | — | ✅ | Cobro fallido de Stripe en Dunning de 5 días (`CU-PROP-02`, `CU-SAAS-01`); notifica al Propietario. |

---

## 5. Contratos de API Go y DTOs (`internal/domain/notificacion/dto.go`)

Todos los payloads de entrada y salida respetan la arquitectura canónica tipada en Go y el envoltorio estándar `pkg/apiresponse.Response{Exito, Datos, Errores, Meta}`:

```go
package notificacion

import "time"

// NotificacionItemDTO representa una notificación formateada para el panel
type NotificacionItemDTO struct {
    ID          string    `json:"id"`
    Tipo        string    `json:"tipo"`        // 'pedido_anulado', 'plato_agotado', etc.
    Prioridad   string    `json:"prioridad"`   // 'baja', 'media', 'alta', 'critica'
    Titulo      string    `json:"titulo"`
    Mensaje     string    `json:"mensaje"`
    EntidadTipo *string   `json:"entidad_tipo,omitempty"` // 'pedido', 'mesa', 'insumo', etc.
    EntidadID   *string   `json:"entidad_id,omitempty"`
    Leida       bool      `json:"leida"`
    FechaLeida  *string   `json:"fecha_leida,omitempty"`
    CreatedAt   string    `json:"created_at"`
    TiempoAgo   string    `json:"tiempo_ago"`  // Calculado: "hace 2 min", "hace 18 min"
}

// ResumenNotificacionesDTO respuesta ultra-ligera para polling y badge
type ResumenNotificacionesDTO struct {
    TotalNoLeidas    int    `json:"total_no_leidas"`
    CriticasNoLeidas int    `json:"criticas_no_leidas"`
    UltimoEventoAt   string `json:"ultimo_evento_at"`
}

// MarcarLeidaResponseDTO resultado al conmutar una notificación a leída
type MarcarLeidaResponseDTO struct {
    ID    string `json:"id"`
    Leida bool   `json:"leida"`
}

// MarcarTodasResponseDTO resultado al marcar todas las pendientes
type MarcarTodasResponseDTO struct {
    Afectadas int `json:"afectadas"`
}
```

---

## 6. Catálogo de Endpoints REST

| Método | Endpoint | Rol Mínimo | Descripción | Código Éxito | Códigos de Error |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/notificaciones/resumen` | Cualquier autenticado | Retorna contadores de no leídas para badge o polling ligero de respaldo | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/v1/notificaciones` | Cualquier autenticado | Lista notificaciones del usuario paginadas (`leida`, `prioridad`, `limite=20`) | `200 OK` | `400 Bad Request`, `401 Unauthorized` |
| `PATCH` | `/api/v1/notificaciones/:id/leer` | Propietario de la notif. | Marca una notificación individual como leída in-situ | `200 OK` | `404 Not Found: NOTIFICACION_NO_ENCONTRADA` |
| `POST` | `/api/v1/notificaciones/marcar-todas-leidas` | Cualquier autenticado | Conmuta todas las notificaciones pendientes del usuario a leídas | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/v1/notificaciones/stream` | Cualquier autenticado | Conexión Server-Sent Events (`text/event-stream`) para recepción reactiva $<30\text{ms}$ | `200 OK` | `401 Unauthorized` |

---

## 7. Modelo Relacional PostgreSQL 16 con RLS

DDL canónico con soporte multi-tenant estricto, tipos enumerados, índices compuestos e inyección de contexto RLS:

```sql
-- 1. Tipo enumerado para nivel de prioridad visual y acústica
CREATE TYPE tipo_prioridad_notificacion AS ENUM ('baja', 'media', 'alta', 'critica');

-- 2. Tabla relacional de notificaciones
CREATE TABLE notificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    local_id UUID REFERENCES local(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
    rol_destinatario VARCHAR(30) CHECK (rol_destinatario IN ('mozo', 'cocina', 'cajero', 'admin_local', 'propietario')),
    tipo VARCHAR(50) NOT NULL, -- 'pedido_anulado', 'plato_agotado', 'plato_listo', 'reserva_proxima', 'stock_critico', 'cuenta_solicitada', 'incidente_nuevo', 'arqueo_discrepancia', 'suscripcion_gracia'
    prioridad tipo_prioridad_notificacion NOT NULL DEFAULT 'media',
    titulo VARCHAR(120) NOT NULL,
    mensaje TEXT NOT NULL,
    entidad_tipo VARCHAR(50), -- informativo: 'pedido', 'mesa', 'insumo', 'reserva', 'incidente', 'caja'
    entidad_id UUID,          -- identificador referencial para auditoría
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_leida TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices de aceleración para consulta concurrente en tiempo real
CREATE INDEX idx_notificacion_usuario_leida ON notificacion (empresa_id, usuario_id, leida, created_at DESC);
CREATE INDEX idx_notificacion_local_rol ON notificacion (empresa_id, local_id, rol_destinatario, leida, created_at DESC);
CREATE INDEX idx_notificacion_fecha ON notificacion (created_at DESC);

-- 4. Seguridad a nivel de filas (Row-Level Security)
ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_notificacion_tenant ON notificacion
    FOR ALL
    USING (
        empresa_id = current_setting('app.current_empresa_id')::uuid
        AND (
            usuario_id = current_setting('app.current_user_id')::uuid
            OR (
                usuario_id IS NULL 
                AND local_id = NULLIF(current_setting('app.current_local_id', true), '')::uuid
                AND rol_destinatario = current_setting('app.current_user_role', true)
            )
        )
    );
```

---

## 8. Checklist de Accesibilidad WCAG 2.1 AA

1. **Live Regions para Lectores de Pantalla:**
   - La campana y los Toasts flotantes incorporan atributos `aria-live="polite"` para notificaciones estándar y `aria-live="assertive"` para alertas críticas (`prioridad = 'critica'`), garantizando que usuarios con discapacidad visual reciban el aviso sin interrupciones abruptas.
2. **Atajos de Teclado y Control de Foco:**
   - Atajo `Alt + N`: abre o cierra el panel lateral de notificaciones desde cualquier punto de la aplicación.
   - Tecla `Esc`: cierra el panel drawer o descarta el Toast emergente y devuelve el foco exactamente al elemento operativo anterior.
3. **Contrastes Visuales Estrictos:**
   - Fondos de tarjetas (`#FFFFFF`, `#F8FAFC`) con texto en `#0F172A` (ratio > 12:1).
   - Badges de prioridad crítica en `#0F172A` sobre blanco (ratio > 14:1) superando ampliamente el estándar WCAG AA (4.5:1).
4. **Respeto a Preferencias de Movimiento:**
   - Soporte para `@media (prefers-reduced-motion: reduce)`: las animaciones de deslizamiento del panel y la barra de progreso del Toast se desactivan, mostrando los avisos de forma instantánea.
