# Plan pendiente: Personal 4B — desactivación operativa segura

## Implementado en 4A

El directorio de personal usa API real para listar, crear, editar, restablecer claves y reactivar cuentas operativas (`mozo`, `cocina`, `cajero`), incluyendo cuota del plan, contraseña provisional hasheada y enlace manual de WhatsApp.

## Pendiente en 4B

La desactivación permanece en mock cuando `VITE_USE_REAL_API=false` y se bloquea informativamente con API real. Debe implementarse después de contar con datos reales y validados de:

1. **Pedidos y mesas:** consultas confiables de pedidos abiertos por `mozo_id` y operación transaccional para reasignarlos a un mozo activo de la misma sede.
2. **Caja:** turnos de caja reales, con bloqueo de desactivación para un cajero que mantenga caja abierta.
3. **Sesiones Redis:** índice o mecanismo de revocación de todas las sesiones y refresh tokens de un usuario desactivado.
4. **Auditoría:** registro inmutable del administrador, motivo, fecha y reasignaciones realizadas.
5. **Notificaciones:** servicio de correo/cola definido si se desea enviar bienvenida o restablecimiento automáticamente; 4A solo produce un enlace manual de WhatsApp.

## Criterio para iniciar 4B

Iniciar únicamente tras validar que los módulos Mozo y Caja consultan y actualizan PostgreSQL de forma transaccional, con sus pruebas de pedidos activos y cajas abiertas. Entonces se podrá exponer:

```text
GET  /api/v1/admin/personal/{id}/precheck-desactivacion
POST /api/v1/admin/personal/{id}/desactivar
```

La desactivación debe ejecutar reasignación, revocación y auditoría dentro de una transacción; nunca debe dejar pedidos huérfanos ni un cajero con dinero en custodia sin cierre.
