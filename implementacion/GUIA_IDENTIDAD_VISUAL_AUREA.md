# ÁUREA — Guía de identidad visual para el proyecto web

> **Documento de referencia para diseño y desarrollo.**  
> Marca: **ÁUREA**  
> Lema oficial: **«Una experiencia para disfrutar»**  
> Concepto: restaurante de carta variada; identidad elegante, moderna, cálida y accesible.  
> Logotipo aprobado: bandeja/campana de servicio con vapor en forma de nube, en azul marino, cobre y tonos claros.

## 1. Principios de identidad

- **Elegancia sin exageración:** jerarquía clara, buen espacio en blanco y detalles cálidos.
- **Consistencia:** usar las mismas dos familias tipográficas en todo el sitio.
- **Legibilidad:** evitar texto largo en la tipografía decorativa.
- **Versatilidad:** no asociar la marca con un único tipo de comida.
- **Accesibilidad:** asegurar contraste suficiente, estados de foco visibles y tamaños adaptables.

## 2. Tipografías oficiales

| Familia | Papel | Pesos recomendados | Uso |
|---|---|---|---|
| **DM Serif Display** | Tipografía de marca y títulos de impacto | Regular (400) | Logotipo textual «ÁUREA», títulos H1/H2, encabezados editoriales, frases promocionales breves, portadas de carta |
| **DM Sans** | Tipografía funcional y de lectura | Regular (400), Medium (500), SemiBold (600), Bold (700) | Lema, navegación, párrafos, tarjetas, platos, precios, filtros, botones, formularios, reservas, mensajes y pie de página |

