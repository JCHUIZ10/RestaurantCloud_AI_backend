# Pruebas manuales: notificaciones (etapa 7)

Lista para recorrer a mano la campana de avisos (CU-TRANS-01) y el camino que sigue hasta ella: acción en el núcleo → outbox → ms-notificaciones → MongoDB → bandeja y canal en tiempo real (SSE) → Kong → navegador. Cada prueba tiene un **paso**, lo que **debes ver** y una casilla para marcar.

Qué ya está probado y qué cubre esta lista:

- **Ya probado por código:** 226 pruebas del servicio contra MongoDB real, 234 del frontend, y `scripts/smoke-notificaciones.sh` con 129 comprobaciones (acciones reales del núcleo, bandeja y SSE por Kong, reenvío sin duplicados, aislamiento entre empresa, sede, rol y usuario, tokens y firmas fuera de regla, caída del servicio). Una revisión automática con capturas a 360, 768 y 1280 px en administración, propietario, mozo y cocina.
- **Lo que esta lista añade:** lo que solo ve una persona (si el aviso se entiende, si llama la atención sin estorbar, si el panel se siente bien), el comportamiento real del navegador (teclado, foco, varias pestañas, renovación del token del canal) y las acciones reales hechas con la aplicación, no con scripts.

| Qué | Quién la ve | Dónde |
|---|---|---|
| Campana siempre visible | Administrador de sede, propietario | Cabecera de la barra lateral (escritorio) o barra superior (tableta y teléfono) |
| Botón flotante que aparece solo con avisos sin leer | Mozo, cocina, cajero | Abajo a la derecha de la pantalla de trabajo |
| Panel de avisos de 440 px | Todos los anteriores | Se abre con la campana o con `Alt+N` |
| Sin campana | Administrador SaaS | No tiene empresa ni sede |

## 0. Preparación

**Servicios y pantalla** (desde `restaurantcloud/`):

```bash
docker compose up -d                          # todos los servicios arriba (Kong, ms-notificaciones y MongoDB incluidos)
./scripts/smoke-notificaciones.sh --rapido    # opcional: confirma que todo está sano (unos 2 minutos)
cd apps/web && npm run dev                    # la pantalla (normalmente http://localhost:5173)
```

La campana solo existe con la API real: en `apps/web/.env` debe estar `VITE_USE_REAL_API=true` (ya lo está).

**Usuarios de la semilla**

| Rol | Correo | Contraseña |
|---|---|---|
| Propietario | `propietario@aurea.local` | `propietario2026` |
| Administrador de ÁUREA | `admin@aurea.local` | `admin-local2026` |
| Mozo | `mozo@aurea.local` | `mozo2026` |
| Cocina | `cocina@aurea.local` | `cocina2026` |
| Cajero | `cajero@aurea.local` | `cajero2026` |
| Administrador SaaS | `admin@restaurantcloud.pe` | `admin-saas2026` |

**Ayudante para publicar avisos de prueba.** Para no depender de que ocurra algo real en el salón, este ayudante envía a ms-notificaciones un evento firmado, igual que lo haría el núcleo. Pégalo una vez en la terminal (Git Bash) y úsalo en las pruebas que lo piden:

```bash
publicar() { # tipo, datos JSON (ASCII o UTF-8)
  SECRETO=$(docker exec restaurantcloudIA_notificaciones printenv SECRETO_INTERNO) python - "$1" "$2" <<'PY'
import datetime, hashlib, hmac, json, os, sys, time, urllib.request, uuid
tipo, datos = sys.argv[1], json.loads(sys.argv[2])
ahora = datetime.datetime.now().astimezone(datetime.timezone(datetime.timedelta(hours=-5)))
hora = ahora.isoformat(timespec="seconds")
datos.setdefault("fecha", hora)
cuerpo = json.dumps({"id": str(uuid.uuid4()), "tipo": tipo, "version": 1, "ocurrido_en": hora, "origen": "nucleo",
    "empresa_id": "00000000-0000-4000-8000-000000000001", "local_id": "00000000-0000-4000-8000-000000000010",
    "datos": datos}).encode()
ts = str(int(time.time()))
firma = hmac.new(os.environ["SECRETO"].encode(), ts.encode() + b"." + cuerpo, hashlib.sha256).hexdigest()
pedido = urllib.request.Request("http://localhost:8003/interno/eventos", data=cuerpo,
    headers={"Content-Type": "application/json", "X-Timestamp": ts, "X-Firma": firma})
try:
    print(tipo, urllib.request.urlopen(pedido).status)
except urllib.error.HTTPError as e:
    print(tipo, e.code, e.read()[:300])
PY
}
```

