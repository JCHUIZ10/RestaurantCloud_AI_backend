"""Constructores de eventos y de peticiones firmadas, con el mismo formato que envía el núcleo."""

import json
import time
import uuid
from urllib.parse import urlencode

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.soporte.firma import calcular_firma

SECRETO = "secreto-de-pruebas"
EMPRESA = "00000000-0000-4000-8000-000000000001"
LOCAL = "00000000-0000-4000-8000-000000000010"
OTRO_LOCAL = "00000000-0000-4000-8000-000000000011"
PRODUCTO_LOMO = "00000000-0000-4000-8000-000000000431"
PRODUCTO_INCA = "00000000-0000-4000-8000-000000000435"


PROMOCION = "00000000-0000-4000-8000-000000000441"


def carta_demo() -> dict:
    """Carta de ÁUREA tal como la entrega `carta:exportar` (los ids coinciden con el seed del núcleo)."""

    def producto(numero, nombre, categoria, categoria_nombre, precio):
        return {
            "producto_id": f"00000000-0000-4000-8000-0000000004{numero}",
            "nombre": nombre,
            "categoria_id": f"00000000-0000-4000-8000-0000000004{categoria:02d}",
            "categoria_nombre": categoria_nombre,
            "precio": precio,
            "costo_estandar": "10.00",
        }

    return {
        "empresa_id": EMPRESA,
        "local_id": LOCAL,
        "productos": [
            producto(31, "Ceviche Clásico", 1, "Entradas", "38.00"),
            producto(32, "Lomo Saltado Criollo", 2, "Fondos", "42.00"),
            producto(33, "Inca Kola 500ml", 3, "Bebidas", "9.00"),
            producto(34, "Suspiro Limeño", 4, "Postres", "18.00"),
            producto(35, "Causa Limeña de Pollo", 1, "Entradas", "24.00"),
        ],
        "mozos": [
            {"id": "00000000-0000-4000-8000-000000000103", "nombre": "Carlos Huamán"},
            {"id": "00000000-0000-4000-8000-000000000106", "nombre": "Mozo Dos"},
        ],
        "promociones": [
            {
                "id": PROMOCION,
                "tipo_descuento": "porcentaje",
                "valor": "15.00",
                "dias_semana": [1, 2, 3, 4, 5],
                "hora_inicio": "12:00:00",
                "hora_fin": "16:00:00",
                "monto_minimo_consumo": "50.00",
            }
        ],
    }


def nuevo_id() -> str:
    return str(uuid.uuid4())


def item(producto_id=PRODUCTO_LOMO, nombre="Lomo saltado", cantidad=2, precio=38.00, categoria="Fondos"):
    return {
        "producto_id": producto_id,
        "nombre": nombre,
        "categoria_id": "00000000-0000-4000-8000-000000000401",
        "categoria_nombre": categoria,
        "cantidad": cantidad,
        "precio_unitario": precio,
        "subtotal": round(cantidad * precio, 2),
        "costo_estandar": 14.50,
    }


def datos_venta(comprobante_id=None, fecha_operativa="2026-11-16", items=None):
    items = items if items is not None else [item(), item(PRODUCTO_INCA, "Inca Kola 500ml", 2, 3.50, "Bebidas")]
    subtotal = round(sum(i["subtotal"] for i in items), 2)
    return {
        "comprobante_id": comprobante_id or nuevo_id(),
        "pedido_id": nuevo_id(),
        "tipo": "boleta",
        "fecha": f"{fecha_operativa}T21:14:03-05:00",
        "fecha_operativa": fecha_operativa,
        "mozo_id": "00000000-0000-4000-8000-000000000103",
        "mozo_nombre": "Lucía Paredes",
        "comensales": 2,
        "medio_pago": "efectivo",
        "subtotal_consumo": subtotal,
        "descuento": 0.00,
        "monto_recargo": 0.00,
        "total": subtotal,
        "promocion_id": None,
        "items": items,
    }


def datos_anulacion_comprobante(comprobante_id):
    return {
        "comprobante_id": comprobante_id,
        "nota_credito_id": nuevo_id(),
        "fecha": "2026-11-16T21:40:10-05:00",
        "motivo_codigo": "01",
        "anulado_por_id": "00000000-0000-4000-8000-000000000105",
        "anulado_por_nombre": "Carlos Ríos",
        "total": 83.00,
    }


