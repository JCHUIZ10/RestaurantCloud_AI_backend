# Plan: construcción de la Unidad II sobre `betta`

**Última actualización:** 27/11/2026. Etapas 0 a 4, 5A, 6 y 7 cerradas; la 5B (ms-pronóstico) está terminada salvo revisar sus pantallas en un navegador. La etapa 8 (Nube) está **en curso (no cerrada)**: se completó la primera parte (empaquetado, QA local y manual de Artifact Registry); queda pendiente la ejecución de los despliegues en GCP (Artifact Registry, VM, Cloud Run para ms-pronóstico y laboratorio GKE).

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
| 5B. ms-pronóstico | Cerrada salvo la revisión en navegador | Ficha con D-21 aplicada; servicio en el puerto 8002 que pronostica con el modelo real de la 5A (140 de 140 filas con `modelo` en ÁUREA) y reposición sugerida desde el núcleo; 201 pruebas del servicio y 24 de la reposición en el núcleo; humo: 108 comprobaciones |
| 6. JWT y gateway | Cerrada | JWT RS256 en todos los inicios de sesión, validado por Kong y por ms-analítica; 4 reportes de CU-ADMIN-13 en menos de 0,1 s; Kong 3.9.1 como entrada única; pantalla «Reportes de ventas» en React con 149 pruebas de vitest; `scripts/smoke-gateway.sh`: 138 comprobaciones (121 con `--rapido`) |
| 7. ms-notificaciones | Cerrada | Tercer microservicio: servicio Node/Fastify con MongoDB en el puerto 8003 que convierte siete eventos del núcleo en avisos sin duplicarlos; bandeja con «leído» por persona y canal SSE por Kong; campana de React en los cinco roles; la tabla `notificacion` retirada del núcleo; 226 pruebas de vitest contra MongoDB real, 234 del frontend y `scripts/smoke-notificaciones.sh` con 129 comprobaciones |
| 8. Nube | En curso (no cerrada) | Primera parte completada (empaquetado prod, QA local unificado con `qa.ps1`/`qa.sh`, modelo demo en GCS y manual de Artifact Registry con 413/413 comprobaciones en verde); **pendiente ejecución en GCP** (Artifact Registry, VM, Cloud Run y laboratorio GKE) |

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
- **`snapshot_stock_diario` sale de la etapa 4.** Ningún dato de entrenamiento ni la recomendación la usan, y es por insumo mientras el modelo es por plato. Quedó en el esquema sin uso y se retiró el 25/11/2026, junto con la consolidación de los scripts SQL (ver la etapa 8). Su valor real sería detectar **demanda censurada** (días con platos agotados); eso queda como limitación conocida y, de abordarse, sería con un evento `producto.disponibilidad_cambiada`. CU-SISTEMA-01 queda diferido.

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

## Etapa 5B. ms-pronóstico — cerrada salvo la revisión en navegador

Se divide en pasos que dejan algo demostrable cada uno. 5B.0 a 5B.3 dejan el servicio probado por sí solo (pytest), antes de tocar el núcleo.

| Paso | Contenido | Demostrable | Estado |
|---|---|---|---|
| 5B.0 Ficha | D-21 aplicada a `doc-2u/servicios/ms-pronostico.md`; detalle de los 3 endpoints, carga del modelo, configuración y decisiones cerradas | El contrato antes que el código | Cerrada |
| 5B.1 Esqueleto | Arquitectura de puertos y adaptadores, `soporte/` copiado de ms-analítica, `/health`, Alembic con las 3 tablas y permisos mínimos (0002), usuario `pronostico_app` sin DDL, Dockerfile con `rc_pronostico`, servicio y migraciones en el compose (puerto 8002) | Contenedor arriba, migrado y sano; 66 pruebas; el modelo de la 5A carga dentro de la imagen | Cerrada |
| 5B.2 Baseline | `POST /interno/pronosticos` con `artefacto=None`, serie de ms-analítica (365 días), calendario, guardado de solo agregado, idempotencia por `solicitud_id`, `GET /interno/pronosticos/{id}`, 503 si ms-analítica cae | Pronóstico de punta a punta sin modelo; 161 pruebas; probado contra ms-analítica real | Cerrada |
| 5B.3 Modelo | `rc_pronostico` en la imagen (dependencia por ruta y contexto adicional), repositorio montado de solo lectura, carga verificada, registro en `modelo_version`, vuelta al modelo anterior o al baseline, `GET /interno/modelos/vigente` | `metodo = modelo` en ÁUREA; un archivo alterado no se usa | Cerrada |
| 5B.4 Núcleo | Cliente firmado, `POST /api/v1/admin/pronosticos`, `GET …/ultimo` y `PATCH /api/v1/admin/reposiciones/{id}`, `jornada_actual` y cierres futuros, `recomendacion_reposicion`, reposición con `P90 − P50`, plan Pro con `incluye_prediccion_ia` | Reposición sugerida por API con el modelo real de ÁUREA | Cerrada |
| 5B.5 React | Pantalla de pronóstico y reposición (CU-ADMIN-07) y vista del propietario (CU-PROP-08) | Flujo de la demostración; 59 pruebas de vitest, `build` y `check:ui` en verde; **sin revisar en navegador** | Cerrada |
| 5B.6 Humo | `scripts/smoke-pronostico.sh` con evidencias | Prueba de punta a punta para el informe; 108 comprobaciones (99 con `--rapido`) en verde | Cerrada |

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

### Lo que dejó la Fase B del backend (21/11)

- **Predicción en locales nuevos** ([doc-2u/03-prediccion-en-locales-nuevos.md](../doc-2u/03-prediccion-en-locales-nuevos.md), sección 8): `historial.dias_con_ventas` en ms-pronóstico (migración 0003); en el núcleo, nivel de la predicción (0 a 3) con `confianza` o `progreso`, tabla `solicitud_pronostico` (el «último pronóstico» ya no depende de que haya recomendaciones), reserva mínima del 35 % en los días sin modelo, insumos bajo su mínimo siempre en la lista y aviso de ventas atrasadas contrastado con los comprobantes.
- **Datos que pedía la maqueta:** prioridad (`urgente`, `pronto`, `cubierto`) y días que alcanza cada insumo, último proveedor con precio, costo estimado, redondeo de unidades (contables hacia arriba al entero; kg y L a un decimal hacia arriba) y totales por prioridad, costo, proveedores y decisiones.
- **Endpoints nuevos:** `POST /api/v1/admin/reposiciones/decisiones` (lote atómico), `GET /api/v1/admin/pronosticos/ultimo/exportar?formato=xlsx|pdf` (agrupado por proveedor) y `GET /api/v1/propietario/pronosticos` (todas las sedes y panorama).
- **Verificado:** 19 pruebas unitarias de la fórmula y 35 de flujo con ms-pronóstico simulado. Humo real con ÁUREA (nivel 3): 16 recomendaciones, S/ 6 766,93 en 2 proveedores, Excel y PDF válidos y vista del propietario.
### Lo que dejó la Fase C: pantallas de la 5B.5 (21/11)

- **Pantallas de la sede:** «Planificar la semana» (`/admin/planificar-semana`: semana de un vistazo, cobertura de 3, 5 o 7 días, insumos por urgencia, aceptar o descartar), «Lo que vas a vender» (`…/platos`: favoritos y cada plato día por día) y «Preparar la compra» (`…/compra`: cantidades editables por proveedor, Excel y PDF). **Propietario:** «Predicción de mis sedes» (`/propietario/prediccion`: panorama, una tarjeta por sede, platos comparados). Todas con los cuatro estados: cargando, vacío o primera vez, sin plan e indisponible.
- **Niveles en pantalla:** nombres culinarios (Esperando tus primeras ventas, En preparación, Casi a punto, Al punto) con avance o precisión según el nivel; el nivel 3 es el único que presume de precisión. Sin términos técnicos: «lo más probable», «reserva», «en preparación».
- **Compra prellenada:** «Registrar compra» guarda las decisiones (lo cambiado como ajustado y el resto como aceptado, en un lote) y abre el formulario de Compras con el proveedor y los insumos ya cargados (`ModalRegistrarCompra` recibe `inicial`; el traspaso viaja en el estado de navegación y se limpia al abrirlo).
- **Decisiones de diseño:** una decisión no se deshace (el backend la registra como auditoría), por eso la maqueta no tiene «Deshacer»; cambiar la cobertura calcula un pronóstico nuevo; en la vista del propietario el selector de periodo (mañana, fin de semana, 7 días) afecta al panorama y a los totales, y la comparación de platos es de la semana completa.
- **Verificado:** `tsc`, `npm run build`, `check:ui` (0 hallazgos en los archivos nuevos) y 59 pruebas de vitest en verde (30 nuevas: utilidades, componentes por nivel y estado, y el flujo de «Preparar la compra» con su traspaso a Compras). **No se vieron en un navegador:** falta revisar a 360, 768 y 1280 px.
- **Pendiente:** N-7 (aviso de «listo para entrenar»), revisar las pantallas en un navegador (360, 768 y 1280 px).

### Lo que dejó la Fase D: datos y documentación (21/11)

