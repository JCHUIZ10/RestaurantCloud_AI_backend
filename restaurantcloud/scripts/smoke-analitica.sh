#!/usr/bin/env bash
# Prueba de humo de punta a punta: núcleo -> outbox -> worker -> ms-analítica.
#
# Hace lo que haría un usuario del POS, contra el Compose en marcha, y comprueba el resultado en cada
# eslabón: el cobro por la API real, la entrega del evento firmado, la venta en la base de ms-analítica y
# la serie que consume el pronóstico. Después anula el comprobante con una nota de crédito y, por último,
# apaga ms-analítica, cobra, la vuelve a encender y comprueba que el evento llega solo.
#
# Uso (desde restaurantcloud/):
#   ./scripts/smoke-analitica.sh                 # los tres escenarios
#   ./scripts/smoke-analitica.sh --rapido        # sin el escenario de caída (tarda unos segundos)
#   ./scripts/smoke-analitica.sh --levantar      # antes, docker compose up -d --build de los servicios
#   ./scripts/smoke-analitica.sh --sin-evidencias
#
# Qué deja en la base de desarrollo: la prueba usa datos reales, no una transacción que se deshaga.
#   - Crea una mesa, un producto y pedidos con el prefijo "SMOKE" (se identifican por el nombre).
#   - Los comprobantes que emite son reales y no se pueden borrar.
#   - Si no había caja abierta, abre una a nombre del cajero de la semilla y la deja abierta.
#   - ms-analítica conserva las ventas de prueba (su base es derivada: se puede vaciar con TRUNCATE).
#
# Evidencias (peticiones, respuestas y estado de las tablas) en doc-2u/evidencias/smoke-analitica/<fecha>/
# para la sección «Pruebas de integración» del informe. No se guarda ningún secreto ni token.
#
# Sale con código distinto de 0 si algún paso falla.

set -uo pipefail
# Git Bash en Windows convierte las rutas que empiezan por "/" en rutas de Windows; los contenedores no las quieren.
export MSYS_NO_PATHCONV=1

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

LEVANTAR=0
RAPIDO=0
EVIDENCIAS=1
DESPLIEGUE=${SMOKE_DESPLIEGUE:-0}
PROYECTO="${SMOKE_PROYECTO:-restaurantcloud}"
PREFIJO="${SMOKE_PREFIJO:-}"
while [ "$#" -gt 0 ]; do
    case "$1" in
        --levantar) LEVANTAR=1 ;;
        --rapido) RAPIDO=1 ;;
        --sin-evidencias) EVIDENCIAS=0 ;;
        --despliegue) DESPLIEGUE=1 ;;
        --prefijo) PREFIJO="${2:-}"; shift ;;
        -h | --help) sed -n '2,26p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Opción desconocida: $1 (use --help)"; exit 2 ;;
    esac
    shift
done

resolver_contenedor() {
    local svc=$1
    if [ -n "$PREFIJO" ]; then
        echo "${PREFIJO}${svc}"
    elif [ "$DESPLIEGUE" = 1 ]; then
        local cid
        cid=$(docker ps -a -q --filter "label=com.docker.compose.project=${PROYECTO}" --filter "label=com.docker.compose.service=${svc}" | head -n 1)
        if [ -n "$cid" ]; then
            docker inspect -f '{{.Name}}' "$cid" | sed 's#^/##'
        else
            echo "${PROYECTO}-${svc}-1"
        fi
    else
        echo "restaurantcloudIA_${svc}"
    fi
}

API=$(resolver_contenedor api)
QUEUE=$(resolver_contenedor queue)
SCHEDULER=$(resolver_contenedor scheduler)
DB=$(resolver_contenedor db)
REDIS=$(resolver_contenedor redis)
ANALITICA=$(resolver_contenedor analitica)
DB_ANALITICA=$(resolver_contenedor db-analitica)
if [ "$DESPLIEGUE" = 0 ] && [ -z "$PREFIJO" ]; then
    DB_ANALITICA=restaurantcloudIA_db_analitica
fi

