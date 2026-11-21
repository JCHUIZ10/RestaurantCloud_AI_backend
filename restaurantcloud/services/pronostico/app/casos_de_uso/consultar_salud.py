"""Caso de uso: estado del servicio (GET /health)."""

from dataclasses import dataclass

from app.casos_de_uso.puertos import AlmacenArtefactos, SondaBd


@dataclass(frozen=True)
class Salud:
    bd: bool
    repositorio: bool

    @property
    def estado(self) -> str:
        """`ok`, o `degradado` si falta el repositorio: sin él se pronostica con el baseline."""
        return "ok" if self.repositorio else "degradado"


def consultar_salud(bd: SondaBd, almacen: AlmacenArtefactos) -> Salud:
    return Salud(bd=bd.responde(), repositorio=almacen.disponible())
