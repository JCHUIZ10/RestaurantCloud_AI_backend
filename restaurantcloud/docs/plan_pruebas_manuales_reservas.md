# Plan de pruebas manuales — Políticas de reserva y Bandeja de reservas

Guía para comprobar en el navegador que la configuración del administrador (CU-ADMIN-10), la bandeja del mozo (CU-MOZO-05) y el cierre de emergencia (CU-ADMIN-09) funcionan juntos. Las reglas completas están en [politicas_de_reserva.md](./politicas_de_reserva.md).

**Cómo usarlo:** marca cada caso (☐ → ✅ / ❌) y anota lo que veas distinto en la columna de observaciones. Los casos están ordenados para ejecutarse de arriba abajo; algunos reutilizan reservas creadas antes.

---

## 0. Preparación

### 0.1 Entorno

| Elemento | Valor |
| :--- | :--- |
| Aplicación web | La URL de tu `npm run dev` (con `VITE_USE_REAL_API=true`, que ya es el valor del `.env`). |
| API | Contenedor `saas_laravel_api` en marcha (`docker ps`). |
| Base de desarrollo | `restaurantcloud_db` (usuario `saas_admin`). |

### 0.2 Cuentas de prueba

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| Administrador de sede | `admin@aurea.local` | `admin-local2026` |
| Mozo | `mozo@aurea.local` | `mozo2026` |
| Cajero | `cajero@aurea.local` | `cajero2026` |
| Propietario | `propietario@aurea.local` | `propietario2026` |

> Conviene usar **dos navegadores (o una ventana privada)** para tener al administrador y al mozo conectados a la vez.

### 0.3 Comandos de apoyo (opcionales)

Se ejecutan en una terminal. Cambia `<ID>` por el id de la reserva que corresponda.

```bash
# Estado actual de las políticas y reservas activas
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select * from politicas_reserva;"
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select id, cliente_nombre, fecha_hora, estado from reserva order by created_at desc limit 10;"

# Adelantar una reserva para probar bloqueo y cortesía (minutos negativos = ya pasó la hora)
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "update reserva set fecha_hora = now() + interval '20 minutes' where id='<ID>';"
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "update reserva set fecha_hora = now() - interval '10 minutes' where id='<ID>';"
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "update reserva set fecha_hora = now() - interval '25 minutes' where id='<ID>';"

# Auditoría de las acciones de reservas
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select accion, entidad_id, detalle, fecha from log_auditoria where accion like '%RESERVA%' or accion like '%CIERRE%' order by fecha desc limit 10;"

# Caja abierta (necesaria para sentar comensales)
docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select id, estado from caja order by created_at desc limit 3;"
```

### 0.4 Datos de partida esperados

- Horario de la sede: **Turno continuo 12:00–23:00** todos los días → pestaña **Almuerzo 12:00–17:00** y **Cena 17:00–23:00**.
- Políticas iniciales: duración 90, buffer 15, tolerancia 15, bloqueo previo 30, recordatorio 120, anticipación mínima 2, máxima 30, canal **encendido**.
- Un cierre ya cargado: **24/11/2026** — *Mantenimiento preventivo programado*.
- **Caja abierta** para poder sentar comensales. Si no lo está, ábrela con el cajero antes del bloque C.

☐ Verificado el punto 0.4 (anotar diferencias): ______________________

---

## A. Pantalla de políticas (administrador)

