# Predicción en locales nuevos: niveles, reserva mínima y avisos

**Estado:** decidido y con el backend implementado el 21/11/2026 (sección 8); pantallas hechas el mismo día (5B.5). Confirmados por el responsable del proyecto: los nombres culinarios de los niveles (N-1) y la reserva mínima del 35 % (N-2).
**Afecta a:** ms-pronóstico, núcleo Laravel y frontend. No cambia el modelo ni `rc_pronostico`.
**Casos de uso:** CU-ADMIN-07 (reposición) y CU-PROP-08 (predicción de la empresa).

## 1. El problema

Un local que se registra con el plan Pro (o Enterprise) tiene la predicción habilitada desde el primer día, pero no tiene ventas de las que aprender. Es el problema conocido como **arranque en frío**: el sistema debe dar una respuesta útil y honesta antes de tener datos suficientes para el modelo.

Al revisar el comportamiento implementado en las etapas 5A y 5B (hasta la 5B.4) se encontró que el cálculo no falla, pero la experiencia del usuario sí tiene huecos: un local nuevo recibe una semana vacía, una compra sin reserva justo cuando la incertidumbre es mayor y avisos que no le corresponden.

## 2. Comportamiento actual

El pronóstico de cada plato depende de cuántos días abiertos tiene en el historial. Las reglas están en `model-ia/rc_pronostico/src/rc_pronostico/reglas.py` y `pronosticar.py`; los días anteriores a la apertura no cuentan, porque la regla de cierres (D-05) los trata como días cerrados y no como días con venta 0.

| Días abiertos con ventas | Método | Cómo se calcula | Reserva (P90 − P50) |
|---|---|---|---|
| 0 | `sin_historial` | P50 = P90 = 0 | 0 |
| 1 a 6 (`MIN_ABIERTOS_BASELINE = 7`) | `baseline`, motivo `historial_minimo` | P50 = promedio de los días abiertos; P90 = el máximo | El máximo observado, con muy pocos datos |
| 7 o más, sin modelo del local | `baseline`, motivo `modelo_no_disponible` | P50 = lo vendido el mismo día de la semana anterior (ingenuo estacional, D-09) | **0 hasta tener 4 valores del mismo día de la semana** (`MIN_MISMO_DIA_P90 = 4`): antes de eso el P90 se iguala al P50 |
| Con modelo vigente | `modelo` | Modelo del local (D-06), si el plato tiene al menos 28 días abiertos en los últimos 56 | La del modelo |

El modelo de un local no aparece solo: se entrena y se publica desde `model-ia` (D-02), exige al menos 8 semanas de historial por plato (D-13) y solo se usa si supera al ingenuo estacional (puerta de calidad, D-17). Hasta entonces el local se pronostica con el baseline, que es lo previsto por diseño.

## 3. Problemas encontrados

| # | Problema | Consecuencia para el usuario | Dónde está |
|---|---|---|---|
| P1 | La reserva vale 0 en las primeras 4 semanas con baseline | La compra sugerida no tiene colchón precisamente cuando el pronóstico es menos confiable: más riesgo de quedarse sin insumos | `rc_pronostico`, regla del P90 del baseline |
| P2 | El núcleo solo recuerda los pronósticos que dejaron recomendaciones | Un local sin ventas genera el pronóstico, pero al volver a la pantalla ve «todavía no tiene un pronóstico» | `ReposicionService::ultimaEjecucion` (5B.4) |
| P3 | Sin pronóstico no hay lista de compra | Un insumo ya por debajo de su stock mínimo no se avisa, aunque CU-ADMIN-07 lo pide («solo se marca como crítico si está por debajo del stock mínimo») | `ReposicionService::calcular` (5B.4) |
| P4 | La advertencia `datos_desactualizados` se activa cuando falta `actualizados_hasta` | A un local recién abierto se le diría «no vemos ventas desde…», como si hubiera un fallo | Ficha de ms-pronóstico, sección 3 |
| P5 | Los textos de confianza de la pantalla suponen un modelo | «Aprendió de tus ventas del último año» o «acierta 23 % mejor» serían falsos en un local sin modelo | Maqueta de la 5B.5 |

