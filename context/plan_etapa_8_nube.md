# Plan: etapa 8, despliegue (primera parte: entorno para testers)

## Contexto

La hoja de ruta asigna a la etapa 8 la imagen de la API con el código dentro, Artifact Registry, la VM con todo el sistema, ms-pronóstico en Cloud Run y el laboratorio de GKE. **La prioridad ahora es otra:** que los compañeros testeadores prueben el sistema completo en su propia PC. Esta primera parte deja listo todo lo que producción también necesita, sin subir nada a la nube todavía.

Hoy no se puede entregar el proyecto a otra persona:

- `docker-compose.prod.yml` es el del monolito de la Unidad I: no tiene Kong, ni ms-analítica, ms-pronóstico y ms-notificaciones, ni sus tres bases.
- `infra/docker/api.Dockerfile` no lleva el código: `api`, `queue` y `scheduler` montan `./apps/api` y hacen `composer install` al arrancar. Una imagen así no se puede subir a un registro.
- El `Caddyfile` manda `/api/*` directo a Laravel, sin pasar por Kong.
- El `.env` local tiene 52 variables armadas a mano a lo largo de las etapas, incluidas las claves JWT y tres secretos de firma que deben coincidir entre servicios.
- El modelo publicado (`model-ia/repositorio/`) no se versiona; sin él ms-pronóstico solo usa el baseline.
- Los contenedores de desarrollo montan carpetas del repositorio (contratos, `model-ia`) que no existen fuera de él.

Resultado esperado: un tester clona el repositorio, ejecuta **un solo comando** y en `http://localhost` tiene el sistema completo con ÁUREA, 24 meses de historial, el modelo real y una cuenta por rol. Si ensucia los datos, otro comando lo deja como nuevo. Las mismas imágenes y el mismo compose sirven después para producción, cambiando solo el `.env`.

## Decisiones (acordadas el 25/11)

- **Cada tester lo ejecuta en su PC** con Docker Desktop. Las imágenes se construyen allí desde el repositorio; **no se usa Artifact Registry todavía**.
- **Datos:** ÁUREA con los 24 meses sintéticos hasta ayer, el modelo vigente y una cuenta por rol, más un comando para reiniciar.
- **Manual de Artifact Registry** que explica, imagen por imagen, cómo etiquetarla y subirla y qué hace cada comando. Se ejecutará más adelante.
- **El plan de subida a producción** (VM, dominio, Cloud Run, GKE) se documenta al final de la etapa, no ahora.

**Decisiones que fija este plan (a confirmar):**

- **Un solo compose para QA y producción.** `docker-compose.prod.yml` pasa a describir el sistema completo. Lo que cambia entre ambos va en el `.env`: dominio, secretos, `OCTANE_WORKERS`, datos de demostración y correo. Así, cada prueba de un tester también prueba lo que irá a producción.
- **QA en `http://localhost`, sin TLS.** Con `localhost`, Caddy usaría su autoridad interna y el navegador mostraría un aviso de certificado. La dirección del sitio pasa a ser una variable: `SITIO=http://localhost` en QA y el dominio en producción, donde Caddy obtiene el certificado solo. `SESSION_SECURE_COOKIE` también sale del `.env`.
- **Camino de una petición:** navegador → Caddy (SPA y TLS) → Kong → núcleo o microservicio. Solo Caddy publica puertos. Kong deja de publicar el 8000 y Caddy no confía en el `X-Forwarded-For` que manda el cliente; esto cierra en producción el hueco que encontró la 6.4.
- **El modelo de la demostración vive en Cloud Storage (`gs://rc-modelos-demo-aurea`).** En lugar de versionar `model-ia/repositorio-demo/` en Git, se subió únicamente el modelo vigente de ÁUREA (~2,73 MB) a un bucket de demostración con lectura pública (`MODELOS_GCS_ANONIMO=true` en QA; en producción `ms-pronóstico` usará un bucket privado vía IAM en Cloud Run). Así, las imágenes de 8.1 no montan carpetas del repositorio.
- **Correo de QA con Mailpit** (solo en QA, perfil de compose): los correos de activación e invitación se ven en `http://localhost:8025`, sin configurar SMTP. Así los testers pueden probar también el registro de una empresa nueva.
- **Nombres:** el compose de despliegue deja de fijar `container_name` y usa el nombre de proyecto `restaurantcloud`. Los volúmenes ya se nombran por proyecto, no por contenedor, así que el servidor de la Unidad I no perdería sus datos. Se comprueba antes de cambiarlo, porque era el riesgo anotado en el plan general. Los scripts de humo reciben el prefijo de los contenedores como parámetro.

