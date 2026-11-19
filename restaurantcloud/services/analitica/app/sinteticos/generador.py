"""Generación de ventas sintéticas: función pura, sin base de datos ni red.

La demanda de un día es `tickets_esperados` (calendario, tendencia, promoción) y se reparte entre
platos con `demanda_esperada`. `generar` sortea sobre esa misma intensidad, así que la demanda
esperada que exporta es «la verdad» contra la que el protocolo puede medir al modelo.
"""

import math
import random
from collections import defaultdict
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal
from uuid import NAMESPACE_URL, UUID, uuid5
from zoneinfo import ZoneInfo

from app.dominio.eventos import ItemVendido, VentaRegistrada
from app.sinteticos.carta import Carta, ProductoCarta, PromocionCarta
from app.sinteticos.feriados import eventos_de_demanda, feriados_peru
from app.sinteticos.perfil import Perfil, PromocionPerfil

LIMA = ZoneInfo("America/Lima")
ORIGEN_TENDENCIA = date(2025, 1, 1)
CENTAVO = Decimal("0.01")


@dataclass(frozen=True)
class DiaGenerado:
    fecha: date
    ventas: list[VentaRegistrada]
    esperada: dict[UUID, float]  # unidades esperadas por plato: la demanda «verdadera» del día


def _promocion_activa(perfil: Perfil, carta: Carta, fecha: date) -> list[tuple[PromocionPerfil, PromocionCarta]]:
    """Promociones que el perfil pone en campaña ese día y que el local realmente tiene."""
    por_id = {p.id: p for p in carta.promociones}
    activas = []
    for config in perfil.promociones:
        promocion = por_id.get(config.promocion_id)
        if promocion is None or fecha.isoweekday() not in promocion.dias_semana:
            continue
        if any(c.desde <= fecha <= c.hasta for c in config.campanas):
            activas.append((config, promocion))
    return activas


def tickets_esperados(perfil: Perfil, carta: Carta, fecha: date) -> float:
    """Comprobantes esperados del día, antes del ruido."""
    if f"{fecha:%m-%d}" in perfil.dias_cerrados:
        return 0.0
    factor = perfil.tickets_base
    factor *= perfil.factor_dia_semana[fecha.weekday()] * perfil.factor_mes[fecha.month - 1]
    factor *= (1 + perfil.tendencia_anual) ** ((fecha - ORIGEN_TENDENCIA).days / 365)
    if fecha.day in (1, 15, 16, 30, 31):
        factor *= perfil.factor_dias_de_pago
    if fecha in feriados_peru(fecha.year):
        factor *= perfil.factor_feriado
    evento = eventos_de_demanda(fecha.year).get(fecha)
    if evento is not None:
        factor *= perfil.factor_evento.get(evento, 1.0)
    for config, _ in _promocion_activa(perfil, carta, fecha):
        factor *= 1 + config.aumento_tickets
    return factor


def _prob_categoria(perfil: Perfil, categoria: str, mes: int) -> float:
    base = perfil.prob_categoria.get(categoria, perfil.prob_categoria_defecto)
    estacional = perfil.factor_mes_categoria.get(categoria)
    return min(0.99, base * (estacional[mes - 1] if estacional else 1.0))


def _por_categoria(carta: Carta) -> dict[str, list[ProductoCarta]]:
    agrupados: dict[str, list[ProductoCarta]] = defaultdict(list)
    for producto in carta.productos:
        agrupados[producto.categoria_nombre].append(producto)
    return agrupados


def _pesos(perfil: Perfil, productos: list[ProductoCarta]) -> list[float]:
    return [perfil.popularidad.get(p.producto_id, 1.0) for p in productos]


def demanda_esperada(perfil: Perfil, carta: Carta, fecha: date) -> dict[UUID, float]:
    """Unidades esperadas de cada plato ese día (aproximación: ignora el plato de relleno de un ticket vacío)."""
    tickets = tickets_esperados(perfil, carta, fecha)
    comensales = sum(n * p for n, p in perfil.comensales.items()) / sum(perfil.comensales.values())
    esperada: dict[UUID, float] = {p.producto_id: 0.0 for p in carta.productos}
    for categoria, productos in _por_categoria(carta).items():
        pedidos = tickets * comensales * _prob_categoria(perfil, categoria, fecha.month)
        pesos = _pesos(perfil, productos)
        total = sum(pesos)
        for producto, peso in zip(productos, pesos, strict=True):
            esperada[producto.producto_id] = pedidos * peso / total
    return esperada


def _poisson(rng: random.Random, media: float) -> int:
    if media <= 0:
        return 0
    if media > 30:  # la aproximación normal es suficiente y evita el desbordamiento de exp(-media)
        return max(0, round(rng.gauss(media, math.sqrt(media))))
    limite, k, producto = math.exp(-media), 0, rng.random()
    while producto > limite:
        k += 1
        producto *= rng.random()
    return k


