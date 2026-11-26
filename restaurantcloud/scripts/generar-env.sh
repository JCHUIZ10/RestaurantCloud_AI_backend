#!/usr/bin/env bash
set -euo pipefail

MODO="qa"
SITIO_ARG=""
FILES_DOMAIN_ARG=""
SALIDA=""

uso() {
  cat <<'EOF'
Uso: ./scripts/generar-env.sh [qa|produccion] [--sitio URL] [--files-domain HOST] [--salida RUTA]

Genera un archivo .env completo con secretos aleatorios y claves RSA JWT
generadas dentro de la imagen de la API (sin requerir openssl en el equipo).
Nunca sobrescribe un archivo .env existente.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    qa|produccion)
      MODO="$1"
      shift
      ;;
    --sitio)
      SITIO_ARG="${2:-}"
      shift 2
      ;;
    --files-domain)
      FILES_DOMAIN_ARG="${2:-}"
      shift 2
      ;;
    --salida)
      SALIDA="${2:-}"
      shift 2
      ;;
    -h|--help)
      uso
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $1" >&2
      uso >&2
      exit 1
      ;;
  esac
done

RAIZ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SALIDA="${SALIDA:-$RAIZ_DIR/.env}"

if [[ -e "$SALIDA" ]]; then
  echo "Error: ya existe $SALIDA. Este script nunca sobrescribe un .env existente." >&2
  echo "Si deseas regenerarlo, respalda o elimina primero ese archivo." >&2
  exit 1
fi

if [[ "$MODO" == "qa" ]]; then
  PLANTILLA="$RAIZ_DIR/.env.qa.example"
else
  PLANTILLA="$RAIZ_DIR/.env.production.example"
fi

if [[ ! -f "$PLANTILLA" ]]; then
  echo "Error: no se encontró la plantilla $PLANTILLA" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no está instalado o no está en PATH." >&2
  exit 1
fi

hex_aleatorio() {
  local bytes="${1:-24}"
  od -An -N "$bytes" -tx1 /dev/urandom | tr -d ' \n'
}

app_key_aleatoria() {
  local b64
  b64="$(head -c 32 /dev/urandom | base64 | tr -d '\r\n')"
  echo "base64:$b64"
}

echo "Construyendo o reutilizando imagen de API para generar claves JWT..."
DOCKER_RAIZ="$RAIZ_DIR"
if command -v cygpath >/dev/null 2>&1; then
  DOCKER_RAIZ="$(cygpath -w "$RAIZ_DIR")"
fi
IMAGEN_API="restaurantcloud-api:prod"
docker build -q -f "${DOCKER_RAIZ}/infra/docker/api.Dockerfile" --target prod -t "$IMAGEN_API" "$DOCKER_RAIZ" >/dev/null

JWT_SALIDA="$(docker run --rm --entrypoint php "$IMAGEN_API" artisan jwt:claves | tr -d '\r')"
JWT_PRIV_LINE="$(printf '%s\n' "$JWT_SALIDA" | grep '^JWT_PRIVATE_KEY=' | head -n 1 || true)"
JWT_PUB_LINE="$(printf '%s\n' "$JWT_SALIDA" | grep '^JWT_PUBLIC_KEY=' | head -n 1 || true)"

if [[ -z "$JWT_PRIV_LINE" || -z "$JWT_PUB_LINE" ]]; then
  echo "Error: no se pudieron generar las claves JWT desde php artisan jwt:claves." >&2
  exit 1
fi

APP_KEY_VAL="$(app_key_aleatoria)"
POSTGRES_PASSWORD_VAL="$(hex_aleatorio 24)"
REDIS_PASSWORD_VAL="$(hex_aleatorio 24)"
MINIO_ROOT_PASSWORD_VAL="$(hex_aleatorio 24)"
ANALITICA_DB_PASSWORD_VAL="$(hex_aleatorio 24)"
ANALITICA_DB_APP_PASSWORD_VAL="$(hex_aleatorio 24)"
ANALITICA_SECRETO_VAL="$(hex_aleatorio 32)"
PRONOSTICO_DB_PASSWORD_VAL="$(hex_aleatorio 24)"
PRONOSTICO_DB_APP_PASSWORD_VAL="$(hex_aleatorio 24)"
PRONOSTICO_SECRETO_VAL="$(hex_aleatorio 32)"
NOTIFICACIONES_MONGO_PASSWORD_VAL="$(hex_aleatorio 24)"
NOTIFICACIONES_MONGO_APP_PASSWORD_VAL="$(hex_aleatorio 24)"
NOTIFICACIONES_SECRETO_VAL="$(hex_aleatorio 32)"

