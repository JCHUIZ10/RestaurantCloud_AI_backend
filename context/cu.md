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

**Precondiciones:** El usuario accede al sitio público de registro de RestaurantCloud AI.

#### Flujo principal

1. El usuario selecciona "Registrar mi negocio".
2. El sistema muestra los planes disponibles (Starter, Pro, Enterprise).
3. El usuario selecciona el plan que más le conviene.
4. El usuario ingresa los datos de su empresa: razón social, RUC/identificador fiscal, correo, teléfono.
5. El usuario ingresa los datos de su tarjeta; el sistema procesa el pago vía Stripe.
6. El sistema confirma el pago y activa la empresa de inmediato.
7. El sistema muestra mensaje de registro exitoso.
8. El sistema envía correo con credenciales de acceso (Propietario).
9. El sistema permite descargar constancia de registro (empresa, plan, periodo, fecha de pago).
10. El sistema muestra información de soporte técnico.

#### Flujos alternativos

- El identificador fiscal ya existe → el sistema rechaza el registro y sugiere iniciar sesión.
- El pago con Stripe es rechazado (tarjeta inválida/fondos insuficientes) → el sistema muestra el error y permite reintentar con otra tarjeta.

**Postcondiciones:** Empresa activa; propietario con credenciales enviadas.

### CU-PROP-02: Gestionar suscripción y método de pago

**Actor(es):** Propietario del restaurante

**Precondiciones:** El propietario tiene una empresa activa con un plan asignado.

#### Flujo principal

1. El propietario accede a "Mi suscripción".
2. El sistema muestra: plan actual, fecha de próximo cobro, historial de pagos/facturas, tarjeta registrada.
3. El propietario puede actualizar su método de pago o descargar facturas anteriores.
4. El propietario puede solicitar cambio de plan (enlaza con CU-PROP-03).

#### Flujos alternativos

- El cobro automático falla → el sistema notifica al propietario, reintenta (ej. 3 intentos en días distintos); si todos fallan, suspende la empresa (CU-SAAS-02).

**Postcondiciones:** Suscripción y/o método de pago actualizado.

### CU-PROP-03: Cambiar plan de suscripción

**Actor(es):** Propietario del restaurante

**Precondiciones:** La empresa está activa y tiene un plan asignado.

#### Flujo principal

1. El propietario selecciona un nuevo plan desde su panel.
2. El sistema evalúa si es upgrade o downgrade.
3. Si es upgrade: el sistema aplica el cambio de inmediato y ajusta el cobro (prorrateado).
4. Si es downgrade: valida que el uso actual no exceda los límites del nuevo plan; si cumple, programa el cambio para el fin del ciclo de facturación actual; si no cumple, informa qué recursos debe reducir.
5. El sistema confirma el cambio al propietario (inmediato o programado).

#### Flujos alternativos

- El propietario reduce recursos (ej. da de baja un local) y vuelve a intentar el downgrade → el sistema permite continuar.

**Postcondiciones:** Plan actualizado (inmediato o al cierre del ciclo).

### CU-PROP-04: Registrar y administrar locales

**Actor(es):** Propietario del restaurante

**Precondiciones:** La empresa está activa; el número de locales no excede el límite del plan.

#### Flujo principal

1. El propietario accede a "Mis locales".
2. Selecciona "Registrar nuevo local".
3. Ingresa datos del local: nombre, dirección, teléfono, moneda/zona horaria si aplica.
4. El sistema valida que no se exceda el límite de locales del plan actual.
5. El sistema crea el local y lo asocia a la empresa.
6. El propietario puede editar o dar de baja (desactivar) locales existentes.

#### Flujos alternativos

- Se excede el límite del plan → el sistema bloquea el registro y sugiere hacer upgrade (CU-PROP-03).
- Se intenta dar de baja un local con actividad reciente (pedidos/reservas pendientes) → el sistema advierte y solicita confirmación explícita.

**Postcondiciones:** Local creado, editado o desactivado.

### CU-PROP-05: Crear y gestionar administradores de local

**Actor(es):** Propietario del restaurante

**Precondiciones:** Existe al menos un local registrado.

#### Flujo principal

1. El propietario accede a "Usuarios" dentro de un local.
2. Selecciona "Agregar administrador de local".
3. Ingresa datos del usuario (nombre, correo) y el sistema le asigna el rol "Administrador de local".
4. El sistema envía credenciales de acceso al correo del nuevo administrador.
5. El propietario puede editar, desactivar o reasignar el rol de un administrador existente.

