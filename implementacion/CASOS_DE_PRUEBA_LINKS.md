# GUÍA RÁPIDA DE ENLACES DE PRUEBA Y DEMOSTRACIÓN
## RestaurantCloud AI — Verificación en Vivo de Pantallas

> **Propósito:**  
> Este documento permite comprobar de forma rápida y directa cada pantalla desarrollada en el frontend (`http://localhost:5173`), explicando en una sola línea qué representa cada escenario de prueba.

---

(Landing Page SaaS B2B):
- Portal comercial interactivo con métricas 3D en tiempo real, propuesta de valor y planes de suscripción: http://localhost:5173/

(CU-CLIENTE-01: Consultar Carta Digital QR):
- Carta digital pública de sede con menú de platos, categorías, carrusel de promociones y modal informativo: http://localhost:5173/sede/miraflores/carta
- Acceso directo optimizado para escaneo de código QR en mesa desde smartphone: http://localhost:5173/m/miraflores

(CU-CLIENTE-02: Buscar Comprobante de Pago Digital):
- Boleta de venta electrónica emitida para consumidor final con desglose de consumo y propina: http://localhost:5173/c/token-boleta-demo
- Factura electrónica para empresas con RUC, razón social y formato formal A4: http://localhost:5173/c/token-factura-demo
- Comprobante anulado por Nota de Crédito con sello de agua tributario y motivo de rectificación: http://localhost:5173/c/token-anulado-demo
- Buscador manual asistido para comensales que ingresan sin parámetros directos (Zero Dead-Ends): http://localhost:5173/comprobante
- Búsqueda estructurada mediante slug de sede y número de serie correlativo: http://localhost:5173/sede/miraflores/comprobante/B001-0004521
- Pantalla de estado de error cuando el token no existe o ha expirado: http://localhost:5173/c/token-invalido-demo

(CU-AUTH-01: Iniciar Sesión y Resolución Multi-Cuenta):
- Formulario de login con widget flotante en esquina inferior para copiar y probar 7 perfiles en 1 clic: http://localhost:5173/login

(CU-MOZO-01: Ver Estado de Mesas y Centro de Comandas en Vivo):
- Pantalla integrada de salón (layout 70/30) con plano táctil, despacho dual en acordeones colapsables (productos de despacho directo como gelatinas/bebidas y pase de cocina), disponibilidad en vivo de mesas libres y ocupadas por piso, Quick-Drawer de 440px y simulador de eventos: http://localhost:5173/mozo/mesas

(CU-MOZO-02: Tomar Pedido y Comanda Móvil en Salón):
- Terminal táctil de toma de comanda (layout 65/35) con catálogo en vivo, split transaccional (cocina KDS vs entrega directa), modal de notas a cocina, segunda ronda de adicionales y resolución de conflictos 409: http://localhost:5173/mozo/mesas/mesa-04/comanda

(CU-MOZO-08: Emisión de Precuenta Digital en Mesa):
- que es : Precuenta digital en mesa con desglose SUNAT Perú, promociones comerciales en 1 clic, código QR de Yape/Plin para pago asistido y notificación a caja vía SSE: http://localhost:5173/mozo/mesas/mesa-04/precuenta

(CU-MOZO-04: Unir o Dividir Mesas en Salón):
- que es : Gestión espacial y física de mesas agrupadas en salón con mini-mapa interactivo 5x2, proyección de Mesa [ 02 ; 03 ] (8 pax), bloqueo asistido 409 por comanda activa y desvinculación a libres individuales: http://localhost:5173/mozo/mesas

(CU-MOZO-09: Dividir Cuenta en Mesa - Split de Comprobantes):
- que es : Wizard de división táctil en 2 pasos: distribución de platos determinista 100% Cero Azar (con desglose de unidades [ ✂ Desglosar Unidades ]), asignación de comprobantes individuales (Factura con RUC SUNAT, Boleta con DNI RENIEC / Consumidor Final, Nota de Venta), promociones independientes y pasarela de pago hacia Caja POS: http://localhost:5173/mozo/mesas

(CU-MOZO-06: Anular Pedido o Ítem con Motivo y Control de Merma):
- que es : Anulación táctica sin clave gerencial con motivo obligatorio (≥ 10 carac): parada inmediata en fogones KDS para platos en cocina vs calificación contable de merma (es_merma = true) sin revertir stock para platos servidos, y anulación completa con liberación automática de mesa a LIBRE: http://localhost:5173/mozo/mesas

