"""Reportes de CU-ADMIN-13 contra PostgreSQL real (etapa 6.3).

Las ventas entran por `POST /interno/eventos`, igual que en producción; los reportes se piden con un
JWT como el del núcleo. Los números de cada prueba se pueden seguir a mano.
"""

from tests.ayudas import (
    EMPRESA,
    LOCAL,
    OTRO_LOCAL,
    PRODUCTO_INCA,
    PRODUCTO_LOMO,
    cabecera_bearer,
    datos_anulacion_comprobante,
    datos_pedido_anulado,
    datos_venta,
    enviar,
    item,
    sobre,
)

OTRA_EMPRESA = "00000000-0000-4000-8000-000000000002"
MOZO_LUCIA = ("00000000-0000-4000-8000-000000000103", "Lucía Paredes")
MOZO_JORGE = ("00000000-0000-4000-8000-000000000104", "Jorge Salas")
PRODUCTO_CEVICHE = "00000000-0000-4000-8000-000000000432"


def _venta(
    cliente,
    fecha="2026-11-16",
    hora="21:14:03",
    items=None,
    mozo=MOZO_LUCIA,
    medio="efectivo",
    comensales=2,
    tipo="boleta",
    descuento=0.0,
    local_id=LOCAL,
    empresa_id=EMPRESA,
):
    datos = datos_venta(fecha_operativa=fecha, items=items or [item(cantidad=1)])
    datos.update(
        fecha=f"{fecha}T{hora}-05:00",
        mozo_id=mozo[0],
        mozo_nombre=mozo[1],
        medio_pago=medio,
        comensales=comensales,
        tipo=tipo,
        descuento=descuento,
        total=round(datos["subtotal_consumo"] - descuento, 2),
    )
    respuesta = enviar(cliente, sobre("venta.registrada", datos, local_id=local_id, empresa_id=empresa_id))
    assert respuesta.status_code == 202
    return datos


def _anular(cliente, venta):
    evento = sobre("comprobante.anulado", datos_anulacion_comprobante(venta["comprobante_id"]))
    assert enviar(cliente, evento).status_code == 202


def _anulacion_previa(
    cliente, mozo=MOZO_LUCIA, monto=38.0, es_merma=False, costo_merma=None, fecha="2026-11-16", empresa_id=EMPRESA
):
    datos = datos_pedido_anulado()
    datos.update(
        mozo_id=mozo[0] if mozo else None,
        mozo_nombre=mozo[1] if mozo else None,
        monto_total=monto,
        es_merma=es_merma,
        costo_merma=costo_merma,
        fecha_operativa=fecha,
    )
    assert enviar(cliente, sobre("pedido.anulado", datos, empresa_id=empresa_id)).status_code == 202


def _pedir(cliente, ruta, desde="2026-11-16", hasta="2026-11-16", cabeceras=None, **parametros):
    return cliente.get(
        f"/api/v1/analitica/{ruta}",
        params={"desde": desde, "hasta": hasta, **parametros},
        headers=cabeceras if cabeceras is not None else cabecera_bearer(),
    )


def _datos(respuesta):
    assert respuesta.status_code == 200, respuesta.json()
    return respuesta.json()["datos"]


def _lomo(cantidad=1, costo=14.50):
    return {**item(cantidad=cantidad, precio=38.00), "costo_estandar": costo}


def _inca(cantidad=1, costo=1.20):
    return {**item(PRODUCTO_INCA, "Inca Kola 500ml", cantidad, 3.50, "Bebidas"), "costo_estandar": costo}


def _ceviche(cantidad=1, costo=None):
    return {**item(PRODUCTO_CEVICHE, "Ceviche clásico", cantidad, 42.00, "Fondos"), "costo_estandar": costo}


# ---- Resumen ----