- **Histórico sintético hasta ayer.** `python -m app.sinteticos generar … --semilla 2026 --meses 24 --hasta 2026-11-20` con el mismo perfil y semilla: el generador es determinista y no duplica, así que solo agregó los días 18, 19 y 20 (39 073 ventas en total, 730 días). Con eso desaparece la limitación de que los días posteriores al 17 llegaban en 0 y se tomaban como cierres: el pronóstico real ya no trae `datos_desactualizados` y sigue dando 140 de 140 filas con `modelo`. **El modelo publicado sigue entrenado hasta el 17/11**; no se reentrenó.
- **Producto de humo.** «SMOKE Lomo 44eed1», de una prueba antigua, tenía una venta registrada: se **desactivó** en vez de borrarlo, para no romper ese historial. Sale de la carta y de la predicción (20 platos en lugar de 21).
- **Documentación al día:** ficha del núcleo (tablas, fórmula, redondeo, prioridades, endpoints nuevos y `PREDICCION_RESERVA_MINIMA`), ficha de ms-pronóstico, `doc-2u/03-prediccion-en-locales-nuevos.md` (estado de cada decisión) y `context/cu.md` (CU-ADMIN-07 y CU-PROP-08 con los niveles, las prioridades y la reserva mínima).

### Lo que dejó la 5B.6: prueba de punta a punta (21/11)

`scripts/smoke-pronostico.sh` (desde `restaurantcloud/`) recorre el flujo con los servicios reales y deja evidencias en `doc-2u/evidencias/smoke-pronostico/<fecha>/` (no se versiona). **108 comprobaciones en verde** (99 con `--rapido`), unos 40 s; sin contraseñas (sesiones temporales en Redis).

1. **Condiciones previas:** contenedores, `PRONOSTICO_URL`, secretos que coinciden núcleo ↔ ms-pronóstico ↔ ms-analítica, y rechazo de peticiones sin firma o con firma alterada.
2. **Histórico y modelo:** el histórico llega hasta ayer (si no, lo completa) y el modelo vigente existe, está aprobado y mejora al método ingenuo.
3. **Local con historial (ÁUREA):** nivel 3, confianza igual a las métricas del modelo, 140 de 140 filas por el modelo, P90 ≥ P50, sin aviso de ventas atrasadas, fórmula de reposición y redondeo por unidad, prioridades, costo y conteos coherentes; `GET ultimo` devuelve la misma ejecución; cobertura 3 consume menos que cobertura 5.
4. **Decisiones:** aceptar, ajustar y descartar; ajustar sin cantidad da 422; una decisión tomada no se cambia (409); lote válido; lote con una ya decidida se rechaza **entero** (ninguna se guarda); los totales cuadran.
5. **Lista de compra:** Excel válido (con un insumo pendiente dentro) y PDF; un formato desconocido da 422.
6. **Sede nueva sin ventas:** nivel 0 sin confianza, avance en 0, solo el insumo bajo su mínimo (`bajo_minimo`, urgente, 3 L), el de stock de sobra no aparece, `ultimo` no da 404, la solicitud queda guardada; vista del propietario con ÁUREA en nivel 3 y la sede nueva en nivel 0, y un administrador de sede no la ve (403).
7. **Caída de ms-pronóstico:** 503 controlado (`ERR_PRONOSTICO_NO_DISPONIBLE`) en 8 s, la última lista y la vista del propietario siguen respondiendo, y al encenderlo se vuelve a generar.

Cómo resuelve lo que podía estropear la prueba:

- **Datos que deja:** al terminar **borra** la sede de prueba con su carta e insumos, y los pronósticos, recomendaciones y decisiones de esa ejecución (también en ms-pronóstico), solo lo posterior a su hora de inicio; la base de desarrollo queda como estaba. `--conservar` lo deja para investigar un fallo.
- **Histórico que se vence:** compara el último día con ventas con «ayer» (hora de Lima). Si falta, lo completa con el mismo comando, perfil y semilla (determinista, no duplica); `--sin-extender` solo avisa y omite la comprobación del aviso de ventas atrasadas.
- **Modelo sin reentrenar:** exige que exista, esté aprobado y se use; la fecha de entrenamiento solo se informa. La confianza mostrada se compara con las métricas del propio modelo, así que sigue valiendo cuando se reentrene.
- **Servicio apagado:** si el script se interrumpe con ms-pronóstico apagado por él, lo enciende al salir; las sesiones temporales se borran siempre.
- **Sin dependencias en la máquina:** el JSON se revisa con PHP dentro del contenedor del núcleo (no hace falta `jq` ni Python).
- **Sin probar todavía:** la rama de «histórico atrasado» (hoy el histórico está al día); se ejercita sola mañana, cuando «ayer» ya no coincida con el 20/11.

### Antes de la demostración

- **El histórico se completa solo al correr `./scripts/smoke-pronostico.sh`** (o a mano con `generar --incremental`, que genera solo los días que faltan; guía en `restaurantcloud/docs/comandos_datos_sinteticos.md`). El histórico sintético llegaba hasta el 2026-11-20; cada día que pasa, los días nuevos llegan en 0 y la regla de respaldo los toma como cierres.
- **Revisar las pantallas en un navegador** a 360, 768 y 1280 px: se construyeron y probaron por código, pero no se vieron renderizadas.

---

## Etapa 6. JWT y gateway — cerrada

Se divide como la 5B: primero el contrato, después cada pieza probada por sí sola y al final la prueba de punta a punta a través de Kong.

| Paso | Contenido | Demostrable | Estado |
|---|---|---|---|
| 6.0 Ficha | Claims del JWT, `POST /auth/token-servicios`, `GET /auth/clave-publica`, los 4 reportes de ms-analítica en detalle, rutas y políticas de Kong | El contrato antes que el código | Cerrada |
| 6.1 JWT en el núcleo | Emisor RS256 propio con `openssl` (sin dependencias nuevas) dentro de `SesionService` (login, selección de cuenta, refresh, activación y registro), endpoint de renovación, clave pública, `php artisan jwt:claves`, variables en `.env.example` | Login que devuelve un JWT verificable con la clave pública | Cerrada |
| 6.2 JWT en ms-analítica | `soporte/jwt.py` (copiable a ms-notificaciones), dependencia de sesión con rol, empresa, sede y módulos | Pruebas de firma, caducidad, emisor, audiencia, rol y sede | Cerrada |
| 6.3 Reportes | `ventas/resumen`, `ventas/por-hora`, `productos/ranking` (con ingeniería de menú) y `personal/desempeno`, con pytest contra PostgreSQL real | Reportes de ÁUREA con el histórico sintético | Cerrada |
| 6.4 Kong | `infra/kong` (DB-less, plantilla con la clave pública), servicio en el compose (puerto 8000), JWT en `/api/v1/analitica`, límite de peticiones, CORS, `X-Request-Id`; Vite pasa a apuntar a Kong | Todo el tráfico del navegador entra por Kong; `/interno` no se expone | Cerrada |
| 6.5 React | Cliente de microservicios con renovación del JWT y pantalla «Reportes» de 3 pestañas (CU-ADMIN-13), con gráficos de Recharts | Flujo del navegador a ms-analítica por Kong | Cerrada |
| 6.6 Humo | `scripts/smoke-gateway.sh` con evidencias | Prueba de punta a punta para el informe; 138 comprobaciones (121 con `--rapido`) en verde | Cerrada |

### Decisiones de la 6.0 (21/11)

- **Alcance de CU-ADMIN-13:** resumen con comparación con el periodo anterior, horas punta, ranking con matriz de ingeniería de menú y desempeño por mozo con anulaciones, más la pantalla de 3 pestañas. **Fuera:** exportar (queda para la Unidad III), rotación de mesa, upselling de segunda ronda, turnos y nota de quiebre de stock (los eventos no traen esos datos) y desglose de IGV (`venta.registrada` no lo trae).
- **Renovación del JWT con un endpoint propio**, `POST /api/v1/auth/token-servicios`, autenticado con el token de sesión: devuelve solo un JWT nuevo y no rota la sesión, así dos pestañas no se invalidan entre sí cada 10 minutos. Login, selección de cuenta, refresh, activación y registro lo devuelven también, porque todos pasan por `SesionService`.
- **Sede del propietario:** su JWT no trae `local_id`; elige la sede con la misma cabecera `X-Local-Id` que ya usa el núcleo, y el servicio filtra **siempre** por el `empresa_id` del token. Una sede de otra empresa responde como una sede sin ventas, sin revelar si existe. Un `admin_local` con un `X-Local-Id` distinto al de su token recibe 403.
- **Plan en el token:** claim `modulos` (`prediccion`, `reportes_avanzados`). Resumen y horas punta, para todos los planes; ranking y desempeño, solo con `reportes_avanzados`. Un cambio de plan llega al token en la siguiente renovación (10 minutos como mucho).
- **Sin claves no se rompe nada:** si `JWT_PRIVATE_KEY` no está configurada, el login sigue funcionando con `jwt: null` y la renovación responde 503. Tampoco se emite JWT a una empresa suspendida.
- **Kong:** valida firma y caducidad (`exp`, con una vida máxima de 15 minutos); cada servicio vuelve a validar firma, emisor, audiencia y claims. En producción, Caddy (TLS y SPA) queda delante de Kong; se implementa en la etapa 8.
- **Hallazgo para la etapa 9:** `trustProxies(at: '*')` confía en `X-Forwarded-For` de cualquier origen; el bloqueo de login por IP se puede eludir si la API se alcanza sin pasar por el proxy.

