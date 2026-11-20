# Plan: etapa 5A — construcción del modelo de pronóstico en `model-ia/`, organizada en cuadernos

## Contexto

La etapa 5A construye el modelo de pronóstico de demanda por plato **aparte** de ms-pronóstico. El servicio solo descargará el artefacto publicado (D-02). El diseño está cerrado en `model-ia/DECISIONES.md` (D-01 a D-23) y en `model-ia/CONTRATO.md` (versión 0.2).

El usuario prefiere que el trabajo viva en **cuadernos de Jupyter**: son más transparentes, más fáciles de seguir y de volver a ejecutar o actualizar. El plan se organiza así: cada paso de la etapa es un cuaderno numerado, que se ejecuta en orden y se versiona con sus salidas, para que se pueda leer en GitHub sin ejecutarlo.

**Límite que se respeta:** ms-pronóstico no puede importar un cuaderno. Lo que el servicio necesita para predecir igual que al entrenar (validación de la entrada, variables, baselines, reglas por plato y carga verificada del artefacto) va en un paquete `.py` pequeño, `rc_pronostico`, con pruebas. Los cuadernos lo importan y muestran qué hace. Es la única pieza fuera de los cuadernos; el resto (datos, ajuste, evaluación, métricas, estadística y publicación) está escrito en los cuadernos mismos.

**Insumo:** el CSV de Stuttgart irá en `model-ia/dataset/stuttgart/` (todavía no está). La integración con ms-pronóstico es de la 5B.

## Estructura

```text
model-ia/
  README.md  CONTRATO.md  DECISIONES.md
  pyproject.toml  uv.lock  .env.example  .gitignore   workspace de uv "model-ia"
  rc_pronostico/                         miembro del workspace; lo instalará ms-pronóstico
    pyproject.toml                       numpy, pandas, scikit-learn==X, skops==Y
    src/rc_pronostico/
      contrato.py     validar_historial(), validar_peticion()
      calendario.py   días cerrados (lista o regla de respaldo D-05) y marcas de feriado
      variables.py    VERSION_VARIABLES, LISTA_VARIABLES,
                      filas_entrenamiento(historial, calendario, corte)   <- aplica d+h <= corte
                      filas_prediccion(historial, calendario, peticion)
      baselines.py    ingenuo estacional, media del mismo día y P90 del baseline (D-09)
      reglas.py       método por plato (4.1) y garantías (4.2)
      artefacto.py    guardar y cargar con skops, SHA-256, ficha y compatibilidad
      pronosticar.py  único punto de entrada que usará el servicio
    tests/                               pytest: fuga, reglas, garantías, artefacto
  cuadernos/                             el trabajo de la etapa, en orden
    00_entorno.ipynb
    01_datos_stuttgart.ipynb
    02_datos_aurea.ipynb
    03_variables_y_baselines.ipynb
    04_ajuste.ipynb
    05_evaluacion.ipynb
    06_resultados.ipynb
    07_entrenar_y_publicar.ipynb
  ejecutar_cuadernos.sh                  ejecuta 00 a 07 en orden (nbconvert --execute --inplace)
  configuracion/                         rejilla.json, tramos_stuttgart.json, tramos_aurea.json,
                                         congelada.json (lo escribe 04)
  dataset/stuttgart/                     CSV original + FICHA.md
  resultados/                            tablas y figuras del informe (versionadas)
  salidas/  repositorio/                 datos intermedios, predicciones y modelos (no versionados)
```

**Cómo se pasan datos entre cuadernos:** cada uno lee y escribe archivos en `salidas/` (parquet o JSON) y no depende de variables de otro cuaderno. Por ejemplo, 01 escribe `salidas/historial_stuttgart.parquet` y 05 lo lee. Así cada cuaderno se puede volver a ejecutar por separado.

**Cada cuaderno sigue el mismo formato:**
1. Qué hace y qué decisiones aplica (D-xx).
2. Parámetros en una celda arriba (rutas, semilla, fechas).
3. El desarrollo, con texto entre las celdas.
4. Una sección final de **verificaciones** con `assert`, que corta la ejecución si algo no cuadra.
5. Qué archivos deja.