Los eventos de ejemplo (cada uno lleva la marca «PRUEBA MANUAL» o «Prueba manual», para borrarlos al final):

```bash
MOZO_ID=00000000-0000-4000-8000-000000000103   # el mozo de la semilla (mozo@aurea.local)

# Crítico para cocina (sustitución urgente)
publicar pedido.item_sustituido '{"pedido_id":"3d367634-70ce-45d3-96ec-c42c5597b7a5","mesa_numero":"4","pedido_item_original_id":"5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d","pedido_item_nuevo_id":"6b7c8d9e-0f1a-4b2c-9d3e-4f5a6b7c8d9e","producto_original_nombre":"PRUEBA MANUAL Ceviche clásico","producto_nuevo_nombre":"PRUEBA MANUAL Tiradito","cantidad":1,"diferencia_monto":0,"sustituido_por_nombre":"Prueba manual"}'

# Aviso personal para el mozo (info)
publicar plato.listo '{"pedido_id":"3d367634-70ce-45d3-96ec-c42c5597b7a5","mesa_numero":"4","mozo_id":"'$MOZO_ID'","mozo_nombre":"Prueba manual","items":[{"pedido_item_id":"5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d","producto_nombre":"PRUEBA MANUAL Lomo saltado","cantidad":2}]}'

# Alerta para administrador y mozos
publicar producto.agotado '{"producto_id":"00000000-0000-4000-8000-000000000431","producto_nombre":"PRUEBA MANUAL Ceviche clásico","causa":"manual_cocina","marcado_por_nombre":"Prueba manual"}'

# Crítico para administrador y propietario (faltante de más de S/ 100)
publicar caja.cerrada '{"caja_id":"9b1e2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d","turno_correlativo":14,"cajero_nombre":"Prueba manual","efectivo_esperado":1250,"efectivo_contado":1120,"discrepancia":-130,"cierre_forzado":false}'

# Alerta para el administrador
publicar caja.turno_previo_pendiente '{"caja_id":"9b1e2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d","turno_correlativo":13,"cajero_pendiente_nombre":"Prueba manual","solicitante_id":"00000000-0000-4000-8000-000000000105","solicitante_nombre":"Prueba manual","hay_admin_local":true}'
```

Cada uno debe responder `… 202`. Si responde `422`, el mensaje dice qué campo falla; si responde `401`, el secreto no coincide (corre el humo, que lo comprueba).

**Navegador:** abre F12. En la pestaña **Consola** no debe aparecer **ningún error rojo** en ninguna prueba. Para los tamaños usa el modo dispositivo (Ctrl+Shift+M).

**Un cuidado:** los avisos son por rol y sede. Todo lo que publiques con el ayudante lo verá **cualquiera** que entre con ese rol en ÁUREA Miraflores. Al terminar, corre la limpieza de la sección N.

## A. La campana en cada rol

