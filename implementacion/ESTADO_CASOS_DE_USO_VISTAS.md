# MATRIZ DE ESTADO Y TRAZABILIDAD DE CASOS DE USO Y VISTAS FRONTEND
## RestaurantCloud AI — Estado Canónico del Frontend Web

> **Documento de Trazabilidad y Continuidad del Proyecto.**  
> Este documento registra el avance oficial de las pantallas implementadas en `restaurantcloud/apps/web`, los componentes involucrados, sus rutas activas, estado de verificación responsive y el backlog ordenado de los siguientes Casos de Uso (CUs) para garantizar continuidad sin fricciones entre sesiones.  
>  
> 🔗 **Acceso Rápido a Enlaces de Demostración:** Consulta [`CASOS_DE_PRUEBA_LINKS.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/implementacion/CASOS_DE_PRUEBA_LINKS.md) para probar cada escenario en vivo con el formato estándar `(nombre del CU): - qué es : link`.

---

## 1. Resumen Ejecutivo del Avance

| Módulo / Dominio | Total CUs | CUs Concluidos | CUs En Proceso / Pendientes | % Avance Frontend |
|---|:---:|:---:|:---:|:---:|
| **Plataforma Pública & SaaS B2B** | 1 (Landing) | 1 | 0 | 100% |
| **Cliente / Comensal QR** | 2 | 2 | 0 | 100% |
| **Autenticación & Usuarios** | 3 | 1 | 2 | 33% |
| **Salón & Mozo** | 8 | 6 | 2 | 75% |
| **Cocina (KDS)** | 4 | 0 | 4 | 0% |
| **Caja & Cobranza** | 5 | 0 | 5 | 0% |
| **Administración Local** | 10 | 0 | 10 | 0% |
| **Propietario / Tenant** | 6 | 0 | 6 | 0% |
| **SuperAdmin SaaS** | 3 | 0 | 3 | 0% |

---

## 2. Inventario Detallado de Vistas Concluidas (100% Verificadas)

### 2.1 Landing Page Pública SaaS B2B
- **Ruta Activa:** `/` ([`PublicLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/PublicLayout.tsx))
- **Componentes Creados:**
  - `HomePage.tsx`: Propuesta de valor B2B para restaurantes (multitenant, control de mermas, facturación y comandas).
  - `SaasDashboard3D.tsx`: Gráfico tridimensional isométrico interactivo con perspectiva CSS, métricas de ocupación, KDS en tiempo real y simulación de IA predictiva.
  - Tabla de Tiers y Precios: Starter, Pro y Enterprise con selector de ciclo mensual/anual.
- **Responsive:**
  - Desktop: Grid amplio `max-w-7xl`, animaciones 3D interactivas en hover.
  - Tablet / Móvil: Secciones colapsadas fluidas, menú de navegación hamburguesa táctil.
- **Estado de Build:** ✅ Compila sin errores en Vite 5 (`npm run build`).

---

### 2.2 `CU-CLIENTE-01`: Consultar Carta Digital QR del Restaurante
- **Rutas Activas:**
  - `/sede/:slug/carta` (Ruta canónica con slug de sede)
  - `/m/:slug` (Ruta corta de acceso rápido QR)
- **Layout:** [`SedeCustomerLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/SedeCustomerLayout.tsx)
- **Componentes Creados:**
  - [`CartaDigitalPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/pages/CartaDigitalPage.tsx): Orquestador principal de la experiencia culinaria.
  - [`CartaHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/CartaHeader.tsx): Datos de identidad del restaurante, estado operativo ("Abierto hoy"), dirección y botones directos de WhatsApp / Llamada.
  - [`PromoBanner.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/PromoBanner.tsx): Carrusel dinámico de promociones activas de la sede.
  - [`CategoryTabs.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/CategoryTabs.tsx): Pestañas de categorías con soporte dual: horizontal deslizante para móviles y vertical de acceso rápido para la barra lateral en PC.
  - [`PlatoCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/PlatoCard.tsx): Tarjeta con orientación dual: formato fila (`flex-row`) en celulares y tarjeta culinaria vertical (`lg:flex-col`) con imagen panorámica superior en PC.
  - [`PlatoModal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/PlatoModal.tsx): Modal de inspección detallada del plato sin botones de compra ni carrito (estrictamente visual conforme a wireframe).
  - [`BusquedaVacia.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/BusquedaVacia.tsx): Empty state asistido con botón para limpiar filtros y contacto directo.
