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
| **Salón & Mozo** | 8 | 1 | 7 | 13% |
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
- **Estado de Build:** ✅ Compilado y probado en vivo (`npm run build`).

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

Con **`CU-MOZO-01`** completado como centro de mando, las siguientes opciones de implementación son:

### 🟡 Opción A: Continuar el Circuito Operativo de Salón (Mozo)
1. **`CU-MOZO-02`: Tomar Pedido y Comanda Móvil en Salón**
   - **Ruta:** `/mozo/mesas/:mesaId/comanda` (en `TerminalLayout`)
   - **Wireframe Canónico:** `wireframe/mozo/CU-MOZO-02-tomar-pedido/wireframe.md`
   - **Vistas Clave:** Catálogo táctil de la carta (65%) + Ticket interactivo de comanda (35%), selector de rondas, modificadores de cocina (notas), y resolución de conflicto de stock agotado (409).
   - **Tablas BD Asociadas:** `pedido`, `pedido_item`, `producto`, `categoria_producto`.

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
