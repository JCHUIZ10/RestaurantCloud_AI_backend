#!/bin/bash
set -e

cd /app

if [ ! -f .env ]; then
    echo "Copiando .env.example a .env..."
    cp .env.example .env
fi

if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
    echo "Instalando dependencias de Composer..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
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

echo "PostgreSQL listo. Iniciando servidor Laravel en el puerto 8080..."
exec php artisan serve --host=0.0.0.0 --port=8080
