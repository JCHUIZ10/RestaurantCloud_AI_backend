import pandas as pd
import pytest

from rc_pronostico.contrato import ErrorContrato, validar_historial, validar_peticion


def historial(dias=10, productos=("a", "b")):
    fechas = pd.date_range("2024-01-01", periods=dias)
    return pd.DataFrame(
        [(p, f, 3) for p in productos for f in fechas],
        columns=["producto_id", "fecha", "unidades"],
    )


def test_historial_valido():
    h = validar_historial(historial())
    assert len(h) == 20 and h["unidades"].dtype == "int64"


@pytest.mark.parametrize(
    "mutar",
    [
        lambda h: h.drop(columns=["unidades"]),
        lambda h: h.iloc[0:0],
        lambda h: h.assign(unidades=-1),
        lambda h: h.assign(unidades=1.5),
        lambda h: h.assign(unidades=None),
        lambda h: pd.concat([h, h.iloc[:1]]),  # duplicado
        lambda h: h.drop(index=5),  # hueco
        lambda h: h[~((h.producto_id == "b") & (h.fecha == h.fecha.max()))],  # termina antes
    ],
)
def test_historial_invalido(mutar):
    with pytest.raises(ErrorContrato):
        validar_historial(mutar(historial()))


def test_historial_no_puede_incluir_hoy():
    h = historial()
    ultimo = h.fecha.max()
    validar_historial(h, hoy=ultimo + pd.Timedelta(days=1))  # termina ayer: ok
    with pytest.raises(ErrorContrato):
        validar_historial(h, hoy=ultimo)  # incluye hoy
    with pytest.raises(ErrorContrato):
        validar_historial(h, hoy=ultimo - pd.Timedelta(days=3))  # incluye el futuro


def test_peticion_valida():
    p = validar_peticion(
        {"fecha_inicio": "2024-01-12", "horizonte_dias": 7, "productos": ["a"]}, "2024-01-10"
    )
    assert p["horizonte_dias"] == 7


@pytest.mark.parametrize(
    "peticion",
    [
        {"fecha_inicio": "2024-01-11", "horizonte_dias": 0, "productos": ["a"]},
        {"fecha_inicio": "2024-01-11", "horizonte_dias": 8, "productos": ["a"]},
        {"fecha_inicio": "2024-01-11", "horizonte_dias": 1, "productos": []},
        {"fecha_inicio": "2024-01-11", "horizonte_dias": 1, "productos": ["a", "a"]},
        {"fecha_inicio": "2024-01-10", "horizonte_dias": 1, "productos": ["a"]},  # no es futuro
        {"fecha_inicio": "2024-01-13", "horizonte_dias": 1, "productos": ["a"]},  # inicio a 3 d
        {"fecha_inicio": "2024-01-12", "horizonte_dias": 7, "productos": ["a"]},  # fin a 8 d: ok
        {"fecha_inicio": "2024-01-12", "horizonte_dias": 8, "productos": ["a"]},
        {"horizonte_dias": 1, "productos": ["a"]},
    ],
)
def test_peticion_invalida(peticion):
    if peticion.get("fecha_inicio") == "2024-01-12" and peticion["horizonte_dias"] == 7:
        validar_peticion(peticion, "2024-01-10")  # límite exacto permitido
        return
    with pytest.raises(ErrorContrato):
        validar_peticion(peticion, "2024-01-10")
