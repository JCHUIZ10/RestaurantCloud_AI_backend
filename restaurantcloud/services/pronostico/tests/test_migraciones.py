"""El esquema y, sobre todo, lo que la base hace cumplir: solo se agrega, nunca se modifica."""

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError, ProgrammingError

LOCAL = "00000000-0000-4000-8000-000000000010"
EMPRESA = "00000000-0000-4000-8000-000000000001"
PRODUCTO = "00000000-0000-4000-8000-000000000431"
SHA = "a" * 64


def _modelo(conexion, *, estado="vigente", local=LOCAL) -> str:
    id_ = str(uuid.uuid4())
    conexion.execute(
        text(
            """
            INSERT INTO modelo_version (id, empresa_id, local_id, algoritmo, version_variables, datos_desde,
                                        datos_hasta, ficha, artefacto_uri, artefacto_sha256, estado, publicado_en)
            VALUES (:id, :empresa, :local, 'hist_gradient_boosting', '1', '2024-11-18', '2026-11-17', '{}',
                    'file:///repositorio', :sha, :estado, now())
            """
        ),
        {"id": id_, "empresa": EMPRESA, "local": local, "sha": SHA, "estado": estado},
    )
    return id_


def _ejecucion(conexion, *, estado="completada", solicitud=None, modelo=None, horizonte=7) -> str:
    id_ = str(uuid.uuid4())
    conexion.execute(
        text(
            """
            INSERT INTO ejecucion (id, solicitud_id, empresa_id, local_id, solicitada_por, modelo_version_id,
                                   version_rc_pronostico, jornada_actual, fecha_inicio, horizonte_dias, estado)
            VALUES (:id, :solicitud, :empresa, :local, :usuario, :modelo, '0.1.0', '2026-11-20', '2026-11-21',
                    :horizonte, :estado)
            """
        ),
        {
            "id": id_, "solicitud": solicitud or str(uuid.uuid4()), "empresa": EMPRESA, "local": LOCAL,
            "usuario": str(uuid.uuid4()), "modelo": modelo, "horizonte": horizonte, "estado": estado,
        },
    )
    return id_


def _prediccion(conexion, ejecucion, *, p50=10, p90=14, metodo="modelo", motivo=None, fecha="2026-11-21") -> None:
    conexion.execute(
        text(
            """
            INSERT INTO prediccion (ejecucion_id, producto_id, fecha, producto_nombre, unidades_p50, unidades_p90,
                                    metodo, motivo)
            VALUES (:e, :p, :f, 'Ceviche Clásico', :p50, :p90, :metodo, :motivo)
            """
        ),
        {"e": ejecucion, "p": PRODUCTO, "f": fecha, "p50": p50, "p90": p90, "metodo": metodo, "motivo": motivo},
    )


def test_las_tres_tablas_existen_y_la_migracion_queda_en_la_ultima_version(bd):
    tablas = {f[0] for f in bd.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))}
    version = bd.execute(text("SELECT version_num FROM alembic_version")).scalar_one()

    assert {"modelo_version", "ejecucion", "prediccion"} <= tablas
    assert version == "0003"


# --- Reglas de integridad del esquema ---


def test_un_local_no_puede_tener_dos_modelos_vigentes(bd):
    _modelo(bd, estado="vigente")

    with pytest.raises(IntegrityError):
        _modelo(bd, estado="vigente")


def test_un_local_puede_tener_varios_modelos_retirados_y_uno_vigente(bd):
    _modelo(bd, estado="retirado")
    _modelo(bd, estado="retirado")
    _modelo(bd, estado="vigente")
    _modelo(bd, estado="vigente", local="00000000-0000-4000-8000-000000000011")  # otro local


def test_el_estado_de_un_modelo_es_vigente_o_retirado(bd):
    with pytest.raises(IntegrityError):
        _modelo(bd, estado="candidato")  # los candidatos no se registran: no llegan al servicio


def test_el_horizonte_va_de_1_a_7(bd):
    _ejecucion(bd, horizonte=1)
    _ejecucion(bd, horizonte=7)
    with pytest.raises(IntegrityError):
        _ejecucion(bd, horizonte=8)


def test_una_solicitud_no_puede_tener_dos_ejecuciones_completadas(bd):
    solicitud = str(uuid.uuid4())
    _ejecucion(bd, solicitud=solicitud, estado="completada")

    with pytest.raises(IntegrityError):
        _ejecucion(bd, solicitud=solicitud, estado="completada")


