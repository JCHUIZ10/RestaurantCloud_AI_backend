"""Reglas de la serie de ventas diarias que consume ms-pronóstico."""

from datetime import date

MAX_DIAS_RANGO = 730


class RangoInvalido(Exception):
    pass


def validar_rango(desde: date, hasta: date) -> None:
    """`desde` no puede ser posterior a `hasta` y el rango (ambos días incluidos) no puede pasar de 730 días."""
    if desde > hasta:
        raise RangoInvalido("La fecha inicial es posterior a la final.")
    dias = (hasta - desde).days + 1
    if dias > MAX_DIAS_RANGO:
        raise RangoInvalido(f"El rango es de {dias} días y el máximo permitido es {MAX_DIAS_RANGO}.")