- **Servicios y DTOs:**
  - `mockCartaService.ts`: Servicio simulado con envoltura `ApiResponse<CatalogoCartaPublicoDTO>`.
  - `src/types/carta.ts`: DTOs estrictamente auditados contra la tabla `producto` de PostgreSQL (`id`, `nombre`, `descripcion`, `precio`, `foto_url`, `disponibilidad`). Cero campos inventados.
- **Responsive:**
  - Desktop: Contenedor `max-w-7xl`, arquitectura 2 columnas (Sidebar izquierdo sticky 4 columnas + Grilla de platos derecha de 3 columnas).
  - Móvil: Contenedor ergonómico de 1 columna con navegación táctil fluida.
- **Estado de Build:** ✅ Compilado y probado en vivo.

---

### 2.3 `CU-CLIENTE-02`: Buscar Comprobante de Pago Digital (Boletas y Facturas Electrónicas)
- **Rutas Activas:**
  - `/c/:token` (Acceso directo por escaneo de QR impreso o WhatsApp)
  - `/sede/:slug/comprobante/:numero` (Acceso estructurado por sede)
  - `/comprobante` (Búsqueda manual Zero Dead-Ends)
- **Layout:** [`SedeCustomerLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/SedeCustomerLayout.tsx) y [`PublicLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/PublicLayout.tsx)
- **Componentes Creados:**
  - [`ComprobanteDigitalPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/pages/ComprobanteDigitalPage.tsx): Orquestador reactivo de comprobante electrónico.
  - [`ComprobanteTicketMobile.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/ComprobanteTicketMobile.tsx): Representación de ticket térmico digital en smartphone (`< 768px`) con acciones al alcance del pulgar.
  - [`ComprobanteFacturaA4.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/ComprobanteFacturaA4.tsx): Hoja tributaria formal estilo Factura Fiscal A4 para PC y tablets (`>= 768px`) con código QR SUNAT y hash de seguridad digital.
  - [`ComprobanteSidebarDesktop.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/ComprobanteSidebarDesktop.tsx): Sidebar sticky para PC con botones para descargar PDF oficial y XML electrónico (UBL 2.1), enlace permanente y ficha del restaurante.
  - [`ComprobanteAnuladoBanner.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/ComprobanteAnuladoBanner.tsx): Sello de agua indeleble "ANULADO" y tarjeta de auditoría de la Nota de Crédito rectificatoria.
  - [`ComprobanteZeroDeadEnd.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/ComprobanteZeroDeadEnd.tsx): Pantalla de búsqueda manual por código con política de privacidad y anti-scraping (sin búsquedas masivas por DNI/RUC).
  - [`DemoComprobantesWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/components/DemoComprobantesWidget.tsx): Widget flotante para alternar entre los escenarios de prueba en 1 clic (*Boleta Emitida*, *Factura Corporativa*, *Comprobante Anulado*, *Token Inválido*).
- **Servicios y DTOs:**
  - [`mockComprobanteService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cliente/services/mockComprobanteService.ts): Servicio de comprobantes con envoltura `ApiResponse<ComprobantePublicoDTO>`.
  - [`src/types/comprobante.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/comprobante.ts): DTOs verificados contra las tablas `comprobante`, `pedido_item`, `producto`, `local` y `empresa` de PostgreSQL.
- **Estado de Build:** ✅ Compilado y probado en vivo (`npm run build`).

---

### 2.4 `CU-AUTH-01`: Iniciar Sesión y Resolución Multi-Cuenta
- **Ruta Activa:** `/login` ([`PublicLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/PublicLayout.tsx))
- **Componentes Creados:**
  - [`LoginPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/auth/pages/LoginPage.tsx): Orquestador del flujo de login y redirección por rol.
  - [`LoginForm.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/auth/components/LoginForm.tsx): Formulario con validación inline, alternancia de visibilidad de contraseña y estados de carga.
  - [`SelectorCuentaModal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/auth/components/SelectorCuentaModal.tsx): Selector de empresa para usuarios multi-tenant con cronómetro regresivo de 5 minutos, tarjetas interactivas de sedes y bloqueo de empresas suspendidas.
  - [`BetaCredentialsWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/auth/components/BetaCredentialsWidget.tsx): **Widget flotante interactivo** en la esquina inferior (`fixed bottom-5 right-5`) con catálogo de 7 perfiles (Propietario, Admin, Mozo, Cocina, Cajero, SuperAdmin, Multi-cuenta) que permite **copiar credenciales** o **auto-llenar en 1 clic**.
