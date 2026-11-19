"""Línea de comandos: `python -m app.sinteticos generar|purgar` (ver el README del servicio)."""

import argparse
import csv
import json
import sys
from datetime import date, timedelta
from uuid import UUID

from app.sinteticos import cargador
from app.sinteticos.carta import Carta
from app.sinteticos.perfil import cargar_perfil
from app.soporte.logs import configurar_logs


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m app.sinteticos", description=__doc__)
    ordenes = parser.add_subparsers(dest="orden", required=True)

    generar = ordenes.add_parser("generar", help="genera y guarda ventas sintéticas hasta una fecha de corte")
    generar.add_argument("--carta", required=True, help="JSON de `carta:exportar` (archivo, o - para la entrada estándar)")
    generar.add_argument("--perfil", default="aurea_v1")
    generar.add_argument("--semilla", type=int, default=2026)
    generar.add_argument("--meses", type=int, default=24)
    generar.add_argument("--hasta", type=date.fromisoformat, help="último día (AAAA-MM-DD); por defecto, ayer")
    generar.add_argument("--verdad", help="archivo CSV donde guardar la demanda esperada por plato y día")

    purgar = ordenes.add_parser("purgar", help="borra las ventas de un local hasta una fecha (sin --confirmar, solo cuenta)")
    purgar.add_argument("--empresa", required=True, type=UUID)
    purgar.add_argument("--local", required=True, type=UUID)
    purgar.add_argument("--hasta", required=True, type=date.fromisoformat)
    purgar.add_argument("--confirmar", action="store_true")
    return parser


def _generar(args: argparse.Namespace) -> dict:
    texto = sys.stdin.read() if args.carta == "-" else open(args.carta, encoding="utf-8").read()  # noqa: SIM115
    carta = Carta.model_validate_json(texto)
    perfil = cargar_perfil(args.perfil)
    hasta = args.hasta or cargador.ayer_en_lima()
    cargador.validar_hasta(hasta)
    desde = cargador.restar_meses(hasta, args.meses) + timedelta(days=1)

    salida = open(args.verdad, "w", newline="", encoding="utf-8") if args.verdad else None  # noqa: SIM115
    try:
        escritor = csv.writer(salida) if salida else None
        if escritor:
            escritor.writerow(["fecha", "producto_id", "unidades_esperadas"])

        def guardar_verdad(dia) -> None:
            if escritor:
                for producto_id, unidades in dia.esperada.items():
                    escritor.writerow([dia.fecha.isoformat(), producto_id, f"{unidades:.4f}"])

        resumen = cargador.cargar(carta, perfil, desde, hasta, args.semilla, por_dia=guardar_verdad)
    finally:
        if salida:
            salida.close()
    return {"orden": "generar", "perfil": perfil.nombre, "semilla": args.semilla, "desde": str(desde), "hasta": str(hasta),
            "dias": resumen.dias, "ventas": resumen.ventas, "unidades": resumen.unidades}


def _purgar(args: argparse.Namespace) -> dict:
    conteo = cargador.purgar(args.empresa, args.local, args.hasta, args.confirmar)
    return {"orden": "purgar", "hasta": str(args.hasta), "borrado": args.confirmar, **conteo}


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    configurar_logs()
    try:
        resultado = _generar(args) if args.orden == "generar" else _purgar(args)
    except (ValueError, OSError) as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1
    print(json.dumps(resultado, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
