# Guía de Continuidad para Nuevas Sesiones de IA — RestaurantCloud AI

> **Nota para el asistente de IA:** Este documento es la fuente viva y punto de entrada cuando se inicia una nueva conversación en el proyecto. Contiene el contexto operativo consolidado, las fuentes de verdad, las normas de diseño y código, el inventario fáctico de casos culminados y el objetivo inmediato exacto para avanzar sin pérdida de contexto ni duplicidad de esfuerzo.

---

## 1. Fuentes de Verdad del Proyecto (Lectura Obligatoria)

Todas las decisiones técnicas, de interfaz y de arquitectura deben regirse estrictamente por los archivos del repositorio:

1. **Catálogo Canónico de Casos de Uso:** [`context/cu.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/cu.md)
   - Especificación detallada de flujos principales, flujos alternativos, precondiciones y postcondiciones por rol (`CU-PROP`, `CU-ADMIN`, `CU-MOZO`, `CU-COCINA`, `CU-CAJA`, `CU-CLIENTE`).
2. **Modelo Relacional de Base de Datos:** [`context/modelo_datos.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/modelo_datos.md)
   - Esquema en PostgreSQL 16 con Row-Level Security (RLS) multi-tenant (`empresa_id`, `local_id`), claves primarias y foráneas en `UUID v8` time-ordered, índices parciales de alto rendimiento y soporte de caché/pubsub en Redis.
3. **Contexto de Arquitectura y Negocio:** [`context/proyect_context.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/proyect_context.md)
   - SaaS multi-tenant para gastronomía peruana y global, backend monolito modular en Go (Echo / Chi), autenticación JWT independiente por empresa, suscripciones con Stripe (Starter, Pro, Enterprise), política de Cero Papel (emisión digital por QR dinámico, WhatsApp y correo) y cumplimiento estricto con SUNAT Perú.
4. **Bitácora Histórica de Decisiones Técnicas:** [`context/walkthrough.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/walkthrough.md)
   - 71 secciones exhaustivas que documentan layouts ASCII, diagramas de secuencia Mermaid, DTOs de Go, endpoints REST, eventos SSE en tiempo real y justificaciones fácticas desde el inicio del proyecto hasta el cierre formal de caja.
