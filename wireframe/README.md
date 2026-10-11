# Sistema de Wireframes y Contratos UI ↔ API — RestaurantCloud AI

Este directorio contiene las especificaciones de diseño estructural, arquitectura de información, flujos de interacción, casos inesperados (estados UX) y contratos de API (Frontend ↔ Backend) de la plataforma **RestaurantCloud AI**.

---

## 1. Filosofía de Diseño: Screen-First & Contract-First

En lugar de construir endpoints de backend a ciegas o diseñar interfaces sin reglas de negocio, seguimos una metodología desacoplada:

1. **Estándar Visual Grayscale Blueprint:**
   - Paleta cromática estricta en escala de grises y slate:
     - Backgrounds: `#FFFFFF` (superficies), `#F8FAFC` (canvas), `#F1F5F9` (tarjetas secundarias).
     - Bordes y líneas: `#E2E8F0`, `#CBD5E1`, `#94A3B8`.
     - Textos y contrastes: `#0F172A` (títulos y acentos dark), `#1E293B`, `#475569`, `#64748B`.
   - Tipografía limpia: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
   - Contraste accesible: Cumplimiento estricto de WCAG 2.1 AA (contraste > 4.5:1 para cuerpo de texto y > 14:1 para títulos).
   - Sin tokens cosméticos de marca finales: el diseño se concentra en jerarquía de información, orden de lectura, densidad y accesibilidad.
2. **Matriz de 5 Estados UX:** Toda pantalla debe definir su comportamiento en:
   - **Ideal:** Vista óptima con datos completos y paginados.
   - **Vacío (Empty):** Primera carga, búsqueda sin coincidencias o colecciones en cero con Call-To-Action (CTA).
   - **Carga (Loading):** Skeletons, spinners y prevención de doble submit idempotente.
   - **Error / Validación:** Alertas semánticas y mensajes de feedback al usuario.
   - **Borde / Inesperado:** Concurrencia, límites de suscripción SaaS, desconexión de red y salvaguardas transaccionales.
3. **Contratos Inmutables y Respuestas Go:** Los payloads de Request y Response respetan el estándar del proyecto en Go ([`context/mock.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/mock.md)), encapsulados bajo el envoltorio `pkg/apiresponse.Response{Exito, Datos, Errores, Meta}` y tipados con `pkg/apierror.AppError`.

---

## 2. Convención de Directorios y Organización

La estructura organiza las pantallas por **Rol** y **Caso de Uso** (trazable con [`context/cu.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/cu.md)):

```text
wireframe/
├── README.md                                          # Este archivo (Guía maestra del sistema)
├── <rol>/                                             # Rol del actor
│   └── <codigo_cu>-<slug-descriptivo>/                # Caso de uso específico
│       ├── wireframe.md                               # Especificación técnica, layout, estados y contratos
│       └── assets/                                    # Wireframes gráficos de alta fidelidad (.jpg)
│           ├── wf_<cu>_<pantalla_1>.jpg
│           ├── wf_<cu>_<pantalla_2>.jpg
│           ├── wf_<cu>_<pantalla_3>.jpg
│           └── wf_<cu>_<pantalla_4>.jpg
```

### Roles del Sistema:
- **`usuario`**: Casos de uso transversales a todos los actores autenticados (Login, Selección de cuenta, Perfil, etc.).
- **`saas_admin`**: Operaciones de plataforma global, gestión de tenants y catálogo de planes.
- **`propietario`**: Configuración corporativa, gestión de sedes/locales, suscripción Stripe y reportes consolidados.
- **`administrador` / `admin_local`**: Operación del local, configuración de salones/mesas, carta, personal, compras e incidentes.
- **`mozo`**: Punto de venta móvil/tablet, mapa de mesas, comanda digital y reservas.
- **`cocina`**: Sistema KDS (Kitchen Display System), estados de preparación y control de stock rápido.
- **`cajero`**: Facturación, cobros multimoneda/tarjeta, arqueo y cierre de caja.
- **`cliente`**: Consulta de carta interactiva por QR y consulta de comprobantes públicos.

