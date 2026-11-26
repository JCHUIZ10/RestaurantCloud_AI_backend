#!/usr/bin/env bash
set -euo pipefail

RAIZ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$RAIZ_DIR/.env"
COMPOSE_FILE="$RAIZ_DIR/docker-compose.prod.yml"
LOCAL_AUREA="00000000-0000-4000-8000-000000000010"
EMPRESA_AUREA="00000000-0000-4000-8000-000000000001"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Uso: ./scripts/qa-preparar.sh [--env-file RUTA]"
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

dc() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

leer_env() {
  local clave="$1"
  local linea
  linea="$(grep -E "^${clave}=" "$ENV_FILE" | tail -n 1 || true)"
  echo "${linea#*=}" | tr -d '\r"'
}

POSTGRES_USER_VAL="$(leer_env POSTGRES_USER)"
POSTGRES_DB_VAL="$(leer_env POSTGRES_DB)"
ANALITICA_DB_USER_VAL="$(leer_env ANALITICA_DB_USER)"
ANALITICA_DB_NAME_VAL="$(leer_env ANALITICA_DB_NAME)"
SITIO_VAL="$(leer_env SITIO)"
SITIO_VAL="${SITIO_VAL:-http://localhost}"

echo "Esperando a que los servicios estén sanos..."
SERVICIOS=(db redis minio api db-analitica analitica db-pronostico pronostico mongo-notificaciones notificaciones kong web)
for _ in $(seq 1 60); do
  TODOS_OK=1
  for svc in "${SERVICIOS[@]}"; do
    cid="$(dc ps -q "$svc" 2>/dev/null || true)"
    if [[ -z "$cid" ]]; then
      TODOS_OK=0
      break
    fi
    estado="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo "missing")"
    if [[ "$estado" != "healthy" && "$estado" != "running" ]]; then
      TODOS_OK=0
      break
    fi
  done
  if [[ "$TODOS_OK" -eq 1 ]]; then
    break
  fi
  sleep 2
done

if [[ "${TODOS_OK:-0}" -ne 1 ]]; then
  echo "Error: tiempo de espera agotado esperando que todos los servicios estén sanos." >&2
  dc ps >&2
  exit 1
fi
echo "Servicios listos."

EXISTE_AUREA="$(dc exec -T db psql -U "$POSTGRES_USER_VAL" -d "$POSTGRES_DB_VAL" -tAc "SELECT COUNT(*) FROM local WHERE id = '$LOCAL_AUREA';")"
if [[ "$EXISTE_AUREA" -eq 0 ]]; then
  echo "Sembrando datos demo de ÁUREA..."
  dc exec -T api php artisan db:seed --class=LocalAureaDemoSeeder --force --no-interaction
else
  echo "Local ÁUREA ya existe; se conservan los datos actuales y se verifican las cuentas por rol..."
fi

# Garantiza que existan las 5 cuentas demo por rol sin tocar filas existentes.
dc exec -T db psql -U "$POSTGRES_USER_VAL" -d "$POSTGRES_DB_VAL" -v ON_ERROR_STOP=1 <<SQL >/dev/null
INSERT INTO usuario (id, empresa_id, local_id, nombre, correo, password_hash, telefono, rol, estado)
SELECT gen_random_uuid(), '$EMPRESA_AUREA', '$LOCAL_AUREA', v.nombre, v.correo, crypt(v.clave, gen_salt('bf', 12)), v.tel, v.rol, 'activo'
FROM (VALUES
  ('Rodrigo De Las Casas', 'propietario@aurea.local', 'propietario2026', '+51 900 000 101', 'propietario'),
  ('Valeria Mendoza',      'admin@aurea.local',       'admin-local2026', '+51 900 000 102', 'admin_local'),
  ('Lucía Quispe',         'cajero@aurea.local',      'cajero2026',      '+51 900 000 105', 'cajero'),
  ('Carlos Huamán',        'mozo@aurea.local',        'mozo2026',        '+51 900 000 103', 'mozo'),
  ('Roberto Vargas',       'cocina@aurea.local',      'cocina2026',      '+51 900 000 104', 'cocina')
) AS v(nombre, correo, clave, tel, rol)
WHERE NOT EXISTS (SELECT 1 FROM usuario u WHERE u.correo = v.correo);
SQL

AYER="$(dc exec -T db psql -U "$POSTGRES_USER_VAL" -d "$POSTGRES_DB_VAL" -tAc "SELECT ((now() at time zone 'America/Lima')::date - 1)::text;")"
ULTIMO_DIA="$(dc exec -T db-analitica psql -U "$ANALITICA_DB_USER_VAL" -d "$ANALITICA_DB_NAME_VAL" -tAc "SELECT COALESCE(max(fecha_operativa)::text, 'ninguno') FROM venta_diaria_producto WHERE local_id = '$LOCAL_AUREA';")"

if [[ "$ULTIMO_DIA" == "ninguno" || "$ULTIMO_DIA" < "$AYER" ]]; then
  echo "Generando historial sintético hasta $AYER (último día actual: $ULTIMO_DIA). Esto puede tomar ~4 minutos la primera vez..."
  dc exec -T api php artisan carta:exportar "$LOCAL_AUREA" \
    | dc exec -T analitica python -m app.sinteticos generar --carta - --incremental --perfil aurea_v1 --semilla 2026
else
  echo "Historial sintético al día hasta $ULTIMO_DIA."
fi

echo "Verificando pronóstico nivel 3 con metodo = modelo..."
LOGIN_JSON="$(curl -fsS -X POST "${SITIO_VAL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"correo":"admin@aurea.local","password":"admin-local2026"}')"

TOKEN="$(printf '%s' "$LOGIN_JSON" | dc exec -T api php -r '$d=json_decode(stream_get_contents(STDIN), true); echo $d["datos"]["token"] ?? $d["token"] ?? "";')"
if [[ -z "$TOKEN" ]]; then
  echo "Error: no se pudo obtener token de sesión para admin@aurea.local." >&2
  exit 1
fi

PRON_JSON="$(curl -fsS -X POST "${SITIO_VAL}/api/v1/admin/pronosticos" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"cobertura_dias":5}')"

printf '%s' "$PRON_JSON" | dc exec -T api php -r '
$d = json_decode(stream_get_contents(STDIN), true);
$p = $d["datos"] ?? null;
if (!is_array($p)) { fwrite(STDERR, "Respuesta inválida de pronósticos\n"); exit(1); }
$nivel = $p["nivel"] ?? null;
$preds = $p["pronostico"]["predicciones"] ?? [];
$noModelo = 0; $total = 0;
foreach ($preds as $pl) {
  foreach ($pl["dias"] ?? [] as $dia) {
    $total++;
    if (($dia["metodo"] ?? "") !== "modelo") { $noModelo++; }
  }
}
if ($nivel !== 3 || $total === 0 || $noModelo > 0) {
  fwrite(STDERR, "Pronóstico inesperado: nivel=" . var_export($nivel, true) . " filas={$total} no_modelo={$noModelo}\n");
  exit(1);
}
echo "OK: pronóstico en nivel {$nivel} con metodo=modelo ({$total} filas).\n";
'

cat <<EOF

Entorno QA listo en: ${SITIO_VAL}
Cuentas de demostración (ÁUREA):
  - Propietario    : propietario@aurea.local / propietario2026
  - Administración : admin@aurea.local       / admin-local2026
  - Caja           : cajero@aurea.local      / cajero2026
  - Mozo           : mozo@aurea.local        / mozo2026
  - Cocina         : cocina@aurea.local      / cocina2026
EOF
