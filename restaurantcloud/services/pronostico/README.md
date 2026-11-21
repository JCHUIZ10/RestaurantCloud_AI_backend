# pronostico

Pronóstico de demanda por plato (componente de IA). No entrena: usa el modelo que publica `model-ia`.

Stack: Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL propio · `rc_pronostico` (paquete de `model-ia`)

**Estado:** esqueleto (etapa 5B.1): `/health`, base con sus 3 tablas y arquitectura de puertos y adaptadores. Los endpoints de pronóstico llegan con la 5B.2 y la carga del modelo con la 5B.3.

Contrato con el resto del sistema: [`doc-2u/servicios/ms-pronostico.md`](../../../doc-2u/servicios/ms-pronostico.md). Este servicio no importa código de otros servicios; solo usa la librería `rc_pronostico`.

## Estructura

```text
app/
  main.py  composicion.py  config.py
  api/               rutas FastAPI; no conoce adaptadores ni la base
  casos_de_uso/      lógica de aplicación y sus puertos (puertos.py, contenedor.py)
  dominio/           reglas propias y puras
  adaptadores/       lo que cambia con la tecnología: almacén local, base de datos (gs:// y ms-analítica después)
  soporte/           firma, logs, X-Request-Id y respuestas (copiado de ms-analítica)
migrations/          Alembic
tests/
```

Las reglas de dependencias las comprueba `tests/test_arquitectura.py`; están en la sección 8 de la ficha.

## Base de datos y permisos

Dos usuarios: el administrador (`PRONOSTICO_DB_USER`) aplica las migraciones y el de la aplicación (`PRONOSTICO_DB_APP_USER`) es el que usa el servicio. La migración `0002` le concede **solo** lo que necesita: leer e insertar en `ejecucion`, `prediccion` y `modelo_version`, y cambiar el estado de un modelo. No puede modificar ni borrar lo ya guardado: lo hace cumplir la base, no solo el código.

`infra/postgres/pronostico/01-usuarios.sh` crea el usuario y la base de pruebas. PostgreSQL lo ejecuta solo al inicializar un volumen vacío; sobre uno existente:

```bash
# En Git Bash, MSYS_NO_PATHCONV=1 evita que convierta la ruta del contenedor en una de Windows.
MSYS_NO_PATHCONV=1 docker compose exec db-pronostico sh /docker-entrypoint-initdb.d/01-usuarios.sh
```

## Cómo se ejecuta

Con Docker (desde `restaurantcloud/`): `docker compose up -d pronostico` aplica las migraciones y levanta el servicio en el puerto 8002. La imagen toma `rc_pronostico` de `model-ia/` como contexto adicional de construcción y monta `model-ia/repositorio/` de solo lectura.

Pruebas (necesitan `db-pronostico` arriba; variables en `.env.example`):

```bash
cd restaurantcloud/services/pronostico
export TEST_DATABASE_URL=postgresql+psycopg://pronostico_admin:dev_pronostico_123@localhost:5434/pronostico_db_test
export TEST_APP_DATABASE_URL=postgresql+psycopg://pronostico_app:cambiar_en_local@localhost:5434/pronostico_db_test
uv run pytest
```

Si cambia `model-ia/rc_pronostico/pyproject.toml`, hay que ejecutar `uv lock` aquí y reconstruir la imagen.
