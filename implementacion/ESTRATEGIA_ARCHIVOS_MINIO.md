# Estrategia de archivos con MinIO

> Guía de referencia para implementar almacenamiento de archivos en Laravel. Aplica a los casos de uso definidos en `context/cu.md`.

## Decisión de arquitectura

MinIO será el almacenamiento de objetos principal en desarrollo y producción. Es compatible con S3, por lo que Laravel lo consumirá mediante el disco `s3` de Flysystem.

- **PostgreSQL:** guarda metadatos, relaciones, permisos, estado y auditoría.
- **MinIO:** guarda el contenido binario: imágenes, PDF, XML, ZIP y adjuntos.
- **Laravel:** autoriza cada operación y genera enlaces de descarga de corta duración cuando corresponda.
- **No usar `storage/app` como repositorio de negocio:** solo puede utilizarse para archivos temporales durante una generación o carga. No se versiona ni se considera respaldo.

Cada desarrollador contará con su propia instancia de MinIO en Docker y su volumen `minio_data`. En producción MinIO también estará en Docker, con volumen persistente y copias de seguridad externas cifradas.

## Regla para decidir si un archivo se persiste

| Situación | Estrategia |
|---|---|
| Evidencia, adjunto, documento tributario, Reporte Z, PDF oficial o archivo que deba conservarse | Persistir en MinIO y registrar sus metadatos en PostgreSQL. |
| Exportación puntual que se puede reproducir desde datos actuales y no requiere historial | Generar y transmitir por *streaming* HTTP; no guardar en MinIO. |
| Exportación pesada, programada, enviada por correo o que deba descargarse más tarde | Generar en cola, guardar temporalmente en MinIO y aplicar expiración. |
| Imagen de catálogo visible desde la carta pública | Guardar en el área de catálogo, con una ruta pública controlada o entrega por Laravel/CDN. |

## Casos de uso y destino de sus archivos

| Caso de uso | Archivo o necesidad | Destino y política |
|---|---|---|
| `CU-SAAS-02` | Paquete ZIP de portabilidad | MinIO privado y temporal. Descargar con token de capacidad válido 30 días; eliminar al vencer según política legal. |
| `CU-PROP-01` | Constancia de suscripción PDF | MinIO solo si RestaurantCloud genera su propia constancia. |
| `CU-PROP-02` | Facturas de suscripción | Preferir `stripe_invoice_id` y URL/portal de Stripe. Guardar copia en MinIO únicamente si existe requisito de conservación propio. |
| `CU-PROP-06` | Consulta de evidencias de incidente | Consulta los archivos privados originados en `CU-ADMIN-11`; no duplica objetos. |
| `CU-PROP-07` | Reportes consolidados PDF/Excel | *Streaming* por defecto. MinIO solo si se programan, se envían por correo o se requiere historial. |
| `CU-ADMIN-04` | Fotografía de producto | MinIO en el área de catálogo. Debe ser visible desde la carta QR, sin exponer credenciales ni permitir listado del bucket. |
| `CU-ADMIN-07` | Lista de reposición PDF/Excel | *Streaming* directo; no persistir salvo que se habilite historial. |
| `CU-ADMIN-11` | Foto o comprobante escaneado de incidente | MinIO privado. Validar JPG/PNG y máximo 5 MB, tal como establece el caso de uso. |
| `CU-ADMIN-13` | Reporte de ventas PDF/Excel/CSV | *Streaming* HTTP por defecto; el CU especifica que no altera estado operacional. |
| `CU-ADMIN-14` | Comprobante de gasto y exportaciones financieras | Si se habilita carga de comprobante, guardarlo privado en MinIO. Las exportaciones se transmiten por *streaming* salvo requerimiento de conservarlas. |
| `CU-CAJA-03` | Boleta, factura o nota de venta PDF; XML de factura | MinIO privado, persistente e inmutable a nivel de aplicación. |
| `CU-CAJA-04` | Nota de crédito PDF/XML y representación del comprobante anulado | MinIO privado, persistente. No sobrescribir el original: guardar documentos relacionados por identificadores distintos. |
| `CU-CAJA-05` | Reporte Z digital | MinIO privado, persistente e inmutable a nivel de aplicación. |
| `CU-CLIENTE-01` | Fotografías de platos | Lee las imágenes de `CU-ADMIN-04`. |
| `CU-CLIENTE-02` | Descarga de comprobante PDF/XML mediante token QR | Lee documentos de `CU-CAJA-03` y `CU-CAJA-04`; acceso público limitado por token, rate limit y vigencia/política definida. |