### Lo que dejó la 6.1 (21/11)

- **Sin dependencias nuevas.** Se probó `firebase/php-jwt`, pero el `CLAUDE.md` del núcleo pide aprobación para cambiar dependencias, así que se revirtió: `App\Support\JwtRs256` firma y verifica RS256 con la extensión `openssl` (unas 80 líneas). Si se prefiere la librería, el cambio queda dentro de esa clase.
- **`TokenServicios`** arma los claims del contrato (`modulos` sale del plan vigente de la empresa) y `SesionService` lo llama al crear cualquier sesión: login, selección de cuenta, refresh, activación y registro devuelven `jwt` y `jwt_expira_en`. Sin claves o con la empresa suspendida, `jwt` es `null` y la sesión sigue igual.
- **Endpoints:** `POST /api/v1/auth/token-servicios` (renueva solo el JWT; la sesión no cambia) y `GET /api/v1/auth/clave-publica` (con `kid`, emisor y audiencia), ambos con 503 `ERR_JWT_NO_CONFIGURADO` si faltan claves.
- **Claves:** `php artisan jwt:claves` imprime un par en formato `.env` (PEM en una línea con `\n` literales). Variables en `.env.example` y en el servicio `api` del compose; el `.env` local ya tiene un par generado.
- **Verificado:** 11 pruebas (`JwtServiciosTest`: claims, firma alterada y de otra clave, propietario sin sede, módulos según el plan, refresh, renovación sin rotar la sesión, sin sesión, empresa suspendida, sin claves, clave pública y el comando) y 103 de los flujos que crean sesiones, en verde con claves y sin ellas. En vivo: la firma de un JWT emitido por el contenedor la acepta `openssl dgst -verify` (herramienta independiente del código que firma).
- **Pendiente para la 6.4:** recrear `api` tras cambiar las claves (las variables del compose solo se leen al crear el contenedor).

### Lo que dejó la 6.2 (21/11)

- **`app/soporte/jwt.py`** (copiable a ms-notificaciones; solo usa `config` y `respuestas`): `verificar_jwt` valida con PyJWT firma RS256, emisor, audiencia, `exp`, `nbf` (30 s de tolerancia de reloj) y los claims obligatorios. El algoritmo está fijado a RS256: un token `alg: none` o HS256 firmado con la clave pública, conocida, se rechaza. `contexto_de_sede(roles, modulo)` es la dependencia de las rutas de reportes y comprueba en este orden: token (401), rol (403), módulo del plan (403) y sede (`X-Local-Id` solo para el propietario; 403 si quien tiene sede pide otra, 422 si falta).
- **Dependencias nuevas aprobadas:** `pyjwt[crypto]` (RS256 exige `cryptography`; entran también `cffi` y `pycparser`). En ms-analítica sí se justifica una librería: ahí se verifica, y esa es la parte delicada.
- **Un fallo que encontró una prueba:** con una clave pública mal formada, PyJWT lanza `InvalidKeyError`, que no es un token inválido, y la petición terminaba en 500. Ahora responde 503 `ERR_JWT_NO_CONFIGURADO`, porque es un error de despliegue y no del cliente.
- **Configuración:** `JWT_PUBLIC_KEY` (PEM, con `\n` literales o con saltos reales), `JWT_EMISOR`, `JWT_AUDIENCIA` y `JWT_TOLERANCIA_SEGUNDOS`; el compose pasa `JWT_PUBLIC_KEY` al servicio.
- **Verificado:** 33 pruebas nuevas (sin base de datos, con una app mínima) y la suite completa en verde: 148. Con mutaciones se comprobó que las pruebas detectan quitar la audiencia (13 fallan), el emisor, el algoritmo fijo y la comprobación de rol. **Entre lenguajes:** un JWT emitido por el núcleo real (PHP) lo valida `verificar_jwt`, con la clave tal como la publica `GET /auth/clave-publica` y en una línea con `\n`; también **dentro del contenedor** de ms-analítica reconstruido, con la clave tal como la pasa el compose.
- **`/interno` y `/health` no piden JWT**; las rutas de reportes lo usan desde la 6.3.

### Lo que dejó la 6.3 (21/11)

- **Cuatro rutas en `app/api/reportes.py`**, con el mismo reparto que la serie: SQL en `app/datos/reportes.py` y cálculos puros en `app/dominio/reportes.py` (periodo anterior, cocientes, variaciones y la matriz de ingeniería de menú). Todo se calcula en SQL sobre `venta`, `venta_item` y `anulacion`; no hizo falta pandas ni tablas derivadas nuevas.
- **Empresa siempre del token.** Cada consulta filtra por `empresa_id` y `local_id`; `venta_item` no guarda la empresa, así que se filtra a través de su `venta`. Una sede de otra empresa responde vacía.
- **Decisiones de cálculo** (ya en la ficha): una métrica sin base vale `null`, no 0; `comprobantes_por_dia` divide entre días con ventas, para que los cierres no bajen el promedio; el ticket por comensal usa solo los comprobantes que traen comensales (una subcuenta no los trae); un plato al que le falte `costo_estandar` en alguna venta del periodo queda sin costo y fuera de la matriz; empate de hora punta, la más temprana; montos con redondeo comercial.
- **Verificado:** 32 pruebas nuevas (8 del dominio sin base, con la matriz calculada a mano, y 24 de integración contra PostgreSQL con ventas que entran por `POST /interno/eventos`); suite completa de ms-analítica en verde, **180**. **Mutaciones:** quitar el filtro de anuladas, usar la hora UTC, quitar el filtro de empresa en ventas, promediar por días del calendario o tratar las anulaciones sin mozo como un mozo hace fallar pruebas. Quitar el filtro de empresa del **ranking** y de las **anulaciones** al principio no rompía ninguna, porque la prueba de aislamiento solo miraba el resumen; se agregó una que recorre las cuatro rutas con datos de otra empresa en la misma sede, y ahora ambas mutaciones se detectan.
- **Con los datos reales de ÁUREA** (contenedor reconstruido y JWT emitido por el núcleo): del 1 al 20 de noviembre, S/ 257 578 en 1 115 comprobantes, ticket promedio S/ 231,01, +15,7 % frente al periodo anterior, hora punta a las 14:00, 20 platos con los cuatro cuadrantes poblados (Lomo Saltado Criollo, estrella) y 3 mozos. Cuadran entre sí: la suma de las 24 franjas es el total del resumen y los comprobantes del desempeño suman los del resumen. Un año completo: 19 838 comprobantes en 363 días (los 2 cierres). **Tiempos:** menos de 0,1 s en todas, incluido el ranking de 366 días. Respuestas en `doc-2u/evidencias/reportes-6.3/` (no se versiona).
- **Límite conocido:** el histórico sintético no tiene anulaciones previas al cobro (`pedido.anulado`), así que en ÁUREA esa parte del desempeño sale en 0; las pruebas la cubren con datos propios.

### Lo que dejó la 6.4 (21/11)

- **`infra/kong/`:** `kong.yml.plantilla` (servicios `nucleo` y `analitica`, consumidor `nucleo` con la clave RS256 y los plugins `jwt`, `rate-limiting`, `cors` y `correlation-id`), `generar-config.lua` y `arrancar.sh`. La imagen no trae `envsubst`; el generador usa el `resty` que sí trae y escribe cada valor como cadena JSON, así que la clave PEM entra igual con saltos reales o con `\n` literales (ambos probados). Sin clave, con un valor que no es PEM o con una variable desconocida en la plantilla, **Kong no arranca**; esa validación encontró de inmediato un `__VARIABLE__` olvidado en un comentario.
- **Compose:** servicio `restaurantcloudIA_kong` con `kong:3.9.1` (versión exacta), puerto 8000, sin API de administración (`KONG_ADMIN_LISTEN=off`) y con `kong health` como comprobación de salud. Variables nuevas en `.env.example`: `KONG_PORT` y `KONG_CORS_ORIGENES`. `.gitattributes` fija LF en `infra/kong/`, porque un `.sh` con CRLF falla dentro del contenedor.
- **Vite** reenvía `/api` a Kong (`VITE_PROXY_DESTINO` permite volver directo al núcleo). Comprobado: navegador → Vite → Kong → núcleo o ms-analítica.
- **Verificado en vivo** (con un JWT emitido por el núcleo y otros dos firmados con la clave real fuera de regla):
  - Enrutamiento: `/up`, login, `/auth/me` y la clave pública llegan al núcleo; los reportes, a ms-analítica.
  - JWT: 200 con el token del núcleo; 401 sin token, con la firma alterada, caducado (`token expired`), con 1 hora de vida (`exceeds maximum allowed expiration`), en la URL (`?jwt=`) y con el token de sesión del núcleo.
  - Ocultos (404 desde Kong): `/interno/series/ventas-diarias`, `/interno/eventos`, `/api/v1/analitica/../../interno/eventos` y `/health` de ms-analítica.
  - Límites: 130 peticiones seguidas a ms-analítica dan 429 desde la 121 (con `Retry-After`); las mismas 130 al núcleo, todas 200.
  - CORS: la preflight desde `http://localhost:5173` responde con origen, credenciales, cabeceras y métodos; una petición real lleva **una sola** `Access-Control-Allow-Origin` (no se duplica con la de Laravel).
  - `X-Request-Id`: Kong lo genera si falta y respeta el que llega.