#### Flujos alternativos

- El correo ya está registrado en la plataforma (regla de usuario único por tenant) → el sistema rechaza el registro.

**Postcondiciones:** Administrador de local creado/actualizado con acceso a su local correspondiente.

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

**Precondiciones:** Existen incidentes registrados en al menos un local de la empresa.

#### Flujo principal

1. El propietario accede a "Incidentes" desde su panel general.
2. El sistema muestra el consolidado de incidentes de todos los locales de la empresa: local, fecha, gravedad, descripción, empleado involucrado (si aplica), estado, foto.
3. El propietario filtra por local, gravedad o estado si lo necesita.
4. El propietario puede marcar un incidente como "visto" (registra fecha/hora de revisión), sin alterar su estado de resolución.

**Postcondiciones:** Incidente marcado como visto por el propietario (dato independiente del estado que gestiona el Administrador de local).

**Nota:** *El campo "visto por propietario" es independiente del estado (abierto/en revisión/resuelto) que gestiona el administrador del local.*

# 3. Administrador del local

### CU-ADMIN-01: Gestionar plano de mesas

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Plano de mesas".
2. Selecciona un piso/área existente o crea uno nuevo (nombre, ej. "Piso 1", "Terraza").
3. Agrega una mesa: número/identificador, capacidad (personas), posición dentro del piso, etiqueta (texto libre, ej. "Ventana 2") y si permite unión con otras mesas (booleano permite\_union).
4. El sistema guarda la mesa como "activa" y disponible para uso.
5. El administrador puede editar posición, capacidad, etiqueta, permite\_union o dar de baja (desactivar) una mesa existente.

#### Flujos alternativos

- Se excede el límite de mesas del plan contratado (Starter) → el sistema bloquea la creación y sugiere upgrade.
- Se intenta desactivar una mesa con pedidos/reservas activas → el sistema advierte y solicita confirmación o bloquea hasta resolver la actividad pendiente.

**Postcondiciones:** Plano de mesas actualizado; mesas dadas de baja se mantienen en el historial (no se eliminan).

### CU-ADMIN-02: Gestionar categorías de la carta

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Categorías" dentro de Carta.
2. Crea una categoría (ej. Bebidas, Entradas, Platos de fondo, Postres).
3. Puede renombrar o eliminar una categoría existente.

#### Flujos alternativos

- Se intenta eliminar una categoría con productos asociados → el sistema bloquea la eliminación y solicita reasignar los productos primero.

**Postcondiciones:** Catálogo de categorías actualizado.

### CU-ADMIN-03: Gestionar productos de la carta

**Actor(es):** Administrador del local

**Precondiciones:** Existe al menos una categoría creada.

#### Flujo principal

1. El administrador accede a "Carta" → "Nuevo producto".
2. Ingresa: nombre, descripción, precio, categoría, foto (opcional), disponibilidad (activo/inactivo).
3. Define de forma obligatoria la receta del producto: qué insumos consume y en qué cantidad, expresada en la unidad de consumo de cada insumo (ej. "1 unidad de papa", "50 gramos de queso").
4. El sistema guarda el producto; no permite guardarlo sin al menos un insumo asociado en su receta.
5. El administrador puede editar precio, descripción, categoría o disponibilidad sin necesidad de volver a tocar la receta, salvo que lo desee.

#### Flujos alternativos

- El propietario definió una carta base con restricciones → el administrador solo puede editar precio local y disponibilidad, no nombre/categoría si está bloqueado a nivel empresa.
- El administrador no tiene clara la receta exacta → puede guardar una estimación inicial y ajustarla después; no se exige precisión perfecta, solo que exista una receta base.

**Postcondiciones:** Producto creado/actualizado en la carta del local, con su receta de insumos asociada.

### CU-ADMIN-04: Gestionar personal del local

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Personal".
2. Selecciona "Agregar empleado", ingresa datos (nombre, correo) y asigna rol (Mozo, Cocina, Cajero).
3. El sistema crea el usuario y envía credenciales de acceso.
4. El administrador puede editar datos, cambiar rol o desactivar un empleado.

#### Flujos alternativos

- El correo ya existe en la plataforma → el sistema rechaza el registro (regla de usuario único por tenant).
- Se desactiva un empleado con pedidos activos asignados → el sistema advierte antes de confirmar.

**Postcondiciones:** Personal del local actualizado.

