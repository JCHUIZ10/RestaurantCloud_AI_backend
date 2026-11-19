"""Calendario de Perú: feriados y fechas que mueven la demanda de un restaurante."""

from datetime import date, timedelta
from functools import lru_cache

# Feriados nacionales de fecha fija (mes, día).
_FIJOS = {
    (1, 1): "Año Nuevo",
    (5, 1): "Día del Trabajo",
    (6, 29): "San Pedro y San Pablo",
    (7, 28): "Fiestas Patrias",
    (7, 29): "Fiestas Patrias",
    (8, 6): "Batalla de Junín",
    (8, 30): "Santa Rosa de Lima",
    (10, 8): "Combate de Angamos",
    (11, 1): "Todos los Santos",
    (12, 8): "Inmaculada Concepción",
    (12, 9): "Batalla de Ayacucho",
    (12, 25): "Navidad",
}

# Fechas que no son feriado pero mueven la demanda; el perfil les da su propio factor por nombre.
NOCHEBUENA = "Nochebuena"
FIN_DE_ANIO = "Fin de Año"
SAN_VALENTIN = "San Valentín"
DIA_DE_LA_MADRE = "Día de la Madre"
DIA_DEL_PADRE = "Día del Padre"


def pascua(anio: int) -> date:
    """Domingo de Pascua (algoritmo gregoriano anónimo, de Meeus)."""
    a = anio % 19
    b, c = divmod(anio, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    ell = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * ell) // 451
    mes, dia = divmod(h + ell - 7 * m + 114, 31)
    return date(anio, mes, dia + 1)


def _enesimo_domingo(anio: int, mes: int, n: int) -> date:
    primero = date(anio, mes, 1)
    primer_domingo = primero + timedelta(days=(6 - primero.weekday()) % 7)
    return primer_domingo + timedelta(weeks=n - 1)


@lru_cache(maxsize=None)
def feriados_peru(anio: int) -> dict[date, str]:
    """Feriados nacionales del año, con su nombre."""
    feriados = {date(anio, mes, dia): nombre for (mes, dia), nombre in _FIJOS.items()}
    domingo_de_pascua = pascua(anio)
    feriados[domingo_de_pascua - timedelta(days=3)] = "Jueves Santo"
    feriados[domingo_de_pascua - timedelta(days=2)] = "Viernes Santo"
    return feriados


@lru_cache(maxsize=None)
def eventos_de_demanda(anio: int) -> dict[date, str]:
    """Fechas que no son feriado pero cambian cuánto se consume afuera."""
    return {
        date(anio, 2, 14): SAN_VALENTIN,
        _enesimo_domingo(anio, 5, 2): DIA_DE_LA_MADRE,
        _enesimo_domingo(anio, 6, 3): DIA_DEL_PADRE,
        date(anio, 12, 24): NOCHEBUENA,
        date(anio, 12, 31): FIN_DE_ANIO,
    }
