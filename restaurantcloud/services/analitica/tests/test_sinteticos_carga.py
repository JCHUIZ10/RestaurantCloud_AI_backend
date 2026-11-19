"""Carga y purga de ventas sintéticas contra PostgreSQL real."""

import csv
import json
from datetime import date
from uuid import UUID

import pytest
from sqlalchemy import text

from app.sinteticos import cargador
from app.sinteticos.__main__ import main
from app.sinteticos.carta import Carta
from tests.ayudas import EMPRESA, LOCAL, OTRO_LOCAL, carta_demo

DESDE, HASTA = date(2026, 3, 1), date(2026, 3, 30)


def _contar(bd, tabla, filtro="TRUE"):
    return bd.execute(text(f"SELECT count(*) FROM {tabla} WHERE {filtro}")).scalar_one()


def test_la_carga_coincide_con_lo_generado(bd, perfil, carta):
    resumen = cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)

    assert resumen.dias == 30 and resumen.ventas > 0
    assert _contar(bd, "venta") == resumen.ventas
    unidades_en_serie = bd.execute(text("SELECT coalesce(sum(unidades), 0) FROM venta_diaria_producto")).scalar_one()
    assert unidades_en_serie == resumen.unidades
    assert _contar(bd, "evento_procesado") == 0  # no son eventos: no se registran como tales


def test_cargar_dos_veces_no_duplica(bd, perfil, carta):
    cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)
    ventas = _contar(bd, "venta")
    unidades = bd.execute(text("SELECT sum(unidades) FROM venta_diaria_producto")).scalar_one()

    cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)

    assert _contar(bd, "venta") == ventas
    assert bd.execute(text("SELECT sum(unidades) FROM venta_diaria_producto")).scalar_one() == unidades


def test_no_se_genera_de_hoy_en_adelante(perfil, carta):
    with pytest.raises(ValueError, match="anterior a hoy"):
        cargador.cargar(carta, perfil, DESDE, cargador.hoy_en_lima(), semilla=1)
    with pytest.raises(ValueError):
        cargador.validar_hasta(date(2026, 11, 18), hoy=date(2026, 11, 18))
    cargador.validar_hasta(date(2026, 11, 17), hoy=date(2026, 11, 18))


def test_restar_meses_ajusta_el_fin_de_mes():
    assert cargador.restar_meses(date(2026, 11, 17), 24) == date(2024, 11, 17)
    assert cargador.restar_meses(date(2026, 3, 31), 1) == date(2026, 2, 28)
    assert cargador.restar_meses(date(2026, 1, 15), 2) == date(2025, 11, 15)


def test_purgar_sin_confirmar_solo_cuenta(bd, perfil, carta):
    cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)
    antes = _contar(bd, "venta")

    conteo = cargador.purgar(UUID(EMPRESA), UUID(LOCAL), date(2026, 3, 15), confirmar=False)

    assert conteo["venta"] > 0
    assert _contar(bd, "venta") == antes


def test_purgar_borra_hasta_el_corte_y_deja_lo_posterior(bd, perfil, carta):
    cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)
    corte = date(2026, 3, 15)
    posteriores = _contar(bd, "venta", f"fecha_operativa > '{corte}'")
    unidades_posteriores = bd.execute(
        text(f"SELECT coalesce(sum(unidades), 0) FROM venta_diaria_producto WHERE fecha_operativa > '{corte}'")
    ).scalar_one()

    cargador.purgar(UUID(EMPRESA), UUID(LOCAL), corte, confirmar=True)

    assert _contar(bd, "venta") == posteriores
    assert _contar(bd, "venta", f"fecha_operativa <= '{corte}'") == 0
    assert _contar(bd, "venta_item", f"fecha_operativa <= '{corte}'") == 0
    assert bd.execute(text("SELECT coalesce(sum(unidades), 0) FROM venta_diaria_producto")).scalar_one() == unidades_posteriores
    # producto_visto se reconstruye con lo que quedó: ya no recuerda ventas anteriores al corte
    assert _contar(bd, "producto_visto", f"primera_venta <= '{corte}'") == 0
    assert _contar(bd, "producto_visto") > 0


def test_purgar_no_toca_otro_local(bd, perfil, carta):
    cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)
    # Cada local tiene sus propios platos: los ids de producto no se comparten entre locales.
    texto = carta.model_dump_json().replace("0000-4000-8000-0000000004", "0000-4000-8000-0000000005")
    otra = Carta.model_validate_json(texto).model_copy(update={"local_id": UUID(OTRO_LOCAL)})
    cargador.cargar(otra, perfil, DESDE, HASTA, semilla=1)
    del_otro = _contar(bd, "venta", f"local_id = '{OTRO_LOCAL}'")
    assert del_otro > 0

    cargador.purgar(UUID(EMPRESA), UUID(LOCAL), HASTA, confirmar=True)

    assert _contar(bd, "venta", f"local_id = '{LOCAL}'") == 0
    assert _contar(bd, "venta", f"local_id = '{OTRO_LOCAL}'") == del_otro
    assert _contar(bd, "producto_visto", f"local_id = '{OTRO_LOCAL}'") > 0


def test_la_linea_de_comandos_genera_y_exporta_la_verdad(bd, tmp_path, capsys):
    archivo_carta = tmp_path / "carta.json"
    archivo_carta.write_text(json.dumps(carta_demo()), encoding="utf-8")
    verdad = tmp_path / "verdad.csv"

    codigo = main(["generar", "--carta", str(archivo_carta), "--meses", "1", "--hasta", "2026-03-31", "--verdad", str(verdad)])

    assert codigo == 0
    resumen = json.loads(capsys.readouterr().out.strip().splitlines()[-1])
    assert resumen["desde"] == "2026-03-01" and resumen["hasta"] == "2026-03-31" and resumen["dias"] == 31
    assert _contar(bd, "venta") == resumen["ventas"] > 0
    filas = list(csv.DictReader(verdad.open(encoding="utf-8")))
    assert len(filas) == 31 * 5  # un valor esperado por plato y día
    assert float(filas[0]["unidades_esperadas"]) >= 0


def test_la_linea_de_comandos_rechaza_hoy(tmp_path, capsys):
    archivo_carta = tmp_path / "carta.json"
    archivo_carta.write_text(json.dumps(carta_demo()), encoding="utf-8")

    codigo = main(["generar", "--carta", str(archivo_carta), "--hasta", cargador.hoy_en_lima().isoformat()])

    assert codigo == 1
    assert "anterior a hoy" in capsys.readouterr().err


def test_la_linea_de_comandos_purga(bd, perfil, carta, capsys):
    cargador.cargar(carta, perfil, DESDE, HASTA, semilla=1)

    assert main(["purgar", "--empresa", EMPRESA, "--local", LOCAL, "--hasta", "2026-03-31"]) == 0
    assert json.loads(capsys.readouterr().out.strip().splitlines()[-1])["borrado"] is False
    assert _contar(bd, "venta") > 0

    assert main(["purgar", "--empresa", EMPRESA, "--local", LOCAL, "--hasta", "2026-03-31", "--confirmar"]) == 0
    assert _contar(bd, "venta") == 0