def test_el_resumen_cuenta_solo_las_ventas_vigentes_y_reporta_las_anuladas_aparte(cliente):
    _venta(cliente, items=[_lomo(2)], medio="efectivo", comensales=2)  # 76,00
    _venta(cliente, items=[_lomo(1), _inca(2)], medio="tarjeta", comensales=3, descuento=5.0)  # 45,00 − 5 = 40,00
    _venta(cliente, items=[_inca(4)], medio="tarjeta", comensales=None, tipo="factura")  # 14,00, subcuenta
    anulada = _venta(cliente, items=[_lomo(3)], medio="efectivo")  # 114,00, se anula
    _anular(cliente, anulada)

    datos = _datos(_pedir(cliente, "ventas/resumen", comparar="false"))
    actual = datos["actual"]

    assert actual["ventas_total"] == 130.0
    assert actual["comprobantes"] == 3
    assert actual["dias_con_ventas"] == 1
    assert actual["comprobantes_por_dia"] == 3.0
    assert actual["ticket_promedio"] == 43.33
    # La subcuenta no trae comensales: el ticket por comensal usa solo los 116,00 de los otros dos.
    assert actual["comensales"] == 5
    assert actual["ticket_por_comensal"] == 23.2
    assert actual["descuentos"] == 5.0
    assert actual["anulados"] == {"comprobantes": 1, "total": 114.0}
    assert actual["por_medio_pago"] == [
        {"medio_pago": "efectivo", "comprobantes": 1, "total": 76.0, "porcentaje": 58.5},
        {"medio_pago": "tarjeta", "comprobantes": 2, "total": 54.0, "porcentaje": 41.5},
    ]
    assert actual["por_tipo"] == [
        {"tipo": "boleta", "comprobantes": 2, "total": 116.0},
        {"tipo": "factura", "comprobantes": 1, "total": 14.0},
    ]
    assert datos["anterior"] is None and datos["variacion_pct"] is None
    assert datos["local_id"] == LOCAL
    assert datos["ultimo_evento_en"] is not None


def test_el_resumen_compara_con_el_periodo_anterior_de_igual_duracion(cliente):
    _venta(cliente, fecha="2026-11-14", items=[_lomo(1)])  # periodo anterior: 38,00
    _venta(cliente, fecha="2026-11-15", items=[_lomo(1)])  # 38,00
    _venta(cliente, fecha="2026-11-16", items=[_lomo(2)])  # periodo actual: 76,00
    _venta(cliente, fecha="2026-11-17", items=[_lomo(2)])  # 76,00

    datos = _datos(_pedir(cliente, "ventas/resumen", desde="2026-11-16", hasta="2026-11-17"))

    assert (datos["anterior"]["desde"], datos["anterior"]["hasta"]) == ("2026-11-14", "2026-11-15")
    assert datos["anterior"]["ventas_total"] == 76.0
    assert datos["actual"]["ventas_total"] == 152.0
    assert datos["variacion_pct"] == {
        "ventas_total": 100.0,
        "comprobantes": 0.0,
        "ticket_promedio": 100.0,
        "ticket_por_comensal": 100.0,
    }


def test_sin_ventas_las_metricas_sin_base_son_nulas_y_la_variacion_tambien(cliente):
    _venta(cliente, fecha="2026-11-16", items=[_lomo(1)])

    datos = _datos(_pedir(cliente, "ventas/resumen", desde="2026-11-16", hasta="2026-11-16"))

    # El día anterior no tuvo ventas: nada contra qué comparar.
    assert datos["anterior"]["comprobantes"] == 0
    assert datos["anterior"]["ticket_promedio"] is None
    assert datos["anterior"]["comprobantes_por_dia"] is None
    assert datos["anterior"]["por_medio_pago"] == []
    assert datos["variacion_pct"]["ventas_total"] is None


def test_un_local_sin_ventas_responde_200_con_ceros(cliente):
    datos = _datos(_pedir(cliente, "ventas/resumen"))

    assert datos["actual"]["ventas_total"] == 0.0
    assert datos["actual"]["comprobantes"] == 0
    assert datos["ultimo_evento_en"] is None


# ---- Aislamiento: la empresa sale del token ----


def test_las_ventas_de_otra_empresa_no_se_ven_aunque_compartan_sede(cliente):
    _venta(cliente, items=[_lomo(1)])
    _venta(cliente, items=[_lomo(5)], empresa_id=OTRA_EMPRESA)

    assert _datos(_pedir(cliente, "ventas/resumen"))["actual"]["ventas_total"] == 38.0

    otra = cabecera_bearer(empresa_id=OTRA_EMPRESA)
    assert _datos(_pedir(cliente, "ventas/resumen", cabeceras=otra))["actual"]["ventas_total"] == 190.0


