# **RestaurantCloud AI**

Documento de Casos de Uso — Versión Consolidada Final *Levantamiento de requerimientos: actores, roles y casos de uso*

# Índice de actores

- Administrador SaaS
- Propietario del restaurante
- Administrador del local
- Mozo
- Cocina
- Cajero
- Cliente
- Casos de uso transversales / del sistema

# 1. Administrador SaaS

### CU-SAAS-01: Supervisar empresas registradas, activaciones y renovaciones de suscripción

**Actor(es):** Administrador Global SaaS (`admin_saas`)

**Precondiciones:** Sesión activa como administrador global de la plataforma (`rol = 'admin_saas'`, `empresa_id = NULL`, `local_id = NULL`). Existen restaurantes registrados vía autoservicio Stripe ([`CU-PROP-01`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/wireframe.md)) o altas corporativas manuales.

#### Flujo principal

1. El administrador SaaS accede a la consola central de supervisión de empresas (`GET /api/v1/saas/tenants`).
2. El sistema aplica bypass de Row-Level Security (RLS) y renderiza el panel de control con 4 KPIs estratégicos:
   - **Total Empresas:** Base instalada global y variación neta mensual (MRR total).
   - **Suscripciones Activas:** Empresas al día con cobros consolidados en Stripe o transferencias B2B.
   - **En Período de Gracia:** Empresas con renovación en reintento dentro de la ventana de 5 días (ingresos en riesgo).
   - **Sedes Operativas Conectadas:** Total de locales físicos activos en la plataforma y promedio de sedes por cliente.
3. El administrador filtra por pestañas (`[Todos]`, `[Activos]`, `[En Gracia]`, `[Suspendidos]`, `[Baja]`) o busca por RUC, razón social o nombre comercial en tiempo real.
4. El administrador puede inspeccionar el **Expediente 360°** de cualquier empresa (`GET /api/v1/saas/tenants/:id`):
   - Identidad de la empresa y titular resuelta 100% de la base de datos interna (`empresa.razon_social`, `empresa.ruc`, derivación de tipo `RUC 20 — Persona Jurídica` o `RUC 10`, dirección de sede principal `local.direccion`, teléfono y correo).
   - Semáforo operativo en plataforma (`● Cuenta Activa & Operativa`, `⚠️ En Período de Gracia`, `🚫 Suspendida`) sin llamadas a APIs externas.
   - Contrato SaaS y referencias a Stripe (`customer_id`, `subscription_id`, método de pago, días de gracia restantes).
   - Historial de transacciones de la tabla `pago` (cargos exitosos y cobros fallidos sincronizados vía webhooks).
   - Uso de recursos en tiempo real vs límites del plan (locales, mesas y usuarios de personal).
5. Ante cobros fallidos en período de gracia, el administrador puede despachar recordatorios de cobro por correo electrónico con enlace directo para actualización de tarjeta en Stripe.
6. **Alta Manual de Clientes Corporativos B2B (`POST /api/v1/saas/tenants/alta-manual`):**
   - El administrador pulsa `[ ➕ Nueva Alta Manual ]`.
   - Ingresa el RUC de 11 dígitos, validado localmente con el algoritmo matemático Módulo 11 (garantizando dígito verificador correcto sin consultar APIs externas), la Razón Social y la Dirección de la sede principal.
   - Digita los datos del propietario (nombre, teléfono y correo electrónico corporativo).
   - Selecciona el Plan contratado y el ciclo de facturación (mensual o anual).
   - **Registro de Pago Verificado Obligatorio:** Registra el monto en PEN, medio de pago bancario (Transferencia BCP/BBVA, Depósito, Yape Empresa), número de constancia/operación y nota administrativa de respaldo.
   - Al confirmar, el sistema ejecuta una transacción atómica insertando la empresa, sede principal, suscripción, usuario propietario y el pago en la tabla `pago` con estado `exitoso`.
   - El sistema genera un capability token criptográfico (TTL 72 horas) y despacha automáticamente un correo de bienvenida para que el titular establezca su contraseña e inicie el aprovisionamiento de su restaurante.

#### Flujos alternativos

- No existen empresas en período de gracia ni cobros pendientes al filtrar → El sistema presenta el estado vacío orientador con escudo de solvencia (`wf_saas_01_estado_vacio.jpg`).
- El RUC ingresado en el alta manual no cumple con el algoritmo Módulo 11 → El sistema emite advertencia bloqueante en el formulario impidiendo el registro hasta ingresar un RUC matemáticamente válido.
- Se intenta registrar un alta manual con monto S/ 0.00 o sin número de operación bancaria → Validación estricta impidiendo el registro, garantizando que todo tenant activo posea respaldo económico en la tabla `pago`.
- Una empresa en período de gracia alcanza el día 6 sin regularizar el cobro → El sistema ejecuta la suspensión automática del tenant (`CU-SAAS-02`), inhabilitando el acceso a sus terminales de salón.

**Postcondiciones:** Base de datos de tenants auditada en tiempo real; expedientes actualizados con datos relacionales nativos; altas corporativas B2B creadas con pago inmutable en `pago` y propietario invitado vía capability token.

### CU-SAAS-02: Dar de baja / suspender empresa conforme a ley (Protocolo Legal y Retención de 30 Días)

**Actor(es):** Administrador Global SaaS (`admin_saas`)

**Precondiciones:** El usuario cuenta con sesión activa autenticada con rol `admin_saas`. Existe un tenant registrado en el sistema en estado `activa` o en `periodo_gracia` ([`CU-PROP-01`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/wireframe.md), [`CU-SAAS-01`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/wireframe.md)).

#### Flujo principal

1. El administrador SaaS accede al Centro de Bajas y Suspensiones (`GET /api/v1/saas/tenants/bajas-suspensiones`) o selecciona la opción desde el Expediente 360° de la empresa en `CU-SAAS-01`.
2. El sistema distingue operativamente dos rutas de acción formal:
   - **Ruta A: Suspensión Preventiva / Temporal (`POST /api/v1/saas/tenants/:id/suspender`):**
     a. El administrador abre el Modal de Suspensión Inmediata (`wf_saas_02_modal_suspension.jpg`).
     b. Selecciona el motivo canónico: `Mora e Impago Recurrente` (tras agotar los 5 días de gracia de [`CU-PROP-02`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-02-gestionar-suscripcion/wireframe.md)), `Infracción de Términos de Servicio` o `Solicitud Temporal del Propietario` (cierre temporal por remodelación).
     c. Ingresa la justificación administrativa obligatoria ($\ge 15$ caracteres) para auditoría.
     d. Marca la opción para notificar automáticamente al titular por correo electrónico y pulsa `[ ⚠️ Confirmar Suspensión Inmediata ]`.
     e. El sistema ejecuta una transacción atómica que crea un registro en la entidad dedicada `suscripcion_suspension` (`tipo_evento = 'suspension_temporal'`), actualiza `empresa.estado = 'suspendida'`, y revoca inmediatamente las sesiones y tokens JWT en Redis.
     f. **Preservación Inmutable:** Los datos históricos (comandas, cartas, clientes, comprobantes e inventarios) permanecen 100% intactos y seguros.
     g. Cualquier terminal POS o usuario del restaurante que intente operar recibe un error `403 Forbidden` y visualiza la Pantalla de Bloqueo Informativa (`wf_saas_02_pantalla_bloqueo_tenant.jpg`), orientando a contactar al Soporte Oficial vía WhatsApp (`+51 930 723 537`).
   - **Ruta B: Baja Definitiva de Empresa conforme a Ley N° 29733 / RGPD (`POST /api/v1/saas/tenants/:id/baja-legal`):**
     a. El administrador abre el Modal de Protocolo Legal de Baja (`wf_saas_02_modal_baja_legal.jpg`).
     b. El sistema exhibe el cronograma legal de 3 etapas: Paso 1 (Solicitud y corte inmediato), Paso 2 (Ventana de Retención Legal Obligatoria de 30 días, reversible) y Paso 3 (Purga y anonimización definitiva al día 31).
     c. **Derecho a la Portabilidad de Datos (Art. 19 Ley N° 29733):** El backend compila automáticamente un archivo comprimido estándar (`respaldo_portabilidad_EMPX_YYYYMMDD.zip`) con el catálogo de platos, recetas, inventario, ventas y comprobantes electrónicos XML/PDF emitidos, habilitando descarga directa para el administrador y emitiendo un capability token con vigencia de 30 días enviado por correo electrónico al titular.
     d. Cancela la suscripción periódica en Stripe (`sub_...`), asegurando que no se ejecuten cobros futuros ni cargos por mora en la tarjeta del titular.
     e. **Mecanismo de Seguridad Poka-Yoke:** El botón `[ Iniciar Protocolo Legal de Baja (30 Días) ]` permanece estrictamente bloqueado hasta que el administrador digite manualmente el RUC de 11 dígitos exacto de la empresa, previniendo bajas accidentales por error humano.
     f. Al confirmar, el sistema inserta el evento en `suscripcion_suspension` con `fecha_eliminacion_programada = NOW() + 30 días` y actualiza `empresa.estado = 'pendiente_baja'`.

#### Flujos alternativos

- **Reactivación en 1 Clic (`POST /api/v1/saas/tenants/:id/reactivar`):**
  1. Ante una regularización de pago o acuerdo comercial, el administrador SaaS pulsa `[ ↺ Reactivar Empresa ]` en la Bandeja de Suspensiones (`wf_saas_02_bandeja_bajas_suspensiones.jpg`).
  2. Ingresa la nota de reactivación y confirma.
  3. El sistema actualiza `suscripcion_suspension.estado = 'resuelta_reactivada'`, restaura `empresa.estado = 'activa'` y `suscripcion.estado = 'activa'`, elimina la clave de bloqueo en Redis y rehabilita inmediatamente todas las terminales sin pérdida alguna de información.
- **Cancelación de Protocolo de Baja dentro de los 30 días (`POST /api/v1/saas/tenants/:id/cancelar-baja`):** Si el propietario revoca su decisión de retiro dentro del período de retención legal de 30 días, el administrador SaaS cancela la baja, restableciendo la cuenta y reactivando la facturación.
- **Vencimiento de la Ventana de Retención (Día 31 — Purga Automática):** Un proceso automatizado en segundo plano (*cron job de saneamiento*) identifica registros con `fecha_eliminacion_programada <= NOW()`, anonimiza los datos de carácter personal de los usuarios, purga contraseñas y claves criptográficas, y actualiza el estado a `eliminada`, preservando exclusivamente los comprobantes de pago requeridos por SUNAT durante 5 años conforme al Código Tributario.
- **RUC no coincide en confirmación Poka-Yoke:** El sistema mantiene deshabilitado el botón de inicio de baja y muestra mensaje visual en rojo indicando discrepancia con el RUC de la empresa seleccionada.

**Postcondiciones:** Evento auditado e inmutable registrado en `suscripcion_suspension`; `empresa.estado` actualizado a `suspendida` o `pendiente_baja`; tokens de acceso revocados en Redis; paquete de portabilidad `.zip` emitido y despachado conforme a Ley N° 29733; suscripción periódica en Stripe cancelada en caso de baja; pantalla de corte con canal directo a WhatsApp (+51 930 723 537) activada para terminales del restaurante.

### CU-SAAS-03: Configurar planes de suscripción (Gestión de Tarifas, Cuotas y Cero Roturas)

**Actor(es):** Administrador Global SaaS (`admin_saas`)

**Precondiciones:** Sesión activa como administrador global de la plataforma (`rol = 'admin_saas'`, `empresa_id = NULL`, `local_id = NULL`). Existen planes base registrados en la tabla `plan` (Starter, Pro, Enterprise).

#### Flujo principal

1. El administrador SaaS accede a la consola de gestión de catálogo comercial (`GET /api/v1/saas/planes`).
2. El sistema recupera los planes activos y privados y renderiza el catálogo interactivo (`wf_saas_03_catalogo_planes.jpg`) con 4 KPIs estratégicos:
   - **Planes en Catálogo:** Total de planes (3 públicos + 1 privado B2B).
   - **Empresas Suscritas:** Base instalada global (48 restaurantes).
   - **MRR Total del Catálogo:** Ingresos mensuales consolidados (S/ 11,450.00).
   - **Plan Líder en Adopción:** Plan Pro con 26 empresas activas (54.2% de adopción).
