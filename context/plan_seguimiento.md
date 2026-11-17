# Plan: construcción de la Unidad II sobre `betta`

## Contexto

La rama `monolito` conserva el producto de la Unidad I. En `betta` ya está el diseño completo de la arquitectura distribuida (`doc-2u/`): tres microservicios alrededor del núcleo Laravel, cada uno con su base de datos, contratos de API y de eventos, y modelo de datos validado. El entorno local ya se renombró (`restaurantcloud-ia`, contenedores `restaurantcloudIA_*`) y tiene las bases de los microservicios levantadas. **Todavía no hay código de microservicios.**

La guía evalúa en la semana 11: microservicios, Docker e integración (25 %), aplicación funcional (20 %), IA integrada (15 %), y además exige API documentada, imágenes en Artifact Registry, un despliegue PaaS, un laboratorio de GKE y el protocolo experimental.

Este plan ordena el trabajo en etapas que dejan algo demostrable cada una. Las etapas 0 a 3 están detalladas; las siguientes son la hoja de ruta y se detallan al llegar.

**Reglas de trabajo:** commits pequeños por tema, sin línea de coautoría; `vendor/bin/pint --dirty --format agent` antes de cada commit de PHP; ningún `git push` sin confirmación; cualquier cambio de contrato se refleja en `doc-2u/servicios/`.

---

## Etapa 0. Cerrar la preparación del entorno (pendiente)

**Estado:** cambios hechos, sin commit. La suite sobre el entorno renombrado dio 591 de 592; falló `MozoMesasUnionTest::test_comanda_enviada_desde_mesa_anexa…`, que pasa sola y con todo el grupo Mozo. Hay una segunda ejecución completa en curso con informe guardado en `storage/logs/fase0.txt`.

1. Leer el resultado de la segunda ejecución.
   - **Si pasa:** anotar la falla como aislada y no reproducida, y seguir.
   - **Si vuelve a fallar:** diagnosticar con el mensaje del informe. Hipótesis a comprobar: la prueba solo inserta una caja si no hay una abierta, así que depende del estado que dejen otras pruebas o de la semilla; y la ejecución cruzó horas cercanas a la medianoche. Corregir la prueba para que prepare su propio estado.
2. Commit del entorno: `docker-compose.yml`, `.env.example`, README, guías, scripts y eliminación de `services/ai`.
3. **Cambios ajenos en el árbol de trabajo:** hay archivos movidos y borrados que no hice yo (los `PLAN_PENDIENTE_*` pasaron de `restaurantcloud/implementacion/` a `implementacion/`; se borraron `docs/adr/.gitkeep`, los diagramas `diagrama_arquitectura_web.*` y `plan_pruebas_manuales_flujo_caja.md`). No se incluyen en mi commit; se pregunta al usuario si los commitea él o si se agregan en un commit aparte.

## Etapa 1. Núcleo: publicar eventos

Contrato: `doc-2u/servicios/nucleo-laravel.md` y `eventos.md`. Todo en `restaurantcloud/apps/api`.

1. **Migración** `outbox_entrega` (SQL ya validado). Se crea con `php artisan make:migration`.
2. **`config/eventos.php`:** mapa tipo de evento → destinos, y por destino su URL y secreto desde variables de entorno (`ANALITICA_URL`, `ANALITICA_SECRETO`…). Un destino sin URL configurada se omite, para que el núcleo funcione sin microservicios.
3. **`App\Domains\Eventos\Services\PublicadorEventos`:** método `publicar(tipo, empresaId, localId, agregadoTipo, agregadoId, datos)` que inserta en `outbox_event` y una fila en `outbox_entrega` por destino. Se llama dentro de la transacción del negocio; no hace llamadas de red.
4. **Emisión de los tres eventos:**
   - `venta.registrada`: en `CajaController::cobrar`, junto a la inserción del comprobante (línea ~1218), que cubre cuenta completa y subcuenta. `fecha_operativa` se obtiene con `JornadaOperativaService::fechaOperativa` (`app/Domains/Horario/Services`).
   - `comprobante.anulado`: en `CajaController::emitirNotaCredito` (~1815).
   - `pedido.anulado`: en las cuatro inserciones de `pedido_anulacion` de `MozoController` (~2816, 3107, 3136, 3571), mediante un único método auxiliar que arma el evento desde la fila insertada.
5. **Despacho:** comando `outbox:despachar-eventos` (modelo: `app/Console/Commands/DespacharOutboxComprobantes.php`) y job `EntregarEventoJob` (modelo: `app/Domains/Caja/Jobs/GenerarComprobanteDigitalJob.php`) que envía con `Http::timeout(5)`, cabeceras `X-Timestamp` y `X-Firma` (HMAC-SHA256 de `timestamp.cuerpo`). Respuesta 2xx → `entregado`; otro resultado → suma intento y reprograma con espera creciente; a los 8 intentos → `fallido`. Se agenda cada minuto en `routes/console.php`.
6. **No se modifica** el flujo `comprobante.digital.solicitado`.

