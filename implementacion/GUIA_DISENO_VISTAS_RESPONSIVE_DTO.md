# GUÍA MAESTRA DE DISEÑO DE VISTAS, RESPONSIVE DESIGN Y COHERENCIA DTO
## RestaurantCloud AI — Estándar de Ingeniería Frontend y Arquitectura UI/UX

> **Documento de Referencia Obligatoria para Diseño y Desarrollo Frontend.**  
> Este manual establece los estándares técnicos, reglas de responsividad, adopción de la identidad visual ÁUREA y el protocolo estricto de derivación de DTOs desde el esquema de base de datos PostgreSQL 16 para garantizar que cualquier pantalla desarrollada en esta o futuras sesiones mantenga coherencia técnica y visual absoluta.

---

## 1. Principios Rectores del Frontend

1. **Responsive First-Class (PC, Tablet y Móvil):** Ninguna pantalla debe diseñarse pensando exclusivamente en un único tamaño. Todo caso de uso debe aprovechar la amplitud de pantallas de escritorio (PC/Laptop) sin desperdiciar espacio, adaptarse a tablets en salón/barra, y ser ergonómico en smartphones táctiles.
2. **Identidad Visual ÁUREA Rigurosa:** Respeto irrestricto a la paleta de 4 colores oficiales, tipografías aprobadas (*DM Serif Display* y *DM Sans*) y directrices de accesibilidad WCAG 2.1 AA.
3. **Coherencia Absoluta con el Esquema de Base de Datos:** Los DTOs frontend (`*DTO`) y servicios de datos/mocks deben reflejar fielmente las columnas y tipos del DDL canónico de PostgreSQL 16 (`02_schema_ddl.sql`). Queda terminantemente prohibido inventar campos ficticios que requieran alterar tablas existentes.
4. **Contrato Estándar de API (`ApiResponse<T>`):** Toda comunicación con el backend (real o mock) se envuelve en la estructura corporativa unificada.
5. **Manejo Integral de los 5 Estados UX:** Cada vista debe contemplar explícitamente: Skeleton/Loading, Empty State, Loaded/Éxito, Error de Red y Estados de Conflicto/Alerta.

---

## 2. Arquitectura Responsive Multi-Dispositivo

### 2.1 Matriz de Breakpoints y Comportamiento de Layout

| Dispositivo / Viewport | Rango de Ancho | Contenedor Máximo | Estrategia de Layout | Orientación de Componentes |
|---|---|---|---|---|
| **PC / Desktop / Pantalla Ancha** | `>= 1024px` (`lg:`, `xl:`, `2xl:`) | `max-w-7xl` con `px-6 lg:px-8` | **2 Columnas Maestro-Detalle** (Sidebar sticky 4 cols + Área principal 8 cols) o Grilla de 3 a 4 columnas | Tarjetas verticales con foto panorámica superior (`h-40` a `h-48`); tablas ricas con ordenamiento; atajos de teclado |
| **Tablet / Terminal Fija POS** | `768px - 1023px` (`md:`) | `max-w-4xl` / `w-full` con `px-4 sm:px-6` | Grillas de 2 columnas; paneles colapsables tipo cajón (*drawer* de 400-440px) | Tarjetas balanceadas; touch targets generosos (mínimo 44px); steppers numéricos de fácil pulsación |
| **Mobile Smartphone** | `< 768px` (`sm:` y base) | `max-w-xl` centrado con `px-4` | **1 Columna vertical fluida** centrada en navegación táctil y pulgar | Tarjetas horizontales compactas (`flex-row`) con imagen lateral; carruseles horizontales con scroll-snap; modales tipo *Bottom Sheet* |

### 2.2 Patrones de Maquetación Canónicos en Tailwind CSS

#### A. Contenedor Maestro de Vistas Amplias (Desktop + Mobile)
```tsx
// Contenedor principal para vistas con catálogo o tablas
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    {/* Sidebar izquierdo en PC (Filtros, Información, Navegación rápida) */}
    <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
      {/* Contenido sticky */}
    </aside>

    {/* Área principal derecha (Grilla de contenido, formularios, resultados) */}
    <section className="lg:col-span-8 space-y-5">
      {/* Grilla responsiva de tarjetas: 1 col móvil, 2 cols tablet, 3 cols PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Items */}
      </div>
    </section>
  </div>
</div>
```

