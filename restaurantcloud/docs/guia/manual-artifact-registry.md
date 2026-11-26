# Manual de Artifact Registry — RestaurantCloud AI (ÁUREA)

Este manual documenta paso a paso cómo construir, etiquetar y publicar las imágenes de contenedor de **RestaurantCloud AI** en **Google Cloud Artifact Registry** para su futuro despliegue en la nube (VM, Cloud Run o GKE).

> [!NOTE]
> Este documento es de referencia para ejecutarse más adelante al preparar infraestructura en GCP. **No requiere ejecutar ningún comando contra GCP durante el desarrollo o QA local.**

---

## 1. ¿Qué es Artifact Registry, cuánto cuesta y cómo se nombran las imágenes?

**Artifact Registry** es el registro privado de contenedores e artefactos de Google Cloud (sucesor de Container Registry). Almacena las imágenes Docker ya compiladas para que cualquier VM, servicio de Cloud Run o clúster de GKE pueda descargarlas rápidamente usando IAM, sin tener que compilar código en el servidor de producción.

### Costos orientativos
- **Capa gratuita:** los primeros **0,5 GB/mes** de almacenamiento son gratuitos.
- **Almacenamiento:** aproximadamente **USD 0,10 por GB/mes** adicional (tarifa estándar). Con las 5 imágenes propias de RestaurantCloud AI (~1,5–2 GB en total con versiones recientes), el costo base ronda menos de **USD 0,20/mes**.
- **Tráfico de red:** las descargas dentro de la **misma región** de GCP (por ejemplo, repositorio en `southamerica-west1` o `us-central1` consumido por una VM/Cloud Run en esa misma región) no tienen costo de egress. Descargar hacia fuera de GCP o entre regiones sí genera cargos de red, por lo que **conviene crear el repositorio en la misma región donde vivirán tus servidores**.

### Estructura del nombre de una imagen
```text
REGION-docker.pkg.dev/PROYECTO/REPOSITORIO/IMAGEN:ETIQUETA
```

Ejemplo completo:
```text
us-central1-docker.pkg.dev/mi-proyecto-gcp/restaurantcloud/api:v1.0.0-a1b2c3d
```

Para usar variables de shell consistentes en todo este manual:

```bash
export REGION="us-central1"                 # Cambia por tu región elegida (ej. southamerica-west1)
export PROYECTO="mi-proyecto-gcp"           # ID real del proyecto en GCP
export REPO="restaurantcloud"
export REGISTRO="${REGION}-docker.pkg.dev/${PROYECTO}/${REPO}"

export APP_VERSION="v1.0.0"
export GIT_COMMIT="$(git rev-parse --short HEAD)"
export ETIQUETA="${APP_VERSION}-${GIT_COMMIT}"
```

---

## 2. Configuración inicial en GCP (una sola vez)

Ejecuta estos comandos una única vez desde la carpeta raíz del proyecto en una terminal con **Google Cloud CLI (`gcloud`)** autenticado (`gcloud auth login` y `gcloud config set project "$PROYECTO"`):

1. **Activar la API de Artifact Registry:**
   ```bash
   gcloud services enable artifactregistry.googleapis.com
   ```
   *Qué hace:* habilita el servicio de Artifact Registry en el proyecto de GCP.

2. **Crear el repositorio Docker:**
   ```bash
   gcloud artifacts repositories create "$REPO" \
     --repository-format=docker \
     --location="$REGION" \
     --description="Imágenes de despliegue de RestaurantCloud AI"
   ```
   *Qué hace:* crea el repositorio privado en la región elegida donde se guardarán todas las imágenes.

3. **Autenticar Docker local contra el registro:**
   ```bash
   gcloud auth configure-docker "${REGION}-docker.pkg.dev"
   ```
   *Qué hace:* registra el helper de credenciales de `gcloud` en `~/.docker/config.json` para que `docker push` y `docker pull` usen tu sesión de Google Cloud sin contraseñas manuales.

---