- **Servicios y DTOs:**
  - [`mockAuthService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/auth/services/mockAuthService.ts): Simulación de autenticación con `ApiResponse<LoginResponseDTO>`, bifurcación multi-tenant y validación de tokens temporales.
  - [`authStore.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/stores/authStore.ts): Almacenamiento en Zustand sincronizado con `localStorage`.
- **Responsive:**
  - Totalmente adaptado a Desktop, Tablet y Móvil con paleta ÁUREA (#0B2340 Navy, #D5A06F Cobre, #F4D7B0 Champán, #FFF9F0 Marfil) y fuentes *DM Serif Display* y *DM Sans*.
- **Estado de Build:** ✅ Compilado y probado en vivo (`npm run build`).

---

### 2.5 `CU-MOZO-01`: Ver Estado de Mesas y Centro de Comandas en Vivo (Hub de Salón)
- **Ruta Activa:** `/mozo/mesas` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx))
- **Componentes Creados:**
  - [`MozoMesasPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/pages/MozoMesasPage.tsx): Orquestador principal de la pantalla integrada del salón con gestión de eventos SSE y estado reactivo.
  - [`SalonHeaderMozo.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/SalonHeaderMozo.tsx): Selector de ambientes (*Salón Principal*, *Terraza*, *Barra*), disponibilidad de mesas del piso en vivo (`4 Libres · 6 Ocupadas de 10`), indicador SSE y píldoras de filtro táctil (*Mis Mesas*, *Todo el Salón*, *Libres*, *Ocupadas*).
  - [`PlanoMesasGrid.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/PlanoMesasGrid.tsx): Grilla visual interactiva (70% del ancho) con tarjetas adaptadas según la forma de mesa (`cuadrada`, `redonda`, `rectangular`) y simbología cromática.
  - [`MesaCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaCard.tsx): Tarjeta de mesa con paleta ÁUREA (#0B2340 Navy para ocupadas, Esmeralda para libres, Ámbar pulsante para cuenta pedida, Borde punteado para reservas y badge `🔗` para mesas unidas).
  - [`SidebarDespachoVivo.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/SidebarDespachoVivo.tsx): Barra lateral derecha persistente de 390px (30%) con **acordeones interactivos colapsables** táctiles (`>= 44px`): **Productos de Despacho Directo** (`requiere_preparacion = false`, subtítulo *"Entrega directa"*: bebidas, gelatinas y postres de vitrina) y **Pase de Cocina KDS**, con badges numéricos visibles en todo momento y botón `[✓ Marcar Producto Servido]`.
  - [`MesaInspeccionDrawer.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaInspeccionDrawer.tsx): Quick-Drawer de 440px que se abre al tocar una mesa ocupada, desglosando platos de cocina y bloque de **Productos de Despacho Directo** con descripción *"Entrega directa"*, total acumulado y botones de enlace a los otros CUs (`CU-MOZO-02`, `CU-MOZO-04`, `CU-MOZO-06`, `CU-MOZO-08`, `CU-MOZO-09`).
  - [`AlertaCocinaModal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/AlertaCocinaModal.tsx): Modal emergente prioritario (560px) para avisos inmediatos del pase caliente o quiebres de insumos.
  - [`DemoMozoWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/DemoMozoWidget.tsx): Widget flotante para simular en 1 toque: *Plato listo en cocina*, *Entrega directa (Gelatina / Bebida)*, *Alerta de quiebre*, *Alternar a Turno Vacío (Vista 4)* y *Filtrar Mis Mesas*.
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): Simulación completa con `ApiResponse<PlanoCompletoMozoDTO>` y `ApiResponse<MesaDetalleMozoDTO>`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): DTOs auditados contra `piso`, `mesa`, `pedido`, `pedido_item`, `producto` y `reserva` con `despacho_directo_pendiente`.
- **Responsive:**
  - Desktop: Layout persistente 70/30 (Plano + Sidebar de Despacho).
  - Tablet/Móvil: Barra lateral colapsable accesible vía botón superior `[ N Listos ]` y Quick-Drawer adaptativo touch-first.
---