## Pasos

| Paso | Contenido | Demostrable |
|---|---|---|
| 8.0 Plan | Este documento | Decisiones aprobadas |
| 8.A Scripts SQL | Los scripts de `database/sql` reflejan el estado final del esquema; las 18 migraciones absorbidas se retiran; se elimina `snapshot_stock_diario` | Una base nueva queda igual que una migrada (`schema-check.sh`) |
| 8.B Correos | Envío real de los correos de activación e invitación, con Mailpit en QA | Registrar una empresa y recibir el correo en `localhost:8025` |
| 8.C Modelo en GCS | Adaptador `AlmacenGcs` (`gs://`) en `ms-pronóstico` y bucket demo `rc-modelos-demo-aurea` | `ms-pronóstico` descarga y verifica el modelo vigente desde `gs://` (cerrada) |
| 8.1 Imágenes | API con el código dentro; web apuntando a Kong y con el paquete partido; versión en cada imagen | Las imágenes arrancan sin montar carpetas del repositorio (cerrada) |
| 8.2 Compose de despliegue | Sistema completo en `docker-compose.prod.yml`, Caddy delante de Kong, solo Caddy publica puertos | `http://localhost` funciona con el compose nuevo (cerrada) |
| 8.3 Configuración | Script que genera el `.env` con secretos aleatorios y claves JWT; ejemplos de QA y de producción | Un `.env` nuevo de cero, sin copiar nada a mano |
| 8.4 Datos de demostración | Seed, historial sintético hasta ayer, modelo vigente, cuentas por rol; comandos para preparar y reiniciar | ÁUREA con predicción nivel 3 en una base recién creada |
| 8.5 Instalación en Windows | Comando único (`.ps1` y `.sh`), requisitos, finales de línea, consumo de memoria | Clon limpio en otra carpeta → sistema arriba con un comando |
| 8.6 Verificación | Los cuatro humos contra el compose de despliegue | Mismas comprobaciones en verde que en desarrollo |
| 8.7 Guía para testers | Instalar, entrar, qué probar por rol y cómo reportar un fallo | Documento listo para enviar |
| 8.8 Manual de Artifact Registry | Cada imagen: qué contiene, cómo se construye, se etiqueta y se sube, y qué hace cada comando | Manual listo, sin ejecutar |
| 8.9 Cierre de esta parte | `plan_seguimiento.md` y las fichas | Entorno de testers entregado |

**Después de esta parte** (y antes del plan de producción): VM, Cloud Run (con bucket privado IAM) y laboratorio de GKE.

### 8.1 Imágenes autocontenidas (cerrada 25/11)