Usa una ventana de incógnito por rol, o cierra sesión entre una prueba y otra. Antes de empezar, limpia (sección N) para que no haya avisos.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| A1 | Entrar como **administrador** | Una campana en la cabecera de la barra lateral, junto al nombre «RestaurantCloud», **sin número** (no hay avisos) | ☐ |
| A2 | Entrar como **propietario** | La misma campana en la cabecera de su barra lateral, sin número | ☐ |
| A3 | Entrar como **mozo** | **No** se ve ninguna campana: sin avisos sin leer, el botón flotante no ocupa sitio | ☐ |
| A4 | Entrar como **cocina** | Lo mismo: ninguna campana en la pantalla del KDS | ☐ |
| A5 | Entrar como **cajero** | Lo mismo en la pantalla de caja | ☐ |
| A6 | Entrar como **administrador SaaS** (`admin@restaurantcloud.pe`) | **Ninguna** campana: no tiene empresa ni sede. En F12 → Red no aparece ninguna llamada a `notificaciones` | ☐ |
| A7 | Como mozo, publicar el aviso `plato.listo` (ayudante) y mirar la pantalla | **Sin recargar**, el botón redondo aparece abajo a la derecha con la insignia «1» y entra con una animación breve. Arriba a la derecha flota un aviso discreto «Pedido listo: Mesa 4» | ☐ |
| A8 | Como administrador, publicar `producto.agotado` | La insignia de la campana muestra «1» (no hace falta recargar) | ☐ |
| A9 | Con el administrador, publicar `caja.cerrada` (crítico) | La insignia pasa a «2» y se ve **roja** (con un aviso crítico pendiente); con solo avisos normales es **cobre** | ☐ |
| A10 | Publicar 8 avisos más (repite el comando) | La insignia muestra «9+» al pasar de 9 | ☐ |
| A11 | Como administrador en **tableta (768 px)** y en **teléfono (360 px)** | La campana pasa a la **barra superior**, a la derecha, y no aparece repetida en la barra lateral. En F12 → Red hay **una sola** conexión `stream` | ☐ |
| A12 | Como propietario, entrar a la administración de una de sus sedes | La campana sigue en la cabecera de la barra lateral, siempre visible | ☐ |

## B. Avisos de acciones reales (sin el ayudante)

Aquí el aviso nace de lo que hace el personal en la aplicación. Necesitas dos ventanas (por ejemplo, una de mozo y otra de cocina). Deja las dos con la **pantalla de trabajo abierta**: el aviso debe llegar solo.

| # | Quién y qué hace | Quién ve el aviso y cómo | ✔ |
|---|---|---|---|
| B1 | **Cocina** abre «Platos Agotados» y marca un plato como agotado (sin raciones en fuego) | El **administrador** ve «Plato agotado: …» (alerta) y el **mozo** también, con el botón flotante. **Cocina no** recibe su propio aviso | ☐ |
| B2 | **Mozo** abre una mesa libre, agrega un plato y envía la comanda | No genera aviso (no está en la lista de tipos). Sirve de preparación para B3 y B4 | ☐ |
| B3 | **Cocina** toma el plato en el KDS y lo marca **listo** | El **mozo de esa comanda** ve «Pedido listo: Mesa N» (info), con el aviso flotante discreto de 4 s. Otro mozo, si lo hubiera, no lo recibe: es personal | ☐ |
| B4 | **Mozo** anula ese plato **ya preparado** (indicando un motivo) | El **administrador** ve «Plato anulado antes del cobro» (alerta) y **cocina** ve «Plato anulado ya preparado» (**crítico**, con aviso flotante rojo de 6 s). El mozo no recibe nada | ☐ |
| B5 | **Mozo** anula otro plato que todavía **no** se había preparado (en cola) | Solo el **administrador** recibe «Plato anulado antes del cobro». Cocina **no** recibe el crítico (no hubo merma) | ☐ |
| B6 | **Cajero** abre turno y lo cierra contando un efectivo **distinto** al esperado, con un faltante de más de S/ 100 | **Administrador** y **propietario** ven «Cierre de caja con diferencia» (crítico). Con un faltante menor o un sobrante, la alerta es normal (no crítica) | ☐ |
| B7 | **Cajero** cierra un turno **cuadrado** (contado igual al esperado) | **No** se crea ningún aviso | ☐ |
| B8 | Un cajero intenta abrir turno cuando hay un turno anterior sin cerrar | El **administrador** recibe «Turno #N pendiente de cierre». Repetir el intento **no** crea un segundo aviso del mismo turno | ☐ |
| B9 | Anular un comprobante con nota de crédito (administrador o cajero, según la pantalla) | El **administrador** ve «Comprobante anulado» | ☐ |

En todos, el aviso debe aparecer **en pocos segundos** (normalmente entre 1 y 3: el núcleo lo envía por su cola de eventos). Anota cuánto tardó.

## C. El panel

