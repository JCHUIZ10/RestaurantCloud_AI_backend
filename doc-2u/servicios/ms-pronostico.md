# ms-pronóstico (IA)

Estructura y reglas comunes: [README.md](README.md).

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Pronosticar las unidades que se venderán de cada plato en los próximos 7 días y dejar trazabilidad de cada ejecución. No calcula la reposición de insumos: eso lo hace el núcleo con las recetas y el stock |
| **Stack** | Python 3.12, FastAPI, scikit-learn, pandas |
| **Base de datos** | PostgreSQL propia; los archivos del modelo van al almacenamiento de objetos |
| **Código** | `restaurantcloud/services/pronostico` |
| **Puerto local** | 8002 |
| **Prefijo en el gateway** | Ninguno: solo lo llama el núcleo |
| **Despliegue** | VM y **Cloud Run** en la Unidad II |

## 2. Datos que gestiona

| Tabla (propuesta) | Propósito |
|---|---|
| `modelo_version` | Algoritmo, parámetros, fecha de entrenamiento, métricas y ubicación del archivo |
| `ejecucion` | Cada pronóstico pedido: local, horizonte, versión del modelo, rango de datos usado, duración y resultado |
| `prediccion` | Una fila por ejecución, producto y día: unidades pronosticadas |

## 3. API

| Método | Ruta | Propósito | Quién llama |
|---|---|---|---|
| POST | `/interno/pronosticos` | Genera el pronóstico de un local y lo devuelve | Núcleo |
| GET | `/interno/pronosticos/{id}` | Recupera una ejecución anterior | Núcleo |
| GET | `/interno/modelos/vigente` | Versión del modelo en uso y sus métricas | Núcleo |
| GET | `/health` | Estado del servicio | Plataforma |

_Detalle de cada endpoint: por completar con la plantilla del README._

## 4. Eventos

| Evento | Sentido | Efecto |
|---|---|---|
| [`pronostico.generado`](eventos.md) | Publica | ms-notificaciones avisa al administrador |

No consume eventos.

## 5. Dependencias y fallos

| Depende de | Si no responde |
|---|---|
| ms-analítica (series de ventas) | Responde 503; el núcleo informa que el pronóstico no está disponible |
| Su PostgreSQL | Responde 503 |
| Historial insuficiente de un plato | No es un fallo: usa el pronóstico ingenuo estacional para ese plato y lo marca en la respuesta |

Si ms-pronóstico cae, el salón, la cocina y la caja siguen funcionando.

## 6. Configuración

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de escucha |
| `DATABASE_URL` | Conexión a su PostgreSQL |
| `SECRETO_INTERNO` | Secreto HMAC para `/interno` |
| `ANALITICA_URL`, `ANALITICA_SECRETO` | Dirección y secreto de ms-analítica |
| `NOTIFICACIONES_URL`, `NOTIFICACIONES_SECRETO` | Dirección y secreto de ms-notificaciones |
| `MODELOS_BUCKET` | Almacenamiento de los archivos del modelo |

## 7. Decisiones abiertas

- Cuándo se entrena: bajo demanda, programado o fuera del servicio (script) con carga del archivo resultante.
- Un modelo por local o uno global con el local como variable.
- Variables de entrada definitivas (rezagos, medias móviles, día de la semana, feriados, promociones).
- Datos sintéticos de entrenamiento: se definen al llegar a esta etapa.
