# Walkthrough: Wireframes Estructurales y Contratos API — RestaurantCloud AI

Se ha completado el diseño estructural, la especificación de estados UX y los contratos de API frontend-backend para:
1. **Autenticación e Inicio de Sesión (`CU-AUTH-01`)** bajo el rol `usuario`.
2. **Recuperación de Contraseña con Código OTP (`CU-AUTH-02`)** bajo el rol `usuario`.
3. **Registro de Empresa y Checkout con Verificación OTP (`CU-PROP-01`)** bajo el rol `propietario`.
4. **Gestión de Suscripción y Método de Pago (`CU-PROP-02`)** bajo el rol `propietario`.
5. **Cambiar Plan de Suscripción (`CU-PROP-03`)** bajo el rol `propietario`.
6. **Registrar y Administrar Locales (`CU-PROP-04`)** bajo el rol `propietario`.
7. **Crear y Gestionar Administradores de Local (`CU-PROP-05`)** bajo el rol `propietario`.

---

## 1. Entregables Generados en el Repositorio

Todos los archivos han sido organizados bajo la estructura convenida `wireframe/<rol>/<cu>/...`:

1. **Guía General de Wireframes:**
   - [`wireframe/README.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/README.md): Metodología de 5 estados UX, catálogo de roles y plantilla estándar.
2. **CU-AUTH-01: Iniciar Sesión y Selección Multi-Cuenta:**
   - Especificación: [`wireframe/usuario/CU-AUTH-01-iniciar-sesion/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-01-iniciar-sesion/wireframe.md)
   - Vista 1: [`assets/wf_login_credenciales.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-01-iniciar-sesion/assets/wf_login_credenciales.jpg)
   - Vista 2: [`assets/wf_login_seleccion_cuenta.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-01-iniciar-sesion/assets/wf_login_seleccion_cuenta.jpg)
3. **CU-AUTH-02: Recuperar Contraseña mediante Código OTP:**
   - Especificación: [`wireframe/usuario/CU-AUTH-02-recuperar-password/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-02-recuperar-password/wireframe.md)
   - Paso 1: [`assets/wf_otp_solicitud.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-02-recuperar-password/assets/wf_otp_solicitud.jpg)
   - Paso 2: [`assets/wf_otp_verificacion.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-02-recuperar-password/assets/wf_otp_verificacion.jpg)
   - Paso 3: [`assets/wf_otp_nueva_clave.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/usuario/CU-AUTH-02-recuperar-password/assets/wf_otp_nueva_clave.jpg)
4. **CU-PROP-01: Registro de Empresa y Checkout con Verificación OTP:**
   - Especificación: [`wireframe/propietario/CU-PROP-01-registro-empresa/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/wireframe.md)
   - Paso 2: [`assets/wf_prop_01_datos_empresa.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/assets/wf_prop_01_datos_empresa.jpg)
   - Paso 3: [`assets/wf_prop_01_verificacion_otp.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/assets/wf_prop_01_verificacion_otp.jpg)
   - Paso 4: [`assets/wf_prop_01_pago_stripe.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/assets/wf_prop_01_pago_stripe.jpg)
   - Paso 5: [`assets/wf_prop_01_registro_exitoso.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/assets/wf_prop_01_registro_exitoso.jpg)
5. **CU-PROP-02: Gestionar Suscripción y Método de Pago:**
   - Especificación: [`wireframe/propietario/CU-PROP-02-gestionar-suscripcion/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-02-gestionar-suscripcion/wireframe.md)
   - Vista 1: [`assets/wf_prop_02_panel_suscripcion.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-02-gestionar-suscripcion/assets/wf_prop_02_panel_suscripcion.jpg)
   - Vista 2: [`assets/wf_prop_02_actualizar_tarjeta.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-02-gestionar-suscripcion/assets/wf_prop_02_actualizar_tarjeta.jpg)
   - Vista 3: [`assets/wf_prop_02_cobro_fallido.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-02-gestionar-suscripcion/assets/wf_prop_02_cobro_fallido.jpg)
6. **CU-PROP-03: Cambiar Plan de Suscripción:**
   - Especificación: [`wireframe/propietario/CU-PROP-03-cambiar-plan/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-03-cambiar-plan/wireframe.md)
   - Vista 1: [`assets/wf_prop_03_comparativa_planes.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-03-cambiar-plan/assets/wf_prop_03_comparativa_planes.jpg)
   - Vista 2: [`assets/wf_prop_03_modal_upgrade_prorrateo.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-03-cambiar-plan/assets/wf_prop_03_modal_upgrade_prorrateo.jpg)
   - Vista 3: [`assets/wf_prop_03_asistente_downgrade_recursos.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-03-cambiar-plan/assets/wf_prop_03_asistente_downgrade_recursos.jpg)
7. **CU-PROP-04: Registrar y Administrar Locales:**
   - Especificación: [`wireframe/propietario/CU-PROP-04-administrar-locales/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/wireframe.md)
   - Vista 1: [`assets/wf_prop_04_directorio_locales.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_directorio_locales.jpg)
   - Vista 2: [`assets/wf_prop_04_formulario_local.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_formulario_local.jpg)
   - Vista 3: [`assets/wf_prop_04_modal_desactivar_local.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_modal_desactivar_local.jpg)
8. **CU-PROP-05: Crear y Gestionar Administradores de Local:**
   - Especificación: [`wireframe/propietario/CU-PROP-05-administradores-local/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-05-administradores-local/wireframe.md)
   - Vista 1: [`assets/wf_prop_05_directorio_admins.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-05-administradores-local/assets/wf_prop_05_directorio_admins.jpg)
   - Vista 2: [`assets/wf_prop_05_modal_invitar_admin.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-05-administradores-local/assets/wf_prop_05_modal_invitar_admin.jpg)
   - Vista 3: [`assets/wf_prop_05_modal_reasignar_admin.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-05-administradores-local/assets/wf_prop_05_modal_reasignar_admin.jpg)
9. **CU-ADMIN-17: Gestionar Promociones del Local:**
   - Especificación: [`wireframe/administrador/CU-ADMIN-17-gestionar-promociones/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-17-gestionar-promociones/wireframe.md)
   - Vista 1: [`assets/wf_admin_17_bandeja_promociones.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-17-gestionar-promociones/assets/wf_admin_17_bandeja_promociones.jpg)
   - Vista 2: [`assets/wf_admin_17_formulario_modal.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-17-gestionar-promociones/assets/wf_admin_17_formulario_modal.jpg)
   - Vista 3: [`assets/wf_admin_17_detalle_metricas_modal.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-17-gestionar-promociones/assets/wf_admin_17_detalle_metricas_modal.jpg)
   - Vista 4: [`assets/wf_admin_17_onboarding_vacio.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-17-gestionar-promociones/assets/wf_admin_17_onboarding_vacio.jpg)
10. **CU-MOZO-01: Ver Estado de Mesas y Centro de Comandas en Vivo:**
   - Especificación: [`wireframe/mozo/CU-MOZO-01-estado-mesas/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-01-estado-mesas/wireframe.md)
   - Vista 1: [`assets/wf_mozo_01_plano_pedidos.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-01-estado-mesas/assets/wf_mozo_01_plano_pedidos.jpg)
   - Vista 2: [`assets/wf_mozo_01_inspeccion_mesa_drawer.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-01-estado-mesas/assets/wf_mozo_01_inspeccion_mesa_drawer.jpg)
   - Vista 3: [`assets/wf_mozo_01_alerta_cocina_modal.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-01-estado-mesas/assets/wf_mozo_01_alerta_cocina_modal.jpg)
   - Vista 4: [`assets/wf_mozo_01_inicio_turno_vacio.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-01-estado-mesas/assets/wf_mozo_01_inicio_turno_vacio.jpg)
11. **CU-MOZO-02: Tomar Pedido y Comanda Móvil en Salón:**
   - Especificación: [`wireframe/mozo/CU-MOZO-02-tomar-pedido/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-02-tomar-pedido/wireframe.md)
   - Vista 1: [`assets/wf_mozo_02_toma_pedido.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-02-tomar-pedido/assets/wf_mozo_02_toma_pedido.jpg)
   - Vista 2: [`assets/wf_mozo_02_modal_nota_cocina.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-02-tomar-pedido/assets/wf_mozo_02_modal_nota_cocina.jpg)
   - Vista 3: [`assets/wf_mozo_02_ronda_adicional.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-02-tomar-pedido/assets/wf_mozo_02_ronda_adicional.jpg)
   - Vista 4: [`assets/wf_mozo_02_conflicto_agotado_modal.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-02-tomar-pedido/assets/wf_mozo_02_conflicto_agotado_modal.jpg)