**Pruebas (PHPUnit, patrón de `CobroFiscalComprobanteTest`):** el cobro crea el evento con el cuerpo del contrato y sus entregas; un cobro que falla no deja eventos; la nota de crédito y la anulación emiten los suyos; el job marca `entregado` o reprograma (`Http::fake`); la firma se calcula como dice el contrato.

## Etapa 2. ms-analítica

Contrato y modelo: `doc-2u/servicios/ms-analitica.md`. Carpeta nueva `restaurantcloud/services/analitica`.

1. **Esqueleto** FastAPI con capas `app/api`, `app/dominio`, `app/datos`, `app/config.py`; `/health`; logs JSON con `X-Request-Id`. Dependencias: FastAPI, SQLAlchemy 2, Alembic, psycopg, pytest.
2. **Base:** migración Alembic con las 7 tablas del diseño. Usuario de aplicación sin privilegios de administración, creado por un script de inicialización; las migraciones usan el usuario administrador del contenedor.
3. **`POST /interno/eventos`:** dependencia que verifica la firma y la antigüedad del timestamp; validación del sobre con Pydantic; un manejador por tipo de evento, cada uno en una transacción con `evento_procesado`.
4. **`GET /interno/series/ventas-diarias`:** serie continua con `generate_series`, desde `producto_visto.primera_venta`.
5. **Dockerfile** multietapa, usuario no root, escucha en `PORT`. Servicio `analitica` en `docker-compose.yml` como `restaurantcloudIA_analitica` (puerto 8001), dependiente de `db-analitica`.
6. `.env.example` y `README.md` del servicio.

**Pruebas (pytest contra PostgreSQL real):** venta nueva, duplicada y anulada; anulación antes que la venta; firma inválida o vencida; tipo desconocido → `ignorado`; serie con días sin ventas; un local no ve datos de otro.

## Etapa 3. Integración de punta a punta

1. Con el Compose completo: cobrar desde el POS y ver la venta en ms-analítica en menos de un minuto.
2. Anular el comprobante y ver la serie corregida.
3. Apagar ms-analítica, cobrar, encenderlo y ver que el evento llega por reintento.
4. Guardar evidencias (peticiones, respuestas, capturas) para «Pruebas de integración» del informe.
5. Actualizar las fichas de `doc-2u/servicios/` si algo del contrato cambió.

---

## Hoja de ruta posterior (se detalla al llegar)

| Etapa | Contenido | Requisito de la guía que cubre |
|---|---|---|
| 4. Datos sintéticos | Generador versionado de ventas históricas (estacionalidad semanal, feriados, promociones) que entra por el mismo evento `venta.registrada`; job diario de `snapshot_stock_diario` | Datos para la IA; dataset del protocolo |
| 5. ms-pronóstico | Servicio con baseline de punta a punta; endpoints del núcleo; tabla `recomendacion_reposicion`; pantalla de pronóstico y reposición en React; después, HistGradientBoosting | IA integrada en un flujo real (15 %) |
| 6. JWT y gateway | JWT RS256 en login y refresh; Kong con rutas y validación; reportes públicos de ms-analítica (alcance de CU-ADMIN-13 por definir) | Arquitectura distribuida; seguridad |
| 7. ms-notificaciones | Servicio Node/Fastify con MongoDB, bandeja y SSE; campana en React; el núcleo deja de insertar en `notificacion` | Tercer microservicio |
| 8. Nube | Imagen de la API con el código dentro; imágenes en Artifact Registry; VM con todo el sistema; ms-pronóstico en Cloud Run; laboratorio de GKE | Registro, PaaS, Kubernetes |
| 9. Seguridad | Rol `rc_app`, prueba de RLS en la base e inventario de consultas sin contexto | Seguridad y configuración |
| 10. Informe | OpenAPI de cada servicio, diagramas exportados, protocolo experimental, plan de migración, plan hacia la semana 16 | Informe y documentación |

Orden recomendado si el tiempo aprieta: 4 → 5 → 8 antes que 6 y 7, porque IA y despliegue pesan más en la nota. Con ms-analítica y ms-pronóstico habría dos microservicios; el tercero (notificaciones) es obligatorio para la guía, así que no puede omitirse, solo reducirse a bandeja sin tiempo real.

## Riesgos

- **`CajaController::cobrar` es el punto más delicado.** El evento agrega dos inserciones dentro de la transacción y ninguna llamada de red. Se cubre con las pruebas de cobro existentes más las nuevas.
- **`docker-compose.prod.yml` conserva los nombres `saas_*`.** Renombrarlo crearía volúmenes vacíos en el servidor desplegado; se decide en la etapa 8.
- **La suite completa tarda 10 a 14 minutos.** Durante el desarrollo se ejecutan solo las clases afectadas; la suite completa, al cerrar cada etapa.

## Verificación

- Etapa 1: `docker exec restaurantcloudIA_api php artisan test --compact tests/Feature/<clases nuevas y de cobro>`; al cierre, suite completa en verde.
- Etapa 2: `pytest` del servicio en verde; `docker compose up -d analitica` y `curl http://localhost:8001/health` → 200.
- Etapa 3: los tres escenarios manuales anteriores, comprobando en `outbox_entrega` (estado `entregado`) y en las tablas `venta` y `venta_diaria_producto` de `analitica_db`.