(CU-MOZO-05: Gestionar Reservas y Recepción en Salón):
- que es : Centro de mando y bandeja de reservas táctil con selector de turno (Almuerzo/Cena), 4 KPIs de turno, modal interactivo de nueva reserva con mini-mapa espacial 5x2 (760px), ficha de recepción y reloj de cortesía en vivo (15 min) con registro de no-show y liberación a LIBRE en <25ms, advertencia de sobreasignación preventiva (<30m) y paywall didáctico para Plan Starter: http://localhost:5173/mozo/reservas

(CU-MOZO-07: Atender Incidencia de Plato No Disponible y Resolver en Mesa):
- que es : Gestión y resolución asistida en mesa ante quiebres de stock en cocina KDS: Banner superior táctil y badge [ ⚠️ QUIEBRE COCINA ] en Mesa 04, Modal de Decisión Asistida en Mesa (620px) con Opción A (Sustituir) y Opción B (Anular), Modal de Sustitución Universal en Carta (760px) con 6 sugerencias inteligentes calculadas por cercanía de precio (+S/, -S/, S/ 0) y búsqueda libre, y Modal de Anulación por Quiebre (580px) con recálculo contable y auditoría inmutable (es_merma = false): http://localhost:5173/mozo/mesas

(CU-COCINA-01: Ver Cola de Pedidos Entrantes KDS):
- que es : Monitor KDS industrial de cocina (TerminalLayout) con rejilla 4 columnas FIFO, semáforo dinámico según configuracion_kds (🟢 <=15m, 🟡 16-25m, 🔴 >25m), badges de mesa/mozo/ronda, botones táctiles para avanzar platos ([🔥 En Fuego], [✓ Marcar Listo], [↩ Deshacer 30s]), chip de bebidas atendidas por mozo, Ficha Técnica de Comanda 680px (Vista 2) con receta culinaria e insumos descontados en almacén, Modal de Alerta Reactiva Parada de Fogones 620px (Vista 3) por anulación SSE en salón, Consolidado All-Day Summary (Vista 4) agrupado por categorías reales de la carta gastronómica, y widget flotante de pruebas para simular eventos en 1 clic: http://localhost:5173/cocina/kds

(CU-ADMIN-01: Gestionar Plano de Mesas y Ambientes):
- que es : Gestión visual y distribución física del salón de la sede en DashboardLayout: KPIs de aforo y consumo de cuota del Plan Pro (17/30 mesas activas, 13 disponibles), selector de ambientes (Salón Principal, Terraza Exterior, Barra Bar) con controles para expandir o recortar cuadrícula, Asistente Rápido en Lote (Vista 2) con sliders interactivos de columnas/filas y cálculo automático, Modal de Creación Individual con Mini-Mapa interactivo selector de casillas (Vista 4), Quick-Drawer lateral de edición de 440px (Vista 3) con steppers táctiles y control de forma/unión, Modal de Bloqueo Duro 409 ante comanda activa en salón/cocina (Mesa 04), Onboarding de bienvenida para salones vacíos (Vista 5) y widget flotante interactivo para simular todos los estados UX en 1 clic: http://localhost:5173/admin/plano-mesas

(CU-ADMIN-02: Gestionar Categorías de la Carta):
- que es : Organización y estructuración de secciones del menú en DashboardLayout: KPIs en vivo (total secciones, visibles en salón, platos vinculados y sección líder), tabla responsive y cards móviles con reordenamiento híbrido (arrastre ≡ y botones táctiles [ ↑ / ↓ ]) para definir las pestañas de comanda de mozos (CU-MOZO-01), switches de visibilidad inmediata salón/QR, modal de creación/edición con vista previa WYSIWYG de pestaña de mozo, modal de bloqueo 409 relacional ante platos asociados con asistente de reasignación atómica sin fugas de datos, catálogo de plantillas gastronómicas peruanas preconfiguradas (Pollería, Chifa, etc.), onboarding asistido para cartas vacías y widget flotante de pruebas QA: http://localhost:5173/admin/categorias

