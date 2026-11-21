"""Reglas puras de los reportes (sin base de datos)."""

from datetime import date
from decimal import Decimal

import pytest

from app.dominio.reportes import (
    PlatoParaMatriz,
    clasificar_menu,
    dividir,
    periodo_anterior,
    validar_rango_reporte,
    variacion_pct,
)
from app.dominio.series import RangoInvalido


def test_la_matriz_de_menu_sigue_kasavana_y_smith():
    # N = 4 → popular si su parte llega a 0,7 × 25 % = 17,5 %. Margen medio = 1490 / 100 = 14,90.
    platos = [
        PlatoParaMatriz("A", 50, Decimal(1000)),  # 50 %, 20,00 por plato
        PlatoParaMatriz("B", 30, Decimal(150)),  # 30 %, 5,00
        PlatoParaMatriz("C", 10, Decimal(300)),  # 10 %, 30,00
        PlatoParaMatriz("D", 10, Decimal(40)),  # 10 %, 4,00
    ]

    umbrales, clasificacion = clasificar_menu(platos)

    assert umbrales.popularidad_pct == Decimal("17.5")
    assert umbrales.margen_unitario == Decimal("14.9")
    assert clasificacion == {"A": "estrella", "B": "caballito", "C": "puzle", "D": "rezagado"}


def test_los_platos_sin_costo_no_cuentan_para_la_matriz():
    platos = [PlatoParaMatriz("A", 60, Decimal(600)), PlatoParaMatriz("B", 40, Decimal(80)), PlatoParaMatriz("X", 500, None)]

    umbrales, clasificacion = clasificar_menu(platos)

    # N = 2 (X no cuenta): popular desde 35 %, margen medio 680 / 100 = 6,80.
    assert umbrales.popularidad_pct == Decimal(35)
    assert umbrales.margen_unitario == Decimal("6.8")
    assert clasificacion == {"A": "estrella", "B": "caballito"}


def test_en_el_umbral_exacto_el_plato_es_popular_y_rentable():
    # Dos platos con la misma parte (50 %) y el mismo margen: ambos están justo en los umbrales.
    _, clasificacion = clasificar_menu([PlatoParaMatriz("A", 10, Decimal(50)), PlatoParaMatriz("B", 10, Decimal(50))])

    assert clasificacion == {"A": "estrella", "B": "estrella"}


def test_sin_platos_con_costo_no_hay_umbrales():
    assert clasificar_menu([PlatoParaMatriz("X", 5, None)]) == (None, {})
    assert clasificar_menu([]) == (None, {})


def test_el_periodo_anterior_tiene_la_misma_duracion_y_termina_el_dia_antes():
    assert periodo_anterior(date(2026, 11, 1), date(2026, 11, 20)) == (date(2026, 10, 12), date(2026, 10, 31))
    assert periodo_anterior(date(2026, 3, 1), date(2026, 3, 1)) == (date(2026, 2, 28), date(2026, 2, 28))


def test_una_metrica_sin_base_es_none_y_no_cero():
    assert dividir(Decimal(100), 0) is None
    assert dividir(None, 5) is None
    assert dividir(Decimal("100.00"), 3) == 33.33
    assert dividir(Decimal("0.125"), 1) == 0.13  # mitad hacia arriba, como se lee un monto


def test_la_variacion_es_none_si_el_anterior_es_cero_o_no_existe():
    assert variacion_pct(110, 100) == 10.0
    assert variacion_pct(90, 100) == -10.0
    assert variacion_pct(10, 0) is None
    assert variacion_pct(10, None) is None
    assert variacion_pct(None, 10) is None


def test_el_rango_maximo_es_de_366_dias_contando_ambos_extremos():
    validar_rango_reporte(date(2026, 1, 1), date(2026, 12, 31))  # 365
    validar_rango_reporte(date(2024, 1, 1), date(2024, 12, 31))  # 366, año bisiesto
    with pytest.raises(RangoInvalido):
        validar_rango_reporte(date(2024, 1, 1), date(2025, 1, 1))  # 367
    with pytest.raises(RangoInvalido):
        validar_rango_reporte(date(2026, 1, 2), date(2026, 1, 1))
