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

### CU-SAAS-01: Confirmar registro de empresa (tenant)

**Actor(es):** Administrador SaaS

**Precondiciones:** Existe una solicitud de registro de empresa por confirmar (proceso de alta iniciado por el Propietario, CU-PROP-01).

#### Flujo principal

1. El administrador accede a la bandeja de solicitudes de nuevas empresas.
2. Revisa los datos de la empresa registrados por el propietario.
3. Aprueba el registro.

#### Flujos alternativos

- El administrador detecta un dato inconsistente → puede contactar al propietario antes de aprobar (fuera de flujo automático).

**Postcondiciones:** Empresa activada; propietario notificado.

### CU-SAAS-02: Dar de baja / suspender empresa (conforme a ley)

**Actor(es):** Administrador SaaS

**Precondiciones:** La empresa existe y está activa.

#### Flujo principal

1. El administrador busca la empresa e indica el motivo de suspensión o baja.
2. El sistema bloquea el acceso operativo de la empresa (suspensión) o inicia el proceso formal de baja.
3. Si es baja definitiva, el sistema: (a) notifica al propietario con anticipación; (b) ofrece exportación de sus datos (derecho de portabilidad) antes del borrado; (c) aplica un periodo de retención (ej. 30 días) antes de la eliminación definitiva, permitiendo reversión.
4. Cumplido el plazo, el sistema elimina los datos de forma definitiva y registra la acción en auditoría.

#### Flujos alternativos

- El propietario no responde ni exporta datos dentro del plazo → el sistema procede igualmente con la eliminación al finalizar el periodo de retención.

**Postcondiciones:** Empresa suspendida o eliminada conforme a normativa de protección de datos; acción trazable en auditoría.

**Nota:** *Los plazos exactos (notificación previa, retención) deben ajustarse con asesoría legal en producción.*

### CU-SAAS-03: Configurar planes de suscripción

**Actor(es):** Administrador SaaS

**Precondiciones:** Ninguna (gestión de catálogo de planes).

#### Flujo principal

1. El administrador accede a "Planes de suscripción".
2. Crea o edita un plan definiendo: nombre, precio, periodicidad, límites (locales, mesas, pisos, uso de IA, reservas, etc.).
3. El sistema guarda el plan y lo hace disponible para asignación a empresas.

#### Flujos alternativos

- Se edita un plan ya asignado a empresas existentes → el sistema pregunta si el cambio aplica solo a nuevas contrataciones o también a empresas actuales.

**Postcondiciones:** Catálogo de planes actualizado.

### CU-SAAS-04: Monitorear salud de la plataforma

**Actor(es):** Administrador SaaS

**Precondiciones:** Ninguna.

#### Flujo principal

1. El administrador accede al panel de monitoreo global.
2. El sistema muestra métricas: empresas activas, uso de recursos por tenant, errores del sistema, consumo de servicios de IA.
3. El administrador filtra por empresa o rango de fechas si necesita profundizar.

#### Flujos alternativos

- Se detecta una anomalía (ej. consumo excesivo de un tenant) → el sistema genera alerta automática.

**Postcondiciones:** Ninguna (caso de uso de consulta).

### CU-SAAS-05: Consultar log de auditoría global

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
   - **Paso 1 (Datos de la Sede & Supervisión):**
     - Ingresa datos comerciales: nombre del local, dirección física, distrito, ciudad (Lima/Perú) y teléfono de contacto.
     - Elige el modo de supervisión: auto-administración directa por el Propietario (por defecto, no consume cupos adicionales de personal) o asignación de un administrador de local existente.
     - Presiona `[ Siguiente: Elegir Giro ]`.
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
   - Inserta la sede en estado `activo` (zona horaria fija `America/Lima`, moneda `PEN - S/`, `giro_negocio`).
   - Inserta el piso inicial "Salón Principal" (5 columnas x 3 filas).
   - Si se seleccionó un giro gastronómico (`polleria`, `cevicheria`, `chifa`): inserta sus categorías de carta predefinidas y sus insumos de inventario calibrados con las 10 unidades limpias.
