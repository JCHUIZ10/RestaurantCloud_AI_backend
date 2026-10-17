# Guía Maestra de Prevención de Errores: Integración de MinIO S3

> **Propósito:** Documento de ingeniería defensiva que detalla los 9 errores críticos más comunes al integrar almacenamiento de objetos (MinIO / S3) con Laravel, Docker y PostgreSQL RLS, junto con sus soluciones definitivas y código de referencia para el equipo de desarrollo.
> **Aplica a:** `apps/api` (Laravel Octane), `infra/sql` (PostgreSQL 16), `infra/docker` (MinIO) y los 45 Casos de Uso de RestaurantCloud AI.

---

## 1. Topología y Red: El Error de las URLs Firmadas (*Presigned URLs*)

### ❌ El Error (Anti-patrón Común)
Intentar generar URLs firmadas temporales (`Storage::temporaryUrl(...)`) para que el navegador del usuario descargue directamente desde MinIO cuando MinIO corre en un contenedor Docker.

```php
// ❌ ERROR TÍPICO:
$url = Storage::disk('s3')->temporaryUrl($archivo->object_key, now()->addMinutes(15));
return response()->json(['url' => $url]);
```

**Por qué falla:**
1. **Fallo de DNS en el cliente:** En Docker, Laravel tiene configurado `AWS_ENDPOINT=http://minio:9000`. La URL firmada resultante será `http://minio:9000/restaurantcloud/privado/...?X-Amz-Signature=...`. El navegador web del usuario o el teléfono del comensal no tienen en su archivo `hosts` el dominio `minio`, provocando de inmediato `ERR_NAME_NOT_RESOLVED`.
2. **Fallo de firma criptográfica si se maquilla la URL:** Si se reemplaza `http://minio:9000` por `http://localhost:9000` o por el dominio público en la cadena de texto, la firma AWS Signature v4 computa la cabecera `Host`. Al llegar a MinIO con un `Host` distinto al firmado, MinIO rechaza la petición con `403 SignatureDoesNotMatch`.
3. **Exposición de infraestructura:** Obliga a exponer los puertos de MinIO (9000/9001) a la red pública o internet, aumentando la superficie de ataque.

### ✅ La Solución Definitiva: Streaming Controller Mediado por Laravel
Para **archivos privados** (evidencias `CU-ADMIN-11`, comprobantes `CU-CAJA-03/04`, Reportes Z `CU-CAJA-05`, portabilidad `CU-SAAS-02`), la entrega **SIEMPRE** debe resolverse a través de endpoints de Laravel:

```php
// ✅ SOLUCIÓN CANÓNICA: app/Domains/Archivos/Actions/DescargarArchivoAction.php
public function execute(string $archivoId, User $usuario): StreamedResponse
{
    // 1. PostgreSQL evalúa RLS automáticamente sobre la tabla 'archivo'
    $archivo = Archivo::where('id', $archivoId)->firstOrFail();

    // 2. Laravel Policy verifica permisos de rol/ámbito
    Gate::authorize('descargar', $archivo);

    // 3. Obtener stream binario sin cargar en memoria RAM
    $stream = Storage::disk('s3')->readStream($archivo->object_key);

    return response()->stream(
        function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        },
        200,
        [
            'Content-Type' => $archivo->mime_type,
            'Content-Length' => $archivo->tamanio_bytes,
            'Content-Disposition' => sprintf('inline; filename="%s"', addslashes($archivo->nombre_original)),
            'Cache-Control' => 'private, no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]
    );
}
```

*Ventajas:*
- 100% independiente del entorno (funciona idéntico en Docker local, staging y VPS de producción).
- Puertos 9000 y 9001 de MinIO permanecen cerrados al exterior dentro de `saas_network`.
- Cada descarga audita en tiempo real y valida RLS.

---

## 2. Condición de Carrera en Descarga de Comprobante QR (`CU-CAJA-03` / `CU-CLIENTE-02`)

### ❌ El Error (Anti-patrón Común)
El cajero confirma el cobro en el POS (`CU-CAJA-03`), el backend despacha un Job asíncrono a Redis para generar el PDF en MinIO, y la terminal POS muestra de inmediato el código QR dinámico. El comensal escanea el QR con su cámara en 1-2 segundos.
Si el worker de cola está ocupado o tarda 3 segundos en generar el PDF, el comensal hace clic en `[ Descargar PDF ]` y recibe un error `404 Not Found` o `500 Server Error`.

