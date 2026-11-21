from datetime import date, datetime, timedelta, timezone

import pandas as pd
import pytest

from app.dominio.advertencias import advertencias
from app.dominio.calendario import construir_calendario
from app.dominio.errores import ErrorFechasInvalidas, ErrorValidacion
from app.dominio.periodo import Periodo, resolver_periodo

HOY = date(2026, 11, 20)


def _periodo(**cambios):
    datos = dict(jornada_actual=HOY, fecha_inicio=None, horizonte_dias=7, dias_cerrados=(), hoy=HOY, ventana_dias=365)
    datos.update(cambios)
    return resolver_periodo(**datos)


# --- Periodo ---


def test_por_defecto_se_pronostica_desde_manana_con_datos_hasta_ayer():
    p = _periodo()

    assert p.fecha_inicio == date(2026, 11, 21)
    assert p.fecha_fin == date(2026, 11, 27)
    assert p.datos_hasta == date(2026, 11, 19)
    assert p.datos_desde == date(2025, 11, 20)  # 365 días contando ambos extremos
    assert (p.datos_hasta - p.datos_desde).days + 1 == 365


def test_la_jornada_actual_puede_ser_ayer_si_el_local_cierra_pasada_la_medianoche():
    p = _periodo(jornada_actual=date(2026, 11, 19))

    assert p.datos_hasta == date(2026, 11, 18)
    assert p.fecha_inicio == date(2026, 11, 20)


@pytest.mark.parametrize("jornada", [date(2026, 11, 18), date(2026, 11, 21), date(2027, 1, 1)])
def test_una_jornada_actual_que_no_es_ayer_ni_hoy_se_rechaza(jornada):
    with pytest.raises(ErrorFechasInvalidas):
        _periodo(jornada_actual=jornada)


def test_se_puede_empezar_en_la_jornada_actual_pero_no_antes_ni_mas_tarde():
    assert _periodo(fecha_inicio=HOY).fecha_inicio == HOY
    for inicio in (date(2026, 11, 19), date(2026, 11, 22)):
        with pytest.raises(ErrorFechasInvalidas):
            _periodo(fecha_inicio=inicio)


def test_los_cierres_enviados_deben_caer_dentro_del_periodo():
    assert _periodo(dias_cerrados=(date(2026, 11, 21), date(2026, 11, 27))).fecha_fin == date(2026, 11, 27)

    with pytest.raises(ErrorValidacion) as error:
        _periodo(dias_cerrados=(date(2026, 11, 28), date(2026, 11, 20)))
    assert [c["motivo"] for c in error.value.detalles["campos"]] == [
        "2026-11-20 está fuera del periodo pronosticado",
        "2026-11-28 está fuera del periodo pronosticado",
    ]


def test_el_periodo_cabe_en_lo_que_acepta_rc_pronostico():
    # Con 7 días desde mañana el último día queda a 8 días de datos_hasta: el máximo del contrato (D-03).
    p = _periodo()

    assert (p.fecha_inicio - p.datos_hasta).days == 2
    assert (p.fecha_fin - p.datos_hasta).days == 8


# --- Calendario ---


def _historial(cerrados, desde=date(2025, 11, 20), hasta=date(2026, 11, 19)):
    fechas = pd.date_range(desde, hasta)
    filas = [("p", f, 0 if f.date() in cerrados else 10) for f in fechas]
    return pd.DataFrame(filas, columns=["producto_id", "fecha", "unidades"])


def test_los_cierres_son_la_union_de_los_detectados_y_los_enviados():
    periodo = _periodo()
    historial = _historial({date(2025, 12, 25), date(2026, 1, 1)})

    cal = construir_calendario(historial, [date(2026, 11, 25)], "PE", periodo)

    assert cal["dias_cerrados"] == ["2025-12-25", "2026-01-01", "2026-11-25"]


def test_un_cierre_futuro_repetido_no_se_duplica():
    cal = construir_calendario(_historial({date(2025, 12, 25)}), [date(2026, 11, 25), date(2026, 11, 25)], "PE", _periodo())

    assert cal["dias_cerrados"].count("2026-11-25") == 1


def test_los_feriados_salen_de_holidays_y_solo_del_rango_que_importa():
    cal = construir_calendario(_historial(set()), [], "PE", _periodo())

    assert "2025-12-25" in cal["feriados"]  # Navidad, dentro del historial
    assert "2026-07-28" in cal["feriados"]  # Fiestas Patrias
    assert "2025-11-01" not in cal["feriados"]  # antes de la ventana
    assert "2026-12-08" not in cal["feriados"]  # después del periodo
    assert cal["feriados"] == sorted(cal["feriados"])


def test_un_feriado_del_periodo_se_incluye_aunque_cruce_de_anio():
    periodo = _periodo(jornada_actual=date(2026, 12, 29), hoy=date(2026, 12, 29))

    cal = construir_calendario(_historial(set(), desde=periodo.datos_desde, hasta=periodo.datos_hasta), [], "PE", periodo)

    assert "2027-01-01" in cal["feriados"]


# --- Advertencias ---


def _utc(y, m, d, h=12):
    return datetime(y, m, d, h, tzinfo=timezone.utc)


def test_sin_ultima_venta_conocida_se_advierte():
    assert advertencias(None, date(2026, 11, 19), "America/Lima") == ["datos_desactualizados"]


def test_la_ultima_venta_reciente_no_advierte():
    assert advertencias(_utc(2026, 11, 18), date(2026, 11, 19), "America/Lima") == []
    # Justo en el límite: tres días antes de datos_hasta todavía se tolera.
    assert advertencias(_utc(2026, 11, 16), date(2026, 11, 19), "America/Lima") == []


def test_una_ultima_venta_de_hace_mas_de_tres_dias_advierte():
    assert advertencias(_utc(2026, 11, 15), date(2026, 11, 19), "America/Lima") == ["datos_desactualizados"]


def test_el_dia_de_la_ultima_venta_se_cuenta_en_la_zona_del_local():
    # 02:00 UTC del 17 es todavía el 16 en Lima (UTC-5): sigue dentro de la tolerancia.
    assert advertencias(_utc(2026, 11, 17, 2), date(2026, 11, 19), "America/Lima") == []
    assert advertencias(_utc(2026, 11, 16, 2), date(2026, 11, 20), "America/Lima") == ["datos_desactualizados"]


def test_una_ejecucion_sin_datos_no_advierte():
    assert advertencias(None, None, "America/Lima") == []