- **Hallazgo verificado (para la etapa 9):** Laravel ve la IP real del cliente detrás de Kong (172.20.0.1, no la de Kong), pero si el cliente manda su propio `X-Forwarded-For`, Kong lo deja pasar y Laravel lo toma (`203.0.113.9`), así que se podría eludir el bloqueo de login por IP. En producción el puerto de Kong no se publica y Caddy queda delante; que Caddy no confíe en el `X-Forwarded-For` del cliente se comprueba en la etapa 8. Detalle en la ficha del gateway.
- **Límites:** el CORS con un solo origen siempre devuelve ese origen (el navegador bloquea al que no coincide); ms-analítica no escribe líneas de acceso, así que el `X-Request-Id` solo aparece en sus líneas de error.

### Decisiones de la 6.5 (22/11)

- **Primero una maqueta HTML aprobada** (`wireframe/administrador/CU-ADMIN-13-reportes-ventas/maqueta-reportes.html`, con los datos reales de la 6.3) y después React. En la revisión se cambió el comparador de periodos (un solo control con desde, hasta y días), la paginación del ranking y la forma de clasificar los platos.
- **Nombres de los grupos de la ingeniería de menú:** `estrella` = Imprescindibles, `caballito` = Populares, `puzle` = Por impulsar, `rezagado` = Por revisar. Dicen qué hacer con el plato y no chocan con las estrellas. Solo cambia la pantalla: las claves del servicio son las mismas. Cada grupo muestra su regla con los umbrales reales (que ms-analítica calcula por periodo: popular desde el 70 % de la participación media, rentable desde el margen medio ponderado).
- **Rentabilidad en estrellas, calculada en la pantalla** con el campo `margen` que el servicio ya devuelve: se ordenan los platos con costo por lo que dejan en total y se reparten en cinco tramos iguales. Con menos de 5 platos con costo no se califica, y un plato sin costo queda «sin calificar». No cambia el contrato; ya está en la ficha de ms-analítica y en `cu.md`.
- **Plan:** las pestañas Platos y Equipo se marcan como bloqueadas desde el principio leyendo `modulos` del JWT. Es solo una pista de interfaz; quien decide es el servicio, y un 403 `ERR_MODULO_NO_INCLUIDO` muestra la misma invitación. El texto no nombra un plan concreto («los planes que incluyen reportes avanzados»), porque el código no dice cuáles son.
- **Corte de las horas:** la curva se parte en «antes de las 18:00» y «desde las 18:00». Es una división fija de la pantalla, no el horario de la sede (los turnos quedaron fuera del alcance en la 6.0).

### Lo que dejó la 6.5 (22/11)

- **Cliente de microservicios** (`src/services/api/`): `jwtServicios` guarda el JWT solo en memoria, lo renueva con `POST /auth/token-servicios` cuando faltan menos de 60 s, comparte una sola renovación entre las peticiones simultáneas, lo descarta si cambia el token de sesión y mide su vencimiento con la hora del servidor (un reloj mal puesto no lo adelanta ni lo atrasa). `clienteMicroservicios` envía ese JWT, manda `X-Local-Id` solo si quien consulta es propietario (una sede elegida que quedó de otra sesión no se filtra a un administrador) y ante un 401 renueva y reintenta una sola vez. `reportesService` (en `serviceAdapter`) expone los 4 reportes.
- **Pantalla** `/admin/reportes/ventas` (entrada «Reportes de ventas» en el menú de la sede), con la pestaña elegida en la dirección (`?pestana=`):
  - **Periodo:** hoy, ayer, 7 días, este mes o personalizado (hasta 366 días, con los mismos límites del servicio). Un solo comparador muestra desde qué día hasta qué día se compara y cuántos días son.
  - **Ventas:** resumen con variación, indicadores con barras «Actual» y «Anterior», curva por hora, medios de pago, tipos de comprobante, descuentos y anulaciones.
  - **Platos:** grupos con su regla, mapa de la carta, ingresos por categoría y ranking paginado con estrellas, filtro por grupo y orden por columna.
  - **Equipo de salón:** una tarjeta por mozo, ventas y ticket frente al promedio de la sede, y anulaciones antes del cobro.
  - **Estados** en cada pestaña: cargando, sin ventas (con salto a un periodo más amplio), error con «Reintentar», 429 y servicio caído con mensaje propio, y plan sin reportes avanzados.
- **Dependencias:** `recharts@2.15.4` (gráficos) y `@playwright/test` (capturas, solo desarrollo), ambas aprobadas. Las consultas de contenedor se hicieron con variantes arbitrarias de Tailwind, sin plugin nuevo.
- **Verificado:**
  - **Pruebas:** 83 nuevas (20 del cliente y la renovación, 40 de la lógica de periodos, estrellas y frases, 23 de la pantalla con el servicio simulado); suite del frontend completa: **149**. `tsc`, `npm run build`, `check:ui` y lint sin hallazgos en los archivos nuevos.
  - **Mutaciones:** se rompieron a propósito nueve comportamientos (margen de renovación, tope de reintentos, `X-Local-Id` por rol, reparto de estrellas, periodo anterior, consulta sin plan, paginación, respuestas atrasadas y el límite de 366 días) y cada uno puso alguna prueba en rojo.
  - **En vivo** con ÁUREA, Vite → Kong → ms-analítica: un solo `token-servicios` por carga y todas las llamadas en 200; con el token alterado en la primera llamada, Kong respondió **401 real**, el cliente pidió uno nuevo y reintentó sin que la pantalla lo notara. Las tres pestañas a 360, 768 y 1280 px, sin errores de consola ni scroll horizontal de página.
- **Límites:**
  - La rama «plan sin reportes avanzados» solo se probó con el servicio simulado: ÁUREA sí tiene el módulo.
  - En desarrollo cada consulta se ve doble por el modo estricto de React; en producción no.
  - `ultimo_evento_en` de ÁUREA es la hora de la carga sintética, no de una venta real (ver Pendientes).
  - Recharts engorda el paquete principal, que ya avisaba por tamaño; partirlo en trozos queda para la etapa 8.
  - Las pantallas de la 5B siguen sin revisarse en navegador: Playwright ya está instalado y alcanza con repetir este recorrido con ellas.

### Lo que dejó la 6.6: prueba de punta a punta del gateway (22/11)

`scripts/smoke-gateway.sh` (desde `restaurantcloud/`; opciones `--rapido`, `--levantar` y `--sin-evidencias`) recorre el camino del navegador con los servicios reales y deja evidencias en `doc-2u/evidencias/smoke-gateway/<fecha>/` (no se versiona). **138 comprobaciones en verde** (121 con `--rapido`); sin contraseñas (sesiones temporales en Redis) y sin dejar nada en la base: los reportes son de solo lectura.

1. **Condiciones previas:** contenedores, Kong sano y sin API de administración, y la misma clave pública en el núcleo, Kong y ms-analítica.
2. **Enrutamiento:** cada prefijo llega a quien debe; lo desconocido lo responde Kong con 404.
3. **El JWT del núcleo:** emitido con la sesión, con la cabecera y los claims del contrato (RS256, `kid`, emisor, audiencia, empresa, sede, módulos del plan, vida de 600 s); Kong y ms-analítica lo aceptan; renovar no invalida la sesión ni el JWT anterior.
4. **Los cuatro reportes:** cuadran entre sí (las 24 franjas suman el resumen, las cuentas y ventas de los mozos también, las categorías suman los platos, los medios suman 100 %, el periodo anterior dura lo mismo y termina el día antes) y responden en milisegundos.
5. **Tokens fuera de regla**, firmados con la clave real del núcleo, con otra o con ninguna: sin token, firma alterada, clave ajena, `alg: none`, HS256 firmado con la clave pública, caducado, de 1 hora, con `nbf` futuro, de otro emisor, en la URL y el token de sesión. Todos los rechaza Kong (se distingue por `Server: kong`). La audiencia equivocada y el rol que no corresponde pasan por Kong y los rechaza el servicio con su código. Además, ms-analítica llamada directamente, sin Kong, también exige el JWT.
6. **Permisos, sedes, empresas y plan:** sede pedida por un administrador (403), propietario sin sede (422), sede de otra empresa o inexistente (200 vacío, sin revelar si existe), un administrador de otra empresa no ve nada de ÁUREA en ninguno de los cuatro reportes, plan sin reportes avanzados (resumen sí, ranking y desempeño 403) y los límites del rango (366 días sí, 367 no).
7. **Lo interno no se expone:** `/interno`, `/health` y el intento de subir con `../` dan 404 de Kong.
8. **CORS y `X-Request-Id`:** la preflight no pide JWT, una sola cabecera de origen en ambos destinos, un origen ajeno no recibe el suyo, el identificador se genera o se respeta (también en los rechazos de Kong) y los límites publicados son 120 y 1 200 por minuto.
9. **Caída de ms-analítica:** error controlado en 6 s, el núcleo sigue atendiendo, emitiendo JWT y validando sesiones, y al encenderla vuelve a responder a los 3 s.
10. **Límite de peticiones:** 130 seguidas, las que pasan del límite dan 429 con `Retry-After`, el núcleo no se frena y el límite se levanta solo antes de terminar.