def test_ninguna_ruta_mezcla_datos_de_otra_empresa_en_la_misma_sede(cliente):
    # Solo la otra empresa vende y anula en esta sede: para el token de EMPRESA todo debe salir vacío.
    _venta(cliente, items=[_lomo(3), _inca(2)], empresa_id=OTRA_EMPRESA)
    _anulacion_previa(cliente, mozo=MOZO_JORGE, empresa_id=OTRA_EMPRESA)

    assert _datos(_pedir(cliente, "ventas/resumen"))["actual"]["comprobantes"] == 0
    assert _datos(_pedir(cliente, "ventas/por-hora"))["hora_punta"] is None
    assert _datos(_pedir(cliente, "productos/ranking"))["productos"] == []
    desempeno = _datos(_pedir(cliente, "personal/desempeno"))
    assert desempeno["mozos"] == []
    assert desempeno["totales"]["anulaciones"]["cantidad"] == 0

    # Y la otra empresa sí ve lo suyo.
    otra = cabecera_bearer(empresa_id=OTRA_EMPRESA)
    assert len(_datos(_pedir(cliente, "productos/ranking", cabeceras=otra))["productos"]) == 2


def test_el_propietario_consulta_la_sede_que_elige(cliente):
    _venta(cliente, items=[_lomo(1)])
    _venta(cliente, items=[_inca(2)], local_id=OTRO_LOCAL)
    propietario = cabecera_bearer(rol="propietario", local_id=None)

    datos = _datos(_pedir(cliente, "ventas/resumen", cabeceras={**propietario, "X-Local-Id": OTRO_LOCAL}))

    assert datos["local_id"] == OTRO_LOCAL
    assert datos["actual"]["ventas_total"] == 7.0


def test_un_propietario_de_otra_empresa_no_ve_la_sede_ajena(cliente):
    _venta(cliente, items=[_lomo(1)])
    ajeno = cabecera_bearer(rol="propietario", local_id=None, empresa_id=OTRA_EMPRESA)

    datos = _datos(_pedir(cliente, "ventas/resumen", cabeceras={**ajeno, "X-Local-Id": LOCAL}))

    # Igual que una sede sin ventas: no revela si existe.
    assert datos["actual"]["comprobantes"] == 0


# ---- Autenticación y validación en las rutas reales ----


def test_sin_token_responde_401_antes_de_validar_los_parametros(cliente):
    respuesta = cliente.get("/api/v1/analitica/ventas/resumen")

    assert respuesta.status_code == 401
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_TOKEN_INVALIDO"


def test_las_rutas_avanzadas_exigen_el_modulo_y_las_basicas_no(cliente):
    sin_modulo = cabecera_bearer(modulos=())

    assert _pedir(cliente, "ventas/resumen", cabeceras=sin_modulo).status_code == 200
    assert _pedir(cliente, "ventas/por-hora", cabeceras=sin_modulo).status_code == 200
    for ruta in ("productos/ranking", "personal/desempeno"):
        respuesta = _pedir(cliente, ruta, cabeceras=sin_modulo)
        assert respuesta.status_code == 403
        assert respuesta.json()["errores"][0]["codigo"] == "ERR_MODULO_NO_INCLUIDO"


def test_un_mozo_no_puede_ver_reportes(cliente):
    for ruta in ("ventas/resumen", "ventas/por-hora", "productos/ranking", "personal/desempeno"):
        assert _pedir(cliente, ruta, cabeceras=cabecera_bearer(rol="mozo")).status_code == 403


def test_un_rango_de_mas_de_366_dias_o_invertido_se_rechaza(cliente):
    for ruta in ("ventas/resumen", "ventas/por-hora", "productos/ranking", "personal/desempeno"):
        largo = _pedir(cliente, ruta, desde="2025-01-01", hasta="2026-01-02")
        assert largo.status_code == 422
        assert largo.json()["errores"][0]["codigo"] == "ERR_RANGO_INVALIDO"
        assert _pedir(cliente, ruta, desde="2026-11-17", hasta="2026-11-16").status_code == 422


def test_un_parametro_faltante_o_mal_formado_es_error_de_validacion(cliente):
    respuesta = cliente.get("/api/v1/analitica/ventas/resumen?desde=2026-11-16", headers=cabecera_bearer())
    assert respuesta.status_code == 422
    assert respuesta.json()["errores"][0]["codigo"] == "ERR_VALIDACION"

    assert _pedir(cliente, "ventas/resumen", desde="16/11/2026").status_code == 422


# ---- Por hora ----


