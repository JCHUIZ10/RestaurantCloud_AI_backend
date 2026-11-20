# Contrato del modelo de pronóstico

**Versión del contrato:** 0.3 (borrador, 20/11/2026)
**Decisiones y riesgos que lo sustentan:** [DECISIONES.md](DECISIONES.md)

Este documento fija qué recibe el modelo, qué devuelve y qué garantiza. Lo cumplen por igual el experimento de `model-ia/` y ms-pronóstico. Si cambia, cambia primero aquí.

## 1. Qué hace

Pronostica las **unidades que se venderán de cada plato de un local en cada uno de los próximos 7 días**. Por cada plato y día entrega dos cifras:

- **P50 (mediana):** la cifra que se muestra y con la que se calcula el consumo.
- **P90:** un valor alto razonable. El núcleo usa `P90 − P50` como stock de seguridad.

No calcula la reposición de insumos (eso lo hace el núcleo con las recetas y el stock) y no compra nada.

## 2. Entrada

### 2.1 Historial

Una fila por plato y día **operativo** (`fecha_operativa`, no fecha de calendario):

| Campo | Tipo | Regla |
|---|---|---|
| `producto_id` | uuid o texto | Identificador estable del plato en el local |
| `fecha` | date | Día operativo |
| `unidades` | entero ≥ 0 | Unidades netas: vendidas menos anuladas |

- **Continua:** cada plato tiene una fila por día desde su primera venta hasta `datos_hasta`, con 0 si no se vendió.
- **`datos_hasta` es el último día completo** (ayer). El día en curso nunca entra, porque está incompleto.
- **Mínimo útil:** 56 días abiertos del local (ver 4.1).

**De dónde sale:** en el sistema, de `GET /interno/series/ventas-diarias` de ms-analítica, que ya cumple la continuidad y las unidades netas; en el experimento, del archivo de Stuttgart. Las diferencias entre lo que pide este contrato y lo que entrega ms-analítica están en D-23.

### 2.2 Calendario

| Campo | Tipo | Regla |
|---|---|---|
| `dias_cerrados` | lista de fechas | Días en que el local no abrió, en el historial **y** en el periodo a pronosticar |
| `feriados` | lista de fechas | Feriados del país del local, en el historial **y** en el periodo a pronosticar |

Los dos entran **como dato**, no se deducen dentro del modelo, para que el mismo código sirva para Perú (ÁUREA) y para Alemania (Stuttgart). Si `dias_cerrados` no llega, se aplica la regla de respaldo de D-05. ms-analítica no entrega ninguno de los dos (D-23).

### 2.3 Petición

| Campo | Tipo | Regla |
|---|---|---|
| `fecha_inicio` | date | Primer día pronosticado. Normalmente mañana |
| `horizonte_dias` | entero | De 1 a 7 |
| `productos` | lista | Platos activos que se quieren pronosticar. Un plato retirado de la carta no se pide |

Restricción: `fecha_inicio − datos_hasta` ≤ 2 días, y `fecha_inicio + horizonte_dias − 1 − datos_hasta` ≤ 8 días (ver D-03). Fuera de eso se rechaza con un error de validación, no se pronostica con datos viejos.

## 3. Salida

Una fila por plato pedido y día del periodo:

| Campo | Tipo | Garantía |
|---|---|---|
| `producto_id` | igual a la entrada | Todos los platos pedidos aparecen, también los que no se pudieron pronosticar |
| `fecha` | date | Cada día de `fecha_inicio` a `fecha_inicio + horizonte_dias − 1` |
| `p50` | decimal (2) | ≥ 0 |
| `p90` | decimal (2) | ≥ `p50` |
| `metodo` | texto | `modelo`, `baseline`, `cerrado` o `sin_historial` |
| `motivo` | texto o nulo | Por qué no se usó el modelo (ver 4.1) |

Y, una vez por respuesta:

| Campo | Contenido |
|---|---|
| `modelo_version` | Identificador del modelo usado |
| `datos_desde`, `datos_hasta` | Rango del historial usado |
| `huella_datos` | SHA-256 del historial usado, para reproducir el cálculo |

Las cifras son decimales porque son un valor esperado; redondear para comprar es tarea del núcleo.

## 4. Reglas por plato

### 4.1 Qué método se usa

| Situación del plato | `metodo` | `p50` | `p90` |
|---|---|---|---|
| El día pedido es un día cerrado | `cerrado` | 0 | 0 |
| El modelo lo vio al entrenar con ≥ 8 semanas de historial, y hay ≥ 28 días abiertos entre los últimos 56 días | `modelo` | Modelo cuantil 0,5 | Modelo cuantil 0,9 |
| Tiene ≥ 7 días abiertos, pero no cumple lo anterior | `baseline` | Ingenuo estacional (D-09) | Percentil 90 de los mismos días de la semana disponibles (hasta 8); si hay menos de 4, igual a `p50` |
| Tiene de 1 a 6 días abiertos | `baseline`, motivo `historial_minimo` | Promedio de los días disponibles | Máximo observado |
| No tiene ninguna venta | `sin_historial` | 0 | 0 |

**Motivos** (`motivo`, cuando `metodo = baseline`): `historial_minimo` (de 1 a 6 días abiertos), `modelo_no_disponible` (no hay artefacto vigente o no se pudo cargar), `producto_no_visto` (el modelo no lo vio al entrenar con ≥ 8 semanas) y `historial_reciente_insuficiente` (menos de 28 días abiertos en los últimos 56). Un plato cerrado ese día lleva `cerrado` y `motivo` nulo; uno sin ventas, `sin_historial` y `motivo` nulo.

### 4.2 Garantías numéricas

- `p50` y `p90` se recortan a 0 por debajo.
- Si el modelo devuelve `p90 < p50` (cruce de cuantiles), se usa `p90 = p50`.
- `p50` y `p90` se redondean a 2 decimales (después de aplicar las garantías anteriores).
- El resultado es determinista: mismo modelo y misma entrada dan la misma salida.

## 5. Artefacto del modelo

Lo produce el entrenamiento en `model-ia`, se publica en el repositorio de modelos y ms-pronóstico lo **descarga**; el servicio no entrena (D-02).

| Pieza | Contenido |
|---|---|
| Archivo del modelo (`modelo.skops`) | Los dos regresores (cuantil 0,5 y 0,9) y la tabla `producto_id → código de categoría` |
| Ficha (`ficha.json`) | `modelo_version`, `local_id`, algoritmo, hiperparámetros, lista exacta de variables y su orden, `version_variables`, versiones de Python, scikit-learn y numpy, rango y huella de los datos de entrenamiento, métricas de validación frente al baseline, SHA-256 del archivo |

Ubicación en el repositorio (D-22): `modelos/{local_id}/{modelo_version}/` con los dos archivos, que nunca se sobrescriben, y `modelos/{local_id}/vigente.json`, que apunta a la versión en uso.

Reglas de seguridad y compatibilidad:

- ms-pronóstico **verifica el SHA-256** del archivo contra la ficha antes de cargarlo, y solo carga archivos de su propio repositorio.
- La versión de scikit-learn con que se entrenó y con que se carga **debe ser idéntica**. Si no coincide, el servicio no carga el modelo y usa el baseline.
- `version_variables` de la ficha **debe ser igual** a la del paquete `rc_pronostico` instalado en el servicio, porque es el código que arma las variables. Si no coincide, el servicio usa el baseline.
- Un modelo solo pasa a `vigente` si su MAE de validación es **menor** que el del baseline (D-17). El puntero `vigente.json` solo se actualiza en ese caso.

## 6. Fuera de este contrato

- Promociones, precio y clima: no son variables de la versión 1 (D-12).
- Demanda censurada por platos agotados: limitación conocida (D-20).
- Cómo se transporta todo esto entre el núcleo, ms-pronóstico y ms-analítica: se define en la integración.
