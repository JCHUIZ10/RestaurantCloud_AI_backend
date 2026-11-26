#!/usr/bin/env bash
# Prueba de humo de punta a punta: núcleo -> ms-pronóstico -> ms-analítica -> reposición.
#
# Hace lo que haría un usuario de la aplicación, contra el Compose en marcha, y comprueba el resultado en cada
# eslabón: la firma entre servicios, el modelo vigente, el pronóstico de un local con historial (ÁUREA), la
# fórmula de la reposición, las decisiones (también en lote y todo-o-nada), la lista de compra en Excel y PDF,
# la vista del propietario, un local nuevo sin ventas (nivel 0) y la caída de ms-pronóstico.
#
# Uso (desde restaurantcloud/):
#   ./scripts/smoke-pronostico.sh                    # todo
#   ./scripts/smoke-pronostico.sh --rapido           # sin el escenario de caída de ms-pronóstico
#   ./scripts/smoke-pronostico.sh --levantar         # antes, docker compose up -d --build de los servicios
#   ./scripts/smoke-pronostico.sh --sin-extender     # no completa el histórico sintético hasta ayer (solo avisa)
#   ./scripts/smoke-pronostico.sh --conservar        # no borra lo que la prueba creó (para investigar un fallo)
#   ./scripts/smoke-pronostico.sh --sin-evidencias
#
# Qué deja en la base de desarrollo (y cómo lo resuelve):
#   - Al terminar BORRA lo que creó: la sede "SMOKE Sede ..." con su carta e insumos, y los pronósticos, las
#     recomendaciones y las decisiones de esta ejecución (también en ms-pronóstico). Con --conservar se queda.
#   - Si el histórico sintético de ms-analítica no llega hasta ayer, lo completa con el mismo comando, perfil y
#     semilla de siempre (es determinista y no duplica). Sin eso los días nuevos llegarían en 0 y se tomarían por
#     cierres. Con --sin-extender solo lo avisa.
#   - No necesita contraseñas: crea sesiones temporales en Redis y las borra al salir.
#
# Evidencias (peticiones, respuestas, archivos y tablas) en doc-2u/evidencias/smoke-pronostico/<fecha>/, carpeta
# que no se versiona, para la sección «Pruebas de integración» del informe. No se guarda ningún secreto ni token.
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
EXTENDER=1
CONSERVAR=0
DESPLIEGUE=${SMOKE_DESPLIEGUE:-0}
PROYECTO="${SMOKE_PROYECTO:-restaurantcloud}"
PREFIJO="${SMOKE_PREFIJO:-}"
while [ "$#" -gt 0 ]; do
    case "$1" in
        --levantar) LEVANTAR=1 ;;
        --rapido) RAPIDO=1 ;;
        --sin-extender) EXTENDER=0 ;;
        --conservar) CONSERVAR=1 ;;
        --sin-evidencias) EVIDENCIAS=0 ;;
        --despliegue) DESPLIEGUE=1 ;;
        --prefijo) PREFIJO="${2:-}"; shift ;;
        -h | --help) sed -n '2,31p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
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
DB=$(resolver_contenedor db)
REDIS=$(resolver_contenedor redis)
ANALITICA=$(resolver_contenedor analitica)
DB_ANALITICA=$(resolver_contenedor db-analitica)
PRONOSTICO=$(resolver_contenedor pronostico)
DB_PRONOSTICO=$(resolver_contenedor db-pronostico)
if [ "$DESPLIEGUE" = 0 ] && [ -z "$PREFIJO" ]; then
    DB_ANALITICA=restaurantcloudIA_db_analitica
    DB_PRONOSTICO=restaurantcloudIA_db_pronostico
fi

if [ "$DESPLIEGUE" = 1 ]; then
    URL_API="${SMOKE_URL:-http://localhost}"
    URL_PRONOSTICO="http://pronostico:8002"
else
    URL_API="${SMOKE_URL:-http://localhost:8080}"
    URL_PRONOSTICO=http://localhost:8002
fi

curl_pronostico() {
    if [ "$DESPLIEGUE" = 1 ]; then
        docker exec "$API" curl "$@"
    else
        curl "$@"
    fi
}

EMPRESA=00000000-0000-4000-8000-000000000001
LOCAL=00000000-0000-4000-8000-000000000010
PROPIETARIO=00000000-0000-4000-8000-000000000101
ADMIN=00000000-0000-4000-8000-000000000102
CAJERO=00000000-0000-4000-8000-000000000105

# ------------------------------------------------------------------ utilidades

VERDE=$'\033[32m'; ROJO=$'\033[31m'; AMARILLO=$'\033[33m'; NEUTRO=$'\033[0m'
FALLOS=0
RESULTADOS=()
TOKENS=()
TMP=$(mktemp -d)
PRONOSTICO_APAGADO_POR_EL_SCRIPT=0
SEDE_NUEVA=""
INICIO=""

titulo() { printf '\n%s== %s%s\n' "$AMARILLO" "$1" "$NEUTRO"; }
ok() { printf '  %s✔%s %s\n' "$VERDE" "$NEUTRO" "$1"; RESULTADOS+=("✔|$1"); }
mal() { printf '  %s✘%s %s\n' "$ROJO" "$NEUTRO" "$1"; FALLOS=$((FALLOS + 1)); RESULTADOS+=("✘|$1"); }
aviso() { printf '  %s!%s %s\n' "$AMARILLO" "$NEUTRO" "$1"; }
afirmar() { # descripción, esperado, actual
    if [ "$2" = "$3" ]; then ok "$1"; else mal "$1 (esperado: '$2', obtenido: '$3')"; fi
}
cierto() { # descripción, resultado ("true" si se cumple)
    if [ "$2" = true ]; then ok "$1"; else mal "$1 (no se cumplió: '$2')"; fi
}

valor_env() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2-; }
ahora() { date +%s; }

psql_en() { # contenedor, modo (-At | ""), consulta
    docker exec "$1" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" '"$2"' -v ON_ERROR_STOP=1 -c "$0"' "$3"
}
sql_nucleo() { psql_en "$DB" -At "$1"; }
sql_analitica() { psql_en "$DB_ANALITICA" -At "$1"; }
sql_pronostico() { psql_en "$DB_PRONOSTICO" -At "$1"; }
sql_tabla_nucleo() { psql_en "$DB" "" "$1"; }
sql_tabla_pronostico() { psql_en "$DB_PRONOSTICO" "" "$1"; }

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

