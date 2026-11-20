# Decisiones y riesgos del modelo

**Última actualización:** 20/11/2026
**Contrato que resulta de estas decisiones:** [CONTRATO.md](CONTRATO.md)

Cada entrada dice qué podía salir mal, qué se decidió y por qué. Las marcadas **Por confirmar** son una propuesta que todavía no está acordada.

## Resumen

| # | Tema | Estado |
|---|---|---|
| D-01 | Datos del experimento | Decidida |
| D-02 | Dónde se construye el modelo y cómo llega a ms-pronóstico | Decidida |
| D-03 | Desde qué día se pronostica | Decidida |
| D-04 | Cómo se arma el horizonte de 7 días | Decidida |
| D-05 | Días cerrados frente a días sin ventas | Decidida |
| D-06 | Un modelo por local, con el plato como variable | Decidida |
| D-07 | Variables de entrada | Decidida |
| D-08 | Función de pérdida y cuantiles | Decidida |
| D-09 | Baselines de comparación | Decidida |
| D-10 | Partición y evaluación con varios puntos de corte | Decidida |
| D-11 | Ajuste de hiperparámetros sin fuga | Decidida |
| D-12 | Variables que no entran | Decidida |
| D-13 | Criterios de inclusión y exclusión | Decidida |
| D-14 | Métricas, definidas antes de ejecutar | Decidida |
| D-15 | Prueba estadística | Decidida |
| D-16 | Formato y seguridad del artefacto | Decidida; formato a verificar |
| D-17 | Puerta de calidad para usar un modelo | Decidida |
| D-18 | Reproducibilidad | Decidida |
| D-19 | Entorno propio de `model-ia` | Decidida |
| D-20 | Limitaciones que se declaran | Decidida |
| D-21 | Cambios que esto obliga en `doc-2u/servicios/ms-pronostico.md` | Pendiente para la integración |
| D-22 | Repositorio de modelos | Decidida |
| D-23 | Coherencia de la entrada con ms-analítica | Decidida; verificación con datos pendiente |

---

## D-01. Datos del experimento

**Riesgo:** entrenar y evaluar solo con datos sintéticos hace el resultado circular (el modelo recupera reglas que escribimos nosotros) e incumple la guía, que pide datos reales para el artículo (secciones 4.2 y 4.4).

**Decisión:**

| Dataset | Papel | Se declara como |
|---|---|---|
| **Restaurante de Stuttgart** (Mendeley Data, DOI 10.17632/7s3ys9ntnz.1, CC BY 4.0) | Experimento principal del artículo | Real, público, Alemania, 2013-10-04 a 2015-11-07 |
| **ÁUREA** (`aurea_v1`, semilla 2026) | Demostración en vivo con reposición; experimento de control contra la demanda verdadera (`--verdad`) | Sintético |

Lo revisado del archivo de Stuttgart: 760 días con datos en un rango de 765; faltan 5, todos de Navidad y Año Nuevo. 7 platos, unos 126 por día en total. Fechas en formato `mes.día.año`.

**Del archivo solo se usan** `DEMAND_DATE`, las 7 columnas de platos e `ISHOLIDAY`. Las otras 280 columnas (rezagos ya calculados, clima, totales) se ignoran: las variables las calcula nuestro propio código, el mismo que usa el servicio.

## D-02. Dónde se construye el modelo y cómo llega a ms-pronóstico

**Riesgo:** si el experimento calcula las variables con un código y ms-pronóstico con otro, el modelo recibe en producción algo distinto de lo que vio al entrenar (*training-serving skew*). Es una de las fallas más comunes y no se ve en las métricas del experimento.

**Decisión:**

- **El modelo se construye aparte, en `model-ia/`.** Ahí se exploran los datos, se ajusta, se entrena, se evalúa y se publica en el repositorio de modelos (D-22).
- **ms-pronóstico no entrena.** Al arrancar, o cuando cambia la versión vigente, **descarga** el artefacto del repositorio, verifica su huella y su compatibilidad (CONTRATO, 5) y lo usa para predecir.
- **Lo único que se comparte es el cálculo de las variables.** Para predecir, el servicio tiene que armar las mismas variables que vio el modelo al entrenar, y eso es código, no datos: ningún formato de archivo (skops, ONNX, joblib) lo lleva dentro. Por eso `model-ia` separa dos piezas:

