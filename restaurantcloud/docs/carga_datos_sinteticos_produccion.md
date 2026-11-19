# Carga de datos sintéticos en producción

Guía para cargar el historial de ventas sintéticas en ms-analítica del entorno desplegado, y para reemplazarlo después por ventas reales. El generador y sus reglas están en `services/analitica/README.md`; aquí está lo que cambia al pasar a producción.

> **Estado.** `docker-compose.prod.yml` todavía no incluye ms-analítica (se agrega en la etapa 8 del plan). Esta guía vale desde que el servicio esté desplegado. Los nombres de servicio de los comandos (`api`, `analitica`, `db-analitica`) son los del compose de desarrollo; confírmalos contra el de producción antes de copiar nada.

## 1. Decide si corresponde

Los datos sintéticos **no deben cargarse en el local de un cliente real**. ms-analítica es la fuente de los reportes de ventas (CU-ADMIN-13) y del pronóstico: lo sintético se vería como ventas verdaderas.

- Sí: una empresa de demostración o de evaluación (ÁUREA), para entrenar el modelo y mostrarlo.
- No: un local que ya opera con clientes.

## 2. Antes de empezar

| Qué | Cómo comprobarlo |
|---|---|
| ms-analítica desplegado con sus migraciones aplicadas | `GET /health` responde 200; el contenedor `analitica-migraciones` terminó con código 0 |
| El local existe en la base **de producción del núcleo** | `php artisan carta:exportar <local_id>` devuelve JSON (no `No existe el local`) |
| El local tiene platos activos y mozos activos | El mismo comando; si falta alguno, falla con un mensaje |
| Copia de seguridad de la base de ms-analítica | `docker compose exec -T db-analitica pg_dump -U <usuario_admin> -Fc analitica_db > analitica_antes_de_sinteticos.dump` |
| El perfil corresponde al local | Ver la sección 5 |

**El seed de ÁUREA no es para producción tal cual.** `LocalAureaDemoSeeder` purga los datos operativos de la sede y deja usuarios con contraseñas de demostración (`mozo2026`, `admin-local2026`…). Si la empresa de demostración se crea con ese seed en el servidor, cambia esas contraseñas de inmediato o crea la empresa por el flujo normal de alta.

## 3. Elige la fecha de corte

`generar` termina en `--hasta` (ayer por defecto) y rechaza hoy y el futuro. **No comprueba si ya hay ventas reales en ese rango**: si hay, las sintéticas se suman a las reales del mismo día.

Antes de cargar, mira cuál es la primera venta real del local:

```bash
docker compose exec -T db-analitica psql -U <usuario_admin> -d analitica_db -tAc \
  "select min(fecha_operativa) from venta where local_id = '<local_id>'"
```

- Sin resultado: no hay ventas. Usa el valor por defecto (ayer) o una fecha anterior a la puesta en marcha.
- Con una fecha: pon `--hasta` **al menos un día antes**. Lo sintético y lo real quedan separados por esa fecha.

Anota la fecha de corte; la necesitarás para reemplazarlo (sección 7).

## 4. Carga

La carga corre **dentro del servidor**, entre contenedores: no usa la red de quien la lanza. Para un local con 24 meses son unas 39 mil ventas y tarda menos de 4 minutos; no bloquea a las demás, pero hazlo fuera del horario de mayor movimiento.

**4.1 Una prueba corta primero.** Un mes. Si algo está mal (carta, local, conexión), falla aquí y no deja casi nada.

```bash
docker compose exec -T api php artisan carta:exportar <local_id> \
  | docker compose exec -T analitica python -m app.sinteticos generar \
      --carta - --perfil aurea_v1 --semilla 2026 --meses 1 --hasta <corte>
```

Termina con una línea JSON: `{"orden": "generar", ..., "dias": 30, "ventas": ..., "unidades": ...}`. Si devuelve `{"error": ...}`, no se cargó nada.

**4.2 La carga completa.** Es la misma orden con los meses que quieras (24 en el entorno de desarrollo) y, opcionalmente, la demanda esperada:

```bash
docker compose exec -T api php artisan carta:exportar <local_id> \
  | docker compose exec -T analitica python -m app.sinteticos generar \
      --carta - --perfil aurea_v1 --semilla 2026 --meses 24 --hasta <corte> \
      --verdad /tmp/verdad.csv
```