# Evalúa código PHP sobre la respuesta JSON (variable $d) dentro del contenedor del núcleo, sin depender de jq ni de
# Python en la máquina. Si el código devuelve un arreglo asociativo imprime una línea clave=valor por entrada; si
# devuelve un escalar, lo imprime. Uso: php_eval "$JSON" 'return $d["datos"]["nivel"];'
read -r -d '' EJECUTOR_PHP <<'FIN'
[$c, $j] = explode("\n@@@\n", stream_get_contents(STDIN), 2);
$d = json_decode($j, true);
$r = eval($c);
$t = fn ($v) => is_bool($v) ? ($v ? 'true' : 'false') : (is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (string) $v);
if (is_array($r) && array_is_list($r) === false) { foreach ($r as $k => $v) { echo $k . '=' . $t($v) . "\n"; } }
else { echo $t($r); }
FIN
php_eval() { printf '%s\n@@@\n%s' "$2" "$1" | docker exec -i "$API" php -r "$EJECUTOR_PHP"; }

# Lee las líneas clave=valor de php_eval en el arreglo asociativo H.
declare -A H
hechos() { # json, código PHP
    H=()
    local linea
    while IFS= read -r linea; do
        [ -n "$linea" ] && H["${linea%%=*}"]="${linea#*=}"
    done < <(php_eval "$1" "$2")
}

# ------------------------------------------------------------------ evidencias

if [ "$EVIDENCIAS" = 1 ]; then
    EV="$RAIZ/../doc-2u/evidencias/smoke-pronostico/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$EV"
fi
guardar() { # archivo, contenido
    [ "$EVIDENCIAS" = 1 ] && printf '%s\n' "$2" > "$EV/$1"
    return 0
}
guardar_json() { # archivo, json (con sangría y sin token)
    [ "$EVIDENCIAS" = 1 ] && php_eval "$2" 'return json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);' > "$EV/$1"
    return 0
}

# ------------------------------------------------------------------ limpieza al salir

# Borra lo que esta ejecución creó (solo lo posterior a INICIO) para que la base de desarrollo quede como estaba.
borrar_lo_creado() {
    local locales="'$LOCAL'"
    [ -n "$SEDE_NUEVA" ] && locales="$locales,'$SEDE_NUEVA'"
    sql_nucleo "delete from recomendacion_reposicion where local_id in ($locales) and created_at >= '$INICIO'" > /dev/null 2>&1
    sql_nucleo "delete from solicitud_pronostico where local_id in ($locales) and created_at >= '$INICIO'" > /dev/null 2>&1
    sql_pronostico "delete from ejecucion where local_id in ($locales) and creada_en >= '$INICIO'" > /dev/null 2>&1
    if [ -n "$SEDE_NUEVA" ]; then
        sql_nucleo "delete from producto_insumo where producto_id in (select id from producto where local_id = '$SEDE_NUEVA')" > /dev/null 2>&1
        sql_nucleo "delete from producto where local_id = '$SEDE_NUEVA'" > /dev/null 2>&1
        sql_nucleo "delete from categoria_producto where local_id = '$SEDE_NUEVA'" > /dev/null 2>&1
        sql_nucleo "delete from insumo where local_id = '$SEDE_NUEVA'" > /dev/null 2>&1
        sql_nucleo "delete from local where id = '$SEDE_NUEVA'" > /dev/null 2>&1
    fi
}

limpiar() {
    # Si el script se interrumpe con ms-pronóstico apagado por él, lo deja encendido.
    if [ "$PRONOSTICO_APAGADO_POR_EL_SCRIPT" = 1 ]; then
        docker start "$PRONOSTICO" > /dev/null 2>&1
    fi
    if [ "${#TOKENS[@]}" -gt 0 ]; then
        local codigo=""
        for t in "${TOKENS[@]}"; do
            codigo="$codigo"'Illuminate\Support\Facades\Redis::del("auth:session:".hash("sha256","'"$t"'"));'
        done
        docker exec "$API" php artisan tinker --execute="$codigo" > /dev/null 2>&1
    fi
    if [ "$CONSERVAR" = 0 ] && [ -n "$INICIO" ]; then
        borrar_lo_creado
    elif [ "$CONSERVAR" = 1 ] && [ -n "$INICIO" ]; then
        echo "  (--conservar: se dejó lo creado; sede de prueba: ${SEDE_NUEVA:-ninguna}, desde $INICIO)"
    fi
    rm -rf "$TMP"
}
trap limpiar EXIT

# ------------------------------------------------------------------ peticiones

TMPW=$(cygpath -m "$TMP" 2> /dev/null || echo "$TMP")

# Sesión temporal en Redis, como la que crea el login (válida 1 hora). Devuelve el token.
crear_sesion() { # usuario_id, nombre, correo, rol, local_id|""
    local token="smoke_$(openssl rand -hex 16)"
    local local_php="null"
    [ -n "$5" ] && local_php="'$5'"
    docker exec "$API" php artisan tinker --execute='Illuminate\Support\Facades\Redis::setex("auth:session:".hash("sha256","'"$token"'"), 3600, json_encode(["id"=>"'"$1"'","nombre"=>"'"$2"'","correo"=>"'"$3"'","rol"=>"'"$4"'","empresa_id"=>"'"$EMPRESA"'","local_id"=>'"$local_php"',"estado"=>"activo"]));' > /dev/null 2>&1
    TOKENS+=("$token")
    echo "$token"
}

