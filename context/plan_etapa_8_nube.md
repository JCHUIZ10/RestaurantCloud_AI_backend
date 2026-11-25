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
- **El modelo de la demostración se versiona.** Solo el vigente de ÁUREA (2,7 MB, con su ficha y su puntero) se copia a `model-ia/repositorio-demo/`. Es una excepción documentada a D-22: el repositorio completo sigue fuera de git, y en producción el modelo vendrá de Cloud Storage.
- **Correo de QA con Mailpit** (solo en QA, perfil de compose): los correos de activación e invitación se ven en `http://localhost:8025`, sin configurar SMTP. Así los testers pueden probar también el registro de una empresa nueva.
- **Nombres:** el compose de despliegue deja de fijar `container_name` y usa el nombre de proyecto `restaurantcloud`. Los volúmenes ya se nombran por proyecto, no por contenedor, así que el servidor de la Unidad I no perdería sus datos. Se comprueba antes de cambiarlo, porque era el riesgo anotado en el plan general. Los scripts de humo reciben el prefijo de los contenedores como parámetro.

## Pasos

| Paso | Contenido | Demostrable |
|---|---|---|
| 8.0 Plan | Este documento | Decisiones aprobadas |
| 8.1 Imágenes | API con el código dentro; web apuntando a Kong y con el paquete partido; versión en cada imagen | Las imágenes arrancan sin montar carpetas del repositorio |
| 8.2 Compose de despliegue | Sistema completo en `docker-compose.prod.yml`, Caddy delante de Kong, solo Caddy publica puertos | `http://localhost` funciona con el compose nuevo |
| 8.3 Configuración | Script que genera el `.env` con secretos aleatorios y claves JWT; ejemplos de QA y de producción | Un `.env` nuevo de cero, sin copiar nada a mano |
| 8.4 Datos de demostración | Seed, historial sintético hasta ayer, modelo vigente, cuentas por rol; comandos para preparar y reiniciar | ÁUREA con predicción nivel 3 en una base recién creada |
| 8.5 Instalación en Windows | Comando único (`.ps1` y `.sh`), requisitos, finales de línea, consumo de memoria | Clon limpio en otra carpeta → sistema arriba con un comando |
| 8.6 Verificación | Los cuatro humos contra el compose de despliegue | Mismas comprobaciones en verde que en desarrollo |
| 8.7 Guía para testers | Instalar, entrar, qué probar por rol y cómo reportar un fallo | Documento listo para enviar |
| 8.8 Manual de Artifact Registry | Cada imagen: qué contiene, cómo se construye, se etiqueta y se sube, y qué hace cada comando | Manual listo, sin ejecutar |
| 8.9 Cierre de esta parte | `plan_seguimiento.md` y las fichas | Entorno de testers entregado |

**Después de esta parte** (y antes del plan de producción): adaptador `gs://` de ms-pronóstico, VM, Cloud Run y laboratorio de GKE.

### 8.1 Imágenes autocontenidas

- **`api.Dockerfile` en dos etapas:** la primera hace `composer install --no-dev --optimize-autoloader` y la segunda copia el código y `vendor/`. `api`, `queue` y `scheduler` usan la misma imagen sin montar carpetas. El compose de desarrollo sigue montando el código, con un destino `dev` del mismo Dockerfile, para no perder la recarga en caliente.
- **`entrypoint.sh`:** sin `composer install` ni la copia de `.env.example` en la imagen de despliegue. `APP_KEY` es obligatoria y, si falta, el contenedor se detiene con un mensaje claro. `config:cache`, `route:cache` y `event:cache` al arrancar. Solo `api` migra, como hoy.
- **Versiones fijadas:** hoy FrankenPHP baja `latest` y MinIO usa `:latest`. Se fijan, igual que Kong (3.9.1) y Node (22.23.3).
- **`web.Dockerfile`:** el Caddyfile envía `/api` a Kong. Recharts y las pantallas de reportes y predicción se cargan aparte (`lazy`), lo que resuelve el aviso de tamaño que quedó de la 6.5.
- **Microservicios:** ya son autocontenidos. Se revisa que ninguno dependa de un montaje del repositorio fuera de las pruebas. Los contratos se montan solo en desarrollo, como dice Pendientes.
- **Etiqueta de versión** en cada imagen (`org.opencontainers.image.version` y `revision` con el commit), para saber después qué se subió a Artifact Registry.

### 8.2 Compose de despliegue

- Los servicios de desarrollo (db, redis, minio, api, queue, scheduler, las tres bases, sus migraciones, los tres servicios y Kong) más Caddy y Mailpit (perfil `qa`).
- **Puertos:** solo Caddy (80, y 443 en producción) y Mailpit (8025, en QA). Las bases, Redis, MinIO, Kong y los servicios no se publican; la consola de MinIO queda en `127.0.0.1`, como hoy.
- **Caddy:** `{$SITIO}` como dirección, `/api/*` a Kong con `flush_interval -1` (necesario para el SSE de notificaciones y del KDS) y la SPA en `/`. Los archivos de MinIO se sirven en una ruta del mismo sitio en QA y con su propio dominio en producción.
- **Kong:** CORS con el origen del sitio. Cuando la SPA y la API comparten origen el CORS no se usa, pero se deja bien configurado.
- **Recursos:** límites de memoria por servicio y `OCTANE_WORKERS=2` en QA. Con `docker stats` se mide cuánta RAM pide el sistema completo y ese número va a la guía.
- **Salud:** cada servicio tiene su `healthcheck` y Caddy espera a Kong.

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
