"""Qué días se pronostican y qué días de historial se piden (D-03, ficha sección 3)."""

from dataclasses import dataclass
from datetime import date, timedelta

from app.dominio.errores import ErrorFechasInvalidas, ErrorValidacion

UN_DIA = timedelta(days=1)


@dataclass(frozen=True)
class Periodo:
    jornada_actual: date
    fecha_inicio: date   # primer día pronosticado
    fecha_fin: date      # último día pronosticado
    datos_desde: date    # primer día de historial que se pide
    datos_hasta: date    # último día completo: la jornada anterior a la actual


def resolver_periodo(
    *,
    jornada_actual: date,
    fecha_inicio: date | None,
    horizonte_dias: int,
    dias_cerrados: list[date] | tuple[date, ...],
    hoy: date,
    ventana_dias: int,
) -> Periodo:
    """Valida las fechas de la solicitud contra el reloj del servicio y calcula el periodo.

    - `jornada_actual` es la jornada operativa en curso según el núcleo: ayer u hoy según el reloj.
      Si viniera de otro día, el historial se pediría con un corte equivocado.
    - Se pronostica desde mañana por defecto; solo se acepta empezar en `jornada_actual` o un día después.
    - Los cierres enviados deben caer dentro del periodo pronosticado.
    """
    if jornada_actual not in (hoy - UN_DIA, hoy):
        raise ErrorFechasInvalidas(
            "`jornada_actual` debe ser ayer u hoy según el reloj del servicio.",
            {"jornada_actual": jornada_actual.isoformat(), "hoy": hoy.isoformat()},
        )
    inicio = fecha_inicio or jornada_actual + UN_DIA
    if inicio not in (jornada_actual, jornada_actual + UN_DIA):
        raise ErrorFechasInvalidas(
            "`fecha_inicio` debe ser la jornada actual o el día siguiente.",
            {"fecha_inicio": inicio.isoformat(), "jornada_actual": jornada_actual.isoformat()},
        )
    fin = inicio + timedelta(days=horizonte_dias - 1)

    fuera = sorted({d for d in dias_cerrados if not inicio <= d <= fin})
    if fuera:
        raise ErrorValidacion(
            [{"campo": "dias_cerrados", "motivo": f"{d.isoformat()} está fuera del periodo pronosticado"} for d in fuera]
        )

    datos_hasta = jornada_actual - UN_DIA
    return Periodo(jornada_actual, inicio, fin, datos_hasta - timedelta(days=ventana_dias - 1), datos_hasta)