# Petición a la API del núcleo. Deja el código HTTP en HTTP_CODE, la respuesta en HTTP_BODY y los segundos en SEGUNDOS.
llamar() { # método, ruta, token|"", cuerpo|"", local_id|""
    local args=(-s --max-time 150 -X "$1" "$URL_API/api/v1$2" -H 'Accept: application/json' -H 'Content-Type: application/json')
    [ -n "${3:-}" ] && args+=(-H "Authorization: Bearer $3")
    [ -n "${4:-}" ] && args+=(--data-binary "$4")
    [ -n "${5:-}" ] && args+=(-H "X-Local-Id: $5")
    local inicio salida; inicio=$(ahora)
    salida=$(curl "${args[@]}" -w $'\n%{http_code}')
    SEGUNDOS=$(($(ahora) - inicio))
    HTTP_CODE=${salida##*$'\n'}
    HTTP_BODY=${salida%$'\n'*}
}

# Descarga un archivo (Excel o PDF) a $TMP/<nombre>. Deja el código en HTTP_CODE y el Content-Type en TIPO.
descargar() { # ruta, token, local_id|"", nombre
    local args=(-s --max-time 120 -D "$TMPW/cabeceras" "$URL_API/api/v1$1" -H "Authorization: Bearer $2")
    [ -n "${3:-}" ] && args+=(-H "X-Local-Id: $3")
    curl "${args[@]}" > "$TMP/$4"
    HTTP_CODE=$(head -1 "$TMP/cabeceras" | grep -o '[0-9]\{3\}' | head -1)
    TIPO=$(grep -i '^content-type:' "$TMP/cabeceras" | head -1 | cut -d' ' -f2- | tr -d '\r')
}

# GET firmado a ms-pronóstico (la firma cubre la cadena de consulta): ruta, consulta.
firmado_pronostico() {
    local marca firma salida
    marca=$(ahora)
    firma=$(printf '%s.%s' "$marca" "$2" | openssl dgst -sha256 -hmac "$SECRETO_PRONOSTICO" | sed 's/^.* //')
    salida=$(curl_pronostico -s --max-time 30 -w $'\n%{http_code}' -H "X-Timestamp: $marca" -H "X-Firma: $firma" "$URL_PRONOSTICO$1?$2")
    HTTP_CODE=${salida##*$'\n'}
    HTTP_BODY=${salida%$'\n'*}
}

# ------------------------------------------------------------------ 0. condiciones previas

titulo "0. Condiciones previas"

if ! docker info > /dev/null 2>&1; then
    mal "Docker no responde. Inicie Docker Desktop y vuelva a ejecutar."
    exit 1
fi

if [ "$LEVANTAR" = 1 ]; then
    echo "  Levantando los servicios (docker compose up -d --build)..."
    docker compose up -d --build api pronostico analitica > /dev/null 2>&1 || mal "docker compose up falló"
    sleep 15
fi

for contenedor in "$API" "$DB" "$REDIS" "$DB_ANALITICA" "$ANALITICA" "$DB_PRONOSTICO" "$PRONOSTICO"; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$contenedor" 2>/dev/null)" = true ]; then
        ok "Contenedor $contenedor en ejecución"
    else
        mal "El contenedor $contenedor no está en ejecución (docker compose up -d)"
    fi
done
[ "$FALLOS" -gt 0 ] && { echo; echo "Faltan contenedores: no se puede continuar."; exit 1; }

INICIO=$(sql_nucleo "select now()")

URL_ENV=$(docker exec "$API" printenv PRONOSTICO_URL)
[ -n "$URL_ENV" ] && ok "El núcleo conoce PRONOSTICO_URL ($URL_ENV)" || mal "PRONOSTICO_URL está vacía en el núcleo: no podría pedir pronósticos (recree el contenedor con docker compose up -d)"

SECRETO_PRONOSTICO=$(docker exec "$PRONOSTICO" printenv SECRETO_INTERNO)
SECRETO_NUCLEO=$(docker exec "$API" printenv PRONOSTICO_SECRETO)
if [ -n "$SECRETO_PRONOSTICO" ] && [ "$SECRETO_NUCLEO" = "$SECRETO_PRONOSTICO" ]; then
    ok "El secreto de firma coincide entre el núcleo y ms-pronóstico"
else
    mal "El secreto de firma no coincide (PRONOSTICO_SECRETO del núcleo vs SECRETO_INTERNO de ms-pronóstico)"
fi

SECRETO_ANALITICA=$(docker exec "$ANALITICA" printenv SECRETO_INTERNO)
SECRETO_PRONOSTICO_HACIA_ANALITICA=$(docker exec "$PRONOSTICO" printenv ANALITICA_SECRETO)
if [ -n "$SECRETO_ANALITICA" ] && [ "$SECRETO_PRONOSTICO_HACIA_ANALITICA" = "$SECRETO_ANALITICA" ]; then
    ok "El secreto de firma coincide entre ms-pronóstico y ms-analítica"
else
    mal "El secreto de firma no coincide (ANALITICA_SECRETO de ms-pronóstico vs SECRETO_INTERNO de ms-analítica)"
fi

afirmar "ms-pronóstico responde en /health" 200 "$(curl_pronostico -s -o /dev/null -w '%{http_code}' "$URL_PRONOSTICO/health")"
afirmar "El núcleo responde" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$URL_API/up")"
afirmar "ms-pronóstico rechaza una petición sin firma" 401 "$(curl_pronostico -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "$URL_PRONOSTICO/interno/pronosticos")"
afirmar "ms-pronóstico rechaza una firma alterada" 401 "$(curl_pronostico -s -o /dev/null -w '%{http_code}' -H "X-Timestamp: $(ahora)" -H 'X-Firma: 00' "$URL_PRONOSTICO/interno/modelos/vigente?empresa_id=$EMPRESA&local_id=$LOCAL")"

[ "$FALLOS" -gt 0 ] && { echo; echo "Las condiciones previas fallaron: no se continúa."; exit 1; }

# ------------------------------------------------------------------ 1. histórico al día y modelo vigente

titulo "1. Histórico al día y modelo vigente"

# Un histórico que no llega hasta ayer hace que los días nuevos lleguen en 0 y se tomen por cierres: el pronóstico
# saldría con el aviso de ventas atrasadas. El histórico sintético es de desarrollo (determinista y sin duplicados),
# así que se completa con `generar --incremental` (solo los días que faltan); el aviso solo se ignora con --sin-extender.
AYER=$(sql_nucleo "select ((now() at time zone 'America/Lima')::date - 1)")
ULTIMO_DIA=$(sql_analitica "select coalesce(max(fecha_operativa)::text, 'ninguno') from venta_diaria_producto where local_id = '$LOCAL'")
if [ "$ULTIMO_DIA" \< "$AYER" ]; then
    if [ "$EXTENDER" = 1 ]; then
        aviso "El histórico llega hasta $ULTIMO_DIA y ayer fue $AYER: se completa (solo los días que faltan)"
        INICIO_EXTENSION=$(ahora)
        SALIDA_EXTENSION=$(docker exec "$API" php artisan carta:exportar "$LOCAL" \
            | docker exec -i "$ANALITICA" python -m app.sinteticos generar --carta - --incremental --perfil aurea_v1 --semilla 2026 2>&1)
        guardar "01-extension-del-historico.txt" "$SALIDA_EXTENSION"
        ULTIMO_DIA=$(sql_analitica "select coalesce(max(fecha_operativa)::text, 'ninguno') from venta_diaria_producto where local_id = '$LOCAL'")
        aviso "Extensión terminada en $(($(ahora) - INICIO_EXTENSION)) s"
    else
        aviso "El histórico llega hasta $ULTIMO_DIA y ayer fue $AYER (--sin-extender): el pronóstico puede salir con el aviso de ventas atrasadas"
    fi
fi
if [ "$ULTIMO_DIA" \< "$AYER" ] && [ "$EXTENDER" = 0 ]; then
    HISTORICO_ATRASADO=1
else
    HISTORICO_ATRASADO=0
    afirmar "El histórico de ventas llega hasta ayer ($AYER)" "$AYER" "$ULTIMO_DIA"
fi

# El modelo vigente: debe existir, estar aprobado y mejorar al método ingenuo. Su fecha de entrenamiento se informa
# pero no se exige (el modelo no se reentrena a diario).
firmado_pronostico /interno/modelos/vigente "empresa_id=$EMPRESA&local_id=$LOCAL"
MODELO_JSON=$HTTP_BODY
guardar_json "01-modelo-vigente.json" "$MODELO_JSON"
afirmar "ms-pronóstico informa el modelo vigente de ÁUREA (firmado)" 200 "$HTTP_CODE"
hechos "$MODELO_JSON" '$m = $d["datos"]; return [
    "metodo" => $m["metodo"] ?? "",
    "aprobada" => ($m["modelo"]["metricas"]["aprobada"] ?? false) === true,
    "mejora" => ($m["modelo"]["metricas"]["mae_modelo"] ?? 9e9) < ($m["modelo"]["metricas"]["mae_ingenuo"] ?? 0),
    "mae" => round($m["modelo"]["metricas"]["mae_modelo"] ?? 0, 1),
    "mejora_pct" => (int) round((1 - ($m["modelo"]["metricas"]["mae_modelo"] ?? 1) / max(1e-9, $m["modelo"]["metricas"]["mae_ingenuo"] ?? 1)) * 100),
    "hasta" => $m["modelo"]["datos_hasta"] ?? "",
];'
afirmar "El método vigente es el modelo (no el método base)" modelo "${H[metodo]:-}"
cierto "El modelo pasó la puerta de calidad" "${H[aprobada]:-false}"
cierto "El modelo comete menos error que el método ingenuo" "${H[mejora]:-false}"
aviso "Modelo entrenado hasta ${H[hasta]:-?}; precisión esperada ±${H[mae]:-?} platos, ${H[mejora_pct]:-?} % mejor que el método ingenuo"
MAE_ESPERADO=${H[mae]:-0}
MEJORA_ESPERADA=${H[mejora_pct]:-0}