## 4. Decisiones

### N-1. Niveles de la predicción, visibles para el usuario

**Qué:** cada pronóstico de un local tiene un nivel, que la pantalla muestra con un nombre, una explicación de una línea y el avance hacia el siguiente nivel.

| Nivel | Condición | Nombre | Explicación en pantalla |
|---|---|---|---|
| 0 | El local no tiene ventas en la ventana | **Esperando tus primeras ventas** | «Cuando vendas, empezaremos a calcular tu semana.» |
| 1 | Menos de 28 días con ventas | **En preparación** | «Usamos tus primeros días de venta. Cada día que pasa, la predicción mejora.» |
| 2 | 28 días o más, sin modelo propio vigente | **Casi a punto** | «Ya conocemos tu semana: repetimos lo que vendiste en los mismos días.» |
| 3 | Modelo propio vigente | **Al punto** | «Predicción hecha a la medida de tu local, aprendida de tus ventas.» |

El nivel también se muestra por plato cuando un plato concreto va por debajo del nivel del local (por ejemplo, un plato recién agregado a la carta en un local «Al punto» se ve «En preparación»).

**Por qué:**
- **Honestidad.** Decirle al usuario de dónde sale cada número evita que confíe de más en una estimación hecha con pocos días, y responde a CU-PROP-08, que exige indicar con qué datos se calculó cada cifra.
- **Motivación en lugar de carencia.** «Estimación básica», el nombre que usa hoy el caso de uso, transmite un producto de menor calidad a un cliente que paga el plan Pro. Una escala con avance («faltan 9 días para el siguiente nivel») convierte la espera en progreso.
- **Coherencia con la marca y con el giro.** Términos de cocina («a punto», «al punto») son comprensibles para cualquier persona del rubro, sin lenguaje técnico, y van con el tono cálido de ÁUREA.
- **Umbrales que ya existen.** Los 28 días coinciden con las reglas del propio pronóstico: 4 semanas son 4 valores del mismo día de la semana (el baseline calcula su reserva desde ahí) y 28 días abiertos recientes son el mínimo para usar el modelo. La escala no inventa cortes nuevos.

**Alternativas consideradas:**
- *Nombres técnicos* («modelo», «baseline», «ingenuo estacional»): descartados por la regla L5 de la guía de interfaz (lenguaje de usuario).
- *Dos etiquetas* («modelo de tu local» / «estimación básica»): correctas, pero no muestran avance y la segunda desmotiva.
- *Otra familia de nombres*: «Arrancando · Afinando · A tu medida». Igual de válida; se prefirió la culinaria por ser más memorable en un restaurante.

**Dónde se calcula:** el nivel se deriva en el núcleo a partir de la respuesta de ms-pronóstico. Para distinguir el nivel 1 del 2, ms-pronóstico agrega a su respuesta `historial.dias_con_ventas` (días de la ventana en que el local vendió algo), un dato que `rc_pronostico` ya calcula por plato. Cambio compatible: es un campo nuevo.

### N-2. Reserva mínima en las estimaciones sin modelo

**Qué:** al calcular la reposición, para los días con `metodo = baseline` el núcleo usa como reserva el mayor valor entre la del pronóstico y un porcentaje mínimo de lo más probable:

```
reserva del día = máx(P90 − P50, RESERVA_MINIMA × P50)      solo si metodo = baseline
```

Valor decidido: **35 %**, configurable con `PREDICCION_RESERVA_MINIMA` (0,35).

