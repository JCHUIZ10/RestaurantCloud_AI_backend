# GUÍA DE REFACTORIZACIÓN UI — RESPONSIVE, LIMPIEZA VISUAL Y NAVEGACIÓN
## RestaurantCloud AI · `restaurantcloud/apps/web`

> **Qué es este documento:** las reglas y el plan por etapas para mejorar **solo la capa visual y de navegación** del frontend web.
> **Fuentes:** consolida lo aplicable de [`GUIA_IDENTIDAD_VISUAL_AUREA.md`](./GUIA_IDENTIDAD_VISUAL_AUREA.md) y [`GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md`](./GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md). Las secciones de DTO y contrato `ApiResponse<T>` de esta última **no aplican aquí**: la integración ya está cerrada.
> **Alcance físico:** únicamente `restaurantcloud/apps/web/`.

---

## 0. Frontera de trabajo (lo que NO se toca)

La integración con la API está concluida. Toda la refactorización es **presentacional**. Cualquier cambio que altere qué datos se envían o reciben queda fuera de alcance.

| Zona | Estado | Regla |
|---|---|---|
| `src/services/**` (`api/client.ts`, `realApiServices.ts`, `serviceAdapter.ts`, `planoService.ts`, `realSaasTenantsService.ts`) | **Congelado** | No editar. Solo se **consumen** métodos existentes. |
| `src/modules/*/services/**` (servicios mock) | **Congelado** | No editar, aunque contengan emojis en datos de prueba. |
| `src/types/**` (DTOs) | **Congelado** | No añadir, quitar ni renombrar campos. |
| `src/stores/authStore.ts` | **Congelado** | Se puede **leer** (`usuario`, `autenticado`) y llamar a `logout()`; no cambiar su lógica. |
| `src/shared/utils/**` (sunat, whatsapp, emvcoQr) | **Congelado** | Formatos de negocio; no tocar. |
| Handlers de páginas que llaman a servicios (`handleConfirmarApertura`, `handleComprobanteEmitido`, etc.) | **Firma y payload congelados** | Se puede mover el JSX que los dispara, nunca cambiar los argumentos que pasan al servicio. |
| `src/components/**`, `src/modules/*/components/**`, `src/modules/*/pages/**` (JSX y `className`) | **Editable** | Objeto principal de la refactorización. |
| `src/router/**`, `src/components/layout/**` | **Editable** | Navegación, guards, layouts. |
| `tailwind.config.ts`, `src/styles/globals.css`, `index.html` | **Editable** | Tokens, tema, meta viewport. |

**Prueba de fuego antes de cada PR:** `git diff --stat` no debe mostrar archivos de `src/services`, `src/modules/*/services`, `src/types`, `src/stores` ni `src/shared/utils`.

---

## 1. Diagnóstico del estado actual

Medido sobre el código actual (rama `feature/backend-laravel`).

### 1.1 Navegación y flujo de acceso