- **`api.Dockerfile` en etapas (`base`, `dev`, `builder`, `prod`):** `builder` ejecuta `composer install --no-dev` + `dump-autoload --classmap-authoritative` + `package:discover` + `octane:install` y `prod` copia el código, `vendor/` y `frankenphp-worker.php` sin `composer` ni dependencias de desarrollo, fijando `DB_CONNECTION=pgsql` y los valores base de Laravel. El compose de desarrollo usa `target: dev` montando `./apps/api`, para no perder la recarga en caliente.
- **`entrypoint.sh`:** diferenciado por `APP_RUNTIME` (`prod` vs `dev`). En `prod` no ejecuta `composer install` ni copia `.env.example`, exige `APP_KEY` obligatoria (detiene el contenedor con error claro si falta), aplica `migrate --force` solo en `api`, y ejecuta `config:cache`, `route:cache` y `event:cache` al arrancar.
- **Versiones fijadas:** FrankenPHP fijado a `v1.13.5` (con soporte `x86_64`/`aarch64`), Node fijado a `22.23.3-alpine`, Caddy a `2.8.4-alpine` y MinIO fijado al digest verificado `cgr.dev/chainguard/minio@sha256:dc455cdd4db6e390b1b26514f15ff37681a777bf8dab41aac445a0259f751e56` (`RELEASE.2026-09-22T19-25-18Z`).
- **`web.Dockerfile` y `Caddyfile`:** `Caddyfile` envía `/api/*` y `/up` a `kong:8000` (con `flush_interval -1` y `header_up X-Forwarded-For {remote_host}` para no confiar en cabeceras enviadas por el cliente). En `apps/web`, las rutas se cargaron con `React.lazy` + `<Suspense>` y `manualChunks` en `vite.config.ts`, reduciendo el chunk inicial de `3.453 kB` a `330,83 kB` (`91,58 kB` gzip) y separando Recharts (`424,76 kB`) y las pantallas de reportes y predicción.
- **Microservicios:** `analitica`, `pronostico` y `notificaciones` ya son autocontenidos sin montajes del repositorio fuera de pruebas.
- **Etiquetas OCI:** los cinco Dockerfiles (`api`, `web`, `analitica`, `pronostico`, `notificaciones`) incorporan `ARG APP_VERSION` y `ARG GIT_COMMIT` con `org.opencontainers.image.title`, `org.opencontainers.image.version` y `org.opencontainers.image.revision`.

### 8.2 Compose de despliegue (cerrada 25/11)

- **`docker-compose.prod.yml`:** renombrado con `name: restaurantcloud` y sin `container_name` (preserva los volúmenes `restaurantcloud_*` sin colisionar con desarrollo `restaurantcloudIA_*`). Incluye núcleo (`db`, `redis`, `minio`, `minio-init`, `api`, `queue`, `scheduler` con `target: prod`, `APP_KEY` obligatoria y `OCTANE_WORKERS=2` por defecto), los tres microservicios con sus bases y migraciones efímeras (`db-analitica`, `analitica`, `db-pronostico`, `pronostico`, `mongo-notificaciones`, `notificaciones`), `kong:3.9.1` (sin API de administración ni puertos publicados), `web` (Caddy `2.8.4-alpine`) y `mailpit` bajo `profiles: ["qa"]`.
- **Puertos:** solo `web` publica `80:80`, `443:443` y `443:443/udp` (HTTP/3 en producción; con `SITIO=http://localhost` en QA Caddy opera en HTTP plano sin certificados). `mailpit` (`127.0.0.1:8025`) y la consola de `minio` (`127.0.0.1:9001`) quedan restringidos a localhost; bases, Redis, Kong y microservicios no se exponen al host.
- **`Caddyfile`:** usa `{$SITIO}` como dirección principal y `{$FILES_DOMAIN:http://127.0.0.1:8090}` para producción. En QA enruta `/{$MINIO_DEFAULT_BUCKET:restaurantcloud}/*` hacia `minio:9000` (`header_up Host minio:9000`) porque `Storage::temporaryUrl()` de Laravel reemplaza solo esquema, host y puerto, conservando el prefijo del bucket. `.gitattributes` fija finales LF en `Caddyfile` y `entrypoint.sh`.
- **Salud y memoria:** `api` incorpora `healthcheck` sobre `/up` y `web` sobre `127.0.0.1:2019/config/`. Con límites `mem_limit` en todos los servicios (y `--wiredTigerCacheSizeGB 0.25` en MongoDB), la medición real con `docker stats --no-stream` sobre los 15 contenedores activos en QA dio **~1.035 MiB (~1,01 GiB)**, muy por debajo del umbral de 6 GB.
- **Verificado:** `config` en modos `prod` y `qa`; arranque limpio (`Exited (0)` en las 4 tareas efímeras y `healthy` en todos los servicios); `200` en `/`, `/up`, `/api/v1/auth/clave-publica`, Mailpit (`8025`) y consola MinIO (`9001`); `401`/`404` de Kong en rutas protegidas/internas; descarga pública y `temporaryUrl` de MinIO por `http://localhost/restaurantcloud/...`; y consulta interna de `ms-pronóstico` a `gs://rc-modelos-demo-aurea`.

### 8.3 Configuración y secretos