| Pieza | Contenido | Llega a ms-pronóstico |
|---|---|---|
| `rc_pronostico` (paquete de inferencia) | Validación de la entrada, calendario, variables, baselines, reglas por plato (CONTRATO, 4.1) y carga verificada del artefacto. Sin acceso a red ni a bases de datos | Sí, como dependencia con **versión fijada** en su imagen |
| Entrenamiento y experimento | Fuentes de datos, partición, ajuste, entrenamiento, métricas, pruebas estadísticas y publicación | **No** |

- La ficha del artefacto registra `version_variables`, un entero que sube cada vez que cambia el cálculo de las variables. Si no coincide con el del paquete instalado en el servicio, el servicio no usa ese modelo y pronostica con el baseline.

No rompe la regla de que un servicio no importa código de otro, porque `rc_pronostico` es una librería, no un servicio.

**Alternativas descartadas:**
- Copiar el código de las variables al servicio: dos copias terminan divergiendo.
- Que ms-pronóstico entrene: cada imagen arrastraría las dependencias del experimento y el entrenamiento competiría con las peticiones.

## D-03. Desde qué día se pronostica

**Riesgo:** si se usan las ventas del día en curso, que está incompleto, se subestima la demanda.

**Decisión:** el pronóstico empieza **mañana** y usa datos **hasta ayer**. Hay un día de distancia (hoy) entre el último dato y el primer día pronosticado, así que los 7 días pedidos quedan entre 2 y 8 días después del último dato.

**Por qué:** la recomendación de reposición sirve para comprar con anticipación, y la compra de hoy ya está hecha cuando el administrador abre la pantalla. Empezar hoy obligaría a usar el día incompleto o a pronosticar un día que ya está en curso. El contrato admite igualmente `fecha_inicio` = hoy (distancia 1) para quien lo necesite.

Consecuencias:
- El modelo se entrena con distancias de 1 a 8 días.
- El experimento reporta como resultado principal el **escenario operativo** (distancias 2 a 8) y aparte la distancia 1.

## D-04. Cómo se arma el horizonte de 7 días

**Riesgo:** usar como entrada las propias predicciones de días anteriores acumula error. Usar variables que no estarán disponibles al momento de pronosticar filtra el futuro.

**Decisión:** **un solo modelo directo con la distancia como variable.** Cada fila de entrenamiento es (día de corte `d`, distancia `h`, plato), con objetivo `y(d+h)`. Todas las variables se calculan con datos de `d` o anteriores. Nunca se usan predicciones como entrada.

## D-05. Días cerrados frente a días sin ventas

**Riesgo detectado:** la serie de ms-analítica (`generate_series` en `app/datos/series.py`) rellena con 0 todo día sin ventas. Un cierre por Navidad queda igual que un día en que nadie pidió el plato. Si entra como 0, arrastra hacia abajo los rezagos y las medias de las semanas siguientes, y el modelo aprende que en Navidad se vende 0 cuando en realidad estaba cerrado.

**Decisión:**
- Un día cerrado **no es objetivo de entrenamiento ni de evaluación**, y en los rezagos y las medias se trata como **dato faltante**, no como 0. HistGradientBoosting acepta faltantes sin imputar.
- Fuente de los cierres, en este orden: la lista `dias_cerrados` de la entrada; si no llega, **se considera cerrado el día en que el local entero vendió 0**.
- En Stuttgart, los días cerrados son los que no tienen fila.
- En el pronóstico, un día cerrado conocido devuelve 0 con `metodo = cerrado`.

**Pendiente para la integración:** quién envía los cierres futuros. El núcleo conoce los horarios y las excepciones del local.

## D-06. Un modelo por local, con el plato como variable

**Riesgo:** un modelo por plato tiene muy pocos datos (unos 700 días cada uno). Un modelo global para todos los locales mezcla cartas distintas.

**Decisión:** **un modelo por local**, entrenado con todos sus platos juntos y el plato como variable categórica. Las diferencias de escala (pollo, unas 30 por día, frente a calamares, unas 4) las absorben las variables de nivel reciente del propio plato.

- La tabla `producto_id → código` va dentro del artefacto.
- Un plato que el modelo no vio va al baseline (CONTRATO, 4.1).
- HistGradientBoosting admite hasta 255 categorías por variable. Es un límite de la carta, no de las ventas, y ningún local de la demo se acerca.