Con la campana en el administrador y al menos 3 avisos sin leer (usa el ayudante).

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| C1 | Pulsar la campana | Se abre un panel a la derecha de **440 px** sobre la pantalla, con un fondo azul oscuro semitransparente. Título «Notificaciones» con el número de avisos sin leer. La pantalla de atrás no cambia ni cambia de ruta | ☐ |
| C2 | Mirar las pestañas | «No leídas (N)» activa y «Todas». En «Todas» el número aparece al cargarse | ☐ |
| C3 | Mirar una tarjeta | Punto azul oscuro (sin leer), etiqueta «Crítica», «Alerta» o «Info», cuánto hace («Ahora», «Hace 5 min»), título en negrita, mensaje y los botones «Ver detalle» y «Marcar leída». Los críticos sin leer tienen un fondo rosado suave | ☐ |
| C4 | Pulsar «Ver detalle» en un cierre de caja | Se despliega una tabla con el turno, cajero, esperado, contado, «Faltante de S/ 130.00» y la hora. El botón pasa a «Ocultar detalle». **La tarjeta ya figura leída** (sin punto) pero **no desaparece** de «No leídas» | ☐ |
| C5 | Pulsar «Ocultar detalle» | Se pliega la tabla | ☐ |
| C6 | Pulsar «Marcar leída» en otra tarjeta | Sale de «No leídas», el número del panel y el de la campana bajan en 1 | ☐ |
| C7 | Cambiar a «Todas» | Están todos los avisos, los leídos con la palabra «Leída» y sin punto | ☐ |
| C8 | Volver a abrir el panel (cerrar y abrir) | La tarjeta cuyo detalle se abrió en C4 **ya no está** en «No leídas» | ☐ |
| C9 | Pulsar «Marcar todas leídas» | La insignia de la campana desaparece y «No leídas» muestra «¡Estás al día!» con una marca verde, el texto «No tienes avisos pendientes…» y el botón «Ver todos los avisos» | ☐ |
| C10 | Pulsar «Ver todos los avisos» | Cambia a «Todas» con el historial | ☐ |
| C11 | **Muchos avisos:** publicar 25 avisos (repite `publicar producto.agotado …` en un bucle) y abrir «Todas» | Se ven 20 y abajo «Cargar más (5)» | ☐ |
| C12 | Pulsar «Cargar más (5)» | Se agregan los 5 restantes y el botón desaparece | ☐ |
| C13 | Como **propietario**, abrir el panel con avisos de cierre de caja | Cada tarjeta lleva una etiqueta con el **nombre de la sede** («ÁUREA Miraflores»). El administrador de sede **no** la ve (solo hay una) | ☐ |
| C14 | Pie del panel | «En vivo» con un punto verde y los atajos «Esc cierra · Alt+N» | ☐ |
| C15 | Mirar el texto de todos los avisos | Nombran a **personal** («Carlos Huamán anuló…»), **nunca a un cliente** | ☐ |

## D. Tiempo real y avisos flotantes

Dos ventanas lado a lado: **cocina** (KDS) y **mozo**. Mira la hora o cronometra.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| D1 | Con ambas ventanas abiertas, publicar `pedido.item_sustituido` | En **cocina**, en el mismo instante, un aviso flotante **rojo oscuro** arriba a la derecha con la etiqueta «Crítica», el título «Sustitución urgente: Mesa 4» y el botón «Entendido». El mozo no ve nada | ☐ |
| D2 | Mirar la barra bajo el texto del aviso crítico | Una barra cobre que se encoge hasta desaparecer en **unos 6 segundos**; al terminar, el aviso se va solo | ☐ |
| D3 | Publicar otro y pulsar «Entendido» antes de que termine | Se cierra al instante | ☐ |
| D4 | Publicar `plato.listo` (para el mozo) | En **mozo**, un aviso **blanco** más discreto («Pedido listo: Mesa 4») que dura **unos 4 segundos**. El botón redondo aparece abajo a la derecha | ☐ |
| D5 | Publicar 4 avisos seguidos | Nunca hay más de **3** avisos flotantes a la vez; los más antiguos se retiran | ☐ |
| D6 | Con un aviso flotante visible, estar escribiendo en un campo de la pantalla (o con un botón enfocado) | El aviso **no roba el foco**: sigues escribiendo; no bloquea los botones de abajo | ☐ |
| D7 | Con el panel **abierto**, publicar un aviso normal (alerta o info) | Aparece en la lista, **sin** aviso flotante | ☐ |
| D8 | Con el panel abierto, publicar un aviso **crítico** | Aparece en la lista **y** además flota (los críticos siempre se anuncian) | ☐ |
| D9 | Cronometrar la llegada de una acción real (B3 o B4) | Entre 1 y 3 segundos desde que se pulsa el botón hasta que aparece el aviso | ☐ |
| D10 | F12 → Red, filtrar `stream` | Una petición `…/notificaciones/stream` que **no termina** (queda «pendiente») con estado 200 y tipo `fetch`. Si el navegador muestra la pestaña «Respuesta» de una petición en curso, se leen `event: conectado` y, al llegar un aviso, `event: aviso` (si no la muestra, no importa: lo prueban las demás) | ☐ |
| D11 | Esperar más de 25 segundos sin hacer nada | En la respuesta del stream aparecen líneas `: latido` cada ~25 s (mantiene viva la conexión) | ☐ |