---

## 3. Estructura Obligatoria de `wireframe.md`

Todo documento de especificación técnica debe incluir rigurosamente las siguientes 8 secciones:

1. **Ficha Técnica del Caso de Uso:** Código CU, Nombre, Actor(es), Dispositivos/Viewports (`1440x900`, `768x1024`, `375x812`), Precondiciones y Postcondiciones.
2. **Diagrama de Flujo y Secuencia (Mermaid):** Interacciones numeradas entre Actor, Frontend, Backend Go, PostgreSQL con RLS y canales reactivos (SSE / S3).
3. **Especificación de Pantallas y Wireframes Blueprint (4 Vistas Estándar):**
   - Vista 1: Dashboard / Bandeja principal con métricas KPI.
   - Vista 2: Formulario / Modal interactivo de creación o acción con validaciones.
   - Vista 3: Modal de inspección, detalle, seguimiento o resolución definitiva.
   - Vista 4: Estado vacío positivo / Onboarding inicial o Paywall.
   - *Cada vista incluye:* enlace a imagen en `assets/`, layout estructural en arte ASCII y desglose de interacciones.
4. **Matriz de Control de Acceso (RBAC):** Permisos cruzados entre roles (Propietario vs Admin Local vs Mozo vs Cocina vs Cajero).
5. **Contratos de API Go y DTOs (`internal/domain/<modulo>/dto.go`):** Structs en Go tipados con UUID, enums y etiquetas de binding/JSON.
6. **Catálogo de Endpoints REST:** Métodos HTTP, URIs, códigos de estado y catálogo de errores de negocio `AppError`.
7. **Modelo Relacional PostgreSQL 16:** DDL de tablas, secuencias, constraints de consistencia, índices de optimización y políticas RLS (`app.current_local_id`).
8. **Checklist de Accesibilidad WCAG 2.1 AA:** Contrastes medidos, navegación completa por teclado, atributos semánticos ARIA y live regions.

---

## 4. Pipeline de Generación de Wireframes Blueprint

Para garantizar wireframes vectoriales pixel-perfect con tipografía Segoe UI exacta, sin distorsiones ni dependencia de cuotas de APIs externas, se utiliza el motor automatizado con **Microsoft Edge Headless** y **Pillow (PIL)**:

```python
# Flujo ejecutado desde python en la máquina local:
# 1. Se define la plantilla HTML con COMMON_CSS (Grayscale Blueprint: #0F172A, #F8FAFC, bordes #E2E8F0).
# 2. Se toma captura de pantalla headless a 1440x900:
#    msedge.exe --headless=new --disable-gpu --screenshot="assets/wf.png" --window-size=1440,900 "file:///ruta.html"
# 3. Pillow convierte y optimiza la imagen a JPG calidad 95:
#    Image.open("wf.png").convert("RGB").save("assets/wf.jpg", "JPEG", quality=95)
```

---

## 5. Inventario de Casos de Uso Culminados

