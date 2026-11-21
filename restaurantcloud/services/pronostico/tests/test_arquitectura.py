"""Reglas de dependencias de la arquitectura (doc-2u/servicios/ms-pronostico.md, sección 8).

Mirar los `import` de cada módulo basta: si alguien importa lo que no debe, la prueba falla y dice dónde.
"""

import ast
from pathlib import Path

import pytest

APP = Path(__file__).resolve().parent.parent / "app"

TECNOLOGIA = ("fastapi", "starlette", "sqlalchemy", "httpx", "psycopg")


def _imports(archivo: Path) -> set[str]:
    nombres: set[str] = set()
    for nodo in ast.walk(ast.parse(archivo.read_text(encoding="utf-8"))):
        if isinstance(nodo, ast.Import):
            nombres.update(alias.name for alias in nodo.names)
        elif isinstance(nodo, ast.ImportFrom) and nodo.module and nodo.level == 0:
            nombres.add(nodo.module)
    return nombres


def _empieza_con(nombre: str, prefijos) -> bool:
    return any(nombre == p or nombre.startswith(p + ".") for p in prefijos)


def _violaciones(carpeta: str, prohibidos) -> list[str]:
    encontrados = []
    for archivo in sorted((APP / carpeta).rglob("*.py")):
        for nombre in _imports(archivo):
            if _empieza_con(nombre, prohibidos):
                encontrados.append(f"{archivo.relative_to(APP.parent)} importa {nombre}")
    return encontrados


@pytest.mark.parametrize("carpeta", ["casos_de_uso", "dominio"])
def test_casos_de_uso_y_dominio_no_conocen_la_tecnologia_ni_los_adaptadores(carpeta):
    prohibidos = (*TECNOLOGIA, "app.adaptadores", "app.api", "app.composicion", "app.soporte")

    assert _violaciones(carpeta, prohibidos) == []


def test_la_api_no_conoce_los_adaptadores_ni_la_base():
    prohibidos = ("sqlalchemy", "httpx", "psycopg", "app.adaptadores", "app.composicion")

    assert _violaciones("api", prohibidos) == []


def test_solo_la_composicion_conoce_los_adaptadores():
    fuera = []
    for archivo in sorted(APP.rglob("*.py")):
        relativo = archivo.relative_to(APP)
        if relativo.parts[0] == "adaptadores" or relativo.name == "composicion.py":
            continue
        fuera += [f"app/{relativo} importa {n}" for n in _imports(archivo) if _empieza_con(n, ("app.adaptadores",))]

    assert fuera == []


def test_los_adaptadores_no_dependen_de_la_api():
    assert _violaciones("adaptadores", ("app.api", "app.composicion")) == []


def test_soporte_solo_depende_de_la_configuracion():
    # Se copia tal cual de ms-analítica: no debe importar las capas del servicio.
    prohibidos = ("app.api", "app.casos_de_uso", "app.dominio", "app.adaptadores", "app.composicion")

    assert _violaciones("soporte", prohibidos) == []
