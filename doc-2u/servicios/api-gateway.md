# API Gateway (Kong)

Reglas comunes: [README.md](README.md).

## 1. Identificación

| | |
|---|---|
| **Responsabilidad** | Punto de entrada único de la API para el navegador: enruta, valida el JWT de las rutas de microservicios, limita peticiones, gestiona CORS y asigna `X-Request-Id` |
| **Tecnología** | Kong OSS 3.9.1 (`kong:3.9.1`) en modo sin base de datos; la configuración es un archivo declarativo versionado; sin API de administración |
| **Código** | `restaurantcloud/infra/kong` |
| **Puerto local** | 8000 |

## 2. Rutas

| Prefijo | Destino | Validación en el gateway |
|---|---|---|
| `/api/v1/analitica` | ms-analítica (`analitica:8001`, sin recortar el prefijo) | JWT |
| `/api/v1/notificaciones` | ms-notificaciones (`notificaciones:8003`, sin recortar el prefijo) | JWT |
| `/api/v1` (resto) | Núcleo Laravel (`api:8080`) | Ninguna: Laravel valida su propio token |
| `/up` | Núcleo Laravel | Ninguna |

No se exponen: ms-pronóstico ni ninguna ruta `/interno`. Una ruta que no coincide con ningún prefijo responde 404 desde Kong sin llegar a un servicio.

El frontend no pasa por Kong: en desarrollo lo sirve Vite (que reenvía `/api` a Kong) y en producción, Caddy.

## 3. Políticas

| Política | Plugin | Alcance | Valor |
|---|---|---|---|
| Validación de JWT | `jwt` | Rutas de microservicios | RS256; el claim `iss` identifica la credencial (consumidor `nucleo`); verifica `exp` y `nbf`; solo acepta el token en la cabecera `Authorization`; rechaza tokens con más de 15 minutos de vida restante (`maximum_expiration = 900`) |
| Límite de peticiones | `rate-limiting` | Global, por IP | 1 200 por minuto (un restaurante tiene varias tabletas tras una misma IP); política `local` |
| Límite de peticiones | `rate-limiting` | Rutas de microservicios, por IP | 120 por minuto |
| CORS | `cors` | Global | Orígenes de `KONG_CORS_ORIGENES`; cabeceras `Authorization`, `Content-Type`, `Accept`, `X-Local-Id`, `X-Request-Id`; expone `X-Request-Id`. Con un solo origen configurado, Kong lo envía en toda respuesta: un origen distinto recibe un valor que no coincide con el suyo y el navegador bloquea la respuesta |
| `X-Request-Id` | `correlation-id` | Global | Genera un UUID si la petición no lo trae y lo devuelve en la respuesta |
| Tiempos de espera | Propiedades del servicio | Cada servicio | **ms-analítica:** conexión 3 s, lectura y escritura 30 s, 1 reintento. **Núcleo:** conexión 5 s, lectura y escritura 120 s (calcular un pronóstico puede tardar y el frontend espera hasta 90 s), 1 reintento. **ms-notificaciones:** dos servicios de Kong con el mismo destino, porque los tiempos son del servicio: la bandeja (conexión 3 s, lectura y escritura 30 s, 1 reintento) y el canal SSE (lectura 16 min, sin reintentos). Un servicio caído da un 504 en unos 6 s en vez de colgar la petición |
| Canal SSE | Ruta propia `/api/v1/notificaciones/stream` | Flujo de avisos | Sin búfer de respuesta (`response_buffering = false`, además del `X-Accel-Buffering: no` del servicio) y lectura de hasta 16 minutos: el servicio cierra el canal al vencer el JWT (15 minutos como máximo), así que el gateway nunca lo corta antes. Sin reintentos, para no abrir dos canales. La ruta lleva el mismo `jwt`, `cors` y `correlation-id` que las demás |
| Tiempos de espera de ms-notificaciones | Propiedades del servicio | Resto de rutas de notificaciones | Conexión 3 s, lectura y escritura 30 s, 1 reintento, como ms-analítica |