## E. Marcar como leído: por persona

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| E1 | Abrir la pantalla del administrador en **dos pestañas** (mismo usuario) | Las dos muestran la misma insignia | ☐ |
| E2 | Publicar un aviso | Llega a las **dos** pestañas | ☐ |
| E3 | En la pestaña 1, «Marcar todas leídas» | La pestaña 1 queda en cero | ☐ |
| E4 | Mirar la pestaña 2 sin tocarla | **Sigue mostrando el número** (no se entera en vivo de que se leyó en otra pestaña) | ☐ |
| E5 | En la pestaña 2, abrir el panel | La lista se recarga y todo figura leído; el número baja a cero | ☐ |
| E6 | Entrar como **administrador** y, en otra ventana, como **propietario**; publicar `caja.cerrada` y marcarlo leído en el administrador | El propietario lo sigue viendo **sin leer**: cada rol tiene su propio aviso | ☐ |

(Que un aviso leído por una persona sigue sin leer para **otra del mismo rol** lo comprueba el humo con usuarios distintos; la semilla trae un solo usuario por rol.)

## F. Teclado y foco

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| F1 | Pulsar `Alt+N` en cualquier pantalla de trabajo | Se abre el panel. Con el botón flotante **oculto** (mozo sin avisos), también se abre | ☐ |
| F2 | Pulsar `Alt+N` otra vez | Se cierra | ☐ |
| F3 | Abrir con la campana y pulsar `Esc` | Se cierra y el **foco vuelve a la campana** (anillo cobre visible) | ☐ |
| F4 | Con el panel abierto, el foco inicial | Está en el título «Notificaciones» (no hay anillo, pero el siguiente `Tab` va al primer botón) | ☐ |
| F5 | Recorrer el panel con `Tab` hasta el final y seguir | El foco **da la vuelta** dentro del panel; no se va a la pantalla de atrás. `Mayús+Tab` hace lo mismo hacia atrás | ☐ |
| F6 | Hacer clic en el fondo oscuro fuera del panel | Se cierra | ☐ |
| F7 | Inspeccionar la campana (F12 → Elementos) | `aria-label="Notificaciones, N sin leer"`, `aria-expanded` y `aria-keyshortcuts="Alt+N"` | ☐ |
| F8 | Inspeccionar el aviso flotante crítico y uno normal | El crítico: `role="alert"` y `aria-live="assertive"`. El normal: `role="status"` y `aria-live="polite"` | ☐ |
| F9 | (Opcional) Con un lector de pantalla | Al llegar un aviso crítico lo lee de inmediato; uno normal, cuando termina lo que estaba leyendo | ☐ |
| F10 | (Opcional) Activar «Reducir movimiento» en el sistema | No hay animaciones de entrada; los avisos igual aparecen y se retiran | ☐ |

## G. Fallas provocadas

