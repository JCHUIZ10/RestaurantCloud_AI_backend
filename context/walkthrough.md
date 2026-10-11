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
   - Vista 2A: [`assets/wf_prop_04_paso1_datos_enlace_web.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_paso1_datos_enlace_web.jpg)
   - Vista 2B: [`assets/wf_prop_04_formulario_local.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_formulario_local.jpg)
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
10. **CU-ADMIN-18: Configurar Parámetros Operativos de Comanda y Tiempos de KDS:**
   - Especificación: [`wireframe/administrador/CU-ADMIN-18-configurar-parametros-kds/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-18-configurar-parametros-kds/wireframe.md)
   - Vista 1: [`assets/wf_admin_18_configuracion_kds.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-18-configurar-parametros-kds/assets/wf_admin_18_configuracion_kds.jpg)
11. **CU-ADMIN-19: Configurar Métodos de Pago y Comisiones de Cobro del Local:**
   - Especificación: [`wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/wireframe.md)
   - Vista 1: [`assets/wf_admin_19_panel_configuracion.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/assets/wf_admin_19_panel_configuracion.jpg)
   - Vista 2: [`assets/wf_admin_19_modal_detalle_metodo.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/assets/wf_admin_19_modal_detalle_metodo.jpg)
   - Vista 3: [`assets/wf_admin_19_bloqueo_desactivacion.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/assets/wf_admin_19_bloqueo_desactivacion.jpg)
   - Vista 4: [`assets/wf_admin_19_onboarding_inicial.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-19-configurar-metodos-pago/assets/wf_admin_19_onboarding_inicial.jpg)
12. **CU-MOZO-01: Ver Estado de Mesas y Centro de Comandas en Vivo:**
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
13. **CU-MOZO-08: Consultar y Presentar Precuenta Digital en Mesa:**
   - Especificación: [`wireframe/mozo/CU-MOZO-08-precuenta-digital/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-08-precuenta-digital/wireframe.md)
   - Vista 1: [`assets/wf_mozo_08_modal_precuenta.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-08-precuenta-digital/assets/wf_mozo_08_modal_precuenta.jpg)
   - Vista 2: [`assets/wf_mozo_08_detalle_billetera_qr.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-08-precuenta-digital/assets/wf_mozo_08_detalle_billetera_qr.jpg)
   - Vista 3: [`assets/wf_mozo_08_mesa_notificada_salon.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/mozo/CU-MOZO-08-precuenta-digital/assets/wf_mozo_08_mesa_notificada_salon.jpg)
14. **CU-CAJA-01: Apertura de Turno de Caja:**
   - Especificación: [`wireframe/cajero/CU-CAJA-01-apertura-turno/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-01-apertura-turno/wireframe.md)
   - Vista 1: [`assets/wf_caja_01_modal_apertura.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-01-apertura-turno/assets/wf_caja_01_modal_apertura.jpg)
   - Vista 2: [`assets/wf_caja_01_bloqueo_turno_previo.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-01-apertura-turno/assets/wf_caja_01_bloqueo_turno_previo.jpg)
   - Vista 3: [`assets/wf_caja_01_pos_desbloqueado.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-01-apertura-turno/assets/wf_caja_01_pos_desbloqueado.jpg)
15. **CU-CAJA-02: Generar Cuenta a partir de Pedidos de una Mesa (Precuenta Digital):**
   - Especificación: [`wireframe/cajero/CU-CAJA-02-generar-precuenta/wireframe.md`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-02-generar-precuenta/wireframe.md)
   - Vista 1: [`assets/wf_caja_02_panel_pos.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-02-generar-precuenta/assets/wf_caja_02_panel_pos.jpg)
   - Vista 2: [`assets/wf_caja_02_promocion_aplicada.jpg`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cajero/CU-CAJA-02-generar-precuenta/assets/wf_caja_02_promocion_aplicada.jpg)

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

## 10. Vistas Estructurales de CU-PROP-06 (Ver Incidentes de la Empresa)

### Vista 1: Bandeja Consolidada Multi-Sede y Tarjetas KPI
Supervisión corporativa con métricas de incidentes no revisados, hechos de gravedad alta en curso y total acumulado del mes, con filtrado multi-sede, categorías y alerta en vivo vía Server-Sent Events (SSE).
![Bandeja Consolidada de Incidentes](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-06-incidentes-empresa/assets/wf_prop_06_bandeja_incidentes.jpg)

### Vista 2: Modal de Detalle con Marcado Automático de Lectura y Paso a Revisión
Inspección pormenorizada de los hechos y evidencia fotográfica. Al abrir el modal, el backend registra automáticamente el acuse de lectura (`visto_por_propietario = true`, `fecha_visto = NOW()`). Si el propietario decide intervenir, puede redactar una directiva ejecutiva opcional (`nota_propietario`) y conmutar el estado a `en_revision`.
![Detalle de Incidente y Paso a Revisión](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-06-incidentes-empresa/assets/wf_prop_06_detalle_incidente.jpg)

### Vista 3: Estado Vacío Positivo
Pantalla informativa que valida que todas las sedes operan con normalidad sin novedades pendientes de revisión por parte del propietario.
![Estado Vacío Positivo](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-06-incidentes-empresa/assets/wf_prop_06_incidentes_vacio.jpg)

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
Formulario estructurado para documentar anomalías operativas. Incorpora el control interactivo `[X] Involucra a un colaborador específico`, desplegando el selector de personal únicamente al activarse para no recargar la interfaz en casos fortuitos. Al clasificar la gravedad como **Alta**, la interfaz presenta un badge reactivo advirtiendo la emisión de una alerta Server-Sent Events (SSE) en tiempo real hacia el portal corporativo del Propietario (`CU-PROP-06`). Incluye dropzone blueprint para adjuntar fotografías o comprobantes (máx. 5MB).
![Modal de Registro de Incidente](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_registro_incidente_modal.jpg)

### Vista 3: Modal de Detalle, Directiva Corporativa y Resolución Definitiva (720px)
Expediente completo del incidente con trazabilidad del hecho, colaborador y evidencia. Exhibe de forma destacada la **Directiva del Propietario** registrada desde `CU-PROP-06` (`nota_propietario`) y provee dos pestañas de acción claras: *Pestaña 1: Confirmar Resolución Definitiva (Cierre Inmutable)*, que exige obligatoriamente las acciones correctivas finales y congela el caso en modo solo lectura; y *Pestaña 2: Dejar en Investigación / Seguimiento*, para asentar avances de peritaje (`motivo_revision`) sin generar limbos indefinidos.
![Modal de Detalle y Resolución](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_detalle_resolucion_modal.jpg)

### Vista 4: Estado Inicial / Vacío Positivo (Operación sin Incidentes Activos)
Pantalla de confirmación visual en desktop (`1440x900`) con KPIs en cero e ilustración blueprint limpia de orden y tranquilidad operativa, confirmando que todos los turnos de servicio y salón se desarrollan con normalidad en la sede.
![Estado Vacío Positivo](C:/Users/chuiz/.gemini/antigravity/brain/74e37ba9-daaf-4ed1-9ce1-a249be0d0c2e/wf_admin_11_onboarding_vacio.jpg)

---

## 32. Reglas de Negocio, Ciclo de Vida del Incidente, Directivas del Dueño y Cierre Inmutable (`CU-ADMIN-11`)

1. **Diferenciación de Responsabilidades (Local vs Propietario):**
   - **Administrador Local (`CU-ADMIN-11`):** Responsable operativo en la sede física. Registra el hecho en caliente, adopta medidas inmediatas de contención, conduce la investigación de campo y ejecuta el cierre definitivo con remediación técnica o disciplinaria.
   - **Propietario (`CU-PROP-06`):** Supervisión multi-sede corporativa. Recibe alertas reactivas SSE ante incidentes críticos (`gravedad = alta`), visualiza el consolidado de todos los locales de la empresa y puede emitir directivas mandatorias (`nota_propietario`).
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

---

## 41. Vistas Estructurales de CU-MOZO-04 (Unir o Dividir Mesas)

### Vista 1: Salón con Mesas Unidas Activas y Quick-Drawer Unificado (`wf_mozo_04_salon_mesas_unidas.jpg`)
Pantalla principal en tablet/desktop (`1440x900`) plenamente alineada con `CU-MOZO-01`. En el plano de salón (70%), la barra de herramientas se presenta limpia y enfocada en el servicio (`Salón Principal — Turno Almuerzo en Servicio`) sin sobrecarga de aforo. La Mesa 02 y Mesa 03 se exhiben conectadas mediante un marco perimetral continuo con el badge de enlace superior **`🔗 MESA [ 02 ; 03 ] • UNIFICADA (Capacidad: 👤 x 8)`**. La tarjeta titular muestra la permanencia (`⏱️ 28 min`), mozo titular (`Carlos M.`), subtotal consolidado (`S/ 216.00`) y platos listos (`🔔 1 LISTO`). En el Quick-Drawer lateral (30%, 440px), la comanda se despliega consolidada con la alerta informativa del grupo y el botón contextual **`[ ✂️ Desvincular / Separar Mesas ]`**.
![Salón con Mesas Unidas Activas](wireframe/mozo/CU-MOZO-04-unir-dividir-mesas/assets/wf_mozo_04_salon_mesas_unidas.jpg)

### Vista 2: Modal Interactivo con Mini-Mapa Espacial de Salón (720px)
Diálogo modal táctil centrado que se abre al pulsar `[ 🔗 Unir Mesa ]`. Para maximizar la intuición y mejorar la UX sin fricción, incorpora un **Mini-Plano de Salón interactivo (cuadrícula de 5 columnas x 2 filas)** con la distribución física real del ambiente: destaca a `Mesa 02 ★` como titular, permite seleccionar la mesa adyacente (`Mesa 03 ✓`) con feedback visual directo, muestra mesas candidatas libres y bloquea mesas no elegibles (ocupadas, fijas o reservas). Incorpora la **Calculadora Proyectiva en Vivo**, que actualiza al instante la nueva identificación **`Mesa [ 02 ; 03 ]`** y la capacidad sumada (**`👤 x 8 comensales`**).
![Modal Interactivo de Selección](wireframe/mozo/CU-MOZO-04-unir-dividir-mesas/assets/wf_mozo_04_modal_unir_mesas.jpg)

### Vista 3: Modal de Separación / Desvinculación de Mesas (540px)
Modal de separación para mesas desocupadas o recién cobradas en Caja. Certifica que la comanda fue liquidada (`Boleta B001-00248`), detallando que cada mesa retornará a su estado individual independiente (`LIBRE`) con su capacidad original recuperada (Mesa 02: 4 personas, Mesa 03: 4 personas) sin generar registros residuales.
![Modal de Separación de Mesas](wireframe/mozo/CU-MOZO-04-unir-dividir-mesas/assets/wf_mozo_04_modal_dividir_mesas.jpg)

### Vista 4: Diálogo de Bloqueo Asistido por Consumo Activo (560px)
Alerta de seguridad operativa que intercepta intentos indebidos de división cuando aún hay comida o cuentas pendientes (`HTTP 409 Conflict`). Explica con claridad que `Mesa [ 02 ; 03 ]` tiene 5 platos activos (S/ 216.00) y ofrece dos salidas asistidas en 1 solo toque: `[ 🧾 Solicitar Cuenta a Caja (CU-CAJA-02) ]` para liquidar la cuenta, o `[ ⚠️ Anular Comanda si los clientes se retiraron (CU-MOZO-06) ]` para anulación auditada y liberación inmediata.
![Diálogo de Bloqueo Asistido](wireframe/mozo/CU-MOZO-04-unir-dividir-mesas/assets/wf_mozo_04_bloqueo_validacion.jpg)

---

## 42. Reglas de Negocio, Nomenclatura Oficial, Cero Sobreingeniería y Guía Asistida (`CU-MOZO-04`)

1. **Disponibilidad Universal (Todos los Planes SaaS):**
   - La unión física de mesas está disponible de forma universal en los planes **Starter, Pro y Enterprise**. Se eliminó cualquier paywall artificial, garantizando que todo restaurante pueda atender grupos numerosos sin fricción.
2. **Nomenclatura Oficial Estandarizada `Mesa [ 02 ; 03 ]`:**
   - La sintaxis de corchetes con separador punto y coma se estandariza en todo el ecosistema: en el plano de salón (`CU-MOZO-01`), comanda del mozo (`CU-MOZO-02`), monitor KDS de Cocina (`CU-COCINA-01`) y punto de cobro en Caja (`CU-CAJA-02` y `CU-CAJA-03`).
3. **Cero Sobresaturación en Salón (`CU-MOZO-01`):**
   - La grilla del salón se mantiene 100% limpia en reposo. No existen botones invasivos por celda; la unión se dispara desde el Quick-Drawer al tocar la mesa titular o desde un modal táctil ágil.
   - Al unirse, las mesas muestran un marco perimetral continuo con badge superior, permitiendo abrir la cuenta tocando cualquiera de las mesas del grupo.
4. **Modelo Relacional sin Sobreingeniería en PostgreSQL 16:**
   - Se implementó una autorreferencia directa `mesa.mesa_principal_id UUID NULL REFERENCES mesa(id) ON DELETE SET NULL` respaldada por la restricción `chk_mesa_no_auto_referencia` y el índice parcial `idx_mesa_uniones`.
   - Se prescinde de tablas intermedias redundantes (`mesa_grupo`), logrando consultas sub-milisegundo (< 1ms).
5. **División de Mesas vs División de Cuentas:**
   - `CU-MOZO-04` gestiona la separación física de las mesas en el salón (permitida cuando están desocupadas).
   - La división de cuentas entre comensales (cuentas separadas, pagar por partes) le corresponde a la estructuración de subcuentas en `CU-MOZO-09` y cobro atómico en `CU-CAJA-03`.
6. **Bloqueo Asistido vs Errores Secos (UX de Servicio):**
   - El sistema no arroja un error 409 genérico al intentar dividir una mesa con comida; le ofrece al mozo en 1 toque ir a pedir la cuenta a Caja o proceder a la anulación si la mesa se marchó, erradicando confusiones en horas punta.

---

## 43. Vistas Estructurales de CU-MOZO-05 (Gestionar Reservas y Recepción en Salón)

### Vista 1: Bandeja Central y Centro de Mando de Reservas de Salón (`wf_mozo_05_bandeja_reservas.jpg`)
Pantalla principal en tablet/desktop (`1440x900` / `1024x768`) para supervisión y recepción en sala. Dispone de un selector de fecha dinámico `[ < Hoy, 09 Octubre 2026 > ]` con conmutador de turno (`Almuerzo` / `Cena`) y métricas ejecutivas con terminología intuitiva en español (*Reservas de Hoy: 8*, *Próximas en 1 h: 2*, *Atendidas: 4*, *Inasistencias del Día: 1*). La tabla cronológica exhibe la hora pactada, badge de cuenta regresiva en vivo (`⏱️ En 20 min`), nombre del comensal, teléfono con enlace directo a WhatsApp, comensales, mesa(s) asignada(s) (con soporte para combinaciones `Mesa [ 02 ; 03 ]`), estado operativo y accesos táctiles directos (`[ Sentar ]`, `[ Ficha ]`, `[ WhatsApp ]`). Incluye el botón primario táctil `[ + Nueva Reserva ]` (48px).
![Bandeja Central de Reservas](wireframe/mozo/CU-MOZO-05-gestionar-reservas/assets/wf_mozo_05_bandeja_reservas.jpg)

### Vista 2: Modal Interactivo de Nueva Reserva con Mini-Mapa de Salón (760px)
Modal ergonómico para agendar reservas en 3 pasos touch-first:
1. **Parámetros del Turno:** Selector rápido de fecha (`Hoy`, `Mañana`), franjas horarias táctiles (`13:00`, `13:30`, `14:00`, `14:30`, `15:00`, `20:00`) y stepper numérico de comensales (`[ - ] [ 4 ] [ + ]`).
2. **Mini-Mapa Espacial de Salón (5x2):** Reproduce la distribución física real del Salón Principal. Resalta en vivo las mesas libres con capacidad suficiente, atenúa las mesas ocupadas en esa franja horaria (`Ocupada 13:30-15:00`) y permite marcar combinaciones contiguas con `permite_union = true`. La mesa elegida (`M-08`) se resalta en azul con el badge **`[✓ SELECCIONADA]`**.
3. **Ficha del Comensal:** Nombre completo (`Fam. Gómez`), teléfono móvil (+51) y notas especiales opcionales (*"Viene con niño, requiere silla alta"*).
Al pulsar `[ 📅 Confirmar y Asignar Mesa ]`, la cita queda guardada con su mesa fijada desde el origen.
![Modal Nueva Reserva con Mini-Mapa](wireframe/mozo/CU-MOZO-05-gestionar-reservas/assets/wf_mozo_05_modal_nueva_reserva.jpg)

### Vista 3: Modal de Ficha de Reserva, Recepción y Tolerancia por Inasistencia (560px)
Modal de inspección táctil que se abre al tocar una fila de la bandeja o una mesa bloqueada en el salón. Muestra la ficha del cliente, número de personas, mesa asignada y el **Reloj de Cortesía en Vivo**:
- Informa: *"Hora pactada: 14:00 • Espera de cortesía: 15 min (hasta 14:15)"*.
- Si se encuentra en tolerancia: muestra el aviso *"En ventana de cortesía de espera (faltan X min)"*.
- Si supera los 15 minutos de retraso: conmuta a *"Tolerancia expirada (16 min de retraso)"* y habilita en rojo el botón contextual **`[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]`**.
- Acciones en 1 toque: `[ ✓ Sentar Comensales y Abrir Pedido (CU-MOZO-02) ]`, `[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]`, `[ 💬 Enviar WhatsApp de Recordatorio ]` y `[ ✕ Cancelar Reserva ]`.
![Ficha de Reserva y Recepción](wireframe/mozo/CU-MOZO-05-gestionar-reservas/assets/wf_mozo_05_modal_detalle_recepcion.jpg)

### Vista 4: Estados de Frontera — Forzar Sobreasignación y Paywall Starter (Modales 540px)
Composición dual que documenta los casos de borde:
- **Panel Izquierdo (Sobreasignación Preventiva):** Se activa cuando un mozo intenta sentar comensales espontáneos en una mesa con reserva inminente (< 30 min). Alerta del riesgo y brinda alternativas asistidas: `[ Reasignar Reserva a Mesa 05 y Continuar ]`, `[ Ocupar Solo para Consumo Rápido (< 20 min) ]` o `[ Cancelar y Elegir Otra Mesa Libre ]`.
- **Panel Derecho (Paywall Didáctico Plan Starter):** Despliega un diálogo informativo claro para locales en plan Starter (`plan.incluye_reservas = false`), explicando que las reservas y el bloqueo espacial están reservados para planes Pro y Enterprise, guiando al operador a contactar al propietario sin frustrar la experiencia.
![Estados de Frontera y Paywall](wireframe/mozo/CU-MOZO-05-gestionar-reservas/assets/wf_mozo_05_estados_excepcion.jpg)

---

## 44. Reglas de Negocio, Exclusividad SaaS Pro/Enterprise, Bloqueo Espacial y Cortesía No-Show (`CU-MOZO-05`)

1. **Exclusividad Comercial y Políticas SaaS (`CU-PROP-03`):**
   - El módulo de reservas está condicionado estrictamente al flag de suscripción `plan.incluye_reservas = true` (disponible únicamente para planes **Pro y Enterprise**).
   - Los locales en plan Starter no quedan bloqueados con errores crudos: reciben el paywall didáctico asistido (Vista 4).
2. **Asignación Espacial desde el Origen:**
   - La reserva no se crea "en el aire" ni depende de algoritmos opacos. El operador visualiza la cuadrícula física del local en el Mini-Mapa y asigna la mesa física concreta desde el momento del registro.
