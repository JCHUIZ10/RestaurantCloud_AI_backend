#!/usr/bin/env bash
set -euo pipefail

RAIZ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$RAIZ_DIR/.env"
COMPOSE_FILE="$RAIZ_DIR/docker-compose.prod.yml"
CONFIRMAR=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --si)
      CONFIRMAR=0
      shift
      ;;
    -h|--help)
      echo "Uso: ./scripts/qa-reiniciar.sh [--env-file RUTA] [--si]"
      exit 0
      ;;
    *)
      echo "Argumento no reconocido: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: no existe $ENV_FILE. Ejecuta primero ./scripts/generar-env.sh qa" >&2
  exit 1
fi

if [[ "$CONFIRMAR" -eq 1 ]]; then
  read -r -p "Esto eliminará los contenedores y volúmenes de QA para recrearlos desde cero. ¿Continuar? [s/N]: " resp
  case "$resp" in
    s|S|si|SI|y|Y) ;;
    *)
      echo "Operación cancelada."
      exit 0
      ;;
  esac
fi

echo "Bajando entorno QA y eliminando volúmenes..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans

echo "Levantando entorno QA..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "Preparando datos de demostración..."
"$(dirname "${BASH_SOURCE[0]}")/qa-preparar.sh" --env-file "$ENV_FILE"