## Organización de objetos

Al inicio se utilizará un bucket `restaurantcloud`, con prefijos que separan contenido público de contenido privado:

```text
catalogo/empresas/{empresa_uuid}/locales/{local_uuid}/productos/{producto_uuid}/{archivo_uuid}.{extension}

privado/empresas/{empresa_uuid}/locales/{local_uuid}/incidentes/{incidente_uuid}/{archivo_uuid}.{extension}
privado/empresas/{empresa_uuid}/locales/{local_uuid}/comprobantes/{comprobante_uuid}/{archivo_uuid}.{extension}
privado/empresas/{empresa_uuid}/locales/{local_uuid}/reportes-z/{caja_uuid}/{archivo_uuid}.pdf
privado/empresas/{empresa_uuid}/portabilidad/{solicitud_uuid}/{archivo_uuid}.zip
privado/empresas/{empresa_uuid}/temporales/exportaciones/{exportacion_uuid}/{archivo_uuid}.{extension}
```

Reglas:

- Utilizar UUID para nombres y rutas; nunca depender del nombre original del usuario.
- No almacenar DNI, RUC, teléfono, correo u otro dato personal en la clave del objeto.
- No sobrescribir archivos oficiales. Si se regenera un documento, crear una versión/objeto nuevo y mantener la relación de auditoría.
- `catalogo/` y `privado/` deben usar políticas de acceso separadas. El contenido privado no puede ser público por bucket ni por URL permanente.

## Modelo de metadatos recomendado

Crear un agregado o tabla `archivo` en el dominio `Archivos`. Sus campos mínimos serían:

| Campo | Propósito |
|---|---|
| `id` UUID | Identificador interno del archivo. |
| `empresa_id`, `local_id` nullable | Aislamiento multi-tenant y trazabilidad. |
| `bucket`, `object_key` | Ubicación física en MinIO. |
| `nombre_original` | Nombre mostrado al usuario; no se usa como clave. |
| `mime_type`, `tamanio_bytes`, `sha256` | Validación, entrega y verificación de integridad. |
| `visibilidad` | `catalogo`, `privado`, `token_temporal` o equivalente. |
| `entidad_tipo`, `entidad_id` | Relación con producto, incidente, comprobante, caja, exportación, etc. |
| `estado` | `pendiente`, `disponible`, `fallido`, `eliminado`, `expirado`. |
| `creado_por`, `created_at`, `deleted_at` | Auditoría y borrado lógico. |
| `expira_at` nullable | Obligatorio para ZIP de portabilidad y exportaciones temporales. |

La autorización siempre se resuelve usando el registro de PostgreSQL y las políticas del dominio; nunca por confiar únicamente en que alguien conoce un `object_key`.

## Flujos de implementación

### 1. Carga de adjuntos pequeños

Aplicable inicialmente a evidencias de incidentes y fotos de productos.

1. React envía `multipart/form-data` a Laravel.
2. Un `FormRequest` valida autenticación, rol, empresa/local activo, tamaño, MIME permitido y archivo real.
3. Una acción del dominio `Archivos` genera el `object_key` y transmite el archivo a MinIO sin cargarlo completo en memoria.
4. La transacción registra o actualiza el metadato y la entidad propietaria.
5. Laravel devuelve un DTO con `archivo_id`, nombre, tipo y una URL de visualización autorizada.

Para `CU-ADMIN-11`, el límite actual es JPG/PNG y 5 MB. Para productos, definir explícitamente límites y formatos antes de implementar; se recomienda JPG, PNG y WebP.

### 2. Generación de documentos oficiales

Aplicable a comprobantes, notas de crédito y Reporte Z.

1. La transacción de negocio crea el comprobante/cierre y un evento Outbox.
2. Un trabajo de cola genera el PDF y, cuando corresponda, el XML.
3. El trabajo los guarda en MinIO con claves nuevas e inmutables.
4. Se persisten los metadatos y la relación con el comprobante o caja.
5. Una notificación SSE avisa que el documento está disponible, sin enviar el archivo por SSE.

Si la emisión tributaria exige que el documento exista inmediatamente, el estado debe indicar `generando` hasta que el trabajo finalice, o el flujo debe esperar la generación controladamente. No marcar un archivo como disponible antes de confirmar que MinIO lo recibió.

### 3. Descarga privada

