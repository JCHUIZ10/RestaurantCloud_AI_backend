# Políticas de Reserva del Salón

Este documento explica cómo funcionan las reservas de salón en RestaurantCloud: qué parámetros las gobiernan, cómo se combinan con el horario de atención y los feriados, qué se valida al registrar una reserva y cómo evoluciona su estado hasta que el comensal se sienta o la mesa se libera.

**Alcance:** reservas registradas por el mozo desde la Bandeja de Reservas (CU-MOZO-05), su efecto en el plano de mesas (CU-MOZO-01), la configuración que hace el administrador o el propietario (CU-ADMIN-10, [§9](#9-administración-de-las-políticas)) y la resolución de cierres y cambios de horario con reservas ya registradas (CU-ADMIN-09, [§10](#10-cierres-inesperados-y-cambios-de-horario)).

---

## 1. Resumen en 30 segundos

- Cada local tiene **una sola fila de políticas** (`politicas_reserva`). Se crea con valores por defecto al dar de alta el local.
- Una reserva **dura 90 min** por defecto, y entre dos reservas de la misma mesa se dejan **15 min de limpieza**.
- Solo se puede reservar **dentro del horario de atención** del día. Un feriado o cierre lo impide, y un horario especial reemplaza al horario semanal.
- La **última hora de llegada** de un turno es su hora de cierre menos la duración de la reserva.
- **30 min antes** de la cita, la mesa pasa a **bloqueada** en el plano para que nadie la ocupe.
- El cliente tiene **15 min de cortesía**. Pasado ese tiempo, el mozo decide si registra la inasistencia (no es automática).
- Al **sentar** a los comensales se abre la comanda en la mesa. Para eso, la caja debe estar abierta y la mesa libre.
- El módulo solo existe si el **plan de la empresa lo incluye** (`plan.incluye_reservas`). Si no, el administrador y el mozo reciben un aviso (403) en lugar de la pantalla.
- El administrador puede **suspender la recepción de reservas nuevas** con un interruptor: el mozo deja de poder registrarlas, pero las ya registradas siguen vigentes.
- Si el local no podrá atender un día (o cambia su horario) y hay reservas, se **cancelan en bloque** decidiendo, reserva por reserva, si el cliente fue avisado.

---

## 2. Parámetros de la política (`politicas_reserva`)

| Parámetro | Qué significa | Por defecto | Rango permitido | ¿Se aplica hoy? |
| :--- | :--- | :---: | :---: | :--- |
| `duracion_reserva_min` | Tiempo que la mesa queda comprometida por cada reserva. | 90 | 30 – 240 | ✅ Choques, disponibilidad, horas de llegada y última llegada del turno. |
| `buffer_reserva_min` | Margen de limpieza y rotación entre reservas de la misma mesa. | 15 | 0 – 60 | ✅ Detección de choques y disponibilidad de mesas. |
| `minutos_bloqueo_previo` | Minutos antes de la cita en que la mesa se bloquea en el plano. | 30 | 0 – 120 | ✅ Estado `bloqueada` y plano de mesas. |
| `tolerancia_no_show_min` | Minutos de cortesía para que llegue el cliente después de su hora. | 15 | 5 – 60 | ✅ Reloj de cortesía de la ficha y plano de mesas. |
| `anticipacion_maxima_dias` | Con cuántos días de anticipación se puede reservar como máximo. | 30 | 1 – 90 | ✅ Al registrar la reserva. |
| `acepta_reservas` | **Interruptor maestro**: recepción de reservas nuevas. | `true` | — | ✅ Apagado, el mozo no puede registrar reservas (409). Las existentes se siguen atendiendo ([§9.2](#92-interruptor-maestro)). |
| `anticipacion_minima_horas` | Anticipación mínima exigida para reservar. | 2 | 0 – 48 | ⛔ **No aplica al mozo** (pensado para reservas en línea, que aún no existen). |
| `margen_recordatorio_min` | Minutos antes de la cita para enviar un recordatorio. | 120 | ≥ 0 | ⛔ Se guarda, pero aún no se usa (no hay recordatorios automáticos). |

> **¿Por qué la anticipación mínima no aplica al mozo?** El mozo atiende llamadas y clientes en la puerta, que pueden pedir una mesa para dentro de unos minutos. Al mozo solo se le prohíbe reservar en el pasado (con 5 min de margen) y más allá de la anticipación máxima.

---

## 3. Horario de atención: la "jornada" de cada fecha

Una reserva solo es válida si cae dentro del horario real del local para esa fecha. Ese horario (la **jornada**) se arma combinando dos configuraciones del administrador (CU-ADMIN-09).

### 3.1 Orden de prioridad

| Prioridad | Fuente | Efecto |
| :---: | :--- | :--- |
| 1 | **Excepción de cierre** (`horario_excepcion` con `cerrado = true`): feriados, mantenimiento, etc. | El local **no atiende** ese día: sin turnos, sin reservas y la bandeja muestra el motivo. |
| 2 | **Horario especial** (`horario_excepcion` con `cerrado = false` y horas definidas). | Reemplaza por completo al horario semanal de ese día. |
| 3 | **Horario semanal** (`horario_atencion` del día de la semana). | Turnos habituales del local. |
| — | Día sin turnos en el horario semanal. | El local **no atiende**. No se inventan turnos de respaldo. |

### 3.2 Pestañas Almuerzo y Cena

La bandeja siempre muestra dos pestañas, **Almuerzo** y **Cena**. Los turnos del local se reparten así:

1. Si el nombre del turno contiene **"almuerzo"**, va a Almuerzo.
2. Si contiene **"cena"** o **"noche"**, va a Cena.
3. Cualquier otro nombre (ej. "Turno continuo", "Horario especial") se **divide a las 17:00**: lo anterior va a Almuerzo y lo posterior a Cena.
4. Si varios turnos caen en la misma pestaña, se unen (del inicio más temprano al cierre más tardío).
5. Si una pestaña se queda sin turno, aparece **deshabilitada** ("Sin atención").

| Horario configurado | Almuerzo | Cena |
| :--- | :--- | :--- |
| `Almuerzo 12:00–16:00` + `Cena 19:00–23:30` | 12:00 – 16:00 | 19:00 – 23:30 |
| `Turno continuo 12:00–23:00` | 12:00 – 17:00 | 17:00 – 23:00 |
| `Almuerzo Familiar 12:00–18:00` (solo) | 12:00 – 18:00 | Deshabilitada |
| Excepción: horario especial `18:00–22:00` | Deshabilitada | 18:00 – 22:00 |
| Excepción: cierre por feriado | Deshabilitada | Deshabilitada (bandeja muestra "Local cerrado: …") |

### 3.3 Turnos que cruzan la medianoche

Un turno cuya hora de cierre es menor que la de inicio (ej. `Cena 19:00–00:30`) **termina al día siguiente**:

- Una reserva a las **00:15 del sábado** pertenece a la **cena del viernes** y aparece en la bandeja del viernes.
- Pasada la medianoche, la **jornada en curso** sigue siendo la del viernes mientras dure ese turno. El botón para volver a la jornada actual, la fecha inicial de la bandeja y el permiso para sentar usan esa jornada.

### 3.4 Horas de llegada que se ofrecen

- Se generan **cada 30 minutos** desde el inicio del turno hasta la **última hora de llegada**:

  > **Última hora de llegada = cierre del turno − `duracion_reserva_min`**
  >
  > Ejemplo: turno 12:00–16:00 con reservas de 90 min → la última llegada es **14:30** (14:30 + 90 min = 16:00).

- Si la fecha es hoy, se ocultan las horas que ya pasaron.

---

## 4. Registrar una reserva

### 4.1 Datos requeridos

| Dato | Regla |
| :--- | :--- |
| Nombre del titular | 3 a 100 caracteres. |
| Teléfono móvil | 9 dígitos que empiezan con 9. Se guarda como `+51 987 654 321` (ver [estandar_telefono_whatsapp.md](./estandar_telefono_whatsapp.md)). |
| Comensales | 1 a 50 personas. |
| Fecha y hora | Hora local del restaurante (America/Lima), elegida entre las horas de llegada ofrecidas. |
| Mesa(s) | Al menos una mesa del local. Si una sola no alcanza, se pueden agrupar varias. |
| Notas | Opcional, hasta 500 caracteres. |

### 4.2 Validaciones, en el orden en que se aplican

0. **Módulo y canal**: el plan debe incluir reservas (403 si no) y el interruptor maestro debe estar encendido (409 `ERR_RESERVAS_DESHABILITADAS` si no).
1. **Hora no pasada**: se rechaza una hora anterior a "ahora − 5 min".
2. **Anticipación máxima**: la fecha no puede pasar de hoy + `anticipacion_maxima_dias`.
3. **Horario de atención** (según la [§3](#3-horario-de-atención-la-jornada-de-cada-fecha)), con estos mensajes de error:
   - día cerrado por excepción → *"El local estará cerrado el 20/11/2026: Mantenimiento preventivo programado."*;
   - día sin atención → *"El local no atiende el …"*;
   - hora fuera de los turnos → *"La hora … está fuera del horario de atención …"*;
   - llegada demasiado tarde → *"La última hora de llegada del turno Almuerzo es 14:30 …"*.
4. **Mesas válidas**: todas deben pertenecer al local.
5. **Choque de horario** con otra reserva activa en las mismas mesas (ver [§5](#5-disponibilidad-de-mesas-y-choques-de-horario)).

Las mesas se **bloquean durante el registro**, así que dos mozos no pueden reservar la misma mesa al mismo tiempo. Si la fecha tiene un horario especial, la reserva queda vinculada a esa excepción (`reserva.excepcion_id`).

### 4.3 Estado inicial

- **`bloqueada`**: si la cita es dentro de los próximos `minutos_bloqueo_previo` minutos.
- **`confirmada`**: en cualquier otro caso.

---

## 5. Disponibilidad de mesas y choques de horario

### 5.1 Regla de choque

Dos reservas activas (`confirmada` o `bloqueada`) de la **misma mesa** deben empezar con una separación mínima de:

> **`duracion_reserva_min` + `buffer_reserva_min`** → con los valores por defecto, **105 minutos**.

| Reserva existente | Nueva solicitud | Resultado |
| :--- | :--- | :--- |
| 13:00 | 14:30 | ❌ Choque (solo 90 min de separación). |
| 13:00 | 14:45 | ✅ Permitida (105 min). |
| 13:00 | 11:30 | ❌ Choque (90 min). |
| 13:00 | 11:15 | ✅ Permitida (105 min). |

### 5.2 Cuándo una mesa aparece como no disponible en el mini-mapa

| Motivo mostrado | Condición |
| :--- | :--- |
| *Reservada a las HH:MM* | Choca con otra reserva activa (regla anterior). |
| *Ocupada con comanda activa* | Tiene una comanda abierta y la reserva es para hoy dentro de ±60 min. |
| *Capacidad insuficiente* | Su capacidad es menor al número de comensales **y** la mesa no permite unirse a otras. |

Una mesa más chica que el grupo que **sí permite unión** aparece disponible para agruparla con otras. La interfaz advierte si la capacidad sumada es menor que el número de comensales.

---

## 6. Ciclo de vida de una reserva

### 6.1 Estados (`reserva.estado`)

| Estado | Significado en pocas palabras |
| :--- | :--- |
| `confirmada` | Reserva registrada; la mesa sigue disponible para otros clientes hasta el bloqueo previo. |
| `bloqueada` | Faltan `minutos_bloqueo_previo` o menos para la cita; la mesa se reserva en el plano. |
| `atendida` | Los comensales se sentaron y se abrió su comanda. |
| `no_show` | El cliente no se presentó; la mesa se liberó. |
| `cancelada` | La reserva se anuló antes de la cita con un motivo registrado. |

```
                ┌──────────── cancelar ────────────┐
                │                                   ▼
 confirmada ──(30 min antes)──▶ bloqueada ──sentar──▶ atendida
     │                            │
     │                            ├── no-show ──▶ no_show
     └──────── sentar / no-show / cancelar ─────▶ (mismos destinos)
```

`atendida`, `no_show` y `cancelada` son **estados finales**: no admiten otra acción.

> El paso de `confirmada` a `bloqueada` se **calcula al consultar** (en la bandeja y en el plano) a partir de los minutos que faltan. No requiere ningún proceso programado.

### 6.2 Reloj de cortesía

| Situación | Cómo se muestra en la ficha |
| :--- | :--- |
| Falta tiempo para la cita | "Llega en 45 min" |
| Pasó la hora, dentro de la tolerancia | "En ventana de cortesía (quedan N min)" |
| Pasó la tolerancia y sigue activa | "Tolerancia expirada (N min de retraso)" (se resalta la acción de inasistencia) |

La inasistencia **nunca se registra sola**: el mozo decide si espera más o libera la mesa.

### 6.3 Acciones del mozo

| Acción | Requisitos | Efecto |
| :--- | :--- | :--- |
| **Sentar comensales** | Reserva `confirmada`/`bloqueada`; reserva de la **jornada en curso**; **caja abierta**; ninguna mesa asignada tiene una comanda activa (propia o de la mesa a la que esté unida). | Une las mesas (la titular es la de menor número), abre la comanda con los comensales de la reserva y la marca `atendida`. Si una mesa está ocupada: *"La Mesa X está ocupada con otra comanda. Reasigne la reserva…"*. |
| **Registrar inasistencia** | Reserva `confirmada`/`bloqueada`. Motivo opcional (máx. 500 caracteres; por defecto "Inasistencia del cliente"). | Estado `no_show`; el motivo se agrega a las notas; la mesa queda libre. |
| **Cancelar** | Reserva `confirmada`/`bloqueada`. Motivo **obligatorio** (3 a 500 caracteres). | Estado `cancelada`; el motivo se agrega a las notas; la mesa queda libre. |
| **Reasignar mesa** | Que la nueva mesa pertenezca al local. | Reemplaza las mesas asignadas por la nueva (ver limitaciones). |
| **WhatsApp** | — | Abre WhatsApp con un mensaje de confirmación que indica el día ("de hoy", "de mañana" o la fecha), la hora, los comensales y la mesa. |

Cada acción queda registrada en `log_auditoria`: `CREACION_RESERVA`, `RECEPCION_RESERVA_SALON`, `NO_SHOW_RESERVA`, `CANCELACION_RESERVA` y `REASIGNACION_MESA_RESERVA`.

---

## 7. Efecto en el plano de mesas

Una mesa con una reserva activa se muestra **bloqueada** en el plano durante esta ventana:

> desde **`minutos_bloqueo_previo` antes** de la cita hasta **`tolerancia_no_show_min` después** de la cita.

Con los valores por defecto, una reserva de las 20:00 bloquea la mesa de **19:30 a 20:15**. Al tocar la mesa bloqueada se abre la ficha de la reserva. Si ya no está vigente, el plano se actualiza solo.

---

## 8. Ejemplo completo (valores por defecto, horario `Turno continuo 12:00–23:00`)

1. **Pestañas:** Almuerzo 12:00–17:00 y Cena 17:00–23:00.
2. **Horas de llegada:** almuerzo de 12:00 a 15:30 (17:00 − 90 min); cena de 17:00 a 21:30 (23:00 − 90 min).
3. **Reserva:** a las 15:00, el mozo registra a la Fam. Ríos para las **20:00** en la Mesa 08 → queda `confirmada`.
4. **Choques en la Mesa 08:** se rechaza cualquier otra reserva que empiece **después de las 18:15 y antes de las 21:45**. Antes sí cabe una a las 18:15 o más temprano. Después, la siguiente posible sería a las 21:45, pero la cena solo admite llegadas hasta las 21:30, así que esa noche no cabe otra reserva posterior en esa mesa.
5. **Bloqueo:** a las **19:30** la reserva pasa a `bloqueada` y la Mesa 08 se ve bloqueada en el plano.
6. **Llegada a tiempo:** si la familia llega a las 20:05, el mozo pulsa **Sentar**: se abre la comanda y la reserva pasa a `atendida`.
7. **Si no llega:** a las 20:15 vence la cortesía; el mozo registra la inasistencia y la mesa se libera.

---

## 9. Administración de las políticas

Pantalla **Políticas de reserva** (CU-ADMIN-10), en el menú del administrador. La pueden usar el **administrador de sede y el propietario**; el mozo no accede.

### 9.1 Edición y guardado

- Los valores se editan en un borrador y se guardan con un solo botón. Si hay cambios sin guardar, el sistema avisa antes de salir de la pantalla.
- **Rangos** (el servidor los valida): duración 30–240, buffer 0–60, tolerancia 5–60, bloqueo previo 0–120, anticipación mínima 0–48, anticipación máxima 1–90, margen de recordatorio ≥ 0.
- **Edición simultánea**: cada versión lleva su fecha de modificación. Si otro administrador guardó antes, el guardado se rechaza (409 `ERR_POLITICAS_MODIFICADAS`), se avisa y se recargan los valores vigentes.
- **Restaurar valores recomendados**: reemplaza solo los **parámetros** (90 / 15 / 15 / 30 / 120 / 2 / 30) y los guarda de inmediato. **No cambia el interruptor.**
- Los cambios llegan al mozo en el siguiente refresco de su bandeja (cada minuto) o al reabrirla.

### 9.2 Interruptor maestro

`acepta_reservas` suspende o reanuda la **recepción de reservas nuevas** en la sede.

| Estado | Efecto |
| :--- | :--- |
| **Encendido** | El mozo registra reservas con normalidad. |
| **Apagado** | "Nueva Reserva" queda deshabilitado en la bandeja y el servidor rechaza crear reservas (409). **Las reservas ya registradas siguen vigentes**: se pueden sentar, marcar como inasistencia o cancelar. |

Si al apagarlo hay **reservas pendientes**, el sistema las lista (con teléfono y WhatsApp), explica que seguirán vigentes y pide confirmar: **"Suspender igualmente"** o **"Mantener reservas habilitadas"**. La confirmación se envía al guardar; si aparecen reservas nuevas entre la consulta y el guardado, se vuelve a pedir con la lista actualizada. El apagado y la reactivación quedan en `log_auditoria` (`DESACTIVACION_CANAL_RESERVAS`, `REACTIVACION_CANAL_RESERVAS`).

> Suspender el canal **no cancela reservas**. Si el local no podrá atender un día, hay que registrar el cierre ([§10](#10-cierres-inesperados-y-cambios-de-horario)).

### 9.3 Módulo según el plan

El módulo de reservas se habilita únicamente por el campo **`plan.incluye_reservas`** del plan de la empresa; nunca por el nombre o el identificador del plan.

- Si es `false`, los endpoints de políticas del administrador y **todos** los de reservas del mozo responden **403 `ERR_MODULO_RESERVAS_NO_CONTRATADO`**, con un mensaje que nombra los planes vigentes que sí lo incluyen.
- El administrador ve una pantalla de "módulo no habilitado" y el mozo, un aviso en lugar de la bandeja (el refresco automático se detiene).
- Cambiar de plan corresponde al propietario, en su sección de suscripción.

---

## 10. Cierres inesperados y cambios de horario

Cuando el local no podrá atender (corte de luz, emergencia, feriado, horario especial) o el administrador cambia su horario semanal, las reservas que dejan de caber no se pierden en silencio. El administrador las resuelve en **Horario y feriados**, sin entrar a la terminal del mozo.

### 10.1 Flujo

1. **Consulta previa.** Antes de guardar, el sistema simula el cambio y lista las reservas activas afectadas. No guarda nada.
2. **Sin reservas afectadas**: se guarda directamente.
3. **Con reservas afectadas**: se abre una lista con teléfono, mesas y un botón de WhatsApp con el mensaje ya redactado (fecha, hora, motivo). Para cada reserva hay que **elegir una decisión**, sin ninguna opción premarcada:
   - **Avisada** por WhatsApp, llamada o presencial; o
   - **No se pudo avisar** (se registra como cliente sin aviso).
4. **Confirmar** solo se habilita cuando todas tienen decisión. El servidor lo exige también: sin la decisión de cada reserva rechaza todo (422 `ERR_AVISOS_INCOMPLETOS`) y **no se guarda nada**.
5. **Todo en una transacción**: el cierre u horario, la cancelación de las reservas, el registro de aviso (medio, quién y cuándo) y la auditoría. Si algo falla, no queda nada a medias.

El servidor recalcula las reservas afectadas al confirmar; si aparecieron nuevas desde la consulta previa responde 409 `ERR_RESERVAS_AFECTADAS` y la pantalla muestra la lista actualizada para decidir de nuevo.

### 10.2 Qué reservas se consideran afectadas

| Cambio | Reservas afectadas |
| :--- | :--- |
| **Cierre del día** (feriado, emergencia) | Todas las activas (`confirmada`/`bloqueada`) de esa jornada, incluidas las de madrugada de un turno que cruza la medianoche. |
| **Horario especial** | Las que no llegan dentro de la ventana o terminarían después de su cierre (última llegada = cierre − duración). |
| **Cambio del horario semanal o plantilla** | Las **reservas futuras** que cabían con el horario anterior y ya no caben con el nuevo. Las que ya estaban fuera de horario antes no cuentan, para no bloquear la edición por algo ajeno. |

Las reservas `atendida`, `cancelada` y `no_show` nunca se tocan.

### 10.3 Resultado y trazabilidad

- Las reservas quedan `cancelada`, con motivo **"Cierre: …"** (o "Cambio de horario: …"), vinculadas a la excepción cuando existe, y con la marca de si el cliente fue avisado.
- `log_auditoria` registra `CANCELACION_POR_CIERRE` o `CANCELACION_POR_CAMBIO_HORARIO` por cada reserva.
- La lista de fechas especiales muestra cuántas reservas canceló cada cierre.
- **Feriados nacionales**: "Cargar feriados" no cierra los que tienen reservas activas; los informa (fecha y cantidad) para registrarlos aparte, avisando a los clientes.

---

## 11. Limitaciones conocidas y pendientes

| Tema | Situación actual |
| :--- | :--- |
| `anticipacion_minima_horas` y `margen_recordatorio_min` | Se guardan y se muestran como "próximamente", pero no tienen efecto: dependen de reservas en línea y recordatorios, que aún no existen. |
| Cambio de `duracion_reserva_min` o `buffer_reserva_min` | No recalcula los choques de reservas ya registradas ni avisa si alguna deja de caber antes del cierre del turno. |
| Capacidad total del grupo | El servidor no exige que la suma de capacidades cubra a los comensales; solo la interfaz lo advierte. |
| Reasignar mesa | No valida choques con otras reservas ni el estado de la reserva. |
| Inasistencia | Siempre manual; no hay cierre automático al vencer la tolerancia. |
| Reservas creadas durante la confirmación de un cierre | Una reserva registrada por otro mozo en el instante exacto entre la consulta y la confirmación del cierre no entra en la lista; el servidor cubre las ya existentes. |
| Reservas canceladas por un cierre | No se muestran en la bandeja del mozo de ese día (se ve "El local no atiende"); constan en la auditoría y en el contador de la lista de cierres. |

---

## 12. Referencias técnicas

| Pieza | Ubicación |
| :--- | :--- |
| Políticas (lectura, guardado, interruptor, pendientes, plan) | `apps/api/app/Domains/Reservas/Services/PoliticasReservaService.php` |
| Jornada operativa (horario, excepciones, medianoche, franjas, validación) | `apps/api/app/Domains/Horario/Services/JornadaOperativaService.php` |
| Cierres, horario semanal y cancelación con avisos | `apps/api/app/Domains/Horario/Services/HorarioService.php` |
| Módulo habilitado según el plan | `apps/api/app/Http/Middleware/EnsureModuloReservas.php` (alias `modulo.reservas`) |
| Endpoints de administrador | `Admin/PoliticaReservaController.php`, `Admin/HorarioController.php` |
| Endpoints del mozo (`/api/v1/mozo/reservas/*`) | `apps/api/app/Http/Controllers/Api/MozoController.php` |
| Esquema (`politicas_reserva`, `reserva`, `reserva_mesa`, `horario_atencion`, `horario_excepcion`) | `apps/api/database/sql/02_schema_ddl.sql` |
| Valores por defecto al crear un local | `apps/api/app/Domains/Tenant/Services/LocalProvisioningService.php` |
| Pantalla de políticas (web) | `apps/web/src/modules/admin/pages/AdminPoliticasReservaPage.tsx` |
| Horario, feriados y cierres (web) | `apps/web/src/modules/admin/pages/AdminHorarioPage.tsx` y `components/horario/` |
| Bandeja de Reservas (web) | `apps/web/src/modules/mozo/pages/MozoReservasPage.tsx` y `components/reservas/` |
| Tests | `MozoReservasTest`, `JornadaOperativaServiceTest`, `PoliticasReservaAdminTest`, `HorarioExcepcionReservasTest` (en `apps/api/tests/Feature/`) |

### Endpoints del mozo

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/mozo/reservas/politicas?fecha=YYYY-MM-DD` | Políticas (incluye `acepta_reservas`), jornada de la fecha, jornada en curso y turno sugerido. |
| `GET` | `/mozo/reservas?fecha=&turno=almuerzo\|cena\|todos` | Bandeja de reservas del turno. |
| `GET` | `/mozo/reservas/mesas-disponibles?fecha=&hora=&comensales=` | Mini-mapa de disponibilidad (`bloqueo_horario` si la hora no es válida o el canal está suspendido). |
| `POST` | `/mozo/reservas` | Registrar una reserva. |
| `POST` | `/mozo/reservas/{id}/sentar` | Sentar comensales y abrir la comanda. |
| `POST` | `/mozo/reservas/{id}/no-show` | Registrar inasistencia. |
| `POST` | `/mozo/reservas/{id}/cancelar` | Cancelar con motivo. |
| `PATCH` | `/mozo/reservas/{id}/reasignar-mesa` | Cambiar la mesa asignada. |

### Endpoints del administrador

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` / `PUT` | `/admin/reservas/politicas` | Leer y guardar las políticas (409 por reservas pendientes o edición simultánea). |
| `POST` | `/admin/reservas/politicas/restaurar-default` | Restaurar los parámetros recomendados (conserva el interruptor). |
| `GET` | `/admin/reservas/politicas/precheck-desactivacion` | Reservas pendientes que seguirían vigentes si se suspende el canal. |
| `GET` | `/admin/horario/excepciones/precheck` | Reservas afectadas por un cierre u horario especial. |
| `POST` | `/admin/horario/excepciones` | Registrar el cierre; con `cancelar_reservas` y `reservas_notificadas` cancela las afectadas. |
| `POST` | `/admin/horario/precheck` | Reservas que dejarían de caber con un horario semanal o plantilla (no guarda). |
| `PUT` / `POST` | `/admin/horario`, `/admin/horario/plantilla` | Guardar el horario semanal o aplicar una plantilla (mismas reglas de cancelación y aviso). |
| `POST` | `/admin/horario/feriados-peru/cargar` | Cargar feriados nacionales; informa los omitidos por tener reservas. |