Ingresa como **administrador**.

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| A1 | Acceso desde el menú | Abre el menú lateral. | Existe **Políticas de reserva** (junto a Horario y feriados). Al abrirla se ve la pantalla real, no un aviso de "próximo entregable". | ✔ |
| A2 | Datos reales | Observa el encabezado y los valores. | Aparece el **nombre real de la sede** (no "Miraflores (Principal)"). Valores iniciales de 0.4 y interruptor **Activo**. Sin etiqueta "En vivo". | ✔ |
| A3 | Control de acceso | Cierra sesión, entra como **mozo** y escribe `/admin/politicas-reserva`. | El mozo **no ve** la pantalla (es redirigido o rechazado). | ✔ |
| A4 | Editar y guardar | Cambia la duración a **120** y pulsa *Guardar*. Recarga con F5. | Aviso "Políticas de reserva guardadas". Tras recargar, la duración sigue en 120. | ✔ |
| A5 | Rangos visibles y valor inválido | Observa cada campo; luego escribe una duración de **10**. | Cada campo muestra **"Permitido: 30 a 240 min"** (según el campo). Con 10, el campo se marca en rojo con *"Debe estar entre 30 y 240 minutos."*, aparece arriba el resumen *"Corrige 1 campo antes de guardar"* y **Guardar queda deshabilitado**. Al volver a un valor válido, todo se limpia. | ✔ |
| A6 | Cambios sin guardar (navegar) | Cambia un valor y, sin guardar, pulsa otra opción del menú. | Aparece **"¿Salir sin guardar?"**. *Volver* mantiene la pantalla; *Salir sin guardar* sale y descarta. | ☐ |
| A7 | Cambios sin guardar (cerrar pestaña) | Cambia un valor y recarga o cierra la pestaña. | El navegador pide confirmar la salida. | ✔ |
| A8 | Descartar | Cambia varios valores y pulsa *Descartar*. | Los valores vuelven a los guardados; aviso "Cambios descartados". | ✔ |
| A9 | Restaurar recomendados | Pulsa *Restaurar recomendados*. | Pide confirmación. Al aceptar, los parámetros pasan a **90 / 15 / 15 / 30 / 120 / 2 / 30** y quedan guardados. | ✔ |
| A10 | Restaurar no cambia el interruptor | Apaga el canal y guarda (ver B1); luego restaura recomendados. | Los parámetros se restauran y el interruptor **sigue apagado**. | ✔ |
| A11 | Textos veraces y campos sin uso | Revisa la tarjeta de anticipación y el "Margen de recordatorio". | **No existe "Anticipación mínima"**; solo "Anticipación máxima". El margen de recordatorio lleva la etiqueta **"Próximamente"** y aclara que aún no genera avisos. | ✔ |
| A12 | Simulador | Abre la pestaña *Simulador de Mesa* y mueve duración, buffer, **tolerancia**, bloqueo y la hora de la cita. | Los cuatro deslizadores cubren los rangos completos (duración 30–240, buffer 0–60, bloqueo 0–120, tolerancia 5–60) y los tiempos de la línea se recalculan. El texto de la tolerancia dice que **el mozo puede registrar la inasistencia**. *Aplicar* pasa los valores al borrador **sin guardarlos**. | ✔ |
| A12a | Resumen de errores desde el simulador | En la configuración deja tolerancia **3** y anticipación máxima **120**; abre el simulador. | El resumen rojo aparece **también en el simulador**, con ambos campos. La tolerancia se muestra **ajustada a 5** con el aviso *"Ajustado desde 3…"*. | ✔ |
| A12b | Corregir desde el simulador | En ese estado pulsa *Aplicar a Configuración*. | Vuelve a la configuración con la tolerancia ya corregida; el resumen queda solo con la **anticipación máxima**. Al pulsar su enlace, se enfoca ese campo. | ✔ |
| A12c | Campo vacío | Borra por completo un campo numérico y escribe otro valor. | Se puede borrar y reescribir sin que quede un 0 forzado; mientras está vacío se marca como error y Guardar está deshabilitado. | ✔ |
| A12d | Mensajes del servidor traducidos | Envía un valor inválido directo al API (por ejemplo con una herramienta de peticiones) o prueba cualquier otra pantalla con datos faltantes. | El mensaje es legible y nombra el campo y el rango (*"El campo duración de la reserva (minutos) debe estar entre 30 y 240."*); en ninguna pantalla aparece texto como `validation.between.numeric`. | ✔ |
| A12e | Anticipación mínima se conserva | Con la base de datos, cambia `anticipacion_minima_horas` a 5, guarda otro valor desde la pantalla y consulta la tabla. | La anticipación mínima **sigue en 5**: la pantalla ya no la envía ni la pisa. | ✔ |
| A13 | Edición simultánea | Abre la pantalla en **dos navegadores** como administrador. En el primero guarda un cambio. En el segundo cambia otro valor y guarda. | El segundo recibe el aviso **"Otro administrador modificó las políticas…"** y se recargan los valores vigentes. | ✔ |
| A14 | Propietario puede editar | Entra como **propietario**, abre `/admin/politicas-reserva`, cambia un valor y guarda. | Se guarda sin errores. | ✔ |

---

## B. Interruptor maestro