### 2.6 `CU-MOZO-02`: Tomar Pedido y Comanda Móvil en Salón
*(Unifica funcionalmente `CU-MOZO-02: Tomar pedido`, `CU-MOZO-03: Modificar pedido antes de enviarlo` y `CU-MOZO-07: Consultar disponibilidad de productos`)*
- **Ruta Activa:** `/mozo/mesas/:mesaId/comanda` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx))
- **Componentes Creados:**
  - [`MozoComandaPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/pages/MozoComandaPage.tsx): Orquestador principal de la comanda táctil con split transaccional, cálculo de impuestos en tiempo real y gestión de rondas.
  - [`ComandaHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/comanda/ComandaHeader.tsx): Cabecera con botón de retorno al salón (`‹ Salón`), badges de mesa, ambiente, comensales, tiempo transcurrido, conectividad KDS y nombre del mozo titular.
  - [`CatalogoCartaGrid.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/comanda/CatalogoCartaGrid.tsx): Catálogo táctil (65% del ancho) con buscador en tiempo real, pestañas de categorías con badges de conteo, tarjetas de platos con badges de preparación (`Cocina KDS` vs `Entrega directa`), disponibilidad (`[ DISPONIBLE ]` vs `[ 🔒 AGOTADO ]`) y botón táctil `[ ＋ Añadir ]`.
  - [`TicketComandaPanel.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/comanda/TicketComandaPanel.tsx): Ticket interactivo (35% ~460px) con split automático en dos secciones: **`🍳 Cocina KDS (Preparación)`** y **`⚡ Productos de Despacho Directo (Entrega directa)`**, steppers táctiles, notas, resumen de Subtotal/IGV/Total y botón de despacho principal `[ 🚀 Confirmar y Enviar ]`.
  - [`ModalNotaCocina.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/comanda/ModalNotaCocina.tsx): Modal táctil de 480px con semántica `NULL` nativa (checkbox activable y textarea de especificación libre).
  - [`ModalConflictoStock.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/comanda/ModalConflictoStock.tsx): Modal asistido de 540px ante error `409 Conflict`, permitiendo retirar el producto agotado y enviar los demás o volver al catálogo para ofrecer sustitución.
  - [`DemoComandaWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/comanda/DemoComandaWidget.tsx): Widget flotante para simular en 1 toque: *Cargar pedido demo*, *Alternar a Ronda Adicional #02 (Vista 3)*, *Simular Conflicto 409 (Vista 4)* y *Alternar disponibilidad de plato*.
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `obtenerCatalogoCarta`, `obtenerHistorialMesa` y `enviarPedidoCocina`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `ProductoCatalogoMozoDTO`, `CatalogoProductosMozoDTO`, `ItemPedidoBorrador`, `CrearPedidoRequest`, `PedidoConfirmadoDTO`, `ConflictoStockDTO`, `HistorialMesaComandaDTO`.
- **Responsive:**
  - Desktop y Tablet (`>= 1024px`): Layout dividido 65% Catálogo + 35% Ticket persistente.
  - Smartphone (`< 1024px`): Catálogo a pantalla completa con barra inferior flotante táctil y Drawer deslizable para el ticket.
- **Estado de Build:** ✅ Compilado y probado en vivo (`npm run build`).

---

### 2.7 `CU-MOZO-08`: Emisión de Precuenta Digital en Mesa
- **Ruta Activa:** `/mozo/mesas/:mesaId/precuenta` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx))
- **Componentes Creados:**
  - [`MozoPrecuentaPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/pages/MozoPrecuentaPage.tsx): Orquestador principal de la precuenta digital con recálculo determinista (<15ms), cálculo de comisiones transparentes y transición de estado de mesa a cuenta pedida.
  - [`PrecuentaHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/PrecuentaHeader.tsx): Cabecera de salón con identificación de mesa/mesa unida, metadatos de mozo, minutos en mesa y banner informativo no bloqueante ante platos pendientes en cocina.
  - [`PrecuentaConsolidadoCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/PrecuentaConsolidadoCard.tsx): Consolidado de consumos de la mesa con cantidades, precios unitarios, subtotales, notas de cocina y badges de estado de despacho.
  - [`PromocionComercialSelector.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/PromocionComercialSelector.tsx): Selector en 1-click de promociones de sede (`CU-ADMIN-17`) con recálculo instantáneo del ahorro comercial.
  - [`DesgloseSUNATCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/DesgloseSUNATCard.tsx): Desglose fiscal oficial SUNAT Perú (Consumo Bruto, Descuento Comercial, Total Neto, Base Imponible 18% e IGV 18% con cuadre exacto al céntimo).
  - [`MetodosPagoSelector.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/MetodosPagoSelector.tsx): Selector de modalidades de pago con cálculo transparente de recargo bancario POS (Efectivo 0%, Yape/Plin 0%, Tarjeta +3.5%) y botón de transmisión a Caja vía SSE.
  - [`ModalQRBilletera.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/ModalQRBilletera.tsx): Modal de alta nitidez vectorizado para presentación del código QR Yape/Plin al comensal en mesa, con número de operación de voucher y validación del mozo.
  - [`DemoPrecuentaWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/precuenta/DemoPrecuentaWidget.tsx): Widget flotante para alternar rápidamente entre escenarios (con/sin promo, con/sin alerta de cocina, conmutar a estado ámbar en salón).
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `obtenerPrecuentaMesa`, `solicitarCuentaMesaConDetalle`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `CodigoMetodoPago`, `PrecuentaItemDTO`, `DesgloseSUNATMozoDTO`, `DetalleBilleteraDigitalDTO`, `OpcionPagoMozoDTO`, `PromocionSedeDTO`, `PrecuentaMozoResponseDTO`, `SolicitarCuentaRequest`.
- **Responsive:**
  - Desktop y Tablet: Grilla dividida 7/5 (Consolidado + Promos a la izquierda, Desglose SUNAT + Métodos de Pago a la derecha).
  - Smartphone: Flujo táctil vertical continuo con feedback de confirmación visual.
- **Estado de Build:** ✅ Compilado y probado en vivo (`npm run build`).

---

### 2.8 `CU-MOZO-04`: Unir o Dividir Mesas en Salón
- **Ruta Activa:** `/mozo/mesas` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx))
- **Componentes Creados:**
  - [`ModalUnirMesas.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/salon/ModalUnirMesas.tsx): Modal táctil de 720px con **Mini-Mapa interactivo de Salón (cuadrícula 5x2)** que reproduce la distribución física de mesas, destacando la mesa titular (`Mesa 02 ★`), seleccionando mesas contiguas elegibles libres con feedback táctil (min 48px), bloqueando mesas no elegibles (`OCUP`, `FIJA`, `RSV`) y proyectando en vivo la etiqueta unificada oficial (`Mesa [ 02 ; 03 ]`) y la capacidad sumada (`👤 x 8 comensales`).
  - [`ModalSepararMesas.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/salon/ModalSepararMesas.tsx): Modal de confirmación de 540px que valida la cuenta liquidada y restaura las mesas individuales independientes a su estado `LIBRE` original con su capacidad individual (4 personas c/u).
  - [`ModalBloqueoSeparacion.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/salon/ModalBloqueoSeparacion.tsx): Diálogo de bloqueo asistido de 560px ante `HTTP 409 Conflict` cuando existen consumos activos sin liquidar (ej. S/ 216.00), proveyendo dos vías de resolución en 1 toque: *Opción A: Solicitar Cuenta a Caja* (`CU-MOZO-08` / `CU-CAJA-02`) u *Opción B: Anular Comanda si los clientes se retiraron* (`CU-MOZO-06`).
  - [`MesaInspeccionDrawer.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaInspeccionDrawer.tsx): Integración completa con conmutación dinámica de botones (`[ 🔗 Unir Mesas ]` si es individual vs `[ ✂️ Separar Mesas ]` si ya está unida) y banner perimetral informativo de agrupación grupal.
  - [`MesaCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaCard.tsx): Renderizado en el plano de salón con badges distintivos (`🔗 Unida` con capacidad total en la titular o `↳ Vinculada / Anexa` en la secundaria).
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `obtenerCandidatasUnion`, `unirMesas`, `validarSeparacionMesa`, `dividirMesas`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `CandidataUnionMesaDTO`, `CandidatasUnionResponseDTO`, `MesaGrupoItemDTO`, `UnirMesasRequestDTO`, `UnirMesasResponseDTO`, `DividirMesasRequestDTO`, `DividirMesasResponseDTO`, `ValidacionSeparacionMesaDTO`.
- **Responsive:**
  - Desktop y Tablet: Cuadrícula interactiva 5x2 táctil touch-first con botones de target $\ge 48\text{px}$.
  - Smartphone: Diálogos y modales con scroll vertical optimizado y diseño accesible WCAG 2.1 AA.
