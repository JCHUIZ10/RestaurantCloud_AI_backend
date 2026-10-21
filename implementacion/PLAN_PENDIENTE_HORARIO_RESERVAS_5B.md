# Pendiente 5B: excepciones horarias con reservas reales

## Alcance ya implementado en 5A

- Horario semanal, turnos multiples, plantillas y calculo de horas.
- Turnos que cruzan medianoche.
- Excepciones y feriados que no tienen reservas activas.
- Validacion de horarios incompletos, iguales o superpuestos.

## Por que se difiere

La cancelacion de una reserva por un cierre excepcional debe conservar la trazabilidad,
registrar la notificacion al cliente y emitir las actualizaciones operativas. El mock actual
lo simula, pero el flujo de reservas aun no esta conectado por completo a la API real.

## Prerrequisitos

1. Modulo de reservas real con estados, mesas asociadas y clientes.
2. Notificacion asistida por WhatsApp y registro de metodo de contacto.
3. Log de auditoria disponible para el local.
4. Canal SSE de eventos operativos para mozos y plano de mesas.

## Trabajo pendiente

- Implementar `POST /api/v1/admin/horario/excepciones/precheck`.
- Informar las reservas afectadas por cierre total u horario especial.
- Exigir confirmacion de notificacion de cada cliente afectado.
- Crear la excepcion y cancelar reservas en una unica transaccion.
- Guardar `excepcion_id`, motivo, metodo, usuario y fecha de notificacion.
- Publicar el evento SSE para actualizar disponibilidad de mesas.

Mientras 5B no exista, 5A bloquea de forma conservadora crear una excepcion en fechas que
tengan reservas `confirmada` o `bloqueada`; nunca las cancela de forma automatica.
