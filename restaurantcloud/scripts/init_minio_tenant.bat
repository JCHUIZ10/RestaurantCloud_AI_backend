@echo off
REM Inicializa el espacio de almacenamiento MinIO para la empresa de prueba AUREA o un tenant especifico
REM Uso:
REM   init_minio_tenant.bat          -> Inicializa la empresa de prueba (Aurea) solo si no esta registrada
REM   init_minio_tenant.bat <UUID>   -> Inicializa una empresa especifica
REM   init_minio_tenant.bat --all    -> Inicializa todas las empresas pendientes

if "%~1"=="" (
    echo [RestaurantCloud] Inicializando espacio MinIO para la empresa de prueba AUREA...
    docker exec saas_laravel_api php artisan tenant:init-storage --test
) else if "%~1"=="--all" (
    echo [RestaurantCloud] Inicializando espacio MinIO para todas las empresas pendientes...
    docker exec saas_laravel_api php artisan tenant:init-storage --all
) else (
    echo [RestaurantCloud] Inicializando espacio MinIO para empresa %1...
    docker exec saas_laravel_api php artisan tenant:init-storage %1
)