La bitácora histórica detallada de todas las decisiones, esquemas y capturas se encuentra en [`context/walkthrough.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/context/walkthrough.md).

| Caso de Uso | Módulo / Pantalla | Estado | Directorio de Especificación |
| :--- | :--- | :---: | :--- |
| **`CU-PROP-01`** | Registro de empresa y autoservicio | ✅ Completado | `wireframe/propietario/CU-PROP-01-registro-empresa/` |
| **`CU-PROP-02`** | Gestión de suscripción y método de pago | ✅ Completado | `wireframe/propietario/CU-PROP-02-gestionar-suscripcion/` |
| **`CU-PROP-03`** | Cambio de plan y límites SaaS | ✅ Completado | `wireframe/propietario/CU-PROP-03-cambiar-plan/` |
| **`CU-PROP-04`** | Registrar y administrar locales | ✅ Completado | `wireframe/propietario/CU-PROP-04-administrar-locales/` |
| **`CU-PROP-05`** | Crear y gestionar administradores de local | ✅ Completado | `wireframe/propietario/CU-PROP-05-administradores-local/` |
| **`CU-PROP-06`** | Ver incidentes corporativos de la empresa | ✅ Completado | `wireframe/propietario/CU-PROP-06-incidentes-empresa/` |
| **`CU-ADMIN-01`** | Gestión del plano de mesas de sede | ✅ Completado | `wireframe/administrador/CU-ADMIN-01-plano-mesas/` |
| **`CU-ADMIN-02`** | Categorías de la carta | ✅ Completado | `wireframe/administrador/CU-ADMIN-02-categorias-carta/` |
| **`CU-ADMIN-03`** | Productos y combos de la carta | ✅ Completado | `wireframe/administrador/CU-ADMIN-03-productos-carta/` |
| **`CU-ADMIN-04`** | Personal operativo del local | ✅ Completado | `wireframe/administrador/CU-ADMIN-04-personal-local/` |
| **`CU-ADMIN-05`** | Insumos y stock inicial | ✅ Completado | `wireframe/administrador/CU-ADMIN-05-insumos-stock/` |
| **`CU-ADMIN-06`** | Proveedores de insumos | ✅ Completado | `wireframe/administrador/CU-ADMIN-06-proveedores/` |
| **`CU-ADMIN-07`** | Ficha y recepción de compra | ✅ Completado | `wireframe/administrador/CU-ADMIN-07-recepcion-compra/` |
| **`CU-ADMIN-08`** | Roles y permisos de sede | ✅ Completado | `wireframe/administrador/CU-ADMIN-08-personal-local/` |
| **`CU-ADMIN-09`** | Horario de atención y feriados del local | ✅ Completado | `wireframe/administrador/CU-ADMIN-09-horario-atencion/` |
| **`CU-ADMIN-10`** | Políticas y parámetros de reservas | ✅ Completado | `wireframe/administrador/CU-ADMIN-10-politicas-reservas/` |
| **`CU-ADMIN-11`** | Historial de incidentes internos de sede | ✅ Completado | `wireframe/administrador/CU-ADMIN-11-incidentes-internos/` |
| **`CU-ADMIN-12`** | Recibir notificación de anulación de pedido y auditoría | ✅ Completado | `wireframe/administrador/CU-ADMIN-12-notificacion-anulacion/` |
| **`CU-ADMIN-13`** | Ver reportes de ventas y desempeño (Dashboard, Menú Engineering y Mozos) | ✅ Completado | `wireframe/administrador/CU-ADMIN-13-reportes-ventas/` |
| **`CU-ADMIN-14`** | Gestión de flujo de caja, gastos operativos y auditoría de cierres Z (integra CU-ADMIN-15) | ✅ Completado | `wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/` |
| **`CU-ADMIN-17`** | Gestionar promociones del local | ✅ Completado | `wireframe/administrador/CU-ADMIN-17-gestionar-promociones/` |
| **`CU-ADMIN-18`** | Configurar parámetros operativos de comanda y tiempos de KDS | ✅ Completado | `wireframe/administrador/CU-ADMIN-18-configurar-parametros-kds/` |
| **`CU-ADMIN-19`** | Configurar métodos de pago y comisiones de cobro del local | ✅ Completado | `wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/` |
| **`CU-MOZO-01`** | Ver estado de mesas y centro de comandas en vivo | ✅ Completado | `wireframe/mozo/CU-MOZO-01-estado-mesas/` |
| **`CU-MOZO-02`** | Tomar pedido y comanda móvil (unifica CU-MOZO-03 y 07) | ✅ Completado | `wireframe/mozo/CU-MOZO-02-tomar-pedido/` |
| **`CU-MOZO-04`** | Unir o dividir mesas en salón | ✅ Completado | `wireframe/mozo/CU-MOZO-04-unir-dividir-mesas/` |
| **`CU-MOZO-05`** | Gestionar reservas y recepción en salón | ✅ Completado | `wireframe/mozo/CU-MOZO-05-gestionar-reservas/` |
| **`CU-MOZO-06`** | Anular pedido (o ítem de pedido) con motivo | ✅ Completado | `wireframe/mozo/CU-MOZO-06-anular-pedido/` |
| **`CU-MOZO-07`** | Atender incidencia de plato no disponible y resolver en mesa | ✅ Completado | `wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/` |
| **`CU-MOZO-08`** | Consultar y presentar precuenta digital en mesa | ✅ Completado | `wireframe/mozo/CU-MOZO-08-precuenta-digital/` |
| **`CU-MOZO-09`** | Subdividir comanda en mesa y asociar comprobantes (Factura, Boleta, Nota Venta) | ✅ Completado | `wireframe/mozo/CU-MOZO-09-subdividir-comanda/` |
| **`CU-COCINA-01`** | Ver cola de pedidos entrantes (Kitchen Display System - KDS) | ✅ Completado | `wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/` |
| **`CU-COCINA-02`** | Actualizar estado de preparación (Pase Caliente, Deshacer y Despacho) | ✅ Completado | `wireframe/cocina/CU-COCINA-02-actualizar-estado-preparacion/` |
| **`CU-COCINA-03`** | Descuento automático de insumos por consumo | ✅ Completado | `wireframe/cocina/CU-COCINA-03-descuento-automatico-insumos/` |
| **`CU-COCINA-04`** | Marcar producto como agotado / disponible (Quiebres y Asignación FIFO) | ✅ Completado | `wireframe/cocina/CU-COCINA-04-marcar-producto-agotado/` |
| **`CU-COCINA-05`** | Recibir notificación de anulación de pedido (Parada de Fogón en KDS) | ✅ Completado | `wireframe/cocina/CU-COCINA-01-cola-pedidos-kds/` (Vista 3) |
| **`CU-CAJA-01`** | Apertura de turno de caja (Terminal única e ingreso directo de efectivo) | ✅ Completado | `wireframe/cajero/CU-CAJA-01-apertura-turno/` |
| **`CU-CAJA-02`** | Generar cuenta a partir de pedidos de una mesa (Precuenta Digital / POS) | ✅ Completado | `wireframe/cajero/CU-CAJA-02-generar-precuenta/` |
| **`CU-CAJA-03`** | Cobro de comanda y emisión de comprobantes oficiales (Factura, Boleta, Nota Venta) | ✅ Completado | `wireframe/cajero/CU-CAJA-03-cobrar-comanda/` |
| **`CU-CAJA-04`** | Anular comprobante / pedido ya cobrado y emisión de Nota de Crédito Electrónica | ✅ Completado | `wireframe/cajero/CU-CAJA-04-anular-comprobante/` |
| **`CU-CAJA-05`** | Cerrar caja (arqueo Z) y rendición de cuentas del turno | ✅ Completado | `wireframe/cajero/CU-CAJA-05-cerrar-caja/` |
| **`CU-CLIENTE-01`** | Consultar carta digital (Catálogo Interactivo Web) | ✅ Completado | `wireframe/cliente/CU-CLIENTE-01-consultar-carta/` |
| **`CU-CLIENTE-02`** | Buscar comprobante de pago (Visor Digital de Comprobantes Electrónicos) | ✅ Completado | `wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/` |
| **`CU-SAAS-01`** | Supervisar empresas registradas, activaciones y renovaciones de suscripción | ✅ Completado | `wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/` |
| **`CU-SAAS-02`** | Dar de baja / suspender empresa conforme a ley | ✅ Completado | `wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/` |
| **`CU-SAAS-03`** | Configurar planes de suscripción (Tarifas, Cuotas y Cero Roturas) | ✅ Completado | `wireframe/saas_admin/CU-SAAS-03-configurar-planes/` |
| **`CU-TRANS-01`** | Recibir notificaciones del sistema (Campana, Drawer in-situ y Toasts reactivos) | ✅ Completado | `wireframe/usuario/CU-TRANS-01-notificaciones-sistema/` |

> 🏆 **ROL MOZO 100% CULMINADO (9 Casos de Uso):** Todos los casos de uso del rol Mozo (`CU-MOZO-01` a `CU-MOZO-09`) se encuentran plenamente especificados con wireframes Blueprint, modelos relacionales, contratos Go y flujo reactivo SSE. Incluye salón en vivo, comandas táctiles, unión de mesas, reservas con mini-mapa, comercialización con promociones independientes (`CU-ADMIN-17`), precuenta digital con pago QR y **subdivisión determinista de comandas en mesa con tres comprobantes (Factura, Boleta y Nota de Venta)**.
> 
> 👨‍🍳 **ROL COCINA 100% CULMINADO:** Todos los casos de uso del rol Cocina (`CU-COCINA-01`, `02`, `03`, `04` y `05`) se encuentran 100% terminados y sincronizados: KDS interactivo con semáforo dinámico de sede (`CU-ADMIN-18`), pase caliente táctil con timer y rollback de inventario al deshacer (30s), recuperación de tickets despachados (30m), deducción atómica de recetas sin bloqueo de servicio, gestión de quiebres con asignación FIFO justa para porciones parciales en fuego y alertas reactivas de parada.
> 
> 💳 **ROL CAJERO 100% CULMINADO (5 Casos de Uso: CU-CAJA-01 a CU-CAJA-05):** Todos los casos de uso de Caja, POS y Facturación se encuentran 100% completados con wireframes Blueprint en alta resolución (1440x900) y especificaciones técnicas canónicas. Incluye política de terminal única por sede (`uq_caja_abierta_local`), fondo inicial directo, precuenta digital desacoplada con promociones predictivas (`CU-ADMIN-17`) y medios de pago (`CU-ADMIN-19`), cobro formal con tres comprobantes (Factura, Boleta y Nota de Venta) con consulta ApiPerú y persistencia en tabla `cliente` (`detalle JSONB`), control de series y correlatividad monótona con bloqueo transaccional ACID (`comprobante_serie`), digitación directa de efectivo con display de vuelto, liquidación atómica por comanda completa o subcuentas (`CU-MOZO-09` / `CU-CAJA-03`), anulación formal con Nota de Crédito Electrónica (`FC01`/`BC01`), catálogo SUNAT 09, filtros segmentados por estado (Vigentes vs Anulados), reversión en flujo de caja (`caja_movimiento`), verificación Poka-Yoke de salón al día, arqueo Z con digitación directa, y emisión de Reporte Z Digital oficial con consolidación fiscal bajo estricta política Cero Papel.
>
> 📱 **ROL CLIENTE 100% CULMINADO (2 Casos de Uso: CU-CLIENTE-01 y CU-CLIENTE-02):**
> - `CU-CLIENTE-01`: Catálogo digital interactivo web de la carta accesible por enlace amigable (`https://app.restaurantcloud.pe/sede/:slug/carta`), botones de contacto directo a WhatsApp y llamada, buscador en tiempo real, carrusel de categorías y sincronización en vivo con quiebres de cocina.
> - `CU-CLIENTE-02`: Visor digital de comprobantes electrónicos (Boletas, Facturas y Notas de Venta) con capability token seguro (`token_qr` UUID v8), descarga de PDF oficial y XML electrónico (UBL 2.1), auditoría de comprobantes anulados con Nota de Crédito, y estricta privacidad de datos personales (cero búsqueda por DNI/RUC).
>
> 👨‍💼 **ROL ADMIN SAAS EN CURSO:**
> - `CU-SAAS-01`: Centro de control global de tenants, supervisión proactiva del ciclo de vida de clientes gastronómicos, monitoreo de cobros en Stripe, período de gracia de 5 días según `CU-PROP-02`, e incorporación de altas manuales B2B con comprobantes bancarios verificados en la tabla `pago`.
> - `CU-SAAS-02`: Protocolo formal de suspensión preventiva y bajas conforme a la Ley N° 29733 de Protección de Datos Personales / RGPD, entidad dedicada `suscripcion_suspension`, paquete de portabilidad descargable (.ZIP), retención legal de 30 días, confirmación Poka-Yoke por RUC y pantalla informativa de corte operativo canalizada a WhatsApp (+51 930 723 537).
> - `CU-SAAS-03`: Catálogo comercial de planes (Starter hasta 25 mesas sin reservas, Pro, Enterprise y convenios privados B2B), arquitectura de cero roturas con bloqueo de DELETE físico (`ON DELETE RESTRICT`), grandfathering nativo en Stripe para clientes existentes y respuestas estandarizadas bajo `apiresponse.Response` y `apierror`.
| **`CU-TRANS-01`** | Recibir notificaciones del sistema (Campana, Drawer in-situ y Toasts reactivos) | ✅ Completado | `wireframe/usuario/CU-TRANS-01-notificaciones-sistema/` |
>
> 🔔 **SISTEMA TRANSVERSAL CULMINADO (CU-TRANS-01):**
> - `CU-TRANS-01`: Recepción, visualización y gestión in-situ de notificaciones operativas y administrativas (SSE reactivo con polling fallback, campana global, panel lateral drawer 440px sin redirecciones de pantalla, detalle expandido y alertas flotantes Toasts).
>
> 🏆 **TOTAL ACUMULADO:** **49 Casos de Uso 100% Culminados** con diseño de pantalla canónico, arquitectura de datos y contratos Go, cubriendo el ciclo operativo completo del restaurante de punta a punta.

## 6. Casos de Uso Diferidos a Fase Futura (Backlog) y Omitidos

Los siguientes casos de uso han sido reclasificados estratégicamente para optimizar el ciclo de entrega y focalizar el desarrollo en el motor operativo principal:

### 6.1 Pospuestos a Fase Futura (Backlog Analítico / IA / Telemetría)
- **`CU-ADMIN-07`**: *Ver recomendaciones de reposición de insumos (IA)* — Pronósticos predictivos de reabastecimiento culinario.
- **`CU-ADMIN-16`**: *Consultar log de auditoría del local* — Visor consolidado de eventos de seguridad (cada acción sensible ya cuenta con auditoría transaccional ACID en su respectiva tabla: `pedido_anulacion`, `auditoria_stock_ajuste`, `comprobante`, `caja.revisado`).
- **`CU-PROP-07`** *(ex-06)*: *Ver reportes consolidados de la empresa* — Consolidado multi-sede a nivel corporativo.
- **`CU-PROP-08`** *(ex-07)*: *Ver predicciones de demanda a nivel empresa* — Forecasting macro multi-sede con IA.
- **`CU-SAAS-04`**: *Monitorear salud de la plataforma* — Telemetría global de microservicios y cuotas multi-tenant.
- **`CU-SAAS-05`**: *Consultar log de auditoría global* — Bitácora forense de soporte SaaS transversal.

### 6.2 Omitidos por Absorción Arquitectónica
- **`CU-PROP-08 (Antiguo)`**: *Configurar políticas generales de la empresa* — Omitido formalmente por ser incompatible con la autonomía de sede en gastronomía real. Absorbido de forma ágil y descentralizada en:
  - `CU-PROP-04` (`giro_negocio` para aprovisionamiento inicial automático de carta por sede).
  - `CU-ADMIN-10` (Políticas de reservas por sede).
  - `CU-ADMIN-17` (Promociones comerciales por sede).
  - `CU-ADMIN-18` (Tiempos y semáforos de KDS por sede).
  - `CU-ADMIN-19` (Métodos de pago y comisiones por sede).
- **`CU-ADMIN-15`**: *Supervisar cierre de caja diario e historial de Reportes Z* — Integrado formalmente en el módulo maestro `CU-ADMIN-14`.