3. **Coexistencia con Clientes Casuales y Bloqueo Preventivo Automático:**
   - Una mesa reservada para las 20:00 permanece en estado visual `libre` durante el servicio previo, permitiendo sentar comensales casuales de rotación rápida.
   - Cuando el reloj del sistema alcanza los `minutos_bloqueo_previo` configurados por administración (ej. 30 minutos antes, a las 19:30), el backend conmuta la mesa a `bloqueada` en tiempo real vía SSE, proyectando el borde ámbar punteado en todos los dispositivos de sala.
4. **Ventana de Cortesía y Terminología Intuitiva para Inasistencias (No-Show):**
   - En base de datos y contratos de API se utiliza de forma estándar el enum `no_show`.
   - A nivel de UI/UX, para maximizar la adopción y comprensión del personal de salón, la interfaz utiliza terminología diáfana en español: badge `[ INASISTENCIA ]`, KPI `Inasistencias del Día` y botón contextual `[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]`.
   - El sistema impide registrar la inasistencia antes de cumplirse los `tolerancia_no_show_min` (ej. 15 minutos), evitando liberaciones prematuras injustas.
5. **Transición Atómica al Sentar Comensales (`CU-MOZO-02`):**
   - Al pulsar `[ ✓ Sentar Comensales y Abrir Pedido ]`, el sistema conmuta la reserva a `atendida`, la mesa a `ocupada`, crea el pedido en borrador y redirige al mozo de inmediato a la comanda interactiva, erradicando pasos dobles.
6. **Soporte Nativo de Mesas Agrupadas (`CU-MOZO-04`):**
   - Si la reserva supera la capacidad de una mesa individual, el mozo puede seleccionar mesas contiguas con `permite_union = true`, agendando y bloqueando la combinación bajo la etiqueta oficial **`Mesa [ 02 ; 03 ]`**.

---

## 45. Vistas Estructurales de CU-ADMIN-12 (Recibir Notificación de Anulación de Pedido)

### Vista 1: Bandeja Central de Control de Anulaciones y Auditoría de Sede (`wf_admin_12_bandeja_anulaciones.jpg`)
Pantalla principal en tablet/desktop (`1440x900` / `1024x768`) para supervisión y auditoría en sede. Dispone de selector de fecha limpio `[ < Hoy, 09 Octubre 2026 > ]` con atajos rápidos (`Hoy`, `Ayer`, `7 Días`, `Calendario`) sin fragmentación de turnos. Exhibe KPIs consolidados del día (*Total Anulaciones: 5*, *Monto Acumulado: S/ 274.00*, *Con Merma Culinaria: 2 platos (S/ 28.50)*, *Mesas Afectadas: 3*), filtros rápidos por píldora (`[ Todas ]`, `[ ● Pendientes ]`, `[ Con Merma ]`, etc.), selector por mozo y tabla de auditoría con cronómetro de espera real (`⏱️ 25m`), semáforo de merma y estado de revisión. Incluye el **Toast Flotante en Tiempo Real** en la esquina superior derecha.
![Bandeja Central de Anulaciones](wireframe/administrador/CU-ADMIN-12-notificacion-anulacion/assets/wf_admin_12_bandeja_anulaciones.jpg)

### Vista 2: Modal de Inspección y Ficha de Auditoría de la Anulación (680px)
Modal de alta fidelidad que se abre al pulsar una fila o el Toast. Desglosa:
1. **Identificación:** Mesa de origen (`Mesa 04`), Comanda `#154`, Mozo titular y Usuario que ejecutó la anulación.
2. **Trazabilidad Temporal de Auditoría:** Compara `pedido_created_at` (13:50:12) vs `anulado_at` (14:15:30), informando el tiempo transcurrido (`25 min 18 seg`) y el estado en que se encontraba el plato al corte (`En Preparación en Cocina`). Diagnóstica automáticamente: *"Demora confirmada: El plato excedió los 20 min de cocina caliente"*.
3. **Motivo y Justificación Textual:** Categoría (`Demora en entrega`) y texto obligatorio redactado por el mozo (*"El comensal lleva esperando >25m y solicita retirar..."*).
4. **Impacto Culinario y Merma:** Partida (Pase Caliente) y merma contable (`es_merma = false`, ingredientes detenidos a tiempo).
Acciones directas: `[ ✓ Marcar como Revisado / Conforme ]` y `[ ⚠️ Escalar a Incidente Operativo (CU-ADMIN-11) ]`.
![Ficha de Auditoría de Anulación](wireframe/administrador/CU-ADMIN-12-notificacion-anulacion/assets/wf_admin_12_modal_detalle_anulacion.jpg)

### Vista 3: Dropdown de Campana de Notificaciones y Alerta Toast Flotante (390px)
Muestra la interacción omnipresente en el portal administrativo mientras el supervisor opera en el plano de salón, inventario o reportes:
- **Campana de Alertas (`[ 🔔 2 ]`):** Menú desplegable con 2 notificaciones no leídas de anulaciones recientes (con punto azul indicador y tiempos relativos *"Hace 3 min"*), alerta de stock mínimo y enlace a la bandeja completa.
- **Toast Reactivo en Vivo:** Demuestra la captura acústica y visual en < 30ms cuando ocurre un corte en salón.
![Campana de Notificaciones y Toast](wireframe/administrador/CU-ADMIN-12-notificacion-anulacion/assets/wf_admin_12_dropdown_campana_toast.jpg)

### Vista 4: Estados de Excepción — Diálogo de Escalamiento a Incidente y Estado Vacío Positivo (540px)
Composición dual:
- **Panel Izquierdo (Modal de Escalamiento 540px):** Formulario de transferencia asistida hacia `CU-ADMIN-11` cuando se detecta queja severa, agresión o merma cuantiosa. Prellena título, categoría (`Rotura / Merma Culinaria`), gravedad (`Media`), mozo involucrado, plato e importe revocado, asociando `pedido_anulacion.incidente_id`.
- **Panel Derecho (Tarjeta de Estado Vacío 540px):** Celebra la excelencia operativa cuando no hay cancelaciones en el día: *"Cero Anulaciones Registradas Hoy. 100% Eficiencia Operativa en Salón, 48 Comandas Despachadas con Éxito y S/ 0.00 en Pérdidas por Merma"*.
![Estados de Excepción y Vacío](wireframe/administrador/CU-ADMIN-12-notificacion-anulacion/assets/wf_admin_12_escalamiento_y_vacio.jpg)

---

## 46. Reglas de Negocio, Tabla Especializada `pedido_anulacion`, Trazabilidad Temporal y Escalamiento (`CU-ADMIN-12`)

1. **Tabla Especializada `pedido_anulacion` vs. Sobrecarga de Entidades Vivas:**
   - Para no degradar la velocidad de la tabla caliente de salón (`pedido_item`), se desacoplaron las 8 columnas de auditoría gerencial en la tabla dedicada `pedido_anulacion`.
   - `pedido_item` solo conmuta a `estado = 'anulado'`, mientras que `pedido_anulacion` congela el contexto, precios, justificación y marcas temporales.
2. **Cálculo Objetivo de Tiempos de Espera:**
   - La plataforma no depende de la percepción subjetiva del mozo o cliente. Contrasta `pedido_created_at` (inserción de comanda en `CU-MOZO-02`) contra `anulado_at` (corte en `CU-MOZO-06`), calculando fáticamente `minutos_espera` para evaluar si existió demora culinaria imputable al restaurante.
3. **Control Antifraude y Acuse Administrativo:**
   - Los mozos tienen autonomía para anular sin clave gerencial para no atrasar la cocina, pero el administrador debe visar cada novedad mediante `[ ✓ Marcar como Revisado ]` (`revisado = true`, `revisado_por`, `revisado_at`).
4. **Puente Natural con Incidentes Internos (`CU-ADMIN-11`):**
   - Una anulación no queda aislada: si involucra merma reiterada o sospecha de fraude, el sistema permite escalarla en 1 clic a un expediente formal correlativo (`INC-YYYY-###`), alertando al propietario en `CU-PROP-06` si la gravedad es calificada como alta.
5. **Base Sólida para Reportes Gerenciales (`CU-ADMIN-13`):**
   - Al estar normalizada en `pedido_anulacion`, la generación de reportes mensuales de pérdidas por mermas y causas de anulación se ejecuta en < 2 milisegundos mediante índices compuestos por `(local_id, anulado_at)`.

---

## 47. Vistas Estructurales de CU-MOZO-07 (Atender Incidencia de Plato No Disponible y Resolver en Mesa)

### Vista 1: Plano de Salón con Alerta de Quiebre de Cocina y Quick-Drawer (`wf_mozo_07_salon_alerta_quiebre.jpg`)
Pantalla táctil para tablet de salón (`1440x900` / `1024x768`):
- **Barra Reactiva Superior:** Emite toast contextual con badge de advertencia: *"⚠️ Incidencia en Cocina (CU-COCINA-04): Lomo Saltado Criollo AGOTADO • Mesa 04 requiere atención inmediata"* con botón táctil directo `[ Ver y Resolver en Mesa 04 ]`.
- **Plano Espacial de Mesas (70%):** La tarjeta de `Mesa 04` se resalta en contorno de advertencia reforzado con la etiqueta **`[ ⚠️ QUIEBRE COCINA ]`** y la indicación: `1 Plato No Disponible • S/ 140.00`.
- **Quick-Drawer Lateral de Mesa 04 (30% / 440px):** Exhibe en la parte superior el banner de acción prioritaria: *"⚠️ PLATO OBSERVADO POR COCINA — 1x Lomo Saltado Criollo (S/ 38.00) • Insumo agotado en cocina"*, ofreciendo los botones táctiles inmediatos:
  - `[ 🔄 Sustituir Plato ]` (conduce a la selección asistida de carta).
  - `[ ✕ Anular de Cuenta ]` (conduce al retiro sin costo del ítem).
  - Listado de ítems regulares de la mesa (*1x Arroz con Pollo en preparación, 1x Causa servida, 2x Chicha servida*) y subtotal acumulado.
![Plano de Salón con Alerta y Quick Drawer](wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/assets/wf_mozo_07_salon_alerta_quiebre.jpg)

### Vista 2: Modal de Resolución Asistida Frente al Cliente — Sustituir vs. Anular (620px)
Modal de diálogo asistido que se activa al pulsar sobre la alerta. Orienta al mozo sobre cómo proceder con empatía ante el comensal:
1. **Cabecera Contextual:** Identifica Mesa 04, Mozo a cargo (Carlos Mendoza) y la causa: *"Cocina marcó Lomo Saltado Criollo como 'Agotado' por quiebre de stock en insumo clave"*.
2. **Tarjeta de Alternativa A (Sugerida): `[ 🔄 Sustituir por Otro Plato de la Carta ]`**: Permite al comensal elegir otra opción gastronómica disponible. Se calcula la diferencia de precio y se envía la comanda de reemplazo a cocina sin cancelar la ronda.
3. **Tarjeta de Alternativa B: `[ ✕ Retirar de la Cuenta y Anular Sin Costo ]`**: Retira el ítem de la comanda de la mesa, descuenta su importe íntegro (S/ 38.00), genera la auditoría obligatoria en `pedido_anulacion` (`es_merma = false`) y notifica al Administrador en `CU-ADMIN-12`.
4. Botón de pie: `[ Posponer y Continuar Ronda ]`.
![Modal de Resolución Asistida](wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/assets/wf_mozo_07_modal_resolucion_incidencia.jpg)

### Vista 3: Modal de Sustitución Universal con Búsqueda en Toda la Carta y 6 Sugerencias Directas (760px)
Modal táctil de 760px que responde al feedback de salón con navegación universal:
- **Navegación Superior con Retorno Seguro:** Botón táctil `[ ← Volver a Opciones ]` en la cabecera para regresar al diálogo de decisión sin pérdida de contexto si el cliente no desea ver opciones alternativas.
- **Buscador en Toda la Carta:** Input de búsqueda libre `[ 🔍 Buscar por nombre en toda la carta (ej. Ceviche, Chaufa, Fettuccine)... ]` para comensales que desean cambiar de categoría culinaria.
- **Barra de Chips de Categorías:** Pestaña inicial `[ ⭐ 6 Sugerencias Directas ]` activa por defecto, más chips de familias gastronómicas (`Toda la Carta`, `Carnes & Brasas`, `Pescados & Mariscos`, `Criollos`, `Pastas`, `Bebidas`).
- **6 Recomendaciones Directas en SQL Simple:** Cuadrícula de 6 tarjetas ordenadas por afinidad de categoría y cercanía matemática de precio (`ABS(precio - original)`):
  - *Asado de Tira con Puré* — S/ 38.00 (`Mismo Precio S/ 0.00`).
  - *Bife Angosto Criollo* — S/ 42.00 (`+ S/ 4.00 Dif.`).
  - *Seco de Res con Frejoles* — S/ 38.00 (`Mismo Precio S/ 0.00`).
  - *Ají de Gallina Clásico* — S/ 32.00 (`- S/ 6.00 A Favor`).
  - *Fettuccine a la Huancaína* — S/ 36.00 (`- S/ 2.00 A Favor`).
  - *Ceviche Mixto Tradicional* — S/ 42.00 (`+ S/ 4.00 Dif.`).
- **Calculadora de Impacto en Comanda:** Refleja la variación exacta en la cuenta de mesa (`S/ 140.00 (Sin variación)`).
- **Doble Vía de Decisión en Footer:**
  - Izquierda: `[ ✕ Cliente Desiste: Anular Plato (S/ 0.00) ]` para saltar de inmediato a la anulación sin costo si el cliente decide no pedir ningún sustituto.
  - Derecha: `[ ✓ Confirmar Sustitución y Enviar a Cocina ]` para despachar el reemplazo a KDS.
![Modal de Sustitución de Carta](wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/assets/wf_mozo_07_modal_sustitucion_carta.jpg)

### Vista 4: Modal de Confirmación de Retiro, Recálculo de Precuenta y Auditoría (580px)
Modal de confirmación segura cuando el cliente no desea sustitución:
- **Resumen Financiero:** Muestra el impacto en la comanda: *Subtotal Anterior S/ 140.00* $\rightarrow$ *Monto Deducido - S/ 38.00* $\rightarrow$ **Nuevo Subtotal de Mesa S/ 102.00**.
- **Categoría de Auditoría Fija:** Congela la clasificación `quiebre_stock_cocina` y marca `es_merma = false` (sin costo para el cliente ni desperdicio cocinado).
- **Detalle Textual Obligatorio:** Prellena o permite redactar la justificación de auditoría (*"Cliente no deseó sustitución ante quiebre de insumo en cocina"*).
- **Advertencia Regulatoria:** Informa que la notificación se transmitirá al instante al Administrador del Local (`CU-ADMIN-12`) y al Cajero (`CU-CAJA-02`).
- Botón de acción: `[ Confirmar Retiro del Plato y Recalcular Cuenta ]`.
![Modal de Anulación por Quiebre](wireframe/mozo/CU-MOZO-07-atender-plato-no-disponible/assets/wf_mozo_07_anulacion_quiebre_cuenta.jpg)

---

## 48. Reglas de Negocio, Flujo Reactivo SSE, Sustitución de Carta y Conexión con `CU-COCINA-04` y `CU-ADMIN-12` (`CU-MOZO-07`)

1. **Activación Reactiva en Tiempo Real vía Server-Sent Events (`CU-COCINA-04` $\rightarrow$ `CU-MOZO-07`):**
   - Cuando el personal de cocina marca un producto como `agotado` en su monitor KDS (`CU-COCINA-04`), el backend conmuta atómicamente todos los pedidos pendientes que contienen ese ítem a `estado = 'no_disponible'`.
   - Se emite de inmediato el evento SSE `plato_no_disponible` con payload `{ local_id, mesa_id, mesa_numero, producto_nombre, mozo_id }` capturado por la tablet del mozo en < 30ms, desplegando banner y badge en salón.
2. **Autonomía y Empatía Operativa en Salón (Sin Clave Gerencial):**
   - Para no hacer esperar al cliente en mesa mientras se busca a un supervisor, el mozo posee autonomía total para resolver la incidencia (sustituyendo o anulando) sin ingresar claves ni aprobaciones presenciales.
3. **Algoritmo SQL Simple de 6 Recomendaciones por Defecto (Cero Sobreingeniería):**
   - Sin inventar sistemas de estrellas, ratings o tiempos de cocción ficticios en base de datos.
   - El sistema consulta estrictamente los platos activos del local con `disponibilidad = 'disponible'`, priorizando primero la misma categoría del plato quebrado (`(categoria_id = :cat_id) DESC`) y ordenando por **cercanía matemática de precio** (`ABS(precio - precio_original) ASC`) con `LIMIT 6`.
   - Esto presenta de inmediato alternativas que respetan el presupuesto que el comensal ya estaba dispuesto a pagar.
4. **Búsqueda Universal en Toda la Carta:**
   - Si el cliente no desea platos de la misma categoría o sugerencias predeterminadas, el mozo puede buscar libremente por texto (`LOWER(nombre) LIKE %q%`) o filtrar por chips de cualquier categoría del restaurante.
   - Solo se exhiben productos con stock garantizado en cocina.
5. **Doble Vía de Retorno y Desistimiento sin Fricción:**
   - El mozo puede volver atrás en cualquier momento con `[ ← Volver a Opciones ]`.
   - Si el cliente decide no ordenar ningún sustituto tras revisar las opciones, el botón `[ ✕ Cliente Desiste: Anular Plato (S/ 0.00) ]` permite transicionar directamente al flujo de anulación sin costo, ahorrando clics en el salón.
6. **Auditoría Inmutable en `pedido_anulacion` sin Merma Culinaria (`es_merma = false`):**
   - Si el comensal opta por anular el plato, se genera un registro en la tabla especializada `pedido_anulacion` con `motivo_categoria = 'quiebre_stock_cocina'`, `estado_anterior = 'no_disponible'` y `es_merma = false` (dado que el plato nunca se preparó ni se consumieron insumos físicos).
   - Se emite el evento SSE `notificacion_anulacion` hacia la campana y bandeja de `CU-ADMIN-12` para trazabilidad de compras y control gerencial.
7. **Sincronización Inmediata con KDS y Precuenta en Caja (`CU-CAJA-02`):**
   - Si se sustituye el plato, se emite una nueva orden directa a Cocina KDS con prioridad normal.
   - En ambos casos (sustitución o anulación), el subtotal acumulado de la mesa se actualiza en tiempo real, garantizando que cuando el Cajero consulte la cuenta en `CU-CAJA-02`, el monto refleje con precisión matemática los consumos reales.
8. **Cierre de Mesa si Queda sin Consumos:**
   - Si el plato anulado era el único de la mesa, el sistema pregunta al mozo y libera la mesa a estado `libre` en el plano de salón.

---

## 49. Arquitectura de Despacho Directo vs. Cocina KDS y Actualización de CU-ADMIN-04, CU-MOZO-01 y CU-MOZO-02

1. **Desacoplamiento Estricto de Almacén (`CU-ADMIN-03`) y Eficiencia Sub-milisegundo (< 0.5ms):**
   - El atributo booleano **`requiere_preparacion`** se ubica directamente en la tabla `producto` (`ALTER TABLE producto ADD COLUMN requiere_preparacion BOOLEAN NOT NULL DEFAULT true`), desvinculando la lógica operativa del catálogo de insumos de almacén (`CU-ADMIN-03`).
   - Gracias al índice parcial `CREATE INDEX idx_producto_requiere_prep ON producto(local_id, requiere_preparacion) WHERE activo = true;`, las pantallas de comandas móviles del Mozo y los monitores KDS de Cocina filtran directamente en memoria sin realizar costosos `JOIN` contra `producto_insumo` o `insumo`.

