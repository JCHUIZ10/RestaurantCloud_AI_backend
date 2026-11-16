# API Gateway (Kong)

Reglas comunes: [README.md](README.md).

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Punto de entrada único para el navegador: enruta, valida el JWT de las rutas de microservicios, limita peticiones y gestiona CORS |
| **Tecnología** | Kong en modo sin base de datos; la configuración es un archivo declarativo versionado |
| **Código** | `restaurantcloud/infra/kong` |
| **Puerto local** | 8000 |

## 2. Rutas

| Prefijo | Destino | Validación en el gateway |
|---|---|---|
| `/api/v1/analitica` | ms-analítica | JWT |
| `/api/v1/notificaciones` | ms-notificaciones | JWT |
| `/api/v1` (resto) | Núcleo Laravel | Ninguna: Laravel valida su propio token |
| `/` | Frontend web | Ninguna |

No se exponen: ms-pronóstico ni ninguna ruta `/interno`.

## 3. Políticas

| Política | Alcance |
|---|---|
| Validación de JWT (RS256) | Rutas de microservicios |
| Límite de peticiones por cliente | Todas las rutas |
| CORS | Todas las rutas |
| `X-Request-Id` | Lo genera si la petición no lo trae |
| Sin almacenamiento en búfer | `/api/v1/notificaciones/stream` (SSE) |

## 4. Decisiones abiertas

- Relación con Caddy, que hoy termina HTTPS en `docker-compose.prod.yml`: Caddy delante de Kong, o Kong solo.
- Valores del límite de peticiones.