#### B. Componentes Adaptativos Duales (Fila en Smartphone vs. Tarjeta en PC)
Para evitar crear dos componentes distintos, los elementos como `PlatoCard` deben utilizar flexbox/grid condicional:
```tsx
<div className="rounded-2xl bg-white border-2 border-aurea-copper/25 overflow-hidden flex flex-row lg:flex-col">
  {/* Imagen: Lateral (w-28 h-28) en celular, Cabecera completa (w-full h-44) en PC */}
  <div className="w-28 sm:w-32 lg:w-full h-28 sm:h-32 lg:h-44 shrink-0 overflow-hidden order-2 lg:order-1">
    <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover" />
  </div>

  {/* Contenido textual */}
  <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 order-1 lg:order-2">
    <h3 className="font-serif text-base lg:text-lg font-bold text-aurea-navy">{item.nombre}</h3>
    <p className="font-sans text-xs text-aurea-navy/70 line-clamp-2">{item.descripcion}</p>
    <div className="pt-2 border-t border-aurea-copper/15 flex items-center justify-between">
      <span className="font-sans font-bold text-base lg:text-lg text-aurea-navy">{formatPEN(item.precio)}</span>
    </div>
  </div>
</div>
```

---

## 3. Identidad Visual ÁUREA y Sistema de Diseño