3. La interfaz presenta las tarjetas comparativas con cuotas operativas y módulos:
   - **Plan Starter (S/ 99/mes — S/ 990/año):** 1 Local único, 1 Piso, **hasta 25 Mesas** de salón, hasta 5 cuentas de personal. Sin reservas (`incluye_reservas = false`), sin reportes avanzados ni IA.
   - **Plan Pro (S/ 249/mes — S/ 2,490/año):** Hasta 3 Locales, 2 Pisos por local, **hasta 30 Mesas** por local, hasta 15 cuentas de personal. Incluye Reservas ([`CU-ADMIN-10`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/administrador/CU-ADMIN-10-politicas-reservas/wireframe.md)), Menú Engineering y Asistente IA de Salón.
   - **Plan Enterprise (S/ 499/mes — S/ 4,990/año):** Hasta 10 Locales, 5 Pisos por local, **hasta 60 Mesas** por local, hasta 40 cuentas de personal. Incluye suite completa y **Predicción de Demanda IA**.
   - **Planes Privados / Ocultos (`visible_publico = false`):** Convenios B2B especiales o pilotos gastronómicos ocultos del registro web público ([`CU-PROP-01`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/propietario/CU-PROP-01-registro-empresa/wireframe.md)), asignables exclusivamente por el admin en altas manuales de [`CU-SAAS-01`](file:///j:/proyectos_git/RestaurantCloud_AI_backend/wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/wireframe.md).
4. El administrador puede crear un nuevo plan (`[ ➕ Crear Nuevo Plan ]`) o editar uno existente (`[ ✏️ Editar Plan ]`), desplegando el modal de configuración (`wf_saas_03_modal_editar_plan.jpg`):
   - Modifica tarifas en Soles (mensual y anual con descuento sugerido equivalente a 2 meses bonificados).
   - Ajusta cuotas operativas por sede (locales, pisos, mesas, personal).
   - Conmuta módulos del sistema mediante switches interactivos.
   - Define visibilidad comercial (`visible_publico = true/false`).
5. Al pulsar `[ Guardar Parámetros del Plan ]`, el backend ejecuta una evaluación previa de impacto (`POST /api/v1/saas/planes/:id/evaluar-impacto`):
   - Si el plan cuenta con empresas activas y se modificaron precios o cuotas, el sistema presenta el Modal de Decisión de Impacto (`wf_saas_03_modal_impacto_clientes.jpg`).
   - El administrador elige la política de propagación comercial:
     - **Opción A: Aplicar ÚNICAMENTE a Nuevas Contrataciones (Recomendado — Grandfathering):** Se respeta la tarifa y límites a los clientes vigentes. En Stripe Billing se genera un nuevo `Price` para compras futuras, manteniendo las suscripciones actuales intactas sin generar fricción ni cobros imprevistos.
     - **Opción B: Propagar a Empresas Existentes:** Las cuotas ampliadas rigen de inmediato. El ajuste de tarifa se programa para regir a partir de la próxima renovación mensual en Stripe (sin cobros retroactivos), notificando automáticamente por correo electrónico a los propietarios.
6. El sistema guarda los cambios en la base de datos y retorna la respuesta bajo el envoltorio `apiresponse.Response{Exito: true, Datos: {...}}`.

#### Flujos alternativos

- **Intento de Eliminación Física de Plan con Empresas Asociadas (Integridad ACID):**
  1. El administrador intenta borrar un plan que tiene empresas suscritas o historial en la tabla `pago`.
  2. El backend rechaza la solicitud retornando código HTTP `409 Conflict` con el error tipificado `ERR_PLAN_TIENE_EMPRESAS_ACTIVAS`.
  3. El frontend despliega el Modal de Protección (`wf_saas_03_modal_desactivar_plan.jpg`), explicando que el borrado físico está bloqueado por restricciones de clave foránea (`ON DELETE RESTRICT`) y canalizando a la acción segura de **Desactivación Comercial (`activo = false`)**.
  4. Al desactivar el plan, este se oculta inmediatamente del catálogo comercial de registro público, pero todas las empresas actuales continúan operando sus terminales de salón sin ninguna interrupción de servicio.
- **Reducción de Límites sin Destrucción de Recursos:** Si el administrador reduce la cuota de mesas o usuarios y la propaga a clientes existentes, el sistema **nunca elimina mesas ni expulsa personal preexistente**; los recursos existentes continúan funcionando y solo se bloquea la adición de nuevos ítems que superen la nueva cuota.
- **Eliminación Física Permitida (Planes Borrador):** Si el plan tiene `0` empresas asociadas y `0` registros en `pago`, el sistema permite el borrado físico (`DELETE /api/v1/saas/planes/:id`) previa confirmación.

**Postcondiciones:** Registro actualizado en la tabla `plan`; nuevo `Price` generado en Stripe Billing si aplica; suscripciones vigentes protegidas bajo política de Grandfathering o programadas para renovación; respuestas estandarizadas bajo `apiresponse.Response`.

### CU-SAAS-04: Monitorear salud de la plataforma (Pospuesto a Fase Futura / Backlog)

**Actor(es):** Administrador SaaS

**Precondiciones:** Ninguna.

#### Flujo principal

1. El administrador accede al panel de monitoreo global.
2. El sistema muestra métricas: empresas activas, uso de recursos por tenant, errores del sistema, consumo de servicios de IA.
3. El administrador filtra por empresa o rango de fechas si necesita profundizar.

#### Flujos alternativos

- Se detecta una anomalía (ej. consumo excesivo de un tenant) → el sistema genera alerta automática.

**Postcondiciones:** Ninguna (caso de uso de consulta).

### CU-SAAS-05: Consultar log de auditoría global (Pospuesto a Fase Futura / Backlog)

**Actor(es):** Administrador SaaS

**Precondiciones:** Ninguna.

#### Flujo principal

1. El administrador accede al módulo de auditoría global.
2. Filtra por empresa, usuario, tipo de acción o rango de fechas.
3. El sistema muestra el historial de eventos correspondiente.

**Postcondiciones:** Ninguna (consulta).

**Nota:** *Soporte técnico con acceso a datos operativos de un tenant queda diferido como requerimiento futuro.*

# 2. Propietario del restaurante

### CU-PROP-01: Registrar empresa y suscribirse (autoservicio)

**Actor(es):** Propietario del restaurante (usuario nuevo)

**Precondiciones:** El usuario accede al portal público de registro de RestaurantCloud AI.

#### Flujo principal

1. El usuario selecciona "Registrar mi negocio".
2. El sistema muestra los planes disponibles con identificadores numéricos (1: Starter, 2: Pro, 3: Enterprise) y cuotas de recursos.
3. El usuario selecciona el plan deseado y ciclo de facturación (mensual/anual).
4. El usuario ingresa los datos de su empresa: razón social, selector de identidad fiscal Perú (RUC 10 Persona Natural con Negocio o RUC 20 Persona Jurídica, validando exactamente 11 dígitos numéricos), correo y teléfono de contacto.
5. El sistema persiste temporalmente los datos en Redis (`registro:onboarding:<UUID>`, TTL 30 min) y envía un código OTP de 6 dígitos al correo del propietario.
6. El usuario ingresa el código OTP para verificar la validez de su buzón.
7. Validado el correo, el sistema presenta el formulario de pago seguro embebido de Stripe Elements.
8. El usuario ingresa su tarjeta; Stripe procesa el cobro y tokenización.
9. Al confirmar el cobro, el backend crea atómicamente la empresa, la suscripción inicial y la cuenta de usuario Propietario en PostgreSQL, liberando el estado temporal en Redis.
10. El sistema presenta la pantalla de registro exitoso mostrando: resumen del plan contratado, fecha del próximo ciclo, botón para descargar constancia de suscripción en PDF y canales de soporte de emergencia.
11. El sistema envía correo de bienvenida con credenciales iniciales de acceso.

#### Flujos alternativos

- El RUC ya existe en la plataforma → el sistema rechaza el alta e invita a iniciar sesión o recuperar contraseña.
- El código OTP es erróneo o expira → el sistema permite reenviar un nuevo código (máximo 3 intentos con enfriamiento de 60s).
- El pago en Stripe es rechazado (fondos insuficientes/CVC/3DS) → el sistema informa el motivo exacto y permite reintentar con otra tarjeta sin perder los datos ya digitados.

**Postcondiciones:** Empresa activa; suscripción registrada en Stripe y PostgreSQL; credenciales enviadas; constancia descargable en PDF.

### CU-PROP-02: Gestionar suscripción y método de pago

**Actor(es):** Propietario del restaurante

**Precondiciones:** El propietario tiene una sesión activa y una empresa con suscripción vinculada.

#### Flujo principal

1. El propietario accede a "Mi suscripción".
2. El sistema consulta y muestra: estado del plan, fecha del próximo cobro, medidores de consumo de los **4 recursos clave** (`locales`, `pisos`, `mesas`, `usuarios` en uso vs. límites máximos), método de pago predeterminado tokenizado e historial de pagos/facturas.
3. El propietario puede:
   - Descargar facturas en PDF de cualquier periodo anterior.
   - Actualizar su método de pago mediante modal seguro de Stripe Elements (`SetupIntent`) sin recargar la página.
   - Iniciar la solicitud de cambio de plan (enlaza con CU-PROP-03).

#### Flujos alternativos

- El cobro recurrente mensual falla en Stripe (Dunning) → el sistema activa un **periodo de gracia de 5 días** manteniendo la operativa del restaurante sin interrupciones, pero mostrando una alerta destacada al propietario con reintentos automáticos programados. Si no se regulariza tras el plazo, la empresa pasa a `estado = 'suspendida'` (CU-SAAS-02).
- El propietario actualiza su tarjeta teniendo una factura impaga → el sistema reintenta el cobro de inmediato contra Stripe; si es exitoso, regulariza el estado a `activa` automáticamente y desactiva la alerta.

**Postcondiciones:** Método de pago actualizado o comprobantes descargados; regularización de estado en caso de cobro pendiente.

---

### CU-PROP-03: Cambiar plan de suscripción

**Actor(es):** Propietario del restaurante

**Precondiciones:** La empresa está activa y tiene una suscripción vigente.

#### Flujo principal

1. El propietario accede a "Cambiar Plan" desde su panel de suscripción.
2. El sistema despliega la tabla comparativa de planes contrastando el uso real del restaurante con las cuotas de los 4 recursos (`locales`, `pisos`, `mesas`, `usuarios`) y módulos de IA.
3. El propietario selecciona un plan destino.
4. **Si es Upgrade (Plan superior):**
   - El sistema consulta a Stripe el prorrateo financiero exacto (`POST /simular-upgrade`).
   - Muestra un modal con el desglose transparente: crédito a favor por días no usados del plan actual, costo proporcional del nuevo plan por los días restantes y monto neto a cobrar hoy.
   - El propietario confirma y el sistema procesa el cargo inmediato en Stripe, habilitando las nuevas cuotas y módulos de IA en tiempo real.
5. **Si es Downgrade (Plan inferior):**
   - El sistema garantiza que no se restrinja el mes que ya pagó, programando el cambio para el fin del periodo de facturación actual.
   - Si los recursos actuales superan los límites del nuevo plan, se activa el **Asistente de Conciliación de Recursos (Wizard de 4 pasos)**:
     - *Paso 1 (Locales):* Elige qué local(es) mantendrá activo(s).
     - *Paso 2 (Pisos):* Elige qué piso(s) del local activo conservará operativos.
     - *Paso 3 (Mesas):* Selecciona las mesas que continuarán en atención dentro del cupo del nuevo plan.
     - *Paso 4 (Personal):* Selecciona qué cuentas de usuarios staff mantendrán acceso (la cuenta Propietario siempre permanece protegida).
   - Se aplica una **política de preservación no destructiva (*soft-archiving*)**: los excedentes se marcarán como `inactivo` al momento de la renovación sin jamás eliminar (`DELETE`) pedidos ni ventas pasadas.
   - Se activa la **política de congelamiento preventivo de creación**: no se permite crear nuevos recursos por encima del tope del plan futuro.
   - Se muestra un banner informativo persistente con la fecha de cambio y opción de cancelación.

#### Flujos alternativos

- El propietario se arrepiente del downgrade antes de la fecha de corte → hace clic en "Cancelar cambio programado"; el sistema libera la programación en Stripe y restaura su plan actual indefinidamente.
- El ciclo renueva y no se completó la conciliación de recursos → la suscripción pasa a estado `pendiente_ajuste` y despliega un gate de selección operativa al Propietario antes de permitir nuevas comandas.

**Postcondiciones:** Plan actualizado de inmediato con cobro prorrateado (Upgrade) o programado al fin del ciclo con conciliación de recursos preservada (Downgrade).

### CU-PROP-04: Registrar y administrar locales

**Actor(es):** Propietario del restaurante

**Precondiciones:** La empresa está activa; el número de locales no excede el límite del plan (`max_locales`).

#### Flujo principal

1. El propietario accede a "Mis locales".
2. Selecciona "Registrar nuevo local".
3. El sistema despliega el **Asistente de Registro en 2 Pasos (Wizard)**:
   - **Paso 1 (Datos de la Sede, Dirección Web & Supervisión):**
     - Ingresa datos comerciales: nombre del local, dirección física, distrito, ciudad (Lima/Perú) y teléfono de contacto.
     - **Configura la dirección web de la carta digital (`slug`):** El sistema autogenera reactivamente en memoria la dirección web combinando `slugify(nombre) + "-" + slugify(distrito)` y comprueba su disponibilidad inicial en segundo plano contra la base de datos (`UNIQUE(slug)`). Si el usuario desea personalizarla, edita el campo libremente y presiona el botón `[ 🔍 Comprobar Disponibilidad ]`, evitando consultas repetitivas por cada pulsación de teclado. Si existe colisión, el sistema ofrece una alternativa disponible con 1 clic (ej. `nombre-distrito-2`).
     - Elige el modo de supervisión: auto-administración directa por el Propietario (por defecto, no consume cupos adicionales de personal) o asignación de un administrador de local existente.
     - Presiona `[ Siguiente: Elegir Giro ]` (el frontend valida que la dirección web esté comprobada y disponible antes de habilitar el avance).
   - **Paso 2 (Giro Gastronómico & Plantilla Inicial):**
     - El sistema despliega 4 tarjetas visuales interactivas:
       - `🍗 Pollería & Brasas`: Inicializa categorías de carta típicas e insumos clave (pollo entero, papas, aderezos, carbón).
       - `🐟 Cevichería & Mariscos`: Inicializa categorías marinas e insumos clave (pescado blanco, mariscos, limón, choclo).
       - `🥢 Chifa & Comida China`: Inicializa categorías chifa e insumos clave (pechuga, arroz extra, sillao, wantán, kion).
       - `⚪ Totalmente en Blanco`: Crea el local limpio sin categorías ni insumos para personalización total desde cero.
     - El sistema informa que, en todos los casos, se creará el ambiente inicial "Salón Principal" (cuadrícula modular de 5x3) listo para estructurar mesas (`CU-ADMIN-01`).
4. El propietario presiona `[ Crear y Activar Sede ]`.
5. El sistema valida atómicamente que no se exceda la cuota de locales activos del plan (`max_locales`).
6. El sistema ejecuta una **transacción atómica de aprovisionamiento**:
   - Inserta la sede en estado `activo` con su dirección web única (`slug`), zona horaria fija `America/Lima`, moneda `PEN - S/`, `giro_negocio`.
   - Inserta el piso inicial "Salón Principal" (5 columnas x 3 filas).
   - Si se seleccionó un giro gastronómico (`polleria`, `cevicheria`, `chifa`): inserta sus categorías de carta predefinidas y sus insumos de inventario calibrados con las 10 unidades limpias.
7. El sistema confirma la creación y actualiza el directorio de sedes. El propietario puede editar los datos comerciales o desactivar/reactivar locales existentes.

#### Flujos alternativos

- Se excede el límite del plan (`max_locales`) → el sistema bloquea el registro e invita a realizar upgrade (`CU-PROP-03`).
- Existe un downgrade programado con tope inferior → el sistema aplica la política de congelamiento preventivo y bloquea la creación hasta cancelar el downgrade.
- La dirección web elegida (`slug`) ya está ocupada por otra sede en la plataforma → el sistema bloquea el avance (`LOCAL_SLUG_DUPLICADO`), sugiere una alternativa disponible y requiere que el usuario la adopte o ingrese una dirección libre.
- Se intenta desactivar el único local activo de la empresa → el sistema bloquea la acción (*"Una empresa activa debe contar con al menos una sede operativa"*).
- Se intenta dar de baja un local con actividad operativa en curso (**Bloqueo Duro**) → el sistema audita en tiempo real: si existen cajas abiertas (`cajas_abiertas > 0`) o comandas pendientes en salón (`pedidos_activos > 0`), la desactivación queda estrictamente bloqueada hasta que el personal cierre los turnos y facture las órdenes pendientes.
- Si no hay actividad operativa en curso → el sistema solicita confirmación de seguridad y conmuta la sede a `estado = 'inactivo'` (*soft-deactivation*), preservando el 100% del historial de ventas y comandas.

**Postcondiciones:** Local creado con su dirección web única (`slug`), giro gastronómico registrado (`giro_negocio`), piso base ("Salón Principal") y catálogos iniciales aprovisionados (o en blanco); histórico preservado en desactivaciones.

---

### CU-PROP-05: Crear y gestionar administradores de local

**Actor(es):** Propietario del restaurante

**Precondiciones:** Existe al menos una sede activa registrada en la empresa.

#### Flujo principal

1. El propietario accede al módulo "Administradores de Local" desde su panel de personal.
2. Selecciona "Invitar Administrador de Local".
3. Ingresa datos del nuevo administrador: nombre completo, correo electrónico corporativo o personal y selecciona la sede titular a supervisar.
4. El sistema valida la regla de **1 Administrador Titular por Sede** (mostrando sedes disponibles) y verifica que no se sobrepase la cuota de usuarios del plan (`max_usuarios`).
5. El sistema crea el usuario en estado `pendiente_activacion` y genera un token criptográfico de activación en Redis (`invitacion:admin:<token>`, TTL 24 horas).
6. El sistema envía un correo al nuevo administrador con un enlace seguro (Magic Link) para que cree su contraseña personal (`CU-AUTH-02`), evitando el envío de credenciales en texto plano.
7. Al activar su cuenta, el administrador pasa a estado `activo` y asume la supervisión exclusiva de su sede asignada.
8. El propietario puede reasignar la sede titular de un administrador existente, reenviar la invitación o desactivar credenciales.

#### Flujos alternativos

- Se alcanza la cuota máxima de cuentas de personal (`max_usuarios`) → el sistema bloquea la invitación y sugiere ampliar el plan (`CU-PROP-03`).
- La sede seleccionada ya cuenta con un administrador titular → el sistema advierte que el titular actual será desvinculado de esa sede.
- El correo ingresado ya pertenece a un empleado de la empresa (mozo, cajero, cocina) → el sistema ofrece el diálogo de **Promoción de Rol** para transferirlo a Administrador de Local sin crear cuentas duplicadas.
- La invitación expira (> 24 horas) → el badge cambia a "Invitación expirada" y el propietario puede pulsar `[ Reenviar Enlace ]` (con enfriamiento de 60s).
- El propietario desactiva a un administrador → el sistema actualiza su estado a `inactivo` y revoca inmediatamente sus sesiones activas añadiendo el token JWT a la lista negra en Redis.

**Postcondiciones:** Administrador invitado/activado mediante enlace seguro; sede titular asignada (regla 1:1); cupos de personal auditados; sesiones revocables en tiempo real.

### CU-PROP-06: Ver incidentes de la empresa

**Actor(es):** Propietario del restaurante

**Precondiciones:** La empresa está activa y existen locales registrados; el propietario cuenta con sesión activa.

#### Flujo principal

1. El propietario accede a "Incidentes" desde el menú de supervisión corporativa.
2. El sistema presenta la bandeja consolidada multi-sede con métricas KPI ejecutivas: *No revisados por mí*, *Gravedad alta en curso* y *Total acumulado del mes*, junto con la tabla de incidentes de todas las sedes.
3. El propietario filtra ágilmente por sede específica, nivel de gravedad (`alta`, `media`, `baja`), categoría (`seguridad_higiene`, `disciplinario`, `rotura_merma`, `servicio_cliente`, `caja_dinero`, `otro`), estado operativo (`abierto`, `en_revision`, `resuelto`) o activa el filtro rápido *"Solo no revisados por mí"*.
4. El propietario selecciona un incidente para inspeccionar su detalle y evidencia fotográfica adjunta.
5. **Marcado Automático de Lectura:** Al abrir el detalle, el backend actualiza de forma transparente e inmediata el acuse de lectura (`visto_por_propietario = true` y `fecha_visto = NOW()`), exhibiendo en la interfaz el badge *"Visto por propietario hoy a las HH:mm"*, reduciendo el contador de pendientes sin clics manuales innecesarios.
6. El propietario evalúa la gravedad y descripción de los hechos:
   - **Toma de conocimiento (Solo lectura):** Si la sede ya adoptó las medidas correctivas pertinentes, presiona `[ Cerrar ]`; el incidente permanece con su estado operativo original.
   - **Intervención y Directiva Ejecutiva:** Si requiere seguimiento prioritario, el propietario presiona `[ Poner en Revisión ]`, redacta una directiva u observación (`nota_propietario`) y confirma la acción. El sistema actualiza el estado a `en_revision` y notifica al Administrador de la sede asignada.

#### Flujos alternativos

- Se registra un incidente de **gravedad alta** en cualquier sede mientras el propietario tiene la sesión abierta → el sistema emite una alerta reactiva en vivo vía Server-Sent Events (SSE) y despliega un banner sonoro/visual prioritario en la cabecera.
- El administrador de sede resuelve el incidente en simultáneo mientras el propietario lo visualiza → el sistema actualiza el estado a `resuelto` en tiempo real y bloquea el paso a `en_revision`, informando que la sede ya subsanó el hecho.
- No existen incidentes pendientes bajo los filtros aplicados → el sistema presenta el estado vacío positivo confirmando que todas las novedades operativas han sido revisadas.

**Postcondiciones:** Incidente marcado automáticamente como leído por el propietario; directiva ejecutiva opcionalmente registrada y estado actualizado a `en_revision`; trazabilidad íntegra preservada.

---

### CU-PROP-07: Ver reportes consolidados de la empresa (Pospuesto a Fase Futura / Backlog)

**Actor(es):** Propietario del restaurante

**Precondiciones:** La empresa tiene al menos un local con actividad registrada.

#### Flujo principal

1. El propietario accede a "Reportes" a nivel empresa.
2. Selecciona tipo de reporte (ventas, inventario, incidentes, auditoría) y rango de fechas/locales a incluir.
3. El sistema genera el reporte consolidado (todos los locales o los seleccionados).
4. El propietario exporta el reporte en PDF o Excel.

#### Flujos alternativos

- El plan no incluye reportes avanzados (Starter) → el sistema muestra solo métricas básicas y sugiere upgrade.

**Postcondiciones:** Reporte generado/exportado.

---

### CU-PROP-08: Ver predicciones de demanda a nivel empresa (Pospuesto a Fase Futura / Backlog)

**Actor(es):** Propietario del restaurante

**Precondiciones:** El plan de la empresa incluye el módulo de predicción (Pro/Enterprise); existe historial de ventas suficiente.

#### Flujo principal

1. El propietario accede al módulo "Predicción".
2. Selecciona local(es) y horizonte de tiempo (ej. próximo fin de semana).
3. El sistema muestra la demanda estimada y recomendaciones de inventario asociadas.

#### Flujos alternativos

- El plan no incluye este módulo (Starter) → el sistema muestra pantalla de upgrade.
- No hay suficiente historial de datos → el sistema informa que la predicción aún no es confiable.

**Postcondiciones:** Ninguna (consulta).

---

### CU-PROP-08 (Antiguo): Configurar políticas generales de la empresa (Omitido / Absorbido)

> [!NOTE]
> **Caso de Uso Omitido por Descentralización Arquitectónica:** En el diseño inicial se planteaba una plantilla centralizada de carta base y bloqueo de precios a nivel empresa. No obstante, por la realidad de la industria gastronómica (cada sede opera con costos de abastecimiento, alquiler, competencia y márgenes distintos), sus responsabilidades fueron descentralizadas y resueltas de forma ágil en:
> 1. **Carta base y giro comercial:** Resueltos en [`CU-PROP-04`](#cu-prop-04-registrar-y-administrar-locales) mediante el selector `giro_negocio` (`polleria`, `cevicheria`, `chifa`, `en_blanco`), que inicializa automáticamente los insumos, categorías y recetas por sede sin requerir plantillas abstractas.
> 2. **Políticas de reservas:** Descentralizadas en [`CU-ADMIN-10`](#cu-admin-10-configurar-políticas-y-parámetros-de-reservas-de-mesas) (tabla `politicas_reserva` por `local_id`).
> 3. **Políticas de promociones:** Descentralizadas en [`CU-ADMIN-17`](#cu-admin-17-gestionar-promociones) (promociones autónomas por sede).
> 4. **Parámetros operativos de KDS:** Descentralizados en [`CU-ADMIN-18`](#cu-admin-18-configurar-parámetros-operativos-de-comanda-y-tiempos-de-kds) (tabla `configuracion_kds`).
> 5. **Métodos de pago y comisiones:** Descentralizados en [`CU-ADMIN-19`](#cu-admin-19-configurar-métodos-de-pago-y-comisiones-de-cobro-del-local) (tabla `metodo_pago_local`).
> 6. **Límites de empresa:** Gobernados por el plan SaaS en [`CU-PROP-02`](#cu-prop-02-gestionar-suscripción-y-método-de-pago) y [`CU-PROP-03`](#cu-prop-03-cambiar-plan-de-suscripción) mediante las tablas `plan` y `suscripcion`.

# 3. Administrador del local

### CU-ADMIN-01: Gestionar plano de mesas

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo y el usuario tiene rol `admin_local` asignado a dicha sede.

#### Flujo principal

1. El administrador accede al módulo "Plano de Mesas".
2. El sistema presenta la cuadrícula modular expandible del salón organizada por pestañas de ambientes (ej. `[ Salón Principal ]`, `[ Terraza Exterior ]`, `[ + Nuevo Ambiente ]`), junto con el medidor de consumo de mesas respecto al plan de la empresa (`max_mesas`).
3. Para estructurar las dimensiones físicas y las mesas del salón, el administrador puede:
   - **Expandir o recortar la cuadrícula del salón:** Usar `[+ Columna]` / `[+ Fila al Fondo]` para agrandar el espacio, o `[- Columna]` / `[- Quitar Fila]` para recortar columnas o filas vacías agregadas por error.
   - **Usar el Generador Rápido en Lote (Recomendado para nuevos salones):** Ajusta los controles deslizantes de columnas y filas con cálculo automático en vivo (ej. `5 col × 2 filas = 10 MESAS`), rango de numeración correlativa, capacidad estándar (`👤 x 4`), forma geométrica (`cuadrada`, `redonda`, `rectangular`) y si permite unión grupal. El sistema distribuye automáticamente las mesas en orden sobre la cuadrícula.
   - **Crear mesa individualmente con Mini-Mapa:** Toca directamente una ranura libre `[+]` en el plano o pulsa `[+ Mesa Individual]`, seleccionando de forma gráfica la celda deseada en el mini-mapa del salón, con correlativo sugerido automáticamente.
4. El administrador puede tocar cualquier mesa de la grilla para abrir el panel lateral de edición rápida (Quick-Drawer) y modificar su número, forma, capacidad o conmutar si `permite_union`.
5. El sistema guarda los cambios en tiempo real y mantiene la grilla sincronizada.

#### Flujos alternativos

- Se supera el límite de mesas o pisos contratados en el plan (`max_mesas`, `max_pisos`) → el sistema bloquea la creación y despliega una alerta amigable invitando a coordinar una ampliación con el Propietario.
- Se intenta recortar o eliminar una columna o fila que contiene mesas (**Bloqueo de Seguridad de Cuadrícula**):
  - Si el usuario presiona `[- Columna]` y la última columna contiene mesas activas → el backend rechaza la operación con código `409 Conflict (ERR_COLUMNA_CON_MESAS)`, notificando: *"No se puede eliminar la columna porque contiene mesas activas. Reubícalas o desactívalas primero."*
  - Si el usuario presiona `[- Quitar Fila]` y la última fila contiene mesas activas → el backend rechaza con `409 Conflict (ERR_FILA_CON_MESAS)`.
  - Solo se permite la reducción si la columna o fila a eliminar no tiene mesas registradas (espacio vacío).
- Se intenta desactivar una mesa con comandas o pedidos abiertos en curso (**Bloqueo Duro**) → el sistema audita la actividad en tiempo real; si la mesa tiene comensales atendiendo una cuenta abierta o platos en preparación, la desactivación queda estrictamente bloqueada hasta liquidar o anular la comanda en Caja.
- Se intenta ingresar un número de mesa ya existente en el mismo ambiente → el sistema rechaza la duplicidad e indica el conflicto.
- No existen mesas registradas en el local (primer ingreso) → el sistema despliega el estado de bienvenida guiado (Onboarding) orientando al administrador a usar el Asistente Rápido.

**Postcondiciones:** Dimensiones de cuadrícula del salón (`columnas`, `filas`) y mesas configuradas; mesas dadas de baja se conservan en estado `inactiva` para auditoría histórica de ventas (borrado físico prohibido).

### CU-ADMIN-02: Gestionar categorías de la carta

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo y el usuario tiene rol `admin_local` asignado a dicha sede.

#### Flujo principal

1. El administrador accede al módulo "Categorías" dentro de la sección Carta.
2. Si el local fue registrado con una plantilla gastronómica en `CU-PROP-04` (Pollería, Cevichería o Chifa), el sistema presenta el directorio con las secciones base ya aprovisionadas. Si se creó "En Blanco", se muestra el estado de bienvenida guiando a crear su primera sección.
3. El directorio presenta las tarjetas métricas clave (*Categorías Activas*, *Total Productos en Carta*, *Categorías sin Platos*) y la tabla ordenada por posición (`orden ASC`).
4. Para estructurar y mantener las secciones de la carta, el administrador puede:
   - **Crear categoría individualmente:** Presiona `[ + Nueva Categoría ]` e ingresa: nombre descriptivo (ej. "Pastas Artesanales"), orden de presentación deseado y switch de visibilidad (`activa = true/false`).
   - **Reordenar categorías:** Modifica la posición mediante el control de ordenamiento visual (`≡` / subir / bajar); el sistema actualiza el atributo `orden` atómicamente, impactando el orden de las pestañas en la comanda móvil de los mozos y la carta digital.
   - **Pausar o conmutar visibilidad:** Desactiva una categoría mediante su switch sin borrarla (útil para menús de temporada o turnos de horario), ocultándola temporalmente de la comanda de los mozos.
5. El sistema guarda los cambios en tiempo real y mantiene la carta sincronizada.

#### Flujos alternativos

- Se intenta ingresar un nombre de categoría ya existente en el mismo local (comparación `LOWER(nombre)`) → el sistema rechaza la duplicidad e indica el conflicto (`ERR_CATEGORIA_DUPLICADA`).
- Se intenta eliminar una categoría que contiene productos vinculados (**Bloqueo de Seguridad y Reasignación Asistida**):
  - El backend audita: `SELECT COUNT(*) FROM producto WHERE categoria_id = :id AND local_id = :admin_local_id`.
  - Si el conteo es mayor a cero, la eliminación directa se bloquea con código `409 Conflict (ERR_CATEGORIA_CON_PRODUCTOS)`.
  - El sistema despliega el modal de protección informando los platos en conflicto y habilitando la opción asistida: *"Mover estos X productos a otra categoría y eliminar la actual"*, ejecutando la reasignación y el borrado en una sola transacción atómica (`POST /api/v1/admin/categorias/{id}/reasignar-y-eliminar`).
- La categoría no tiene productos asociados (conteo = 0) → el sistema solicita confirmación simple y procede con la eliminación inmediata.
- No existen categorías registradas en el local (primer ingreso) → el sistema despliega la pantalla de bienvenida (Onboarding) orientando al administrador a cargar una Plantilla Gastronómica o crear su primera categoría.

**Postcondiciones:** Catálogo de categorías del local actualizado con su orden visual; visibilidad sincronizada en comandas de salón.

### CU-ADMIN-03: Gestionar catálogo de insumos de inventario

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo y el usuario tiene rol `admin_local` asignado a dicha sede.

#### Flujo principal

1. El administrador accede al módulo "Inventario" → "Catálogo de Insumos".
2. Si el local fue registrado con una plantilla gastronómica en `CU-PROP-04` (Pollería, Cevichería o Chifa), el sistema presenta el inventario con los insumos base ya aprovisionados. Si se creó "Totalmente en Blanco", se muestra el estado de bienvenida guiado (Onboarding de despensa vacía).
3. **Visualización y Filtro Inteligente por Defecto:**
   - El directorio presenta métricas KPI ejecutivas: *Total Activos*, *En Quiebre / Agotados* y *Valorización Estimada de Almacén (S/)*.
   - **Por defecto, el directorio filtra exclusivamente insumos con `estado = 'activo'`**, asegurando una operación limpia y libre de ruido.
   - Dispone de una barra de búsqueda omnicanal con debounce para ubicar insumos en tiempo real por nombre.
   - Selector de píldoras de estado: `[ ● Activos (38) ]` (activo por defecto), `[ Agotados (3) ]`, `[ Inactivos (5) ]` y `[ Todos (46) ]`.
   - Cada fila exhibe: nombre del insumo, unidad de almacén (catálogo cerrado de 10 unidades universales: `kg`, `L`, `und`, `saco`, `botella`, `lata`, `caja`, `paquete`, `bidon`, `jaba`), barra de progreso de stock con semáforo cromático (verde: óptimo, amarillo: reposición, rojo: crítico, gris: agotado), costo unitario referencial, indicador de platos de la carta dependientes y acciones rápidas (`[Ajustar Stock]`, `[Editar]`, `[Pausar/Activar]`).
4. **Alta Rápida de Insumo (< 8 segundos):**
   - El administrador presiona `[ + Nuevo Insumo ]`.
   - Ingresa únicamente: nombre comercial (ej. "Papa Yungay"), selecciona la unidad de almacén mediante chips interactivos rápidos (Bases: `kg`, `L`, `und` | Empaques: `saco`, `botella`, `lata`, `caja`, `paquete`, `bidon`, `jaba`), define `Stock Inicial`, `Stock Mínimo (Alerta de reposición)` y `Costo Unitario (S/)`.
   - *No se requiere campo ni taxonomía restrictiva de categorías*, optimizando el alta inmediata sin fricción.
   - Presiona `[ Guardar Insumo ]`; el sistema valida duplicidad (`UNIQUE(local_id, LOWER(nombre))`) y registra el insumo en estado `activo`.
5. **Ajuste Físico de Stock con Auditoría Obligatoria (`auditoria_stock_ajuste`):**
   - Desde la fila del insumo, pulsa `[ Ajustar Stock ]`.
   - El sistema despliega el modal exhibiendo el stock registrado en el sistema.
   - El administrador ingresa el `Nuevo Stock Físico Real` contado en almacén; el sistema calcula dinámicamente la diferencia en tiempo real (ej. `Diferencia: -4.00 kg`).
   - Selecciona obligatoriamente el motivo del ajuste (`conteo_fisico_inventario`, `merma_desperdicio`, `ingreso_manual`, `vencimiento_caducidad`, `rotura_accidente`) y redacta notas explicativas.
   - Al confirmar, el sistema registra la transacción en `auditoria_stock_ajuste` y actualiza el stock físico atómicamente.
6. **Sincronización Operativa con Cocina y Salón (`CU-COCINA-04` $\leftrightarrow$ `CU-MOZO-01`):**
   - Si el ajuste manual o el consumo reduce el stock a 0 (`stock_actual == 0`), o si el administrador conmuta el insumo a `agotado` o `inactivo`:
     - **Bloqueo en Carta:** Todos los platos asociados mediante receta (`producto_insumo`) cambian de inmediato a `disponibilidad = 'agotado'` en el catálogo digital, bloqueando nuevas ventas en comanda móvil de mozos (`CU-MOZO-02`) y carta QR.
     - **Protección de Pedidos en Curso en Cocina:** El sistema busca pedidos activos con platos dependientes que estén en estado `en_cola` (pendientes de preparación) y los conmuta automáticamente a estado `no_disponible` (observado por quiebre de insumo).
     - **Alerta Activa al Mozo:** Se dispara una notificación prioritaria activa al mozo de la mesa asignada (`CU-MOZO-01` / `CU-MOZO-07`), permitiéndole coordinar inmediatamente con el cliente en mesa la sustitución del plato o la anulación sin recargos ni intervención de caja.
7. **Desactivación y Estados de Insumo:**
   - El sistema soporta 3 estados: `activo`, `agotado` e `inactivo`.
   - No se permite el borrado físico (`DELETE`); para retirar un insumo obsoleto o discontinuado, se conmuta a `inactivo` (*soft-deactivation*), preservando el histórico en compras pasadas y auditorías.

#### Flujos alternativos

- Se intenta ingresar un nombre de insumo ya existente en la misma sede → el sistema rechaza la duplicidad con `409 Conflict (ERR_INSUMO_DUPLICADO)`.
- El ajuste físico deja el stock en 0 → el modal despliega una alerta preventiva destacando los platos de la carta que quedarán bloqueados y los pedidos en cola que pasarán a "no disponible".
- Se reactiva un insumo que estaba agotado o inactivo (reposición o ajuste > 0) → el sistema cambia su estado a `activo`, notifica al administrador y ofrece la reactivación en 1 clic de los platos dependientes en la carta.
- La sede inicia por primera vez sin insumos (giro "En blanco") → se muestra la vista de onboarding guiado orientando a registrar el primer insumo.

**Postcondiciones:** Catálogo de insumos actualizado; ajustes físicos auditados en `auditoria_stock_ajuste`; platos de carta y pedidos en cocina sincronizados en tiempo real ante quiebre o reposición.

---

### CU-ADMIN-04: Gestionar productos de la carta y recetas

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo; existe al menos una categoría creada (`CU-ADMIN-02`) e insumos registrados en el inventario (`CU-ADMIN-03`).

#### Flujo principal

1. El administrador accede al módulo "Carta" → "Productos y Recetas".
2. El sistema despliega el Directorio de Productos con métricas KPI (*Total Platos en Carta*, *Disponibles en Salón*, *Agotados por Quiebre*, *Margen Bruto Promedio*), buscador reactivo por nombre, filtro por categorías (`CU-ADMIN-02`) y filtro por disponibilidad (`Todos`, `Disponibles`, `Agotados`).
3. Cada fila exhibe: foto/miniatura, nombre comercial, categoría obligatoria asignada, precio de venta (S/), costo teórico de insumos, margen bruto estimado (%), switch de disponibilidad (`disponible` / `agotado`) y acciones rápidas (`[Ver / Editar Receta]`, `[Editar Datos]`, `[Archivar]`).
4. Para dar de alta un nuevo plato, pulsa `[ + Nuevo Producto ]`. El sistema despliega el modal interactivo estructurado en 2 pestañas intuitivas:
   - **Pestaña 1 (Ficha del Plato):**
     - Selecciona la **Categoría Obligatoria** de la lista activa de su sede (`CU-ADMIN-02`).
     - Ingresa el nombre comercial del producto (validación de duplicidad `UNIQUE(local_id, LOWER(nombre))`).
     - Ingresa el precio de venta al público en salón (S/ PEN).
     - Ingresa la descripción para comensales en carta QR y mozos; carga opcionalmente una fotografía.
     - **Destino Operativo / Despacho (`requiere_preparacion`):** Control selector con valor predeterminado `true`:
       - `(●) Requiere preparación en cocina (KDS)`: El plato viaja a monitores de cocina (KDS) para cocción y emplatado (`CU-COCINA-01`).
       - `( ) Despacho directo en salón / barra`: Para gaseosas, bebidas embotelladas, aguas o snacks directos. No viaja al monitor KDS de cocina, omitiendo tickets innecesarios; nace directamente en estado `listo` para que el mozo lo sirva al instante en salón (`CU-MOZO-01`, `CU-MOZO-02`).
   - **Pestaña 2 (Receta e Insumos - Intuitiva y Rápida):**
     - El administrador selecciona los insumos necesarios desde el catálogo universal de 10 unidades (`CU-ADMIN-03`).
     - Para platos elaborados, elige de forma sencilla entre dos modos:
       - **Modo Rendimiento (`rendimiento`):** Ingresa cuántos platos rinde 1 unidad de almacén (ej. *"1 saco de papa rinde 140 porciones de Lomo Saltado"*) $\rightarrow$ el sistema calcula automáticamente la fracción `cantidad_descuenta = 1/140 = 0.00714 sacos`.
       - **Modo Exacto (`exacto`):** Ingresa la fracción o unidad directa que consume cada plato (ej. *"0.25 unidades de pollo"* para 1/4 Pollo a la Brasa, *"1.00 botella"* para gaseosa, *"0.200 kg"* para carne).
     - **Simplificación para Despacho Directo:** Si `requiere_preparacion = false`, no se exigen recetas complejas ni porciones culinarias; permite asociar opcionalmente 1 unidad de insumo directo de almacén (ej. 1 botella cerrada de gaseosa) para control estricto de inventario.
     - **Calculadora de Costo y Margen en Tiempo Real:** A medida que se añaden o calibran insumos, el sistema proyecta en vivo el *Costo Total de Ingredientes* (`SUM(cantidad_descuenta * insumo.costo_unitario)`), la *Utilidad Teórica (S/)* y el *Margen Bruto (%)*, empoderando al administrador en la fijación de precios rentables.
5. **Disponibilidad Inicial Inteligente:**
   - Al guardar, el backend valida el stock de todos los insumos de la receta:
     - Si todos los insumos cuentan con `stock_actual > 0`: el plato se crea con `disponibilidad = 'disponible'`, habilitándose inmediatamente para comandas de mozo (`CU-MOZO-02`) y carta QR.
     - Si al menos un insumo tiene `stock_actual == 0` o está en estado `agotado`: el plato nace automáticamente como `disponibilidad = 'agotado'`, con una alerta visual informando los ingredientes faltantes para evitar ofrecer platos que la cocina no puede preparar.
6. **Calibración Rápida de Recetas (Drawer Lateral):**
   - Desde el directorio, el administrador puede abrir el Quick-Drawer de receta de cualquier plato para ajustar rendimientos o sustituir insumos sin editar los datos comerciales. Incluye el simulador: *"Con el stock actual de insumos puedes preparar hasta X platos"*.
7. **Desactivación y Preservación Histórica:**
   - Prohibido el `DELETE` físico de productos con historial de comandas o ventas (`pedido_item`).
   - Para retirar un plato del menú, se conmuta a `activo = false` (*archivar plato*), preservando la integridad referencial y reportes históricos.

#### Flujos alternativos

- No existen categorías creadas en el local → El sistema despliega un estado previo orientando a crear primero las categorías de la carta en `CU-ADMIN-02`.
- Se intenta guardar un plato sin ingredientes en su receta (receta vacía) → El sistema bloquea el guardado informando que todo plato debe tener al menos un insumo vinculado para deducción de stock y forecasting.
- Se intenta ingresar un nombre de producto ya existente en el local → Se rechaza con `409 Conflict (ERR_PRODUCTO_DUPLICADO)`.
- Un insumo de la receta entra en quiebre (stock = 0 o ajuste manual) → El plato conmuta automáticamente a `agotado` (`CU-COCINA-04`), bloqueándose en comandas y avisando a los mozos.
- Se repone el insumo en quiebre → El sistema notifica al administrador y permite reactivar el plato a `disponible` en un solo clic.

**Postcondiciones:** Producto registrado/actualizado en la carta con categoría obligatoria, destino operativo definido (`requiere_preparacion`) y receta vinculada; costo teórico y margen calculados; disponibilidad sincronizada con el stock de almacén, pantallas KDS y comandas móviles.

### CU-ADMIN-05: Gestionar catálogo de proveedores

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Abastecimiento" → "Proveedores".
2. El sistema despliega el Directorio de Proveedores con KPIs (*Total Proveedores Activos*, *Compras Totales del Mes (S/)*, *Proveedores Frecuentes*), buscador reactivo por nombre comercial o insumo que suministra, y filtro de estado (`[ Activos (default) ] [ Inactivos ] [ Todos ]`).
3. Cada fila muestra:
   - Nombre comercial o razón social.
   - Persona de contacto principal.
   - Teléfono / WhatsApp (con botón de acceso directo `[ WhatsApp ]` para abrir chat o llamada rápida).
   - Insumos habituales que suministra (etiquetas interactivas de insumos asociados del local).
   - Fecha y monto de la última compra registrada.
   - Acciones rápidas: `[ Historial Compras ]`, `[ Editar ]`, `[ Desactivar / Activar ]`.
4. Para registrar un nuevo proveedor, pulsa `[ + Nuevo Proveedor ]`. El sistema despliega un modal ágil estructurado para completarse en menos de 10 segundos:
   - Nombre Comercial / Proveedor (obligatorio, validación de duplicidad `UNIQUE(local_id, LOWER(nombre))`).
   - Persona de Contacto (opcional).
   - Teléfono / WhatsApp (opcional).
   - Correo electrónico comercial (opcional).
   - Dirección física / Puesto de mercado (opcional).
   - Insumos suministrados habitualmente (multi-selector de chips basado en el catálogo de insumos de `CU-ADMIN-03`).
5. El administrador pulsa `[ Guardar Proveedor ]`.
6. El backend valida los datos, verifica unicidad dentro de la sede y persiste el registro en PostgreSQL (`proveedor`).
7. El sistema notifica el alta exitosa y actualiza reactivamente el directorio.
8. En cualquier momento, el administrador puede:
   - **Consultar Historial de Compras (Drawer lateral):** Despliega el consolidado de facturas/boletas compradas a este proveedor, fechas, montos y la evolución de los precios unitarios de cada insumo suministrado.
   - **Editar datos comerciales:** Modificar contacto, teléfono, dirección o insumos habituales.
   - **Desactivar / Activar:** Conmutar el estado del proveedor (`activo = false / true`). Al desactivar, se excluye de las sugerencias para nuevas compras sin alterar el histórico ni las compras pasadas.

#### Flujos alternativos

- El nombre del proveedor ya existe en el local → El sistema rechaza con `409 Conflict (ERR_PROVEEDOR_DUPLICADO)`.
- Se intenta eliminar un proveedor con historial de compras asociado → El sistema no permite el borrado físico (`ON DELETE RESTRICT`) y ofrece la desactivación lógica para preservar la integridad contable y de auditoría.
- Creación rápida "al vuelo" en Ficha de Compra (`CU-ADMIN-06`) → El administrador puede dar de alta un nuevo proveedor directamente desde el selector de compras mediante `[ + Nuevo Proveedor Rápido ]` sin perder los insumos digitados.

**Postcondiciones:** Proveedor registrado/actualizado en la base de datos de la sede; disponible para compras de insumos y auditoría comercial.

---

### CU-ADMIN-06: Registrar ficha de compra de insumos

**Actor(es):** Administrador del local

**Precondiciones:** La compra física ya se realizó; existe al menos un proveedor registrado o se crea "al vuelo".

#### Flujo principal

1. El administrador accede a "Abastecimiento" → "Fichas de Compra" → `[ + Registrar Ficha de Compra ]`.
2. El sistema despliega el formulario/modal interactivo de compra (840px):
   - **Cabecera del Comprobante:**
     - Selector de proveedor (`CU-ADMIN-05`) con opción de creación rápida "al vuelo" (`[ + Nuevo Proveedor Rápido ]`).
     - Tipo de comprobante (`factura`, `boleta`, `nota_venta`, `guia_remision`, `recibo`).
     - N° de Comprobante: Campo obligatorio para `factura`, `boleta` y `guia_remision` (ej. `F001-004921`). Para `nota_venta` y `recibo` es opcional; si se deja vacío, el sistema asigna automáticamente un correlativo interno de control de sede (ej. `NV-20261008-0001`).
     - Fecha de emisión (default fecha actual).
     - Método de pago (`efectivo_caja_chica`, `transferencia`, `tarjeta_debito`, `credito_proveedor`).
   - **Detalle Dinámico de Insumos:**
     - Búsqueda y selección de insumos del catálogo universal (`CU-ADMIN-03`), mostrando su stock actual y unidad de compra.
     - Cantidad física adquirida (input numérico positivo).
     - Precio unitario pagado (S/ PEN). El subtotal de línea se calcula de inmediato.
   - **Régimen Tributario y Liquidación:**
     - Selector claro: `[ Con Factura (Desglosa 18% IGV) ]` (para crédito fiscal) o `[ Sin IGV / Monto Neto ]` (para mercado mayorista y notas de venta).
     - Resumen transparente: Base Imponible, IGV (18% si aplica) y Total a Pagar (suma exacta de lo digitado en insumos, sin alteraciones inesperadas).
3. El administrador pulsa `[ Confirmar y Procesar Compra ]`.
4. El sistema ejecuta una transacción atómica que:
   - Registra la cabecera en `ficha_compra` y las líneas en `ficha_compra_detalle`.
   - Incrementa el stock físico de cada insumo (`stock_actual += cantidad`).
   - Actualiza en `insumo` el `costo_unitario = precio_unitario`, `ultimo_proveedor_id = proveedor_id` y fecha de última compra.
   - Si el insumo estaba en estado `agotado`, se conmuta automáticamente a `activo`.
   - Registra el egreso financiero en el flujo de caja del turno (`CU-ADMIN-14`).
5. Si existían platos en carta (`CU-ADMIN-04`) en estado `agotado` por quiebre de alguno de los insumos reabastecidos, el sistema despliega un diálogo asistido: *"Se reabasteció el insumo X. Los platos [A, B] ya cuentan con stock completo. ¿Deseas reactivarlos para los mozos en salón? [ Reactivar Platos ] [ Mantener en Revisión ]"*.
6. El sistema notifica la operación exitosa y actualiza inventario y márgenes en tiempo real.

#### Flujos alternativos

- El proveedor no existía previamente → El administrador lo registra en el acto mediante `[ + Nuevo Proveedor Rápido ]` (solo Nombre y Teléfono/WhatsApp) sin cerrar la compra ni perder los insumos tipeados.
- Se adquiere un insumo con un costo diferente al histórico → El sistema actualiza el costo referencial en el insumo y recalcula en segundo plano el costo teórico y margen de los platos que lo contienen en su receta.
- Se ingresó una ficha con datos erróneos de cantidad o costo (error de digitación) → El administrador puede ejecutar **Anulación de Ficha de Compra con Justificación Obligatoria y Plan de Contingencia** (`estado = 'anulada'`):
  1. **Diálogo previo de advertencia de impacto:** Antes de confirmar, el sistema presenta un análisis de impacto operativo: insumos que regresarán a stock 0 / agotado, platos de la carta que se bloquearán de inmediato para comandas, y pedidos en cocina actualmente en curso.
  2. **Reversión atómica y protección contra stock negativo:** Para cada insumo de la compra, se descuenta la cantidad adquirida. Si en el lapso transcurrido ya se vendieron platos o consumieron ingredientes de modo que `stock_actual < cantidad_comprada`, el sistema **fija el piso en 0** (`stock_actual = GREATEST(0, stock_actual - cantidad)`), impidiendo saldos negativos. La discrepancia física consumida sin respaldo se asienta automáticamente en `log_auditoria` (`CU-ADMIN-16`).
  3. **Rollback automático a estado `agotado` y cascada a carta (`CU-ADMIN-04`):** Si la reversión sitúa el `stock_actual == 0`, el insumo conmuta automáticamente a `agotado`. El backend dispara en cascada la actualización de todos los platos vinculados a `disponibilidad = 'agotado'`, bloqueándolos en tiempo real en la comanda móvil de mozos (`CU-MOZO-01`, `CU-MOZO-02`) y la carta digital QR.
  4. **Alerta de contingencia en cocina (KDS):** Las comandas que ya se encuentren en cola (`en_cola`) o en preparación (`en_preparacion`) con platos afectados por el quiebre se marcan en la pantalla de cocina con el distintivo `[Observado por quiebre]`, emitiendo una notificación de alta prioridad a los mozos para que ofrezcan sustituciones o informen al comensal.
  5. **Reversión en flujo de caja:** Se anula el asiento de egreso financiero vinculado en `egreso_caja` (`CU-ADMIN-14`).
  6. **Trazabilidad inmutable:** Se registra el motivo obligatorio (mínimo 10 caracteres), usuario auditor y fecha/hora exacta en `ficha_compra` y `log_auditoria` (`CU-ADMIN-16`).

**Postcondiciones:** Ficha de compra registrada (o anulada bajo plan de contingencia); stock físico de insumos actualizado (protegido contra negativos); costos de recetas y márgenes recalculados; egreso asentado o revertido en caja chica; platos agotados reactivables tras compra o bloqueados automáticamente ante anulación; alertas preventivas enviadas a cocina y salón.

---

### CU-ADMIN-07: Ver recomendaciones de reposición de insumos (IA) (Pospuesto a Fase Futura / Backlog)

**Actor(es):** Administrador del local

**Precondiciones:** El plan incluye módulo de predicción; existe historial suficiente.

#### Flujo principal

1. El administrador accede a "Recomendaciones de inventario".
2. El sistema muestra una lista de insumos sugeridos para reponer, ordenada por prioridad: crítico (insumo ya por debajo del stock mínimo) y atención (acercándose al mínimo según demanda proyectada).
3. Cada ítem muestra: stock actual, cantidad sugerida a comprar, el último proveedor al que se compró ese insumo (con su precio y fecha de esa compra), y costo estimado.
4. El administrador puede descargar la lista en PDF o Excel como guía de compra.

#### Flujos alternativos

- Un insumo no tiene ninguna compra previa registrada → aparece en la lista sin sugerencia de proveedor/precio, solo con la cantidad recomendada.

**Postcondiciones:** Ninguna dentro del sistema (es informativo); el archivo descargado no genera ningún registro.

---

### CU-ADMIN-08: Gestionar personal del local

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo; el administrador cuenta con sesión activa; la empresa dispone de cupos disponibles en su plan SaaS (`COUNT(usuario) < plan.max_usuarios`).

#### Flujo principal

1. El administrador accede a "Personal" desde el menú operativo de la sede.
2. El sistema despliega el Directorio de Personal con tarjetas KPI (*Total Empleados*, *Mozos en Salón*, *Equipo de Cocina*, *Cajeros de Turno*), medidor visual de consumo de cuota SaaS, buscador reactivo y filtros por rol (`[ Todos ] [ Mozos ] [ Cocina ] [ Cajeros ]`) y estado (`[ Activos ] [ Inactivos ]`).
3. Para registrar un colaborador, pulsa `[ + Nuevo Empleado ]`. El sistema despliega el modal interactivo (660px):
   - Ingresa: Nombre completo, correo corporativo (`UNIQUE(empresa_id, LOWER(correo))`) y teléfono celular / WhatsApp (validación móvil Perú).
   - Asigna rol operativo seleccionando entre las 3 tarjetas disponibles:
     - `Mozo`: Atención de salón, comanda móvil, plano de mesas y reservas.
     - `Cocina`: Monitor KDS de preparación, control de tiempos y quiebres de platos.
     - `Cajero`: Apertura/cierre de turno, cobranza y facturación electrónica.
   - Conmuta si desea enviar bienvenida automática por correo electrónico.
   - *Nota de seguridad:* La interfaz aclara que la designación de administradores corresponde de forma privativa al Propietario.
4. El administrador pulsa `[ Guardar y Activar Empleado ]`.
5. El backend valida que la cantidad de usuarios no supere la cuota contratada (`max_usuarios`), genera una contraseña criptográfica provisional segura, persiste el usuario en PostgreSQL y despacha el correo de bienvenida con sus accesos.
6. La interfaz presenta la confirmación con opción directa de `[ Copiar Enlace para WhatsApp ]` para compartir la bienvenida al colaborador en un clic.
7. **Sesión Continua de Turno:** El colaborador inicia sesión una sola vez en su tablet o celular al comenzar su jornada y permanece activo ininterrumpidamente durante todo su turno (sin re-autenticaciones entre mesas o comandas), cerrando sesión únicamente al pulsar `[ Cerrar Sesión ]` al final del día.
8. En cualquier momento, el administrador puede:
   - Modificar datos personales o rol operativo (`mozo`, `cocina`, `cajero`).
   - Generar una nueva contraseña provisional (`[ Reset Clave ]`).
   - Desactivar o reactivar colaboradores.

#### Flujos alternativos

- Se intenta registrar o elevar a un usuario con rol de Administrador (`admin_local`) (**Restricción de Privilegios de Seguridad**):
  - Un administrador local tiene prohibido crear o asignar a otros administradores. Esta facultad está reservada **exclusivamente al Propietario** (`CU-PROP-04`). El backend rechaza la operación con `403 Forbidden (ERR_CREACION_ADMIN_NO_AUTORIZADA)`.
- Se supera el límite de usuarios del plan SaaS (`max_usuarios`) → El sistema bloquea la creación e informa la cuota alcanzada, orientando a solicitar una ampliación con el Propietario.
- El correo electrónico ya existe en la empresa → El sistema rechaza con `409 Conflict (ERR_USUARIO_DUPLICADO)`.
- Se desactiva a un Mozo con mesas o pedidos en curso (**Salvaguarda Operativa de Comandas**):
  - El sistema detecta mesas activas (`pedido.estado NOT IN ('cobrado', 'cancelado')`) y despliega el diálogo de seguridad solicitando reasignar las mesas a otro mozo activo.
  - Al confirmar, el backend transfiere atómicamente todas las comandas al mozo sustituto en la misma transacción antes de suspender la cuenta, notificando al mozo receptor en su comanda móvil y evitando órdenes huérfanas.
- Se intenta desactivar a un Cajero con caja abierta → El sistema bloquea la acción con `409 Conflict (ERR_CAJERO_CON_CAJA_ABIERTA)`, informando que debe realizarse el arqueo y supervisión de cierre de caja en `CU-ADMIN-15` antes de suspenderlo.
- Se reactiva a un colaborador inactivo → El sistema verifica que haya cupo disponible en el plan; si hay vacante, conmuta a `activo` y permite emitir nuevas credenciales.

**Postcondiciones:** Colaborador operativo registrado o actualizado (restringido a mozo, cocina o cajero); cuota SaaS consumida; credenciales enviadas; sesión continua habilitada por turno; comandas reasignadas y trazabilidad asentada en auditoría en caso de desactivación.

---

### CU-ADMIN-09: Configurar horario de atención y feriados del local

**Actor(es):** Administrador del local, Propietario

**Precondiciones:** El local está activo; el usuario cuenta con sesión activa y permisos sobre la sede.

#### Flujo principal

1. El administrador accede a "Horario de Atención" desde el módulo de configuración de la sede.
2. Si el local es nuevo y carece de programación, el sistema despliega el onboarding asistido con la recomendación de *"Aplicar Plantilla Restaurante Estándar en 1 Clic"* (Almuerzo: 12:00 a 16:00 y Cena: 19:00 a 23:30 de Lunes a Domingo) o la opción de configurar turnos manualmente desde cero.
3. En la grilla semanal regular (Lunes a Domingo), el administrador puede:
   - Conmutar la apertura o cierre habitual de cada día (`atiende = true/false`).
   - Definir uno o múltiples turnos diarios (`[ + Añadir Turno ]`, ej. Almuerzo 12:00-16:00, Cena 19:00-23:30) asignando etiqueta descriptiva y rango horario (`hora_inicio`, `hora_fin`).
   - Replicar el horario de un día a toda la semana mediante `[ Copiar horario de Lunes a toda la semana ]`.
4. El administrador pulsa `[ Guardar Horario Semanal ]`. El backend valida la coherencia temporal (inicio menor a fin salvo horario trasnochador, y ausencia de solapamiento entre turnos del mismo día) y persiste la configuración en `horario_atencion`.
5. Desde la pestaña "Excepciones y Feriados", el administrador puede programar cierres extraordinarios o atenciones en horario especial:
   - Pulsa `[ + Nuevo Cierre / Feriado ]` o `[ Cargar Feriados Nacionales de Perú 2026 ]`.
   - Ingresa: Fecha, Tipo de Excepción (`[ Cierre Total ]` o `[ Horario Especial ]`), Horas de inicio y fin (si es horario especial) y Motivo descriptivo (ej. "Fiestas Patrias", "Inventario General").
6. Al solicitar guardar el feriado o cierre, el sistema ejecuta un pre-chequeo transaccional de reservas:
   - Si no existen reservas confirmadas para dicha fecha, la excepción se registra de inmediato en `horario_excepcion`.
   - Si se detectan reservas existentes confirmadas, el sistema despliega el **Modal de Resolución de Conflicto de Reservas (680px)**.

#### Flujos alternativos

- **Detección de Reservas en Conflicto por Cierre o Feriado (Resolución Asistida Multicanal):**
  1. El modal presenta la advertencia de impacto con la lista detallada de clientes afectados (nombre, hora reservada, número de personas y mesas asignadas).
  2. El sistema exhibe el número celular de cada comensal para llamada directa y un botón de enlace asistido `[ Abrir WhatsApp (wa.me) ]` precargado con un mensaje de cortesía oficial: *"Estimado/a comensal, le saludamos de [Nombre del Local]. Lamentamos comunicarle que por motivos de [Motivo] el local no atenderá el día [Fecha]. ¿Desea reprogramar su visita para otra fecha u horario?"*.
  3. El administrador contacta al cliente y marca la casilla interactiva `[x] Cliente notificado por WhatsApp/Llamada`.
  4. Al confirmar la operación mediante `[ Confirmar Cierre y Cancelar Reservas Afectadas ]`, el backend ejecuta una transacción atómica que:
     - Registra la excepción en `horario_excepcion`.
     - Actualiza cada reserva afectada a `estado = 'cancelada'`, vinculando `excepcion_id`, `motivo_cancelacion`, `notificado_cliente = true`, `metodo_notificacion = 'whatsapp'`, `notificado_por` y `fecha_notificado = NOW()`.
     - Asienta el evento inmutable en `log_auditoria` (`CU-ADMIN-16`) para trazabilidad ante posibles reclamos de clientes.
- Turnos con solapamiento horario en el mismo día → El sistema bloquea el guardado en frontend y backend con `422 Unprocessable Entity (ERR_HORARIO_SOLAPADO)`.
- Se requiere configurar políticas y cupos de reserva de mesas → Desacoplado; se gestiona en `CU-ADMIN-10`.

**Postcondiciones:** Horario semanal regular registrado en `horario_atencion`; excepciones y feriados registrados en `horario_excepcion`; reservas en conflicto canceladas con trazabilidad auditada y notificación asistida al cliente.

---

### CU-ADMIN-10: Configurar políticas y parámetros de reservas de mesas

**Actor(es):** Administrador del local (facultad exclusiva de sede)

**Precondiciones:** El local está activo; el plan SaaS de la empresa incluye el módulo de reservas (`plan.incluye_reservas = true`).

#### Flujo principal

1. El administrador accede a "Políticas y Reservas de Mesas" desde el menú de configuración de la sede.
2. El sistema despliega el panel de control con el interruptor maestro: `[ Habilitar recepción de reservas de salón ]` (`politicas_reserva.acepta_reservas`).
3. Con la opción habilitada, el administrador configura los parámetros operativos:
   - **Duración estimada de reserva (`duracion_reserva_min`):** Tiempo base de ocupación por mesa (ej. 90 minutos, rango 30 a 240 min).
   - **Margen de buffer (`buffer_reserva_min`):** Espacio temporal de limpieza y rotación entre reservas consecutivas en una misma mesa (ej. 15 minutos).
   - **Tolerancia para "No-Show" (`tolerancia_no_show_min`):** Minutos de espera de cortesía tras la hora pactada antes de que el mozo pueda liberar la mesa y marcar inasistencia (ej. 15 minutos).
   - **Bloqueo físico previo en salón (`minutos_bloqueo_previo`):** Minutos de anticipación en que la mesa pasa visualmente al estado "bloqueada" en el plano de salón (`CU-MOZO-01`) para impedir que se siente un cliente casual sin reserva previa (ej. 30 minutos).
   - **Anticipación de recordatorio (`margen_recordatorio_min`):** Margen de tiempo para avisos preventivos al equipo de mozos (ej. 120 minutos).
   - **Ventana de anticipación:** Mínimo tiempo antes de la cita (`anticipacion_minima_horas`, ej. 2 horas) y horizonte máximo a futuro (`anticipacion_maxima_dias`, ej. 30 días).
4. El administrador puede verificar el comportamiento operativo mediante el **Simulador de Línea de Tiempo de Mesa**, visualizando gráficamente el bloqueo previo, la estancia del comensal, el no-show y la sanitización.
5. El administrador pulsa `[ Guardar Políticas de Reserva ]` (o `[ Restaurar Valores Recomendados ]`).
6. El sistema actualiza los parámetros en la entidad dedicada `politicas_reserva` y sincroniza en tiempo real vía SSE el estado de las mesas en salón para los Mozos (`CU-MOZO-01`).

#### Flujos alternativos

- Se intenta desactivar la recepción de reservas (`acepta_reservas = false`) existiendo reservas futuras en estado `confirmada` → El sistema bloquea la acción con `409 Conflict (ERR_RESERVAS_FUTURAS_PENDIENTES)`, informando la cantidad de compromisos adquiridos y requiriendo atenderlos o cancelarlos explícitamente antes de cerrar el canal.
- El Propietario intenta modificar las políticas de reservas del salón → El sistema rechaza la operación con `403 Forbidden (ERR_OPERACION_EXCLUSIVA_ADMIN_LOCAL)`. La parametrización de tiempos de servicio, rotación de mesas y tolerancias de comensales está reservada estrictamente al Administrador del local, quien conoce presencialmente la dinámica operativa, rotación de salón y capacidad de servicio de su brigada; el Propietario supervisa únicamente a nivel macro-suscripción (`CU-PROP-01..04`).
- El plan contratado no incluye módulo de reservas (`plan.incluye_reservas = false`) → Los campos se muestran bloqueados con banner informativo orientando a solicitar una mejora de plan con el Propietario.

**Postcondiciones:** Políticas y parámetros de reserva de salón actualizados en `politicas_reserva` por el Administrador de sede; motor de disponibilidad y bloqueo previo de mesas sincronizado para Mozos (`CU-MOZO-01`).

---

### CU-ADMIN-11: Registrar y consultar historial de incidentes internos

**Actor(es):** Administrador del local (responsable operativo directo de la sede)

**Precondiciones:** El local está activo; el usuario cuenta con sesión autenticada con rol `administrador_local` asignado a dicha sede (`local_id`).

#### Flujo principal

1. El administrador accede a "Incidentes" desde el menú de operaciones del local.
2. El sistema presenta la bandeja de incidentes exclusiva de su sede con métricas KPI operativas: *Incidentes Abiertos*, *En Investigación / Revisión*, *Gravedad Alta (Alerta Activa)* y *Resueltos este Mes*, junto con la tabla de novedades ordenadas cronológicamente.
3. El administrador presiona `[ + Registrar Nuevo Incidente ]`. El sistema despliega el modal de registro estructurado.
4. El administrador ingresa:
   - **Título del incidente:** Resumen conciso del suceso.
   - **Categoría:** Dropdown obligatorio (`caja_dinero`, `rotura_merma`, `servicio_cliente`, `seguridad_higiene`, `disciplinario`, `otro`).
   - **Nivel de Gravedad:** Selector visual de 3 tarjetas (`baja`, `media`, `alta`). Al seleccionar `alta`, el sistema despliega un aviso reactivo informando que se emitirá una alerta inmediata en tiempo real vía Server-Sent Events (SSE) al portal corporativo del Propietario.
   - **Fecha y Hora del suceso:** Selector datetime con valor por defecto en el momento actual (`NOW()`).
   - **Colaborador involucrado:** Control interactivo `[ ] Involucra a un colaborador específico`. Si permanece desmarcado, el campo se oculta y viaja como `NULL` (ideal para eventos de cocina, quiebres accidentales, cortes de fluido o clientes conflictivos sin culpa del personal). Si se marca, se despliega el listado del personal activo de la sede (`CU-ADMIN-04`).
   - **Descripción detallada:** Explicación pormenorizada de lo acontecido (mínimo 15 caracteres).
   - **Medidas inmediatas:** Acciones de contención adoptadas en caliente durante el turno.
   - **Evidencia fotográfica / Comprobante:** Carga opcional de fotografía o comprobante escaneado (JPG/PNG máx. 5MB) en dropzone.
5. El administrador presiona `[ Registrar Incidente ]`.
6. El sistema valida los campos, genera el código correlativo anual inmutable (`INC-YYYY-###`), persiste el incidente con estado `abierto` y registra la acción en el log de auditoría.
7. Si el incidente es tipificado con gravedad `alta`, el backend emite un evento SSE broadcast que dispara una alerta prioritaria en la sesión del Propietario (`CU-PROP-06`).
8. El administrador puede consultar el historial completo de su sede utilizando filtros combinados (estado, gravedad, categoría, colaborador, rango de fechas) o el buscador reactivo.
9. Al hacer clic en `[ Ver / Resolver ]`, el sistema abre el modal de detalle e inspección:
   - Si el Propietario supervisó el caso desde `CU-PROP-06` e ingresó una directiva u observación (`nota_propietario`), se exhibe destacada en un panel directivo corporativo.
   - **Resolución Definitiva:** El administrador selecciona la pestaña predeterminada `[ Confirmar Resolución Definitiva ]`, ingresa obligatoriamente la nota de remediación final (`resolucion_nota`, mín. 10 caracteres) y confirma la acción. El sistema pasa el incidente a estado `resuelto`, guarda `resuelto_por` y `fecha_resolucion`, notifica al Propietario del cumplimiento y congela el expediente de forma inmutable en solo lectura.
   - **Dejar en Investigación / Seguimiento:** Si el incidente requiere peritaje pendiente (revisión de cámaras, informe de técnico de frío, conciliación bancaria), el administrador selecciona la pestaña `[ Dejar en Investigación / Seguimiento ]`, redacta el `motivo_revision` y confirma. El sistema pasa el estado a `en_revision` y muestra en la bandeja de sede los días transcurridos para prevenir casos abandonados.

#### Flujos alternativos

- El administrador intenta acceder a incidentes de otra sede de la empresa → El sistema bloquea la consulta a nivel de Row-Level Security (RLS) en base de datos (`local_id`).
- El incidente ya se encuentra en estado `resuelto` → El sistema renderiza el expediente en modo histórico bloqueado (solo lectura); cualquier intento de mutación es rechazado con `409 Conflict (ERR_INCIDENTE_YA_RESUELTO)`.
- El archivo de evidencia supera los 5MB o no es imagen (JPG/PNG) → El sistema valida en frontend y backend rechazando la carga con `422 Unprocessable (ERR_EVIDENCIA_FORMATO_INVALIDO)`.
- Se intenta resolver un incidente sin ingresar nota correctiva → El sistema inhabilita la confirmación y solicita completar las acciones de cierre (`ERR_RESOLUCION_NOTA_REQUERIDA`).
- No existen incidentes registrados bajo los filtros seleccionados → El sistema despliega el estado vacío positivo confirmando normalidad operativa en la sucursal.

**Postcondiciones:** Incidente registrado con correlativo único anual; trazabilidad íntegra en auditoría; alertas reactivas SSE emitidas al Propietario para casos de gravedad alta; expediente archivado de forma inmutable tras su resolución definitiva.

---

### CU-ADMIN-12: Recibir notificación de anulación de pedido y auditoría de sala

**Actor(es):** Administrador del local (receptor activo de alertas y supervisor de auditoría)

**Precondiciones:** El local se encuentra activo; un Mozo en salón (`CU-MOZO-06`) o un Cajero en punto de venta (`CU-CAJA-02`) ejecutó la anulación de un plato o comanda completa con motivo obligatorio; el administrador cuenta con sesión activa en la sede.

#### Flujo principal

1. **Notificación Reactiva en Tiempo Real vía SSE:** En el momento exacto en que un mozo o cajero confirma una anulación en sala, el backend persiste el suceso en la tabla especializada `pedido_anulacion` y emite el evento SSE `notificacion_anulacion`. En la pantalla del administrador (cualquiera sea el módulo en que se encuentre: Plano, Carta, Inventario, etc.), emerge un **Toast flotante en la esquina superior derecha** con aviso visual y tono acústico sutil, mientras el icono de campana `[ 🔔 ]` en la barra superior incrementa su contador de alertas no leídas.
2. **Acceso a la Bandeja Central de Anulaciones (`/admin/operaciones/anulaciones`):** El administrador puede hacer clic directamente en el Toast, en el dropdown de la campana, o ingresar a la Bandeja de Auditoría de Sede.
   - El sistema despliega la bandeja filtrada por la fecha activa (por defecto `Hoy, 09 Octubre 2026`, con selector diario y calendario, sin división artificial de turnos).
   - Exhibe métricas KPI ejecutivas del día: *Total Anulaciones*, *Monto Acumulado Anulado (S/)*, *Con Merma Culinaria (platos y costo de insumos)* y *Mesas Involucradas*.
   - Provee filtros rápidos en píldora (`[ Todas ]`, `[ ● Pendientes de Revisar ]`, `[ Con Merma ]`, `[ Sin Merma ]`, `[ Comandas Totales ]`) y selector por mozo.
3. **Inspección de la Ficha de Auditoría (Modal 680px):** Al pulsar sobre cualquier registro o en el Toast, el sistema abre la Ficha de Auditoría detallando:
   - **Identificación:** Mesa de origen (individual `Mesa 04` o unida `Mesa [ 02 ; 03 ]`), comanda, mozo titular y usuario que anuló.
   - **Trazabilidad Temporal Fáctica:** Contrasta la hora de despacho del pedido (`pedido_created_at`) vs la hora de la anulación (`anulado_at`), proyectando el tiempo de espera transcurrido (`minutos_espera`, ej. 25 min 18 seg) y el estado en que se encontraba el plato al corte (`estado_anterior`: `en_cola`, `en_preparacion`, `listo`, `servido`). El sistema evalúa objetivamente si la demora reclamada por el cliente fue real respecto a los tiempos estándar de cocina.
   - **Motivo y Justificación Textual:** Categoría seleccionada (`demora_cliente`, `error_registro`, `queja_calidad`, `cambio_plato`, `retiro_sin_consumo`) y la justificación obligatoria escrita por el personal (mínimo 10 caracteres).
   - **Impacto Culinario y Merma Contable:** Detalle del plato, partida de cocina (Pase Caliente, Horno, Bar) y bandera de merma (`es_merma = false` si se detuvo a tiempo en fogón vs `es_merma = true` con costo teórico de insumos según receta si ya estaba cocinado).
4. **Acuse de Supervisión Administrativa:** Si la anulación responde a la dinámica normal del servicio, el administrador pulsa `[ ✓ Marcar como Revisado / Conforme ]`. El sistema actualiza `pedido_anulacion` (`revisado = true`, `revisado_por = admin_id`, `revisado_at = NOW()`), archivando la novedad y conmutando el badge en la tabla a `[ ✓ REVISADO ]`.

#### Flujos alternativos

- **Escalamiento Directo a Incidente Operativo formal (`CU-ADMIN-11`):** Si la justificación del mozo denota una conducta sospechosa, queja grave de cliente, agresión o pérdida cuantiosa de insumos cocinados $\rightarrow$ el administrador pulsa `[ ⚠️ Escalar a Incidente Operativo (CU-ADMIN-11) ]`. El sistema despliega el modal de registro de incidentes prellenando automáticamente el título, colaborador involucrado, mesa, plato y costo de merma, generando un expediente formal correlativo (`INC-YYYY-###`) y vinculando `pedido_anulacion.incidente_id`.
- **Anulación de Comanda Completa:** Si el grupo de comensales se retiró sin consumir (`retiro_sin_consumo`), el registro consolida todos los platos de la cuenta, calcula el subtotal revocado completo y verifica la liberación de la mesa en salón.
- **Cero Anulaciones en la Fecha Activa (Estado Vacío Positivo):** Si no existen cancelaciones durante la jornada, la bandeja despliega la tarjeta de excelencia operativa informando 100% de efectividad en el servicio de sala y cocina, con S/ 0.00 en pérdidas de merma.

**Postcondiciones:** Trazabilidad inmutable persistida en la tabla especializada `pedido_anulacion`; administrador notificado en tiempo real vía SSE; supervisión gerencial asentada; expediente transferido a `CU-ADMIN-11` si hubo escalamiento; insumo consolidado para reportes de ventas y mermas en `CU-ADMIN-13`.

---

### CU-ADMIN-13: Ver reportes de ventas y desempeño

**Actor(es):** Administrador del local (Gerente de Sede / Administrador Operativo)

**Precondiciones:** El administrador tiene una sesión activa (`rol: administrador` o `rol: propietario`) con sede asignada. Existen comandas cobradas y cerradas en caja (`CU-CAJA-03`).

#### Flujo principal

1. El administrador accede a la sección "Reportes" → "Ventas y Desempeño" en su panel administrativo.
2. El sistema despliega el **Dashboard Estratégico y Analítico de Ventas**, organizado en tres pestañas especializadas para prevenir sobrecarga cognitiva y optimizar transferencia de red:
   - **Pestaña 1: Ventas Generales & KPIs:** 4 métricas macro (Facturación Total Neta con desglose gravado/IGV, Comandas Cobradas con promedio diario, Ticket Promedio por mesa y comensal, Rotación Media de Mesa en minutos); Histograma de Curva Horaria con identificación visual de horas punta (Almuerzo 13h-15h vs Cena 20h-22h); Distribución de recaudación por Medios de Pago (POS, Efectivo, Billeteras Digitales `CU-ADMIN-19`) y desglose de emisión tributaria SUNAT (Boletas, Facturas, Notas de Venta, Notas de Crédito `CU-CAJA-03` / `CU-CAJA-04`).
   - **Pestaña 2: Menú Engineering & Mix Culinario:** Matriz de 4 cuadrantes basada en la ingeniería de menú (Estrellas: alta venta y alto margen; Caballitos: alta venta y margen medio/bajo; Puzles: baja venta y alto margen; Rezagados: baja demanda y bajo margen); Top 8 Platos más vendidos con alerta de quiebre de stock si aplica (`CU-COCINA-04`); y Gráfico de cuota de mercado por categoría culinaria.
   - **Pestaña 3: Productividad del Equipo de Salón & Operaciones de Turno:** Métricas de rendimiento individual por mozo (mesas atendidas, facturación generada, ticket promedio, tiempo medio de rotación de mesa, efectividad de Upselling de 2da ronda de bebidas/postres y auditoría de anulaciones trazadas a `CU-MOZO-06`); y Bloque adaptable de turnos que detecta si el local opera en Doble Turno (Almuerzo y Cena) o en Turno Único Continuo (consolidando el 100% de la actividad sin forzar comparativas).
3. El administrador filtra por período (`Hoy`, `Ayer`, `Semana`, `Este Mes` o rango personalizado) con opción de activar comparativa delta porcentual contra el período anterior (`vs. Mes anterior`).
4. El administrador puede pulsar `[ 📥 Exportar Reporte ]`:
   - El sistema despliega el modal de configuración de exportación permitiendo seleccionar el formato (`Reporte Ejecutivo en PDF` o `Hoja de Cálculo Excel / CSV`) y marcar modularmente las secciones a incluir.
   - El backend Go transmite el archivo mediante **Streaming HTTP Asíncrono** con compresión nativa Gzip (`Transfer-Encoding: chunked`), transfiriendo los datos directamente al disco del dispositivo sin saturar la memoria RAM.

#### Flujos alternativos

- **Sede con Turno Único Continuo:** Si la sede gastronómica opera en horario ininterrumpido (ej. 12:00 a 22:00 sin división de turnos), el sistema adapta automáticamente la tarjeta de operaciones de turno en la Pestaña 3 para mostrar una sola métrica unificada de jornada, evitando mostrar bloques vacíos o comparativas artificiales.
- **Período sin Actividad (Estado Vacío):** Si el rango seleccionado no registra comandas cobradas, el sistema muestra una tarjeta informativa neutral con invitación a ampliar el filtro de fechas o pulsar `[ Ver Últimos 30 Días ]`.
- **Detección de Plato en Quiebre:** Si un plato clave del Top 8 o cuadrante Puzles sufrió quiebres de stock temporales en cocina (`CU-COCINA-04`), el sistema añade una nota explicativa al pie para que la baja rotación no sea atribuida erróneamente a falta de demanda de los clientes.

**Postcondiciones:** Métricas analíticas consultadas en tiempo real; reportes consolidados exportados en streaming de solo lectura sin alteración del estado operacional.

---

### CU-ADMIN-14: Gestión de flujo de caja, gastos operativos y auditoría de cierres Z

**Actor(es):** Administrador del local (Gerente de Sede / Administrador Operativo) y Propietario (`propietario`)

**Precondiciones:** El administrador tiene una sesión activa (`rol: administrador` o `rol: propietario`) con sede asignada. Existen comandas cobradas en salón (`CU-CAJA-03`), compras de insumos registradas (`CU-ADMIN-06` / `CU-ADMIN-07`) o turnos de caja registrados/cerrados (`CU-CAJA-05`).

#### Flujo principal

1. El administrador accede a la sección "Finanzas y Tesorería" → "Flujo de Caja & Cierres Z" en su panel administrativo.
2. El sistema despliega el **Centro Unificado de Control Financiero y Supervisión de Cajas**, estructurado en tres pestañas especializadas:
   - **Pestaña 1: Flujo de Caja & Balance Neto:**
     - 4 KPIs macro: Total Ingresos de Salón (100% mesas cobradas desglosadas por Tarjetas POS, Efectivo y Yape/Plin), Total Egresos Operativos (Compras de Insumos Culinarios 67% + Gastos de Sede 33%), Balance Neto Operativo (+S/ 11,630.00 con ratio de margen libre 40.8%) y Conciliación de Liquidez Disponible (Cuentas Bancarias / Pasarelas vs Efectivo físico en gavetas).
     - Histograma comparativo de entradas vs salidas y ratio de cobertura operativa.
     - Desglose fáctico de egresos: Compras directas de insumos culinarios para carta (`ficha_compra`: Pollo, Lomo fino, Papas nativas, Carbón/leña, Abarrotes, Bebidas) y Gastos operativos de sede (`gasto_manual`: Alquiler, Servicios básicos luz/agua/gas, Limpieza y menaje interno, Mantenimiento, Caja chica).
   - **Pestaña 2: Auditoría de Turnos & Reportes Z:**
     - Directorio histórico de sesiones de caja de la sede con correlativo de turno, fecha/horario (Almuerzo vs Cena), cajero titular, fondo de apertura, efectivo esperado, efectivo real contado, diferencia (`S/ 0.00` o valor de faltante/sobrante) y estado de visado gerencial (`✓ Auditado y Conforme`, `⏳ Pendiente de Auditoría`).
     - Banner de monitor de terminal con botón contextual para ejecutar **"Cierre Administrativo Forzado"** si un cajero abandonó la sede sin cerrar, liberando la restricción `uq_caja_abierta_local` para el siguiente turno.
   - **Pestaña 3: Egresos & Gastos de Sede:**
     - Historial y bandeja de comprobantes de servicios públicos, alquiler y compras menores.
3. El administrador puede pulsar `[ ➕ Registrar Gasto ]` en cualquier momento:
   - Ingresa categoría (Alquiler, Servicios básicos, Limpieza y aseo, Mantenimiento, Caja chica), monto, fecha, comprobante y justificación.
   - Si selecciona origen de fondos `Efectivo de Caja Chica / Gaveta`, el sistema descuenta automáticamente el monto del turno de caja activo en `caja_movimiento`, garantizando que el arqueo Z del cajero en `CU-CAJA-05` cuadre milimétricamente sin falsos faltantes.
4. El administrador selecciona un turno para inspección pulsando `[ 👁️ Auditar Reporte Z ]`:
   - El sistema despliega el visor oficial del **Reporte Z Digital** (Vista 3) con la cuadratura física de gaveta, desglose de lotes de POS, transferencias digitales y correlativos fiscales SUNAT (Boletas, Facturas y Notas de Crédito).
   - El administrador redacta una observación administrativa de auditoría y pulsa `[ ✓ Marcar Turno Auditado y Conforme ]`, persistiendo el visado inmutable (`revisado = true`, `revisado_por`, `revisado_at`).
5. El administrador puede exportar el flujo de caja o la auditoría de turnos en PDF formal o Excel/CSV mediante streaming HTTP comprimido con Gzip.

#### Flujos alternativos

- **Cierre Forzado de Terminal Abandonada:** Si el cajero se retiró sin realizar el cierre Z, el administrador ingresa el efectivo contado en gaveta, redacta la justificación obligatoria y confirma el cierre administrativo forzado. El sistema actualiza `caja.estado = 'cerrada'`, libera la terminal y registra la auditoría.
- **Turno con Discrepancia:** Si el turno cerró con diferencia ($\text{Diferencia} \neq S/ 0.00$), el sistema resalta el comentario obligatorio del cajero y exige al administrador asentar una nota de visado investigativo antes de marcarlo conforme.
- **Filtro de Rango Personalizado:** El administrador puede alternar entre `Hoy`, `Semana`, `Este Mes` o seleccionar un rango de fechas personalizado (`Desde` y `Hasta`).

**Postcondiciones:** Registro de gastos operativos en `gasto_manual` con afectación atómica a `caja_movimiento` si aplica; visado administrativo inmutable registrado en `caja`; reportes y balances exportables en streaming.

---

### CU-ADMIN-15: Supervisar cierre de caja diario e historial de Reportes Z

> [!NOTE]
> **Caso de Uso Integrado en `CU-ADMIN-14`:** Por decisión de arquitectura y optimización de flujos de trabajo administrativos, las facultades de supervisión de cierres Z, auditoría de turnos de gaveta, visado de Reportes Z digitales y cierre administrativo forzado han sido integradas de forma nativa en la **Pestaña 2 ("Auditoría de Turnos & Reportes Z")** y **Vista 3** del caso de uso maestro **[`CU-ADMIN-14`](#cu-admin-14-gestión-de-flujo-de-caja-gastos-operativos-y-auditoría-de-cierres-z)**. Esto proporciona al administrador un único centro de finanzas y control de cajas sin dispersión de pantallas.

---

### CU-ADMIN-16: Consultar log de auditoría del local (Pospuesto a Fase Futura / Backlog)

**Actor(es):** Administrador del local

**Precondiciones:** Ninguna.

#### Flujo principal

1. El administrador accede a "Auditoría".
2. Filtra por usuario, tipo de acción o rango de fechas (ej. anulaciones, descuentos, cambios de carta).
3. El sistema muestra el historial correspondiente.

**Postcondiciones:** Ninguna (consulta).

> [!NOTE]
> **Trazabilidad Garantizada:** Las operaciones sensibles actuales del local ya cuentan con persistencia y auditoría inmutable directa en sus respectivas tablas transaccionales ACID (`pedido_anulacion`, `auditoria_stock_ajuste`, `comprobante`, `caja.revisado`), por lo que la postergación de esta pantalla centralizada no compromete la integridad forense del sistema.

---

### CU-ADMIN-17: Gestionar promociones

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo; el usuario cuenta con sesión autenticada con rol `admin_local` asignado a dicha sede (`local_id`).

#### Flujo principal

1. El administrador accede a "Promociones" desde el menú operativo de Carta & Ventas.
2. Si el local es nuevo y carece de promociones, el sistema despliega el Onboarding guiado con la **Plantilla Oficial: Descuento de Inauguración (15% OFF durante los primeros 30 días)**, permitiendo su activación en un solo clic, o la opción de crear una promoción personalizada desde cero.
3. El sistema presenta la Bandeja Principal de Promociones con métricas KPI ejecutivas (*Promociones Vigentes (Hoy)*, *Campañas Programadas*, *Descuentos Otorgados este Mes (S/)* y *Cuentas Beneficiadas*), barra de filtrado multifactorial (Estado, Tipo de Descuento, Mes) y tabla de promociones.
4. Para dar de alta una campaña, pulsa `[ + Nueva Promoción ]`. El sistema despliega el modal interactivo de configuración (740px):
   - **Datos Comerciales:** Nombre de la promoción y descripción para el comprobante de venta (impreso en ticket).
   - **Tipo de Descuento (Selector de 2 tarjetas):**
     - *Porcentaje (%):* Define el valor porcentual (1 a 100) y opcionalmente un **Tope Máximo de Descuento en Soles** (`tope_maximo_descuento`) para blindar al restaurante ante cuentas elevadas.
     - *Monto Fijo (S/):* Deducción directa en Soles (validando que no supere el subtotal de la cuenta).
   - **Vigencia:** Fechas de inicio y fin (`fecha_inicio <= fecha_fin`).
   - **Condiciones Opcionales con Toggles Limpios (Sin Sobreingeniería):**
     - `[ ] Exigir consumo mínimo en cuenta de salón` (S/ PEN).
     - `[ ] Limitar cantidad máxima de usos` (Cuponera; si está desmarcado, se guarda como `NULL` = ilimitada durante su vigencia).
     - `[ ] Restringir a días de la semana y horario Happy Hour` (selector de chips Lunes a Domingo y ventana horaria opcional).
   - **Simulador Interactivo de Descuento:** Caja en vivo que calcula al instante el descuento y monto final para una cuenta de prueba digitada por el administrador.
5. El administrador presiona `[ Guardar y Activar Promoción ]`. El backend valida los datos, verifica unicidad (`UNIQUE(local_id, LOWER(nombre))`) y persiste la promoción en estado `activa = true`.
6. **Integración con Caja y Cálculo Predictivo en 1 Clic (`CU-CAJA-02`):**
   - Cuando el cajero genera la cuenta de una mesa con subtotal $S$, el sistema consulta automáticamente las promociones vigentes con un índice parcial sub-milisegundo.
   - El backend devuelve las promociones elegibles con el **monto exacto de descuento ya calculado** en Soles (ej. `-S/ 18.00`, total `S/ 102.00`), permitiendo al cajero aplicar la promoción en 1 solo clic sin cálculos manuales ni memorización de reglas.
7. Al cobrarse el pedido ([`CU-CAJA-03`](#cu-caja-03-cobrar-y-mostrar-comprobante)), el sistema vincula `comprobante.promocion_id`, incrementa `promocion.usos_actuales` e incorpora el descuento en el arqueo de caja y reportes de auditoría.
8. En cualquier momento, el administrador puede:
   - Consultar el modal de **Rendimiento Comercial y Auditoría** de una promoción, revisando ventas brutas generadas, ticket promedio de clientes beneficiados y el historial detallado de boletas/facturas asociadas.
   - Conmutar el switch reactivo para **Pausar o Reactivar** la promoción en caja de inmediato.

#### Flujos alternativos

- Se intenta eliminar (`DELETE`) una promoción que ya cuenta con comprobantes de venta emitidos (**Salvaguarda Contable**):
  - El sistema detecta ventas históricas (`COUNT(comprobante WHERE promocion_id = :id) > 0`) y **bloquea estrictamente el borrado físico (`ON DELETE RESTRICT`)** con código `409 Conflict (ERR_PROMOCION_CON_HISTORIAL)`.
  - El sistema despliega el diálogo informativo de protección contable orientando al administrador a **Pausar** la promoción mediante su switch de estado, preservando intactos los reportes fiscales, arqueos de caja y auditorías pasadas.
- La promoción fue creada por error y tiene 0 usos acumulados (`usos_actuales == 0`) → El sistema solicita confirmación de seguridad y procede con la eliminación física definitiva.
- Se intenta registrar un nombre de promoción ya existente en la misma sede → El sistema rechaza la duplicidad con `409 Conflict (ERR_PROMOCION_DUPLICADA)`.
- La cuenta de una mesa no alcanza el consumo mínimo configurado → El endpoint de caja la clasifica como no elegible con mensaje asistido de venta sugestiva (ej. *"Faltan S/ 15.00 para acceder a este descuento"*).

**Postcondiciones:** Promoción registrada y sincronizada en tiempo real con Caja (`CU-CAJA-02`); descuento precalculado predictivamente; trazabilidad contable auditada y blindada contra borrado accidental.

---

### CU-ADMIN-18: Configurar parámetros operativos de comanda y tiempos de KDS

**Actor(es):** Administrador del local (facultad exclusiva de sede)

**Precondiciones:** El local está activo; el usuario cuenta con sesión activa y rol `admin_local` asignado a la sede (`local_id`).

#### Flujo principal

1. El administrador accede a "Configuración" → "Tiempos de Cocina y KDS" desde el panel de control de su sede.
2. El sistema despliega el panel de configuración operativa cargando los parámetros desde la tabla dedicada `configuracion_kds` (o inicializando con la plantilla estándar de restaurante si es la primera vez):
   - **Umbral Óptimo (Verde) (`tiempo_optimo_verde_min`):** Rango numérico de 3 a 60 minutos (por defecto 15 min). Las comandas con tiempo transcurrido $\le$ este valor se muestran en verde en la pantalla KDS de Cocina (`CU-COCINA-01`).
   - **Umbral de Alerta (Ámbar) (`tiempo_alerta_ambar_min`):** Rango numérico de 5 a 120 minutos (por defecto 25 min). Las comandas con tiempo de espera entre el umbral óptimo y este valor se muestran en color ámbar de advertencia. Toda comanda que supere este umbral conmuta automáticamente a **Rojo Crítico** con parpadeo de alerta en cocina.
   - **Alerta de Pase Caliente para Salón (`tiempo_maximo_pase_min`):** Minutos de tolerancia en que un plato terminado (`estado = 'listo'`) puede esperar en el pase de salida de cocina antes de que la tarjeta en la barra lateral del mozo (`CU-MOZO-01`) parpadee en color de urgencia para evitar que se enfríe (por defecto 3 min).
   - **Alertas Sonoras y Chimes:**
     - `[✓] Timbre sonoro al recibir nueva comanda en KDS` (`alerta_sonora_nueva_comanda`).
     - `[✓] Alarma acústica periódica cuando exista al menos una comanda en rojo crítico` (`alerta_sonora_comanda_roja`, frecuencia parametrizable cada `intervalo_sonido_rojo_seg` segundos, por defecto 60s).
   - **Vista Predeterminada de Pantalla KDS (`vista_predeterminada`):** Selector de 2 tarjetas visuales para definir la pantalla inicial del monitor de cocina: `[ ⊞ Comandas FIFO por Mesa (default) ]` o `[ ☰ Consolidado de Producción (All-Day Summary) ]`.
3. **Simulador Interactivo del Semáforo en Tiempo Real:**
   - En el panel derecho de la pantalla, el sistema proyecta 3 tarjetas de comanda simuladas:
     - *Tarjeta 1 (10 min):* Muestra badge y color verde `[ 🟢 ÓPTIMO ]`.
     - *Tarjeta 2 (18 min):* Muestra badge y color ámbar `[ 🟡 ATENCIÓN ]`.
     - *Tarjeta 3 (28 min):* Muestra badge y color rojo `[ 🔴 CRÍTICO ]` con botón de prioridad.
   - Al mover los sliders o modificar los minutos, las tarjetas simuladas reaccionan al instante en pantalla, permitiendo al administrador previsualizar con certeza visual la experiencia de su brigada de cocina antes de guardar.
4. El administrador presiona `[ ✓ Guardar Configuración de KDS ]` (o `[ Restaurar Valores Recomendados ]` para volver a 15 min / 25 min / 3 min).
5. El backend valida la regla de coherencia temporal (`tiempo_alerta_ambar_min > tiempo_optimo_verde_min`), persiste la tupla en `configuracion_kds` y emite vía Server-Sent Events (SSE) el evento `configuracion_kds_actualizada` en < 30ms hacia los monitores conectados de la sede.
6. Las pantallas KDS de Cocina (`CU-COCINA-01`) y tablets de Mozo (`CU-MOZO-01`) adoptan los nuevos umbrales dinámicamente sin requerir reinicio de sesión ni refresco manual.

#### Flujos alternativos

- El administrador ingresa un tiempo de alerta menor o igual al tiempo óptimo (`tiempo_alerta_ambar_min <= tiempo_optimo_verde_min`) → El sistema bloquea el guardado en frontend y backend con error `422 Unprocessable Entity (ERR_UMBRALES_KDS_INCOHERENTES)`, indicando: *"El umbral de alerta (ámbar) debe ser estrictamente mayor al umbral óptimo (verde)"*.
- El cocinero intenta alterar los umbrales desde la pantalla KDS (`CU-COCINA-01`) → El sistema no expone controles de configuración al rol `cocina`. La parametrización de tiempos es facultad exclusiva del Administrador de local (`rol: admin_local`) para preservar la validez de los reportes gerenciales de desempeño (`CU-ADMIN-13`).
- El usuario pulsa `[ Restaurar Valores Recomendados ]` → El sistema precarga los estándares gastronómicos de la industria (15 min óptimo, 25 min alerta, 3 min pase caliente, sonidos activados y vista FIFO).

**Postcondiciones:** Parámetros y umbrales de tiempos de cocina KDS actualizados en `configuracion_kds`; monitores KDS de cocina y tablets de salón sincronizados en tiempo real vía SSE.

---

### CU-ADMIN-19: Configurar métodos de pago y comisiones de cobro del local

**Actor(es):** Administrador del local (facultad exclusiva de sede)

**Precondiciones:** El local está activo; el usuario cuenta con sesión activa y rol `admin_local` asignado a la sede (`local_id`).

#### Flujo principal

1. El administrador accede a "Configuración" → "Métodos de Pago y Comisiones" desde el panel de control de su sede.
2. El sistema despliega el panel de parametrización dividido en dos columnas integradas (Layout 50/50):
   - **Catálogo de Métodos de Pago (Columna Izquierda):** Carga los medios registrados desde la tabla `metodo_pago_local` (o inicializa automáticamente los 3 métodos canónicos si es un local nuevo):
     - **Efectivo (Cash):** Medio obligatorio por ley. Siempre habilitado (`activo = true`), recargo fijo en `0.00%`.
     - **Tarjeta Débito / Crédito (POS):** Switch de activación (`activo = true/false`), selector numérico de comisión porcentual (`comision_porcentaje`, por defecto `0.00%`, configurable entre 0% y 50%) para compensar costos de pasarela POS, y botón de configuración de terminales.
     - **Billetera Digital (Yape / Plin):** Nace inactiva por defecto (`activo = false`) hasta que el administrador configure los datos del receptor (número telefónico de 9 dígitos y titular/razón social) y cargue el código QR interoperable de cobro. Una vez registrado, se habilita para cobro en salón y precuenta.
     - **Métodos Adicionales (Transferencia Bancaria):** Habilitable para eventos corporativos o pagos anticipados.
   - **Simulador Interactivo de Checkout y Precuenta (Columna Derecha):**
     - Campo numérico interactivo de consumo de prueba (por defecto `S/ 100.00`).
     - Al alternar comisiones o cambiar métodos, el simulador recalcula al vuelo las opciones del Punto de Venta del cajero y proyecta la previsualización del ticket de precuenta de salón con desglose transparente: Subtotal, IGV 18%, Recargo por método de pago (si aplica) y Total a pagar.
3. El administrador pulsa `[ ✓ Guardar Parámetros de Pago ]`.
4. El backend valida:
   - Que al menos un método de pago permanezca en estado `activo = true` (`ERR_MINIMO_UN_PAGO`).
   - Que las comisiones estén dentro del rango permitido (`0.00% <= comision <= 50.00%`).
   - Si una billetera está activa, valida que cuente con su número telefónico de 9 dígitos.
5. El sistema persiste los cambios en la base de datos PostgreSQL 16 y emite el evento reactivo `metodos_pago_actualizados` vía Server-Sent Events (SSE) a todas las terminales conectadas en < 30ms.
6. El Punto de Venta del Cajero (`CU-CAJA-02`, `CU-CAJA-03`) y la comanda de los mozos actualizan de inmediato sus botones de cobro y recargos sin necesidad de recargar la sesión.

#### Flujos alternativos

- **Intento de desactivar todos los métodos de pago (Bloqueo de Seguridad):** Si el administrador intenta desactivar el último medio de pago activo (ej. Efectivo cuando los demás están pausados), el sistema bloquea la acción con error `409 Conflict (ERR_MINIMO_UN_PAGO)` y despliega el modal de contingencia informando que una sede debe mantener al menos una forma de pago activa para evitar la paralización del cobro de comandas en salón.
- **Configuración de datos de Yape/Plin:** Al pulsar `[ Editar Celular & QR ]`, se despliega el modal especializado para registrar el número de celular de 9 dígitos, la razón social del titular y cargar la imagen del código QR interoperable que se proyectará en la precuenta y terminales de cobro.
- **Local nuevo (Primer ingreso):** Si la sede recién fue creada, el sistema despliega el estado de bienvenida guiado (Onboarding) con los 3 métodos pre-aprovisionados con 0% de comisión, permitiendo confirmar la configuración estándar en un solo clic.

**Postcondiciones:** Catálogo de métodos de pago y comisiones porcentuales actualizado en `metodo_pago_local`; terminales de Punto de Venta (POS) sincronizadas en tiempo real vía SSE.

---

# 4. Mozo

### CU-MOZO-01: Ver estado de mesas y centro de comandas en vivo

**Actor(es):** Mozo

**Precondiciones:** El local está activo y en horario de atención; existen ambientes y mesas configurados (`CU-ADMIN-01`); el mozo cuenta con sesión activa asignada a la sede.

#### Flujo principal

1. El mozo accede a "Salón" desde su tablet o dispositivo móvil.
2. El sistema despliega el **Workspace Unificado de Salón** compuesto por dos paneles interactivos en tiempo real:
   - **Área Principal (70% del ancho): Plano Visual de Mesas:**
     - Muestra las mesas en su cuadrícula física por piso o ambiente (`Salón Principal`, `Terraza`, `Barra`), respetando su forma gráfica (cuadrada, redonda, rectangular).
     - Presenta el estado operativo de cada mesa mediante código cromático:
       - `Libre`: Sin comensales ni órdenes pendientes; botón directo `[ + Abrir Mesa ]` para sentar clientes.
       - `Ocupada`: Comensales con pedido activo; muestra tiempo de permanencia (`⏱️ 34 min`), mozo asignado, subtotal acumulado y estado de platos en cocina.
       - `Cuenta Pedida`: Comensales solicitaron la cuenta; esperando comprobante o POS de Caja.
       - `Bloqueada por Reserva`: Bloqueo preventivo inminente ([`CU-ADMIN-10`](#cu-admin-10-configurar-políticas-y-parámetros-de-reservas-de-mesas), ej. 30 min antes); muestra hora pactada y nombre del comensal.
     - Permite conmutar con un solo toque el filtro de foco: `[● Mis Mesas Asignadas]` (mesas de su estación titular) o `[Todo el Salón]` (supervisión global).
    - **Barra Lateral Persistente (30% del ancho, ~390px): Salón & Cocina en Vivo:**
      - **`🥤 Bebidas & Despacho Directo (Listo en Salón)`:** Ítems con `requiere_preparacion = false` (gaseosas, aguas, cervezas en botella, snacks directos). Nacen inmediatamente en estado `listo` al despachar la comanda. Muestra mesa, bebida solicitada (con indicación ej. *Helada* o *Hielo aparte*), cronómetro y botón en 1 toque `[ ✓ Marcar Servido ]` que conmuta a `entregado`.
      - **`🔔 Platos Listos en Pase de Cocina`:** Alertas en caliente cuando la cocina marca un plato caliente (`requiere_preparacion = true`) como `listo` en su monitor KDS ([`CU-COCINA-02`](#cu-cocina-02-cambiar-estado-de-un-plato-en-cocina)). Muestra mesa, plato, cronómetro en barra y botón en 1 toque `[ ✓ Marcar Servido ]` que lo actualiza a `entregado` en el sistema.
      - **`⏳ En Preparación en Cocina`:** Feed de comandas en curso de sus mesas activas con minutos transcurridos.
      - **`⚠️ Alertas Operativas`:** Avisos de platos observados por quiebre de insumos ([`CU-COCINA-04`](#cu-cocina-04-marcar-plato-como-agotado)) para coordinar sustituciones con el cliente.
3. El dispositivo establece una conexión persistente **Server-Sent Events (SSE)** (`GET /api/v1/mozo/stream`), actualizando mesas y comandas instantáneamente (< 30ms) sin necesidad de refresco manual ni recargas de página.
4. Al tocar una mesa ocupada, el sistema despliega el **Quick-Drawer Lateral (440px)** con el desglose plato por plato de la comanda dividido en dos bloques operativos: `-- Platos en Cocina KDS --` (estados `en_cola`, `en_preparacion`, `listo`, `entregado`) y `-- Bebidas y Despacho Directo Salón --` (estados `listo`, `entregado`), notas de comanda, subtotal acumulado y botones rápidos de salón:
   - `[ ＋ Tomar Más Pedidos / Adicionales ]` (conduce a [`CU-MOZO-02`](#cu-mozo-02-tomar-pedido)).
   - `[ 🧾 Solicitar Cuenta a Caja ]` (conmuta a `cuenta_pedida` y alerta a [`CU-CAJA-02`](#cu-caja-02-generar-cuenta-a-partir-de-pedidos-de-una-mesa)).
   - `[ 🔗 Unir con Otra Mesa ]` (conduce a [`CU-MOZO-04`](#cu-mozo-04-unir-o-dividir-mesas)).
   - `[ 🔄 Reasignar a Compañero ]` (transferencia de mesa por cambio de turno).

#### Flujos alternativos

- Se interrumpe momentáneamente la red WiFi del restaurante → El sistema mantiene la visualización en modo lectura con datos en caché local y muestra el indicador sutil `[ ⚠️ Reconectando... Modo Lectura ]` con reconexión automática mediante retroceso exponencial.
- Un plato en cocina supera el tiempo de espera estimado en el pase de salida (> 3 min) → La tarjeta en la barra lateral parpadea en color ámbar/rojo para urgir su recogida y evitar que se enfríe.
- Llega el cliente de una reserva bloqueada → El mozo toca la mesa y presiona `[ Sentar y Abrir Mesa ]`, conmutándola a ocupada y abriendo la comanda.
- El cliente de una reserva no se presenta tras la tolerancia (`tolerancia_no_show_min`) → El mozo puede marcar `[ Liberar Mesa por No-Show ]`, retornándola a estado libre.

**Postcondiciones:** Estado de mesas y comandas sincronizado en tiempo real en salón; bebidas directas y platos de cocina entregados y auditados; solicitudes de cuenta emitidas a caja.

### CU-MOZO-02: Tomar pedido y comanda móvil en salón

**Actor(es):** Mozo (con enrutamiento pasivo a Cocina y preaviso a Cajero)

**Precondiciones:** La mesa está en estado libre u ocupada por el mismo grupo (para rondas adicionales); existen categorías y productos registrados en el local; el mozo cuenta con sesión activa.

*(Nota de arquitectura: CU-MOZO-02 consolida la toma táctil de pedidos y la visualización directa de disponibilidad de carta, y CU-MOZO-03 la modificación antes de despacho. La gestión reactiva de quiebres de insumos en cocina y su resolución en mesa se formaliza en CU-MOZO-07).*

#### Flujo principal

1. El mozo selecciona una mesa desde el plano de salón (`CU-MOZO-01`) y pulsa `[ + Tomar Pedido ]`.
2. El sistema despliega la pantalla táctil dividida: **Catálogo de la Carta (65%)** a la izquierda con disponibilidad en tiempo real (`disponible` / `agotado`), y **Ticket de Comanda (35%)** a la derecha con categorización visual por destino (`[ 🍳 Cocina KDS ]` vs. `[ 🥤 Despacho Directo / Salón ]`).
3. El mozo recorre la carta usando chips de categorías (`Criollos`, `Entradas`, `Bebidas`, etc.) o el buscador instantáneo con debounce.
4. Toca `[ ＋ Añadir ]` sobre los productos deseados; el sistema los incorpora inmediatamente al borrador de comanda local.
5. Para cada plato en el ticket, el mozo puede:
   - Modificar la cantidad en 1 toque usando el stepper numérico táctil (`[ - ] [ cantidad ] [ + ]`).
   - Eliminar el ítem presionando el botón de papelera (`[ 🗑️ ]`).
   - Agregar o editar una nota rápida tocando `[ + Agregar nota ]` o `[ 📝 Editar ]` (nota culinaria para platos de cocina o nota de servicio para bebidas).
6. En el modal rápido de nota (480px), el mozo puede activar la casilla `[✓ Habilitar nota]` e ingresar una indicación corta (ej. *"Término 3/4, sin cebolla"*, *"Hielo aparte, bien helada"*). Si no se activa o no se requiere, la nota se registra limpiamente como `NULL`.
7. Si la mesa ya cuenta con comanda previa (mesa ocupada), el ticket organiza visualmente los ítems por rondas:
   - **Ronda previa (en preparación o servida):** Se visualiza en bloque informativo de referencia para control contable.
   - **Nueva ronda (adicionales):** Se resalta en blanco con su desglose financiero independiente y botón contextual de despacho.
8. El mozo revisa el subtotal, desglose de IGV (18% incluido) y presiona `[ 🚀 Despachar Comanda (X Cocina • Y Salón/Barra) ]`.
9. El backend valida atómicamente la disponibilidad de los productos y ejecuta un **split transaccional de despacho directo vs. cocina KDS**:
   - Para ítems con `requiere_preparacion = true`: se insertan en `pedido_item` con `estado = 'en_cola'`, enrutándose vía Server-Sent Events (SSE) al monitor KDS de Cocina (`CU-COCINA-01`) mediante el evento `nueva_comanda_cocina` en < 30ms.
   - Para ítems con `requiere_preparacion = false`: se insertan directamente con `estado = 'listo'`, omitiéndose del monitor KDS para no generar ruido ni tickets innecesarios en fogones, y habilitándose de inmediato en la barra lateral de la tablet del mozo (`CU-MOZO-01`) para entrega urgente de bebidas en salón.
   - La mesa se actualiza a estado `ocupada`.
10. El frontend confirma con vibración háptica y toast sonoro, retornando al mozo al plano de salón.

#### Flujos alternativos

- **Plato agotado durante la selección (SSE reactivo):** Si cocina marca un producto como agotado mientras el mozo navega la carta, el plato conmuta inmediatamente a badge `[ 🔒 AGOTADO ]` y su botón queda deshabilitado, impidiendo su selección.
- **Conflicto de stock al momento del envío (`409 Conflict`):** Si un producto se agota en cocina en la ventana entre que el mozo lo añadió al ticket y presionó enviar, la transacción se aborta de forma segura y se despliega el modal asistido (Vista 4) con opciones en 1 toque:
  - *Opción A:* `[ Quitar plato agotado y despachar los demás platos a cocina ]`.
  - *Opción B:* `[ Volver al catálogo y ofrecer una alternativa al comensal ]`.
- **Descartar borrador:** El mozo puede pulsar `[ ✕ Descartar Borrador ]` para anular la comanda no enviada sin generar registros residuales ni afectar el estado de la mesa.

**Postcondiciones:** Pedido persistido en base de datos con split operativo ejecutado; platos enrutados al KDS de Cocina; bebidas directas habilitadas en estado `listo` en salón; mesa actualizada a estado `ocupada`; salón y caja notificados en tiempo real.

---

### CU-MOZO-03: Modificar pedido antes de enviarlo a cocina

> **Nota de consolidación:** Este requerimiento ha sido integrado nativamente dentro del flujo de `CU-MOZO-02: Tomar pedido`. Toda modificación táctica antes del despacho a cocina (aumento/disminución de cantidades vía stepper numérico `[ - ] [ + ]`, eliminación de ítems con `[ 🗑️ ]` y edición o retiro de notas de cocina) se efectúa de manera reactiva en el ticket lateral interactivo antes de emitir la confirmación definitiva.

---

### CU-MOZO-04: Unir o dividir mesas

**Actor(es):** Mozo (con preaviso a Cocina KDS y consolidación contable en Caja)

**Precondiciones:** El local está activo; las mesas involucradas pertenecen al mismo ambiente/piso (`piso_id`) y tienen configurado `permite_union = true`; la mesa secundaria está desocupada (`libre`) y sin reserva inminente; el mozo cuenta con sesión activa asignada a la sede. *(Disponible de forma universal para todos los planes SaaS: Starter, Pro y Enterprise)*.

#### Flujo principal: Unir mesas

1. El mozo abre el **Quick-Drawer de Inspección** de una mesa (ej. Mesa 02, capacidad 4 comensales) desde el plano de salón (`CU-MOZO-01`) y pulsa el botón táctil `[ 🔗 Unir con Otra Mesa ]`.
2. El sistema despliega el **Modal Interactivo de Agrupación (620px)** mostrando las mesas candidatas del mismo ambiente:
   - Identifica mesas contiguas elegibles que tienen `permite_union = true` y están en estado `libre` (ej. Mesa 03, capacidad 4).
   - Muestra mesas deshabilitadas con su respectivo motivo de bloqueo (`Ocupada con otra cuenta`, `permite_union = false`, `Bloqueada por reserva inminente`).
3. El mozo selecciona la mesa secundaria (Mesa 03); la calculadora proyectiva en vivo actualiza al instante la nueva etiqueta oficial **`Mesa [ 02 ; 03 ]`** y la capacidad sumada (**`👤 x 8 comensales`**).
4. El mozo presiona `[ 🔗 Confirmar y Crear Mesa [ 02 ; 03 ] ]`.
5. El sistema ejecuta una transacción atómica en PostgreSQL 16:
   - Configura `mesa.mesa_principal_id = mesa_02.id` para la Mesa 03.
   - Vincula los pedidos bajo la mesa titular (Mesa 02).
   - Asienta la acción en `log_auditoria`.
   - Emite el evento Server-Sent Events (SSE) `mesas_unidas` en < 25ms.
6. El plano de salón de todos los mozos actualiza la visualización conectando ambas mesas con un contorno perimetral continuo y el badge **`🔗 MESA [ 02 ; 03 ] • UNIFICADA (Cap: 8)`**.
7. Las comandas despachadas a cocina (`CU-MOZO-02`) y el monitor KDS (`CU-COCINA-01`) exhiben la etiqueta `Mesa [ 02 ; 03 ]`, orientando a mozos y runners sobre la ubicación física exacta del grupo.
8. En Caja (`CU-CAJA-02`), la cuenta se genera de forma consolidada para ambas mesas bajo el identificador `Mesa [ 02 ; 03 ]`.

#### Flujo principal: Dividir mesas

1. Una vez que el grupo canceló su cuenta en Caja ([`CU-CAJA-03`](#cu-caja-03-cobrar-y-mostrar-comprobante)) y se retiró del restaurante, las mesas quedan en estado desocupado.
2. El mozo toca la mesa agrupada y abre el Quick-Drawer, presionando el botón contextual `[ ✂️ Desvincular / Separar Mesas ]`.
3. El sistema despliega el modal de confirmación (540px) informando que la cuenta está liquidada y que cada mesa recuperará su estado individual independiente:
   - `Mesa 02: Estado LIBRE • Capacidad: 👤 x 4 personas`
   - `Mesa 03: Estado LIBRE • Capacidad: 👤 x 4 personas`
4. El mozo presiona `[ ✂️ Confirmar y Separar Mesas ]`.
5. El backend restaura `mesa.mesa_principal_id = NULL`, asienta la separación en `log_auditoria` y emite vía SSE el evento `mesas_divididas`.
6. Ambas mesas vuelven a mostrarse como tarjetas individuales verdes libres en el plano de salón.

#### Flujos alternativos

- **Intento de división con consumos activos en curso (`409 Conflict`):** Si el mozo presiona `[ ✂️ Desvincular / Separar Mesas ]` mientras existen platos en cocina o servidos sin pagar, el sistema bloquea estrictamente la operación física con código `409 Conflict (ERR_MESAS_CON_CONSUMO_ACTIVO)`. La interfaz despliega el **Diálogo de Bloqueo Asistido (Vista 4)** ofreciendo dos salidas inmediatas en 1 toque:
  - *Opción A:* `[ 🧾 Solicitar Cuenta a Caja (CU-CAJA-02) ]` (conmuta a cuenta pedida para cobro).
  - *Opción B:* `[ ⚠️ Anular Comanda si los clientes se retiraron (CU-MOZO-06) ]` (anulación con motivo obligatorio para liberar las mesas).
- **Deshacer unión inmediata por error:** Si el mozo unió dos mesas libres pero el grupo decide ubicarse en otro ambiente antes de enviar pedidos a cocina (`0 platos enviados`), puede pulsar `[ ✂️ Desvincular / Separar ]` y el sistema las separa de inmediato sin requerir intervención de caja ni supervisor.
- **Mesa candidata ocupada o con reserva inminente:** El sistema deshabilita la selección de mesas que no estén estrictamente libres, impidiendo la mezcla accidental de grupos o la invasión de reservas confirmadas.

**Postcondiciones:** Mesas unificadas bajo `Mesa [ 02 ; 03 ]` con comanda consolidada en KDS y Caja; mesas separadas a su estado individual libre una vez desocupadas; auditoría completa y sincronización en tiempo real vía SSE.

### CU-MOZO-05: Gestionar reservas y recepción en salón

**Actor(es):** Mozo / Hostess en sala (con supervisión del Administrador del Local)

**Precondiciones:** El local cuenta con suscripción activa en planes **Pro o Enterprise** (`plan.incluye_reservas = true`); las políticas operativas (`duracion_reserva_min`, `buffer_reserva_min`, `minutos_bloqueo_previo`, `tolerancia_no_show_min`) están configuradas en `politicas_reserva` (`CU-ADMIN-10`); el mozo cuenta con sesión activa en la sede. *(Locales en plan Starter visualizan diálogo asistido de paywall informativo)*.

#### Flujo principal

1. **Acceso a la Bandeja de Salón:** El mozo accede al módulo "Reservas" desde la botonera táctil o el plano de salón. El sistema despliega la **Bandeja Central de Reservas** con selector de fecha (`Hoy`, calendario reactivo), métricas ejecutivas en español (*Reservas de Hoy*, *Próximas en 1 h*, *Atendidas*, *Inasistencias del Día*) y filtros rápidos por píldora.
2. **Alta Rápida de Reserva:** El mozo presiona `[ + Nueva Reserva ]`. El sistema despliega el modal interactivo de 3 pasos:
   - **Paso 1 (Parámetros):** Selecciona fecha, chip de franja horaria táctil (`13:00`, `13:30`, `14:00`, `20:00`) y ajusta comensales con stepper táctil (`[ - ] [ 4 ] [ + ]`).
   - **Paso 2 (Mini-Mapa Espacial de Salón):** El sistema consulta en tiempo real `/mesas-disponibles` evaluando solapamientos (`duracion_reserva_min` 90m + `buffer_reserva_min` 15m). El mozo visualiza la distribución física 5x2 del salón con mesas ocupadas atenuadas y mesas disponibles resaltadas. Toca la mesa deseada (ej. `Mesa 08` o combinación agrupada `Mesa [ 02 ; 03 ]` si tiene `permite_union = true`).
   - **Paso 3 (Ficha del Cliente):** Ingresa nombre completo (ej. "Fam. Gómez"), teléfono móvil (+51) y notas opcionales de cortesía ("Viene con niño, requiere silla alta").
3. **Confirmación y Chip Informativo en Plano:** El mozo presiona `[ 📅 Confirmar y Asignar Mesa ]`. El sistema registra la reserva en `reserva` y `reserva_mesa` (`estado = 'confirmada'`). En el plano visual de mesas (`CU-MOZO-01`), la mesa asignada muestra de inmediato una etiqueta informativa contextual (ej. `Reserva 14:00 • Fam. Gómez`), permitiendo continuar utilizándola para comensales casuales de rotación rápida.
4. **Bloqueo Preventivo Automático:** Cuando el reloj del sistema alcanza la ventana de anticipación (`minutos_bloqueo_previo`, ej. 30 minutos antes de la cita, 13:30), el backend conmuta la reserva a `estado = 'bloqueada'` y emite el evento SSE `mesa_bloqueada_reserva`. En salón, la mesa se actualiza a contorno ámbar punteado `[ BLOQUEADA RESERVA ]`, impidiendo nuevas aperturas casuales.
5. **Recepción del Cliente y Apertura de Comanda:** Al llegar los comensales a la sala, el mozo toca la mesa bloqueada y abre la Ficha de Recepción. Presiona `[ ✓ Sentar Comensales y Abrir Pedido ]`. El sistema ejecuta una transacción atómica:
   - Conmuta la reserva a `estado = 'atendida'`.
   - Inicializa el pedido en borrador (`CU-MOZO-02`) vinculándolo a la mesa.
   - Pasa la mesa a `estado = 'ocupada'` y emite el evento SSE `mesa_estado_cambiado`.
   - Redirige al mozo inmediatamente a la interfaz de toma de pedidos en sala.

#### Flujos alternativos

- **Inasistencia del Cliente tras Ventana de Cortesía (Tolerancia No-Show):**
  - Si los comensales no se presentan llegada la hora pactada, el sistema inicia el cronómetro de tolerancia (`tolerancia_no_show_min`, ej. 15 minutos).
  - Durante este margen, la Ficha de Reserva exhibe el aviso: *"En ventana de cortesía de espera (faltan X min)"*.
  - Al superar los 15 minutos de retraso, la interfaz habilita en color rojo el botón contextual **`[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]`**.
  - Al confirmar la inasistencia, el sistema actualiza la reserva a `estado = 'no_show'` a nivel de base de datos/API, libera la mesa a verde `LIBRE` de inmediato y emite el broadcast SSE `reserva_no_show` a todos los dispositivos en sala.
- **Advertencia de Sobreasignación Preventiva:** Un mozo intenta sentar comensales casuales en una mesa que tiene una reserva inminente (dentro de los 30 min previos) $\rightarrow$ el sistema intercepta la acción con un diálogo modal de advertencia (`409 Conflict`), ofreciendo:
  - *Opción A:* `[ Reasignar Reserva a Mesa 05 y Continuar ]` (mueve la reserva a otra mesa libre equivalente y ocupa la actual).
  - *Opción B:* `[ Ocupar Solo para Consumo Rápido (< 20 min) ]` (fuerza la ocupación bajo responsabilidad del personal).
  - *Opción C:* `[ Cancelar y Elegir Otra Mesa Libre ]`.
- **Intento de Acceso en Plan Starter (Paywall Asistido):** Un operador en un local suscrito al plan Starter intenta ingresar a la sección de reservas $\rightarrow$ el sistema despliega un diálogo didáctico informando que la gestión de reservas y el bloqueo espacial son exclusivos de planes **Pro y Enterprise**, guiando a contactar al propietario sin romper la navegación.
- **Cancelación Voluntaria Anticipada:** El cliente se comunica vía telefónica o WhatsApp para cancelar $\rightarrow$ el mozo abre la ficha, presiona `[ ✕ Cancelar Reserva ]`, ingresa obligatoriamente el motivo y el sistema libera la mesa inmediatamente, registrando la auditoría.

**Postcondiciones:** Reserva gestionada integralmente; mesa asignada espacialmente desde el origen; bloqueo preventivo automatizado vía SSE; comanda abierta al sentar; mesas liberadas de inmediato ante inasistencia o cancelación; soporte exclusivo para planes Pro/Enterprise.

### CU-MOZO-06: Anular pedido (o ítem de pedido) con motivo

**Actor(es):** Mozo (con notificación en tiempo real a Cocina KDS, Administrador del Local y Cajero)

**Precondiciones:** Existe un pedido registrado y enviado a Cocina (`pedido.estado = 'enviado'`), aún no cobrado en caja; el mozo cuenta con sesión activa asignada a la sede.

#### Flujo principal

1. El mozo abre el **Quick-Drawer de Inspección de Mesa Ocupada** (`CU-MOZO-01`, Vista 2) al tocar una mesa activa en el plano de salón.
2. Identifica el plato a anular y presiona el botón táctil `[ ✕ Anular ]` ubicado en la tarjeta del ítem.
3. El sistema despliega el modal interactivo de anulación (Vista 2, 520px) informando el estado actual del plato (ej. *En Preparación en Cocina*) y advirtiendo que la cocción se detendrá.
4. El mozo selecciona una categoría mediante los chips de motivos frecuentes (`[ Error al registrar ]`, `[ Demora / Desistimiento ]`, `[ Queja de calidad ]`, `[ Cambio de plato ]`, `[ Otro ]`) e ingresa la justificación detallada (mínimo 10 caracteres obligatorios).
5. Presiona `[ 🛑 Confirmar Anulación de Ítem ]`.
6. El sistema ejecuta la anulación de forma inmediata (sin requerir clave ni presencia física de un supervisor gerencial para evitar cuellos de botella y merma culinaria innecesaria):
   - Conmuta el ítem a `estado = 'anulado'` en `pedido_item`, registrando el motivo y el usuario auditor (`anulado_por`).
   - Si el ítem estaba `en_cola` o `en_preparacion`, emite vía Server-Sent Events (SSE) una alerta acústica y visual instantánea (< 30ms) al monitor KDS de Cocina (`CU-COCINA-01`) para detener los fogones.
   - Recalcula el subtotal acumulado de la mesa y actualiza el pre-conteo de Caja (`CU-CAJA-02`).
   - Envía una notificación push/SSE de alta prioridad al Administrador del Local (`CU-ADMIN-12`) con el detalle del incidente y asienta el evento en `log_auditoria`.
7. Si el ítem anulado era el único restante en la comanda (o el mozo solicitó anulación total de la mesa mediante el botón `[ ⚠️ Anular Comanda Completa ]`), el sistema cancela el pedido completo y conmuta automáticamente la mesa a estado `libre` en el plano de salón.
8. El frontend actualiza el Quick-Drawer con confirmación háptica y visual.

#### Flujos alternativos

- **Ítem ya listo o servido en mesa (Tratamiento de Merma):** Si el plato ya fue marcado como `listo` o `entregado`, el sistema despliega el modal de tratamiento especial (Vista 4). Al anularlo, no revierte el stock físico de insumos de cocina; registra automáticamente la anulación con la bandera de merma activa (`es_merma = true`) para no distorsionar los costos reales de recetas (`CU-ADMIN-05`) ni los arqueos de inventario (`CU-ADMIN-03`).
- **Anulación total de la comanda de la mesa:** El mozo pulsa `[ ⚠️ Anular Comanda Completa de Mesa 04 ]` al pie del Quick-Drawer. Se despliega el modal de advertencia crítica (Vista 3), donde selecciona el motivo de cancelación de la mesa (`Mesa se retiró sin consumir`, `Error de apertura de mesa`, `Emergencia en salón`), marca la casilla de confirmación `[✓]` y procede. La comanda se archiva como anulada y la mesa se libera al instante.
- **Cancelación del diálogo de anulación:** El mozo pulsa `[ Cancelar ]`; el modal se cierra y la comanda permanece intacta sin modificaciones ni registros residuales.

**Postcondiciones:** Ítem o comanda anulado en base de datos; alerta sonora/visual transmitida a Cocina KDS; mesa liberada si quedó sin consumos; evento auditado y Administrador del Local notificado en tiempo real; merma asentada si el plato ya había sido preparado.

---

### CU-MOZO-07: Atender incidencia de plato no disponible y resolver en mesa

**Actor(es):** Mozo (con interacción directa con el comensal en mesa, notificación en tiempo real a Cocina KDS y auditoría hacia Administrador del Local)

**Precondiciones:** Existe un pedido activo con al menos un ítem en estado `en_cola` o `en_preparacion`; Cocina marca un plato como `agotado` por quiebre de insumos (`CU-COCINA-04`) o Administración lo bloquea en la carta (`CU-ADMIN-03`); el backend conmuta automáticamente el ítem a `estado = 'no_disponible'`; el mozo cuenta con sesión activa asignada a la sede.

#### Flujo principal

1. **Recepción reactiva de la alerta en sala (< 30ms):**
   - El sistema transmite vía Server-Sent Events (SSE) el evento `plato_no_disponible` a la tablet del mozo responsable de la mesa.
   - La tablet emite un sonido sutil de notificación, despliega el banner flotante superior (*"⚠️ Incidencia en Cocina: [Plato] AGOTADO • Mesa [XX] requiere atención inmediata"*) y resalta la tarjeta de la mesa en el plano de salón con contorno de advertencia y badge **`[ ⚠️ QUIEBRE COCINA ]`**.
2. **Apertura de la comanda y diálogo asistido:**
   - El mozo toca la mesa o presiona `[ Ver y Resolver en Mesa ]` en el banner superior, desplegando el Quick-Drawer lateral de inspección.
   - En la cabecera del drawer se destaca el recuadro de acción prioritaria: *"⚠️ PLATO OBSERVADO POR COCINA — 1x [Nombre del Plato] (S/ XX.XX). Insumo agotado en cocina"*, ofreciendo los botones táctiles: `[ 🔄 Sustituir Plato ]` y `[ ✕ Anular de Cuenta ]`.
3. **Coordinación empática con el comensal:**
   - El mozo se acerca de inmediato a la mesa y explica la contingencia con amabilidad, proponiendo alternativas culinarias.
4. **Resolución - Alternativa A (Sustitución por otro plato de carta):**
   - El comensal acepta reemplazar el plato por otra opción (ej. cambiar *Lomo Saltado* por *Asado de Tira con Puré* o cualquier otra alternativa de la carta).
   - El mozo presiona `[ 🔄 Sustituir Plato ]` y el sistema despliega el **Catálogo Universal de Sustitución (760px)**:
     - **6 Recomendaciones Directas por Defecto:** El sistema precarga de inmediato hasta 6 platos disponibles en cocina priorizando la misma categoría y ordenando por cercanía matemática de precio (`ABS(precio - precio_original)`), garantizando que las opciones iniciales respeten el rango presupuestario del comensal sin inventar campos ficticios en base de datos.
     - **Búsqueda en Toda la Carta:** Si el cliente desea algo completamente distinto (ej. cambiar una carne por un ceviche, pasta o ensalada), el mozo puede escribir en el buscador instantáneo universal o pulsar cualquiera de los chips de categorías (`Toda la Carta`, `Carnes`, `Mariscos`, `Pastas`, `Criollos`, `Bebidas`). El sistema filtra en tiempo real garantizando que solo se muestren productos con stock disponible en cocina.
     - **Cálculo Dinámico de Diferencial de Precio:** La interfaz indica de forma transparente si el nuevo plato tiene el mismo precio (`S/ 0.00`), requiere un adicional (`+ S/ 4.00`) o genera un saldo a favor del cliente (`- S/ 6.00 A Favor`), proyectando el nuevo subtotal de la mesa.
     - **Salida Asistida si no Convence Nada:** Si tras revisar la carta el comensal no se convence por ninguna opción, el mozo puede:
       - Presionar `[ ← Volver a Opciones ]` en la cabecera para regresar al modal de decisión.
       - O presionar directamente en el pie del catálogo **`[ ✕ Cliente Desiste: Anular Plato (S/ 0.00) ]`**, saltando de inmediato a la confirmación de retiro del plato sin tener que salir y volver a empezar.
   - Si el comensal confirma el reemplazo, el mozo pulsa `[ ✓ Confirmar Sustitución y Enviar a Cocina ]`. El sistema ejecuta la transacción atómica: conmuta el ítem no disponible a `anulado` (`motivo_anulacion = 'sustituido_por_quiebre'`), inserta el nuevo ítem en `pedido_item` con `estado = 'en_cola'`, despacha la nueva orden a la pantalla KDS de Cocina (`CU-COCINA-01`) y actualiza el subtotal de la mesa.
5. **Resolución - Alternativa B (Anulación sin costo por quiebre de stock):**
   - El comensal desiste y prefiere no pedir otro plato (sea desde la opción directa del drawer o mediante el botón de desistimiento del catálogo).
   - El sistema abre el modal de confirmación rápida (580px) informando que el plato se retirará sin costo para el cliente y que el incidente se reportará automáticamente a la administración.
   - El mozo selecciona o redacta el detalle del descarte y presiona `[ Confirmar Anulación y Retiro de Cuenta ]`.
   - El sistema ejecuta la transacción atómica:
     - Conmuta el ítem a `anulado` en `pedido_item`.
     - Inserta el registro inmutable en `pedido_anulacion` con `motivo_categoria = 'quiebre_stock_cocina'`, `estado_anterior = 'no_disponible'`, `es_merma = false` (no existió merma culinaria física al no haberse cocinado), importes congelados y marcas de auditoría.
     - Recalcula el saldo pendiente de la mesa (descontando el valor íntegro del plato).
     - Emite el evento SSE `notificacion_anulacion` alertando al Administrador del Local en `CU-ADMIN-12` para supervisión de compras y mermas.
     - Si la comanda no contiene más ítems activos, cierra el pedido y conmuta la mesa a `estado = 'libre'` en el plano de salón.
6. El Quick-Drawer retira la alerta de quiebre y el plano de salón restablece el estado regular de la mesa.

#### Flujos alternativos

- **Plato sustituto de menor precio:** Si el cliente elige un plato más económico que el original, el sistema deduce la diferencia de precio a su favor, actualizando el subtotal de la mesa a la baja.
- **Cliente cambia de opinión en catálogo:** El mozo puede regresar atrás en cualquier momento con `[ ← Volver a Opciones ]` o ejecutar el desistimiento directo en el footer `[ ✕ Cliente Desiste: Anular Plato ]` sin pasos redundantes.
- **Múltiples platos afectados por el mismo insumo:** Si un quiebre de insumo en cocina afectó a varias mesas simultáneamente, el sistema genera alertas independientes y ordenadas por orden cronológico de comanda para que el personal atienda cada salón según prioridad de llegada.
- **Cancelación del diálogo de resolución:** El mozo cierra el diálogo sin confirmar cambios; la mesa conserva el badge `[ ⚠️ QUIEBRE COCINA ]` hasta que se concrete formalmente la sustitución o anulación frente al cliente.

**Postcondiciones:** Incidencia de quiebre de cocina resuelta en sala sin fricción con el cliente; comanda de reemplazo enviada a Cocina KDS (si sustituye) o ítem retirado de la cuenta sin costo (si anula); auditoría asentada en `pedido_anulacion` con `es_merma = false` y reportada a `CU-ADMIN-12`; total de mesa actualizado.

---

### CU-MOZO-08: Consultar y presentar precuenta digital en mesa

**Actor(es):** `mozo` (Personal de atención en sala; operador táctil en tablet/móvil), `comensal` (Receptor de la precuenta y emisor del pago), `cajero` (Validador de cobro y emisor del comprobante formal en `CU-CAJA-03`)

**Precondiciones:** La mesa se encuentra en estado `ocupada` con pedidos despachados activos en `pedido` y `pedido_item`; el mozo cuenta con sesión activa asignada a la sede; las promociones vigentes de `CU-ADMIN-17` y los métodos de pago de `CU-ADMIN-19` están pre-configurados. **No requiere que el cajero esté interactuando ni aprobando previamente la cuenta (cálculo determinista on-demand en < 15ms).**

#### Flujo principal

1. **Solicitud directa en mesa:** El comensal solicita la cuenta al mozo (*"Joven, la cuenta por favor"*).
2. **Apertura de precuenta digital:** El mozo toca la mesa en el plano visual de salón (`CU-MOZO-01`), abre el Quick-Drawer lateral de inspección y presiona el botón contextual `[ 🧾 Precuenta Digital ]`.
3. **Cálculo determinista instantáneo (< 15ms):** El sistema consulta `GET /api/v1/mozo/mesas/{mesa_id}/precuenta` y despliega el **Modal Táctil de Precuenta Digital con Promociones Integradas (Vista 1)**:
   - Resumen de la mesa: Mesa 04, 4 comensales, comanda #108, tiempo activa (32 min).
   - Banner conciso de cocina: `⚠️ 1 plato 'Lomo Saltado' en 'preparación'` (no bloqueante).
   - Consolidado de platos y bebidas pedidos con notas agregadas, cantidades, precio unitario congelado y subtotales (Consumo Bruto: S/ 100.00).
   - Promociones comerciales vigentes de `CU-ADMIN-17`: Chip activo *"Descuento Almuerzo Ejecutivo (15% dscto) - Ahorro: - S/ 15.00"* con botón de alternancia en 1 toque.
   - Desglose oficial SUNAT Perú: Consumo Bruto (S/ 100.00), Descuento Comercial (- S/ 15.00), **Total Neto a Cobrar (S/ 85.00)**, Base Imponible gravada (S/ 72.03) e IGV 18% (S/ 12.97).
   - Selector limpio de métodos de pago (`CU-ADMIN-19`): `[ 💵 Efectivo — S/ 85.00 ]`, `[ 📱 Billetera Digital (Yape / Plin) — S/ 85.00 (Tocar para ver QR) ]`, y `[ 💳 Tarjeta POS — S/ 87.98 (+3.5%) ]`.
4. **Presentación de opciones al comensal:** El mozo gira la tablet o informa verbalmente los importes exactos según el canal de pago preferido.
5. **Divulgación Progresiva para Billetera Digital (Vista 2):**
   - Si el comensal decide pagar con Yape o Plin, el mozo toca la tarjeta de Billetera Digital.
   - Se abre el panel enfocado exhibiendo el **Código QR dinámico en alta resolución** en pantalla, el número del local (`987 654 321`), el titular (`Restaurant S.A.C.`) y el monto exacto a transferir (`S/ 85.00`).
   - El comensal escanea el QR desde su propio móvil en la mesa y transfiere el dinero.
   - El mozo verifica el voucher en la pantalla del cliente, captura opcionalmente el código de operación (`581902`) y presiona `[ ⚡ Confirmar y Notificar a Caja ]`.
6. **Notificación reactiva a Caja (Cero Papel y Cero Esperas):**
   - El sistema ejecuta `POST /api/v1/mozo/mesas/{mesa_id}/solicitar-cuenta`.
   - Conmuta `pedido.estado = 'cuenta_pedida'`, registra `precuenta_generada_at = NOW()` y asienta el método tentativo y número de operación.
   - Emite vía Server-Sent Events (SSE) el evento `cuenta_solicitada` al hub local de la sede.
   - El Monitor POS de Caja (`CU-CAJA-02`) recibe la notificación instantánea (< 25ms) con los montos precargados.
7. **Retorno al plano de salón (Vista 3):**
   - El mozo vuelve al plano de salón. La Mesa 04 luce el badge ámbar prioritario `[ 💳 CUENTA PEDIDA • S/ 85.00 • YAPE ]`.
   - La cabecera despliega el toast accesible: *"✓ Precuenta de Mesa 04 (S/ 85.00) enviada a Caja vía SSE. Esperando confirmación de cajero."*.
   - El Quick-Drawer indica que la mesa está a la espera de que el cajero valide el voucher y emita el comprobante formal en `CU-CAJA-03`.

#### Flujos alternativos

- **El comensal prefiere pagar en efectivo:** El mozo selecciona la opción de efectivo y presiona directamente `[ ⚡ Notificar a Caja para Cobro ]`. El mozo traslada el efectivo al counter o acompaña al cliente para la validación.
- **El comensal paga con tarjeta física:** El mozo selecciona Tarjeta POS (`S/ 87.98`); el cajero o runner acerca la terminal POS inalámbrica a la mesa.
- **Retiro o cambio de promoción comercial:** El mozo toca `[ ✕ Quitar ]` en el chip de promoción; el sistema restaura el consumo bruto (S/ 100.00) y recalcula la Base Imponible e IGV en < 10ms.
- **Platos en cocina pendientes de entrega:** El banner informativo conciso previene confusiones pero **no bloquea** la precuenta ni el cobro.

**Postcondiciones:** Precuenta digital presentada en mesa sin tickets de papel térmico; promoción comercial y desglose fiscal SUNAT fijados; comensal atendido en menos de 10 segundos; mesa conmutada a `cuenta_pedida`; notificación SSE recibida en Caja con comanda lista para validación y emisión de Boleta/Factura electrónica (`CU-CAJA-03`).

---

### CU-MOZO-09: Subdividir comanda en mesa y asociar comprobantes (Factura, Boleta, Nota de Venta)

**Actor(es):** `mozo` (Personal de atención en sala; operador táctil en tablet/móvil), `comensal` (Receptor de subcuentas y pagador), `cajero` (Receptor de la estructura dividida en `CU-CAJA-02` y emisor formal en `CU-CAJA-03`)

**Precondiciones:** La mesa se encuentra en estado `ocupada` con pedidos despachados activos en `pedido` y `pedido_item`; el mozo cuenta con sesión activa asignada a la sede; la comanda cuenta con más de un ítem consumido o más de un comensal. Puede invocarse directamente desde el Quick-Drawer de mesa en `CU-MOZO-01` o desde el modal de precuenta digital en `CU-MOZO-08`.

#### Flujo principal

1. **Invocación de subdivisión:** El comensal solicita pagar por separado en mesa. El mozo pulsa `[ ➗ Dividir Cuenta ]` en el Quick-Drawer de `CU-MOZO-01` o `[ ➗ Dividir en Subcuentas ]` en la precuenta de `CU-MOZO-08`.
2. **Paso 1: Asignación determinista de platos (Cero azar):**
   - El sistema despliega la Vista 1 con la bandeja de ítems de la mesa (izquierda) y las subcuentas activas (derecha).
   - El mozo asigna uno por uno (o mediante selección múltiple táctil / drag & drop) los platos a la Subcuenta 1, Subcuenta 2, o crea nuevas subcuentas (`[ ＋ Añadir Subcuenta ]`).
   - Si un plato tiene cantidad $> 1$, puede presionar `[ ✂ Desglosar Unidades ]` para asignar unidades independientes a comensales distintos.
   - El indicador valida en tiempo real: *"4 de 4 platos distribuidos (100%) • S/ 0.00 pendiente"*.
   - El botón de avance permanece inhabilitado hasta que el 100% de los ítems estén distribuidos.
3. **Paso 2: Configuración individual por subcuenta:**
   - El sistema transiciona a la Vista 2 presentando tarjetas paralelas para cada subcuenta creada.
   - **Promoción comercial independiente (`CU-ADMIN-17`):** Cada subcuenta cuenta con su propio selector de promociones vigentes. Subcuenta 1 aplica a *Descuento Almuerzo Ejecutivo (15% dscto)* con ahorro de `- S/ 5.70`; Subcuenta 2 abona tarifa íntegra regular.
   - **Tipo de comprobante solicitado (3 opciones):**
     - Si **Factura:** Digita RUC (11 dígitos, inicia 10 o 20) y consulta SUNAT, autocompletando Razón Social y Domicilio Fiscal.
     - Si **Boleta:** Digita DNI (8 dígitos) y consulta RENIEC, autocompletando Nombres y Apellidos. Permite casilla *"Consumidor Final sin documento"* si el monto es menor a S/ 700.00.
     - Si **Nota de Venta:** Solicita únicamente el *Nombre del Cliente* (ej. "Andrés Pérez"), sin requerir DNI/RUC ni validación fiscal, con emisión/impresión física opcional.
   - **Medio de pago previsto (`CU-ADMIN-19`):** Asigna Efectivo, Tarjeta POS (con recargo proyectado +3.5%) o Billetera Digital (Yape/Plin).
   - **Cálculo tributario individual:** Cada subcuenta desglosa su propio Consumo Bruto, Descuento Comercial, Subtotal Neto, Base Imponible e IGV del 18%.
4. **Envío y notificación a Caja (Límite Mozo):**
   - El mozo presiona `[ 📤 Confirmar y Enviar Subcuentas a Caja ]`.
   - El backend persiste las subcuentas en `pedido_subcuenta` y `pedido_subcuenta_item`.
   - Conmuta el pedido a estado `cuenta_pedida`.
   - Emite el evento Server-Sent Events (SSE) `cuenta_dividida_solicitada` hacia el Monitor POS de Caja (`CU-CAJA-02` / `CU-CAJA-03`).
5. **Retorno a salón (Vista 3):**
   - La tablet regresa al plano de salón exhibiendo la Mesa 04 con el badge prioritario `[ 💳 DIVIDIDA (2) • S/ 95.43 NETO ]`.
   - El toast accesible confirma: *"✓ Subdivisión de Mesa 04 (2 subcuentas) enviada a Caja vía SSE. Esperando cobro del cajero."*
   - El Quick-Drawer lateral visualiza el estado individual de cada subcuenta en espera. El mozo no emite comprobantes ni cobra.

#### Flujos alternativos

- **Un ítem queda sin asignar en Paso 1:** El sistema bloquea el avance al Paso 2 y resalta con borde de advertencia la bandeja izquierda.
- **RUC inválido o no habido en SUNAT:** El sistema informa el error de consulta y permite corregir el número o cambiar a Boleta/Nota de Venta.
- **Reapertura de comanda por comensales que desean ordenar algo más:** El mozo puede pulsar `[ ↺ Reabrir Comanda ]` en el Quick-Drawer; el sistema anula las subcuentas tentativas y retorna la mesa a `ocupada` para admitir nuevas rondas.

**Postcondiciones:** Subcuentas estructuradas y guardadas en base de datos; comanda en estado `cuenta_pedida`; desglose tributario y promociones congeladas por subcuenta; notificación SSE recibida en Caja lista para validación y emisión en `CU-CAJA-03`; mesa bloqueada para nuevos platos en cocina; mozo deslindado de cobranza fiscal.

---

# 5. Cocina


### CU-COCINA-01: Ver cola de pedidos entrantes (Kitchen Display System - KDS)

**Actor(es):** `cocina` (Cocinero, Jefe de Cocina, Maestro Parrillero, Chef de Partida)

**Precondiciones:** El local está activo; el usuario cuenta con sesión autenticada con rol `cocina` asignado a la sede (`local_id`); existen pedidos enviados desde salón (`CU-MOZO-02`) con ítems culinarios pendientes de preparación.

#### Flujo principal

1. La brigada de cocina accede a la pantalla de "KDS Cocina". El sistema establece la conexión reactiva persistente vía Server-Sent Events (SSE: `/api/v1/cocina/stream`) y carga el estado de comandas activas.
2. El sistema aplica el **filtro estricto de despacho culinario**: consulta y exhibe exclusivamente productos con `pr.requiere_preparacion = true` (aprovechando el índice parcial `idx_producto_requiere_prep`). Los productos directos de salón (gaseosas, cervezas comerciales, infusiones de filtro y snacks empaquetados) son excluidos de los fogones y se presentan únicamente como un chip informativo al pie del ticket (`[ 🥤 X Bebidas salón (atendidas por mozo) ]`).
3. El sistema organiza las tarjetas de comanda en una rejilla horizontal fluida de 4 columnas en estricto orden cronológico de llegada (**FIFO**).
4. Para cada comanda, el sistema evalúa dinámicamente los minutos de espera transcurridos (`minutos_espera = EXTRACT(EPOCH FROM (NOW() - p.fecha_apertura)) / 60`) contra los umbrales configurados para la sede en `configuracion_kds` ([`CU-ADMIN-18`](#cu-admin-18-configurar-parámetros-operativos-de-comanda-y-tiempos-de-kds)):
   - 🟢 **Verde (Estado Óptimo):** `minutos_espera <= tiempo_optimo_verde_min` (por defecto <= 15 min). Borde y cabecera esmeralda.
   - 🟡 **Ámbar (Advertencia de Demora):** `minutos_espera > tiempo_optimo_verde_min` y `<= tiempo_alerta_ambar_min` (por defecto 16 a 25 min). Borde y cabecera ámbar.
   - 🔴 **Rojo Crítico (Prioridad 1 / Demorado):** `minutos_espera > tiempo_alerta_ambar_min` (por defecto > 25 min). Borde y cabecera rojo fuego, badge `[ 🚨 REQUERIDO FOGÓN INMEDIATO ]` y botón prioritario rojo para agilizar el despacho.
5. Si la orden proviene de mesas combinadas ([`CU-MOZO-04`](#cu-mozo-04-agrupar-y-dividir-mesas)), el sistema renderiza la cabecera unificada `Mesa [ 02 ; 03 ]` con el icono `🔗` y badge `[ GRUPO UNIDO ]`, indicando que la comanda debe emplatarse coordinadamente.
6. El sistema identifica y etiqueta claramente las fases del comensal: `Ronda 1 (Entradas y Principales)` o `Ronda 2 (Adicionales y Postres)` ([`CU-MOZO-02`](#cu-mozo-02-tomar-pedido-y-enviar-comanda)).
7. El personal puede alternar en un toque entre dos modos de visualización:
   - **Comandas FIFO por Mesa:** Vista predeterminada de tickets columnares para seguimiento cronológico mesa por mesa.
   - **Consolidado de Producción en Vivo ("All-Day Summary"):** Acumulador global que agrupa y totaliza las raciones pendientes de cocción por plato y estación física (Fogones & Criollos, Brasas & Horno, Fríos & Entradas), permitiendo al jefe de cocina coordinar tandas masivas en sartenes y woks.
8. La pantalla permite filtrar en cualquier momento por partida culinaria (`[ Todas ]`, `[ Calientes / Fogones ]`, `[ Fríos / Ceviches ]`, `[ Brasas / Horno ]`), optimizando la distribución del trabajo en locales con múltiples estaciones o pantallas especializadas.
9. Al tocar una comanda, se despliega la **Ficha Técnica de Detalle Ampliado (Modal 680px)**, permitiendo consultar los insumos de inventario vinculados por receta ([`CU-ADMIN-04`](#cu-admin-04-gestionar-carta-y-menú)), revisar notas de comensales y alérgenos en tipografía contrastada, o presionar `[ ✓ Despachar Todo al Pase de Salón ]` para liberar la orden completa en un solo toque.

#### Flujos alternativos

- **Salón anula o sustituye un plato en preparación (Parada Reactiva de Fogones):** Si el mozo o administrador anula un plato por demora excesiva o quiebre de stock ([`CU-MOZO-06`](#cu-mozo-06-anular-pedido-o-ítem-con-merma) / [`CU-MOZO-07`](#cu-mozo-07-gestionar-quiebres-de-stock-en-salón)), el KDS recibe el evento SSE `item_pedido_anulado` en < 30ms:
  - Se despliega automáticamente el modal de alerta roja **"PARADA DE FOGONES"** con borde pulsante.
  - Si está configurado en la sede, se emite una alarma acústica de detención.
  - El plato en el ticket se tacha (`~~Nombre~~`) con el badge rojo `[ ANULADO ]`.
  - Se notifica al cocinero la instrucción operativa: *"Detener cocción inmediatamente. No emplatar para evitar merma de insumos físicos (es_merma = false)"*.
  - El cocinero toca `[ ✓ Entendido / Retirar Plato de la Comanda ]` para confirmar y reanudar la vista regular.
- **Interrupción o reconexión de red local:** Si se interrumpe la conexión SSE, el sistema despliega un banner ámbar superior persistente, mantiene el estado actual en memoria y ejecuta reconexión automática con retroceso exponencial (1s, 2s, 4s). Al reconectar, ejecuta una sincronización diferencial vía `GET /api/v1/cocina/comandas` para reflejar cualquier cambio ocurrido durante la desconexión.
- **Toque accidental al cambiar estado de plato:** Si un cocinero marca por error un plato como "Listo", el botón muta temporalmente a `[ Deshacer ]` durante 30 segundos, permitiendo revertir el estado a "En Preparación" sin requerir intervención de supervisor.

**Postcondiciones:** Cola de pedidos visualizada y priorizada en estricto FIFO; semáforos de tiempo sincronizados con las políticas de sede (`CU-ADMIN-18`); productos directos de salón filtrados de los fogones; insumos protegidos ante cancelaciones reactivas; tiempos de pase y despacho notificados al runner de salón en tiempo real.

### CU-COCINA-02: Actualizar estado de preparación

**Actor(es):** `cocina` (Cocinero, Jefe de Cocina, Maestro Parrillero, Chef de Partida) y `mozo` (Recepción en sala)

**Precondiciones:** El local está activo; existen ítems de comanda culinarios en estado `en_cola` o `en_preparacion` en el KDS de la sede ([`CU-COCINA-01`](#cu-cocina-01-ver-cola-de-pedidos-entrantes-kitchen-display-system---kds)).

#### Flujo principal

1. El cocinero visualiza el plato en estado `en_cola` ("Por Preparar") en su pantalla KDS y pulsa el botón táctil `[ 🔥 Poner en Fuego ]`.
2. El sistema actualiza `pedido_item.estado = 'en_preparacion'`, registra `fecha_inicio_coccion = NOW()` y emite en < 25ms el evento SSE `item_estado_actualizado` hacia la tablet del Mozo asignado ([`CU-MOZO-01`](#cu-mozo-01-ver-estado-de-mesas-y-centro-de-comandas-en-vivo)). En el KDS, el botón muta a naranja vibrante `[ 🔥 En Fuego (MM:SS) ]` con un temporizador activo de cocción.
3. Al culminar la preparación y emplatar la porción, el cocinero presiona `[ ✓ Listo en Pase ]`.
4. El sistema ejecuta una **transacción atómica ACID**:
   - Actualiza `pedido_item.estado = 'listo'` y registra `fecha_listo_cocina = NOW()`.
   - Descuenta automáticamente del inventario los insumos vinculados por receta culinaria ([`CU-COCINA-03`](#cu-cocina-03-descuento-automático-de-insumos-por-consumo)).
   - Emite el evento SSE `item_listo_pase` hacia la tablet del Mozo y pantalla del runner en < 25ms, activando la cuenta regresiva de tolerancia en pase caliente (por defecto 3 minutos, parametrizable en [`CU-ADMIN-18`](#cu-admin-18-configurar-parámetros-operativos-de-comanda-y-tiempos-de-kds)).
5. En la comanda del KDS, el plato pasa a estado visual `[ ✓ LISTO EN PASE ]` y el botón muta temporalmente a **`[ ↺ Deshacer (30s) ]`** con un contador decreciente de seguridad.
6. Si transcurren los 30 segundos sin intervención, el botón de deshacer desaparece permanentemente y la preparación queda consolidada.
7. Cuando todos los platos culinarios de la comanda están listos, el cocinero o jefe de pase presiona `[ ✓ Despachar Pedido Completo ]`. El ticket sale de la pantalla activa del KDS y se traslada a la bandeja de órdenes despachadas recientes (`[ ⏱️ Pedidos Despachados ]`).

#### Flujos alternativos

- **Deshacer toque accidental con Rollback de Insumos (Ventana de 30 segundos):** Si el cocinero pulsó "Listo en Pase" por error o en la comanda equivocada, presiona `[ ↺ Deshacer ]` dentro de los 30 segundos. El sistema ejecuta una transacción atómica que:
  - Revierte `pedido_item.estado` a `'en_preparacion'`.
  - Limpia `fecha_listo_cocina = NULL`.
  - **Ejecuta el rollback de inventario:** Repone exactamente las cantidades descontadas a `insumo.stock_actual` para cada ingrediente de la receta y restaura el insumo a `'disponible'` si se había marcado como agotado, preservando el 100% de la exactitud física de bodega.
  - Emite el evento SSE `item_revertido_cocina` a la tablet del mozo para cancelar el aviso de recojo en sala.
  - En el KDS, el botón vuelve a mostrarse en estado `[ 🔥 En Fuego ]`.
- **Recuperar comanda despachada por error (Devolver a Cocina dentro de 30 minutos):** Si sala o el runner reportan que faltó una guarnición o hubo confusión en la entrega, el cocinero pulsa `[ ⏱️ Pedidos Despachados ]`, localiza la comanda (disponible durante los últimos 30 minutos) y presiona `[ ↺ Devolver a Cocina ]`. La orden reaparece inmediatamente en el tablero activo del KDS en su posición cronológica original.
- **Preparación masiva por tandas desde Consolidado All-Day:** En horas de alta demanda, el jefe de partida accede a `[ ☰ Consolidado All-Day ]` y puede pulsar `[ 🔥 Poner Todos en Fuego (4x) ]` o `[ ✓ 2x Listos en Pase ]` en un plato acumulado. El sistema distribuye automáticamente las porciones a las comandas de las mesas correspondientes respetando el orden de llegada (**FIFO**) y descontando sus recetas correspondientes.

**Postcondiciones:** Estados de plato actualizados con trazabilidad de segundos de cocción; insumos de bodega descontados o reintegrados atómicamente; runner y mozo notificados en tiempo real para recojo en pase caliente; órdenes despachadas protegidas por el búfer de recuperación de 30 minutos.

### CU-COCINA-03: Descuento automático de insumos por consumo

**Actor(es):** `sistema` (Proceso transaccional de backend orquestado automáticamente) / `admin_local` (Supervisión)

**Precondiciones:** El ítem culinario pasa a estado `listo` en el KDS de cocina ([`CU-COCINA-02`](#cu-cocina-02-actualizar-estado-de-preparación)); el producto cuenta con receta culinaria registrada en `producto_insumo` ([`CU-ADMIN-04`](#cu-admin-04-gestionar-carta-y-menú)).

#### Flujo principal

1. Al presionar `[ ✓ Listo en Pase ]` en el monitor KDS ([`CU-COCINA-02`](#cu-cocina-02-actualizar-estado-de-preparación)), el backend ejecuta de forma atómica y síncrona en PostgreSQL 16 la deducción de inventario por receta:
   $$\text{Consumo Teórico} = \text{pedido\_item.cantidad} \times \text{producto\_insumo.cantidad\_descuenta}$$
2. El sistema actualiza el stock físico de almacén aplicando `stock_actual = GREATEST(0, stock_actual - consumo)` para garantizar el cumplimiento del constraint `CHECK (stock_actual >= 0)`.
3. Si tras el descuento el `stock_actual` llega a 0:
   - Conmuta automáticamente `insumo.estado = 'agotado'`.
   - Ejecuta la cascada hacia la carta gastronómica: conmuta `producto.disponibilidad = 'agotado'` para todos los platos dependientes ([`CU-COCINA-04`](#cu-cocina-04-marcar-producto-como-agotado--disponible)), bloqueando de inmediato nuevas comandas en mozos y en el menú digital QR.
4. La brigada de cocina puede inspeccionar los insumos descontados en cualquier momento dentro de la **Ficha Técnica de Detalle Ampliado de Comanda (Vista 2 de CU-COCINA-01)**.
5. La transacción compromete los cambios en base de datos en menos de 5 milisegundos y emite el evento SSE `item_listo_pase` para que salón recoja el plato del pase caliente.

#### Flujos alternativos

- **Inconsistencia de stock culinario (Política de No-Bloqueo del Servicio):** Si al momento de marcar listo, el stock registrado en el sistema es inferior al consumo requerido (`stock_actual < consumo`, por ejemplo si el proveedor entregó la mercadería pero el administrador aún no asentó la factura de compra en el sistema):
  - La cocina **NO se bloquea ni se detiene la salida del plato**: la comanda sale al pase caliente protegiendo prioritariamente la experiencia del comensal en salón.
  - El sistema fija `stock_actual = 0`, asienta la discrepancia en `auditoria_stock_ajuste` con motivo `'inconsistencia_cocina'` y emite en tiempo real una notificación SSE reactiva (`alerta_stock_insuficiente`) que despliega un Toast flotante y activa la campana `[ 🔔 ]` en el portal del Administrador del Local para regularización física de inventario.
- **Reversión atómica de insumos por Deshacer (Undo 30s de CU-COCINA-02):** Si el cocinero pulsa `[ ↺ Deshacer ]` dentro de la ventana de 30 segundos, el sistema revierte atómicamente el estado del plato a `'en_preparacion'` y **restituye el 100% del stock consumido** (`stock_actual = stock_actual + consumo`), restaurando el insumo y plato a `'disponible'` si se habían marcado como agotados.

**Postcondiciones:** Inventario actualizado en tiempo real según consumo culinario exacto; platos dependientes agotados preventivamente si no hay existencias; comensal atendido sin interrupción en fogones; discrepancias de stock auditadas y notificadas al Administrador en tiempo real.

### CU-COCINA-04: Marcar producto como agotado / disponible

**Actor(es):** Cocinero / Jefe de Cocina (`rol: cocina`), Administrador de local (`rol: admin_local`)

**Precondiciones:** El local está en horario de atención; el producto existe en la carta de la sede (`producto.local_id = :local_id`).

#### Flujo principal

1. Cocina identifica que un plato o bebida no puede seguir preparándose (falta de insumo clave, merma imprevista o fallo en partida de cocción).
2. El chef pulsa el botón de acceso rápido en la barra superior del monitor KDS: `[ 🚫 Gestión de Quiebres / Agotados (N) ]` ([`CU-COCINA-01`](#cu-cocina-01-ver-cola-de-pedidos-entrantes-kitchen-display-system---kds)).
3. El sistema despliega el **Modal Táctil de Disponibilidad de Platos (Vista 1)**:
   - Filtros por partidas culinarias: `Todas`, `Brasas & Carnes`, `Salteados & Wok`, `Pescados & Mariscos`, `Guarniciones`.
   - Distingue mediante badges visuales si un plato está agotado automáticamente por stock cero ([`CU-COCINA-03`](#cu-cocina-03-descuento-automático-de-insumos-por-consumo)) o por apagado manual de cocina.
4. El chef localiza el plato y pulsa el interruptor táctil `[ 🚫 Marcar como Agotado ]`.
5. El sistema evalúa atómicamente si existen pedidos en curso que incluyan dicho plato:
   - **Caso 1: No existen pedidos en curso:** Conmuta de inmediato `producto.disponibilidad = 'agotado'`, `motivo_agotado = 'apagado_manual_cocina'` y emite el evento SSE `plato_agotado_carta` bloqueando nuevos pedidos en tablets de mozo y en el menú digital QR en < 30ms.
   - **Caso 2: Existen pedidos activos en salón:**
     - **Órdenes en cola (`en_cola`, sin iniciar en sartén):** El backend las conmuta de forma 100% automática a `no_disponible` (`motivo_anulacion = 'quiebre_stock_cocina'`) y despacha la alerta acústica/vibratoria a la tablet del mozo responsable ([`CU-MOZO-07`](#cu-mozo-07-atender-plato-no-disponible)).
     - **Órdenes en preparación (`en_preparacion`, en fuego activo):** El sistema despliega el **Diálogo Táctil de Resolución de Fuego Activo (Vista 2)**.
6. En el diálogo de resolución de órdenes en fuego, el chef resuelve la disponibilidad de la mise en place restante:
   - **Selector Numérico Rápido (Contador FIFO):** El sistema pregunta: *"¿Para cuántas porciones te alcanza la mise en place disponible?"* con botones táctiles `[ 0 ]`, `[ 1 ]`, `[ 2 ]`, `[ 3 ]`, `[ 4 ]`, `[ 5 - Todas ]`.
   - Al seleccionar un número $K$ menor al total activo $N$ (ejemplo: 2 de 5 porciones), el sistema aplica el **Criterio de Justicia Culinaria (FIFO)**: preasigna automáticamente las $K$ porciones a las comandas con más tiempo de espera en cocina, manteniéndolas en `en_preparacion`.
   - **Ajuste Fino por Comanda:** La lista táctil exhibe el desglose comanda por comanda (mesa, tiempo de espera, mozo a cargo), permitiendo al chef alternar con 1 toque qué mesa continúa si requiere priorizar un caso especial.
   - Las $N - K$ porciones que no se pueden preparar conmutan atómicamente a `no_disponible` (`motivo_anulacion = 'quiebre_fuego_parcial'`).
7. El chef pulsa `[ ⚡ Confirmar y Avisar a Mozos ]`.
8. El sistema ejecuta la transacción atómica:
   - Fija `producto.disponibilidad = 'agotado'`.
   - Despacha el evento reactivo Server-Sent Events (SSE) `item_no_disponible_salon` a las tablets de los mozos titulares ([`CU-MOZO-07`](#cu-mozo-07-atender-plato-no-disponible)).
   - Envía una notificación Toast SSE a la campana del Administrador de local (`tipo = 'quiebre_manual_cocina'`) con el detalle del producto y cocinero para compras urgentes.
9. **Reactivación a Disponible:** Cuando ingresa reposición de insumos o nueva mise en place, el chef abre el modal y pulsa `[ ↺ Reactivar a Disponible ]`. El sistema conmuta `producto.disponibilidad = 'disponible'`, emitiendo `plato_reactivado_carta` y liberando la comanda en salón y QR al instante.

#### Flujos alternativos

- **El plato fue agotado automáticamente por el Kardex (`CU-COCINA-03`):** El sistema deshabilita el toggle manual de reactivación directa y muestra el badge `[ 🔒 Bloqueado por Stock Teórico ]`, requiriendo que Administración registre la recepción de compras (`CU-ADMIN-06`) o ajuste físico (`CU-ADMIN-07`) para garantizar consistencia contable.
- **El chef decide cancelar todas las porciones en fuego:** Pulsa `[ 0 Ninguno ]`; el 100% de los platos activos en cocina se cancelan en fuegos y pasan a `no_disponible`, alertando a todos los mozos involucrados.
- **El chef dispone de insumos para todas las órdenes en fuego:** Pulsa `[ Todas ]`; las órdenes en fuego se completan con normalidad hasta el pase, y únicamente se bloquea el plato para futuras comandas.

**Postcondiciones:** Disponibilidad de la carta actualizada en tiempo real (<30ms); órdenes en cola pausadas automáticamente; órdenes en fuego resueltas con justicia culinaria (FIFO) y sin desperdicios; mozos alertados de inmediato ([`CU-MOZO-07`](#cu-mozo-07-atender-plato-no-disponible)); administración notificada para abastecimiento.

---

### CU-COCINA-05: Recibir notificación de anulación de pedido

**Actor(es):** Cocinero / Brigada de Cocina (`rol: cocina`)

**Precondiciones:** Un Mozo en salón ([`CU-MOZO-06`](#cu-mozo-06-anular-plato-o-pedido)) o un Administrador ([`CU-ADMIN-09`](#cu-admin-09-gestionar-anulaciones-y-mermas)) ejecutó la anulación de un plato culinario (`requiere_preparacion = true`) o comanda completa con motivo obligatorio.

#### Flujo principal

1. Al confirmarse la anulación en sala, el backend emite de forma instantánea (<30ms) el evento SSE `anulacion_comanda_salon` a la pantalla KDS de Cocina ([`CU-COCINA-01`](#cu-cocina-01-ver-cola-de-pedidos-entrantes-kitchen-display-system---kds)).
2. El KDS activa de inmediato la **Alerta Sonora Culinaria de Parada y Modal de Alto Contraste (Vista 3 de CU-COCINA-01 - `wf_cocina_01_alerta_anulacion_kds.jpg`)**:
   - Sirena visual en rojo carbón (`#DC2626`).
   - Título urgente: `¡PARAR FOGÓN! COMANDA ANULADA EN SALÓN`.
   - Mesa, número de comanda, mozo titular, tiempo en fuego y motivo de anulación registrado en sala.
3. El cocinero pulsa el botón táctil `[ 🛑 Entendido, Detener Fogón ]`:
   - **Si el plato estaba `en_cola`:** La tarjeta de comanda desaparece del tablero KDS; no se consumieron insumos ni se genera merma.
   - **Si el plato estaba `en_preparacion`:** La preparación se descarta de los fogones y el sistema asienta automáticamente el registro auditable de merma culinaria en almacén (`auditoria_stock_ajuste.motivo = 'merma_desperdicio'`).
   - **Si el plato ya estaba `listo` en el pase caliente:** El producto ya había sido descontado por receta ([`CU-COCINA-03`](#cu-cocina-03-descuento-automático-de-insumos-por-consumo)); el sistema bloquea su entrega y lo computa como merma física sin reintegrar el inventario.

**Postcondiciones:** Fogones detenidos a tiempo para evitar desperdicio de insumos; tarjeta de comanda retirada del KDS; merma asentada contablemente si la cocción ya estaba en curso.

# 6. Cajero

### CU-CAJA-01: Apertura de turno de caja

**Actor(es):** Cajero, Administrador del local

**Precondiciones:** La sede está activa; el usuario cuenta con sesión autenticada con rol `cajero` o `admin_local`; el turno anterior de la sede debe encontrarse cerrado formalmente (`estado = 'cerrada'`). No existe otra caja abierta en la sede (**Política de Terminal Única de Caja**).

#### Flujo principal

1. El cajero inicia sesión en la terminal del Punto de Venta (POS).
2. El sistema consulta automáticamente el estado operativo de caja (`GET /api/v1/caja/estado-sesion`).
3. Al detectar que la caja se encuentra cerrada, el sistema bloquea preventivamente la interfaz del salón mediante una cortina modal de alto contraste (Vista 1) impidiendo la liquidación o cobro de mesas hasta declarar el fondo inicial.
4. El sistema presenta la ficha del cajero (nombre, avatar, turno correlativo proyectado ej. `#042`, fecha y hora actual).
5. Para registrar el fondo inicial de efectivo (fondo de cambio o vuelto), el cajero digita el monto en el campo numérico `PEN S/` (ej. `S/ 300.00`) o utiliza los chips de incremento rápido táctil (`[ + S/ 50 ]`, `[ + S/ 100 ]`, `[ + S/ 200 ]`, `[ Borrar ]`).
6. El cajero ingresa opcionalmente notas u observaciones de apertura (ej. *"Fondo recibido en sobre sellado de administración"*).
7. El cajero presiona `[ ⚡ Confirmar y Abrir Turno de Caja ]`.
8. El sistema valida los datos, inserta el registro en la tabla `caja` con `estado = 'abierta'`, emite el evento en tiempo real `caja_abierta` vía Server-Sent Events (SSE) y desbloquea el Monitor de Caja y Cuentas (Vista 3).

#### Flujos alternativos

- **Turno previo pendiente de cierre (`409 Conflict: ERR_TURNO_PREVIO_NO_CERRADO`):**
  - Si el cajero del turno anterior no ejecutó su Arqueo Z de cierre (`CU-CAJA-05`) o intentó abrirse un turno simultáneo en otra pestaña/dispositivo, el sistema deniega la apertura y despliega la Vista 2 con el detalle del conflicto:
    - Muestra el turno activo, nombre del cajero saliente, hora de apertura original y volumen de ventas cobradas pendientes de liquidación.
    - Provee opciones guiadas: Solicitud de relevo presencial para que el cajero saliente concluya su arqueo o intervención del Administrador de sede para ejecutar un cierre forzado supervisado (`CU-ADMIN-15`).
- **Monto de apertura inválido (`422 Unprocessable: ERR_MONTO_APERTURA_INVALIDO`):**
  - Si se ingresa un monto negativo o un formato numérico corrupto, el sistema resalta el campo en rojo y bloquea el botón de confirmación.
- **Flexibilidad horaria sin bloqueo punitivo (Event-Driven):**
  - Si un cajero permanece operando 30 o 45 minutos más allá de su horario teórico de turno, el sistema **no bloquea las ventas de salón**. Los turnos se rigen por eventos de apertura y cierre explícitos, garantizando la continuidad del servicio del restaurante.

**Postcondiciones:** Turno de caja creado en estado `abierta`; `monto_apertura` escalar y marca temporal registrados; terminal POS de salón desbloqueada para precuentas (`CU-CAJA-02`) y cobros (`CU-CAJA-03`). Concurrencia de múltiples cajas en la misma sede prevenida a nivel de base de datos (`uq_caja_abierta_local`).

### CU-CAJA-02: Generar cuenta a partir de pedido(s) de una mesa (Precuenta Digital)

**Actor(es):** Cajero (Titular o relevo de caja), Administrador del Local (con permisos de supervisión de caja)

**Precondiciones:** La sede cuenta con turno de caja abierto (`CU-CAJA-01`, `caja.estado = 'abierta'`); la mesa se encuentra en estado `ocupada` o con `cuenta_pedida` solicitada por el mozo (`CU-MOZO-01`); existen pedidos activos asociados a la mesa en `pedido` y `pedido_item` (los ítems pueden encontrarse en estado `listo`, `entregado`, o incluso `en_cola`/`en_preparacion` con advertencia no bloqueante).

#### Flujo principal

1. El flujo de precuenta se inicia por una de dos vías:
   - **Vía Mozo:** El mozo solicita la cuenta desde su terminal móvil al comensal pedir la cuenta (`CU-MOZO-01`). El backend conmuta el estado a `cuenta_pedida` y emite vía Server-Sent Events (SSE) una notificación prioritaria al Monitor POS de Caja (< 25ms).
   - **Vía Cajero:** El cajero pulsa directamente sobre la tarjeta de la mesa en el Monitor POS de Caja (`[ ⚡ Cobrar / Precuenta ]`).
2. El sistema carga y consolida los consumos de la mesa:
   - Agrupa automáticamente las unidades idénticas solicitadas a lo largo de sucesivas rondas en una única línea con su cantidad total, notas de cocina agregadas, precio unitario congelado y subtotal.
   - Si la mesa forma parte de una unión física (`mesa_principal_id IS NOT NULL`, `CU-MOZO-04`), el sistema consolida los pedidos de todo el grupo bajo el identificador oficial **`Mesa [ 02 ; 03 ]`**.
3. **Validación Informativa de Cocina (No Bloqueante):** Si la comanda contiene platos en preparación (`en_cola` o `en_preparacion`), el sistema despliega un banner informativo ámbar (*"⚠️ Aviso Informativo: 1 plato 'Lomo Saltado' en preparación en cocina. No bloquea la emisión ni el cobro de la cuenta"*). Esta independencia operativa garantiza el funcionamiento fluido en restaurantes con modelo de cobro por adelantado o comida rápida.
4. **Aplicación de Promociones Comerciales (`CU-ADMIN-17`):** El sistema consulta en sub-milisegundos (`idx_promocion_caja_vigencia`) las promociones vigentes según fecha, hora y día de la semana. El cajero puede seleccionar en 1 clic una promoción aplicable (ej. *"Descuento Almuerzo Ejecutivo 15% dscto"*).
5. **Cálculo Tributario Oficial SUNAT Perú:** El sistema liquida la cuenta en caliente:
   - **Consumo Bruto ($C_{bruto}$):** Sumatoria de los precios de venta al público en salón (incluyen IGV).
   - **Descuento Comercial ($D$):** Bonificación calculada antes de impuestos ($C_{bruto} \times \% \text{ o monto fijo}$).
   - **Total Neto a Pagar ($T_{neto}$):** $T_{neto} = C_{bruto} - D$.
   - **Base Imponible / Operación Gravada ($B$):** $B = T_{neto} / 1.18$.
   - **Impuesto General a las Ventas (IGV 18%):** $\text{IGV} = T_{neto} - B$.
6. **Proyección Comparativa de Medios de Pago (`CU-ADMIN-19`):** El sistema proyecta de inmediato el total a cobrar en cada canal de pago aceptado en el local (Efectivo S/ 85.00 [0%], Yape/Plin S/ 85.00 [0%], Tarjeta POS S/ 87.98 [+3.5% pasarela]), permitiendo al personal informar al comensal el importe exacto según su preferencia de pago.
7. **Enrutamiento Operativo Inmediato desde POS:** Con la cuenta revisada y las promociones aplicadas, el cajero dispone de enrutamiento directo:
   - **`[ ⚡ Cobrar Comanda o Subcuentas (CU-CAJA-03) ]`**: Transiciona de inmediato a la pantalla/modal de cobro y emisión de comprobante tributario oficial (Factura, Boleta, Nota de Venta), ya sea liquidando la comanda completa o procesando subcuentas divididas en salón (`CU-MOZO-09`).
   El Punto de Venta no reenvía precuentas al mozo; la arquitectura es desacoplada y paralela. El mozo ya dispone de su propia consulta táctil en mesa (`CU-MOZO-08` / `CU-MOZO-09`).

#### Flujos alternativos

- **Platos en cocina pendientes de entrega:** El banner informativo alerta al operador pero **no bloquea** la generación de la precuenta ni la transición al cobro (`CU-CAJA-03`).
- **Retiro o cambio de promoción comercial:** El cajero pulsa `[ ✕ Quitar Dscto ]` en el chip de promoción activa; el sistema restaura el consumo bruto original y recalcula la Base Imponible e IGV en < 10ms.
- **La mesa no alcanza el consumo mínimo de la promoción:** Si una promoción exige un consumo mínimo de S/ 120.00 y la comanda suma S/ 100.00, el dropdown la muestra deshabilitada con el texto explicativo *"Requiere consumo mínimo de S/ 120.00"*.
- **Mesa sin pedidos activos (`404 Not Found`):** Si una mesa no tiene ítems enviados a comanda o todos fueron anulados previamente (`CU-MOZO-06`), el botón de precuenta se deshabilita con el tooltip *"Mesa sin consumos activos"*.

**Postcondiciones:** Cuenta consolidada y liquidada tributariamente bajo norma SUNAT Perú; promoción comercial asociada en `pedido.promocion_id`; comanda en estado `cuenta_pedida` o lista para cobro inmediato; Punto de Venta posicionado para enrutamiento directo a cobro íntegro o liquidación por subcuentas en `CU-CAJA-03`. Flujo 100% digital sin dependencia de impresoras térmicas.

### CU-CAJA-03: Cobro de comanda y emisión de comprobantes oficiales (Factura, Boleta y Nota de Venta)

**Actor(es):** `cajero` (Titular o relevo de caja en terminal POS), `admin_local` (con permisos de supervisión de caja)

**Precondiciones:** La sede cuenta con turno de caja abierto (`CU-CAJA-01`, `caja.estado = 'abierta'`); existe comanda activa en estado `enviado` o `cuenta_pedida` (desde el monitor POS en `CU-CAJA-02` o desde salón vía SSE en `CU-MOZO-08` / `CU-MOZO-09`); existen series electrónicas activas registradas en `comprobante_serie`.

#### Flujo principal

1. **Selección del comprobante oficial:** El cajero pulsa `[ ⚡ Cobrar Comanda Completa ]` en el POS y selecciona el tipo de comprobante tributario:
   - **Factura:** Exige RUC de 11 dígitos numéricos (prefijo 10 o 20) + búsqueda ApiPerú/SUNAT + Razón Social y Domicilio Fiscal.
   - **Boleta:** Exige DNI de 8 dígitos numéricos + búsqueda ApiPerú/RENIEC (o *Consumidor Final* sin documento si el consumo es menor a S/ 700.00).
   - **Nota de Venta:** Comprobante simplificado de control interno. Solicita exclusivamente el *Nombre del Cliente* (sin DNI/RUC ni validaciones fiscales).
2. **Búsqueda y persistencia de cliente en BD:**
   - El sistema busca primero en la tabla relacional `cliente` en PostgreSQL (UUID v8); si el cliente ya existe, autocompleta en < 1ms su `nombre_identificativo`, `telefono` (WhatsApp) y `email`, mostrando el badge `[ • Cliente registrado en base de datos local ]`.
   - Si no existe en la base de datos, consulta la API externa (ApiPerú), autocompleta el formulario y persiste el nuevo registro en `cliente` con su payload completo en `detalle JSONB`.
3. **Selección de medio de pago y liquidación (`CU-ADMIN-19`):**
   - **Efectivo:** El cajero digita directamente el monto recibido en efectivo (`monto_recibido`); el sistema calcula y muestra instantáneamente el vuelto en grande (`VUELTO A ENTREGAR: S/ 15.00`).
   - **Tarjeta POS:** Aplica el recargo trasladado de pasarela bancaria configurado (+3.5%) y registra el número de voucher/referencia POS.
   - **Billetera Digital (Yape / Plin):** Muestra los datos de la cuenta del local y registra el código de operación.
4. **Confirmación del cobro y transacción atómica ACID:** El cajero presiona `[ ⚡ Confirmar Cobro y Emitir Comprobante (F9) ]`. En una transacción atómica `BEGIN ... COMMIT`:
   - Invoca la función `fn_obtener_siguiente_correlativo` con bloqueo de fila (`FOR UPDATE`) en `comprobante_serie`, asignando el correlativo monótono estricto (ej. `12894`).
   - Inserta el registro oficial en `comprobante` con serie, correlativo, token digital único QR (UUID v8), desglose fiscal SUNAT (Base Imponible e IGV 18%) y medios de pago.
   - Inserta el asiento contable en `caja_movimiento` (`ingreso_venta`), sumando el importe cobrado al efectivo en gaveta del turno actual.
   - Conmuta `pedido.estado = 'cobrado'`.
   - Conmuta `mesa.estado = 'libre'`, emitiendo un evento SSE reactivo al salón en < 20ms para liberar la mesa a nuevos clientes.
   - Si se modificó el teléfono o email, sincroniza los cambios en la tabla `cliente`.
5. **Entrega digital con token QR (Cero Papel):**
   - El sistema despliega el diálogo de confirmación exhibiendo un gran código QR dinámico de alta resolución para que el comensal lo capture con la cámara de su teléfono inteligente y descargue su comprobante en PDF oficial (`https://app.restaurantcloud.pe/c/<token_uuid_v8>`).
   - **Opciones de entrega digital asistida:** Muestra el número de WhatsApp y correo guardados con botones `[ ✓ Confirmar y Enviar ]` y `[ ✏️ Modificar ]`; si el cliente indica un número nuevo, el cajero lo actualiza en el acto.
   - **Impresión térmica física:** El botón `[ 🖨️ Imprimir Ticket ]` se muestra en estado temporalmente deshabilitado (`disabled`), reforzando la directriz de cero papel.
6. **Retorno al monitor POS:** El cajero presiona `[ ✓ Finalizar y Volver al Salón (Esc) ]`; el sistema regresa al monitor de salón donde la mesa se visualiza en estado verde `[ LIBRE ]` y el efectivo en gaveta refleja el nuevo balance actualizado.

#### Flujos alternativos

- **Monto recibido en efectivo menor al total:** El botón de cobro permanece inhabilitado y el panel de vuelto resalta en advertencia hasta ingresar una cifra igual o mayor al total.
- **Venta mayor o igual a S/ 700.00 en Boleta:** La opción de *Consumidor Final* se deshabilita automáticamente por disposición de SUNAT, exigiendo obligatoriamente DNI válido.
- **RUC con condición de No Habido o Inactivo:** El sistema notifica la condición tributaria obtenida de ApiPerú/SUNAT para que el cajero coordine con el cliente.

**Postcondiciones:** Pedido conmutado a `cobrado`; mesa liberada a `libre` y disponible en tiempo real; comprobante electrónico emitido con correlatividad ACID garantizada; token digital QR público disponible; cliente registrado/actualizado en PostgreSQL; ingreso registrado en el arqueo de caja del turno. Flujo 100% digital cero papel.

### CU-CAJA-04: Anular comprobante / pedido ya cobrado y emisión de Nota de Crédito Electrónica

**Actor(es):** `cajero` (Principal), `admin_local` (Auditoría y supervisión), `comensal` (Receptor de fondos y constancia digital)

**Precondiciones:**
1. La sede cuenta con un turno de caja abierto en estado `abierta` (`CU-CAJA-01`).
2. Existe un comprobante previamente emitido en estado `emitido` en la tabla `comprobante` (Factura, Boleta o Nota de Venta) con su respectivo pedido en estado `cobrado` (`CU-CAJA-03`).
3. Existen series electrónicas activas de Notas de Crédito registradas en `comprobante_serie` para la sede (`FC01` para Facturas, `BC01` para Boletas, o serie interna para Notas de Venta).

#### Flujo principal

1. El cajero accede a la vista de "Facturación y Comprobantes Emitidos" de su turno activo (`GET /api/v1/caja/comprobantes`).
2. Utiliza los filtros segmentados de estado (`Vigentes / Emitidos`, `Anulados`, `Todos`) y tipo de documento para segregar rápidamente comprobantes activos de los ya rectificados, o localiza el comprobante a rectificar mediante búsqueda omnicanal con debounce por número (ej. `B001-0012894`), mesa o titular.
3. El cajero pulsa `[ ⚠️ Anular (Nota Crédito) ]`. El sistema consulta los metadatos de anulación (`GET /api/v1/caja/comprobantes/{id}/preparar-anulacion`), precargando la serie oficial (`BC01` o `FC01`), el documento modificado, el desglose tributario y el cálculo del reembolso.
4. En el modal interactivo de emisión, el cajero selecciona obligatoriamente el Motivo Oficial SUNAT (Catálogo de Tablas N° 09):
   - `01 — Anulación de la operación` (reemisión por cambio de tipo de comprobante o error en la venta).
   - `02 — Anulación por error en el RUC / Documento`.
   - `06 — Devolución total del consumo`.
5. Redacta el sustento detallado obligatorio (mínimo 10 caracteres) para auditoría fiscal e interna (ej. *"Comensal solicita cambio a Factura con RUC de empresa"*).
6. El sistema exhibe la ficha de reversión financiera: egreso de gaveta por el importe pagado en efectivo (`- S/ 85.00`, recalculando el efectivo en caja de `S/ 385.00` a `S/ 300.00`) o ajuste de liquidación digital.
7. El cajero pulsa `[ ⚡ Confirmar y Emitir Nota de Crédito (F9) ]`.
8. El backend ejecuta una transacción atómica ACID (`POST /api/v1/caja/comprobantes/{id}/anular`):
   - Bloquea la serie en `comprobante_serie` (`FOR UPDATE`) y obtiene el correlativo monótono sin saltos (`fn_obtener_siguiente_correlativo`).
   - Inserta el registro oficial inmutable en `comprobante` con `tipo = 'nota_credito'`, serie, correlativo, `comprobante_modificado_id` referenciando al documento original, motivo SUNAT y sustento.
   - Conmuta el comprobante original a `estado = 'anulado'`.
   - Conmuta `pedido.estado = 'anulado'` y registra auditoría inmutable en `pedido_anulacion`.
   - Registra asiento de egreso en `caja_movimiento` (`tipo = 'egreso_devolucion'`) cuadrando el efectivo de caja para el Arqueo Z (`CU-CAJA-05`).
   - Emite broadcast reactivo Server-Sent Events (SSE) al panel del Administrador del Local (`CU-ADMIN-12`) para notificación inmediata y prevención de fraude.
   - Confirma la transacción (`COMMIT`).
9. El sistema despliega el diálogo modal de emisión de Nota de Crédito con Gran Código QR SVG dinámico de alta resolución (UUID v8) para escaneo del comensal (política *Cero Papel*), opciones asistidas de confirmación/modificación de envío telemático por WhatsApp y Correo electrónico, y botón de impresión térmica física visible pero temporalmente inactivo (`disabled`).

#### Flujos alternativos

- Se intenta anular un comprobante que ya fue anulado o que ya tiene Nota de Crédito emitida → El sistema deniega la operación con `409 Conflict (ERR_COMPROBANTE_YA_ANULADO)` y en la interfaz mantiene el botón de anulación bloqueado con la etiqueta `[ 🚫 Anulado ]`, mostrando el enlace directo a su Nota de Crédito vinculada.
- Se ingresa un sustento de anulación vacío o menor a 10 caracteres → El sistema bloquea el botón de confirmación y exige justificación descriptiva (`ERR_SUSTENTO_INSUFICIENTE`).
- Cobro original realizado con Tarjeta POS o Billetera Digital → El asiento en `caja_movimiento` registra el egreso para la conciliación bancaria/digital del Arqueo Z sin restar del efectivo físico de gaveta.
- El efectivo disponible en la gaveta es menor al importe a devolver → El sistema bloquea el egreso con `422 Unprocessable (ERR_EFECTIVO_GAVETA_INSUFICIENTE)` alertando la falta de liquidez en gaveta antes de autorizar la devolución.

**Postcondiciones:** Nota de Crédito Electrónica emitida con correlativo ACID bajo normativa SUNAT Perú; comprobante original y pedido marcados como anulados; asiento de egreso en `caja_movimiento` garantizando cuadratura para `CU-CAJA-05`; evento auditado y notificado en tiempo real a `CU-ADMIN-12`; constancia digital accesible vía token QR dinámico sin emisión de papel térmico.

### CU-CAJA-05: Cerrar caja (arqueo Z) y rendición de cuentas del turno

**Actor(es):** `cajero` (Principal), `admin_local` (Receptor del reporte gerencial y auditor de discrepancias), `sistema` (Procesador contable y emisor de broadcast SSE)

**Precondiciones:**
1. La sede cuenta con un turno de caja abierto en estado `abierta` (`CU-CAJA-01`).
2. El salón se encuentra al día (0 mesas con comanda activa, o cuentas 100% liquidadas).
3. Todos los comprobantes del turno (Boletas, Facturas, Notas de Venta y egresos por Notas de Crédito emitidas en `CU-CAJA-04`) se encuentran registrados en la base de datos.

#### Flujo principal

1. El cajero accede al módulo de "Cierre de Caja y Arqueo Z" al finalizar su jornada laboral (`GET /api/v1/caja/turnos/actual/balance-cierre`).
2. El sistema exhibe la pantalla de Pre-Arqueo y Balance Operativo:
   - Verificación Poka-Yoke de salón: confirma que no existen mesas activas con consumo pendiente ni pedidos en cola de cocina.
   - Recaudación y flujo por método de pago: fondo de apertura (`S/ 300.00`), ingresos en efectivo (`+ S/ 85.00`), devoluciones por Nota de Crédito (`- S/ 85.00`), arrojando el efectivo objetivo esperado en gaveta (`S/ 300.00`).
   - Conciliación de medios electrónicos: total por tarjetas POS (Lote verificado) y billeteras digitales (Yape/Plin).
   - Resumen fiscal preliminar SUNAT (Base Imponible, IGV 18%, Total Neto Facturado).
3. El cajero pulsa `[ 📋 Iniciar Arqueo y Cierre de Caja (F8) ]`.
4. El sistema despliega el modal interactivo de Arqueo y Conteo Físico.
5. El cajero cuenta el dinero físico presente en la gaveta y digita directamente la cantidad total en Soles (`monto_real`, ej. `300.00`).
6. El sistema compara en tiempo real el monto real contado contra el esperado:
   - Si coinciden exactamente ($\text{Diferencia} = \text{S/ 0.00}$), el sistema muestra el badge verde de éxito: `[ ✓ CAJA CUADRADA CON ÉXITO • DIF: S/ 0.00 ]`.
7. El cajero ingresa notas opcionales de entrega de turno y pulsa `[ 🔒 Confirmar y Cerrar Turno Definitivamente (F9) ]`.
8. El backend ejecuta una transacción atómica ACID (`POST /api/v1/caja/turnos/actual/cerrar`):
   - Bloquea la fila del turno de caja (`FOR UPDATE`).
   - Actualiza `caja.estado = 'cerrada'`, fija `fecha_cierre = NOW()`, registra `monto_esperado`, `monto_real`, `discrepancia = 0.00`, notas y libera el índice único `uq_caja_abierta_local`.
   - Genera e inserta el registro inmutable del Reporte Z en `auditoria_caja_cierre`.
   - Emite broadcast reactivo Server-Sent Events (SSE) `caja_cerrada` al Administrador del Local (`CU-ADMIN-12`) con los indicadores clave del turno.
   - Confirma la transacción (`COMMIT`).
9. El sistema despliega la pantalla de Reporte Z Oficial Emitido:
   - Ficha formal con encabezado fiscal (RUC, Sede, Turno #042, Cajero, Duración del turno).
   - Detalle de movimiento y arqueo físico de efectivo (fondo, cobros, devoluciones, contado, diferencia).
   - Total facturado neto por canal de cobro.
   - Desglose tributario SUNAT (Base Gravada e IGV).
   - Auditoría de documentos emitidos (Boletas, Facturas, Notas de Venta, Notas de Crédito y Anulados).
   - Opciones digitales (Cero Papel): descarga de Reporte Z en PDF, archivado inmutable e integración directa en el historial de supervisión del administrador (`CU-ADMIN-15`), notificación reactiva SSE a `CU-ADMIN-12`, botón de impresión térmica deshabilitado y bloqueo de la terminal POS hasta la apertura de un nuevo turno (`CU-CAJA-01`).

#### Flujos alternativos

- Existen mesas con consumos activos o comandas abiertas en salón → El sistema emite una alerta bloqueante con el listado de mesas pendientes, prohibiendo el arqueo hasta que las cuentas sean cobradas o transferidas (`ERR_SALON_CON_MESAS_ACTIVAS`).
- Existe discrepancia física entre el efectivo contado y el esperado (sobrante o faltante) → El sistema resalta la diferencia en ámbar/rojo (ej. `Faltante de - S/ 15.00`) y **bloquea el botón de confirmación** hasta que el cajero redacte obligatoriamente una justificación detallada de al menos 10 caracteres (`comentario_discrepancia`), la cual se reporta de inmediato a la administración (`ERR_DISCREPANCIA_SIN_JUSTIFICAR`).
- Se intenta cerrar un turno que ya fue cerrado previamente → El backend rechaza la operación con `409 Conflict (ERR_CAJA_YA_CERRADA)`.

**Postcondiciones:** Turno de caja cerrado formalmente en estado `cerrada`; índice único `uq_caja_abierta_local` liberado para el próximo turno; Reporte Z digital generado y descargable en PDF bajo política Cero Papel; notificación reactiva recibida en `CU-ADMIN-12`; terminal POS bloqueada para nuevas ventas hasta una nueva apertura.

# 7. Cliente

### CU-CLIENTE-01: Consultar carta digital (Catálogo Interactivo Web)

**Actor(es):** Cliente / Comensal

**Precondiciones:** La sede gastronómica se encuentra activa (`estado = 'activo'`); existen categorías (`CU-ADMIN-02`) y productos activos (`CU-ADMIN-04`) configurados en el sistema; la sede cuenta con un slug público único registrado (ej. `miraflores`).

#### Flujo principal

1. El cliente accede a la carta digital escaneando el código QR general disponible en el restaurante o mediante enlace web público (`https://app.restaurantcloud.pe/sede/<slug>/carta`) desde redes sociales, WhatsApp o navegadores móviles.
2. El sistema resuelve la sede en base a su `slug` y carga en una sola consulta de alto rendimiento (`GET /api/v1/public/sedes/{slug}/carta`) los datos de la sede (nombre, dirección, horario de atención y teléfono de contacto), las promociones comerciales activas (`CU-ADMIN-17`) y la oferta gastronómica organizada por categorías (`CU-ADMIN-02`).
3. El cliente visualiza en su smartphone el catálogo interactivo:
   - **Cabecera informativa:** Nombre del restaurante, dirección, badge de horario (`● Abierto hoy`) y botones accesibles de contacto directo: `[ 💬 WhatsApp ]` (enlace directo a chat) y `[ 📞 Llamar ]` (enlace telefónico directo) vinculados al teléfono del local (`local.telefono`).
   - **Banner de promociones vigentes:** Exhibe descuentos activos configurados por la administración (ej. *"15% dscto en Almuerzos Ejecutivos"*).
   - **Buscador reactivo con debounce:** Permite buscar platos o ingredientes en tiempo real mediante filtrado client-side instantáneo en memoria.
   - **Pestañas deslizables de categorías:** Navegación táctil horizontal con sticky header (`[ Todos ]`, `[ Pollos & Brasas ]`, `[ Parrillas ]`, `[ Guarniciones ]`, `[ Bebidas ]`).
   - **Fichas gastronómicas:** Cada plato exhibe fotografía, nombre comercial, descripción culinaria y precio oficial en Soles (`PEN S/`) con IGV (18%) incluido.
   - **Sincronización en vivo de disponibilidad:** Si la cocina reporta quiebre de stock o apaga un plato en KDS (`CU-COCINA-04`), el plato se muestra atenuado visualmente con el badge `[ Agotado por hoy ]`.
4. El cliente puede tocar cualquier tarjeta de plato para abrir la **Ficha de Inspección Culinaria (Modal Bottom-Sheet)**, donde aprecia la fotografía ampliada en alta resolución, la descripción detallada de ingredientes y preparación, el precio en grande y una microcopia informativa amigable: *"ℹ️ Para degustar este plato, indícaselo al personal de salón al visitarnos o consúltanos por WhatsApp."*
5. El cliente pulsa `[ ← Volver a la Carta ]` para regresar al catálogo principal.

#### Flujos alternativos

- **Búsqueda sin coincidencias (Empty State):** Si el comensal ingresa un término que no coincide con ningún plato (ej. *"mariscos"* en una pollería), el sistema despliega el estado vacío ilustrado informando de forma empática la especialidad del restaurante, proveyendo el botón `[ ↺ Ver Toda la Carta ]` para limpiar la búsqueda y un acceso rápido para consultas por WhatsApp.
- **Sede no encontrada o inactiva:** Si el slug no existe o la sede fue desactivada temporalmente, el sistema presenta una pantalla amigable indicando que el restaurante no se encuentra disponible.
- **Acceso desde desktop o tablet:** El sistema adapta su diseño a pantalla ancha mediante un layout de dos columnas (sidebar izquierdo con datos y contacto + grilla derecha fluida de tres columnas de platos).

**Postcondiciones:** Ninguna (caso de uso de consulta pura; el catálogo es 100% informativo sin emisión de pedidos ni creación de reservas por el cliente).

### CU-CLIENTE-02: Buscar comprobante de pago

**Actor(es):** Cliente (Comensal o Empresa adquiriente)

**Precondiciones:** Existe un comprobante generado y emitido en caja (`CU-CAJA-03`), con un identificador criptográfico único (`token_qr` UUID v8) asociado.

#### Flujo principal

1. El cliente escanea el código QR dinámico mostrado en pantalla al momento del cobro o presiona el enlace recibido directamente por WhatsApp / Correo electrónico (`https://app.restaurantcloud.pe/c/:token`).
2. El sistema valida el token único en la base de datos y resuelve la representación gráfica oficial del comprobante:
   - Datos del restaurante emisor: Razón social, RUC, sede, dirección física y teléfono.
   - Datos del documento: Tipo (Boleta de Venta, Factura Electrónica o Nota de Venta), serie y correlativo (`B001-0012894`, `F001-0004521`), fecha y hora de emisión.
   - Datos del cliente: Nombre o Razón Social, documento de identidad (DNI o RUC si fue suministrado) o consumidor final.
   - Desglose de ítems: Platos y bebidas consumidas, cantidades, precios unitarios y subtotales.
   - Liquidación financiera: Subtotal de consumo, descuento comercial (si hubo promoción), base imponible (operación gravada), I.G.V. (18.00%), total neto en Soles (`PEN - S/`) y medio de pago liquidado.
3. El sistema renderiza la interfaz responsive adaptada al dispositivo (Vista 1 en Smartphone o Vista 2 en Desktop) con badge `[ ✓ COMPROBANTE EMITIDO ]`.
4. El cliente presiona `[ 📥 Descargar Comprobante PDF ]` y obtiene el archivo oficial. Si se trata de una Factura con RUC, dispone además del botón `[ 📄 Descargar XML ]` para anexarlo a la contabilidad de su empresa.
5. El cliente puede compartir el comprobante vía WhatsApp, copiar el enlace directo o presionar `[ 🍽️ Explorar Carta Digital del Restaurante ]` para navegar la carta del local (`CU-CLIENTE-01`).

#### Flujos alternativos

- El cliente ingresa a `/comprobante` sin enlace o con código incompleto → el sistema despliega el estado orientador con el formulario `[ Ingrese el código de su comprobante ] [ 🔍 Consultar ]`, un aviso de protección de privacidad y un botón de WhatsApp para solicitar al personal del local el reenvío de su enlace.
- El comprobante fue anulado con Nota de Crédito (`CU-CAJA-04`) → el sistema exhibe un banner de alerta, la marca de agua `ANULADO`, la referencia a la Nota de Crédito emitida (`BC01-0000042`), el motivo de anulación y genera el PDF con el sello permanente de anulación.
- Se detecta exceso de solicitudes desde una misma IP (Rate Limiting en Redis: > 30 peticiones/minuto) → el sistema retorna error `429 Too Many Requests` previniendo ataques de fuerza bruta o scraping.

**Postcondiciones:** Ninguna alteración de estado; consulta y descarga idempotente de comprobante digital.

**Nota de Privacidad:** *El acceso es estrictamente mediante token único o código recibido; no existe búsqueda pública por DNI o RUC para salvaguardar la privacidad de los comensales y evitar exposición de consumos ajenos.*

*Diferido / opcional (solo si sobra tiempo dentro del plazo del proyecto): interactuar con un asistente conversacional de IA para consultas del cliente (horarios, recomendaciones).*

*Fuera de alcance actual: reservar mesa y realizar pedido directamente por el cliente (quedan a cargo exclusivo del Mozo); consulta de historial propio de pedidos/reservas por parte del cliente.*

# 8. Casos de uso transversales / del sistema

### CU-TRANS-01: Recibir notificaciones del sistema

**Actor(es):** Mozo, Cocina, Cajero, Administrador del local (según el tipo de evento)

**Precondiciones:** Ocurre un evento relevante para el rol correspondiente (reserva próxima a bloquear, pedido anulado, stock crítico, agotamiento de producto, discrepancia de caja, incidente, entre otros).

#### Flujo principal

1. El sistema genera una notificación cuando ocurre el evento relevante para ese rol.
2. El usuario ve un contador en un ícono de campana; al abrirlo, ve la lista de notificaciones (leídas/no leídas). La actualización se realiza mediante consulta periódica (polling) cada 15-30 segundos.
3. Al hacer clic en una notificación, se le redirige a la pantalla relacionada (mesa, pedido, inventario, incidente).

**Postcondiciones:** Notificación marcada como leída al abrirla.

### CU-SISTEMA-01: Generar snapshot diario de stock e insumos

**Actor(es):** Sistema (proceso automático, sin intervención humana)

**Precondiciones:** Existen insumos registrados con stock.

#### Flujo principal

1. Diariamente, a una hora configurable (ej. medianoche), el sistema toma el stock actual de cada insumo de cada local.
2. Guarda un registro histórico: insumo, local, fecha, cantidad en stock, indicando también si el insumo estuvo "agotado" en algún momento de ese día.

**Postcondiciones:** Historial diario disponible para alimentar el módulo de predicción, junto con el historial de ventas y el historial de compras (fichas de compra).