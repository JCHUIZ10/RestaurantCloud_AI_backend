# Plan: construcción de la Unidad II sobre `betta`

**Última actualización:** 20/11/2026. Etapas 0 a 4 y 5A cerradas; la 5B (ms-pronóstico) está en curso: 5B.0 a 5B.4 cerradas, sigue la 5B.5 (la pantalla de React).

## Contexto

La rama `monolito` conserva el producto de la Unidad I. En `betta` está el diseño de la arquitectura distribuida (`doc-2u/`): tres microservicios alrededor del núcleo Laravel, cada uno con su base de datos y sus contratos de API y de eventos. El entorno local se llama `restaurantcloud-ia` (contenedores `restaurantcloudIA_*`).

La guía evalúa en la semana 11: microservicios, Docker e integración (25 %), aplicación funcional (20 %), IA integrada (15 %), y además exige API documentada, imágenes en Artifact Registry, un despliegue PaaS, un laboratorio de GKE y el protocolo experimental.

El trabajo va en etapas que dejan algo demostrable cada una. Las cerradas resumen lo hecho; las siguientes son la hoja de ruta y se detallan al llegar.

**Reglas de trabajo:** commits pequeños por tema, sin línea de coautoría; Pint sobre los archivos PHP tocados antes de cada commit; ningún `git push` sin confirmación; cualquier cambio de contrato se refleja en `doc-2u/servicios/`.

## Estado

| Etapa | Estado | Verificación |
|---|---|---|
| 0. Preparación del entorno | Cerrada | Suite del núcleo en verde en tres ejecuciones completas |
| 1. Núcleo: publicar eventos | Cerrada | Pruebas de publicación y de entrega |
| 2. ms-analítica | Cerrada | 80 pruebas de pytest contra PostgreSQL real |
| 3. Integración de punta a punta | Cerrada | `scripts/smoke-analitica.sh`: 39 comprobaciones |
| Extra: resiliencia de la entrega | Cerrada | 23 pruebas de resiliencia y escenario de caída real |
| Extra: identificadores ordenados | Cerrada | Suite completa: 639 pruebas |
| 4. Datos sintéticos | Cerrada | 24 meses de ÁUREA en 3 min 45 s; 111 pruebas de ms-analítica; humo: 28 comprobaciones |
| 5A. Modelo de pronóstico (`model-ia`) | Cerrada | 8 cuadernos de principio a fin sin fallar ningún `assert`; 65 pruebas de `rc_pronostico`; MAE 4,85 contra 6,24 del ingenuo en la prueba de Stuttgart |
| 5B. ms-pronóstico | **En curso** (5B.0 a 5B.4 cerradas) | Ficha con D-21 aplicada; servicio en el puerto 8002 que pronostica con el modelo real de la 5A (140 de 140 filas con `modelo` en ÁUREA) y reposición sugerida desde el núcleo; 201 pruebas del servicio y 24 de la reposición en el núcleo |

---

## Etapa 0. Preparación del entorno — cerrada

- Compose renombrado a `restaurantcloud-ia`, contenedores `restaurantcloudIA_*` y una base por servicio (`db-analitica`, `db-pronostico`, `mongo-notificaciones`). Estructura de `services/` e `infra/` creada (`doc-2u/02-organizacion-carpetas-proyecto.md`).
- La falla aislada de `MozoMesasUnionTest` no volvió a aparecer en tres ejecuciones completas posteriores (607, 633 y 639 pruebas en verde). Se da por no reproducida.
- Los cambios ajenos del árbol de trabajo los commiteó el usuario.

## Etapa 1. Núcleo: publicar eventos — cerrada

Todo en `restaurantcloud/apps/api`; contrato en `doc-2u/servicios/nucleo-laravel.md` y `eventos.md`.

- Migración `outbox_entrega`, `config/eventos.php`, `PublicadorEventos` y `EventosNucleo` (arma los `datos` desde las filas ya guardadas en la transacción).
- Emisión de `venta.registrada` (cobro de cuenta y de subcuenta), `comprobante.anulado` (nota de crédito) y `pedido.anulado`. Las cuatro inserciones de `pedido_anulacion` de `MozoController` pasan por un único método, y cada una tiene su prueba: ítem, comanda con ítems, comanda vacía y quiebre de cocina.
- `outbox:despachar-eventos` (cada minuto) y `EntregarEventoJob`, firmado con HMAC-SHA256.
- **Cambio sobre lo previsto:** un 422 del destino ya no se reintenta; pasa directo a `fallido`, como dice el contrato.

## Etapa 2. ms-analítica — cerrada

Carpeta `restaurantcloud/services/analitica`; contrato en `doc-2u/servicios/ms-analitica.md`.

