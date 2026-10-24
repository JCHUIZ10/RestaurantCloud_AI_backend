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
        echo "PostgreSQL listo. Iniciando API Laravel en el puerto 8080..."
        exec php artisan serve --host=0.0.0.0 --port=8080
        ;;
    queue)
        echo "PostgreSQL listo. Iniciando worker de documentos..."
        exec php artisan queue:work redis --queue=documentos --tries=3 --timeout=120 --sleep=1
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