### B1–B2. Apagar el canal

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| B1 | Apagar sin reservas pendientes | Con **ninguna reserva futura activa**, apaga el interruptor y guarda. | No sale ningún modal. Queda **"Canal suspendido"** y una nota que explica que suspender no cancela reservas, con enlace a *Horario y feriados*. | ✔ |
| B2 | Apagar con reservas pendientes | Crea antes una reserva futura desde el mozo (caso C5). Luego, como administrador, apaga el interruptor. | Se abre **"Hay reservas pendientes"** con la lista (cliente, fecha, personas, mesas, teléfono y botón WhatsApp) y aclara que **siguen vigentes**. | ☐ |
| B2a | Mantener | En ese modal pulsa *Mantener reservas habilitadas*. | El modal se cierra y el interruptor **sigue encendido**. | ☐ |
| B2b | Suspender igualmente | Vuelve a apagar y pulsa *Suspender igualmente*. | Aviso "El canal se suspenderá al guardar". Al pulsar *Guardar*, queda suspendido. | ☐ |
| B2c | Volver a apagar un canal ya apagado | Con el canal apagado y guardado, enciéndelo y apágalo sin guardar. | **No** reaparece el modal (ya estaba apagado). | ☐ |

### B3–B6. Efecto en la bandeja del mozo

Con el canal **apagado**, entra como **mozo** en *Reservas* (`/mozo/reservas`).

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| B3 | Aviso y botón | Abre la bandeja. | Franja amarilla: *"El administrador suspendió la recepción de nuevas reservas…"*. El botón **Nueva Reserva está deshabilitado** (el cursor muestra el motivo). | ☐ |
| B4 | Reservas existentes siguen operando | Abre la ficha de la reserva pendiente. | Se puede **sentar, registrar inasistencia o cancelar** con normalidad. | ☐ |
| B5 | Cambio en vivo | Con la bandeja del mozo abierta (canal encendido) y *Nueva Reserva* operativo, el administrador apaga el canal y guarda. Espera hasta **1 minuto**. | El aviso aparece y el botón se deshabilita sin recargar la página. | ☐ |
| B5a | Formulario abierto al suspender | Abre *Nueva Reserva* en el mozo; el administrador suspende el canal; intenta confirmar la reserva. | Aparece el mensaje de **recepción suspendida**, el formulario se cierra y la pantalla pasa al estado suspendido. | ☐ |
| B6 | Reactivar | El administrador enciende el interruptor y guarda. | En el mozo, tras el refresco, el aviso desaparece y *Nueva Reserva* vuelve a funcionar. | ☐ |
| B7 | Auditoría | Ejecuta el comando de auditoría de 0.3. | Constan `DESACTIVACION_CANAL_RESERVAS` (con la cantidad de reservas pendientes) y `REACTIVACION_CANAL_RESERVAS`. | ☐ |

---

## C. Bandeja de reservas (mozo)

Ingresa como **mozo** y abre *Reservas*. Deja el canal **encendido**.

### C1. Vista inicial y navegación

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| C1 | Fecha y turno iniciales | Abre la bandeja. | La fecha dice **"Hoy, <fecha de hoy>"** y se selecciona el turno que corresponde a la hora actual (Almuerzo antes de las 17:00, Cena después). Se ve "Horario de <turno>: 12:00 a 17:00" (o 17:00 a 23:00). | ✔ |
| C2 | Sin indicadores falsos | Revisa la cabecera y el pie de la tabla. | No hay "En Línea" parpadeante, ni "Plan Starter (Simulado)", ni "Módulo exclusivo para Planes Pro…". | ✔ |
| C3 | Cambiar de día y turno | Usa las flechas de fecha, la fecha para abrir el calendario y los botones Almuerzo/Cena. | La lista, los KPIs y el horario mostrado cambian con la selección. Fuera de la jornada actual aparece **"Ir a la jornada actual"**. | ✔ |
| C4 | Día cerrado | Ve a **24/11/2026**. | En lugar de la tabla: **"El local no atiende esta fecha"** con el motivo *Mantenimiento preventivo programado*. Las pestañas de turno quedan deshabilitadas. | ✔ |

