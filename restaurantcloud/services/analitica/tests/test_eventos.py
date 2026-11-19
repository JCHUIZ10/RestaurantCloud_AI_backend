from decimal import Decimal

from sqlalchemy import text

from tests.ayudas import (
    LOCAL,
    OTRO_LOCAL,
    PRODUCTO_INCA,
    PRODUCTO_LOMO,
    datos_anulacion_comprobante,
    datos_pedido_anulado,
    datos_venta,
    enviar,
    item,
    nuevo_id,
    sobre,
)


def _uno(bd, consulta, **parametros):
    return bd.execute(text(consulta), parametros).one()


def _agregado(bd, producto_id=PRODUCTO_LOMO, local_id=LOCAL):
    fila = bd.execute(
        text(
            "SELECT COALESCE(sum(unidades), 0) AS unidades, COALESCE(sum(ingreso), 0) AS ingreso "
            "FROM venta_diaria_producto WHERE local_id = :l AND producto_id = :p"
        ),
        {"l": local_id, "p": producto_id},
    ).one()
    return fila.unidades, fila.ingreso


# ---------------------------------------------------------------- venta.registrada


def test_venta_nueva_se_acepta_y_alimenta_los_agregados(cliente, bd):
    datos = datos_venta()
    evento = sobre("venta.registrada", datos)

    respuesta = enviar(cliente, evento)

    assert respuesta.status_code == 202
    assert respuesta.json()["exito"] is True
    assert respuesta.json()["datos"]["estado"] == "aceptado"
    assert respuesta.json()["datos"]["evento_id"] == evento["id"]

    venta = _uno(bd, "SELECT * FROM venta WHERE comprobante_id = :c", c=datos["comprobante_id"])
    assert str(venta.local_id) == LOCAL
    assert venta.estado == "vigente"
    assert venta.total == Decimal("83.00")
    assert venta.mozo_nombre == "Lucía Paredes"

    assert _uno(bd, "SELECT count(*) AS n FROM venta_item WHERE comprobante_id = :c", c=datos["comprobante_id"]).n == 2
    assert _agregado(bd, PRODUCTO_LOMO) == (2, Decimal("76.00"))
    assert _agregado(bd, PRODUCTO_INCA) == (2, Decimal("7.00"))

    visto = _uno(bd, "SELECT * FROM producto_visto WHERE producto_id = :p", p=PRODUCTO_LOMO)
    assert visto.nombre == "Lomo saltado"
    assert str(visto.primera_venta) == "2026-11-16"
    assert _uno(bd, "SELECT count(*) AS n FROM evento_procesado").n == 1


def test_el_mismo_evento_dos_veces_responde_duplicado_y_no_cambia_nada(cliente, bd):
    evento = sobre("venta.registrada", datos_venta())

    primera = enviar(cliente, evento)
    segunda = enviar(cliente, evento)

    assert primera.status_code == 202
    assert segunda.status_code == 200
    assert segunda.json()["datos"]["estado"] == "duplicado"
    assert _agregado(bd) == (2, Decimal("76.00"))
    assert _uno(bd, "SELECT count(*) AS n FROM venta").n == 1


def test_otro_evento_con_el_mismo_comprobante_no_duplica_la_venta(cliente, bd):
    datos = datos_venta()

    enviar(cliente, sobre("venta.registrada", datos))
    respuesta = enviar(cliente, sobre("venta.registrada", datos))

    assert respuesta.status_code == 202
    assert _uno(bd, "SELECT count(*) AS n FROM venta").n == 1
    assert _uno(bd, "SELECT count(*) AS n FROM venta_item").n == 2
    assert _agregado(bd) == (2, Decimal("76.00"))


def test_ventas_del_mismo_dia_suman_en_la_serie(cliente, bd):
    enviar(cliente, sobre("venta.registrada", datos_venta()))
    enviar(cliente, sobre("venta.registrada", datos_venta()))

    assert _agregado(bd) == (4, Decimal("152.00"))


def test_un_producto_repetido_en_varias_lineas_se_suma(cliente, bd):
    datos = datos_venta(items=[item(cantidad=1), item(cantidad=3)])

    assert enviar(cliente, sobre("venta.registrada", datos)).status_code == 202

    assert _agregado(bd) == (4, Decimal("152.00"))
    assert _uno(bd, "SELECT count(*) AS n FROM venta_item").n == 2