## 3. Etiquetas: versión y commit (por qué no basta con `latest`)

Cada publicación debe usar una etiqueta inmutable compuesta por **versión + hash corto de commit** (por ejemplo, `v1.0.0-a1b2c3d`):

- **Por qué no usar solo `latest`:**
  1. `latest` se sobrescribe en cada subida: si una versión nueva falla en producción, **no sabes qué imagen funcionaba antes ni puedes hacer rollback exacto**.
  2. Servicios como Cloud Run o GKE cachean imágenes por etiqueta; reusar `:latest` puede hacer que distintos nodos corran builds distintos sin aviso.
  3. Los Dockerfiles de este proyecto aceptan `ARG APP_VERSION` y `ARG GIT_COMMIT`, grabándolos como metadatos OCI (`org.opencontainers.image.version` y `org.opencontainers.image.revision`) dentro de cada imagen.

---

## 4. Construcción, etiquetado y subida por imagen

Todos los comandos siguientes asumen que estás ubicado dentro de la carpeta `restaurantcloud/`. Si construyes desde una **Mac con Apple Silicon (ARM)** para servidores Linux **`x86_64`**, añade `--platform linux/amd64` en `docker build` (ver sección 7).

---

### 4.1 `api` *(usada también por `queue` y `scheduler`)*

- **Qué contiene:** PHP 8.3 Alpine + FrankenPHP/Octane, extensiones PHP del núcleo, dependencias Composer de producción (`--no-dev`), código fuente de `apps/api` embebido (`target: prod` en `infra/docker/api.Dockerfile`) y entrypoint `infra/docker/entrypoint.sh`. En tiempo de ejecución cambia de comportamiento según `CONTAINER_ROLE` (`api`, `queue` o `scheduler`).

- **Construir:**
  ```bash
  docker build \
    -f ./infra/docker/api.Dockerfile \
    --target prod \
    --build-arg APP_VERSION="$APP_VERSION" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    -t restaurantcloud-api:local \
    .
  ```
  *Qué hace:* compila la etapa `prod` autocontenida del backend Laravel tomando `restaurantcloud/` como contexto e incrustando versión y commit.

- **Etiquetar:**
  ```bash
  docker tag restaurantcloud-api:local "${REGISTRO}/api:${ETIQUETA}"
  ```
  *Qué hace:* asocia la imagen local con la ruta completa en Artifact Registry (sin duplicar capas en disco).

- **Subir:**
  ```bash
  docker push "${REGISTRO}/api:${ETIQUETA}"
  ```
  *Qué hace:* envía las capas faltantes y el manifiesto de la imagen hacia GCP.

- **Comprobar que subió:**
  ```bash
  gcloud artifacts docker tags list "${REGISTRO}/api"
  ```
  *Qué hace:* lista las etiquetas publicadas en Artifact Registry para `api` y confirma que `${ETIQUETA}` figura registrada.

---

### 4.2 `web` *(Caddy + SPA React/Vite)*

- **Qué contiene:** etapa de compilación en Node (`apps/web`) con `VITE_USE_REAL_API=true` y `VITE_STRIPE_PUBLIC_KEY`, más imagen final `caddy:2.8.4-alpine` con el `Caddyfile` (`infra/caddy/Caddyfile`) y los archivos estáticos compilados en `/srv`. **Nota:** `VITE_STRIPE_PUBLIC_KEY` queda horneada en el bundle estático al momento del build.

- **Construir:**
  ```bash
  docker build \
    -f ./infra/docker/web.Dockerfile \
    --build-arg VITE_USE_REAL_API="true" \
    --build-arg VITE_STRIPE_PUBLIC_KEY="${STRIPE_KEY:-}" \
    --build-arg APP_VERSION="$APP_VERSION" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    -t restaurantcloud-web:local \
    .
  ```
  *Qué hace:* compila la SPA de React/Vite e empaqueta sus assets dentro del servidor Caddy listo para HTTPS automático o HTTP local.