| # | Problema | Dónde |
|---|---|---|
| N1 | **No existen guards de ruta.** Cualquier URL (`/admin/*`, `/cajero/*`, `/saas/*`) se abre sin sesión ni rol. | [router/index.tsx](../restaurantcloud/apps/web/src/router/index.tsx) |
| N2 | El botón «Panel Admin» del `TerminalLayout` envía a **mozo, cocina y cajero** a `/admin/dashboard`. | [TerminalLayout.tsx:28-39](../restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx#L28-L39) |
| N3 | Las terminales **no tienen botón de salida/cerrar sesión.** | [TerminalLayout.tsx](../restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx) |
| N4 | La barra «Mesas Mozo / KDS Cocina / Caja & Cobros» se muestra a **todos los roles**: un cocinero puede saltar a caja. | [TerminalLayout.tsx:78-111](../restaurantcloud/apps/web/src/components/layout/TerminalLayout.tsx#L78-L111) |
| N5 | En la apertura de turno de caja, «Cerrar sesión» navega a `/admin/dashboard`. | [CajeroPosPage.tsx:457-459](../restaurantcloud/apps/web/src/modules/caja/pages/CajeroPosPage.tsx#L457-L459) |
| N6 | «Cerrar Sesión» del `DashboardLayout` es un `<Link to="/login">`: **no limpia la sesión** (`authStore.logout()` y `realAuthService.logout()` nunca se invocan desde la UI). | [DashboardLayout.tsx:107-115](../restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx#L107-L115) |
| N7 | El login envía al propietario a `/propietario/dashboard`, que es un **placeholder**; el índice `/propietario` redirige en cambio a `/sedes`. Mismo problema tras el registro. | [LoginPage.tsx:31-33](../restaurantcloud/apps/web/src/modules/auth/pages/LoginPage.tsx#L31-L33), [RegistroEmpresaPage.tsx:311](../restaurantcloud/apps/web/src/modules/propietario/pages/RegistroEmpresaPage.tsx#L311) |
| N8 | El menú lateral se decide por **prefijo de URL**, no por rol. Un propietario que entra a una sede (`PropietarioLocalesPage` → `/admin/dashboard`) pierde su menú y no tiene forma de volver a la consola de propietario. | [DashboardLayout.tsx:30-62](../restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx#L30-L62), [PropietarioLocalesPage.tsx:102](../restaurantcloud/apps/web/src/modules/propietario/pages/PropietarioLocalesPage.tsx#L102) |
| N9 | El logo dentro de las consolas enlaza a `/` (landing pública), sacando al usuario de la app. | [DashboardLayout.tsx:69](../restaurantcloud/apps/web/src/components/layout/DashboardLayout.tsx#L69) |
| N10 | Enlaces a `/carta`, ruta inexistente (el comodín los devuelve a `/`). | [Navbar.tsx:14](../restaurantcloud/apps/web/src/components/layout/Navbar.tsx#L14), [PublicLayout.tsx:65](../restaurantcloud/apps/web/src/components/layout/PublicLayout.tsx#L65) |
| N11 | Rutas duplicadas: `finanzas/flujo-caja` y `reportes/cierres-z` renderizan la misma página. `/cajero/apertura` = `/cajero/pos`. | [router/index.tsx](../restaurantcloud/apps/web/src/router/index.tsx) |
| N12 | Navegaciones con rutas literales (`'/mozo/mesas'`, `'/cocina/kds'`, `'/admin/dashboard'`) en vez de `ROUTES`. | `PrecuentaHeader`, `MozoPrecuentaPage`, `CocinaStockRapidoPage`, `ModalDesactivarLocal` |

### 1.2 Redundancia visual (crítico en Cocina y Caja)

| # | Problema | Dónde |
|---|---|---|
| R1 | **Cocina apila 4 franjas de cabecera** antes del primer ticket: header de `TerminalLayout` + barra de terminales + `KdsHeader` fila 1 + `KdsHeader` fila 2. Reloj, conectividad, marca e identidad del usuario aparecen **dos veces**. | `TerminalLayout` + [KdsHeader.tsx](../restaurantcloud/apps/web/src/modules/cocina/components/kds/KdsHeader.tsx) |
| R2 | Datos inventados fijos en el layout: «Sede: Miraflores», «19:45», «Carlos M. (Turno Tarde)», «Chef Roberto», texto de depuración «Layout: Terminal Fullscreen». | `TerminalLayout`, `KdsHeader` |
| R3 | Caja repite cajero, sede y estado en el header del layout **y** en la cabecera de `MonitorCajaPosView`. | [MonitorCajaPosView.tsx:80-110](../restaurantcloud/apps/web/src/modules/caja/components/monitor/MonitorCajaPosView.tsx#L80-L110) |
| R4 | **16 widgets flotantes de demo/QA** (`Demo*Widget`, `BetaCredentialsWidget`) renderizados en producción, incluidos KDS y Caja. | `CocinaKdsPage`, `CajeroPosPage`, `CajeroTurnoCierrePage`, 13 más |
| R5 | **176 códigos de caso de uso** (`CU-COCINA-01 a 04`, `CU-CAJA-05`…) visibles en texto de interfaz, badges y toasts. | Todo `modules/` |
| R6 | Botones con apariencia de pseudo-código: `[ 🔥 Poner en Fuego ]`, `[ ✓ Listo en Pase ]`. | [KdsTicketCard.tsx:219-324](../restaurantcloud/apps/web/src/modules/cocina/components/kds/KdsTicketCard.tsx#L219-L324) |
| R7 | Jerga técnica de cara al usuario: «409 Conflicto», «Bypass RLS», «Chime ON», «KDS En Vivo / SSE». | `CajeroPosPage`, `DashboardLayout`, `KdsHeader` |

### 1.3 Emojis

- **92 archivos, ~345 apariciones.** Los más cargados: `MesaInspeccionDrawer` (27), `MozoMesasPage` (18), `KdsSimuladorSemaforo` (15), `ModalEmisionNotaCredito` (12), `KdsTicketCard` (11), `SidebarDespachoVivo` (11), `ModalDetalleComanda` (9), `KdsHeader` (7), `ModalCobroFiscalPos` (7).
- Más frecuentes: `✓`(78) `⚠`(38) `⚡`(14) `⏱`(14) `✕`(11) `🚫`(10) `⏳`(8) `📱 💡 🔗`(7) `🔥`(6) y semáforos `🟢🔴🟡🔵⚪`.
- `lucide-react` **ya está instalado y se usa** en layouts: la sustitución no añade dependencias.

### 1.4 Sistema visual

| Métrica | Valor | Problema |
|---|---:|---|
| Clases `slate-*` | ~5 100 | Gris neutro de Tailwind ajeno a la paleta ÁUREA; las terminales parecen otra aplicación. |
| Variantes `dark:` | ~1 265 | No hay tema oscuro definido. Tailwind usa `darkMode: 'media'` por defecto: **en un equipo con SO en modo oscuro, solo parte de los componentes cambia** → interfaz mezclada. |
| `text-[9px]` / `text-[10px]` | ~645 | Por debajo del mínimo de 14 px que fija la guía ÁUREA para texto secundario. |
| `font-mono` | ~822 | Uso decorativo; dificulta lectura de cifras y etiquetas. |
| Colores fuera de paleta (`purple`, `sky`, `indigo`, `teal`) | ~400 | Sin función semántica definida. |
| `font-serif font-black` | varios | DM Serif Display solo tiene peso 400; el navegador sintetiza negrita. |
| `index.html` con `maximum-scale=1, user-scalable=no` | 1 | Bloquea el zoom: incumple WCAG 1.4.4. |
| `Button` y `Card` en `components/ui` | casi sin uso | Cada página reimplementa botones, modales y badges con clases sueltas. |

---

## 2. Reglas

Cada regla tiene un identificador para citarla en PRs y revisiones.

### 2.1 Tokens y color

- **C1 — Paleta de marca inmutable.** `aurea-navy #0B2340`, `aurea-copper #D5A06F`, `aurea-champagne #F4D7B0`, `aurea-ivory #FFF9F0`. Ya definidos en `tailwind.config.ts`.
- **C2 — Neutros derivados del navy.** Se añade una escala `tinta` (texto/bordes/superficies) derivada de `#0B2340` para sustituir progresivamente `slate-*`. Ejemplo de partida (validar contraste):
  ```ts
  tinta: { 50:'#F5F6F8', 100:'#E7EAEF', 200:'#C9D0DB', 300:'#9AA6B8', 400:'#6B7A91', 500:'#4A5A72', 600:'#334359', 700:'#22324A', 800:'#16273F', 900:'#0B2340', 950:'#06162B' }
  ```
- **C3 — Colores de estado semánticos y únicos.** La guía ÁUREA deja los estados por definir; se fijan así y **no se usa ningún otro color** para estados:
  | Token | Uso | Base Tailwind |
  |---|---|---|
  | `estado-ok` | disponible, pagado, listo | `emerald` |
  | `estado-alerta` | en espera, por vencer, tiempo amarillo | `amber` |
  | `estado-error` | agotado, anulado, error, tiempo rojo | `rose` |
  | `estado-info` | informativo, en preparación | `navy`/`tinta` (no `sky`/`indigo`/`purple`) |
  Patrón: fondo tenue (`-50`/`-100`) + texto `-700`/`-800` + borde `-200`, más **icono y texto** (nunca solo color).
- **C4 — Cobre no es color de texto pequeño** sobre marfil/blanco (contraste insuficiente). Úsese en iconos, bordes y acentos.
- **C5 — Un solo tema por superficie, sin depender del SO.** `darkMode: 'class'` en Tailwind. Se eliminan los `dark:` sueltos. La única superficie oscura es el **KDS de cocina**, implementada como tema explícito (`bg-aurea-navy` / `tinta-950`), no con `dark:`.

### 2.2 Tipografía

- **T1 — DM Serif Display (400)** solo para: nombre de marca, H1/H2 de página, títulos de sección editorial. Prohibido en botones, tablas, inputs, badges y cabeceras de terminal. Nunca `font-bold`/`font-black` sobre `font-serif`.
- **T2 — DM Sans** para el 100 % de la interfaz operativa (400/500/600/700).
- **T3 — Tamaño mínimo 12 px** (`text-xs`) para metadatos; **14 px** (`text-sm`) para texto secundario legible; **16 px** en inputs móviles (evita zoom automático en iOS). Se prohíben `text-[9px]`, `text-[10px]` y `text-[11px]`.
- **T4 — `font-mono` solo para datos tabulares** donde la alineación importe (importes en tablas, correlativos, RUC). En su lugar, preferir `tabular-nums` con DM Sans.
- **T5 — Mayúsculas** solo en etiquetas cortas (≤ 3 palabras) con `tracking-wide`; nunca en frases ni botones largos.

### 2.3 Responsive

Matriz de la guía de diseño, adaptada a los tres tipos de layout:

| Layout | Móvil `< 768` | Tablet `768–1023` | Escritorio `≥ 1024` |
|---|---|---|---|
| **Público / Cliente QR** | 1 columna, `max-w-xl`, tarjetas horizontales, bottom sheets | 2 columnas | `max-w-7xl`, grilla 3–4 col o maestro-detalle 4/8 |
| **Consola (Admin/Propietario/SaaS)** | Topbar + drawer; tablas → **lista de tarjetas** | Drawer o sidebar colapsado (iconos) | Sidebar fijo `w-64` + contenido `max-w-7xl` |
| **Terminal (Mozo/Cocina/Caja)** | Mozo: prioritario. Cocina/Caja: degradación digna (1 col) | **Objetivo principal** (tablet horizontal) | Grilla densa 3–4 col |

- **RS1 — Mobile-first.** Clases base para móvil; `md:`/`lg:` para ampliar. Nunca diseñar para escritorio y «arreglar» abajo.
- **RS2 — Sin anchos fijos en píxeles** (`w-[420px]`, 56 casos) salvo en drawers, con `max-w-full`. Usar `w-full max-w-*`.
- **RS3 — Sin scroll horizontal de página** a 360 px. Tablas anchas: patrón dual (`hidden md:table` + lista `md:hidden`), como ya hace `TenantsTablaDesktop` / `TenantCardMobile` — **es el patrón de referencia**.
- **RS4 — Modales:** en móvil, *bottom sheet* a ancho completo con altura máx. `90dvh` y scroll interno; desde `md:`, modal centrado `max-w-lg`–`max-w-3xl`. Cabecera y pie de acciones **siempre visibles** (sticky dentro del modal).
- **RS5 — Objetivos táctiles ≥ 44×44 px** en terminales y móvil (`min-h-11`). Separación mínima de 8 px entre acciones.
- **RS6 — Usar `dvh`** (`min-h-dvh`, `h-dvh`) en lugar de `vh`/`min-h-screen` en layouts de terminal y modales (barra de direcciones móvil).
- **RS7 — Zoom permitido.** Meta viewport: `width=device-width, initial-scale=1`. Sin `maximum-scale` ni `user-scalable=no`.
- **RS8 — Puntos de control** obligatorios para validar cada pantalla: **360, 768, 1024 (horizontal tablet), 1280, 1536** px.

### 2.4 Iconografía — cero emojis

- **I1 — Prohibidos los emojis y pictogramas Unicode** (`✓ ⚠ ⚡ 🔥 🟢 …`) en JSX, `title`, `aria-label`, toasts y textos de botón.
- **I2 — Fuente única de iconos: `lucide-react`** (ya instalado). Tamaños: `w-4 h-4` en texto/botón, `w-5 h-5` en acciones táctiles, `w-6 h-6` en cabeceras, `w-10`–`w-12` en estados vacíos.
- **I3 — Icono decorativo con `aria-hidden="true"`**; si el icono es el único contenido del botón, el botón lleva `aria-label`.
- **I4 — Semáforos** (`🟢🔴🟡`) se sustituyen por el componente `EstadoBadge` (punto de color + texto), nunca un círculo de color solo.
- **I5 — Datos con emojis** que vienen de servicios mock (ej. iconos de categoría en `mockCartaService`) **no se editan**: la UI deja de renderizarlos y, si necesita icono, lo resuelve con un diccionario propio en la capa de componentes.
- **I6 — Nada de pseudo-botones con corchetes** (`[ Acción ]`).

Tabla de sustitución:

| Emoji | Lucide | Emoji | Lucide |
|---|---|---|---|
| ✓ | `Check` / `CheckCircle2` | ✕ | `X` |
| ⚠ | `AlertTriangle` | 🚫 | `Ban` |
| ⚡ | `Zap` | 🛑 | `OctagonAlert` |
| ⏱ 🕒 | `Timer` / `Clock` | ⏳ | `Hourglass` |
| 🔥 | `Flame` | 🚨 | `Siren` |
| 📱 | `Smartphone` | 💡 | `Lightbulb` |
| 🔗 | `Link2` | ↳ ➔ | `CornerDownRight` / `ArrowRight` |
| 🎉 | `CheckCircle2` (evitar festivos en operativo) | 🧾 | `Receipt` |
| 👤 | `User` | 🍽 | `UtensilsCrossed` |
| 🌐 | `Globe` | 🔔 🛎 | `Bell` / `ConciergeBell` |
| ✉ 📧 | `Mail` | 🔒 🔑 | `Lock` / `KeyRound` |
| ➗ ✂ | `Divide` / `Scissors` | 📝 | `NotebookPen` |
| 📅 | `CalendarDays` | 💵 💳 🏦 | `Banknote` / `CreditCard` / `Landmark` |
| 🔄 ↺ | `RefreshCw` / `RotateCcw` | 📍 📞 | `MapPin` / `Phone` |
| ☰ | `Menu` | ⚙ | `Settings` |
| 🚀 👑 ✨ | Eliminar (decorativos) | 🟢🔴🟡🔵⚪ | `EstadoBadge` |

### 2.5 Limpieza y densidad

- **L1 — Una sola fuente por dato de contexto.** Usuario, sede, hora y conectividad se muestran **una vez**, en el header del layout. Las páginas no los repiten.
- **L2 — Sin datos inventados en layouts.** Nombre de usuario, rol y sede salen de `useAuthStore().usuario`; la hora de un reloj real. Si no hay dato, no se muestra.
- **L3 — Widgets de demo/QA ocultos en producción.** Se renderizan solo si `import.meta.env.DEV` o `VITE_SHOW_DEMO_WIDGETS === 'true'`, mediante un único envoltorio `<SoloDemo>`. No se borran (son útiles en QA).
- **L4 — Sin códigos de caso de uso en la interfaz** (`CU-XXX-NN`). Se conservan en comentarios de código.
- **L5 — Lenguaje de usuario, no técnico.** «409 Conflicto» → «Turno pendiente de cierre»; «Bypass RLS» → eliminar; «Chime ON/Mute» → «Sonido activado/silenciado»; «SSE en vivo» → «Conectado».
- **L6 — Máximo una acción primaria por vista o modal** (botón navy sólido). Secundarias en champán o contorno; destructivas en `estado-error`.
- **L7 — Animaciones con propósito.** `animate-ping`/`animate-pulse` permanentes solo para alertas que exigen acción (ticket en rojo, conexión perdida). Respetar `prefers-reduced-motion` (`motion-safe:`).

### 2.6 Navegación y acceso

- **NV1 — Cada ruta privada declara sus roles** y pasa por `<RequireRole roles={[...]}/>`. Sin sesión → `/login?next=<ruta>`. Rol incorrecto → home de **su** rol (nunca a `/admin`).
- **NV2 — Home único por rol**, definido en un solo sitio (`HOME_POR_ROL` en `router/`) y usado por login, activación de cuenta, registro, guards y «volver al inicio»:
  | Rol | Home | Layout |
  |---|---|---|
  | `admin_saas` | `/saas/tenants` | Consola |
  | `propietario` | `/propietario/sedes` | Consola |
  | `admin_local` | `/admin/plano-mesas` *(hasta que exista el panel real)* | Consola |
  | `mozo` | `/mozo/mesas` | Terminal |
  | `cocina` | `/cocina/kds` | Terminal (tema oscuro) |
  | `cajero` | `/cajero/pos` | Terminal |
- **NV3 — Salida visible siempre.** Toda pantalla autenticada tiene «Cerrar sesión» accesible en ≤ 2 toques (menú de usuario del header). Cerrar sesión = `realAuthService.logout()` (si `IS_REAL_API`) + `useAuthStore.getState().logout()` + `navigate(ROUTES.LOGIN, { replace: true })`. Es consumo de métodos existentes; no se modifican.
- **NV4 — Terminales sin enlaces a consolas.** Se elimina «Panel Admin» del `TerminalLayout`. El conmutador de terminales solo aparece si el rol tiene acceso a más de una (`admin_local`/`propietario` supervisando); un mozo, cocinero o cajero no lo ve.
- **NV5 — Menú lateral por rol, no por URL.** `DashboardLayout` obtiene los enlaces de `usuario.rol`. Un propietario que entra a una sede ve el menú de administración **más** un enlace fijo «Volver a mis sedes».
- **NV6 — «Atrás» jerárquico explícito.** Subpantallas (comanda, precuenta, stock rápido, onboarding de tenant) muestran un botón «Volver a <padre>» con destino fijo vía `ROUTES`, no `navigate(-1)`.
- **NV7 — El logo de una consola lleva a su home**, no a la landing pública.
- **NV8 — Sin rutas muertas ni duplicadas.** Enlaces a rutas inexistentes se eliminan o se corrigen; los alias se resuelven con `<Navigate replace>`.
- **NV9 — Solo `ROUTES`**, nunca rutas literales en `navigate()`/`<Link>`.
- **NV10 — Placeholders fuera del menú.** Las vistas «Próximo entregable» no aparecen como destino de login ni como enlace principal del menú.

### 2.7 Los 5 estados UX (visual)

Cada vista con datos remotos muestra, con componentes compartidos:

1. **Carga** → `Skeleton` con la misma forma del contenido final (no spinners a pantalla completa).
2. **Con datos** → contenido.
3. **Vacío** → `EstadoVacio`: icono lucide, título, una frase y CTA si aplica.
4. **Error** → `EstadoError`: mensaje claro, código técnico discreto y botón «Reintentar» que llama a la misma función de carga ya existente.
5. **Conflicto** → modal o banner con la decisión que debe tomar el usuario.

La lógica que decide el estado ya existe en las páginas; solo se sustituye su presentación.

### 2.8 Accesibilidad

- **A1 — Foco visible** en todo elemento interactivo: `focus-visible:ring-2 ring-aurea-copper ring-offset-2`.
- **A2 — Modales accesibles:** `role="dialog"`, `aria-modal`, `aria-labelledby`, cierre con `Esc`, foco atrapado y devuelto al disparador.
- **A3 — Contraste AA** (4.5:1 texto normal, 3:1 texto grande e iconos).
- **A4 — Estado nunca solo por color** (ver C3, I4).
- **A5 — Botones reales** (`<button>`/`<Link>`), no `div` con `onClick`.

---

## 3. Componentes base a crear (`src/components/ui/`)

Puramente presentacionales; reciben props y callbacks, no llaman a servicios.

| Componente | Sustituye | Notas |
|---|---|---|
| `Button` (ampliar) | Botones ad hoc | Variantes `primary`, `secondary`, `outline`, `ghost`, `danger`; tamaños con `min-h-11` en `md`/`lg`; `leftIcon`, `loading`. |
| `IconButton` | Botones solo icono | `aria-label` obligatorio por tipo. |
| `Modal` | ~80 modales propios | Bottom sheet en móvil, centrado en `md:`; header/footer sticky; A2. |
| `Drawer` | Drawers de mesa, receta, historial | Lateral en `md:`, hoja completa en móvil. |
| `EstadoBadge` | Badges de colores y emojis semáforo | Prop `tono: ok \| alerta \| error \| info \| neutro` + icono + texto. |
| `PageHeader` | `*Header.tsx` repetidos por módulo | Título serif, descripción, zona de acciones que se apila en móvil. |
| `Skeleton`, `EstadoVacio`, `EstadoError` | Implementaciones dispersas | Ver §2.7. |
| `DataTable` + `ListaResponsive` | Tablas que desbordan | Patrón dual de RS3. |
| `Toast` (+ hook `useToast`) | Toasts por página (`CajeroPosPage`, etc.) | Posición abajo-centro en móvil, arriba-derecha en `md:`. |
| `SoloDemo` | Condicional de widgets demo | L3. |
| `UserMenu` | Avatares estáticos | Nombre, rol, sede real y «Cerrar sesión». |

---

## 4. Plan por etapas

Cada etapa es mergeable por separado, deja `npm run build` y `npm run lint` en verde, y no toca la zona congelada (§0).

### Etapa 0 — Base del sistema (½–1 día)

**Objetivo:** que las reglas puedan aplicarse sin decisiones ad hoc.

1. `tailwind.config.ts`: `darkMode: 'class'`; añadir escala `tinta` (C2) y alias de estado (C3); `fontFamily.sans` con fallback `Arial`.
2. `globals.css`: capa `@layer base` con `focus-visible` global, `font-feature-settings` para `tabular-nums` en `.cifra`, y `@media (prefers-reduced-motion)`.
3. `index.html`: meta viewport sin bloqueo de zoom (RS7).
4. Crear `SoloDemo` y envolver los **16** widgets demo (L3).
5. Añadir script de verificación `npm run check:ui` (grep) que falle si encuentra emojis, `text-[9px]`/`text-[10px]`, `CU-` en JSX o rutas literales. Se usa en etapas siguientes como criterio.

**Hecho cuando:** con SO en modo oscuro la app se ve igual que en claro; los widgets demo no aparecen en `vite build` sin flag.

### Etapa 1 — Navegación y acceso (1–2 días) · *mayor impacto funcional percibido*

1. `router/homePorRol.ts` con `HOME_POR_ROL` (NV2) y usarlo en `LoginPage`, `ActivarCuentaPage`, `RegistroEmpresaPage`.
2. `RequireRole` (lee `useAuthStore`) y envolver los árboles `/saas`, `/propietario`, `/admin`, `/mozo`, `/cocina`, `/cajero` (NV1). Soporte de `?next=` en login.
3. Hook `useCerrarSesion()` (NV3) y uso en `DashboardLayout`, `TerminalLayout`, `ModalAperturaTurno`, `ModalBloqueoTurnoPrevio`, `ReporteZCerradoView`.
4. `TerminalLayout`: quitar «Panel Admin» (NV4), conmutador condicionado por rol, datos reales de usuario/sede (L2), quitar texto de depuración.
5. `CajeroPosPage`: `onCerrarSesion` de apertura → `useCerrarSesion` (N5).
6. `DashboardLayout`: menú por rol, logo → home del rol, enlace «Volver a mis sedes» para propietario en `/admin` (NV5, NV7).
7. Corregir `/carta` (N10), rutas literales (NV9) y quitar placeholders del menú/redirecciones (NV10).

**Hecho cuando:** se recorre la matriz de §5 sin errores.

### Etapa 2 — Componentes base (2 días)

Crear los componentes de §3 con sus variantes responsive. Migrar **una** pantalla piloto de consola (recomendado: `AdminCategoriasPage`, tamaño medio) y **una** de terminal (`CocinaStockRapidoPage`) para validar la API de los componentes antes de escalar.

**Hecho cuando:** ambas pilotos pasan RS8 en los 5 anchos y usan solo componentes base para botones, modales, badges y estados.

### Etapa 3 — Terminal de Cocina (KDS) (2 días)

1. Fusionar el header del `TerminalLayout` (modo cocina) y `KdsHeader` en **una barra** + **una fila** de filtros (R1). Reloj, conexión, sonido y usuario aparecen una sola vez.
2. `KdsTicketCard`: quitar emojis y corchetes (R6, I6), acciones como `Button` táctil de 48 px, tiempo con `EstadoBadge` según semáforo.
3. Tema oscuro explícito con `aurea-navy`/`tinta` (C5); eliminar `slate-*` del módulo.
4. Grilla: 1 col `< md`, 2 col `md`, 3 col `lg`, 4 col `xl` (hoy salta de 2 a 4).
5. Modales (`ModalDetalleComanda`, `ModalDisponibilidadPlatos`, `ModalHistorialDespachados`, `ModalAlertaParadaFogones`, `DialogoResolucionFuego`) → `Modal` base.
6. `ToastAlertaStock` → `Toast` base.

**Hecho cuando:** en tablet horizontal (1024×768) se ven ≥ 2 filas de tickets sin scroll; 0 emojis y 0 códigos CU en `modules/cocina`.

### Etapa 4 — Terminal de Caja (2–3 días)

1. Quitar la cabecera duplicada de `MonitorCajaPosView` (R3); dejar solo métricas del turno.
2. Métricas en tarjetas de 2 col móvil / 4 col `md`, cifras `tabular-nums` (T4), etiquetas ≥ 12 px (T3).
3. Lista de mesas: tarjeta con estado (`EstadoBadge`) y **una** acción primaria según estado (L6); acciones secundarias en menú.
4. Modales de alto volumen (`ModalCobroFiscalPos` 992 líneas, `ModalEmisionNotaCredito` 1 041, `ModalHistorialComprobantesPos`, `ModalArqueoConteo`) → `Modal` base, bottom sheet en móvil, pasos con indicador claro. **Solo JSX y estilos**: los handlers que arman el payload no se tocan.
5. Mensajes en lenguaje de usuario (L5): «409 Conflicto» → «Turno pendiente de cierre».
6. Flujo de cierre: `CajeroTurnoCierrePage` con «Volver a caja» y «Cerrar sesión» coherentes (NV6).

**Hecho cuando:** un cobro completo se puede hacer en 768 px de ancho sin scroll horizontal ni botones ocultos tras el teclado; 0 emojis en `modules/caja`.

### Etapa 5 — Terminal de Mozo (2–3 días)

1. `MozoMesasPage` (953 líneas) y `MesaInspeccionDrawer` (27 emojis): emojis → lucide, drawer → `Drawer` base.
2. Plano de mesas: grilla fluida, mesas ≥ 64 px, leyenda de estados con `EstadoBadge`.
3. Comanda: catálogo + ticket en 2 paneles desde `lg`, ticket como bottom sheet con resumen fijo en móvil.
4. Precuenta y dividir cuenta: pasos claros, botones sticky.
5. «Volver a mesas» jerárquico (NV6) con `ROUTES`.

**Hecho cuando:** el flujo mesa → comanda → precuenta funciona con una mano a 360 px.

### Etapa 6 — Consolas Admin, Propietario y SaaS (4–5 días)

Por lotes, cada uno un PR:

1. **Carta:** categorías, productos, promociones.
2. **Inventario:** insumos, proveedores, compras.
3. **Operación:** plano de mesas, horario, personal, KDS config, métodos de pago.
4. **Finanzas y auditoría:** flujo de caja, anulaciones.
5. **Propietario:** sedes, administradores, suscripción, cambiar plan, registro.
6. **SaaS:** tenants, onboarding.

Por pantalla: `PageHeader`, tabla dual (RS3), modales base, `EstadoBadge`, 5 estados, sin emojis/CU/`dark:`, `slate` → `tinta`.

### Etapa 7 — Público y cliente QR (1–2 días)

1. `Navbar`/`PublicLayout`: enlaces válidos, CTA único destacado, footer sin jerga técnica («PostgreSQL RLS», «Latencia < 25 ms»).
2. `CartaDigitalPage`, `PlatoCard`, `PlatoModal`: patrón dual de la guía (fila en móvil, tarjeta en `lg`), bottom sheet para detalle.
3. Comprobante digital: ticket móvil / A4 escritorio ya existe; revisar tamaños mínimos y botones táctiles.
4. `LoginPage`: `BetaCredentialsWidget` bajo `SoloDemo`.

### Etapa 8 — Cierre y control (½ día)

1. `npm run check:ui` en verde en todo `src/`.
2. Recorrido completo de la matriz §5 y de los 5 anchos RS8.
3. Eliminar componentes UI huérfanos que hayan quedado sin uso tras la migración (no servicios).

**Orden recomendado:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Las etapas 3, 4 y 5 son independientes entre sí tras la 2 y pueden repartirse.

---

## 5. Matriz de verificación de navegación

| Escenario | Resultado esperado |
|---|---|
| Sin sesión, abrir `/cajero/pos` | Redirige a `/login?next=/cajero/pos`; tras login de cajero vuelve a `/cajero/pos`. |
| Cocina abre `/admin/carta` | Redirige a `/cocina/kds`. |
| Mozo en terminal | No ve conmutador de terminales ni «Panel Admin»; ve «Cerrar sesión». |
| Cajero en modal de apertura pulsa «Cerrar sesión» | Sesión limpia y vuelve a `/login`. |
| Cualquier rol pulsa «Cerrar sesión» y luego «Atrás» del navegador | No vuelve a la pantalla privada (guard redirige a login). |
| Propietario entra a una sede | Ve menú de administración + «Volver a mis sedes». |
| Login de propietario | Llega a `/propietario/sedes`, no a un placeholder. |
| Logo en consola | Lleva al home del rol. |
| Enlaces del navbar público | Ninguno termina en la landing por ruta inexistente. |

---

## 6. Checklist por PR

- [ ] `git diff --stat` sin archivos en zona congelada (§0).
- [ ] `npm run build` y `npm run lint` sin errores.
- [ ] `npm run check:ui` sin hallazgos en los archivos tocados.
- [ ] Revisado a 360 / 768 / 1024 / 1280 / 1536 px sin scroll horizontal (RS8).
- [ ] Objetivos táctiles ≥ 44 px en terminales y móvil (RS5).
- [ ] Sin emojis, sin códigos CU, sin `text-[9px|10px|11px]`, sin `dark:`.
- [ ] Contexto (usuario/sede/hora) no duplicado (L1).
- [ ] 5 estados UX representados con componentes base (§2.7).
- [ ] Navegación con `ROUTES` y salida visible (NV3, NV9).
- [ ] Foco visible y modales accesibles (A1, A2).

---

## 7. Decisiones abiertas

1. **Marca visible por superficie.** Hoy conviven «RestaurantCloud AI» (navbar, consolas, KDS) y «ÁUREA» (`<title>`, guía). Propuesta: plataforma SaaS (landing, login, consola SaaS) = RestaurantCloud; superficies del restaurante (carta QR, comprobante, terminales) = nombre del local de la sesión, con ÁUREA como identidad visual de la demo. Confirmar antes de la Etapa 1.
2. **Home de `admin_local`.** *Aplicado en Etapa 1 (por defecto):* `/admin/plano-mesas` hasta que exista el panel. Se cambia en `src/router/accesoPorRol.ts`.
3. **Conmutador de terminales.** *Aplicado en Etapa 1 (por defecto):* solo `admin_local` y `propietario` (`ROLES_SUPERVISION`) ven el conmutador y el enlace «Consola»; mozo, cocina y caja quedan confinados a su terminal. Ajustable en `src/router/accesoPorRol.ts`.

### 7.1 Decisiones aplicadas tras la Etapa 1

- **Acceso estricto por rol**: cada rol entra solo a su área. Mozo, cocina y caja son exclusivos de su rol; admin de sede y propietario ya no entran a las terminales; admin SaaS solo a `/saas`. Única excepción: el propietario entra a la administración de sede desde «Mis sedes». Se retiraron el conmutador de terminales y el enlace «Terminales operativas». Las notas sobre `ROLES_SUPERVISION` de este documento quedan obsoletas.
- **TerminalLayout sin cabecera**: cada terminal trae la suya. El botón «Salir» (`components/ui/BotonSalir.tsx`) va dentro de esa cabecera: KdsHeader (sustituye al usuario ficticio «Chef Roberto»), SalonHeaderMozo y la barra de turno del POS. Las subpantallas (comanda, precuenta, reservas, stock, cierre) vuelven a su pantalla principal con su botón de regreso.
- **DashboardLayout**: sin cabecera en escritorio. La marca queda en una línea; debajo, un rótulo de contexto (consola y, en administración de sede, el nombre de la sede). Usuario y «Cerrar sesión» en el pie de la sidebar; campana junto a la marca. En móvil, barra mínima con menú, sección actual y campana.
- Las pantallas ya no restan la altura de cabecera: `h-[calc(100vh-3.5rem)]` pasa a `h-full` y los toasts de `top-16` a `top-4`.

### 7.2 Decisiones aplicadas en la Etapa 2

- **Componentes base** en `src/components/ui/`, importables desde `@/components/ui`:
  - `Button` (ampliado, compatible con los usos previos): variante `danger`, `leftIcon`, `loading` y prop `tema`.
  - `IconButton`, `Modal`, `ModalConfirmacion`, `Drawer`.
  - `EstadoBadge`, `PageHeader` (con `volver` para NV6 y `compacto` para terminales).
  - `Skeleton`, `EstadoVacio`, `EstadoError`.
  - `Pestanas` (filtro segmentado) y `CampoBusqueda`.
  - `DataTable` / `ListaResponsive`.
  - `ToastProvider` + `useToast`.
- **Tema por prop, no por `dark:`**: los componentes aceptan `tema="claro" | "oscuro"`. Solo el KDS usa `oscuro` (C5).
- **Modal accesible común**: `shared/hooks/useCapaModal.ts` cierra con Escape, atrapa y devuelve el foco y bloquea el scroll del fondo. Se monta en portal; si se abre un segundo modal, queda encima del primero.
- **Toasts globales**: `ToastProvider` está montado en `main.tsx`. Las páginas migradas usan `useToast()` en lugar de su propio estado de toast o de `alert()`.
- **`window.confirm` → `ModalConfirmacion`**: la llamada al servicio y su payload no cambian.
- **`UserMenu` descartado**: lo cubren el pie de la sidebar (consolas) y `BotonSalir` (terminales); ver §7.1.
- **Pilotos migrados**:
  - **`AdminCategoriasPage`**: cabecera, indicadores, filtros, tabla dual tabla/tarjetas, onboarding y los dos modales. Se retiraron el ID técnico de cada fila, el texto «409» y la referencia `CU-MOZO-01`.
  - **`CocinaStockRapidoPage`**: ya no abre un modal a pantalla completa sobre su propia cabecera. Muestra en línea `PanelDisponibilidadPlatos`, el mismo panel que el KDS abre dentro de `ModalDisponibilidadPlatos`. `DialogoResolucionFuego` pasa a `Modal` oscuro, sin emojis, sin `CU-COCINA-04` y sin pseudo-botones.
- **Pendiente para las etapas siguientes**: las animaciones `animate-fade-in`, `animate-slide-in` y `animate-fadeIn` no están definidas en `tailwind.config.ts` y hoy no hacen nada. Se eliminan al migrar cada pantalla.

### 7.3 Ajuste de estilo tras revisar el piloto de Categorías

Estas decisiones prevalecen sobre C2 y T1 en las consolas.

- **Paleta cálida en consolas**: los componentes en tema claro usan marfil, champán, cobre y navy (`border-aurea-champagne/70`, `text-aurea-navy/70`, `bg-aurea-ivory`). La escala `tinta` queda para el KDS oscuro.
- **Serif con peso**: los títulos de página y de modal, las cifras de los indicadores y los títulos de estado vacío usan `font-serif font-bold`. Se retiró `font-synthesis: none` de `globals.css`.
- **Indicadores al estilo de Productos** (`TarjetaIndicador`): tarjeta blanca con borde del tono, rótulo en mayúsculas del color del tono, icono pequeño sobre fondo tenue y cifra en serif con unidad al lado.
- **Etiquetas de tabla al estilo de Insumos**: los estados van en `EstadoBadge` (pastilla rellena `-100`/`-800` con punto, sin borde). Los conteos y las unidades van en una etiqueta `rounded-lg` con borde champán. Las acciones de fila son `IconButton`.
- **Ningún botón del color del fondo**: las acciones secundarias van en `outline` (fondo blanco, borde cobre y sombra). `ghost` solo se usa para iconos dentro de tarjetas o tablas.
- **Sin elementos de relleno**: no se usan migas de pan (no reflejan una navegación real), no se repite el nombre de la sede en las páginas (ya está en la sidebar) y no se agregan paneles laterales decorativos. Las páginas de consola usan todo el ancho, sin `max-w-7xl`. Los filtros van dentro de la tarjeta de la tabla (`ListaResponsive` acepta `cabecera`).
- **Encabezado**: `PageHeader` con `icono` (bloque navy), título serif, descripción y acciones.
- **Una acción por lugar**: si una acción vive en contexto (ej. «+ Ambiente» en la barra de ambientes), no se repite en el encabezado. Los paneles de configuración no repiten como tarjetas los indicadores que ya muestra la página; basta una línea en la descripción del modal.
- **Sin datos técnicos a la vista**: no se muestran coordenadas base 0, códigos HTTP ni códigos de error (`ERR_...`) en la interfaz.
- **Vistas espaciales** (ej. plano de mesas): igual que una tabla, son una sola tarjeta. Arriba va una barra con selector y controles, en medio el lienzo sobre `aurea-ivory` y abajo una simbología breve. Los colores de estado van en el elemento (fondo `-50` y borde `-300`) y en su `EstadoBadge`.
- **`Button` usa `type="button"` por defecto**: el submit siempre se declara (`type="submit"` y `form={id}` cuando el botón está en el pie del modal).
- **Componentes base añadidos en Productos**: `Paginacion` (pie de tabla con rango, tamaño de página y anterior/siguiente; lo usan Categorías y Productos) y la prop `barra` de `Modal`, una franja fija bajo la cabecera para los pasos de un asistente o un resumen en vivo que no debe perderse al desplazar.
- **Confirmaciones**: no se usa `window.confirm`; las acciones destructivas o de archivado abren `ModalConfirmacion`.
- **Estado en la fila y acción aparte**: el estado (Disponible/Agotado) es un `EstadoBadge` de solo lectura y el cambio va en un `IconButton` dentro de las acciones de la fila, como en Categorías.
