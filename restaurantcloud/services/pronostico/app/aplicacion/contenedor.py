"""Los puertos que los casos de uso reciben, agrupados. Las pruebas arman uno con piezas falsas."""

from dataclasses import dataclass

from app.aplicacion.puertos import (
    AlmacenArtefactos,
    FuenteSeries,
    ModelosVigentes,
    RegistroEjecuciones,
    Reloj,
    SondaBd,
)
from app.aplicacion.tipos import ParametrosPronostico


@dataclass
class Contenedor:
    almacen: AlmacenArtefactos
    sonda_bd: SondaBd
    series: FuenteSeries
    registro: RegistroEjecuciones
    modelos: ModelosVigentes
    reloj: Reloj
    parametros: ParametrosPronostico