- **Etiquetar:**
  ```bash
  docker tag restaurantcloud-web:local "${REGISTRO}/web:${ETIQUETA}"
  ```

- **Subir:**
  ```bash
  docker push "${REGISTRO}/web:${ETIQUETA}"
  ```

- **Comprobar que subió:**
  ```bash
  gcloud artifacts docker tags list "${REGISTRO}/web"
  ```

---

### 4.3 `analitica` *(usada también por `analitica-migraciones`)*

- **Qué contiene:** Python 3.12 slim, entorno virtual `.venv` compilado con `uv sync --frozen --no-dev` (sin `uv` ni compiladores en la imagen final), `alembic.ini`, carpeta `migrations/` y aplicación FastAPI/uvicorn (`app/`) bajo usuario sin privilegios `analitica`. Ejecuta el servidor FastAPI por defecto o `alembic upgrade head` cuando se invoca en `analitica-migraciones`.

- **Construir:**
  ```bash
  docker build \
    -f ./services/analitica/Dockerfile \
    --build-arg APP_VERSION="$APP_VERSION" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    -t restaurantcloud-analitica:local \
    ./services/analitica
  ```
  *Qué hace:* construye el servicio `ms-analítica` desde su propio subdirectorio como contexto.

- **Etiquetar:**
  ```bash
  docker tag restaurantcloud-analitica:local "${REGISTRO}/analitica:${ETIQUETA}"
  ```

- **Subir:**
  ```bash
  docker push "${REGISTRO}/analitica:${ETIQUETA}"
  ```

- **Comprobar que subió:**
  ```bash
  gcloud artifacts docker tags list "${REGISTRO}/analitica"
  ```

---

### 4.4 `pronostico` *(usada también por `pronostico-migraciones`, con contexto adicional `model_ia`)*

- **Qué contiene:** Python 3.12 slim, `.venv` instalado con `uv sync --frozen --no-dev` que **incluye el paquete compartido `rc_pronostico`** proveniente de `../model-ia/rc_pronostico`, además de `alembic.ini`, `migrations/` y `app/` bajo usuario no-root `pronostico`.
- **Requisito especial:** como `uv.lock` referencia `../../../model-ia/rc_pronostico`, el `Dockerfile` espera un contexto nombrado **`model_ia`** apuntando a `../model-ia` (fuera de `restaurantcloud/`).

- **Construir:**
  ```bash
  docker build \
    -f ./services/pronostico/Dockerfile \
    --build-context model_ia=../model-ia \
    --build-arg APP_VERSION="$APP_VERSION" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    -t restaurantcloud-pronostico:local \
    ./services/pronostico
  ```
  *Qué hace:* pasa `./services/pronostico` como contexto principal e inyecta `../model-ia` como el contexto nombrado `model_ia` que replica `docker-compose.prod.yml`. Requiere BuildKit activo (estándar en Docker moderno).

- **Etiquetar:**
  ```bash
  docker tag restaurantcloud-pronostico:local "${REGISTRO}/pronostico:${ETIQUETA}"
  ```

- **Subir:**
  ```bash
  docker push "${REGISTRO}/pronostico:${ETIQUETA}"
  ```

- **Comprobar que subió:**
  ```bash
  gcloud artifacts docker tags list "${REGISTRO}/pronostico"
  ```

---

### 4.5 `notificaciones` *(usada también por `notificaciones-migraciones`)*

- **Qué contiene:** Node `22.23.3-alpine`, artefacto TypeScript compilado en `dist/`, dependencias de producción (`node_modules` tras `npm prune --omit=dev`) y `package.json`, corriendo bajo el usuario sin privilegios `node`. Ejecuta el servidor Fastify (`node dist/main.js`) o el script de índices Mongo (`node dist/migraciones/indices.js`) en `notificaciones-migraciones`.

- **Construir:**
  ```bash
  docker build \
    -f ./services/notificaciones/Dockerfile \
    --build-arg APP_VERSION="$APP_VERSION" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    -t restaurantcloud-notificaciones:local \
    ./services/notificaciones
  ```
  *Qué hace:* compila el microservicio de notificaciones en TypeScript y descarta devDependencies en la imagen final.

