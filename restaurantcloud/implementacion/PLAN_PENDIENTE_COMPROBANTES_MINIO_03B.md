# Pendiente CU-CAJA-03B: comprobantes digitales en MinIO

## Estado al terminar CU-CAJA-03A

La emisión fiscal ya es transaccional: valida los datos del cliente, bloquea la
serie en PostgreSQL, registra el comprobante y sus ítems, asienta el ingreso de
caja y actualiza el pedido. El registro contiene `token_qr`, pero todavía no
existe un PDF, XML ni URL pública que mostrar al cliente.

El espacio MinIO de cada empresa se inicializa una sola vez con:

```bat
scripts\init_minio_tenant.bat
```

Ese comando crea los manifiestos del tenant y de sus locales; no genera
comprobantes ni reemplaza la emisión registrada en PostgreSQL.

## Alcance de 03B

Implementar después de contar con la infraestructura de trabajos en segundo
plano (Redis + worker de Laravel/Horizon o `queue:work` supervisado):

1. Publicar un evento/outbox al confirmar el comprobante, dentro de la misma
   transacción de emisión.
2. Procesar un trabajo que genere el PDF y, si corresponde, el XML fiscal.
3. Guardar ambos objetos privados e inmutables en MinIO con la convención:

   ```text
   privado/empresas/{empresa_id}/locales/{local_id}/comprobantes/{comprobante_id}/{archivo}.pdf
   privado/empresas/{empresa_id}/locales/{local_id}/comprobantes/{comprobante_id}/{archivo}.xml
   ```

4. Registrar en `archivo` el bucket, clave, hash SHA-256, tamaño, tipo MIME y
   relación con el comprobante. Nunca exponer la clave de objeto al navegador.
5. Crear la ruta pública protegida por token QR, con límite de tasa, que
   entregue un enlace temporal o haga streaming del PDF tras autorizarlo.
6. Notificar al frontend por SSE cuando el documento pase de `generando` a
   `listo` o `error`; solo entonces habilitar QR, descarga, WhatsApp y correo.
7. Añadir reintentos idempotentes y una pantalla/acción administrativa de
   reproceso para fallos de generación.

## Criterio para iniciar

No debe empezarse 03B solo porque MinIO esté levantado. Se inicia cuando la
cola esté disponible y supervisada, porque generar PDFs dentro de la petición
de cobro bloquearía el POS y volvería frágil una operación financiera.
