# Pendientes: métodos de pago, QR y caja (punto 7B)

## Alcance implementado en 7A

La configuración real de métodos de pago queda limitada deliberadamente a `efectivo`, `tarjeta` y `billetera_digital`. Efectivo permanece siempre activo y sin recargo. Tarjeta puede activarse o desactivarse y su porcentaje se cobra como recargo al cliente en los nuevos cobros de Caja. Billetera digital no admite recargo y, para activarse, requiere un celular peruano válido de nueve dígitos.

Los endpoints de precuenta de Caja y Mozo muestran solamente estos tres medios operativos. El endpoint de Caja valida que el método esté activo para el local, guarda el método usado, el consumo, el porcentaje y monto de recargo, el total y el movimiento de caja. Por ello la configuración no solo es visual: afecta los siguientes cobros reales.

`transferencia` se mantiene únicamente en el mock para no alterar sus escenarios visuales. Por decisión funcional no forma parte de los cobros POS ni del catálogo real de este punto; si se requiere registrar una transferencia interna, deberá resolverse dentro del futuro flujo administrativo de Caja, no como medio de pago de una venta.

La restricción de códigos operativos y depuración de `transferencia` en `metodo_pago_local` se encuentra incorporada de forma canónica en `02_schema_ddl.sql` para nuevas bases y en la migración de Laravel para bases existentes:

```powershell
docker compose exec api php artisan migrate
```

Para comprobar el resultado:

```powershell
docker compose exec -T db psql -U saas_admin -d restaurantcloud_db -c "SELECT codigo, nombre, activo, comision_porcentaje FROM metodo_pago_local ORDER BY orden;"
```

## Pendiente 7B: QR de billetera con MinIO

Antes de agregar la carga de QR se debe definir el formato aceptado, tamaño máximo, responsable que puede reemplazarlo y si el QR se muestra solo en Caja o también en la precuenta. La implementación deberá cargar el archivo a MinIO mediante una URL temporal o un endpoint autenticado, guardar solamente la clave del objeto en `metodo_pago_local.datos_adicionales.qr_url` y entregar una URL temporal de lectura al frontend. No deben guardarse archivos binarios ni URLs públicas permanentes en la base de datos.

## Pendiente 7C: eventos SSE

Cuando el canal SSE común esté implementado, publicar un evento versionado, por ejemplo `metodos_pago.actualizados`, después de confirmar la transacción de actualización. Caja, Mozo y la pantalla de administración deberán invalidar o recargar su catálogo al recibirlo. Mientras tanto, cada nueva consulta y cada nuevo cobro leen la configuración persistida; no se afirma sincronización en tiempo real en la interfaz real.

## Pendiente 7D: flujo administrativo de Caja

El caso de uso de flujo de Caja debe construirse después de estabilizar el módulo POS y sus reglas de cierre. Ahí se incluirán arqueo, ingresos y egresos internos, observaciones, reportes y, si el negocio lo aprueba, el registro interno de transferencias. Ese flujo no debe reutilizar `medio_pago` del comprobante de venta, que se limita a efectivo, tarjeta y billetera digital.