- **Estado de Build:** ✅ Compilado y probado en vivo con 0 errores TypeScript (`npm run build`).

---

### 2.9 `CU-MOZO-09`: Dividir Cuenta en Mesa (Split de Comprobantes: Factura, Boleta, Nota de Venta)
- **Ruta Activa:** `/mozo/mesas` (Lanzable desde el Quick-Drawer `[ ➗ Dividir Cuenta ]` y widget flotante)
- **Componentes Creados:**
  - [`ModalDividirCuenta.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/split/ModalDividirCuenta.tsx): Modal orquestador wizard táctil de 1100px con control de flujo por pasos (Paso 1: Asignación Determinista Cero Azar, Paso 2: Configuración Tributaria y Promociones) y botón de envío seguro a Caja POS.
  - [`Paso1AsignacionItems.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/split/Paso1AsignacionItems.tsx): Bandeja de ítems no asignados, barra de progreso "Cero Azar" (exige 100% de asignación sin huérfanos), desglose táctil de unidades (`[ ✂ Desglosar Unidades ]` para dividir 2 platos de S/ 38 en 2 filas individuales de 1 unidad), tarjetas de subcuentas interactivas y dock de transferencia rápida.
  - [`Paso2ConfiguracionComprobantes.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/split/Paso2ConfiguracionComprobantes.tsx): Configuración tributaria autónoma por comensal:
    - **Factura:** Validación de RUC (11 dígitos) y botón de consulta en línea SUNAT (`[ 🔍 SUNAT ]`), autocompletando Razón Social y Domicilio Fiscal.
    - **Boleta:** Validación de DNI (8 dígitos) con consulta RENIEC (`[ 🔍 RENIEC ]`), autocompletando Nombre Completo, y checkbox para "Consumidor Final sin documento" (< S/ 700.00).
    - **Nota de Venta:** Control interno no fiscal que solicita únicamente Nombre del Cliente sin reportes tributarios.
    - **Promociones Comerciales (`CU-ADMIN-17`):** Descuentos aplicados de manera independiente por subcuenta.
    - **Pasarela de Pago:** Efectivo (0%), Tarjeta POS (+3.5%), Billetera Digital Yape/Plin (0%).
  - [`MesaInspeccionDrawer.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaInspeccionDrawer.tsx): Integración completa para abrir el wizard con `onAbrirModalDividir` y visualización del desglose de subcuentas enviadas a caja (`⏳ Esperando cobro en POS de Caja`).
  - [`MesaCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaCard.tsx): Badge específico `[DIVIDIDA (2)]` en estado `cuenta_pedida` con contador de comprobantes.
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `obtenerItemsParaDividir`, `consultarRuc`, `consultarDni`, `dividirCuentaMesa`, persistencia de subcuentas y enriquecimiento en `obtenerDetalleMesa`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `TipoComprobanteSplit`, `ItemParaDividirDTO`, `SubcuentaConfigDTO`, `ItemsParaDividirResponseDTO`, `SubcuentaResumenDTO`, `DividirCuentaRequestDTO`, `DividirCuentaResponseDTO`, `ConsultaRucResponseDTO`, `ConsultaDniResponseDTO`.
- **Responsive:**
  - Pantallas $\ge 1024\text{px}$: Layout dual de alta densidad para tablets y terminales táctiles de salón.
  - Móvil: Layout apilado vertical con zonas de pulsación $\ge 44\text{px}$ sin dead-ends.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.10 `CU-MOZO-06`: Anular Pedido (o Ítem de Pedido) con Motivo y Control de Merma
- **Ruta Activa:** `/mozo/mesas` (Acciones en Quick-Drawer `[ ✕ Anular plato ]`, `[ ⚠️ Anular Comanda Completa ]` y widget flotante)
- **Componentes Creados:**
  - [`ModalAnularItem.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/anulacion/ModalAnularItem.tsx): Modal táctil de 530px adaptativo que unifica las Vistas 2 y 4:
    - **Modo KDS (Platos en preparación/cola/listo):** Alerta sonora y visual instantánea para frenar la cocción en fogones KDS, chips táctiles de motivos frecuentes (`[ Error al registrar ]`, `[ Cliente desistió por demora ]`, `[ Queja de calidad ]`, `[ Cambio de plato ]`) y marca `es_merma = false`.
    - **Modo Merma (Platos entregados/servidos en mesa):** Tratamiento contable de inventario con badge `[es_merma = true]`, explicación didáctica de que **no se revertirá el stock físico** para no distorsionar recetas (`CU-ADMIN-05`), y chips de causas de merma (`[ Queja de cliente / Devolución ]`, `[ Plato caído / sala ]`, etc.).
    - Validación obligatoria de justificación descriptiva ($\ge 10\text{ caracteres}$) con contador en vivo.
    - Anulación inmediata sin clave gerencial para prevenir cuellos de botella operativos en salón.
  - [`ModalAnularComandaTotal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/anulacion/ModalAnularComandaTotal.tsx): Modal de alta advertencia de 550px (Vista 3) para situaciones extraordinarias (abandono del local, error de apertura o emergencia):
    - Explica la repercusión directa: cancelación de todos los pedidos en KDS/Caja y **liberación automática de la mesa a LIBRE**.
    - Chips de motivos de salón (`[ Grupo se retiró sin consumir ]`, `[ Error de apertura ]`, `[ Emergencia salón ]`).
    - Casilla de verificación obligatoria `[✓] Confirmo que la Mesa queda desocupada y los pedidos cancelados en KDS`.
    - Justificación obligatoria ($\ge 10\text{ caracteres}$) y botón destructivo `[ 🛑 Anular y Liberar Mesa ]`.
  - [`MesaInspeccionDrawer.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaInspeccionDrawer.tsx): Botón `[ ✕ Anular plato ]` / `[ ✕ Anular producto ]` en cada ítem con indicador de merma contable, y botón destructivo `[ ⚠️ Anular Comanda Completa de Mesa XX ]` en la barra inferior.
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `anularItemComanda` (evaluación de `es_merma`, recálculo dinámico de subtotal y liberación automática si la mesa queda sin platos), `anularComandaCompleta` (cancelación de todos los pedidos y conmutación a libre), y registro simulado en `log_auditoria`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `MotivoCategoriaItem`, `MotivoCategoriaComanda`, `AnularItemRequestDTO`, `AnularPedidoCompletoRequestDTO`, `ItemAnuladoResponseDTO`, `PedidoAnuladoResponseDTO`.
- **Responsive:** Modales centrados con áreas táctiles $\ge 44\text{px}$, contraste accesible WCAG 2.1 AA y scroll ergonómico en smartphones.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