7. El sistema confirma la creación y actualiza el directorio de sedes. El propietario puede editar los datos comerciales o desactivar/reactivar locales existentes.

#### Flujos alternativos

- Se excede el límite del plan (`max_locales`) → el sistema bloquea el registro e invita a realizar upgrade (`CU-PROP-03`).
- Existe un downgrade programado con tope inferior → el sistema aplica la política de congelamiento preventivo y bloquea la creación hasta cancelar el downgrade.
- Se intenta desactivar el único local activo de la empresa → el sistema bloquea la acción (*"Una empresa activa debe contar con al menos una sede operativa"*).
- Se intenta dar de baja un local con actividad operativa en curso (**Bloqueo Duro**) → el sistema audita en tiempo real: si existen cajas abiertas (`cajas_abiertas > 0`) o comandas pendientes en salón (`pedidos_activos > 0`), la desactivación queda estrictamente bloqueada hasta que el personal cierre los turnos y facture las órdenes pendientes.
- Si no hay actividad operativa en curso → el sistema solicita confirmación de seguridad y conmuta la sede a `estado = 'inactivo'` (*soft-deactivation*), preservando el 100% del historial de ventas y comandas.

**Postcondiciones:** Local creado con su giro gastronómico registrado (`giro_negocio`), piso base ("Salón Principal") y catálogos iniciales aprovisionados (o en blanco); histórico preservado en desactivaciones.

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

### CU-PROP-06: Ver reportes consolidados de la empresa

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

### CU-PROP-07: Ver predicciones de demanda a nivel empresa

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

### CU-PROP-08: Configurar políticas generales de la empresa

**Actor(es):** Propietario del restaurante

**Precondiciones:** Empresa activa con al menos un local.

#### Flujo principal

1. El propietario accede a "Configuración general".
2. Define una carta base (productos comunes a replicar en nuevos locales) y políticas de precios/promociones a nivel empresa.
3. El sistema guarda la configuración como plantilla; cada administrador de local puede luego ajustarla localmente según reglas fijas de permisos (ej. no puede editar nombre/categoría de la carta base, sí precio local y disponibilidad).

#### Flujos alternativos

- El propietario restringe que un local no pueda modificar ciertos precios (política de marca uniforme) → el sistema bloquea esa edición a nivel local.

**Postcondiciones:** Configuración general/plantilla guardada, disponible para los locales.

### CU-PROP-09: Ver incidentes de la empresa

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

### CU-ADMIN-07: Ver recomendaciones de reposición de insumos (IA)

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
7. Si el incidente es tipificado con gravedad `alta`, el backend emite un evento SSE broadcast que dispara una alerta prioritaria en la sesión del Propietario (`CU-PROP-09`).
8. El administrador puede consultar el historial completo de su sede utilizando filtros combinados (estado, gravedad, categoría, colaborador, rango de fechas) o el buscador reactivo.
9. Al hacer clic en `[ Ver / Resolver ]`, el sistema abre el modal de detalle e inspección:
   - Si el Propietario supervisó el caso desde `CU-PROP-09` e ingresó una directiva u observación (`nota_propietario`), se exhibe destacada en un panel directivo corporativo.
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

**Actor(es):** Administrador del local

**Precondiciones:** Existe actividad de ventas registrada.

#### Flujo principal

1. El administrador accede a "Reportes".
2. Selecciona tipo (ventas por periodo, por producto, por mesero) y rango de fechas.
3. El sistema genera el reporte.
4. El administrador exporta en PDF/Excel.

**Postcondiciones:** Reporte generado/exportado.

---

### CU-ADMIN-14: Consultar flujo de caja del local

**Actor(es):** Administrador del local

**Precondiciones:** El local tiene actividad registrada (ventas y/o compras).

#### Flujo principal

1. El administrador accede a "Flujo de caja" dentro de Reportes.
2. Selecciona un rango de fechas (día, semana, mes).
3. El sistema muestra: ingresos (ventas cobradas en el periodo), egresos (compras de insumos más gastos manuales registrados) y balance neto del periodo.
4. El administrador puede exportar el reporte (PDF/Excel).