5. **Guía Maestra de Wireframes e Inventario:** [`wireframe/README.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/README.md)
   - Filosofía *Screen-First & Contract-First*, tokens de diseño Grayscale Blueprint, matriz de estados UX y tabla de entregables por módulo.

---

## 2. Metodología Obligatoria de Trabajo por Caso de Uso

Por cada nuevo Caso de Uso abordado, se ejecuta sin excepciones este flujo:

```text
  1. /plan interactivo ─────────> 2. Feedback y Aprobación del Usuario
                                               │
                                               ▼
  3. Generación de Wireframes <───────────────┘
     Grayscale Blueprint (3-4 vistas renderizadas con Edge Headless a 1440x900 JPG q95)
                               │
                               ▼
  4. Especificación Técnica: wireframe/<rol>/<cu>/wireframe.md
     (Ficha técnica, Secuencia Mermaid, Wireframe ASCII, Microcopias, 5 Estados UX,
      RBAC, DTOs Go, Endpoints REST, DDL PostgreSQL con RLS, Criterios WCAG 2.1 AA)
                               │
                               ▼
  5. Sincronización Integral de Documentación:
     - context/cu.md (Especificación exhaustiva del caso de uso)
     - context/modelo_datos.md (Tablas, enums, checks, foreign keys e índices)
     - context/walkthrough.md (Nuevas secciones de bitácora y layouts)
     - wireframe/README.md (Actualización del inventario de avance)
```

---

## 3. Estándar Visual y Pipeline de Renderizado

- **Paleta de Tokens Grayscale Blueprint:**
  - Fondos y superficies: `#0F172A` (Charcoal oscuro / acento), `#1E293B`, `#F8FAFC` (Canvas), `#FFFFFF` (Card).
  - Bordes y divisores: `#CBD5E1`, `#E2E8F0`.
  - Tipografía y textos: `#0F172A` (Títulos), `#475569` (Cuerpo), `#64748B` (Muted/Etiquetas).
- **Tipografía del Sistema:** Segoe UI / Inter / -apple-system (ultra-legible, escala modular estricta).
- **Accesibilidad y Ergonomía:** Cumplimiento WCAG 2.1 AA (contrastes > 4.5:1 en texto y > 12:1 en cabeceras; touch targets mínimos de 44x44px o 48x48px en interfaces operativas).
- **Resolución Canónica:** `1440x900` px.
- **Motor de Renderizado Local:** Script en Python mediante Microsoft Edge Headless (`--headless=new --window-size=1440,900`) y Pillow con compresión JPG de calidad 95:
  - Ruta de Microsoft Edge en Windows: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
  - Guardado de imágenes en: `wireframe/<rol>/<cu>/assets/wf_<rol>_<numero>_<nombre>.jpg`.

---

## 4. Inventario Consolidado de Módulos Culminados (45 Casos de Uso)

### 4.1 Autenticación y Acceso Transversal (`wireframe/`) — ✅ 100% CULMINADO
- `CU-AUTH-01`: Login y selección de cuenta/sede.
- `CU-AUTH-02`: Recuperación de contraseña vía OTP.

### 4.2 Rol Propietario (`wireframe/propietario/`) — 👑 100% CULMINADO (6 CUs Consecutivos)
- `CU-PROP-01`: Registro de empresa y autoservicio.
- `CU-PROP-02`: Gestión de suscripción y método de pago (Stripe).
- `CU-PROP-03`: Cambio de plan de suscripción y límites SaaS.
- `CU-PROP-04`: Registrar y administrar locales/sedes.
- `CU-PROP-05`: Crear y gestionar administradores de local.
- `CU-PROP-06`: Ver incidentes corporativos consolidados de la empresa.

### 4.3 Rol Administrador del Local (`wireframe/administrador/`) — 🏢 100% CULMINADO (16 CUs Funcionales)
- `CU-ADMIN-01`: Gestión del plano de mesas de sede.
- `CU-ADMIN-02`: Categorías de la carta gastronómica.
- `CU-ADMIN-03`: Insumos y stock inicial.
- `CU-ADMIN-04`: Productos de la carta y recetas culinarias.
- `CU-ADMIN-05`: Catálogo de proveedores de insumos.
- `CU-ADMIN-06`: Ficha y recepción de compra de insumos.
- `CU-ADMIN-08`: Personal, roles y permisos de sede.
- `CU-ADMIN-09`: Horario de atención y feriados extraordinarios.
- `CU-ADMIN-10`: Políticas y parámetros de reserva de salón.
- `CU-ADMIN-11`: Historial de incidentes internos de sede.
- `CU-ADMIN-12`: Notificación de anulación de pedido y auditoría de salón (Tabla `pedido_anulacion`, broadcast SSE reactivo con campana `[ 🔔 ]`, control de mermas y visado administrativo).
- `CU-ADMIN-13`: Ver reportes de ventas y desempeño (Dashboard ejecutivo de 3 pestañas: Ventas y Horas Punta Almuerzo/Cena, Menú Engineering de 4 cuadrantes con Top 8, y Rendimiento individual de mozos con rotación, upselling y resiliencia de turnos; exportación en streaming HTTP Gzip).
- `CU-ADMIN-14`: Gestión de flujo de caja, gastos operativos y auditoría de cierres Z (Integra formalmente `CU-ADMIN-15`; Dashboard 360° de flujo neto con ingresos 100% salón discriminados por liquidez [Efectivo en Gavetas, Tarjetas POS, Yape/Plin], desglose de compras por insumo culinario directo [Pollo, Lomo, Papas, Carbón], egresos manuales de sede [limpieza, empaques, servicios, alquiler, mantenimiento] con conciliación automática de gaveta chica, auditoría y visado gerencial inmutable de 42 turnos de caja con modal de Reporte Z Digital oficial con PDF, y modal de registro ágil de egreso operativo).
- `CU-ADMIN-17`: Gestionar promociones del local (Validación predictiva para caja, semántica NULL, cálculo antes de impuestos).
- `CU-ADMIN-18`: Configurar parámetros operativos de comanda y tiempos de KDS (Tabla `configuracion_kds`, steppers táctiles de semáforo verde/ámbar/rojo y broadcast SSE a cocina < 30ms).
- `CU-ADMIN-19`: Configurar métodos de pago y comisiones del local (Tabla `metodo_pago_local`, Efectivo, Tarjeta POS [+comisión], Yape/Plin, regla de al menos 1 medio activo y sincronización reactiva al POS).

### 4.4 Rol Mozo en Salón (`wireframe/mozo/`) — 🏆 100% CULMINADO (8 CUs Funcionales)
- `CU-MOZO-01`: Ver estado de mesas y centro de comandas en vivo (Plano 70% salón / 30% barra lateral KDS reactiva SSE).
- `CU-MOZO-02`: Tomar pedido y comanda móvil en salón (Unifica catálogo táctil 65% / ticket borrador 35%, soporte para rondas sucesivas y enrutamiento a cocina en < 30ms).
- `CU-MOZO-04`: Unir o dividir mesas en salón (Modelo relacional `mesa_principal_id`, identificador oficial `Mesa [ 02 ; 03 ]` y bloqueo asistido de separación si hay consumo activo).
- `CU-MOZO-05`: Gestionar reservas y recepción en salón (Bandeja central cronológica, asignación táctil con mini-mapa 5x2, bloqueo preventivo 30 min antes y recepción en 1 toque).
- `CU-MOZO-06`: Anular pedido (o ítem de pedido) con motivo (Autonomía de sala sin clave gerencial, chips de motivos frecuentes, asignación de merma y parada en KDS).
- `CU-MOZO-07`: Atender incidencia de plato no disponible (Enlace ante quiebre en cocina `CU-COCINA-04`, alerta prioritaria SSE, diálogo de sustitución en catálogo inteligente vs anulación sin costo).
- `CU-MOZO-08`: Consultar y presentar precuenta digital en mesa (Cero tickets de papel, cálculo tributario SUNAT, promociones independientes `CU-ADMIN-17`, QR dinámico de Yape/Plin para pago directo y conmutación a `cuenta_pedida`).
- `CU-MOZO-09`: Subdividir comanda en mesa y asociar comprobantes (Factura, Boleta, Nota de Venta) (Distribución determinista plato por plato, desglose de unidades, promociones comerciales independientes, consulta ApiPerú para RUC/DNI y notificación SSE al monitor POS de Caja).

### 4.5 Rol Cocina / KDS (`wireframe/cocina/`) — 👨‍🍳 100% CULMINADO (5 CUs)
- `CU-COCINA-01`: Ver cola de pedidos entrantes (Kitchen Display System - KDS) (Filtro estricto `pr.requiere_preparacion = true`, semáforo dinámico según `configuracion_kds`, vista dual columnar FIFO y All-Day Summary por partidas de fuego, soporte para mesas unidas y parada acústica/visual por SSE).
- `CU-COCINA-02`: Actualizar estado de preparación (Pase Caliente, Deshacer y Despacho) (Estados táctiles `Por Preparar`, `En Fuego` y `Listo en Pase`, ventana de Deshacer de 30s con rollback de insumos, búfer de recuperación de 30 min y alerta SSE a salón).
- `CU-COCINA-03`: Descuento automático de insumos por consumo (Deducción atómica por receta `producto_insumo`, piso no negativo `GREATEST(0, stock - cantidad)`, auditoría de discrepancias en `auditoria_stock_ajuste` y cascada a carta digital).
- `CU-COCINA-04`: Marcar producto como agotado / disponible (Modal táctil de quiebres en KDS, selector FIFO para porciones parciales en fuego $K < N$ y alerta reactiva a salón `CU-MOZO-07`).
- `CU-COCINA-05`: Recibir notificación de anulación de pedido (Parada acústica y visual en pantalla KDS, retiro de ticket y registro de merma según avance de cocción).

### 4.6 Rol Cajero / POS y Facturación (`wireframe/cajero/`) — 💳 100% CULMINADO (5 CUs Canónicos)
- `CU-CAJA-01`: Apertura de turno de caja (Política de terminal única por sede `uq_caja_abierta_local`, fondo inicial directo `monto_apertura` con chips rápidos `+S/50`, `+S/100`, `+S/200`, blindaje contra turnos previos sin cerrar `409 Conflict: ERR_TURNO_PREVIO_NO_CERRADO` y desbloqueo reactivo SSE del salón en < 20ms).
- `CU-CAJA-02`: Generar cuenta a partir de pedidos de una mesa (Precuenta Digital / POS) (Consolidado de consumos, soporte de mesas unidas `Mesa [ 02 ; 03 ]`, desacoplamiento operativo de cocina con banner informativo no bloqueante, promociones predictivas vigentes `CU-ADMIN-17`, cálculo fiscal oficial SUNAT Perú [Base Imponible e IGV 18%], proyección comparativa de medios de pago `CU-ADMIN-19` y enrutamiento directo a cobro en `CU-CAJA-03`).
- `CU-CAJA-03`: Cobro de comanda y emisión de comprobantes oficiales (Factura, Boleta y Nota de Venta) (Soporte de tres comprobantes oficiales con validación ApiPerú para RUC/DNI y persistencia en tabla `cliente` con `detalle JSONB` y `nombre_identificativo`; liquidación atómica por comanda íntegra o por subcuentas individuales `pedido_subcuenta_id`; control estricto de series y correlatividad monótona con bloqueo transaccional ACID `fn_obtener_siguiente_correlativo`; pago en efectivo con digitación directa y display destacado de vuelto; recargo de pasarela configurable; conmutación atómica de `pedido = 'cobrado'` y `mesa = 'libre'` con emisión SSE; diálogo de entrega 100% digital con código QR dinámico de alta resolución [UUID v8], WhatsApp y Email asistido con confirmación/modificación en caliente, y botón de impresión térmica física temporalmente deshabilitado).
- `CU-CAJA-04`: Anular comprobante / pedido ya cobrado y emisión de Nota de Crédito Electrónica (Emisión de Nota de Crédito oficial bajo normativa SUNAT con series `FC01` para Factura y `BC01` para Boleta mediante correlatividad ACID; filtros segmentados de dos niveles [Vigentes vs Anulados]; catálogo oficial SUNAT Catálogo 09 [01 anulación total, 02 error en documento, 06 devolución total] con sustento textual obligatorio; conmutación atómica de `comprobante.estado = 'anulado'` y `pedido.estado = 'anulado'`; asiento contable de egreso en `caja_movimiento` [`tipo = 'egreso_devolucion'`] con reversión en gaveta de S/ 385 a S/ 300 para cuadratura exacta; bloqueo Poka-Yoke contra re-anulación; alerta reactiva SSE al panel `CU-ADMIN-12`; y diálogo de entrega digital con token QR dinámico [UUID v8] y entrega multicanal).
- `CU-CAJA-05`: Cerrar caja (arqueo Z) y rendición de cuentas del turno (Verificación Poka-Yoke de salón al día sin mesas activas con comanda abierta; conciliación de pagos electrónicos por tarjetas POS [Lote #012] y billeteras digitales Yape/Plin; digitación directa de efectivo físico contado en gaveta con cálculo dinámico de diferencia a S/ 0.00; justificación textual obligatoria ante cualquier discrepancia; transacción atómica ACID que actualiza `caja.estado = 'cerrada'`, fija `fecha_cierre = NOW()` y libera el índice único `uq_caja_abierta_local`; emisión del Reporte Z Digital oficial con consolidación fiscal SUNAT descargable en PDF bajo política Cero Papel, archivo inmutable para supervisión administrativa `CU-ADMIN-15` y alerta reactiva SSE a `CU-ADMIN-12`).

### 4.7 Rol Cliente (`wireframe/cliente/`) — 📱 100% CULMINADO (2 CUs Canónicos)
- `CU-CLIENTE-01`: Consultar carta digital (Catálogo Interactivo Web) (Acceso público web por slug `https://app.restaurantcloud.pe/sede/<slug>/carta`, botones de contacto directo a WhatsApp y llamada mediante `local.telefono`, categorías con tabs táctiles, buscador reactivo en tiempo real con debounce, sincronización en vivo con quiebres de cocina `CU-COCINA-04` [`Agotado por hoy`], modal de ficha ampliada del plato, estado vacío accesible para búsquedas sin coincidencias y diseño mobile-first sin carritos ni registros).
- `CU-CLIENTE-02`: Buscar comprobante de pago (Visor Digital de Comprobantes Electrónicos) (Acceso público por capability token unívoco `https://app.restaurantcloud.pe/c/<token_uuid_v8>`, sin login y con estricta privacidad [sin buscador por DNI/RUC para proteger datos personales], visualización de ticket digital en smartphone y factura A4 en desktop, desglose de consumo e IGV en Soles, descargas oficiales en PDF y XML UBL 2.1, auditoría indeleble de comprobantes anulados con Nota de Crédito `CU-CAJA-04`, y estado accesible para búsqueda manual por código único con auxilio directo por WhatsApp).

### 4.8 Rol Administrador SaaS (`wireframe/saas_admin/`) — 👨‍💼 EN CURSO
- `CU-SAAS-01`: Supervisar empresas registradas, activaciones y renovaciones de suscripción (Consola central de supervisión de tenants con bypass de RLS para `admin_saas`, 4 KPIs estratégicos [Total Empresas, Activas, En Gracia, Sedes Operativas Conectadas], seguimiento estricto del período de gracia de 5 días según `CU-PROP-02` ante cobros fallidos de Stripe, expediente 360° con desglose de consumo y transacciones inmutables de `pago`, e incorporación de altas manuales B2B con comprobantes bancarios verificados y despacho automático de correo de bienvenida con capability token de 72h).
- `CU-SAAS-02`: Dar de baja / suspender empresa conforme a ley (Protocolo formal de suspensión preventiva y bajas conforme a la Ley N° 29733 de Protección de Datos Personales / RGPD, entidad dedicada `suscripcion_suspension`, paquete de portabilidad descargable [.ZIP], retención legal de 30 días con reversibilidad, confirmación Poka-Yoke por RUC y pantalla informativa de corte operativo canalizada exclusivamente a WhatsApp de soporte [+51 930 723 537]).

---

## 5. Estado Integral del Alcance Operativo (47 Casos de Uso 100% Culminados)

El diseño de interfaces Grayscale Blueprint, arquitectura relacional en PostgreSQL 16 y contratos de API en Go de **RestaurantCloud AI** cuenta con **47 Casos de Uso Culminados**:
- **Autenticación y Plataforma:** `CU-AUTH-01`, `CU-AUTH-02` (2 CUs).
- **Rol Propietario:** `CU-PROP-01` a `CU-PROP-06` consecutivos (6 CUs).
- **Rol Administrador de Local:** `CU-ADMIN-01` a `06`, `08` a `14` (`14` absorbe `15`), `17`, `18`, `19` (16 CUs funcionales).
- **Rol Mozo:** `CU-MOZO-01` a `CU-MOZO-09` (9 CUs).
- **Rol Cocina / KDS:** `CU-COCINA-01` a `CU-COCINA-05` (5 CUs).
- **Rol Cajero / POS:** `CU-CAJA-01` a `CU-CAJA-05` (5 CUs canónicos).
- **Rol Cliente Web:** `CU-CLIENTE-01`, `CU-CLIENTE-02` (2 CUs).
- **Rol Administrador SaaS:** `CU-SAAS-01` y `CU-SAAS-02` (2 CUs culminados). Siguiente caso en cola: `CU-SAAS-03` (Configurar planes de suscripción).
- **Casos Diferidos a Fase Futura (Backlog):** `CU-ADMIN-07`, `CU-ADMIN-16`, `CU-PROP-07`, `CU-PROP-08`, `CU-SAAS-04`, `CU-SAAS-05`.
- **Casos Omitidos / Absorbidos:** Antiguo `CU-PROP-08` (descentralizado en `CU-PROP-04`, `CU-ADMIN-10`, `17`, `18`, `19`) y `CU-ADMIN-15` (absorbido en `CU-ADMIN-14`).

---

## 6. Instrucción de Arranque para la Nueva Sesión de IA

Cuando el usuario inicie el nuevo chat y salude o solicite continuar:
1. **Confirma la lectura de este archivo** [`context/INSTRUCCIONES_NUEVA_SESION.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/INSTRUCCIONES_NUEVA_SESION.md).
2. **Declara formalmente el estado del sistema:**
   - La fase de Wireframes, Modelado de Datos relacional y Contratos UI ↔ API cuenta con **47 CUs culminados y consolidados**.
3. **Solicita al usuario las directrices para la siguiente etapa:**
   - Proponer la planificación y desarrollo del siguiente caso de uso SaaS: `CU-SAAS-03: Configurar planes de suscripción`, o el paso a la construcción de backend.