- Python 3.12, FastAPI, SQLAlchemy 2 (Core) y Alembic, con uv. Capas `api`, `dominio`, `datos` y `soporte` (respuesta común, firma, `X-Request-Id`, logs JSON). La capa `soporte` no importa de las demás, para poder copiarla a otro servicio.
- `POST /interno/eventos`: el evento y su registro en `evento_procesado` se guardan en una sola transacción que se confirma **antes** de responder. Es idempotente por evento y por clave natural (`comprobante_id`, `anulacion_id`), tolera el desorden (anulación antes que la venta) y serializa los eventos de un mismo comprobante con un bloqueo de PostgreSQL.
- `GET /interno/series/ventas-diarias`: serie continua con `generate_series`, con ceros en los días sin ventas.
- Base: usuario `analitica_app` sin privilegios de DDL, creado por `infra/postgres/analitica/01-usuarios.sh`, que es idempotente y se puede reejecutar sobre un volumen existente. Las migraciones las aplica el contenedor `analitica-migraciones` con el usuario administrador.
- Dockerfile multietapa con usuario no root; servicio `restaurantcloudIA_analitica` en el puerto 8001.
- **Decisiones que cambiaron el contrato** (ya reflejadas en la ficha):
  - Un GET se firma sobre su cadena de consulta, para que sus parámetros no se puedan alterar.
  - El rango máximo de 730 días cuenta ambos extremos.
  - `ultimo_evento_en` es la llegada de la última venta del local.
  - pandas se incorpora con los reportes; la serie se arma en SQL.

## Etapa 3. Integración de punta a punta — cerrada

`scripts/smoke-analitica.sh` (desde `restaurantcloud/`) cubre los tres escenarios con el POS real, sin datos sintéticos:

1. Cobrar y ver la venta en ms-analítica: llegó en unos 15 s.
2. Anular con nota de crédito y ver la serie corregida: volvió a 0.
3. Apagar ms-analítica, cobrar, encenderla: el evento llegó solo en 68 s, sin contar como fallo.

Antes comprueba lo que ninguna prueba unitaria ve: que el worker escucha la cola `eventos`, que `ANALITICA_URL` está definida y que el secreto de firma coincide en los tres lados.

- **Evidencias:** el script las guarda en `doc-2u/evidencias/smoke-analitica/<fecha>/`, carpeta que **no se versiona** (se regenera con el script). Para el informe se toman extractos de ahí.
- **Contratos de forma:** `doc-2u/servicios/contratos/` describe la forma de cada evento real. El núcleo comprueba que emite exactamente eso, y ms-analítica que lo acepta, sin compartir código. Se regeneran con `ACTUALIZAR_CONTRATOS=1` cuando un cambio es intencional (`doc-2u/servicios/README.md`).

## Extra: resiliencia de la entrega de eventos — cerrada

Surgió al revisar qué pasa si ms-analítica se apaga por mantenimiento: con 8 intentos, una caída de más de unas 2 horas dejaba entregas fallidas.

- Cada fallo se clasifica en `outbox_entrega.motivo_fallo`. Si el destino no responde, rechaza la firma o no está configurado, no se gastan intentos y se espera hasta `EVENTOS_HORIZONTE_DIAS` (7). Un 500 cuenta contra el límite de 8; un 422 pasa a `fallido` al instante.
- `PausaDeDestinos`: con el destino caído se retienen sus entregas; al vencer la pausa sale una sola de prueba y, cuando responde, las retenidas se adelantan en orden cronológico.
- `outbox:estado` y `outbox:reenviar-eventos`, con `--dry-run`, filtros y comprobación de `/health`. Reenviar es seguro porque el receptor es idempotente.

## Extra: identificadores ordenados por tiempo — cerrada

La base genera ids con `fn_uuid_v8()`, pero el código pasaba los suyos con `Str::uuid()`, que es versión 4 (aleatoria), y fragmentaba los índices.

- `App\Support\Identificador::ordenado()` (UUID v7) para claves de fila y `::aleatorio()` (v4) para secretos: `token_qr`, token de refresco y archivo temporal de exportación.
- Una prueba de arquitectura impide usar `Str::uuid()` en `app/`. Los ids existentes no cambian.

---

## Etapa 4. Datos sintéticos — cerrada

### Decisiones de diseño de la IA (acordadas antes de empezar)