### C5–C9. Crear reservas

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| C5 | Crear una reserva | *Nueva Reserva* → mañana, hora **20:00**, 4 personas, elige una mesa, nombre "Familia Prueba", teléfono `987 654 321` → *Confirmar*. | Aviso de confirmación; el modal se cierra. Al ir a **mañana · Cena**, aparece la reserva como **CONFIRMADA** con la mesa elegida. | ✔ |
| C6 | Formulario limpio | Abre *Nueva Reserva* de nuevo. | Nombre, teléfono y notas **vacíos** (sin "Fam. Gómez"), 2 personas, sin textos de "760px" ni "Topología 10 mesas". | ✔ |
| C7 | Franjas según el horario | Mira las horas ofrecidas. | Se agrupan en **Almuerzo 12:00 a 17:00** y **Cena 17:00 a 23:00**, cada 30 min. La última de almuerzo es **15:30** y la de cena **21:30**. Si la fecha es hoy, no hay horas que ya pasaron. | ✔ |
| C8 | Validaciones | Intenta confirmar con nombre de 2 letras; con teléfono `812345678` o de 6 dígitos; sin mesa. | Cada caso muestra su mensaje y **no se crea** la reserva. | ✔ |
| C9 | Día cerrado en el formulario | En el formulario elige la fecha **24/11/2026**. | Aparece **"Local cerrado esta fecha: Mantenimiento preventivo programado"**, no hay horas y *Confirmar* está deshabilitado. | ✔ |
| C10 | Choque de horario | Con la reserva de C5 (mañana 20:00, misma mesa), abre *Nueva Reserva* para mañana y recorre las horas de cena eligiendo esa mesa. | Con la separación mínima de 105 min (90 + 15): **18:00 → mesa LIBRE**; **18:30, 19:00, 19:30, 20:00, 20:30, 21:00 y 21:30 → NO DISP.** ("Reservada a las 20:00"). No hay horas posteriores donde la mesa vuelva a quedar libre porque la última llegada de la cena es 21:30. | ✔ |
| C11 | Capacidad insuficiente | Pide **8 personas** con una hora donde no haya ninguna mesa libre de 8 lugares. | **No se preselecciona ninguna mesa** y aparece el aviso *"Ninguna mesa libre cubre a 8 personas. Elige varias mesas para agruparlas…"*. El resumen dice "Capacidad: 0 de 8 lugares". | ✔ |
| C11a | Agrupar hasta alcanzar | Toca una mesa de 4; luego otra de 4. | Con una mesa: "4 de 8 lugares", mensaje **"Faltan 4 lugares: agrega otra mesa para agrupar"** y *Confirmar* deshabilitado. Con ambas: "8 de 8 lugares" y *Confirmar* se habilita. | ✔ |
| C11b | Mesa que no permite unión | Con 8 personas, intenta agrupar una mesa marcada como fija (no unible) con otra. | La mesa no se agrega y aparece *"La Mesa X no permite unirse con otras mesas…"*. Una mesa fija que alcance por sí sola (por ejemplo, de 8 lugares) sí se puede elegir sola. | ✔ |
| C11c | Aviso del servidor | Intenta crear una reserva con mesas que no alcanzan directamente contra el API. | Responde 422 con *"Las mesas seleccionadas suman 4 lugares y la reserva es para 8 personas…"*. | ✔ |
| C11d | Teléfono según el estándar | Pega en el teléfono, uno por uno: `+51 987 654 321`, `+51987654321` y `51987654321`; luego escribe `812345678`. | Cada número pegado queda como `987 654 321` **completo, sin perder dígitos**. El prefijo `🇵🇪 +51` es fijo y no se puede borrar. Con `812…` el campo se marca en rojo con *"Un móvil de Perú empieza con el dígito 9."*; con 9 dígitos válidos aparece **Válido**. Mientras escribes, muestra el avance `n/9`. | ☐ |

### C12–C24. Atender la reserva (ficha y acciones)

