# Guía local: emisión y PDF de comprobantes digitales

Esta guía permite probar CU-CAJA-03B: emisión desde Caja, Outbox, generación
asíncrona de PDF, MinIO privado y consulta pública por token QR.

> Estado actual: la emisión, el Outbox, el worker, la creación del PDF, el
> registro de metadatos y el guardado privado en MinIO están comprobados. La
> descarga pública del PDF desde Laravel sigue pendiente de validación/corrección
> antes de considerarse terminada. No se debe marcar CU-CAJA-03B como cerrado
> mientras ese último paso no se pruebe de extremo a extremo.

## Resultado esperado

```text
Mozo solicita la cuenta → Cajero confirma el cobro → evento Outbox
→ queue genera PDF → MinIO guarda privado → archivo registra hash
→ /c/{token_qr} permite consultar el comprobante
→ pendiente: descargar el PDF privado mediante Laravel
```

## Requisitos comunes

- Docker Desktop iniciado.
- Rama `feature/backend-laravel`.
- Ejecutar desde la raíz del repositorio, excepto cuando se indique
  `restaurantcloud`.

## Caso A: ya tenías una base PostgreSQL creada

Para un entorno que ya usaba el proyecto antes de CU-CAJA-03B:

```powershell
cd C:\laragon\www\RestaurantCloud_AI_backend
git checkout feature/backend-laravel
git pull --rebase origin feature/backend-laravel
cd restaurantcloud
docker compose up -d --build
docker compose exec api composer install --no-interaction
docker compose exec api php artisan optimize:clear
```

Una base existente se actualiza ejecutando las migraciones canónicas de Laravel:

```powershell
docker compose exec api php artisan migrate
```

Reinicia los procesos Laravel y confirma que estén activos:

```powershell
docker compose restart api queue scheduler
docker compose ps
```

Debes ver activos `saas_laravel_api`, `saas_laravel_queue` y
`saas_laravel_scheduler`.

## Caso B: base de datos nueva

Para un clon nuevo o un volumen PostgreSQL todavía inexistente:

```powershell
git clone https://github.com/JCHUIZ10/RestaurantCloud_AI_backend.git
cd RestaurantCloud_AI_backend
git checkout feature/backend-laravel
Copy-Item .env.example .env
cd restaurantcloud
docker compose up -d --build
docker compose exec api php artisan optimize:clear
docker compose ps
```

Con un volumen vacío, PostgreSQL ejecuta automáticamente todos los scripts canónicos de
`infra/sql` (del `01` al `08`).

## Inicializar MinIO de ÁUREA

Este comando es seguro de repetir y crea los manifiestos del tenant y locales:

```powershell
scripts\init_minio_tenant.bat
```

## Probar desde la SPA

En otra terminal:

```powershell
cd C:\laragon\www\RestaurantCloud_AI_backend\restaurantcloud\apps\web
npm.cmd install
Copy-Item .env.example .env.local
```

En `.env.local` verifica:

```env
VITE_USE_REAL_API=true
VITE_API_URL=http://localhost:8080/api/v1
```

Luego inicia la SPA:

```powershell
npm.cmd run dev
```

## Prueba de emisión y descarga

1. Ingresa como mozo y solicita la cuenta de una mesa con consumos. Define el
   comprobante y medio de pago.
2. Ingresa como cajero, abre la mesa `CUENTA PEDIDA` y confirma el pago.
3. El cobro responde de inmediato con `token_digital` y estado `generando`.
4. Obtén el token del comprobante más reciente:

   ```powershell
   docker compose exec -T db psql -U saas_admin -d restaurantcloud_db -c "SELECT serie, correlativo, token_qr, created_at FROM comprobante ORDER BY created_at DESC LIMIT 1;"
   ```

5. Abre `http://localhost:5173/c/{token_qr}`. La información fiscal debe
   mostrarse desde la API. La descarga es el paso aún pendiente: cuando se
   corrija, el botón descargará el archivo desde Laravel y MinIO no expondrá
   su clave de objeto al navegador.

### Diferencia entre la vista web y el PDF

Es esperado que tengan una presentación distinta. La vista `/c/{token_qr}` es
una página React pensada para consulta en pantalla; el PDF se genera en el
worker desde una plantilla de servidor pensada para archivar, imprimir o
compartir. Ambos deben coincidir en los datos fiscales inmutables: emisor,
cliente, serie/correlativo, ítems, cantidades, precios, impuestos, total y
medio de pago. Si alguno de esos valores difiere, se debe tratar como un error
funcional, no como una diferencia visual.

## Diagnóstico

Logs del worker:

```powershell
docker compose logs -f queue
```

Eventos Outbox:

```powershell
docker compose exec -T db psql -U saas_admin -d restaurantcloud_db -c "SELECT estado, intentos, agregado_id, ultimo_error, created_at FROM outbox_event ORDER BY created_at DESC LIMIT 10;"
```

Archivos PDF registrados:

```powershell
docker compose exec -T db psql -U saas_admin -d restaurantcloud_db -c "SELECT nombre_original, mime_type, tamanio_bytes, sha256, estado FROM archivo WHERE entidad_tipo = 'comprobante_pdf' ORDER BY created_at DESC LIMIT 5;"
```

Si queda en generación, confirma que `queue` y `scheduler` estén `Up`, revisa
los logs y reintenta el envío de eventos pendientes:

```powershell
docker compose exec api php artisan outbox:despachar-comprobantes
```

La generación es idempotente: al reintentar no debe duplicar un PDF ya
disponible.

## Pendiente de CU-CAJA-03B

- Corregir y comprobar de extremo a extremo el streaming/descarga pública del
  PDF. La prueba directa del cliente S3 puede leer el objeto, pero la ruta
  pública debe validarse con el navegador antes de cerrar el caso de uso.
- Integrar el resultado real en el modal de Caja: actualmente recibe
  `token_digital`, pero en modo API real todavía muestra el estado pendiente y
  se cierra tras confirmar el pago. Debe usar ese token para mostrar el QR y
  el enlace público cuando el documento esté disponible.

## Pendiente posterior

Esta entrega genera PDF interno y MinIO privado. XML fiscal/SUNAT,
WhatsApp/correo, reproceso visual y SSE real permanecen para una siguiente
fase.
