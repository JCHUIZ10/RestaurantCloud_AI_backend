"""Generador de ventas sintéticas para entrenar y evaluar el pronóstico (etapa 4 del plan).

Genera ventas con la misma forma que el evento `venta.registrada` y las aplica con la misma función de
dominio que procesa los eventos reales, sin pasar por HTTP ni por el outbox del núcleo.
"""
