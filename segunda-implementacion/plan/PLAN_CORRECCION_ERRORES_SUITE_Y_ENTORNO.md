# Plan de corrección: fallos de la suite backend y deuda del entorno

**Fecha:** 2026-11-01 · **Rama:** `betta` · **Estado de partida:** 50 tests fallidos / 181 aprobados (231 en total)

Los 50 fallos existen también en el código previo a la integración de fotos de la carta (verificado con `git stash`); ninguno lo introdujo ese trabajo.

---

## 0. Diagnóstico resumido

| Grupo | Causa raíz | Tests afectados | Etapa |
|---|---|---|---|
| A | Falta la columna `pedido_item.stock_descontado` en la BD | 41 | 1 |
| B | Datos semilla borrados por tests (promoción `…441`, proveedor `…411`) | 4 | 3 |
| C | Cuota del plan excedida por datos acumulados (209 pisos / 348 mesas vs. tope 6 / 60) | 4 | 3 |
| D | `PlanoMesasTest`: devuelve `ERR_CAJA_NO_ABIERTA` en vez de `ERR_MESA_NO_DISPONIBLE` | 1 | 4 |

Hallazgos transversales (no rompen tests hoy, pero originan B y C o son riesgo de producto):

- Los tests apuntan a la **BD de desarrollo real** (`DB_DATABASE=restaurantcloud_db` en `phpunit.xml`) y casi ninguno usa transacciones (solo `PlanoMesasTest` usa `DatabaseTransactions`).
- Los `<env>` de `phpunit.xml` **no pisan** variables ya definidas en el contenedor (falta `force="true"`): los tests usan Redis real como caché.
- **Dos fuentes de verdad del esquema:** `infra/sql/*.sql` (montado en `docker-entrypoint-initdb.d`) y `apps/api/database/migrations` (19 migraciones que nunca se ejecutaron: no existe la tabla `migrations`).
- **RLS inefectivo:** la API conecta como `saas_admin` (superusuario con `BYPASSRLS`).
- `phpunit.xml` versiona claves de Stripe de prueba.

---

## Etapa 1: columna `stock_descontado` (Grupo A)

**Objetivo:** recuperar hasta 41 tests y eliminar los 500 en rutas de descuento de insumos (despacho directo, transiciones de cocina, mermas).

1. Confirmar la definición exacta en `apps/api/database/migrations/2026_10_21_000003_create_fn_inventario_produccion_kds.php` (línea 14) y todos sus usos (`grep stock_descontado` en `infra/sql`, `app/`, `database/`).
2. Añadir la columna a `pedido_item` en `infra/sql/02_schema_ddl.sql`, con el mismo tipo y valor por defecto que la migración (`BOOLEAN NOT NULL DEFAULT false`), para que las BDs nuevas nazcan correctas.
3. Aplicar en la BD actual, sin recrear el volumen:
   ```sql
   ALTER TABLE pedido_item ADD COLUMN IF NOT EXISTS stock_descontado BOOLEAN NOT NULL DEFAULT false;
   ```
4. Verificar que las funciones de `08_inventory_functions.sql` cargadas en la BD coinciden con las de la migración (si la migración redefine funciones, comparar con `\df+` y reaplicar las que difieran).
5. `php artisan octane:reload` y volver a correr las 8 suites afectadas: MozoAnulacionAuditoria, MozoMesasUnion, MozoCoreOperativo, MermasYNotaCreditoStock, CocinaComandasTransiciones, CocinaStockDeduccion, CocinaDisponibilidadQuiebres, CocinaConsolidadoTandas.

**Criterio de salida:** ningún error `column "stock_descontado" … does not exist`. Los fallos que aparezcan ahora (antes ocultos porque las suites morían en la preparación) se registran como fallos nuevos para la Etapa 4.

**Riesgo:** bajo. El `ALTER` es aditivo e idempotente.

---

## Etapa 2: aislar los tests de la BD de desarrollo

**Objetivo:** que la suite deje de contaminar los datos con que trabajas y que sea repetible. Es requisito para que la Etapa 3 no se deshaga en la siguiente ejecución.