**Consecuencias (confirmadas el 20/11/2026):**
- **En el experimento la pregunta no aplica:** Stuttgart es un solo restaurante, así que su modelo «por local» es el de sus 7 platos juntos.
- **El modelo de Stuttgart no sirve para ÁUREA:** los platos son otros y el plato es una variable. El modelo de Stuttgart queda para el artículo, y el que se publica para la demostración se entrena con la serie de ÁUREA leída de ms-analítica.
- **Cada local necesita su propio entrenamiento**, que se hace en `model-ia` y se publica en el repositorio (D-02, D-22). Mientras un local no tenga modelo vigente, se pronostica con el baseline.
- **Los hiperparámetros se eligen una sola vez**, en la validación de Stuttgart (D-11), y se congelan. El modelo de cada local se entrena con ellos y solo pasa a `vigente` si supera la puerta de calidad (D-17).

**Modelo global: trabajo futuro.** Un modelo único sin el plato como variable (con variables escaladas por el nivel de cada plato) cubriría locales y platos nuevos sin entrenar de nuevo. No entra en la versión 1 por tres razones:
- Juntaría en un solo modelo las ventas de varios inquilinos, cuando el sistema los aísla con RLS.
- Hoy mezclaría datos reales de Alemania con datos sintéticos de Perú.
- Con un solo restaurante real no se puede evaluar si mejora.

## D-07. Variables de entrada

Todas se calculan con datos hasta el día de corte `d`, para el día objetivo `t = d + h`.

| Grupo | Variables |
|---|---|
| Del día objetivo | día de la semana, día del mes, mes, `es_feriado`, `vispera_feriado`, `pos_feriado` |
| De la petición | `h` (1 a 8), `producto` (categórica) |
| Nivel reciente | `y(d)` a `y(d−6)`; media de 7 y de 28 días; desviación de 28 días |
| Mismo día de la semana | último valor del mismo día de la semana que `t` (≤ `d`); media de los últimos 4 |
| Tendencia | media de 7 días ÷ media de 28 días |

El día del mes cubre los días de pago sin usar una regla propia de Perú. No se usa el año, porque un árbol no puede extrapolarlo.

## D-08. Función de pérdida y cuantiles

**Riesgo:** con error cuadrático el modelo estima la media; con regresión cuantil, la mediana. Si la métrica principal es el MAE y el modelo optimiza otra cosa, se le pone en desventaja frente al baseline.

**Decisión:**
- **P50:** `loss="quantile", quantile=0.5`. La mediana es lo que minimiza el MAE.
- **P90:** un segundo regresor con `loss="quantile", quantile=0.9`.
- Variante a probar en validación: `loss="poisson"` para P50, por ser datos de conteo. Se queda la de menor MAE de validación, y la elección se congela antes de tocar la prueba.

## D-09. Baselines de comparación

| Baseline | Fórmula | Por qué |
|---|---|---|
| **Ingenuo estacional** (principal, el de la hipótesis de la Unidad I) | Último valor del mismo día de la semana ≤ `d`: `y(t − 7·⌈h/7⌉)` | Es la referencia estándar en series con ciclo semanal |
| Media del mismo día (secundario) | Media de los últimos 4 valores del mismo día de la semana ≤ `d` | Es más difícil de superar; si el modelo le gana, el resultado es más sólido |

Para el P90 del baseline: percentil 90 de los últimos 8 valores del mismo día de la semana.

## D-10. Partición y evaluación con varios puntos de corte

**Riesgo:** una sola partición da una sola cifra, que depende de las semanas que tocaron. Una validación cruzada aleatoria mezcla el futuro con el pasado.

**Decisión (Stuttgart):**

| Tramo | Fechas | Uso |
|---|---|---|
| Arranque | 2013-10-04 a 2013-11-07 | Solo para calcular rezagos; no son objetivos |
| Entrenamiento inicial | hasta 2014-11-07 | Incluye la primera Navidad |
| Validación para hiperparámetros | 2014-09-13 a 2014-11-07 (últimas 8 semanas del entrenamiento) | Elegir la configuración |
| **Prueba** | 2014-11-08 a 2015-11-07 | No se mira hasta congelar todo; incluye la segunda Navidad |

- **Puntos de corte semanales** dentro de la prueba (unos 52). En cada uno se **reentrena con todo lo anterior** (ventana creciente) y se pronostican los 8 días siguientes. Así se imita un reentrenamiento semanal en producción.
- ÁUREA usa el mismo esquema con su propio calendario: primer año para entrenar, segundo para la prueba.

