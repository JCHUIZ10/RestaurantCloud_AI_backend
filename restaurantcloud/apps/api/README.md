# RestaurantCloud API

API Laravel modular (ver `../README.md` para la estructura general). Este documento cubre el esquema de base de datos y la suite de tests.

## Esquema de base de datos

Las migraciones de Laravel son la **única fuente de verdad** del esquema. Todo cambio de tablas, índices, políticas RLS, vistas o funciones entra como una migración nueva.

- `database/sql/01…09_*.sql`: esquema canónico al 2026-11-02 (antes `infra/sql`, que cargaba `docker-entrypoint-initdb.d`).
- `database/migrations/2026_11_02_021504_crear_esquema_base.php`: ejecuta 01–06, 08 y 09 sobre una BD vacía. Si la BD ya tiene el esquema (creada antes con initdb), solo se registra como aplicada.
- Las migraciones posteriores aplican cambios incrementales y deben funcionar tanto en BDs nuevas como existentes (`IF NOT EXISTS`, `CREATE OR REPLACE`).
- `06_seed_initial_data.sql` (planes, Admin SaaS) y `09_seed_ubigeo_peru.sql` (catálogo nacional UBIGEO de 25 departamentos, 196 provincias y 1,891 distritos) son parte del esquema base porque toda instalación los necesita. `07_seed_local_aurea_completo.sql` es solo demo y lo carga `LocalAureaDemoSeeder`.

No edites los archivos de `database/sql` para cambiar una BD existente: no se vuelven a ejecutar. Se mantienen como referencia legible del esquema base.

### Flujo habitual

```bash
# Nuevo cambio de esquema
docker exec saas_laravel_api php artisan make:migration agregar_x_a_tabla --no-interaction
docker exec saas_laravel_api php artisan migrate

# Datos demo del local ÁUREA (desarrollo)
docker exec saas_laravel_api php artisan db:seed --force
```

El contenedor `api` ejecuta `php artisan migrate --force` en cada arranque (`infra/docker/entrypoint.sh`).

### Verificar que no hay deriva

```bash
./scripts/schema-check.sh                       # compara restaurantcloud_db
./scripts/schema-check.sh restaurantcloud_test  # o cualquier otra BD
```

Migra una BD temporal desde cero y compara su `pg_dump --schema-only` con la BD indicada. Sale con código 1 si difieren.

## Tests

La suite corre contra `restaurantcloud_test` y el bucket `restaurantcloud-test`, nunca contra los datos de desarrollo:

- `phpunit.xml` usa `<server>` (no `<env>`) porque el contenedor ya define esas variables en `$_SERVER`, que Laravel lee primero.
- `tests/TestCase.php` envuelve cada test en una transacción que se revierte; los tests deben preparar sus propios datos y no depender de lo que deje otro test.

```bash
./scripts/test-db-reset.sh                       # tras cambiar migraciones o semillas
docker exec saas_laravel_api php artisan test
```