TMP_ENV="$(mktemp "${SALIDA}.tmp.XXXXXX")"
trap 'rm -f "$TMP_ENV"' EXIT

while IFS= read -r linea || [[ -n "$linea" ]]; do
  case "$linea" in
    APP_KEY=*) echo "APP_KEY=$APP_KEY_VAL" ;;
    JWT_PRIVATE_KEY=*) echo "$JWT_PRIV_LINE" ;;
    JWT_PUBLIC_KEY=*) echo "$JWT_PUB_LINE" ;;
    POSTGRES_PASSWORD=*) echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD_VAL" ;;
    REDIS_PASSWORD=*) echo "REDIS_PASSWORD=$REDIS_PASSWORD_VAL" ;;
    MINIO_ROOT_PASSWORD=*) echo "MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD_VAL" ;;
    ANALITICA_DB_PASSWORD=*) echo "ANALITICA_DB_PASSWORD=$ANALITICA_DB_PASSWORD_VAL" ;;
    ANALITICA_DB_APP_PASSWORD=*) echo "ANALITICA_DB_APP_PASSWORD=$ANALITICA_DB_APP_PASSWORD_VAL" ;;
    ANALITICA_SECRETO=*) echo "ANALITICA_SECRETO=$ANALITICA_SECRETO_VAL" ;;
    PRONOSTICO_DB_PASSWORD=*) echo "PRONOSTICO_DB_PASSWORD=$PRONOSTICO_DB_PASSWORD_VAL" ;;
    PRONOSTICO_DB_APP_PASSWORD=*) echo "PRONOSTICO_DB_APP_PASSWORD=$PRONOSTICO_DB_APP_PASSWORD_VAL" ;;
    PRONOSTICO_SECRETO=*) echo "PRONOSTICO_SECRETO=$PRONOSTICO_SECRETO_VAL" ;;
    NOTIFICACIONES_MONGO_PASSWORD=*) echo "NOTIFICACIONES_MONGO_PASSWORD=$NOTIFICACIONES_MONGO_PASSWORD_VAL" ;;
    NOTIFICACIONES_MONGO_APP_PASSWORD=*) echo "NOTIFICACIONES_MONGO_APP_PASSWORD=$NOTIFICACIONES_MONGO_APP_PASSWORD_VAL" ;;
    NOTIFICACIONES_SECRETO=*) echo "NOTIFICACIONES_SECRETO=$NOTIFICACIONES_SECRETO_VAL" ;;
    SITIO=*)
      if [[ -n "$SITIO_ARG" ]]; then echo "SITIO=$SITIO_ARG"; else echo "$linea"; fi
      ;;
    APP_URL=*)
      if [[ -n "$SITIO_ARG" ]]; then echo "APP_URL=$SITIO_ARG"; else echo "$linea"; fi
      ;;
    FRONTEND_URL=*)
      if [[ -n "$SITIO_ARG" ]]; then echo "FRONTEND_URL=$SITIO_ARG"; else echo "$linea"; fi
      ;;
    KONG_CORS_ORIGENES=*)
      if [[ -n "$SITIO_ARG" ]]; then echo "KONG_CORS_ORIGENES=$SITIO_ARG"; else echo "$linea"; fi
      ;;
    FILES_DOMAIN=*)
      if [[ -n "$FILES_DOMAIN_ARG" ]]; then echo "FILES_DOMAIN=$FILES_DOMAIN_ARG"; else echo "$linea"; fi
      ;;
    AWS_URL=*)
      if [[ -n "$FILES_DOMAIN_ARG" ]]; then
        echo "AWS_URL=https://${FILES_DOMAIN_ARG}/restaurantcloud"
      else
        echo "$linea"
      fi
      ;;
    AWS_TEMPORARY_URL=*)
      if [[ -n "$FILES_DOMAIN_ARG" ]]; then
        echo "AWS_TEMPORARY_URL=https://${FILES_DOMAIN_ARG}"
      else
        echo "$linea"
      fi
      ;;
    *) echo "$linea" ;;
  esac
done < "$PLANTILLA" > "$TMP_ENV"

mv "$TMP_ENV" "$SALIDA"
chmod 600 "$SALIDA" 2>/dev/null || true

echo "Archivo generado correctamente: $SALIDA (modo: $MODO)"
if [[ "$MODO" == "produccion" ]]; then
  echo "Recuerda revisar SITIO, FILES_DOMAIN, SMTP y credenciales externas (STRIPE_*, APIDEV_TOKEN) si aplican."
fi