## 3. Infraestructura y Arquitectura Base Completada

- **Enrutador React Router DOM v6:** [`src/router/index.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/router/index.tsx) con rutas centralizadas en [`src/router/routes.constants.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/router/routes.constants.ts).
- **Layouts Estructurales:**
  - `PublicLayout`: Encabezado corporativo, navegación pública y pie de página de la plataforma SaaS.
  - `SedeCustomerLayout`: Layout ligero y limpio para comensales en mesa por QR.
  - `DashboardLayout`: Layout administrativo con barra lateral colapsable para Propietarios y Administradores de Local.
  - `TerminalLayout`: Pantalla completa sin distracciones para terminales de alto rendimiento en Salón (Mozo), Cocina (KDS) y Caja (POS).
- **Tokens y Estilos Globales:** Tailwind CSS configurado con la paleta de 4 colores Áurea (`aurea-navy`, `aurea-copper`, `aurea-champagne`, `aurea-ivory`) y fuentes de Google Fonts (*DM Serif Display* y *DM Sans*).

---

## 4. Backlog Priorizado de Próximos Casos de Uso (Roadmap)

Con **`CU-MOZO-01`** (Salón y Despacho), **`CU-MOZO-02`** (Comanda Móvil), **`CU-MOZO-08`** (Precuenta Digital), **`CU-MOZO-04`** (Unir o Dividir Mesas), **`CU-MOZO-09`** (Dividir Cuenta) y **`CU-MOZO-06`** (Anular Pedido o Ítem con Merma) completados:

