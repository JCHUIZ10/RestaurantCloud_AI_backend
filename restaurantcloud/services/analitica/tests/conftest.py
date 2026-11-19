"""Pruebas contra PostgreSQL real.

Requieren `db-analitica` arriba y estas variables (ver .env.example):
  TEST_DATABASE_URL      usuario administrador sobre analitica_db_test (migraciones y limpieza)
  TEST_APP_DATABASE_URL  usuario de la aplicación sobre analitica_db_test (el que usa el servicio)
"""

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

from tests.ayudas import SECRETO

RAIZ = Path(__file__).resolve().parent.parent

URL_ADMIN = os.environ.get("TEST_DATABASE_URL")
URL_APP = os.environ.get("TEST_APP_DATABASE_URL")
if not URL_ADMIN or not URL_APP:
    pytest.exit("Faltan TEST_DATABASE_URL y TEST_APP_DATABASE_URL (ver .env.example).", returncode=2)

# El servicio lee su configuración al importarse: se fija antes de importar `app`.
os.environ["DATABASE_URL"] = URL_APP
os.environ["SECRETO_INTERNO"] = SECRETO
os.environ["MIGRATIONS_DATABASE_URL"] = URL_ADMIN

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TABLAS = (
    "anulacion_pendiente, evento_procesado, anulacion, venta_diaria_producto, producto_visto, venta_item, venta"
)


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


@pytest.fixture(autouse=True)
def limpiar(motor_admin, migrar):
    with motor_admin.begin() as conexion:
        conexion.execute(text(f"TRUNCATE {TABLAS}"))


@pytest.fixture
def bd(motor_admin):
    """Conexión de lectura para comprobar lo que el servicio dejó en la base."""
    with motor_admin.connect() as conexion:
        yield conexion


@pytest.fixture(scope="session")
def cliente():
    with TestClient(app) as c:
        yield c
