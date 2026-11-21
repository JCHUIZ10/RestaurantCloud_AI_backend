"""RegistroModelos sobre PostgreSQL. Lo único que modifica de lo ya guardado es `estado` y `retirado_en` (migración 0002)."""

import json

from sqlalchemy import Engine, text

from app.casos_de_uso.tipos import ModeloRegistrado

RETIRAR_OTROS = text(
    """
    UPDATE modelo_version SET estado = 'retirado', retirado_en = now()
    WHERE local_id = :local_id AND estado = 'vigente' AND id <> :id
    """
)

# Si la versión ya estaba registrada (el puntero volvió atrás), vuelve a vigente sin tocar nada más.
REGISTRAR = text(
    """
    INSERT INTO modelo_version (id, empresa_id, local_id, algoritmo, version_variables, datos_desde, datos_hasta,
                                metricas, ficha, artefacto_uri, artefacto_sha256, estado, publicado_en)
    VALUES (:id, :empresa_id, :local_id, :algoritmo, :version_variables, :datos_desde, :datos_hasta,
            CAST(:metricas AS jsonb), CAST(:ficha AS jsonb), :artefacto_uri, :artefacto_sha256, 'vigente', :publicado_en)
    ON CONFLICT (id) DO UPDATE SET estado = 'vigente', retirado_en = NULL
    """
)


class RegistroModelosSql:
    def __init__(self, engine: Engine):
        self._engine = engine

    def marcar_vigente(self, m: ModeloRegistrado) -> None:
        # Primero se retira al anterior: el índice único admite un solo vigente por local.
        with self._engine.begin() as conexion:
            conexion.execute(RETIRAR_OTROS, {"local_id": m.local_id, "id": m.id})
            conexion.execute(
                REGISTRAR,
                {
                    "id": m.id, "empresa_id": m.empresa_id, "local_id": m.local_id, "algoritmo": m.algoritmo,
                    "version_variables": m.version_variables, "datos_desde": m.datos_desde, "datos_hasta": m.datos_hasta,
                    "metricas": json.dumps(m.metricas), "ficha": json.dumps(m.ficha), "artefacto_uri": m.artefacto_uri,
                    "artefacto_sha256": m.artefacto_sha256, "publicado_en": m.publicado_en,
                },
            )

    def vigente(self, local_id: str) -> ModeloRegistrado | None:
        with self._engine.connect() as conexion:
            f = conexion.execute(
                text("SELECT * FROM modelo_version WHERE local_id = :local_id AND estado = 'vigente'"), {"local_id": local_id}
            ).mappings().first()
        if f is None:
            return None
        return ModeloRegistrado(
            id=str(f["id"]), empresa_id=str(f["empresa_id"]), local_id=str(f["local_id"]), algoritmo=f["algoritmo"],
            version_variables=f["version_variables"], datos_desde=f["datos_desde"], datos_hasta=f["datos_hasta"],
            metricas=f["metricas"], ficha=f["ficha"], artefacto_uri=f["artefacto_uri"],
            artefacto_sha256=f["artefacto_sha256"], publicado_en=f["publicado_en"],
        )
