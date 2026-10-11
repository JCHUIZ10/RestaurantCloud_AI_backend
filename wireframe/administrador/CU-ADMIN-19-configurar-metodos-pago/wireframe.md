# CU-ADMIN-19: Configurar Métodos de Pago y Comisiones de Cobro del Local

Especificación técnica de interfaz de usuario, arquitectura de información, control de acceso basado en roles (RBAC), sincronización reactiva en tiempo real (Server-Sent Events) y contratos de API Go en **RestaurantCloud AI**.

---

## 1. Ficha Técnica del Caso de Uso

| Atributo | Detalle |
| :--- | :--- |
| **Código CU** | `CU-ADMIN-19` |
| **Nombre** | Configurar métodos de pago y comisiones de cobro del local |
| **Actor(es)** | `admin_local` (Administrador del local; facultad exclusiva de parametrización financiera de sede) |
| **Dispositivo / Viewport** | Desktop POS / Laptop Administrador (`1440x900` estándar corporativo Grayscale Blueprint) |
| **Precondición** | El local está activo; el usuario cuenta con sesión autenticada con rol `admin_local` asignado a la sede (`local_id`). |
| **Postcondición** | La sede cuenta con el catálogo de métodos de pago registrado y activo en la tabla `metodo_pago_local`; comisiones porcentuales y datos de recepción configurados; se emite el evento SSE `metodos_pago_actualizados` en < 30ms para que las pantallas del Cajero (`CU-CAJA-02`, `CU-CAJA-03`) y tablets de mozo actualicen dinámicamente sus medios de cobro y recargos sin requerir recarga de página. |

---

## 2. Diagrama de Flujo y Secuencia en Tiempo Real (SSE)

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador del Local
    participant FE as Frontend Portal Admin
    participant BE as Backend (Go Core API)
    participant SSE as SSE Event Hub
    participant DB as PostgreSQL 16 (RLS)
    actor C as Terminal Cajero POS (CU-CAJA-02 / 03)

    %% 1. Carga de Parámetros
    A->>FE: 1. Accede a Ajustes > Métodos de Pago y Comisiones
    FE->>BE: GET /api/v1/admin/metodos-pago
    BE->>DB: SELECT * FROM metodo_pago_local WHERE local_id = :local_id ORDER BY orden ASC
    alt Registro Existe
        DB-->>BE: Retorna lista de métodos configurados
    else Primera Vez (Local Nuevo)
        BE->>DB: INSERT 3 métodos estándar (Efectivo 0%, Tarjeta 0%, Billetera 0%)
        DB-->>BE: Retorna configuración pre-aprovisionada
    end
    BE-->>FE: 200 OK (apiresponse.Response con ListaMetodosPagoDTO)
    FE->>A: Renderiza Vista 1: Formulario Izquierda (50%) + Simulador Derecha (50%)

    %% 2. Interacción y Calibración en Simulador
    A->>FE: Modifica comisión de Tarjeta a 3.50% / Ingresa Celular Yape
    FE->>FE: Simulador reactivo recalcula en vivo el ticket de prueba (S/ 100.00 -> S/ 103.50)

    %% 3. Validación de Regla de Negocio
    opt Intento de desactivar todos los métodos
        A->>FE: Conmuta switch de Efectivo a Inactivo (teniendo otros inactivos)
        FE->>FE: Bloquea acción y despliega Vista 3 (ERR_MINIMO_UN_PAGO)
    end

    %% 4. Guardado y Broadcast SSE
    A->>FE: Presiona "[ ✓ Guardar Parámetros de Pago ]"
    FE->>BE: PUT /api/v1/admin/metodos-pago { metodos: [...] }
    BE->>BE: Valida: al menos 1 activo, comisiones entre 0% y 50%
    BE->>DB: UPDATE metodo_pago_local ... updated_at = NOW()
    BE-->>FE: 200 OK (apiresponse.Response con resultado exitoso)
    BE->>SSE: Broadcast evento 'metodos_pago_actualizados' { local_id }
    
    %% 5. Transmisión reactiva al POS
    SSE-->>C: Stream SSE capturado en < 25ms -> Recalcula opciones de cobro y recargos