- **Un solo modelo de IA:** el pronóstico de demanda **por plato** en ms-pronóstico. No hay un segundo modelo para la reposición: no existen ejemplos de «la compra correcta» con los que entrenarlo.
- **CU-ADMIN-07** (administrador) convierte el pronóstico en una lista de compras dentro del núcleo: `pronóstico × receta + stock de seguridad − stock_actual`. Es un cálculo, no IA. El stock de seguridad sale de **P90 − P50** del modelo (regresión cuantílica de HistGradientBoosting), de modo que la incertidumbre del modelo llega a la cantidad sugerida.
- **CU-PROP-08** (propietario) muestra el mismo pronóstico por plato y por local, con el resumen de reposición de cada sede. Si el historial es insuficiente, usa el baseline y lo indica.
- **Aceptar, ajustar o descartar** la recomendación: *aceptar* abre la ficha de compra (CU-ADMIN-06) prellenada; *ajustar* es editar esa ficha; *descartar* es un botón. La IA nunca compra sola. La tasa de aceptación y la diferencia entre lo sugerido y lo comprado son métricas del protocolo.
- **Cobertura:** selector de 3, 5 o 7 días en la pantalla (3 por defecto). Sin cambios de esquema.
- **`snapshot_stock_diario` sale de la etapa 4.** Ningún dato de entrenamiento ni la recomendación la usan, y es por insumo mientras el modelo es por plato. Queda en el esquema sin uso (quitarla obliga a tocar RLS y el seed). Su valor real sería detectar **demanda censurada** (días con platos agotados); eso queda como limitación conocida y, de abordarse, sería con un evento `producto.disponibilidad_cambiada`. CU-SISTEMA-01 queda diferido.

### Decisiones sobre los datos sintéticos

- **No viajan por red ni por el outbox.** Un generador dentro de ms-analítica aplica cada venta con la misma función de dominio que procesa `venta.registrada` (`aplicar_venta_registrada`), sin HTTP. Son decenas de miles de ventas y se cargan en minutos; en producción se ejecuta con `docker exec` en el servidor, así que no consume el ancho de banda de quien lo lanza.
- **El núcleo no recibe comprobantes falsos:** caja, reportes del POS y series SUNAT quedan limpios. La IA solo necesita el pronóstico, las recetas y el stock actual.
- **Sin marca de «sintético».** Es un MVP que se reemplazará por datos reales. Para eso el generador produce datos **solo hasta una fecha de corte** (por defecto, ayer) y rechaza hoy o el futuro. Pasar a datos reales es purgar en ms-analítica todo lo anterior al corte (`purgar`).
- **Reproducible:** semilla fija y perfil versionado (`aurea_v1`). Como la demanda esperada se conoce, el generador puede exportarla («la verdad») para el protocolo.
- **Carta:** se amplía ÁUREA Miraflores (hoy 5 platos, 6 insumos y 1 mozo) **solo agregando** filas, sin cambiar ningún valor existente, porque las pruebas del núcleo dependen del seed. **Historial:** 24 meses, para que cada feriado y temporada aparezca dos veces (un año para entrenar y otro para evaluar).

### Qué se hizo

1. **`aplicar_venta_registrada`** (ms-analítica): la lógica de guardar una venta y sumarla a la serie es pública y la usan por igual el evento real y el generador. Las inserciones de ítems, productos vistos y serie pasan de `executemany` a una ejecución por fila: el modo pipeline tardaba cientos de milisegundos por llamada desde un cliente Windows hacia Docker.
2. **`app/sinteticos/`** (ms-analítica): calendario de feriados de Perú con Semana Santa calculada y fechas de demanda (Día de la Madre, San Valentín…); perfil versionado `aurea_v1` (día de la semana, mes, tendencia +8 %, días de pago, feriados, campañas de la promoción, popularidad por plato, medio de pago, franjas horarias); generador puro cuyo sorteo de un día depende solo de (semilla, local, fecha).
3. **Comandos** `python -m app.sinteticos generar|purgar`: una transacción por día, idempotente por comprobante, rechaza hoy y el futuro, `--verdad` exporta la demanda esperada por plato y día; `purgar` borra todo lo anterior a un corte y reconstruye `producto_visto` (sin `--confirmar` solo cuenta).
4. **Seed de ÁUREA** ampliado solo con filas nuevas: 20 platos, 16 insumos, 46 líneas de receta con insumos compartidos y 3 mozos.
5. **`php artisan carta:exportar <local_id>`** (núcleo): entrega la carta, los mozos y las promociones activos en el JSON que lee el generador.

### Resultado de la verificación

- **Carga de 24 meses de ÁUREA** (2024-11-18 a 2026-11-17) dentro del contenedor: 730 días, 39.036 ventas, 302.227 unidades, en **3 min 45 s**. No sale tráfico a internet.
- **Serie por `GET /interno/series/ventas-diarias` firmado:** 20 platos × 730 días continuos, respuesta en 0,16 s. Ceros solo en los 4 días cerrados (25/12 y 01/01 de ambos años). Promedio de unidades por día de la semana, lunes a domingo: 278, 323, 326, 371, 518, 571, 514. Verano alto y junio bajo; enero de 2026 supera a enero de 2025 en un 13 % (tendencia y campaña de promoción).
- **`smoke-analitica.sh --rapido`:** 28 comprobaciones; una venta real de hoy llega, se suma a la serie y se corrige al anular, aparte del histórico.
- Suites: ms-analítica 111 pruebas; núcleo 639 en verde con el seed ampliado, más 4 de `carta:exportar`.

