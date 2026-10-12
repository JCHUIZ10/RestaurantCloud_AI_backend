# PROMPT DE CONTINUIDAD Y TRASPASO PARA NUEVO CHAT
## RestaurantCloud AI — Transición al Diseño e Implementación del Módulo Cocina (KDS)

> **Instrucciones para el Usuario:**  
> Copia y pega el contenido del bloque delimitado por `=== COPIAR DESDE AQUÍ ===` en el primer mensaje de tu **nuevo chat**.  
> El nuevo agente de IA leerá automáticamente este contexto, reconocerá que el **Módulo Mozo/Salón está 100% completado**, y continuará de inmediato con el diseño y `/plan` de **`CU-COCINA-01: Ver Cola de Pedidos Entrantes (KDS)`** o el caso de uso que elijas.

---

```markdown
=== COPIAR DESDE AQUÍ ===

Hola. Continuamos con el desarrollo frontend de **RestaurantCloud AI**, una plataforma SaaS B2B multitenant para restaurantes en Perú.

### 📌 ESTADO ACTUAL DEL PROYECTO
- **Módulo Salón & Mozo:** 🎉 **100% COMPLETADO (8 de 8 Casos de Uso Concluidos y Verificados)**:
  - `CU-MOZO-01`: Hub de Salón en Vivo (Layout 70/30, despacho dual, Quick-Drawer 440px).
  - `CU-MOZO-02`: Comanda Móvil (Split KDS vs Despacho directo, rondas adicionales, conflicto 409).
  - `CU-MOZO-04`: Unir y Separar Mesas (Mini-mapa 5x2, bloqueo asistido por consumo activo).
  - `CU-MOZO-05`: Gestión de Reservas (Bandeja diaria, reloj de cortesía 15m, liberación a LIBRE <25ms).
  - `CU-MOZO-06`: Anular Ítem y Comanda (Control de merma sin clave gerencial, motivo obligatorio).
  - `CU-MOZO-07`: Atender Quiebre de Stock (Decisión asistida, 6 sugerencias inteligentes, auditoría sin merma).
  - `CU-MOZO-08`: Emisión de Precuenta Digital (Desglose SUNAT, QR Yape/Plin, notificación a caja SSE).
  - `CU-MOZO-09`: Split de Comprobantes (Distribución determinista 100% Cero Azar, Factura RUC, Boleta DNI).
- **Módulos Públicos & Auth:** Landing Page SaaS B2B (100%), Carta QR `CU-CLIENTE-01` (100%), Comprobante Digital `CU-CLIENTE-02` (100%), Login Multi-cuenta `CU-AUTH-01` (100%).
- **Compilación actual:** `cmd /c npm run build` en `apps/web` compila con **0 errores** (`exit code 0`).

---

### 📂 DOCUMENTOS CANÓNICOS DEL REPOSITORIO (LEER ANTES DE DISEÑAR)
Por favor, consulta estos archivos en el workspace para respetar las convenciones exactas:
1. Matriz de Estado y Trazabilidad: `implementacion/ESTADO_CASOS_DE_USO_VISTAS.md`
2. Enlaces de Prueba y Demostración: `implementacion/CASOS_DE_PRUEBA_LINKS.md`
3. Guía de Diseño Visual y DTOs: `implementacion/GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md`
4. Esquema DDL de Base de Datos: `02_schema_ddl.sql`

---

### 🎨 REGLAS DE DISEÑO VISUAL Y ARQUITECTURA
- **Paleta ÁUREA Obligatoria:**
  - Azul Medianoche / Navy: `#0B2340` (Fondo de alto contraste, terminales)
  - Cobre Pulido: `#D5A06F` (Acentos y acciones secundarias)
  - Champán Suave: `#F4D7B0` (Highlights y bordes de realce)
  - Blanco Marfil: `#FFF9F0` (Textos de alta legibilidad)
- **Tipografías:** `DM Serif Display` (encabezados elegantes) + `DM Sans` (cuerpo técnico y DTOs).
- **Terminal Layout:** Usar `TerminalLayout.tsx` para vistas de Salón, Cocina KDS y Caja POS (pantalla completa, sin navegación lateral de admin).
- **Touch Targets:** Mínimo `44px` a `48px` para interacción táctil en pantallas de cocina/tablets.
- **TypeScript Estricto:** Evitar variables e imports no usados (`noUnusedLocals` activo en `tsconfig.json`).

---

### 🎯 OBJETIVO INMEDIATO: MÓDULO COCINA (KDS)
El siguiente paso prioritario en el roadmap es diseñar e implementar:
👉 **`CU-COCINA-01: Ver Cola de Pedidos Entrantes (Kitchen Display System - KDS)`**
- **Wireframe Canónico:** `wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/wireframe.md`
- **Ruta objetivo:** `/cocina/kds` (en `TerminalLayout`)
- **Vistas canónicas a diseñar e implementar:**
  1. *Vista 1: Tablero KDS Industrial 4 Columnas FIFO* con semáforo dinámico de tiempos (`configuracion_kds`), badges de mesa/mozo/ronda, temporizadores en vivo y split de estación (Fuegos, Fríos, Horno).
  2. *Vista 2: Gestión de Estados de Comanda/Ítem* (Botones táctiles para avanzar platos a "En Preparación / Fuego" y "Listo para Pase").
  3. *Vista 3: Modal / Drawer de Consolidado "All-Day Summary"* (agrupación acumulada de platos idénticos pendientes en toda la sala para cocinar en lote).
  4. *Vista 4: Historial de Despachos Recientes y Recuperación* (Recall de comandas despachadas por error en los últimos 15 min).

Por favor, confirma la recepción de este contexto y propón el **/plan** de diseño e implementación para **`CU-COCINA-01`**.

=== FIN DEL BLOQUE PARA COPIAR ===
```

---

### 📋 Checklist de Verificación Técnica de Salida

| Aspecto | Estado | Comprobación |
|---|:---:|---|
| **Frontend Web** | ✅ Listo | `apps/web` con Vite 5 + React 18 + TS |
| **Build de Producción** | ✅ Exit 0 | `cmd /c npm run build` (3.82s) |
| **Módulo Mozo** | ✅ 8/8 CUs | 100% completado |
| **Siguiente Hito** | 🚀 Listo | `CU-COCINA-01: KDS Monitor` |