```

---

## 3. Especificación de Pantallas y Wireframes Blueprint (4 Vistas)

### Vista 1: Panel Principal de Configuración y Simulador Reactivo (Split 50/50)

![Vista 1: Panel Principal de Configuración](assets/wf_admin_19_panel_configuracion.jpg)

#### Layout Estructural (Arte ASCII 1440x900):
```text
+----------------------------------------------------------------------------------------------------+
| [SaaS] RestaurantCloud AI  /  Sede Central (Miraflores)  /  Cobros y Pagos   [📍 Sede] [CM Admin] |
+----------------------------------------------------------------------------------------------------+
| Configuración de Métodos de Pago y Comisiones (CU-ADMIN-19)           ⚡ SSE < 30ms [Descartar] [Guardar] |
| Administra medios aceptados en salón y recargos aplicados al comensal en caja                      |
+----------------------------------------------------------------------------------------------------+
| [ 3 / 3 Activas ]          | [ 1 con Comisión ]        | [ S/ 24,850.00 ]          | [ S/ 869.75 ]         |
| Formas Habilitadas         | Tarjeta POS (3.50%)       | Ventas Tarjeta (Mes)      | Recargos Percibidos   |
+----------------------------------------------------------------------------------------------------+
| COLUMNA IZQUIERDA (50%): CATÁLOGO DE MÉTODOS     | COLUMNA DERECHA (50%): SIMULADOR DE COBRO EN VIVO|
|                                                  |                                                  |
| 💳 Catálogo de Formas de Pago  [Regla: Min 1]    | ⚡ Simulador de Cobro & Precuenta  [ESPEJO CAJA] |
|                                                  |                                                  |
| 💵 Efectivo (Cash)                [● ACTIVO]     | Monto de Consumo Simulación: [ PEN S/ ] [ 100.00]|
|    Medio obligatorio legal. No admite recargo.   |                                                  |
|    Recargo: [ 0.00% (Fijo) ]   Sin costo pasarela| Previsualización de Opciones para el Cajero:    |
| ------------------------------------------------ |                                                  |
| 💳 Tarjeta Débito / Crédito (POS) [● ACTIVO]     | ( ) Efectivo (0.0%):        S/ 100.00            |
|    Terminales Izipay / Niubiz. Traslada costo.   |     Consumo: S/ 100.00 | Recargo: S/ 0.00        |
|    Comisión al cliente: [-] [ 3.50% ] [+]        |                                                  |
|    [+S/ 3.50 por c/ S/ 100]  [Ver Políticas]     | (●) Tarjeta POS [Recargo 3.5%]: S/ 103.50        |
| ------------------------------------------------ |     Consumo: S/ 100.00 | Recargo: S/ 3.50        |
| 📱 Billetera Digital (Yape/Plin)  [● ACTIVO]     |                                                  |
|    Pagos móviles por QR o celular de sede.       | ( ) Billetera Yape/Plin (0.0%): S/ 100.00        |
|    Comisión al cliente: [-] [ 0.00% ] [+]        |     Consumo: S/ 100.00 | Recargo: S/ 0.00        |
|    [Sin recargo (0%)]    [⚙️ Editar Celular & QR] | ------------------------------------------------ |
| ------------------------------------------------ | PRECUENTA DE SALÓN SIMULADA:                     |
| 🏦 Transferencia Bancaria         [○ PAUSADO]    | RESTAURANTCLOUD AI - MIRAFLORES  | MESA: 04      |
|    Eventos y reservas.     [Activar para Salón]  | 1x Lomo Saltado Criollo               S/ 48.00    |
|                                                  | 1x Causa de Pulpo al Olivo            S/ 36.00    |
| Políticas bajo RLS por local_id en PostgreSQL 16 | 2x Chicha Morada Jarra                S/ 16.00    |
| [+ Agregar Medio Personalizado]                  | SUBTOTAL: S/ 84.75 | IGV (18%): S/ 15.25        |
|                                                  | CONSUMO BRUTO:                        S/ 100.00    |
|                                                  | RECARGO TARJETA (3.50%):              S/   3.50    |
|                                                  | >>> TOTAL A PAGAR:                    S/ 103.50    |
+----------------------------------------------------------------------------------------------------+
```

---

### Vista 2: Modal de Configuración Detallada / Datos de Billetera Digital

![Vista 2: Modal de Billetera Digital](assets/wf_admin_19_modal_detalle_metodo.jpg)

#### Layout Estructural (Arte ASCII 680px):
```text
+------------------------------------------------------------------------+
| 📱 Configurar Billetera Digital (Yape / Plin)                      [✕] |
| Ajustes de recepción para el monitor del cajero y comprobantes digitales|
+------------------------------------------------------------------------+
| [ Habilitar en Punto de Venta (POS) y Salón ]               [● ACTIVO] |
| Al activar, mozos y cajeros podrán seleccionar Yape/Plin como medio.  |
|                                                                        |
| Número Celular de la Sede (9 dígitos):   Comisión al Comensal:         |
| [ 987 654 321                       ]   [ 0.00 %                      ]|
|                                                                        |
| Titular de la Cuenta / Razón Social (Visible al comensal):             |
| [ Inversiones Gastronómicas del Sur S.A.C.                           ] |
|                                                                        |
| +---------------------+  Código QR Interoperable (Yape / Plin)         |
| |  [QR ACTIVO DE LA]  |  Se proyecta en pantalla secundaria y precuenta|
| |  [SEDE GASTRONÓM]   |  para escaneo directo de comensales en mesa.   |
| +---------------------+  [ 📷 Reemplazar Archivo QR (PNG/JPG) ]        |
|                                                                        |
| Instrucción Interna para el Cajero:                                    |
| [ Verificar confirmación de pago y código de operación de 6 dígitos ] |
|                                                                        |
| ℹ️ Trazabilidad: Transacciones se consolidan en Arqueo (CU-CAJA-06) bajo |
|    la categoría independiente Billeteras Móviles para conciliación.    |
+------------------------------------------------------------------------+
| [ Cancelar ]                             [ ✓ Guardar Datos Billetera ] |
+------------------------------------------------------------------------+
```

---

### Vista 3: Diálogo de Advertencia / Bloqueo de Regla de Negocio (Mínimo 1 Método Activo)

![Vista 3: Bloqueo de Desactivación](assets/wf_admin_19_bloqueo_desactivacion.jpg)

#### Layout Estructural (Arte ASCII 540px):
```text
+------------------------------------------------------------------+
| [ ! ] Bloqueo de Seguridad: Mínimo 1 Forma de Pago                |
|       Restricción de Integridad Operativa (ERR_MINIMO_UN_PAGO)   |
+------------------------------------------------------------------+
| Acción Solicitada: Desactivar "Efectivo"        [ 409 CONFLICT ] |
| Estado del catálogo: 1 de 3 métodos activo actualmente           |
|                                                                  |
| No es posible desactivar Efectivo porque es la única forma de    |
| pago actualmente habilitada en la sede. Desactivar todos los     |
| medios provocaría la paralización inmediata del Punto de Venta   |
| en salón, impidiendo que cajeros y mozos cobren comandas.        |
|                                                                  |
| ■ Regla de negocio: La sede debe mantener al menos un método en  |
|   estado activo = true en todo momento.                          |
| ■ Recomendación: Si deseas pausar efectivo, primero habilita    |
|   Tarjeta POS o Billetera Digital.                               |
+------------------------------------------------------------------+
| [ Habilitar Tarjeta Primero ]   [ ✓ Entendido / Mantener Efectivo] |
+------------------------------------------------------------------+
```

---

### Vista 4: Estado Inicial / Local Nuevo (Onboarding Pre-Aprovisionado)

![Vista 4: Onboarding Inicial](assets/wf_admin_19_onboarding_inicial.jpg)

#### Layout Estructural (Arte ASCII 920px):
```text
+------------------------------------------------------------------------------+
|                    [ APROVISIONAMIENTO AUTOMÁTICO ]                          |
|             ¡Cobros de la Sede Pre-Configurados y Listos!                    |
| Activamos los 3 métodos de cobro indispensables para gastronomía comercial   |
| con 0% de recargo por defecto. Tu equipo puede operar de inmediato.         |
+------------------------------------------------------------------------------+
| [1. Efectivo (Cash)]       | [2. Tarjetas (POS)]       | [3. Yape / Plin]    |
| [LISTO]                    | [LISTO]                   | [LISTO]             |
| 💵                         | 💳                         | 📱                   |
| Recargo: 0.00% (Fijo)      | Recargo inicial: 0.00%    | Recargo: 0.00%      |
| Activo para fondo inicial, | Habilitado para Izipay/   | Habilitado para pago|
| cambio y arqueo de turno.  | Niubiz. Traslado opcional.| móvil. Configura QR.|
+------------------------------------------------------------------------------+
| ● Compatible con Boleta, Factura y Notas de Venta con QR instantáneo.        |
|                                                                              |
| [ Personalizar Comisiones ]             [ ✓ Aceptar y Pasar al Punto de Venta]|
+------------------------------------------------------------------------------+
```

---

## 4. Matriz de Control de Acceso Basado en Roles (RBAC)

| Acción / Capacidad | `admin_local` | `propietario` | `cajero` | `mozo` | `cocina` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Ver configuración de cobros y comisiones (`GET`) | ✅ Permitido | ✅ Permitido | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| Modificar comisiones porcentuales (`PUT`) | ✅ Permitido | ✅ Permitido | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| Habilitar o pausar métodos de pago (`PUT`) | ✅ Permitido | ✅ Permitido | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| Consultar métodos activos para cobrar (`GET /caja`) | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido | ❌ Bloqueado |
| Cargar imagen de QR de Yape/Plin (`POST /upload`) | ✅ Permitido | ✅ Permitido | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |

---

## 5. Contratos de API Go y DTOs (`internal/domain/pago/dto.go`)

```go
package pago

