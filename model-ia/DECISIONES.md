# Decisiones y riesgos del modelo

**Última actualización:** 19/11/2026
**Contrato que resulta de estas decisiones:** [CONTRATO.md](CONTRATO.md)

Cada entrada dice qué podía salir mal, qué se decidió y por qué. Las marcadas **Por confirmar** son una propuesta que todavía no está acordada.

## Resumen

| # | Tema | Estado |
|---|---|---|
| D-01 | Datos del experimento | Decidida |
| D-02 | Dónde vive el código del modelo | **Por confirmar** |
| D-03 | Desde qué día se pronostica | **Por confirmar** |
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

## D-02. Dónde vive el código del modelo — Por confirmar

**Riesgo:** si el experimento calcula las variables con un código y ms-pronóstico con otro, el modelo recibe en producción algo distinto de lo que vio al entrenar (*training-serving skew*). Es una de las fallas más comunes y no se ve en las métricas del experimento.

**Propuesta:** `model-ia/` contiene un paquete de Python sin acceso a red ni a bases de datos (variables, modelos, baselines, métricas y la carga y verificación del artefacto). El experimento lo usa directamente, y ms-pronóstico lo instala como dependencia local en su imagen.

No rompe la regla de que un servicio no importa código de otro, porque `model-ia` es una librería, no un servicio.

**Alternativa descartada:** copiar el código al servicio. Dos copias terminan divergiendo.

## D-03. Desde qué día se pronostica — Por confirmar

**Riesgo:** si se usan las ventas del día en curso, que está incompleto, se subestima la demanda.

**Propuesta:** el pronóstico empieza **mañana** y usa datos **hasta ayer**. Hay un día de distancia (hoy) entre el último dato y el primer día pronosticado, así que los 7 días pedidos quedan entre 2 y 8 días después del último dato.

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
- La ficha registra el SHA-256 y el servicio lo verifica antes de cargar (CONTRATO, 5).
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
- Sección 7: cerrar «un modelo por local o global» (D-06), «variables» (D-07) y «cuándo se entrena» (comando aparte, semanal).