# ------------------------------------------------------------------ 2. sesiones y permisos

titulo "2. Sesiones y permisos"

TOKEN_ADMIN=$(crear_sesion "$ADMIN" "Smoke administrador" "admin@aurea.local" admin_local "$LOCAL")
TOKEN_PROPIETARIO=$(crear_sesion "$PROPIETARIO" "Smoke propietario" "propietario@aurea.local" propietario "")
TOKEN_CAJERO=$(crear_sesion "$CAJERO" "Smoke cajero" "cajero@aurea.local" cajero "$LOCAL")
ok "Sesiones temporales creadas (administrador, propietario y cajero; válidas 1 hora)"

llamar GET /admin/pronosticos/ultimo ""
afirmar "Sin sesión no se ve el pronóstico (401)" 401 "$HTTP_CODE"
llamar POST /admin/pronosticos "$TOKEN_CAJERO" '{"cobertura_dias":3}'
afirmar "Un cajero no puede generar pronósticos (403)" 403 "$HTTP_CODE"
llamar POST /admin/pronosticos "$TOKEN_ADMIN" '{"cobertura_dias":4}'
afirmar "Una cobertura distinta de 3, 5 o 7 se rechaza (422)" 422 "$HTTP_CODE"

# ------------------------------------------------------------------ 3. local con historial

titulo "3. Pronóstico de un local con historial (ÁUREA, cobertura de 5 días)"

llamar POST /admin/pronosticos "$TOKEN_ADMIN" '{"cobertura_dias":5}'
MADURO_JSON=$HTTP_BODY
guardar_json "03-pronostico-aurea-cobertura-5.json" "$MADURO_JSON"
afirmar "Se genera el pronóstico (201)" 201 "$HTTP_CODE"
aviso "Tardó $SEGUNDOS s"
[ "$HTTP_CODE" != 201 ] && { echo; echo "Sin pronóstico no se puede seguir: $(echo "$MADURO_JSON" | head -c 300)"; exit 1; }

# Todo lo que puede comprobarse sobre la respuesta, calculado de una vez dentro del contenedor.
hechos "$MADURO_JSON" '
$p = $d["datos"]; $rep = $p["reposicion"]; $pron = $p["pronostico"];
$contables = ["und", "botella", "lata", "caja", "paquete", "saco", "bidon", "jaba"];
$cobertura = $p["cobertura_dias"];
$mal_formula = 0; $mal_prioridad = 0; $costo = 0; $conteo = ["urgente" => 0, "pronto" => 0, "cubierto" => 0]; $pendientes = 0; $consumo = 0;
foreach ($rep as $l) {
    $necesidad = $l["motivo"] === "bajo_minimo"
        ? max(0, $l["stock_minimo"] - $l["stock_al_calcular"])
        : max(0, $l["consumo_previsto"] + $l["margen_seguridad"] - $l["stock_al_calcular"]);
    $paso = in_array($l["unidad_medida"], $contables, true) ? 1 : 0.1;
    // Nunca queda corto y no se pasa más de lo que permite el redondeo de la unidad.
    if ($l["cantidad_sugerida"] < $necesidad - 0.0005 || $l["cantidad_sugerida"] - $necesidad >= $paso + 0.0005) { $mal_formula++; }
    $esperada = ($l["stock_al_calcular"] < $l["stock_minimo"] || $l["alcanza_dias"] === 0) ? "urgente"
        : (($l["alcanza_dias"] !== null && $l["alcanza_dias"] < $cobertura) ? "pronto" : "cubierto");
    if ($l["prioridad"] !== $esperada) { $mal_prioridad++; }
    $conteo[$l["prioridad"]]++;
    $costo += $l["costo_estimado"];
    $consumo += $l["consumo_previsto"];
    if ($l["estado"] === "pendiente") { $pendientes++; }
}
$mal_p90 = 0; $no_modelo = 0; $filas = 0;
foreach ($pron["predicciones"] as $pl) { foreach ($pl["dias"] as $dia) {
    $filas++;
    if ($dia["p90"] < $dia["p50"]) { $mal_p90++; }
    if ($dia["metodo"] !== "modelo") { $no_modelo++; }
} }
$avisos = array_map(fn ($a) => is_array($a) ? ($a["codigo"] ?? json_encode($a)) : $a, $pron["advertencias"]);
return [
    "nivel" => $p["nivel"], "cobertura" => $cobertura, "progreso_nulo" => $p["progreso"] === null,
    "error_promedio" => $p["confianza"]["error_promedio"] ?? "", "mejora_pct" => $p["confianza"]["mejora_pct"] ?? "",
    "platos" => count($pron["predicciones"]), "filas" => $filas, "no_modelo" => $no_modelo, "mal_p90" => $mal_p90,
    "resumen_modelo" => $pron["resumen"]["modelo"], "dias_con_ventas" => $pron["historial"]["dias_con_ventas"],
    "avisos" => implode(",", $avisos), "lineas" => count($rep), "consumo" => round($consumo, 3),
    "mal_formula" => $mal_formula, "mal_prioridad" => $mal_prioridad, "pendientes" => $pendientes,
    "costo_lineas" => round($costo, 2), "costo_total" => $p["totales"]["costo"],
    "conteo_ok" => $conteo === $p["totales"]["por_prioridad"],
    "ejecucion" => $pron["ejecucion_id"], "fecha_inicio" => $pron["fecha_inicio"],
    "sin_cerrados" => $pron["resumen"]["cerrado"],
    "costo_cuadra" => abs($costo - $p["totales"]["costo"]) < 0.05,
    "decisiones_ok" => $p["totales"]["decisiones"]["pendientes"] === $pendientes,
];'
EJECUCION_5=${H[ejecucion]:-}
CONSUMO_5=${H[consumo]:-0}