- **Etiquetar:**
  ```bash
  docker tag restaurantcloud-notificaciones:local "${REGISTRO}/notificaciones:${ETIQUETA}"
  ```

- **Subir:**
  ```bash
  docker push "${REGISTRO}/notificaciones:${ETIQUETA}"
  ```

- **Comprobar que subió:**
  ```bash
  gcloud artifacts docker tags list "${REGISTRO}/notificaciones"
  ```

---

### 4.6 Decisión sobre `kong` *(imagen pública con configuración montada vs. imagen propia)*

En `docker-compose.prod.yml`, `kong` usa la imagen oficial `kong:3.9.1` con `./infra/kong:/kong-config:ro` montado como volumen (contiene `arrancar.sh`, `generar-config.lua` y `kong.yml.plantilla`). Al llevar el sistema a GCP hay dos caminos claros:

| Opción | Cómo funciona | Cuándo conviene |
|---|---|---|
| **Opción A — Imagen pública + volumen montado** *(actual en `docker-compose.prod.yml`)* | Usa `kong:3.9.1` directo de Docker Hub y monta `./infra/kong` en el servidor. | Despliegues en **una VM con Docker Compose** donde el repo o `infra/kong/` está presente en disco. Evita mantener un Dockerfile adicional. |
| **Opción B — Imagen propia con `infra/kong` embebido** | Se crea una imagen mínima `FROM kong:3.9.1` que copia `infra/kong/` a `/kong-config`, fija `ENTRYPOINT ["/bin/sh", "/kong-config/arrancar.sh"]` y se sube a `${REGISTRO}/kong:${ETIQUETA}`. | Despliegues en **Cloud Run, GKE o VM sin código en disco**, donde cada contenedor debe ser 100 % autocontenido sin montar carpetas del host. |

Si eliges la **Opción B** al pasar a Cloud Run/GKE, el archivo mínimo sería:
```dockerfile
FROM kong:3.9.1
COPY --chmod=0755 ./infra/kong/arrancar.sh /kong-config/arrancar.sh
COPY --chmod=0644 ./infra/kong/generar-config.lua /kong-config/generar-config.lua
COPY --chmod=0644 ./infra/kong/kong.yml.plantilla /kong-config/kong.yml.plantilla
ENTRYPOINT ["/bin/sh", "/kong-config/arrancar.sh"]
```
Y se construye/sube igual que el resto:
```bash
docker build -f <Dockerfile.kong> -t restaurantcloud-kong:local .
docker tag restaurantcloud-kong:local "${REGISTRO}/kong:${ETIQUETA}"
docker push "${REGISTRO}/kong:${ETIQUETA}"
```

---

## 5. Pasar el Compose de `build:` a `image:` con `REGISTRO` (sin tocar `docker-compose.prod.yml`)

Para desplegar en una VM usando las imágenes ya subidas sin modificar `docker-compose.prod.yml`, se combina con un **archivo override** (por ejemplo `docker-compose.registro.yml` junto al compose en el servidor) que inyecta `${REGISTRO}` y `${ETIQUETA}` en los servicios propios:

```yaml
# docker-compose.registro.yml (override en servidor para usar Artifact Registry)
services:
  api:
    image: ${REGISTRO:?REGISTRO requerido}/api:${ETIQUETA:?ETIQUETA requerida}
  queue:
    image: ${REGISTRO}/api:${ETIQUETA}
  scheduler:
    image: ${REGISTRO}/api:${ETIQUETA}
  analitica-migraciones:
    image: ${REGISTRO}/analitica:${ETIQUETA}
  analitica:
    image: ${REGISTRO}/analitica:${ETIQUETA}
  pronostico-migraciones:
    image: ${REGISTRO}/pronostico:${ETIQUETA}
  pronostico:
    image: ${REGISTRO}/pronostico:${ETIQUETA}
  notificaciones-migraciones:
    image: ${REGISTRO}/notificaciones:${ETIQUETA}
  notificaciones:
    image: ${REGISTRO}/notificaciones:${ETIQUETA}
  web:
    image: ${REGISTRO}/web:${ETIQUETA}
```