2. **Gestión del Administrador en la Carta (`CU-ADMIN-04`):**
   - En la ficha de alta/edición de productos, el administrador define en el Paso 1 el switch:
     ```text
     DESTINO OPERATIVO / DESPACHO:
     (●) Requiere preparación en cocina (KDS)  [Comidas, fondos, platos elaborados]
     ( ) Despacho directo en salón / barra     [Gaseosas, bebidas en botella, snacks]
     ```
   - Si selecciona *"Despacho directo"*, el producto no exige recetas complejas por porciones o rendimientos en el Paso 2; permite opcionalmente asociar 1 unidad directa de insumo de almacén (ej. 1 botella de gaseosa) para control estricto de mermas y existencias.

3. **Split Transaccional Atómico en Comandas (`CU-MOZO-02`):**
   - Al registrar la orden táctil, el ticket muestra la segmentación de ítems: `[ 🍳 Cocina KDS ]` vs. `[ 🥤 Despacho Directo / Salón ]`.
   - Al despachar (`POST /api/v1/mozo/pedidos/enviar`):
     - Ítems con `requiere_preparacion = true` nacen en `pedido_item.estado = 'en_cola'` y viajan vía SSE al monitor KDS (`CU-COCINA-01`).
     - Ítems con `requiere_preparacion = false` nacen inmediatamente en `pedido_item.estado = 'listo'`, omitiéndose del KDS para erradicar ruido innecesario en fogones.

4. **Operación Inmediata en Salón (`CU-MOZO-01`):**
   - En la **Vista 1 (Barra Lateral 390px)**, el mozo visualiza el bloque prioritario `🥤 BEBIDAS & DESPACHO DIRECTO (LISTO)` con botón `[ ✓ Marcar Servido ]` que conmuta a `entregado` al instante de entregar la bebida en mesa.
   - En la **Vista 2 (Quick-Drawer de Inspección 440px)**, los consumos de la mesa se exhiben clasificados en `-- PLATOS EN COCINA KDS --` y `-- BEBIDAS Y DESPACHO DIRECTO SALÓN --`, garantizando trazabilidad integral de tiempos y servicio.

---

## 50. Vistas Estructurales y Parámetros Operativos de Cocina y KDS (`CU-ADMIN-18`)

### Vista 1: Panel de Configuración de KDS y Simulador del Semáforo en Tiempo Real (`wf_admin_18_configuracion_kds.jpg`)
Pantalla de escritorio (`1440x900`):
- **Panel Izquierdo (50%): Formulario de Parámetros Operativos de Sede:**
  - Steppers numéricos táctiles para calibrar el **Tiempo Óptimo Verde** (`tiempo_optimo_verde_min`, default 15 min), el **Tiempo de Alerta Ámbar** (`tiempo_alerta_ambar_min`, default 25 min) y la **Tolerancia en Pase Caliente de Salón** (`tiempo_maximo_pase_min`, default 3 min para `CU-MOZO-01`).
  - Interruptores interactivos para timbres de comanda nueva y alarmas repetitivas periódicas para comandas en rojo crítico (`intervalo_sonido_rojo_seg = 60s`).
  - Selector de vista de inicio del monitor: `Comandas FIFO por Mesa` vs `Consolidado All-Day de Producción`.
  - Botón de restauración a valores estándar de la industria gastronómica en un solo clic.
- **Panel Derecho (50%): Previsualizador del Semáforo KDS en Vivo:**
  - Renderizado con el tema visual oscuro de cocina (`#1E293B`) que muestra dinámicamente 3 tarjetas de comanda simuladas:
    - *Mesa 04 (10 min):* `[ 🟢 ESTADO ÓPTIMO ]` con cronómetro verde.
    - *Mesa 01 (19 min):* `[ 🟡 ADVERTENCIA DEMORA ]` con notas de preparación y cronómetro ámbar.
    - *Mesa 07 (28 min):* `[ 🔴 CRÍTICO / PRIORIDAD ]` con cronómetro rojo y alerta acústica.
  - Al tipear o mover los minutos en el formulario, las tarjetas de prueba mutan instantáneamente, permitiendo al administrador previsualizar los efectos antes de guardar.
- **Sincronización Reactiva SSE:** Al presionar `[ ✓ Guardar Parámetros de KDS ]`, el backend persiste en `configuracion_kds` y emite el evento SSE `configuracion_kds_actualizada`, actualizando los monitores KDS (`CU-COCINA-01`) y tablets de mozos (`CU-MOZO-01`) en menos de 30 milisegundos sin refresco manual.

---

## 51. Vistas Estructurales y Operación del Kitchen Display System (KDS) de Cocina (`CU-COCINA-01`)

### Vista 1: Tablero KDS de Comandas en Vivo (`wf_cocina_01_tablero_kds_comandas.jpg`)
Pantalla táctil KDS industrial en formato horizontal (`1440x900`):
- **Cabecera KDS Oscura (`#0B1120`):** Reloj digital de alta precisión en tiempo real (`14:28:45`), indicador de latencia SSE `(•) KDS En Vivo (SSE)` y perfil del usuario (`Chef Roberto - Jefe Cocina`).
- **Filtro de Partidas Culinarias:** Botonera superior táctil para filtrar estaciones: `[ Todas las Partidas (12) ]`, `[ 🍳 Calientes / Fogones (7) ]`, `[ 🐟 Fríos / Ceviches (3) ]` y `[ 🔥 Brasas / Horno (2) ]`.
- **Selector de Modo de Visualización:** Permite conmutar con 1 toque entre `[ ⊞ Comandas FIFO (4) ]` y `[ ☰ Consolidado All-Day ]`.
- **Barra de Métricas de Cocina y Umbrales Activos:** Informa `Comandas Activas: 4`, `Platos en Cocina: 12`, `En Fuego: 7`, `En Cola: 3`, `Listos en Pase: 2` y los umbrales dinámicos calibrados en `CU-ADMIN-18` (`🟢 <= 15m`, `🟡 16-25m`, `🔴 > 25m`).
- **Rejilla Columnar FIFO con Semáforo Cromático Dinámico:**
  - **Columna 1 (Estado Óptimo - Verde):** *Mesa 04 (Salón)* • Mozo: Carlos M. • 4 comensales • Ronda 1 • `⏱️ 08:30 min`. Platos en preparación (`2x Lomo Saltado`) con botón naranja `[ 🔥 En Fuego ]` y platos listos (`1x Causa Limeña`) con botón `[ Deshacer ]` en 30s. Chip de pie: `[ 🥤 2 Bebidas salón (atendidas por mozo) ]`.
  - **Columna 2 (Advertencia de Demora - Ámbar):** *Mesa 01 (Terraza)* • Mozo: Ana P. • 2 comensales • Ronda 1 • `⏱️ 18:45 min`. Ceviche con notas resaltadas (`⚠️ Sin ají para el ceviche • Hielo aparte`) y botón `[ ✓ Marcar Listo ]`. Chip de pie: `[ 🥤 1 Bebida salón ]`.
  - **Columna 3 (Mesas Agrupadas - Ámbar):** `🔗 Mesa [ 02 ; 03 ]` • Mozo: Carlos M. • 8 comensales • `Ronda 2 Adicionales` • `⏱️ 21:10 min` (`GRUPO UNIDO`). Platos coordinados (`3x 1/2 Pollo a la Brasa`, `1x Tequeños Criollos`). Chip de pie: `[ 🥤 4 Bebidas salón ]`.
  - **Columna 4 (Crítico Demorado - Rojo):** *Mesa 07 (Salón)* • Mozo: Carlos M. • 3 comensales • `PRIORIDAD 1` • `⏱️ 28:50 min` (`CRÍTICO DEMORADO > 25m`). Banner de advertencia `🚨 REQUERIDO FOGÓN INMEDIATO`, botón de urgencia `[ ✓ Listo Urgente ]` y acción masiva `[ 🚨 Despachar Todo y Notificar Mozo ]`.