def test_la_curva_horaria_tiene_24_franjas_en_hora_de_lima(cliente):
    _venta(cliente, fecha="2026-11-15", hora="13:05:00", items=[_lomo(2)])  # 76,00 a las 13
    _venta(cliente, fecha="2026-11-16", hora="13:40:00", items=[_lomo(1)])  # 38,00 a las 13
    _venta(cliente, fecha="2026-11-16", hora="20:10:00", items=[_lomo(3)])  # 114,00 a las 20
    _venta(cliente, fecha="2026-11-16", hora="23:59:00", items=[_inca(1)])  # 3,50 a las 23 (04:59 UTC del día siguiente)

    datos = _datos(_pedir(cliente, "ventas/por-hora", desde="2026-11-15", hasta="2026-11-16"))
    franjas = {f["hora"]: f for f in datos["franjas"]}

    assert [f["hora"] for f in datos["franjas"]] == list(range(24))
    assert datos["dias_con_ventas"] == 2
    assert franjas[13] == {"hora": 13, "comprobantes": 2, "total": 114.0, "promedio_por_dia": 57.0}
    assert franjas[20]["total"] == 114.0
    assert franjas[23]["total"] == 3.5
    assert franjas[4] == {"hora": 4, "comprobantes": 0, "total": 0.0, "promedio_por_dia": 0.0}
    # 13 y 20 empatan en 114,00: gana la más temprana.
    assert datos["hora_punta"] == {"hora": 13, "total": 114.0}


def test_sin_ventas_no_hay_hora_punta(cliente):
    datos = _datos(_pedir(cliente, "ventas/por-hora"))

    assert datos["hora_punta"] is None
    assert all(f["total"] == 0.0 for f in datos["franjas"])


# ---- Ranking ----


def test_el_ranking_ordena_por_unidades_y_calcula_costo_y_margen(cliente):
    _venta(cliente, items=[_lomo(3), _inca(5)])
    _venta(cliente, items=[_lomo(1), _ceviche(2, costo=None)])
    anulada = _venta(cliente, items=[_ceviche(10)])
    _anular(cliente, anulada)

    datos = _datos(_pedir(cliente, "productos/ranking"))
    productos = {p["producto_id"]: p for p in datos["productos"]}

    assert [p["producto_id"] for p in datos["productos"]] == [PRODUCTO_INCA, PRODUCTO_LOMO, PRODUCTO_CEVICHE]
    lomo = productos[PRODUCTO_LOMO]
    assert (lomo["unidades"], lomo["ingreso"], lomo["costo"], lomo["margen"], lomo["margen_unitario"]) == (
        4,
        152.0,
        58.0,
        94.0,
        23.5,
    )
    assert lomo["categoria_nombre"] == "Fondos"
    assert lomo["participacion_pct"] == 36.4  # 4 de 11 unidades
    inca = productos[PRODUCTO_INCA]
    assert (inca["ingreso"], inca["costo"], inca["margen_unitario"]) == (17.5, 6.0, 2.3)
    # El ceviche no trae costo: no se clasifica y cuenta en sin_costo. La venta anulada no suma.
    ceviche = productos[PRODUCTO_CEVICHE]
    assert ceviche["unidades"] == 2
    assert (ceviche["costo"], ceviche["margen"], ceviche["clasificacion"]) == (None, None, None)
    assert datos["sin_costo"] == 1


def test_un_plato_con_costo_en_unas_ventas_y_no_en_otras_queda_sin_costo(cliente):
    _venta(cliente, items=[_lomo(1, costo=14.50)])
    _venta(cliente, items=[_lomo(1, costo=None)])

    lomo = _datos(_pedir(cliente, "productos/ranking"))["productos"][0]

    assert lomo["costo"] is None
    assert lomo["clasificacion"] is None


def test_la_matriz_de_menu_clasifica_los_platos_con_costo(cliente):
    # Lomo: 4 platos con margen 23,50; Inca: 5 con margen 2,30. N = 2 → popular desde 35 %.
    # Margen medio ponderado = (94,00 + 11,50) / 9 = 11,72.
    _venta(cliente, items=[_lomo(4), _inca(5)])

    datos = _datos(_pedir(cliente, "productos/ranking"))
    clasificacion = {p["producto_id"]: p["clasificacion"] for p in datos["productos"]}

    assert datos["umbrales"] == {"popularidad_pct": 35.0, "margen_unitario": 11.72}
    assert clasificacion == {PRODUCTO_LOMO: "estrella", PRODUCTO_INCA: "caballito"}


