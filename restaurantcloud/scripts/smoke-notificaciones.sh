#!/usr/bin/env bash
# Prueba de humo de ms-notificaciones: acción real del núcleo -> outbox -> worker -> MongoDB -> bandeja y SSE por Kong.
#
# Hace lo que haría el personal del restaurante, contra el Compose en marcha, y comprueba cada eslabón: que un plato
# marcado como agotado y un plato anulado ya preparado lleguen como aviso al rol correcto, que la bandeja los muestre a
# través de Kong, que un flujo SSE abierto los reciba al instante, que reenviar un evento no duplique el aviso, que
# empresa, sede, rol y usuario no se mezclen, que un token o una firma fuera de regla se rechacen (sabiendo QUIÉN los
# rechazó: Kong o el servicio), que /interno no se vea desde fuera y que, si ms-notificaciones cae, el núcleo siga
# operando y los avisos lleguen solos al encenderla.
#
# Uso (desde restaurantcloud/):
#   ./scripts/smoke-notificaciones.sh                 # todo
#   ./scripts/smoke-notificaciones.sh --rapido        # sin la caída de ms-notificaciones (tarda minutos)
#   ./scripts/smoke-notificaciones.sh --levantar      # antes, docker compose up -d --build de los servicios
#   ./scripts/smoke-notificaciones.sh --sin-evidencias
#
# Qué deja en la base de desarrollo: la prueba usa datos reales, no una transacción que se deshaga.
#   - Crea un piso, una mesa, un producto y una comanda con el prefijo "SMOKE" (se identifican por el nombre). Al salir
#     anula la comanda y desactiva el producto, pero las filas de auditoría y de anulaciones son inmutables y quedan.
#   - Los avisos que crea en MongoDB (los que mencionan «SMOKE») se borran al salir; las sesiones temporales (en Redis,
#     sin contraseñas) también.
#   - Los eventos del outbox del núcleo quedan: son el registro de lo que pasó.
#
# Qué hay que saber antes de ejecutarlo:
#   - El escenario de caída apaga ms-notificaciones y espera a que el núcleo reintente: tarda varios minutos. Si el
#     script se interrumpe con el servicio apagado, lo enciende al salir.
#   - El reenvío usa «outbox:reenviar-eventos»: si hay entregas fallidas de otros eventos del mismo tipo, el escenario
#     se detiene y lo dice, para no reenviar nada ajeno.
#
# Evidencias (respuestas, bandejas, capturas del flujo y tablas) en doc-2u/evidencias/smoke-notificaciones/<fecha>/,
# carpeta que no se versiona, para la sección «Pruebas de integración» del informe. No se guarda ningún secreto ni token
# (de los JWT solo se guardan los claims, sin la firma).
#
# Sale con código distinto de 0 si algún paso falla.

set -uo pipefail
# Git Bash en Windows convierte las rutas que empiezan por "/" en rutas de Windows; los contenedores no las quieren.
export MSYS_NO_PATHCONV=1

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

API=restaurantcloudIA_api
QUEUE=restaurantcloudIA_queue
SCHEDULER=restaurantcloudIA_scheduler
DB=restaurantcloudIA_db
REDIS=restaurantcloudIA_redis
KONG=restaurantcloudIA_kong
ANALITICA=restaurantcloudIA_analitica
NOTIFICACIONES=restaurantcloudIA_notificaciones
MONGO=restaurantcloudIA_mongo
URL_KONG=http://localhost:8000
URL_NOTIFICACIONES=http://localhost:8003

EMPRESA=00000000-0000-4000-8000-000000000001
LOCAL=00000000-0000-4000-8000-000000000010
PROPIETARIO=00000000-0000-4000-8000-000000000101
ADMIN=00000000-0000-4000-8000-000000000102
MOZO=00000000-0000-4000-8000-000000000103
COCINA=00000000-0000-4000-8000-000000000104
SEDE_AJENA=00000000-0000-4000-8000-0000000000aa
EMPRESA_AJENA=00000000-0000-4000-8000-0000000000ff

LEVANTAR=0
RAPIDO=0
EVIDENCIAS=1
for argumento in "$@"; do
    case "$argumento" in
        --levantar) LEVANTAR=1 ;;
        --rapido) RAPIDO=1 ;;
        --sin-evidencias) EVIDENCIAS=0 ;;
        -h | --help) sed -n '2,38p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Opción desconocida: $argumento (use --help)"; exit 2 ;;
    esac
done

# ------------------------------------------------------------------ utilidades

VERDE=$'\033[32m'; ROJO=$'\033[31m'; AMARILLO=$'\033[33m'; NEUTRO=$'\033[0m'
FALLOS=0
RESULTADOS=()
TOKENS=()
FLUJOS=()
TABLA_TOKENS=()
TMP=$(mktemp -d)
TMPW=$(cygpath -m "$TMP" 2> /dev/null || echo "$TMP")
NOTIFICACIONES_APAGADA_POR_EL_SCRIPT=0
PEDIDOS=()
MARCA=""

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
rapido() { awk "BEGIN { exit !($1 < $2) }"; } # rapido <segundos> <límite>

ahora() { date +%s; }
ahora_f() { date +%s.%N; }
restar() { awk "BEGIN { printf \"%.2f\", $1 - $2 }"; }