**G1 a G4: el servicio de avisos caído.** Mantén abierto el panel del administrador.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| G1 | `docker stop restaurantcloudIA_notificaciones` | En segundos, el pie del panel cambia a «Sin conexión en vivo · se revisa cada 30 s» (amarillo). El resto de la aplicación sigue funcionando con normalidad | ☐ |
| G2 | Con el servicio caído, hacer una acción real (por ejemplo B1: marcar un plato agotado en cocina) | La acción **se completa sin error**. No aparece ningún aviso todavía | ☐ |
| G3 | `docker exec restaurantcloudIA_api php artisan outbox:estado` | La fila «ms-notificaciones» con una entrega pendiente y el estado «en pausa» | ☐ |
| G4 | `docker start restaurantcloudIA_notificaciones` y esperar (hasta 2 o 3 minutos) | El pie vuelve a «En vivo» y **el aviso de G2 aparece solo**, sin recargar. `outbox:estado` vuelve a «normal» | ☐ |

**G5: otras fallas.**

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| G5 | Detener MongoDB (`docker stop restaurantcloudIA_mongo`) y abrir el panel | Mensaje «No se pudieron cargar los avisos.» con el botón «Reintentar». Al encender MongoDB y pulsar «Reintentar», los avisos vuelven | ☐ |
| G6 | **Sin conexión de red:** en F12 → Red, poner «Sin conexión» un minuto y volver a «En línea» (el navegador puede tardar unos segundos en notar el corte) | El pie pasa a «Sin conexión en vivo…» y luego, al volver la red, a «En vivo». Lo que se publicó mientras tanto aparece al reconectar | ☐ |
| G7 | **Sesión vencida:** borrar `auth_token` y `refresh_token` del almacenamiento local y recargar | Te lleva al inicio de sesión; sin sesión no hay campana ni canal abierto (en F12 → Red no queda ninguna petición `stream`) | ☐ |
| G8 | Cerrar sesión con el panel abierto | Te lleva al inicio de sesión; en F12 → Red **desaparece** la petición `stream` (el canal se cierra) | ☐ |

## H. Renovación del token del canal

El JWT del canal dura 10 minutos y el servicio cierra el canal 30 segundos antes de que venza. El navegador debe renovarlo y reabrirlo **sin que se note**.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| H1 | Entrar como administrador, abrir F12 → Red (filtro `stream` y `token-servicios`) y dejar la pantalla abierta unos **9 minutos y medio** | La petición `stream` termina sola y aparece **una nueva** `POST …/auth/token-servicios` seguida de **otra** petición `stream` | ☐ |
| H2 | Mirar el pie del panel (ábrelo después del cambio) | Sigue «En vivo»; no pasó por «Sin conexión en vivo» | ☐ |
| H3 | Justo después, publicar un aviso | Llega al instante por el canal nuevo | ☐ |
| H4 | Repetir H1 dos veces más | Se renueva cada ~9,5 minutos, sin acumular conexiones (siempre **una** petición `stream` abierta) | ☐ |

## I. Seguridad

Con el administrador conectado, abre F12.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| I1 | F12 → Aplicación → Almacenamiento local | Existen `auth_token` y `refresh_token`, pero **ninguna entrada con un JWT** (nada que empiece por `eyJ`) | ☐ |
| I2 | F12 → Red → una llamada a `notificaciones` → Cabeceras | `Authorization: Bearer eyJ…` (un JWT, distinto del token de sesión). Ningún token en la **dirección** de la petición | ☐ |
| I3 | Abrir en el navegador `http://localhost:8000/api/v1/notificaciones` (sin token) | `{"message":"Unauthorized"}` | ☐ |
| I4 | Abrir `http://localhost:8000/api/v1/notificaciones/stream` | Lo mismo: 401 de Kong | ☐ |
| I5 | `curl -i -X POST http://localhost:8000/interno/eventos` | **404** de Kong: `/interno` no se expone | ☐ |
| I6 | `curl -i http://localhost:8000/health` | **404** de Kong: la salud del servicio tampoco | ☐ |
| I7 | `curl -i -X POST http://localhost:8003/interno/eventos -H "Content-Type: application/json" --data '{}'` (directo al servicio) | **401** `ERR_FIRMA_INVALIDA`: sin firma no se acepta nada | ☐ |
| I8 | Como mozo, abrir F12 → Red y reproducir un aviso del administrador (por ejemplo, un `caja.cerrada`) | El mozo **no** ve el aviso del administrador, ni en el panel ni en el flujo | ☐ |
| I9 | Entrar como **propietario** y, con la consola, intentar pedir la bandeja con `X-Local-Id` de otra empresa (`curl` con el JWT del propietario y `X-Local-Id: 00000000-0000-4000-8000-0000000000ff`) | Lista **vacía**, sin error ni datos ajenos | ☐ |