1. `phpunit.xml`: añadir `force="true"` a todos los `<env>` (al menos `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION`, `DB_*`).
2. Crear una BD exclusiva de tests, `restaurantcloud_test`, en el mismo contenedor Postgres:
   - script `scripts/test-db-reset.sh` que haga `DROP/CREATE DATABASE restaurantcloud_test` y cargue `infra/sql/01…08` en orden (misma fuente que la BD de desarrollo).
   - apuntar `DB_DATABASE` de `phpunit.xml` a `restaurantcloud_test`.
3. Aislamiento por test:
   - aplicar el trait `DatabaseTransactions` en `tests/TestCase.php` (base común) para que cada test haga rollback.
   - revisar los tests que dependen de commits reales (listeners `afterCommit`, invalidación de caché de `carta_publica`, `PurgarCatalogoHuerfanoTest` con `session_replication_role`) y excluirlos del trait o adaptarlos.
4. MinIO y Redis: usar un bucket/prefijo de tests (`AWS_BUCKET=restaurantcloud-test`) y un prefijo de Redis propio (`REDIS_PREFIX=rc_test_`), o `Storage::fake('s3')` donde el test no necesite MinIO real.
5. Mover las claves de Stripe de `phpunit.xml` a un `.env.testing` no versionado (o usar valores ficticios con `APIDEV_MOCK=true`).

**Criterio de salida:** correr la suite dos veces seguidas da el mismo resultado, y los conteos de pisos/mesas/productos de la BD de desarrollo no cambian tras ejecutarla.

**Riesgo:** medio. Algunos tests pueden asumir datos creados por otros tests; esos fallos son reales y se corrigen haciéndolos autónomos.

---

## Etapa 3: restablecer los datos de la BD de desarrollo (Grupos B y C)

**Objetivo:** recuperar los 8 tests de semillas y cuotas, y dejar la carta pública sin restos de pruebas.

Con la Etapa 2 hecha, los tests ya corren sobre `restaurantcloud_test` recién sembrada y los grupos B y C deberían pasar solos. La BD de desarrollo se limpia aparte para el uso diario.

1. Respaldo previo: `pg_dump` de `restaurantcloud_db` al scratch/backup local.
2. Elegir el método (decisión tuya):
   - **Opción A, recrear:** `docker compose down` + borrar solo el volumen `postgres_data` + `up`. Se pierde todo lo creado a mano en desarrollo.
   - **Opción B, script de limpieza:** `scripts/dev-db-limpiar.sql` que, para el local Aurea, borre filas creadas después del seed (identificables por `created_at` posterior a la carga o por nombres de test) respetando el orden de claves foráneas, y luego reaplique los `INSERT ... ON CONFLICT DO NOTHING` de `07_seed_local_aurea_completo.sql` (repone promoción `…441`, proveedor `…411`, etc.).
3. Limpiar objetos huérfanos en MinIO bajo `catalogo/` (el comando `archivos:purgar-catalogo-huerfano` ya lo hace).
4. Invalidar las claves `carta_publica:*` del local en Redis.

**Criterio de salida:** pisos y mesas activos dentro del tope del plan Pro, la promoción y el proveedor semilla existen, y la carta pública solo muestra productos reales.

**Riesgo:** medio en la opción B (borrado de datos). Nunca sin respaldo previo.

---

## Etapa 4: fallos residuales (Grupo D y los que destape la Etapa 1)

1. **`PlanoMesasTest` "envío directo no reabre mesa inactiva":**
   - Revisar el orden de validaciones en el servicio de envío directo: hoy se valida la caja antes que el estado de la mesa.
   - Decidir cuál es el comportamiento correcto (regla de negocio): ¿debe responder primero la mesa no disponible o la caja cerrada?
   - Si el orden es correcto, el test debe abrir una caja en su preparación (dentro de su transacción) en vez de depender de la caja abierta de la BD.
2. Para cada fallo nuevo surgido en las suites de Cocina/Mozo/Mermas: clasificarlo (bug de producto vs. test frágil), corregir y anotar aquí.
3. Revisar la prueba de `PromocionTest` que falló de forma intermitente una vez: correrla 10 veces seguidas para confirmar si es inestable.