def _hora(rng: random.Random, perfil: Perfil) -> tuple[int, int, int]:
    franja = rng.choices(perfil.franjas, [f.peso for f in perfil.franjas])[0]
    hora = min(22.9, max(12.0, rng.gauss(franja.media, franja.desviacion)))
    minutos = int((hora % 1) * 60)
    return int(hora), minutos, rng.randint(0, 59)


def _dinero(valor: Decimal) -> Decimal:
    return valor.quantize(CENTAVO, rounding=ROUND_HALF_UP)


def _descuento(promocion: PromocionCarta, subtotal: Decimal) -> Decimal:
    if promocion.tipo_descuento == "porcentaje":
        return _dinero(subtotal * promocion.valor / 100)
    return min(promocion.valor, subtotal)


def _venta(
    rng: random.Random, perfil: Perfil, carta: Carta, fecha: date, numero: int, semilla: int
) -> VentaRegistrada:
    categorias = _por_categoria(carta)
    comensales = rng.choices(list(perfil.comensales), list(perfil.comensales.values()))[0]

    cantidades: dict[UUID, int] = defaultdict(int)
    elegidos: dict[UUID, ProductoCarta] = {}
    for categoria, productos in categorias.items():
        probabilidad = _prob_categoria(perfil, categoria, fecha.month)
        pesos = _pesos(perfil, productos)
        for _ in range(comensales):
            if rng.random() < probabilidad:
                producto = rng.choices(productos, pesos)[0]
                cantidades[producto.producto_id] += 1
                elegidos[producto.producto_id] = producto
    if not cantidades:  # un comprobante nunca va vacío
        producto = rng.choices(carta.productos, _pesos(perfil, carta.productos))[0]
        cantidades[producto.producto_id] = 1
        elegidos[producto.producto_id] = producto

    items = [
        ItemVendido(
            producto_id=producto_id,
            nombre=elegidos[producto_id].nombre,
            categoria_id=elegidos[producto_id].categoria_id,
            categoria_nombre=elegidos[producto_id].categoria_nombre,
            cantidad=cantidad,
            precio_unitario=elegidos[producto_id].precio,
            subtotal=_dinero(elegidos[producto_id].precio * cantidad),
            costo_estandar=elegidos[producto_id].costo_estandar,
        )
        for producto_id, cantidad in cantidades.items()
    ]
    subtotal = sum((i.subtotal for i in items), Decimal(0))

    hora, minuto, segundo = _hora(rng, perfil)
    momento = datetime.combine(fecha, time(hora, minuto, segundo), tzinfo=LIMA)

    descuento, promocion_id = Decimal(0), None
    for config, promocion in _promocion_activa(perfil, carta, fecha):
        dentro_del_horario = (promocion.hora_inicio is None or promocion.hora_inicio <= momento.time()) and (
            promocion.hora_fin is None or momento.time() < promocion.hora_fin
        )
        if dentro_del_horario and subtotal >= promocion.monto_minimo_consumo and rng.random() < config.uso:
            descuento, promocion_id = _descuento(promocion, subtotal), promocion.id
            break

    mozo = rng.choice(carta.mozos)
    base = f"{carta.local_id}:{semilla}:{fecha.isoformat()}:{numero}"
    return VentaRegistrada(
        comprobante_id=uuid5(NAMESPACE_URL, f"venta:{base}"),
        pedido_id=uuid5(NAMESPACE_URL, f"pedido:{base}"),
        tipo=rng.choices(list(perfil.tipos_comprobante), list(perfil.tipos_comprobante.values()))[0],
        fecha=momento,
        fecha_operativa=fecha,
        mozo_id=mozo.id,
        mozo_nombre=mozo.nombre,
        comensales=comensales,
        medio_pago=rng.choices(list(perfil.medios_pago), list(perfil.medios_pago.values()))[0],
        subtotal_consumo=subtotal,
        descuento=descuento,
        monto_recargo=Decimal(0),
        total=subtotal - descuento,
        promocion_id=promocion_id,
        items=items,
    )


def generar_dia(perfil: Perfil, carta: Carta, fecha: date, semilla: int) -> DiaGenerado:
    """Un día completo. Su sorteo depende solo de (semilla, local, fecha): generar un rango en partes da lo mismo."""
    rng = random.Random(f"{semilla}:{carta.local_id}:{fecha.isoformat()}")
    media = tickets_esperados(perfil, carta, fecha) * rng.gammavariate(perfil.dispersion, 1 / perfil.dispersion)
    ventas = [_venta(rng, perfil, carta, fecha, n, semilla) for n in range(_poisson(rng, media))]
    ventas.sort(key=lambda v: v.fecha)
    return DiaGenerado(fecha, ventas, demanda_esperada(perfil, carta, fecha))


def generar(perfil: Perfil, carta: Carta, desde: date, hasta: date, semilla: int) -> Iterator[DiaGenerado]:
    """Cada día de `desde` a `hasta`, ambos incluidos (los días cerrados salen sin ventas)."""
    if hasta < desde:
        raise ValueError("`hasta` es anterior a `desde`.")
    for dia in range((hasta - desde).days + 1):
        yield generar_dia(perfil, carta, desde + timedelta(days=dia), semilla)