**Enlaces de referencia:**
- [DM Serif Display — Google Fonts](https://fonts.google.com/specimen/DM+Serif+Display)
- [DM Sans — Google Fonts](https://fonts.google.com/specimen/DM+Sans)

### Regla principal

Usar **DM Serif Display para atraer la atención** y **DM Sans para permitir lectura e interacción cómodas**. No usar DM Serif Display en párrafos extensos, campos de formularios, listados densos ni etiquetas pequeñas.

## 3. Guía tipográfica por apartado del sitio

Las medidas son valores de partida y podrán ajustarse según las pruebas de diseño responsive.

| Apartado / componente | Fuente | Peso | Tamaño recomendado (escritorio) | Tamaño recomendado (móvil) | Observaciones |
|---|---|---:|---:|---:|---|
| **Nombre «ÁUREA» en logo** | DM Serif Display | 400 | Depende del formato (referencia 42–60 px) | Escalar proporcionalmente | Mayúsculas; espaciado entre letras de `0.03em` a `0.06em`; conservar la tilde |
| **Lema bajo el logo** | DM Sans | 400–500 | 14–18 px | 12–14 px | Centrado con el nombre; nunca competir visualmente con él |
| **H1 / titular de inicio (hero)** | DM Serif Display | 400 | 48–64 px | 34–42 px | Interlineado 1.05–1.15; texto breve |
| **H2 / títulos de secciones** | DM Serif Display | 400 | 32–40 px | 27–32 px | Ej. «Nuestra carta», «Una experiencia especial» |
| **H3 / subtítulos destacados** | DM Serif Display o DM Sans | 400 o 600 | 24–28 px | 21–24 px | Serif si es editorial; Sans si es funcional |
| **Menú de navegación** | DM Sans | 500–600 | 14–16 px | 15–16 px | Etiquetas cortas, legibles |
| **Texto introductorio / destacado** | DM Sans | 400 | 18–20 px | 17–18 px | Interlineado 1.5–1.6 |
| **Párrafos y contenido general** | DM Sans | 400 | 16–18 px | 16 px | Interlineado 1.5–1.7 |
| **Categorías de la carta** | DM Sans | 600 | 16–18 px | 16 px | Para pestañas, filtros y chips |
| **Nombre de plato** | DM Sans | 600 | 17–20 px | 17–18 px | Permite escaneo rápido de la carta |
| **Descripción de plato** | DM Sans | 400 | 14–16 px | 14–16 px | Evitar cuerpos demasiado pequeños |
| **Precio de plato** | DM Sans | 600–700 | 17–20 px | 17–18 px | Jerarquía clara, cifras legibles |
| **Botones y acciones** | DM Sans | 600 | 15–16 px | 15–16 px | Ej. «Ver carta», «Reservar mesa» |
| **Formularios y reservas** | DM Sans | 400–600 | 15–16 px | 16 px | Labels 500; campos 400; ayudas 400 |
| **Notificaciones, validaciones y mensajes** | DM Sans | 400–600 | 14–16 px | 14–16 px | No depender solo del color para indicar estados |
| **Pie de página y datos de contacto** | DM Sans | 400–500 | 14–16 px | 14–16 px | Texto legal secundario mínimo recomendado 14 px |
| **Frases promocionales breves** | DM Serif Display | 400 | 28–44 px | 24–32 px | Usar de forma puntual, sin saturar |

### Ejemplos por sección

- **Inicio:** titular principal en DM Serif Display, texto descriptivo y botones en DM Sans.
- **Nuestra carta:** título general en DM Serif Display; categorías, nombres de platos, ingredientes, precios y controles en DM Sans.
- **Nosotros / historia:** títulos en DM Serif Display; contenido narrativo en DM Sans.
- **Reservas:** título introductorio en DM Serif Display; formulario completo en DM Sans.
- **Promociones:** frase corta destacada en DM Serif Display; condiciones, fechas y botones en DM Sans.
- **Contacto:** título en DM Serif Display; dirección, horarios, redes y formularios en DM Sans.
- **Administración futura:** DM Sans para tablas, filtros, informes y acciones; reservar DM Serif Display para encabezados de marca si procede.

## 4. Paleta de colores oficial

Estos son los **cuatro colores previamente acordados**. Los códigos HEX deben tratarse como constantes de marca.

| Color | HEX | RGB | Función sugerida |
|---|---|---|---|
| **Azul marino** | `#0B2340` | `11, 35, 64` | Color principal: cabeceras, fondos destacados, pie de página, textos sobre fondos claros |
| **Cobre** | `#D5A06F` | `213, 160, 111` | Acentos decorativos, trazos de marca, bordes, iconos y detalles |
| **Champán** | `#F4D7B0` | `244, 215, 176` | Complemento cálido: superficies destacadas, detalles suaves y títulos sobre azul marino |
| **Marfil** | `#FFF9F0` | `255, 249, 240` | Fondo base cálido de páginas y tarjetas, espacios visuales amplios |

### Combinaciones recomendadas

- **Azul marino + marfil:** texto principal `#0B2340` sobre fondo `#FFF9F0`.
- **Azul marino + champán:** encabezados o secciones oscuras con detalles `#F4D7B0`.
- **Cobre:** usar principalmente como acento; no asumir que sirve para texto pequeño sobre marfil o blanco, porque puede carecer de contraste.
- **Botón principal:** fondo `#0B2340` y texto `#FFF9F0`.
- **Botón secundario:** fondo `#F4D7B0` y texto `#0B2340`.
- **Fondo general:** `#FFF9F0`; alternar secciones con fondos claros y bloques azul marino sin sobrecargar.

**Nota:** los colores de estados (éxito, error, advertencia) y los colores de interacción (hover/focus) se definirán al diseñar los componentes y se verificarán por contraste; no forman parte de esta paleta base.

## 5. Tokens CSS recomendados

```css
/* Identidad base ÁUREA */
:root {
  --aurea-navy: #0B2340;
  --aurea-copper: #D5A06F;
  --aurea-champagne: #F4D7B0;
  --aurea-ivory: #FFF9F0;

  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', Arial, sans-serif;

  --color-background: var(--aurea-ivory);
  --color-text: var(--aurea-navy);
  --color-primary: var(--aurea-navy);
  --color-accent: var(--aurea-copper);
}

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  background: var(--color-background);
  color: var(--color-text);
}

h1, h2, .display-title {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.1;
}

h1 { font-size: clamp(2.125rem, 5vw, 4rem); }
h2 { font-size: clamp(1.75rem, 3vw, 2.5rem); }

.brand-name {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: 0.04em;
}

.brand-tagline,
nav,
button,
input,
select,
textarea,
.card-description,
.price {
  font-family: var(--font-body);
}

button { font-weight: 600; }
.price { font-weight: 700; }
```

### Cargar las fuentes en el frontend

Incluir en el `<head>` del documento HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
```

Para producción, valorar el alojamiento local de archivos de fuentes y revisar sus licencias, rendimiento y política de privacidad según la arquitectura del proyecto.

## 6. Reglas para mantener la coherencia

1. Mantener el **logotipo aprobado** y usar los tonos oficiales.
2. Mantener el nombre escrito **ÁUREA** con tilde.
3. Mantener el lema exacto: **«Una experiencia para disfrutar»**.
4. No incorporar una tercera familia tipográfica salvo que exista una razón funcional documentada.
5. Evitar mayúsculas en párrafos largos; reservarlas para marca y etiquetas puntuales.
6. Respetar la jerarquía H1 → H2 → H3 y no usar títulos solo para aumentar tamaño.
7. Verificar contrastes y estados de interacción antes de dar por cerrado el diseño.
8. Comprobar legibilidad en móvil, tablet y escritorio; no depender de medidas fijas.
9. Conservar variantes de logo para fondo claro y oscuro cuando se preparen los recursos finales.
10. Usar estos tokens como fuente única de verdad en componentes y hojas de estilo.

## 7. Estado de decisiones

| Elemento | Decisión |
|---|---|
| Nombre | **ÁUREA** |
| Lema | **Una experiencia para disfrutar** |
| Símbolo | Bandeja/campana con vapor que forma una nube |
| Color principal | `#0B2340` |
| Colores de apoyo | `#D5A06F`, `#F4D7B0`, `#FFF9F0` |
| Tipografía de marca / display | **DM Serif Display** |
| Tipografía de interfaz / cuerpo | **DM Sans** |
| Estilo | Elegante, actual, acogedor, para gastronomía variada |

---

**Uso de este documento:** conservarlo en el repositorio, por ejemplo en `docs/GUIA_IDENTIDAD_VISUAL_AUREA.md`, y consultarlo al diseñar o modificar cualquier apartado del frontend. Si cambia una decisión de marca, actualizar aquí y luego reflejar el cambio en los tokens CSS del proyecto.
