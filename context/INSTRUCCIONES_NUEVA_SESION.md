# Guía de Continuidad para Nuevas Sesiones de IA — RestaurantCloud AI

> **Nota para el asistente de IA:** Este documento sirve como punto de entrada rápido y exhaustivo cuando se inicia una nueva conversación en el proyecto. Contiene el contexto operativo, los archivos fuente de verdad, la metodología exacta de diseño/código y el inventario actualizado para mantener 100% de uniformidad, precisión y coherencia técnica.

---

## 1. Fuentes de Verdad del Proyecto (Lectura Obligatoria)

Al iniciar una nueva sesión, debes fundamentar todas tus decisiones en los siguientes archivos ubicados en el repositorio:

1. **Catálogo de Casos de Uso:** [`context/cu.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/cu.md)
   - Contiene la descripción de requerimientos por rol: Administrador SaaS (`CU-SAAS`), Propietario (`CU-PROP`), Administrador del Local (`CU-ADMIN`), Mozo (`CU-MOZO`), Cocina (`CU-COCINA`), Cajero (`CU-CAJA`), Cliente y Sistema.
2. **Modelo Relacional de Base de Datos:** [`context/modelo_datos.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/modelo_datos.md)
   - Esquema unificado en PostgreSQL 16 con Row-Level Security (RLS) basado en `empresa_id` y `local_id`, índices de alto rendimiento y almacenamiento volátil en Redis.
3. **Contexto de Arquitectura y Negocio:** [`context/proyect_context.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/proyect_context.md)
   - SaaS multi-tenant, monolito modular en Go, autenticación JWT con cuentas independientes por empresa, suscripciones con Stripe (Planes Starter, Pro, Enterprise).
4. **Bitácora Histórica de Decisiones de Diseño:** [`context/walkthrough.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/walkthrough.md)
   - Bitácora con 40 secciones que documenta todas las justificaciones técnicas, reglas de negocio, layouts ASCII, DTOs y evolución de interfaces desde la autenticación hasta las operaciones de Mozo en salón.