import (
	"time"
	"github.com/google/uuid"
)

// MetodoPagoLocalDTO representa la configuración de un método de pago por sede
type MetodoPagoLocalDTO struct {
	ID                 uuid.UUID              `json:"id"`
	LocalID            uuid.UUID              `json:"local_id"`
	Codigo             string                 `json:"codigo" example:"tarjeta"` // efectivo, tarjeta, billetera_digital, transferencia
	Nombre             string                 `json:"nombre" example:"Tarjeta Débito / Crédito (POS)"`
	Activo             bool                   `json:"activo" example:"true"`
	ComisionPorcentaje float64                `json:"comision_porcentaje" example:"3.50"`
	DatosAdicionales   map[string]interface{} `json:"datos_adicionales,omitempty"` // {"telefono": "987654321", "titular": "Restaurant SAC"}
	Icono              string                 `json:"icono" example:"credit-card"`
	Orden              int                    `json:"orden" example:"2"`
	UpdatedAt          time.Time              `json:"updated_at"`
}

// ActualizarMetodoPagoRequest payload enviado por el Administrador
type ActualizarMetodoPagoRequest struct {
	Activo             bool                   `json:"activo"`
	ComisionPorcentaje float64                `json:"comision_porcentaje" binding:"gte=0,lte=50"`
	DatosAdicionales   map[string]interface{} `json:"datos_adicionales,omitempty"`
}