def test_un_nombre_mas_antiguo_no_pisa_al_mas_reciente(cliente, bd):
    nueva = datos_venta(fecha_operativa="2026-11-16", items=[item(nombre="Lomo saltado premium")])
    antigua = datos_venta(fecha_operativa="2026-11-10", items=[item(nombre="Lomo saltado")])

    enviar(cliente, sobre("venta.registrada", nueva))
    enviar(cliente, sobre("venta.registrada", antigua))

    visto = _uno(bd, "SELECT * FROM producto_visto WHERE producto_id = :p", p=PRODUCTO_LOMO)
    assert visto.nombre == "Lomo saltado premium"
    assert str(visto.primera_venta) == "2026-11-10"
    assert str(visto.ultima_venta) == "2026-11-16"


def test_las_ventas_de_dos_locales_no_se_mezclan(cliente, bd):
    enviar(cliente, sobre("venta.registrada", datos_venta()))
    # Otro producto de otro local, para que la clave de producto_visto no choque.
    otro = datos_venta(items=[item(producto_id=nuevo_id(), cantidad=5)])
    enviar(cliente, sobre("venta.registrada", otro, local_id=OTRO_LOCAL))

    assert _agregado(bd, PRODUCTO_LOMO, LOCAL) == (2, Decimal("76.00"))
    assert _agregado(bd, PRODUCTO_LOMO, OTRO_LOCAL) == (0, 0)


# ---------------------------------------------------------------- comprobante.anulado


def test_anular_una_venta_la_marca_y_la_resta_de_la_serie(cliente, bd):
    datos = datos_venta()
    enviar(cliente, sobre("venta.registrada", datos))

    respuesta = enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(datos["comprobante_id"])))

    assert respuesta.status_code == 202
    venta = _uno(bd, "SELECT estado, anulada_en FROM venta WHERE comprobante_id = :c", c=datos["comprobante_id"])
    assert venta.estado == "anulada"
    assert venta.anulada_en is not None
    assert _agregado(bd, PRODUCTO_LOMO) == (0, Decimal("0.00"))
    assert _agregado(bd, PRODUCTO_INCA) == (0, Decimal("0.00"))


def test_anular_una_venta_solo_resta_esa_venta(cliente, bd):
    anulada = datos_venta()
    conservada = datos_venta()
    enviar(cliente, sobre("venta.registrada", anulada))
    enviar(cliente, sobre("venta.registrada", conservada))

    enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(anulada["comprobante_id"])))

    assert _agregado(bd, PRODUCTO_LOMO) == (2, Decimal("76.00"))


def test_anular_dos_veces_no_resta_dos_veces(cliente, bd):
    datos = datos_venta()
    enviar(cliente, sobre("venta.registrada", datos))
    enviar(cliente, sobre("venta.registrada", datos_venta()))

    enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(datos["comprobante_id"])))
    enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(datos["comprobante_id"])))

    assert _agregado(bd, PRODUCTO_LOMO) == (2, Decimal("76.00"))
    assert _uno(bd, "SELECT count(*) AS n FROM anulacion_pendiente").n == 0


def test_la_anulacion_de_otro_local_no_toca_la_venta(cliente, bd):
    datos = datos_venta()
    enviar(cliente, sobre("venta.registrada", datos))

    enviar(
        cliente,
        sobre("comprobante.anulado", datos_anulacion_comprobante(datos["comprobante_id"]), local_id=OTRO_LOCAL),
    )

    assert _uno(bd, "SELECT estado FROM venta WHERE comprobante_id = :c", c=datos["comprobante_id"]).estado == "vigente"
    assert _agregado(bd, PRODUCTO_LOMO) == (2, Decimal("76.00"))


def test_anulacion_antes_que_la_venta_queda_pendiente_y_se_aplica_al_llegar_la_venta(cliente, bd):
    datos = datos_venta()

    respuesta = enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(datos["comprobante_id"])))

    assert respuesta.status_code == 202
    assert _uno(bd, "SELECT count(*) AS n FROM anulacion_pendiente").n == 1

    enviar(cliente, sobre("venta.registrada", datos))

    venta = _uno(bd, "SELECT estado, anulada_en FROM venta WHERE comprobante_id = :c", c=datos["comprobante_id"])
    assert venta.estado == "anulada"
    assert venta.anulada_en is not None
    assert _uno(bd, "SELECT count(*) AS n FROM anulacion_pendiente").n == 0
    assert _agregado(bd, PRODUCTO_LOMO) == (0, 0)
    # El producto sí se vio: la serie arranca en su primera venta aunque esa venta se anulara.
    assert _uno(bd, "SELECT count(*) AS n FROM producto_visto").n == 2


# ---------------------------------------------------------------- pedido.anulado


def test_pedido_anulado_se_registra_sin_tocar_las_ventas(cliente, bd):
    enviar(cliente, sobre("venta.registrada", datos_venta()))
    datos = datos_pedido_anulado()

    respuesta = enviar(cliente, sobre("pedido.anulado", datos))

    assert respuesta.status_code == 202
    fila = _uno(bd, "SELECT * FROM anulacion WHERE anulacion_id = :a", a=datos["anulacion_id"])
    assert fila.tipo_anulacion == "item_individual"
    assert fila.monto_total == Decimal("38.00")
    assert fila.minutos_espera == 22
    assert str(fila.local_id) == LOCAL
    assert _agregado(bd, PRODUCTO_LOMO) == (2, Decimal("76.00"))


