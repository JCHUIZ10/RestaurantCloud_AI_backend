#!/usr/bin/env bash
# Verifica que el esquema real de una BD coincide con el que producen las migraciones.
# Crea una BD temporal, la migra desde cero y compara ambos pg_dump --schema-only.
# Uso:
#   ./schema-check.sh                  -> compara restaurantcloud_db
#   ./schema-check.sh <base_de_datos>  -> compara la BD indicada
# Sale con código 1 si hay diferencias (las imprime).
# Requiere los contenedores saas_postgres_db y saas_laravel_api en ejecución.

set -euo pipefail

DB_CONTAINER="saas_postgres_db"
API_CONTAINER="saas_laravel_api"
DB_USER="saas_admin"
TARGET_DB="${1:-restaurantcloud_db}"
REF_DB="restaurantcloud_schema_ref"

volcar_esquema() {
    # Las líneas \restrict/\unrestrict llevan un token aleatorio en cada volcado
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$1" --schema-only --no-owner --no-privileges \
        | grep -vE '^.(un)?restrict '
}

echo "[RestaurantCloud] Migrando BD de referencia $REF_DB desde cero..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q \
    -c "DROP DATABASE IF EXISTS $REF_DB WITH (FORCE);" \
    -c "CREATE DATABASE $REF_DB;"
docker exec -e DB_DATABASE="$REF_DB" "$API_CONTAINER" php artisan migrate --force --no-interaction > /dev/null

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"; docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -q -c "DROP DATABASE IF EXISTS $REF_DB WITH (FORCE);" > /dev/null' EXIT

volcar_esquema "$REF_DB" > "$tmp/esperado.sql"
volcar_esquema "$TARGET_DB" > "$tmp/real.sql"

if diff -u "$tmp/esperado.sql" "$tmp/real.sql"; then
    echo "[RestaurantCloud] El esquema de $TARGET_DB coincide con las migraciones."
else
    echo "[RestaurantCloud] El esquema de $TARGET_DB difiere de las migraciones (arriba: - esperado, + real)." >&2
    exit 1
fi