def datos_pedido_anulado(anulacion_id=None):
    return {
        "anulacion_id": anulacion_id or nuevo_id(),
        "pedido_id": nuevo_id(),
        "pedido_item_id": nuevo_id(),
        "producto_id": PRODUCTO_LOMO,
        "producto_nombre": "Lomo saltado",
        "cantidad": 1,
        "monto_total": 38.00,
        "tipo_anulacion": "item_individual",
        "motivo_categoria": "demora_cliente",
        "es_merma": False,
        "costo_merma": None,
        "minutos_espera": 22,
        "mozo_id": "00000000-0000-4000-8000-000000000103",
        "mozo_nombre": "Lucía Paredes",
        "anulado_por_id": "00000000-0000-4000-8000-000000000103",
        "anulado_por_nombre": "Lucía Paredes",
        "anulado_en": "2026-11-16T20:10:00-05:00",
        "fecha_operativa": "2026-11-16",
    }


def sobre(tipo, datos, evento_id=None, empresa_id=EMPRESA, local_id=LOCAL, version=1):
    return {
        "id": evento_id or nuevo_id(),
        "tipo": tipo,
        "version": version,
        "ocurrido_en": "2026-11-16T21:14:03-05:00",
        "origen": "nucleo",
        "empresa_id": empresa_id,
        "local_id": local_id,
        "datos": datos,
    }


def cuerpo_json(evento: dict) -> bytes:
    # Igual que el núcleo: sin espacios añadidos ni escapes de caracteres no ASCII.
    return json.dumps(evento, ensure_ascii=False, separators=(",", ":")).encode()


def cabeceras_firmadas(contenido: bytes, timestamp: int | None = None, secreto: str = SECRETO) -> dict:
    ts = str(timestamp if timestamp is not None else int(time.time()))
    return {"X-Timestamp": ts, "X-Firma": calcular_firma(ts, contenido, secreto)}


def consultar_serie(cliente, desde, hasta, local_id=LOCAL, empresa_id=EMPRESA, producto_ids=None, **kwargs):
    """GET firmado de la serie. La firma cubre la cadena de consulta tal como se envía."""
    parametros = [("empresa_id", empresa_id), ("local_id", local_id), ("desde", desde), ("hasta", hasta)]
    parametros += [("producto_ids", p) for p in producto_ids or []]
    consulta = urlencode(parametros)
    return cliente.get(
        f"/interno/series/ventas-diarias?{consulta}", headers=cabeceras_firmadas(consulta.encode(), **kwargs)
    )


def enviar(cliente, evento: dict, **kwargs):
    cuerpo = cuerpo_json(evento)
    return cliente.post(
        "/interno/eventos",
        content=cuerpo,
        headers={"Content-Type": "application/json", **cabeceras_firmadas(cuerpo, **kwargs)},
    )


# ---- JWT de las rutas públicas ----
# Par RSA generado al importar: la pública se la da el conftest al servicio y la privada firma los tokens de prueba.
_CLAVE = rsa.generate_private_key(public_exponent=65537, key_size=2048)
CLAVE_PRIVADA_PEM = _CLAVE.private_bytes(
    serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
).decode()
CLAVE_PUBLICA_PEM = (
    _CLAVE.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
)
EMISOR = "restaurantcloud-nucleo"
AUDIENCIA = "restaurantcloud-servicios"
USUARIO = "00000000-0000-4000-8000-000000000102"


def claims_jwt(rol="admin_local", empresa_id=EMPRESA, local_id=LOCAL, modulos=("prediccion", "reportes_avanzados"), **cambios):
    """Los claims que emite el núcleo (doc-2u/servicios/README.md, sección 2). `cambios` pisa o, con None, quita uno."""
    ahora = int(time.time())
    claims = {
        "iss": EMISOR,
        "aud": AUDIENCIA,
        "sub": USUARIO,
        "rol": rol,
        "empresa_id": empresa_id,
        "local_id": local_id,
        "modulos": list(modulos),
        "iat": ahora,
        "nbf": ahora,
        "exp": ahora + 600,
        "jti": nuevo_id(),
    }
    claims.update(cambios)
    return claims


def emitir_jwt(clave=None, algoritmo="RS256", **kwargs) -> str:
    """Un JWT firmado como el del núcleo. Un claim pasado como `None` en `kwargs` se omite del token."""
    claims = claims_jwt(**kwargs)
    return jwt.encode(
        {k: v for k, v in claims.items() if v is not None or k in ("empresa_id", "local_id")},
        clave or CLAVE_PRIVADA_PEM,
        algorithm=algoritmo,
        headers={"kid": "prueba"},
    )


def cabecera_bearer(token: str | None = None, **kwargs) -> dict:
    return {"Authorization": f"Bearer {token or emitir_jwt(**kwargs)}"}