**Qué valida Kong y qué valida el servicio.** Kong comprueba la firma y la caducidad, para que un token falso no llegue a consumir recursos del servicio. El servicio vuelve a validar firma, emisor, audiencia, caducidad y claims (defensa en profundidad: el servicio no confía en que la petición haya pasado por Kong).

**Respuestas propias de Kong.** Los 401 (`{"message": "Unauthorized"}`, `"token expired"`…), 404 y 429 de Kong no siguen el formato común de [README.md](README.md). El frontend trata cualquier 401 de un microservicio igual: renueva el JWT una vez y repite la petición.

## 4. Configuración

La clave pública cambia por entorno y no va al repositorio: al arrancar, `infra/kong/arrancar.sh` ejecuta `generar-config.lua`, que completa `kong.yml.plantilla` con el entorno (cada valor como cadena JSON, válida en YAML, así que una clave PEM de varias líneas no rompe el archivo), la valida con `kong config parse` y arranca Kong. Si falta `JWT_PUBLIC_KEY`, si no es un PEM o si la plantilla usa una variable desconocida, Kong **no arranca**: nunca queda en marcha sin validar tokens.

| Variable | Descripción |
|---|---|
| `JWT_PUBLIC_KEY` | Clave pública PEM con la que Kong valida la firma; la misma del núcleo |
| `JWT_EMISOR` | Valor del claim `iss` (`restaurantcloud-nucleo`); es la clave de la credencial en Kong |
| `KONG_CORS_ORIGENES` | Orígenes permitidos, separados por coma |
| `KONG_PORT` | Puerto publicado (8000) |

## 5. Decisiones

- **Caddy delante de Kong en producción.** Caddy termina HTTPS (certificados automáticos), sirve la SPA y reenvía `/api/*` a Kong. Kong no obtiene certificados por sí solo en la edición OSS. Se implementa en la etapa 8; en local, Vite cumple el papel de Caddy.
- **Tiempos de espera explícitos (etapa 6.6).** Por defecto Kong espera 60 s para conectar y reintenta 5 veces. La prueba de humo apagó ms-analítica y la petición no respondió en 30 s: con el contenedor detenido, su dirección deja de contestar y Kong esperaba ese tiempo en cada intento. Con los valores de la sección 3 la misma caída da un 504 en unos 6 s y la pantalla puede mostrar su mensaje de «servicio no disponible». La lectura del núcleo es larga a propósito, para no cortar un pronóstico en cálculo.
- **El límite de peticiones y el canal SSE.** El límite de 120 por minuto por IP cuenta cada apertura del canal como una petición; el canal abierto no consume más. Con la reconexión cada ~10 minutos (renovación del JWT) y varias pestañas por IP, queda lejos del límite. El marcado de avisos y el contador sí cuentan; el sondeo de respaldo (cada 30 s) son 2 por minuto por pestaña.
- **Kong no reescribe errores.** Hacerlo requiere plugins de la edición Enterprise; se documenta la diferencia de formato.
- **La IP del cliente** llega a Laravel por `X-Forwarded-For`, que Kong agrega. El bloqueo de login por IP del núcleo depende de ello. **Hueco verificado (etapa 6.4):** Kong deja pasar el `X-Forwarded-For` que manda el propio cliente y Laravel, con `trustProxies(at: '*')`, toma el primero de la lista, así que un cliente que llega directo a Kong puede elegir la IP que ve el núcleo y eludir el bloqueo de 3 intentos. En producción no se publica el puerto de Kong y Caddy queda delante; Caddy, por defecto, no confía en el `X-Forwarded-For` que manda el cliente, lo que hay que comprobar al montarlo en la etapa 8. La corrección del lado del núcleo (confiar solo en los proxies de la red interna) es de la etapa 9.
- **Kong no lleva el `X-Request-Id` a los logs de los servicios que no escriben líneas de acceso.** Lo genera o respeta y lo devuelve; ms-analítica solo lo registra en las líneas que escribe (errores). Más observabilidad es de la Unidad III.