afirmar "El local con historial queda en el nivel 3 (Al punto)" 3 "${H[nivel]:-}"
afirmar "La cobertura pedida es la que se calculó" 5 "${H[cobertura]:-}"
cierto "En el nivel 3 no hay barra de avance (progreso nulo)" "${H[progreso_nulo]:-false}"
afirmar "La confianza muestra el error del modelo vigente" "$MAE_ESPERADO" "${H[error_promedio]:-}"
afirmar "La confianza muestra la mejora sobre el método ingenuo (%)" "$MEJORA_ESPERADA" "${H[mejora_pct]:-}"
afirmar "Cada plato trae 7 días de pronóstico" $((${H[platos]:-0} * 7)) "${H[filas]:-}"
afirmar "Todas las filas salen del modelo, ninguna del método base" 0 "${H[no_modelo]:-}"
afirmar "El resumen cuenta tantas filas del modelo como hay" "${H[filas]:-}" "${H[resumen_modelo]:-}"
afirmar "Ningún P90 queda por debajo de su P50" 0 "${H[mal_p90]:-}"
cierto "El historial informa días con ventas (>= 28)" "$([ "${H[dias_con_ventas]:-0}" -ge 28 ] && echo true || echo false)"
if [ "${HISTORICO_ATRASADO:-0}" = 1 ]; then
    aviso "Se omite la comprobación de ventas atrasadas (--sin-extender); avisos: ${H[avisos]:-ninguno}"
elif [[ ",${H[avisos]:-}," == *datos_desactualizados* ]]; then
    mal "El pronóstico trae el aviso de ventas atrasadas aunque el histórico llega hasta ayer"
else
    ok "El pronóstico no trae avisos de ventas atrasadas"
fi
cierto "Hay recomendaciones de reposición" "$([ "${H[lineas]:-0}" -gt 0 ] && echo true || echo false)"
afirmar "Cada cantidad sugerida cubre la necesidad y respeta el redondeo de su unidad" 0 "${H[mal_formula]:-}"
afirmar "Cada prioridad corresponde a lo que alcanza el stock" 0 "${H[mal_prioridad]:-}"
cierto "El costo total es la suma del costo de las líneas" "${H[costo_cuadra]:-false}"
cierto "El conteo por prioridad coincide con las líneas" "${H[conteo_ok]:-false}"
cierto "Las decisiones pendientes coinciden con las líneas" "${H[decisiones_ok]:-false}"

# El último pronóstico guardado es el mismo que acaba de generarse.
llamar GET /admin/pronosticos/ultimo "$TOKEN_ADMIN" ""
afirmar "GET ultimo responde (200)" 200 "$HTTP_CODE"
afirmar "GET ultimo devuelve la misma ejecución" "$EJECUCION_5" "$(php_eval "$HTTP_BODY" 'return $d["datos"]["pronostico"]["ejecucion_id"];')"
guardar "03-solicitudes-guardadas.txt" "$(sql_tabla_nucleo "select local_id, cobertura_dias, nivel, dias_con_ventas, modelo_version is not null as con_modelo, created_at from solicitud_pronostico where local_id = '$LOCAL' and created_at >= '$INICIO' order by created_at")"
afirmar "La solicitud quedó guardada con su nivel" 3 "$(sql_nucleo "select nivel from solicitud_pronostico where ejecucion_id = '$EJECUCION_5'")"

# Una cobertura menor calcula otra ejecución y consume menos.
titulo "3b. Cambiar la cobertura a 3 días"
llamar POST /admin/pronosticos "$TOKEN_ADMIN" '{"cobertura_dias":3}'
afirmar "Se calcula con cobertura 3 (201)" 201 "$HTTP_CODE"
PRONOSTICO_3=$HTTP_BODY
guardar_json "03b-pronostico-aurea-cobertura-3.json" "$PRONOSTICO_3"
hechos "$PRONOSTICO_3" '$c = 0; foreach ($d["datos"]["reposicion"] as $l) { $c += $l["consumo_previsto"]; }
    return ["ejecucion" => $d["datos"]["pronostico"]["ejecucion_id"], "cobertura" => $d["datos"]["cobertura_dias"], "consumo" => round($c, 3)];'
EJECUCION_3=${H[ejecucion]:-}
afirmar "La cobertura de la respuesta es 3" 3 "${H[cobertura]:-}"
cierto "Es una ejecución nueva, no la anterior" "$([ -n "$EJECUCION_3" ] && [ "$EJECUCION_3" != "$EJECUCION_5" ] && echo true || echo false)"
cierto "Con menos días de cobertura se consume menos ($CONSUMO_5 → ${H[consumo]:-?})" "$(php_eval "x" "return ${H[consumo]:-0} < $CONSUMO_5;")"

# ------------------------------------------------------------------ 4. decisiones

titulo "4. Decidir las recomendaciones (una a una y en lote)"