sql() { docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 -c "$0"' "$1"; }
sql_tabla() { docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$0"' "$1"; }

# MongoDB con el usuario administrador del contenedor (el servicio usa otro, sin privilegios).
MONGO_USUARIO=""; MONGO_CLAVE=""; MONGO_BASE=""
mongo() { docker exec "$MONGO" mongosh --quiet -u "$MONGO_USUARIO" -p "$MONGO_CLAVE" --authenticationDatabase admin "$MONGO_BASE" --eval "$1" 2> /dev/null; }

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
# Igual, pero cada 0.2 s: para medir tiempos cortos.
esperar_pronto() {
    local limite=$1; shift
    local inicio; inicio=$(ahora)
    while true; do
        if "$@"; then return 0; fi
        if [ $(($(ahora) - inicio)) -ge "$limite" ]; then return 1; fi
        sleep 0.2
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

# ------------------------------------------------------------------ evidencias

if [ "$EVIDENCIAS" = 1 ]; then
    EV="$RAIZ/../doc-2u/evidencias/smoke-notificaciones/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$EV"
fi
guardar() { # archivo, contenido
    [ "$EVIDENCIAS" = 1 ] && printf '%s\n' "$2" > "$EV/$1"
    return 0
}
guardar_json() { # archivo, json (con sangría)
    [ "$EVIDENCIAS" = 1 ] && php_eval "$2" 'return json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);' > "$EV/$1"
    return 0
}

# ------------------------------------------------------------------ limpieza al salir

limpiar() {
    local pid
    for pid in "${FLUJOS[@]:-}"; do [ -n "$pid" ] && kill "$pid" > /dev/null 2>&1; done
    # Si el script se interrumpe con ms-notificaciones apagada por él, la deja encendida.
    if [ "$NOTIFICACIONES_APAGADA_POR_EL_SCRIPT" = 1 ]; then
        docker start "$NOTIFICACIONES" > /dev/null 2>&1
    fi
    if [ "${#TOKENS[@]}" -gt 0 ]; then
        local codigo=""
        for t in "${TOKENS[@]}"; do
            codigo="$codigo"'Illuminate\Support\Facades\Redis::del("auth:session:".hash("sha256","'"$t"'"));'
        done
        docker exec "$API" php artisan tinker --execute="$codigo" > /dev/null 2>&1
    fi
    # Los avisos de la prueba, fuera de MongoDB (solo los que mencionan la marca de esta corrida).
    if [ -n "$MARCA" ] && [ -n "$MONGO_USUARIO" ]; then
        mongo "db.notificaciones.deleteMany({\$or: [{titulo: /$MARCA/}, {mensaje: /$MARCA/}]})" > /dev/null
    fi
    # La comanda y el producto de la prueba no deben quedar a la vista del personal.
    if [ "${#PEDIDOS[@]}" -gt 0 ]; then
        local lista; lista=$(printf "'%s'," "${PEDIDOS[@]}"); lista=${lista%,}
        sql "update pedido_item set estado = 'anulado' where pedido_id in ($lista) and estado <> 'anulado'; update pedido set estado = 'anulado' where id in ($lista)" > /dev/null 2>&1
    fi
    [ -n "${PRODUCTO:-}" ] && sql "update producto set activo = false where id = '$PRODUCTO'" > /dev/null 2>&1
    rm -rf "$TMP"
}
trap limpiar EXIT

# ------------------------------------------------------------------ peticiones

# Petición a través de Kong. Deja el código en HTTP_CODE, la respuesta en HTTP_BODY, los segundos en TIEMPO y las
# cabeceras de la respuesta en $TMP/cabeceras. Los argumentos que sobran se pasan a curl.
kong() { # método, ruta, jwt|"", local_id|"", [argumentos de curl...]
    local metodo=$1 ruta=$2 jwt=${3:-} local_id=${4:-}
    shift 4
    local args=(-s --max-time 30 -X "$metodo" "$URL_KONG$ruta" -H 'Accept: application/json' -D "$TMPW/cabeceras" -w $'\n%{http_code} %{time_total}')
    [ -n "$jwt" ] && args+=(-H "Authorization: Bearer $jwt")
    [ -n "$local_id" ] && args+=(-H "X-Local-Id: $local_id")
    local salida ultima
    salida=$(curl "${args[@]}" "$@")
    ultima=${salida##*$'\n'}
    HTTP_CODE=${ultima%% *}
    TIEMPO=${ultima##* }
    HTTP_BODY=${salida%$'\n'*}
}

cabecera() { grep -i "^$1:" "$TMP/cabeceras" | head -1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//'; }

# Las respuestas que genera Kong (401, 404, 429, 502, 504…) son `{"message": …}`; las de un servicio siguen el formato
# común y traen «exito». La cabecera Server no sirve aquí: Fastify no la pone y Kong añade la suya.
quien_respondio() { [[ "$HTTP_BODY" == *'"exito"'* ]] && echo servicio || echo kong; }
codigo_de_error() { php_eval "$HTTP_BODY" 'return $d["errores"][0]["codigo"] ?? "";'; }

norm_pem() { printf '%s' "$1" | sed 's/\\n//g' | tr -d ' \r\n'; }

# Crea una sesión temporal de Redis, como la que crea el login (válida 1 hora), y devuelve su token.
crear_sesion() { # usuario_id, nombre, rol
    local token="smoke_$(openssl rand -hex 16)"
    docker exec "$API" php artisan tinker --execute='Illuminate\Support\Facades\Redis::setex("auth:session:".hash("sha256","'"$token"'"), 3600, json_encode(["id"=>"'"$1"'","nombre"=>"'"$2"'","correo"=>"smoke@aurea.local","rol"=>"'"$3"'","empresa_id"=>"'"$EMPRESA"'","local_id"=>"'"$LOCAL"'","estado"=>"activo"]));' > /dev/null 2>&1
    TOKENS+=("$token")
    echo "$token"
}

# JWT de los servicios que emite el núcleo para una sesión.
jwt_de_sesion() { # token de sesión
    kong POST /api/v1/auth/token-servicios "$1" ""
    php_eval "$HTTP_BODY" 'return $d["datos"]["jwt"] ?? "";'
}

# Claims de un JWT (sin la firma) como JSON.
claims_de() { php_eval "{\"jwt\":\"$1\"}" '$p = explode(".", $d["jwt"]); return json_encode(["cabecera" => json_decode(base64_decode(strtr($p[0], "-_", "+/")), true), "claims" => json_decode(base64_decode(strtr($p[1], "-_", "+/")), true)]);'; }

# ------------------------------------------------------------------ tokens fuera de regla

# Se firman con la clave real del núcleo (o con otra, o con ninguna) para probar cada defensa por separado, y con
# usuarios, sedes y empresas distintos para probar el aislamiento sin tocar a los usuarios reales.
read -r -d '' CODIGO_TOKENS <<'FIN'
$t = app(App\Domains\Auth\Services\TokenServicios::class);
$m = new ReflectionMethod($t, 'clavePrivada');
$m->setAccessible(true);
$clave = $m->invoke($t);
$kid = $t->kid();
$b = fn ($s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
$ahora = time();
$base = ['iss' => config('jwt.emisor'), 'aud' => config('jwt.audiencia'), 'sub' => getenv('ADMIN'), 'rol' => 'admin_local', 'empresa_id' => getenv('EMPRESA'), 'local_id' => getenv('LOCAL'), 'modulos' => [], 'iat' => $ahora, 'nbf' => $ahora, 'exp' => $ahora + 600, 'jti' => bin2hex(random_bytes(8))];
$firmar = fn (array $c) => App\Support\JwtRs256::codificar($c, $clave, $kid);
$s = [];
$s['admin_otro_usuario'] = $firmar(array_merge($base, ['sub' => getenv('USUARIO_C')]));
$s['admin_otra_sede'] = $firmar(array_merge($base, ['local_id' => getenv('SEDE_AJENA')]));
$s['admin_otra_empresa'] = $firmar(array_merge($base, ['empresa_id' => getenv('EMPRESA_AJENA')]));
$s['mozo_a'] = $firmar(array_merge($base, ['sub' => getenv('USUARIO_A'), 'rol' => 'mozo']));
$s['mozo_b'] = $firmar(array_merge($base, ['sub' => getenv('USUARIO_B'), 'rol' => 'mozo']));
$s['admin_saas'] = $firmar(array_merge($base, ['rol' => 'admin_saas']));
$s['mozo_sin_sede'] = $firmar(array_merge($base, ['rol' => 'mozo', 'local_id' => null]));
$s['vencido'] = $firmar(array_merge($base, ['iat' => $ahora - 700, 'nbf' => $ahora - 700, 'exp' => $ahora - 60]));
$s['una_hora'] = $firmar(array_merge($base, ['exp' => $ahora + 3600]));
$s['aun_no_vale'] = $firmar(array_merge($base, ['nbf' => $ahora + 300]));
$s['audiencia_ajena'] = $firmar(array_merge($base, ['aud' => 'otra-audiencia']));
$s['emisor_ajeno'] = $firmar(array_merge($base, ['iss' => 'otro-emisor']));
$ajena = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
openssl_pkey_export($ajena, $pemAjena);
$s['clave_ajena'] = App\Support\JwtRs256::codificar($base, $pemAjena, $kid);
$p = $b(json_encode($base));
$s['alg_none'] = $b(json_encode(['alg' => 'none', 'typ' => 'JWT'])) . '.' . $p . '.';
$h = $b(json_encode(['alg' => 'HS256', 'typ' => 'JWT', 'kid' => $kid]));
$s['hs256_con_clave_publica'] = $h . '.' . $p . '.' . $b(hash_hmac('sha256', $h . '.' . $p, $t->clavePublica(), true));
foreach ($s as $n => $j) { echo 'TOKEN ' . $n . ' ' . $j . "\n"; }
FIN

declare -A JWT
acunar_tokens() {
    local salida linea nombre jwt
    salida=$(docker exec -e ADMIN="$ADMIN" -e EMPRESA="$EMPRESA" -e LOCAL="$LOCAL" -e SEDE_AJENA="$SEDE_AJENA" -e EMPRESA_AJENA="$EMPRESA_AJENA" \
        -e USUARIO_A="$USUARIO_A" -e USUARIO_B="$USUARIO_B" -e USUARIO_C="$USUARIO_C" "$API" php artisan tinker --execute="$CODIGO_TOKENS" 2>&1)
    while IFS= read -r linea; do
        case "$linea" in
            TOKEN\ *) read -r _ nombre jwt <<< "$linea"; JWT["$nombre"]=$jwt ;;
        esac
    done <<< "$salida"
}

# Un token que Kong debe rechazar él mismo (401, sin llegar a ms-notificaciones).
probar_rechazo_de_kong() { # descripción, jwt|"", ruta, [argumentos de curl...]
    local descripcion=$1 jwt=$2 ruta=$3
    shift 3
    kong GET "$ruta" "$jwt" "" "$@"
    local quien; quien=$(quien_respondio)
    if [ "$HTTP_CODE" = 401 ] && [ "$quien" = kong ]; then
        ok "Kong rechaza «$descripcion» (401, sin llegar al servicio)"
        TABLA_TOKENS+=("$descripcion|401 de Kong|$HTTP_CODE de $quien|ok")
    else
        mal "Kong debía rechazar «$descripcion» con 401 (obtenido: $HTTP_CODE de $quien)"
        TABLA_TOKENS+=("$descripcion|401 de Kong|$HTTP_CODE de $quien|FALLÓ")
    fi
}

# Una petición que Kong deja pasar y el servicio responde con el formato común (código HTTP y de error).
probar_respuesta_del_servicio() { # descripción, http esperado, código de error esperado|"", jwt, local_id|"", ruta
    local descripcion=$1 esperado=$2 codigo=$3 jwt=$4 local_id=$5 ruta=$6
    kong GET "$ruta" "$jwt" "$local_id"
    local quien obtenido; quien=$(quien_respondio)
    obtenido=$(codigo_de_error)
    if [ "$HTTP_CODE" = "$esperado" ] && [ "$quien" = servicio ] && [ "$obtenido" = "$codigo" ]; then
        ok "$descripcion ($HTTP_CODE${codigo:+ $codigo})"
        TABLA_TOKENS+=("$descripcion|$esperado${codigo:+ $codigo} del servicio|$HTTP_CODE${obtenido:+ $obtenido} de $quien|ok")
    else
        mal "$descripcion (esperado: $esperado${codigo:+ $codigo} del servicio; obtenido: $HTTP_CODE${obtenido:+ $obtenido} de $quien)"
        TABLA_TOKENS+=("$descripcion|$esperado${codigo:+ $codigo} del servicio|$HTTP_CODE${obtenido:+ $obtenido} de $quien|FALLÓ")
    fi
}

# ------------------------------------------------------------------ bandeja y avisos de la prueba

R_BANDEJA='/api/v1/notificaciones?por_pagina=50'
R_TOTAL='/api/v1/notificaciones/no-leidas/total'

# Bandeja de quien tiene ese JWT; deja el JSON en BANDEJA.
BANDEJA=""
pedir_bandeja() { # jwt, [local_id]
    kong GET "$R_BANDEJA" "$1" "${2:-}"
    BANDEJA=$HTTP_BODY
}

# Avisos de esta corrida (los que mencionan la marca SMOKE) como líneas «tipo|severidad|id|leida|título».
avisos_de_la_prueba() { # json de la bandeja
    php_eval "$1" 'foreach (($d["datos"] ?? []) as $a) { if (str_contains($a["titulo"] . $a["mensaje"], "'"$MARCA"'")) { echo $a["tipo"] . "|" . $a["severidad"] . "|" . $a["id"] . "|" . ($a["leida"] ? "1" : "0") . "|" . $a["titulo"] . "\n"; } }'
}
cuantos() { # json de la bandeja, tipo, [severidad] -> avisos de la prueba de ese tipo
    avisos_de_la_prueba "$1" | awk -F'|' -v t="$2" -v s="${3:-}" '$1 == t && (s == "" || $2 == s) { n++ } END { print n + 0 }'
}
id_del_aviso() { # json de la bandeja, tipo
    avisos_de_la_prueba "$1" | awk -F'|' -v t="$2" '$1 == t { print $3; exit }'
}
leida_de() { # json de la bandeja, id
    avisos_de_la_prueba "$1" | awk -F'|' -v i="$2" '$3 == i { print $4; exit }'
}
total_sin_leer() { # jwt -> total del contador
    kong GET "$R_TOTAL" "$1" ""
    php_eval "$HTTP_BODY" 'return $d["datos"]["total"] ?? "";'
}

# Estado de la entrega de un evento a ms-notificaciones.
estado_de_entrega() { sql "select estado from outbox_entrega where evento_id = '$1' and destino = 'ms-notificaciones'"; }
entrega_entregada() { [ -n "$1" ] && [ "$(estado_de_entrega "$1")" = entregado ]; }
entrega_con_fallo() { [ -n "$1" ] && [ "$(sql "select coalesce(intentos, 0) >= 1 from outbox_entrega where evento_id = '$1' and destino = 'ms-notificaciones'")" = t ]; }
tabla_de_entrega() { sql_tabla "select e.tipo_evento, oe.destino, oe.estado, oe.intentos, oe.fallos_receptor, oe.motivo_fallo, oe.reenvios, oe.entregado_en from outbox_entrega oe join outbox_event e on e.id = oe.evento_id where e.id = '$1'"; }
evento_de_producto() { sql "select id from outbox_event where tipo_evento = 'producto.agotado' and agregado_id = '$1' order by created_at desc limit 1"; }
evento_de_anulacion() { sql "select id from outbox_event where tipo_evento = 'pedido.anulado' and payload::text like '%$1%' order by created_at desc limit 1"; }

# Avisos que tiene MongoDB de un evento: «rol:severidad» separados por coma, en orden.
avisos_en_mongo() { mongo "print(db.notificaciones.find({evento_id: '$1'}).toArray().map(d => d.destinatario.rol + ':' + d.severidad).sort().join(','))" | tr -d '\r'; }
cantidad_en_mongo() { mongo "print(db.notificaciones.countDocuments({evento_id: '$1'}))" | tr -d '\r'; }

# POST autenticado con una sesión del núcleo, a través de Kong. Deja HTTP_CODE y HTTP_BODY (como kong()).
accion_del_nucleo() { # sesión, ruta, cuerpo JSON
    kong POST "$2" "$1" "" -H 'Content-Type: application/json' --data-binary "$3"
}

# ------------------------------------------------------------------ 0. condiciones previas

titulo "0. Condiciones previas"

if ! docker info > /dev/null 2>&1; then
    mal "Docker no responde. Inicie Docker Desktop y vuelva a ejecutar."
    exit 1
fi

if [ "$LEVANTAR" = 1 ]; then
    echo "  Levantando los servicios (docker compose up -d --build)..."
    docker compose up -d --build api queue scheduler notificaciones kong > /dev/null 2>&1 || mal "docker compose up falló"
    sleep 15
fi

for contenedor in "$API" "$QUEUE" "$SCHEDULER" "$DB" "$REDIS" "$KONG" "$NOTIFICACIONES" "$MONGO"; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$contenedor" 2>/dev/null)" = true ]; then
        ok "Contenedor $contenedor en ejecución"
    else
        mal "El contenedor $contenedor no está en ejecución (docker compose up -d)"
    fi
done
[ "$FALLOS" -gt 0 ] && { echo; echo "Faltan contenedores: no se puede continuar."; exit 1; }

afirmar "Kong está sano" healthy "$(docker inspect -f '{{.State.Health.Status}}' "$KONG" 2>/dev/null)"
afirmar "ms-notificaciones está sano" healthy "$(docker inspect -f '{{.State.Health.Status}}' "$NOTIFICACIONES" 2>/dev/null)"
afirmar "ms-notificaciones responde en /health" 200 "$(curl -s -o /dev/null -w '%{http_code}' "$URL_NOTIFICACIONES/health")"

# El worker debe escuchar la cola "eventos": con una imagen antigua solo escucha "documentos" y los eventos no salen.
if docker exec "$QUEUE" sh -c 'ps aux | grep "queue:work" | grep -v grep' | grep -q 'eventos'; then
    ok "El worker escucha la cola 'eventos'"
else
    mal "El worker no escucha la cola 'eventos': la imagen de queue está desactualizada (docker compose up -d --build api queue scheduler)"
fi

URL_ENV_API=$(docker exec "$API" printenv NOTIFICACIONES_URL)
URL_ENV_QUEUE=$(docker exec "$QUEUE" printenv NOTIFICACIONES_URL)
if [ -n "$URL_ENV_API" ] && [ -n "$URL_ENV_QUEUE" ]; then
    ok "El núcleo y el worker conocen NOTIFICACIONES_URL ($URL_ENV_API)"
else
    mal "NOTIFICACIONES_URL está vacía en api o queue: los eventos no se enviarían (recree los contenedores con docker compose up -d)"
fi

SECRETO_API=$(docker exec "$API" printenv NOTIFICACIONES_SECRETO)
SECRETO_QUEUE=$(docker exec "$QUEUE" printenv NOTIFICACIONES_SECRETO)
SECRETO_SERVICIO=$(docker exec "$NOTIFICACIONES" printenv SECRETO_INTERNO)
if [ -n "$SECRETO_SERVICIO" ] && [ "$SECRETO_API" = "$SECRETO_SERVICIO" ] && [ "$SECRETO_QUEUE" = "$SECRETO_SERVICIO" ]; then
    ok "El secreto de firma coincide en el núcleo, el worker y ms-notificaciones"
else
    mal "El secreto de firma no coincide (NOTIFICACIONES_SECRETO del núcleo vs SECRETO_INTERNO de ms-notificaciones)"
fi

kong GET /api/v1/auth/clave-publica "" ""
CLAVE_NUCLEO=$(php_eval "$HTTP_BODY" 'return $d["datos"]["clave_publica"] ?? "";')
for destino in "$KONG" "$NOTIFICACIONES"; do
    if [ -n "$(norm_pem "$CLAVE_NUCLEO")" ] && [ "$(norm_pem "$(docker exec "$destino" printenv JWT_PUBLIC_KEY)")" = "$(norm_pem "$CLAVE_NUCLEO")" ]; then
        ok "${destino#restaurantcloudIA_} valida con la misma clave pública que publica el núcleo"
    else
        mal "La clave pública de ${destino#restaurantcloudIA_} (JWT_PUBLIC_KEY) no coincide con la del núcleo"
    fi
done

MONGO_USUARIO=$(docker exec "$MONGO" printenv MONGO_INITDB_ROOT_USERNAME | tr -d '\r')
MONGO_CLAVE=$(docker exec "$MONGO" printenv MONGO_INITDB_ROOT_PASSWORD | tr -d '\r')
MONGO_BASE=$(docker exec "$MONGO" printenv MONGO_INITDB_DATABASE | tr -d '\r')
INDICES=$(mongo "print(db.notificaciones.getIndexes().map(i => i.name).sort().join(','))" | tr -d '\r')
afirmar "MongoDB tiene los índices de la ficha (bandeja por rol, por rol y empresa, por usuario, único por evento y caducidad)" \
    "_id_,bandeja_rol,bandeja_rol_empresa,bandeja_usuario,caducidad,evento_destinatario_unico" "$INDICES"
afirmar "El índice único evita avisos repetidos de un evento" true "$(mongo "print(db.notificaciones.getIndexes().find(i => i.name === 'evento_destinatario_unico').unique === true)" | tr -d '\r')"
afirmar "El índice de caducidad es un TTL sobre expira_en" "0|expira_en" "$(mongo "const i = db.notificaciones.getIndexes().find(i => i.name === 'caducidad'); print(i.expireAfterSeconds + '|' + Object.keys(i.key)[0])" | tr -d '\r')"
afirmar "El validador de esquema es estricto" strict "$(mongo "print(db.getCollectionInfos({name: 'notificaciones'})[0].options.validationLevel)" | tr -d '\r')"
guardar "00-mongodb-indices.txt" "$(mongo "printjson(db.notificaciones.getIndexes())")"

ESTADO_INICIAL=$(docker exec "$API" php artisan outbox:estado 2>&1)
guardar "00-outbox-estado-inicial.txt" "$ESTADO_INICIAL"
if echo "$ESTADO_INICIAL" | grep -q 'ms-notificaciones.*en pausa'; then
    aviso "ms-notificaciones figura en pausa desde antes: la prueba esperará a que se reanude"
fi

[ "$FALLOS" -gt 0 ] && { echo; echo "Las condiciones previas fallaron: no se continúa."; exit 1; }

# ------------------------------------------------------------------ datos y sesiones

titulo "Preparación de datos de prueba (prefijo SMOKE)"

SUFIJO=$(openssl rand -hex 3)
MARCA="SMOKE Lomo $SUFIJO"
PRODUCTO=$(sql "select gen_random_uuid()")
CATEGORIA=$(sql "select gen_random_uuid()")
PISO=$(sql "select gen_random_uuid()")
MESA=$(sql "select gen_random_uuid()")
PEDIDO=$(sql "select gen_random_uuid()")
USUARIO_A=$(sql "select gen_random_uuid()")
USUARIO_B=$(sql "select gen_random_uuid()")
USUARIO_C=$(sql "select gen_random_uuid()")
PEDIDOS+=("$PEDIDO")

sql "insert into categoria_producto (id, local_id, nombre, orden, activa, created_at, updated_at)
     values ('$CATEGORIA', '$LOCAL', 'SMOKE Fondos $SUFIJO', 1, true, now(), now())" > /dev/null
sql "insert into producto (id, categoria_id, local_id, nombre, precio, costo_estandar, disponibilidad, requiere_preparacion, activo, created_at, updated_at)
     values ('$PRODUCTO', '$CATEGORIA', '$LOCAL', '$MARCA', 38.00, 14.50, 'disponible', true, true, now(), now())" > /dev/null
sql "insert into piso (id, local_id, nombre, columnas, filas, estado, created_at, updated_at)
     values ('$PISO', '$LOCAL', 'SMOKE Piso $SUFIJO', 5, 3, 'activo', now(), now())" > /dev/null
sql "insert into mesa (id, local_id, piso_id, numero, capacidad, forma, posicion_x, posicion_y, permite_union, estado, created_at, updated_at)
     values ('$MESA', '$LOCAL', '$PISO', 'SMK$SUFIJO', 4, 'cuadrada', 1, 1, true, 'activa', now(), now())" > /dev/null
sql "insert into pedido (id, local_id, mesa_id, mozo_id, numero_comanda, comensales, estado, tipo_comprobante_sugerido, medio_pago_sugerido, created_at, updated_at)
     values ('$PEDIDO', '$LOCAL', '$MESA', '$MOZO', $((RANDOM % 4000 + 5000)), 3, 'enviado', 'boleta', 'efectivo', now() - interval '20 minutes', now() - interval '20 minutes')" > /dev/null
ok "Producto '$MARCA', mesa y comanda creados"

# Tres platos ya preparados (se anulan de a uno: la anulación de un plato listo es merma y avisa a cocina) y uno en cola
# que queda en la mesa, para que la comanda nunca se quede sin saldo cobrable.
nuevo_item() { # estado -> id del plato
    local id; id=$(sql "select gen_random_uuid()")
    sql "insert into pedido_item (id, pedido_id, producto_id, cantidad, precio_unitario, estado, estado_pago, numero_ronda, stock_descontado, created_at, updated_at)
         values ('$id', '$PEDIDO', '$PRODUCTO', 1, 38.00, '$1', 'pendiente', 1, false, now() - interval '15 minutes', now() - interval '15 minutes')" > /dev/null
    echo "$id"
}
ITEM_B=$(nuevo_item listo)
ITEM_SSE=$(nuevo_item listo)
ITEM_CAIDA=$(nuevo_item listo)
nuevo_item en_cola > /dev/null
ok "La comanda tiene 3 platos listos y 1 en cola"

SESION_COCINA=$(crear_sesion "$COCINA" "Smoke cocina" cocina)
SESION_MOZO=$(crear_sesion "$MOZO" "Smoke mozo" mozo)
SESION_ADMIN=$(crear_sesion "$ADMIN" "Smoke administrador" admin_local)
SESION_PROPIETARIO=$(crear_sesion "$PROPIETARIO" "Smoke propietario" propietario)
ok "Sesiones de cocina, mozo, administrador y propietario creadas (válidas 1 hora)"

declare -A JWT_REAL
JWT_REAL[cocina]=$(jwt_de_sesion "$SESION_COCINA")
JWT_REAL[mozo]=$(jwt_de_sesion "$SESION_MOZO")
JWT_REAL[admin]=$(jwt_de_sesion "$SESION_ADMIN")
JWT_REAL[propietario]=$(jwt_de_sesion "$SESION_PROPIETARIO")
for rol in cocina mozo admin propietario; do
    [ -n "${JWT_REAL[$rol]}" ] && ok "El núcleo emitió el JWT de $rol" || mal "El núcleo no emitió el JWT de $rol"
done
guardar "01-jwt-admin-claims.json" "$(claims_de "${JWT_REAL[admin]}")"

acunar_tokens
cierto "Se firmaron los tokens de prueba con la clave del núcleo (${#JWT[@]} tokens)" "$([ "${#JWT[@]}" -ge 14 ] && echo true || echo false)"
[ "${#JWT[@]}" -lt 14 ] && { echo; echo "No se pudieron fabricar los tokens de prueba: no se continúa."; exit 1; }

# Lo que ya había sin leer en la base de desarrollo, para comparar solo lo que añade esta prueba.
BASE_ADMIN=$(total_sin_leer "${JWT_REAL[admin]}")
BASE_COCINA=$(total_sin_leer "${JWT_REAL[cocina]}")

# ------------------------------------------------------------------ A. plato agotado

titulo "A. Marcar un plato como agotado en cocina y ver el aviso en la bandeja"

INICIO_A=$(ahora)
accion_del_nucleo "$SESION_COCINA" "/api/v1/cocina/productos/$PRODUCTO/marcar-agotado" '{}'
guardar "A-agotado-respuesta.json" "$HTTP_BODY"
afirmar "POST .../cocina/productos/{id}/marcar-agotado (cocina, por Kong) responde 200" 200 "$HTTP_CODE"
afirmar "El plato quedó agotado en el núcleo" agotado "$(sql "select disponibilidad from producto where id = '$PRODUCTO'")"

EVENTO_AGOTADO=$(evento_de_producto "$PRODUCTO")
if [ -z "$EVENTO_AGOTADO" ]; then
    mal "El núcleo no publicó producto.agotado"
else
    ok "El núcleo publicó producto.agotado ($EVENTO_AGOTADO)"
    if esperar_hasta 90 entrega_entregada "$EVENTO_AGOTADO"; then
        SEGUNDOS_A=$(($(ahora) - INICIO_A))
        ok "El evento se entregó a ms-notificaciones en ${SEGUNDOS_A} s"
        [ "$SEGUNDOS_A" -le 30 ] && ok "Dentro de los 30 s que se esperan del outbox" || mal "Tardó más de 30 s (${SEGUNDOS_A} s)"
    else
        mal "El evento no se entregó en 90 s (estado: $(estado_de_entrega "$EVENTO_AGOTADO"))"
    fi
    afirmar "MongoDB guardó un aviso para el administrador y otro para los mozos, ambos de alerta" "admin_local:alerta,mozo:alerta" "$(avisos_en_mongo "$EVENTO_AGOTADO")"
    guardar "A-outbox_entrega.txt" "$(tabla_de_entrega "$EVENTO_AGOTADO")"
    guardar "A-avisos-en-mongodb.txt" "$(mongo "db.notificaciones.find({evento_id: '$EVENTO_AGOTADO'}, {_id: 0, evento_id: 1, destinatario: 1, tipo: 1, severidad: 1, titulo: 1, mensaje: 1, creada_en: 1, expira_en: 1}).forEach(d => printjson(d))")"
fi

pedir_bandeja "${JWT_REAL[admin]}"
afirmar "La bandeja del administrador (por Kong) muestra el plato agotado" 1 "$(cuantos "$BANDEJA" producto.agotado alerta)"
guardar_json "A-bandeja-administrador.json" "$BANDEJA"
pedir_bandeja "${JWT_REAL[mozo]}"
afirmar "La bandeja del mozo muestra el plato agotado" 1 "$(cuantos "$BANDEJA" producto.agotado alerta)"
guardar_json "A-bandeja-mozo.json" "$BANDEJA"
pedir_bandeja "${JWT_REAL[cocina]}"
afirmar "La bandeja de cocina no lo muestra: lo marcó ella" 0 "$(cuantos "$BANDEJA" producto.agotado)"
pedir_bandeja "${JWT_REAL[propietario]}"
afirmar "La bandeja del propietario tampoco" 0 "$(cuantos "$BANDEJA" producto.agotado)"

# ------------------------------------------------------------------ B. plato anulado ya preparado

titulo "B. Anular un plato ya preparado y ver los avisos de administración y cocina"

INICIO_B=$(ahora)
accion_del_nucleo "$SESION_MOZO" "/api/v1/mozo/mesas/$MESA/items/$ITEM_B/anular" '{"motivo_categoria":"demora_cliente","motivo_detalle":"Prueba de humo: demora del cliente"}'
guardar "B-anulacion-respuesta.json" "$HTTP_BODY"
afirmar "POST .../mozo/mesas/{id}/items/{itemId}/anular (por Kong) responde 200" 200 "$HTTP_CODE"
afirmar "El plato ya estaba preparado, así que cuenta como merma" true "$(php_eval "$HTTP_BODY" 'return $d["datos"]["es_merma"] ?? false;')"

EVENTO_ANULADO=$(evento_de_anulacion "$ITEM_B")
if [ -z "$EVENTO_ANULADO" ]; then
    mal "El núcleo no publicó pedido.anulado"
else
    ok "El núcleo publicó pedido.anulado ($EVENTO_ANULADO)"
    if esperar_hasta 90 entrega_entregada "$EVENTO_ANULADO"; then
        ok "El evento se entregó a ms-notificaciones en $(($(ahora) - INICIO_B)) s"
    else
        mal "El evento no se entregó en 90 s (estado: $(estado_de_entrega "$EVENTO_ANULADO"))"
    fi
    afirmar "MongoDB guardó un aviso de alerta para el administrador y uno crítico para cocina" "admin_local:alerta,cocina:critica" "$(avisos_en_mongo "$EVENTO_ANULADO")"
    guardar "B-outbox_entrega.txt" "$(tabla_de_entrega "$EVENTO_ANULADO")"
fi

pedir_bandeja "${JWT_REAL[admin]}"
afirmar "El administrador ve «Plato anulado antes del cobro» como alerta" 1 "$(cuantos "$BANDEJA" pedido.anulado alerta)"
guardar_json "B-bandeja-administrador.json" "$BANDEJA"
pedir_bandeja "${JWT_REAL[cocina]}"
afirmar "Cocina ve «Plato anulado ya preparado» como crítico" 1 "$(cuantos "$BANDEJA" pedido.anulado critica)"
guardar_json "B-bandeja-cocina.json" "$BANDEJA"
pedir_bandeja "${JWT_REAL[mozo]}"
afirmar "El mozo no ve la anulación (no va dirigida a su rol)" 0 "$(cuantos "$BANDEJA" pedido.anulado)"
pedir_bandeja "${JWT_REAL[propietario]}"
afirmar "El propietario no ve la anulación" 0 "$(cuantos "$BANDEJA" pedido.anulado)"

kong GET "$R_TOTAL" "${JWT_REAL[cocina]}" ""
afirmar "El contador de cocina sube en 1 con el aviso crítico" "$((BASE_COCINA + 1))" "$(php_eval "$HTTP_BODY" 'return $d["datos"]["total"] ?? "?";')"

# ------------------------------------------------------------------ C. tiempo real

titulo "C. Un flujo SSE abierto por Kong recibe el aviso al instante"

abrir_flujo() { # nombre, jwt
    curl -sN --max-time 180 -D "$TMPW/flujo-$1.cabeceras" -H "Authorization: Bearer $2" -H 'Accept: text/event-stream' "$URL_KONG/api/v1/notificaciones/stream" > "$TMP/flujo-$1.txt" 2> /dev/null &
    FLUJOS+=("$!")
}
flujo_conectado() { grep -q '^event: conectado' "$TMP/flujo-$1.txt" 2> /dev/null; }
flujo_tiene() { grep -q "$2" "$TMP/flujo-$1.txt" 2> /dev/null; }

kong GET /api/v1/notificaciones/stream "" ""
afirmar "El flujo sin token lo rechaza Kong (401)" "401|kong" "$HTTP_CODE|$(quien_respondio)"

abrir_flujo cocina "${JWT_REAL[cocina]}"
abrir_flujo mozo "${JWT_REAL[mozo]}"
if esperar_pronto 10 flujo_conectado cocina && esperar_pronto 10 flujo_conectado mozo; then
    ok "Los flujos de cocina y de mozo abrieron y recibieron «conectado»"
else
    mal "Un flujo no confirmó la conexión en 10 s"
fi
CABECERAS_FLUJO=$(tr -d '\r' < "$TMP/flujo-cocina.cabeceras" 2> /dev/null)
guardar "C-flujo-cabeceras.txt" "$CABECERAS_FLUJO"
cierto "El flujo responde 200 con Content-Type text/event-stream" "$(echo "$CABECERAS_FLUJO" | head -1 | grep -q ' 200' && echo "$CABECERAS_FLUJO" | grep -qi '^content-type: text/event-stream' && echo true || echo false)"
cierto "Kong no recortó la respuesta: llega por partes (Transfer-Encoding: chunked)" "$(echo "$CABECERAS_FLUJO" | grep -qi '^transfer-encoding: chunked' && echo true || echo false)"
cierto "La respuesta trae X-Request-Id" "$(echo "$CABECERAS_FLUJO" | grep -qi '^x-request-id:' && echo true || echo false)"

ANTES=$(ahora_f)
accion_del_nucleo "$SESION_MOZO" "/api/v1/mozo/mesas/$MESA/items/$ITEM_SSE/anular" '{"motivo_categoria":"demora_cliente","motivo_detalle":"Prueba de humo: segundo plato anulado"}'
afirmar "Se anula otro plato ya preparado (200)" 200 "$HTTP_CODE"
EVENTO_SSE=$(evento_de_anulacion "$ITEM_SSE")

aviso_en_cocina() { flujo_tiene cocina 'Plato anulado ya preparado' && flujo_tiene cocina "$MARCA"; }
if esperar_pronto 30 aviso_en_cocina; then
    LLEGO=$(ahora_f)
    TOTAL_A_CANAL=$(restar "$LLEGO" "$ANTES")
    ok "El aviso llegó al flujo de cocina ${TOTAL_A_CANAL} s después de la acción (incluye el outbox del núcleo)"
    cierto "Llegó en menos de 10 s desde la acción" "$(rapido "$TOTAL_A_CANAL" 10 && echo true || echo false)"
    afirmar "El evento quedó guardado en MongoDB con sus 2 avisos (administrador y cocina)" 2 "$(cantidad_en_mongo "$EVENTO_SSE")"
else
    mal "El aviso no llegó al flujo de cocina en 30 s"
fi
cierto "El aviso trae su id (id:) y el evento «aviso»" "$(grep -B1 '^event: aviso' "$TMP/flujo-cocina.txt" | grep -q '^id: ' && echo true || echo false)"
cierto "El aviso es crítico y no incluye datos internos (empresa_id, leida_por, destinatario)" "$(flujo_tiene cocina '"severidad":"critica"' && ! flujo_tiene cocina 'empresa_id' && ! flujo_tiene cocina 'leida_por' && ! flujo_tiene cocina 'destinatario' && echo true || echo false)"
sleep 1
cierto "El flujo del mozo no recibió ningún aviso: no va dirigido a su rol" "$(! flujo_tiene mozo '^event: aviso' && echo true || echo false)"
guardar "C-flujo-cocina.txt" "$(cat "$TMP/flujo-cocina.txt")"
guardar "C-flujo-mozo.txt" "$(cat "$TMP/flujo-mozo.txt")"
for pid in "${FLUJOS[@]}"; do kill "$pid" > /dev/null 2>&1; done
FLUJOS=()

# ------------------------------------------------------------------ D. reenvío sin duplicar

titulo "D. Reenviar un evento ya entregado no crea otro aviso"

if [ -z "${EVENTO_ANULADO:-}" ]; then
    mal "Se omite el reenvío porque el escenario B no publicó el evento"
else
    ANTES_MONGO=$(cantidad_en_mongo "$EVENTO_ANULADO")
    afirmar "El evento tiene sus 2 avisos antes del reenvío" 2 "$ANTES_MONGO"

    # El comando solo reenvía entregas fallidas: la de la prueba se marca como tal.
    sql "update outbox_entrega set estado = 'fallido', motivo_fallo = 'error_receptor' where evento_id = '$EVENTO_ANULADO' and destino = 'ms-notificaciones'" > /dev/null
    SIMULACION=$(docker exec "$API" php artisan outbox:reenviar-eventos --destino=ms-notificaciones --tipo=pedido.anulado --dry-run 2>&1)
    guardar "D-reenvio-simulacion.txt" "$SIMULACION"
    if echo "$SIMULACION" | grep -q 'se reenviarían 1 entregas'; then
        ok "La simulación (--dry-run) reenviaría solo esa entrega"
        REENVIO=$(docker exec "$API" php artisan outbox:reenviar-eventos --destino=ms-notificaciones --tipo=pedido.anulado 2>&1)
        guardar "D-reenvio.txt" "$REENVIO"
        cierto "El comando devolvió la entrega a pendiente" "$(echo "$REENVIO" | grep -q 'devueltas a pendiente: 1' && echo true || echo false)"
        if esperar_hasta 90 entrega_entregada "$EVENTO_ANULADO"; then
            ok "El evento se volvió a entregar"
        else
            mal "El evento reenviado no se entregó en 90 s (estado: $(estado_de_entrega "$EVENTO_ANULADO"))"
        fi
        afirmar "La entrega cuenta 1 reenvío" 1 "$(sql "select reenvios from outbox_entrega where evento_id = '$EVENTO_ANULADO' and destino = 'ms-notificaciones'")"
        afirmar "MongoDB sigue teniendo 2 avisos del evento: el reenvío no creó otros" 2 "$(cantidad_en_mongo "$EVENTO_ANULADO")"
        pedir_bandeja "${JWT_REAL[admin]}"
        afirmar "La bandeja del administrador no muestra el aviso repetido (2 anulaciones: la del escenario B y la del flujo)" 2 "$(cuantos "$BANDEJA" pedido.anulado alerta)"
        guardar "D-outbox_entrega.txt" "$(tabla_de_entrega "$EVENTO_ANULADO")"
    else
        mal "El comando habría reenviado otras entregas fallidas, no solo la de la prueba: no se reenvía nada. Salida:
$SIMULACION"
        sql "update outbox_entrega set estado = 'entregado', motivo_fallo = null where evento_id = '$EVENTO_ANULADO' and destino = 'ms-notificaciones'" > /dev/null
    fi
fi

# ------------------------------------------------------------------ E. aislamiento y leído por usuario

titulo "E. Aislamiento entre empresa, sede, rol y usuario"

pedir_bandeja "${JWT[admin_otro_usuario]}"
afirmar "Otro administrador de la misma sede ve los mismos avisos de rol (3: 1 agotado y 2 anulaciones)" 3 "$(avisos_de_la_prueba "$BANDEJA" | wc -l | tr -d ' ')"
pedir_bandeja "${JWT[admin_otra_sede]}"
afirmar "Un administrador de otra sede no ve ningún aviso de la prueba" 0 "$(avisos_de_la_prueba "$BANDEJA" | wc -l | tr -d ' ')"
pedir_bandeja "${JWT[admin_otra_empresa]}"
afirmar "Un administrador de otra empresa no ve ningún aviso de la prueba" 0 "$(avisos_de_la_prueba "$BANDEJA" | wc -l | tr -d ' ')"
kong GET "$R_TOTAL" "${JWT[admin_otra_empresa]}" ""
afirmar "…ni los cuenta en su contador (total 0)" 0 "$(php_eval "$HTTP_BODY" 'return $d["datos"]["total"] ?? "?";')"

pedir_bandeja "${JWT[mozo_a]}"
BANDEJA_MOZO_A=$BANDEJA
pedir_bandeja "${JWT[mozo_b]}"
afirmar "Dos mozos distintos ven el mismo aviso de rol (plato agotado)" "1|1" "$(cuantos "$BANDEJA_MOZO_A" producto.agotado)|$(cuantos "$BANDEJA" producto.agotado)"

ID_AGOTADO=$(id_del_aviso "$BANDEJA_MOZO_A" producto.agotado)
ID_ANULACION_ADMIN=$(id_del_aviso "$(pedir_bandeja "${JWT_REAL[admin]}"; echo "$BANDEJA")" pedido.anulado)
SIN_LEER_A=$(total_sin_leer "${JWT[mozo_a]}")
SIN_LEER_B=$(total_sin_leer "${JWT[mozo_b]}")

kong PATCH "/api/v1/notificaciones/$ID_AGOTADO/leida" "${JWT[mozo_a]}" ""
afirmar "El primer mozo marca el aviso como leído (200)" 200 "$HTTP_CODE"
kong PATCH "/api/v1/notificaciones/$ID_AGOTADO/leida" "${JWT[mozo_a]}" ""
afirmar "Marcarlo otra vez es idempotente (200)" 200 "$HTTP_CODE"
pedir_bandeja "${JWT[mozo_a]}"
afirmar "Para el primer mozo el aviso figura leído" 1 "$(leida_de "$BANDEJA" "$ID_AGOTADO")"
pedir_bandeja "${JWT[mozo_b]}"
afirmar "Para el segundo mozo, del mismo rol, sigue sin leer" 0 "$(leida_de "$BANDEJA" "$ID_AGOTADO")"
afirmar "El contador del primero bajó en 1" $((SIN_LEER_A - 1)) "$(total_sin_leer "${JWT[mozo_a]}")"
afirmar "El contador del segundo no cambió" "$SIN_LEER_B" "$(total_sin_leer "${JWT[mozo_b]}")"
LECTURAS=$(mongo "print(db.notificaciones.findOne({_id: ObjectId('$ID_AGOTADO')}).leida_por.length)" | tr -d '\r')
afirmar "MongoDB guarda una sola lectura (no se duplicó al marcar dos veces)" 1 "$LECTURAS"

kong PATCH "/api/v1/notificaciones/$ID_ANULACION_ADMIN/leida" "${JWT[mozo_a]}" ""
afirmar "Un mozo no puede marcar un aviso dirigido al administrador (404, como si no existiera)" "404|ERR_AVISO_NO_ENCONTRADO" "$HTTP_CODE|$(codigo_de_error)"
kong PATCH "/api/v1/notificaciones/$ID_ANULACION_ADMIN/leida" "${JWT[admin_otra_empresa]}" ""
afirmar "Un administrador de otra empresa tampoco (404)" 404 "$HTTP_CODE"
kong PATCH "/api/v1/notificaciones/$ID_ANULACION_ADMIN/leida" "${JWT[admin_otra_sede]}" ""
afirmar "Ni uno de otra sede (404)" 404 "$HTTP_CODE"
afirmar "Ningún intento ajeno dejó una lectura en el aviso del administrador" 0 "$(mongo "print(db.notificaciones.findOne({_id: ObjectId('$ID_ANULACION_ADMIN')}).leida_por.length)" | tr -d '\r')"

kong POST /api/v1/notificaciones/marcar-todas-leidas "${JWT[mozo_b]}" ""
afirmar "El segundo mozo marca todo como leído (200)" 200 "$HTTP_CODE"
afirmar "Su contador queda en 0" 0 "$(total_sin_leer "${JWT[mozo_b]}")"
afirmar "El contador del administrador no se tocó" "$((BASE_ADMIN + 3))" "$(total_sin_leer "${JWT_REAL[admin]}")"
afirmar "Los avisos de cocina siguen sin leer para cocina" "$((BASE_COCINA + 2))" "$(total_sin_leer "${JWT_REAL[cocina]}")"

kong GET "$R_BANDEJA" "${JWT[admin_otro_usuario]}" "$SEDE_AJENA"
afirmar "Pedir otra sede con X-Local-Id siendo administrador de una sede es 403 ERR_SEDE_NO_PERMITIDA" "403|ERR_SEDE_NO_PERMITIDA" "$HTTP_CODE|$(codigo_de_error)"
kong GET "$R_BANDEJA" "${JWT[admin_otro_usuario]}" "no-es-un-uuid"
afirmar "Un X-Local-Id que no es uuid es 422 ERR_PARAMETRO_INVALIDO" "422|ERR_PARAMETRO_INVALIDO" "$HTTP_CODE|$(codigo_de_error)"
kong GET '/api/v1/notificaciones?por_pagina=500' "${JWT[admin_otro_usuario]}" ""
afirmar "Un por_pagina fuera de rango es 422 ERR_PARAMETRO_INVALIDO" "422|ERR_PARAMETRO_INVALIDO" "$HTTP_CODE|$(codigo_de_error)"

# ------------------------------------------------------------------ F. tokens y firmas fuera de regla

titulo "F. Tokens fuera de regla, firma interna y rutas que no se exponen"

RUTA=$R_TOTAL
probar_rechazo_de_kong "sin token" "" "$RUTA"
probar_rechazo_de_kong "token vencido" "${JWT[vencido]}" "$RUTA"
probar_rechazo_de_kong "token con más de 15 minutos de vida" "${JWT[una_hora]}" "$RUTA"
probar_rechazo_de_kong "token que aún no vale (nbf)" "${JWT[aun_no_vale]}" "$RUTA"
probar_rechazo_de_kong "firmado con otra clave" "${JWT[clave_ajena]}" "$RUTA"
probar_rechazo_de_kong "algoritmo none" "${JWT[alg_none]}" "$RUTA"
probar_rechazo_de_kong "HS256 con la clave pública como secreto" "${JWT[hs256_con_clave_publica]}" "$RUTA"
probar_rechazo_de_kong "emisor ajeno" "${JWT[emisor_ajeno]}" "$RUTA"
probar_rechazo_de_kong "el JWT en la URL, no en la cabecera" "" "$RUTA?jwt=${JWT[admin_otro_usuario]}"
probar_rechazo_de_kong "el canal SSE sin token" "" /api/v1/notificaciones/stream
probar_rechazo_de_kong "el canal SSE con un token vencido" "${JWT[vencido]}" /api/v1/notificaciones/stream

# Lo que Kong no mira (audiencia, rol, sede) lo rechaza el servicio con su formato común.
probar_respuesta_del_servicio "Audiencia ajena: Kong lo deja pasar y el servicio lo rechaza" 401 ERR_TOKEN_INVALIDO "${JWT[audiencia_ajena]}" "" "$RUTA"
probar_respuesta_del_servicio "El administrador SaaS no tiene bandeja" 403 ERR_ROL_NO_PERMITIDO "${JWT[admin_saas]}" "" "$RUTA"
probar_respuesta_del_servicio "Un rol de sede sin sede en el token no ve toda la empresa" 401 ERR_TOKEN_INVALIDO "${JWT[mozo_sin_sede]}" "" "$RUTA"
probar_respuesta_del_servicio "Un token válido recibe su contador" 200 "" "${JWT_REAL[admin]}" "" "$RUTA"

# /interno y /health no tienen ruta en Kong.
kong POST /interno/eventos "" "" -H 'Content-Type: application/json' --data-binary '{}'
afirmar "/interno/eventos no se expone: Kong responde 404" "404|kong" "$HTTP_CODE|$(quien_respondio)"
kong POST /api/v1/notificaciones/interno/eventos "${JWT_REAL[admin]}" "" -H 'Content-Type: application/json' --data-binary '{}'
cierto "…ni colgado de la ruta de la bandeja: no llega a un evento (404)" "$([ "$HTTP_CODE" = 404 ] && echo true || echo false)"
kong GET /health "" ""
afirmar "/health de ms-notificaciones no se expone por Kong (404)" 404 "$HTTP_CODE"

# Firma interna, directo al servicio (en Docker solo el núcleo lo alcanza).
cuerpo_evento() { printf '{"id":"%s","tipo":"venta.registrada","version":1,"ocurrido_en":"2026-11-22T12:00:00-05:00","origen":"nucleo","empresa_id":"%s","local_id":"%s","datos":{}}' "$(sql "select gen_random_uuid()")" "$EMPRESA" "$LOCAL"; }
firmar() { # timestamp, cuerpo, secreto
    printf '%s.%s' "$1" "$2" | openssl dgst -sha256 -hmac "$3" | sed 's/^.* //'
}
enviar_interno() { # cabeceras de firma..., cuerpo
    local cuerpo=$1; shift
    local salida
    salida=$(curl -s -w $'\n%{http_code}' -X POST "$URL_NOTIFICACIONES/interno/eventos" -H 'Content-Type: application/json' "$@" --data-binary "$cuerpo")
    HTTP_CODE=${salida##*$'\n'}
    HTTP_BODY=${salida%$'\n'*}
}
CUERPO=$(cuerpo_evento)
MARCA_TIEMPO=$(ahora)
enviar_interno "$CUERPO"
afirmar "Un evento sin firma es 401 ERR_FIRMA_INVALIDA" "401|ERR_FIRMA_INVALIDA" "$HTTP_CODE|$(codigo_de_error)"
enviar_interno "$CUERPO" -H "X-Timestamp: $MARCA_TIEMPO" -H "X-Firma: $(firmar "$MARCA_TIEMPO" "$CUERPO" "otro-secreto")"
afirmar "Un evento firmado con otro secreto es 401 ERR_FIRMA_INVALIDA" "401|ERR_FIRMA_INVALIDA" "$HTTP_CODE|$(codigo_de_error)"
VIEJA=$((MARCA_TIEMPO - 900))
enviar_interno "$CUERPO" -H "X-Timestamp: $VIEJA" -H "X-Firma: $(firmar "$VIEJA" "$CUERPO" "$SECRETO_SERVICIO")"
afirmar "Un evento con la firma de hace 15 minutos es 401 (repetición)" "401|ERR_FIRMA_INVALIDA" "$HTTP_CODE|$(codigo_de_error)"
enviar_interno "$CUERPO" -H "X-Timestamp: $MARCA_TIEMPO" -H "X-Firma: $(firmar "$MARCA_TIEMPO" "$CUERPO" "$SECRETO_SERVICIO")"
afirmar "Un evento bien firmado de un tipo que no genera avisos (venta.registrada) se acepta sin crear nada (200)" "200|ignorado" "$HTTP_CODE|$(php_eval "$HTTP_BODY" 'return $d["datos"]["estado"] ?? "";')"
CUERPO_ALTERADO=${CUERPO/venta.registrada/pedido.anulado}
enviar_interno "$CUERPO_ALTERADO" -H "X-Timestamp: $MARCA_TIEMPO" -H "X-Firma: $(firmar "$MARCA_TIEMPO" "$CUERPO" "$SECRETO_SERVICIO")"
afirmar "Un cuerpo alterado después de firmar es 401: la firma cubre los bytes exactos" "401|ERR_FIRMA_INVALIDA" "$HTTP_CODE|$(codigo_de_error)"
TABLA_TOKENS+=("Firma interna ausente, de otro secreto, vieja o con el cuerpo alterado|401 ERR_FIRMA_INVALIDA del servicio|401 ERR_FIRMA_INVALIDA del servicio|ok")

# ------------------------------------------------------------------ G. caída y reintento

if [ "$RAPIDO" = 1 ]; then
    titulo "G. Caída de ms-notificaciones (omitida por --rapido)"
else
    titulo "G. Apagar ms-notificaciones, operar, encenderla y ver que los avisos llegan solos"

    docker stop "$NOTIFICACIONES" > /dev/null && NOTIFICACIONES_APAGADA_POR_EL_SCRIPT=1
    ok "ms-notificaciones apagada"

    kong GET "$R_BANDEJA" "${JWT_REAL[admin]}" ""
    guardar "G-bandeja-con-el-servicio-caido.txt" "HTTP $HTTP_CODE ($TIEMPO s)
$(tr -d '\r' < "$TMP/cabeceras")

$HTTP_BODY"
    cierto "Con el servicio caído Kong responde un error controlado, 502, 503 o 504 ($HTTP_CODE)" "$([ "$HTTP_CODE" = 502 ] || [ "$HTTP_CODE" = 503 ] || [ "$HTTP_CODE" = 504 ] && echo true || echo false)"
    afirmar "El error es de Kong, no un cuelgue" kong "$(quien_respondio)"
    cierto "Responde rápido, sin colgarse (${TIEMPO}s)" "$(rapido "$TIEMPO" 20 && echo true || echo false)"

    INICIO_G=$(ahora)
    accion_del_nucleo "$SESION_MOZO" "/api/v1/mozo/mesas/$MESA/items/$ITEM_CAIDA/anular" '{"motivo_categoria":"demora_cliente","motivo_detalle":"Prueba de humo: anulacion con el servicio caido"}'
    afirmar "El núcleo anula el plato con normalidad aunque ms-notificaciones esté caída (200)" 200 "$HTTP_CODE"
    kong GET /up "" ""
    afirmar "…y el resto del sistema sigue atendiendo (200)" 200 "$HTTP_CODE"

    EVENTO_CAIDA=$(evento_de_anulacion "$ITEM_CAIDA")
    if [ -z "$EVENTO_CAIDA" ]; then
        mal "No se publicó pedido.anulado durante la caída"
    else
        if esperar_hasta 90 entrega_con_fallo "$EVENTO_CAIDA"; then
            FILA=$(sql "select estado || '|' || coalesce(motivo_fallo, '') || '|' || fallos_receptor from outbox_entrega where evento_id = '$EVENTO_CAIDA' and destino = 'ms-notificaciones'")
            afirmar "La entrega queda pendiente, por destino no disponible y sin gastar intentos" "pendiente|no_disponible|0" "$FILA"
        else
            mal "El worker no intentó la entrega en 90 s"
        fi
        ESTADO_CAIDA=$(docker exec "$API" php artisan outbox:estado 2>&1)
        guardar "G-outbox-estado-durante-la-caida.txt" "$ESTADO_CAIDA"
        cierto "outbox:estado muestra el destino en pausa" "$(echo "$ESTADO_CAIDA" | grep -q 'ms-notificaciones.*en pausa' && echo true || echo false)"
        afirmar "Mientras tanto no hay avisos del evento en MongoDB" 0 "$(cantidad_en_mongo "$EVENTO_CAIDA")"

        docker start "$NOTIFICACIONES" > /dev/null && NOTIFICACIONES_APAGADA_POR_EL_SCRIPT=0
        REANUDACION=$(ahora)
        ok "ms-notificaciones encendida de nuevo"

        if esperar_hasta 240 entrega_entregada "$EVENTO_CAIDA"; then
            ok "El evento llegó solo, $(($(ahora) - REANUDACION)) s después de encender el servicio"
        else
            mal "El evento no llegó en 240 s tras encender ms-notificaciones (estado: $(estado_de_entrega "$EVENTO_CAIDA"))"
        fi
        afirmar "MongoDB tiene ahora los avisos del evento" "admin_local:alerta,cocina:critica" "$(avisos_en_mongo "$EVENTO_CAIDA")"
        afirmar "La entrega no quedó contada como fallo del receptor" 0 "$(sql "select fallos_receptor from outbox_entrega where evento_id = '$EVENTO_CAIDA' and destino = 'ms-notificaciones'")"
        cierto "El destino volvió a estado normal" "$(docker exec "$API" php artisan outbox:estado 2>&1 | grep -q 'ms-notificaciones.*normal' && echo true || echo false)"
        pedir_bandeja "${JWT_REAL[admin]}"
        afirmar "La bandeja del administrador muestra las 3 anulaciones, la última llegada tarde" 3 "$(cuantos "$BANDEJA" pedido.anulado alerta)"
        cierto "El aviso conserva la hora del hecho, no la de la recepción" "$(php_eval "$BANDEJA" 'foreach ($d["datos"] as $a) { if ($a["tipo"] === "pedido.anulado" && str_contains($a["mensaje"], "'"$MARCA"'")) { $creada[] = strtotime($a["creada_en"]); } } return count($creada ?? []) === 3 && max($creada) < time() - 1 ? "true" : "false";')"
        guardar "G-outbox_entrega.txt" "$(tabla_de_entrega "$EVENTO_CAIDA")"
    fi
fi

# ------------------------------------------------------------------ resumen

titulo "Resumen"
guardar "99-contenedores.txt" "$(docker ps --format '{{.Names}}\t{{.Status}}' | grep restaurantcloudIA | sort)"
guardar "99-outbox-estado-final.txt" "$(docker exec "$API" php artisan outbox:estado 2>&1)"
guardar "99-ms-notificaciones-logs.txt" "$(docker logs --tail 60 "$NOTIFICACIONES" 2>&1)"
# El log de Kong registra la URL de la prueba «JWT en la URL»: se tacha el token antes de guardarlo.
guardar "99-kong-logs.txt" "$(docker logs --tail 40 "$KONG" 2>&1 | sed -E 's/jwt=[A-Za-z0-9_.-]+/jwt=REDACTADO/g')"

TOTAL=${#RESULTADOS[@]}
if [ "$EVIDENCIAS" = 1 ]; then
    {
        echo "# Prueba de humo: núcleo → outbox → ms-notificaciones → Kong"
        echo
        echo "- **Fecha:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo "- **Kong:** $(docker exec "$KONG" kong version 2> /dev/null | tr -d '\r')"
        echo "- **Producto de la prueba:** $MARCA"
        echo "- **Resultado:** $((TOTAL - FALLOS)) de $TOTAL comprobaciones correctas"
        echo
        echo "| | Comprobación |"
        echo "|---|---|"
        for fila in "${RESULTADOS[@]}"; do echo "| ${fila%%|*} | ${fila#*|} |"; done
        echo
        echo "## Tokens y firmas fuera de regla"
        echo
        echo "| Caso | Esperado | Obtenido | |"
        echo "|---|---|---|---|"
        for fila in "${TABLA_TOKENS[@]}"; do IFS='|' read -r c e o r <<< "$fila"; echo "| $c | $e | $o | $r |"; done
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