## Cuadernos

### 00_entorno: entorno y formato del artefacto
- Versiones de Python, numpy, pandas, scikit-learn y skops, comparadas con las que fija `rc_pronostico`.
- **Prueba de skops (D-16):** guardar y cargar un HistGradientBoosting cuantil con variables categóricas, comprobar que predice igual, que solo acepta tipos de confianza y que un byte alterado se rechaza por SHA-256. Si skops falla, se usa joblib con huella obligatoria y se anota en D-16.

### 01_datos_stuttgart
- SHA-256 del CSV igual al de D-18; si no coincide, se detiene. Genera `FICHA.md`.
- Lectura con fechas `mes.día.año`. Se usan solo `DEMAND_DATE`, los 7 platos e `ISHOLIDAY`; los `TOTAL*` y las otras columnas se ignoran (D-01, D-13).
- Conversión al historial largo del contrato. Días cerrados = días sin fila (deben ser 5); feriados = `ISHOLIDAY`.
- `validar_historial` de `rc_pronostico`.
- Exploración: escala por plato, ciclo semanal, días en 0 (calamares: 32), Navidad.
- Deja `salidas/stuttgart/historial.parquet` y `calendario.json`.

### 02_datos_aurea: coherencia con ms-analítica (D-23)
Requiere Docker encendido.
- Cliente firmado escrito en el cuaderno: `HMAC-SHA256("{ts}.{query}")`, según el protocolo de `doc-2u/servicios/README.md` §2 (como `restaurantcloud/services/analitica/app/soporte/firma.py:calcular_firma`, sin importarlo). Pide la serie por tramos de 730 días con ambos extremos incluidos (`app/dominio/series.py`). Credenciales e ids desde `.env` (ids de ÁUREA fijos en `apps/api/database/sql/07_seed_local_aurea_completo.sql`).
- Verificaciones:
  - la serie pasa `validar_historial`;
  - 20 platos × 730 días;
  - la regla de respaldo detecta exactamente el 25/12 y el 01/01 de ambos años;
  - `ultimo_evento_en` queda marcado como no fiable.
- Feriados de Perú con `holidays`, comparados año por año con la lista del generador (`app/sinteticos/feriados.py`, copiada como tabla de referencia); las diferencias se muestran.
- **Demanda verdadera:** se lee el CSV de `--verdad`. Si ya no está en el contenedor, se vuelve a generar con la misma semilla y rango (idempotente, unos 4 minutos). Se mide el error de lo vendido frente a lo esperado: el piso de ruido.
- Exploración, con los mismos gráficos que el 01.
- Deja `salidas/aurea/historial.parquet`, `calendario.json` y `verdad.parquet`. Lo encontrado pasa a D-23 (verificada) y a D-21.

### 03_variables_y_baselines
- Muestra `rc_pronostico` en acción con un plato real: tabla de variables de un corte, días cerrados como NaN y baselines frente a lo vendido.
- **Comprobación de fuga a la vista:** se alteran los datos posteriores al corte y se muestra que las variables no cambian (la misma prueba existe en pytest).
- Demuestra que `filas_entrenamiento` nunca incluye un objetivo posterior al corte.

### 04_ajuste: elegir y congelar la configuración (D-08, D-11)
- Un entrenamiento con objetivos hasta 2014-09-12; se evalúan los cortes semanales de la validación (2014-09-13 a 2014-11-07).
- 16 combinaciones × 2 pérdidas de P50 (`quantile` y `poisson`) = 32. `early_stopping=False`, `random_state=2026`.
- Criterio: menor MAE en el escenario operativo (h de 2 a 8). Tabla y gráfico de las 32.
- Escribe `configuracion/congelada.json`. **Se hace commit de esa configuración antes de ejecutar el 05.**

### 05_evaluacion: ventana creciente (D-10)
- Define en el cuaderno `evaluar(fuente)` y la llama para **Stuttgart** (unos 52 cortes semanales, de 2014-11-08 a 2015-11-07) y para **ÁUREA** (control: primer año de entrenamiento y segundo de prueba).
- En cada corte se reentrena con todo lo anterior y se pronostican 8 días con el modelo (P50 y P90) y con los dos baselines.
- Deja `salidas/<fuente>/predicciones.parquet` con la configuración y la huella de los datos (D-18).

