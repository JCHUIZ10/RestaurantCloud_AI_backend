#!/bin/bash
set -e

cd /app

ROLE="${CONTAINER_ROLE:-api}"

if [ ! -f .env ]; then
    echo "Copiando .env.example a .env..."
    cp .env.example .env
fi

if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
    if [ "$ROLE" = "api" ]; then
        echo "Instalando dependencias de Composer..."
        composer install --no-interaction --prefer-dist --optimize-autoloader
    else
        echo "Esperando que la API instale las dependencias de Composer..."
        until [ -f vendor/autoload.php ]; do
            sleep 2
        done
    fi
fi

if grep -q "APP_KEY=$" .env || grep -q "APP_KEY= " .env; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

echo "Esperando que PostgreSQL esté listo..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" > /dev/null 2>&1; do
    echo "PostgreSQL no está listo aún, esperando 2 segundos..."
    sleep 2
done

case "$ROLE" in
    api)
        SERVER="${APP_SERVER:-octane}"
        if [ "$SERVER" = "octane" ] && command -v frankenphp > /dev/null 2>&1; then
            echo "PostgreSQL listo. Iniciando API Laravel con Octane (FrankenPHP) en el puerto 8080 (Workers: ${OCTANE_WORKERS:-2})..."
            if [ ! -f public/frankenphp-worker.php ]; then
                php artisan octane:install --server=frankenphp --no-interaction || true
            fi
            exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=8080 --workers=${OCTANE_WORKERS:-2} --max-requests=500
        else
            echo "PostgreSQL listo. Iniciando API Laravel con servidor embebido en el puerto 8080..."
            exec php artisan serve --host=0.0.0.0 --port=8080
        fi
        ;;
    queue)
        echo "PostgreSQL listo. Iniciando worker de documentos con phpredis..."
        exec php artisan queue:work redis --queue=documentos --tries=3 --timeout=120 --sleep=1 --memory=256
        ;;
    scheduler)
        echo "PostgreSQL listo. Iniciando scheduler de Laravel..."
        exec php artisan schedule:work
        ;;
    *)
        echo "CONTAINER_ROLE no reconocido: ${CONTAINER_ROLE}" >&2
        exit 1
        ;;
esac