**Por qué:**
- Resuelve P1: en las primeras semanas la reserva del baseline es 0 o se apoya en muy pocos días, justo cuando la incertidumbre es mayor.
- **El 35 % sale de los datos, no de una intuición.** En el pronóstico de ÁUREA del 21 al 27 de noviembre (140 combinaciones de plato y día, todas con el modelo), la reserva que deja el modelo es en total el **36 %** de lo más probable; por fila, la mediana es 40 % y la mitad central está entre 32 % y 46 %. Un local nuevo tiene más incertidumbre que uno con un año de datos, así que no tiene sentido darle menos reserva que la que el modelo considera necesaria en un local conocido.
- **Es una política de inventario, no un cambio del pronóstico.** Por eso va en el núcleo, dueño de la reposición, y no en `rc_pronostico`: el pronóstico guardado en ms-pronóstico sigue siendo el que el método produjo, y la evaluación del modelo (D-14) no cambia.

**Limitación declarada:** el 36 % viene de datos sintéticos de ÁUREA (etapa 4). Con ventas reales el porcentaje debe revisarse; por eso es configurable.

**Alternativa descartada:** cambiar la regla del P90 del baseline en `rc_pronostico`. Alteraría el contrato del modelo y las métricas ya publicadas de la 5A.

### N-3. El núcleo recuerda cada pronóstico

**Qué:** nueva tabla `solicitud_pronostico` en el núcleo, con una fila por pronóstico pedido: `local_id`, `ejecucion_id`, `cobertura_dias`, `nivel`, `solicitada_por` y `created_at`. `GET /admin/pronosticos/ultimo` la lee a ella en lugar de deducir el último pronóstico de `recomendacion_reposicion`.

**Por qué:** resuelve P2. Además, guardar el nivel permite que la vista del propietario (CU-PROP-08) muestre el nivel de cada sede sin pedirle nada a ms-pronóstico, y deja registro para medir cuánto tarda un local nuevo en llegar a cada nivel.

**Alternativa descartada:** una fila «vacía» en `recomendacion_reposicion` para marcar la ejecución. Mezcla dos conceptos en una tabla con restricciones de insumo.

### N-4. Un insumo bajo su mínimo siempre aparece como urgente

**Qué:** la lista de reposición incluye todo insumo activo con `stock_actual < stock_minimo`, aunque no figure en ninguna receta o el local no tenga pronóstico. Si el pronóstico no le asigna consumo, la cantidad sugerida es la que lo devuelve a su mínimo: `stock_minimo − stock_actual`.

**Por qué:** resuelve P3 y cumple el flujo alternativo de CU-ADMIN-07. En un local nuevo, el stock mínimo que configuró el administrador es la única referencia disponible, y es mejor usarla que mostrar una lista vacía.

### N-5. El aviso de ventas atrasadas solo cuando hay ventas que no llegaron

**Qué:** el núcleo muestra el aviso de datos atrasados solo si él mismo tiene ventas cobradas posteriores a `actualizados_hasta`. ms-pronóstico sigue enviando su advertencia; el núcleo la contrasta con sus comprobantes antes de mostrarla.

**Por qué:** resuelve P4. El núcleo es el dueño de las ventas, así que es el único que puede distinguir «el local es nuevo» de «las ventas no están llegando a ms-analítica». El aviso queda para el caso que de verdad lo necesita.

### N-6. Los textos de confianza dependen del nivel

**Qué:** las frases de confianza de la pantalla se eligen según el nivel. Solo en «Al punto» se muestran «aprendió de tus ventas del último año» y la precisión del modelo (que el núcleo obtiene de `GET /interno/modelos/vigente`). En los niveles 1 y 2 se muestra el avance: días con ventas y cuántos faltan para el siguiente nivel.

**Por qué:** resuelve P5. Una pantalla que promete algo que no hace pierde la confianza del usuario en todo lo demás.

### N-7. Aviso de «listo para entrenar» (posterior a la 5B)

**Qué:** cuando un local lleva 8 semanas con ventas sin modelo propio, el sistema lo informa al equipo que opera `model-ia`, para entrenar y evaluar su modelo.

