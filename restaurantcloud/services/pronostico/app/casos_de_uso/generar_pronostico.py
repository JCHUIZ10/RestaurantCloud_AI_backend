"""Caso de uso: pronosticar los platos pedidos de un local y guardar la ejecución (ficha, POST /interno/pronosticos)."""

import logging
import time
from importlib.metadata import version

import pandas as pd
from rc_pronostico.artefacto import uuid_v7
from rc_pronostico.contrato import ErrorContrato, validar_historial
from rc_pronostico.pronosticar import pronosticar

from app.casos_de_uso.puertos import (
    FuenteNoDisponible,
    FuenteSeries,
    ModelosVigentes,
    RegistroEjecuciones,
    Reloj,
    RespuestaInvalida,
    SolicitudYaCompletada,
)
from app.casos_de_uso.tipos import (
    FilaPrediccion,
    NuevaEjecucion,
    ParametrosPronostico,
    ResultadoPronostico,
    SerieVentas,
    SolicitudPronostico,
)
from app.dominio.advertencias import advertencias
from app.dominio.calendario import construir_calendario
from app.dominio.errores import (
    ErrorAnaliticaNoDisponible,
    ErrorCasoDeUso,
    ErrorSerieInvalida,
    ErrorValidacion,
)
from app.dominio.periodo import Periodo, resolver_periodo

logger = logging.getLogger(__name__)

ERR_ANALITICA = "ERR_ANALITICA_NO_DISPONIBLE"
ERR_SERIE = "ERR_SERIE_INVALIDA"


def _historial(serie: SerieVentas) -> pd.DataFrame:
    filas = [(p.producto_id, fecha, unidades) for p in serie.productos for fecha, unidades in p.filas]
    return pd.DataFrame(filas, columns=["producto_id", "fecha", "unidades"])


def _sin_historial(solicitud: SolicitudPronostico, periodo: Periodo) -> list[FilaPrediccion]:
    dias = pd.date_range(periodo.fecha_inicio, periodo.fecha_fin, freq="D")
    return [
        FilaPrediccion(p.producto_id, p.nombre, d.date(), 0.0, 0.0, "sin_historial", None)
        for p in solicitud.productos
        for d in dias
    ]