#### Flujos alternativos

- El administrador necesita registrar un egreso que no viene de una compra formal (ej. alquiler, servicios) → el sistema permite registrar un gasto manual con categoría, monto, fecha y descripción.

**Postcondiciones:** Ninguna (consulta), salvo que se registre un gasto manual.

---

### CU-ADMIN-15: Supervisar cierre de caja diario

**Actor(es):** Administrador del local

**Precondiciones:** El cajero realizó apertura de caja durante el día.

#### Flujo principal

1. El administrador accede a "Cierre de caja" al final del día/turno.
2. El sistema muestra el resumen del cajero: monto de apertura, ventas cobradas, monto esperado en caja.
3. El administrador confirma el cierre o revisa la discrepancia (con comentario) si el monto real no coincide.

#### Flujos alternativos

- Hay discrepancia → el sistema la registra y queda visible en reportes/auditoría.

**Postcondiciones:** Caja cerrada para el día; discrepancias registradas si las hay.

---

### CU-ADMIN-16: Consultar log de auditoría del local

**Actor(es):** Administrador del local

**Precondiciones:** Ninguna.

#### Flujo principal

1. El administrador accede a "Auditoría".
2. Filtra por usuario, tipo de acción o rango de fechas (ej. anulaciones, descuentos, cambios de carta).
3. El sistema muestra el historial correspondiente.

**Postcondiciones:** Ninguna (consulta).

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

### CU-CAJA-01: Abrir caja

**Actor(es):** Cajero

**Precondiciones:** El local está en horario de atención; no existe una caja abierta previamente sin cerrar.

#### Flujo principal

1. El cajero accede a "Caja" → "Abrir caja".
2. Ingresa el monto inicial en efectivo (fondo de caja).
3. El sistema registra la apertura con fecha/hora y cajero responsable.

#### Flujos alternativos

- Ya existe una caja abierta sin cerrar (turno anterior) → el sistema bloquea la apertura y notifica al administrador.

**Postcondiciones:** Caja abierta, lista para operar.

### CU-CAJA-02: Generar cuenta a partir de pedido(s) de una mesa

**Actor(es):** Cajero

**Precondiciones:** La mesa tiene uno o más pedidos activos, con ítems en estado "listo" o "entregado".

#### Flujo principal

1. El cajero selecciona la mesa a cobrar.
2. El sistema muestra el consolidado de ítems pedidos, con su precio y total (incluye ambas mesas si están unidas).
3. El cajero, si corresponde, selecciona una promoción vigente de la lista que el sistema ofrece (filtradas automáticamente por fecha) y la aplica a la cuenta.
4. El sistema calcula el total final a cobrar.

**Postcondiciones:** Cuenta generada, lista para cobro.

### CU-CAJA-03: Cobrar y mostrar comprobante

**Actor(es):** Cajero

**Precondiciones:** Existe una cuenta generada.

#### Flujo principal

1. El cajero selecciona el tipo de comprobante: Boleta (solicita DNI/Carnet de Extranjería \+ nombre), Factura (solicita RUC \+ razón social) o Nota de venta (sin datos adicionales).
2. Si aplica documento (Boleta/Factura), el sistema busca primero en su propia base de datos; si no lo encuentra, consulta la API externa (RENIEC/SUNAT) para obtener el nombre/razón social y guarda el dato localmente para futuras consultas.
3. El cajero selecciona el medio de pago: Tarjeta, Billetera digital o Efectivo (registro declarativo, sin integración bancaria real). Si es efectivo, ingresa el monto recibido; el sistema calcula el vuelto.
4. El cajero confirma el cobro.
5. El sistema marca el pedido como "cobrado", libera la mesa y muestra en pantalla el detalle del pago junto con un código QR de token único e impredecible, que enlaza al comprobante digital descargable en PDF.
6. El sistema registra el ingreso en el flujo de caja del día.