- **Hallazgo y corrección:** con ms-analítica apagada, la petición a través de Kong **no respondía en 30 s**. Kong espera por defecto 60 s para conectar y reintenta 5 veces, y un contenedor detenido no contesta. Se fijaron tiempos de espera en `infra/kong/kong.yml.plantilla` (ms-analítica: conexión 3 s, 1 reintento; núcleo: conexión 5 s, lectura de 120 s para no cortar un pronóstico en cálculo). Ahora la misma caída da un 504 en 6 s, que la pantalla de reportes muestra como «el servicio no responde». Ya está en la ficha del gateway.
- **La prueba se probó:** con Kong debilitado a propósito (sin el máximo de vida del token y con el límite subido a 5 000) falló exactamente en esas dos comprobaciones; restaurada la configuración, vuelve a pasar.
- **Límites:**
  - El escenario del límite deja sin respuesta (429) a las pantallas abiertas desde la misma IP hasta que se levanta, como mucho un minuto. Con `--rapido` no ocurre.
  - No prueba el hueco documentado del `X-Forwarded-For`, que es de la etapa 9, ni el flujo de notificaciones en tiempo real, que es de la etapa 7.
  - No usa un navegador: la pantalla se verificó con Playwright en la 6.5.

---

## Etapa 7. ms-notificaciones — cerrada

Servicio Node 22, TypeScript, Fastify y MongoDB que convierte eventos del núcleo en avisos por rol o por usuario, con bandeja y entrega en tiempo real por SSE; campana en React para los cinco roles. Mismo reparto que las etapas 5B y 6: primero el contrato y después cada pieza probada por sí sola.

| Paso | Contenido | Demostrable | Estado |
|---|---|---|---|
| 7.0 Ficha | API en detalle, tabla de evento a aviso, eventos nuevos en el catálogo, decisiones cerradas | El contrato antes que el código | Cerrada |
| 7.1 Esqueleto | Servicio Fastify, compose (puerto 8003), usuario de Mongo sin privilegios, esquema (validador e índices con TTL) | `GET /health` y colección con sus índices | Cerrada |
| 7.2 Recepción | `/interno/eventos` con firma HMAC, reglas puras, duplicado por índice único, contratos compartidos | Un evento crea avisos y un duplicado no | Cerrada |
| 7.3 Núcleo | Eventos nuevos y sus contratos, quitar las 5 inserciones, retirar la tabla `notificacion` | Una acción real produce un aviso en Mongo | Cerrada |
| 7.4 Bandeja y SSE | 5 rutas con JWT, filtro único, reparto en memoria, latido | `curl -N` recibe el aviso al instante | Cerrada |
| 7.5 Kong | Servicio con JWT; flujo sin búfer y lectura de 16 min | Todo por el puerto 8000 | Cerrada |
| 7.6 React | Maqueta aprobada y campana en los dos layouts | Campana en vivo en los 5 roles | Cerrada |
| 7.7 Humo | `scripts/smoke-notificaciones.sh` | Prueba de punta a punta | Cerrada |
| 7.8 Cierre | Fichas, README del servicio y este plan | Etapa cerrada | Cerrada |

### Decisiones de la 7.0 (22/11)

- **Siete tipos de aviso:** `comprobante.anulado`, `pedido.anulado` (cocina también si el plato ya estaba preparado), `pedido.item_sustituido`, `producto.agotado`, `plato.listo` (aviso personal al mozo), `caja.turno_previo_pendiente` y `caja.cerrada` con diferencia (al administrador y al propietario). Cuatro eventos son nuevos en el catálogo; el texto, el destinatario y la severidad de cada uno están en la sección 4 de la ficha.
- **Fuera de la etapa:** `reserva.creada` y `reserva.cancelada` (el aviso útil, «reserva próxima», necesita un programador de tareas), `pronostico.generado` (el pronóstico es síncrono; queda para pronósticos programados) y la alerta de entregas fallidas.
- **La tabla `notificacion` del núcleo se retira**, no se sigue escribiendo: dos escrituras serían dos fuentes de verdad y nadie lee la tabla. El único lector, la deduplicación de `turno_previo_pendiente`, pasa a `log_auditoria`; se avisa una vez por turno pendiente.
- **`plato.listo`:** un evento por comanda y por acción de cocina, no por ítem; así una tanda que toca varias comandas avisa a cada mozo una vez.
- **Canal SSE:** `fetch` con lectura de flujo y `Authorization: Bearer`, sin ticket en la URL. El servidor lo cierra al vencer el JWT con el evento `renovar` y el cliente renueva y reabre. El gateway lo deja sin búfer, con lectura de 16 minutos.
- **Quién ve qué:** una sola función compartida por la bandeja, el contador, el marcado y el SSE. Aviso personal por `sub`; aviso de rol por rol y sede del token; el propietario ve su rol en toda la empresa (`X-Local-Id` opcional). «Leído» es por usuario (`leida_por`).
- **Una sola instancia**, con el reparto en memoria; el límite queda documentado.
- **Diferencias con el wireframe de CU-TRANS-01** (escrito para Go y PostgreSQL) documentadas en la ficha: rutas, `severidad` en lugar de `prioridad` y lectura por usuario.
- **Dependencias aprobadas con el plan:** `fastify`, `mongodb` (driver oficial) y `jose`; en desarrollo `typescript`, `tsx`, `vitest` y `@types/node`. Versiones exactas.

### Lo que dejó la 7.1 (22/11)

- **`services/notificaciones/`** con la misma división que ms-analítica (`api`, `dominio`, `datos`, `soporte`). La configuración se valida entera al arrancar y un error lista todas las variables que faltan. Respuestas con el formato común (`ERR_BD_NO_DISPONIBLE`, como ms-analítica, en lugar del `ERR_BASE_NO_DISPONIBLE` que decía la ficha), fechas con la zona explícita (`-05:00`) calculadas con `Intl`, sin librerías, y `X-Request-Id` que se respeta o se genera; un valor con saltos de línea o de más de 128 caracteres se reemplaza, para que no se pueda inyectar texto en los logs. Logs JSON con `request_id`.
- **Versiones:** fastify 5.12.8, mongodb 7.8.0, jose 6.2.15, typescript 5.9.3 (la misma serie del frontend), tsx 4.23.15, vitest 5.1.0 y @types/node 22.20.5; imagen `node:22.23.3-alpine`. Las versiones más nuevas de mongodb, jose y vitest tenían menos de dos semanas y se dejaron pasar.
- **Esquema** (`src/datos/esquema.ts`, aplicado por el servicio de una pasada `notificaciones-migraciones` con el administrador): validador `strict` con uuid, fechas `Date`, los cinco roles con bandeja y la coherencia del destinatario (un aviso a un rol no nombra a una persona, y uno personal no va a un rol). Cinco índices: los cuatro de la ficha y `bandeja_rol_empresa`, para la bandeja del propietario, que no tiene sede. Repetirlo no cambia nada, y un índice existente con otra definición no se toca: se informa el conflicto.
- **Usuario de la aplicación con un rol propio** (`notificaciones_app`): solo `find`, `insert`, `update` y `remove` sobre la colección, el equivalente del usuario de las bases PostgreSQL. Se descartó `readWrite` porque permite borrar la colección, crear índices y leer otras colecciones. Las credenciales van aparte de la URI. El contenedor del servicio corre como `node` y no recibe las del administrador.
- **El servicio arranca aunque MongoDB no responda:** el driver conecta en la primera operación. Verificado en vivo: con MongoDB apagado, `/health` responde 503 `ERR_BD_NO_DISPONIBLE` en 3 s, con el error y su `request_id` en el log, y al encenderlo vuelve a 200 en 1 s sin reiniciar el servicio.
- **Hallazgo en el entorno:** el volumen de MongoDB (creado el 19/11) se había inicializado sin las variables del administrador. La imagen activa igual la autenticación, así que no había ningún usuario y ninguna clave funcionaba. El volumen estaba vacío (se comprobó abriéndolo sin autenticación). En lugar de borrarlo, el administrador se creó con la excepción de localhost, y después se aplicó el script del usuario. El procedimiento quedó en el README del servicio.
- **Verificado:** 49 pruebas de vitest (configuración, fechas, esquema contra MongoDB real con validador, índices, idempotencia, conflicto de índices y permisos del usuario, y `/health` con `X-Request-Id`), `tsc` sin errores, imagen construida y servicio sano en el compose. **Mutaciones:** quitar el `unique` del índice rompe 2 pruebas y quitar la regla de coherencia del destinatario rompe 3.
- **Sin tocar todavía:** `NOTIFICACIONES_URL` del núcleo sigue vacía. Si se configurara ahora, `comprobante.anulado` y `pedido.anulado` irían a una ruta que aún no existe y las entregas acabarían fallidas. Se activa al terminar la 7.2.

