#!/usr/bin/env bash
# Inicializa el espacio de almacenamiento MinIO para la empresa de prueba ÁUREA o un tenant específico
# Uso:
#   ./init_minio_tenant.sh          -> Inicializa la empresa de prueba (Áurea) solo si no está registrada
#   ./init_minio_tenant.sh <UUID>   -> Inicializa una empresa específica
#   ./init_minio_tenant.sh --all    -> Inicializa todas las empresas pendientes

set -e

if [ -z "$1" ]; then
    echo "[RestaurantCloud] Inicializando espacio MinIO para la empresa de prueba ÁUREA..."
    docker exec saas_laravel_api php artisan tenant:init-storage --test
elif [ "$1" == "--all" ]; then
    echo "[RestaurantCloud] Inicializando espacio MinIO para todas las empresas pendientes..."
    docker exec saas_laravel_api php artisan tenant:init-storage --all
else
    echo "[RestaurantCloud] Inicializando espacio MinIO para empresa $1..."
    docker exec saas_laravel_api php artisan tenant:init-storage "$1"
fi
