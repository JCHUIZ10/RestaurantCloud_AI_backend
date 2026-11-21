"""RegistroEjecuciones sobre PostgreSQL. Solo inserta y lee: el usuario del servicio no puede hacer más (migración 0002)."""

import json

from sqlalchemy import Engine, text
from sqlalchemy.exc import IntegrityError

from app.casos_de_uso.puertos import SolicitudYaCompletada
from app.casos_de_uso.tipos import EjecucionGuardada, FilaPrediccion, ModeloInfo, NuevaEjecucion

INSERTAR_EJECUCION = text(
    """
    INSERT INTO ejecucion (id, solicitud_id, empresa_id, local_id, solicitada_por, modelo_version_id,
                           version_rc_pronostico, jornada_actual, fecha_inicio, horizonte_dias, datos_desde,
                           datos_hasta, huella_datos, calendario, datos_actualizados_hasta, estado, error,
                           duracion_ms)
    VALUES (:id, :solicitud_id, :empresa_id, :local_id, :solicitada_por, :modelo_version_id,
            :version_rc_pronostico, :jornada_actual, :fecha_inicio, :horizonte_dias, :datos_desde,
            :datos_hasta, :huella_datos, CAST(:calendario AS jsonb), :datos_actualizados_hasta, :estado, :error,
            :duracion_ms)
    """
)

# Una sola sentencia para todas las predicciones, en vez de una por fila: cada ida y vuelta a la base cuesta.
INSERTAR_PREDICCIONES = text(
    """
    INSERT INTO prediccion (ejecucion_id, producto_id, fecha, producto_nombre, unidades_p50, unidades_p90,
                            metodo, motivo)
    SELECT :ejecucion_id, p, f, n, a, b, m, v
    FROM unnest(CAST(:productos AS uuid[]), CAST(:fechas AS date[]), CAST(:nombres AS text[]),
                CAST(:p50 AS numeric[]), CAST(:p90 AS numeric[]), CAST(:metodos AS text[]),
                CAST(:motivos AS text[])) AS t(p, f, n, a, b, m, v)
    """
)

SELECCIONAR_EJECUCION = """
    SELECT e.*, m.algoritmo AS m_algoritmo, m.datos_hasta AS m_datos_hasta, m.publicado_en AS m_publicado_en
    FROM ejecucion e
    LEFT JOIN modelo_version m ON m.id = e.modelo_version_id
"""


class RegistroEjecucionesSql:
    def __init__(self, engine: Engine):
        self._engine = engine

    def guardar(self, e: NuevaEjecucion) -> None:
        with self._engine.begin() as conexion:
            try:
                conexion.execute(
                    INSERTAR_EJECUCION,
                    {**{c: getattr(e, c) for c in _COLUMNAS}, "calendario": json.dumps(e.calendario)},
                )
            except IntegrityError as error:
                if "uq_ejecucion_solicitud" in str(error.orig):
                    raise SolicitudYaCompletada(e.solicitud_id) from None
                raise
            if e.predicciones:
                conexion.execute(
                    INSERTAR_PREDICCIONES,
                    {
                        "ejecucion_id": e.id,
                        "productos": [p.producto_id for p in e.predicciones],
                        "fechas": [p.fecha for p in e.predicciones],
                        "nombres": [p.nombre for p in e.predicciones],
                        "p50": [p.p50 for p in e.predicciones],
                        "p90": [p.p90 for p in e.predicciones],
                        "metodos": [p.metodo for p in e.predicciones],
                        "motivos": [p.motivo for p in e.predicciones],
                    },
                )

    def buscar_completada(self, solicitud_id: str) -> EjecucionGuardada | None:
        return self._leer("WHERE e.solicitud_id = :solicitud_id AND e.estado = 'completada'", {"solicitud_id": solicitud_id})

    def obtener(self, ejecucion_id: str, empresa_id: str, local_id: str) -> EjecucionGuardada | None:
        return self._leer(
            "WHERE e.id = :id AND e.empresa_id = :empresa_id AND e.local_id = :local_id",
            {"id": ejecucion_id, "empresa_id": empresa_id, "local_id": local_id},
        )

    def _leer(self, filtro: str, parametros: dict) -> EjecucionGuardada | None:
        with self._engine.connect() as conexion:
            fila = conexion.execute(text(f"{SELECCIONAR_EJECUCION} {filtro}"), parametros).mappings().first()
            if fila is None:
                return None
            predicciones = conexion.execute(
                text(
                    """
                    SELECT producto_id, producto_nombre, fecha, unidades_p50, unidades_p90, metodo, motivo
                    FROM prediccion WHERE ejecucion_id = :id
                    ORDER BY producto_nombre, producto_id, fecha
                    """
                ),
                {"id": fila["id"]},
            ).all()
        modelo = None
        if fila["modelo_version_id"] is not None:
            modelo = ModeloInfo(str(fila["modelo_version_id"]), fila["m_algoritmo"], fila["m_datos_hasta"], fila["m_publicado_en"])
        return EjecucionGuardada(
            id=str(fila["id"]), solicitud_id=str(fila["solicitud_id"]), empresa_id=str(fila["empresa_id"]),
            local_id=str(fila["local_id"]), solicitada_por=str(fila["solicitada_por"]),
            fecha_inicio=fila["fecha_inicio"], horizonte_dias=fila["horizonte_dias"], datos_desde=fila["datos_desde"],
            datos_hasta=fila["datos_hasta"], huella_datos=fila["huella_datos"], calendario=fila["calendario"],
            datos_actualizados_hasta=fila["datos_actualizados_hasta"], estado=fila["estado"], error=fila["error"],
            duracion_ms=fila["duracion_ms"], creada_en=fila["creada_en"], modelo=modelo,
            predicciones=[
                FilaPrediccion(str(p[0]), p[1], p[2], float(p[3]), float(p[4]), p[5], p[6]) for p in predicciones
            ],
        )


_COLUMNAS = (
    "id", "solicitud_id", "empresa_id", "local_id", "solicitada_por", "modelo_version_id", "version_rc_pronostico",
    "jornada_actual", "fecha_inicio", "horizonte_dias", "datos_desde", "datos_hasta", "huella_datos",
    "datos_actualizados_hasta", "estado", "error", "duracion_ms",
)