def test_pedido_anulado_de_una_comanda_vacia_acepta_los_campos_nulos(cliente, bd):
    datos = {
        **datos_pedido_anulado(),
        "pedido_item_id": None,
        "producto_id": None,
        "producto_nombre": None,
        "tipo_anulacion": "comanda_completa",
        "monto_total": 0.00,
    }

    assert enviar(cliente, sobre("pedido.anulado", datos)).status_code == 202
    assert _uno(bd, "SELECT count(*) AS n FROM anulacion").n == 1


def test_el_mismo_pedido_anulado_con_otro_evento_no_se_duplica(cliente, bd):
    datos = datos_pedido_anulado()

    enviar(cliente, sobre("pedido.anulado", datos))
    enviar(cliente, sobre("pedido.anulado", datos))

    assert _uno(bd, "SELECT count(*) AS n FROM anulacion").n == 1


# ---------------------------------------------------------------- tipos y validación


def test_un_tipo_que_el_servicio_no_usa_responde_200_ignorado_sin_guardar_nada(cliente, bd):
    respuesta = enviar(cliente, sobre("plato.listo", {"cualquier": "cosa"}))

    assert respuesta.status_code == 200
    assert respuesta.json()["datos"]["estado"] == "ignorado"
    assert _uno(bd, "SELECT count(*) AS n FROM evento_procesado").n == 0


def test_una_version_no_soportada_responde_422(cliente):
    respuesta = enviar(cliente, sobre("venta.registrada", datos_venta(), version=2))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_EVENTO_INVALIDO"


def test_datos_que_no_cumplen_el_contrato_responden_422_y_no_guardan_nada(cliente, bd):
    datos = datos_venta()
    datos["medio_pago"] = "trueque"

    respuesta = enviar(cliente, sobre("venta.registrada", datos))

    assert respuesta.status_code == 422
    error = respuesta.json()["errores"][0]
    assert error["codigo"] == "ERR_EVENTO_INVALIDO"
    assert any(c["campo"] == "medio_pago" for c in error["detalles"]["campos"])
    assert _uno(bd, "SELECT count(*) AS n FROM venta").n == 0
    assert _uno(bd, "SELECT count(*) AS n FROM evento_procesado").n == 0


def test_una_venta_sin_items_responde_422(cliente):
    assert enviar(cliente, sobre("venta.registrada", datos_venta(items=[]))).status_code == 422


def test_una_cantidad_cero_responde_422(cliente):
    assert enviar(cliente, sobre("venta.registrada", datos_venta(items=[item(cantidad=0)]))).status_code == 422


def test_un_sobre_incompleto_responde_422(cliente):
    evento = sobre("venta.registrada", datos_venta())
    del evento["empresa_id"]

    assert enviar(cliente, evento).status_code == 422


def test_un_cuerpo_que_no_es_json_responde_422(cliente):
    from tests.ayudas import cabeceras_firmadas

    cuerpo = b"esto no es json"
    respuesta = cliente.post("/interno/eventos", content=cuerpo, headers=cabeceras_firmadas(cuerpo))

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_EVENTO_INVALIDO"


def test_si_la_base_no_responde_devuelve_503_para_que_el_emisor_reintente(cliente, monkeypatch):
    from sqlalchemy.exc import OperationalError

    from app.api import eventos

    def sin_base(*args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    monkeypatch.setattr(eventos, "transaccion", sin_base)

    respuesta = enviar(cliente, sobre("venta.registrada", datos_venta()))

    assert respuesta.status_code == 503
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_BD_NO_DISPONIBLE"


def test_si_aplicar_el_evento_falla_no_queda_registrado_como_procesado(cliente, bd, monkeypatch):
    from app.dominio import procesador

    def fallar(*args, **kwargs):
        raise RuntimeError("fallo simulado a mitad del evento")

    monkeypatch.setattr(procesador.ventas, "insertar_items", fallar)
    evento = sobre("venta.registrada", datos_venta())

    # raise_server_exceptions=False no aplica a la fixture compartida: se comprueba la excepción.
    try:
        enviar(cliente, evento)
    except RuntimeError:
        pass

    assert _uno(bd, "SELECT count(*) AS n FROM venta").n == 0
    assert _uno(bd, "SELECT count(*) AS n FROM evento_procesado").n == 0
    monkeypatch.undo()
    assert enviar(cliente, evento).status_code == 202