### Lo que dejó la 7.2 (22/11)

- **`POST /interno/eventos`** con las mismas respuestas que ms-analítica: 202 `aceptado`, 200 `duplicado` y 200 `ignorado` (un tipo que el servicio no usa, o un `caja.cerrada` sin diferencia). La ficha decía 202 para lo ignorado y se corrigió: el núcleo da por entregada cualquier respuesta 2xx. `datos` lleva `estado`, `evento_id` y `avisos_creados`.
- **Firma antes de todo.** Dentro de `/interno` cualquier cuerpo llega como bytes, sea cual sea el tipo de contenido. Se verifica la firma sobre esos bytes exactos y solo después se interpreta el JSON: un cuerpo roto sin firma da 401, no 422. Comparación en tiempo constante, tolerancia de 5 minutos hacia atrás **y hacia adelante**, y una firma mal formada se rechaza sin lanzar otro error.
- **Validación sin dependencias** (`dominio/validacion.ts`), con el mismo vocabulario que los contratos (uuid, texto, entero, número, booleano, instante con zona, día, valores fijos y listas). Devuelve todos los errores a la vez con su ruta (`datos.items[0].cantidad`) e ignora los campos que no conoce, así que agregar un campo opcional a un evento no rompe nada.
- **Reglas puras** (`dominio/reglas.ts`) para los siete tipos de la tabla de la ficha. Los nombres que faltan no dejan huecos en el texto, los textos largos se recortan al límite del validador y el cierre de caja compara en céntimos (0,1 + 0,2 − 0,3 no cuenta como diferencia). Una prueba encontró un error real: el texto de la comanda completa decía «la comanda de la comanda de…».
- **Duplicados sin tabla de procesados:** se inserta sin orden y el choque con el índice único (código 11000) cuenta como «ya procesado». Un reintento completa un evento guardado a medias, y cinco entregas simultáneas del mismo evento crean cada aviso una sola vez. `creada_en` es el `ocurrido_en` del evento (documentado en la ficha), y los uuid se guardan en minúsculas.
- **Gancho para el SSE:** la ruta recibe un `alInsertar` que se llama solo con los avisos realmente guardados (con su `_id`); la 7.4 lo conecta al reparto.
- **Contratos compartidos:** `tests/contratos.test.ts` lee `doc-2u/servicios/contratos/` como ms-analítica. Los de `comprobante.anulado` y `pedido.anulado` crean avisos y los de `venta.registrada` se ignoran. Los cinco tipos nuevos están en una lista de pendientes que la 7.3 debe vaciar; la prueba falla si un tipo ya tiene contrato y sigue en la lista.
- **Entre lenguajes:** desde el contenedor del núcleo, con `FirmaInterna` y `json_encode` con `JSON_UNESCAPED_UNICODE` (como el outbox), un `pedido.anulado` con «Martín Ñahui» y «Ají de gallina» enviado a `http://notificaciones:8003` dio 202 con 2 avisos (administrador y cocina, este como crítico); repetido, 200 `duplicado`; con otro secreto, 401. Los avisos de prueba se borraron después.
- **Destino activado:** `NOTIFICACIONES_URL` toma por defecto `http://notificaciones:8003` en el compose (`api` y `queue`) y en `.env.example`. Se recrearon `api`, `queue` y `scheduler`; `outbox:estado` muestra `ms-notificaciones` sin pendientes ni fallidos. Desde ahora, cada `comprobante.anulado` y `pedido.anulado` real llega también aquí. Un evento real de punta a punta por el outbox se comprueba en la 7.3, con los eventos nuevos.
- **Verificado:** 131 pruebas (49 de la 7.1 y 82 nuevas: firma, reglas, recepción contra MongoDB real y contratos) y `tsc` sin errores. **Mutaciones:** aceptar cualquier firma bien formada (5 pruebas fallan), tratar el duplicado como error (3), quitar el aviso a cocina (2), fechar el aviso al recibirlo (1) y no limitar los timestamps del futuro (1).

### Lo que dejó la 7.3 (22/11)

- **Cinco eventos nuevos en `EventosNucleo`:** `pedido.item_sustituido`, `producto.agotado`, `plato.listo`, `caja.turno_previo_pendiente` y `caja.cerrada`, cada uno dentro de la transacción del hecho que lo origina. Las cinco inserciones en `notificacion` desaparecieron. La anulación por quiebre de cocina no necesitó evento propio: ya publicaba `pedido.anulado`.
- **`plato.listo` es uno por comanda y por acción de cocina.** Marcar un ítem, despachar la comanda o listar una tanda (que reparte por FIFO y puede tocar varias comandas, con un evento por comanda). Repetir el marcado de un ítem ya listo no avisa otra vez. Una comanda sin mozo no genera evento. `despacharPedido` pasó a una transacción para que el evento y el cambio de estado se guarden juntos.
- **`caja.cerrada` solo con diferencia:** un cierre cuadrado no publica nada (hay prueba). Lo publica `CierreTurnoService` dentro de la transacción del cierre y cubre también el cierre forzado.
- **Turno previo, una sola vez:** la deduplicación pasó de leer `notificacion` a consultar `log_auditoria`; el evento y su registro se guardan en una transacción. Se pierde el matiz de volver a avisar si el aviso anterior estaba leído.
- **Tabla retirada:** migración `2026_11_22_000001_retirar_tabla_notificacion` (con `down()` que recrea tabla, índices y política RLS). Como con incidentes, `02_schema_ddl.sql` conserva la tabla y la migración la quita; `schema-check.sh` confirma que el esquema coincide.
- **Contratos:** seis archivos nuevos en `doc-2u/servicios/contratos/` (`producto.agotado` tiene dos, uno por causa). El trait de contratos trata `causa` como valor fijo y `turno_correlativo` como entero. La lista de pendientes de `contratos.test.ts` quedó vacía.
- **De punta a punta:** un `producto.agotado` publicado en el núcleo salió por el outbox (entrega `entregado` al primer intento) y creó en Mongo dos avisos, uno para el administrador y otro para los mozos. Los datos de prueba se borraron.
- **Verificado:** 9 pruebas nuevas en `EventosOutboxPublicacionTest` y 3 pruebas existentes pasadas de comprobar la tabla a comprobar el evento; 137 pruebas de vitest y `tsc` sin errores; Pint; suite completa del núcleo: 714 pasan y 3 fallan. Los 3 fallos son de `AdminFlujoCajaTest` ("periodo hoy" a las 3 de la madrugada) y fallan igual sin estos cambios.
- **Pendiente anotado:** esas 3 pruebas dependen de la hora del día; conviene fijar el reloj en ellas.

### Lo que dejó la 7.4 (22/11)

- **JWT en el servicio:** `soporte/jwt.ts` traduce el de ms-analítica con `jose`: RS256 fijo, emisor, audiencia, `exp`/`nbf` con 30 s de tolerancia, `sub`, `empresa_id` y `local_id` como uuid, y 503 `ERR_JWT_NO_CONFIGURADO` con la clave ausente o mal formada. El plan lo ubicaba en la 7.2, pero allí solo se hizo la firma interna.
- **Una sola regla de visibilidad:** `datos/bandeja.ts` exporta `filtroVisible` (MongoDB) y `esVisible` (memoria, para el SSE). Una prueba inserta 28 avisos (2 empresas × 2 sedes × 7 destinatarios) y comprueba que ambas coinciden para 44 contextos distintos. Un rol de sede sin sede en el contexto lanza un error en vez de ampliarse a toda la empresa; el token sin sede de un rol que no es propietario se rechaza con 401.
- **Rutas:** listado paginado (`meta.total`), `no-leidas/total` con `criticas`, `PATCH /{id}/leida`, `marcar-todas-leidas` y `stream`. Un aviso ajeno, de otra empresa o con id mal formado responde 404 igual que uno inexistente. Marcar como leído es una sola actualización atómica (`$addToSet` con la condición «aún no leído por mí»), así que repetirlo no duplica el registro.
- **Canal SSE:** `fetch` con `Authorization: Bearer`, cabeceras `text/event-stream`, `no-cache` y `X-Accel-Buffering: no`; `conectado` al abrir, un evento `aviso` con su `id:`, latido cada 25 s y `renovar` más cierre 30 s antes de `exp`. La conexión se registra antes de enviar `conectado`, para no perder avisos entre una cosa y otra. Los errores de autenticación salen en JSON antes de abrir el canal.
- **Apagado:** `forceCloseConnections: true` y un gancho `preClose` que termina los canales de forma ordenada. Sin lo primero, `app.close()` se quedaba esperando conexiones de clientes.
- **De punta a punta:** con un JWT emitido por el núcleo (`/auth/token-servicios`), un `curl -N` al puerto 8003 recibió `conectado` y, al enviar un `plato.listo` firmado, el `aviso` al instante; el contador y `marcar-todas-leidas` respondieron bien. Datos de prueba borrados.
- **Verificado:** 226 pruebas de vitest (89 nuevas) y `tsc` sin errores. **Mutaciones que las pruebas detectan:** quitar el filtro de empresa, de rol, de usuario o de sede (en el filtro y en `esVisible`), el leído por usuario, no fijar RS256, aceptar otra sede, aceptar un rol de sede sin sede, no repartir y no cerrar al vencer. Sin detectar: no limpiar el intervalo del latido (fuga sin efecto visible; el intervalo comprueba que la conexión siga abierta).
- **Aviso de entorno:** en Git Bash, `vitest` falla con «failed to find the runner» si se ejecuta desde la ruta `/j/...`; desde PowerShell (`J:\...`) funciona.

