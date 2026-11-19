"""Una venta y su anulación pueden llegar casi a la vez (por ejemplo, al reanudarse un destino caído).

El servicio serializa los eventos de un mismo comprobante con un bloqueo de PostgreSQL. Estas pruebas
fuerzan la carrera: la venta queda a medias (sin confirmar) mientras llega su anulación.
"""

import threading
import time
from decimal import Decimal

from sqlalchemy import text

from app.datos import ventas
from app.datos.db import transaccion
from app.dominio.procesador import interpretar, procesar
from tests.ayudas import cuerpo_json, datos_anulacion_comprobante, datos_venta, sobre

DEMORA_DE_LA_VENTA = 0.6


def _aplicar(evento: dict) -> None:
    evento_sobre, datos = interpretar(cuerpo_json(evento))
    with transaccion() as conexion:
        procesar(conexion, evento_sobre, datos)


def _provocar_la_carrera(monkeypatch, con_bloqueo: bool) -> str:
    """Aplica una venta y su anulación en dos hilos. La venta se demora a mitad del proceso."""
    datos = datos_venta()
    comprobante_id = datos["comprobante_id"]
    venta = sobre("venta.registrada", datos)
    anulacion = sobre("comprobante.anulado", datos_anulacion_comprobante(comprobante_id))

    venta_en_curso = threading.Event()
    leer_pendiente = ventas.tomar_anulacion_pendiente

    def leer_pendiente_y_demorar(conexion, id_comprobante):
        pendiente = leer_pendiente(conexion, id_comprobante)  # la venta ya miró y no hay anulación
        venta_en_curso.set()
        time.sleep(DEMORA_DE_LA_VENTA)  # ...y sigue sin confirmarse mientras llega la anulación
        return pendiente

    monkeypatch.setattr(ventas, "tomar_anulacion_pendiente", leer_pendiente_y_demorar)
    if not con_bloqueo:
        monkeypatch.setattr(ventas, "bloquear_comprobante", lambda *args, **kwargs: None)

    errores: list[Exception] = []

    def correr(evento: dict) -> None:
        try:
            _aplicar(evento)
        except Exception as error:  # noqa: BLE001 - se reporta en la aserción
            errores.append(error)

    hilo_venta = threading.Thread(target=correr, args=(venta,))
    hilo_venta.start()
    assert venta_en_curso.wait(5), "La venta no llegó a la demora."
    hilo_anulacion = threading.Thread(target=correr, args=(anulacion,))
    hilo_anulacion.start()
    hilo_venta.join(15)
    hilo_anulacion.join(15)

    assert errores == []
    return comprobante_id


def _estado(bd, comprobante_id: str):
    estado = bd.execute(text("SELECT estado FROM venta WHERE comprobante_id = :c"), {"c": comprobante_id}).scalar_one()
    pendientes = bd.execute(text("SELECT count(*) FROM anulacion_pendiente")).scalar_one()
    unidades = bd.execute(text("SELECT COALESCE(sum(unidades), 0) FROM venta_diaria_producto")).scalar_one()
    return estado, pendientes, unidades


def test_una_venta_y_su_anulacion_simultaneas_quedan_consistentes(bd, monkeypatch):
    comprobante_id = _provocar_la_carrera(monkeypatch, con_bloqueo=True)

    estado, pendientes, unidades = _estado(bd, comprobante_id)

    assert estado == "anulada"
    assert pendientes == 0
    assert unidades == Decimal(0)


def test_sin_el_bloqueo_la_misma_carrera_deja_datos_inconsistentes(bd, monkeypatch):
    """Control negativo: demuestra que la carrera de arriba es real y que el bloqueo es lo que la evita."""
    comprobante_id = _provocar_la_carrera(monkeypatch, con_bloqueo=False)

    estado, pendientes, unidades = _estado(bd, comprobante_id)

    assert (estado, pendientes) == ("vigente", 1), "La venta quedó vigente y su anulación pendiente para siempre."
    assert unidades > 0