## D-11. Ajuste de hiperparámetros sin fuga

**Riesgo:** la detención temprana de HistGradientBoosting toma por defecto una validación **aleatoria** (`validation_fraction`), que en series de tiempo filtra el futuro.

**Decisión:**
- `early_stopping=False`; el número de iteraciones se elige en la rejilla.
- Rejilla pequeña y fija: `learning_rate` {0,05; 0,1}, `max_iter` {200, 500}, `max_leaf_nodes` {15, 31}, `min_samples_leaf` {20, 50}, más la pérdida de P50 de D-08. Son 32 combinaciones.
- Se elige la de menor MAE en la validación, se **congela** y se registra antes de ejecutar la prueba. La prueba se ejecuta una sola vez con esa configuración.
- `random_state = 2026`.

## D-12. Variables que no entran en la versión 1

| Variable | Por qué no |
|---|---|
| Clima | Al pronosticar no se conoce el clima de la semana siguiente sin un servicio externo de pronóstico del tiempo |
| Promociones | Stuttgart no tiene; ms-analítica solo conoce las usadas, no las planificadas |
| Precio | Stuttgart no tiene; el núcleo no informa cambios de precio planificados |
| Año | Un árbol no extrapola fuera del rango visto |

Las promociones quedan como trabajo futuro: requieren que el núcleo envíe las campañas planificadas.

## D-13. Criterios de inclusión y exclusión

Los pide la guía en la sección 4.1-14.

- **Se excluyen como objetivo:** días cerrados (D-05) y días del tramo de arranque.
- **Platos:** entran al modelo los que tienen ≥ 8 semanas de historial en el entrenamiento. En Stuttgart son los 7.
- **No se eliminan valores atípicos.** La regresión cuantil es robusta y quitar picos reales infla el resultado.
- **Columnas agregadas** de Stuttgart (`TOTAL`, `TOTAL_FISCHPROD`, `TOTAL_FLEISCH`) no se pronostican: no son platos.

## D-14. Métricas, definidas antes de ejecutar

| Métrica | Cálculo | Papel |
|---|---|---|
| **MAE** | media de \|y − ŷ\| | **Principal**; es la de la hipótesis |
| RMSE | raíz de la media de (y − ŷ)² | Penaliza errores grandes |
| MASE | MAE ÷ MAE del ingenuo estacional dentro del entrenamiento, por plato | Compara platos de escala distinta |
| WAPE | Σ\|y − ŷ\| ÷ Σy | Porcentaje que funciona con días en 0 |
| Sesgo | media de (ŷ − y) | Positivo: sobrestima; negativo: subestima |
| Cobertura P90 | % de días con y ≤ P90 | Debería quedar cerca del 90 % |
| Pérdida pinball (0,9) | pérdida cuantil del P90 | Compara el P90 del modelo con el del baseline |

**No se usa MAPE:** con días en 0 la división no está definida (calamares tiene 32).

Se reportan en total, por plato, por distancia `h` y por día de la semana. Los resultados del modelo se presentan **separados** de los de la nube (latencia y errores del servicio), como pide la guía.

## D-15. Prueba estadística

**Riesgo:** la hipótesis de la Unidad I dice «significativamente inferior»; sin prueba no se puede afirmar. Con solo 7 platos, una prueba sobre los 7 tiene poca potencia.

**Decisión:**
- Unidad de análisis: **el punto de corte**. Para cada plato y punto de corte se calcula el error absoluto medio de sus 7 días. Así se tienen unas 52 observaciones por plato, con menos autocorrelación que día a día.
- **Por plato:** prueba de Diebold-Mariano con la corrección de Harvey, Leybourne y Newbold sobre la diferencia de errores, con corrección de Holm por los 7 platos.
- **En total:** Wilcoxon de rangos con signo sobre los pares (plato, punto de corte), unos 364.
- α = 0,05, unilateral (el modelo tiene menor error). Se reporta además el tamaño del efecto: la diferencia de MAE con su intervalo bootstrap del 95 %.

## D-16. Formato y seguridad del artefacto

**Riesgo:** cargar un archivo `pickle` o `joblib` ejecuta código; un archivo alterado en el bucket compromete el servicio. Además, un modelo entrenado con una versión de scikit-learn puede no cargar, o predecir distinto, con otra.