### 06_resultados: métricas y estadística (D-14, D-15)
- MAE, RMSE, MASE, WAPE, sesgo, cobertura P90 y pinball(0,9), en total, por plato, por h y por día de la semana. El escenario operativo (h de 2 a 8) va aparte de h = 1.
- Diebold-Mariano con corrección HLN por plato y Holm; Wilcoxon global sobre los pares (plato, corte); diferencia de MAE con IC bootstrap del 95 %. α = 0,05, unilateral.
- ÁUREA: además, modelo frente a la demanda verdadera.
- Escribe tablas (CSV y Markdown) y figuras (PNG) en `resultados/`, que son las que van al informe.

### 07_entrenar_y_publicar (D-17, D-22)
- Para cada fuente:
  - entrenar con todo el historial y la configuración congelada;
  - medir la validación de las últimas 8 semanas frente al ingenuo estacional;
  - armar `ficha.json` (CONTRATO, 5).
- Publicar en `repositorio/modelos/{local_id}/{modelo_version}/`:
  - versión UUID v7;
  - una carpeta existente se rechaza;
  - `vigente.json` (archivo temporal y renombrado) se actualiza **solo si** pasó la puerta.
- **Carga en un entorno limpio:** desde el cuaderno, `uv run --isolated --with ./rc_pronostico` ejecuta un script corto que lee `vigente.json`, verifica la huella y pronostica 7 días de ÁUREA. Se comprueba que las predicciones sean idénticas a las del cuaderno.
- Se publica a propósito un candidato que no pasa la puerta para mostrar que el puntero no se mueve.

## Orden de trabajo y commits (sin push)

1. Workspace de uv, `.gitignore` y `.env.example`, con `jupyterlab`, `nbconvert`, `ipykernel`, `matplotlib`, `scipy`, `holidays`, `httpx`, `pyarrow` y `python-dotenv` en el proyecto raíz.
2. `rc_pronostico` con sus pruebas (base de los cuadernos 03 a 07).
3. Un commit por cuaderno, con sus salidas. Primero 00, 01, 03 y 04, que no necesitan Docker; luego 02 (con Docker); luego 05, 06 y 07.
4. Cierre:
   - `README.md` de model-ia: instalar, abrir Jupyter (`uv run jupyter lab`) y ejecutar todo (`./ejecutar_cuadernos.sh`);
   - D-16 resuelta, D-23 verificada y D-21 completa;
   - `context/plan_seguimiento.md`: 5A cerrada con las cifras, estructura corregida (`dataset/`, `cuadernos/`, `rc_pronostico/`) y 5B como siguiente.

## Verificación

- `uv run pytest rc_pronostico`: pruebas del paquete en verde, sin red ni base de datos.
- `./ejecutar_cuadernos.sh`: los 8 cuadernos corren de principio a fin sin que falle ningún `assert` de las secciones de verificación.
- Reproducibilidad: dos ejecuciones seguidas dejan `resultados/*.csv` idénticos (`git diff --stat` vacío).
- `repositorio/modelos/<local_aurea>/vigente.json` apunta a una versión con `ficha.json` válida, y la carga aislada del 07 da las mismas predicciones.

## Riesgos

- **El CSV no está o su huella no coincide:** el 01 se detiene; no se sigue con otro archivo.
- **skops no carga el HGB categórico:** joblib con SHA-256 obligatorio, anotado en D-16.
- **Docker apagado** (hoy no responde): solo bloquea el 02 y la parte de ÁUREA del 05 al 07. Stuttgart avanza sin Docker.
- **El modelo no le gana al baseline:** es un resultado válido. Se reporta tal cual, y la puerta D-17 hace que se use el baseline.
- **Diferencias de los cuadernos en git:** se versionan con salidas a propósito, para que se lean sin ejecutarlos. Las figuras grandes van como PNG en `resultados/` y no incrustadas en el cuaderno.