### Cómo se usa

```bash
docker exec restaurantcloudIA_api php artisan carta:exportar <local_id> \
  | docker exec -i restaurantcloudIA_analitica python -m app.sinteticos generar --carta - \
      --perfil aurea_v1 --semilla 2026 --meses 24 --verdad /tmp/verdad.csv
```

Detalle y la purga al pasar a datos reales: `restaurantcloud/services/analitica/README.md`.

---

## Etapa 5A. Modelo de pronóstico (`model-ia/`) — cerrada

El modelo se construyó **aparte**, antes del servicio, en cuadernos de Jupyter. El diseño está en `model-ia/DECISIONES.md` (D-01 a D-23), la entrada y salida en `model-ia/CONTRATO.md` (versión 0.3) y cómo usarlo en `model-ia/README.md`. La integración con ms-pronóstico es de la 5B.

### Decisiones acordadas (20/11)

- **Datos:** Stuttgart (real, público) para el experimento del artículo; ÁUREA (sintético) para la demostración y como experimento de control contra su demanda verdadera (D-01).
- **Un modelo por local**, con el plato como variable. El de Stuttgart queda para el artículo; el que se publica para la demostración se entrena con la serie de ÁUREA. El modelo global queda como trabajo futuro (D-06).
- **ms-pronóstico no entrena: descarga el modelo.** Solo comparte con `model-ia` el paquete `rc_pronostico` (variables, baselines, reglas y carga verificada), con versión fijada y `version_variables` en la ficha (D-02).
- **Se pronostica desde mañana con datos hasta ayer**, con distancias de 2 a 8 días (D-03).
- **Repositorio:** Cloud Storage. Mientras no exista la nube, una carpeta local `model-ia/repositorio/` con la misma estructura y un puntero `vigente.json` que solo se mueve si el modelo supera la puerta de calidad (D-22).

### Estructura de `model-ia/` (como quedó)

```text
model-ia/
  README.md  CONTRATO.md  DECISIONES.md  PLAN.md
  pyproject.toml  uv.lock  .env.example      workspace de uv propio (D-19)
  rc_pronostico/                             paquete que instalará ms-pronóstico, con sus pruebas
    src/rc_pronostico/                       contrato, calendario, variables, baselines, reglas,
                                             artefacto y pronosticar
  cuadernos/                                 00_entorno a 07_entrenar_y_publicar, con sus salidas
  ejecutar_cuadernos.sh                      ejecuta 00 a 07 en orden
  configuracion/                             rejilla, tramos y congelada.json
  dataset/stuttgart/                         CSV y FICHA.md (DOI, licencia, SHA-256)
  resultados/                                tablas y figuras del informe (versionadas)
  salidas/  repositorio/                     datos intermedios y modelos (no versionados)
```

Los cuadernos contienen el trabajo (datos, ajuste, evaluación, métricas, estadística y publicación). Solo lo que el servicio necesita para predecir igual que al entrenar vive en `rc_pronostico/`, porque ms-pronóstico no puede importar un cuaderno.

### Qué se hizo y qué se encontró

| # | Cuaderno | Resultado |
|---|---|---|
| 00 | Entorno | skops guarda y carga el HistGradientBoosting cuantil con categóricas y predice lo mismo; hay que declarar 7 tipos de scikit-learn como confiables (D-16) |
| 01 | Stuttgart | SHA-256 igual al de D-18; 765 días × 7 platos, 5 cierres, 22 feriados |
| 02 | ÁUREA | GET firmado: 20 platos × 730 días; la regla de respaldo detecta exactamente los 4 cierres; `holidays` agrega 3 feriados por año al calendario del generador; piso de ruido MAE 4,96 (D-23 verificada) |
| 03 | Variables y baselines | Sin fuga: alterar el futuro no cambia variables ni baselines |
| 04 | Ajuste | 32 configuraciones; gana `quantile`, `learning_rate` 0,05, 200 iteraciones, 15 hojas, 50 muestras mínimas (MAE de validación 4,24) |
| 05 | Evaluación | 52 cortes semanales por fuente; la prueba se ejecutó una sola vez con la configuración ya commiteada |
| 06 | Resultados | Ver abajo |
| 07 | Publicación | Un modelo vigente por fuente; un candidato malo queda como candidato y el puntero no se mueve; carga en entorno limpio con predicciones idénticas |