- **Es reanudable y repetible.** Cada día se guarda en su propia transacción y el sorteo de un día depende solo de (semilla, local, fecha). Si se corta a medias, vuelve a lanzar la misma orden: los días ya cargados no se duplican. Cargar un mes y luego 24 deja el mismo resultado que cargar 24 de una vez.
- **No cambies la semilla ni el perfil entre ejecuciones sobre el mismo rango**: con otra semilla los comprobantes tienen otros ids y se sumarían a los anteriores.
- **`--verdad`** guarda la demanda esperada por plato y día, la referencia del protocolo experimental. Se escribe dentro del contenedor; cópiala fuera (`docker compose cp analitica:/tmp/verdad.csv ./verdad_<fecha>.csv`) y guárdala con el resto de la evidencia, porque el contenedor se recrea en cada despliegue.

## 5. Un perfil por local

`aurea_v1` conoce los ids de platos y la promoción de ÁUREA (popularidad por plato y campañas de promoción). Para otro local:

- Sus platos no figurarán en `popularidad` y todos pesarán lo mismo; sus promociones no coincidirán con las campañas y no habrá efecto de promoción.
- Crea un perfil nuevo (`app/sinteticos/perfiles/<nombre>_v1.json`, copiando `aurea_v1.json` y cambiando ids, popularidad, campañas y el nivel de `tickets_base`) y despliega la imagen con él. **No edites un perfil ya usado**: un conjunto de datos solo se reproduce si el perfil que lo generó no cambia.

## 6. Verificación

Con el resumen de la orden a mano:

```bash
docker compose exec -T db-analitica psql -U <usuario_admin> -d analitica_db -c \
 "select count(*) ventas, min(fecha_operativa) desde, max(fecha_operativa) hasta,
         (select coalesce(sum(unidades),0) from venta_diaria_producto where local_id = '<local_id>') unidades
  from venta where local_id = '<local_id>'"
```

- `ventas` y `unidades` coinciden con las del resumen de la orden.
- `desde` y `hasta` son el rango pedido, y `hasta` es anterior a la primera venta real.
- La serie responde y es continua (`GET /interno/series/ventas-diarias`, firmado; en el README de la ficha del servicio, sección 3). Debe traer un punto por día, con ceros solo en los días cerrados del perfil (25/12 y 01/01).
- `ultimo_evento_en` de la serie vale la hora de la carga, no la de una venta real. No lo interpretes como actividad reciente del local.

## 7. Pasar a datos reales

Cuando el local empiece a operar, las ventas reales entran solas por el outbox del núcleo, **desde el día de la puesta en marcha** y sin tocar lo sintético. Mientras convivan, lo sintético queda como historial anterior. Para reemplazarlo:

1. **Cuenta antes de borrar.** Sin `--confirmar`, `purgar` solo informa:

   ```bash
   docker compose exec -T analitica python -m app.sinteticos purgar \
     --empresa <empresa_id> --local <local_id> --hasta <corte>
   ```

2. Revisa que los conteos son los de la carga sintética (`venta`, `venta_diaria_producto`, `anulacion`).
3. **Haz una copia de seguridad** (sección 2) y repite la orden con `--confirmar`.

`purgar` borra todo lo que sea de fecha operativa **hasta `<corte>` incluida, sea sintético o real**: no distingue. Por eso el corte debe ser el último día sintético y no una fecha posterior. Si el local ya tenía ventas reales antes de ese día, reenvíalas desde el núcleo con `outbox:reenviar-eventos` después de purgar.

También reconstruye la tabla `producto_visto` con lo que queda.

## 8. Registro de lo cargado

Anótalo para que el dataset del protocolo sea reproducible:

| Dato | Valor |
|---|---|
| Empresa y local | |
| Perfil (archivo y versión de la imagen) | |
| Semilla | |
| Rango (`desde` – `hasta`) y fecha de corte | |
| Ventas y unidades cargadas | |
| Fecha y hora de la carga, y quién la hizo | |
| Archivo de la demanda esperada (`--verdad`) | |
| Copia de seguridad previa | |

## Lista rápida

- [ ] El local es de demostración, no de un cliente.
- [ ] ms-analítica está en pie y migrado; `carta:exportar` devuelve la carta.
- [ ] Copia de seguridad de `analitica_db` hecha.
- [ ] Fecha de corte anterior a la primera venta real.
- [ ] Prueba de un mes correcta.
- [ ] Carga completa terminada y verificada con los conteos.
- [ ] `verdad.csv` copiado fuera del contenedor.
- [ ] Registro de la sección 8 completado.