## J. Tamaños de pantalla

Repite A1, A7, C1, C4 y D1 en cada tamaño.

| # | Tamaño | Debes ver | ✔ |
|---|---|---|---|
| J1 | **360 px** (móvil) | Sin desplazamiento horizontal de la página. El panel ocupa **todo el ancho**; el botón «Marcar todas leídas» se acorta a «Todas». Los botones miden al menos 44 px de alto. El botón flotante queda abajo a la derecha, **sin tapar** el contenido esencial. Los avisos flotantes caben con 8 px de margen | ☐ |
| J2 | **768 px** (tableta) | Panel de 440 px a la derecha. La campana del administrador está en la barra superior | ☐ |
| J3 | **1280 px** (escritorio) | Panel de 440 px a la derecha; la campana del administrador en la barra lateral | ☐ |
| J4 | **1920 px o más** | El panel sigue siendo de 440 px (no se estira); el texto no se agranda | ☐ |
| J5 | Girar el dispositivo (o redimensionar) con el panel abierto | El panel se adapta sin cerrarse ni cortarse | ☐ |
| J6 | En la cocina, con el KDS oscuro | El botón flotante es **cobre** (no azul oscuro, que no se vería) y la insignia contrasta con el fondo | ☐ |

## K. Lenguaje y presentación (revisión transversal)

| # | Qué revisar | ✔ |
|---|---|---|
| K1 | Ninguna pantalla muestra palabras técnicas: JWT, SSE, Kong, token, ERR_…, outbox, evento | ☐ |
| K2 | Los montos van en soles con coma de miles y dos decimales en el detalle (`S/ 1,250.00`); los mensajes del aviso usan `S/ 1250.00` (así los envía el servicio) | ☐ |
| K3 | Sin emojis; los iconos acompañan siempre a un texto | ☐ |
| K4 | Los textos de los botones son verbos claros: «Marcar leída», «Marcar todas leídas», «Ver detalle», «Entendido», «Reintentar» | ☐ |
| K5 | Ningún aviso lleva un enlace ni cambia de pantalla al pulsarlo: se lee y se gestiona **en el mismo panel** (sin perder una comanda a medio escribir) | ☐ |
| K6 | Consola de F12 sin errores rojos durante todo el recorrido | ☐ |

## L. Datos guardados (para quien quiera mirar por dentro)

Comprueba que lo que se ve en pantalla es lo que quedó guardado. Desde `restaurantcloud/`:

```bash
# Los avisos de la prueba (sin sus ids internos)
docker exec restaurantcloudIA_mongo sh -c 'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin "$MONGO_INITDB_DATABASE" --eval "db.notificaciones.find({\$or:[{titulo:/PRUEBA MANUAL/},{mensaje:/PRUEBA MANUAL|Prueba manual/}]},{_id:0,tipo:1,severidad:1,destinatario:1,titulo:1,creada_en:1,leida_por:1}).forEach(d=>printjson(d))"'
```

| # | Qué comprobar | Debes ver | ✔ |
|---|---|---|---|
| L1 | Cada evento de los de la sección 0 | Un documento por destinatario: `caja.cerrada` → dos (`admin_local` y `propietario`); `producto.agotado` → dos (`admin_local` y `mozo`); `plato.listo` → uno, con `destinatario.tipo: "usuario"` | ☐ |
| L2 | Severidades | `caja.cerrada` con faltante de S/ 130: `critica`; sustitución urgente: `critica`; agotado y turno pendiente: `alerta`; plato listo: `info` | ☐ |
| L3 | `leida_por` de un aviso que marcaste como leído | Una entrada con tu `usuario_id` y la hora; el de otro rol, vacío | ☐ |
| L4 | `creada_en` de un aviso que llegó tarde (G4) | La hora **del hecho**, no la de cuando se encendió el servicio | ☐ |
| L5 | `expira_en` de cualquier aviso | 30 días después de `creada_en` (se borra solo, con hasta un minuto de retraso) | ☐ |
| L6 | **Reenvío sin duplicados:** `docker exec restaurantcloudIA_api php artisan outbox:reenviar-eventos --destino=ms-notificaciones --dry-run` | Si no hay entregas fallidas: «No hay entregas fallidas para ms-notificaciones con esos filtros.» (el reenvío completo con avisos que ya existían lo recorre el humo, escenario D) | ☐ |
| L7 | `docker exec restaurantcloudIA_api php artisan outbox:estado` | ms-notificaciones: pendientes 0, fallidos 0, estado «normal» | ☐ |

