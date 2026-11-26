"""Contrato de forma de los eventos del núcleo (doc-2u/servicios/contratos).

Cada archivo describe la forma de los `datos` de un evento real: sus campos y el tipo de cada uno. Aquí se
convierte en un ejemplo concreto y se comprueba que ms-analítica lo acepta con sus propios modelos y
lo aplica de punta a punta. El núcleo verifica el mismo archivo contra lo que realmente emite, así que si
cualquiera de los dos lados cambia sin el otro, una de las dos pruebas falla.
"""

import json
import uuid
from pathlib import Path

import pytest

from app.dominio.eventos import MODELOS_V1
from app.dominio.procesador import interpretar
from tests.ayudas import cuerpo_json, enviar, sobre

CONTRATOS = Path(__file__).resolve().parents[4] / "doc-2u" / "servicios" / "contratos"
ARCHIVOS = sorted(CONTRATOS.glob("*.json"))

MUESTRAS = {
    "uuid": lambda: str(uuid.uuid4()),
    "string": lambda: "texto de prueba",
    "int": lambda: 1,
    "number": lambda: 12.5,
    "bool": lambda: False,
    "date": lambda: "2026-11-16",
    "datetime": lambda: "2026-11-16T21:14:03-05:00",
    "null": lambda: None,
}


def ejemplo(forma):
    """Convierte la forma del contrato en un valor concreto. Un texto que no es un tipo es un valor fijo."""
    if isinstance(forma, dict):
        return {campo: ejemplo(valor) for campo, valor in forma.items()}
    if isinstance(forma, list):
        return [ejemplo(valor) for valor in forma]
    return MUESTRAS[forma]() if forma in MUESTRAS else forma


def tipo_de(archivo: Path) -> str:
    # venta.registrada.subcuenta.json -> venta.registrada; comprobante.anulado.json -> comprobante.anulado
    return ".".join(archivo.stem.split(".")[:2])


def test_hay_un_contrato_por_cada_evento_que_consume_el_servicio():
    assert CONTRATOS.is_dir(), f"No se encuentra {CONTRATOS}"
    assert set(MODELOS_V1).issubset({tipo_de(a) for a in ARCHIVOS})


@pytest.mark.parametrize("archivo", ARCHIVOS, ids=lambda a: a.stem)
def test_el_servicio_acepta_lo_que_describe_el_contrato(archivo):
    tipo = tipo_de(archivo)
    datos = ejemplo(json.loads(archivo.read_text(encoding="utf-8")))

    _, modelo = interpretar(cuerpo_json(sobre(tipo, datos)))

    if tipo in MODELOS_V1:
        assert modelo is not None
    else:
        assert modelo is None


@pytest.mark.parametrize("archivo", ARCHIVOS, ids=lambda a: a.stem)
def test_el_servicio_aplica_el_evento_del_contrato_de_punta_a_punta(cliente, archivo):
    tipo = tipo_de(archivo)
    datos = ejemplo(json.loads(archivo.read_text(encoding="utf-8")))

    respuesta = enviar(cliente, sobre(tipo, datos))

    if tipo in MODELOS_V1:
        assert respuesta.status_code == 202, respuesta.text
    else:
        assert respuesta.status_code == 200, respuesta.text
        assert respuesta.json()["datos"]["estado"] == "ignorado"


@pytest.mark.parametrize("archivo", ARCHIVOS, ids=lambda a: a.stem)
def test_cada_campo_del_contrato_es_un_tipo_conocido_o_un_valor_fijo(archivo):
    def hojas(forma):
        if isinstance(forma, dict):
            for valor in forma.values():
                yield from hojas(valor)
        elif isinstance(forma, list):
            for valor in forma:
                yield from hojas(valor)
        else:
            yield forma

    forma = json.loads(archivo.read_text(encoding="utf-8"))
    assert all(isinstance(h, str) for h in hojas(forma))