**Criterio de salida:** suite completa en verde, o los fallos restantes documentados con causa y responsable.

---

## Etapa 5: unificar el esquema (una sola fuente de verdad)

**Objetivo:** que no vuelva a pasar lo de `stock_descontado`.

1. Decisión de arquitectura (tuya), dos caminos:
   - **Migraciones como fuente:** convertir `infra/sql/02…08` en una migración base (`schema:dump` o migración inicial con SQL crudo), marcar las 19 migraciones existentes como aplicadas en las BDs actuales y, desde ahí, todo cambio va por `php artisan migrate`.
   - **SQL como fuente:** eliminar o archivar `database/migrations` y obligar a que todo cambio entre como script numerado en `infra/sql` más un script de actualización (`09_…sql`) para BDs existentes.
2. Auditoría automática: script que compare el esquema real (`pg_dump --schema-only`) con el esperado y falle en CI si difieren.
3. Documentar el flujo en el README de `apps/api`.

**Recomendación:** migraciones como fuente. Laravel ya está en el stack, permite actualizar BDs existentes y deja traza en la tabla `migrations`.

---

## Etapa 6: rol restringido para RLS (seguridad multi-tenant)

**Objetivo:** que el aislamiento entre empresas no dependa solo del código PHP.

1. Crear el rol `saas_app` (LOGIN, sin SUPERUSER ni BYPASSRLS) con privilegios DML sobre las tablas de negocio; `saas_admin` queda solo para migraciones y tareas de mantenimiento.
2. Verificar que `04_rls_security.sql` define políticas para todas las tablas con `empresa_id`/`local_id` y que la API fija el contexto de tenant por conexión (`SET app.empresa_id = …`, o el mecanismo que ya usen las políticas).
3. Revisar el impacto en Octane: el contexto de sesión de Postgres debe reiniciarse en cada request (conexiones persistentes).
4. Cambiar `DB_USERNAME` de la API, `queue` y `scheduler` a `saas_app`; las funciones `SECURITY DEFINER` que necesiten privilegios deben revisarse una por una.
5. Tests de aislamiento: un usuario de la empresa X no puede leer ni modificar datos de la empresa Y, aunque se omita el filtro en el código.

**Riesgo:** alto. Toca todas las consultas; hacerlo en rama aparte y con la suite en verde como red de seguridad (por eso va al final).

---

## Etapa 7: limpieza menor

- Advertencias de oxlint (`set-state-in-effect`) en el frontend.
- Invalidación de `carta_publica:{local_id}` cuando el stock cambia vía funciones SQL (hoy hasta 60 s de retraso): evaluar `LISTEN/NOTIFY` o invalidar desde los servicios PHP que llaman a esas funciones.

---

## Orden y dependencias

```
Etapa 1 ──► Etapa 2 ──► Etapa 3 ──► Etapa 4 ──► Etapa 5 ──► Etapa 6
 (41 tests)  (aislamiento) (8 tests)  (residuales)  (esquema)    (RLS)
                                                    Etapa 7: en cualquier momento
```

| Etapa | Esfuerzo estimado | Tests recuperados | ¿Requiere decisión tuya? |
|---|---|---|---|
| 1 | Bajo | hasta 41 | No |
| 2 | Medio | — (evita regresiones) | No |
| 3 | Bajo–medio | 8 | Sí: recrear BD o script de limpieza |
| 4 | Variable | 1 + los que surjan | Sí: regla de orden caja/mesa |
| 5 | Medio–alto | — | Sí: migraciones o SQL como fuente |
| 6 | Alto | — | Sí: aprobar el cambio de rol |
| 7 | Bajo | — | No |

## Reglas de ejecución

- Una etapa por vez; al cerrar cada una se corre la suite completa y se anota aquí el conteo de fallos.
- Sin commits hasta que lo indiques.
- Ninguna operación destructiva sobre la BD de desarrollo (borrar volumen, `DELETE` masivos) sin respaldo y sin tu confirmación explícita.