Para estos casos crea reservas **de hoy** (turno vigente) o adelanta las existentes con los comandos de 0.3.

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| C12 | Estado "Bloqueada" | Deja una reserva de hoy a ≤30 min (adelántala con SQL a +20 min). Recarga. | Estado **BLOQUEADA**. En el plano de mesas (*Salón*) esa mesa se ve **bloqueada**; al tocarla se abre la ficha de la reserva. | ✔ |
| C13 | Reloj de cortesía | Abre la ficha de una reserva a +20 min, luego de otra a −10 min y de otra a −25 min. | "Llega en 20 min" → "En ventana de cortesía (quedan 5 min)" → **"Tolerancia expirada (25 min de retraso)"** con la acción de inasistencia resaltada. La ventana dice "15 minutos (hasta HH:MM)" con la hora real. | ✔ |
| C14 | Ficha sin textos fijos | Revisa la ficha. | Sin "Turno Almuerzo / 14:15 / faltan 10 min" fijos, sin "560px" ni "(CU-MOZO-02)". Los campos de motivo están **vacíos**. | ✔ |
| C15 | Sentar comensales | Con caja abierta y mesa libre, pulsa **Sentar** en una reserva de hoy. | Aviso de éxito y salto a la **comanda** de esa mesa. La reserva queda **ATENDIDA** y la mesa figura ocupada en el plano. | ✔  |
| C16 | Sentar con la mesa ocupada | Abre manualmente la mesa de otra reserva (sentando clientes sin reserva) y luego intenta **Sentar** su reserva. | Aviso rojo: *"La Mesa X está ocupada con otra comanda. Usa «Cambiar mesa» para asignar la reserva a una mesa libre."*. La reserva **sigue CONFIRMADA** y la ficha no se cierra. | ✔ |
| C16a | **Cambiar mesa** (escenario principal) | Continúa de C16: en la ficha pulsa **Cambiar mesa**. | Se abre el modal con cliente, hora, personas y mesa actual. La mesa ocupada **no aparece como candidata** (atenuada, "Ocupada con comanda activa" si la hora es inminente) y las libres sí. |  ✔ |
| C16b | Confirmar el cambio | Elige una mesa libre que alcance y pulsa *Cambiar a Mesa X*. | Aviso *"Mesa cambiada…"*; la ficha y la bandeja muestran la mesa nueva. Ahora **Sentar** funciona y abre la comanda en la mesa nueva. | ✔ |
| C16c | Varias mesas | Cambia una reserva de 8 personas a dos mesas de 4 que permitan unión. | Con una mesa: *"Faltan 4 lugares"* y el botón deshabilitado; con ambas se habilita y se guarda. La etiqueta pasa a `Mesa [ A ; B ]`. | ✔ |
| C16d | Conservar una mesa | En una reserva de 2 mesas, deja una de las actuales y cambia la otra. | La mesa actual aparece **LIBRE y elegida** al abrir el modal (no cuenta como choque consigo misma). Si no cambias nada, *Cambiar* está deshabilitado. | ✔ |
| C16e | Choque con otra reserva | Intenta elegir una mesa con otra reserva en esa franja. | Aparece atenuada con *"Reservada a las HH:MM"* y no se puede elegir. Contra el API directo: 422 `ERR_MESA_RESERVADA`. | ☐ |
| C16f | Carrera entre mozos | Con el modal abierto, otro mozo ocupa la mesa elegida; confirma. | Aviso rojo con el motivo, el modal **sigue abierto** y la disponibilidad se recarga. | ☐ |
| C16g | Desde el plano | En *Salón*, toca una mesa bloqueada, abre la ficha y cambia la mesa. | La mesa vieja deja de verse bloqueada y la nueva pasa a bloqueada (si la reserva está en su ventana). | ☐ |
| C16h | Reserva cerrada | Abre la ficha de una reserva atendida, cancelada o con inasistencia. | **No** se puede cambiar mesa (botón deshabilitado). | ☐ |
| C17 | Sentar con la caja cerrada | Cierra la caja (cajero) e intenta sentar. | Aviso de que no hay caja abierta; la reserva no cambia. | ☐ |
| C18 | Reserva de otro día | Abre una reserva de mañana. | **No** aparece el botón *Sentar* en la tabla y, en la ficha, el botón está deshabilitado con la explicación de que se sienta el día de la cita. | ☐ |
| C19 | Doble clic | Pulsa **Sentar** dos veces seguidas. | Se procesa una sola vez (el botón dice "Sentando…" y queda bloqueado). | ☐ |
| C20 | Inasistencia | En una reserva activa pulsa *Cliente no se presentó*, deja el motivo vacío y confirma. | Pasa a **INASISTENCIA**; la mesa vuelve a verde en el plano. Probar otra vez escribiendo un motivo. | ☐ |
| C21 | Cancelar | *Cancelar reserva*: escribe "no" (2 letras) y revisa el botón; luego un motivo válido. | Con menos de 3 caracteres el botón está **deshabilitado**. Con un motivo válido queda **CANCELADA** y la mesa se libera. | ☐ |
| C22 | Estados finales | Abre la ficha de una reserva ya atendida, cancelada o con inasistencia. | **Sentar, inasistencia y cancelar están deshabilitados.** | ☐ |
| C23 | Filtros y KPIs | Usa las píldoras *Todas / En espera / Atendidas / Inasistencias-Canceladas*. | Los números de las píldoras y de las 4 tarjetas coinciden con las filas. "Reservas del turno" cuenta solo el turno visible. | ☐ |
| C24 | WhatsApp | Pulsa el botón de WhatsApp de una reserva de hoy y de una de mañana. | Se abre `wa.me` con el mensaje correcto: *"…su reserva **de hoy**…"* / *"…**de mañana**…"*, sin la marca "RestaurantCloud AI". | ☐ |

