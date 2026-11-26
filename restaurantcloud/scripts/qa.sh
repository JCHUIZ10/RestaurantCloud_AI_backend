#!/usr/bin/env bash
set -euo pipefail

ACCION="${1:-iniciar}"
RAIZ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$RAIZ_DIR/docker-compose.prod.yml"
ENV_FILE="$RAIZ_DIR/.env"

uso() {
  cat <<'EOF'
Uso: ./scripts/qa.sh [accion]

Acciones disponibles:
  iniciar    Comprueba requisitos, genera .env si falta, construye, levanta y prepara los datos demo (por defecto).
  detener    Detiene los contenedores de QA sin borrar los datos.
  estado     Muestra el estado actual de los contenedores de QA.
  preparar   Aplica seed/historial faltante y verifica el pronóstico en nivel 3.
  reiniciar  Borra los volúmenes de QA (con confirmación) y vuelve a levantar todo desde cero.
  ayuda      Muestra esta ayuda.
EOF
}

comprobar_requisitos() {
  echo "Comprobando requisitos previos..."

  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker no está instalado o no está en PATH. Instala Docker y vuelve a intentarlo." >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker no está en marcha o no responde. Abre Docker Desktop (o el servicio dockerd) y vuelve a intentarlo." >&2
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "Error: Docker Compose v2 no está disponible. Actualiza Docker a una versión reciente." >&2
    exit 1
  fi

  local mem_bytes mem_gib
  mem_bytes="$(docker info --format '{{.MemTotal}}' 2>/dev/null || echo 0)"
  if [[ "$mem_bytes" =~ ^[0-9]+$ ]] && [[ "$mem_bytes" -gt 0 ]]; then
    mem_gib="$(awk -v b="$mem_bytes" 'BEGIN { printf "%.2f", b / 1073741824 }')"
    if awk -v b="$mem_bytes" 'BEGIN { exit !(b < 3972844748) }'; then
      echo "Error: Docker solo tiene ${mem_gib} GiB de memoria asignada (se recomiendan al menos 4 GiB, ideal 6 GiB)." >&2
      echo "Aumenta la memoria en Docker Desktop (Settings -> Resources) o en ~/.wslconfig y reinicia Docker." >&2
      exit 1
    fi
    echo "  OK: Docker en marcha (${mem_gib} GiB disponibles)."
  fi

  local web_cid="" web_activo="false"
  web_cid="$(docker ps -q --filter "label=com.docker.compose.project=restaurantcloud" --filter "label=com.docker.compose.service=web" 2>/dev/null || true)"
  if [[ -n "$web_cid" ]]; then
    web_activo="true"
  fi

  if [[ "$web_activo" != "true" ]]; then
    local ocupado=0
    if command -v powershell.exe >/dev/null 2>&1; then
      if ! powershell.exe -NoProfile -Command 'try { $l=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any,80); $l.Start(); $l.Stop(); exit 0 } catch { exit 1 }' >/dev/null 2>&1; then
        ocupado=1
      fi
    elif command -v ss >/dev/null 2>&1; then
      ss -ltn 2>/dev/null | grep -qE '[:.]80[[:space:]]' && ocupado=1 || true
    elif command -v lsof >/dev/null 2>&1; then
      lsof -iTCP:80 -sTCP:LISTEN >/dev/null 2>&1 && ocupado=1 || true
    fi

    if [[ "$ocupado" -eq 1 ]]; then
      echo "Error: el puerto 80 ya está ocupado por otro programa (por ejemplo: el entorno de desarrollo, IIS, Apache o Nginx)." >&2
      echo "Detén ese servicio (si es desarrollo: 'docker compose down') y vuelve a intentarlo." >&2
      exit 1
    fi
    echo "  OK: Puerto 80 libre."
  else
    echo "  OK: Puerto 80 en uso por el contenedor web de QA actual."
  fi
}

case "$ACCION" in
  ayuda|-h|--help)
    uso
    exit 0
    ;;
  detener)
    [[ -f "$ENV_FILE" ]] || { echo "Error: no existe $ENV_FILE." >&2; exit 1; }
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    ;;
  estado)
    [[ -f "$ENV_FILE" ]] || { echo "Error: no existe $ENV_FILE." >&2; exit 1; }
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    ;;
  preparar)
    "$RAIZ_DIR/scripts/qa-preparar.sh"
    ;;
  reiniciar)
    "$RAIZ_DIR/scripts/qa-reiniciar.sh"
    ;;
  iniciar)
    comprobar_requisitos

    if [[ ! -f "$ENV_FILE" ]]; then
      echo "No existe .env: generando configuración inicial de QA..."
      "$RAIZ_DIR/scripts/generar-env.sh" qa
    else
      echo "Usando configuración existente: $ENV_FILE"
    fi

    echo "Construyendo y levantando servicios de QA..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

    "$RAIZ_DIR/scripts/qa-preparar.sh" --env-file "$ENV_FILE"
    ;;
  *)
    echo "Acción no reconocida: $ACCION" >&2
    uso >&2
    exit 1
    ;;
esac
