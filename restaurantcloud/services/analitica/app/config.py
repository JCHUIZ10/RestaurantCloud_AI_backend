"""Lectura de variables de entorno (ficha del servicio, sección 6)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8001
    # Conexión con el usuario de la aplicación, sin privilegios de administración.
    database_url: str
    # Secreto HMAC compartido con el núcleo para las rutas /interno.
    secreto_interno: str
    zona_horaria: str = "America/Lima"
    # Antigüedad máxima aceptada del X-Timestamp de una petición firmada.
    firma_tolerancia_segundos: int = 300
    # JWT de las rutas públicas (reportes). Clave pública PEM, con "\n" literales si va en una línea.
    # Sin ella esas rutas responden 503; /interno y /health no la necesitan.
    jwt_public_key: str | None = None
    jwt_emisor: str = "restaurantcloud-nucleo"
    jwt_audiencia: str = "restaurantcloud-servicios"
    # Tolerancia de reloj entre el núcleo y este servicio al validar exp y nbf.
    jwt_tolerancia_segundos: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