### ✅ La Solución Definitiva: Estrategia Dual-Mode Resiliente
1. **Visualización Web Inmediata:** La URL pública del comprobante (`https://app.restaurantcloud.pe/c/:token`) renderiza la representación gráfica del comprobante en HTML responsive consultando la tabla `comprobante` en PostgreSQL (< 15ms). El comensal ve su comprobante al instante.
2. **Descarga de PDF bajo demanda si la cola aún no termina:**
   En el endpoint público de descarga `/api/v1/public/comprobantes/{token}/pdf`:

```php
// ✅ SOLUCIÓN EN CONTROLADOR PÚBLICO
public function descargarPdf(string $tokenQr)
{
    // Validar token y rate limit (30 req/min vía Redis)
    $comprobante = Comprobante::where('token_qr', $tokenQr)->firstOrFail();

    $archivo = Archivo::where('entidad_tipo', 'comprobante')
        ->where('entidad_id', $comprobante->id)
        ->where('mime_type', 'application/pdf')
        ->first();

    // Si ya fue generado por la cola, transmitirlo
    if ($archivo && $archivo->estado === 'disponible') {
        return Storage::disk('s3')->response($archivo->object_key, "{$comprobante->serie}-{$comprobante->correlativo}.pdf");
    }

    // SI AÚN ESTÁ PENDIENTE: Generar al vuelo síncronamente, guardar en MinIO y entregar
    $pdfContenido = app(GeneradorComprobantePdfService::class)->generar($comprobante);
    $nuevoArchivo = app(SubirArchivoAction::class)->executeSincrono($comprobante, $pdfContenido);

    return Storage::disk('s3')->response($nuevoArchivo->object_key, "{$comprobante->serie}-{$comprobante->correlativo}.pdf");
}
```

---

## 3. Fuga de Archivos Huérfanos por Fallo de Transacción en Base de Datos

### ❌ El Error (Anti-patrón Común)
Subir el archivo binario a MinIO y luego ejecutar la inserción en PostgreSQL. Si la transacción de base de datos falla (por ejemplo, validación de clave foránea, timeout o error en el modelo), el archivo físico queda residiendo en MinIO para siempre sin metadato asociado, generando fuga de espacio en disco (*orphan leak*).

### ✅ La Solución Definitiva: Transaccionalidad Defensiva con Limpieza en `catch`

```php
// ✅ PATRÓN DE SUBIDA SEGURA
public function subir(UploadedFile $file, string $entidadTipo, string $entidadId, TenantContext $tenant): Archivo
{
    $objectKey = sprintf(
        'privado/empresas/%s/locales/%s/%s/%s/%s.%s',
        $tenant->empresaId,
        $tenant->localId ?? 'general',
        $entidadTipo,
        $entidadId,
        (string) Str::uuid(),
        $file->getClientOriginalExtension()
    );

    // 1. Subir binario a MinIO
    $subido = Storage::disk('s3')->put($objectKey, $file->getContent());
    if (!$subido) {
        throw new StorageException('Error al escribir en el servidor de archivos.');
    }

    try {
        // 2. Persistir metadatos dentro de transacción PostgreSQL
        return DB::transaction(function () use ($objectKey, $file, $entidadTipo, $entidadId, $tenant) {
            return Archivo::create([
                'empresa_id' => $tenant->empresaId,
                'local_id' => $tenant->localId,
                'bucket' => config('filesystems.disks.s3.bucket'),
                'object_key' => $objectKey,
                'nombre_original' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'tamanio_bytes' => $file->getSize(),
                'sha256' => hash_file('sha256', $file->getRealPath()),
                'visibilidad' => 'privado',
                'entidad_tipo' => $entidadTipo,
                'entidad_id' => $entidadId,
                'estado' => 'disponible',
                'creado_por' => auth()->id(),
            ]);
        });
    } catch (\Throwable $e) {
        // 3. Rollback en MinIO si la base de datos rechaza la operación
        Storage::disk('s3')->delete($objectKey);
        throw $e;
    }
}
```

---