#### Flujos alternativos

- El monto recibido en efectivo es menor al total → el sistema no permite confirmar el cobro hasta corregir.

**Postcondiciones:** Pedido cobrado; mesa liberada; comprobante digital disponible vía QR (sin impresión física); ingreso reflejado en caja.

### CU-CAJA-04: Dividir cuenta entre varios comensales

**Actor(es):** Cajero

**Precondiciones:** Existe una cuenta generada con más de un ítem o comensal.

#### Flujo principal

1. El cajero selecciona "Dividir cuenta" sobre una cuenta activa.
2. Elige el método de división: por partes iguales (ingresando número de personas) o asignando ítems específicos a cada sub-cuenta.
3. El sistema genera los montos correspondientes a cada parte.
4. El cajero cobra cada parte por separado, pudiendo usar métodos de pago distintos por persona.

#### Flujos alternativos

- Queda un ítem sin asignar a ninguna sub-cuenta → el sistema no permite continuar hasta que todos los ítems estén asignados.

**Postcondiciones:** Cuenta dividida y cobrada en partes; mesa se libera solo cuando todas las partes están cobradas.

### CU-CAJA-05: Anular pedido ya cobrado

**Actor(es):** Cajero

**Precondiciones:** Existe un pedido en estado "cobrado".

#### Flujo principal

1. El cajero selecciona el pedido/comprobante a anular.
2. Ingresa el motivo (obligatorio).
3. El sistema anula el pedido de inmediato, genera el ajuste correspondiente (nota de crédito/reverso) y notifica automáticamente al administrador del local.
4. El sistema revierte el ingreso registrado en el flujo de caja.

**Postcondiciones:** Pedido anulado post-cobro; ajuste contable reflejado en caja; evento registrado en auditoría.

### CU-CAJA-06: Cerrar caja (arqueo)

**Actor(es):** Cajero

**Precondiciones:** La caja está abierta.

#### Flujo principal

1. El cajero accede a "Cerrar caja" al final de su turno.
2. El sistema muestra el resumen automático: monto de apertura, total de ventas cobradas por método de pago, total esperado en efectivo.
3. El cajero cuenta el efectivo físico real y lo ingresa al sistema.
4. El sistema compara el monto real vs. el esperado y muestra la diferencia (si existe).
5. El cajero confirma el cierre.

#### Flujos alternativos

- Existe una discrepancia → el sistema exige un comentario obligatorio antes de permitir el cierre, visible para el administrador.

**Postcondiciones:** Caja cerrada; resumen disponible para supervisión del administrador.

# 7. Cliente

### CU-CLIENTE-01: Consultar carta digital

**Actor(es):** Cliente

**Precondiciones:** El local está activo.

#### Flujo principal

1. El cliente accede a la carta (vía QR en mesa o app/web).
2. El sistema muestra los productos disponibles, organizados por categoría, con precio y descripción.

**Postcondiciones:** Ninguna (consulta).

### CU-CLIENTE-02: Buscar comprobante de pago

**Actor(es):** Cliente

**Precondiciones:** Existe un comprobante generado (CU-CAJA-03), con un enlace único (token) asociado.

#### Flujo principal

1. El cliente escanea el código QR mostrado en pantalla al momento del pago.
2. El sistema valida el token único del enlace y muestra el detalle del comprobante (ítems, total, tipo, fecha).
3. El cliente presiona "Descargar" y obtiene el comprobante en PDF.

#### Flujos alternativos

- El cliente perdió el enlace/QR → debe acercarse o comunicarse con el local; el Cajero localiza la transacción manualmente y le reenvía el enlace.

**Postcondiciones:** Ninguna (consulta/descarga).

**Nota:** *El acceso es únicamente vía QR (token único e impredecible); no existe búsqueda pública por documento, para evitar exposición de datos de otros clientes.*

*Diferido / opcional (solo si sobra tiempo dentro del plazo del proyecto): interactuar con un asistente conversacional de IA para consultas del cliente (horarios, recomendaciones, alérgenos).*

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