### 🟡 Opción A: Concluir Casos de Uso Restantes de Salón (Mozo)
1. **`CU-MOZO-05`: Gestionar Reservas y Recepción en Salón**
   - **Wireframe Canónico:** `wireframe/mozo/CU-MOZO-05-gestionar-reservas/wireframe.md`
   - **Propósito:** Bandeja central de reservas, mini-mapa espacial de asignación física, bloqueo preventivo automático a 30 min y tolerancia no-show.
2. **`CU-MOZO-07`: Atender Incidencia de Plato No Disponible (Quiebre de Cocina)**
   - **Wireframe Canónico:** `wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/wireframe.md`
   - **Propósito:** Alerta reactiva SSE en tablet, catálogo asistido de sustitución con 6 recomendaciones por cercanía matemática de precio y cálculo de diferencial.

---

### 🔴 Opción B: Cocina y Producción (KDS - Kitchen Display System)
3. **`CU-COCINA-01`: Ver Cola de Pedidos Entrantes (Kitchen Display System - KDS)**
   - **Ruta:** `/cocina/kds` (en `TerminalLayout`)
   - **Wireframe Canónico:** `wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/wireframe.md`
   - **Vistas Clave:** Tablero KDS oscuro industrial de 4 columnas FIFO con semáforo cromático dinámico según `configuracion_kds`, botones táctiles para avanzar platos a "En Fuego" o "Listo", y vista de consolidado "All-Day Summary".
   - **Tablas BD Asociadas:** `pedido`, `pedido_item`, `configuracion_kds`.

