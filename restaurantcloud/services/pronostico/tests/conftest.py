"""Pruebas contra PostgreSQL real.

Requieren `db-pronostico` arriba, con el usuario de la aplicación creado (infra/postgres/pronostico/01-usuarios.sh),
y estas variables (ver .env.example):
  TEST_DATABASE_URL      usuario administrador sobre pronostico_db_test (migraciones y limpieza)
  TEST_APP_DATABASE_URL  usuario de la aplicación sobre pronostico_db_test (el que usa el servicio)
"""

import os
import tempfile
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

SECRETO = "secreto-de-pruebas"
RAIZ = Path(__file__).resolve().parent.parent

URL_ADMIN = os.environ.get("TEST_DATABASE_URL")
URL_APP = os.environ.get("TEST_APP_DATABASE_URL")
if not URL_ADMIN or not URL_APP:
    pytest.exit("Faltan TEST_DATABASE_URL y TEST_APP_DATABASE_URL (ver .env.example).", returncode=2)

# El servicio lee su configuración al importarse: se fija antes de importar `app`.
REPOSITORIO = tempfile.mkdtemp(prefix="repositorio-pruebas-")
os.environ["DATABASE_URL"] = URL_APP
os.environ["SECRETO_INTERNO"] = SECRETO
os.environ["MODELOS_REPOSITORIO"] = REPOSITORIO
os.environ["ANALITICA_URL"] = "http://analitica.invalido:8001"  # las pruebas no la llaman
os.environ["ANALITICA_SECRETO"] = "secreto-analitica-de-pruebas"
os.environ["MIGRATIONS_DATABASE_URL"] = URL_ADMIN
# La migración 0002 concede los permisos a este usuario.
os.environ["APP_DB_USER"] = make_url(URL_APP).username

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TABLAS = "prediccion, ejecucion, modelo_version"


@pytest.fixture(scope="session", autouse=True)
def migrar():
    config = Config(str(RAIZ / "alembic.ini"))
    config.set_main_option("script_location", str(RAIZ / "migrations"))
    command.upgrade(config, "head")


@pytest.fixture(scope="session")
def motor_admin():
    motor = create_engine(URL_ADMIN)
    yield motor
    motor.dispose()


@pytest.fixture(scope="session")
def motor_app():
    """Con el mismo usuario y los mismos permisos que tiene el servicio."""
    motor = create_engine(URL_APP)
    yield motor
    motor.dispose()


@pytest.fixture(autouse=True)
def limpiar(motor_admin, migrar):
    with motor_admin.begin() as conexion:
        conexion.execute(text(f"TRUNCATE {TABLAS}"))


@pytest.fixture
def bd(motor_admin):
    """Conexión del administrador para preparar y comprobar datos."""
    with motor_admin.connect() as conexion:
        yield conexion


@pytest.fixture(scope="session")
def cliente():
    with TestClient(app) as c:
        yield c
