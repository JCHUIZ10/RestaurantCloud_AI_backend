"""Los puertos que los casos de uso reciben, agrupados. Las pruebas arman uno con piezas falsas."""

from dataclasses import dataclass

from app.casos_de_uso.puertos import AlmacenArtefactos, SondaBd


@dataclass
class Contenedor:
    almacen: AlmacenArtefactos
    sonda_bd: SondaBd