## 4. Agotamiento de Memoria en Streaming de Archivos Pesados (`memory_limit`)

### ❌ El Error (Anti-patrón Común)
Leer archivos completos en cadenas en memoria con `Storage::get($key)` o `file_get_contents()`. Para reportes grandes o paquetes de portabilidad ZIP (`CU-SAAS-02`), esto satura la memoria del proceso PHP-FPM o el worker de Octane, disparando `Fatal Error: Allowed memory size exhausted`.

### ✅ La Solución Definitiva: Flujo de Streams Binarios Nativos
Usar `readStream()` para obtener el descriptor de recurso nativo (`resource`) y transmitirlo mediante `fpassthru()`:

```php
// ✅ Cero consumo de RAM: Transmite por chunks directamente del socket al cliente
$stream = Storage::disk('s3')->readStream($objectKey);
return response()->stream(function () use ($stream) {
    fpassthru($stream);
    fclose($stream);
}, 200, $headers);
```

---

## 5. Falsificación de MIME Type y Carga Maliciosa

### ❌ El Error (Anti-patrón Común)
Validar solo la extensión del archivo (`$file->getClientOriginalExtension() == 'jpg'`) o confiar en el `Content-Type` enviado por el navegador, el cual puede ser falsificado para subir scripts ejecutables.

### ✅ La Solución Definitiva: Validación por Magic Bytes y Nombres UUID
1. **Regla de FormRequest:** Usar `mimes:jpg,jpeg,png` o `mimes:jpg,jpeg,png,webp` con el validador nativo de Laravel (que inspecciona los *magic bytes* del archivo vía PHP `fileinfo`).
2. **Rechazo con código canónico:** Para `CU-ADMIN-11`, retornar exactamente `422 Unprocessable` con código `ERR_EVIDENCIA_FORMATO_INVALIDO`.
3. **Nombre de objeto UUID:** **NUNCA** usar el nombre original del archivo en el `object_key` para prevenir ataques de *Path Traversal* (`../../../etc/passwd`).

```php
// ✅ app/Domains/Archivos/Http/Requests/SubirEvidenciaRequest.php
public function rules(): array
{
    return [
        'evidencia' => [
            'required',
            'file',
            'mimes:jpg,jpeg,png',
            'max:5120', // Máximo 5 MB según CU-ADMIN-11
        ],
    ];
}

public function failedValidation(Validator $validator)
{
    throw new HttpResponseException(response()->json([
        'exito' => false,
        'errores' => [[
            'codigo' => 'ERR_EVIDENCIA_FORMATO_INVALIDO',
            'mensaje' => 'El archivo de evidencia debe ser una imagen válida (JPG o PNG) de máximo 5 MB.',
        ]],
        'meta' => ['timestamp' => now()->toIso8601String()]
    ], 422));
}
```

---

## 6. Fugas Multi-tenant y Bypass de Row-Level Security (RLS)

### ❌ El Error (Anti-patrón Común)
Consultar archivos recibiendo un identificador en el controlador y haciendo `Storage::disk('s3')->download($request->input('key'))` sin verificar que el `empresa_id` coincida con la sesión activa. Un usuario de la Empresa A podría adivinar o recibir la clave de un comprobante de la Empresa B y descargarlo.

### ✅ La Solución Definitiva: Autorización RLS Fail-Closed
La tabla `archivo` cuenta con la política `p_archivo_tenant` integrada en PostgreSQL.
- Cuando el middleware de Laravel ejecuta `SET LOCAL app.current_empresa_id = '...'`:
- La consulta `Archivo::find($id)` fallará con `ModelNotFoundException` (404) si el archivo pertenece a otra empresa, porque PostgreSQL oculta la fila a nivel de motor.
- Adicionalmente, el controlador debe implementar `ArchivoPolicy`:

```php
// ✅ app/Domains/Archivos/Policies/ArchivoPolicy.php
public function descargar(User $usuario, Archivo $archivo): bool
{
    if ($usuario->esAdminSaas()) {
        return true;
    }

    if ($archivo->empresa_id !== $usuario->empresa_id) {
        return false;
    }

    // Si tiene local_id asignado, verificar pertenencia a la sede
    if ($archivo->local_id && $usuario->esAdminLocal()) {
        return $usuario->local_id === $archivo->local_id;
    }

    return true;
}
```