### Vista 2: Modal de Detalle Ampliado de Comanda (`wf_cocina_01_modal_detalle_comanda.jpg`)
Diálogo táctil modal centrado (`680px`):
- **Encabezado y Metadatos:** Identifica `Comanda #149 • MESA 04`, Salón Principal, Ronda 1, Mozo Carlos Mendoza, 4 comensales, hora de envío (`14:20:15 - Hace 8m`), y estado global. Badge de tiempo en cabecera: `⏱️ 08:30 min (Óptimo <= 15m)`.
- **Desglose Técnico de Platos con Receta:**
  - Platos culinarios con estado en vivo (`EN FUEGO (6 min)`).
  - Caja de notas en crema claro (`#FEF3C7`) destacando términos y alérgenos: `Término 3/4 • Una porción sin cebolla (comensal alérgico)`.
  - Trazabilidad de receta culinaria (`CU-ADMIN-04`): descuento de insumos en bodega (`0.400 kg Carne Lomo Fino`, `0.014 sacos Papa Yungay`, `0.004 bidones Aceite Vegetal`).
  - Metadatos de estación: Partida (Fogones), Cocción (Wok / Fuego Alto), Pase (Caliente #01).
- **Caja Informativa de Salón (`requiere_preparacion = false`):** Detalla que `2x Inka Kola 500ml Heladas` fueron despachadas directamente por el Mozo y ya cuentan con el badge `[ ✓ SERVIDO EN MESA ]`.
- **Acciones Táctiles:** `[ ← Volver al Tablero KDS ]` y `[ ✓ Despachar Todo al Pase de Salón ]` para liberación masiva.

### Vista 3: Alerta Reactiva de Parada de Fogones (`wf_cocina_01_alerta_anulacion_kds.jpg`)
Modal urgente de alta visibilidad (`620px`) con borde rojo brillante y efecto glow pulsante:
- **Disparo Reactivo SSE (< 30ms):** Captura el evento `item_pedido_anulado` emitido cuando salón anula un plato por demora o quiebre (`CU-MOZO-06` / `CU-MOZO-07`).
- **Plato y Mesa Involucrada:** Despliega el ítem tachado `~~1x Lomo Saltado Criollo~~` con badge `[ ANULADO ]`, Mesa 04, Mozo Carlos Mendoza y tiempo transcurrido (25 min).
- **Motivo Operativo de Salón:** Caja explicativa: `⚠️ Causa reportada por Salón: Demora excesiva en entrega. Comensal desistió del plato.`
- **Directriz de Prevención de Merma:** Instrucción obligatoria: *"Detener inmediatamente la cocción en wok o sartén. No emplatar para evitar merma de insumos físicos no cocinados (es_merma = false)"*.
- **Desbloqueo Táctil:** Botón grande `[ ✓ Entendido / Retirar Plato de la Comanda ]` para silenciar la alarma y retirar el plato del tablero.

### Vista 4: Consolidado de Producción en Vivo ("All-Day Summary" - `wf_cocina_01_consolidado_produccion_all_day.jpg`)
Pantalla general de acumulación de fuegos (`1440x900`):
- **Barra Superior de Control Global:** Suma `12 Raciones Pendientes`, `7 En Fuego / Sartenes`, `5 En Cola de Fuego`, `4 Mesas Involucradas`.
- **Organización por Estaciones Físicas de Cocina:**
  - **Partida 1: Fogones & Criollos (6 raciones):** Acumula `4x Lomo Saltado Criollo` (Mesa 04 [2x], Mesa 07 [2x crítico]) y `2x Bife Angosto Criollo` (Mesa 07 [2x crítico]).
  - **Partida 2: Brasas & Horno (4 raciones):** Acumula `3x 1/2 Pollo a la Brasa` (Mesa [ 02 ; 03 ] [3x grupo]) y `1x Pastel de Choclo Criollo` (Mesa 07 [1x]).
  - **Partida 3: Fríos & Entradas (2 raciones):** Acumula `1x Ceviche Mixto Tradicional` (Mesa 01 [1x]) y `1x Porción Tequeños Criollos` (Mesa [ 02 ; 03 ] [1x]).
- **Optimización Energética y Velocidad:** Permite a los cocineros saltear o cocinar por tandas masivas, optimizando la capacidad de fuego de los fogones y reduciendo drásticamente los tiempos globales de espera del restaurante.

---

## 52. Vistas Estructurales y Actualización de Estado de Preparación en Cocina (`CU-COCINA-02`)

### Vista 1: Interacción de Pase y Estados en el Tablero de Cocina (`wf_cocina_02_pase_estados_kds.jpg`)
Tablero táctil de cocina industrial (`1440x900`) con lenguaje directo y cotidiano:
- **Poner en Fuego / En Marcha:** Botón gris `[ 🔥 Poner en Fuego ]` cuando el plato está en cola; al tocarlo, se asienta `fecha_inicio_coccion = NOW()` y muta a botón naranja `#EA580C` `[ 🔥 En Fuego (MM:SS) ]` con timer en segundos.
- **Listo en Pase:** Botón verde esmeralda `[ ✓ Listo en Pase ]` que transiciona el plato a terminado, descuenta insumos de bodega según receta (`CU-COCINA-03`) y alerta vía SSE a sala.
- **Mecanismo Anti-Error (Deshacer 30s):** Contador regresivo visible `[ ↺ Deshacer (24s) ]`. Al tocarlo, revierte la orden a preparación y ejecuta el **rollback atómico de insumos** hacia el inventario.
- **Despacho Completo:** Botón verde al pie del ticket `[ ✓ Despachar Pedido Completo ]` para liberar la orden cuando todos los platos están servidos.
- **Historial Accesible:** Botón ámbar en la cabecera `[ ⏱️ Pedidos Despachados (4) ]` informando cuántas órdenes han salido en los últimos 30 minutos.

### Vista 2: Bandeja de Pedidos Despachados y Recuperación ("Devolver a Cocina" - `wf_cocina_02_historial_despachados_recall.jpg`)
Modal superpuesto (`1120px` centrado) que previene extravíos de comandas:
- **Búfer de Seguridad de 30 Minutos:** Almacena sin eliminar las comandas despachadas recientemente.
- **Métricas del Turno:** Exhibe `Despachados Últimos 30 min: 6 Comandas`, `Tiempo Promedio Cocción: 11m 40s`, `Tiempo Promedio en Pase: 2m 15s`, `Total Turno Hoy: 42 Pedidos`.
- **Botón "Devolver a Cocina":** Al presionar `[ ↺ Devolver a Cocina (Recuperar Comanda) ]`, la orden regresa al instante al tablero activo del KDS en su posición FIFO cronológica exacta, permitiendo resolver confusiones o añadir guarniciones faltantes sin tener que reabrir mesas en sala.

### Vista 3: Preparación Masiva por Tandas en Consolidado All-Day (`wf_cocina_02_consolidado_accion_tandas.jpg`)
Pantalla de acumulación táctil por estación (`1440x900`):
- **Tandas en Fogones y Sartenes:** Tarjeta agrupada `Lomo Saltado Criollo (4x)` con botones `[ 🔥 Poner Todos en Fuego (4x) ]` y `[ ✓ 2x Listos en Pase ]`.
- **Despacho FIFO Automático:** Al marcar raciones parciales, el backend asigna las primeras porciones a las mesas más antiguas en espera.
- **Garantía Transaccional:** Cada porción despachada descuenta atómicamente sus ingredientes según la receta de `CU-ADMIN-04`.

### Vista 4: Notificación Reactiva en Salón — Plato Listo en Pase Caliente (`wf_cocina_02_notificacion_pase_salon.jpg`)
Pantalla de la tablet del Mozo (`CU-MOZO-01` Tablet Salón):
- **Banner Flotante Inmediato (< 25ms):** *"🔔 ¡PLATO LISTO EN PASE CALIENTE! • MESA 04: 2x Lomo Saltado Criollo (Pase Caliente #01)"*.
- **Cuenta Regresiva de Tolerancia:** Temporizador decreciente `⏱️ 02:40 restantes (Tolerancia Pase: 3 min)` sincronizado con `tiempo_maximo_pase_min` de `CU-ADMIN-18`.
- **Plano de Mesas Reactivo:** La tarjeta de la Mesa 04 en el plano de salón parpadea con borde verde y badge `[ 🔔 ¡LISTO EN PASE! ]`.
- **Cierre del Ciclo:** Botón `[ ✓ Recoger y Servir en Mesa ]` que conmuta el estado a `entregado`.

---

## 53. Arquitectura Transaccional y Descuento Automático de Insumos por Consumo (`CU-COCINA-03`)

1. **Naturaleza Transaccional del Sistema (Cero Fricción en Fogones):**
   - `CU-COCINA-03` opera como un proceso de backend automático que se dispara cuando el cocinero pulsa `[ ✓ Listo en Pase ]` en `CU-COCINA-02`.
   - La deducción se computa en milisegundos multiplicando las raciones de la comanda por `producto_insumo.cantidad_descuenta` en la unidad de almacén limpia del insumo (`kg`, `saco`, `bidon`, etc.).
2. **Política de Continuidad del Servicio (Prioridad Comensal):**
   - Si el stock registrado en el sistema es inferior al consumo teórico (ej. compra física aún no ingresada en el sistema), **el servicio en cocina jamás se detiene**. El plato sale al pase caliente normalmente.
   - La base de datos aplica `stock_actual = GREATEST(0, stock_actual - consumo)` respetando el constraint `CHECK (stock_actual >= 0)`.
   - La discrepancia se asienta en `auditoria_stock_ajuste` con motivo `'inconsistencia_cocina'`.
3. **Notificación Flotante Toast y Campana al Administrador (`wf_cocina_03_alerta_stock_toast.jpg`):**
   - El sistema emite en tiempo real el evento SSE `alerta_stock_insuficiente` hacia el Portal del Administrador.
   - En la esquina superior derecha se despliega un **Toast flotante** que detalla la comanda (#149), el plato (2x Lomo Saltado), el insumo afectado (Aceite Vegetal) y el faltante teórico (0.003 bidones), ofreciendo un botón directo `[ 📝 Registrar Compra / Ajuste ]` para regularización inmediata.
   - La campana `[ 🔔 ]` conserva la notificación activa para trazabilidad en auditoría.
4. **Cascada Automática a Carta Digital (`CU-COCINA-04`):**
   - Cuando un insumo llega a 0, conmuta automáticamente a `'agotado'` y propaga `producto.disponibilidad = 'agotado'` a todos los platos que lo requieren, impidiendo nuevas órdenes en mozos y menú digital QR.
5. **Rollback de Inventario ante Deshacer (Undo 30s):**
   - Si el cocinero presiona `[ ↺ Deshacer ]` dentro de la ventana de 30 segundos de `CU-COCINA-02`, el sistema ejecuta una transacción atómica que repone exactamente las cantidades a `insumo.stock_actual` y restablece el estado a `'activo'`, garantizando cero descuadres contables en bodega.

---

## 54. Gestión Táctil de Quiebres y Disponibilidad de Carta en Cocina (`CU-COCINA-04`)

### Vista 1: Modal Táctil de Disponibilidad de Platos (`wf_cocina_04_modal_disponibilidad_platos.jpg`)
Modal táctil superpuesto sobre el KDS de cocina (`1440x900`), diseñado para operar con guantes o dedos húmedos:
- **Acceso Directo en KDS:** Botón superior permanente `[ 🚫 GESTIÓN DE QUIEBRES / AGOTADOS (3) ]` con contador en vivo de platos fuera de servicio en la sede.
- **Pestañas por Partidas Culinarias:** Botones táctiles generosos (`Todas`, `🔥 Brasas & Carnes`, `🍳 Salteados & Wok [2 apagados]`, `🐟 Pescados & Mariscos [1 apagado]`, `🍟 Entradas & Guarniciones`).
- **Diferenciación de Origen de Quiebre:**
  - **Apagado Manual en Cocina:** Badge `[ ⚠️ Apagado Manual en Cocina (Hace 12 min por Marco V.) ]` con botón verde `[ ↺ REACTIVAR A DISPONIBLE (Llegó Insumo) ]`.
  - **Quiebre Automático por Stock Cero (`CU-COCINA-03`):** Badge `[ 🤖 Quiebre Automático por Stock: Insumo "Limón fresco" en 0 kg ]` con botón bloqueado `[ 🔒 Bloqueado por Stock Teórico ]` que exige registro de compras en almacén.
- **Sincronización Ultrarrápida (< 30ms):** El cambio de estado se propaga vía SSE a todas las tablets de mozo y a la carta pública en código QR de inmediato.

### Vista 2: Diálogo Táctil de Resolución de Órdenes en Fuego (`wf_cocina_04_dialogo_resolucion_ordenes_fuego.jpg`)
Diálogo táctil de decisión culinaria ante quiebre con pedidos activos en curso:
- **Separación Cero Fricción en Cola:** Las órdenes en cola (aún no iniciadas en fogones) se conmutan de forma 100% automática a `no_disponible`, ahorrando tiempo y esfuerzo cognitivo al chef.
- **Resolución Parcial de Fuego Activo (Caso Crítico $K < N$):** Resuelve el problema donde hay 5 porciones en fuego y la mise en place solo alcanza para 2 platos.
- **Selector Rápido Táctil FIFO:** Botones numéricos directos de 56px de alto `[ 0 ] [ 1 ] [ 2 ✓ Seleccionado ] [ 3 ] [ 4 ] [ 5 - Todas ]`. Al tocar `[ 2 ]`, el sistema preasigna las 2 porciones a las comandas más antiguas en espera.
- **Desglose y Ajuste Fino Comanda por Comanda:** Lista táctil ordenada por antigüedad que muestra:
  - `Mesa 04 (14 min espera)` $\rightarrow$ `[ ✓ SE PREPARA EN FUEGO (2 de 2) ]` (Mise en place reservada).
  - `Mesa 07 (9 min espera)` $\rightarrow$ `[ 🚫 NO ALCANZA - AVISAR MOZO ]` (Alerta sonora reactiva a tablet de Carlos D. en `CU-MOZO-07`).
  - `Mesa 01 (6 min espera)` $\rightarrow$ `[ 🚫 NO ALCANZA - AVISAR MOZO ]` (Alerta reactiva a tablet de Rosa P. en `CU-MOZO-07`).
- **Trazabilidad y Alerta a Compras:** Selector de motivo y notificación Toast SSE instantánea al Administrador de sede para reposición urgente de insumos.

---

## 55. Consolidación del Módulo Cocina (KDS) y Enlace con Caja

Con la culminación de `CU-COCINA-01`, `CU-COCINA-02`, `CU-COCINA-03`, `CU-COCINA-04` y la alerta reactiva de parada de fogones (`CU-COCINA-05` integrado en la Vista 3 de `CU-COCINA-01`), el ciclo operativo de cocina queda 100% cubierto:
1. **Recepción:** Tablero KDS con 4 columnas FIFO y semáforo dinámico de sede (`CU-ADMIN-18`).
2. **Preparación y Pase:** Poner en fuego, listo en pase, temporizador anti-error Deshacer (30s) con rollback de inventario, y recuperación de despachados (30 min).
3. **Consumo Culinario:** Deducción atómica por receta, política de continuidad sin bloqueo de cocina y cascada a carta.
4. **Quiebres y Pausas:** Gestión táctil de disponibilidad con resolución parcial de fuego (FIFO) y conexión con `CU-MOZO-07`.
5. **Parada de Emergencia:** Alerta reactiva sonora ante anulaciones en sala (`CU-COCINA-05`).

---

## 56. Vistas Estructurales y Parametrización Financiera de Cobros (`CU-ADMIN-19`)

Para blindar la consistencia financiera antes de abrir el turno de caja, se implementó la pantalla de parametrización de cobros para el Administrador del Local (`CU-ADMIN-19`), estableciendo las reglas de juego que gobernarán el Punto de Venta del Cajero (`CU-CAJA-02` y `CU-CAJA-03`):

### Vista 1: Panel Principal de Configuración y Simulador Reactivo 50/50 (`wf_admin_19_panel_configuracion.jpg`)
Pantalla de escritorio (`1440x900`):
- **Barra de Métricas Financieras Superiores:** Exhibe *Formas de Pago Habilitadas (3/3 Activas)*, *Métodos con Comisión (1: Tarjeta POS al 3.5%)*, *Ventas con Tarjeta del Mes (S/ 24,850.00)* y *Recargos Trasladados (S/ 869.75)* para compensar costos de pasarela bancaria.
- **Columna Izquierda (50%): Catálogo de Formas de Pago:**
  - **Efectivo:** Activo por ley, con recargo fijo inmutable en `0.00%`.
  - **Tarjeta POS:** Conmutador de activación, selector con steppers para calibrar la comisión porcentual (`comision_porcentaje`, ej. `3.50%`) y texto legal visible en el comprobante.
  - **Billetera Digital (Yape / Plin):** Conmutador de activación, comisión (default `0.00%`), datos del receptor (`987 654 321` - `Restaurant S.A.C.`) y acceso al modal de edición de QR.
  - **Transferencia Bancaria:** Método opcional pausado por defecto.
- **Columna Derecha (50%): Simulador de Cobro y Precuenta en Vivo:**
  - Input interactivo para ingresar cualquier monto de consumo de prueba (default `S/ 100.00`).
  - Lista de radio-botones que simula la botonera del cajero en salón, calculando al vuelo:
    - *Efectivo:* S/ 100.00 (Recargo: S/ 0.00) $\rightarrow$ Total: S/ 100.00.
    - *Tarjeta POS (3.5%):* S/ 100.00 (Recargo: S/ 3.50) $\rightarrow$ Total: S/ 103.50.
    - *Yape / Plin (0%):* S/ 100.00 (Recargo: S/ 0.00) $\rightarrow$ Total: S/ 100.00.
  - Previsualizador térmico de la **Precuenta Informativa** con desglose de ítems, base imponible, IGV 18%, recargo por tarjeta y total neto a pagar.

### Vista 2: Modal de Configuración Detallada de Billetera Digital (`wf_admin_19_modal_detalle_metodo.jpg`)
Diálogo interactivo de 680px:
- Switch maestro de habilitación para el Punto de Venta (POS) y carta digital QR.
- Formulario de número celular receptor (9 dígitos validados Perú) y razón social del titular.
- Componente de previsualización y reemplazo de imagen del código QR interoperable (`Yape / Plin`).
- Instrucción operativa visible para el cajero (*"Verificar código de operación de 6 dígitos antes de emitir boleta"*).

### Vista 3: Bloqueo de Regla de Negocio (Mínimo 1 Medio de Pago Activo) (`wf_admin_19_bloqueo_desactivacion.jpg`)
Modal de contención de seguridad (540px):
- Si el administrador intenta desactivar el último método de pago habilitado (ej. Efectivo cuando los demás están pausados), el sistema intercepta la acción con `409 Conflict (ERR_MINIMO_UN_PAGO)`.
- Explica que una sede activa no puede operar sin al menos una vía de liquidación para evitar la paralización del salón.

### Vista 4: Onboarding de Sede Nueva con Métodos Pre-Aprovisionados (`wf_admin_19_onboarding_inicial.jpg`)
Pantalla de bienvenida para nuevos locales:
- Pre-aprovisiona automáticamente los 3 métodos canónicos (`Efectivo`, `Tarjeta POS`, `Billetera Digital Yape/Plin`) con `0.00%` de comisión por defecto.
- Permite iniciar operaciones en salón con un solo clic o personalizar comisiones.

---

## 57. Reglas de Negocio, Integridad Financiera y Simulador Reactivo (`CU-ADMIN-19`)

1. **Tabla Dedicada `metodo_pago_local`:** Almacena la configuración de pagos por local con RLS (`local_id`), unicidad `(local_id, codigo)`, constraints de rango de comisiones (`0% <= comision <= 50%`) y metadata en `jsonb`.
2. **Sincronización Reactiva SSE en < 30ms:** Al presionar `[ ✓ Guardar Parámetros de Pago ]`, el backend emite el evento `metodos_pago_actualizados`. Las terminales de Punto de Venta del Cajero (`CU-CAJA-02` y `CU-CAJA-03`) actualizan de inmediato sus botones de cobro y recargos sin requerir recargar la sesión.
3. **Regla de Integridad de Servicio:** Garantía estricta de al menos 1 método activo en todo momento. Prohibido el `DELETE` físico de métodos de pago.
4. **Desglose Transparente en Comprobantes:** Los recargos se registran formalmente en la tabla `comprobante` en las columnas `subtotal_consumo`, `porcentaje_recargo` y `monto_recargo`, asegurando que el arqueo de caja (`CU-CAJA-05`) y los reportes de ventas distingan con precisión el consumo neto de la comisión de pasarela.

---

## 58. Vistas Estructurales de CU-CAJA-01: Apertura de Turno de Caja

Para dar inicio a las operaciones comerciales del salón y garantizar la cuadratura contable de ingresos, se diseñó e implementó la compuerta operativa de **Apertura de Turno de Caja (`CU-CAJA-01`)** bajo la modalidad directa de fondo de sencillo:

### Vista 1: Modal Central de Apertura de Turno (POS Bloqueado) (`wf_caja_01_modal_apertura.jpg`)
Terminal de escritorio / táctil (`1440x900`):
- **Capa Modal de Contención:** Fondo oscurecido (`background: rgba(15, 23, 42, 0.72)`) que bloquea las mesas y cobros del salón hasta registrar formalmente el fondo inicial de la gaveta.
- **Ficha de Identidad del Cajero:** Correlativo de turno proyectado (`Turno #042`), avatar del cajero responsable (`Carlos Mendoza`), fecha y hora de inicio de jornada.
- **Input Directo de Monto Inicial:** Permite tipeo numérico directo en Soles (`PEN S/ 300.00`) con chips de incremento rápido táctil (`+ S/ 50`, `+ S/ 100`, `+ S/ 200`, `Borrar`).
- **Microcopia de Seguridad Poka-Yoke:** Clarificación explícita de la política de terminal unificada por sede.

### Vista 2: Bloqueo de Pantalla por Turno Previo Pendiente (`wf_caja_01_bloqueo_turno_previo.jpg`)
Alerta modal de contención de integridad (`409 Conflict: ERR_TURNO_PREVIO_NO_CERRADO`):
- Se activa cuando un cajero nuevo intenta abrir caja mientras el turno del cajero saliente sigue activo sin arqueo formal (`CU-CAJA-05`).
- Exhibe ficha de auditoría: Cajero saliente (`Juan Pérez`), hora de apertura (`08:30 AM`), fondo registrado (`S/ 250.00`) y volumen transaccional en salón (`24 Ventas / S/ 2,480.00`).
- Opciones de resolución clara: Relevo presencial con el cajero saliente o cierre forzado supervisado por el Administrador de sede (`CU-ADMIN-15`).

### Vista 3: Monitor POS Desbloqueado y Operativo en Salón (`wf_caja_01_pos_desbloqueado.jpg`)
Punto de Venta activo y sincronizado:
- **Cabecera Persistente:** Muestra badge verde de turno activo (`Turno #042 Abierto • Fondo: S/ 300.00 • 12:05 PM`), cajero autenticado y botón directo de `[ 🔒 Cerrar Turno (Arqueo Z) ]`.
- **Métricas Operativas del Salón:** Cuentas pendientes de cobro (2 mesas), monto acumulado por cobrar en sala (`S/ 245.00`), efectivo disponible en caja (`S/ 300.00`) y ocupación de mesas (`10 / 16 Mesas - 62.5%`).
- **Grilla de Mesas con Estados en Tiempo Real:** Priorización visual de mesas con cuenta solicitada por el mozo (`Mesa 04`, `Mesa 08` con badge azul marino `CUENTA PEDIDA`) listas para emitir precuenta (`CU-CAJA-02`) o cobrar (`CU-CAJA-03`).

---

## 59. Reglas de Negocio, Política de Terminal Única y Manejo de Efectivo (`CU-CAJA-01`)

1. **Política de Caja Única por Sede (Single Terminal Policy):**
   - Para maximizar la agilidad de desarrollo y simplificar la gestión contable del restaurante, cada sucursal opera bajo un esquema unificado de 1 terminal de caja.
   - En la base de datos PostgreSQL 16 se asegura mediante el índice parcial único:
     ```sql
     CREATE UNIQUE INDEX uq_caja_abierta_local ON caja(local_id) WHERE estado = 'abierta';
     ```
     Cualquier intento concurrente de aperturar otra caja es rechazado atómicamente por la base de datos con código `409 Conflict`.
2. **Registro Directo y Eficiente de Efectivo:**
   - Para maximizar la agilidad de inicio de jornada y simplificar la operativa diaria, el fondo inicial se registra como un monto monetario directo en Soles (`monto_apertura decimal(10,2)`), eliminando la complejidad y potenciales discrepancias del desglose manual de denominaciones.
3. **Flexibilidad Horaria y Operación Guiada por Eventos (Event-Driven Shifts):**
   - El sistema no impone bloqueos temporales arbitrarios ni castigos punitivos si el cajero extiende su permanencia en el local (+30 min o más post-turno) atendiendo el flujo de salón. La caja permanece operativa hasta el arqueo explícito.
4. **Sincronización Reactiva SSE en < 20ms:**
   - La confirmación de apertura emite el evento `caja_abierta` al hub local, notificando al instante a las vistas del administrador y habilitando los flujos de cobro en salón.

---

## 60. Vistas Estructurales de CU-CAJA-02: Generar Cuenta a partir de Pedidos de una Mesa (Precuenta Digital)

Para consolidar los pedidos de los comensales, aplicar promociones comerciales y generar la liquidación previa al cobro sin intermediación de papel físico ni periféricos térmicos, se diseñó e implementó la especificación canónica de **Generar Cuenta / Precuenta Digital (`CU-CAJA-02`)**:

### Vista 1: Panel Principal de Precuenta en POS Monitor (`wf_caja_02_panel_pos.jpg`)
Terminal de escritorio táctil (`1440x900` Grayscale Blueprint):
- **Selector de Salón Integrado:** Panel lateral izquierdo con planos de mesas y filtros rápidos (`Todas`, `💳 Cta Pedida`, `Ocupadas`, `Libres`). Identifica visualmente mesas individuales y mesas unificadas (`Mesa [ 02 ; 03 ]`).
- **Banner Informativo de Cocina (No Bloqueante):** Notificación ámbar de advertencia de cocción (`⚠️ Aviso Informativo: 1 plato 'Lomo Saltado' en preparación en cocina. No bloquea la emisión ni el cobro de la cuenta`). Resuelve la operatividad en restaurantes con cobro anticipado.
- **Consolidado de Comanda en Alta Densidad:** Lista detallada de platos pedidos con especificación de notas de preparación, cantidades acumuladas y subtotales (Consumo Bruto: `S/ 100.00`).
- **Selector de Promociones Vigentes (`CU-ADMIN-17`):** Menú interactivo que valida en tiempo real la vigencia, horarios y mínimos de compra.
- **Desglose Tributario Oficial SUNAT:** Muestra Consumo Bruto (`S/ 100.00`), Descuento (`S/ 0.00`), Total Neto (`S/ 100.00`), Base Imponible gravada (`S/ 84.75`) e IGV 18% incluido (`S/ 15.25`).
- **Proyección de Medios de Pago (`CU-ADMIN-19`):** Tarjetas dinámicas que muestran el importe final a abonar según el método seleccionado (Efectivo `S/ 100.00`, Yape/Plin `S/ 100.00`, Tarjeta POS con +3.5% `S/ 103.50`).

### Vista 2: Precuenta con Promoción Comercial Aplicada (`wf_caja_02_promocion_aplicada.jpg`)
Recálculo tributario y financiero reactivo en tiempo real (< 10ms):
- **Chip de Promoción Activa con Deshacer en 1 Clic:** Despliega el badge de campaña (*"Descuento Almuerzo Ejecutivo (15% dscto) - Ahorro: S/ 15.00"*) con botón `[ ✕ Quitar Dscto ]` para revertir la deducción si el cliente no cumple los términos.
- **Liquidación SUNAT Recalculada:**
  - Consumo Bruto: `S/ 100.00`
  - Descuento Comercial (15%): `- S/ 15.00`
  - Total Neto a Pagar: `S/ 85.00`
  - Base Imponible: `S/ 72.03` ($85.00 / 1.18$)
  - IGV 18%: `S/ 12.97` ($85.00 - 72.03$)
- **Ajuste Proyectado de Pasarelas:** La tarjeta de Tarjeta POS actualiza en vivo el cálculo del recargo del 3.5% sobre la nueva base neta (`S/ 87.98`), manteniendo total transparencia tarifaria frente al comensal.
- **Enrutamiento Operativo Directo:** En lugar de rebotar la precuenta al mozo, el monitor POS ofrece enrutamiento de acción inmediata hacia `[ ⚡ Cobrar Comanda o Subcuentas (CU-CAJA-03) ]` para pasar a la liquidación con emisión fiscal (comanda completa o subcuentas divididas en salón).

---

## 61. Reglas de Negocio, Cálculo Tributario SUNAT Perú e Independencia de Cocina (`CU-CAJA-02`)

1. **Flujo Desacoplado y 100% Digital (Cero Papel):**
   - El sistema prescinde por completo del uso de tickets térmicos impresos para la precuenta y opera de forma paralela y desacoplada entre Mozo y Cajero. El cajero en el POS no 'envía la precuenta de vuelta al mozo'; cuenta con acceso inmediato a los consumos para aplicar promociones y enrutar en 1 clic a `CU-CAJA-03`. En paralelo, el mozo puede consultar o dividir la cuenta en mesa con total autonomía (`CU-MOZO-08` / `CU-MOZO-09`).
2. **Fórmula Tributaria Oficial SUNAT Perú:**
   - La deducción comercial se aplica estrictamente al Consumo Bruto antes de la segregación fiscal:
     $$T_{neto} = C_{bruto} - D$$
     $$\text{Base Imponible} = \frac{T_{neto}}{1.18}$$
     $$\text{IGV (18\%)} = T_{neto} - \text{Base Imponible}$$
   - Esto impide que el establecimiento tribute impuestos sobre importes descontados comercialmente.
3. **Independencia Operativa Respecto a Cocina:**
   - El estado de cocción en KDS (`en_cola`, `en_preparacion`) no bloquea la precuenta ni el cobro. Un banner informativo previene errores de servicio pero permite total flexibilidad para modelos de negocio gastronómicos con cobro en mostrador o anticipado.
4. **Proyección Comparativa de Medios de Pago (`CU-ADMIN-19`):**
   - La pantalla proyecta de forma transparente el recargo porcentual de pasarelas bancarias, asegurando que tanto el personal como el cliente conozcan con exactitud el total liquidable antes de emitir el comprobante formal (`CU-CAJA-03`).

---

## 62. Vistas Estructurales de CU-MOZO-08: Consultar y Presentar Precuenta Digital en Mesa

Para dotar al personal de salón de completa autonomía operativa, eliminar cuellos de botella con caja y ofrecer atención inmediata al cliente sin esperas ni rollos térmicos de papel, se diseñó e implementó la especificación canónica de **`CU-MOZO-08: Consultar y Presentar Precuenta Digital en Mesa`**:

### Vista 1: Modal Táctil de Precuenta con Promociones Integradas (`wf_mozo_08_modal_precuenta.jpg`)
Modal táctil responsive centrado (640px de ancho) superpuesto sobre el plano de salón atenuado de `CU-MOZO-01`:
- **Cabecera Contextual:** Mesa 04, 4 comensales, comanda #108, tiempo de permanencia (32 min) y mozo titular (`Marco Valdivia`).
- **Banner Conciso de Cocina:** Alerta ámbar directa: `⚠️ 1 plato 'Lomo Saltado' en 'preparación'` (no bloqueante para la cuenta).
- **Consolidado de Comanda en Salón:** Tabla compacta de platos pedidos con especificación de notas de cliente, cantidades y subtotales (Consumo Bruto: `S/ 100.00`).
- **Sección de Promociones Integrada (`CU-ADMIN-17`):** Chip de campaña comercial activa (*"Descuento Almuerzo Ejecutivo (15% dscto) - Ahorro: - S/ 15.00"*) con acción de alternar o desmarcar en 1 toque.
- **Desglose Fiscal SUNAT:** Consumo Bruto (`S/ 100.00`), Descuento Comercial (`- S/ 15.00`), Total Neto a Cobrar (`S/ 85.00`), Base Imponible gravada (`S/ 72.03`) e IGV 18% incluido (`S/ 12.97`).
- **Selector Limpio de Métodos de Pago (`CU-ADMIN-19`):** Tarjetas táctiles directas: Efectivo (`S/ 85.00`), Billetera Digital Yape/Plin (`S/ 85.00` con invitación táctil `▶ Tocar para ver QR`), y Tarjeta POS (`S/ 87.98` con +3.5% pasarela trasladada).
- **Acciones:** `[ Volver al Salón ]` y botón primario `[ ⚡ Notificar a Caja para Cobro ]`.

### Vista 2: Despliegue de Información y QR de Billetera Digital (`wf_mozo_08_detalle_billetera_qr.jpg`)
Divulgación progresiva bajo demanda al seleccionar Billetera Digital (Yape / Plin):
- **Importe Destacado en Alto Contraste:** Muestra `Total a Transferir: S/ 85.00` con badge `0% Recargo de comisión`.
- **Código QR Dinámico en Mesa:** Recuadro central con código QR vectorial de alta definición para escaneo directo del comensal desde su propio celular a más de 40 cm.
- **Datos Comerciales de Transferencia:** Número del local (`987 654 321` con botón `[ Copiar ]`), titular (`Restaurant S.A.C.`) y RUC (`20601234567`).
- **Verificación Asistida en Mesa:** Campo numérico para capturar el voucher del cliente (`Op: 581902`) y checkbox de certificación visual por el mozo.
- **Acciones:** `[ ‹ Cambiar Método ]` y botón primario `[ ⚡ Confirmar y Notificar a Caja ]`.

### Vista 3: Salón en Vivo con Mesa Notificada a Caja (`wf_mozo_08_mesa_notificada_salon.jpg`)
Sincronización reactiva del plano de salón tras la confirmación:
- **Toast Superior Accesible:** `✓ Precuenta de Mesa 04 (S/ 85.00) enviada a Caja vía SSE. Esperando confirmación de cajero.`
- **Tarjeta de Mesa Resaltada:** Mesa 04 con contorno destacado, badge ámbar `[ ESPERANDO CAJERO ]`, monto liquidado (`S/ 85.00`) y detalle del método declarado (`Yape • Op #581902`).
- **Quick-Drawer Informativo:** Permite al mozo consultar el estado, volver a abrir la precuenta digital (`[ 👁️ Reabrir Precuenta Digital ]`) o incorporar pedidos de última hora si los comensales lo solicitan.

---

## 63. Reglas de Negocio, Divulgación Progresiva y Autonomía de Salón (`CU-MOZO-08`)

1. **Autonomía Operativa del Mozo (Cero Cuello de Botella):**
   - El mozo no depende de que el cajero esté en el mostrador para consultar la precuenta o presentarla en mesa. El cálculo es determinista on-demand en el backend Go (< 15ms).
2. **Divulgación Progresiva (Progressive Disclosure):**
   - La pantalla inicial de precuenta se mantiene limpia y legible sin saturar al cliente con un QR gigante a menos que exprese su deseo de pagar mediante billetera digital.
3. **Microcopia Sintética de Cocina:**
   - Estandarización de alertas operativas con la fórmula concisa: `⚠️ {num} plato '{nombre}' en '{estado}'`.
4. **Delimitación Precisa de Responsabilidades:**
   - **Mozo:** Presenta la precuenta digital, aplica promociones y atiende el pago en mesa mediante QR.
   - **Cajero:** Valida el ingreso de fondos (voucher/efectivo) y emite formalmente el comprobante electrónico fiscal con valor tributario (Boleta/Factura) en `CU-CAJA-03`.

---

## 64. Vistas Estructurales de CU-MOZO-09: Subdividir Comanda en Mesa y Asociar Comprobantes

Para resolver de manera definitiva las esperas y aglomeraciones en caja cuando un grupo de comensales desea pagar por separado con comprobantes y métodos diferenciados, se diseñó e implementó la especificación canónica de **`CU-MOZO-09: Subdividir Comanda en Mesa y Asociar Comprobantes (Factura, Boleta, Nota de Venta)`**:

### Vista 1: Asignación Determinista de Ítems a Subcuentas (`wf_mozo_09_asignacion_items.jpg`)
Modal táctil responsive centrado (1100px de ancho) con dos columnas principales sobre fondo atenuado de salón (`CU-MOZO-01`):
- **Cabecera Contextual:** Mesa 04, 4 comensales, comanda #108, Consumo Bruto Total: `S/ 100.00`.
- **Barra de Progreso y Cero Azar:** Indicador en tiempo real: `[✓ 100% ASIGNADO] 4 de 4 platos distribuidos • Total asignado: S/ 100.00 de S/ 100.00 (Pendiente: S/ 0.00)`. Salvaguarda que prohíbe repartos aleatorios o ítems huérfanos.
- **Columna Izquierda (Bandeja de Ítems de la Comanda - 480px):**
  - Lista de platos con checkboxes de selección y botón `[ ✂ Desglosar Unidades ]` para platos con cantidad $>1$.
  - Items asignados: Lomo Saltado (S/ 38.00) -> Subcuenta 1; Arroz con Mariscos (S/ 34.00), Chicha Jarra 1L (S/ 16.00) y Causa Limeña (S/ 12.00) -> Subcuenta 2.
  - Dock de transferencia táctil ergonómica: `[ Asignar a Subcuenta 1 > ]` y `[ Asignar a Subcuenta 2 > ]`.
- **Columna Derecha (Subcuentas Creadas en Mesa - 580px):**
  - Tarjetas dinámicas `SUB-01` (S/ 38.00) y `SUB-02` (S/ 62.00) con botón de reversión individual `[ ↶ Devolver ]` y acción `[ ＋ Añadir Subcuenta 3 ]`.
- **Acciones:** `[ ✕ Cancelar y Volver a Precuenta ]` y botón primario activo `[ Continuar a Comprobantes y Promociones (Paso 2) ▶ ]`.

### Vista 2: Configuración de Comprobantes, Promociones y Métodos de Pago por Subcuenta (`wf_mozo_09_configuracion_comprobantes.jpg`)
Formulario adaptativo en dos columnas con configuración independiente para cada subcuenta:
- **Subcuenta 1 (Comensal A — 1 plato, Bruto S/ 38.00):**
  - **Promoción Comercial Independiente (`CU-ADMIN-17`):** Selector activo con *"Descuento Almuerzo Ejecutivo (15% dscto)"* -> Descuento aplicado: `- S/ 5.70`.
  - **Tipo de Comprobante:** Factura Electrónica. Campo RUC (`20601234567`) con botón de consulta SUNAT que autocompleta la Razón Social (*INVERSIONES GASTRONÓMICAS S.A.C.*) y Dirección Fiscal (*AV. LARCO 1045, MIRAFLORES, LIMA*).
  - **Medio de Pago:** Tarjeta POS (+3.5% pasarela trasladada = S/ 33.43).
  - **Desglose Fiscal SUNAT:** Consumo Bruto (S/ 38.00), Descuento Comercial (- S/ 5.70), Subtotal Neto (S/ 32.30), Recargo (+ S/ 1.13), Total a Pagar (**S/ 33.43**), Base Imponible (S/ 27.37) e IGV 18% (S/ 4.93).
- **Subcuenta 2 (Comensal B — 3 platos, Bruto S/ 62.00):**
  - **Promoción Comercial:** Sin promoción comercial aplicada (Tarifa regular de carta).
  - **Tipo de Comprobante:** Boleta Electrónica. Campo DNI (`72819201`) con consulta RENIEC que autocompleta *CARLOS MENDOZA QUISPE*, con checkbox opcional para ventas menores a S/ 700.00.
  - **Medio de Pago:** Billetera Digital (Yape / Plin S/ 62.00).
  - **Desglose Fiscal SUNAT:** Consumo Bruto (S/ 62.00), Descuento (S/ 0.00), Total a Pagar (**S/ 62.00**), Base Imponible (S/ 52.54) e IGV 18% (S/ 9.46).
- **Callout Oficial para Nota de Venta:** Explicación visual que aclara que si un cliente solicita *Nota de Venta*, el sistema solo solicita el *Nombre del Cliente* (ej. "Andrés Pérez"), sin requerir DNI/RUC ni validación tributaria, sirviendo como comprobante de control interno de impresión opcional.
- **Acciones:** `[ ◀ Volver a Platos ]` y botón primario de despacho `[ 📤 Confirmar y Enviar Subcuentas a Caja (cuenta_pedida) ]`.

### Vista 3: Salón en Vivo con Mesa Subdividida Notificada a Caja (`wf_mozo_09_mesa_notificada_salon.jpg`)
Sincronización reactiva del plano de salón tras la confirmación de las subcuentas:
- **Toast Superior Accesible:** `✓ Subdivisión de Mesa 04 (2 subcuentas) enviada a Caja vía SSE. Subcuenta 1 (S/ 33.43 Factura) y Subcuenta 2 (S/ 62.00 Boleta). Esperando cobro del cajero.`
- **Tarjeta de Mesa Resaltada:** Mesa 04 con contorno destacado, badge oscuro `[ DIVIDIDA (2) ]`, desglose resumido (`Sub-1: S/ 33.43 • Sub-2: S/ 62.00`), total neto consolidado (`S/ 95.43`) y estado `[ Espera POS Caja ]`.
- **Quick-Drawer Informativo:** Visualiza las tarjetas de Subcuenta 1 y Subcuenta 2 indicando su estado `⏳ Esperando cobro en POS de Caja` y `⏳ Esperando validación en POS de Caja`, con acciones para ver detalle o reabrir la comanda.

---

## 65. Reglas de Negocio y Arquitectura del Motor de Subdivisión (`CU-MOZO-09` y `CU-CAJA-03`)

1. **Arquitectura Compartida de Subdivisión (Split Bill Engine):**
   - El motor lógico de división de ítems y cálculo tributario es un componente estructurado por el Mozo en salón (`CU-MOZO-09`) y liquidado de forma atómica por subcuenta en el Punto de Venta de Caja (`CU-CAJA-03`).
2. **Promociones Comerciales Independientes por Subcuenta (`CU-ADMIN-17`):**
   - Cada comensal decide si aplica o no una promoción comercial. El motor recalcula la Base Imponible y el IGV del 18% de forma aislada para cada subcuenta, garantizando la integridad de cada comprobante electrónico emitido.
3. **Soporte Riguroso de los Tres Comprobantes Oficiales:**
   - **Factura:** RUC de 11 dígitos validado contra SUNAT + Razón Social + Dirección Fiscal.
   - **Boleta:** DNI de 8 dígitos validado contra RENIEC + Nombres y Apellidos (o Consumidor Final si $< S/ 700.00$).
   - **Nota de Venta:** Comprobante interno simplificado. Requiere únicamente *Nombre del Cliente*, sin validación fiscal ni reporte a SUNAT, con impresión opcional.
4. **Delimitación Inviolable de Responsabilidades por Rol:**
   - **Mozo (`CU-MOZO-09`):** Estructura platos, captura datos de comprobantes y predetermina formas de pago. Su proceso culmina en estado **`cuenta_pedida`**.
   - **Cajero (`CU-CAJA-03`):** Valida los pagos reales (POS, efectivo, Yape) y emite formalmente las Boletas/Facturas electrónicas ante SUNAT, transicionando la comanda a **`cobrado`** y liberando la mesa a **`libre`**.

---

## 66. Vistas Estructurales de CU-CAJA-03: Cobro de Comanda y Emisión de Comprobantes Oficiales (Factura, Boleta y Nota de Venta)

Para cerrar el ciclo transaccional con valor fiscal, liquidar ingresos y liberar el salón de forma 100% digital sin intermediación de papel térmico, se diseñó e implementó la especificación canónica de **`CU-CAJA-03: Cobro de Comanda y Emisión de Comprobantes Oficiales`**:

### Vista 1: Modal Principal de Cobro POS (`wf_caja_03_modal_cobro.jpg`)
Workspace modal responsive de alta densidad (1140px de ancho) sobre fondo POS oscurecido:
- **Cabecera Contextual:** Identifica Mesa 04 (4 comensales, comanda #108, mozo Marco Valdivia, promoción Almuerzo Ejecutivo 15%) y total neto a cobrar (`S/ 85.00 NETO`).
- **Columna Izquierda (50% - Tipo de Comprobante e Identidad):**
  - Selector de 3 comprobantes: Factura (RUC 11 dígitos), Boleta (DNI 8 dígitos) y Nota de Venta (solo Nombre).
  - Consulta y persistencia con ApiPerú: Autocompleta `CARLOS MENDOZA QUISPE` y precarga teléfono/WhatsApp (`987 654 321`) y email (`carlos.mendoza@gmail.com`).
  - Badge informativo: `[ • Cliente registrado en base de datos local (UUID v8) • 12 visitas anteriores ]`.
- **Columna Derecha (50% - Liquidación y Manejo de Efectivo):**
  - Selector de métodos: Efectivo (0%), Tarjeta POS (+3.5%) y Billetera Yape/Plin (0%).
  - Manejo de Efectivo con Digitación Directa: Campo numérico amplio con ingreso de `S/ 100.00` y tarjeta destacada de `VUELTO A ENTREGAR: S/ 15.00`.
  - Desglose SUNAT: Consumo Bruto `S/ 100.00`, Descuento `- S/ 15.00`, Base Imponible `S/ 72.03` e IGV `S/ 12.97`.
  - Acción Primaria: `[ ⚡ Confirmar Cobro y Emitir Comprobante (F9) ]`.

### Vista 2: Diálogo de Comprobante Emitido y Token Digital QR (`wf_caja_03_comprobante_qr_exito.jpg`)
Modal de confirmación transaccional (780px de ancho):
- **Encabezado Verde de Éxito:** `✓ Cobro Confirmado con Éxito • Mesa 04 LIBERADA`.
- **Ficha Fiscal Emitida:** `Boleta de Venta Electrónica B001-0012894`, total `S/ 85.00`, medio Efectivo (Recibido `S/ 100.00` - Vuelto `S/ 15.00`).
- **Token Digital QR Central (Cero Papel):** Gran código QR SVG de alta resolución con URL pública `https://app.restaurantcloud.pe/c/0192d2f4...` (UUID v8) para escaneo directo por la cámara del comensal.
- **Entrega Digital Asistida (Confirmar / Modificar):**
  - Fila WhatsApp: `+51 987 654 321 [ Guardado ]` con `[ ✓ Confirmar y Enviar ]` y `[ ✏️ Modificar ]`.
  - Fila Correo: `carlos.mendoza@gmail.com [ Guardado ]` con `[ ✓ Confirmar y Enviar ]` y `[ ✏️ Modificar ]`.
- **Acciones Secundarias:** `[ 📄 Ver Comprobante PDF en Nueva Pestaña ]` y botón `[ 🖨️ Imprimir Ticket Térmico ]` en estado **`DESHABILITADO • CERO PAPEL`**.
- **Acción Primaria:** `[ ✓ Finalizar y Volver al Salón (Esc) ]`.

### Vista 3: Monitor POS en Vivo con Mesa Liberada (`wf_caja_03_pos_mesa_liberada.jpg`)
Pantalla de escritorio del POS tras el cobro y liberación:
- **Toast Superior Reactivo SSE (18ms):** `✓ Cobro Exitoso: Comanda #108 liquidada con Boleta Electrónica B001-0012894 (S/ 85.00). Mesa 04 liberada para nuevos comensales • Ingreso registrado en arqueo de caja.`
- **Métricas de Turno Actualizadas:** Efectivo en Gaveta incrementado a `S/ 385.00` (+S/ 85.00), cuentas por cobrar reducidas a `1 Mesa (S/ 145.00)`.
- **Grilla de Salón:** Mesa 04 conmutada al estado verde claro `[ ✓ LIBRE ]` (0 comensales, disponible para asignación).
- **Drawer de Caja en Espera:** Exhibe la siguiente cuenta pendiente (`Mesa 08` con botón `[ ⚡ Cobrar en POS ]`).

---

## 67. Reglas de Negocio, Integridad ACID de Correlativos y Directorio de Clientes (`CU-CAJA-03`)

1. **Garantía Transaccional ACID y Control de Correlativos (`comprobante_serie`):**
   - Para cumplir rigurosamente con SUNAT y evitar saltos o duplicidades en concurrencia, la función `fn_obtener_siguiente_correlativo` bloquea a nivel de fila (`FOR UPDATE`) la serie respectiva en la base de datos PostgreSQL 16, serializando los incrementos en `correlativo_actual`.
2. **Directorio de Clientes Esencial con `detalle JSONB` (`cliente`):**
   - El almacenamiento de comensales y empresas se simplifica en la tabla `cliente` con clave única `(empresa_id, tipo_documento, numero_documento)` y `nombre_identificativo`. Los atributos secundarios de ApiPerú (dirección, ubigeo, estado, condición) se resguardan en `detalle JSONB`, sin columnas de agregación prematura.
3. **Manejo de Efectivo con Poka-Yoke y Digitación Directa:**
   - Se prescinde de selectores de billetes; el cajero ingresa la cantidad exacta y el sistema calcula dinámicamente el vuelto, bloqueando la confirmación si `monto_recibido < total`.
4. **Entrega Digital Asistida con Confirmación Previa:**
   - El sistema exhibe los datos de contacto guardados (WhatsApp/Email) permitiendo confirmarlos o modificarlos antes del despacho telemático, actualizando de inmediato la ficha del cliente.
5. **Estandarización Transversal a UUID v8 (RFC 9562):**
   - Todos los identificadores operan bajo UUID v8 time-ordered, optimizando los árboles B-tree y acelerando consultas e inserciones en PostgreSQL.
6. **Política Cero Papel:**
   - La entrega del comprobante es primordialmente telemática mediante código QR dinámico. El módulo de impresión térmica física se mantiene visible pero temporalmente inactivo.

---

## 68. Vistas Wireframe: `CU-CAJA-04: Anular comprobante / pedido ya cobrado y emisión de Nota de Crédito Electrónica`

Se diseñaron y renderizaron 3 vistas en alta resolución (1440x900, JPG calidad 95) ubicadas en `wireframe/cajero/CU-CAJA-04-anular-comprobante/assets/`:

### Vista 1: Historial de Comprobantes Emitidos en Turno (`wf_caja_04_historial_comprobantes.jpg`)
Workspace de auditoría de ventas del turno (Turno #042):
- **Barra Superior de Auditoría:** Métricas clave del turno: 14 Vigentes / 1 Anulado (15 Total), S/ 1,485.00 Total Facturado y S/ 385.00 Efectivo en Gaveta.
- **Filtros Segmentados de Dos Niveles:**
  - Nivel 1 (Estado): `[ ● Vigentes / Emitidos (14) ]` (activo por defecto), `[ 🚫 Anulados (1) ]` y `[ Todos (15) ]`. Permite al cajero separar de inmediato los comprobantes susceptibles de anulación de los ya rectificados.
  - Nivel 2 (Tipo de Documento): `[ Todos (15) ]`, `[ Boletas (11) ]`, `[ Facturas (3) ]`, `[ Notas de Venta (1) ]`, `[ NC (1) ]`.
- **Buscador Omnicanal con Debounce:** Entrada para serie-número, DNI, RUC o mesa (con búsqueda activa de `B001-0012894`).
- **Tabla de Comprobantes Oficiales:**
  - Fila objetivo (`B001-0012894`): Resaltada en ámbar suave, estado `[ ✓ EMITIDO ]`, con botones `[ 📄 Ver QR ]` y acción crítica `[ ⚠️ Anular (Nota Crédito) ]`.
  - Fila demostrativa de salvaguarda (`B001-0012890`): Representa un comprobante ya anulado previamente; muestra texto tachado, badge rojo `[ 🚫 ANULADO (Por NC BC01-0000041) ]`, botón de enlace `[ 📄 Ver NC BC01-0000041 ]` y botón de anular **bloqueado (`[ 🚫 Anulado ]` inactivo)** para ilustrar el principio Poka-Yoke de no re-anulación.
- **Banner de Salvaguarda Contable:** Informa que cada Nota de Crédito en efectivo genera un asiento `egreso_devolucion` en `caja_movimiento` garantizando cuadratura milimétrica a S/ 0.00 en el Arqueo Z (`CU-CAJA-05`).

### Vista 2: Modal de Emisión de Nota de Crédito Electrónica (`wf_caja_04_modal_nota_credito.jpg`)
Modal formal de rectificación tributaria (1020px de ancho) dividido en dos columnas:
- **Columna Izquierda (50% - Comprobante de Origen Afectado):**
  - Identificación formal: Boleta de Venta Electrónica `B001-0012894`, emitido a Carlos Mendoza Quispe (DNI 72819201), Mesa 04 / Comanda #108.
  - Medio de pago original: Efectivo (Recibido S/ 100.00 - Vuelto S/ 15.00).
  - Desglose tributario exacto: Consumo Bruto S/ 100.00, Descuento Comercial 15% (-S/ 15.00), Base Imponible Gravada S/ 72.03, IGV 18% S/ 12.97 e Importe Total a Rectificar S/ 85.00.
  - Badge de serie asignada: `[ Serie Electrónica Asignada: BC01 (Boleta Crédito) ]`.
- **Columna Derecha (50% - Parámetros SUNAT Catálogo 09 y Cuadratura):**
  - Selector de Motivos Oficiales SUNAT: `01 — Anulación de la operación` (seleccionado por defecto), `02 — Anulación por error en el RUC/Documento`, `06 — Devolución total del consumo`.
  - Campo de Sustento Textual Obligatorio: Textarea con validación en tiempo real (mínimo 10 caracteres): *"Comensal solicita cambio a Factura con RUC de empresa"*.
  - Tarjeta de Devolución de Efectivo: `💵 DEVOLUCIÓN DE EFECTIVO DE GAVETA: - S/ 85.00` con advertencia de que el efectivo en caja disminuirá de S/ 385.00 a S/ 300.00 para mantener la cuadratura exacta del Arqueo Z (`CU-CAJA-05`).
  - Badge de Auditoría SSE: Notificación preventiva de broadcast reactivo al administrador (`CU-ADMIN-12`).
  - Botón de Acción Primaria: `[ ⚡ Confirmar y Emitir Nota de Crédito BC01 (F9) ]`.

### Vista 3: Diálogo de Nota de Crédito Emitida y Token QR (`wf_caja_04_nota_credito_emitida.jpg`)
Modal de culminación transaccional (820px de ancho) bajo política *Cero Papel*:
- **Encabezado Ámbar/Tributario:** `✓ Nota de Crédito Emitida • Comprobante B001-0012894 ANULADO`.
- **Ficha Fiscal de la Nota de Crédito:** `Nota de Crédito Electrónica BC01-0000042`, vinculada a Boleta `B001-0012894 [ ANULADA ]`, Motivo: 01 Anulación de la operación, Total Revertido `- S/ 85.00`, Gaveta Actualizada `S/ 300.00`.
- **Gran Token Digital QR Central:** Código QR dinámico SVG (UUID v8) para descarga de la constancia digital en PDF.
- **Entrega Digital Asistida:**
  - WhatsApp: `+51 987 654 321 [ Guardado ]` con botones `[ ✓ Confirmar y Enviar ]` y `[ ✏️ Modificar ]`.
  - Correo Electrónico: `carlos.mendoza@gmail.com [ Guardado ]` con botones `[ ✓ Confirmar y Enviar ]` y `[ ✏️ Modificar ]`.
- **Acciones de Cierre:** Botón `[ 🖨️ Imprimir Ticket Térmico ]` visible pero temporalmente inactivo (`DESHABILITADO • CERO PAPEL`) y botón primario `[ ✓ Finalizar y Volver al Historial (Esc) ]`.

---

## 69. Reglas de Negocio, Estándar SUNAT de Notas de Crédito y Salvaguardas de Arqueo (`CU-CAJA-04`)

1. **Inmutabilidad Fiscal y Cero Borrados Físicos (`comprobante`):**
   - Conforme a la legislación tributaria peruana (Resolución de Superintendencia N° 097-2012/SUNAT y modif.), los comprobantes de pago electrónicos emitidos no admiten eliminación física (`DELETE`). Toda rectificación, cambio de cliente o anulación total de consumo exige la emisión de una **Nota de Crédito Electrónica** vinculada mediante `comprobante_modificado_id`.
2. **Separación Estricta de Series Electrónicas (`comprobante_serie`):**
   - Las Facturas Electrónicas (`F001`) solo pueden anularse con Notas de Crédito de serie `FC01`.
   - Las Boletas de Venta Electrónicas (`B001`) solo pueden anularse con Notas de Crédito de serie `BC01`.
   - La asignación de correlativos se ejecuta mediante la función transaccional `fn_obtener_siguiente_correlativo` con bloqueo de fila (`FOR UPDATE`), imposibilitando duplicidades o saltos numéricos.
3. **Catálogo SUNAT N° 09 y Sustento Textual Obligatorio:**
   - Todo registro de anulación requiere obligatoriamente un código válido de SUNAT (01, 02, 06) y un sustento justificado de al menos 10 caracteres para blindar la auditoría tributaria y descartar evasión.
4. **Cuadratura Contable y Salvaguarda Milimétrica de Arqueo Z (`caja_movimiento` $\rightarrow$ `CU-CAJA-05`):**
   - Cuando un comprobante cancelado en efectivo es anulado con devolución, se inserta inmediatamente un registro en `caja_movimiento` con `tipo = 'egreso_devolucion'` y monto negativo. Esto descuenta físicamente el efectivo esperado en gaveta (de S/ 385.00 a S/ 300.00). Al contar el efectivo físico en `CU-CAJA-05` (S/ 300.00), el sistema reporta diferencia `S/ 0.00`, blindando la caja contra falsos faltantes.
5. **Bloqueo Poka-Yoke de Re-Anulación y Blindaje de Turno:**
   - Un comprobante marcado como `anulado` tiene sus acciones de anulación bloqueadas tanto a nivel de interfaz (botón deshabilitado) como a nivel de API (`409 Conflict: ERR_COMPROBANTE_YA_ANULADO`). Las Notas de Crédito no pueden re-anularse en terminal POS.
   - Solo se permite anular transacciones del turno de caja activo; una vez cerrada la caja en `CU-CAJA-05`, cualquier reclamo extemporáneo debe ser gestionado por la administración.
6. **Prevención de Fraude y Alerta Reactiva SSE (`CU-ADMIN-12`):**
   - Cada anulación dispara un evento reactivo Server-Sent Events (`comprobante_anulado`) al panel del Administrador del Local en menos de 25ms, generando una alerta prioritaria para supervisar la devolución física del dinero en salón.
7. **Tokenización Cero Papel y Entrega Multicanal:**
   - La Nota de Crédito cuenta con su propio token criptográfico público (UUID v8) para consulta web y descarga PDF, ofreciendo entrega asistida por WhatsApp y correo electrónico antes de retornar al historial.

---

## 70. Vistas Wireframe: `CU-CAJA-05: Cerrar caja (arqueo Z) y rendición de cuentas del turno`

Se diseñaron y renderizaron 3 vistas en alta resolución (1440x900, JPG calidad 95) ubicadas en `wireframe/cajero/CU-CAJA-05-cerrar-caja/assets/`:

### Vista 1: Pre-Arqueo y Balance Operativo del Turno (`wf_caja_05_balance_turno.jpg`)
Workspace de balance y comprobación previa al cierre:
- **Barra Superior de Turno y KPIs:** Turno #042 Abierto (Apertura: 11:30 AM), Fondo de Apertura `S/ 300.00`, Total Facturado en Turno `S/ 1,485.00` y Efectivo Estimado en Gaveta `S/ 300.00`.
- **Banner Poka-Yoke de Salón al Día:** `✓ SALÓN 100% AL DÍA` (0 mesas con comanda activa, todas las cuentas liquidadas, cero pedidos en cola de cocina).
- **Columna Izquierda (60%):**
  - Tabla de Recaudación por Método de Pago: Efectivo en gaveta (Fondo S/ 300 + Ingreso S/ 85 - NC Devolución S/ 85 = S/ 300.00 esperado), Tarjetas POS (S/ 245.00 - Lote #012), Billeteras Digitales (S/ 54.00 - Yape/Plin), Otros cobros del turno (S/ 1,186.00). Total: S/ 1,485.00 neto.
  - Resumen Fiscal SUNAT: Base Imponible Gravada S/ 1,258.47, IGV 18% S/ 226.53, Total S/ 1,485.00.
- **Columna Derecha (40%):**
  - Checklist Poka-Yoke de Verificación: Salón sin comandas abiertas, auditoría de comprobantes (14 vigentes / 1 anulado), flujo de gaveta validado.
  - Tarjeta de Acción Primaria: Botón prominente `[ 📋 Iniciar Arqueo y Cierre de Caja (F8) ]` y botón secundario `[ Volver al Monitor POS de Salón (Esc) ]`.

### Vista 2: Modal de Arqueo y Conteo Físico (`wf_caja_05_modal_arqueo_conteo.jpg`)
Modal formal de rendición de cuentas (1040px de ancho) con layout de dos columnas:
- **Columna Izquierda (50% - Montos del Sistema):**
  - Desglose contable: Fondo Apertura S/ 300.00, Ingresos en Efectivo +S/ 85.00, Egresos/NC -S/ 85.00.
  - Tarjeta destacada verde: `EFECTIVO OBJETIVO EN GAVETA: S/ 300.00` (calculado automáticamente).
  - Conciliación de Medios Electrónicos: Tarjetas POS S/ 245.00 (`✓ Lote Conciliado`), Billeteras Yape/Plin S/ 54.00 (`✓ Verificado`).
- **Columna Derecha (50% - Conteo Físico y Cuadre):**
  - Campo numérico principal: Digitación directa del efectivo contado real con tipografía monospace 24px: `S/ [ 300.00 ]`.
  - Tarjeta de Cuadre Instantáneo: `✓ CAJA CUADRADA CON ÉXITO • DIF: S/ 0.00` (Esperado S/ 300.00 vs Contado S/ 300.00).
  - Textarea de notas de cierre y aviso de notificación reactiva SSE al administrador (`CU-ADMIN-12`).
  - Acción Primaria: `[ 🔒 Confirmar y Cerrar Turno Definitivamente (F9) ]`.

### Vista 3: Reporte Z Digital Formal y Terminal Cerrada (`wf_caja_05_reporte_z_cerrado.jpg`)
Pantalla post-cierre bajo política *Cero Papel*:
- **Toast Superior de Éxito:** `✓ Cierre Confirmado: Turno #042 cerrado con éxito • Reporte Z emitido • Broadcast enviado a CU-ADMIN-12 • Terminal Bloqueada`.
- **Ficha Fiscal de Reporte Z:**
  - Encabezado tributario formal con RUC, sede, cajero, timestamp apertura/cierre y duración (8h 15m 07s).
  - Movimiento y arqueo físico de efectivo: Fondo S/ 300.00, Real S/ 300.00, Discrepancia S/ 0.00 (CUADRADA).
  - Desglose por método de pago: Total Facturado Neto S/ 1,485.00.
  - Resumen tributario SUNAT: Base Imponible Gravada S/ 1,258.47, IGV S/ 226.53.
  - Auditoría de documentos: 11 Boletas, 3 Facturas, 1 Nota de Venta, 1 Nota de Crédito.
- **Acciones Digitales:** `[ 📄 Descargar Reporte Z (PDF) ]`, botón de ticket térmico inactivo (`DESHABILITADO • CERO PAPEL`), badge informativo de archivo inmutable para supervisión administrativa (`CU-ADMIN-15`), `[ 🚪 Cerrar Sesión ]` y botón primario `[ ⚡ Ir a Apertura de Nuevo Turno (CU-CAJA-01) ]`.

---

## 71. Reglas de Negocio, Arqueo Z y CULMINACIÓN AL 100% DEL MÓDULO DE CAJA (`CU-CAJA-05`)

1. **Cuadratura Milimétrica y Fórmulas del Arqueo Z:**
   - La recaudación esperada en efectivo se rige por:
     $$\text{Efectivo Esperado} = \text{monto\_apertura} + \sum \text{ingresos\_efectivo} - \sum \text{egresos\_devolucion\_efectivo}$$
   - En este turno: $\text{S/ } 300.00 + \text{S/ } 85.00 - \text{S/ } 85.00 = \text{S/ } 300.00$.
   - La discrepancia se define como:
     $$\text{Discrepancia} = \text{monto\_real} - \text{monto\_esperado}$$
   - Al digitar `S/ 300.00`: $\text{Discrepancia} = \text{S/ } 0.00$ (Caja perfectamente cuadrada).
2. **Poka-Yoke Bloqueante de Mesas Activas:**
   - El sistema impide iniciar el arqueo y cierre si existen mesas con consumo en salón pendientes de pago (`ocupada`, `cuenta_pedida`). Esto elimina pedidos "colgados" y previene pérdidas financieras.
3. **Poka-Yoke Obligatorio ante Discrepancias:**
   - Si $\text{Discrepancia} \neq 0.00$ (sobrante o faltante), el botón de cierre se bloquea hasta que el operador ingrese obligatoriamente una justificación textual (`comentario_discrepancia`) de al menos 10 caracteres.
4. **Transacción Atómica ACID y Liberación de Terminal:**
   - El cierre conmuta `caja.estado = 'cerrada'`, fija `fecha_cierre = NOW()`, registra la auditoría inmutable del Reporte Z en `auditoria_caja_cierre` y libera el índice `uq_caja_abierta_local`.
5. **🏆 HITO HISTÓRICO: MÓDULO DE CAJA 100% CULMINADO (5 Casos de Uso):**
   - Con `CU-CAJA-01` (Apertura de turno), `CU-CAJA-02` (Precuenta digital / Monitor POS), `CU-CAJA-03` (Cobro de comanda y comprobantes oficiales), `CU-CAJA-04` (Anulación, Nota de Crédito y reversión de caja) y `CU-CAJA-05` (Arqueo Z y Reporte Z digital), el **Módulo de Caja, Punto de Venta y Facturación de RestaurantCloud AI queda 100% terminado (5 Casos de Uso canónicos)**.

---

## 72. Vistas Wireframe: `CU-CLIENTE-01: Consultar carta digital (Catálogo Interactivo Web)`

Se diseñaron y renderizaron 4 vistas en alta resolución (1440x900, JPG calidad 95) ubicadas en `wireframe/cliente/CU-CLIENTE-01-consultar-carta/assets/`:

### Vista 1: Catálogo Digital Interactivo en Smartphone (`wf_cliente_01_catalogo_smartphone.jpg`)
Experiencia mobile-first canónica para comensales en smartphone (viewport central 412x880):
- **Barra Superior y Estado del Negocio:** Marca del restaurante ("🔥 El Carbón & Leña"), Sede Miraflores (Av. Larco 450) y badge de apertura (`● Abierto hoy`).
- **Botones de Contacto Directo:** Accesos directos a `[ 💬 WhatsApp ]` y `[ 📞 Llamar (987 654 321) ]` consumiendo directamente `local.telefono`.
- **Banner de Promoción Activa:** Descuento vigente configurado en `CU-ADMIN-17` (*"15% dscto en Almuerzos Ejecutivos"*).
- **Buscador Omnicanal Reactivo:** Input con debounce para búsqueda por nombre de plato o ingrediente en memoria (0ms latencia).
- **Carrusel Sticky de Categorías:** Tabs deslizables táctiles con conteo de platos (`[ Todos (28) ]`, `[ 🔥 Pollos & Brasas ]`, `[ 🥩 Parrillas ]`, `[ 🍟 Guarniciones ]`, `[ 🥤 Bebidas ]`).
- **Lista de Platos Gastronómicos:** Tarjetas con miniatura culinaria, nombre comercial, descripción corta, precio oficial en Soles (`S/ 24.50`) con IGV incluido y estado de stock.
- **Sincronización en Vivo de Quiebres:** Platos marcados como agotados en cocina (`CU-COCINA-04`) se atenúan con el badge visual `[ ✕ Agotado por hoy ]`.

### Vista 2: Ficha de Inspección de Plato (`wf_cliente_01_modal_detalle_plato.jpg`)
Modal / bottom-sheet al presionar cualquier plato de la carta:
- **Hero Image HD Gastronómica:** Fotografía culinaria en alta resolución.
- **Datos Comerciales:** Nombre comercial ("Lomo Saltado Criollo"), categoría y precio destacado (`S/ 42.00`).
- **Descripción Culinaria:** Detalle de preparación e ingredientes clave sin matrices complejas de alérgenos ni dietas.
- **Aviso Informativo Poka-Yoke:** *"ℹ️ Para degustar este plato, indícaselo al personal de salón al visitarnos o escríbenos a nuestro WhatsApp."*
- **Botón de Cierre Táctil:** Botón de 48px de altura `[ ← Volver a la Carta ]` que regresa al catálogo sin crear carritos ni pedidos.

### Vista 3: Catálogo en Pantalla Ancha Desktop / Tablet (`wf_cliente_01_catalogo_desktop.jpg`)
Adaptación responsiva fluida a pantallas anchas (1440x900):
- **Sidebar Izquierdo Fijo (320px):** Identidad del local, dirección física, horario de atención semanal (`CU-ADMIN-09`), caja de contacto directo con WhatsApp y llamada, y menú vertical de categorías con contador.
- **Área Principal Derecha (1040px):** Banner de promociones activas, buscador superior con debounce y grilla de 3 columnas de platos culinarios con precios y badges de disponibilidad.

### Vista 4: Estado Vacío de Búsqueda sin Coincidencias (`wf_cliente_01_busqueda_vacia.jpg`)
Manejo de estados UX sin callejones sin salida (Zero Dead-Ends):
- **Filtro sin Resultados:** Búsqueda de término no disponible (ej. *"mariscos"* en pollería).
- **Ilustración y Mensaje Empático:** Notifica con claridad la especialidad culinaria de la sede.
- **Botón CTA de Recuperación:** `[ ↺ Ver Toda la Carta (28 Platos) ]` para limpiar la búsqueda en 1 clic.
- **Asistencia Alternativa:** Botón directo a WhatsApp para coordinar pedidos especiales.

---

## 73. Reglas de Negocio, Cero Carrito, Contacto Multicanal y Contrato REST de `CU-CLIENTE-01`

1. **Hiper-Simplificación y Cero Fricción:**
   - No se exige registro de usuario, inicio de sesión ni descarga de aplicaciones.
   - Cualquier código QR impreso en el local redirige unívocamente a la URL pública amigable de la sede (`https://app.restaurantcloud.pe/sede/:slug/carta`).
2. **Cero Carrito de Compras / Cero Autocomandas:**
   - La carta es estrictamente un catálogo de consulta visual e informativa. La toma de comanda formal y envío a cocina permanece 100% a cargo del Mozo en salón (`CU-MOZO-02`), preservando la integridad del KDS y caja.
3. **Contacto Multicanal con Datos Existentes:**
   - No se requieren tablas adicionales de mensajería; los botones de WhatsApp y llamada telefónica consumen de forma transparente `local.telefono`.
4. **Endpoint REST Único de Alto Rendimiento:**
   - `GET /api/v1/public/sedes/{slug}/carta` resuelve en una sola consulta agrupada (`JSON_AGG`) la sede, promociones activas y categorías con platos en sub-5ms.

---

## 74. Actualización de CU-PROP-04: Dirección Web Pública (`slug`), Comprobación Bajo Demanda y Nueva Vista 2A

En alineación con la carta digital pública implementada en [`CU-CLIENTE-01`](#72-vistas-estructurales-de-cu-cliente-01-consultar-carta-digital-catálogo-interactivo-web), se perfeccionó el flujo de registro y administración de sedes en **`CU-PROP-04`**:

### Vista 2A: Asistente de Registro — Paso 1: Datos de Sede & Dirección Web (`wf_prop_04_paso1_datos_enlace_web.jpg`)
![Vista 2A: Paso 1 - Datos Comerciales y Enlace Web](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_paso1_datos_enlace_web.jpg)

1. **Autogeneración Predictiva y Validación Inicial:**
   - La dirección web de la carta digital (`slug`) se compone reactivamente en memoria del frontend combinando el nombre comercial y distrito (`slugify(nombre) + "-" + slugify(distrito)`).
   - Al cargar el modal o completarse los campos, se realiza una verificación inicial en segundo plano contra la base de datos confirmando la disponibilidad con `[ ✓ Enlace disponible para tu restaurante ]`.
2. **Validación Bajo Demanda sin Saturación de Red:**
   - Si el Propietario personaliza manualmente el enlace, el estado pasa a pendiente y se habilita el botón `[ 🔍 Comprobar Disponibilidad ]`, eliminando consultas repetitivas innecesarias por cada tecla presionada.
   - Si se detecta colisión con otro restaurante (`LOCAL_SLUG_DUPLICADO`), el backend ofrece una alternativa de un solo clic (ej. `san-isidro-conquistadores-2`), permitiendo adoptarla inmediatamente con `[ Usar Sugerencia ]`.
3. **Preservación Intacta de la Vista 2B:**
   - La [`Vista 2B`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-04-administrar-locales/assets/wf_prop_04_formulario_local.jpg) (Paso 2: Giro Gastronómico y Plantilla Inicial) permanece 100% intacta, garantizando la continuidad del aprovisionamiento automático de salón, categorías e insumos de inventario.
4. **Contratos Go y Restricción de Base de Datos:**
   - Se incorporó el endpoint `GET /api/v1/propietario/locales/verificar-slug?slug={slug}` y el campo `slug` en los DTOs de creación (`POST`) y edición (`PUT`), respaldado por la restricción global `UNIQUE(slug)` y el índice B-Tree dedicado `idx_local_slug` en la tabla `local`.

---

## 75. Vistas Wireframe y Arquitectura de `CU-CLIENTE-02: Buscar Comprobante de Pago`

Se diseñaron, renderizaron y optimizaron 4 vistas en resolución canónica (1440x900, JPG calidad 95) en [`wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/assets/`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/assets/):

### Vista 1: Visor Digital de Comprobante en Smartphone (`wf_cliente_02_comprobante_smartphone.jpg`)
![Vista 1: Visor Digital en Smartphone](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/assets/wf_cliente_02_comprobante_smartphone.jpg)
- **Viewport Mobile Smartphone (412x820):** Experiencia para clientes que escanean el código QR en mesa o abren el enlace directo recibido por WhatsApp/Correo.
- **Detalle Fiscal y Comercial:** Datos del emisor ("🔥 El Carbón & Leña S.A.C.", RUC 20601234567), Boleta B001-0012894, comensal identificado con DNI, tabla de platos consumidos, desglose de descuento comercial, base gravada, IGV (18.00%) y total neto en Soles (`S/ 72.25`).
- **Estado Limpio:** Badge `[ ✓ EMITIDO ]` sin textos superfluos de validación externa.
- **Acciones Táctiles (44px):** Botón principal `[ 📥 Descargar Comprobante PDF ]`, botones de compartir por WhatsApp y copiar enlace, y botón de re-enganche `[ 🍽️ Explorar Carta Digital del Restaurante ]` hacia `CU-CLIENTE-01`.

### Vista 2: Visor en Pantalla Ancha Desktop / Tablet (`wf_cliente_02_comprobante_desktop.jpg`)
![Vista 2: Visor Desktop Factura A4](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/assets/wf_cliente_02_comprobante_desktop.jpg)
- **Distribución en 2 Columnas (1440x900):**
  - **Columna Izquierda (880px):** Representación gráfica oficial del comprobante tributario (formato Factura A4 formal con membrete, recuadro de RUC emisor, datos de la empresa compradora, tabla formal de conceptos con IGV desglosado, código QR oficial y hash SHA-256).
  - **Columna Derecha (440px):** Panel lateral de gestión con estado `[ ● COMPROBANTE EMITIDO ]`, botones de descarga de PDF oficial y XML electrónico (UBL 2.1), input para copiar enlace y datos de contacto de la sede.

### Vista 3: Auditoría de Comprobante Anulado con Nota de Crédito (`wf_cliente_02_comprobante_anulado.jpg`)
![Vista 3: Auditoría Comprobante Anulado](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/assets/wf_cliente_02_comprobante_anulado.jpg)
- **Protección Contable y Anti-Fraude:** Transparencia si el comprobante fue anulado en `CU-CAJA-04`.
- **Marca de Agua Indeleble:** Sello transversal `ANULADO`, banner superior de advertencia y número de serie tachado.
- **Trazabilidad Rectificatoria:** Ficha de auditoría con la Nota de Crédito asociada (`BC01-0000042`), fecha, motivo formal ("01 — Anulación de la operación") y botón para ver la nota de crédito. El PDF se genera con sello permanente de anulación.

### Vista 4: Comprobante no Disponible / Búsqueda Manual por Código (`wf_cliente_02_token_invalido.jpg`)
![Vista 4: Comprobante no Disponible](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/cliente/CU-CLIENTE-02-buscar-comprobante/assets/wf_cliente_02_token_invalido.jpg)
- **Zero Dead-Ends:** Para enlaces incompletos o usuarios que acceden directamente a `/comprobante`.
- **Protección de Datos:** Aviso pedagógico explicando que no existe buscador por DNI/RUC para proteger la privacidad de los comensales.
- **Búsqueda Manual por Código:** Formulario simple `[ Ingrese el código de su comprobante ] [ 🔍 Consultar ]` sin tecnicismos ("UUID").
- **Acciones de Asistencia:** Botón para contactar al restaurante por WhatsApp y solicitar reenvío, y botón para explorar la carta digital.

### Reglas de Acceso, Privacidad y Contratos Go de `CU-CLIENTE-02`
1. **Acceso por Capability Token (Cero Login):**
   - El token `token_qr` (UUID v8) indexado con `idx_comprobante_token_qr` permite consultar el comprobante en sub-milisegundos (< 0.5ms) sin autenticación JWT.
2. **Rate Limiting Anti-Scraping:**
   - Restringe las solicitudes a 30 consultas por minuto por dirección IP en Redis (`ratelimit:public:comprobante:{ip}`).
3. **Endpoints REST Implementados:**
   - `GET /api/v1/public/comprobantes/:token`: Detalle JSON agrupado en una sola consulta SQL.
   - `GET /api/v1/public/comprobantes/:token/pdf`: Descarga de representación impresa oficial.
   - `GET /api/v1/public/comprobantes/:token/xml`: Descarga de archivo estructurado electrónico UBL 2.1.

---

## 76. Vistas Wireframe y Arquitectura de `CU-ADMIN-13: Ver Reportes de Ventas y Desempeño`

Se diseñaron, renderizaron y validaron 4 vistas en resolución canónica (1440x900, JPG calidad 95) ubicadas en [`wireframe/administrador/CU-ADMIN-13-reportes-ventas/assets/`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-13-reportes-ventas/assets/):

### Vista 1: Dashboard Estratégico & KPIs de Ventas (`wf_admin_13_dashboard_ventas.jpg`)
![Vista 1: Dashboard Estratégico y KPIs](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-13-reportes-ventas/assets/wf_admin_13_dashboard_ventas.jpg)
- **Barra de Navegación Modular y Filtros:** Pestañas especializadas `[ 📈 Ventas Generales (Activo) ]`, `[ 🍽️ Menú & Platos ]`, `[ 👥 Equipo de Salón ]`, filtros temporales (`Hoy`, `Ayer`, `Semana`, `Este Mes (Octubre)`), checkbox `[✓ vs. Mes anterior]` para cálculo de deltas y botón `[ 📥 Exportar Reporte ]`.
- **4 Tarjetas de KPIs Clave:**
  - *Facturación Total Neta:* `S/ 28,450.00` con delta verde `▲ +12.4%` y desglose de base imponible gravada (`S/ 24,110.17`) e IGV 18% (`S/ 4,339.83`).
  - *Comandas Cobradas:* `412 Cuentas` (`▲ +5.2%`) con promedio diario de `13.7 mesas/día`.
  - *Ticket Promedio:* `S/ 69.05 / mesa` (`▲ +6.8%`) y gasto individual por comensal de `S/ 24.30` (1,170 comensales atendidos).
  - *Rotación Media de Mesa:* `48 Minutos` con reducción de permanencia de `▼ -4 min` (mayor agilidad desde pedido hasta pago).
- **Curva Horaria de Facturación (11h a 22h):** Gráfico de barras de alta legibilidad destacando los dos momentos cumbre de la jornada:
  - *Pico Almuerzo (13:00 - 15:00):* Concentra el 45.6% de los ingresos (`S/ 12,940.00`), con alto volumen ejecutivo y rotación rápida.
  - *Pico Cena (20:00 - 22:00):* Concentra el 38.8% de los ingresos (`S/ 11,030.00`), con mayor ticket promedio por consumo familiar.
- **Recaudación por Medios de Pago (`CU-ADMIN-19`):** Tarjetas POS (`S/ 15,363.00`, 54%), Efectivo (`S/ 9,104.00`, 32%) y Billeteras Digitales Yape/Plin (`S/ 3,983.00`, 14%).
- **Emisión por Tipo de Comprobante (`CU-CAJA-03` / `CU-CAJA-04`):** Boletas Electrónicas (280, 68%), Facturas Electrónicas (99, 24%), Notas de Venta (33, 8%) y Notas de Crédito por anulación (3, 0.7%).

### Vista 2: Menú Engineering & Mix Culinario (`wf_admin_13_menu_engineering.jpg`)
![Vista 2: Menú Engineering y Mix Culinario](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-13-reportes-ventas/assets/wf_admin_13_menu_engineering.jpg)
- **Matriz de 4 Cuadrantes de Menú Engineering:**
  - *⭐ ESTRELLAS (Alta Venta • Alto Margen):* 1/4 Pollo a la Brasa (148 u. • Margen 68%) y Lomo Saltado (92 u. • Margen 62%). Estrategia: Preservar receta, calidad y visibilidad preferencial.
  - *🐎 CABALLITOS (Alta Venta • Margen Medio):* Arroz Chaufa Especial (114 u. • Margen 42%) y Papas Nativas Grandes (86 u. • Margen 39%). Estrategia: Negociar insumos con proveedores o aplicar micro-ajuste de precio.
  - *🧩 PUZLES (Baja Venta • Alto Margen):* Parrilla Especial de Lomo (28 u. • Margen 71%) y Tiradito de Ají Amarillo (22 u. • Margen 66%). Estrategia: Impulsar recomendación activa de mozos en salón y combos promocionales (`CU-ADMIN-17`).
  - *⚠️ REZAGADOS (Baja Venta • Bajo Margen):* Sopa Criolla Familiar (14 u. • Margen 34%) y Ensalada Mixta Simple (16 u. • Margen 31%). Estrategia: Evaluar reformulación o descontinuar en carta (`CU-ADMIN-01`).
- **Tabla Top 8 Platos Más Vendidos:** Ranking por unidades vendidas, importe facturado, participación del mix de ventas y estado de stock en tiempo real.
- **Participación por Categoría:** Pollos & Brasas (42.5%), Parrillas & Carnes (26.1%), Bebidas & Bar (15.4%), Guarniciones (9.2%) y Postres (6.8%).
- **Hallazgo Culinario & Alertas:** Nota contextual destacando que Brasas y Parrillas representan el 68.6% del revenue, alertando sobre quiebre de stock en Torta Helada de Maracuyá durante el fin de semana (`CU-COCINA-04`).

### Vista 3: Productividad del Equipo de Salón & Operaciones de Turno (`wf_admin_13_desempeno_mozos.jpg`)
![Vista 3: Productividad del Equipo de Salón](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-13-reportes-ventas/assets/wf_admin_13_desempeno_mozos.jpg)
- **Modalidad Operativa Adaptable de Turnos:**
  - En sedes de *Doble Turno*, visualiza comparativa entre Turno Mañana (11:30 - 16:30, 228 mesas, S/ 15,932.00) y Turno Noche (18:30 - 23:30, 184 mesas, S/ 12,518.00).
  - En locales que operan en *Turno Único Continuo*, el sistema se adapta limpiamente consolidando el 100% de la jornada continua sin forzar comparaciones artificiales ni generar errores de datos nulos.
- **Tabla de Rendimiento Individual de Mozos (`CU-MOZO-02`):**
  - Auditoría de mesas atendidas, facturación directa atribuible y ticket medio por mesa.
  - *Tiempo Promedio de Mesa:* Detección de agilidad con badges (`Rápido`, `Óptimo`, `Lento`). Marco Valdivia rota mesas en 44 min (9 min más rápido que el promedio).
  - *Upselling de 2da Ronda:* Medición de mesas donde el mozo logró colocar rondas adicionales de bebidas o postres (38.0% en líder de salón), incrementando el ticket promedio en +S/ 14.50.
  - *Auditoría de Anulaciones:* Conteo transparente de ítems revocados con `CU-MOZO-06` para identificar errores de comandera móvil o incidentes en cocina.
  - *Insignias de Desempeño:* Reconocimiento motivacional (`👑 LÍDER VENTAS`, `⭐ DESTACADO`, `⚠️ POR MEJORAR`).

### Vista 4: Modal de Exportación Asíncrona con Streaming (`wf_admin_13_modal_exportar.jpg`)
![Vista 4: Modal de Exportación](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-13-reportes-ventas/assets/wf_admin_13_modal_exportar.jpg)
- **Selector de Formato:** Tarjetas interactivas para elegir entre `Reporte Ejecutivo en PDF` (documento formal con gráficos vectoriales y balance gerencial) y `Hoja de Cálculo Excel / CSV` (datos tabulares desglosados para contabilidad).
- **Rango de Fechas Personalizado:** Selección precisa de fechas `Desde` y `Hasta`.
- **Selector Modular de Secciones:** Checkboxes independientes para incluir o excluir Resumen Financiero, Curva Horaria, Mix Culinario, Productividad de Mozos, Medios de Pago / SUNAT o Detalle Comanda por Comanda.
- **Garantía de Rendimiento y Streaming HTTP:** Aviso pedagógico sobre la descarga en streaming HTTP con compresión nativa Gzip (`Transfer-Encoding: chunked`), transfiriendo chunks binarios directamente al disco local y reduciendo el consumo de ancho de banda en ~80% sin sobrecargar la memoria RAM del servidor ni del cliente.

---

## 77. Vistas Wireframe y Arquitectura de `CU-ADMIN-14: Gestión de Flujo de Caja, Gastos y Auditoría de Cierres Z`

Se diseñaron, renderizaron y validaron 4 vistas en resolución canónica (1440x900, JPG calidad 95) ubicadas en [`wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/assets/`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/assets/), integrando y absorbiendo formalmente las facultades de `CU-ADMIN-15`:

### Vista 1: Dashboard de Flujo de Caja & Balance Neto (`wf_admin_14_dashboard_flujo_caja.jpg`)
![Vista 1: Flujo de Caja y Balance Neto](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/assets/wf_admin_14_dashboard_flujo_caja.jpg)
- **Barra de Navegación y Filtros:** Pestañas especializadas `[ 💵 Flujo de Caja & Balance (Activo) ]`, `[ 📋 Auditoría de Turnos & Cierres Z ]`, `[ 🧾 Egresos & Gastos de Sede ]`, selector rápido (`Hoy`, `Semana`, `Este Mes (Octubre)`), badge con selector de rango `[📅 Rango: 01/10/2026 — 31/10/2026 (Personalizado)]`, y botones `[ ➕ Registrar Gasto ]` e `[ 📥 Exportar Reporte ]`.
- **4 KPIs Financieros Macro:**
  - *Ingresos Salón (Cobrados):* `S/ 28,450.00` (100% Salón, sin división artificial de delivery) desglosado en POS S/ 15,363.00 (54%), Efectivo S/ 9,104.00 (32%) y Yape/Plin S/ 3,983.00 (14%).
  - *Egresos Totales Operativos:* `S/ 16,820.00` (Insumos culinarios 66.9% y Gastos de sede 33.1%).
  - *Balance Neto Operativo:* `+ S/ 11,630.00` con margen de liquidez libre de `40.8%` ($Ingresos - Egresos$).
  - *Conciliación de Liquidez Disponible:* Cuentas Bancarias / Pasarelas (`S/ 19,346.00`, 68%) vs Efectivo Físico en Gavetas (`S/ 9,104.00`, 32%).
- **Histograma Diario de Entradas vs Salidas:** Barras pareadas ilustrando la solvencia por tramo semanal y callout interpretativo: *"Por cada S/ 1.00 de egreso operativo, la sede generó S/ 1.69 en ventas de salón"*.
- **Composición Fáctica de Egresos:**
  - *Insumos Culinarios Comprados (`ficha_compra` • S/ 11,250.00):* Pollo Entero (28.8%), Lomo Fino (25.3%), Papa Nativa (10.7%), Carbón/Leña (12.0%) y Abarrotes/Bebidas (23.2%).
  - *Gastos Operativos de Sede (`gasto_manual` • S/ 5,570.00):* Alquiler de Local (50.3%), Servicios Básicos Luz/Agua/Gas (25.5%), Limpieza y Menaje Interno (10.4%), Mantenimiento (8.1%) y Caja Chica / Emergencias (5.7%).

### Vista 2: Auditoría de Turnos de Caja & Reportes Z (`wf_admin_14_auditoria_turnos_z.jpg`)
![Vista 2: Auditoría de Turnos y Reportes Z](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/assets/wf_admin_14_auditoria_turnos_z.jpg)
- **Barra de Indicadores de Control Interno:** 42 Turnos en el Mes • 40 Cuadrados Conformes (95.2%) • 2 Discrepancias Menores (Neto -S/ 14.50) • 41 Auditados y Visados • Efectivo Total Auditado S/ 9,104.00.
- **Banner de Monitor de Terminal y Rescate:** Informa estado de terminal abierta y botón de rescate `[ ⚠️ Cierre Administrativo Forzado (Turno #043) ]` para liberar el bloqueo `uq_caja_abierta_local` si un cajero abandonó la sede.
- **Directorio Histórico de Arqueos:** Tabla con correlativo, horario (Almuerzo vs Cena), cajero, fondo inicial, efectivo esperado, efectivo real contado, diferencia en Soles, estado de arqueo (`✓ Cuadrado` o `⚠️ Faltante`), visado gerencial (`⏳ Pendiente de Auditoría`, `✓ Auditado: Subsanado`, `✓ Auditado y Conforme`), y botones `[ 👁️ Auditar Reporte Z ]` y `[ 📄 Ver Reporte Z ]`.

### Vista 3: Visor Oficial del Reporte Z Digital & Visado Administrativo (`wf_admin_14_modal_visor_reporte_z.jpg`)
![Vista 3: Visor del Reporte Z Digital](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/assets/wf_admin_14_modal_visor_reporte_z.jpg)
- **Ficha Fiscal Inmutable (900px):** Membrete legal, correlativo oficial `#Z001-000042`, cajero titular Lucía Flores y badge `[ ✓ ARQUEO CUADRADO EXACTO ]`.
- **Cuadratura Física de Gaveta:** Fondo Apertura S/ 200.00 + Cobros Efectivo S/ 885.00 - Devolución NC S/ 85.00 = Esperado S/ 1,000.00 vs Real Contado S/ 1,000.00 (Diferencia S/ 0.00).
- **Recaudación por Medios de Pago & SUNAT:** Lote POS #012 (S/ 1,540.00), Billeteras (S/ 420.00), Base Imponible S/ 2,411.02, IGV S/ 433.98 y rango de Boletas/Facturas/NC emitidas.
- **Visado Gerencial:** Campo para justificación o notas de auditoría interna y botón prioritario `[ ✓ Marcar Turno Auditado y Conforme ]`, persistiendo `revisado = true` y autoría administrativa.

### Vista 4: Modal de Registro de Gasto Operativo Manual (`wf_admin_14_modal_registro_gasto.jpg`)
![Vista 4: Registro de Gasto Operativo](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-14-flujo-caja-cierres-z/assets/wf_admin_14_modal_registro_gasto.jpg)
- **Formulario Estructurado (700px):**
  - Categoría de Gasto: `Alquiler`, `Servicios Básicos (Luz/Agua/Gas)`, `Limpieza, Aseo & Menaje Interno`, `Mantenimiento`, `Caja Chica / Emergencias`.
  - Fecha, Monto en Soles y Selector de Origen de Fondos: `Transferencia Bancaria` vs `Efectivo de Caja Chica / Gaveta Activa`.
  - Cuadratura Automática: Callout advirtiendo que el efectivo de caja descuenta el arqueo esperado de `caja_movimiento` para evitar falsos faltantes al cajero en `CU-CAJA-05`.
  - Proveedor/Beneficiario, Tipo de Comprobante (Recibo de Servicios, Factura, Boleta), Número de Suministro y Justificación textual obligatoria.

---

## 78. Vistas Wireframe y Arquitectura de `CU-SAAS-01: Supervisar Empresas Registradas, Activaciones y Renovaciones de Suscripción`

Se diseñaron, renderizaron y validaron 4 vistas en resolución canónica (1440x900, JPG calidad 95) ubicadas en [`wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/assets/`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/assets/), transformando el caso de uso en el Hub Integral de Monitoreo de Tenants y Gestión de Onboarding SaaS:

### Vista 1: Consola Central de Supervisión de Tenants (`wf_saas_01_bandeja_tenants.jpg`)
![Vista 1: Consola Central de Tenants](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/assets/wf_saas_01_bandeja_tenants.jpg)
- **Barra de Navegación y URL Canónica:** Encabezado con badge `CONSOLA ADMIN SAAS`, indicador `Admin Root` y ruta `https://admin.restaurantcloud.pe/saas/tenants`.
- **4 Tarjetas de KPIs Globales:**
  - *Total Empresas Registradas:* `48 Empresas` con crecimiento de `▲ +4 este mes` y MRR global de `S/ 11,450.00`.
  - *Suscripciones Activas:* `41 Activas (85.4%)` con facturación regular al día.
  - *En Período de Gracia:* `3 en Gracia (Día 1-5)` con alerta ámbar de `⚠️ S/ 747 MRR en riesgo de suspensión`.
  - *Sedes Operativas Conectadas:* `112 Locales Activos` con promedio de `2.3 sedes por cliente`, reflejando la utilización real de infraestructura sin contrasentidos contables.
- **Barra de Filtros y Segmentación:** Pestañas por estado (`[Todos (48)]`, `[Activos (41)]`, `[En Gracia (3)]`, `[Suspendidos (3)]`, `[Baja (1)]`), buscador reactivo (`Buscar por razón social, nombre o RUC...`), selector de plan y botón `[ ➕ Nueva Alta Manual ]`.
- **Grilla de Tenants:** Razón social, RUC de 11 dígitos, plan contratado, conteo de sedes, estado de suscripción con microcopia de días de gracia (`Día 2 de 5 de gracia`, `Día 4 de 5 de gracia`), fecha de próximo cobro, medio de pago registrado y botón `[ 👁️ Ver Expediente ]`.

### Vista 2: Expediente Detallado de Empresa y Estado de Cobros (`wf_saas_01_detalle_tenant.jpg`)
![Vista 2: Expediente de Tenant](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/assets/wf_saas_01_detalle_tenant.jpg)
- **Modal de Auditoría 360° (900px):** Inspección completa del cliente gastronómico *El Tenedor Gourmet S.A.C.* en estado `⚠️ En Período de Gracia (Día 2 de 5)`.
- **Bloque 1 (Identidad de Empresa & Titular Propietario):** 100% nativa de base de datos (`empresa.razon_social`, `empresa.ruc`, derivación interna `RUC 20 — Persona Jurídica`, dirección de sede principal `local.direccion`, teléfono de contacto, titular y badge `● CUENTA ACTIVA & OPERATIVA`).
- **Bloque 2 (Contrato SaaS y Pasarela Stripe):** Plan Pro (S/ 249/mes), fecha de cobro en reintento, IDs técnicos (`cus_Q8x9L2k1mP09`, `sub_1N9a8b2c4e5f6`), tarjeta Visa vinculada y cuenta regresiva de gracia (`3 días restantes, corte 14/10/2026 23:59`).
- **Bloque 3 (Historial de Transacciones de la Tabla `pago`):** Visualización inmutable de cobros sincronizados vía webhooks; resalta en rosa el cargo fallido del 09/10 (`REC-RENOV-02`, "Fondos insuficientes") y el cobro exitoso del alta inicial.
- **Bloque 4 (Consumo de Límites del Plan):** Medición de uso: Locales 2/3 (67%), Mesas 28/30 (93%) y Personal 11/15 (73%).
- **Acciones Administrativas:** Botones para `[ ⚠️ Suspender Empresa Preventivamente ]`, `[ ✉️ Reenviar Notificación de Cobro ]` (disparo de email inmediato con link de actualización de tarjeta) y `[ 💳 Ver en Stripe Dashboard ]`.

### Vista 3: Modal de Alta Manual con Pago Verificado (`wf_saas_01_modal_alta_manual.jpg`)
![Vista 3: Alta Manual Corporativa](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/assets/wf_saas_01_modal_alta_manual.jpg)
- **Formulario Compacto de Alta B2B (820px):** Diseñado sin scrollbars verticales, agrupando 4 bloques esenciales:
  - *Bloque 1 (Identificación de la Empresa):* Ingreso directo de RUC `20603849201` con validación sintáctica matemática Módulo 11 (dígito verificador conforme), deducción automática de `RUC 20 — Persona Jurídica`, Razón Social y dirección de la sede principal (sin depender de APIs externas).
  - *Bloque 2 (Datos del Titular):* Nombre, teléfono/WhatsApp y correo corporativo `admin@puertomarino.pe`.
  - *Bloque 3 (Plan y Vigencia):* Plan Pro Anual (`S/ 2,490 / año`) con fechas de inicio y vencimiento a 1 año.
  - *Bloque 4 (Registro de Pago Bancario Verificado):* Monto cobrado en Soles, selector de medio bancario (`Transferencia Bancaria BCP`), N° de constancia `OP-90481239-BCP` y nota administrativa de tesorería que se persiste con estado `exitoso` en la tabla `pago`.
- **Despacho Automático de Bienvenida:** Checkbox activo para enviar capability token seguro de 72 horas al titular para que fije su contraseña e inicie la configuración de su restaurante.

### Vista 4: Estado Vacío de Filtro / Suscripciones al Día (`wf_saas_01_estado_vacio.jpg`)
![Vista 4: Estado Vacío Solvente](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/assets/wf_saas_01_estado_vacio.jpg)
- **Indicador de Solvencia:** Card ilustrado con ícono de escudo `🛡️`, informando pedagógicamente que no existen cuentas en mora ni cobros fallidos en los últimos 30 días.
- **Acciones Rápidas:** Botón `[ 🔄 Actualizar Estado ]` para re-evaluar webhooks de Stripe y `[ Ver Todas las Empresas ]` para restablecer los filtros de la tabla.
---

## 79. Vistas Wireframe y Arquitectura de `CU-SAAS-02: Dar de Baja / Suspender Empresa Conforme a Ley`

Se diseñaron, renderizaron y validaron 4 vistas en resolución canónica (1440x900, JPG calidad 95) ubicadas en [`wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/assets/`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/assets/), estableciendo el protocolo oficial de suspensión inmediata, reversibilidad y baja legal conforme a la Ley N° 29733 de Protección de Datos Personales:

### Vista 1: Modal de Suspensión Preventiva / Temporal (`wf_saas_02_modal_suspension.jpg`)
![Vista 1: Modal de Suspensión Preventiva](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/assets/wf_saas_02_modal_suspension.jpg)
- **Ficha Resumen del Tenant:** Identificación legal (*El Tenedor Gourmet S.A.C.*, RUC `20601234567`), plan vigente (Plan Pro, 2 sedes activas), estado de cuenta (`⚠️ En Período de Gracia — Día 5 de 5`) y correo del titular.
- **Tipificación Formal del Motivo:** Selector de radio buttons que mapea a la entidad `suscripcion_suspension` (`Mora e Impago Recurrente tras 5 días de gracia`, `Infracción de Términos de Servicio`, `Solicitud Temporal del Propietario por Cierre/Remodelación`).
- **Justificación Obligatoria de Auditoría:** Campo de texto con validación mínima de 15 caracteres para asentar el sustento legal y administrativo del corte.
- **Canal de Despacho y Garantía de Preservación:** Checkbox para despachar aviso de corte formal por correo y callout de seguridad certificando que las comandas, mesas, recetas e inventarios permanecen 100% seguros y que la empresa puede reactivarse en 1 clic.

### Vista 2: Modal de Protocolo Legal de Baja Definitiva — Ley N° 29733 / RGPD (`wf_saas_02_modal_baja_legal.jpg`)
![Vista 2: Modal de Baja Definitiva Legal](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/assets/wf_saas_02_modal_baja_legal.jpg)
- **Ficha Legal y Encabezado Crítico:** Registro de *Pizzería Bella Napoli E.I.R.L.* solicitando desvinculación comercial voluntaria.
- **Cronograma Legal de 3 Fases:**
  - *Paso 1 (Corte y Solicitud):* Corte operativo de terminales y cancelación de cargos futuros en pasarela Stripe (`sub_1O8b2c4e5f6`).
  - *Paso 2 (Ventana Legal de Retención de 30 Días):* Del 11/10 al 10/11/2026, reversible en cualquier momento si el cliente desiste de la baja.
  - *Paso 3 (Purga y Anonimización al Día 31):* Ejecución del cron de saneamiento para destruir credenciales y anonimizar datos personales conforme a ley.
- **Derecho a la Portabilidad de Datos (Art. 19 Ley N° 29733):** Generación automática de archivo comprimido estándar `respaldo_portabilidad_EMP007_20261011.zip` (14.2 MB) con catálogo de platos, recetas, inventario, ventas y comprobantes XML/PDF, con botón de descarga y capability token por correo válido por 30 días.
- **Verificación de Seguridad Poka-Yoke:** Bloqueo estricto del botón de confirmación hasta que el operador digite el RUC exacto de 11 dígitos (`20519283019`), previniendo eliminaciones accidentales.

### Vista 3: Centro de Gestión de Suspensiones y Bajas Legales SaaS (`wf_saas_02_bandeja_bajas_suspensiones.jpg`)
![Vista 3: Bandeja de Suspensiones y Bajas](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/assets/wf_saas_02_bandeja_bajas_suspensiones.jpg)
- **4 Tarjetas de Métricas Especializadas:**
  - *Empresas Suspendidas:* `3 Cuentas` (desglosadas en 2 por mora y 1 por infracción).
  - *En Retención de Baja (30d):* `1 Cuenta` (indicando avance del día 12 de 30 y cuenta regresiva de 18 días para purga).
  - *MRR en Pausa / Afectado:* `S/ 747.00` mensuales en riesgo de pérdida pero recuperables tras cobro.
  - *Respaldos de Portabilidad:* `100%` de cumplimiento legal (1 de 1 con ZIP generado).
- **Control y Gestión Contextual:** Grilla con badges diferenciados (`🚫 Suspensión Temporal`, `⏸ Pausa Solicitada`, `⏳ Pendiente de Baja`), ID de auditoría correlativo (`SUS-0042`, `BAJ-004`) y acciones directas:
  - `[ ↺ Reactivar Empresa ]`: Levantamiento de suspensión en 1 solo clic.
  - `[ ↺ Cancelar Baja ]`: Cancelación del protocolo legal dentro de los 30 días.
  - `[ 📦 Backup ZIP ]` y `[ ✉ Enlace ]`: Acceso y reenvío de paquetes de portabilidad.

### Vista 4: Pantalla de Bloqueo de Acceso para el Tenant (`wf_saas_02_pantalla_bloqueo_tenant.jpg`)
![Vista 4: Pantalla de Bloqueo del Tenant](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-02-baja-suspension-empresa/assets/wf_saas_02_pantalla_bloqueo_tenant.jpg)
- **Diseño Empático de Seguridad (HTTP 403 Forbidden):** Card centrado con icono de candado `🔒` y badge "Servicio Temporalmente Suspendido".
- **Información Transparente del Incidente:** Razón social del restaurante (*El Tenedor Gourmet S.A.C.*), RUC, sede y explicación clara informando que el período de gracia oficial de 5 días concluyó sin registro de pago exitoso.
- **Certificación de Indemnidad de Datos:** Mensaje tranquilizador confirmando que las cartas, mesas, clientes y ventas históricas están 100% protegidas y no han sido borradas.
- **Canal Exclusivo de Asistencia Directa:** Botón verde destacado `[ 💬 Contactar a Soporte por WhatsApp (+51 930 723 537) ]` que enlaza a WhatsApp con mensaje prellenado y el código de soporte `#SUS-0042`, con atención de Tesorería de 08:00 a 22:00 hrs y reactivación garantizada en menos de 5 minutos.
---

## 80. Vistas Wireframe y Arquitectura de `CU-SAAS-03: Configurar Planes de Suscripción`

Se diseñaron, renderizaron y validaron 4 vistas en resolución canónica (1440x900, JPG calidad 95) ubicadas en [`wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/), implementando la gestión centralizada de planes comerciales bajo una estricta política de **Cero Roturas**:

### Vista 1: Catálogo y Gestión de Planes SaaS (`wf_saas_03_catalogo_planes.jpg`)
![Vista 1: Catálogo y Gestión de Planes](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/wf_saas_03_catalogo_planes.jpg)
- **Barra de Navegación y URL Canónica:** Encabezado con badge `CONSOLA ADMIN SAAS`, indicador `Admin Root` y ruta `https://admin.restaurantcloud.pe/saas/planes`.
- **4 Tarjetas de Métricas:**
  - *Planes en Catálogo:* `3 Públicos + 1 B2B` (Starter, Pro, Enterprise y convenio Piloto B2B).
  - *Empresas Suscritas:* `48 Cuentas` en producción.
  - *MRR Total Catálogo:* `S/ 11,450.00` mensuales recurrentes.
  - *Plan Líder en Adopción:* `Plan Pro (54.2%)` con 26 restaurantes activos a S/ 249/mes.
- **Segmentación por Visibilidad:** Pestañas `[ Todos los Planes (4) ]`, `[ Públicos Web (3) ]` y `[ Privados / Ocultos B2B (1) ]`.
- **Línea Base del Catálogo:**
  - *Plan Starter:* S/ 99.00/mes (S/ 990/año), local único, 1 piso, **hasta 25 mesas**, hasta 5 usuarios, sin módulo de reservas ni IA.
  - *Plan Pro:* S/ 249.00/mes (S/ 2,490/año), hasta 3 sedes, 2 pisos, 30 mesas, 15 usuarios, reservas, Menú Engineering y Asistente IA.
  - *Plan Enterprise:* S/ 499.00/mes (S/ 4,990/año), hasta 10 sedes, 5 pisos, 60 mesas, 40 usuarios, suite completa y Predicción de Demanda IA.
  - *Piloto Cadenas B2B:* Plan bonificado privado (`visible_publico = false`) para convenios de franquicias.

### Vista 2: Modal de Configuración y Edición de Plan (`wf_saas_03_modal_editar_plan.jpg`)
![Vista 2: Modal de Configuración y Edición de Plan](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/wf_saas_03_modal_editar_plan.jpg)
- **Formulario Compacto sin Scroll (860px):**
  - Nombre del plan, slug interno protegido (`plan-pro`), y descripción comercial.
  - Switch de visibilidad comercial (`visible_publico = true/false`) para decidir si se publica en el autoservicio Stripe Checkout (`CU-PROP-01`).
  - Tarifas en Soles con cálculo dinámico del beneficio anual (`✓ 2 Meses Gratis - 16.7%`).
  - Cuotas operativas cuantitativas (máx. locales, pisos, mesas, personal).
  - Switches para módulos: Reservas (`CU-ADMIN-10`), Reportes Avanzados (`CU-ADMIN-13`), Asistente IA y Predicción de Demanda IA.
- **Callout de Alerta de Impacto:** Avisa que el plan cuenta con 26 empresas activas y que se evaluará la política de propagación comercial antes de persistir los cambios.

### Vista 2B: Modal de Registro de Nuevo Plan (`wf_saas_03_modal_crear_plan.jpg`)
![Vista 2B: Modal de Registro de Nuevo Plan](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/wf_saas_03_modal_crear_plan.jpg)
- **Reutilización del Componente Polimórfico (`PlanFormModal`):** Mismo formulario con estado inicial limpio y placeholders orientadores.
- **Slug Reactivo:** El identificador (`plan-fast-food-express`) se autogenera en vivo en formato kebab-case a medida que se ingresa el nombre comercial.
- **Cero Fricción de Impacto:** Al partir con 0 empresas suscritas, el sistema no requiere abrir el modal de Grandfathering; se guarda y se registra automáticamente el nuevo `Product` y sus `Prices` en Stripe Billing de forma directa con el botón `[ ✓ Crear y Publicar Plan ]`.

### Vista 3: Modal de Impacto en Clientes Existentes — Grandfathering vs Propagación (`wf_saas_03_modal_impacto_clientes.jpg`)
![Vista 3: Modal de Impacto en Clientes Existentes](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/wf_saas_03_modal_impacto_clientes.jpg)
- **Tabla de Diferencias (*Diff Table*):** Valores anteriores tachados vs nuevos valores propuestos (ej. tarifa mensual S/ 249 $\rightarrow$ S/ 269; mesas 30 $\rightarrow$ 35).
- **Selector de Política Comercial:**
  - *Opción A (Recomendada — Grandfathering):* Aplica únicamente a nuevas contrataciones. Genera un nuevo Price en Stripe para futuros clientes de `CU-PROP-01`, conservando la tarifa y cuotas de las 26 empresas ya suscritas sin fricción comercial.
  - *Opción B (Propagación Global):* Aplica cuotas ampliadas de inmediato y programa el nuevo cobro para la próxima renovación en Stripe.
- **Garantía de Cero Roturas (*Zero-Breakage*):** Banner verde certificando que ningún restaurante supera los nuevos límites (la empresa con mayor uso actual tiene 28 mesas de 35 permitidas), garantizando que no se destruyen ni desactivan mesas o usuarios existentes.

### Vista 4: Modal de Protección y Desactivación Comercial de Plan (`wf_saas_03_modal_desactivar_plan.jpg`)
![Vista 4: Modal de Protección y Desactivación Comercial](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-03-configurar-planes/assets/wf_saas_03_modal_desactivar_plan.jpg)
- **Alerta de Bloqueo de Borrado Físico (DELETE RESTRICT):** Informa que el plan cuenta con 26 empresas activas y 142 pagos registrados, prohibiendo el borrado físico para preservar la integridad ACID.
- **Acción Segura de Desactivación Comercial (`activo = false`):** Oculta el plan de la web de precios y de `CU-PROP-01`, pero garantiza que las empresas existentes sigan operando y renovando en Stripe sin interrupción alguna, con reversibilidad en un clic.