hechos "$PRONOSTICO_3" '
$con = array_values(array_filter($d["datos"]["reposicion"], fn ($l) => $l["cantidad_sugerida"] > 0 && $l["estado"] === "pendiente"));
$r = ["hay" => count($con)];
foreach (["a", "b", "c", "d", "e", "f"] as $i => $k) {
    if (isset($con[$i])) { $r[$k] = $con[$i]["id"]; $r[$k . "_sug"] = $con[$i]["cantidad_sugerida"]; $r[$k . "_nombre"] = $con[$i]["insumo"]; }
}
$r["lineas"] = count($d["datos"]["reposicion"]);
return $r;'
if [ "${H[hay]:-0}" -lt 6 ]; then
    mal "Hacen falta al menos 6 recomendaciones con cantidad para probar las decisiones (hay ${H[hay]:-0})"
else
    A=${H[a]}; B=${H[b]}; C=${H[c]}; D=${H[d]}; E=${H[e]}; F=${H[f]}
    LINEAS=${H[lineas]}
    B_FINAL=$(php_eval "x" "return ${H[b_sug]} + 1;")
    E_FINAL=$(php_eval "x" "return ${H[e_sug]} + 2;")
    F_NOMBRE=${H[f_nombre]}
    estado_en_bd() { sql_nucleo "select estado from recomendacion_reposicion where id = '$1'"; }

    llamar PATCH "/admin/reposiciones/$A" "$TOKEN_ADMIN" '{"estado":"aceptada"}'
    afirmar "Aceptar una recomendación (200)" 200 "$HTTP_CODE"
    afirmar "Quedó aceptada" aceptada "$(estado_en_bd "$A")"

    llamar PATCH "/admin/reposiciones/$B" "$TOKEN_ADMIN" "{\"estado\":\"ajustada\",\"cantidad_final\":$B_FINAL}"
    afirmar "Ajustar una recomendación con otra cantidad (200)" 200 "$HTTP_CODE"
    afirmar "Quedó ajustada con la cantidad pedida" "$B_FINAL" "$(sql_nucleo "select cantidad_final::float8 from recomendacion_reposicion where id = '$B'")"

    llamar PATCH "/admin/reposiciones/$C" "$TOKEN_ADMIN" '{"estado":"ajustada"}'
    afirmar "Ajustar sin indicar la cantidad se rechaza (422)" 422 "$HTTP_CODE"
    afirmar "Esa recomendación sigue pendiente" pendiente "$(estado_en_bd "$C")"
    llamar PATCH "/admin/reposiciones/$C" "$TOKEN_ADMIN" '{"estado":"descartada"}'
    afirmar "Descartar una recomendación (200)" 200 "$HTTP_CODE"

    llamar PATCH "/admin/reposiciones/$A" "$TOKEN_ADMIN" '{"estado":"descartada"}'
    afirmar "Una decisión tomada no se puede cambiar (409)" 409 "$HTTP_CODE"
    afirmar "El error indica que ya estaba decidida" ERR_REPOSICION_YA_DECIDIDA "$(php_eval "$HTTP_BODY" 'return $d["errores"][0]["codigo"] ?? "";')"
    afirmar "La recomendación conserva su primera decisión" aceptada "$(estado_en_bd "$A")"

    llamar POST /admin/reposiciones/decisiones "$TOKEN_ADMIN" "{\"decisiones\":[{\"id\":\"$D\",\"estado\":\"aceptada\"},{\"id\":\"$E\",\"estado\":\"ajustada\",\"cantidad_final\":$E_FINAL}]}"
    afirmar "Decidir dos recomendaciones en lote (200)" 200 "$HTTP_CODE"
    afirmar "La primera del lote quedó aceptada" aceptada "$(estado_en_bd "$D")"
    afirmar "La segunda del lote quedó ajustada" ajustada "$(estado_en_bd "$E")"

    # Todo o nada: si una del lote ya estaba decidida, ninguna se guarda.
    llamar POST /admin/reposiciones/decisiones "$TOKEN_ADMIN" "{\"decisiones\":[{\"id\":\"$F\",\"estado\":\"aceptada\"},{\"id\":\"$A\",\"estado\":\"aceptada\"}]}"
    afirmar "Un lote con una recomendación ya decidida se rechaza (409)" 409 "$HTTP_CODE"
    afirmar "Ninguna del lote se guardó (la otra sigue pendiente)" pendiente "$(estado_en_bd "$F")"

    llamar GET /admin/pronosticos/ultimo "$TOKEN_ADMIN" ""
    hechos "$HTTP_BODY" '$t = $d["datos"]["totales"]["decisiones"]; return ["p" => $t["pendientes"], "a" => $t["aceptadas"], "j" => $t["ajustadas"], "d" => $t["descartadas"]];'
    afirmar "Los totales cuentan 2 aceptadas" 2 "${H[a]:-}"
    afirmar "Los totales cuentan 2 ajustadas" 2 "${H[j]:-}"
    afirmar "Los totales cuentan 1 descartada" 1 "${H[d]:-}"
    afirmar "Los totales dejan el resto pendiente" $((LINEAS - 5)) "${H[p]:-}"
    guardar "04-decisiones-en-la-base.txt" "$(sql_tabla_nucleo "select i.nombre, r.prioridad, r.cantidad_sugerida, r.estado, r.cantidad_final, r.decidido_en is not null as con_fecha from recomendacion_reposicion r join insumo i on i.id = r.insumo_id where r.ejecucion_id = '$EJECUCION_3' order by r.estado, i.nombre")"
fi

# ------------------------------------------------------------------ 5. lista de compra

titulo "5. Lista de compra en Excel y PDF"

copiar_evidencia() { [ "$EVIDENCIAS" = 1 ] && cp "$TMP/$1" "$EV/$2"; return 0; }

descargar "/admin/pronosticos/ultimo/exportar?formato=xlsx" "$TOKEN_ADMIN" "" compra.xlsx
afirmar "El Excel se descarga (200)" 200 "$HTTP_CODE"
cierto "El Excel declara su tipo ($TIPO)" "$([[ "$TIPO" == *spreadsheetml* ]] && echo true || echo false)"
HOJAS=$(unzip -l "$TMP/compra.xlsx" 2> /dev/null | grep -c 'xl/worksheets/sheet')
cierto "El Excel es un libro válido (zip con hojas)" "$([ "$HOJAS" -gt 0 ] && echo true || echo false)"
if [ -n "${F_NOMBRE:-}" ]; then
    MENCIONES=$(unzip -p "$TMP/compra.xlsx" 2> /dev/null | grep -c -F "$F_NOMBRE")
    cierto "El Excel incluye un insumo pendiente ($F_NOMBRE)" "$([ "$MENCIONES" -gt 0 ] && echo true || echo false)"
