#!/usr/bin/env bash
# Verifica que el esquema real de una BD coincide con el que producen las migraciones.
# Crea una BD temporal, la migra desde cero y compara el catálogo de ambas (ver scripts/schema-catalogo.sql).
# Uso:
#   ./schema-check.sh                  -> compara restaurantcloud_db
#   ./schema-check.sh <base_de_datos>  -> compara la BD indicada
# Sale con código 1 si hay diferencias (las imprime).
# Requiere los contenedores restaurantcloudIA_db y restaurantcloudIA_api en ejecución.

set -euo pipefail

DB_CONTAINER="restaurantcloudIA_db"
API_CONTAINER="restaurantcloudIA_api"
DB_USER="saas_admin"
TARGET_DB="${1:-restaurantcloud_db}"
REF_DB="restaurantcloud_schema_ref"

# Se compara el catálogo de PostgreSQL (columnas, restricciones, índices, disparadores, funciones, vistas,
# políticas RLS y secuencias) y no el pg_dump: una base migrada tiene las columnas nuevas al final de la
# tabla y una base creada desde los scripts las tiene en su sitio, y eso no es una diferencia de esquema.
volcar_esquema() {
    docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$1" -At < "$(dirname "$0")/schema-catalogo.sql"
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