// ActualizarCatalogoMetodosRequest actualización masiva de la sede
type ActualizarCatalogoMetodosRequest struct {
	Metodos []struct {
		Codigo             string                 `json:"codigo" binding:"required"`
		Activo             bool                   `json:"activo"`
		ComisionPorcentaje float64                `json:"comision_porcentaje" binding:"gte=0,lte=50"`
		DatosAdicionales   map[string]interface{} `json:"datos_adicionales,omitempty"`
	} `json:"metodos" binding:"required,min=1"`
}

// SimulacionCobroRequest DTO para el cálculo en tiempo real del simulador
type SimulacionCobroRequest struct {
	MontoConsumo float64 `json:"monto_consumo" binding:"required,gt=0"`
}

// OpcionCobroSimulada resultado por cada método de pago
type OpcionCobroSimulada struct {
	Codigo             string  `json:"codigo"`
	Nombre             string  `json:"nombre"`
	Activo             bool    `json:"activo"`
	ConsumoBase        float64 `json:"consumo_base"`
	ComisionPorcentaje float64 `json:"comision_porcentaje"`
	MontoRecargo       float64 `json:"monto_recargo"`
	TotalFinal         float64 `json:"total_final"`
}

// SimulacionCobroResponse salida para el simulador y la precuenta de salón
type SimulacionCobroResponse struct {
	MontoConsumo float64               `json:"monto_consumo"`
	Opciones     []OpcionCobroSimulada `json:"opciones"`
}
```

---

## 6. Catálogo de Endpoints REST

| Método | Endpoint | Rol Mínimo | Código Éxito | Descripción |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/admin/metodos-pago` | `admin_local` | `200 OK` | Obtiene el catálogo completo de métodos de pago y comisiones de la sede |
| `PUT` | `/api/v1/admin/metodos-pago` | `admin_local` | `200 OK` | Actualiza masivamente los métodos de pago, recargos y switches de la sede |
| `PUT` | `/api/v1/admin/metodos-pago/{codigo}` | `admin_local` | `200 OK` | Actualiza individualmente un método (ej. datos de Yape o porcentaje de Tarjeta) |
| `POST` | `/api/v1/admin/metodos-pago/simular` | `admin_local` | `200 OK` | Simula en vivo el cálculo de recargos sobre un monto de consumo de prueba |
| `GET` | `/api/v1/caja/metodos-pago-activos` | `cajero`, `mozo` | `200 OK` | Endpoint público para el POS que lista únicamente métodos `activo = true` |

