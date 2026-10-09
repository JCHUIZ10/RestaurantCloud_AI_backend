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
   - **Pestaña 2 (Receta e Insumos - Intuitiva y Rápida):**
     - El administrador selecciona los insumos necesarios desde el catálogo universal de 10 unidades (`CU-ADMIN-03`).
     - Para cada ingrediente, elige de forma sencilla e intuitiva entre dos modos:
       - **Modo Rendimiento (`rendimiento`):** Ingresa cuántos platos rinde 1 unidad de almacén (ej. *"1 saco de papa rinde 140 porciones de Lomo Saltado"*) $\rightarrow$ el sistema calcula automáticamente la fracción `cantidad_descuenta = 1/140 = 0.00714 sacos`.
       - **Modo Exacto (`exacto`):** Ingresa la fracción o unidad directa que consume cada plato (ej. *"0.25 unidades de pollo"* para 1/4 Pollo a la Brasa, *"1.00 botella"* para gaseosa, *"0.200 kg"* para carne).
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

**Postcondiciones:** Producto registrado/actualizado en la carta con categoría obligatoria y receta vinculada; costo teórico y margen calculados; disponibilidad sincronizada con el stock de almacén y comandas móviles.

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

### CU-ADMIN-12: Recibir notificación de anulación de pedido

**Actor(es):** Administrador del local (receptor pasivo)

**Precondiciones:** Un Mozo o Cajero ejecutó una anulación de pedido.

#### Flujo principal

1. El sistema anula el pedido automáticamente en el momento en que Mozo/Cajero lo solicita con motivo obligatorio.
2. El sistema notifica al administrador del local con: producto/pedido anulado, motivo, usuario que la ejecutó, fecha/hora.
3. El administrador puede consultar el detalle desde la notificación o desde el log de auditoría.

