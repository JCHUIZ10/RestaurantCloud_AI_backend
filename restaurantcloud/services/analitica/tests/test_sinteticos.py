"""Generador de ventas sintéticas: calendario, reglas de demanda y forma de cada venta."""

from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

import pytest

from app.dominio.eventos import VentaRegistrada
from app.sinteticos.carta import Carta
from app.sinteticos.feriados import eventos_de_demanda, feriados_peru, pascua
from app.sinteticos.generador import demanda_esperada, generar, generar_dia, tickets_esperados
from app.sinteticos.perfil import cargar_perfil

EMPRESA = "00000000-0000-4000-8000-000000000001"
LOCAL = "00000000-0000-4000-8000-000000000010"
PROMO = "00000000-0000-4000-8000-000000000441"


def _producto(numero: int, nombre: str, categoria: int, categoria_nombre: str, precio: str) -> dict:
    return {
        "producto_id": f"00000000-0000-4000-8000-0000000004{numero}",
        "nombre": nombre,
        "categoria_id": f"00000000-0000-4000-8000-0000000004{categoria:02d}",
        "categoria_nombre": categoria_nombre,
        "precio": precio,
        "costo_estandar": "10.00",
    }


@pytest.fixture(scope="module")
def perfil():
    return cargar_perfil("aurea_v1")


@pytest.fixture(scope="module")
def carta():
    return Carta.model_validate(
        {
            "empresa_id": EMPRESA,
            "local_id": LOCAL,
            "productos": [
                _producto(31, "Ceviche Clásico", 1, "Entradas", "38.00"),
                _producto(32, "Lomo Saltado Criollo", 2, "Fondos", "42.00"),
                _producto(33, "Inca Kola 500ml", 3, "Bebidas", "9.00"),
                _producto(34, "Suspiro Limeño", 4, "Postres", "18.00"),
                _producto(35, "Causa Limeña de Pollo", 1, "Entradas", "24.00"),
            ],
            "mozos": [
                {"id": "00000000-0000-4000-8000-000000000103", "nombre": "Carlos Huamán"},
                {"id": "00000000-0000-4000-8000-000000000106", "nombre": "Mozo Dos"},
            ],
            "promociones": [
                {
                    "id": PROMO,
                    "tipo_descuento": "porcentaje",
                    "valor": "15.00",
                    "dias_semana": [1, 2, 3, 4, 5],
                    "hora_inicio": "12:00:00",
                    "hora_fin": "16:00:00",
                    "monto_minimo_consumo": "50.00",
                }
            ],
        }
    )


# ---------- calendario ----------


@pytest.mark.parametrize(
    ("anio", "esperada"),
    [(2024, date(2024, 3, 31)), (2025, date(2025, 4, 20)), (2026, date(2026, 4, 5)), (2027, date(2027, 3, 28))],
)
def test_pascua(anio, esperada):
    assert pascua(anio) == esperada


def test_semana_santa_y_feriados_fijos():
    feriados = feriados_peru(2026)
    assert feriados[date(2026, 4, 2)] == "Jueves Santo"
    assert feriados[date(2026, 4, 3)] == "Viernes Santo"
    assert date(2026, 7, 28) in feriados and date(2026, 12, 25) in feriados


def test_dia_de_la_madre_y_del_padre():
    assert eventos_de_demanda(2026)[date(2026, 5, 10)] == "Día de la Madre"
    assert eventos_de_demanda(2025)[date(2025, 5, 11)] == "Día de la Madre"
    assert eventos_de_demanda(2026)[date(2026, 6, 21)] == "Día del Padre"


# ---------- reglas de demanda (intensidad esperada, sin ruido) ----------


def test_el_sabado_supera_al_lunes(perfil, carta):
    lunes, sabado = date(2026, 3, 9), date(2026, 3, 14)
    assert tickets_esperados(perfil, carta, sabado) > 1.5 * tickets_esperados(perfil, carta, lunes)


def test_un_evento_mueve_la_demanda_de_su_domingo(perfil, carta):
    madre, domingo_comun = date(2026, 5, 10), date(2026, 5, 17)
    assert tickets_esperados(perfil, carta, madre) > 1.4 * tickets_esperados(perfil, carta, domingo_comun)


def test_la_demanda_crece_con_la_tendencia(perfil, carta):
    antes, despues = date(2025, 3, 11), date(2026, 3, 10)  # ambos martes
    assert tickets_esperados(perfil, carta, despues) == pytest.approx(
        tickets_esperados(perfil, carta, antes) * 1.08, rel=0.01
    )


def test_los_dias_cerrados_no_venden(perfil, carta):
    assert tickets_esperados(perfil, carta, date(2026, 12, 25)) == 0
    assert generar_dia(perfil, carta, date(2026, 12, 25), semilla=1).ventas == []


