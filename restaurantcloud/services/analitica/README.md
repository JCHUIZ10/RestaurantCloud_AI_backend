# ms-analítica

Recibe los eventos de ventas del núcleo Laravel, mantiene la serie diaria de unidades por producto y la entrega a ms-pronóstico, y sirve al navegador los reportes de ventas y desempeño (CU-ADMIN-13). Contrato: `doc-2u/servicios/ms-analitica.md` y `eventos.md` (raíz del repositorio). Este servicio no importa código de otros servicios.

**Stack:** Python 3.12 · FastAPI · SQLAlchemy 2 (Core) · Alembic · PyJWT · PostgreSQL propio · uv.

**Estado:** recibe los tres eventos (`POST /interno/eventos`), entrega la serie (`GET /interno/series/ventas-diarias`) y expone los cuatro reportes de CU-ADMIN-13 bajo `/api/v1/analitica` (`ventas/resumen`, `ventas/por-hora`, `productos/ranking` y `personal/desempeno`), protegidos con el JWT del núcleo (etapa 6). Sin `JWT_PUBLIC_KEY`, los reportes responden 503 y el resto sigue igual.

## Estructura

```
app/
  api/       endpoints (routers); validan, llaman a dominio y responden
  dominio/   qué hacer con cada evento, rangos, y cálculos de los reportes (ingeniería de menú)
  datos/     acceso a la base; aquí vive el filtro por empresa y local
  soporte/   piezas transversales sin reglas de negocio: respuestas, firma, JWT y sede, X-Request-Id, logs
  config.py  variables de entorno
migrations/  Alembic (las 7 tablas del diseño)
tests/       pytest contra PostgreSQL real
```

Regla de dependencias: `api → dominio → datos`; cualquiera puede usar `soporte`, y `soporte` no importa de las demás capas.

## Cómo correrlo

Con Docker Compose desde `restaurantcloud/`:

```bash
docker compose up -d --build analitica     # levanta db-analitica, aplica migraciones y arranca el servicio
curl http://localhost:8001/health
```

`analitica-migraciones` aplica `alembic upgrade head` con el usuario administrador; `analitica` se conecta con `analitica_app`, que no puede crear ni borrar tablas.

## Pruebas y desarrollo local

Con `db-analitica` arriba (puerto 5433) y las variables de `.env.example` exportadas (las pruebas usan `TEST_DATABASE_URL` y `TEST_APP_DATABASE_URL`):

```bash
uv sync
uv run pytest
```

## Prueba de humo de punta a punta

`scripts/smoke-analitica.sh` (desde `restaurantcloud/`) comprueba el flujo completo contra el Compose en marcha, con el POS real: cobra y verifica la venta en ms-analítica y en la serie, anula con una nota de crédito y verifica la corrección, y por último apaga ms-analítica, cobra, la enciende y verifica que el evento llega por reintento. Antes de empezar comprueba lo que las pruebas unitarias no pueden: que el worker escucha la cola `eventos`, que `ANALITICA_URL` está definida y que el secreto de firma coincide.

```bash
./scripts/smoke-analitica.sh            # los tres escenarios (unos 3 minutos)
./scripts/smoke-analitica.sh --rapido   # sin el escenario de caída
```

Usa datos reales de la base de desarrollo (producto, mesas y pedidos con el prefijo `SMOKE`; los comprobantes no se pueden borrar) y guarda las evidencias en `doc-2u/evidencias/smoke-analitica/<fecha>/`.

Para crear una migración nueva: `uv run alembic revision -m "descripcion"` con `MIGRATIONS_DATABASE_URL` definida.

## Datos sintéticos de ventas

Para entrenar y evaluar el pronóstico hace falta historial, y un local nuevo no lo tiene. `python -m app.sinteticos` genera ventas con las reglas de un perfil versionado (`app/sinteticos/perfiles/`) y las guarda con la **misma función** que procesa el evento `venta.registrada` (`aplicar_venta_registrada`), sin HTTP ni outbox. El núcleo no recibe comprobantes falsos.

- **Reproducible:** el mismo perfil, semilla y rango dan siempre las mismas ventas, y el sorteo de un día no depende del resto del rango. Cada día se guarda en su propia transacción y repetir el comando no duplica nada.
- **Hasta una fecha de corte:** `--hasta` es ayer por defecto y se rechaza hoy o el futuro; lo reciente solo debe venir de ventas reales.
- **Es una carga local:** corre dentro del contenedor y no usa la red. Con unas 1.700 ventas al mes, 24 meses tardan unos minutos.

```bash
# La carta, los mozos y las promociones del local los entrega el núcleo.
docker exec restaurantcloudIA_api php artisan carta:exportar <local_id> \
  | docker exec -i restaurantcloudIA_analitica \
      python -m app.sinteticos generar --carta - --perfil aurea_v1 --semilla 2026 --meses 24 \
      --verdad /tmp/verdad.csv        # opcional: demanda esperada por plato y día
```

Para ponerlo al día después de unos días, sin repetir la carga completa, usa `--incremental`: genera solo desde el día siguiente a la última venta cargada hasta ayer (si ya está al día, no hace nada; si el local no tiene ventas, hace la carga completa). La guía de cada comando y cuándo usarlo está en `docs/comandos_datos_sinteticos.md`.

`--verdad` guarda la demanda esperada del generador: es la referencia con la que el protocolo mide qué tan cerca queda el modelo de la demanda real subyacente.

Para reemplazar el histórico sintético por datos reales se borra todo lo anterior al corte (sin `--confirmar` solo cuenta). **Borra lo anterior al corte sea sintético o real**; la tabla `producto_visto` se reconstruye con lo que queda.

```bash
docker exec restaurantcloudIA_analitica python -m app.sinteticos purgar \
  --empresa <empresa_id> --local <local_id> --hasta 2026-11-17 [--confirmar]
```

Un perfil nuevo es un archivo JSON más en `app/sinteticos/perfiles/`: no se edita uno ya usado, para que un conjunto de datos siga siendo reproducible. Las pruebas de carga corren contra PostgreSQL y tardan casi dos minutos.