## M. Regresión de lo que ya existía

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| M1 | Hacer los cobros, la apertura de mesas y el KDS de siempre (sin mirar la campana) | Funcionan como antes: la etapa no cambió ninguna pantalla de trabajo | ☐ |
| M2 | Reportes de ventas (`/admin/reportes/ventas`) | Siguen cargando; la nueva ruta de Kong no afectó a las demás | ☐ |
| M3 | `./scripts/smoke-gateway.sh --rapido` y `./scripts/smoke-analitica.sh --rapido` | «Todo correcto» en los dos. Ojo: el segundo anula un comprobante de prueba, y eso es un aviso real: el administrador verá «Comprobante anulado» por S/ 76.00 (márcalo como leído) | ☐ |
| M4 | Mirar la barra lateral del administrador en escritorio | Hay **una sola** campana (la anterior, un desplegable que mostraba «Notificaciones del Local» y «Ir a Bandeja Central de Auditoría», ya no existe) | ☐ |

## N. Limpieza al terminar

Borra los avisos de la prueba (solo los que llevan la marca «PRUEBA MANUAL» o «Prueba manual»; no toca avisos reales) y restablece lo que cambiaste:

```bash
docker exec restaurantcloudIA_mongo sh -c 'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin "$MONGO_INITDB_DATABASE" --eval "print(db.notificaciones.deleteMany({\$or:[{titulo:/PRUEBA MANUAL/},{mensaje:/PRUEBA MANUAL|Prueba manual/}]}).deletedCount)"'
```

- Los avisos que nacieron de acciones **reales** (sección B) llevan nombres reales y no se borran con el comando; márcalos como leídos desde el panel, o espera a que caduquen (30 días).
- Vuelve a marcar como **disponibles** los platos que agotaste en B1.
- Si dejaste servicios apagados: `docker start restaurantcloudIA_notificaciones restaurantcloudIA_mongo`, y comprueba con `docker ps` que todos estén «healthy».
- Los comprobantes y las anulaciones reales del recorrido B son definitivos: usa mesas y platos de prueba, o recrea la base de desarrollo antes de una demostración.

## Si algo falla

1. Corre `./scripts/smoke-notificaciones.sh --rapido` (desde `restaurantcloud/`). Si **pasa**, el servicio, el outbox y Kong están bien y el problema está en la pantalla. Si **falla**, dice en qué escenario: condiciones previas, bandeja, tiempo real, reenvío, aislamiento, tokens.
2. Mira los registros: `docker logs restaurantcloudIA_notificaciones --tail 50`, `docker logs restaurantcloudIA_kong --tail 50` y `docker logs restaurantcloudIA_queue --tail 50` (el worker que entrega los eventos).
3. Si un aviso no llega: comprueba primero `outbox:estado` (¿hay entregas pendientes o fallidas?) y luego MongoDB (sección L). Si está en MongoDB pero no en pantalla, el problema es del canal o de la pantalla; si no está, es del núcleo o del servicio.
4. Si la campana no aparece en absoluto: confirma `VITE_USE_REAL_API=true`, que entraste con un rol que tiene bandeja (no el administrador SaaS) y que el mozo, cocina o cajero **tienen** avisos sin leer (si no, el botón flotante se oculta a propósito).
5. Anota el número de la prueba, lo que viste y lo que esperabas, con una captura si puedes.

**Registro de esta ronda**

| | |
|---|---|
| Fecha | |
| Navegador y versión | |
| Quién probó | |
| Pruebas con ✘ (número y qué se vio) | |
| Observaciones | |