def test_la_campana_de_promocion_sube_los_dias_elegibles(perfil, carta):
    en_campana, fuera = date(2026, 2, 10), date(2026, 3, 10)  # martes, y febrero es de verano
    sin_promocion = Carta.model_validate({**carta.model_dump(mode="json"), "promociones": []})
    assert tickets_esperados(perfil, carta, en_campana) == pytest.approx(
        tickets_esperados(perfil, sin_promocion, en_campana) * 1.12
    )
    assert tickets_esperados(perfil, carta, fuera) == tickets_esperados(perfil, sin_promocion, fuera)


def test_la_demanda_esperada_reparte_por_popularidad(perfil, carta):
    esperada = demanda_esperada(perfil, carta, date(2026, 3, 14))
    ceviche = UUID("00000000-0000-4000-8000-000000000431")
    causa = UUID("00000000-0000-4000-8000-000000000435")
    assert esperada[ceviche] > esperada[causa] > 0  # ambos son entradas; el ceviche pesa 4,0 contra 1,5


# ---------- ventas sorteadas ----------


def test_misma_semilla_mismo_resultado_y_otra_semilla_otro(perfil, carta):
    def resumen(semilla):
        return [(v.comprobante_id, v.total) for d in generar(perfil, carta, date(2026, 3, 1), date(2026, 3, 14), semilla) for v in d.ventas]

    assert resumen(7) == resumen(7)
    assert resumen(7) != resumen(8)


def test_un_rango_en_partes_da_lo_mismo_que_completo(perfil, carta):
    completo = [d.fecha for d in generar(perfil, carta, date(2026, 3, 1), date(2026, 3, 10), 3)]
    partes = [d.fecha for d in generar(perfil, carta, date(2026, 3, 1), date(2026, 3, 4), 3)] + [
        d.fecha for d in generar(perfil, carta, date(2026, 3, 5), date(2026, 3, 10), 3)
    ]
    assert completo == partes
    unico = generar_dia(perfil, carta, date(2026, 3, 7), 3)
    assert [v.comprobante_id for v in unico.ventas] == [
        v.comprobante_id for d in generar(perfil, carta, date(2026, 3, 1), date(2026, 3, 10), 3) if d.fecha == date(2026, 3, 7) for v in d.ventas
    ]


def test_el_sabado_vende_mas_que_el_lunes_en_la_muestra(perfil, carta):
    dias = list(generar(perfil, carta, date(2026, 1, 5), date(2026, 3, 29), semilla=11))
    promedio = lambda dia: sum(len(d.ventas) for d in dias if d.fecha.weekday() == dia) / sum(1 for d in dias if d.fecha.weekday() == dia)  # noqa: E731
    assert promedio(5) > 1.4 * promedio(0)


def test_cada_venta_es_valida_y_cuadra(perfil, carta):
    ventas = [v for d in generar(perfil, carta, date(2026, 2, 1), date(2026, 2, 28), semilla=5) for v in d.ventas]
    assert ventas
    for venta in ventas:
        VentaRegistrada.model_validate(venta.model_dump(mode="json"))  # lo mismo que valida el servicio con un evento
        assert venta.subtotal_consumo == sum(i.subtotal for i in venta.items)
        assert venta.total == venta.subtotal_consumo - venta.descuento
        assert all(i.subtotal == i.precio_unitario * i.cantidad for i in venta.items)
        assert venta.fecha.date() == venta.fecha_operativa
        assert 12 <= venta.fecha.hour <= 22


def test_los_ids_no_se_repiten(perfil, carta):
    ids = [v.comprobante_id for d in generar(perfil, carta, date(2026, 2, 1), date(2026, 2, 28), 5) for v in d.ventas]
    assert len(ids) == len(set(ids))


def test_la_promocion_solo_se_aplica_dentro_de_sus_reglas(perfil, carta):
    ventas = [v for d in generar(perfil, carta, date(2026, 2, 1), date(2026, 2, 28), semilla=5) for v in d.ventas]
    con_promocion = [v for v in ventas if v.promocion_id is not None]
    assert con_promocion
    for venta in con_promocion:
        assert str(venta.promocion_id) == PROMO
        assert venta.fecha.isoweekday() <= 5
        assert 12 <= venta.fecha.hour < 16
        assert venta.subtotal_consumo >= Decimal("50.00")
        assert venta.descuento == (venta.subtotal_consumo * Decimal("0.15")).quantize(Decimal("0.01"))
    assert all(v.descuento == 0 for v in ventas if v.promocion_id is None)


def test_rango_invertido(perfil, carta):
    with pytest.raises(ValueError):
        list(generar(perfil, carta, date(2026, 3, 2), date(2026, 3, 1), 1))


def test_perfil_inexistente_o_con_ruta():
    with pytest.raises(ValueError):
        cargar_perfil("no_existe")
    with pytest.raises(ValueError):
        cargar_perfil("../perfil")


def test_el_volumen_de_24_meses_es_razonable(perfil, carta):
    hasta = date(2026, 11, 17)
    total = sum(len(d.ventas) for d in generar(perfil, carta, hasta - timedelta(days=730), hasta, semilla=2026))
    assert 25_000 < total < 80_000
