# Comandos de datos sintéticos: qué hace cada uno y cuándo usarlo

El pronóstico necesita historial de ventas y un local nuevo no lo tiene. Estos comandos crean ese historial de demostración y, cuando llegan ventas reales, lo reemplazan. Todos corren **dentro de los contenedores** (no usan la red) y trabajan sobre ms-analítica: el núcleo nunca recibe comprobantes falsos.

> Los nombres de contenedor son los del Compose de desarrollo (`restaurantcloudIA_*`). Para producción, ver `carga_datos_sinteticos_produccion.md`.

## Resumen: qué comando para cada situación

| Quiero… | Comando | Tarda |
|---|---|---|
| Armar el historial de un local por primera vez | `generar` (carga completa) | minutos (24 meses ≈ 4 min) |
| Ponerlo al día porque pasaron unos días | `generar --incremental` | segundos |
| Generar hasta una fecha concreta | `generar --hasta AAAA-MM-DD` | según el rango |
| Guardar la demanda esperada para evaluar el modelo | `generar --verdad archivo.csv` | igual que `generar` |
| Reemplazar lo sintético por ventas reales | `purgar` | segundos |
| Ver qué se borraría, sin borrar | `purgar` (sin `--confirmar`) | segundos |
| Comprobar que el historial llega a ayer | consulta de la sección 5 | instantáneo |

## 1. `carta:exportar`: entregar la carta del local

```bash
docker exec restaurantcloudIA_api php artisan carta:exportar <local_id>
```

Imprime en JSON los platos, mozos y promociones del local. Es la **entrada** de `generar`: el generador necesita saber qué platos existen para inventar ventas de ellos. No cambia nada por sí solo.

**Cuándo:** siempre, justo antes de `generar`. Si el local no existe, no tiene platos activos o no tiene mozos activos, falla con un mensaje y no se genera nada.

## 2. `generar`: crear ventas sintéticas

```bash
docker exec restaurantcloudIA_api php artisan carta:exportar <local_id> \
  | docker exec -i restaurantcloudIA_analitica \
      python -m app.sinteticos generar --carta - --perfil aurea_v1 --semilla 2026 --meses 24
```

Genera ventas con las reglas del **perfil** (día de la semana, mes, tendencia, feriados, promociones, popularidad de cada plato) y las guarda con la misma función que procesa una venta real. Termina con una línea JSON: `modo`, `desde`, `hasta`, `dias`, `ventas`, `unidades`. Si algo falla, devuelve `{"error": ...}` y sale con código 1.

| Opción | Qué hace | Por defecto |
|---|---|---|
| `--carta -` | Lee la carta de la entrada estándar (o `--carta archivo.json`) | obligatoria |
| `--perfil` | Reglas de demanda, en `app/sinteticos/perfiles/` | `aurea_v1` |
| `--semilla` | Hace el sorteo reproducible | `2026` |
| `--meses N` | Meses hacia atrás desde `--hasta` | `24` |
| `--hasta AAAA-MM-DD` | Último día a generar | ayer (hora de Lima) |
| `--incremental` | Solo los días que faltan (sección 3) | apagado |
| `--verdad archivo.csv` | Guarda la demanda esperada por plato y día | no se guarda |

**Reglas que conviene saber**

- **Nunca llega a hoy.** `--hasta` debe ser anterior a hoy: lo de hoy en adelante es de ventas reales, y un día en curso estaría incompleto. «Al día» significa hasta ayer.
- **Repetir no duplica.** El sorteo de un día depende solo de (semilla, local, fecha) y cada día se guarda en su propia transacción. Si la carga se corta, se vuelve a lanzar el mismo comando.
- **No cambies la semilla ni el perfil** sobre un rango ya cargado: saldrían ventas distintas que se sumarían a las anteriores.
- **No distingue ventas reales de sintéticas.** Si ya hay ventas reales en el rango, las sintéticas se suman. Úsalo solo en locales de demostración.

**Cuándo usarlo:** la primera vez que un local necesita historial (para entrenar el modelo o para una demostración).

## 3. `generar --incremental`: ponerlo al día

