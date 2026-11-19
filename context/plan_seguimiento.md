# Plan: construcción de la Unidad II sobre `betta`

**Última actualización:** 18/11/2026. Etapas 0 a 4 cerradas; la siguiente es la 5.

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
| 5. ms-pronóstico | **Siguiente** | — |

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

## Hoja de ruta (se detalla al llegar)

| Etapa | Contenido | Requisito de la guía que cubre |
|---|---|---|
| 5. ms-pronóstico | Servicio con baseline de punta a punta; endpoints del núcleo; tabla `recomendacion_reposicion`; pantalla de pronóstico y reposición en React; después, HistGradientBoosting | IA integrada en un flujo real (15 %) |
| 6. JWT y gateway | JWT RS256 en login y refresh; Kong con rutas y validación; reportes públicos de ms-analítica (alcance de CU-ADMIN-13 por definir) | Arquitectura distribuida; seguridad |
| 7. ms-notificaciones | Servicio Node/Fastify con MongoDB, bandeja y SSE; campana en React; el núcleo deja de insertar en `notificacion` | Tercer microservicio |
| 8. Nube | Imagen de la API con el código dentro; imágenes en Artifact Registry; VM con todo el sistema; ms-pronóstico en Cloud Run; laboratorio de GKE | Registro, PaaS, Kubernetes |
| 9. Seguridad | Rol `rc_app`, prueba de RLS en la base e inventario de consultas sin contexto | Seguridad y configuración |
| 10. Informe | OpenAPI de cada servicio, diagramas exportados, protocolo experimental, plan de migración, plan hacia la semana 16 | Informe y documentación |

Orden recomendado si el tiempo aprieta: 4 → 5 → 8 antes que 6 y 7, porque IA y despliegue pesan más en la nota. ms-notificaciones es obligatorio para la guía, así que no puede omitirse, solo reducirse a bandeja sin tiempo real.

## Pendientes conocidos

- **Carga inicial de ventas históricas.** Un evento publicado antes de configurar `ANALITICA_URL` no tiene entrega para ese destino y no se recupera solo. El generador sintético de la etapa 4 **no** entra por el outbox (ver sus decisiones); el histórico real, si se necesita, se reenvía con `outbox:reenviar-eventos`.
- **Plan y predicción (etapa 5).** En `06_seed_initial_data.sql` el plan Pro tiene `incluye_prediccion_ia = false`, y CU-PROP-08 dice «Pro/Enterprise». Hay que alinear plan, seed y caso de uso, y ÁUREA está en el plan Pro.
- **Promociones como variable del modelo (etapa 5).** Para pronosticar días futuros con promoción, el núcleo debe enviar a ms-pronóstico las promociones planificadas; ms-analítica solo conoce las usadas.
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