**Por qué:** hoy el paso del nivel 2 al 3 depende de que alguien lo recuerde. Automatizar el entrenamiento es un cambio mayor (D-02) y queda fuera de esta etapa; el aviso es el primer paso.

## 5. Cambios por componente

| Componente | Cambio | Decisión |
|---|---|---|
| ms-pronóstico | `historial.dias_con_ventas` en la respuesta de `POST` y `GET /interno/pronosticos` | N-1 |
| Núcleo | Cálculo del nivel; tabla `solicitud_pronostico`; `GET …/ultimo` sobre ella | N-1, N-3 |
| Núcleo | Reserva mínima para días `baseline` (`PREDICCION_RESERVA_MINIMA`) | N-2 |
| Núcleo | Insumos bajo mínimo en la lista aunque no tengan consumo previsto | N-4 |
| Núcleo | Contraste de la advertencia de datos atrasados con sus propias ventas | N-5 |
| Frontend | Indicador de nivel con explicación y avance; textos de confianza según el nivel | N-1, N-6 |
| Documentación | Fichas de ms-pronóstico y del núcleo; en `context/cu.md`, «estimación básica» pasa a los nombres de los niveles | Todas |

## 6. Cómo se verifica

- **Pruebas del núcleo**, con ms-pronóstico simulado: un local sin ventas (nivel 0, lista con los insumos bajo mínimo, «último» encontrado); uno con 10 días (nivel 1, reserva del 35 %); uno con 40 días sin modelo (nivel 2); uno con modelo (nivel 3, reserva del modelo); aviso de atraso mostrado solo si el núcleo tiene ventas posteriores.
- **Prueba de ms-pronóstico:** `dias_con_ventas` coincide con los días abiertos de la serie.
- **Prueba de punta a punta** (5B.6): un local nuevo de demostración, sin historial, recorre los niveles 0 y 1 al cargarle ventas.

## 7. Confirmado

- Nombres de los niveles (N-1): Esperando tus primeras ventas, En preparación, Casi a punto y Al punto.
- Reserva mínima (N-2): 35 %, configurable con `PREDICCION_RESERVA_MINIMA`; se revisará con ventas reales.

## 8. Estado de la implementación (21/11/2026)

| Decisión | Estado | Dónde |
|---|---|---|
| N-1 niveles | Hecho: `historial.dias_con_ventas` en ms-pronóstico, `nivel` en el núcleo (`progreso` y `confianza` según el nivel) y los nombres en pantalla (`IndicadorNivel`) | `ms-pronostico` migración 0003; `PronosticoService::nivel` |
| N-2 reserva mínima | Hecho, configurable con `PREDICCION_RESERVA_MINIMA` | `ReposicionService::calcular` |
| N-3 recordar cada pronóstico | Hecho | tabla `solicitud_pronostico`; `GET …/ultimo` ya no da 404 a un local sin recomendaciones |
| N-4 insumos bajo mínimo | Hecho (`motivo = bajo_minimo`, siempre `urgente`) | `ReposicionService::calcular` |
| N-5 aviso de ventas atrasadas | Hecho en el núcleo, contrastado con los comprobantes | `PronosticoService::advertenciasVigentes` |
| N-6 textos según el nivel | Hecho: la pantalla muestra la precisión solo en el nivel 3 y el avance en los niveles 0 a 2 | `IndicadorNivel`, `AvisosPrediccion` |
| N-7 aviso de «listo para entrenar» | Pendiente, posterior a la 5B | — |

**Comprobado con ÁUREA** (modelo propio, nivel 3): 360 días con ventas, confianza «error de 4,9 platos, 24 % mejor que repetir la semana anterior», 16 recomendaciones (4 urgentes, 9 pronto, 3 cubiertas) por S/ 6 766,93 en 2 proveedores. Las pruebas cubren los niveles 0, 1, 2 y 3 con ms-pronóstico simulado.