**Decisión:**
- Formato **skops** (carga solo tipos permitidos, sin ejecutar código arbitrario). **A verificar** al crear el entorno que guarde y cargue `HistGradientBoostingRegressor` con variables categóricas. Si no, se usa `joblib` con verificación obligatoria del SHA-256.
- **Verificado en el cuaderno 00 (scikit-learn 1.7.2, skops 0.13.0):** skops guarda y carga el HGB cuantil con categóricas y las predicciones son idénticas; rechaza tipos no listados y el SHA-256 detecta un byte alterado. skops pide declarar como confiables 7 tipos internos de scikit-learn (`functools.partial`, `IdentityLink`, `Interval`, `PinballLoss`, `_BinMapper`, `TreePredictor`, `check_array`). `artefacto.py` llevará esa lista **explícita y fija**, no `get_untrusted_types` del propio archivo, para que un archivo con tipos extra no se acepte.
- La ficha registra el SHA-256 y el servicio lo verifica antes de cargar (CONTRATO, 5). Dónde se publica: D-22.
- La versión de scikit-learn queda fijada igual en `model-ia` y en ms-pronóstico. Si no coincide, el servicio usa el baseline.

## D-17. Puerta de calidad para usar un modelo

**Riesgo:** un reentrenamiento con datos raros puede producir un modelo peor que el baseline, y nadie lo nota.

**Decisión:** un modelo nuevo queda `candidato`. Solo pasa a `vigente` si su MAE de validación es menor que el del ingenuo estacional sobre el mismo tramo. Si ninguno lo supera, el local se pronostica con el baseline y se informa con `metodo = baseline`.

## D-18. Reproducibilidad

- Dataset de Stuttgart versionado en el repositorio con su ficha de origen (DOI, licencia, SHA-256 `eb7d66f0…3e8b`). La licencia CC BY 4.0 permite redistribuirlo citando a la fuente.
- Versiones fijadas con `uv.lock`; `random_state` fijo.
- Cada corrida del experimento guarda la configuración, la huella de los datos y las métricas en una carpeta con fecha.
- Las tablas y figuras del informe se generan con un comando, no a mano.

## D-19. Entorno propio de `model-ia`

**Por qué un entorno aparte:** las dependencias del experimento (pandas, scipy, matplotlib, cuadernos) no deben llegar a la imagen de ms-pronóstico, y los secretos de acceso a ms-analítica no deben compartirse con otros proyectos.

**Decisión:**
- Proyecto de **uv** propio, con Python 3.12, igual que los servicios. Su `.venv` es local y no se versiona.
- `.env` propio, no versionado (ya lo cubre el `.gitignore` de la raíz). `.env.example` con los nombres: rutas de datos y salidas, `ANALITICA_URL` y `ANALITICA_SECRETO` (solo para leer la serie de ÁUREA), `SEMILLA`.
- Se versionan: código, dataset de Stuttgart con su ficha, configuración y resultados finales que van al informe. No se versionan: `.venv`, `.env`, modelos entrenados ni salidas intermedias.

## D-20. Limitaciones que se declaran

- **Demanda censurada:** si un plato se agotó, se registra lo vendido, no lo pedido. Ni Stuttgart ni el sistema guardan la disponibilidad.
- **Un solo restaurante real**, en otro país (Alemania) y en otro periodo (2013 a 2015). El resultado no se generaliza sin más a un restaurante peruano.
- **Solo 7 platos** en Stuttgart.
- **La reposición no se evalúa** con datos reales: Stuttgart no tiene recetas ni stock. Coincide con la sección 6.5.6 de la Unidad I.
- **ÁUREA es sintético:** sus métricas solo muestran que el modelo recupera un patrón conocido.

## D-21. Cambios que esto obliga en `doc-2u/servicios/ms-pronostico.md`

Se aplican al empezar la integración, no ahora:

- `prediccion`: agregar `unidades_p90`, y ampliar `metodo` con `cerrado` y `sin_historial`.
- `ejecucion`: `horizonte_dias` de 1 a 7 (hoy permite hasta 14); agregar `huella_datos`.
- Sección 7: cerrar «un modelo por local o global» (D-06), «variables» (D-07) y «cuándo se entrena»: fuera del servicio, en `model-ia`, y el servicio solo descarga el artefacto (D-02).
- Sección 6: `MODELOS_BUCKET` pasa a `MODELOS_REPOSITORIO`, que admite `file://` y `gs://` (D-22).
- Sección 2: `modelo_version` registra `artefacto_sha256` y `version_variables`; `empresa_id` y `local_id` dejan de admitir nulo (no hay modelo global en la versión 1).
- Lectura de la serie: pedirla por tramos de hasta 730 días cuando el historial supere ese rango (D-23).