def test_el_ranking_reparte_el_ingreso_por_categoria(cliente):
    _venta(cliente, items=[_lomo(2), _inca(4), _ceviche(1)])

    por_categoria = _datos(_pedir(cliente, "productos/ranking"))["por_categoria"]

    # Fondos: 76,00 + 42,00 = 118,00; Bebidas: 14,00. Total 132,00.
    assert por_categoria == [
        {"categoria_nombre": "Fondos", "unidades": 3, "ingreso": 118.0, "participacion_pct": 89.4},
        {"categoria_nombre": "Bebidas", "unidades": 4, "ingreso": 14.0, "participacion_pct": 10.6},
    ]


def test_un_ranking_sin_ventas_no_tiene_umbrales(cliente):
    datos = _datos(_pedir(cliente, "productos/ranking"))

    assert datos == {**datos, "productos": [], "umbrales": None, "por_categoria": [], "sin_costo": 0}


# ---- Desempeño ----


def test_el_desempeno_reune_ventas_notas_de_credito_y_anulaciones_por_mozo(cliente):
    _venta(cliente, items=[_lomo(2)], mozo=MOZO_LUCIA, comensales=2)  # 76,00
    _venta(cliente, items=[_lomo(1)], mozo=MOZO_LUCIA, comensales=1)  # 38,00
    anulada = _venta(cliente, items=[_lomo(1)], mozo=MOZO_LUCIA)
    _anular(cliente, anulada)
    _venta(cliente, items=[_inca(2)], mozo=MOZO_JORGE, comensales=None)  # 7,00
    _anulacion_previa(cliente, mozo=MOZO_LUCIA, monto=38.0)
    _anulacion_previa(cliente, mozo=MOZO_JORGE, monto=42.0, es_merma=True, costo_merma=12.5)
    _anulacion_previa(cliente, mozo=None, monto=3.5)

    datos = _datos(_pedir(cliente, "personal/desempeno"))
    mozos = {m["mozo_id"]: m for m in datos["mozos"]}

    assert [m["mozo_nombre"] for m in datos["mozos"]] == ["Lucía Paredes", "Jorge Salas"]
    lucia = mozos[MOZO_LUCIA[0]]
    assert (lucia["comprobantes"], lucia["ventas_total"], lucia["ticket_promedio"], lucia["comensales"]) == (
        2,
        114.0,
        57.0,
        3,
    )
    assert lucia["comprobantes_anulados"] == 1
    assert lucia["anulaciones"] == {"cantidad": 1, "monto": 38.0, "mermas": 0, "costo_merma": 0.0}
    assert mozos[MOZO_JORGE[0]]["anulaciones"] == {"cantidad": 1, "monto": 42.0, "mermas": 1, "costo_merma": 12.5}
    # La anulación sin mozo solo suma en los totales.
    assert datos["totales"] == {
        "comprobantes": 3,
        "ventas_total": 121.0,
        "anulaciones": {"cantidad": 3, "monto": 83.5, "mermas": 1, "costo_merma": 12.5},
    }


def test_un_mozo_solo_con_anulaciones_aparece_sin_ventas(cliente):
    _anulacion_previa(cliente, mozo=MOZO_JORGE, monto=20.0)

    mozo = _datos(_pedir(cliente, "personal/desempeno"))["mozos"][0]

    assert mozo["mozo_nombre"] == "Jorge Salas"
    assert (mozo["comprobantes"], mozo["ventas_total"], mozo["ticket_promedio"]) == (0, 0.0, None)
    assert mozo["anulaciones"]["cantidad"] == 1


def test_el_desempeno_respeta_el_periodo(cliente):
    _venta(cliente, fecha="2026-11-15", items=[_lomo(1)])
    _anulacion_previa(cliente, fecha="2026-11-15")

    datos = _datos(_pedir(cliente, "personal/desempeno", desde="2026-11-16", hasta="2026-11-16"))

    assert datos["mozos"] == []
    assert datos["totales"]["anulaciones"]["cantidad"] == 0


def test_cada_respuesta_sigue_el_formato_comun(cliente):
    _venta(cliente, items=[_lomo(1)])

    for ruta in ("ventas/resumen", "ventas/por-hora", "productos/ranking", "personal/desempeno"):
        cuerpo = _pedir(cliente, ruta).json()
        assert cuerpo["exito"] is True
        assert "timestamp" in cuerpo["meta"]
        assert (cuerpo["datos"]["desde"], cuerpo["datos"]["hasta"]) == ("2026-11-16", "2026-11-16")