```bash
docker exec restaurantcloudIA_api php artisan carta:exportar <local_id> \
  | docker exec -i restaurantcloudIA_analitica \
      python -m app.sinteticos generar --carta - --incremental --perfil aurea_v1 --semilla 2026
```

Busca la **última venta cargada** del local y genera solo desde el día siguiente hasta `--hasta` (ayer, salvo que indiques otra fecha). Ignora `--meses`. Usa el mismo perfil y semilla de siempre, así que los días nuevos son idénticos a los que habría dado la carga completa.

Tres resultados posibles, según el campo `modo` de la respuesta:

| Situación | Respuesta |
|---|---|
| El local ya tiene historial y faltan días | `"modo": "incremental"`, con `desde` = día siguiente a la última venta |
| El historial ya llega a `--hasta` | `"modo": "incremental", "al_dia": true`, `dias: 0`; no escribe nada |
| El local no tiene ninguna venta | `"modo": "completa"`: hace la carga de `--meses` (como `generar` sin `--incremental`) |

**Cuándo usarlo**

- Cada día que quieras demostrar o probar con datos recientes: sin esto, los días nuevos llegan en 0 y el pronóstico los toma por cierres del local (y avisa de ventas atrasadas).
- Antes de `scripts/smoke-pronostico.sh` (el script ya lo hace solo si detecta atraso).
- Es seguro lanzarlo de más: si ya está al día, no hace nada.

**Una advertencia.** «Última venta cargada» incluye ventas reales. Si el local ya recibe ventas reales de ayer, el incremental las toma como parte del historial y no rellena días anteriores que falten. Con locales que ya operan, no uses datos sintéticos.

## 4. `purgar`: reemplazar lo sintético por datos reales

```bash
# 1) Solo cuenta lo que se borraría
docker exec restaurantcloudIA_analitica python -m app.sinteticos purgar \
  --empresa <empresa_id> --local <local_id> --hasta 2026-11-17

# 2) Borra de verdad
docker exec restaurantcloudIA_analitica python -m app.sinteticos purgar \
  --empresa <empresa_id> --local <local_id> --hasta 2026-11-17 --confirmar
```

Borra las ventas, la serie diaria y las anulaciones del local **hasta la fecha indicada (incluida)** y reconstruye la lista de productos vistos con lo que queda. Sin `--confirmar` solo muestra los conteos.

**Cuándo usarlo:** al poner en marcha un local de verdad, cuando ya hay ventas reales y se quiere quitar lo inventado anterior a la puesta en marcha. Pon `--hasta` en la víspera de la primera venta real.

**Cuidado:** borra todo lo anterior al corte, sea sintético o real. Haz una copia de la base antes de confirmar. El modelo entrenado con datos sintéticos no se borra: conviene reentrenarlo cuando haya suficiente historial real.

## 5. Comprobar hasta qué día llega el historial

```bash
docker exec restaurantcloudIA_db_analitica sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "select min(fecha_operativa), max(fecha_operativa), count(distinct fecha_operativa) from venta where local_id = '"'"'<local_id>'"'"'"'
```

Si `max` es anterior a ayer, ejecuta `generar --incremental`. Un día sin ventas por feriado cerrado (25/12 y 01/01) es normal: el conteo puede ser menor que los días del rango.

## Elegir entre carga completa e incremental

- ¿El local **no tiene historial**? → `generar` completo.
- ¿Ya tiene historial y **pasaron días**? → `generar --incremental`.
- ¿Quieres **rehacer** todo con otro perfil o semilla? → `purgar --confirmar` hasta ayer y luego `generar` completo. No mezcles dos semillas.
- ¿Quieres datos hasta **hoy**? No se puede: el día actual es de ventas reales (o queda sin datos hasta mañana).

## Dónde está lo demás

- Cómo funciona el generador y sus reglas: `services/analitica/README.md`, sección «Datos sintéticos de ventas».
- Carga en el servidor desplegado y sus precauciones: `carga_datos_sinteticos_produccion.md`.
- Prueba de punta a punta de la predicción (completa el historial sola): `scripts/smoke-pronostico.sh`.
