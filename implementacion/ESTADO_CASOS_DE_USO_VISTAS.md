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
| **Salón & Mozo** | 8 | 8 | 0 | **100% (Completo)** |
| **Cocina (KDS)** | 4 | 1 | 3 | **25%** |
| **Caja & Cobranza** | 5 | 0 | 5 | 0% |
| **Administración Local** | 16 | 4 | 12 | **25%** |
| **Propietario / Tenant** | 6 | 4 | 2 | **67%** |
| **SuperAdmin SaaS** | 3 | 1 | 2 | **33%** |

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

### 2.5 `CU-PROP-01`: Registrar Empresa y Suscribirse con Verificación OTP de Correo y Cobro según Plan
- **Ruta Activa:** `/registro` ([`PublicLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/PublicLayout.tsx))
- **Parámetros URL Soportados:** `?plan=1` (Starter S/ 99), `?plan=2` (Pro S/ 249), `?plan=3` (Enterprise S/ 499)
- **Componentes Creados:**
  - [`RegistroEmpresaPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/pages/RegistroEmpresaPage.tsx): Orquestador reactivo del flujo de autoservicio en 5 pasos con sincronización en `sessionStorage` y resolución de query params.
  - [`RegistroStepper.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/RegistroStepper.tsx): Barra de progreso dual (compacta para smartphones con barra de avance animada y horizontal con nodos e iconos para PC/tablet).
  - [`Paso1PlanSelector.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/Paso1PlanSelector.tsx): Selector de catálogo oficial con 3 tiers (Starter S/ 99, Pro S/ 249, Enterprise S/ 499), toggle mensual/anual y límites de mesas/locales/IA.
  - [`Paso2DatosEmpresa.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/Paso2DatosEmpresa.tsx): Formulario en 2 columnas (8 cols formulario / 4 cols resumen sticky) con selector de contribuyente (RUC 20 Jurídica vs RUC 10 Natural), validación de 11 dígitos, medidor de seguridad de contraseña y banner de conflicto 409 con enlace a login.
  - [`Paso3VerificacionOtp.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/Paso3VerificacionOtp.tsx): 6 casillas independientes con auto-focus, soporte de pegado (paste) directo de 6 dígitos, temporizador regresivo de 10 minutos, cooldown de reenvío de 60s y animación shake ante código incorrecto.
  - [`ModalModificarCorreo.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/ModalModificarCorreo.tsx): Modal asistido para subsanar errores tipográficos de email sin perder los datos de la empresa ni el plan seleccionado.
  - [`Paso4PagoStripe.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/Paso4PagoStripe.tsx): Checkout seguro Stripe Elements con resumen de compra que debita y desglosa el **monto exacto según el plan elegido**, prevención anti-doble clic y aviso de cifrado TLS.
  - [`Paso5RegistroExitoso.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/Paso5RegistroExitoso.tsx): Confirmación con check verde, resumen de empresa y próximo cobro, botón para descargar constancia oficial en PDF/TXT, canales directos de soporte 24/7 (WhatsApp y correo) y botón para ingresar al panel de control que activa la sesión de propietario.
  - [`DemoRegistroWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/registro/DemoRegistroWidget.tsx): Widget flotante interactivo para autollenar RUCs válidos (20 y 10), simular conflicto 409, autollenar OTP válido (529148), simular tarjeta rechazada 402, alternar planes para ver recálculo dinámico de cobro, y saltar de paso en 1 clic.
- **Servicios y DTOs:**
  - [`registroEmpresaService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/services/registroEmpresaService.ts): Servicio de onboarding con contratos `ApiResponse<T>`, catálogo canónico de `06_seed_initial_data.sql` y soporte de resiliencia F5.
  - [`src/types/registroEmpresa.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/registroEmpresa.ts): DTOs tipados estrictamente según `02_schema_ddl.sql` (tablas `plan`, `empresa`, `usuario`, `pago`).
- **Responsive:**
  - Desktop (`>= 1024px`): Layout 2 columnas 8/4 cols con resumen sticky de compra.
  - Tablet (`768px - 1023px`): Grid balanceado y touch targets >= 44px.
  - Mobile (`< 768px`): 1 columna vertical fluida ergonómica al pulgar.
- **Estado de Build:** ✅ Compilado con 0 errores TypeScript (`npm run build`).

---

### 2.6 `CU-PROP-04`: Registrar y Administrar Locales (Sedes) con Slugs Reactivos, Quota Plan Pro, Autogestión y Normalización Geográfica UBIGEO Perú
- **Ruta Activa:** `/propietario/sedes` ([`DashboardLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx))
- **Componentes Creados:**
  - [`PropietarioLocalesPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/pages/PropietarioLocalesPage.tsx): Orquestador corporativo de sedes, cambio de contexto de local activo en sesión y persistencia local, notificaciones Toast automáticas.
  - [`LocalesHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/locales/LocalesHeader.tsx): Barra de progreso de consumo de cuota del Plan Pro (2/3 sedes, 66% consumido) con rol `progressbar` y botón condicionado `[ + Registrar Nuevo Local ]` que se inhabilita al 100% de ocupación enlazando a `/propietario/suscripcion`.
  - [`LocalesTabla.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/locales/LocalesTabla.tsx): Tabla para PC (`>= 1024px`) y Cards táctiles para smartphones (`< 1024px`), con badge distintivo `[ 👑 Autogestionado ]` y botón directo `[ 🚀 Acceder a Sede ]` para cambiar al panel operativo de la sede (`/admin/dashboard`), dirección enriquecida con desglose geográfico `{distrito}, {provincia} ({departamento})`, enlace a carta digital pública, indicadores de capacidad (pisos y mesas) y menú de acciones.
  - [`ModalCrearLocal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/locales/ModalCrearLocal.tsx): Wizard guiado en 2 pasos:
    - *Paso 1:* Datos comerciales, dirección física, selector geográfico en cascada de 3 niveles (**Región/Departamento $\rightarrow$ Provincia $\rightarrow$ Distrito**) precargado por defecto en **Áncash > Santa > Chimbote** (`021801`), badge visual de código fiscal `[ 🇵🇪 UBIGEO: 021801 ]`, teléfono, generador predictivo reactivo de slug web (`slugify(nombre) + "-" + slugify(distrito)`) con botón `[ 🔍 Comprobar ]` y sugerencias de 1 clic ante colisión + selector de supervisión (Autogestionado vs Asignar Administrador existente).
    - *Paso 2:* Selector de 4 plantillas gastronómicas (`🍗 Pollería & Brasas`, `🐟 Cevichería & Mariscos`, `🥢 Chifa & Comida China`, `⚪ Totalmente en Blanco`) con aprovisionamiento atómico de Salón Principal (5x3 mesas), categorías de carta e insumos de inventario.
  - [`ModalEditarLocal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/locales/ModalEditarLocal.tsx): Edición en caliente de datos comerciales, dirección, cascada geográfica UBIGEO de 3 niveles con resolución inversa por código/nombre, teléfono, slug de carta digital y conmutador de autogestión vs administrador asignado.
  - [`ModalDesactivarLocal.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/locales/ModalDesactivarLocal.tsx): Auditoría operativa en tiempo real con **Bloqueo Duro**: si la sede tiene cajas abiertas o mesas activas en salón, inactiva el botón de baja detallando cajeros y mesas afectadas; si la sede está limpia de operaciones, despliega confirmación destructiva segura exigiendo digitar `DESACTIVAR`.
  - [`DemoLocalesWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/locales/DemoLocalesWidget.tsx): Widget flotante Sandbox QA en la esquina inferior derecha para alternar bloqueo duro, forzar cuota al 100% (3/3), alternar autogestión en San Isidro y restablecer semillas en 1 clic.
- **Normalización de Base de Datos y Dataset Geográfico:**
  - `restaurantcloud/infra/sql/02_schema_ddl.sql`: Tablas normalizadas `departamento` (`CHAR(2)`), `provincia` (`CHAR(4)`), `distrito` (`CHAR(6)` - estándar INEI/SUNAT) con claves foráneas en cascada. Tabla `local` enriquecida con `ubigeo_cod REFERENCES distrito(codigo)` y columnas desnormalizadas de lectura rápida $O(1)$ (`departamento`, `provincia`, `distrito`, `ciudad`, `referencia`).
  - `restaurantcloud/infra/sql/03_indexes.sql`: Índices optimizados `idx_provincia_departamento`, `idx_distrito_provincia` y `idx_local_ubigeo`.
  - `restaurantcloud/infra/sql/06_seed_initial_data.sql`: Semillas de los 25 departamentos del Perú, provincias estratégicas y distritos completos (Santa: Chimbote, Nuevo Chimbote, Coishco, Santa, etc.; Lima: Miraflores, San Isidro, etc.).
  - `restaurantcloud/infra/sql/07_seed_local_aurea_completo.sql`: Sincronización de seed canónica de ÁUREA Miraflores (`ubigeo_cod: 150122`).
  - `restaurantcloud/apps/api/database/migrations/2026_10_11_000002_create_plataforma_tables.php`: Migración Laravel sincronizada con tablas geográficas y columnas de `local`.
  - `src/data/peruUbigeo.ts`: Dataset frontend con utilitarios de búsqueda y constantes oficiales (`DEFAULT_DEPARTAMENTO_COD = '02'`, `DEFAULT_PROVINCIA_COD = '0218'`, `DEFAULT_DISTRITO_COD = '021801'`).
- **Servicios y DTOs:**
  - [`propietarioLocalesService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/services/propietarioLocalesService.ts): Endpoints simulados con soporte de UBIGEO (`ubigeo_cod`, `departamento`, `provincia`, `distrito`).
  - [`src/types/propietarioLocales.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/propietarioLocales.ts): DTOs auditados contra tablas `local`, `distrito`, `usuario`, `piso`, `mesa`, `caja`, `pedido`.
- **Responsive:**
  - Desktop (`>= 1024px`): Tabla densa completa con orden de columnas canónico de wireframe y desglose geográfico completo.
  - Móvil (`< 1024px`): Cards estructuradas con botones de acción grandes al pulgar.
- **Estado de Build:** ✅ Compilado con 0 errores TypeScript (`npm run build`).

---

### 2.7 `CU-PROP-05`: Crear y Gestionar Administradores de Local
- **Ruta Activa:** `/propietario/administradores` ([`DashboardLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx))
- **Componentes Creados:**
  - [`PropietarioAdministradoresPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/pages/PropietarioAdministradoresPage.tsx): Orquestador corporativo de personal administrativo, gestión de modales, toasts reactivos y recarga de datos.
  - [`AdminsHeader.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/AdminsHeader.tsx): Barra accesible de progreso `role="progressbar"` de consumo de cuota de personal (`plan.max_usuarios`: 8 de 15 cuentas activas en Plan Pro), con botón condicionado `[ + Invitar Nuevo Administrador ]` que se bloquea preventivamente al 100% enlazando a `/propietario/suscripcion`.
  - [`AdminsTabla.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/AdminsTabla.tsx): Tabla para PC (`>= 1024px`) y tarjetas táctiles para smartphones (`< 1024px`), con avatar de iniciales, insignia de sede titular asignada, estados semánticos (`[ ✓ Activo ]`, `[ ⏳ Invitación pendiente ]` con tiempo restante dinámico, `[ ⚠️ Invitación expirada ]` si superó 24h, `[ Inactivo ]`), último login y acciones contextuales (`[ Reasignar Sede ]`, `[ Desactivar ]`, `[ Reenviar ]`, `[ Cancelar ]`, `[ Ver Enlace ]`, `[ Reactivar ]`).
  - [`ModalInvitarAdmin.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/ModalInvitarAdmin.tsx): Modal de invitación segura con banner de impacto en cuota, formulario validado (nombre, email corporativo, teléfono opcional), dropdown con sedes disponibles vs sedes ocupadas (regla de negocio: 1 administrador titular por sede), tarjeta informativa de enlace temporal firmado por 24 horas y spinner de envío.
  - [`ModalReasignarSede.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/ModalReasignarSede.tsx): Modal de transferencia de sede titular (1:1) con selector de nueva sede y resumen de impacto (pérdida de acceso a sede anterior, pase de la sede anterior a autogestión directa del propietario, y asunción de la nueva sede en el próximo inicio de sesión).
  - [`ModalDesactivarAdmin.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/ModalDesactivarAdmin.tsx): Modal de confirmación destructiva segura con advertencia de revocación inmediata de sesiones JWT en Redis Blacklist y liberación del cupo de usuario.
  - [`ModalCopiarInvitacion.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/ModalCopiarInvitacion.tsx): Modal para copiar la URL de activación generada (`/activar-cuenta?token=...`), feedback visual de copiado y botón directo de compartir por WhatsApp para pruebas ágiles.
  - [`DemoAdminsWidget.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/administradores/DemoAdminsWidget.tsx): Widget flotante Sandbox QA en la esquina inferior derecha para alternar cupo lleno (15/15), simular invitación expirada (> 24h), simular conflicto de correo 409 y restablecer semillas canónicas de Áurea en 1 clic.
- **Servicios y DTOs:**
  - [`propietarioAdminsService.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/services/propietarioAdminsService.ts): Endpoints simulados (`GET /administradores`, `GET /formulario-datos`, `POST /administradores`, `POST /{id}/reenviar-invitacion`, `DELETE /{id}/invitacion`, `PATCH /{id}/reasignar-sede`, `PATCH /{id}/cambiar-estado`) con persistencia en `localStorage` sincronizada con las sedes de `CU-PROP-04`.
  - [`src/types/propietarioAdmins.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/propietarioAdmins.ts): DTOs rigurosamente tipados según `usuario`, `local`, `empresa` y `plan` de `02_schema_ddl.sql`. Cero datos inventados.
- **Responsive:** Soporte completo para Desktop (`1440x900`), Tablet (`768x1024`) y Smartphone (`375x812`), con áreas de toque $\ge 44\text{px}$.
- **Estado de Build:** ✅ Compilado con 0 errores TypeScript (`npm run build`).

---

### 2.8 `CU-PROP-02`: Gestionar Suscripción y Método de Pago (Stripe Billing, Dunning, Facturas y Cuotas en Tiempo Real)
- **Ruta Activa:** `/propietario/suscripcion` ([`DashboardLayout.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx))
- **Componentes Creados:**
  - [`PropietarioSuscripcionPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/pages/PropietarioSuscripcionPage.tsx): Orquestador principal de la consola de facturación y suscripción del propietario.
  - [`SuscripcionHeader.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/SuscripcionHeader.tsx): Cabecera corporativa con migas de pan (`Configuración > Facturación > Suscripción`), título jerárquico, insignia de estado de suscripción (`Activa y al Día`, `En Periodo de Gracia`, `Suspendida`) y botones de acción rápida.
  - [`DunningBannerAlerta.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/DunningBannerAlerta.tsx): Banner de alerta condicional para fallos de cobro con temporizador regresivo de 5 días de gracia no bloqueantes para la cocina/salón, mensaje bancario del emisor y CTA directo de regularización inmediata.
  - [`PlanActualCard.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/PlanActualCard.tsx): Tarjeta de resumen de Plan Pro (`S/ 249.00 / mes`), fecha de próximo cobro, medidores reactivos de consumo de recursos en tiempo real (locales 2/3, mesas 26/30, personal 8/15) sincronizados con los módulos de locales y personal, y desglose de capacidades gastronómicas habilitadas.
  - [`MetodoPagoCard.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/MetodoPagoCard.tsx): Representación de tarjeta de crédito en degradé con chip, marca (`Visa`), numeración enmascarada (`•••• 4242`), fecha de expiración, titular, advertencia si vence en menos de 30 días y nota de seguridad PCI-DSS Nivel 1.
  - [`HistorialFacturasTabla.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/HistorialFacturasTabla.tsx): Tabla para escritorio y tarjetas táctiles para móviles con el historial de comprobantes de pago de la suscripción, estado de cobro y botón para descargar el comprobante tributario oficial en formato electrónico PDF/TXT.
  - [`ModalActualizarTarjeta.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/ModalActualizarTarjeta.tsx): Modal con formulario simulado de Stripe Elements, formateo automático de 16 dígitos, expiración MM/AA, CVC encriptado, detección de franquicia bancaria y regularización automática de cobros pendientes sin fricciones.
  - [`ModalCambiarPlanPreview.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/ModalCambiarPlanPreview.tsx): Modal comparativo de planes SaaS (`Starter S/ 99`, `Pro S/ 249`, `Enterprise S/ 499`) con detalle de límites de locales, mesas y personal, indicación de plan actual y explicación del cálculo prorrateado automático en Stripe (`CU-PROP-03`).
  - [`DemoSuscripcionWidget.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/components/suscripcion/DemoSuscripcionWidget.tsx): Widget flotante Sandbox QA para simular cobro fallido (Dunning), tarjeta próxima a vencer, suspensión de cuenta y restablecer a Plan Pro en 1 clic.
- **Servicios y DTOs:**
  - [`propietarioSuscripcionService.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/propietario/services/propietarioSuscripcionService.ts): Endpoints simulados (`getDashboardSuscripcion`, `solicitarSetupTarjeta`, `confirmarTarjeta`, `descargarFactura`, simuladores QA) con cálculo dinámico de recursos reales desde `localStorage`.
  - [`src/types/propietarioSuscripcion.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/propietarioSuscripcion.ts): DTOs rigurosamente tipados según `suscripcion`, `pago`, `empresa` y `plan` de `02_schema_ddl.sql`. Cero datos inventados.
- **Responsive:** Soporte completo para Desktop (`1440x900`), Tablet (`768x1024`) y Smartphone (`375x812`), con áreas de toque $\ge 44\text{px}$.
- **Estado de Build:** ✅ Compilado con 0 errores TypeScript (`npm run build`).

---

### 2.9 `CU-MOZO-01`: Ver Estado de Mesas y Centro de Comandas en Vivo (Hub de Salón)
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

### 2.11 `CU-MOZO-05`: Gestionar Reservas y Recepción en Salón
- **Ruta Activa:** `/mozo/reservas` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx)) e integración bidireccional en `/mozo/mesas`.
- **Componentes Creados:**
  - [`MozoReservasPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/pages/MozoReservasPage.tsx): Orquestador reactivo de la bandeja de reservas con gestión de turnos, navegación de fechas y actualización en vivo vía SSE.
  - [`ReservasHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ReservasHeader.tsx): Barra de contexto con selector de fecha diario (`[ < Hoy, 09 Octubre 2026 > ]`), conmutador de turno (`[● Almuerzo]` / `[ Cena ]`), indicador SSE `(•) SSE Conectado`, enlace a salón y botón `[ + Nueva Reserva ]` (touch target 48px).
  - [`ReservasKPICards.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ReservasKPICards.tsx): 4 Tarjetas de resumen de turno con métricas claras en español: *Reservas de Hoy*, *Próximas en 1 Hora*, *Comensales Atendidos* e *Inasistencias del Día*.
  - [`ReservasFiltrosPills.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ReservasFiltrosPills.tsx): Píldoras táctiles con contadores dinámicos (*Todas*, *Confirmadas / En Espera*, *Atendidas*, *Inasistencias / Canceladas*).
  - [`ReservasTable.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ReservasTable.tsx): Tabla cronológica de citas con badges de anticipación en vivo (`⏱️ En 20 min`), enlace a llamada y WhatsApp directo (`wa.me`), PAX, mesa asignada (individual o unida `Mesa [ 02 ; 03 ]`), estado operativo y acciones rápidas (`[✓ Sentar]`, `[ Ficha ]`, `[ 💬 WA ]`).
  - [`ModalNuevaReserva.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ModalNuevaReserva.tsx): Modal táctil de 760px en 3 pasos: Parámetros del turno (fecha, chips de hora y stepper PAX), **Mini-Mapa Espacial de Salón 5x2** (topología fiel, bloqueo reactivo de solapamientos horarios y soporte de selección unida), y ficha de contacto del comensal.
  - [`ModalFichaReserva.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ModalFichaReserva.tsx): Modal táctil de 560px con **reloj dinámico de tolerancia y cortesía (15 min)**, conmutador de simulación de cortesía, acción primaria `[ ✓ Sentar Comensales y Abrir Pedido ]` (transita a atendida, ocupa mesa y abre comanda en `CU-MOZO-02`), y botón `[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]` que registra inasistencia y libera la mesa a verde `LIBRE` inmediatamente en < 25ms.
  - [`ModalSobreasignacionAlerta.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ModalSobreasignacionAlerta.tsx): Modal de 540px ante conflicto de ocupación casual preventiva (< 30 min) con 3 opciones asistidas (*Reasignar reserva a Mesa 05*, *Consumo rápido express* o *Cancelar y elegir otra mesa*).
  - [`ModalPaywallReservas.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/ModalPaywallReservas.tsx): Modal didáctico de 520px para cuentas en plan Starter explicando beneficios Pro/Enterprise sin dead-ends.
  - [`DemoReservasWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/reservas/DemoReservasWidget.tsx): Widget flotante para simular eventos SSE (`reserva_creada`, `mesa_bloqueada_reserva`), alternar entre Plan Pro y Starter, y probar estados frontera.
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `obtenerPoliticasReserva`, `obtenerReservas`, `obtenerMesasDisponiblesReserva`, `crearReserva`, `sentarReserva`, `registrarNoShow`, `cancelarReserva`, `reasignarMesaReserva`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `EstadoReserva`, `PoliticasReservaDTO`, `ReservaCardDTO`, `MesaDisponibleReservaDTO`, `MesasDisponiblesResponseDTO`, `CrearReservaRequestDTO`, `SentarReservaResponseDTO`, `RegistrarNoShowRequestDTO`, `CancelarReservaRequestDTO`, `ReasignarMesaReservaRequestDTO`.
- **Integración en Salón:** Botón `[ 📅 Reservas (8) ]` en `SalonHeaderMozo.tsx`, clic en mesa bloqueada `Mesa 08` abre `ModalFichaReserva`, y botón directo en `DemoMozoWidget.tsx`.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.12 `CU-MOZO-07`: Atender Incidencia de Plato No Disponible y Resolver en Mesa
- **Ruta Activa:** `/mozo/mesas` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx)).
- **Componentes Creados:**
  - [`BannerIncidenciaCocina.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/quiebre/BannerIncidenciaCocina.tsx): Banner superior táctil con fondo ámbar (`border-amber-500/40`), aviso claro de quiebre de stock en estación caliente para Mesa 04 ("Lomo Saltado Criollo"), tiempo transcurrido, botón de acción rápida `[ Resolver en Mesa 04 ]` y cierre manual.
  - [`ModalResolucionIncidencia.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/quiebre/ModalResolucionIncidencia.tsx): Modal de decisión asistida en mesa (620px) con dos opciones directas:
    - **Opción A (Recomendada):** Sustituir plato en la carta con cálculo diferencial de precio (+S/, -S/, S/ 0) y envío con máxima prioridad a KDS.
    - **Opción B:** Anular plato sin costo para el cliente (descuento de S/ 38.00, sin merma imputable y aviso a administración).
  - [`ModalSustitucionCarta.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/quiebre/ModalSustitucionCarta.tsx): Modal de sustitución universal (760px) con botón de retorno `[ ← Volver a Opciones ]`, buscador en tiempo real por ingrediente, chips de familias de carta, **6 Sugerencias Inteligentes calculadas por afinidad y cercanía matemática de precio (`ABS(precio - S/ 38.00)`)**, badges de diferencial, selector de notas para cocina y **Sticky Box inferior de impacto** con confirmación a cocina.
  - [`ModalAnulacionQuiebre.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/quiebre/ModalAnulacionQuiebre.tsx): Modal de anulación por quiebre (580px) con recálculo contable (de S/ 158.00 a S/ 120.00), garantía de auditoría inmutable (`es_merma = false`, no imputable al mozo) y notificación a Administrador de Sede (`CU-ADMIN-12`).
  - [`MesaCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaCard.tsx): Borde ámbar parpadeante y badge prominente `[ ⚠️ QUIEBRE COCINA ]` en la tarjeta de Mesa 04 en salón.
  - [`MesaInspeccionDrawer.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/MesaInspeccionDrawer.tsx): Card del plato observado con badge `[ ⚠️ QUIEBRE ]` y bloque táctico de botones directos `[ 🔄 Sustituir ]` y `[ ✕ Anular ]`.
  - [`DemoMozoWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/components/DemoMozoWidget.tsx): Botón `[ ⚠️ Simular Quiebre Cocina (CU-MOZO-07) ]` para conmutar el evento reactivo SSE y restaurar stock.
- **Servicios y DTOs:**
  - [`mockMozoService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/mozo/services/mockMozoService.ts): `obtenerCatalogoSustitucion`, `sustituirPlato`, `anularPorQuiebreCocina`, `simularQuiebreCocinaMesa04`.
  - [`src/types/mozo.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/mozo.ts): `PlatoSustitutoSugeridoDTO`, `CategoriaChipDTO`, `CatalogoSustitucionResponseDTO`, `SustituirPlatoRequestDTO`, `SustituirPlatoResponseDTO`, `AnularPorQuiebreRequestDTO`, `AnularPorQuiebreResponseDTO`.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.13 `CU-COCINA-01`: Ver Cola de Pedidos Entrantes (Kitchen Display System - KDS)
- **Ruta Activa:** `/cocina/kds` ([`TerminalLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx))
- **Componentes Creados:**
  - [`CocinaKdsPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/pages/CocinaKdsPage.tsx): Orquestador central del monitor KDS con sincronización SSE reactiva, temporizador segundo a segundo de avance de semáforo, conmutador de vistas y sintetizador acústico Web Audio API.
  - [`KdsHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/components/kds/KdsHeader.tsx): Cabecera industrial KDS (`#0B1120`) con reloj digital de alta precisión, estado SSE en vivo, conmutador de sonido (Chime ON/Mute), alternador de vista (`⊞ Comandas FIFO` vs `☰ Consolidado All-Day`), selector dinámico por categorías reales de carta (`categoria_producto.nombre`) y barra de métricas operativas con umbrales configurados por sede (`configuracion_kds`).
  - [`KdsTicketCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/components/kds/KdsTicketCard.tsx): Tarjeta de comanda FIFO con semáforo dinámico adaptativo (🟢 Verde $\le 15$m, 🟡 Ámbar $16$-$25$m, 🔴 Rojo crítico $>25$m con banner pulsante `🚨 REQUERIDO FOGÓN INMEDIATO`), soporte para mesas individuales y unidas (`🔗 Mesa [ 02 ; 03 ]`), rondas de salón (`Ronda 1` vs `Ronda 2 Adic`), botones táctiles de cambio de estado (`[ 🔥 Iniciar / En Fuego ]` $\rightarrow$ `[ ✓ Marcar Listo ]`), ventana de reversión de 30s (`[ ↩ Deshacer ]`), chip de bebidas atendidas por salón y botón de despacho masivo `[ ✓ Despachar Todo al Pase ]`.
  - [`ModalDetalleComanda.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/components/kds/ModalDetalleComanda.tsx): Ficha técnica ampliada de comanda (680px, Vista 2) con trazabilidad de receta culinaria e insumos descontados en almacén (`receta_resumen` de `producto_insumo` + `insumo`), resaltado de notas de alérgenos y botón de despacho masivo directo hacia el pase caliente.
  - [`ModalAlertaParadaFogones.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/components/kds/ModalAlertaParadaFogones.tsx): Modal de alta prioridad (620px, Vista 3) disparado por evento SSE `item_pedido_anulado` originado en salón (`CU-MOZO-06`/`CU-MOZO-07`), con borde rojo parpadeante `#EF4444`, audio de detención, plato tachado con badge `ANULADO`, justificación obligatoria y acuse táctil para evitar merma (`es_merma = false`).
  - [`ConsolidadoAllDayView.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/components/kds/ConsolidadoAllDayView.tsx): Vista consolidada de producción en vivo ("All-Day Summary", Vista 4) agrupada en columnas por las categorías reales de la carta gastronómica (`categoria_producto.nombre`), acumulando raciones idénticas de múltiples mesas para cocción por tandas masivas en wok/horno.
  - [`DemoKdsWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/components/kds/DemoKdsWidget.tsx): Widget flotante interactivo en esquina inferior para simular en 1 clic: *Inyectar comanda de mozo (Mesa 05 con chime)*, *Simular Parada de Fogones SSE*, *Acelerar tiempos (+10m ámbar, +20m rojo)*, *Alternar a estado vacío ("¡Fogones al día!")* y *Simular desconexión/reconexión SSE*.
- **Servicios y DTOs:**
  - [`mockCocinaService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/cocina/services/mockCocinaService.ts): Simulación de endpoints canónicos (`GET /comandas`, `PATCH /items/:id/estado`, `POST /comandas/:id/despachar-todo`, `GET /consolidado-all-day`) con contratos `ApiResponse<T>`.
  - [`src/types/cocina.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/cocina.ts): DTOs auditados 1:1 contra `02_schema_ddl.sql` (`KDSComandaDTO`, `KDSItemDTO`, `ConsolidadoAllDayDTO`, `ConfiguracionKDSDTO`, `ItemAnuladoSSEEvent`).
- **Responsive:** Touch targets $\ge 44$px a $48$px, layout adaptado a monitores industriales de cocina `1440x900`, tablets y smartphones.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.14 `CU-ADMIN-01`: Gestionar Plano de Mesas y Ambientes
- **Ruta Activa:** `/admin/plano-mesas` ([`DashboardLayout.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx))
- **Componentes Creados:**
  - [`AdminPlanoMesasPage.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/pages/AdminPlanoMesasPage.tsx): Orquestador reactivo del salón administrativo con gestión de los 5 estados UX (Skeleton, Loaded, Empty State, Error y Conflicto 409).
  - [`PlanoHeader.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/PlanoHeader.tsx): Cabecera con título *DM Serif Display*, subtítulo de sede y 3 tarjetas KPI: Mesas Activas en Local (17), Capacidad Total Sentados (68 pax aforo) y Cupo del Plan Pro (`17 / 30 mesas en uso`, `13 disponibles`) con barra de progreso. Botones de acción `[ + Mesa Individual ]` y `[ + Nuevo Ambiente ]` (el generador en lote se ubica exclusivamente en el salón vacío).
  - [`PisosTabs.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/PisosTabs.tsx): Pestañas horizontales de ambientes (*Salón Principal (10)*, *Terraza Exterior (4)*, *Barra Bar (3)*) con botón de configuración de ambiente `(⚙️)` en la pestaña activa y controles de cuadrícula en vivo (`[ + / - Columna ]` y `[ + / - Fila ]`).
  - [`PlanoCuadriculaGrid.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/PlanoCuadriculaGrid.tsx): Matriz visual interactiva que posiciona cada mesa en su celda `(x, y)` según su forma geométrica (`cuadrada`, `redonda`, `rectangular`), con slots vacíos accionables en 1 clic para agregar mesas directamente en esa posición sin teclear coordenadas.
  - [`MesaAdminCard.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/MesaAdminCard.tsx): Tarjeta de mesa con diferenciación visual de forma, badge de capacidad (`👤 4 pers.`), distintivo de unión grupal `🔗`, indicador de estado `Libre` (verde) u `Ocupada` (con código de comanda activa) y botón de edición.
  - [`ModalGeneradorLote.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/ModalGeneradorLote.tsx): Asistente Wizard en lote (Vista 2) con sliders interactivos de columnas (1..8) y filas (1..6), cálculo en vivo (`X col × Y filas = Z Mesas`), selector de correlativo y comprobación preventiva de cuota contra `plan.max_mesas`, con contexto automático del salón activo sin dropdown redundante.
  - [`DrawerEditarMesa.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/DrawerEditarMesa.tsx): Quick-Drawer lateral deslizable de 440px (Vista 3) para modificar número, capacidad con steppers táctiles `[-]` y `[+]`, forma visual, unión grupal y acción de baja no destructiva con control de bloqueo.
  - [`ModalMesaIndividual.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/ModalMesaIndividual.tsx): Modal de alta de mesa (Vista 4) con contexto fijo de salón, sugerencia de correlativo y **Mini-Mapa Espacial Interactivo** con controles de cuadrícula duales (`Col: -/+`, `Fil: -/+`) para elegir la casilla exacta visualmente.
  - [`ModalEditarPiso.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/ModalEditarPiso.tsx): Diálogo para renombrar ambiente (validando unicidad) y Zona de Peligro para baja protegida (bloqueo 409 `ERR_PISO_CON_MESAS_ACTIVAS` y protección de piso mínimo en sede).
  - [`ModalNuevoPiso.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/ModalNuevoPiso.tsx): Diálogo para registrar nuevos ambientes físicos con verificación de cuota (`plan.max_pisos`).
  - [`ModalBloqueoDesactivacion.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/ModalBloqueoDesactivacion.tsx): Diálogo de Bloqueo Duro ante error `409 Conflict` (`ERR_MESA_CON_PEDIDOS_ACTIVOS`) cuando una mesa tiene comanda abierta (`COM-0104`), informando consumo acumulado y enlace directo al salón.
  - [`OnboardingPisoVacio.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/OnboardingPisoVacio.tsx): Vista ilustrativa de bienvenida (Vista 5) con doble camino asistido (*Asistente Rápido* vs *Creación Individual*).
  - [`DemoAdminPlanoWidget.tsx`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/plano/DemoAdminPlanoWidget.tsx): Widget flotante para alternar entre escenarios de prueba en 1 clic (*Semillas Normales*, *Cuota Llena 30/30*, *Salón Vacío*, *Bloqueo 409 Mesa 04*, *Error de Red*).
- **Servicios y DTOs:**
  - [`mockAdminService.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/services/mockAdminService.ts): Servicio con contratos `ApiResponse<T>` precargado con el escenario canónico local (`07_seed_local_aurea_completo.sql`), incluyendo `actualizarNombrePiso` y `desactivarPiso`.
  - [`src/types/admin.ts`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/admin.ts): DTOs rigurosamente auditados contra `piso`, `mesa` y `plan` de PostgreSQL 16. Cero datos inventados.

- **Responsive:** Layout fluido en Desktop `>= 1024px`, Tablet `768px - 1023px` y Smartphone `< 768px` con touch targets $\ge 44\text{px}$.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.15 `CU-ADMIN-02`: Gestionar Categorías de la Carta
- **Rutas Activas:**
  - `/admin/categorias` (Ruta canónica del caso de uso)
  - `/admin/carta` (Alias directo en navegación del menú lateral)
- **Layout:** [`DashboardLayout.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx)
- **Componentes Creados:**
  - [`AdminCategoriasPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/pages/AdminCategoriasPage.tsx): Orquestador reactivo de categorías con soporte para los 5 estados UX (Skeleton, Loaded, Empty State, Error con reintento y Bloqueo Relacional 409).
  - [`CategoriasHeader.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/CategoriasHeader.tsx): Cabecera con migas de pan, badge de sede activa y 4 tarjetas de métricas en tiempo real (*Total Secciones*, *Visibles en Salón*, *Platos en Carta* y *Mayor Volumen*), con botones de acción `[ + Nueva Categoría ]` y `[ Plantillas Rápidas ]`.
  - [`CategoriasFiltrosTabs.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/CategoriasFiltrosTabs.tsx): Pestañas de filtrado (*Todas*, *Visibles en Salón*, *Ocultas*) con badges numéricos, buscador reactivo en tiempo real y nota ergonómica sobre el orden de comandas para mozos (`CU-MOZO-01`).
  - [`CategoriasTable.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/CategoriasTable.tsx): Presentación dual (Tabla en Desktop/Tablet y Cards táctiles en Móvil) con controles híbridos de reordenamiento (icono de arrastre `≡` + botones táctiles accesibles `[ ↑ / ↓ ]`), switches directos de visibilidad salón/QR, chips de conteo de platos y acciones rápidas de edición y baja.
  - [`ModalCrearEditarCategoria.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/ModalCrearEditarCategoria.tsx): Modal de alta/edición con validación de nombre (2 a 60 chars), contador numérico de caracteres, switch de visibilidad y **Componente WYSIWYG "Vista Previa Pestaña Mozo"** que ilustra en tiempo real cómo verá el personal de sala la pestaña en la comanda móvil (`CU-MOZO-01`).
  - [`ModalBloqueoReasignacion.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/ModalBloqueoReasignacion.tsx): Asistente interactivo de resolución de conflicto `409 Conflict` (`ERR_CATEGORIA_CON_PRODUCTOS`) con soporte para selección individual por checkboxes, control maestro *"Seleccionar todos (X de N)"*, spinner de carga animado y reasignación parcial iterativa (donde tras cada transferencia únicamente permanecen en pantalla los platos que aún continúan asociados a la categoría) hasta la eliminación definitiva sin dejar datos huérfanos.
  - [`ModalCargarPlantilla.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/ModalCargarPlantilla.tsx): Catálogo de plantillas gastronómicas peruanas preconfiguradas (*Pollería*, *Cevichería*, *Chifa*, *Criollo*, *Cafetería*) con opción de anexado no destructivo o reemplazo con reasignación asistida.
  - [`OnboardingCategoriasVacia.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/OnboardingCategoriasVacia.tsx): Estado vacío inicial (0 categorías) con diseño Áurea que orienta al administrador con beneficios clave y doble llamado a la acción (`[ + Crear Primera Categoría ]` vs `[ Usar Plantilla Peruana ]`).
  - [`DemoAdminCategoriasWidget.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/categorias/DemoAdminCategoriasWidget.tsx): Widget flotante para alternar entre escenarios QA de prueba en 1 clic (*Probar Onboarding vacío*, *Simular Bloqueo 409 con platos*, *Simular Error de Red* y *Restablecer Semillas Miraflores*).
- **Servicios y DTOs:**
  - [`mockAdminService.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/services/mockAdminService.ts): Implementación de métodos para categorías (`obtenerCategorias`, `crearCategoria`, `actualizarCategoria`, `conmutarVisibilidadCategoria`, `reordenarCategorias`, `eliminarCategoria` con chequeo estricto 409, `reasignarYEliminarCategoria` y `cargarPlantillaGastronomica`), precargado con el catálogo canónico de Miraflores (`07_seed_local_aurea_completo.sql`).
  - [`src/types/admin.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/admin.ts): DTOs auditados 1:1 contra `categoria_producto` y `producto` de PostgreSQL 16 (`CategoriaAdminDTO`, `CategoriasAdminResponseDTO`, `ResumenCategoriasDTO`, `CrearCategoriaRequest`, `ActualizarCategoriaRequest`, `ReordenarCategoriasRequest`, `ReasignarYEliminarCategoriaRequest`, `CargarPlantillaCategoriasRequest`, `ConflictoCategoriaConProductosDTO`). Cero campos inventados.
- **Responsive:** Soporte nativo para Desktop (`1440x900`), Tablet POS (`768x1024`) y Smartphone (`375x812`), con áreas táctiles $\ge 44\text{px}$.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.16 `CU-ADMIN-03`: Gestionar Catálogo de Insumos de Inventario
- **Ruta Activa:** `/admin/inventario` ([`DashboardLayout.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx))
- **Componentes Creados:**
  - [`AdminInsumosPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/pages/AdminInsumosPage.tsx): Orquestador reactivo de inventario con filtro inicial por defecto en `activo`, notificaciones toast contextuales, gestión de existencias y modales.
  - [`InsumosHeader.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/InsumosHeader.tsx): Cabecera corporativa Áurea con migas de pan, badge de sede Miraflores, métricas KPI en tiempo real (*Total Insumos Activos*, *En Quiebre / Agotados* y *Valorización Estimada en Soles S/*) y botón de acción directa `[ + Nuevo Insumo ]`.
  - [`InsumosToolbar.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/InsumosToolbar.tsx): Selector de píldoras de estado (*Activos*, *Agotados*, *Inactivos*, *Todos*) con badge de recuento numérico y buscador omnicanal con debounce de 300ms y botón de borrado inmediato.
  - [`InsumosTable.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/InsumosTable.tsx): Presentación dual (Tabla desktop y tarjetas táctiles mobile) con semáforo cromático de stock en 4 niveles (🟢 Óptimo, 🟡 Reposición, 🔴 Crítico, ⚫ Sin Stock), barra porcentual de umbral mínimo, badges de unidad de almacén (Base vs Empaque), popovers interactivos de recetas dependientes con alerta de bloqueo de carta y botón de auditoría `[ Ajustar Stock ]`.
  - [`ModalCrearEditarInsumo.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/ModalCrearEditarInsumo.tsx): Modal de alta rápida (&lt; 8 segundos) con selector táctil del catálogo universal de 10 unidades (`kg`, `L`, `und`, `saco`, `botella`, `lata`, `caja`, `paquete`, `bidon`, `jaba`), inputs de existencias iniciales, umbral mínimo y costo unitario referencial, y banner formativo de rendimiento en recetas (`CU-ADMIN-04`).
  - [`ModalAjustarStock.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/ModalAjustarStock.tsx): Modal de recuento físico y merma con cálculo de discrepancia en tiempo real (`diferencia = nuevo - anterior`), selector obligatorio de motivos auditables (`conteo_fisico_inventario`, `merma_desperdicio`, `ingreso_manual`, `vencimiento_caducidad`, `rotura_accidente`, `inconsistencia_cocina`), notas y alerta de quiebre operativo atómico (`stock = 0`) sincronizado con KDS y Mozo (`CU-COCINA-04` $\leftrightarrow$ `CU-MOZO-01`).
  - [`OnboardingInsumosVacio.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/OnboardingInsumosVacio.tsx): Estado vacío guiado para sedes nuevas con despensa en blanco, ilustrando los 3 pilares de valor (*Alta ágil &lt; 8s*, *10 unidades universales* y *Protección total de cocina y salón*).
  - [`DemoAdminInsumosWidget.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/inventario/DemoAdminInsumosWidget.tsx): Widget flotante para QA con botones para simular quiebres de limón o lomo fino (stock 0), reposición de inventario, vaciado de despensa y restablecimiento de semillas canónicas de Miraflores.
- **Servicios y DTOs:**
  - [`mockAdminService.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/services/mockAdminService.ts): Métodos `obtenerInsumos`, `crearInsumo`, `actualizarInsumo`, `ajustarStockInsumo` (con inserción en `auditoria_stock_ajuste`), `conmutarEstadoInsumo`, `obtenerAuditoriaAjustes` y semillas canónicas de Miraflores (`07_seed_local_aurea_completo.sql`).
  - [`src/types/admin.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/admin.ts): DTOs verificados contra `insumo`, `auditoria_stock_ajuste` y `producto_insumo` de PostgreSQL 16 (`InsumoAdminDTO`, `AuditoriaStockAjusteDTO`, `ResumenInventarioDTO`, `InsumosAdminResponseDTO`, `CrearInsumoRequest`, `ActualizarInsumoRequest`, `AjustarStockInsumoRequest`, `ConmutarEstadoInsumoRequest`, `AjusteStockResultDTO`).
- **Responsive:** Soporte completo para Desktop (`1440x900`), Tablet (`768x1024`) y Smartphone (`375x812`), con objetivos táctiles $\ge 44\text{px}$.
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.17 `CU-ADMIN-04`: Gestionar Productos de la Carta y Recetas
- **Ruta Activa:** `/admin/carta` ([`DashboardLayout.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx))
- **Componentes Creados:**
  - [`AdminProductosPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/pages/AdminProductosPage.tsx): Orquestador reactivo del catálogo comercial de carta con soporte para filtros por categoría, disponibilidad, búsqueda por texto, paginación, modales y drawers.
  - [`ProductosHeader.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/ProductosHeader.tsx): Cabecera con migas de pan corporativas, badge de sede activa Miraflores y botón directo `[ + Nuevo Producto ]`.
  - [`ProductosKpis.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/ProductosKpis.tsx): 4 tarjetas KPI en tiempo real: *Total Platos Carta*, *Disponibles Salón*, *Agotados por Quiebre* y *Margen Bruto Promedio %*.
  - [`ProductosToolbar.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/ProductosToolbar.tsx): Buscador explícito con botón `[ Buscar ]`, tecla `Enter` y botón de limpieza `✕` (cero over-fetching), filtro segmentado de disponibilidad (*Todos*, *Disponibles*, *Agotados*) y pestañas horizontales de categorías con conteo numérico de platos.
  - [`ProductosTable.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/ProductosTable.tsx): Grilla comercial completa con precio de venta, costo teórico de ingredientes, cálculo semafórico de margen bruto (verde >65%, ámbar 50-65%, rojo <50%) con mini-barra de progreso, badges de destino operativo (*Cocina KDS* vs *Directo Salón*), conmutador interactivo de disponibilidad, botón `[ Ver Receta ]` hacia Quick-Drawer, `[ Editar ]`, `[ Archivar ]` no destructivo, banner inferior de protección de auditoría y paginador interactivo (10, 20, 50 por página con selector de rango).
  - [`ModalCrearEditarProducto.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/ModalCrearEditarProducto.tsx): Modal en 2 pasos: *Paso 1: Datos Comerciales* (Categoría obligatoria con enlace bloqueante a `CU-ADMIN-02`, nombre único, precio > 0, destino operativo) y *Paso 2: Receta e Insumos (Motor Dual)* con selector de modo (*[ Rinde por Lote ]* vs *[ Cantidad Directa ]*), y barra inferior en tiempo real `LiveProfitabilityBar` con precio, costo, utilidad y margen bruto %.
  - [`DrawerCalibrarReceta.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/DrawerCalibrarReceta.tsx): Quick-Drawer lateral deslizable con tarjeta *Pantry Bottleneck Card* (Simulador de Capacidad en Bodega que proyecta raciones máximas antes de quiebre y destaca el insumo cuello de botella limitante) y editor ágil de dosificación y rendimientos sin recargar.
  - [`OnboardingCartaVacia.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/OnboardingCartaVacia.tsx): Estado vacío guiado para locales en blanco orientando la secuencia: Categoría (`CU-ADMIN-02`) $\rightarrow$ Insumos (`CU-ADMIN-03`) $\rightarrow$ Platos y Recetas Duales (`CU-ADMIN-04`).
  - [`DemoAdminProductosWidget.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/components/carta/DemoAdminProductosWidget.tsx): Widget flotante para QA con botones para simular quiebre de limón (stock 0 con pase automático de Ceviche y Causa a Agotado), reposición con 10 kg, simular carta vacía y restablecer semillas canónicas de Áurea.
- **Servicios y DTOs:**
  - [`mockAdminService.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/admin/services/mockAdminService.ts): Métodos `obtenerProductos`, `obtenerProductoPorId`, `crearProducto`, `actualizarProducto`, `actualizarReceta`, `conmutarDisponibilidadProducto`, `archivarProducto` (`activo = false`) y `simularCapacidadBodega`.
  - [`src/types/admin.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/admin.ts): DTOs auditados 1:1 contra `producto` y `producto_insumo` de PostgreSQL 16 (`ProductoAdminDTO`, `ItemRecetaDTO`, `KpisCartaDTO`, `ListarProductosResponseDTO`, `CrearProductoRequest`, `ActualizarRecetaRequest`, `SimulacionCapacidadDTO`).
- **Responsive:** Touch targets $\ge 44\text{px}$, adaptado a Desktop (`1440x900`), Tablet (`768x1024`) y Mobile (`375x812`).
- **Estado de Build:** ✅ Compilado y probado en producción con 0 errores (`npm run build`).

---

### 2.10 `CU-SAAS-01`: Supervisar Empresas Registradas, Activaciones y Renovaciones de Suscripción (Consola Global Admin SaaS)
- **Rutas Activas:**
  - `/saas/tenants` ([`DashboardLayout.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx)): Bandeja general de supervisión, KPIs y filtrado.
  - `/saas/tenants/nuevo` ([`DashboardLayout.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx)): Página dedicada de **Onboarding Corporativo B2B** (`max-w-7xl`, layout 2 columnas maestro-detalle 8 cols / 4 cols sticky) según `GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md`.
- **Componentes Creados:**
  - [`SaasTenantsPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/pages/SaasTenantsPage.tsx): Orquestador principal de la consola de supervisión global de tenants que gestiona los 5 estados UX (Loading, Loaded, Empty State, Error de red, Conflicto) y apertura automática de expediente vía query params (`?expediente=`).
  - [`SaasTenantOnboardingPage.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/pages/SaasTenantOnboardingPage.tsx): Orquestador de la página de alta B2B en 4 pasos guiados + pantalla de éxito, soporte de resiliencia F5 (`sessionStorage`), recálculo automático de bonificación anual y soporte de prellenado QA (`?demo=true`).
  - [`OnboardingStepper.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/OnboardingStepper.tsx): Barra de progreso dual (horizontal con iconos para desktop/tablet y barra compacta de progreso con texto para smartphones).
  - [`Paso1EmpresaRuc.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/Paso1EmpresaRuc.tsx): Validación sintáctica local **Módulo 11** en tiempo real (cero llamadas a APIs externas), deducción automática de clasificación (RUC 20 Jurídica vs RUC 10 Natural), Razón Social y Sede Principal obligatoria.
  - [`Paso2TitularPropietario.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/Paso2TitularPropietario.tsx): Datos de contacto del titular y nota explicativa del capability token efímero de 72h para fijar credenciales.
  - [`Paso3PlanSaaS.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/Paso3PlanSaaS.tsx): Selector interactivo de los 3 planes oficiales (Starter S/ 99, Pro S/ 249, Enterprise S/ 499), conmutador mensual/anual con 2 meses gratis y fechas de vigencia.
  - [`Paso4PagoBancario.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/Paso4PagoBancario.tsx): Liquidación contable y asentamiento obligatorio en la tabla `pago` de PostgreSQL 16 con validación Poka-Yoke (monto > 0, medio de pago bancario, número de constancia y nota de auditoría).
  - [`Paso5TenantActivado.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/Paso5TenantActivado.tsx): Pantalla de confirmación con código de empresa (`EMP-XXXXX`), constancia oficial de liquidación descargable en formato TXT y enlaces directos al expediente y a la bandeja.
  - [`ResumenExpedienteSticky.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/onboarding/ResumenExpedienteSticky.tsx): Tarjeta sticky lateral (`lg:col-span-4`) con resumen en tiempo real del contrato y checklist de salvaguarda de integridad en PostgreSQL 16 (`empresa`, `local`, `suscripcion`, `pago`, `usuario`).
  - [`KpisSupervisionSaas.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/KpisSupervisionSaas.tsx): 4 tarjetas KPI (Total Empresas, Suscripciones Activas, En Período de Gracia con MRR en riesgo, Sedes Operativas Conectadas) con soporte de skeletons animados.
  - [`FiltrosTenantsBar.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/FiltrosTenantsBar.tsx): Barra de pestañas con conteo reactivo (`Todos`, `Activos`, `En Gracia`, `Suspendidos`, `Baja`), buscador reactivo con botón de limpieza, selector de plan y botón `[ ➕ Nueva Alta Manual B2B ]` conectado a `ROUTES.SAAS_TENANT_NUEVO`.
  - [`TenantsTablaDesktop.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/TenantsTablaDesktop.tsx): Grilla de datos densa para escritorio (`>= 1024px`) con badges semánticos, seguimiento de días de gracia (`Día X de 5 de gracia`), fechas relativas de vencimiento y acción `[ 👁️ Expediente ]`.
  - [`TenantCardMobile.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/TenantCardMobile.tsx): Tarjetas táctiles ergonómicas para smartphones y tablets (`< 1024px`) con touch targets $\ge 44\text{px}$.
  - [`ModalExpedienteTenant.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/ModalExpedienteTenant.tsx): Modal de auditoría 360° (Vista 2) con 4 bloques canónicos (Identidad, Contrato Stripe, Historial de pagos `pago`, Cuotas vs límites de plan), reenvío de notificación de cobro con capability token y suspensión preventiva.
  - [`EstadoVacioTenants.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/EstadoVacioTenants.tsx): Vista 4 de estado vacío con escudo de conformidad `🛡️` cuando no hay cobros pendientes en gracia o la búsqueda arroja 0 filas.
  - [`DemoSaasTenantsWidget.tsx`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/components/tenants/DemoSaasTenantsWidget.tsx): Widget flotante Sandbox QA para alternar en 1 clic: Vaciar gracia (Vista 4), Forzar día 5/5 de gracia, Regularizar El Tenedor Gourmet, Abrir Onboarding con RUC 20603849201 y Restablecer semillas canónicas.
- **Servicios y DTOs:**
  - [`mockSaasTenantsService.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/modules/saas/services/mockSaasTenantsService.ts): Motor de datos con persistencia en `localStorage`, validador de Módulo 11, recálculo de métricas y métodos operativos.
  - [`src/types/saasTenants.ts`](file:///d:/Proyecto/RestaurantCloud_AI_backend/restaurantcloud/apps/web/src/types/saasTenants.ts): DTOs tipados estrictamente según `empresa`, `suscripcion`, `pago`, `plan`, `local` y `usuario` de `02_schema_ddl.sql`. Cero datos inventados.
- **Responsive:** Adaptación completa a Desktop (`1440x900`), Tablet (`768x1024`) y Mobile (`375x812`), con paleta ÁUREA.
- **Estado de Build:** ✅ Compilado y verificado con 0 errores TypeScript (`cmd /c npm run build`).

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

Con el **100% del Módulo de Salón & Mozo completado (8 de 8 Casos de Uso concluidos)**:
`CU-MOZO-01`, `CU-MOZO-02`, `CU-MOZO-04`, `CU-MOZO-05`, `CU-MOZO-06`, `CU-MOZO-07`, `CU-MOZO-08`, `CU-MOZO-09`.

El siguiente paso natural en la cadena de valor operativa del restaurante es:

### 🔴 Opción A: Cocina y Producción (KDS - Kitchen Display System)
1. **`CU-COCINA-01`: Ver Cola de Pedidos Entrantes (Kitchen Display System - KDS)**
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