- **`scripts/generar-env.sh` (y `.ps1`):** escribe un `.env` completo para `qa` o `produccion`. Los secretos se generan al azar; las claves JWT, con `php artisan jwt:claves` dentro de la imagen de la API, así que no hace falta `openssl` en la PC del tester. Los tres secretos de firma quedan iguales en los dos lados de cada canal. Nunca sobrescribe un `.env` existente.
- **`.env.qa.example` y `.env.production.example`** con todas las variables, explicadas en grupos.
- **Validación al arrancar:** una variable obligatoria vacía detiene el compose (`${VAR:?}`) con su nombre, como ya hace el compose de producción.

### 8.4 Datos de demostración

- **Revisar primero** si las migraciones del núcleo aplican también el seed. El compose de producción dice que el esquema lo crean las migraciones, pero en desarrollo el seed entra por `initdb`.
- **`scripts/qa-preparar`:** espera a que todo esté sano, aplica el seed de ÁUREA, genera el historial sintético hasta ayer (unos 4 minutos, dentro del contenedor y sin internet) y comprueba que la predicción responde en nivel 3 con `metodo = modelo`.
- **`scripts/qa-reiniciar`:** baja el sistema con sus volúmenes y lo vuelve a preparar. Pide confirmación.
- **Historial que se vence:** si un tester deja el entorno armado varios días, `qa-preparar` completa los días que faltan con `generar --incremental`, como hace `smoke-pronostico.sh`.
- **Cuentas:** las del seed de ÁUREA, una por rol (propietario, administración, caja, mozo y cocina). Si falta alguna, se agrega solo con filas nuevas, como en la etapa 4.

### 8.5 Instalación en Windows

- **Un solo comando:** `scripts/qa.ps1 iniciar` (PowerShell) y `scripts/qa.sh iniciar` (Git Bash, macOS y Linux). Genera el `.env` si no existe, construye, levanta, prepara los datos y muestra la URL y las cuentas.
- **Finales de línea:** `.gitattributes` con LF para todos los `.sh`, `.lua` y archivos de configuración que entran en contenedores. Un clon con `core.autocrlf=true` no debe romper nada (ya pasó con Kong en la 6.4).
- **Comprobaciones previas:** Docker en marcha, Compose v2, memoria asignada a Docker y el puerto 80 libre. Un fallo se explica en lenguaje simple.
- **Prueba real:** un clon limpio en otra carpeta, sin `.env`, sin volúmenes y sin imágenes en caché.

### 8.6 Verificación

- **Los humos aceptan el prefijo de los contenedores** y entran por Caddy en lugar de por `localhost:8000`: `smoke-analitica`, `smoke-pronostico`, `smoke-gateway` y `smoke-notificaciones`, contra el compose de despliegue.
- **`X-Forwarded-For`:** un valor que manda el cliente ya no llega a Laravel como IP real.
- **Lo interno no se expone desde fuera:** ninguna base, Kong ni servicio responde en los puertos de la PC.

### 8.7 Guía para testers (`docs/guia-testers.md`)

Escrita para alguien que no conoce el código:

- Requisitos (Windows 10 u 11, Docker Desktop, RAM medida en la 8.2) e instalación paso a paso.
- Cómo entrar y la tabla de cuentas por rol.
- Qué probar en cada rol, con los casos de uso principales: POS y cobro, cocina y KDS, campana de avisos, reportes, predicción y reposición, cambio de plan.
- Cómo reportar un fallo: rol, pasos, qué se esperaba, qué pasó, hora, captura y el `X-Request-Id` (dónde verlo en el navegador).
- Reiniciar los datos, apagar y problemas comunes.

### 8.8 Manual de Artifact Registry (`docs/manual-artifact-registry.md`)

Para leerlo y ejecutarlo más adelante; en esta etapa no se ejecuta ningún comando de GCP.

