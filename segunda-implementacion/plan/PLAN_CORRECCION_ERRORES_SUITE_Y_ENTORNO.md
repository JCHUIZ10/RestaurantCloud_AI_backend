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

## Registro de ejecución

**2026-11-02**: verificación inicial: los problemas persistían (50 fallos / 186 aprobados, 236 tests).

- **Etapa 1 cerrada: 50 → 11 fallos.** Columna añadida a `02_schema_ddl.sql` y aplicada con `ALTER` en `restaurantcloud_db`. Las 7 funciones de `08_inventory_functions.sql` ya coincidían con la BD (comparadas por hash en una transacción con rollback; sin sobrecargas).
  - Fallos destapados: `CocinaComandasTransiciones` y `CocinaStockDeduccion` (deshacer 30 s → `VENTANA_DESHACER_EXPIRADA`). **Bug de producto:** `CocinaController::cambiarEstadoItem` guardaba `now()->utc()`; Laravel lo serializa sin offset y la sesión Postgres (`America/Lima`) lo interpretaba como hora local, así que `fecha_inicio_coccion`/`fecha_listo_cocina` quedaban 5 h en el futuro. Corregido (se quitó `->utc()`). En `restaurantcloud_db` quedan 7 ítems con esas fechas en el futuro (datos históricos ya desplazados, sin corregir).
- **Etapa 2 cerrada: 11 → 1 fallo.**
  - `phpunit.xml`: `<env>` → `<server>`. `<env force="true">` no bastaba: solo pisa `$_ENV`/`getenv()`, y Laravel lee antes `$_SERVER`, donde Docker ya dejó los valores del contenedor. Se descubrió también que los tests usaban `QUEUE_CONNECTION=redis` (jobs al worker real sobre la BD de desarrollo).
  - BD `restaurantcloud_test` + bucket `restaurantcloud-test` (con la política pública de `catalogo/`) recreados por `scripts/test-db-reset.sh`. El esquema resultante es idéntico al de `restaurantcloud_db` salvo el orden de la columna `stock_descontado`.
  - `REDIS_PREFIX=rc_test_`; las claves de Stripe se quitaron de `phpunit.xml` (llegan por el entorno del contenedor).
  - `DatabaseTransactions` en `tests/TestCase.php`. El grupo C (cuotas) pasó solo.
  - Grupo B no era contaminación: la semilla deja la promoción `…441` con `usos_actuales = 0` y borra todas las compras del local, así que los tests suponían un historial inexistente. Ahora `PromocionTest` y `ProveedorTest` crean su propio historial.
  - Tests frágiles corregidos: `CobroFiscalComprobanteTest` (correlativo mágico `> 37922` → se calcula el esperado), `CocinaStockDeduccionTest` (abre caja propia), `TenantStorageTest` (bucket fijo en la aserción).
  - Criterio de salida verificado: dos corridas seguidas → 1 fallo / 235 aprobados; la BD de tests vuelve a la semilla y los conteos de `restaurantcloud_db` no cambian.
- **Etapa 4 cerrada: 1 → 0 fallos (236 / 236).** Decisión: la caja abierta se valida antes que la mesa (sin cambios en el servicio). `PlanoMesasTest` abre caja en su local de prueba. `PromocionTest` corrido 10 veces seguidas: 10/10 en verde, no es inestable. Se quitó el `use DatabaseTransactions` duplicado de `PlanoMesasTest` y `CategoriaOrdenTest`.
- Decisiones posteriores: Etapa 3 opción A (recrear volumen), Etapa 5 con migraciones como fuente, Etapa 6 pospuesta.
- **Etapa 5 cerrada.** Las 19 migraciones no podían ejecutarse desde cero (`2026_10_11_000004` falla con un error de sintaxis SQL) y nunca se aplicaron; los seeders `PlanSeeder`/`UbigeoSeeder`/`AdminSaaSSeeder` duplicaban `06` y no se usaban. Se retiraron (quedan en el historial de git).
  - `infra/sql/*.sql` → `apps/api/database/sql/` (mismos nombres; el contenedor de la API solo monta `apps/api`).
  - `2026_11_02_021504_crear_esquema_base`: ejecuta 01–06 y 08 en BD vacía; si ya existe `empresa` (BD creada con initdb, p. ej. producción) solo se registra como aplicada.
  - `2026_11_02_021508_agregar_stock_descontado_a_pedido_item`: `ADD COLUMN IF NOT EXISTS` para BDs existentes.
  - `07` → `LocalAureaDemoSeeder` (vía `DatabaseSeeder`).
  - `docker-compose.yml` y `docker-compose.prod.yml` ya no montan `docker-entrypoint-initdb.d`; `infra/docker/entrypoint.sh` corre `php artisan migrate --force` en el rol `api`.
  - `scripts/test-db-reset.sh` usa `migrate --seed` (con salvaguarda que aborta si la conexión no apunta a `restaurantcloud_test`); nuevo `scripts/schema-check.sh` compara cualquier BD con una migrada desde cero (sale con 1 si difieren). No hay CI en el repo donde engancharlo.
  - Verificado: BD vacía migrada y BD creada con los SQL + migrate dan `pg_dump --schema-only` idénticos. Flujo documentado en `apps/api/README.md`.
- **Etapa 3 cerrada (opción A).** Respaldo en `restaurantcloud/backups/restaurantcloud_db_2026-11-02.dump` (`pg_dump -Fc`, excluido de git vía `.git/info/exclude`). Volumen `restaurantcloud_postgres_data` recreado; la API migró sola al arrancar y se corrió `db:seed`. Resultado: 2 pisos, 8 mesas, 5 productos, promoción `…441` y proveedor `…411` presentes; `schema-check` en verde. No había claves `carta_publica:*` en Redis. Quedan en MinIO 12 objetos bajo `catalogo/empresas/dae4f73e…/` de una empresa que ya no existe en la BD: el comando de purga no los ve (trabaja sobre la tabla `archivo`) y no se borraron.
- **Etapa 7 cerrada (parcial en frontend).**
  - Carta pública: nuevo `CartaPublicaService::invalidarTrasInventario()`; se invalida tras `fn_inventario_ajustar_stock`, `descontar_receta`, `revertir_receta`, `anular_compra` y `reingresar_item_sellado` solo si la respuesta reporta platos agotados o reactivados, y tras `FichaCompraService::reactivarPlatos`. `MozoController` ahora revierte recetas vía `StockDeduccionService`. Test nuevo en `CartaPublicaTest` (falla sin la corrección).
  - oxlint: corregido el único error (`ModalUnirMesas`: `useMemo` tras un `return` anticipado) y 20 advertencias mecánicas (`no-unused-vars`, `no-useless-escape`, `no-unused-expressions`). Quedan 132 advertencias, 98 de ellas `set-state-in-effect` en ~70 componentes: requieren refactorizar cómo cada modal reinicia su estado y no hay tests de frontend que lo cubran; se dejan para un trabajo dedicado. Las de `immutability` revisadas son falsos positivos.
- Pendiente: Etapa 6 (rol RLS), pospuesta por decisión. Hallazgo nuevo: no existe la tabla `failed_jobs` que usa `config/queue.php`, así que registrar un job fallido daría error.

## Reglas de ejecución

- Una etapa por vez; al cerrar cada una se corre la suite completa y se anota aquí el conteo de fallos.
- Sin commits hasta que lo indiques.
- Ninguna operación destructiva sobre la BD de desarrollo (borrar volumen, `DELETE` masivos) sin respaldo y sin tu confirmación explícita.
