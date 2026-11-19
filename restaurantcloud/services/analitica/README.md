# ms-analítica

Recibe los eventos de ventas del núcleo Laravel, mantiene la serie diaria de unidades por producto y la entrega a ms-pronóstico. Contrato: `doc-2u/servicios/ms-analitica.md` y `eventos.md` (raíz del repositorio). Este servicio no importa código de otros servicios.

**Stack:** Python 3.12 · FastAPI · SQLAlchemy 2 (Core) · Alembic · PostgreSQL propio · uv.

**Estado:** completo para la Etapa 2: recibe los tres eventos (`POST /interno/eventos`) y entrega la serie (`GET /interno/series/ventas-diarias`).

## Estructura

```
app/
  api/       endpoints (routers); validan, llaman a dominio y responden
  dominio/   qué hacer con cada evento, validación del rango de una serie
  datos/     acceso a la base; aquí vive el filtro por empresa y local
  soporte/   piezas transversales sin reglas de negocio: respuestas, firma, X-Request-Id, logs
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

Para crear una migración nueva: `uv run alembic revision -m "descripcion"` con `MIGRATIONS_DATABASE_URL` definida.