---

## 7. Retención Legal y Limpieza de Archivos Temporales (`CU-SAAS-02`)

### ❌ El Error (Anti-patrón Común)
Generar paquetes ZIP de portabilidad (`CU-SAAS-02`) o exportaciones pesadas y dejarlos en MinIO indefinidamente. Esto viola la Ley N° 29733 (Art. 19), acumula almacenamiento costoso y expone información de empresas dadas de baja.

### ✅ La Solución Definitiva: Expiración Explícita y Cron de Purga
1. Al crear el archivo para `CU-SAAS-02`: registrar `expira_at = now()->addDays(30)`.
2. Implementar comando programado en Laravel:

```php
// ✅ app/Domains/Archivos/Console/Commands/PurgarArchivosExpiradosCommand.php
public function handle(): int
{
    $expirados = Archivo::whereNotNull('expira_at')
        ->where('expira_at', '<=', now())
        ->where('estado', 'disponible')
        ->limit(100)
        ->get();

    foreach ($expirados as $archivo) {
        // 1. Eliminar blob físico en MinIO
        Storage::disk('s3')->delete($archivo->object_key);

        // 2. Actualizar estado en PostgreSQL a 'expirado' (conservar trazabilidad)
        $archivo->update(['estado' => 'expirado']);
    }

    return Command::SUCCESS;
}
```

---

## 8. Inmutabilidad Fiscal y Verificación de Integridad (`CU-CAJA-03` / `CU-CAJA-05`)

### ❌ El Error (Anti-patrón Común)
Permitir que un comprobante emitido o un Reporte Z digital pueda ser sobrescrito con el mismo nombre en MinIO si se vuelve a emitir o si ocurre un reintento en la cola.

### ✅ La Solución Definitiva: Hash SHA-256 y Claves con UUID
1. El `object_key` de cada comprobante debe incluir un UUID único:  
   `privado/empresas/{empresa_id}/locales/{local_id}/comprobantes/{comprobante_id}/{archivo_uuid}.pdf`
2. Si un comprobante es anulado vía Nota de Crédito (`CU-CAJA-04`): **NO se modifica el archivo PDF original**. Se crea un nuevo registro en `comprobante` y un nuevo archivo para la Nota de Crédito, manteniendo el documento original 100% inalterable para SUNAT.
3. Se calcula y almacena el hash criptográfico `sha256` en la tabla `archivo` para auditoría forense.

---

## 9. Convención de Variables de Entorno según Contexto de Ejecución

Para evitar que el disco `s3` intente conectarse al host equivocado:

| Entorno de Ejecución de Laravel | `AWS_ENDPOINT` en `.env` |
|---|---|
| **Laravel corriendo dentro de Docker Compose** | `http://minio:9000` |
| **Laravel corriendo en el host Windows** (`php artisan serve`) | `http://localhost:9000` |
| **Consola MinIO para el desarrollador** | `http://localhost:9001` |

> [!IMPORTANT]
> Mantener siempre `AWS_USE_PATH_STYLE_ENDPOINT=true` en `.env`. MinIO requiere este parámetro porque no utiliza subdominios virtuales basados en DNS (`bucket.dominio.com`) de manera nativa sin un servidor DNS dedicado.

---

## Checklist de Verificación para el Desarrollador

Antes de dar por concluida la implementación de cualquier endpoint que manipule archivos:

- [ ] ¿El archivo privado se entrega vía Controller Stream de Laravel en lugar de URL firmada directa?
- [ ] ¿El `object_key` utiliza UUIDs y no contiene el nombre original del archivo ni datos personales?
- [ ] ¿La validación de archivo en `FormRequest` inspecciona MIME real por *magic bytes* y define un tamaño máximo?
- [ ] ¿Si la transacción de PostgreSQL falla, se elimina el archivo en MinIO en el bloque `catch`?
- [ ] ¿El registro en `archivo` tiene `empresa_id` y `local_id` vinculados para que aplique RLS?
- [ ] ¿Para `CU-CLIENTE-02`, la consulta pública verifica `app.public_token_qr` y aplica rate limiting en Redis?
- [ ] ¿Para documentos temporales (`CU-SAAS-02`), se especificó `expira_at` a 30 días?
