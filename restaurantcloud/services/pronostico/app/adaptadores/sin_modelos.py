"""ModelosVigentes mientras no se cargue ningún modelo: todo se pronostica con el baseline.

Lo reemplaza `ProveedorModelos` en la etapa 5B.3.
"""

from app.casos_de_uso.tipos import ModeloEnUso


class SinModelos:
    def obtener(self, empresa_id: str, local_id: str) -> ModeloEnUso | None:
        return None
