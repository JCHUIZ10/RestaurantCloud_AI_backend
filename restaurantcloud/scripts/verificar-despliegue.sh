#!/usr/bin/env bash
set -euo pipefail
export MSYS_NO_PATHCONV=1

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

URL_PUBLICA="${SMOKE_URL:-http://localhost}"
PROYECTO="${SMOKE_PROYECTO:-restaurantcloud}"
VERDE=$'\033[32m'; ROJO=$'\033[31m'; AMARILLO=$'\033[33m'; NEUTRO=$'\033[0m'
FALLOS=0

ok() { printf '  %s✔%s %s\n' "$VERDE" "$NEUTRO" "$1"; }
mal() { printf '  %s✘%s %s\n' "$ROJO" "$NEUTRO" "$1"; FALLOS=$((FALLOS + 1)); }

resolver() {
  docker ps -q --filter "label=com.docker.compose.project=${PROYECTO}" --filter "label=com.docker.compose.service=$1" | head -n 1
}

API_CID="$(resolver api)"
REDIS_CID="$(resolver redis)"
if [[ -z "$REDIS_CID" || -z "$API_CID" ]]; then
  echo "Error: el stack de despliegue '$PROYECTO' no está en ejecución." >&2
  exit 1
fi

printf '\n%s== 1. Verificación de aislamiento de puertos internos%s\n' "$AMARILLO" "$NEUTRO"
PUERTOS_INTERNOS=(5432 5433 5434 6379 8000 8001 8002 8003 8080 9000 27017)
for p in "${PUERTOS_INTERNOS[@]}"; do
  if (echo >/dev/tcp/127.0.0.1/"$p") >/dev/null 2>&1; then
    mal "El puerto interno $p responde en 127.0.0.1 (debería estar cerrado)"
  else
    ok "Puerto interno $p cerrado desde el host"
  fi
done

printf '\n%s== 2. Verificación de X-Forwarded-For (Caddy sobrescribe IP del cliente)%s\n' "$AMARILLO" "$NEUTRO"
CORREO_XFF="prueba-xff-$(date +%s)@aurea.local"
HASH_XFF="$(docker exec "$API_CID" php -r "echo md5('${CORREO_XFF}');")"
curl -s -X POST "${URL_PUBLICA}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'X-Forwarded-For: 198.51.100.77' \
  -d "{\"correo\":\"${CORREO_XFF}\",\"password\":\"clave-invalida\"}" >/dev/null

REDIS_PASS="$(docker exec "$API_CID" printenv REDIS_PASSWORD | tr -d '\r')"
CLAVES_XFF="$(docker exec "$REDIS_CID" redis-cli -a "$REDIS_PASS" --no-auth-warning KEYS "*auth:intentos:*:${HASH_XFF}" 2>/dev/null | tr -d '\r')"
if [[ -z "$CLAVES_XFF" ]]; then
  mal "No se registró la clave auth:intentos en Redis al probar X-Forwarded-For"
elif echo "$CLAVES_XFF" | grep -q '198\.51\.100\.77'; then
  mal "Laravel recibió la IP falsificada 198.51.100.77 ($CLAVES_XFF)"
else
  ok "Caddy sobrescribió X-Forwarded-For; Laravel vio la IP real del proxy ($CLAVES_XFF)"
fi
for k in $CLAVES_XFF; do
  docker exec "$REDIS_CID" redis-cli -a "$REDIS_PASS" --no-auth-warning DEL "$k" >/dev/null 2>&1 || true
done

printf '\n%s== 3. Ejecutando los 4 scripts de humo en modo --despliegue%s\n' "$AMARILLO" "$NEUTRO"
for script in smoke-pronostico.sh smoke-gateway.sh smoke-analitica.sh smoke-notificaciones.sh; do
  printf '\n%s--- %s --despliegue ---%s\n' "$AMARILLO" "$script" "$NEUTRO"
  if ! "$RAIZ/scripts/$script" --despliegue --sin-evidencias; then
    FALLOS=$((FALLOS + 1))
  fi
done

printf '\n'
if [[ "$FALLOS" -gt 0 ]]; then
  printf '%sVerificación de despliegue FALLÓ (%d fallos).%s\n' "$ROJO" "$FALLOS" "$NEUTRO"
  exit 1
fi
printf '%sVerificación de despliegue COMPLETA EN VERDE.%s\n' "$VERDE" "$NEUTRO"
