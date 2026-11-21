"""Validación del JWT de las rutas públicas (doc-2u/servicios/README.md, sección 2).

El núcleo emite el token (RS256) y este módulo solo lo valida con la clave pública. Kong ya comprobó
firma y caducidad; aquí se vuelve a validar todo y se resuelve la sede, porque el servicio no debe
confiar en que la petición haya pasado por el gateway. Cada servicio toma `empresa_id`, `local_id`,
`rol` y `modulos` del token, nunca del cuerpo ni de la URL.

Depende solo de `config` y `respuestas` de la capa `soporte`, para poder copiarse a otro servicio.
"""

from collections.abc import Callable
from dataclasses import dataclass
from uuid import UUID

import jwt
from fastapi import Depends, Header

from app.config import get_settings
from app.soporte.respuestas import ErrorApi

ALGORITMO = "RS256"
CLAIMS_OBLIGATORIOS = ("exp", "nbf", "iss", "aud", "sub", "rol", "empresa_id")


@dataclass(frozen=True)
class Sesion:
    """Lo que el servicio sabe de quien llama, ya validado."""

    usuario_id: str
    rol: str
    empresa_id: UUID | None
    local_id: UUID | None
    modulos: frozenset[str]


@dataclass(frozen=True)
class Contexto:
    """Sesión validada con la sede sobre la que se consulta. `empresa_id` nunca es nulo."""

    sesion: Sesion
    empresa_id: UUID
    local_id: UUID


def _token_invalido(motivo: str) -> ErrorApi:
    return ErrorApi(401, "ERR_TOKEN_INVALIDO", motivo)


def _clave_publica() -> str:
    clave = get_settings().jwt_public_key
    if not clave or not clave.strip():
        raise ErrorApi(503, "ERR_JWT_NO_CONFIGURADO", "El servicio no tiene configurada la clave pública del token.")
    return clave.replace("\\n", "\n").strip()


def _uuid_o_none(valor: object, campo: str) -> UUID | None:
    if valor is None:
        return None
    try:
        return UUID(str(valor))
    except ValueError:
        raise _token_invalido(f"El claim {campo} no es un identificador válido.") from None


def verificar_jwt(token: str) -> Sesion:
    """Valida firma RS256, emisor, audiencia, vigencia y claims. Lanza ErrorApi (401 o 503)."""
    settings = get_settings()
    try:
        claims = jwt.decode(
            token,
            _clave_publica(),
            algorithms=[ALGORITMO],  # fijo: un token con otro `alg` (none, HS256) se rechaza
            audience=settings.jwt_audiencia,
            issuer=settings.jwt_emisor,
            leeway=settings.jwt_tolerancia_segundos,
            options={"require": list(CLAIMS_OBLIGATORIOS)},
        )
    except jwt.ExpiredSignatureError:
        raise ErrorApi(401, "ERR_TOKEN_EXPIRADO", "El token caducó; renuévalo e intenta de nuevo.") from None
    except jwt.InvalidKeyError:
        raise ErrorApi(503, "ERR_JWT_NO_CONFIGURADO", "La clave pública del token no es válida.") from None
    except jwt.InvalidTokenError as error:
        raise _token_invalido(f"El token no es válido ({type(error).__name__}).") from None
    except ValueError:
        # Una clave pública mal formada es un error de despliegue, no del cliente.
        raise ErrorApi(503, "ERR_JWT_NO_CONFIGURADO", "La clave pública del token no es válida.") from None

    if not isinstance(claims["rol"], str) or not isinstance(claims["sub"], str):
        raise _token_invalido("Los claims sub y rol deben ser texto.")
    modulos = claims.get("modulos", [])
    if not isinstance(modulos, list) or not all(isinstance(m, str) for m in modulos):
        raise _token_invalido("El claim modulos no es válido.")

    return Sesion(
        usuario_id=claims["sub"],
        rol=claims["rol"],
        empresa_id=_uuid_o_none(claims["empresa_id"], "empresa_id"),
        local_id=_uuid_o_none(claims.get("local_id"), "local_id"),
        modulos=frozenset(modulos),
    )


def sesion_autenticada(authorization: str | None = Header(default=None)) -> Sesion:
    """Dependencia de FastAPI: exige `Authorization: Bearer <JWT>` válido."""
    if not authorization:
        raise _token_invalido("Falta el token de autorización.")
    esquema, _, token = authorization.partition(" ")
    if esquema.lower() != "bearer" or not token.strip():
        raise _token_invalido("La cabecera Authorization debe ser Bearer <token>.")
    return verificar_jwt(token.strip())


def contexto_de_sede(roles: tuple[str, ...], modulo: str | None = None) -> Callable[..., Contexto]:
    """Dependencia para una ruta de datos de una sede.

    Orden de las comprobaciones: token válido (401), rol (403), módulo del plan (403) y sede.
    La sede es la del token; si el token no trae (propietario), la de `X-Local-Id`. Quien tiene sede
    en el token no puede pedir otra. Toda consulta debe filtrar además por `contexto.empresa_id`, así
    que una sede de otra empresa se ve igual que una sede sin ventas.
    """

    def resolver(
        sesion: Sesion = Depends(sesion_autenticada),
        x_local_id: str | None = Header(default=None),
    ) -> Contexto:
        if sesion.rol not in roles:
            raise ErrorApi(403, "ERR_ROL_NO_PERMITIDO", "Tu rol no puede consultar este recurso.")
        if modulo is not None and modulo not in sesion.modulos:
            raise ErrorApi(403, "ERR_MODULO_NO_INCLUIDO", "El plan de tu empresa no incluye este módulo.", {"modulo": modulo})
        if sesion.empresa_id is None:
            raise _token_invalido("El token no trae empresa.")

        pedida: UUID | None = None
        if x_local_id:
            try:
                pedida = UUID(x_local_id)
            except ValueError:
                raise ErrorApi(422, "ERR_VALIDACION", "X-Local-Id no es un identificador válido.") from None

        if sesion.local_id is not None:
            if pedida is not None and pedida != sesion.local_id:
                raise ErrorApi(403, "ERR_SEDE_NO_PERMITIDA", "No puedes consultar otra sede.")
            local_id = sesion.local_id
        elif pedida is not None:
            local_id = pedida
        else:
            raise ErrorApi(422, "ERR_SEDE_REQUERIDA", "Indica la sede con la cabecera X-Local-Id.")

        return Contexto(sesion=sesion, empresa_id=sesion.empresa_id, local_id=local_id)

    return resolver