### C25–C27. Robustez

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| C25 | Error al crear no pierde lo escrito | Provoca un error (por ejemplo, crea la reserva y, antes de confirmar, otro usuario reserva esa mesa). | El aviso rojo muestra el motivo real y el formulario **sigue abierto** con los datos escritos. | ☐ |
| C26 | API caída | `docker stop saas_laravel_api`, espera ≤1 minuto o cambia de día; luego `docker start saas_laravel_api`. | Aparece un mensaje de error en la bandeja (no una lista vieja sin aviso). Al volver el API, se recupera en el siguiente refresco. | ☐ |
| C27 | Refresco automático | Deja la bandeja abierta 1–2 minutos con una reserva próxima. | Los minutos restantes y el estado (Confirmada → Bloqueada) se actualizan solos. | ☐ |

---

## D. Módulo según el plan

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| D1 | Desactivar el módulo | `docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "update plan set incluye_reservas=false where nombre='Pro';"` | — | ☐ |
| D2 | Administrador | Entra a *Políticas de reserva*. | Pantalla **"El módulo de reservas no está habilitado"** con el mensaje del servidor, que **nombra los planes que lo incluyen** (sin botones falsos de notificación). | ☐ |
| D3 | Mozo | Entra a *Reservas*. | Pantalla **"Reservas no disponibles"** con el mensaje y un enlace para volver al salón. | ☐ |
| D4 | Volver a habilitarlo | `update plan set incluye_reservas=true where nombre='Pro';` y recarga ambas pantallas. | Todo vuelve a funcionar. **No olvides este paso.** | ☐ |

---

## E. Cierre de emergencia y cambios de horario (administrador)

Pantalla *Horario y feriados*. Para estos casos necesitas reservas futuras activas (por ejemplo, las de C5 y C10).

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| E1 | Cierre sin reservas | En *Fechas especiales* → *Nuevo cierre* para una fecha sin reservas. | Se registra directamente: "Fecha registrada". | ☐ |
| E2 | Cierre con reservas | *Nuevo cierre* para **mañana** (donde hay reservas). | Se abre una lista con las reservas, su teléfono, mesas y un botón **Escribir** (WhatsApp con el mensaje ya redactado). **Ninguna opción viene marcada.** | ☐ |
| E3 | Decisión obligatoria | Intenta confirmar sin decidir todas. | El botón **no se habilita** hasta que cada reserva tenga una opción: WhatsApp, Llamada, Presencial o *No se pudo avisar*. El contador muestra "N de M con decisión · X sin aviso". | ☐ |
| E4 | Confirmar | Elige una opción en cada una (deja una como *No se pudo avisar*) y confirma. | Aviso "Fecha registrada; N reservas canceladas". En la lista de fechas aparece el contador de canceladas. En el mozo, esas reservas ya no están activas. | ☐ |
| E5 | Auditoría | Comando de auditoría de 0.3. | Una entrada `CANCELACION_POR_CIERRE` por reserva, con el medio de aviso y si el cliente fue avisado. | ☐ |
| E6 | Cambio de horario semanal | En *Horario semanal*, deja un día solo con Almuerzo 12:00–16:00 y guarda (con una reserva de cena ese día). | Antes de guardar se muestra la lista de reservas que **ya no caben**. Al confirmar, el horario se guarda y esas reservas se cancelan con su aviso. | ☐ |
| E7 | Feriados nacionales | Pulsa *Cargar feriados* teniendo una reserva en alguno de esos días. | Los feriados sin reservas se cargan y el aviso indica cuáles **no se cerraron por tener reservas** (con fecha y cantidad). | ☐ |

---

## F. Cierre de la prueba

1. Restaura el estado: canal **encendido**, módulo del plan **habilitado** (D4), caja como la necesites.
2. Anota abajo cualquier diferencia entre lo esperado y lo observado, con captura si es posible.

| Caso | Qué pasó | Gravedad (alta / media / baja) |
| :-: | :--- | :-: |
|  |  |  |
|  |  |  |
|  |  |  |