**Resultados de la prueba (h de 2 a 8):**

| | Modelo | Ingenuo estacional | Media del mismo día (4) |
|---|---|---|---|
| Stuttgart, MAE | 4,85 | 6,24 (−22,3 %, significativo en 7 de 7 platos) | 5,10 (−4,8 %, significativo en 4 de 7) |
| ÁUREA, MAE | 5,45 | 7,47 (−27,0 %) | 5,93 (−8,0 %, significativo en 16 de 20) |

El P90 cubre 86,1 % de los días en Stuttgart (objetivo 90 %). En ÁUREA, frente a la demanda verdadera, el modelo tiene MAE 2,40 contra un piso de ruido de 5,09. Puerta D-17 en las últimas 8 semanas: Stuttgart 5,23 contra 6,22 del ingenuo; ÁUREA 4,87 contra 6,37. Las limitaciones están en D-20.

### Detalles del entrenamiento que se cuidaron

- **Fuga por el horizonte:** una fila (`d`, `h`) entra a un entrenamiento con corte `c` solo si `d + h ≤ c`; el historial posterior al corte se descarta antes de calcular nada.
- Días cerrados como dato faltante, no como 0 (D-05). `early_stopping=False` y `random_state = 2026` (D-11).
- La prueba se ejecutó **una sola vez**; antes se ensayó la mecánica con la ventana de validación.

### Para la 5B

- Aplicar los cambios de D-21 a `doc-2u/servicios/ms-pronostico.md` y usar `rc_pronostico` con `scikit-learn==1.7.2` y `skops==0.13.0`.
- Definir cómo se monta `model-ia/repositorio/` en el contenedor y quién envía cierres y feriados futuros.
- Trabajo futuro: una rejilla más amplia o validación con varios bloques (D-20). Se decidió dejar la rejilla de D-11 como estaba.

---

## Etapa 5B. ms-pronóstico — en curso

Se divide en pasos que dejan algo demostrable cada uno. 5B.0 a 5B.3 dejan el servicio probado por sí solo (pytest), antes de tocar el núcleo.

| Paso | Contenido | Demostrable | Estado |
|---|---|---|---|
| 5B.0 Ficha | D-21 aplicada a `doc-2u/servicios/ms-pronostico.md`; detalle de los 3 endpoints, carga del modelo, configuración y decisiones cerradas | El contrato antes que el código | Cerrada |
| 5B.1 Esqueleto | Arquitectura de puertos y adaptadores, `soporte/` copiado de ms-analítica, `/health`, Alembic con las 3 tablas y permisos mínimos (0002), usuario `pronostico_app` sin DDL, Dockerfile con `rc_pronostico`, servicio y migraciones en el compose (puerto 8002) | Contenedor arriba, migrado y sano; 66 pruebas; el modelo de la 5A carga dentro de la imagen | Cerrada |
| 5B.2 Baseline | `POST /interno/pronosticos` con `artefacto=None`, serie de ms-analítica (365 días), calendario, guardado de solo agregado, idempotencia por `solicitud_id`, `GET /interno/pronosticos/{id}`, 503 si ms-analítica cae | Pronóstico de punta a punta sin modelo; 161 pruebas; probado contra ms-analítica real | Cerrada |
| 5B.3 Modelo | `rc_pronostico` en la imagen (dependencia por ruta y contexto adicional), repositorio montado de solo lectura, carga verificada, registro en `modelo_version`, vuelta al modelo anterior o al baseline, `GET /interno/modelos/vigente` | `metodo = modelo` en ÁUREA; un archivo alterado no se usa | Cerrada |
| 5B.4 Núcleo | Cliente firmado, `POST /api/v1/admin/pronosticos`, `GET …/ultimo` y `PATCH /api/v1/admin/reposiciones/{id}`, `jornada_actual` y cierres futuros, `recomendacion_reposicion`, reposición con `P90 − P50`, plan Pro con `incluye_prediccion_ia` | Reposición sugerida por API con el modelo real de ÁUREA | Cerrada |
| 5B.5 React | Pantalla de pronóstico y reposición (CU-ADMIN-07) y vista del propietario (CU-PROP-08) | Flujo de la demostración | **Siguiente** |
| 5B.6 Humo | `scripts/smoke-pronostico.sh` con evidencias | Prueba de punta a punta para el informe | — |

### Decisiones de la 5B.0 (20/11)