### Catálogo de Errores de Negocio (`AppError`):

| Código Error | HTTP Status | Causa y Mensaje |
| :--- | :---: | :--- |
| `ERR_MINIMO_UN_PAGO` | `409 Conflict` | Intento de desactivar todos los métodos. *"La sede debe mantener al menos un método de pago activo en todo momento."* |
| `ERR_COMISION_INVALIDA` | `422 Unprocessable` | Porcentaje de comisión negativo o superior al tope máximo del 50%. |
| `ERR_METODO_NO_ENCONTRADO` | `404 Not Found` | Código de método no registrado en el local especificado. |
| `ERR_DATOS_BILLETERA_INCOMPLETOS` | `422 Unprocessable` | Billetera digital marcada como activa sin número celular de contacto de 9 dígitos. |

---

## 7. Modelo Relacional PostgreSQL 16 y RLS

```sql
-- 1. Tabla de configuración de métodos de pago por local
CREATE TABLE IF NOT EXISTS metodo_pago_local (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    codigo varchar(30) NOT NULL, -- 'efectivo', 'tarjeta', 'billetera_digital', 'transferencia'
    nombre varchar(60) NOT NULL, -- 'Efectivo', 'Tarjeta Débito / Crédito (POS)', 'Billetera Digital (Yape/Plin)'
    activo boolean NOT NULL DEFAULT true,
    comision_porcentaje decimal(5, 2) NOT NULL DEFAULT 0.00 CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 50.00),
    datos_adicionales jsonb DEFAULT '{}'::jsonb, -- {"telefono": "987654321", "titular": "Restaurant S.A.C.", "qr_url": "..."}
    icono varchar(30) DEFAULT 'wallet',
    orden int NOT NULL DEFAULT 1 CHECK (orden >= 1),
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_metodo_pago_local UNIQUE(local_id, codigo)
);

-- 2. Índices de optimización para el Punto de Venta (< 1ms)
CREATE INDEX IF NOT EXISTS idx_metodo_pago_local_pos 
    ON metodo_pago_local(local_id, orden) 
    WHERE activo = true;

-- 3. Row-Level Security (Aislamiento Multi-Tenant)
ALTER TABLE metodo_pago_local ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_metodo_pago_local_isolation ON metodo_pago_local
    FOR ALL
    USING (local_id = NULLIF(current_setting('app.current_local_id', true), '')::uuid);

-- 4. Extensión en tabla comprobante para soportar recargos
ALTER TABLE comprobante ADD COLUMN IF NOT EXISTS metodo_pago_codigo varchar(30);
ALTER TABLE comprobante ADD COLUMN IF NOT EXISTS subtotal_consumo decimal(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE comprobante ADD COLUMN IF NOT EXISTS porcentaje_recargo decimal(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE comprobante ADD COLUMN IF NOT EXISTS monto_recargo decimal(10, 2) NOT NULL DEFAULT 0.00;

-- 5. Restricción Poka-Yoke: Billetera activa requiere obligatoriamente celular de 9 dígitos
ALTER TABLE metodo_pago_local ADD CONSTRAINT chk_billetera_digital_valida 
    CHECK (codigo != 'billetera_digital' OR activo = false OR (
        datos_adicionales ? 'telefono' AND length(datos_adicionales->>'telefono') >= 9
    ));
```