- Qué es Artifact Registry, cuánto cuesta y la estructura del nombre: `REGION-docker.pkg.dev/PROYECTO/REPOSITORIO/IMAGEN:ETIQUETA`.
- Una sola vez: activar la API, crear el repositorio y autenticar Docker con `gcloud auth configure-docker`.
- **Una sección por imagen:** `api` (también la usan queue y scheduler), `web` (Caddy con la SPA), `analitica`, `pronostico` (con su contexto adicional `model_ia`), `notificaciones` y la decisión sobre Kong (imagen pública con la configuración montada, o una imagen propia con la plantilla dentro). En cada una: qué contiene, el comando de construcción, `docker tag`, `docker push`, cómo comprobar que subió y qué hace cada comando.
- Etiquetas: versión y commit, y por qué no basta con `latest`.
- Cómo pasa el compose de `build:` a `image:` con una variable `REGISTRO`, sin tocar el archivo.
- Limpieza de versiones viejas y errores comunes (permisos, región, arquitectura `amd64` si se construye en una Mac con ARM).

### 8.A Scripts SQL al estado final (25/11)

Antes de empaquetar nada conviene que crear la base sea simple: hasta hoy había que leer 9 scripts y 18 migraciones para saber cómo es el esquema. El servidor de la Unidad I se puede recrear, así que no hay bases que conservar.

- **Cómo se hizo:** se creó una base con el camino anterior (scripts más las 18 migraciones) y se guardó su catálogo de PostgreSQL como referencia; después se llevó cada cambio a los scripts hasta que una base creada solo con ellos quedó igual. La comparación es del catálogo (columnas, restricciones, índices, disparadores, funciones, vistas, políticas RLS y secuencias), no del `pg_dump`, porque una base migrada tiene las columnas nuevas al final y una nueva las tiene en su sitio.
- **Qué entró a los scripts:** el ciclo de facturación y el número de recibo, sin los campos de Stripe; los límites de los planes por sede (el seed 06 conservaba los valores viejos); la clasificación de fallos del outbox; `solicitud_pronostico` y `recomendacion_reposicion` con sus índices y su RLS; los índices de límites por sede y de los movimientos de caja; y la vista `v_pedido_anulacion_detalle`. Salen `incidente`, `incidente_bitacora`, `notificacion` y la columna `pedido_anulacion.incidente_id`.
- **`snapshot_stock_diario` se retira** (nadie la usaba). Una migración la elimina en las bases creadas antes; en una base nueva no hace nada. Es la única migración que queda además de la base.
- **Datos:** el seed de ÁUREA se carga igual en ambos caminos (mismo conteo en las 49 tablas) y los tres planes quedaron idénticos.
- **`scripts/schema-check.sh`** ahora compara ese catálogo (`scripts/schema-catalogo.sql`). Se comprobó que detecta una columna y un índice cambiados a propósito y que pasa sobre la base real.
- **Regla desde ahora:** cada cambio de esquema es una migración nueva (idempotente) y se refleja también en los scripts; `schema-check.sh` lo vigila.

### 8.B Correos de activación e invitación

Hoy no se envía ninguno: el enlace solo vuelve en la respuesta de la API, aunque el mensaje dice «Invitación enviada por correo». Quedó fuera de la 8.A y se detalla al llegar.

## Riesgos

- **Memoria en la PC del tester.** Son unos 17 contenedores. Si la medición de la 8.2 pasa de 6 GB, se bajan workers, `shared_buffers` y la memoria de Mongo en QA.
- **Tiempo de la primera construcción:** la imagen de ms-pronóstico pesa 768 MB y la del frontend compila todo. Se documenta el tiempo medido y la caché acelera las siguientes.
- **Cambiar `api.Dockerfile` afecta al desarrollo diario.** El destino `dev` mantiene el montaje del código; antes de cerrar la 8.1 se corren las suites afectadas y un humo con el compose de desarrollo.
- **El seed y las pruebas del núcleo:** la demostración solo agrega filas, nunca cambia valores existentes (regla de la etapa 4).

## Verificación final de esta parte

- Clon limpio → `qa.ps1 iniciar` → `http://localhost` con las cinco cuentas, predicción nivel 3, reportes con datos y un aviso en vivo en la campana.
- `qa-reiniciar` deja todo como recién instalado.
- Los cuatro humos en verde contra el compose de despliegue y el compose de desarrollo sin cambios en su comportamiento.
- Guía para testers y manual de Artifact Registry revisados por el usuario.
