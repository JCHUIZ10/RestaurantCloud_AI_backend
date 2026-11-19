"""Perfil de demanda de un local: las reglas con las que se genera su historial.

Un perfil se versiona como archivo JSON en `perfiles/`; cambiar una regla es crear otra versión,
para que un conjunto de datos siempre se pueda reproducir con (perfil, semilla, rango).
"""

import re
from datetime import date
from pathlib import Path
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

CARPETA_PERFILES = Path(__file__).parent / "perfiles"


class Campana(BaseModel):
    desde: date
    hasta: date


class PromocionPerfil(BaseModel):
    """Cuándo se promociona una promoción de la carta y cuánto mueve la demanda."""

    promocion_id: UUID
    campanas: list[Campana]
    aumento_tickets: float = Field(ge=0)  # 0,12 = 12 % más comprobantes los días elegibles de la campaña
    uso: float = Field(ge=0, le=1)  # fracción de los comprobantes elegibles que la usan


class Franja(BaseModel):
    """Un pico de afluencia: hora media y dispersión, en horas, y su peso en el total."""

    media: float
    desviacion: float
    peso: float


class Perfil(BaseModel):
    nombre: str
    version: int
    tickets_base: float = Field(gt=0)  # comprobantes por día en una jornada «promedio» de enero de 2025
    factor_dia_semana: list[float] = Field(min_length=7, max_length=7)  # lunes … domingo
    factor_mes: list[float] = Field(min_length=12, max_length=12)  # enero … diciembre
    factor_dias_de_pago: float = 1.0  # los días 15, 16, 30, 31 y 1
    tendencia_anual: float = 0.0  # 0,08 = +8 % cada año
    factor_feriado: float = 1.0
    factor_evento: dict[str, float] = Field(default_factory=dict)  # por nombre (feriados.py)
    dias_cerrados: list[str] = Field(default_factory=list)  # «MM-DD»
    dispersion: float = Field(gt=0)  # forma de la gamma: a menor valor, más ruido entre días
    comensales: dict[int, float]  # personas por comprobante → peso
    prob_categoria: dict[str, float]  # prob. de que cada comensal pida algo de la categoría
    prob_categoria_defecto: float = 0.1
    factor_mes_categoria: dict[str, list[float]] = Field(default_factory=dict)  # estacionalidad por categoría
    popularidad: dict[UUID, float] = Field(default_factory=dict)  # peso de cada plato dentro de su categoría
    medios_pago: dict[str, float]
    tipos_comprobante: dict[str, float]
    franjas: list[Franja] = Field(min_length=1)
    promociones: list[PromocionPerfil] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validar(self) -> "Perfil":
        for categoria, factores in self.factor_mes_categoria.items():
            if len(factores) != 12:
                raise ValueError(f"factor_mes_categoria[{categoria}] debe tener 12 valores.")
        for dia in self.dias_cerrados:
            if not re.fullmatch(r"\d{2}-\d{2}", dia):
                raise ValueError(f"dias_cerrados: «{dia}» no tiene el formato MM-DD.")
        return self


def cargar_perfil(nombre: str) -> Perfil:
    if not re.fullmatch(r"[a-z0-9_]+", nombre):
        raise ValueError(f"Nombre de perfil no válido: {nombre!r}.")
    archivo = CARPETA_PERFILES / f"{nombre}.json"
    if not archivo.is_file():
        raise ValueError(f"No existe el perfil «{nombre}».")
    return Perfil.model_validate_json(archivo.read_text(encoding="utf-8"))
