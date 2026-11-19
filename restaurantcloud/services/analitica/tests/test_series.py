import time
from urllib.parse import urlencode

from tests.ayudas import (
    EMPRESA,
    LOCAL,
    OTRO_LOCAL,
    PRODUCTO_INCA,
    PRODUCTO_LOMO,
    cabeceras_firmadas,
    consultar_serie,
    datos_anulacion_comprobante,
    datos_venta,
    enviar,
    item,
    nuevo_id,
    sobre,
)


def _vender(cliente, fecha, items=None, local_id=LOCAL, empresa_id=EMPRESA):
    datos = datos_venta(fecha_operativa=fecha, items=items)
    assert enviar(cliente, sobre("venta.registrada", datos, local_id=local_id, empresa_id=empresa_id)).status_code == 202
    return datos


def _producto(respuesta, producto_id=PRODUCTO_LOMO):
    productos = respuesta.json()["datos"]["productos"]
    return next((p for p in productos if p["producto_id"] == producto_id), None)


def test_la_serie_es_continua_e_incluye_los_dias_sin_ventas_con_cero(cliente):
    _vender(cliente, "2026-11-10", items=[item(cantidad=2)])
    _vender(cliente, "2026-11-13", items=[item(cantidad=5)])

    respuesta = consultar_serie(cliente, "2026-11-10", "2026-11-14")

    assert respuesta.status_code == 200
    assert respuesta.json()["exito"] is True
    lomo = _producto(respuesta)
    assert lomo["nombre"] == "Lomo saltado"
    assert lomo["categoria_nombre"] == "Fondos"
    assert lomo["primera_venta"] == "2026-11-10"
    assert [(d["fecha"], d["unidades"], d["ingreso"]) for d in lomo["serie"]] == [
        ("2026-11-10", 2, 76.0),
        ("2026-11-11", 0, 0.0),
        ("2026-11-12", 0, 0.0),
        ("2026-11-13", 5, 190.0),
        ("2026-11-14", 0, 0.0),
    ]


def test_la_serie_de_cada_producto_empieza_en_su_primera_venta(cliente):
    _vender(cliente, "2026-11-10", items=[item(cantidad=1)])
    _vender(cliente, "2026-11-12", items=[item(PRODUCTO_INCA, "Inca Kola 500ml", 3, 3.50, "Bebidas")])

    respuesta = consultar_serie(cliente, "2026-11-08", "2026-11-13")

    assert [d["fecha"] for d in _producto(respuesta, PRODUCTO_LOMO)["serie"]][0] == "2026-11-10"
    inca = _producto(respuesta, PRODUCTO_INCA)
    assert [d["fecha"] for d in inca["serie"]] == ["2026-11-12", "2026-11-13"]


def test_el_rango_recorta_la_serie_por_ambos_extremos(cliente):
    for dia in ("2026-11-01", "2026-11-05", "2026-11-09"):
        _vender(cliente, dia, items=[item(cantidad=1)])

    respuesta = consultar_serie(cliente, "2026-11-04", "2026-11-06")

    lomo = _producto(respuesta)
    assert [d["fecha"] for d in lomo["serie"]] == ["2026-11-04", "2026-11-05", "2026-11-06"]
    assert [d["unidades"] for d in lomo["serie"]] == [0, 1, 0]


def test_un_producto_con_primera_venta_posterior_al_rango_no_aparece(cliente):
    _vender(cliente, "2026-11-20", items=[item(cantidad=1)])

    assert consultar_serie(cliente, "2026-11-01", "2026-11-10").json()["datos"]["productos"] == []


def test_las_ventas_anuladas_ya_estan_descontadas(cliente):
    anulada = _vender(cliente, "2026-11-10", items=[item(cantidad=2)])
    _vender(cliente, "2026-11-10", items=[item(cantidad=3)])
    enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(anulada["comprobante_id"])))

    lomo = _producto(consultar_serie(cliente, "2026-11-10", "2026-11-10"))

    assert lomo["serie"] == [{"fecha": "2026-11-10", "unidades": 3, "ingreso": 114.0}]


def test_un_producto_cuya_unica_venta_se_anulo_sigue_con_ceros_desde_su_primera_venta(cliente):
    anulada = _vender(cliente, "2026-11-10", items=[item(cantidad=2)])
    enviar(cliente, sobre("comprobante.anulado", datos_anulacion_comprobante(anulada["comprobante_id"])))

    lomo = _producto(consultar_serie(cliente, "2026-11-10", "2026-11-11"))

    assert [(d["fecha"], d["unidades"]) for d in lomo["serie"]] == [("2026-11-10", 0), ("2026-11-11", 0)]