- **El núcleo informa la `jornada_actual`** (la conoce por su horario y la zona horaria del local). ms-pronóstico pide datos hasta la jornada anterior y pasa `hoy = jornada_actual` a `pronosticar`, así que no deduce fechas en UTC.
- **Ventana de 365 días en una sola petición** a ms-analítica, sin filtrar productos. Da el mismo pronóstico que el historial completo (las variables miran 63 días atrás) y evita los tramos de 730.
- **Cierres:** regla de respaldo para el historial, unida a los cierres del periodo que envía el núcleo. **Feriados:** `holidays==0.109` en el servicio, como en el entrenamiento.
- **El baseline no es una fila de `modelo_version`:** sin modelo, `ejecucion.modelo_version_id` es nulo.
- **El modelo se revisa por local en cada pronóstico** (como mucho cada 60 s); si una versión nueva no se verifica, se sigue con la anterior y, si no hay, con el baseline.
- **`pronostico.generado` pasa a la etapa 7**, junto con su consumidor.
- **Versiones fijadas como en `model-ia/uv.lock`:** scikit-learn 1.7.2, skops 0.13.0, numpy 2.5.5, pandas 3.1.1 y holidays 0.109.

### Lo que dejó la 5B.1 (20/11)

- **Arquitectura ligera de puertos y adaptadores.** Hay interfaz solo donde hay dos implementaciones: `AlmacenArtefactos` (carpeta hoy, Cloud Storage en la etapa 8) y `SondaBd`; en la 5B.2 se suman `FuenteSeries`, `RegistroEjecuciones` y `Reloj`. `tests/test_arquitectura.py` hace cumplir las reglas de dependencias (se comprobó que fallan al violarlas).
- **Descargar el modelo no es un caso de uso:** el almacén solo lee bytes y `ProveedorModelos` (5B.3) decide cuándo recargar, verifica y respalda. Modelo en memoria por local, puntero revisado cada 60 s, como mucho 50 locales.
- **«Solo se agrega» lo hace cumplir la base:** la migración 0002 da a `pronostico_app` solo `SELECT` e `INSERT` en `ejecucion` y `prediccion` (verificado: `permission denied` al hacer `UPDATE` o `DELETE`).
- **`/health` degradado:** sin repositorio de modelos responde 200 `degradado`, no 503, porque el servicio sigue pronosticando con el baseline.
- **Imagen de 768 MB** por numpy, pandas, scipy y scikit-learn. Es el costo de predecir con `rc_pronostico`; a considerar en el arranque en frío de Cloud Run (etapa 8).
- Se agregaron `PRONOSTICO_DB_APP_USER`, `PRONOSTICO_DB_APP_PASSWORD`, `PRONOSTICO_PORT`, `PRONOSTICO_URL` y `PRONOSTICO_SECRETO` a `.env.example` (y al `.env` local).

### Lo que dejó la 5B.2 (20/11)

- **`POST` y `GET /interno/pronosticos`** de punta a punta con el baseline: 161 pruebas (base real, ms-analítica simulada, firma, validación, idempotencia, fallos). Humo real contra ms-analítica con los 20 platos de ÁUREA: 201 en 489 ms; el reintento devuelve 200 con la misma ejecución y el GET es igual al POST.
- **Una ejecución fallida también se guarda** (con `detalles.ejecucion_id` en el error) y un `solicitud_id` fallido se puede reintentar hasta completarse.
- **Ventana de 365 días verificada:** con el modelo real publicado en la 5A, 365 y 730 días de historial dan el mismo pronóstico. Con 20 días ya cambia (120 de 140 filas); con 40 o más no. Por eso `VENTANA_HISTORIAL_DIAS` va de 70 a 730.
- **Límite del aviso `datos_desactualizados`:** con tolerancia de 3 días no detecta una falla de entrega de 1 o 2 días. Con el histórico sintético terminando el 17/11, el 18 y 19 se tomaron como cierres **sin advertencia**.
- Un `ModelosVigentes` (puerto) con `SinModelos` deja listo el enchufe para la 5B.3: solo hay que cambiar el adaptador.

### Lo que dejó la 5B.3 (20/11)

- **`ProveedorModelos`** (casos de uso) decide cuándo recargar, verifica y respalda; el almacén solo lee bytes. Modelo en memoria por local, puntero revisado cada 60 s, como mucho 50 locales (el menos usado se descarta), un candado por local. Cambiar de proveedor de almacenamiento es escribir un adaptador de `AlmacenArtefactos`.
- **Verificado con el modelo real de la 5A** (copiado a un repositorio temporal que sí se altera): carga única aunque lleguen 8 peticiones a la vez; solo se relee el puntero pasado el intervalo; una versión nueva retira a la anterior en `modelo_version` y el puntero que vuelve atrás reactiva la fila; archivo alterado, SHA-256 distinto, ficha de otro local o sin aprobar, scikit-learn distinto y puntero roto **se rechazan y se sigue con el modelo anterior**; tras un reinicio con el puntero roto se carga la versión registrada. Se comprobó con mutaciones que las pruebas detectan quitar la puerta de calidad y el respaldo en memoria.
- **Humo real:** `GET /interno/modelos/vigente` → modelo `01a1fa8e…`, MAE 4,87 frente a 6,37 del ingenuo. Pronóstico de los 20 platos de ÁUREA: 140 de 140 filas con `metodo = modelo`, 389 ms la primera petición (incluye cargar el modelo) y unos 290 ms las siguientes.
- Una prueba de la 5B.2 era intermitente (ordenaba por un UUID v7, que dentro del mismo milisegundo no tiene orden); se corrigió y se repitió 8 veces.
- **Pendiente para la nube (etapa 8):** `gs://` no tiene adaptador todavía; `crear_almacen` lo rechaza al arrancar con un mensaje claro.