**Postcondiciones:** Pedido anulado de inmediato; administrador notificado; registro visible en auditoría.

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
   - **Barra Lateral Persistente (30% del ancho, ~390px): Pedidos en Vivo & Cocina:**
     - **`🔔 Platos Listos para Servir (Prioridad 1)`:** Alertas en caliente cuando la cocina marca un plato como `listo` en su monitor KDS ([`CU-COCINA-02`](#cu-cocina-02-cambiar-estado-de-un-plato-en-cocina)). Muestra mesa, plato, cronómetro en barra y botón en 1 toque `[ ✓ Marcar Servido ]` que lo actualiza a `entregado` en el sistema.
     - **`⏳ En Preparación en Cocina`:** Feed de comandas en curso de sus mesas activas con minutos transcurridos.
     - **`⚠️ Alertas Operativas`:** Avisos de platos observados por quiebre de insumos ([`CU-COCINA-04`](#cu-cocina-04-marcar-plato-como-agotado)) para coordinar sustituciones con el cliente.
3. El dispositivo establece una conexión persistente **Server-Sent Events (SSE)** (`GET /api/v1/mozo/stream`), actualizando mesas y comandas instantáneamente (< 30ms) sin necesidad de refresco manual ni recargas de página.
4. Al tocar una mesa ocupada, el sistema despliega el **Quick-Drawer Lateral (440px)** con el desglose plato por plato de la comanda, notas de cocina, subtotal y botones rápidos de salón:
   - `[ ＋ Tomar Más Pedidos / Adicionales ]` (conduce a [`CU-MOZO-02`](#cu-mozo-02-tomar-pedido)).
   - `[ 🧾 Solicitar Cuenta a Caja ]` (conmuta a `cuenta_pedida` y alerta a [`CU-CAJA-02`](#cu-caja-02-generar-cuenta-a-partir-de-pedidos-de-una-mesa)).
   - `[ 🔗 Unir con Otra Mesa ]` (conduce a [`CU-MOZO-04`](#cu-mozo-04-unir-o-dividir-mesas)).
   - `[ 🔄 Reasignar a Compañero ]` (transferencia de mesa por cambio de turno).

#### Flujos alternativos

- Se interrumpe momentáneamente la red WiFi del restaurante → El sistema mantiene la visualización en modo lectura con datos en caché local y muestra el indicador sutil `[ ⚠️ Reconectando... Modo Lectura ]` con reconexión automática mediante retroceso exponencial.
- Un plato en cocina supera el tiempo de espera estimado en el pase de salida (> 3 min) → La tarjeta en la barra lateral parpadea en color ámbar/rojo para urgir su recogida y evitar que se enfríe.
- Llega el cliente de una reserva bloqueada → El mozo toca la mesa y presiona `[ Sentar y Abrir Mesa ]`, conmutándola a ocupada y abriendo la comanda.
- El cliente de una reserva no se presenta tras la tolerancia (`tolerancia_no_show_min`) → El mozo puede marcar `[ Liberar Mesa por No-Show ]`, retornándola a estado libre.

**Postcondiciones:** Estado de mesas y comandas sincronizado en tiempo real en salón; platos listos entregados y auditados; solicitudes de cuenta emitidas a caja.

### CU-MOZO-02: Tomar pedido y comanda móvil en salón

**Actor(es):** Mozo (con enrutamiento pasivo a Cocina y preaviso a Cajero)

**Precondiciones:** La mesa está en estado libre u ocupada por el mismo grupo (para rondas adicionales); existen categorías y productos registrados en el local; el mozo cuenta con sesión activa.

*(Nota de arquitectura: Este caso de uso consolida operativamente `CU-MOZO-02: Tomar pedido`, `CU-MOZO-03: Modificar pedido antes de enviarlo` y `CU-MOZO-07: Consultar disponibilidad de productos` en una sola pantalla táctil unificada de alto rendimiento).*

#### Flujo principal

1. El mozo selecciona una mesa desde el plano de salón (`CU-MOZO-01`) y pulsa `[ + Tomar Pedido ]`.
2. El sistema despliega la pantalla táctil dividida: **Catálogo de la Carta (65%)** a la izquierda con disponibilidad en tiempo real (`disponible` / `agotado`), y **Ticket de Comanda (35%)** a la derecha.
3. El mozo recorre la carta usando chips de categorías (`Criollos`, `Entradas`, `Bebidas`, etc.) o el buscador instantáneo con debounce.
4. Toca `[ ＋ Añadir ]` sobre los productos deseados; el sistema los incorpora inmediatamente al borrador de comanda local.
5. Para cada plato en el ticket, el mozo puede:
   - Modificar la cantidad en 1 toque usando el stepper numérico táctil (`[ - ] [ cantidad ] [ + ]`).
   - Eliminar el ítem presionando el botón de papelera (`[ 🗑️ ]`).
   - Agregar o editar una nota rápida para cocina tocando `[ + Agregar nota a cocina ]` o `[ 📝 Editar ]`.
6. En el modal rápido de nota (480px), el mozo puede activar la casilla `[✓ Habilitar nota]` e ingresar una indicación corta (ej. *"Término 3/4, sin cebolla"*, *"Hielo aparte"*). Si no se activa o no se requiere, la nota se registra limpiamente como `NULL`.
7. Si la mesa ya cuenta con comanda previa (mesa ocupada), el ticket organiza visualmente los ítems por rondas:
   - **Ronda previa (en preparación o servida):** Se visualiza en bloque informativo de referencia para control contable.
   - **Nueva ronda (adicionales):** Se resalta en blanco con su desglose financiero independiente y botón contextual de despacho.
8. El mozo revisa el subtotal, desglose de IGV (18% incluido) y presiona `[ 🚀 Confirmar y Enviar a Cocina ]`.
9. El backend valida atómicamente la disponibilidad de los productos, persiste el pedido en PostgreSQL 16 (`pedido` y `pedido_item`), actualiza la mesa a estado `ocupada` y emite vía Server-Sent Events (SSE) el evento `nueva_comanda_cocina` en < 30ms hacia el monitor KDS de Cocina (`CU-COCINA-01`).
10. El frontend confirma con vibración háptica y toast sonoro, retornando al mozo al plano de salón.

#### Flujos alternativos

- **Plato agotado durante la selección (SSE reactivo):** Si cocina marca un producto como agotado mientras el mozo navega la carta, el plato conmuta inmediatamente a badge `[ 🔒 AGOTADO ]` y su botón queda deshabilitado, impidiendo su selección.
- **Conflicto de stock al momento del envío (`409 Conflict`):** Si un producto se agota en cocina en la ventana entre que el mozo lo añadió al ticket y presionó enviar, la transacción se aborta de forma segura y se despliega el modal asistido (Vista 4) con opciones en 1 toque:
  - *Opción A:* `[ Quitar plato agotado y despachar los demás platos a cocina ]`.
  - *Opción B:* `[ Volver al catálogo y ofrecer una alternativa al comensal ]`.
- **Descartar borrador:** El mozo puede pulsar `[ ✕ Descartar Borrador ]` para anular la comanda no enviada sin generar registros residuales ni afectar el estado de la mesa.

**Postcondiciones:** Pedido persistido en base de datos con sus rondas identificadas; comanda enrutada a la pantalla KDS de Cocina; mesa actualizada a estado `ocupada`; salón y caja notificados en tiempo real.

---

### CU-MOZO-03: Modificar pedido antes de enviarlo a cocina

> **Nota de consolidación:** Este requerimiento ha sido integrado nativamente dentro del flujo de `CU-MOZO-02: Tomar pedido`. Toda modificación táctica antes del despacho a cocina (aumento/disminución de cantidades vía stepper numérico `[ - ] [ + ]`, eliminación de ítems con `[ 🗑️ ]` y edición o retiro de notas de cocina) se efectúa de manera reactiva en el ticket lateral interactivo antes de emitir la confirmación definitiva.

---

### CU-MOZO-04: Unir o dividir mesas

**Actor(es):** Mozo

**Precondiciones:** Las mesas involucradas están marcadas con permite\_union = true; el plan del local incluye esta función (Pro/Enterprise).

#### Flujo principal

1. El mozo selecciona dos o más mesas con permite\_union habilitado y elige "Unir".
2. El sistema las combina en una sola cuenta activa, manteniendo el pedido consolidado.
3. Para dividir: el mozo solo puede hacerlo si todas las mesas unidas están desocupadas (el grupo ya pagó y se retiró); el sistema separa las mesas de vuelta a su estado individual original.

#### Flujos alternativos

- Una de las mesas seleccionadas ya tiene pedido activo de otro grupo, o no tiene permite\_union habilitado → el sistema bloquea la unión.

**Postcondiciones:** Mesas unidas o divididas según corresponda.

### CU-MOZO-05: Gestionar reservas

**Actor(es):** Mozo

**Precondiciones:** El local tiene las reservas habilitadas (CU-ADMIN-09); horario de atención configurado.

#### Flujo principal

1. El mozo accede a "Reservas" → "Nueva reserva" e ingresa fecha, hora y número de personas.
2. El sistema calcula qué mesas estarán libres en ese horario (considerando duración estándar \+ buffer de otras reservas) y sugiere mesas individuales o combinaciones usando solo mesas con permite\_union = true.
3. El mozo busca por etiqueta (búsqueda dinámica) o elige directamente de las mesas sugeridas.
4. El mozo confirma la(s) mesa(s) elegida(s) e ingresa los datos del cliente (nombre, teléfono).
5. El sistema guarda la reserva con la mesa ya asignada y muestra de inmediato un indicador visual informativo en el plano (ej. "Reservada 20:00"), sin restringir su uso mientras tanto.
6. Cuando faltan los minutos configurados (minutos\_bloqueo\_previo) para la hora de la reserva, el sistema cambia la mesa a estado "bloqueada" y genera una notificación al personal del local.
7. Al llegar el cliente, el mozo marca la reserva como "atendida" y la mesa pasa a estado "ocupada" con el pedido normal.
8. El mozo puede editar o cancelar la reserva en cualquier momento antes de que sea atendida.

#### Flujos alternativos

- No hay mesas (ni combinaciones válidas) suficientes para el horario/tamaño solicitado → el sistema informa y sugiere horarios alternativos (sin lista de espera).
- El mozo intenta asignar una mesa bloqueada a otro cliente → el sistema advierte "Esta mesa tiene una reserva a las \[hora\]. ¿Deseas ocuparla igual?" y solo continúa si confirma explícitamente; la reserva original queda sin mesa y debe reasignarse manualmente.
- El cliente no llega pasado un tiempo de tolerancia configurable → el mozo marca la reserva como "no show" y el sistema libera la mesa automáticamente.
- Dos mozos intentan seleccionar la misma mesa casi simultáneamente → el sistema bloquea temporalmente la mesa mientras un mozo la está seleccionando, hasta que confirme o cancele.

**Postcondiciones:** Reserva creada con mesa(s) ya asignada(s) desde el inicio; notificaciones programadas; mesa liberada u ocupada según corresponda.

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

# 5. Cocina

### CU-COCINA-01: Ver cola de pedidos entrantes

**Actor(es):** Cocina

**Precondiciones:** Existen pedidos enviados por el Mozo.

#### Flujo principal

1. Cocina accede a la pantalla de "Cola de pedidos".
2. El sistema muestra los pedidos en orden de llegada, con: mesa, ítems solicitados, notas especiales, hora de recepción.
3. Cocina puede filtrar/agrupar por tipo de preparación si el local lo requiere.

**Postcondiciones:** Ninguna (consulta).

### CU-COCINA-02: Actualizar estado de preparación

**Actor(es):** Cocina

**Precondiciones:** Existe un pedido/ítem en cola.

#### Flujo principal

1. Cocina selecciona un pedido o ítem y cambia su estado: "en cola" → "en preparación" → "listo".
2. El sistema notifica automáticamente al Mozo cuando un ítem/pedido pasa a "listo".

**Postcondiciones:** Estado del pedido/ítem actualizado; Mozo notificado si corresponde.

### CU-COCINA-03: Descuento automático de insumos por consumo

**Actor(es):** Cocina (proceso automático del sistema)

**Precondiciones:** El producto vendido tiene una receta de insumos definida obligatoriamente por el administrador (CU-ADMIN-04).

#### Flujo principal

1. Al marcar un ítem como "listo", el sistema descuenta automáticamente del inventario los insumos definidos en la receta del producto, convertidos de su unidad de consumo a su unidad de compra mediante el factor de conversión correspondiente.

#### Flujos alternativos

- El insumo a descontar no tiene stock suficiente → el sistema permite continuar (no bloquea la preparación) pero genera una alerta al administrador de inconsistencia de stock.

**Postcondiciones:** Inventario actualizado según el consumo estimado.

### CU-COCINA-04: Marcar producto como agotado / disponible

**Actor(es):** Cocina

**Precondiciones:** El producto existe en la carta del local.

#### Flujo principal

1. Cocina identifica que un producto no puede seguir ofreciéndose (se acabó un insumo clave).
2. Marca el producto como "agotado" temporalmente.
3. El sistema oculta/bloquea ese producto para nuevos pedidos.
4. Cuando el insumo vuelve a estar disponible, Cocina revierte el estado a "disponible".

#### Flujos alternativos

- Al marcar un producto como agotado, el sistema identifica automáticamente los pedidos/ítems pendientes que lo incluyen: los que están en estado "en cola" se marcan automáticamente como "No disponible", visible para el Mozo, y se dispara una notificación activa al mozo responsable de esa mesa (no solo un indicador visual); los que están "en preparación" se muestran a Cocina para que decida, uno por uno, si puede continuar (ya tiene el insumo apartado) o no puede continuar — los marcados como "no puede continuar" pasan también a "No disponible" con su respectiva notificación al mozo.
- El Mozo, al recibir la notificación de un ítem "No disponible", debe resolverlo con el cliente (cambiarlo por otro producto o anularlo con motivo, vía CU-MOZO-06).
- Si es Cocina quien marca el producto como agotado (criterio humano, no por falta de stock detectada automáticamente por el sistema), el sistema notifica al administrador del local de inmediato, indicando qué producto y quién lo marcó.

**Postcondiciones:** Disponibilidad del producto actualizada en tiempo real; ítems afectados en cola marcados automáticamente; ítems en preparación resueltos individualmente por Cocina; Mozo y Administrador notificados según corresponda.

### CU-COCINA-05: Recibir notificación de anulación de pedido

**Actor(es):** Cocina

**Precondiciones:** Un Mozo anuló un pedido/ítem que ya estaba en cola o en preparación.

#### Flujo principal

1. El sistema notifica a Cocina de inmediato cuando se anula un ítem que le corresponde preparar.
2. Cocina detiene la preparación si aún no ha comenzado, o la descarta si ya estaba en curso.
3. Si el ítem ya estaba listo/entregado al momento de la anulación, el sistema ya lo registró como merma (no revierte el consumo de insumos).

**Postcondiciones:** Preparación detenida/descartada; inventario no se revierte si el ítem ya estaba listo.

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