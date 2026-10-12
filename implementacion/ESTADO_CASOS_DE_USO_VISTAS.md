# MATRIZ DE ESTADO Y TRAZABILIDAD DE CASOS DE USO Y VISTAS FRONTEND
## RestaurantCloud AI — Estado Canónico del Frontend Web

> **Documento de Trazabilidad y Continuidad del Proyecto.**  
> Este documento registra el avance oficial de las pantallas implementadas en `restaurantcloud/apps/web`, los componentes involucrados, sus rutas activas, estado de verificación responsive y el backlog ordenado de los siguientes Casos de Uso (CUs) para garantizar continuidad sin fricciones entre sesiones.

---

## 1. Resumen Ejecutivo del Avance

| Módulo / Dominio | Total CUs | CUs Concluidos | CUs En Proceso / Pendientes | % Avance Frontend |
|---|:---:|:---:|:---:|:---:|
| **Plataforma Pública & SaaS B2B** | 1 (Landing) | 1 | 0 | 100% |
| **Cliente / Comensal QR** | 2 | 1 | 1 | 50% |
| **Salón & Mozo** | 8 | 0 | 8 | 0% |
| **Cocina (KDS)** | 4 | 0 | 4 | 0% |
| **Caja & Cobranza** | 5 | 0 | 5 | 0% |
| **Administración Local** | 10 | 0 | 10 | 0% |
| **Propietario / Tenant** | 6 | 0 | 6 | 0% |
| **SuperAdmin SaaS** | 3 | 0 | 3 | 0% |
| **Autenticación & Usuarios** | 3 | 0 | 3 | 0% |

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

Para continuar el desarrollo de las pantallas del sistema, se recomienda el siguiente orden lógico:

### 🟢 Opción 1: Cerrar el Dominio Público de Clientes (Recomendada para completar el módulo)
1. **`CU-CLIENTE-02`: Buscar Comprobante de Pago Digital (Visor de Boletas y Facturas Electrónicas)**
   - **Ruta:** `/sede/:slug/comprobante/:token` o `/c/:token`
   - **Wireframe Canónico:** `wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/wireframe.md`
   - **Vistas Clave:** Visor digital de ticket en smartphone, visor formal tributario A4 en pantalla de PC/Tablet, auditoría de comprobante anulado con nota de crédito y pantalla de búsqueda por código único (Zero Dead-Ends).
   - **Tabla BD Asociada:** `comprobante`, `comprobante_serie`, `cliente`, `local`, `empresa`.

---

### 🟡 Opción 2: Iniciar el Centro Neurálgico Operativo del Restaurante (Salón y Cocina)
2. **`CU-MOZO-01`: Ver Estado de Mesas y Centro de Comandas en Vivo**
   - **Ruta:** `/mozo/mesas` (en `TerminalLayout`)
   - **Wireframe Canónico:** `wireframe/mozo/CU-MOZO-01-estado-mesas/wireframe.md`
   - **Vistas Clave:** Plano interactivo de mesas (70%) + Barra lateral de pedidos y bebidas de despacho directo (30%), Quick-drawer de inspección de mesa y alertas de platos listos en cocina.
   - **Tablas BD Asociadas:** `mesa`, `piso`, `pedido`, `pedido_item`, `reserva`.

3. **`CU-MOZO-02`: Tomar Pedido y Comanda Móvil en Salón**
   - **Ruta:** `/mozo/mesas/:mesaId/comanda`
   - **Wireframe Canónico:** `wireframe/mozo/CU-MOZO-02-tomar-pedido/wireframe.md`
   - **Vistas Clave:** Catálogo táctil de la carta (65%) + Ticket de comanda interactivo (35%), modal rápido de notas de preparación y resolución asistida de conflictos de stock (409).
   - **Tablas BD Asociadas:** `pedido`, `pedido_item`, `producto`, `categoria_producto`.

4. **`CU-COCINA-01`: Ver Cola de Pedidos Entrantes (Kitchen Display System - KDS)**
   - **Ruta:** `/cocina/kds` (en `TerminalLayout`)
   - **Wireframe Canónico:** `wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/wireframe.md`
   - **Vistas Clave:** Tablero KDS oscuro de 4 columnas FIFO con semáforo cromático dinámico según `configuracion_kds`, botones táctiles para avanzar platos a "En Fuego" o "Listo", y vista de consolidado "All-Day Summary".
   - **Tablas BD Asociadas:** `pedido`, `pedido_item`, `configuracion_kds`.

---

### 🔵 Opción 3: Módulo de Autenticación y Acceso
5. **`CU-AUTH-01`: Iniciar Sesión en el Sistema (Web y Terminal con PIN Rápido)**
   - **Ruta:** `/login`
   - **Wireframe Canónico:** `wireframe/usuario/CU-AUTH-01-iniciar-sesion/wireframe.md`
   - **Vistas Clave:** Formulario de correo y contraseña para administradores, teclado numérico de PIN de 4 dígitos para mozos/cocineros/cajeros en terminal compartida.
   - **Tabla BD Asociada:** `usuario`.

---

## 5. Instrucciones para Continuar en Próximas Sesiones

Cuando el usuario solicite implementar un nuevo caso de uso:
1. Consultar este archivo (`ESTADO_CASOS_DE_USO_VISTAS.md`) para verificar el estado actual.
2. Leer la [`GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/implementacion/GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md) para respetar la paleta ÁUREA, el diseño responsive y el mapeo de DTOs con `02_schema_ddl.sql`.
3. Leer el `wireframe.md` correspondiente al caso de uso en la carpeta `wireframe/`.
4. Una vez implementada y verificada la vista con `npm run build`, actualizar este inventario marcando el CU como concluido.