(CU-ADMIN-03: Gestionar Catálogo de Insumos de Inventario):
- que es : Directorio y control de existencias de almacén y bodega en DashboardLayout: KPIs superiores en tiempo real (insumos activos con filtro por defecto, insumos agotados en quiebre y valorización estimada en Soles S/), barra de filtros con píldoras de estado y buscador con debounce, semáforo cromático de 4 niveles (🟢 Óptimo, 🟡 Reposición, 🔴 Crítico, ⚫ Sin Stock) con barras porcentuales de umbral, popovers interactivos de recetas culinarias asociadas con advertencia de bloqueo de carta, modal de alta ágil (< 8s) con selector táctil del catálogo cerrado de 10 unidades universales (3 base + 7 empaques comerciales), modal de recuento físico y merma con cálculo de discrepancia en vivo y motivo auditable obligatorio (auditoria_stock_ajuste), sincronización atómica con pantalla KDS y alerta a mozo (CU-COCINA-04 <-> CU-MOZO-01) cuando el stock llega a 0, onboarding de despensa vacía para sedes nuevas y widget flotante QA para simular quiebres y reposiciones en 1 clic: http://localhost:5173/admin/inventario

(CU-ADMIN-04: Gestionar Productos de la Carta y Recetas):
- que es : Gestión comercial y técnica de la carta gastronómica en DashboardLayout: 4 KPIs superiores (Total Platos, Disponibles Salón, Agotados por Quiebre y Margen Bruto Promedio %), motor dual de recetas culinarias ([ Rinde por Lote ] vs [ Cantidad Directa ]), calculadora en vivo de rentabilidad y margen bruto %, selector de destino operativo (Cocina KDS para fogones vs Despacho Directo en salón para bebidas/vitrina), Quick-Drawer lateral de calibración rápida con Simulador de Capacidad de Bodega y detección de insumo limitante cuello de botella, switches de disponibilidad reactiva sincronizados con existencias de bodega, protección activa contra borrado físico mediante archivado lógico (activo = false), paginación interactiva (10/20/50 por pág), buscador explícito (cero over-fetching), onboarding para carta vacía y widget flotante QA para simular quiebres de limón y reposición en 1 clic: http://localhost:5173/admin/carta

(CU-ADMIN-05: Gestionar Catálogo de Proveedores):
- que es : Directorio comercial de abastecimiento de la sede en DashboardLayout: 4 KPIs superiores (Proveedores Activos, Compras del Mes en Soles, Proveedores Frecuentes y 100% Contacto Directo WhatsApp), enlace directo universal a WhatsApp (wa.me/51...) con mensaje precargado de cotización/pedidos, modal ágil de alta sin RUC (< 10 segundos) con multi-selector interactivo tipo chips sincronizado con insumos de bodega, Quick-Drawer lateral de 560px con historial cronológico de compras pasadas y desglose de insumos comprados, regla de integridad contable PostgreSQL ON DELETE RESTRICT (bloqueo asistido 409 ante borrado físico y sugerencia de desactivación lógica), buscador multidimensional (por razón social o insumo que vende) con cero sobreconsultas, onboarding para sedes nuevas y widget flotante QA para simular duplicidad, directorio vacío y bloqueo contable: http://localhost:5173/admin/proveedores

(CU-ADMIN-06: Registrar Ficha de Compra de Insumos):
- que es : Liquidación contable y registro de compras de insumos para bodega en DashboardLayout: 4 KPIs superiores (Gasto Total Mes S/, Compras Realizadas, Crédito Fiscal IGV 18% y Compras a Crédito a 30 días), tabla paginada de comprobantes con badges de tipo (Factura, Boleta, Nota de Venta, Guía, Recibo) y estados (Registrada vs Anulada), Modal de Registro de Compra (< 60s) con desglose automático de IGV 18% SUNAT (Base = Total / 1.18), correlativos autogenerados NV-YYYYMMDD-#### para notas de venta sin número, alta de proveedor al vuelo sin salir del formulario, detección automática de variación porcentual de costos unitarios vs histórico, modal de reactivación por lote de platos de carta que estaban agotados por falta de insumos, modal de anulación con contingencia e impacto proyectado en stock con piso seguro GREATEST(0, stock - cant) y advertencia de apagado de platos/comandas activas, onboarding para sedes nuevas y widget flotante QA para pruebas en 1 clic: http://localhost:5173/admin/compras

---

### Próximos Casos de Uso (En Desarrollo / Roadmap)

(CU-CAJA-01: Apertura de Turno y Control de Efectivo):
- Pantalla de apertura de turno de caja y arqueo de efectivo con bloqueo operativo inicial: http://localhost:5173/caja/apertura

(CU-COCINA-04: Marcar Producto Agotado en Cocina):
- Control de quiebre de stock en 1 toque desde cocina con apagado en carta QR y tablets de salón: http://localhost:5173/cocina/stock-rapido

(CU-AUTH-02: Recuperar Contraseña con OTP):
- Flujo de recuperación de acceso mediante correo y validación de código OTP: http://localhost:5173/recuperar-password