### Lo que dejó la 7.5 (22/11)

- **Dos servicios de Kong con el mismo destino:** `notificaciones` (ruta `/api/v1/notificaciones`; conexión 3 s, lectura y escritura 30 s, 1 reintento) y `notificaciones-flujo` (ruta `/api/v1/notificaciones/stream`; lectura 16 min, sin reintentos, `response_buffering` y `request_buffering` desactivados). Los tiempos son propiedades del servicio, por eso no basta con una ruta más. Ambos llevan `jwt` (RS256, máximo 15 min) y `rate-limiting` de 120 por minuto, como ms-analítica; Kong elige el prefijo más largo.
- **No se expone:** `/interno` y `/health` dan 404 desde Kong. Kong ahora espera a que `notificaciones` esté sano.
- **Verificado por el puerto 8000** con un JWT real del núcleo: sin token 401 (bandeja y canal), contador 200, `/interno/eventos` y `/health` 404, y un `plato.listo` firmado llegó por `curl -N` en menos de 0.4 s, con `Transfer-Encoding: chunked` y el límite de 120 por minuto. `smoke-gateway.sh --rapido`: 121 comprobaciones correctas. El corte real a los 16 minutos no se probó; lo cubren los 15 minutos máximos del JWT y el cierre del servicio.

### Lo que dejó la 7.6 (22/11)

- **Maqueta aprobada** (`wireframe/usuario/CU-TRANS-01-notificaciones-sistema/maqueta-notificaciones.html`) con dos decisiones del usuario: la campana de las terminales (mozo, cocina, caja) es un botón flotante que **se oculta sin avisos sin leer** y entra animada cuando llega uno; en administración y propietario **nunca se oculta**. Además, los avisos que no son críticos tienen un aviso flotante discreto de 4 s (el crítico dura 6 s).
- **Servicio y canal:** `realNotificacionesService` sobre `clienteMicroservicios` (que ya renueva el JWT y reintenta tras un 401) y `flujoNotificaciones.ts`: lector de SSE sobre `fetch` sin dependencias. Con `renovar` pide un JWT nuevo y reabre sin espera; si el canal cae, reintenta con espera creciente (1 s, 2 s… hasta 30 s) y consulta el contador cada 30 s; un 403 lo detiene y un 401 se reintenta una vez.
- **Componentes** en `components/notificaciones/`: `useNotificaciones` (estado puro en un reductor), `CampanaNotificaciones`, `PanelNotificaciones` (440 px, modal, con trampa de foco) y `AvisosFlotantes` (crítico `role="alert"`, normal `role="status"`). `Alt+N` abre y cierra, `Esc` cierra y devuelve el foco a la campana. El propietario ve el nombre de la sede en cada aviso (se pide el directorio al abrir el panel). Abrir el detalle marca el aviso como leído pero lo deja a la vista; «Marcar leída» lo saca de «No leídas».
- **Montaje:** una sola instancia por pantalla. `DashboardLayout` la monta en la sidebar (escritorio) o en la barra superior (tableta y teléfono), para `admin_local` y `propietario`; `TerminalLayout` monta la flotante para `mozo`, `cocina` y `cajero`. Solo con la API real (`IS_REAL_API`).
- **Retirado:** `DropdownCampanaNotificaciones`, `NotificacionCampanaDTO`, los métodos de campana del servicio real y del mock (incluidas las semillas y `simularNuevaAnulacionSse`).
- **Verificado:** 234 pruebas de vitest (la suite completa), `tsc -b`, `npm run build` y `check:ui` sin hallazgos en los archivos nuevos (los 4 406 del resto son anteriores). **Mutaciones detectadas:** campana flotante siempre visible o que se oculta con el panel abierto, `Alt+N`, foco que no vuelve, aviso sin deduplicar, crítico de 4 s, crítico que no se anuncia con el panel abierto, contador de críticas, marcar dos veces, reconexión sin recargar, respaldo sin contador, canal que no se cierra, `role=alert`, detalle que no marca (o que saca el aviso), trampa de foco, `renovar` sin JWT nuevo, 403 que reintenta, sin respaldo, lector que pierde el trozo incompleto y sin `X-Local-Id`. La única superviviente es equivalente (el latido ya se ignora por otra rama).
- **Revisión con Playwright** (real, contra Kong y ms-notificaciones, con sesiones del núcleo) a 360, 768 y 1280 px en administración, propietario, mozo y cocina: la campana aparece donde corresponde, el panel cabe en la ventana (360 px ocupa todo el ancho, 440 px en el resto), no hay desbordes horizontales ni errores de consola, `Esc` lo cierra, y un aviso en vivo llegó a la pantalla en unos 160 ms.
- **Notas:** `networkidle` nunca se alcanza con el canal abierto, así que las pruebas de navegador esperan `load`. Con firma HMAC, el cliente `curl` de Git Bash en Windows rompe el cuerpo con acentos; para firmar a mano se usa Python.

### Lo que dejó la 7.7 (22/11)

- **`scripts/smoke-notificaciones.sh`** con `--rapido`, `--levantar` y `--sin-evidencias`, al estilo de `smoke-gateway.sh`. Hace acciones reales contra el Compose, por Kong y con los JWT que emite el núcleo, y deja las evidencias en `doc-2u/evidencias/smoke-notificaciones/<fecha>/`. **129 comprobaciones correctas** (113 con `--rapido`, unos 2 min; completo, unos 4,5 min).
- **Qué recorre:** (0) contenedores, worker en la cola `eventos`, `NOTIFICACIONES_URL`, secreto y clave pública iguales en todos, y los índices de MongoDB (único, TTL y validador estricto); (A) un plato marcado como agotado por cocina llega como alerta al administrador y a los mozos, y no a cocina ni al propietario; (B) un plato listo anulado por el mozo llega como alerta al administrador y como crítico a cocina; (C) un flujo `curl -N` por Kong recibe el aviso crítico (0,6 s después de la acción en la corrida de referencia) con cabeceras de SSE y sin datos internos, y el flujo del mozo no recibe nada; (D) reenviar el evento con `outbox:reenviar-eventos` no crea avisos nuevos; (E) aislamiento de empresa, sede, rol y usuario, y leído por persona (dos mozos del mismo rol, `marcar-todas-leidas` solo de quien lo hace, un solo registro de lectura por usuario); (F) 11 rechazos de Kong y 4 del servicio (con quién rechazó cada uno), `/interno` y `/health` con 404 por Kong y firma interna ausente, de otro secreto, vieja o con el cuerpo alterado; (G) con ms-notificaciones apagada: Kong da 504 en 6 s, el núcleo anula sin errores, la entrega queda pendiente y en pausa sin gastar intentos, y al encenderla los avisos llegan solos (88 s en la corrida de referencia) con la hora del hecho.
- **Datos de prueba:** una comanda y un producto con el prefijo `SMOKE`. Al salir se anula la comanda, se desactiva el producto, se borran los avisos de MongoDB que mencionan la marca y se cierran las sesiones. Quedan los eventos del outbox y las anulaciones, que son inmutables. Si se interrumpe con el servicio apagado, lo enciende.
- **Detalles que costaron:** el servicio de Fastify no envía la cabecera `Server` y Kong pone la suya, así que «quién respondió» se decide por el formato del cuerpo (`exito`) y no por esa cabecera. El log de Kong guarda la URL de la prueba «JWT en la URL» y el script lo tacha antes de guardarlo. `outbox:reenviar-eventos` solo toca entregas `fallido`: el script marca la suya como tal, simula primero y no reenvía si hay otras fallidas del mismo tipo.
- **Los demás humos siguen en verde:** `smoke-gateway.sh --rapido` (121) y `smoke-analitica.sh --rapido` (29).
- **Latencia observada:** del núcleo al flujo, entre 0,6 y 3 s según el ciclo del worker del outbox. El «al instante» del plan vale para el tramo ms-notificaciones → navegador; el outbox del núcleo pone el resto.

### Lo que dejó la 7.8 y cierre de la etapa (22/11)