1. El cliente solicita un endpoint Laravel con el ID del archivo o de su entidad relacionada.
2. Laravel aplica autenticación, Policy, empresa activa y RLS en las consultas.
3. Laravel registra auditoría de acceso cuando corresponda.
4. Laravel responde con una URL firmada de MinIO de corta duración (5 a 15 minutos) o transmite el archivo desde la API si se necesita aplicar cabeceras, auditoría especial o reglas adicionales.

### 4. Descarga pública mediante QR

Aplicable a `CU-CLIENTE-02`.

1. La ruta pública recibe el token QR, no un `object_key`.
2. Laravel valida el token, el estado del comprobante y el rate limit en Redis.
3. Laravel entrega una URL temporal específica para el PDF/XML o transmite el archivo.
4. Nunca se expone un listado de objetos ni credenciales S3 al navegador.

### 5. Exportaciones y portabilidad

- Para reportes normales: generar y descargar por *streaming*; no crear metadato `archivo`.
- Para exportaciones grandes: crear un registro `exportacion` en estado `pendiente`, procesar con una cola, guardar temporalmente en MinIO y notificar por SSE/correo.
- Para `CU-SAAS-02`: crear ZIP en una cola, asociar `expira_at`, emitir token de capacidad, revocarlo al vencer o al completar la baja legal y ejecutar una tarea programada de limpieza.

## Seguridad y conservación

- No incluir las credenciales raíz de MinIO en frontend, repositorio ni logs.
- Usar credenciales de aplicación con permisos mínimos cuando se configure MinIO para producción; no usar el usuario raíz como credencial operativa permanente.
- Validar extensión, MIME declarado y MIME real; rechazar archivos fuera de la política.
- Definir `Content-Type` y `Content-Disposition` al guardar/descargar.
- Calcular `sha256` para documentos sensibles y registrar el resultado en PostgreSQL.
- Aplicar antivirus o análisis de archivos antes de publicar adjuntos cuando el flujo llegue a producción.
- Activar versionado del bucket y política de retención para documentos fiscales/Reporte Z, tras validar requisitos legales y operativos.
- Mantener respaldos periódicos cifrados de PostgreSQL **y** MinIO fuera de la VPS. Un volumen Docker persistente evita perder datos al recrear contenedores, pero no sustituye un respaldo.

## Configuración por entorno

Laravel usa el disco `s3` definido en `apps/api/config/filesystems.php`.

| Ejecución de Laravel | `AWS_ENDPOINT` |
|---|---|
| `php artisan serve` en Windows, MinIO en Docker | `http://localhost:9000` |
| Laravel dentro del mismo `docker-compose` que MinIO | `http://minio:9000` |

Mantener `AWS_USE_PATH_STYLE_ENDPOINT=true` para MinIO y configurar `AWS_BUCKET=restaurantcloud`. Las credenciales reales deben estar únicamente en archivos `.env` no versionados o en el gestor de secretos del despliegue.

## Orden propuesto de implementación

1. Verificar MinIO en Docker, creación automática del bucket y conexión Laravel con una prueba controlada.
2. Crear el módulo `app/Domains/Archivos`, migración de metadatos, Policy base y servicio/adaptador de almacenamiento.
3. Implementar `CU-ADMIN-04` para fotos de productos y su lectura desde `CU-CLIENTE-01`.
4. Implementar `CU-ADMIN-11` para evidencia privada de incidentes.
5. Implementar generación asíncrona e inmutable de `CU-CAJA-03`, `CU-CAJA-04` y `CU-CAJA-05`.
6. Habilitar `CU-CLIENTE-02` con token QR, rate limit y descarga limitada.
7. Implementar exportaciones bajo demanda y, finalmente, `CU-SAAS-02` con ZIP temporal, expiración y limpieza programada.

## Criterios de aceptación iniciales

- Un usuario no puede leer ni descargar un archivo de otra empresa o local.
- Un archivo privado no tiene URL permanente accesible sin autorización.
- Una evidencia inválida o mayor al límite recibe `422` y no deja objetos huérfanos en MinIO.
- Un comprobante o Reporte Z ya emitido no es sobrescrito.
- Al eliminar lógicamente una entidad, su archivo sigue la política de retención correspondiente; no se borra sin una tarea y auditoría explícitas.
- La recreación de contenedores conserva el volumen de MinIO, y una restauración de respaldo puede recuperar objetos y sus metadatos coherentemente.
