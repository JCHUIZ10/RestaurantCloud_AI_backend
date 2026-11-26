# Correos Transaccionales (ÁUREA)

Documentación de referencia rápida sobre la arquitectura, clases y funciones que integran el envío de correos electrónicos en `apps/api`.

---

## 1. Arquitectura y componentes base

| Componente | Archivo | Responsabilidad |
|---|---|---|
| Despachador seguro | `apps/api/app/Support/CorreoTransaccional.php` | Envía cualquier `Mailable` de forma síncrona dentro de un `try/catch`, registrando fallos SMTP en `Log::error` sin interrumpir la petición HTTP. |
| Mailable de activación | `apps/api/app/Mail/ActivacionCuentaMail.php` | Construye el asunto, contenido HTML/texto plano y calcula la fecha límite exacta (`$fechaLimite`) en zona horaria `America/Lima`. |
| Layout maestro | `apps/api/resources/views/emails/layouts/base.blade.php` | Estructura HTML responsive basada en tablas con identidad visual de ÁUREA (`#0B2340`, `#D5A06F`, `#FFF9F0`) y logo incrustado. |
| Plantilla HTML | `apps/api/resources/views/emails/activacion_cuenta.blade.php` | Cuerpo del correo con badges de rol/empresa, guía en 3 pasos, botón CTA, vigencia con fecha límite y URL de respaldo. |
| Plantilla texto plano | `apps/api/resources/views/emails/activacion_cuenta_texto.blade.php` | Alternativa multipart en texto plano para clientes sin HTML. |
| Logo incrustado | `apps/api/resources/images/emails/logo-aurea.png` | Imagen PNG incrustada vía `$message->embed(...)` para evitar bloqueos de imágenes externas. |

---

## 2. Funciones principales

### `CorreoTransaccional::enviarSeguro(string $destinatario, Mailable $mailable, array $contextoLog = []): bool`
- **Qué hace:** Valida que `$destinatario` no esté vacío, ejecuta `Mail::to($correo)->send($mailable)` y devuelve `true` si se envió o `false` si ocurrió un error (registrando el detalle en logs junto con `$contextoLog`).
- **Regla de uso:** Invocar **siempre fuera** de `DB::transaction(...)` una vez confirmada la transacción, para no retener bloqueos de base de datos ni emitir correos ante un rollback.

### Constructores estáticos de `ActivacionCuentaMail`
1. `paraInvitacionAdmin(string $nombreDestinatario, string $urlActivacion, bool $esReenvio = false, ?string $nombreEmpresa = null, int $horasExpiracion = 24, ?string $expiraEn = null): self`
   - Para altas y reenvíos de administradores de sede (`esReenvio: true` cambia el asunto y texto indicando que el enlace anterior fue reemplazado).
2. `paraAltaEmpresa(string $nombreDestinatario, string $nombreEmpresa, string $urlActivacion, int $horasExpiracion = 72, ?string $expiraEn = null): self`
   - Para el alta manual B2B del propietario de una empresa.
3. `paraRecordatorioTitular(string $nombreDestinatario, string $nombreEmpresa, string $urlActivacion, int $horasExpiracion = 72, ?string $expiraEn = null): self`
   - Para renovación de enlace / recordatorio al titular desde el panel SaaS.

---

## 3. Puntos de integración en la API

Todos los flujos mantienen `invitacion_token` e `invitacion_url` en la respuesta JSON como respaldo.

| Flujo | Clase y método | Plantilla / Factory | Vigencia |
|---|---|---|---|
| Invitar administrador de sede | `App\Domains\Administradores\Services\AdministradorService::invitar()` | `paraInvitacionAdmin(..., esReenvio: false)` | 24 horas |
| Reenviar invitación a administrador | `App\Domains\Administradores\Services\AdministradorService::reenviarInvitacion()` | `paraInvitacionAdmin(..., esReenvio: true)` | 24 horas |
| Alta manual B2B de empresa | `App\Domains\Tenant\Services\TenantProvisioningService::provisionarAltaManual()` | `paraAltaEmpresa(...)` | 72 horas |
| Notificar cobro / renovar enlace | `App\Http\Controllers\Api\Saas\SaasTenantController::notificarCobro()` | `paraRecordatorioTitular(...)` | 72 horas |

---

## 4. Configuración en desarrollo y pruebas

- **Variables de entorno** (`.env.example` y `docker-compose.yml`): `MAIL_MAILER=smtp`, `MAIL_HOST=mailpit`, `MAIL_PORT=1025`, `MAIL_FROM_ADDRESS=no-reply@restaurantcloud.local`, `MAIL_FROM_NAME="ÁUREA"`, `FRONTEND_URL=http://localhost:5173`.
- **Bandeja web local (Mailpit):** `http://localhost:8025` (`MAILPIT_PORT`).
- **Suite automatizada:**
  ```bash
  docker exec restaurantcloudIA_api php artisan test tests/Feature/Correos/ActivacionCuentaMailTest.php
  ```