- **Documentación al día:** `01-arquitectura` (la tabla `notificacion` figura como retirada; 4.3 con el estado y los **límites conocidos**: una sola instancia, retraso del outbox de 1 a 3 s, sin avisos de reservas ni de entregas fallidas; el canal SSE se cierra a los 15 minutos del JWT y no a los 60 de Cloud Run; `pronostico.generado` marcado como futuro en el diagrama; el contrato de API y de eventos figura como hecho), `servicios/README` (estado real de las fichas), la ficha de ms-notificaciones (estado y decisiones de la interfaz: aviso discreto de 4 s, dónde va la campana, abrir el detalle lee el aviso, hora del hecho y retraso del TTL) y el README del servicio (estado, cómo correr el humo).
- **Verificación final, en limpio:** servicio 226 pruebas y `tsc`; frontend 234 pruebas, `tsc -b`, `npm run build` y `check:ui` sin hallazgos en los archivos nuevos; núcleo: `EventosOutboxPublicacionTest` (18), `CajaCoreOperativoTest` (16), `CocinaDisponibilidadQuiebresTest` (5) y `MozoQuiebreSustitucionTest` (6); `scripts/schema-check.sh` (el esquema coincide con las migraciones); `smoke-notificaciones.sh` completo (129), `smoke-gateway.sh --rapido` (121) y `smoke-analitica.sh --rapido` (29). La suite completa del núcleo se corrió en la 7.3 (714 pasan, 3 fallan por la hora del día, ver Pendientes) y no hubo cambios de PHP después.
- **Resumen de la etapa:** ms-notificaciones recibe eventos firmados por el outbox y crea avisos por rol o por persona (siete tipos), los guarda en MongoDB sin duplicados (índice único) y con caducidad (TTL de 30 días), los muestra en una bandeja con «leído» por persona y los entrega en tiempo real por SSE a través de Kong. El núcleo dejó de guardar avisos. La campana está en administración, propietario, mozo, cocina y caja.
- **Decisiones que cambiaron o se afinaron durante la etapa** (todas en la ficha): aviso flotante discreto de 4 s para los no críticos; campana flotante de las terminales que se oculta sin avisos; abrir el detalle marca el aviso como leído sin sacarlo de la lista; el plan pedía «menos de 2 s» hasta el navegador y se mide en cambio la acción completa (menos de 10 s, 0,6 s en la corrida de referencia), porque el outbox del núcleo añade entre 0,6 y 3 s.

---

## Etapa 8. Nube — en curso (no cerrada)

> **Estado de la etapa:** Esta etapa **permanece en curso (abierta)**. Se completó con éxito la **primera parte** (empaquetado, QA local y manual de Artifact Registry), pero **no se considera cerrada** hasta ejecutar el despliegue real en la infraestructura de Google Cloud Platform (GCP).

### Primera parte completada: empaquetado, QA y despliegue local (25–26/11)

- **Esquema SQL consolidado (8.A) y correos transaccionales (8.B):** los scripts de `database/sql` reflejan el estado final del esquema (`snapshot_stock_diario` retirada), verificados con `schema-check.sh`; correos de activación e invitación interceptados con Mailpit en desarrollo y QA.
- **Modelo en GCS (8.C):** `ms-pronóstico` incorpora el adaptador `AlmacenGcs` para leer desde `gs://rc-modelos-demo-aurea`.
- **Imágenes autocontenidas (8.1) y Compose de despliegue (8.2):** `api.Dockerfile` (`target: prod` obligatorio con `APP_KEY`), `web.Dockerfile` (Caddy `2.8.4-alpine` + SPA con code-splitting), `docker-compose.prod.yml` (`name: restaurantcloud`, sin `container_name`, memoria total medida **~1,01 GiB** en reposo para los 15 contenedores activos de QA) y `Caddyfile` (solo Caddy publica `80`/`443`; Mailpit en `127.0.0.1:8025` y consola MinIO en `127.0.0.1:9001`).
- **Configuración y datos demo (8.3–8.5):** `.env.qa.example` y `.env.production.example` en 9 grupos; `generar-env.sh`/`.ps1` (secretos aleatorios + RSA JWT vía `php artisan jwt:claves`); `qa-preparar.sh`/`.ps1` y `qa-reiniciar.sh`/`.ps1` (seed ÁUREA, 5 roles, historial sintético incremental hasta ayer y pronóstico nivel 3 con `metodo=modelo`); comando único `qa.ps1` / `qa.sh` con comprobaciones previas y `.gitattributes` LF verificado en clon limpio con `core.autocrlf=true`.
- **Verificación y documentación (8.6–8.8):** los 4 humos adaptados con `--despliegue` y `verificar-despliegue.sh` en verde (`413/413` comprobaciones + aislamiento de 11 puertos internos + `X-Forwarded-For` sobrescrito por Caddy); guía para testers en `restaurantcloud/docs/guia/guia-testers.md` y manual de Artifact Registry en `restaurantcloud/docs/guia/manual-artifact-registry.md` (sin ejecutar comandos en GCP aún).

### Segunda parte pendiente (para el cierre definitivo de la etapa 8):

- **Artifact Registry:** Creación del repositorio y subida efectiva de las imágenes etiquetadas a GCP (`REGION-docker.pkg.dev/...`).
- **Despliegue PaaS / VM:** Puesta en marcha en una máquina virtual de producción (Compute Engine) con dominio y TLS vía Caddy.
- **Cloud Run:** Despliegue de `ms-pronóstico` en Cloud Run conectado mediante IAM al bucket de modelos en Google Cloud Storage.
- **Laboratorio GKE:** Despliegue del clúster de Kubernetes en Google Kubernetes Engine exigido por la guía de evaluación.

---

## Hoja de ruta (se detalla al llegar)

| Etapa | Contenido | Requisito de la guía que cubre |
|---|---|---|
| 8. Nube | **En curso (abierta):** primera parte completada (empaquetado, QA local y manuales); **pendiente en GCP:** Artifact Registry, VM, Cloud Run (`ms-pronóstico`) y laboratorio de GKE | Registro, PaaS, Kubernetes |
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
- **Fuera de la etapa 7 por decisión:** la alerta de entregas fallidas (se lee del outbox, `outbox:estado`) y el aviso de «reserva próxima» en ms-notificaciones (necesita un programador de tareas). Escalar ms-notificaciones a más de una instancia exige un canal común (Redis o un change stream de MongoDB) para repartir los avisos por SSE.
- **Pruebas que dependen de la hora del día:** 3 pruebas de `AdminFlujoCajaTest` («periodo hoy») fallan de madrugada, con o sin los cambios de la etapa 7. Conviene fijar el reloj en ellas.
- **Imágenes en producción:** al desplegar hay que **reconstruir** las imágenes de `api`, `queue` y `scheduler`, no solo reiniciarlas. Con una imagen antigua el worker no escucha la cola `eventos`, y los cambios de configuración (`ANALITICA_URL`) solo se aplican al recrear el contenedor.
- **Montaje de contratos:** el contenedor `api` monta `doc-2u/servicios/contratos` solo para las pruebas; no va en `docker-compose.prod.yml`.
- **Histórico sintético en la base de desarrollo.** `analitica_db` tiene 730 días de ÁUREA hasta 2026-11-17, y `ultimo_evento_en` de la serie vale la hora de esa carga, no la de una venta real: ms-pronóstico no debe interpretarlo como actividad reciente. Al activar datos reales se ejecuta `purgar` con el corte.
- **Datos de las pruebas de humo en la base de desarrollo:** producto, mesas y pedidos `SMOKE`, comprobantes reales y una caja que el script abrió y dejó abierta; `smoke-notificaciones.sh` deja una comanda y un producto `SMOKE` (anulada y desactivado), las anulaciones (inmutables) y sus eventos del outbox. Antes de una demostración conviene recrear la base de desarrollo.

## Riesgos

- **`CajaController::cobrar` es el punto más delicado.** La publicación del evento son dos inserciones dentro de la transacción, sin llamadas de red; cubierto por las pruebas de cobro y por la prueba de humo.
- ~~**`docker-compose.prod.yml` conserva los nombres `saas_*`.**~~ Resuelto en la 8.2: se renombró con `name: restaurantcloud` y sin `container_name` para aislar contenedores y volúmenes de desarrollo (`restaurantcloudIA_*`).
- **La suite completa del núcleo tarda unos 14 minutos.** Durante el desarrollo se ejecutan las clases afectadas; la suite completa, al cerrar cada etapa.

## Verificación

- **Núcleo:** `docker exec restaurantcloudIA_api php artisan test --compact` (639 pruebas en la última corrida completa, 18/11, más 4 de `carta:exportar` ejecutadas aparte). Si se cambia el seed, antes `./scripts/test-db-reset.sh`.
- **ms-analítica:** `uv run pytest` en `services/analitica`, con `TEST_DATABASE_URL` y `TEST_APP_DATABASE_URL` (111 pruebas, unos 2 minutos desde el host).
- **Frontend:** `npm test` en `apps/web` (149 pruebas de vitest), `npm run build` y `npm run check:ui`.
- **Integración:** `./scripts/smoke-analitica.sh`, `./scripts/smoke-pronostico.sh`, `./scripts/smoke-gateway.sh` y `./scripts/smoke-notificaciones.sh` (aceptan `--despliegue` contra `docker-compose.prod.yml`, y `./scripts/verificar-despliegue.sh` valida además puertos cerrados y `X-Forwarded-For`).
- **Entorno QA local:** `./scripts/qa.ps1 iniciar` (PowerShell) o `./scripts/qa.sh iniciar` (Bash).
- **Estado de las entregas:** `docker exec restaurantcloudIA_api php artisan outbox:estado`.