### Lo que dejó la 5B.4 (20/11)

- **Cliente firmado en el núcleo** (`PronosticoCliente`): firma el cuerpo del POST y la cadena de consulta del GET, reenvía `X-Request-Id` y traduce cada fallo de ms-pronóstico a un error del núcleo (503 si no responde o no está configurado, 503 `ERR_ANALITICA_NO_DISPONIBLE` y 502 `ERR_SERIE_INVALIDA` con el `ejecucion_id` de la ejecución fallida, 502 si rechaza la firma o la forma). La función de firma salió de `EntregarEventoJob` a `App\Support\FirmaInterna`, que usan el outbox y este cliente.
- **Qué envía el núcleo:** `jornada_actual` con la misma función que los eventos (`fechaJornadaDe`), los platos activos y los cierres del periodo calculados con `JornadaOperativaService::resolver`, es decir, el horario semanal y las excepciones con `cerrado`, sin reimplementarlos. Siempre pide 7 días; la cobertura (3, 5 o 7) se recorta del lado del núcleo. Un local sin horario configurado no envía cierres.
- **Reposición:** `consumo_previsto + margen_seguridad − stock`, con `margen = Σ (P90 − P50)`; los insumos inactivos no entran; el stock y la cobertura quedan guardados en cada fila. Tabla `recomendacion_reposicion` (migración `2026_11_20_000001`, con RLS por sede). Se agregaron `cobertura_dias` y `margen_seguridad` a lo que decía la ficha, para poder explicar la cantidad sugerida.
- **Idempotencia:** un reintento con el mismo `solicitud_id` recupera la misma ejecución y las mismas recomendaciones; no las recalcula con el stock de hoy.
- **Decisión humana:** `PATCH` acepta, ajusta o descarta y registra quién y cuándo; una vez decidida no cambia (409). La decisión es atómica en la base.
- **Plan:** la ruta exige `incluye_prediccion_ia` (`modulo.prediccion`, 403 con los planes que la incluyen); Pro ya la tiene (commit anterior).
- **Verificado:** 24 pruebas nuevas (6 de la fórmula sin base y 18 del flujo con ms-pronóstico simulado: firma, cuerpo enviado, cierres, reintento, errores, decisiones, plan y rol). Humo real con el modelo de ÁUREA: `POST` 201 en 1,6 s con 140 filas `metodo = modelo` y 7 `sin_historial` (el plato 21 no tiene historial), 16 recomendaciones; `GET …/ultimo` las devuelve junto con el pronóstico.
- **Limitación conocida:** `GET …/ultimo` solo conoce ejecuciones que produjeron recomendaciones (no hay tabla de ejecuciones en el núcleo). Una sede sin recetas no tiene «último».

### Antes de la demostración

- El histórico sintético de `analitica_db` termina el 2026-11-17. Los días posteriores llegan en 0 y la regla de respaldo los toma como cerrados. Extender la carga sintética hasta ayer antes de demostrar.

---

## Hoja de ruta (se detalla al llegar)

| Etapa | Contenido | Requisito de la guía que cubre |
|---|---|---|
| 5B. ms-pronóstico | Servicio con baseline de punta a punta; descarga y verificación del modelo publicado en la 5A; cambios de D-21 en su ficha; endpoints del núcleo; tabla `recomendacion_reposicion`; pantalla de pronóstico y reposición en React | IA integrada en un flujo real (15 %) |
| 6. JWT y gateway | JWT RS256 en login y refresh; Kong con rutas y validación; reportes públicos de ms-analítica (alcance de CU-ADMIN-13 por definir) | Arquitectura distribuida; seguridad |
| 7. ms-notificaciones | Servicio Node/Fastify con MongoDB, bandeja y SSE; campana en React; el núcleo deja de insertar en `notificacion` | Tercer microservicio |
| 8. Nube | Imagen de la API con el código dentro; imágenes en Artifact Registry; VM con todo el sistema; ms-pronóstico en Cloud Run; laboratorio de GKE | Registro, PaaS, Kubernetes |
| 9. Seguridad | Rol `rc_app`, prueba de RLS en la base e inventario de consultas sin contexto | Seguridad y configuración |
| 10. Informe | OpenAPI de cada servicio, diagramas exportados, protocolo experimental, plan de migración, plan hacia la semana 16 | Informe y documentación |