Uso en el servidor (sin compilar nada en producción):
```bash
export REGISTRO="us-central1-docker.pkg.dev/mi-proyecto-gcp/restaurantcloud"
export ETIQUETA="v1.0.0-a1b2c3d"

docker compose -f docker-compose.prod.yml -f docker-compose.registro.yml pull
docker compose -f docker-compose.prod.yml -f docker-compose.registro.yml up -d --no-build
```
- `pull` descarga todas las imágenes desde `${REGISTRO}`.
- `up -d --no-build` levanta los contenedores usando exactamente esas imágenes preconstruidas, sin ejecutar ningún `build:` y sin haber editado `docker-compose.prod.yml`.

---

## 6. Limpieza de versiones viejas

Para evitar que el costo de almacenamiento crezca indefinidamente con builds antiguos:

- **Eliminar una etiqueta puntual manualmente:**
  ```bash
  gcloud artifacts docker images delete "${REGISTRO}/api:${ETIQUETA_VIEJA}" --delete-tags --quiet
  ```
- **Política automática de retención (recomendada):** configurar una política en el repositorio para conservar solo las últimas **N** versiones etiquetadas (por ejemplo, conservar las 5 más recientes de cada imagen y eliminar etiquetas más antiguas de 30 días):
  ```bash
  gcloud artifacts repositories set-cleanup-policies "$REPO" \
    --location="$REGION" \
    --policy=politica-limpieza.json
  ```
  Ejemplo de `politica-limpieza.json`:
  ```json
  [
    {
      "name": "conservar-ultimas-5",
      "action": { "type": "Keep" },
      "mostRecentVersions": { "keepCount": 5 }
    },
    {
      "name": "borrar-antiguas-30d",
      "action": { "type": "Delete" },
      "condition": { "olderThan": "2592000s" }
    }
  ]
  ```

---

## 7. Errores comunes y cómo resolverlos

- **Error de permisos (`denied: Permission "artifactregistry.repositories.uploadArtifacts" denied`):**
  - El usuario o cuenta de servicio necesita el rol **`roles/artifactregistry.writer`** para subir imágenes (`push`), y la VM / Cloud Run / GKE necesita **`roles/artifactregistry.reader`** para descargarlas (`pull`).
  - Verifica también que ejecutaste `gcloud auth configure-docker "${REGION}-docker.pkg.dev"` con el **mismo prefijo regional** del `REGISTRO`.

- **Región equivocada o `Repository not found`:**
  - La parte inicial de `${REGISTRO}` (`us-central1-docker.pkg.dev`) debe coincidir exactamente con el `--location` usado al crear el repositorio en GCP. Si creaste el repo en `southamerica-west1`, `us-central1-docker.pkg.dev/...` fallará.

- **Error `exec format error` al arrancar en la VM/nube (construcción desde Mac Apple Silicon / ARM64):**
  - Si construiste la imagen en una Mac M1/M2/M3/M4, `docker build` genera arquitectura `linux/arm64` por defecto, pero la mayoría de VMs y Cloud Run corren `linux/amd64`.
  - Construye siempre para nube especificando `--platform linux/amd64` (usando Buildx si publicas directo o construyes cross-platform):
    ```bash
    docker buildx build --platform linux/amd64 --load ...
    ```
  - Para `pronostico`, recuerda mantener `--build-context model_ia=../model-ia`.

- **Error `model_ia: not found` al construir `pronostico`:**
  - Ocurre cuando se corre `docker build ./services/pronostico` sin `--build-context model_ia=../model-ia`. Revisa que exista la carpeta `../model-ia/rc_pronostico` al nivel hermano de `restaurantcloud/` y pasa siempre `--build-context model_ia=../model-ia`.