### CU-ADMIN-05: Configurar horario de atención y reservas del local

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Horario de atención".
2. Define, por cada día de la semana: si atiende o no, y su horario (único o por turnos).
3. Puede registrar excepciones puntuales (ej. cierre por feriado).
4. El administrador activa o desactiva la recepción de reservas para el local.
5. Si las reservas están habilitadas, configura: duración estándar de una reserva, buffer entre reservas, tiempo de tolerancia para "no show", minutos de bloqueo previo a la reserva (minutos\_bloqueo\_previo) y margen de anticipación para el recordatorio/notificación.
6. El sistema guarda la configuración y la usa para validar disponibilidad y bloquear/liberar mesas según corresponda.

#### Flujos alternativos

- Se registra una excepción sobre un día con reservas ya confirmadas → el sistema advierte y sugiere notificar a los clientes afectados.
- Se intenta desactivar la recepción de reservas existiendo reservas futuras activas → el sistema no lo permite hasta que esas reservas se resuelvan (se atiendan o cancelen).

**Postcondiciones:** Horario de atención y configuración de reservas actualizados.

### CU-ADMIN-06: Registrar y consultar historial de incidentes internos

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Incidentes" → "Registrar nuevo".
2. Ingresa: descripción, fecha/hora, gravedad, foto (opcional), empleado involucrado (opcional).
3. El sistema guarda el incidente con estado "abierto".
4. El administrador puede actualizar el estado (en revisión, resuelto) y agregar notas de seguimiento.
5. El administrador puede consultar el historial completo de incidentes de su local (todos, no solo los abiertos), filtrable por fecha, gravedad o estado.

**Postcondiciones:** Incidente registrado, actualizado y disponible en el historial y en reportes.

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

### CU-ADMIN-08: Registrar ficha de compra

**Actor(es):** Administrador del local

**Precondiciones:** La compra ya se realizó físicamente.

#### Flujo principal

1. El administrador accede a "Compras" → "Registrar ficha de compra".
2. Busca el proveedor (búsqueda dinámica) o lo crea al vuelo.
3. Agrega los insumos comprados a ese proveedor, cantidad y precio pagado por unidad.
4. Confirma la ficha.
5. El sistema aumenta el stock de cada insumo, actualiza el último proveedor, último precio, moneda y fecha de última compra de cada insumo, y registra el egreso correspondiente en el flujo de caja.

#### Flujos alternativos

- Se compra un insumo a un proveedor con el que no tenía relación previa → el sistema crea la relación automáticamente con este precio como referencia inicial.

**Postcondiciones:** Stock actualizado; datos de referencia del insumo actualizados; egreso reflejado en flujo de caja.

### CU-ADMIN-09: Recibir notificación de anulación de pedido

**Actor(es):** Administrador del local (receptor pasivo)

**Precondiciones:** Un Mozo o Cajero ejecutó una anulación de pedido.

#### Flujo principal

1. El sistema anula el pedido automáticamente en el momento en que Mozo/Cajero lo solicita con motivo obligatorio.
2. El sistema notifica al administrador del local con: producto/pedido anulado, motivo, usuario que la ejecutó, fecha/hora.
3. El administrador puede consultar el detalle desde la notificación o desde el log de auditoría.

**Postcondiciones:** Pedido anulado de inmediato; administrador notificado; registro visible en auditoría.

### CU-ADMIN-10: Ver reportes de ventas y desempeño

**Actor(es):** Administrador del local

**Precondiciones:** Existe actividad de ventas registrada.

#### Flujo principal

1. El administrador accede a "Reportes".
2. Selecciona tipo (ventas por periodo, por producto, por mesero) y rango de fechas.
3. El sistema genera el reporte.
4. El administrador exporta en PDF/Excel.

**Postcondiciones:** Reporte generado/exportado.

### CU-ADMIN-11: Consultar flujo de caja del local

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

### CU-ADMIN-12: Supervisar cierre de caja diario

**Actor(es):** Administrador del local

**Precondiciones:** El cajero realizó apertura de caja durante el día.

#### Flujo principal

1. El administrador accede a "Cierre de caja" al final del día/turno.
2. El sistema muestra el resumen del cajero: monto de apertura, ventas cobradas, monto esperado en caja.
3. El administrador confirma el cierre o revisa la discrepancia (con comentario) si el monto real no coincide.

#### Flujos alternativos

- Hay discrepancia → el sistema la registra y queda visible en reportes/auditoría.

