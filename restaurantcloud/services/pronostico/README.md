# pronostico

Pronóstico de demanda por plato (componente de IA). No entrena: usa el modelo que publica `model-ia`.

Stack: Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL propio · `rc_pronostico` (paquete de `model-ia`)

**Estado:** etapa 5B.2. `POST` y `GET /interno/pronosticos` funcionan de punta a punta con el baseline (ms-analítica real, base y firma HMAC). El modelo publicado por `model-ia` se carga, se verifica y se usa (5B.3); `GET /interno/modelos/vigente` dice cuál.

Contrato con el resto del sistema: [`doc-2u/servicios/ms-pronostico.md`](../../../doc-2u/servicios/ms-pronostico.md). Este servicio no importa código de otros servicios; solo usa la librería `rc_pronostico`.

## Estructura

```text
app/
  main.py  composicion.py  config.py
  api/               rutas FastAPI; no conoce adaptadores ni la base
  casos_de_uso/      generar_pronostico, consultar_ejecucion, consultar_modelo_vigente, consultar_salud, proveedor_modelos y sus puertos
  dominio/           reglas puras: periodo, calendario (cierres y feriados), advertencias y errores
  adaptadores/       lo que cambia con la tecnología: almacén local, cliente HTTP de ms-analítica, reloj, base de datos (gs:// llega en la etapa 8)
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

El pronóstico real necesita ms-analítica arriba (`docker compose up -d analitica`) con ventas cargadas; las pruebas la simulan.

Si cambia `model-ia/rc_pronostico/pyproject.toml`, hay que ejecutar `uv lock` aquí y reconstruir la imagen.
