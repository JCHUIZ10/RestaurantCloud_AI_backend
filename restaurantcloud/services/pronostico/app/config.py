"""Lectura de variables de entorno (ficha del servicio, sección 6)."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8002
    # Conexión con el usuario de la aplicación, sin privilegios de administración.
    database_url: str
    # Secreto HMAC compartido con el núcleo para las rutas /interno.
    secreto_interno: str
    zona_horaria: str = "America/Lima"
    # Antigüedad máxima aceptada del X-Timestamp de una petición firmada.
    firma_tolerancia_segundos: int = 300
    # Raíz del repositorio de modelos. El esquema elige el adaptador: file:// hoy, gs:// en la etapa 8.
    modelos_repositorio: str
    # ms-analítica: de allí sale la serie de ventas.
    analitica_url: str
    analitica_secreto: str
    analitica_timeout_segundos: float = 10
    # Días de historial que se piden (máximo 730, el límite de ms-analítica). Las variables miran como
    # mucho 63 días atrás, así que 365 da el mismo pronóstico que todo el historial.
    ventana_historial_dias: int = Field(default=365, ge=70, le=730)
    pais_feriados: str = "PE"


@lru_cache
def get_settings() -> Settings:
    return Settings()