def test_producto_ids_limita_la_respuesta_a_esos_productos(cliente):
    _vender(cliente, "2026-11-10")

    respuesta = consultar_serie(cliente, "2026-11-10", "2026-11-10", producto_ids=[PRODUCTO_INCA])

    productos = respuesta.json()["datos"]["productos"]
    assert [p["producto_id"] for p in productos] == [PRODUCTO_INCA]


def test_producto_ids_acepta_varios_productos(cliente):
    _vender(cliente, "2026-11-10")

    respuesta = consultar_serie(cliente, "2026-11-10", "2026-11-10", producto_ids=[PRODUCTO_INCA, PRODUCTO_LOMO])

    assert len(respuesta.json()["datos"]["productos"]) == 2


def test_un_local_sin_ventas_responde_200_con_lista_vacia(cliente):
    respuesta = consultar_serie(cliente, "2026-11-01", "2026-11-30")

    assert respuesta.status_code == 200
    datos = respuesta.json()["datos"]
    assert datos["productos"] == []
    assert datos["ultimo_evento_en"] is None
    assert datos["local_id"] == LOCAL


def test_un_local_no_ve_los_datos_de_otro_local(cliente):
    _vender(cliente, "2026-11-10")

    respuesta = consultar_serie(cliente, "2026-11-10", "2026-11-10", local_id=OTRO_LOCAL)

    assert respuesta.status_code == 200
    assert respuesta.json()["datos"]["productos"] == []


def test_una_empresa_no_ve_los_datos_de_otra_aunque_el_local_coincida(cliente):
    _vender(cliente, "2026-11-10")

    respuesta = consultar_serie(cliente, "2026-11-10", "2026-11-10", empresa_id=nuevo_id())

    assert respuesta.json()["datos"]["productos"] == []


def test_ultimo_evento_en_indica_cuando_llego_la_ultima_venta(cliente):
    _vender(cliente, "2026-11-10")

    ultimo = consultar_serie(cliente, "2026-11-10", "2026-11-10").json()["datos"]["ultimo_evento_en"]

    assert ultimo is not None
    assert ultimo.endswith("-05:00")  # America/Lima


def test_desde_posterior_a_hasta_responde_422(cliente):
    respuesta = consultar_serie(cliente, "2026-11-10", "2026-11-01")

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_RANGO_INVALIDO"


def test_un_rango_de_mas_de_730_dias_responde_422(cliente):
    respuesta = consultar_serie(cliente, "2024-01-01", "2026-01-01")

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_RANGO_INVALIDO"


def test_un_rango_de_exactamente_730_dias_se_acepta(cliente):
    assert consultar_serie(cliente, "2025-01-01", "2026-12-31").status_code == 200  # 730 días
    assert consultar_serie(cliente, "2025-01-01", "2027-01-01").status_code == 422  # 731 días


def test_un_producto_id_que_no_es_uuid_responde_422_de_validacion(cliente):
    respuesta = consultar_serie(cliente, "2026-11-01", "2026-11-02", producto_ids=["no-es-un-uuid"])

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"


def test_fechas_con_formato_invalido_responden_422_de_validacion(cliente):
    respuesta = consultar_serie(cliente, "01/11/2026", "2026-11-02")

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"


def test_faltan_parametros_responde_422_de_validacion(cliente):
    consulta = urlencode([("empresa_id", EMPRESA), ("local_id", LOCAL)])

    respuesta = cliente.get(
        f"/interno/series/ventas-diarias?{consulta}", headers=cabeceras_firmadas(consulta.encode())
    )

    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"


# ---------------------------------------------------------------- firma de los GET


def test_sin_firma_responde_401(cliente):
    consulta = urlencode([("empresa_id", EMPRESA), ("local_id", LOCAL), ("desde", "2026-11-01"), ("hasta", "2026-11-02")])

    respuesta = cliente.get(f"/interno/series/ventas-diarias?{consulta}")

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_FIRMA_INVALIDA"


def test_sin_firma_y_con_parametros_incompletos_responde_401_y_no_422(cliente):
    assert cliente.get("/interno/series/ventas-diarias").status_code == 401


def test_alterar_un_parametro_despues_de_firmar_responde_401(cliente):
    _vender(cliente, "2026-11-10")
    firmada = urlencode([("empresa_id", EMPRESA), ("local_id", OTRO_LOCAL), ("desde", "2026-11-10"), ("hasta", "2026-11-10")])
    alterada = firmada.replace(OTRO_LOCAL, LOCAL)

    respuesta = cliente.get(
        f"/interno/series/ventas-diarias?{alterada}", headers=cabeceras_firmadas(firmada.encode())
    )

    assert respuesta.status_code == 401


def test_timestamp_vencido_responde_401(cliente):
    respuesta = consultar_serie(cliente, "2026-11-01", "2026-11-02", timestamp=int(time.time()) - 301)

    assert respuesta.status_code == 401