fi
copiar_evidencia compra.xlsx "05-lista-de-compra.xlsx"

descargar "/admin/pronosticos/ultimo/exportar?formato=pdf" "$TOKEN_ADMIN" "" compra.pdf
afirmar "El PDF se descarga (200)" 200 "$HTTP_CODE"
afirmar "El PDF declara su tipo" application/pdf "${TIPO%%;*}"
afirmar "El PDF empieza como un PDF" '%PDF' "$(head -c 4 "$TMP/compra.pdf")"
cierto "El PDF no está vacío (más de 2 KB)" "$([ "$(wc -c < "$TMP/compra.pdf")" -gt 2000 ] && echo true || echo false)"
copiar_evidencia compra.pdf "05-lista-de-compra.pdf"

llamar GET "/admin/pronosticos/ultimo/exportar?formato=csv" "$TOKEN_ADMIN" ""
afirmar "Un formato desconocido se rechaza (422)" 422 "$HTTP_CODE"

# ------------------------------------------------------------------ 6. sede nueva sin ventas y vista del propietario

titulo "6. Sede nueva sin ventas (nivel 0) y vista del propietario"

# La sede se crea con su carta y dos insumos: uno bajo su mínimo y otro con stock de sobra. Se borra al salir.
SUFIJO=$(openssl rand -hex 3)
SEDE_NUEVA=$(sql_nucleo "select gen_random_uuid()")
CATEGORIA=$(sql_nucleo "select gen_random_uuid()")
PLATO=$(sql_nucleo "select gen_random_uuid()")
INSUMO_BAJO=$(sql_nucleo "select gen_random_uuid()")
INSUMO_SOBRA=$(sql_nucleo "select gen_random_uuid()")
sql_nucleo "insert into local (id, empresa_id, nombre, slug, direccion, ubigeo_cod, departamento, provincia, distrito, ciudad, telefono, giro_negocio, estado, created_at, updated_at)
            select '$SEDE_NUEVA', empresa_id, 'SMOKE Sede $SUFIJO', 'smoke-sede-$SUFIJO', direccion, ubigeo_cod, departamento, provincia, distrito, ciudad, telefono, giro_negocio, 'activo', now(), now()
            from local where id = '$LOCAL'" > /dev/null
sql_nucleo "insert into categoria_producto (id, local_id, nombre, orden, activa, created_at, updated_at)
            values ('$CATEGORIA', '$SEDE_NUEVA', 'SMOKE Fondos', 1, true, now(), now())" > /dev/null
sql_nucleo "insert into producto (id, categoria_id, local_id, nombre, precio, costo_estandar, disponibilidad, requiere_preparacion, activo, created_at, updated_at)
            values ('$PLATO', '$CATEGORIA', '$SEDE_NUEVA', 'SMOKE Plato nuevo', 30.00, 10.00, 'disponible', true, true, now(), now())" > /dev/null
sql_nucleo "insert into insumo (id, local_id, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario, created_at, updated_at)
            values ('$INSUMO_BAJO', '$SEDE_NUEVA', 'SMOKE Aceite', 'L', 2, 5, 10.00, now(), now()),
                   ('$INSUMO_SOBRA', '$SEDE_NUEVA', 'SMOKE Arroz', 'kg', 50, 5, 4.00, now(), now())" > /dev/null
sql_nucleo "insert into producto_insumo (producto_id, insumo_id, modo_calculo, cantidad_descuenta)
            values ('$PLATO', '$INSUMO_BAJO', 'exacto', 0.05), ('$PLATO', '$INSUMO_SOBRA', 'exacto', 0.25)" > /dev/null
ok "Sede 'SMOKE Sede $SUFIJO' creada sin ventas, con un insumo bajo su mínimo (2 de 5 L) y otro con de sobra"

llamar POST /admin/pronosticos "$TOKEN_PROPIETARIO" '{"cobertura_dias":3}' "$SEDE_NUEVA"
NUEVA_JSON=$HTTP_BODY
guardar_json "06-pronostico-sede-nueva.json" "$NUEVA_JSON"
afirmar "El propietario genera el pronóstico de la sede nueva (201, con X-Local-Id)" 201 "$HTTP_CODE"
hechos "$NUEVA_JSON" '
$p = $d["datos"]; $rep = $p["reposicion"] ?? [];
$bajo = array_values(array_filter($rep, fn ($l) => $l["insumo"] === "SMOKE Aceite"));
$sobra = array_filter($rep, fn ($l) => $l["insumo"] === "SMOKE Arroz");
return [
    "nivel" => $p["nivel"] ?? "", "confianza_nula" => ! isset($p["confianza"]),
    "dias" => $p["progreso"]["dias_con_ventas"] ?? "", "faltan" => $p["progreso"]["faltan_para_siguiente"] ?? "",
    "modelo" => $p["pronostico"]["resumen"]["modelo"] ?? "", "lineas" => count($rep),
    "motivo" => $bajo[0]["motivo"] ?? "", "prioridad" => $bajo[0]["prioridad"] ?? "", "sugerida" => $bajo[0]["cantidad_sugerida"] ?? "",
    "sobra" => count($sobra), "ejecucion" => $p["pronostico"]["ejecucion_id"] ?? "",
];'
afirmar "Sin ventas la predicción queda en el nivel 0 (Esperando tus primeras ventas)" 0 "${H[nivel]:-}"
cierto "En el nivel 0 no se presume ninguna precisión (sin confianza)" "${H[confianza_nula]:-false}"
afirmar "El avance cuenta 0 días con ventas" 0 "${H[dias]:-}"
cierto "El avance dice cuántos días faltan para el siguiente nivel (${H[faltan]:-?})" "$([ "${H[faltan]:-0}" -gt 0 ] 2> /dev/null && echo true || echo false)"
afirmar "Ninguna fila sale del modelo" 0 "${H[modelo]:-}"
afirmar "Entra el insumo bajo su mínimo, sin consumo previsto" bajo_minimo "${H[motivo]:-}"
afirmar "Ese insumo es urgente" urgente "${H[prioridad]:-}"
afirmar "Se sugiere reponer hasta el mínimo (5 - 2 = 3 L)" 3 "${H[sugerida]:-}"
afirmar "El insumo con stock de sobra no aparece" 0 "${H[sobra]:-}"
afirmar "Es la única recomendación de la sede" 1 "${H[lineas]:-}"