**Postcondiciones:** Caja cerrada para el día; discrepancias registradas si las hay.

### CU-ADMIN-13: Consultar log de auditoría del local

**Actor(es):** Administrador del local

**Precondiciones:** Ninguna.

#### Flujo principal

1. El administrador accede a "Auditoría".
2. Filtra por usuario, tipo de acción o rango de fechas (ej. anulaciones, descuentos, cambios de carta).
3. El sistema muestra el historial correspondiente.

**Postcondiciones:** Ninguna (consulta).

### CU-ADMIN-14: Gestionar promociones

**Actor(es):** Administrador del local

**Precondiciones:** El local está activo.

#### Flujo principal

1. El administrador accede a "Promociones" → "Nueva promoción".
2. Ingresa: nombre, descripción, tipo de descuento (porcentaje o monto fijo), valor, fecha de inicio y fin.
3. El sistema guarda la promoción; queda visible para Caja automáticamente solo dentro de su rango de fechas.
4. El administrador puede editar o desactivar una promoción antes de tiempo si lo requiere.

**Postcondiciones:** Promoción creada, visible para Caja según vigencia.

# 4. Mozo

### CU-MOZO-01: Ver estado de mesas

**Actor(es):** Mozo

**Precondiciones:** Existe un plano de mesas configurado por el administrador.

#### Flujo principal

1. El mozo accede al plano de mesas del local.
2. El sistema muestra cada mesa con su estado visual: libre, ocupada, reservada (informativo) o bloqueada (reserva próxima).
3. El mozo puede filtrar por piso/área si el local tiene más de uno.

**Postcondiciones:** Ninguna (consulta).

### CU-MOZO-02: Tomar pedido

**Actor(es):** Mozo

**Precondiciones:** La mesa está libre u ocupada por el mismo grupo; existen productos disponibles en la carta.

#### Flujo principal

1. El mozo selecciona una mesa.
2. Selecciona productos de la carta (filtrable por categoría) y cantidad por ítem.
3. Agrega notas si aplica (ej. "sin cebolla").
4. Confirma el pedido; el sistema lo envía a Cocina y cambia el estado de la mesa a "ocupada".

#### Flujos alternativos

- Un producto aparece marcado como "agotado" (por Cocina) → el sistema lo bloquea para selección.
- La mesa ya tenía un pedido activo → el nuevo pedido se agrega como ítems adicionales de la misma cuenta.

**Postcondiciones:** Pedido creado y enviado a Cocina; mesa marcada como ocupada.

### CU-MOZO-03: Modificar pedido antes de enviarlo a cocina

**Actor(es):** Mozo

**Precondiciones:** Existe un pedido en estado "borrador" (aún no confirmado/enviado).

#### Flujo principal

1. El mozo accede al pedido en curso de una mesa.
2. Agrega, quita o cambia cantidad de ítems.
3. Confirma los cambios y el sistema los envía a Cocina.

**Postcondiciones:** Pedido actualizado antes de llegar a Cocina.

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

**Precondiciones:** El local tiene las reservas habilitadas (CU-ADMIN-05); horario de atención configurado.

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

**Actor(es):** Mozo

**Precondiciones:** Existe un pedido enviado a Cocina, aún no cobrado.

#### Flujo principal

1. El mozo selecciona el pedido o ítem a anular.
2. Ingresa el motivo (obligatorio, texto libre).
3. El sistema anula el pedido/ítem de inmediato (sin requerir aprobación previa) y notifica automáticamente al administrador del local.
4. Si el ítem ya estaba en preparación, el sistema también notifica a Cocina para que detenga la preparación.

#### Flujos alternativos

- El ítem ya estaba listo/entregado → el sistema permite igualmente la anulación, pero lo marca como "merma" para efectos de inventario, no como error de pedido (no revierte el consumo de insumos).

**Postcondiciones:** Pedido/ítem anulado; administrador notificado; evento registrado en auditoría.

### CU-MOZO-07: Consultar disponibilidad de productos

**Actor(es):** Mozo

**Precondiciones:** Ninguna.

#### Flujo principal

1. El mozo consulta la carta digital durante el servicio.
2. El sistema muestra en tiempo real qué productos están disponibles, cuáles agotados y cuáles marcados como "no disponible" por afectación a un pedido en curso.

**Postcondiciones:** Ninguna (consulta).

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

**Precondiciones:** El producto vendido tiene una receta de insumos definida obligatoriamente por el administrador (CU-ADMIN-03).

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