5. **Guía Maestra de Wireframes:** [`wireframe/README.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/README.md)
   - Filosofía *Screen-First & Contract-First*, tokens Grayscale Blueprint, matriz de 5 estados UX, convención de directorios e inventario de casos de uso.

---

## 2. Metodología de Trabajo por Cada Caso de Uso

Por cada Caso de Uso que se aborde con el usuario, se sigue estrictamente este ciclo:

```text
  1. /plan interactivo ─────────> 2. Feedback y Aprobación del Usuario
                                               │
                                               ▼
  3. Generación de Wireframes <───────────────┘
     Grayscale Blueprint (4 vistas con Edge Headless)
                               │
                               ▼
  4. Especificación Técnica: wireframe/<rol>/<cu>/wireframe.md
     (Ficha, Secuencia Mermaid, ASCII, 5 Estados UX, RBAC, DTOs Go, Endpoints, DDL SQL, WCAG AA)
                               │
                               ▼
  5. Sincronización de Documentación:
     - context/cu.md (Detalle ampliado del CU)
     - context/modelo_datos.md (Tablas, enums, checks e índices)
     - context/walkthrough.md (Nuevas secciones de bitácora y lista de entregables)
     - wireframe/README.md (Actualización del inventario de avance)
```

---

## 3. Estándar Visual: Grayscale Blueprint y Pipeline Local

- **Paleta Estricta:** `#0F172A` (Charcoal dark), `#1E293B`, `#475569`, `#64748B`, `#CBD5E1`, `#E2E8F0`, `#F8FAFC`, `#FFFFFF`.
- **Tipografía:** Segoe UI / Inter / San Francisco (limpia, moderna, ultra-legible).
- **Accesibilidad:** WCAG 2.1 AA (contrastes > 4.5:1 en textos y > 12:1 en encabezados; touch targets > 48x48px para entornos táctiles).
- **Formato de Salida:** 4 imágenes `.jpg` guardadas en `wireframe/<rol>/<cu>/assets/`:
  - Vista 1: Dashboard / Workspace principal (o layout táctil).
  - Vista 2: Modal interactivo / Formulario / Drawer con validaciones.
  - Vista 3: Modal de inspección, flujo alternativo, segunda ronda o cierre.
  - Vista 4: Estado vacío positivo / Onboarding / Diálogo de contingencia o merma.
- **Motor de Renderizado:** Script en Python utilizando Microsoft Edge Headless (`--headless=new --window-size=1440,900`) y Pillow a calidad 95:
  - Ruta del ejecutable de Edge en Windows: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

---

## 4. Estado Actual del Avance

A la fecha, se han completado y documentado con wireframes en alta fidelidad y contratos de API los siguientes módulos:

### 4.1 Rol Usuario (Transversal)
- `CU-AUTH-01`: Login y selección de cuenta/sede.
- `CU-AUTH-02`: Recuperación de contraseña vía OTP.

### 4.2 Rol Propietario (`wireframe/propietario/`)
- `CU-PROP-01`: Registro de empresa y checkout inicial.
- `CU-PROP-02`: Gestión de suscripción y método de pago (Stripe).
- `CU-PROP-03`: Cambiar plan de suscripción y límites SaaS.
- `CU-PROP-04`: Registrar y administrar sedes/locales.
- `CU-PROP-05`: Crear y gestionar administradores de local.
- `CU-PROP-09`: Ver incidentes corporativos consolidados.

### 4.3 Rol Administrador del Local (`wireframe/administrador/`)
- `CU-ADMIN-01`: Gestión del plano de mesas de sede.
- `CU-ADMIN-02`: Categorías de la carta gastronómica.
- `CU-ADMIN-03`: Insumos y stock inicial.
- `CU-ADMIN-04`: Personal operativo del local.
- `CU-ADMIN-05`: Productos y recetas culinarias.
- `CU-ADMIN-06`: Proveedores de insumos.
- `CU-ADMIN-07`: Recomendaciones de reposición con IA.
- `CU-ADMIN-08`: Personal y turnos del local.
- `CU-ADMIN-09`: Horario de atención y feriados extraordinarios.
- `CU-ADMIN-10`: Políticas y parámetros de reserva.
- `CU-ADMIN-11`: Historial de incidentes internos de sede.
- `CU-ADMIN-12`: Recibir notificación de anulación de pedido y auditoría de sala (Tabla especializada `pedido_anulacion`, alertas reactivas SSE con Toast y campana `[ 🔔 ]`, trazabilidad temporal fáctica `created_at` vs `anulado_at`, control de mermas, acuse de supervisión administrativa `revisado = true` y escalamiento directo a `CU-ADMIN-11`).
- `CU-ADMIN-17`: Gestionar promociones del local (cálculo predictivo para caja, semántica NULL, plantilla de inauguración).
- `CU-ADMIN-18`: Configurar parámetros operativos de comanda y tiempos de KDS (Tabla dedicada `configuracion_kds`, calibración con steppers táctiles de umbral verde óptimo, ámbar de advertencia y tolerancia en pase, simulador de semáforo interactivo en tiempo real y broadcast SSE reactivo a pantallas de cocina y salón en < 30ms).

### 4.4 Rol Mozo en Salón (`wireframe/mozo/`) — 🏆 100% CULMINADO
- `CU-MOZO-01`: Ver estado de mesas y centro de comandas en vivo (Workspace unificado 70% salón / 30% barra lateral KDS en tiempo real con SSE).
- `CU-MOZO-02`: Tomar pedido y comanda móvil en salón (Unifica funcionalmente `CU-MOZO-03` y `CU-MOZO-07`; pantalla 65% catálogo / 35% ticket borrador, nota de cocina simplificada con soporte NULL, gestión de rondas múltiples, enrutamiento KDS < 30ms).
- `CU-MOZO-04`: Unir o dividir mesas en salón (Agrupación física y contable universal para todos los planes con etiqueta oficial `Mesa [ 02 ; 03 ]`, modelo relacional `mesa_principal_id` sin sobreingeniería, flujo asistido en Quick-Drawer de `CU-MOZO-01` y bloqueo de división si hay consumo activo).
- `CU-MOZO-05`: Gestionar reservas y recepción en salón (Exclusivo SaaS Pro/Enterprise, Bandeja Central, asignación táctil con Mini-Mapa 5x2, bloqueo preventivo automático 30 min antes vía SSE, recepción en 1 toque hacia `CU-MOZO-02`, tolerancia de cortesía con botón intuitivo `[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]` y paywall asistido Starter).
- `CU-MOZO-06`: Anular pedido (o ítem de pedido) con motivo (Extensión directa del Quick-Drawer de `CU-MOZO-01`, autonomía operativa sin clave gerencial, chips de motivos frecuentes, tratamiento automático de merma `es_merma = true`, parada inmediata en KDS y alerta a administración).
- `CU-MOZO-07`: Atender incidencia de plato no disponible y resolver en mesa (Enlace reactivo ante quiebre de stock en cocina `CU-COCINA-04`, alerta SSE prioritaria en < 30ms con badge `[ ⚠️ QUIEBRE COCINA ]`, diálogo asistido en mesa: Opción A de Sustitución en catálogo inteligente con diferencial de precio vs. Opción B de Anulación sin costo para el cliente con auditoría inmutable en `pedido_anulacion`, `es_merma = false` y acuse en `CU-ADMIN-12`).

### 4.5 Rol Cocina (`wireframe/cocina/`) — 👨‍🍳 100% CULMINADO
- `CU-COCINA-01`: Ver cola de pedidos entrantes (Kitchen Display System - KDS) (Filtro estricto `pr.requiere_preparacion = true`, semáforo cromático dinámico basado en `configuracion_kds`, orden FIFO columnar en 4 cuadrantes, vista dual con Consolidado Global "All-Day Summary" por partidas de fuego, soporte para mesas unidas `Mesa [ 02 ; 03 ]`, rondas y parada reactiva de fogones por SSE ante cancelaciones de salón).
- `CU-COCINA-02`: Actualizar estado de preparación (Pase Caliente, Deshacer y Despacho) (Estados táctiles en lenguaje cotidiano `Por Preparar`, `En Fuego` y `Listo en Pase`; timestamps `fecha_inicio_coccion` y `fecha_listo_cocina`; ventana de Deshacer de 30s con rollback atómico de insumos al inventario; búfer de recuperación "Devolver a Cocina" de 30m; tandas masivas en All-Day; y alerta reactiva SSE al mozo/runner con cuenta regresiva de pase de 3 minutos).
- `CU-COCINA-03`: Descuento automático de insumos por consumo (Proceso de sistema con deducción atómica según receta culinaria `producto_insumo`, política de servicio continuo sin bloqueo de fogones, piso no negativo `GREATEST`, auditoría de discrepancias en `auditoria_stock_ajuste`, cascada a carta digital y notificación Toast SSE al Administrador).
- `CU-COCINA-04`: Marcar producto como agotado / disponible (Modal táctil de quiebres en KDS, selector numérico ultra rápido FIFO para porciones parciales en fuego $K < N$, ajuste fino comanda por comanda, y alerta reactiva a salón `CU-MOZO-07` y Administrador).
- `CU-COCINA-05`: Recibir notificación de anulación de pedido (Parada acústica y visual en pantalla KDS, retiro de comanda, descarte o merma según avance de cocción; integrado en Vista 3 de `CU-COCINA-01`).

---

## 5. Próximos Casos de Uso Pendientes (Prioridad: Entrega en 1 Semana)

Con **Mozo** y **Cocina** 100% culminados, el camino más directo para completar el ciclo del restaurante es el **Rol Cajero (Punto de Venta y Liquidación)**:

1. **`CU-CAJA-01: Apertura de turno de caja`**:
   - Registro de monto inicial / fondo de caja en efectivo, verificación de turno previo cerrado y validación de terminal físico.
2. **`CU-CAJA-02: Generar cuenta a partir de pedidos de una mesa`**:
   - Precuenta de mesa (consumos consolidados, mesas unidas `Mesa [ 02 ; 03 ]`, desglose de IGV 18%, cálculo predictivo de promociones `CU-ADMIN-17` y solicitud desde mozo).
3. **`CU-CAJA-03: Cobrar comanda y emitir comprobante electrónico (Boleta/Factura)`**:
   - Medios de pago mixtos (Efectivo, Tarjeta, Yape/Plin), cálculo de vuelto, propina opcional y emisión legal.
4. **`CU-CAJA-04: Dividir cuenta entre varios comensales`**:
   - División equitativa (entre $N$ personas) o por ítems consumidos individualmente.
5. **`CU-CAJA-05: Anular pedido ya cobrado`**:
   - Emisión de Nota de Crédito con motivo y control de seguridad.
6. **`CU-CAJA-06: Cerrar caja (arqueo)`**:
   - Cuadre ciego de efectivo, conciliación POS/bancaria, sobrantes/faltantes y generación de reporte Z de cierre de turno.

---