### 7.1 Regla de Inicialización Segura (Poka-Yoke Operativo):
1. **Estado Inicial en Sedes Nuevas:**
   - `efectivo`: `activo = true` (inmutable 0.00% recargo).
   - `tarjeta`: `activo = true` (0.00% recargo inicial, configurable).
   - `billetera_digital`: `activo = false` (*Inactivo por defecto hasta configurar celular y titular*).
2. **Protección del Punto de Venta:** En `CU-CAJA-02` y `CU-CAJA-03`, el POS solo expone medios con `activo = true`. Si el administrador aún no ingresó el número celular de Yape/Plin, el botón **no aparece en la botonera de cobro**, evitando que el personal cobre a cuentas inexistentes o imprima códigos QR vacíos en la precuenta.
3. **Flujo Asistido en Formulario:** Si el administrador intenta conmutar el switch de Yape/Plin a activo sin haber ingresado el celular, la interfaz abre de inmediato la **Vista 2 (Modal de Configuración)** para completar los datos antes de encender el interruptor.

---

## 8. Checklist de Accesibilidad WCAG 2.1 AA

- [x] **Contraste de Color:** Ratios superiores a `4.8:1` para texto regular `#334155` sobre fondo blanco `#FFFFFF` y `14:1` para títulos dark `#0F172A`.
- [x] **Navegación por Teclado:** Steppers numéricos de comisión con soporte para teclas `ArrowUp` y `ArrowDown`; switches operables con tecla `Espacio`.
- [x] **Regiones Vivas ARIA:** `aria-live="polite"` en el contenedor del Simulador de Precuenta para anunciar cambios de recargo a lectores de pantalla.
- [x] **Touch Targets:** Botones de stepper de 28x28px agrupados y switches con área táctil accesible de 44x44px.
- [x] **Feedback de Error Claro:** Alerta modal de `ERR_MINIMO_UN_PAGO` con foco forzado accesible y escape mediante tecla `Esc`.