---

### 💳 Opción C: Caja y Facturación POS
4. **`CU-CAJA-01`: Apertura de Turno y Control de Efectivo**
   - **Ruta:** `/caja/apertura`
   - **Wireframe Canónico:** `wireframe/cajero/CU-CAJA-01-apertura-turno/wireframe.md`
   - **Vistas Clave:** Arqueo inicial, conteo desglosado de billetes/monedas y bloqueo de operaciones hasta apertura oficial.
   - **Tablas BD Asociadas:** `turno_caja`, `movimiento_caja`.

---

### 🔵 Opción D: Flujos Complementarios de Autenticación
5. **`CU-AUTH-02`: Recuperar Contraseña con OTP**
   - **Ruta:** `/recuperar-password`
   - **Wireframe Canónico:** `wireframe/usuario/CU-AUTH-02-recuperar-password/wireframe.md`
   - **Vistas Clave:** Solicitud de correo, ingreso de código OTP de 6 dígitos con temporizador de expiración y cambio de clave.


---

### 🔴 Opción B: Cocina y Producción (KDS - Kitchen Display System)
3. **`CU-COCINA-01`: Ver Cola de Pedidos Entrantes (Kitchen Display System - KDS)**
   - **Ruta:** `/cocina/kds` (en `TerminalLayout`)
   - **Wireframe Canónico:** `wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/wireframe.md`
   - **Vistas Clave:** Tablero KDS oscuro industrial de 4 columnas FIFO con semáforo cromático dinámico según `configuracion_kds`, botones táctiles para avanzar platos a "En Fuego" o "Listo", y vista de consolidado "All-Day Summary".
   - **Tablas BD Asociadas:** `pedido`, `pedido_item`, `configuracion_kds`.

---

### 💳 Opción C: Caja y Facturación POS
4. **`CU-CAJA-01`: Apertura de Turno y Control de Efectivo**
   - **Ruta:** `/caja/apertura`
   - **Wireframe Canónico:** `wireframe/cajero/CU-CAJA-01-apertura-turno/wireframe.md`
   - **Vistas Clave:** Arqueo inicial, conteo desglosado de billetes/monedas y bloqueo de operaciones hasta apertura oficial.
   - **Tablas BD Asociadas:** `turno_caja`, `movimiento_caja`.

---

### 🔵 Opción D: Flujos Complementarios de Autenticación
5. **`CU-AUTH-02`: Recuperar Contraseña con OTP**
   - **Ruta:** `/recuperar-password`
   - **Wireframe Canónico:** `wireframe/usuario/CU-AUTH-02-recuperar-password/wireframe.md`
   - **Vistas Clave:** Solicitud de correo, ingreso de código OTP de 6 dígitos con temporizador de expiración y cambio de clave.

---

## 5. Instrucciones para Continuar en Próximas Sesiones

Cuando el usuario solicite implementar un nuevo caso de uso:
1. Consultar este archivo (`ESTADO_CASOS_DE_USO_VISTAS.md`) para verificar el estado actual.
2. Leer la [`GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/implementacion/GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md) para respetar la paleta ÁUREA, el diseño responsive y el mapeo de DTOs con `02_schema_ddl.sql`.
3. Leer el `wireframe.md` correspondiente al caso de uso en la carpeta `wireframe/`.
4. Una vez implementada y verificada la vista con `npm run build`, actualizar este inventario marcando el CU como concluido.
