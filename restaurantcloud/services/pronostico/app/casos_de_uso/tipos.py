"""Datos que viajan entre la API, los casos de uso y los puertos."""

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from rc_pronostico.artefacto import Artefacto


@dataclass(frozen=True)
class ParametrosPronostico:
    ventana_dias: int       # días de historial que se piden a ms-analítica
    pais_feriados: str      # país de `holidays`
    zona_horaria: str


@dataclass(frozen=True)
class ProductoPedido:
    producto_id: str
    nombre: str


@dataclass(frozen=True)
class SolicitudPronostico:
    solicitud_id: str
    empresa_id: str
    local_id: str
    solicitada_por: str
    jornada_actual: date
    fecha_inicio: date | None
    horizonte_dias: int
    productos: tuple[ProductoPedido, ...]
    dias_cerrados: tuple[date, ...] = ()


# --- Serie de ventas (lo que entrega FuenteSeries) ---


@dataclass
class ProductoSerie:
    producto_id: str
    filas: list[tuple[date, int]]  # (jornada, unidades netas)


@dataclass
class SerieVentas:
    productos: list[ProductoSerie]
    ultimo_evento_en: datetime | None  # informativo: no indica datos frescos (D-23)


# --- Modelo en uso ---


@dataclass
class ModeloEnUso:
    artefacto: Artefacto
    modelo_version_id: str


@dataclass(frozen=True)
class ModeloInfo:
    modelo_version: str
    algoritmo: str
    entrenado_hasta: date
    publicado_en: datetime


# --- Ejecuciones guardadas ---


@dataclass
class FilaPrediccion:
    producto_id: str
    nombre: str
    fecha: date
    p50: float
    p90: float
    metodo: str
    motivo: str | None


@dataclass
class NuevaEjecucion:
    id: str
    solicitud_id: str
    empresa_id: str
    local_id: str
    solicitada_por: str
    modelo_version_id: str | None
    version_rc_pronostico: str
    jornada_actual: date
    fecha_inicio: date
    horizonte_dias: int
    datos_desde: date | None
    datos_hasta: date | None
    huella_datos: str | None
    calendario: dict[str, Any]
    datos_actualizados_hasta: datetime | None
    estado: str  # completada | fallida
    error: str | None
    duracion_ms: int
    predicciones: list[FilaPrediccion] = field(default_factory=list)


@dataclass
class EjecucionGuardada:
    id: str
    solicitud_id: str
    empresa_id: str
    local_id: str
    solicitada_por: str
    fecha_inicio: date
    horizonte_dias: int
    datos_desde: date | None
    datos_hasta: date | None
    huella_datos: str | None
    calendario: dict[str, Any]
    datos_actualizados_hasta: datetime | None
    estado: str
    error: str | None
    duracion_ms: int | None
    creada_en: datetime
    modelo: ModeloInfo | None
    predicciones: list[FilaPrediccion]


@dataclass
class ResultadoPronostico:
    ejecucion: EjecucionGuardada
    advertencias: list[str]
    nueva: bool  # False si es la ejecución de un reintento con el mismo solicitud_id
