"""Reglas de los reportes de CU-ADMIN-13 (ficha de ms-analítica, sección 3).

Cálculos puros sobre lo que ya devolvió la base: periodo anterior, cocientes que pueden no tener
base, variaciones y la matriz de ingeniería de menú. No dependen de la base ni de HTTP.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from app.dominio.series import RangoInvalido

MAX_DIAS_REPORTE = 366
# Kasavana y Smith: un plato es popular si su parte de las unidades llega al 70 % de la parte media.
FACTOR_POPULARIDAD = Decimal("0.7")


def validar_rango_reporte(desde: date, hasta: date) -> None:
    """`desde` no puede ser posterior a `hasta`; el rango (ambos días incluidos) llega a 366 días."""
    if desde > hasta:
        raise RangoInvalido("La fecha inicial es posterior a la final.")
    dias = (hasta - desde).days + 1
    if dias > MAX_DIAS_REPORTE:
        raise RangoInvalido(f"El rango es de {dias} días y el máximo permitido es {MAX_DIAS_REPORTE}.")


def periodo_anterior(desde: date, hasta: date) -> tuple[date, date]:
    """El periodo de la misma duración que termina el día antes de `desde`."""
    dias = (hasta - desde).days + 1
    return desde - timedelta(days=dias), desde - timedelta(days=1)


def redondear(valor: Decimal | int | float | None, decimales: int = 2) -> float | None:
    """Redondeo comercial (mitad hacia arriba), como se lee un monto; None se conserva."""
    if valor is None:
        return None
    cuanto = Decimal(1).scaleb(-decimales)
    return float(Decimal(str(valor)).quantize(cuanto, rounding=ROUND_HALF_UP))


def dividir(numerador: Decimal | int | None, denominador: Decimal | int | None, decimales: int = 2) -> float | None:
    """Cociente redondeado, o None si no hay base (denominador nulo o cero): una métrica sin base no es 0."""
    if numerador is None or not denominador:
        return None
    return redondear(Decimal(numerador) / Decimal(denominador), decimales)


def porcentaje(parte: Decimal | int, total: Decimal | int, decimales: int = 1) -> float | None:
    if not total:
        return None
    return redondear(Decimal(parte) * 100 / Decimal(total), decimales)


def variacion_pct(actual: float | int | None, anterior: float | int | None) -> float | None:
    """Cambio porcentual frente al periodo anterior; None si el anterior es 0 o no existe."""
    if actual is None or not anterior:
        return None
    return redondear((Decimal(str(actual)) - Decimal(str(anterior))) * 100 / Decimal(str(anterior)), 1)


@dataclass
class PlatoParaMatriz:
    producto_id: str
    unidades: int
    margen: Decimal | None  # None si el plato no tiene costo completo en el periodo


@dataclass(frozen=True)
class Umbrales:
    popularidad_pct: Decimal
    margen_unitario: Decimal


def clasificar_menu(platos: list[PlatoParaMatriz]) -> tuple[Umbrales | None, dict[str, str]]:
    """Matriz de ingeniería de menú sobre los platos con costo (N).

    Popular: parte de las unidades ≥ 0,7 × 100 / N. Rentable: margen unitario ≥ margen medio
    ponderado (Σ margen / Σ unidades). Devuelve los umbrales y la clasificación por producto;
    los platos sin costo no se clasifican ni cuentan para los umbrales.
    """
    con_costo = [p for p in platos if p.margen is not None and p.unidades > 0]
    unidades_totales = sum(p.unidades for p in con_costo)
    if not con_costo or unidades_totales == 0:
        return None, {}

    umbral_popularidad = FACTOR_POPULARIDAD * 100 / len(con_costo)
    umbral_margen = sum((p.margen for p in con_costo), Decimal(0)) / unidades_totales

    clasificacion = {}
    for plato in con_costo:
        popular = Decimal(plato.unidades) * 100 / unidades_totales >= umbral_popularidad
        rentable = plato.margen / plato.unidades >= umbral_margen
        clasificacion[plato.producto_id] = {
            (True, True): "estrella",
            (True, False): "caballito",
            (False, True): "puzle",
            (False, False): "rezagado",
        }[(popular, rentable)]

    return Umbrales(umbral_popularidad, umbral_margen), clasificacion