12. **CU-MOZO-06: Anular Pedido (o Ítem de Pedido) con Motivo:**
   - Especificación: [`wireframe/mozo/CU-MOZO-06-anular-pedido/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-06-anular-pedido/wireframe.md)
   - Vista 1: [`assets/wf_mozo_06_inspeccion_anulacion.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-06-anular-pedido/assets/wf_mozo_06_inspeccion_anulacion.jpg)
   - Vista 2: [`assets/wf_mozo_06_modal_anular_item.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-06-anular-pedido/assets/wf_mozo_06_modal_anular_item.jpg)
   - Vista 3: [`assets/wf_mozo_06_modal_anular_comanda_total.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-06-anular-pedido/assets/wf_mozo_06_modal_anular_comanda_total.jpg)
   - Vista 4: [`assets/wf_mozo_06_alerta_merma.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-06-anular-pedido/assets/wf_mozo_06_alerta_merma.jpg)

---

## 2. Vistas Estructurales de CU-AUTH-01 (Login)

### Vista 1: Pantalla de Credenciales
![Wireframe Login Credenciales](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_login_credenciales_1790871099118.jpg)

### Vista 2: Selector de Restaurante / Sede
![Wireframe Selector de Cuentas](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_login_selector_timer_1790873342298.jpg)

---

## 3. Vistas Estructurales de CU-AUTH-02 (Recuperación con OTP)

### Paso 1: Solicitud con Correo Registrado
![Paso 1: Solicitud OTP](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_otp_solicitud_1790873983508.jpg)

### Paso 2: Verificación del Código OTP (6 dígitos)
![Paso 2: Verificación OTP](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_otp_verificacion_1790874013168.jpg)

### Paso 3: Definición de Nueva Contraseña
![Paso 3: Nueva Contraseña](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_otp_nueva_clave_1790874088742.jpg)

---

## 4. Vistas Estructurales de CU-PROP-01 (Onboarding Propietario con OTP Previo)

### Paso 2: Datos de Empresa y Propietario (Mercado Perú)
![Paso 2: Datos de Empresa](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_01_datos_empresa_ruc_1790913095196.jpg)

### Paso 3: Verificación OTP del Correo Electrónico
![Paso 3: Verificación OTP](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_01_verificacion_otp_1790911461134.jpg)

### Paso 4: Checkout Seguro con Stripe
![Paso 4: Checkout Stripe](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_01_pago_stripe_1790911495526.jpg)

### Paso 5: Pantalla de Registro Exitoso, Constancia y Soporte Técnico
![Paso 5: Registro Exitoso y Soporte](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_01_registro_exitoso_1790914323150.jpg)

---

## 5. Vistas Estructurales de CU-PROP-02 (Gestionar Suscripción y Facturación)

### Vista 1: Panel General de Suscripción
Muestra el plan activo, próxima fecha de cobro, métricas de consumo de límites (locales y mesas con barras de progreso), tarjeta actual e historial de facturas con descarga de PDF.
![Panel General Suscripción](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_02_panel_suscripcion_1790915182158.jpg)

### Vista 2: Modal de Actualización de Tarjeta (Stripe Elements)
Modal para actualizar el método de pago por defecto mediante SetupIntent sin recargar la página.
![Modal Actualizar Tarjeta](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_02_actualizar_tarjeta_1790915227224.jpg)

### Vista 3: Caso Inesperado — Cobro Fallido y Dunning (Periodo de Gracia)
Banner de advertencia en caso de que Stripe rechace el cobro recurrente. Ofrece 5 días de gracia para regularizar la deuda antes de suspender el servicio.
![Cobro Fallido y Dunning](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_02_cobro_fallido_1790915358896.jpg)

---

## 6. Vistas Estructurales de CU-PROP-03 (Cambiar Plan de Suscripción)

### Vista 1: Tabla Comparativa de Planes y Límites de Recursos
Visualización lado a lado de los planes Starter, Pro y Enterprise con cuotas exactas de los 4 recursos (`locales`, `pisos`, `mesas`, `usuarios`) y módulos de IA.
![Comparativa de Planes](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_03_comparativa_1790985964488.jpg)

### Vista 2: Modal de Confirmación de Upgrade con Prorrateo Stripe
Previsualización financiera transparente antes de cobrar: crédito no utilizado de días restantes, costo proporcional del nuevo plan, neto a pagar hoy y confirmación con un clic.
![Modal Upgrade Prorrateo](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_03_upgrade_1790986002134.jpg)

### Vista 3: Asistente Wizard de Conciliación de Recursos (Downgrade No Destructivo)
Asistente guiado de 4 pasos (`Locales` → `Pisos` → `Mesas` → `Personal`) que permite elegir qué recursos quedarán activos a partir de la renovación, pausando los excedentes sin borrar datos históricos ni ventas previas.
![Asistente Downgrade Recursos](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_03_wizard_1790986055350.jpg)

---

## 7. Vistas Estructurales de CU-PROP-04 (Registrar y Administrar Locales)

### Vista 1: Directorio de Locales y Medidor de Cupo del Plan
Listado de todas las sedes de la empresa mostrando dirección, teléfono, administrador asignado (o aviso de supervisión directa), capacidad de pisos/mesas y barra de cuota activa.
![Directorio de Locales](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_04_directorio_1790987897304.jpg)

### Vista 2: Modal de Registro y Edición de Sede
Formulario enfocado en el mercado peruano (`PEN - S/`, `America/Lima`) con selector desacoplado de supervisión (auto-administración por el propietario o asignación de administrador).
![Formulario Modal Sede](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_04_formulario_1790987940564.jpg)

### Vista 3: Modal de Auditoría y Desactivación con Bloqueo Duro
Inspección en tiempo real de operaciones antes de dar de baja: si existen cajas abiertas o comandas en curso en el salón, la desactivación se bloquea de forma estricta hasta que se liquiden las órdenes y se cierren los turnos.
![Modal Desactivar con Bloqueo Duro](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_04_desactivar_1790988021567.jpg)

---

## 8. Vistas Estructurales de CU-PROP-05 (Crear y Gestionar Administradores de Local)

### Vista 1: Directorio de Administradores y Medidor de Cuentas de Personal
Monitoreo de administradores asignados por sede titular, barra de cuota `max_usuarios` del plan y estados de invitación.
![Directorio de Administradores](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_05_directorio_1790989302795.jpg)

### Vista 2: Modal de Invitación Segura de Administrador
Formulario con enlace seguro por correo (Magic Link 24h) en lugar de contraseñas inseguras en texto claro, selector de sede titular (regla 1:1) y medidor de cupo.
![Modal Invitar Administrador](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_05_invitar_1790989388167.jpg)

### Vista 3: Modal de Reasignación de Sede Titular
Transferencia inmediata de la supervisión de un local a otro con advertencia clara de consecuencias operativas y preservación de auditoría.
![Modal Reasignar Sede](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_05_reasignar_1790989400000.jpg)

---

## 9. Reglas de Negocio de Personal Administrativo

1. **Unicidad 1:1 de Administrador por Sede:** Para máxima claridad de responsabilidades, cada local activo cuenta con un único administrador titular.
2. **Invitación Segura Cero-Passwords:** Las contraseñas nunca viajan en correos electrónicos. Se utiliza un token efímero en Redis con expiración de 24 horas y consumo atómico.
3. **Control de Cupo `max_usuarios`:** El sistema valida contra el catálogo del plan que no se sobrepasen los cupos de personal activos contratados.
4. **Revocación Inmediata de Sesiones:** Desactivar a un administrador revoca inmediatamente sus tokens JWT mediante la lista negra en Redis.

---

## 10. Vistas Estructurales de CU-PROP-09 (Ver Incidentes de la Empresa)

### Vista 1: Bandeja Consolidada Multi-Sede y Tarjetas KPI
Supervisión corporativa con métricas de incidentes no revisados, hechos de gravedad alta en curso y total acumulado del mes, con filtrado multi-sede, categorías y alerta en vivo vía Server-Sent Events (SSE).
![Bandeja Consolidada de Incidentes](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_09_bandeja_incidentes.jpg)

### Vista 2: Modal de Detalle con Marcado Automático de Lectura y Paso a Revisión
Inspección pormenorizada de los hechos y evidencia fotográfica. Al abrir el modal, el backend registra automáticamente el acuse de lectura (`visto_por_propietario = true`, `fecha_visto = NOW()`). Si el propietario decide intervenir, puede redactar una directiva ejecutiva opcional (`nota_propietario`) y conmutar el estado a `en_revision`.
![Detalle de Incidente y Paso a Revisión](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_09_detalle_incidente.jpg)

### Vista 3: Estado Vacío Positivo
Pantalla informativa que valida que todas las sedes operan con normalidad sin novedades pendientes de revisión por parte del propietario.
![Estado Vacío Positivo](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_09_incidentes_vacio.jpg)

---

## 11. Reglas de Negocio de Supervisión Corporativa de Incidentes

1. **Marcado Automático de Acuse de Lectura:** El propietario no requiere presionar botones redundantes de "Marcar como leído". El consumo de `GET /api/v1/propietario/incidentes/{id}` actualiza de forma atómica e idempotente el timestamp `fecha_visto`.
2. **Doble Vía de Acción:** Si no requiere intervención, el propietario simplemente cierra el diálogo y el incidente sale de la lista de "No leídos". Si requiere seguimiento, presiona `[ Poner en Revisión ]` y emite su orden ejecutiva al administrador del local correspondiente.
3. **Alertas en Tiempo Real (SSE):** Hechos con `gravedad == 'alta'` disparan una notificación push instantánea al portal web de las sesiones activas del propietario.
4. **Aislamiento Multi-Tenant y Seguridad de Evidencias:** Acceso protegido por RLS de PostgreSQL y enlaces prefirmados temporales (15 min) para archivos fotográficos adjuntos.

---

## 12. Vistas Estructurales de CU-ADMIN-01 (Gestionar Plano de Mesas)

### Vista 1: Cuadrícula Modular Expandible del Salón con Pestañas de Ambientes
Distribución visual del local sobre una cuadrícula modular (5 columnas × 3 filas por defecto) con tarjetas de mesa distinguidas por forma geométrica (`cuadrada`, `redonda`, `rectangular`), capacidad de personas (`👤 x 4`), medidor de consumo de mesas del Plan Pro (`17 / 30`), ranuras vacías directas `[+]` para inserción rápida, pasillos centrales de circulación y botones duales de expansión/recorte: `[+ Columna]` / `[- Columna]` (a la derecha) y `[+ Agregar Fila al Fondo]` / `[- Quitar Última Fila]` (al fondo), con bloqueo de seguridad si contienen mesas activas.
![Grilla Visual del Salón y Pestañas](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_01_plano_grilla.jpg)

### Vista 2: Asistente Rápido de Creación en Lote
Asistente guiado de alta accesibilidad para nuevos administradores: permite definir la distribución geométrica mediante dos selectores tipo rango / slider (`Columnas` y `Filas`) con cálculo automático en vivo de mesas totales (`5 col × 2 filas = 10 MESAS TOTALES`), informando que la plantilla puede reorganizarse fácilmente en el plano.
![Asistente Rápido de Creación en Lote](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_01_generador_lote.jpg)

### Vista 3: Panel Lateral Quick-Drawer de Edición
Panel lateral deslizante que permite ajustar con un solo clic el número de la mesa, su aforo con botones táctiles ergonómicos (`[-] [ 4 comensales ] [+]`), forma geométrica y switch de combinación grupal, junto con la zona de desactivación no destructiva.
![Panel Lateral de Edición de Mesa](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_01_editar_mesa_drawer.jpg)

### Vista 4: Agregar Nueva Mesa Individual (con Mini-Mapa Interactivo de Ranuras)
Modal de alta individual con número correlativo autocalculado, selectores de forma (`Cuadrada`, `Redonda`, `Rectangular`), switch de unión grupal y un Mini-Mapa Interactivo del salón a la derecha con ranuras libres `[+]`, y controles de expansión/recorte `[+ / - Columna]` y `[+ / - Fila]` para colocar la mesa en la posición exacta sin teclear coordenadas.
![Agregar Nueva Mesa Individual](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_01_agregar_mesa_individual.jpg)

### Vista 5: Estado Inicial / Bienvenida para Local Nuevo (Onboarding)
Pantalla motivacional con bifurcación de caminos (Asistente Rápido en Lote vs Creación Manual) para evitar la sensación de "lienzo en blanco" en nuevos locales.
![Estado Inicial de Bienvenida](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_01_onboarding_vacio.jpg)

---

## 13. Reglas de Negocio de Organización de Salón y Capacidad

1. **Simplicidad del Modelo (Sin Atributo Confuso de Etiqueta):** Las mesas se identifican inequívocamente por su `numero` (ej. "01", "02", "T-01"), su `capacidad` de sillas y su `forma` geométrica, eliminando el atributo ambiguo de `etiqueta`.
2. **Cuadrícula Modular Expandible con Cero Coordenadas Abstractas:** El plano opera sobre una grilla con auto-alineación rígida para prevenir el desorden visual del arrastre libre en tablets. Los administradores pueden expandir o recortar columnas y filas libremente o hacer clic en ranuras vacías `[+]` para poblar el salón.
3. **Contramedida de Seguridad en Recorte de Cuadrícula (Anti-Accidentes):** Si el usuario reduce columnas (`[- Columna]`) o filas (`[- Quitar Fila]`), el backend audita si la sección a eliminar contiene mesas activas (`ERR_COLUMNA_CON_MESAS` / `ERR_FILA_CON_MESAS`). Si existen mesas en ese cuadrante, la eliminación se bloquea impidiendo pérdidas accidentales de datos.
4. **Mini-Mapa Interactivo de Asignación de Posición:** En la creación individual, el usuario ve el salón en miniatura y selecciona la casilla deseada de forma 100% gráfica.
5. **Bloqueo Duro de Desactivación de Mesa:** Una mesa con comandas o pedidos abiertos en cocina/salón (`estado IN ('pendiente', 'en_preparacion', 'servido', 'cuenta_pedida')`) no puede desactivarse bajo ninguna circunstancia hasta cobrar o anular la cuenta en Caja.
6. **Preservación de Historial (Soft-Archival):** Prohibido el `DELETE` físico. Las mesas dadas de baja se marcan como `inactiva` para garantizar que los reportes de ventas históricas mantengan su integridad referencial.
7. **Gobernanza de Cuotas del Plan:** El sistema valida contra `plan.max_mesas` y `plan.max_pisos` que ningún local desborde la capacidad contratada por la empresa.

---

## 14. Vistas Estructurales de CU-ADMIN-02 (Gestionar Categorías de la Carta)

### Vista 1: Directorio y Gestión de Categorías
Directorio interactivo de categorías del local con KPIs superiores (*Categorías Activas*, *Total Productos en Carta*, *Categorías sin Platos*), control visual de ordenamiento (`≡`), contador de platos activos/agotados por categoría, switches de visibilidad en comanda móvil y acción de alta (`[ + Nueva Categoría ]`).
![Directorio y Gestión de Categorías](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_02_directorio_categorias.jpg)

### Vista 2: Modal de Creación / Edición de Categoría
Diálogo ergonómico para configurar el nombre de la sección (con validación de duplicados), orden numérico de pestaña para la comanda de los mozos, interruptor de activación/pausa de visibilidad y previsualización en vivo (WYSIWYG) del botón de salón.
![Modal de Creación y Edición](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_02_crear_editar_modal.jpg)

### Vista 3: Modal de Bloqueo de Seguridad y Reasignación Asistida
Contramedida de seguridad crítica activada cuando el administrador intenta eliminar una categoría que alberga productos en carta (`409 Conflict: ERR_CATEGORIA_CON_PRODUCTOS`). Despliega los platos afectados y ofrece la reasignación atómica a otra categoría receptora antes de eliminar.
![Bloqueo de Seguridad y Reasignación](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_02_bloqueo_eliminar_modal.jpg)

### Vista 4: Estado Inicial / Bienvenida para Local con Carta en Blanco (Onboarding)
Pantalla limpia y orientadora para restaurantes registrados con opción "En Blanco" en `CU-PROP-04`, invitando al administrador a crear su primera categoría personalizada.
![Estado Inicial de Bienvenida](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_02_onboarding_vacio.jpg)

---

## 15. Reglas de Negocio de Estructuración de la Carta Gastronómica

1. **Ordenamiento de Presentación en Salón:** Cada categoría cuenta con un atributo `orden int >= 0` que define la disposición de las pestañas en el punto de venta móvil de los mozos, evitando la desorganización de un orden alfabético involuntario.
2. **Pausa y Visibilidad Temporal (`activa`):** El administrador puede ocultar categorías temporales (menús de temporada, turnos de desayuno vs cena) con un switch sin borrar los platos vinculados.
3. **Plantillas Gastronómicas Peruanas (Zero-Friction Onboarding):** Nuevas sedes pueden autogenerar categorías completas basadas en su especialidad (Pollería, Chifa, Criollo, Cevichería, Cafetería) con 1 clic.
4. **Protección Estricta contra Platos Huérfanos:** Prohibido el borrado directo de categorías con productos (`409 Conflict: ERR_CATEGORIA_CON_PRODUCTOS`). El sistema exige reasignar los platos a otra categoría o vaciar la sección primero.
5. **Reasignación Atómica:** La operación de reasignación y eliminación ejecuta una sola transacción en PostgreSQL (`BEGIN; UPDATE producto ...; DELETE FROM categoria_producto ...; COMMIT;`), garantizando integridad referencial absoluta.
6. **Unicidad de Nombres por Local:** No se admiten categorías duplicadas dentro de la misma sede (`UNIQUE(local_id, LOWER(nombre))`).


---

## 16. Actualización de CU-PROP-04: Registrar y Administrar Locales (Wizard de 2 Pasos y Giro Gastronómico)

### Modificación Arquitectónica:
Para optimizar el arranque de nuevas sedes, se mejoró el flujo de creación de locales en **`CU-PROP-04`**: en lugar de crear un local vacío que obligaba al administrador a cargar plantillas manualmente pantalla por pantalla, el Propietario define previamente el **Giro Gastronómico / Plantilla Inicial** en un asistente guiado de dos pasos:

1. **Paso 1 (Datos de Sede & Supervisión):** Nombre comercial, dirección física en Lima/Perú, teléfono de contacto y designación de administrador (o auto-administración).
2. **Paso 2 (Giro Gastronómico & Plantilla Inicial):** Selector con 4 opciones cerradas:
   - `🍗 Pollería & Brasas`: Aprovisiona categorías de brasas y 15 insumos esenciales (pollo crudo, papa yungay saco, aceite bidón, etc.).
   - `🐟 Cevichería & Mariscos`: Aprovisiona categorías marinas y 15 insumos esenciales (corvina/pescado blanco, limón sutil, mixtura, etc.).
   - `🥢 Chifa & Comida China`: Aprovisiona categorías chifa y 15 insumos esenciales (pechuga filete, arroz saco, sillao claro, wantán, etc.).
   - `⚪ Totalmente en Blanco`: Local sin categorías ni insumos precargados para conceptos de autor o cartas personalizadas desde cero.

### Configuración de Salón Garantizada:
En todas las opciones (incluso "En Blanco"), el sistema crea automáticamente el ambiente inicial **"Salón Principal"** con cuadrícula modular de 5 columnas x 3 filas vacío de mesas, listo para recibir la distribución física del salón (`CU-ADMIN-01`).

### Vista Blueprint Actualizada:
![Asistente de Registro de Sede - Paso 2: Giro Gastronómico](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_prop_04_formulario_local.jpg)

### Cambios en Código y Base de Datos:
- **`context/modelo_datos.md`:** Columna `giro_negocio` agregada a la tabla `local` (`enum: 'polleria', 'cevicheria', 'chifa', 'en_blanco'`).
- **`context/cu.md`:** `CU-PROP-04` actualizado con el Wizard de 2 pasos y la transacción atómica de aprovisionamiento en cascada.
- **`wireframe.md` de CU-PROP-04:** Especificación de la Vista 2 y contratos Go de `POST /api/v1/propietario/locales` sincronizados con `giro_negocio` y `resumen_inicializacion`.

---

## 17. Vistas Estructurales de CU-ADMIN-03 (Gestionar Catálogo de Insumos de Inventario)

### Vista 1: Directorio y Gestión de Insumos (Filtro por Defecto en Activos & Búsqueda Rápida)
Directorio interactivo de existencias físicas con métricas KPI (*Total Insumos Activos*, *En Quiebre / Agotados*, *Valorización Estimada de Almacén*), barra de búsqueda omnicanal, selector de píldoras de estado (`[● Activos (38)]` seleccionado por defecto, `[Agotados]`, `[Inactivos]`, `[Todos]`), tabla con catálogo estándar de 10 unidades universales, barras cromáticas de stock en 4 niveles y botón de alta (`[ + Nuevo Insumo ]`).
![Directorio y Gestión de Insumos](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_03_directorio_insumos.jpg)

### Vista 2: Modal de Creación / Edición Rápida de Insumo (< 8 segundos)
Modal de alta ágil sin taxonomías rígidas de categorías: el usuario ingresa el nombre comercial, pulsa un chip de la unidad de almacén (3 bases: `kg`, `L`, `und` | 7 empaques: `saco`, `botella`, `lata`, `caja`, `paquete`, `bidon`, `jaba`), define existencias iniciales, umbral mínimo de reposición, costo unitario referencial y estado inicial (`activo` por defecto).
![Modal de Creación y Edición Rápida](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_03_crear_editar_modal.jpg)

### Vista 3: Modal de Ajuste Físico de Stock y Auditoría
Modal de recuento físico periódico y descarte por merma: exhibe el stock registrado en el sistema, calcula en tiempo real la discrepancia numérica (`diferencia`), exige motivo obligatorio de auditoría (`conteo_fisico_inventario`, `merma_desperdicio`, `ingreso_manual`, `vencimiento_caducidad`, `rotura_accidente`), notas del auditor y despliega la advertencia operativa de bloqueo en carta (`CU-COCINA-04`) y alerta a mozos si el ajuste deja el stock en 0.
![Modal de Ajuste Físico de Stock](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_03_ajuste_stock_modal.jpg)

### Vista 4: Estado Inicial - Despensa de Insumos Vacía (Onboarding)
Pantalla limpia y motivadora para locales registrados con configuración "Totalmente en Blanco" en `CU-PROP-04`, ilustrando la bodega vacía y guiando al administrador a registrar sus primeros ingredientes sin fricción.
![Onboarding de Despensa Vacía](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_03_onboarding_vacio.jpg)

---

## 18. Reglas de Negocio de Almacén, Estados y Sincronización Core (CU-COCINA-04 ↔ CU-MOZO-01)

1. **Tres Estados Operativos de Insumo (`estado_insumo_enum`):**
   - **`activo`:** Insumo habilitado, con existencias operativas y disponible para deducción automática en recetas.
   - **`agotado`:** Insumo con stock en 0 o pausado por cocina/administrador; dispara el bloqueo automático de platos en carta.
   - **`inactivo`:** Desactivación lógica definitiva (*soft-deactivation*); reemplaza el borrado físico `DELETE` para preservar la integridad referencial en compras históricas y auditorías.
2. **Filtro Inteligente por Defecto en `Activos`:** La vista de directorio carga filtrada por `estado = 'activo'`, eliminando ruido visual de artículos obsoletos o agotados. El usuario puede alternar rápidamente entre píldoras de estado (`Activos`, `Agotados`, `Inactivos`, `Todos`).
3. **Barra de Búsqueda Omnicanal:** Entrada con debounce (300ms) para ubicar insumos en tiempo real por coincidencia insensible a mayúsculas.
4. **Catálogo Cerrado de 10 Unidades Universales (`unidad_insumo_enum`):** 3 unidades base (`kg`, `L`, `und`) y 7 empaques comerciales universales (`saco`, `botella`, `lata`, `caja`, `paquete`, `bidon`, `jaba`), impidiendo unidades ambiguas como `botella_750ml`.
5. **Alta Ágil (< 8 segundos, Sin Taxonomía Restrictiva):** Se eliminó el campo forzado de categorías de insumos para permitir altas inmediatas en bodega.
6. **Desacoplamiento de Recetas (`CU-ADMIN-04`):** El porcionamiento o rendimiento (ej. 140 raciones por saco) se define libremente al crear cada plato, otorgando flexibilidad total entre cocinas de alta exactitud o recetas por rendimiento de lote.
7. **Auditoría Obligatoria de Ajustes Físicos (`auditoria_stock_ajuste`):** Todo recuento manual o descarte registra el usuario responsable, stock previo, nuevo stock, diferencia numérica, motivo tipificado y notas.
8. **Sincronización Core ante Quiebre Operativo (`CU-COCINA-04` $\leftrightarrow$ `CU-MOZO-01`):**
   - **Bloqueo en Carta:** Si un insumo llega a 0 o se marca como `agotado`/`inactivo`, todos los platos dependientes pasan a `disponibilidad = 'agotado'`, bloqueándose en comanda móvil y carta QR.
   - **Protección de Pedidos en Curso en Cocina:** Los tickets en cola (`en_cola`) con estos platos se conmutan automáticamente a `no_disponible` (observados por quiebre).
   - **Alerta Push Prioritaria al Mozo:** La app móvil del mozo notifica la mesa afectada en tiempo real, permitiéndole ofrecer una alternativa al cliente o cancelar el ítem sin penalidad de caja.

---

## 19. Vistas Estructurales de CU-ADMIN-04 (Gestionar Productos de la Carta y Recetas)

### Vista 1: Directorio y Catálogo de Productos (Márgenes, Costos y Disponibilidad)
Directorio comercial completo con tarjetas KPI superiores (*Total Platos*, *Disponibles en Salón*, *Agotados por Quiebre*, *Margen Bruto Promedio*), buscador por nombre, pestañas de categorías obligatorias (`CU-ADMIN-02`), tabla con precios de venta, costos teóricos de receta, márgenes en color verde/ámbar, switches de disponibilidad y accesos rápidos a recetas.
![Directorio y Catálogo de Productos](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_04_directorio_productos.jpg)

### Vista 2: Modal de Alta / Edición de Producto con Receta Integrada
Modal de alta intuitivo y veloz en 2 pestañas: primero la ficha comercial (categoría obligatoria, nombre, precio, descripción) y luego el constructor de receta dinámica con selector de modo (`[ Rinde por Lote ]` vs `[ Cantidad Directa ]`), dosis, costo parcial por insumo y calculadora inferior en vivo de precio, costo, utilidad por plato y margen bruto porcentual.
![Modal de Alta y Edición de Producto](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_04_crear_editar_producto_modal.jpg)

### Vista 3: Quick-Drawer de Calibración Rápida de Recetas y Capacidad en Bodega
Panel lateral deslizante derecho para calibrar rendimientos culinarios al vuelo sin tocar datos comerciales, acompañado por el simulador de existencias reales que identifica el ingrediente limitante del turno (*"Capacidad máxima actual: 60 platos limitada por Carne Lomo Fino"*).
![Drawer de Calibración de Receta](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_04_receta_drawer.jpg)

### Vista 4: Estado Inicial - Carta sin Productos (Onboarding Guiado)
Pantalla motivadora para sedes que inician con carta en blanco, guiando la secuencia de aprovisionamiento lógico: 1. Categoría obligatoria (`CU-ADMIN-02`) $\rightarrow$ 2. Insumos de bodega (`CU-ADMIN-03`) $\rightarrow$ 3. Platos y recetas con cálculo de rentabilidad (`CU-ADMIN-04`).
![Onboarding de Carta Vacía](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_04_onboarding_vacio.jpg)

---

## 20. Reglas de Negocio de Carta, Recetas, Márgenes y Sincronización (CU-ADMIN-04)

1. **Categoría Obligatoria (`CU-ADMIN-02`):** Todo plato debe pertenecer a una categoría activa de la sede. Si no existen categorías creadas, el sistema bloquea preventivamente el alta y orienta al usuario a crear primero sus secciones de menú.
2. **Receta Obligatoria e Integrada (`producto_insumo`):** No se permite guardar productos sin al menos un insumo enlazado. Esto garantiza que cada comanda vendida descuente stock con trazabilidad (`CU-COCINA-03`) y alimente las proyecciones de compras de la IA.
3. **Motor Dual de Dosificación Culinaria:**
   - **`[ Rinde por Lote ]` (Modo Rendimiento):** Indicado para empaques comerciales (`saco`, `bidon`, `caja`). El usuario ingresa cuántos platos rinde la unidad (ej. 140 raciones) y el sistema deduce automáticamente `0.00714` unidades de almacén por comanda.
   - **`[ Cantidad Directa ]` (Modo Exacto):** Indicado para insumos medidos en fracciones o enteros directos (`0.25 und` de pollo, `1 botella` de refresco, `0.200 kg` de carne).
4. **Calculadora en Tiempo Real de Costo y Margen:** Al ingresar ingredientes o ajustar rendimientos, el sistema calcula de inmediato:
   $$\text{Costo Teórico} = \sum (\text{cantidad\_descuenta} \times \text{costo\_unitario})$$
   $$\text{Margen Bruto (\%)} = \frac{\text{precio\_venta} - \text{costo\_teórico}}{\text{precio\_venta}} \times 100$$
5. **Disponibilidad Inicial Inteligente:**
   - Si todos los insumos de la receta tienen `stock_actual > 0`: el plato se crea con `disponibilidad = 'disponible'`.
   - Si al menos un insumo tiene `stock_actual == 0` o está marcado `agotado`: el plato nace automáticamente como `agotado` con aviso visual para prevenir que los mozos vendan platos sin existencias en cocina.
6. **Calibración Ágil en Quick-Drawer:** Permite al administrador o jefe de cocina afinar porciones sin abrir el formulario completo del plato, visualizando en vivo el ingrediente "cuello de botella" del almacén.
7. **Preservación Histórica de Ventas (Sin `DELETE` Físico):** Prohibido eliminar físicamente platos que cuenten con comandas históricas en `pedido_item` (`409 Conflict: ERR_PRODUCTO_CON_VENTAS`). Se utiliza archivado lógico (`activo = false`).
8. **Sincronización Operativa Core con Cocina y Salón (`CU-COCINA-03` / `04`):**
   - Al marcar un ítem como "listo" en KDS, se descuentan automáticamente las fracciones de stock.
   - Si un ingrediente se agota en bodega, el plato se bloquea en la comanda móvil de mozos y en el menú QR en tiempo real.

---

## 21. Vistas Estructurales de CU-ADMIN-05 (Gestionar Catálogo de Proveedores)

### Vista 1: Directorio y Catálogo de Proveedores (Contacto Directo y Compras del Mes)
Directorio comercial completo con tarjetas KPI superiores (*Proveedores Activos*, *Compras del Mes en S/*, *Proveedores Frecuentes*, *Contacto Directo 100%*), buscador reactivo omnicanal (por razón social comercial o insumo suministrado), pestañas de estado (`[ Activos (18) ]`, `[ Inactivos (3) ]`, `[ Todos (21) ]`), tabla interactiva con botones directos de WhatsApp para cotizaciones rápidas, etiquetas de insumos habituales, fecha/monto de última compra y accesos directos al historial y edición.
![Directorio y Catálogo de Proveedores](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_05_directorio_proveedores.jpg)

### Vista 2: Modal Ágil de Alta / Edición de Proveedor (Sin Burocracia de RUC)
Modal enfocado en velocidad (< 10 segundos) para adaptarse a la operativa real de restaurantes peruanos: solicita Nombre Comercial (único por sede), persona de contacto, teléfono con enlace WhatsApp, correo opcional, dirección de mercado/puesto opcional y multi-selector de chips de insumos habituales del catálogo de inventario (`CU-ADMIN-03`). Al guardar, queda disponible de inmediato para compras físicas y cotizaciones.
![Modal de Alta y Edición de Proveedor](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_05_crear_editar_proveedor_modal.jpg)

### Vista 3: Quick-Drawer de Historial de Compras y Evolución de Precios
Panel lateral deslizante derecho (560px) que consolida el histórico de facturas y boletas con ese proveedor, monto acumulado facturado, último precio unitario pagado (con indicador de variación vs mes anterior), banner con botón directo de WhatsApp y desglose pormenorizado de ítems comprados por factura. Incluye botón de acceso directo para emitir una nueva compra con este proveedor (`CU-ADMIN-06`).
![Drawer Historial de Compras y Precios](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_05_historial_compras_drawer.jpg)

### Vista 4: Estado Inicial - Directorio de Proveedores Vacío (Onboarding Guiado)
Pantalla motivadora para nuevas sedes con catálogo en blanco, guiando al administrador sobre el valor de centralizar sus proveedores de carnes, verduras, abarrotes y servicios para monitorear costos históricos y hacer pedidos rápidos por WhatsApp. Informa además que también puede darlos de alta "al vuelo" mientras registra una compra física.
![Onboarding de Proveedores Vacío](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_05_onboarding_vacio.jpg)

---

## 22. Reglas de Negocio de Proveedores, Abastecimiento Ágil y Relación con Compras (`CU-ADMIN-05` ↔ `CU-ADMIN-06`)

1. **Reordenamiento Lógico del Dominio de Abastecimiento en `context/cu.md`:**
   - La cadena de suministros queda estructurada de manera contigua y coherente:
     - `CU-ADMIN-03`: Insumos de Inventario (Almacén base).
     - `CU-ADMIN-04`: Productos de la Carta y Recetas (Consumo y escandallo).
     - **`CU-ADMIN-05`**: **Gestionar Catálogo de Proveedores** (Agenda comercial).
     - **`CU-ADMIN-06`**: **Registrar Ficha de Compra de Insumos** (Reabastecimiento físico y egreso contable).
     - **`CU-ADMIN-07`**: **Recomendaciones de Reposición con IA** (Forecasting de compras).
   - Los módulos de Personal, Horarios, Incidentes y Caja se desplazan secuencialmente a partir de `CU-ADMIN-08`.
2. **Eliminación de Burocracia de RUC:**
   - Por decisión explícita de negocio, se prescindió del campo RUC tanto en la base de datos como en los formularios. En el rubro gastronómico local, forzar RUC trababa compras a mayoristas de mercados o productores independientes.
   - La unicidad del proveedor se garantiza mediante su nombre comercial normalizado a nivel de local: `UNIQUE(local_id, LOWER(nombre))`.
3. **Contacto Directo WhatsApp:**
   - Todo número telefónico registrado genera automáticamente un enlace universal `wa.me/51...`, permitiendo a administradores y jefes de cocina coordinar cotizaciones y pedidos directamente desde su celular o terminal sin fricciones.
4. **Creación Híbrida ("Al Vuelo" en Ficha de Compra):**
   - El administrador puede registrar proveedores desde el directorio dedicado (`CU-ADMIN-05`) o directamente en el acto mientras tipea una compra física en `CU-ADMIN-06` (`[ + Nuevo Proveedor Rápido ]`), evitando pérdida de datos digitados.
5. **Auditoría de Historial de Precios y Variación en Quick-Drawer:**
   - Al pulsar `[ Historial ]`, el administrador visualiza la variación del costo por insumo (ej. subida de S/ 8.20 a S/ 8.40 en el kg de pollo), sirviendo de base analítica para negociaciones y ajustes de precios de venta en carta.
6. **Integridad Referencial y Prohibición de Borrado Físico (`ON DELETE RESTRICT`):**
   - Si un proveedor cuenta con al menos una ficha de compra asociada, la base de datos bloquea su eliminación física con `409 Conflict (ERR_PROVEEDOR_TIENE_COMPRAS)` para asegurar la integridad contable y de auditoría.
   - En su lugar, el sistema provee conmutación suave (`activo = false`), ocultándolo de nuevas compras sin destruir el registro histórico.
7. **Contratos de API Backend en Go:**
   - Implementación sobre `pkg/apiresponse.Response`, soporte de filtrado reactivo (`activos`, `inactivos`, `todos`), búsqueda por texto tridimensional y segregación estricta por tenant mediante RLS.

---

## 23. Vistas Estructurales de CU-ADMIN-06 (Registrar Ficha de Compra de Insumos)

### Vista 1: Historial y Libro de Fichas de Compra (KPIs y Auditoría de Comprobantes)
Libro de compras de la sede con tarjetas KPI superiores (*Gasto Total del Mes*, *Fichas Registradas*, *Insumos Reabastecidos*, *Promedio por Compra*), buscador reactivo por N° de serie o proveedor, filtros rápidos de fecha (`[ Este Mes ]`, `[ Mes Pasado ]`, `[ Rango ]`), tabla interactiva con identificación de comprobantes físicos y auto-correlativos, desglose de insumos en chips, método de pago, estados (`[Registrada]` / `[Anulada]`) y acciones directas.
![Directorio y Libro de Fichas de Compra](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_06_directorio_compras.jpg)

### Vista 2: Formulario Ágil de Registro de Ficha de Compra (Desglose Tributario Claro)
Modal de alta de 860px optimizado para velocidad operativa: cabecera con proveedor y botón de alta al vuelo, selector de comprobante con validación dinámica (número obligatorio para Factura/Boleta, opcional con auto-correlativo para Notas de Venta de mercado), tabla dinámica de insumos con stock actual en tiempo real, selector de régimen tributario (`[ Con Factura (Desglosa 18% IGV) ]` vs `[ Sin IGV / Monto Neto ]`) y tarjeta de liquidación garantizando que el total pagado coincide exactamente con lo ingresado.
![Formulario de Registro de Ficha de Compra](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_06_registro_compra_modal.jpg)

### Vista 3: Modal de Creación de Proveedor "Al Vuelo"
Submodal flotante de 480px que permite dar de alta a un proveedor en menos de 5 segundos (solo Nombre Comercial y WhatsApp) directamente mientras se digita la compra física, sin recargar la pantalla ni perder los insumos ya ingresados.
![Modal Proveedor Al Vuelo](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_06_proveedor_al_vuelo_modal.jpg)

### Vista 4: Modal de Consulta y Auditoría de Ficha de Compra
Modal de auditoría de 760px con la trazabilidad completa del despacho: impacto físico en stock (+250 kg Pollo Entero, +50 kg Pechuga), estado del egreso en caja chica, datos de comprobante, botón para imprimir constancia de entrada y botón de `[ Anular Ficha Compra ]` con solicitud de justificación obligatoria.
![Modal Detalle y Auditoría de Compra](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_06_detalle_compra_modal.jpg)

### Vista 5: Estado Inicial - Sin Compras Registradas (Onboarding Guiado)
Pantalla motivadora para sedes nuevas con catálogo de compras en blanco, guiando didácticamente al usuario sobre cómo ingresar sus comprobantes para reabastecer automáticamente el almacén, calcular márgenes y asentar el flujo de caja.
![Onboarding Vacío de Compras](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_06_onboarding_vacio.jpg)

---

## 24. Reglas de Negocio de Abastecimiento Físico, Liquidación y Reversión Atómica (`CU-ADMIN-06`)

1. **Transacción Atómica de Abastecimiento:**
   - La confirmación de una ficha de compra ejecuta un bloque atómico `BEGIN ... COMMIT` que:
     - Inserta cabecera y detalle en `ficha_compra` y `ficha_compra_detalle`.
     - Suma las existencias físicas: `insumo.stock_actual += cantidad`.
     - Actualiza `costo_unitario`, `ultimo_proveedor_id` y fecha de última compra.
     - Conmuta `insumo.estado = 'activo'` si estaba en `agotado`.
      - Registra el egreso financiero en el flujo de caja del turno (`CU-ADMIN-14`).
2. **Diferenciación Dinámica de Comprobantes Formales vs Informales:**
   - `Factura`, `Boleta` y `Guía de Remisión`: Exigen serie y número físico formal de SUNAT.
   - `Nota de Venta` y `Recibo`: El número de folio es **Opcional**. Si se deja en blanco, el backend autogenera un código correlativo único interno de control de sede (`NV-YYYYMMDD-####`), garantizando que las compras de mercado informal o comprobantes manuscritos nunca se traben.
3. **Desglose Tributario Claro (Sin Ambigüedades):**
   - Se erradicó el texto confuso "Precios incluyen IGV". En su lugar, el usuario elige entre:
     - `[ Con Factura (Desglosa 18% IGV) ]`: El sistema extrae la base imponible y el crédito fiscal de 18% para fines contables.
     - `[ Sin IGV / Monto Neto ]`: Subtotal = Total para compras de mercado mayorista o productos agropecuarios exonerados.
   - En ambos casos, el monto total pagado es **la suma matemática exacta de los insumos digitados**.
4. **Reactivación Inteligente y Asistida de Platos en Carta (`CU-ADMIN-04` $\leftrightarrow$ `CU-MOZO-01`):**
   - Cuando se reabastece un insumo que estaba agotado, el backend evalúa qué platos de la carta recuperaron stock completo en todos sus ingredientes y despliega un diálogo asistido para reactivarlos para los mozos en salón, evitando reactivaciones prematuras si cocina aún debe prepararlos.
5. **Plan de Contingencia en Anulación de Ficha de Compra y Salvaguarda de Inventario:**
   - **Evaluación Previa de Impacto:** Al presionar `[ Anular Ficha Compra ]`, el frontend consulta `GET /api/v1/admin/fichas-compra/{id}/impacto-anulacion` y despliega un diálogo de advertencia con el diagnóstico preventivo: insumos que caerán a 0, platos de la carta que serán bloqueados de inmediato y comandas en cocina activas.
   - **Protección contra Stock Negativo (Ventas Intermedias):** Si entre el registro de compra y su anulación ya se vendieron platos que consumieron parte del lote (`stock_actual < cantidad`), el sistema fija el piso en 0: `stock_actual = GREATEST(0, stock_actual - cantidad)`. La diferencia consumida sin respaldo físico se audita en `log_auditoria` (`CU-ADMIN-16`).
   - **Rollback en Cascada a 'agotado' y Bloqueo en Carta (`CU-ADMIN-04`):** Si el stock de cualquier ingrediente desciende a 0, `insumo.estado` pasa automáticamente a `'agotado'`. El backend actualiza en cascada todos los platos dependientes a `producto.disponibilidad = 'agotado'`, bloqueando su venta al instante en la comanda móvil de mozos (`CU-MOZO-01`, `CU-MOZO-02`) y la carta digital QR.
   - **Alerta Preventiva en Cocina (KDS):** Las comandas en curso (`en_cola` o `en_preparacion`) con platos en quiebre reciben la etiqueta visual `[Observado por quiebre]`, disparando notificación reactiva al mozo asignado para gestionar sustituciones con el comensal.
   - **Reversión Financiera y Trazabilidad Inmutable:** El asiento en `egreso_caja` (`CU-ADMIN-14`) pasa a estado `'anulado'`, reponiendo el disponible del turno, y se exige un motivo obligatorio (mínimo 10 caracteres) guardado en `ficha_compra` y `log_auditoria` (`CU-ADMIN-16`).
6. **Contratos de API Backend en Go:**
   - Estandarizados bajo `pkg/apiresponse.Response`, con endpoints para auditoría y evaluación previa (`ImpactoAnulacionDTO`), soporte de paginación y aislamiento multi-inquilino mediante RLS en PostgreSQL.

---

## 25. Vistas Estructurales de CU-ADMIN-08 (Gestionar Personal del Local)

### Vista 1: Directorio y Listado de Personal (KPIs de Cuota SaaS y Dotación por Rol)
Directorio administrativo en desktop (`1440x900`) con tarjetas KPI superiores (*Total Empleados 12/15 cupos en Plan Pro* con barra de progreso, *Mozos en Salón (6)*, *Equipo de Cocina (4)*, *Cajeros (2)*), buscador reactivo por nombre o correo, filtros rápidos por rol (`[ Todos ]`, `[ Mozos ]`, `[ Cocina ]`, `[ Cajeros ]`), tabla de colaboradores con avatares, roles en badge, teléfono/WhatsApp directo, último acceso y acciones rápidas (`[Editar]`, `[Reset Clave]`, `[Desactivar]`).
![Directorio y Listado de Personal](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_08_directorio_personal.jpg)

### Vista 2: Formulario / Modal de Registro y Edición de Empleado (660px)
Modal interactivo centrado para dar de alta colaboradores en menos de 10 segundos: campos de Nombre completo, Correo corporativo único, Celular/WhatsApp, selector visual con exactamente 3 roles operativos (`Mozo`, `Cocina`, `Cajero`), aviso de seguridad aclarando que la creación de administradores corresponde al Propietario, generación automática de contraseña provisional segura y switch para notificar por email o copiar mensaje para WhatsApp.
![Modal Registro de Empleado](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_08_registro_empleado_modal.jpg)

### Vista 3: Modal de Seguridad y Reasignación Asistida al Desactivar Empleado (580px)
Submodal de seguridad que realiza un diagnóstico preventivo antes de suspender a un colaborador: si el mozo tiene mesas activas con comandas en curso (`Mesa 4, Mesa 7, Mesa 12`), el sistema exige seleccionar a un mozo activo sustituto para transferir los pedidos atómicamente antes de confirmar la baja, previniendo órdenes huérfanas en el salón.
![Modal Desactivar Empleado](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_08_desactivar_empleado_modal.jpg)

### Vista 4: Estado Inicial - Sin Personal Registrado (Onboarding Guiado)
Pantalla motivadora para nuevas sedes sin personal registrado, estructurando visualmente los 3 frentes de servicio del restaurante (Salón, Cocina y Caja), recordando la cuota contratada en el plan Pro (hasta 15 colaboradores) y ofreciendo el botón principal `[ + Registrar Primer Empleado ]`.
![Onboarding Vacío de Personal](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_08_onboarding_vacio.jpg)

---

## 26. Reglas de Negocio de Gestión de Personal, Sesión Continua y Salvaguardas Operativas (`CU-ADMIN-08`)

1. **Sesión Continua de Turno (Sin Fricción de PIN):**
   - El colaborador inicia sesión **una sola vez al comenzar su jornada** mediante sus credenciales estándar (correo corporativo + contraseña asignada).
   - La sesión permanece activa e ininterrumpida durante todo el turno de trabajo (token JWT de 12 horas); el mozo puede transitar entre mesas, comandas y consultas de la carta sin que el sistema vuelva a solicitar credenciales, cerrando sesión únicamente al presionar `[ Cerrar Sesión ]` (`Logout`) al finalizar el día.
2. **Matriz de Roles Operativos Especializados (Restringida a 3 Roles):**
   - `Mozo`: Acceso restringido al plano de mesas (`CU-MOZO-01`), comanda móvil (`CU-MOZO-02`), reservas (`CU-MOZO-05`) y anulación con motivo (`CU-MOZO-06`).
   - `Cocina`: Acceso exclusivo al monitor KDS (`CU-COCINA-01`), control de tiempos de preparación (`CU-COCINA-02`) y marcado de platos agotados (`CU-COCINA-04`).
   - `Cajero`: Apertura/cierre de caja (`CU-CAJA-01`), cobranza, facturación electrónica (`CU-CAJA-03`) y arqueos.
3. **Restricción Estricta de Creación de Administradores:**
   - Un Administrador de Local **NO puede crear ni asignar a otros administradores** (`admin_local`).
   - La designación o alta de administradores de sede corresponde **privativa y exclusivamente al Propietario de la empresa** en `CU-PROP-04` (Administrar locales de la empresa).
   - Cualquier intento de enviar el rol `admin_local` al endpoint de personal es rechazado con código HTTP `403 Forbidden (ERR_CREACION_ADMIN_NO_AUTORIZADA)`.
4. **Control de Cuota SaaS en Tiempo Real (`max_usuarios`):**
   - El alta y la reactivación de colaboradores valida que `COUNT(usuario activos) < plan.max_usuarios` (`CU-PROP-02`). Si se alcanza el límite, la interfaz presenta una alerta amigable invitando a ampliar el plan.
5. **Salvaguarda de Reasignación Atómica de Comandas al Desactivar:**
   - Si un mozo tiene comandas activas (`pedido.estado NOT IN ('cobrado', 'cancelado')`), el backend bloquea la desactivación simple y exige la selección de un mozo activo receptor.
   - En una transacción atómica `BEGIN ... COMMIT`, se actualizan los pedidos (`pedido.mozo_id = :sustituto`), se pasa al usuario a `inactivo`, se envía una notificación reactiva al mozo receptor y se audita el evento en `log_auditoria` (`CU-ADMIN-16`).
6. **Bloqueo Preventivo de Desactivación con Turno de Caja Abierto:**
   - Si un cajero mantiene un turno de caja activo sin cerrar, el sistema rechaza su desactivación con `409 Conflict (ERR_CAJERO_CON_CAJA_ABIERTA)`, exigiendo que se efectúe la supervisión de cierre en `CU-ADMIN-15` previamente.
7. **Contratos de API Backend en Go:**
   - Estandarizados bajo `pkg/apiresponse.Response`, con endpoints de chequeo previo (`GET /precheck-desactivar`), validación de roles operativos (`oneof=mozo cocina cajero`), DTOs estructurados y aislamiento estricto multi-tenant por Row-Level Security (RLS) en PostgreSQL.

---

## 27. Vistas Estructurales de CU-ADMIN-09 (Configurar Horario de Atención y Feriados del Local)

### Vista 1: Configuración de Semana Regular con Soporte Multi-Turno y Turnos Partidos
Grilla semanal operativa en desktop (`1440x900`) para programar la atención de Lunes a Domingo. Permite conmutar la apertura de cada día (`atiende = true/false`), configurar uno o más turnos por jornada (ej. Turno 1: Almuerzo 12:00 a 16:00, Turno 2: Cena 19:00 a 23:30), copiar la configuración de un día a toda la semana con un solo clic y validar la coherencia temporal para evitar traslapes.
![Semana Horaria](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_09_semana_horaria.jpg)

### Vista 2: Calendario y Directorio de Excepciones y Feriados Programados
Gestor de fechas especiales y días no laborables para la sede. Muestra tabla con fecha, tipo de excepción (`[ Cierre Total ]` o `[ Horario Especial ]`), motivo descriptivo (ej. Fiestas Patrias, Navidad, Inventario General) y horas de atención parcial si aplica, permitiendo precargar los feriados oficiales nacionales de Perú en un clic.
![Excepciones y Feriados](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_09_excepciones_calendario.jpg)

### Vista 3: Modal de Advertencia y Resolución Asistida de Conflictos con Reservas (680px)
Diálogo de contingencia que se activa automáticamente al intentar programar un cierre sobre una fecha que ya cuenta con reservas confirmadas. Lista los clientes afectados con hora y número de comensales, muestra su teléfono celular visible para llamadas directas, provee un botón directo con enlace `wa.me` precargado con mensaje de cortesía oficial y casillas interactivas para asentar qué clientes fueron efectivamente notificados antes de confirmar la cancelación.
![Modal de Conflicto de Reservas](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_09_conflicto_reservas_modal.jpg)

### Vista 4: Estado Inicial - Sede sin Horario Configurado (Onboarding con Plantilla)
Pantalla de aceleración para locales recién creados que aún no cuentan con turnos definidos. Presenta una tarjeta destacada con la *"Plantilla Restaurante Estándar"* (Almuerzo 12:00-16:00 y Cena 19:00-23:30 de Lunes a Domingo) para activar el horario en 1 solo clic o la opción de configurar turnos manualmente desde cero.
![Onboarding Vacío de Horarios](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_09_onboarding_vacio.jpg)

---

## 28. Reglas de Negocio de Horarios, Desacoplamiento de Reservas y Resolución Transaccional (`CU-ADMIN-09`)

1. **Desacoplamiento Arquitectónico Limpio:**
   - `CU-ADMIN-09` se enfoca de manera pura y exclusiva en la **disponibilidad física y temporal de la sede** (`horario_atencion`, `horario_excepcion`).
   - Las **políticas y parámetros de reserva de mesas** (duración estimada, buffer entre comensales, margen de no-show, minutos de bloqueo previo en salón y switch maestro de activación) fueron desacoplados a su propio caso de uso independiente: `CU-ADMIN-10: Configurar políticas y parámetros de reservas de mesas`.
2. **Soporte Flexible de Turnos Diarios (Mono-Turno y Turnos Partidos):**
   - Cada día de la semana admite múltiples bloques horarios independientes identificados por nombre descriptivo (`Almuerzo`, `Cena`, `Corrido`).
   - Validación estricta en frontend y backend: `hora_fin > hora_inicio` (con soporte para turnos nocturnos trasnochadores que cruzan la medianoche), y restricción de unicidad sin solapamiento: `UNIQUE(local_id, dia_semana, hora_inicio)`.
3. **Aceleración con Plantilla Estándar en 1 Clic:**
   - Para evitar la fricción de configurar 14 campos manuales en una sede nueva, el sistema provee el endpoint `POST /api/v1/admin/horario/plantilla` que genera la estructura típica gastronómica de forma instantánea.
4. **Resolución Asistida Multicanal de Conflictos con Reservas (Sin Falsas APIs Gratuitas de WhatsApp):**
   - Dado que Meta WhatsApp Cloud API no ofrece envíos masivos gratuitos y requiere plantillas corporativas aprobadas de pago, el sistema adopta el estándar de la industria gastronómica peruana:
     - Despliegue de enlaces directos `wa.me/<telefono>?text=<mensaje_cortesia>` con texto oficial pre-redactado y sanitizado.
     - Número celular visible para llamada telefónica rápida del administrador.
     - Casilla interactiva de verificación: `[x] Cliente notificado por WhatsApp/Llamada`.
5. **Modelo Relacional Óptimo y Trazabilidad en Auditoría (Sin Parches Ad-Hoc):**
   - En lugar de campos JSON improvisados, la entidad `reserva` incorpora formalmente:
     - `excepcion_id UUID REFERENCES horario_excepcion(id)`: Clave foránea al evento causante del cierre.
     - `motivo_cancelacion TEXT`: Razón formal de la anulación.
     - `notificado_cliente BOOLEAN DEFAULT false`: Constancia explícita de gestión con el cliente.
     - `metodo_notificacion VARCHAR(20)`: Restringido por constraint a `whatsapp`, `llamada`, `presencial` o `ninguno`.
     - `notificado_por UUID REFERENCES usuario(id)` y `fecha_notificado TIMESTAMP WITH TIME ZONE`.
   - La cancelación de reservas por cierre se ejecuta en un bloque transaccional atómico `BEGIN ... COMMIT` que además asienta el evento inmutable en `log_auditoria` (`CU-ADMIN-16`) para blindar al restaurante ante controversias o reclamos de consumidores.

---

## 29. Vistas Estructurales de CU-ADMIN-10 (Configurar Políticas y Parámetros de Reservas de Mesas)

### Vista 1: Panel de Configuración de Políticas y Parámetros (Switch Maestro y Tarjetas Modulares)
Panel administrativo en desktop (`1440x900`) con interruptor general destacado `[ Habilitar recepción de reservas de salón (Activo) ]`, agrupado en 3 tarjetas funcionales: *Tiempos de Servicio* (duración estándar 90 min con chips de acceso rápido [60 min], [90 min], [120 min], buffer de limpieza 15 min y tolerancia no-show 15 min), *Operación en Salón* (bloqueo previo de mesa en plano de mozo 30 min con tooltip explicativo y margen de recordatorio 120 min) y *Ventana de Anticipación* (anticipación mínima 2 horas y horizonte máximo 30 días).
![Panel de Políticas de Reserva](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_10_panel_politicas.jpg)

### Vista 2: Simulador Visual de Línea de Tiempo de Reserva de Mesa (Didáctica Operativa)
Herramienta visual que desglosa un caso práctico ("Reserva confirmada a las 14:00, Mesa 05") a lo largo de un eje continuo de 13:00 a 16:30. Ilustra con patrones blueprint los 30 min de bloqueo previo en salón (`13:30 - 14:00 Bloqueada`), los 15 min de tolerancia no-show (`14:00 - 14:15`), los 90 min de estancia de los comensales (`14:00 - 15:30 Ocupada`) y los 15 min de buffer de limpieza (`15:30 - 15:45 Limpieza`), evidenciando el total de 135 minutos bloqueados y la liberación automática a las 15:45.
![Simulador de Línea de Tiempo](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_10_simulador_linea_tiempo.jpg)

### Vista 3: Modal de Bloqueo por Reservas Futuras Confirmadas (Salvaguarda Operativa 620px)
Diálogo de advertencia que impide deshabilitar la recepción de reservas mientras existan reservas futuras confirmadas en el local. Presenta la tabla con los comensales afectados, fechas, horas y mesas asignadas, orientando a atender o cancelar dichas reservas antes de cerrar el canal.
![Modal de Bloqueo por Reservas Futuras](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_10_bloqueo_desactivacion_modal.jpg)

### Vista 4: Estado Bloqueado por Plan Starter / Paywall SaaS (Control de Planes)
Pantalla de restricción arquitectónica cuando la suscripción de la empresa no incluye el módulo de reservas (`plan.incluye_reservas = false`). Detalla didácticamente las funcionalidades premium del módulo e invita a solicitar al Propietario un ascenso al Plan Pro o Enterprise (`CU-PROP-02`).
![Paywall Plan Starter](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_10_paywall_plan_starter.jpg)

---

## 30. Reglas de Negocio de Políticas de Reserva, Rotación de Salón y Salvaguardas (`CU-ADMIN-10`)

1. **Desacoplamiento Limpio de Salón vs Sede:**
   - `CU-ADMIN-09` gobierna la apertura/cierre de la sede y feriados.
   - `CU-ADMIN-10` rige la dinámica interna de reservas de mesas, tiempos de servicio y rotación de clientes.
2. **Control Temporal de Servicio y Rotación de Mesas:**
   - `duracion_reserva_min`: Tiempo base de permanencia estimada (rango 30 a 240 min, default 90 min).
   - `buffer_reserva_min`: Espacio temporal de sanitización entre reservas consecutivas en la misma mesa (rango 0 a 60 min, default 15 min).
   - `tolerancia_no_show_min`: Periodo de espera de cortesía tras la hora programada antes de que el mozo pueda liberar la mesa y marcar inasistencia (rango 5 a 60 min, default 15 min).
3. **Bloqueo Preventivo en Salón (`CU-MOZO-01`):**
   - El parámetro `minutos_bloqueo_previo` conmuta automáticamente la mesa al estado `"bloqueada"` en la tablet de los Mozos con la antelación indicada (ej. 30 min antes).
   - Impide físicamente que un mozo siente a comensales casuales (*walk-in*) en una mesa que está a punto de recibir una reserva confirmada.
4. **Ventana de Anticipación:**
   - `anticipacion_minima_horas`: Evita reservas de último minuto no operables por la cocina (ej. mínimo 2 horas de antelación).
   - `anticipacion_maxima_dias`: Limita el horizonte de proyección a futuro (ej. hasta 30 días).
5. **Salvaguarda Transaccional contra Desactivación con Reservas Activas:**
   - Si el administrador desactiva el switch maestro (`acepta_reservas = false`), el backend y un trigger en PostgreSQL verifican `COUNT(*) FROM reserva WHERE fecha_hora >= NOW() AND estado = 'confirmada'`.
   - Si existen reservas, la actualización es bloqueada con código HTTP `409 Conflict (ERR_RESERVAS_FUTURAS_PENDIENTES)`, protegiendo la reputación del restaurante y los compromisos adquiridos con los clientes.
6. **Contratos de API Backend en Go:**
   - Estandarizados bajo `pkg/apiresponse.Response`, con endpoints de consulta (`GET /politicas`), actualización (`PUT /politicas`), restablecimiento de defaults (`POST /restaurar-default`) y pre-chequeo de desactivación (`GET /precheck-desactivacion`).
7. **Exclusividad Operativa del Administrador del Local (Restricción al Propietario):**
   - La parametrización de políticas de reserva y rotación de salón corresponde **exclusivamente al Administrador del Local**.
   - El Propietario no conoce la dinámica cotidiana de las mesas ni los tiempos reales de rotación de cada sede física en particular; sus atribuciones se concentran en suscripciones, locales y gobernanza multi-sede (`CU-PROP-01..04`). Cualquier intento del Propietario de modificar estos parámetros es bloqueado con `403 Forbidden (ERR_OPERACION_EXCLUSIVA_ADMIN_LOCAL)`.
8. **Persistencia Óptima y Modularidad en Tabla Dedicada `politicas_reserva` (1:1):**
   - Para no sobrecargar la tabla `local` con columnas nulas e innecesarias en restaurantes con Plan Starter, los parámetros se desacoplaron a la entidad independiente `politicas_reserva`.
   - Esto optimiza el ancho de tupla en `local`, mejora el *Buffer Cache Hit Ratio* en PostgreSQL 16 y elimina la contención de bloqueos concurrentes (*row locking*) entre salón y comandas.

---

## 31. Vistas Estructurales de CU-ADMIN-11 (Registrar y Consultar Historial de Incidentes Internos)

### Vista 1: Historial y Bandeja de Incidentes de Sede (Tarjetas KPI y Novedades Operativas)
Panel de supervisión interna en desktop (`1440x900`) para el Administrador del Local con 4 tarjetas métricas: *Incidentes Abiertos (2)*, *En Investigación / Revisión (1)*, *Gravedad Alta (1 - Alerta activa)* y *Resueltos este Mes (12)*. Dispone de barra de filtrado multifactorial (Estado, Gravedad, Categoría, Colaborador, Período y búsqueda reactiva) y tabla detallada con códigos correlativos anuales (`INC-2026-085`), etiquetas de gravedad contrastadas, badges de estado con antigüedad y botones de acción rápida.
![Historial de Incidentes](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_historial_incidentes.jpg)

### Vista 2: Modal de Registro con Checkbox Condicional de Colaborador y Alerta SSE (700px)
Formulario estructurado para documentar anomalías operativas. Incorpora el control interactivo `[X] Involucra a un colaborador específico`, desplegando el selector de personal únicamente al activarse para no recargar la interfaz en casos fortuitos. Al clasificar la gravedad como **Alta**, la interfaz presenta un badge reactivo advirtiendo la emisión de una alerta Server-Sent Events (SSE) en tiempo real hacia el portal corporativo del Propietario (`CU-PROP-09`). Incluye dropzone blueprint para adjuntar fotografías o comprobantes (máx. 5MB).
![Modal de Registro de Incidente](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_registro_incidente_modal.jpg)

### Vista 3: Modal de Detalle, Directiva Corporativa y Resolución Definitiva (720px)
Expediente completo del incidente con trazabilidad del hecho, colaborador y evidencia. Exhibe de forma destacada la **Directiva del Propietario** registrada desde `CU-PROP-09` (`nota_propietario`) y provee dos pestañas de acción claras: *Pestaña 1: Confirmar Resolución Definitiva (Cierre Inmutable)*, que exige obligatoriamente las acciones correctivas finales y congela el caso en modo solo lectura; y *Pestaña 2: Dejar en Investigación / Seguimiento*, para asentar avances de peritaje (`motivo_revision`) sin generar limbos indefinidos.
![Modal de Detalle y Resolución](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_detalle_resolucion_modal.jpg)

### Vista 4: Estado Inicial / Vacío Positivo (Operación sin Incidentes Activos)
Pantalla de confirmación visual en desktop (`1440x900`) con KPIs en cero e ilustración blueprint limpia de orden y tranquilidad operativa, confirmando que todos los turnos de servicio y salón se desarrollan con normalidad en la sede.
![Estado Vacío Positivo](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_onboarding_vacio.jpg)

---

## 32. Reglas de Negocio, Ciclo de Vida del Incidente, Directivas del Dueño y Cierre Inmutable (`CU-ADMIN-11`)

1. **Diferenciación de Responsabilidades (Local vs Propietario):**
   - **Administrador Local (`CU-ADMIN-11`):** Responsable operativo en la sede física. Registra el hecho en caliente, adopta medidas inmediatas de contención, conduce la investigación de campo y ejecuta el cierre definitivo con remediación técnica o disciplinaria.
   - **Propietario (`CU-PROP-09`):** Supervisión multi-sede corporativa. Recibe alertas reactivas SSE ante incidentes críticos (`gravedad = alta`), visualiza el consolidado de todos los locales de la empresa y puede emitir directivas mandatorias (`nota_propietario`).
2. **Formulario Ágil con Checkbox Condicional:**
   - Muchos incidentes de restaurante no involucran directamente a un colaborador (cortes de energía, falla de hornos, queja por lentitud general de cocina, clientes conflictivos).
   - El control `[ ] Involucra a un colaborador específico` mantiene el formulario ultraligero por defecto (`empleado_id = NULL`). Solo al activarse se despliega la lista del personal de la sede (`CU-ADMIN-04`).
3. **Alerta Reactiva SSE para Gravedad Alta:**
   - Al registrarse un incidente con gravedad `alta`, el backend emite un mensaje persistente por el bus de Server-Sent Events en el canal de la empresa (`empresa_id`).
   - El navegador del Propietario recibe el payload y renderiza una notificación visual y sonora prioritaria en la cabecera corporativa.
4. **Ciclo de Vida Formal sin Estados Ambiguos en el Limbo:**
   - El estado `en_revision` representa peritajes o auditorías en curso (espera de videos de seguridad, peritaje técnico o cuadre bancario) o casos bajo directiva del Propietario.
   - Para evitar que los incidentes queden en un limbo eterno, los expedientes en revisión exhiben en la bandeja el indicador de días en curso (`[ En Revisión - Xd ]`).
   - La única salida de `en_revision` es pulsar **`[ Confirmar Resolución Definitiva ]`**.
5. **Resolución Definitiva e Inmutabilidad de Expedientes:**
   - La resolución exige redactar obligatoriamente las medidas correctivas de cierre (`resolucion_nota`, mín. 10 caracteres).
   - Conmuta el estado a `resuelto`, guarda `resuelto_por` y `fecha_resolucion = NOW()`.
   - A partir de este momento, el expediente queda **congelado en modo solo lectura inmutable**, blindando la trazabilidad operativa, laboral y financiera ante auditorías externas o reclamos legales.
6. **Modelo Relacional en PostgreSQL 16:**
   - La tabla `incidente` consolida los campos `motivo_revision`, `resolucion_nota`, `resuelto_por` y `fecha_resolucion`, respaldada por la restricción de integridad `chk_resolucion_consistencia` y secuencias correlativas anuales (`INC-YYYY-###`).
7. **Alineación con el Estándar de API Go:**
   - Endpoints desacoplados (`GET /api/v1/admin/incidentes`, `POST /api/v1/admin/incidentes`, `GET /api/v1/admin/incidentes/{id}`, `PATCH /api/v1/admin/incidentes/{id}/investigacion`, `PUT /api/v1/admin/incidentes/{id}/resolver`) empaquetados bajo `pkg/apiresponse.Response`.

---

## 33. Vistas Estructurales de CU-ADMIN-17 (Gestionar Promociones del Local)

### Vista 1: Bandeja Principal de Promociones (Tarjetas KPI y Control Reactivo en Caja)
Panel de administración en desktop (`1440x900`) para el Administrador del Local con 4 métricas KPI ejecutivas: *Promociones Vigentes Hoy (3 - Disponibles en Caja)*, *Campañas Programadas (1)*, *Descuentos Otorgados este Mes (S/ 1,420.00)* y *Cuentas Beneficiadas (86 mesas)*. Dispone de barra de filtros multifactoriales (Estado, Tipo de Descuento, Mes, Búsqueda reactiva) y tabla detallada con códigos correlativos (`PROMO-2026-001`), badges de porcentaje y monto, condiciones operativas, desglose de usos y switches interactivos para activar o pausar en caliente la campaña para los cajeros.
![Bandeja Principal de Promociones](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_admin_17_bandeja_promociones.jpg)

### Vista 2: Modal de Configuración con Simulador en Vivo para Caja (740px)
Formulario interactivo para dar de alta o modificar promociones sin sobreingeniería. Incorpora selector visual de tipo (Porcentaje con tope protector opcional en Soles vs Monto Fijo directo), rango de fechas de vigencia, y un bloque modular de condiciones adicionales con toggles limpios: consumo mínimo condicional, cuponera con semántica `NULL` (ilimitada si está desmarcada) y chips de días de la semana y Happy Hour. Destaca su **Simulador Interactivo en Vivo**, que calcula en tiempo real cómo se liquidará una cuenta en caja, brindando total certidumbre al administrador antes de publicar.
![Modal de Configuración con Simulador](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_admin_17_formulario_modal.jpg)

### Vista 3: Modal de Rendimiento Comercial y Auditoría de Comprobantes (740px)
Expediente detallado de impacto comercial para una promoción específica. Exhibe el total facturado en mesas que la aplicaron (`S/ 5,933.00`), total de ahorro transferido a clientes (`S/ 890.00`), ticket promedio de consumo (`S/ 109.80`) y la tabla de auditoría con los últimos comprobantes emitidos en caja (boletas/facturas, fecha/hora, mesa, cajero, subtotal y descuento). Incluye el banner de salvaguarda contable informando por qué el borrado físico está protegido (`ON DELETE RESTRICT`) al tener historial financiero.
![Modal de Rendimiento Comercial](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_admin_17_detalle_metricas_modal.jpg)

### Vista 4: Estado Inicial / Onboarding con Plantilla Oficial de Inauguración (1440x900)
Pantalla de bienvenida y orientación para sedes que inician operaciones sin promociones previas. En lugar de tablas vacías o plantillas complejas dispersas, destaca la **Plantilla Oficial: Descuento de Inauguración (15% OFF durante los primeros 30 días)** con un botón de activación en 1 solo clic (`[ ⚡ Cargar Plantilla de Inauguración en 1 Clic ]`) o la opción directa de crear promociones personalizadas desde cero.
![Estado Inicial con Plantilla de Inauguración](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_admin_17_onboarding_vacio.jpg)

---

## 34. Reglas de Negocio, Cálculo Predictivo para Caja, Semántica NULL y Salvaguardas Contables (`CU-ADMIN-17`)

1. **Cero Fricción en el Punto de Venta (Caja `CU-CAJA-02`):**
   - El cajero no debe calcular porcentajes, recordar topes ni evaluar condiciones a mano durante el cobro.
   - El endpoint `GET /api/v1/caja/promociones-vigentes?total_consumo=X` evalúa en sub-milisegundos la vigencia, días y montos mínimos, y retorna las promociones elegibles con el **descuento en Soles ya precalculado** (ej. `descuento_calculado: 18.00`, `total_con_descuento: 102.00`).
   - El cajero aplica el beneficio en un solo clic (`[ Aplicar Inauguración (-S/ 18.00) ]`), minimizando colas y erradicando errores aritméticos.
2. **Arquitectura Limpia sin Banderas Booleanas Redundantes (Semántica `NULL`):**
   - En lugar de crear columnas como `tiene_limite_usos`, se aprovecha la semántica nativa de PostgreSQL 16: si `limite_usos IS NULL`, la campaña es ilimitada.
   - En backend (Go), los límites y topes se tipifican como punteros opcionales `*int` y `*float64`.
   - En frontend (UX), switches interactivos ocultan o muestran los campos numéricos, evitando que el usuario deba tipear números gigantes o lidiar con inconsistencias de datos.
3. **Tope Máximo Protector para Descuentos Porcentuales:**
   - Para promociones porcentuales (ej. 20%), el campo `tope_maximo_descuento` fija un techo en Soles (ej. S/ 40.00), protegiendo la rentabilidad del restaurante en consumos altos de mesas corporativas o eventos.
4. **Protección de Integridad Contable (Prohibición de DELETE Físico):**
   - Una promoción vinculada a al menos un comprobante de venta (`comprobante.promocion_id`) tiene **estrictamente prohibida su eliminación física (`ON DELETE RESTRICT`)**.
   - Cualquier intento de borrado es bloqueado con código `409 Conflict (ERR_PROMOCION_CON_HISTORIAL)`. Para retirarla del servicio, el administrador utiliza el switch reactivo para **Pausarla** (`activa = false`).
   - El borrado físico solo se admite si la promoción fue creada por error y cuenta con 0 usos acumulados (`usos_actuales == 0`).
5. **Índice Parcial de Alto Rendimiento:**
   - La base de datos incorpora `CREATE INDEX idx_promocion_caja_vigencia ON promocion(local_id, fecha_inicio, fecha_fin) WHERE activa = true;`, asegurando consultas ultra-rápidas en caja sin escanear promociones vencidas ni inactivas.
6. **Onboarding Focalizado en Inauguración:**
   - Se diseñó una experiencia guiada con la plantilla de inauguración como estándar probado en la industria gastronómica, agilizando el arranque del restaurante sin fricción.

---

## 35. Vistas Estructurales de CU-MOZO-01 (Ver Estado de Mesas y Centro de Comandas en Vivo)

### Vista 1: Centro de Mando de Salón y Barra Lateral de Comandas en Vivo (Workspace Unificado 70% / 30%)
Pantalla táctil principal en desktop/tablet (`1440x900` / `1024x768`) para el Mozo. Divide el espacio de trabajo en dos zonas operativas interconectadas: a la izquierda (70% del ancho), el plano físico de mesas con tabs de ambientes (`Salón Principal`, `Terraza`, `Barra`), medidor de aforo en vivo y filtros de foco (`[● Mis Mesas Asignadas (4)]` vs `[Todo el Salón (10)]`). Cada mesa exhibe número, capacidad, tiempo transcurrido en salón (`⏱️ 34 min`), subtotal consumido, mozo a cargo y badges de platos listos o en preparación. A la derecha (30% del ancho, ~390px), la barra lateral persistente destaca con máxima prioridad los **Platos Listos para Servir (2)** con cronómetro en barra y botón en 1 toque `[ ✓ Marcar Servido ]`, seguido de las comandas activas en cocina y alertas de quiebre.
![Centro de Mando de Salón y Comandas](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_01_plano_pedidos.jpg)

### Vista 2: Quick-Drawer de Inspección de Mesa Ocupada (440px)
Panel lateral táctil que se sobrepone suavemente al tocar una mesa ocupada. Exhibe el resumen del servicio (4 comensales, tiempo en mesa 12 min, mozo titular), el desglose plato por plato con su estado exacto en cocina (`Listo en Pase`, `Servido`, `En Preparación`), notas especiales de los clientes y el subtotal acumulado (`S/ 140.00`). Incorpora botones de acción inmediata en 1 toque: `[ ＋ Tomar Más Pedidos / Adicionales ]` (`CU-MOZO-02`), `[ 🧾 Solicitar Cuenta a Caja ]` (conmuta a cuenta pedida), `[ 🔗 Unir Mesas ]` (`CU-MOZO-04`) y `[ 🔄 Reasignar a Otro Mozo ]`.
![Quick-Drawer de Inspección de Mesa](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_01_inspeccion_mesa_drawer.jpg)

### Vista 3: Modal de Alerta Prioritaria: Platos Listos en Pase / Quiebre en Cocina (560px)
Alerta reactiva emergente que se dispara ante eventos de alta urgencia de cocina. Notifica de forma destacada que una comanda caliente acaba de salir al pase de cocina (`Mesa 04: 2x Lomo Saltado Criollo hace 25s`) solicitando recogida inmediata, o advierte de un insumo agotado (`CU-COCINA-04`) que impide preparar un plato en cola, permitiendo al mozo coordinar la sustitución en caliente con el comensal.
![Alerta de Cocina Prioritaria](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_01_alerta_cocina_modal.jpg)

### Vista 4: Estado Inicial / Salón 100% Listo al Inicio de Turno (1440x900)
Pantalla del salón al comenzar el servicio (12:00 almuerzo o 19:00 cena). Todas las mesas se exhiben limpias y montadas en estado libre (`LIBRE` verde/blanco) con el aforo en cero y botón directo `[ ＋ Abrir Mesa ]`. La barra lateral permanece en reposo positivo confirmando que el canal KDS de cocina está conectado y listo para recibir las primeras comandas.
![Salón Listo al Inicio de Turno](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_01_inicio_turno_vacio.jpg)

---

## 36. Reglas de Negocio, Ergonomía Táctil, Arquitectura SSE y Flujos Operativos (`CU-MOZO-01`)

1. **Workspace Unificado en Salón (Cero Cambios de Pantalla):**
   - El mozo combina en una sola interfaz la supervisión del espacio físico (mesas) y el flujo de preparación de cocina (pedidos en vivo).
   - Se erradica la fricción de salir del mapa de mesas para consultar si la comida está lista: el pase de salida de cocina vive en la barra lateral derecha.
2. **Prioridad Absoluta de Temperatura de Servicio ("Platos Listos"):**
   - Cuando Cocina marca un plato como listo en su KDS (`CU-COCINA-02`), la tarjeta de la barra lateral se ilumina de inmediato con un cronómetro progresivo (`⏱️ Hace 1m 15s`).
   - El mozo dispone de un botón táctil grande de 1 solo toque `[ ✓ Marcar Servido / Entregado ]` que actualiza el estado a `entregado` en el backend sin abrir submenús ni ventanas intermedias.
3. **Filtro de Foco Operativo: Mis Mesas vs Todo el Salón:**
   - La píldora predeterminada `[● Mis Mesas Asignadas]` filtra exclusivamente las mesas bajo custodia del mozo autenticado, reduciendo la sobrecarga cognitiva en restaurantes de alta rotación.
   - En momentos de ayuda mutua o cambios de guardia, un toque en `[Todo el Salón]` despliega el panorama completo.
4. **Sincronización Reactiva en Tiempo Real vía Server-Sent Events (SSE):**
   - El mozo no presiona refrescar ni sufre de pantallas desactualizadas.
   - Un único stream SSE (`GET /api/v1/mozo/stream?local_id=...`) distribuye eventos en < 25ms: `item_cocina_listo`, `mesa_estado_cambiado`, `alerta_quiebre_insumo` y `reserva_bloqueo_inminente`.
   - Se optimiza el consumo de batería y datos móviles de las tablets en comparación con polling continuo.
5. **Resolución Determinista de Estados de Mesa:**
   - `Libre`: Sin pedidos activos ni bloqueos.
   - `Ocupada`: Comanda abierta en cocina (`pedido.estado IN ('borrador', 'enviado')`).
   - `Cuenta Pedida`: Comensales solicitaron la cuenta; Caja notificada (`CU-CAJA-02`).
   - `Bloqueada por Reserva`: Bloqueo automático anticipado por el parámetro `minutos_bloqueo_previo` configurado en `CU-ADMIN-10`.
6. **Quick-Drawer Lateral vs Modales Invasivos:**
   - Tocar una mesa no bloquea la visión del resto del salón; abre un drawer lateral de 440px que permite consultar la comanda sin perder de vista los eventos de las demás mesas.

---

## 37. Vistas Estructurales de CU-MOZO-02 (Tomar Pedido y Comanda Móvil en Salón)

### Vista 1: Pantalla Táctil de Toma de Pedido y Comanda Móvil (Layout Dividido 65% / 35%)
Pantalla táctil principal en tablet (`1440x900` / `1024x768`) para el Mozo en mesa. A la izquierda (65% del ancho), el catálogo de platos clasificado por categorías horizontales (`Criollos & Brasas`, `Entradas`, `Bebidas`, etc.) con buscador instantáneo y badges de disponibilidad en tiempo real (`[DISP]` vs `[🔒 AGOTADO]` con botón bloqueado, unificando `CU-MOZO-07`). A la derecha (35% del ancho, ~500px), el ticket interactivo de comanda en construcción que permite editar cantidades mediante steppers táctiles `[ - ] [ 2 ] [ + ]`, ver y editar notas de cocina en vivo o retirar platos con `[ 🗑️ ]` (unificando `CU-MOZO-03`), culminando en un botón primario de 52px de altura `[ 🚀 Confirmar y Enviar a Cocina (4 platos) ]`.
![Pantalla Táctil de Toma de Pedido](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_02_toma_pedido.jpg)

### Vista 2: Modal Rápido de Nota Corta para Cocina (480px)
Diálogo modal simplificado y ágil sin sobreingeniería de modificadores culinarios. Permite al mozo ingresar una instrucción clara y concisa para el pase de cocina (ej. *"Término 3/4, sin cebolla"* o *"Hielo al costado"*). Incorpora una casilla de verificación `[✓ Habilitar nota para el equipo de cocina]`; si la casilla no se activa, la propiedad viaja y se almacena limpiamente como `NULL` en PostgreSQL 16 sin cadenas vacías ni registros basura.
![Modal Rápido de Nota Corta para Cocina](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_02_modal_nota_cocina.jpg)

### Vista 3: Toma de Pedido Adicional / Segunda Ronda (Ronda #02)
Interfaz cuando una mesa ocupada solicita una adición a la cuenta (segunda ronda de bebidas, postres o platos adicionales). El ticket de comanda divide claramente los consumos: en la parte superior, la **Ronda #01 (Enviada 13:45 • Servida - S/ 122.00)** se muestra colapsada en gris para control contable de la mesa; en la parte inferior, los **Nuevos Adicionales (Ronda #02 por enviar)** se destacan en blanco interactivo con botón contextual de despacho `[ 🚀 Enviar Ronda #02 a Cocina (4 nuevos platos) ]`, totalizando el consumo consolidado de la mesa (`S/ 174.00`).
![Toma de Pedido Adicional / Segunda Ronda](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_02_ronda_adicional.jpg)

### Vista 4: Modal de Conflicto por Quiebre de Stock al Enviar (540px)
Diálogo de resolución asistida que intercepta el flujo si la cocina marca un insumo en quiebre (`409 Conflict - ERR_PRODUCTO_AGOTADO`) en los segundos que el mozo tardó en confirmar la orden con los comensales. Provee dos opciones inmediatas en 1 solo toque para no perder el resto de la orden: `[ ✓ Quitar plato agotado y Enviar los Demás Platos (S/ 86.00) ]` o `[ 🔄 Volver al Catálogo y Ofrecer Sustitución al Cliente ]`.
![Modal de Conflicto por Quiebre de Stock](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_02_conflicto_agotado_modal.jpg)

---

## 38. Reglas de Negocio, Ergonomía Táctil, Rondas y Despacho a Cocina (`CU-MOZO-02`)

1. **Unificación Funcional sin Fricción:**
   - La toma de pedido (`CU-MOZO-02`), la modificación táctica del borrador antes del despacho (`CU-MOZO-03`) y la consulta reactiva de disponibilidad de la carta (`CU-MOZO-07`) se integraron en una sola experiencia fluida de dos paneles.
   - El mozo nunca navega entre pantallas separadas para ver si un plato está agotado o para cambiar una cantidad: todo ocurre en el mismo workspace táctil.
2. **Semántica `NULL` Limpia para Notas de Cocina:**
   - En lugar de forzar selectores complejos de modificadores que ralentizan la atención en horas punta, el sistema provee una nota corta y opcional (`nota_cocina VARCHAR(200)`).
   - Si el comensal solicita su plato de forma regular, no se ingresa texto y el valor se persiste como `NULL`, optimizando índices y payload JSON hacia los monitores KDS de cocina.
3. **Control Transaccional de Rondas Múltiples:**
   - Cada envío a cocina genera registros en `pedido_item` etiquetados con su respectivo `numero_ronda` (1 para la orden inicial, 2 para la segunda ronda, etc.).
   - Los platos de rondas previas quedan bloqueados contra modificaciones no auditadas, previniendo duplicidades de preparación en el KDS de cocina y manteniendo la cuenta consolidada para Caja (`CU-CAJA-02`).
4. **Protección Concurrente y Enrutamiento Ultrarrápido (< 30ms):**
   - Al pulsar `[ 🚀 Confirmar y Enviar a Cocina ]`, una transacción atómica valida la disponibilidad de los productos.
   - Si no hay conflictos, los registros se insertan, la mesa pasa a `ocupada` y un evento `nueva_comanda_cocina` viaja vía Server-Sent Events hacia el monitor KDS de Cocina en menos de 30 milisegundos.
   - Si surge un conflicto concurrente de inventario, el código `409 Conflict` activa inmediatamente la asistencia guiada (Vista 4).
5. **Ergonomía Táctil en Tablet (Touch Targets > 48x48px):**
   - Diseñado para utilizarse de pie con una mano mientras se sostiene la tablet con la otra. Steppers amplios, contrastes certificados bajo WCAG 2.1 AA (> 12:1 en títulos, > 4.5:1 en textos) y feedback táctil multisensorial.

---

## 39. Vistas Estructurales de CU-MOZO-06 (Anular Pedido o Ítem de Pedido con Motivo)

### Vista 1: Inspección de Mesa con Acciones de Anulación Integradas (Quick-Drawer Extendido 440px)
Complementariedad directa y orgánica con la Vista 2 de `CU-MOZO-01` (Quick-Drawer de Inspección de Mesa Ocupada). Al abrir el panel de inspección de la Mesa 04 (440px sobre el plano de salón atenuado), cada tarjeta de plato en preparación o servido cuenta con un botón táctil dedicado `[ ✕ Anular ]`. En la botonera inferior del drawer, se incorpora el botón destructivo de advertencia `[ ⚠️ Anular Comanda Completa de Mesa 04 ]` para cancelaciones totales de la cuenta.
![Inspección de Mesa con Acciones de Anulación](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_06_inspeccion_anulacion.jpg)

### Vista 2: Modal Rápido de Anulación de Ítem con Motivos Frecuentes en 1 Toque (520px)
Diálogo modal interactivo para anular un plato específico (ej. *1x Lomo Saltado Criollo S/ 38.00*). Si el ítem está en preparación, alerta que se transmitirá una señal acústica y visual al monitor KDS de cocina para detener los fogones. Incluye chips de motivos frecuentes (`[ Error al registrar ]`, `[ ● Cliente desistió por demora ]`, `[ Queja de calidad ]`, `[ Cambio de plato ]`, `[ Cliente se retiró ]`) y un campo de justificación obligatoria (mínimo 10 caracteres). La anulación es inmediata y no requiere PIN gerencial, asentándose en auditoría y notificando al administrador en tiempo real.
![Modal Rápido de Anulación de Ítem](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_06_modal_anular_item.jpg)

### Vista 3: Modal de Anulación de Comanda Completa y Liberación de Mesa (550px)
Modal de alta advertencia operativa utilizado cuando una mesa se retira sin consumir, por errores de apertura o contingencias mayores. Resume el impacto directo: se anulan los 4 platos activos y la **Mesa 04 pasa automáticamente a estado LIBRE** en el salón. Exige selección del motivo crítico, justificación descriptiva y confirmación explícita mediante casilla de verificación `[✓]` antes de pulsar el botón destructivo `[ 🛑 Anular Comanda Total y Liberar Mesa ]`.
![Modal de Anulación de Comanda Completa](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_06_modal_anular_comanda_total.jpg)

### Vista 4: Modal de Tratamiento Especial por Merma de Inventario (530px)
Modal asistido para el caso alternativo donde el plato ya fue entregado a los comensales (`estado = 'entregado'`). El sistema instruye con claridad técnica que, al haberse cocinado y salido los ingredientes de los fogones, **no se revertirá el stock físico de almacén**; en su lugar, se asienta la anulación con la bandera de merma contable activa (`es_merma = true`) para salvaguardar la exactitud del cálculo de costos de recetas (`CU-ADMIN-05`) y del inventario valorizado.
![Modal de Tratamiento Especial por Merma](C:/Users/chuiz/.gemini/antigravity/brain/2cd819de-acdf-4888-ae40-e66151eb8741/wf_mozo_06_alerta_merma.jpg)

---

## 40. Reglas de Negocio, Cero Bloqueo Gerencial, Control de Mermas y Auditoría (`CU-MOZO-06`)

1. **Cero Cuellos de Botella (Sin Aprobación Previa Bloqueante):**
   - El mozo puede anular un pedido o ítem de inmediato sin esperar claves de supervisión gerencial. Esta decisión de diseño previene que la cocina continúe preparando comida que ya fue cancelada, erradicando desperdicio de insumos y demoras en salón.
2. **Control Antifraude y Auditoría Inmutable:**
   - Para prevenir abusos o malas prácticas, cada anulación exige categoría de motivo y justificación obligatoria (mínimo 10 caracteres).
   - Se registra de manera inmutable en `pedido_item.motivo_anulacion`, `pedido_item.anulado_por` y en la tabla `log_auditoria`.
   - Se emite de inmediato una notificación push/SSE de alta prioridad al Administrador del Local (`CU-ADMIN-12`) con el detalle del incidente.
3. **Parada Inmediata en Cocina vía Server-Sent Events (< 30ms):**
   - Si el ítem anulado se encuentra en estado `en_cola` o `en_preparacion`, el backend distribuye en < 30ms el evento `item_cocina_anulado` hacia la partida correspondiente del monitor KDS (`CU-COCINA-01`), disparando una alerta sonora y visual ("beep-beep" con flash) para suspender la cocción de inmediato.
4. **Diferenciación Rigurosa de Merma de Inventario:**
   - **Ítem no empezado (`en_cola` / `en_preparacion` detenido a tiempo):** No genera merma (`es_merma = false`).
   - **Ítem cocinado o servido (`listo` / `entregado`):** El sistema activa `es_merma = true`. El stock no se revierte porque el insumo ya fue consumido o desechado, protegiendo los balances contables de inventario y costos de platos.
5. **Transición Inteligente del Estado de Mesa:**
   - Si se anula un ítem y quedan otros activos en la comanda, la mesa permanece `ocupada` con el subtotal recalculado en vivo.
   - Si se anulan todos los ítems de la cuenta (o se ejecuta la anulación total de la mesa), la mesa pasa inmediatamente a `libre`, cancelando cualquier solicitud de cobro en caja (`CU-CAJA-02`).





