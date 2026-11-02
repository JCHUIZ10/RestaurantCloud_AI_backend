#!/usr/bin/env bash
# Recrea la base de datos exclusiva de la suite de tests (restaurantcloud_test)
# con las migraciones y la semilla demo (php artisan migrate --seed),
# y asegura el bucket MinIO de tests.
# Uso:
#   ./test-db-reset.sh
# Requiere los contenedores saas_postgres_db y saas_laravel_api en ejecución.

set -euo pipefail

DB_CONTAINER="saas_postgres_db"
API_CONTAINER="saas_laravel_api"
DB_USER="saas_admin"
TEST_DB="restaurantcloud_test"
TEST_BUCKET="restaurantcloud-test"

echo "[RestaurantCloud] Recreando base de datos $TEST_DB..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q \
    -c "DROP DATABASE IF EXISTS $TEST_DB WITH (FORCE);" \
    -c "CREATE DATABASE $TEST_DB;"

# Salvaguarda: migrate --seed purga los datos demo del local Áurea; nunca debe tocar otra BD
conectada="$(docker exec -e DB_DATABASE="$TEST_DB" "$API_CONTAINER" php artisan tinker --execute='echo DB::connection()->getDatabaseName();')"
if [ "$conectada" != "$TEST_DB" ]; then
    echo "[RestaurantCloud] La API apunta a '$conectada' y no a $TEST_DB; se aborta." >&2
    exit 1
fi

echo "[RestaurantCloud] Aplicando migraciones y semilla demo..."
docker exec -e DB_DATABASE="$TEST_DB" "$API_CONTAINER" php artisan migrate --seed --force --no-interaction > /dev/null

echo "[RestaurantCloud] Asegurando bucket MinIO $TEST_BUCKET..."
# Misma política que minio-init (mc anonymous set download .../catalogo): lectura pública del catálogo
docker exec "$API_CONTAINER" php artisan tinker --execute="
    \$s3 = Storage::disk('s3')->getClient();
    if (! \$s3->doesBucketExist('$TEST_BUCKET')) { \$s3->createBucket(['Bucket' => '$TEST_BUCKET']); }
    \$s3->putBucketPolicy(['Bucket' => '$TEST_BUCKET', 'Policy' => json_encode([
        'Version' => '2012-10-17',
        'Statement' => [[
            'Effect' => 'Allow',
            'Principal' => ['AWS' => ['*']],
            'Action' => ['s3:GetObject'],
            'Resource' => ['arn:aws:s3:::$TEST_BUCKET/catalogo*'],
        ]],
    ])]);
" > /dev/null

echo "[RestaurantCloud] Base de datos de tests lista."