llamar GET /admin/pronosticos/ultimo "$TOKEN_PROPIETARIO" "" "$SEDE_NUEVA"
afirmar "Un local sin ventas ve su último pronóstico (no hay 404)" 200 "$HTTP_CODE"
afirmar "Es el mismo que se acaba de generar" "${H[ejecucion]:-}" "$(php_eval "$HTTP_BODY" 'return $d["datos"]["pronostico"]["ejecucion_id"] ?? "";')"
afirmar "La solicitud quedó guardada con nivel 0 y 0 días con ventas" "0|0" "$(sql_nucleo "select nivel || '|' || dias_con_ventas from solicitud_pronostico where local_id = '$SEDE_NUEVA'")"
descargar "/admin/pronosticos/ultimo/exportar?formato=xlsx" "$TOKEN_PROPIETARIO" "$SEDE_NUEVA" nueva.xlsx
afirmar "La lista de compra de la sede nueva se descarga (200)" 200 "$HTTP_CODE"

llamar GET /propietario/pronosticos "$TOKEN_PROPIETARIO" ""
PROPIETARIO_JSON=$HTTP_BODY
guardar_json "06-vista-del-propietario.json" "$PROPIETARIO_JSON"
afirmar "El propietario ve la predicción de sus sedes (200)" 200 "$HTTP_CODE"
hechos "$PROPIETARIO_JSON" '
$sedes = $d["datos"]["sedes"]; $por = [];
foreach ($sedes as $s) { $por[$s["local_id"]] = $s; }
$suma = 0; foreach ($sedes as $s) { $suma += $s["pronostico"]["total_semana"] ?? 0; }
return [
    "sedes" => count($sedes),
    "aurea_nivel" => $por["'"$LOCAL"'"]["nivel"] ?? "", "aurea_estado" => $por["'"$LOCAL"'"]["estado"] ?? "",
    "nueva_nivel" => $por["'"$SEDE_NUEVA"'"]["nivel"] ?? "", "nueva_estado" => $por["'"$SEDE_NUEVA"'"]["estado"] ?? "",
    "panorama_cuadra" => abs(($d["datos"]["panorama"]["total_semana"] ?? -1) - $suma) < 1.5,
    "dias_panorama" => count($d["datos"]["panorama"]["dias"] ?? []),
];'
cierto "La vista incluye ÁUREA y la sede nueva (${H[sedes]:-0} sedes)" "$([ "${H[sedes]:-0}" -ge 2 ] 2> /dev/null && echo true || echo false)"
afirmar "ÁUREA aparece en el nivel 3" 3 "${H[aurea_nivel]:-}"
afirmar "La sede nueva aparece en el nivel 0" 0 "${H[nueva_nivel]:-}"
afirmar "El panorama abarca los 7 días" 7 "${H[dias_panorama]:-}"
cierto "El total del panorama es la suma de las sedes" "${H[panorama_cuadra]:-false}"
llamar GET /propietario/pronosticos "$TOKEN_ADMIN" ""
afirmar "Un administrador de sede no ve la vista del propietario (403)" 403 "$HTTP_CODE"

# ------------------------------------------------------------------ 7. caída de ms-pronóstico

if [ "$RAPIDO" = 1 ]; then
    titulo "7. Caída de ms-pronóstico (omitida por --rapido)"
else
    titulo "7. Apagar ms-pronóstico, pedir un pronóstico y volver a encenderlo"
    docker stop "$PRONOSTICO" > /dev/null && PRONOSTICO_APAGADO_POR_EL_SCRIPT=1
    ok "ms-pronóstico apagado"

    llamar POST /admin/pronosticos "$TOKEN_ADMIN" '{"cobertura_dias":3}'
    guardar "07-respuesta-con-el-servicio-caido.json" "$HTTP_BODY"
    afirmar "Con el servicio caído la API responde un error controlado (503)" 503 "$HTTP_CODE"
    afirmar "El error es el del servicio no disponible, no una caída del núcleo" ERR_PRONOSTICO_NO_DISPONIBLE "$(php_eval "$HTTP_BODY" 'return $d["errores"][0]["codigo"] ?? "";')"
    cierto "Responde rápido, sin colgarse ($SEGUNDOS s)" "$([ "$SEGUNDOS" -lt 60 ] && echo true || echo false)"

    llamar GET /admin/pronosticos/ultimo "$TOKEN_ADMIN" ""
    afirmar "Aun caído el servicio, se ve la última lista guardada (200)" 200 "$HTTP_CODE"
    afirmar "Sigue siendo la de nivel 3" 3 "$(php_eval "$HTTP_BODY" 'return $d["datos"]["nivel"] ?? "";')"
    llamar GET /propietario/pronosticos "$TOKEN_PROPIETARIO" ""
    afirmar "La vista del propietario no se cae (200)" 200 "$HTTP_CODE"

    docker start "$PRONOSTICO" > /dev/null && PRONOSTICO_APAGADO_POR_EL_SCRIPT=0
    RENDIDA=$(ahora)
    servicio_sano() { [ "$(curl_pronostico -s -o /dev/null -w '%{http_code}' "$URL_PRONOSTICO/health")" = 200 ]; }
    if esperar_hasta 120 servicio_sano; then
        ok "ms-pronóstico volvió a responder en $(($(ahora) - RENDIDA)) s"
    else
        mal "ms-pronóstico no respondió en 120 s tras encenderlo"
    fi
    llamar POST /admin/pronosticos "$TOKEN_ADMIN" '{"cobertura_dias":3}'
    afirmar "Con el servicio de vuelta se genera el pronóstico otra vez (201)" 201 "$HTTP_CODE"
    guardar "07-ms-pronostico-logs.txt" "$(docker logs --tail 40 "$PRONOSTICO" 2>&1)"
fi

# ------------------------------------------------------------------ resumen

titulo "Resumen"
guardar "99-tablas-pronostico.txt" "$(sql_tabla_pronostico "select local_id, estado, dias_con_ventas, horizonte_dias, creada_en from ejecucion where creada_en >= '$INICIO' order by creada_en")"

TOTAL=${#RESULTADOS[@]}
if [ "$EVIDENCIAS" = 1 ]; then
    {
        echo "# Prueba de humo: núcleo → ms-pronóstico → reposición"
        echo
        echo "- **Fecha:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo "- **Modelo vigente:** entrenado hasta ${H[hasta]:-?}; error ±$MAE_ESPERADO platos, $MEJORA_ESPERADA % mejor que el método ingenuo"
        echo "- **Histórico de ventas:** hasta ${ULTIMO_DIA:-?}"
        echo "- **Sede de prueba:** SMOKE Sede ${SUFIJO:-?} ($([ "$CONSERVAR" = 1 ] && echo conservada || echo 'borrada al terminar'))"
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