def test_una_solicitud_fallida_se_puede_reintentar_hasta_completarse(bd):
    solicitud = str(uuid.uuid4())
    _ejecucion(bd, solicitud=solicitud, estado="fallida")
    _ejecucion(bd, solicitud=solicitud, estado="fallida")
    _ejecucion(bd, solicitud=solicitud, estado="completada")


def test_una_ejecucion_sin_modelo_es_valida(bd):
    # Sin modelo vigente todo es baseline: modelo_version_id queda nulo.
    _ejecucion(bd, modelo=None)


@pytest.mark.parametrize(
    ("metodo", "motivo"),
    [
        ("modelo", None),
        ("cerrado", None),
        ("sin_historial", None),
        ("baseline", "historial_minimo"),
        ("baseline", "modelo_no_disponible"),
        ("baseline", "producto_no_visto"),
        ("baseline", "historial_reciente_insuficiente"),
    ],
)
def test_combinaciones_validas_de_metodo_y_motivo(bd, metodo, motivo):
    _prediccion(bd, _ejecucion(bd), metodo=metodo, motivo=motivo)


@pytest.mark.parametrize(
    ("metodo", "motivo"),
    [
        ("baseline", None),  # un baseline siempre dice por qué
        ("modelo", "producto_no_visto"),  # un motivo solo acompaña a un baseline
        ("cerrado", "historial_minimo"),
        ("baseline", "inventado"),
        ("ingenuo", None),
    ],
)
def test_combinaciones_invalidas_de_metodo_y_motivo(bd, metodo, motivo):
    with pytest.raises(IntegrityError):
        _prediccion(bd, _ejecucion(bd), metodo=metodo, motivo=motivo)


def test_p90_no_puede_ser_menor_que_p50(bd):
    ejecucion = _ejecucion(bd)
    _prediccion(bd, ejecucion, p50=5, p90=5, fecha="2026-11-21")  # igual está permitido

    with pytest.raises(IntegrityError):
        _prediccion(bd, ejecucion, p50=5, p90=4.99, fecha="2026-11-22")


def test_las_unidades_no_pueden_ser_negativas(bd):
    with pytest.raises(IntegrityError):
        _prediccion(bd, _ejecucion(bd), p50=-1, p90=3)


def test_una_prediccion_por_plato_y_dia_en_cada_ejecucion(bd):
    ejecucion = _ejecucion(bd)
    _prediccion(bd, ejecucion)

    with pytest.raises(IntegrityError):
        _prediccion(bd, ejecucion)


# --- Permisos del usuario de la aplicación (migración 0002) ---


def test_el_servicio_puede_guardar_una_ejecucion_con_sus_predicciones_y_leerlas(motor_app):
    with motor_app.begin() as conexion:
        ejecucion = _ejecucion(conexion)
        _prediccion(conexion, ejecucion)

    with motor_app.connect() as conexion:
        assert conexion.execute(text("SELECT count(*) FROM prediccion")).scalar_one() == 1


@pytest.mark.parametrize(
    "sentencia",
    [
        "UPDATE ejecucion SET estado = 'fallida'",
        "DELETE FROM ejecucion",
        "UPDATE prediccion SET unidades_p50 = 0",
        "DELETE FROM prediccion",
        "TRUNCATE prediccion",
        "DELETE FROM modelo_version",
        "UPDATE modelo_version SET artefacto_sha256 = 'x'",
        "UPDATE modelo_version SET metricas = '{}'",
    ],
)
def test_el_servicio_no_puede_modificar_ni_borrar_lo_ya_guardado(motor_app, bd, sentencia):
    ejecucion = _ejecucion(bd)
    _prediccion(bd, ejecucion)
    _modelo(bd)
    bd.commit()

    with pytest.raises(ProgrammingError) as error, motor_app.begin() as conexion:
        conexion.execute(text(sentencia))
    assert "permission denied" in str(error.value).lower() or "permiso denegado" in str(error.value).lower()


def test_el_servicio_solo_puede_cambiar_el_estado_de_un_modelo(motor_app, bd):
    modelo = _modelo(bd)
    bd.commit()

    with motor_app.begin() as conexion:
        conexion.execute(
            text("UPDATE modelo_version SET estado = 'retirado', retirado_en = now() WHERE id = :id"), {"id": modelo}
        )

    assert bd.execute(text("SELECT estado FROM modelo_version")).scalar_one() == "retirado"


def test_el_servicio_no_puede_crear_ni_borrar_tablas(motor_app):
    with pytest.raises(DBAPIError), motor_app.begin() as conexion:
        conexion.execute(text("CREATE TABLE intruso (id int)"))
    with pytest.raises(DBAPIError), motor_app.begin() as conexion:
        conexion.execute(text("DROP TABLE prediccion"))