Se apega estrictamente a [`implementacion/GUIA_IDENTIDAD_VISUAL_AUREA.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/implementacion/GUIA_IDENTIDAD_VISUAL_AUREA.md).

### 3.1 Paleta de Colores Inmutable

| Nombre de Token | Código HEX | RGB | Uso Canónico |
|---|---|---|---|
| **`aurea-navy`** | `#0B2340` | `11, 35, 64` | **Color principal:** Textos de lectura, botones principales, cabeceras sólidas, pie de página |
| **`aurea-copper`** | `#D5A06F` | `213, 160, 111` | **Acentos y trazos:** Bordes de tarjetas, iconos destacados, chips secundarios, detalles decorativos |
| **`aurea-champagne`**| `#F4D7B0`| `244, 215, 176` | **Complemento cálido:** Fondos de realce, badges destacados, botones secundarios, contrastes sobre navy |
| **`aurea-ivory`** | `#FFF9F0` | `255, 249, 240` | **Fondo base:** Superficie general de la aplicación, fondos de página y contenedores amplios |

### 3.2 Tipografías Oficiales y Regla de Empleo

```css
--font-display: 'DM Serif Display', Georgia, serif;
--font-body: 'DM Sans', Arial, sans-serif;
```

- **`font-serif` (DM Serif Display, 400 Regular):** Reservada para titulares de impacto (H1/H2), nombre de la marca, frases promocionales cortas y títulos de sección editorial. **Nunca usar en párrafos, botones, inputs ni tablas.**
- **`font-sans` (DM Sans, 400, 500, 600, 700):** Tipografía funcional para el 100% de la experiencia operativa: nombres de platos, precios, descripciones, formularios, chips, tablas de datos, botones, banners y pies de página.

### 3.3 Ratios de Contraste y Accesibilidad (WCAG 2.1 AA)
- Texto normal `#0B2340` sobre fondo `#FFF9F0`: **14.8:1** (supera con holgura el mínimo exigido de 4.5:1).
- Botones de acción principales: Fondo `#0B2340` con texto `#FFF9F0` o `#FFFFFF` (**15.2:1**).
- Estados de alerta y peligro: Utilizar fondos con tinte suave y texto oscuro contrastado (ej. `bg-rose-100 text-rose-700 border-rose-200`).

---

## 4. Protocolo de Coherencia DTO vs Base de Datos (PostgreSQL 16)

Para salvaguardar la estabilidad de la arquitectura y evitar divergencias entre el Frontend React y el Backend Go/Laravel, todo DTO debe someterse a esta verificación:

```
[ Requerimiento de Vista / UI ]
             ↓
[ Consulta de Tabla en 02_schema_ddl.sql ]
             ↓
¿El campo existe como columna en la tabla?
   ├── SÍ  → Incluir directamente en el DTO con tipo coincidente.
   └── NO  → ¿Se puede derivar mediante JOIN, COUNT, SUM o JSON_AGG de relaciones existentes?
               ├── SÍ  → Declarar en DTO y documentar la fórmula SQL de derivación.
               └── NO  → ⛔ PROHIBIDO INCLUIR. No inventar columnas que no existan.
```

### 4.1 Mapeo de Tipos de Datos PostgreSQL a TypeScript

| Tipo PostgreSQL | Tipo TypeScript | Ejemplo en DDL | Mapeo en DTO |
|---|---|---|---|
| `UUID` | `string` | `id UUID PRIMARY KEY` | `id: string` |
| `VARCHAR`, `TEXT` | `string` | `nombre VARCHAR(100)` | `nombre: string` |
| `TEXT` nullable | `string \| null` | `descripcion TEXT` | `descripcion?: string \| null` |
| `DECIMAL(10, 2)` | `number` | `precio DECIMAL(10, 2)` | `precio: number` |
| `INT`, `SMALLINT` | `number` | `capacidad INT` | `capacidad: number` |
| `BOOL` | `boolean` | `requiere_preparacion BOOL` | `requiere_preparacion: boolean` |
| `TIMESTAMPTZ`, `DATE`| `string` (ISO 8601) | `created_at TIMESTAMPTZ` | `created_at: string` |
| `CHECK (col IN (...))`| `enum union` en TS | `disponibilidad IN ('disponible','agotado')`| `'disponible' \| 'agotado'` |
| `JSONB` | `interface` o `Record<string, unknown>` | `detalle JSONB` | `detalle: DetalleDTO` |

### 4.2 Ejemplo Canónico de Derivación: `ProductoPublicoDTO`
- **Tabla en BD:** `producto` (`02_schema_ddl.sql`, línea 311).
- **Columnas reales:** `id`, `local_id`, `categoria_id`, `nombre`, `descripcion`, `precio`, `costo_estandar`, `moneda`, `foto_url`, `disponibilidad`, `motivo_agotado`, `usuario_modifico_disp_id`, `fecha_modificacion_disp`, `requiere_preparacion`, `activo`.
- **DTO Público (`ProductoPublicoDTO`):**
  ```ts
  export interface ProductoPublicoDTO {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    foto_url: string | null;
    disponibilidad: 'disponible' | 'agotado';
  }
  ```
  *(Se eliminan costos, usuarios internos y fechas privadas para preservar seguridad comercial).*

---

## 5. Contrato Unificado de Respuestas API (`ApiResponse<T>`)

Todos los servicios y endpoints deben retornar la estructura tipada definida en `src/types/api.ts`:

```ts
export interface ApiResponse<T> {
  exito: boolean;
  datos: T;
  errores?: AppError[];
  meta?: ResponseMeta;
}

export interface AppError {
  codigo: string;
  mensaje: string;
  campo?: string;
}

export interface ResponseMeta {
  timestamp: string;
  total?: number;
  pagina?: number;
  limite?: number;
}
```

### 5.1 Los 5 Estados UX Obligatorios en Cada Pantalla

```
1. [SKELETON / CARGA]  ──> Componentes con animate-pulse manteniendo el layout exacto.
2. [ÉXITO / LOADED]    ──> Renderizado de datos interactivos con framer-motion fluido.
3. [VACÍO / EMPTY]     ──> Ilustración técnica, texto explicativo y llamada a la acción (CTA).
4. [ERROR DE RED]      ──> Mensaje amigable, código de error técnico y botón de reintento.
5. [CONFLICTO / ALERTA]──> Modales asistidos para eventos 409 (ej. producto agotado en cocina).
```

---

## 6. Checklist de Validación para Nuevas Vistas

Antes de dar por concluido un Caso de Uso o vista frontend, verificar:
- [ ] **Desktop Check:** ¿Aprovecha monitores `>= 1024px` con ancho `max-w-7xl` sin bordes gigantes en blanco?
- [ ] **Tablet Check:** ¿Se opera cómodamente en pantallas táctiles horizontales con botones `>= 44px`?
- [ ] **Mobile Check:** ¿Es legible en una mano y las tarjetas no desbordan horizontalmente?
- [ ] **ÁUREA Check:** ¿Usa los 4 colores oficiales (`#0B2340`, `#D5A06F`, `#F4D7B0`, `#FFF9F0`) y tipografías correctas?
- [ ] **DTO Check:** ¿Todos los atributos del DTO existen o se derivan legítimamente de `02_schema_ddl.sql`?
- [ ] **API Check:** ¿Utiliza la envoltura `ApiResponse<T>` y contempla los 5 estados de UI?
- [ ] **Build Check:** ¿El comando `npm run build` compila limpiamente con 0 errores TypeScript?
