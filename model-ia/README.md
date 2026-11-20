# model-ia

Construcción del modelo de pronóstico de demanda por plato (etapa 5A), aparte de ms-pronóstico. El servicio solo **descarga** el artefacto publicado; lo único que comparte con este proyecto es el paquete `rc_pronostico` (D-02).

- Diseño y decisiones: [DECISIONES.md](DECISIONES.md) (D-01 a D-23).
- Qué recibe, qué devuelve y qué garantiza el modelo: [CONTRATO.md](CONTRATO.md).
- Plan de trabajo: [PLAN.md](PLAN.md).

## Qué hay

```text
rc_pronostico/        paquete que instalará ms-pronóstico: validación del contrato, calendario, variables,
                      baselines, reglas por plato, artefacto (skops + SHA-256) y pronosticar()
cuadernos/            el trabajo de la etapa, numerado y con sus salidas guardadas (se leen en GitHub)
configuracion/        rejilla, tramos y la configuración congelada (la escribe el cuaderno 04)
dataset/stuttgart/    CSV original y FICHA.md (DOI, licencia, SHA-256)
resultados/           tablas (CSV y Markdown) y figuras (PNG) del informe
salidas/              datos intermedios y predicciones   (no versionado)
repositorio/          modelos publicados, con la estructura de D-22   (no versionado)
```

## Instalar

Requiere [uv](https://docs.astral.sh/uv/) y Python 3.12.

```bash
cd model-ia
uv sync
cp .env.example .env     # solo hace falta para ÁUREA: completar ANALITICA_SECRETO
```

`ANALITICA_SECRETO` es el secreto del servicio ms-analítica (`SECRETO_INTERNO` de su contenedor). El `.env` no se versiona.

## Los cuadernos

Se ejecutan en orden; cada uno lee y escribe archivos en `salidas/`, así que se puede volver a correr por separado.

| # | Cuaderno | Qué hace |
|---|---|---|
| 00 | `00_entorno` | Versiones del entorno y prueba de skops como formato del artefacto (D-16) |
| 01 | `01_datos_stuttgart` | Verifica el CSV, arma el historial del contrato y lo explora |
| 02 | `02_datos_aurea` | Lee ÁUREA con el GET firmado de ms-analítica y verifica la coherencia (D-23). **Requiere Docker** |
| 03 | `03_variables_y_baselines` | Muestra `rc_pronostico` en acción y comprueba que no hay fuga |
| 04 | `04_ajuste` | Elige entre 32 configuraciones y escribe `configuracion/congelada.json` |
| 05 | `05_evaluacion` | Reentrena en 52 cortes semanales por fuente y guarda las predicciones |
| 06 | `06_resultados` | Métricas de D-14, pruebas de D-15, tablas y figuras |
| 07 | `07_entrenar_y_publicar` | Entrena el modelo final, aplica la puerta de calidad, publica y carga en un entorno limpio |

Cada cuaderno termina con una sección de **verificaciones** (`assert`): si algo no cuadra, la ejecución se corta.

**Orden que importa:** el 05 usa la prueba una sola vez y solo arranca si `configuracion/congelada.json` está commiteada y sin cambios. Después de volver a ejecutar el 04, hay que hacer commit de esa configuración antes del 05.

### Abrir Jupyter

```bash
uv run jupyter lab
```

### Ejecutar todo

```bash
./ejecutar_cuadernos.sh          # 00 a 07, unos 4 minutos
./ejecutar_cuadernos.sh 04 05    # solo algunos
```

Los cuadernos 02 y 07 (parte de ÁUREA) necesitan Docker con `restaurantcloudIA_analitica` encendido. Stuttgart no.

## Pruebas del paquete

```bash
uv run pytest rc_pronostico      # sin red ni base de datos
```

## Reproducibilidad

- `uv.lock` fija las versiones; `scikit-learn` y `skops` se fijan con `==` en `rc_pronostico`, porque el artefacto solo carga con la misma versión (CONTRATO, 5).
- `random_state = 2026`, sin detención temprana (D-11).
- Dos ejecuciones seguidas dejan `resultados/` idéntico. Lo que cambia entre ejecuciones son las salidas guardadas dentro de los cuadernos (tiempos, números de celda) y las versiones UUID del repositorio de modelos.
- Cada predicción guarda la huella (SHA-256) de los datos y de la configuración con que se hizo (`salidas/<fuente>/predicciones_meta.json`).

## Cargar un modelo publicado

Es lo que hará ms-pronóstico, con solo `rc_pronostico` instalado:

```python
from rc_pronostico.artefacto import cargar
from rc_pronostico.pronosticar import pronosticar

artefacto = cargar("repositorio", local_id)         # lee vigente.json, verifica SHA-256, scikit-learn y variables
resultado = pronosticar(historial, calendario, peticion, artefacto)
resultado.predicciones                              # producto_id, fecha, p50, p90, metodo, motivo
```

Si `cargar` lanza `ErrorArtefacto`, el servicio usa `pronosticar(..., artefacto=None)`, que devuelve el baseline.

## Datos

- **Stuttgart:** Taigel y Meller, Mendeley Data, DOI 10.17632/7s3ys9ntnz.1, CC BY 4.0. Ver [dataset/stuttgart/FICHA.md](dataset/stuttgart/FICHA.md).
- **ÁUREA:** sintético (`aurea_v1`, semilla 2026), generado por ms-analítica. Sus métricas solo muestran que el modelo recupera un patrón conocido (D-20).