Orden recomendado si el tiempo aprieta: 4 → 5 → 8 antes que 6 y 7, porque IA y despliegue pesan más en la nota. ms-notificaciones es obligatorio para la guía, así que no puede omitirse, solo reducirse a bandeja sin tiempo real.

## Pendientes conocidos

- **Carga inicial de ventas históricas.** Un evento publicado antes de configurar `ANALITICA_URL` no tiene entrega para ese destino y no se recupera solo. El generador sintético de la etapa 4 **no** entra por el outbox (ver sus decisiones); el histórico real, si se necesita, se reenvía con `outbox:reenviar-eventos`.
- ~~**Plan y predicción (etapa 5B).**~~ Resuelto: el plan Pro tiene `incluye_prediccion_ia = true` en `06_seed_initial_data.sql` (como ya decía el wireframe de CU-PROP-03 y CU-PROP-08: «Pro/Enterprise»), así que ÁUREA, que está en el Pro, puede usar la predicción. Una base ya creada se actualiza con `UPDATE plan SET incluye_prediccion_ia = true WHERE id = 2`.
- **Promociones como variable del modelo.** Quedan fuera de la versión 1 del modelo (D-12). Para pronosticar días futuros con promoción, el núcleo debe enviar a ms-pronóstico las promociones planificadas; ms-analítica solo conoce las usadas.
- ~~**Quién envía cierres y feriados en producción.**~~ Resuelto en la 5B.0: el núcleo envía los cierres del periodo pronosticado; los del historial salen de la regla de respaldo y los feriados de `holidays` en ms-pronóstico.
- **Demanda censurada.** Los días con platos agotados subestiman la demanda y el modelo la aprende más baja. Sin historial de disponibilidad no se puede corregir; limitación a documentar en el informe.
- **Conciliación por jornada** (pieza 5 de la propuesta de resiliencia): ms-analítica expone totales por jornada y el núcleo reenvía lo que no cuadre. Junto con ms-pronóstico.
- **Alerta de entregas fallidas** en ms-notificaciones (etapa 7).
- **Imágenes en producción:** al desplegar hay que **reconstruir** las imágenes de `api`, `queue` y `scheduler`, no solo reiniciarlas. Con una imagen antigua el worker no escucha la cola `eventos`, y los cambios de configuración (`ANALITICA_URL`) solo se aplican al recrear el contenedor.
- **Montaje de contratos:** el contenedor `api` monta `doc-2u/servicios/contratos` solo para las pruebas; no va en `docker-compose.prod.yml`.
- **Histórico sintético en la base de desarrollo.** `analitica_db` tiene 730 días de ÁUREA hasta 2026-11-17, y `ultimo_evento_en` de la serie vale la hora de esa carga, no la de una venta real: ms-pronóstico no debe interpretarlo como actividad reciente. Al activar datos reales se ejecuta `purgar` con el corte.
- **Datos de la prueba de humo en la base de desarrollo:** producto, mesas y pedidos `SMOKE`, comprobantes reales y una caja que el script abrió y dejó abierta. Antes de una demostración conviene recrear la base de desarrollo.

## Riesgos

- **`CajaController::cobrar` es el punto más delicado.** La publicación del evento son dos inserciones dentro de la transacción, sin llamadas de red; cubierto por las pruebas de cobro y por la prueba de humo.
- **`docker-compose.prod.yml` conserva los nombres `saas_*`.** Renombrarlo crearía volúmenes vacíos en el servidor desplegado; se decide en la etapa 8.
- **La suite completa del núcleo tarda unos 14 minutos.** Durante el desarrollo se ejecutan las clases afectadas; la suite completa, al cerrar cada etapa.

## Verificación

- **Núcleo:** `docker exec restaurantcloudIA_api php artisan test --compact` (639 pruebas en la última corrida completa, 18/11, más 4 de `carta:exportar` ejecutadas aparte). Si se cambia el seed, antes `./scripts/test-db-reset.sh`.
- **ms-analítica:** `uv run pytest` en `services/analitica`, con `TEST_DATABASE_URL` y `TEST_APP_DATABASE_URL` (111 pruebas, unos 2 minutos desde el host).
- **Integración:** `./scripts/smoke-analitica.sh` (o `--rapido`, sin el escenario de caída).
- **Estado de las entregas:** `docker exec restaurantcloudIA_api php artisan outbox:estado`.