if [ "$DESPLIEGUE" = 1 ]; then
    URL_API="${SMOKE_URL:-http://localhost}"
    URL_ANALITICA="http://analitica:8001"
else
    URL_API="${SMOKE_URL:-http://localhost:8080}"
    URL_ANALITICA=http://localhost:8001
fi

curl_analitica() {
    if [ "$DESPLIEGUE" = 1 ]; then
        docker exec "$API" curl "$@"
    else
        curl "$@"
    fi
}

EMPRESA=00000000-0000-4000-8000-000000000001
LOCAL=00000000-0000-4000-8000-000000000010
MOZO=00000000-0000-4000-8000-000000000103
CAJERO=00000000-0000-4000-8000-000000000105

# ------------------------------------------------------------------ utilidades

VERDE=$'\033[32m'; ROJO=$'\033[31m'; AMARILLO=$'\033[33m'; NEUTRO=$'\033[0m'
FALLOS=0
RESULTADOS=()
SERIE_ARCHIVO=$(mktemp)
ANALITICA_APAGADA_POR_EL_SCRIPT=0

titulo() { printf '\n%s== %s%s\n' "$AMARILLO" "$1" "$NEUTRO"; }
ok() { printf '  %s✔%s %s\n' "$VERDE" "$NEUTRO" "$1"; RESULTADOS+=("✔|$1"); }
mal() { printf '  %s✘%s %s\n' "$ROJO" "$NEUTRO" "$1"; FALLOS=$((FALLOS + 1)); RESULTADOS+=("✘|$1"); }
aviso() { printf '  %s!%s %s\n' "$AMARILLO" "$NEUTRO" "$1"; }
afirmar() { # descripción, esperado, actual
    if [ "$2" = "$3" ]; then ok "$1"; else mal "$1 (esperado: '$2', obtenido: '$3')"; fi
}

valor_env() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2-; }
ahora() { date +%s; }