## D-22. Repositorio de modelos

**Riesgo:** si el servicio carga «el último archivo» de una carpeta, un modelo a medio subir o uno que no pasó la puerta de calidad puede entrar en producción. Si una versión se sobrescribe, se pierde la trazabilidad de las predicciones ya guardadas.

**Decisión:**
- El repositorio es el **almacenamiento de objetos de GCP (Cloud Storage)**, el mismo que la ficha de ms-pronóstico llama `MODELOS_BUCKET`. Mientras no exista la infraestructura de la nube (etapa 8 del plan), se usa una **carpeta local con la misma estructura**. El código de publicación y el de carga reciben la raíz como `file://…` o `gs://…`, así que pasar a la nube es cambiar una variable.
- Estructura:

```text
modelos/
  {local_id}/
    {modelo_version}/        ← inmutable: nunca se sobrescribe
      modelo.skops
      ficha.json
    vigente.json             ← puntero: { modelo_version, sha256, publicado_en }
```

- **Publicar** es: subir los dos archivos a una carpeta nueva y, **solo si el modelo pasó la puerta de calidad (D-17)**, reescribir `vigente.json` al final. Un modelo que no la pasa queda en el repositorio como `candidato` y el puntero no cambia.
- **ms-pronóstico lee el puntero**, descarga esa versión, verifica el SHA-256 y la compatibilidad (CONTRATO, 5) y la registra en su tabla `modelo_version`. Si algo falla, sigue con el modelo anterior o con el baseline.
- La carpeta local es `model-ia/repositorio/` y no se versiona. Cómo se monta en el contenedor de ms-pronóstico se define en la integración.

**Alternativas descartadas:** Hugging Face Hub y GitHub Releases. Funcionan, pero quedan fuera de GCP, donde se despliega el resto del sistema.

## D-23. Coherencia de la entrada con ms-analítica

**Riesgo:** que el modelo se entrene con una forma de datos (Stuttgart) y en producción reciba otra (la serie de ms-analítica), sin que ninguna métrica lo muestre.

Revisión de `GET /interno/series/ventas-diarias` (`app/datos/series.py`) frente a la sección 2 del CONTRATO:

| El contrato pide | ms-analítica entrega | Qué se hace |
|---|---|---|
| Serie continua desde la primera venta, con 0 en los días sin ventas | Lo mismo, con `generate_series` desde `max(primera_venta, desde)` | Coincide |
| Unidades netas por `fecha_operativa` | Las anulaciones ya vienen descontadas, por jornada operativa | Coincide |
| `dias_cerrados` | No los entrega | Se aplica la regla de respaldo de D-05 (el local entero vendió 0). En ÁUREA debe detectar el 25/12 y el 01/01 de cada año |
| `feriados` | No los entrega | `model-ia` usa la librería `holidays` (Perú; en Stuttgart, la columna `ISHOLIDAY`). Quién los envía en producción se define en la integración |
| `datos_hasta` = ayer | Acepta cualquier `hasta` | Lo controla quien pide la serie; el validador rechaza una serie que incluya hoy |
| Historial completo | Como máximo 730 días por petición | Suficiente para ÁUREA hoy (730 días); al crecer, se pide por tramos |

Además:
- **`ultimo_evento_en` no indica datos frescos** en la base de desarrollo: vale la hora de la carga sintética.
- **Calendario del generador frente a `holidays`:** el generador de ÁUREA tiene su propia lista de feriados de Perú (`app/sinteticos/feriados.py`). Si difiere de la librería, el experimento de control mediría también esa diferencia. Se comparan año por año y cualquier diferencia se documenta.
- **Fechas de demanda que no son feriado** (San Valentín, Día de la Madre, Nochebuena…): el generador las usa y el modelo no las conoce. Queda como limitación del experimento de control, no como error.

**Verificación con datos (pendiente, paso 2 de la etapa):** un validador del contrato en `rc_pronostico` y un cuaderno que lee la serie de ÁUREA con el GET firmado, la valida, comprueba los cierres detectados y la compara con la demanda verdadera que exporta `--verdad`.