def generar_pronostico(
    solicitud: SolicitudPronostico,
    *,
    series: FuenteSeries,
    registro: RegistroEjecuciones,
    modelos: ModelosVigentes,
    reloj: Reloj,
    parametros: ParametrosPronostico,
) -> ResultadoPronostico:
    """Pasos de la ficha: reintento, fechas, serie, calendario, modelo, predicción y guardado."""
    previa = registro.buscar_completada(solicitud.solicitud_id)
    if previa is not None:
        if (previa.empresa_id, previa.local_id) != (solicitud.empresa_id, solicitud.local_id):
            raise ErrorValidacion([{"campo": "solicitud_id", "motivo": "ya fue usado por otra solicitud"}])
        return _resultado(previa, parametros, nueva=False)

    periodo = resolver_periodo(
        jornada_actual=solicitud.jornada_actual,
        fecha_inicio=solicitud.fecha_inicio,
        horizonte_dias=solicitud.horizonte_dias,
        dias_cerrados=solicitud.dias_cerrados,
        hoy=reloj.hoy(),
        ventana_dias=parametros.ventana_dias,
    )
    inicio = time.perf_counter()
    ejecucion_id = uuid_v7()

    def base(**campos) -> NuevaEjecucion:
        valores = dict(
            id=ejecucion_id, solicitud_id=solicitud.solicitud_id, empresa_id=solicitud.empresa_id,
            local_id=solicitud.local_id, solicitada_por=solicitud.solicitada_por, modelo_version_id=None,
            version_rc_pronostico=version("rc-pronostico"), jornada_actual=periodo.jornada_actual,
            fecha_inicio=periodo.fecha_inicio, horizonte_dias=solicitud.horizonte_dias, datos_desde=None,
            datos_hasta=None, huella_datos=None, calendario={}, datos_actualizados_hasta=None,
            estado="completada", error=None, duracion_ms=round((time.perf_counter() - inicio) * 1000),
        )
        valores.update(campos)
        return NuevaEjecucion(**valores)

    def fallar(codigo: str, error: ErrorCasoDeUso):
        # La ejecución fallida también se guarda: permite saber cuántas veces no hubo pronóstico y por qué.
        registro.guardar(base(estado="fallida", error=codigo))
        error.ejecucion_id = ejecucion_id
        logger.warning("Pronóstico fallido (%s): %s", codigo, error.mensaje)
        raise error

    try:
        serie = series.ventas_diarias(solicitud.empresa_id, solicitud.local_id, periodo.datos_desde, periodo.datos_hasta)
    except FuenteNoDisponible as e:
        fallar(ERR_ANALITICA, ErrorAnaliticaNoDisponible(f"ms-analítica no está disponible: {e}"))
    except RespuestaInvalida as e:
        fallar(ERR_SERIE, ErrorSerieInvalida(f"ms-analítica respondió algo inesperado: {e}"))

    ventas = sum(u for p in serie.productos for _, u in p.filas)
    if ventas == 0:
        # Sin ventas en toda la ventana no hay nada que calcular: todos los platos van como `sin_historial`.
        predicciones, modelo, datos = _sin_historial(solicitud, periodo), None, {}
    else:
        try:
            predicciones, modelo, datos = _pronosticar(solicitud, serie, periodo, modelos, parametros)
        except ErrorContrato as e:
            fallar(ERR_SERIE, ErrorSerieInvalida(str(e)))

    nueva = base(
        modelo_version_id=modelo.modelo_version_id if modelo else None,
        datos_desde=periodo.datos_desde, datos_hasta=periodo.datos_hasta,
        datos_actualizados_hasta=serie.ultimo_evento_en, predicciones=predicciones, **datos,
    )
    try:
        registro.guardar(nueva)
    except SolicitudYaCompletada:
        # Otro reintento con el mismo solicitud_id terminó primero: se devuelve esa ejecución.
        return _resultado(registro.buscar_completada(solicitud.solicitud_id), parametros, nueva=False)
    return _resultado(registro.obtener(ejecucion_id, solicitud.empresa_id, solicitud.local_id), parametros, nueva=True)


def _pronosticar(solicitud, serie: SerieVentas, periodo: Periodo, modelos: ModelosVigentes, parametros):
    historial = validar_historial(_historial(serie), hoy=periodo.jornada_actual)
    if historial["fecha"].min() < pd.Timestamp(periodo.datos_desde) or historial["fecha"].max() != pd.Timestamp(periodo.datos_hasta):
        raise ErrorContrato(
            f"La serie va de {historial['fecha'].min().date()} a {historial['fecha'].max().date()} y se pidió "
            f"de {periodo.datos_desde} a {periodo.datos_hasta}"
        )

    calendario = construir_calendario(historial, solicitud.dias_cerrados, parametros.pais_feriados, periodo)
    modelo = modelos.obtener(solicitud.empresa_id, solicitud.local_id)
    peticion = {
        "fecha_inicio": periodo.fecha_inicio,
        "horizonte_dias": solicitud.horizonte_dias,
        "productos": [p.producto_id for p in solicitud.productos],
    }
    resultado = pronosticar(
        historial, calendario, peticion, modelo.artefacto if modelo else None, hoy=periodo.jornada_actual
    )

    nombres = {p.producto_id: p.nombre for p in solicitud.productos}
    predicciones = [
        FilaPrediccion(
            f.producto_id, nombres[f.producto_id], f.fecha.date(), float(f.p50), float(f.p90), f.metodo,
            None if pd.isna(f.motivo) else f.motivo,
        )
        for f in resultado.predicciones.itertuples()
    ]
    return predicciones, modelo, {"huella_datos": resultado.huella_datos, "calendario": calendario}


def _resultado(ejecucion, parametros: ParametrosPronostico, *, nueva: bool) -> ResultadoPronostico:
    return ResultadoPronostico(
        ejecucion,
        advertencias(ejecucion.datos_actualizados_hasta, ejecucion.datos_hasta, parametros.zona_horaria),
        nueva,
    )