# Consultas SQL de una sola fila/valor, sin formato.
sql_nucleo() { docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 -c "$0"' "$1"; }
sql_analitica() { docker exec "$DB_ANALITICA" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 -c "$0"' "$1"; }
sql_tabla_nucleo() { docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$0"' "$1"; }
sql_tabla_analitica() { docker exec "$DB_ANALITICA" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$0"' "$1"; }

# Espera hasta que el comando devuelva 0: esperar_hasta <segundos> <comando...>
esperar_hasta() {
    local limite=$1; shift
    local inicio; inicio=$(ahora)
    while true; do
        if "$@"; then return 0; fi
        if [ $(($(ahora) - inicio)) -ge "$limite" ]; then return 1; fi
        sleep 2
    done
}

# ------------------------------------------------------------------ evidencias

if [ "$EVIDENCIAS" = 1 ]; then
    EV="$RAIZ/../doc-2u/evidencias/smoke-analitica/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$EV"
fi
guardar() { # archivo, contenido
    [ "$EVIDENCIAS" = 1 ] && printf '%s\n' "$2" > "$EV/$1"
    return 0
}

# Si el script se interrumpe con ms-analítica apagada por él, la deja encendida.
al_salir() {
    rm -f "$SERIE_ARCHIVO"
    if [ "$ANALITICA_APAGADA_POR_EL_SCRIPT" = 1 ]; then
        docker start "$ANALITICA" > /dev/null 2>&1
    fi
    if [ -n "${TOKEN:-}" ]; then
        docker exec "$API" php artisan tinker --execute='Illuminate\Support\Facades\Redis::del("auth:session:".hash("sha256","'"$TOKEN"'"));' > /dev/null 2>&1
    fi
}
trap al_salir EXIT

# ------------------------------------------------------------------ 0. condiciones previas

titulo "0. Condiciones previas"

if ! docker info > /dev/null 2>&1; then
    mal "Docker no responde. Inicie Docker Desktop y vuelva a ejecutar."
    exit 1
fi

if [ "$LEVANTAR" = 1 ]; then
    echo "  Levantando los servicios (docker compose up -d --build)..."
    docker compose up -d --build api queue scheduler analitica > /dev/null 2>&1 || mal "docker compose up falló"
    sleep 15
fi

for contenedor in "$API" "$QUEUE" "$SCHEDULER" "$DB" "$REDIS" "$DB_ANALITICA" "$ANALITICA"; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$contenedor" 2>/dev/null)" = true ]; then
        ok "Contenedor $contenedor en ejecución"
    else
        mal "El contenedor $contenedor no está en ejecución (docker compose up -d)"
    fi
done
[ "$FALLOS" -gt 0 ] && { echo; echo "Faltan contenedores: no se puede continuar."; exit 1; }

# El worker debe escuchar la cola "eventos": con una imagen antigua solo escucha "documentos" y los eventos no salen.
if docker exec "$QUEUE" sh -c 'ps aux | grep "queue:work" | grep -v grep' | grep -q 'eventos'; then
    ok "El worker escucha la cola 'eventos'"
else
    mal "El worker no escucha la cola 'eventos': la imagen de queue está desactualizada (docker compose up -d --build api queue scheduler)"
fi

URL_ENV_API=$(docker exec "$API" printenv ANALITICA_URL)
URL_ENV_QUEUE=$(docker exec "$QUEUE" printenv ANALITICA_URL)
if [ -n "$URL_ENV_API" ] && [ -n "$URL_ENV_QUEUE" ]; then
    ok "El núcleo y el worker conocen ANALITICA_URL ($URL_ENV_API)"
else
    mal "ANALITICA_URL está vacía en api o queue: los eventos no se enviarían (recree los contenedores con docker compose up -d)"
fi

SECRETO_API=$(docker exec "$API" printenv ANALITICA_SECRETO)
SECRETO_QUEUE=$(docker exec "$QUEUE" printenv ANALITICA_SECRETO)
SECRETO_SERVICIO=$(docker exec "$ANALITICA" printenv SECRETO_INTERNO)
if [ -n "$SECRETO_SERVICIO" ] && [ "$SECRETO_API" = "$SECRETO_SERVICIO" ] && [ "$SECRETO_QUEUE" = "$SECRETO_SERVICIO" ]; then
    ok "El secreto de firma coincide en el núcleo, el worker y ms-analítica"
else
    mal "El secreto de firma no coincide (ANALITICA_SECRETO del núcleo vs SECRETO_INTERNO de ms-analítica)"
fi

afirmar "ms-analítica responde en /health" 200 "$(curl_analitica -s -o /dev/null -w '%{http_code}' "$URL_ANALITICA/health")"
afirmar "El POS (API del núcleo) responde" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$URL_API/up")"

ESTADO_INICIAL=$(docker exec "$API" php artisan outbox:estado 2>&1)
guardar "00-outbox-estado-inicial.txt" "$ESTADO_INICIAL"
if echo "$ESTADO_INICIAL" | grep -q 'en pausa'; then
    aviso "ms-analítica figura en pausa desde antes: la prueba esperará a que se reanude"
fi

[ "$FALLOS" -gt 0 ] && { echo; echo "Las condiciones previas fallaron: no se continúa."; exit 1; }

# ------------------------------------------------------------------ datos y sesión

titulo "Preparación de datos de prueba (prefijo SMOKE)"

SUFIJO=$(openssl rand -hex 3)
PRODUCTO=$(sql_nucleo "select gen_random_uuid()")
CATEGORIA=$(sql_nucleo "select gen_random_uuid()")
PISO=$(sql_nucleo "select gen_random_uuid()")
NOMBRE_PRODUCTO="SMOKE Lomo $SUFIJO"

sql_nucleo "insert into categoria_producto (id, local_id, nombre, orden, activa, created_at, updated_at)
            values ('$CATEGORIA', '$LOCAL', 'SMOKE Fondos $SUFIJO', 1, true, now(), now())" > /dev/null
sql_nucleo "insert into producto (id, categoria_id, local_id, nombre, precio, costo_estandar, disponibilidad, requiere_preparacion, activo, created_at, updated_at)
            values ('$PRODUCTO', '$CATEGORIA', '$LOCAL', '$NOMBRE_PRODUCTO', 38.00, 14.50, 'disponible', true, true, now(), now())" > /dev/null
sql_nucleo "insert into piso (id, local_id, nombre, columnas, filas, estado, created_at, updated_at)
            values ('$PISO', '$LOCAL', 'SMOKE Piso $SUFIJO', 5, 3, 'activo', now(), now())" > /dev/null
ok "Producto '$NOMBRE_PRODUCTO' creado (38.00 por unidad)"

CAJA_PREVIA=$(sql_nucleo "select count(*) from caja where local_id = '$LOCAL' and estado = 'abierta'")
if [ "$CAJA_PREVIA" = 0 ]; then
    sql_nucleo "insert into caja (id, local_id, cajero_id, monto_apertura, estado, fecha_apertura, created_at, updated_at)
                values (gen_random_uuid(), '$LOCAL', '$CAJERO', 250.00, 'abierta', now(), now(), now())" > /dev/null
    aviso "No había caja abierta: se abrió una a nombre del cajero de la semilla (queda abierta)"
else
    ok "Hay una caja abierta"
fi

TOKEN="smoke_$(openssl rand -hex 16)"
docker exec "$API" php artisan tinker --execute='Illuminate\Support\Facades\Redis::setex("auth:session:".hash("sha256","'"$TOKEN"'"), 3600, json_encode(["id"=>"'"$CAJERO"'","nombre"=>"Smoke cajero","correo"=>"smoke@aurea.local","rol"=>"cajero","empresa_id"=>"'"$EMPRESA"'","local_id"=>"'"$LOCAL"'","estado"=>"activo"]));' > /dev/null 2>&1
ok "Sesión de cajero creada (válida 1 hora)"

# Pedido servido de 2 unidades listo para cobrar (la misma preparación que usan las pruebas del núcleo).
preparar_cuenta() { # devuelve el id del pedido
    local mesa pedido
    mesa=$(sql_nucleo "select gen_random_uuid()")
    pedido=$(sql_nucleo "select gen_random_uuid()")
    sql_nucleo "insert into mesa (id, local_id, piso_id, numero, capacidad, forma, posicion_x, posicion_y, permite_union, estado, created_at, updated_at)
                values ('$mesa', '$LOCAL', '$PISO', 'SMK$(openssl rand -hex 2)', 4, 'cuadrada', 1, 1, true, 'activa', now(), now())" > /dev/null
    sql_nucleo "insert into pedido (id, local_id, mesa_id, mozo_id, numero_comanda, comensales, estado, tipo_comprobante_sugerido, medio_pago_sugerido, created_at, updated_at)
                values ('$pedido', '$LOCAL', '$mesa', '$MOZO', $((RANDOM % 4000 + 5000)), 3, 'cuenta_pedida', 'boleta', 'efectivo', now() - interval '20 minutes', now() - interval '20 minutes')" > /dev/null
    sql_nucleo "insert into pedido_item (id, pedido_id, producto_id, cantidad, precio_unitario, estado, estado_pago, numero_ronda, stock_descontado, created_at, updated_at)
                values (gen_random_uuid(), '$pedido', '$PRODUCTO', 2, 38.00, 'entregado', 'pendiente', 1, false, now() - interval '15 minutes', now() - interval '15 minutes')" > /dev/null
    echo "$pedido"
}

# POST autenticado como el cajero. Deja el código HTTP en HTTP_CODE y la respuesta en HTTP_BODY (sin archivos
# intermedios: el curl de Windows no entiende las rutas de Git Bash). Los cuerpos van en ASCII: sin tildes.
http_post() { # url, cuerpo JSON
    local salida
    salida=$(curl -s -w $'\n%{http_code}' -X POST "$1" \
        -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' -H 'Content-Type: application/json' \
        --data-binary "$2")
    HTTP_CODE=${salida##*$'\n'}
    HTTP_BODY=${salida%$'\n'*}
}

cobrar_en_el_pos() { # pedido
    http_post "$URL_API/api/v1/caja/cobrar" \
        "{\"pedido_id\":\"$1\",\"tipo_comprobante\":\"boleta\",\"medio_pago\":\"efectivo\",\"monto_recibido\":100}"
}

estado_de_entrega() { sql_nucleo "select estado from outbox_entrega where evento_id = '$1' and destino = 'ms-analitica'"; }
entrega_entregada() { [ -n "$1" ] && [ "$(estado_de_entrega "$1")" = entregado ]; }
entrega_con_fallo() { [ -n "$1" ] && [ "$(sql_nucleo "select coalesce(intentos, 0) >= 1 from outbox_entrega where evento_id = '$1' and destino = 'ms-analitica'")" = t ]; }

id_de_evento() { sql_nucleo "select id from outbox_event where tipo_evento = '$1' and agregado_id = '$2' order by created_at desc limit 1"; }

unidades_en_la_serie() { # fecha -> unidades del producto de la prueba ese día
    local consulta marca firma cuerpo
    consulta="empresa_id=$EMPRESA&local_id=$LOCAL&desde=$1&hasta=$1&producto_ids=$PRODUCTO"
    marca=$(ahora)
    firma=$(printf '%s.%s' "$marca" "$consulta" | openssl dgst -sha256 -hmac "$SECRETO_SERVICIO" | sed 's/^.* //')
    cuerpo=$(curl_analitica -s -H "X-Timestamp: $marca" -H "X-Firma: $firma" "$URL_ANALITICA/interno/series/ventas-diarias?$consulta")
    # Se llama dentro de $(...): la respuesta completa se deja en un archivo para guardarla como evidencia.
    printf '%s' "$cuerpo" > "$SERIE_ARCHIVO"
    echo "$cuerpo" | grep -o '"unidades":-\?[0-9]*' | head -1 | cut -d: -f2
}

# ------------------------------------------------------------------ A. cobro

titulo "A. Cobrar desde el POS y ver la venta en ms-analítica"

PEDIDO_A=$(preparar_cuenta)
INICIO=$(ahora)
cobrar_en_el_pos "$PEDIDO_A"
guardar "A-cobro-respuesta.json" "$HTTP_BODY"
afirmar "POST /api/v1/caja/cobrar responde 200" 200 "$HTTP_CODE"

COMPROBANTE_A=$(sql_nucleo "select id from comprobante where pedido_id = '$PEDIDO_A' and tipo <> 'nota_credito' limit 1")
if [ -z "$COMPROBANTE_A" ]; then
    mal "El cobro no generó comprobante"
else
    ok "Comprobante emitido: $COMPROBANTE_A"
    EVENTO_A=$(id_de_evento venta.registrada "$COMPROBANTE_A")
    if [ -n "$EVENTO_A" ]; then ok "El núcleo publicó venta.registrada ($EVENTO_A)"; else mal "No se publicó venta.registrada"; fi

    if esperar_hasta 90 entrega_entregada "$EVENTO_A"; then
        SEGUNDOS_A=$(($(ahora) - INICIO))
        ok "El evento se entregó a ms-analítica en ${SEGUNDOS_A} s"
        [ "$SEGUNDOS_A" -le 60 ] && ok "Dentro del minuto que pide la verificación" || mal "Tardó más de un minuto (${SEGUNDOS_A} s)"
    else
        mal "El evento no se entregó en 90 s (estado: $(estado_de_entrega "$EVENTO_A"))"
    fi

    afirmar "La venta existe en la base de ms-analítica" 1 "$(sql_analitica "select count(*) from venta where comprobante_id = '$COMPROBANTE_A'")"
    afirmar "Total de la venta en ms-analítica" 76.00 "$(sql_analitica "select total from venta where comprobante_id = '$COMPROBANTE_A'")"
    afirmar "La venta quedó vigente" vigente "$(sql_analitica "select estado from venta where comprobante_id = '$COMPROBANTE_A'")"
    JORNADA=$(sql_analitica "select fecha_operativa from venta where comprobante_id = '$COMPROBANTE_A'")
    UNIDADES=$(unidades_en_la_serie "$JORNADA")
    afirmar "La serie diaria ($JORNADA) suma las 2 unidades vendidas" 2 "$UNIDADES"
    guardar "A-serie-respuesta.json" "$(cat "$SERIE_ARCHIVO")"
    guardar "A-outbox_entrega.txt" "$(sql_tabla_nucleo "select e.tipo_evento, oe.destino, oe.estado, oe.intentos, oe.entregado_en from outbox_entrega oe join outbox_event e on e.id = oe.evento_id where e.id = '$EVENTO_A'")"
    guardar "A-venta-en-analitica.txt" "$(sql_tabla_analitica "select comprobante_id, tipo, total, estado, fecha_operativa, mozo_nombre from venta where comprobante_id = '$COMPROBANTE_A'")"
fi

# ------------------------------------------------------------------ B. anulación

titulo "B. Anular el comprobante y ver la serie corregida"

if [ -n "${COMPROBANTE_A:-}" ]; then
    http_post "$URL_API/api/v1/caja/comprobantes/$COMPROBANTE_A/nota-credito" \
        '{"motivo_codigo_sunat":"01","sustento_motivo":"Prueba de humo: anulacion del comprobante","devolucion_metodo":"efectivo"}'
    guardar "B-nota-credito-respuesta.json" "$HTTP_BODY"
    afirmar "POST .../nota-credito responde 200" 200 "$HTTP_CODE"

    EVENTO_B=$(id_de_evento comprobante.anulado "$COMPROBANTE_A")
    if [ -n "$EVENTO_B" ]; then ok "El núcleo publicó comprobante.anulado ($EVENTO_B)"; else mal "No se publicó comprobante.anulado"; fi

    if esperar_hasta 90 entrega_entregada "$EVENTO_B"; then ok "La anulación se entregó a ms-analítica"; else mal "La anulación no se entregó en 90 s"; fi
    afirmar "La venta quedó anulada en ms-analítica" anulada "$(sql_analitica "select estado from venta where comprobante_id = '$COMPROBANTE_A'")"
    afirmar "La serie diaria ($JORNADA) volvió a 0 unidades" 0 "$(unidades_en_la_serie "$JORNADA")"
    guardar "B-serie-respuesta.json" "$(cat "$SERIE_ARCHIVO")"
    guardar "B-outbox_entrega.txt" "$(sql_tabla_nucleo "select e.tipo_evento, oe.destino, oe.estado, oe.intentos, oe.entregado_en from outbox_entrega oe join outbox_event e on e.id = oe.evento_id where e.id = '$EVENTO_B'")"
    guardar "B-venta-en-analitica.txt" "$(sql_tabla_analitica "select comprobante_id, total, estado, anulada_en from venta where comprobante_id = '$COMPROBANTE_A'")"
else
    mal "Se omite la anulación porque el escenario A no generó comprobante"
fi

# ------------------------------------------------------------------ C. caída y reintento

if [ "$RAPIDO" = 1 ]; then
    titulo "C. Caída de ms-analítica y reintento (omitido con --rapido)"
else
    titulo "C. Apagar ms-analítica, cobrar, encenderla y ver que el evento llega por reintento"

    docker stop "$ANALITICA" > /dev/null && ANALITICA_APAGADA_POR_EL_SCRIPT=1
    ok "ms-analítica apagada"

    PEDIDO_C=$(preparar_cuenta)
    cobrar_en_el_pos "$PEDIDO_C"
    guardar "C-cobro-respuesta.json" "$HTTP_BODY"
    afirmar "El POS cobra con normalidad aunque ms-analítica esté caída (HTTP)" 200 "$HTTP_CODE"

    COMPROBANTE_C=$(sql_nucleo "select id from comprobante where pedido_id = '$PEDIDO_C' and tipo <> 'nota_credito' limit 1")
    EVENTO_C=$(id_de_evento venta.registrada "$COMPROBANTE_C")
    if [ -z "$EVENTO_C" ]; then
        mal "No se publicó venta.registrada durante la caída"
    else
        if esperar_hasta 60 entrega_con_fallo "$EVENTO_C"; then
            FILA=$(sql_nucleo "select estado || '|' || coalesce(motivo_fallo, '') || '|' || fallos_receptor from outbox_entrega where evento_id = '$EVENTO_C' and destino = 'ms-analitica'")
            afirmar "La entrega queda pendiente, por destino no disponible y sin gastar intentos" "pendiente|no_disponible|0" "$FILA"
        else
            mal "El worker no intentó la entrega en 60 s"
        fi
        ESTADO_CAIDA=$(docker exec "$API" php artisan outbox:estado 2>&1)
        guardar "C-outbox-estado-durante-la-caida.txt" "$ESTADO_CAIDA"
        if echo "$ESTADO_CAIDA" | grep -q 'en pausa'; then ok "outbox:estado muestra el destino en pausa"; else mal "outbox:estado no muestra la pausa del destino"; fi
        afirmar "La venta todavía no está en ms-analítica" 0 "$(sql_analitica "select count(*) from venta where comprobante_id = '$COMPROBANTE_C'")"

        docker start "$ANALITICA" > /dev/null && ANALITICA_APAGADA_POR_EL_SCRIPT=0
        REANUDACION=$(ahora)
        ok "ms-analítica encendida de nuevo"

        if esperar_hasta 240 entrega_entregada "$EVENTO_C"; then
            ok "El evento llegó solo, $(($(ahora) - REANUDACION)) s después de encender el servicio"
        else
            mal "El evento no llegó en 240 s tras encender ms-analítica (estado: $(estado_de_entrega "$EVENTO_C"))"
        fi
        afirmar "La venta existe ahora en ms-analítica" 1 "$(sql_analitica "select count(*) from venta where comprobante_id = '$COMPROBANTE_C'")"
        afirmar "La entrega no quedó contada como fallo del receptor" 0 "$(sql_nucleo "select fallos_receptor from outbox_entrega where evento_id = '$EVENTO_C' and destino = 'ms-analitica'")"
        afirmar "El destino volvió a estado normal" 1 "$(docker exec "$API" php artisan outbox:estado 2>&1 | grep -c 'ms-analitica.*normal')"
        guardar "C-outbox_entrega.txt" "$(sql_tabla_nucleo "select e.tipo_evento, oe.destino, oe.estado, oe.intentos, oe.fallos_receptor, oe.motivo_fallo, oe.entregado_en from outbox_entrega oe join outbox_event e on e.id = oe.evento_id where e.id = '$EVENTO_C'")"
        guardar "C-venta-en-analitica.txt" "$(sql_tabla_analitica "select comprobante_id, total, estado, recibido_en from venta where comprobante_id = '$COMPROBANTE_C'")"
    fi
fi

# ------------------------------------------------------------------ resumen

titulo "Resumen"
ESTADO_FINAL=$(docker exec "$API" php artisan outbox:estado 2>&1)
guardar "99-outbox-estado-final.txt" "$ESTADO_FINAL"
guardar "99-ms-analitica-logs.txt" "$(docker logs --tail 60 "$ANALITICA" 2>&1)"

TOTAL=${#RESULTADOS[@]}
if [ "$EVIDENCIAS" = 1 ]; then
    {
        echo "# Prueba de humo: núcleo → ms-analítica"
        echo
        echo "- **Fecha:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo "- **Producto de la prueba:** $NOMBRE_PRODUCTO"
        echo "- **Resultado:** $((TOTAL - FALLOS)) de $TOTAL comprobaciones correctas"
        echo
        echo "| | Comprobación |"
        echo "|---|---|"
        for fila in "${RESULTADOS[@]}"; do echo "| ${fila%%|*} | ${fila#*|} |"; done
    } > "$EV/resumen.md"
    echo "  Evidencias en: $EV"
fi

echo
if [ "$FALLOS" = 0 ]; then
    printf '%sTodo correcto: %d comprobaciones.%s\n' "$VERDE" "$TOTAL" "$NEUTRO"
    exit 0
fi
printf '%s%d de %d comprobaciones fallaron.%s\n' "$ROJO" "$FALLOS" "$TOTAL" "$NEUTRO"
exit 1
