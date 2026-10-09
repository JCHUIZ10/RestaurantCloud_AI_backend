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
- `CU-ADMIN-17`: Gestionar promociones del local (cálculo predictivo para caja, semántica NULL, plantilla de inauguración).

### 4.4 Rol Mozo en Salón (`wireframe/mozo/`)
- `CU-MOZO-01`: Ver estado de mesas y centro de comandas en vivo (Workspace unificado 70% salón / 30% barra lateral KDS en tiempo real con SSE).
- `CU-MOZO-02`: Tomar pedido y comanda móvil en salón (Unifica funcionalmente `CU-MOZO-03` y `CU-MOZO-07`; pantalla 65% catálogo / 35% ticket borrador, nota de cocina simplificada con soporte NULL, gestión de rondas múltiples, enrutamiento KDS < 30ms).
- `CU-MOZO-06`: Anular pedido (o ítem de pedido) con motivo (Extensión directa del Quick-Drawer de `CU-MOZO-01`, autonomía operativa sin clave gerencial, chips de motivos frecuentes, tratamiento automático de merma `es_merma = true`, parada inmediata en KDS y alerta a administración).

---

## 5. Próximos Casos de Uso Pendientes

Para continuar con el proyecto en una nueva sesión, se recomienda abordar:

1. **Culminar el Rol Mozo:**
   - **`CU-MOZO-04: Unir o dividir mesas`**: Agrupación física y contable de mesas contiguas para comensales numerosos y separación tras desocupación.
   - **`CU-MOZO-05: Gestionar reservas`**: Asignación de mesas para reservas programadas, bloqueo preventivo automático y recepción de clientes.
2. **O continuar con Administrador del Local:**
   - **`CU-ADMIN-12: Recibir notificación de anulación de pedido`**: Monitor de auditoría en vivo que recibe las alertas emitidas por `CU-MOZO-06`.
   - **`CU-ADMIN-13: Ver reportes de ventas y desempeño`**.
   - **`CU-ADMIN-14: Consultar flujo de caja del local`**.
   - **`CU-ADMIN-15: Supervisar cierre de caja diario`**.
   - **`CU-ADMIN-16: Ver log de auditoría del local`**.
3. **O avanzar con el Rol Cocina (KDS):**
   - **`CU-COCINA-01: Ver cola de pedidos entrantes`**.
   - **`CU-COCINA-02: Cambiar estado de plato (en preparación, listo)`**.

---

## 6. Prompt Sugerido para Iniciar la Nueva Sesión

Copia y pega este mensaje al iniciar el nuevo chat para retomar inmediatamente el trabajo:

```text
Continuamos con el proyecto RestaurantCloud AI. 
Revisa @[context/INSTRUCCIONES_NUEVA_SESION.md], @[context/cu.md], @[context/modelo_datos.md] y @[context/walkthrough.md].
Hemos culminado exitosamente CU-MOZO-01, CU-MOZO-02 (unificado con 03 y 07) y CU-MOZO-06.
Prosigamos con /plan para CU-MOZO-04: Unir o dividir mesas (o indícame el siguiente caso de uso que prefieras abordar).
```
