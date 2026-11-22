#!/usr/bin/env bash
# Prueba de humo del gateway: navegador -> Kong -> núcleo y ms-analítica, con el JWT que emite el núcleo.
#
# Hace lo que haría la pantalla de reportes, contra el Compose en marcha, y comprueba cada eslabón: que Kong
# enrute, que el JWT real del núcleo lo acepten Kong y ms-analítica, que los cuatro reportes de CU-ADMIN-13 cuadren
# entre sí, que un token fuera de regla se rechace (y se sepa QUIÉN lo rechazó: Kong o el servicio), el aislamiento
# entre empresas y sedes, que nada de /interno se vea desde fuera, el CORS, el X-Request-Id, el límite de peticiones
# y la caída de ms-analítica.
#
# Uso (desde restaurantcloud/):
#   ./scripts/smoke-gateway.sh                    # todo
#   ./scripts/smoke-gateway.sh --rapido           # sin la caída de ms-analítica ni el límite de peticiones
#   ./scripts/smoke-gateway.sh --levantar         # antes, docker compose up -d --build de kong, api y analitica
#   ./scripts/smoke-gateway.sh --sin-evidencias
#
# Qué deja en la base de desarrollo: nada. Los reportes son de solo lectura y las sesiones temporales (sin
# contraseñas, en Redis) se borran al salir.
#
# Qué hay que saber antes de ejecutarlo:
#   - El escenario del límite de peticiones agota a propósito los 120 por minuto que Kong da a las rutas de
#     microservicios: durante ese minuto, cualquier pantalla abierta desde esta misma IP recibe 429. El script espera
#     a que el límite se levante antes de terminar. Con --rapido no ocurre.
#   - El escenario de caída apaga ms-analítica unos segundos y la vuelve a encender; si el script se interrumpe con
#     ella apagada, la enciende al salir.
#
# Evidencias (respuestas, cabeceras y tablas) en doc-2u/evidencias/smoke-gateway/<fecha>/, carpeta que no se
# versiona, para la sección «Pruebas de integración» del informe. No se guarda ningún secreto ni token (de los JWT
# solo se guardan los claims, sin la firma).
#
# Sale con código distinto de 0 si algún paso falla.

set -uo pipefail
# Git Bash en Windows convierte las rutas que empiezan por "/" en rutas de Windows; los contenedores no las quieren.
export MSYS_NO_PATHCONV=1

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

API=restaurantcloudIA_api
DB=restaurantcloudIA_db
REDIS=restaurantcloudIA_redis
KONG=restaurantcloudIA_kong
ANALITICA=restaurantcloudIA_analitica
URL_KONG=http://localhost:8000
URL_ANALITICA_DIRECTA=http://localhost:8001

EMPRESA=00000000-0000-4000-8000-000000000001
LOCAL=00000000-0000-4000-8000-000000000010
PROPIETARIO=00000000-0000-4000-8000-000000000101
ADMIN=00000000-0000-4000-8000-000000000102
SEDE_AJENA=00000000-0000-4000-8000-0000000000aa

LEVANTAR=0
RAPIDO=0
EVIDENCIAS=1
for argumento in "$@"; do
    case "$argumento" in
        --levantar) LEVANTAR=1 ;;
        --rapido) RAPIDO=1 ;;
        --sin-evidencias) EVIDENCIAS=0 ;;
        -h | --help) sed -n '2,32p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Opción desconocida: $argumento (use --help)"; exit 2 ;;
    esac
done

# ------------------------------------------------------------------ utilidades

VERDE=$'\033[32m'; ROJO=$'\033[31m'; AMARILLO=$'\033[33m'; NEUTRO=$'\033[0m'
FALLOS=0
RESULTADOS=()
TOKENS=()
TABLA_TOKENS=()
TMP=$(mktemp -d)
ANALITICA_APAGADA_POR_EL_SCRIPT=0

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

psql_nucleo() { docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 -c "$0"' "$1"; }

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
    EV="$RAIZ/../doc-2u/evidencias/smoke-gateway/$(date +%Y%m%d-%H%M%S)"
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
    # Si el script se interrumpe con ms-analítica apagada por él, la deja encendida.
    if [ "$ANALITICA_APAGADA_POR_EL_SCRIPT" = 1 ]; then
        docker start "$ANALITICA" > /dev/null 2>&1
    fi
    if [ "${#TOKENS[@]}" -gt 0 ]; then
        local codigo=""
        for t in "${TOKENS[@]}"; do
            codigo="$codigo"'Illuminate\Support\Facades\Redis::del("auth:session:".hash("sha256","'"$t"'"));'
        done
        docker exec "$API" php artisan tinker --execute="$codigo" > /dev/null 2>&1
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
cuantas_cabeceras() { grep -ic "^$1:" "$TMP/cabeceras"; }

# Las respuestas que genera Kong (401, 404, 429, 502, 504…) llevan «Server: kong/…»; las de un servicio llevan el
# servidor de ese servicio (uvicorn, FrankenPHP).
quien_respondio() { [[ "$(cabecera server)" == kong* ]] && echo kong || echo servicio; }

codigo_de_error() { php_eval "$HTTP_BODY" 'return $d["errores"][0]["codigo"] ?? "";'; }
mensaje_de_kong() { php_eval "$HTTP_BODY" 'return $d["message"] ?? "";'; }

norm_pem() { printf '%s' "$1" | sed 's/\\n//g' | tr -d ' \r\n'; }

# Claims de un JWT (sin la firma) como JSON.
claims_de() { php_eval "{\"jwt\":\"$1\"}" '$p = explode(".", $d["jwt"]); return json_encode(["cabecera" => json_decode(base64_decode(strtr($p[0], "-_", "+/")), true), "claims" => json_decode(base64_decode(strtr($p[1], "-_", "+/")), true)]);'; }

# ------------------------------------------------------------------ tokens fuera de regla

# Se firman con la clave real del núcleo (o con otra, o con ninguna) para probar cada defensa por separado.
read -r -d '' CODIGO_TOKENS <<'FIN'
$t = app(App\Domains\Auth\Services\TokenServicios::class);
$m = new ReflectionMethod($t, 'clavePrivada');
$m->setAccessible(true);
$clave = $m->invoke($t);
$kid = $t->kid();
$b = fn ($s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
$ahora = time();
$base = ['iss' => config('jwt.emisor'), 'aud' => config('jwt.audiencia'), 'sub' => getenv('ADMIN'), 'rol' => 'admin_local', 'empresa_id' => getenv('EMPRESA'), 'local_id' => getenv('LOCAL'), 'modulos' => ['prediccion', 'reportes_avanzados'], 'iat' => $ahora, 'nbf' => $ahora, 'exp' => $ahora + 600, 'jti' => bin2hex(random_bytes(8))];
$firmar = fn (array $c) => App\Support\JwtRs256::codificar($c, $clave, $kid);
$s = [];
$s['admin'] = $firmar($base);
$s['propietario'] = $firmar(array_merge($base, ['sub' => getenv('PROPIETARIO'), 'rol' => 'propietario', 'local_id' => null]));
$s['mozo'] = $firmar(array_merge($base, ['rol' => 'mozo']));
$s['sin_modulos'] = $firmar(array_merge($base, ['modulos' => []]));
$s['otra_empresa'] = $firmar(array_merge($base, ['empresa_id' => '00000000-0000-4000-8000-0000000000ff']));
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
    salida=$(docker exec -e ADMIN="$ADMIN" -e PROPIETARIO="$PROPIETARIO" -e EMPRESA="$EMPRESA" -e LOCAL="$LOCAL" "$API" php artisan tinker --execute="$CODIGO_TOKENS" 2>&1)
    while IFS= read -r linea; do
        case "$linea" in
            TOKEN\ *) read -r _ nombre jwt <<< "$linea"; JWT["$nombre"]=$jwt ;;
        esac
    done <<< "$salida"
}

# Un token que Kong debe rechazar él mismo (401, sin llegar a ms-analítica).
probar_rechazo_de_kong() { # nombre, descripción, jwt|"", ruta, [argumentos de curl...]
    local nombre=$1 descripcion=$2 jwt=$3 ruta=$4
    shift 4
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
probar_respuesta_del_servicio() { # nombre, descripción, http esperado, código de error esperado|"", jwt, local_id|"", ruta
    local descripcion=$2 esperado=$3 codigo=$4 jwt=$5 local_id=$6 ruta=$7
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

# ------------------------------------------------------------------ 0. condiciones previas

titulo "0. Condiciones previas"

if ! docker info > /dev/null 2>&1; then
    mal "Docker no responde. Inicie Docker Desktop y vuelva a ejecutar."
    exit 1
fi

if [ "$LEVANTAR" = 1 ]; then
    echo "  Levantando los servicios (docker compose up -d --build)..."
    docker compose up -d --build api analitica kong > /dev/null 2>&1 || mal "docker compose up falló"
    sleep 15
fi

for contenedor in "$API" "$DB" "$REDIS" "$ANALITICA" "$KONG"; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$contenedor" 2>/dev/null)" = true ]; then
        ok "Contenedor $contenedor en ejecución"
    else
        mal "El contenedor $contenedor no está en ejecución (docker compose up -d)"
    fi
done
[ "$FALLOS" -gt 0 ] && { echo; echo "Faltan contenedores: no se puede continuar."; exit 1; }

afirmar "Kong está sano" healthy "$(docker inspect -f '{{.State.Health.Status}}' "$KONG" 2>/dev/null)"
afirmar "Kong no expone API de administración (KONG_ADMIN_LISTEN=off)" off "$(docker exec "$KONG" printenv KONG_ADMIN_LISTEN | tr -d '\r')"

kong GET /api/v1/auth/clave-publica "" ""
CLAVE_JSON=$HTTP_BODY
afirmar "El núcleo publica su clave pública a través de Kong (200)" 200 "$HTTP_CODE"
hechos "$CLAVE_JSON" 'return ["kid" => $d["datos"]["kid"] ?? "", "emisor" => $d["datos"]["emisor"] ?? "", "audiencia" => $d["datos"]["audiencia"] ?? "", "algoritmo" => $d["datos"]["algoritmo"] ?? ""];'
KID=${H[kid]:-}
EMISOR=${H[emisor]:-}
AUDIENCIA=${H[audiencia]:-}
afirmar "El algoritmo publicado es RS256" RS256 "${H[algoritmo]:-}"

CLAVE_NUCLEO=$(php_eval "$CLAVE_JSON" 'return $d["datos"]["clave_publica"] ?? "";')
CLAVE_KONG=$(docker exec "$KONG" printenv JWT_PUBLIC_KEY)
CLAVE_ANALITICA=$(docker exec "$ANALITICA" printenv JWT_PUBLIC_KEY)
if [ -n "$(norm_pem "$CLAVE_NUCLEO")" ] && [ "$(norm_pem "$CLAVE_KONG")" = "$(norm_pem "$CLAVE_NUCLEO")" ]; then
    ok "Kong valida con la misma clave pública que publica el núcleo"
else
    mal "La clave pública de Kong (JWT_PUBLIC_KEY) no coincide con la del núcleo"
fi
if [ "$(norm_pem "$CLAVE_ANALITICA")" = "$(norm_pem "$CLAVE_NUCLEO")" ]; then
    ok "ms-analítica valida con la misma clave pública que publica el núcleo"
else
    mal "La clave pública de ms-analítica (JWT_PUBLIC_KEY) no coincide con la del núcleo"
fi

AYER=$(psql_nucleo "select ((now() at time zone 'America/Lima')::date - 1)")
DESDE=$(psql_nucleo "select ((now() at time zone 'America/Lima')::date - 30)")
HASTA=$AYER
Q="desde=$DESDE&hasta=$HASTA"
R_RESUMEN="/api/v1/analitica/ventas/resumen?$Q"
R_HORAS="/api/v1/analitica/ventas/por-hora?$Q"
R_RANKING="/api/v1/analitica/productos/ranking?$Q"
R_EQUIPO="/api/v1/analitica/personal/desempeno?$Q"
echo "  Periodo de las consultas: $DESDE a $HASTA (30 días hasta ayer)"

[ "$FALLOS" -gt 0 ] && { echo; echo "Las condiciones previas fallaron: no se continúa."; exit 1; }

TOKEN_ADMIN=$(crear_sesion "$ADMIN" "Smoke administrador" "admin@aurea.local" admin_local "$LOCAL")
TOKEN_PROPIETARIO=$(crear_sesion "$PROPIETARIO" "Smoke propietario" "propietario@aurea.local" propietario "")
ok "Sesiones temporales creadas (administrador y propietario; válidas 1 hora)"

# ------------------------------------------------------------------ 1. enrutamiento

titulo "1. Enrutamiento: qué atiende cada prefijo"

kong GET /up "" ""
afirmar "/up llega al núcleo (200)" 200 "$HTTP_CODE"
afirmar "Lo atiende el núcleo (FrankenPHP), no Kong" servicio "$(quien_respondio)"

kong POST /api/v1/auth/login "" "" -H 'Content-Type: application/json' --data-binary '{"correo":"nadie@aurea.local","password":"incorrecta"}'
cierto "El login llega al núcleo, que responde con su formato común ($HTTP_CODE)" "$([ "$HTTP_CODE" -ge 400 ] && [ "$HTTP_CODE" -lt 500 ] && [ "$(php_eval "$HTTP_BODY" 'return var_export($d["exito"] ?? null, true);')" = false ] && echo true || echo false)"

kong GET /api/v1/auth/me "$TOKEN_ADMIN" ""
afirmar "Una ruta del núcleo con su token de sesión funciona a través de Kong (200)" 200 "$HTTP_CODE"
kong GET /api/v1/ruta-que-no-existe "" ""
afirmar "Una ruta desconocida bajo /api/v1 la responde el núcleo (404)" 404 "$HTTP_CODE"
afirmar "Lo responde el núcleo, no Kong" servicio "$(quien_respondio)"

kong GET /otra-cosa "" ""
afirmar "Una ruta fuera de todo prefijo la responde Kong con 404" 404 "$HTTP_CODE"
afirmar "Esa respuesta es de Kong" kong "$(quien_respondio)"

kong GET "$R_RESUMEN" "" ""
afirmar "Una ruta de reportes sin JWT la rechaza Kong (401)" 401 "$HTTP_CODE"
afirmar "El rechazo es de Kong: la petición no llega a ms-analítica" kong "$(quien_respondio)"
afirmar "Kong responde con su propio formato" Unauthorized "$(mensaje_de_kong)"

# ------------------------------------------------------------------ 2. el JWT que emite el núcleo

titulo "2. El JWT que emite el núcleo"

kong POST /api/v1/auth/token-servicios "" ""
afirmar "Sin sesión, el núcleo no emite un JWT (401)" 401 "$HTTP_CODE"

kong POST /api/v1/auth/token-servicios "$TOKEN_ADMIN" ""
afirmar "Con la sesión del administrador, el núcleo emite un JWT (200)" 200 "$HTTP_CODE"
JWT_REAL=$(php_eval "$HTTP_BODY" 'return $d["datos"]["jwt"] ?? "";')
cierto "La respuesta trae el JWT y su caducidad" "$([ -n "$JWT_REAL" ] && [ -n "$(php_eval "$HTTP_BODY" 'return $d["datos"]["jwt_expira_en"] ?? "";')" ] && echo true || echo false)"

CLAIMS_JSON=$(claims_de "$JWT_REAL")
guardar_json "02-claims-del-jwt.json" "$CLAIMS_JSON"
hechos "$CLAIMS_JSON" '$c = $d["claims"]; $cab = $d["cabecera"]; return [
    "alg" => $cab["alg"] ?? "", "kid" => $cab["kid"] ?? "", "iss" => $c["iss"] ?? "", "aud" => $c["aud"] ?? "",
    "rol" => $c["rol"] ?? "", "empresa" => $c["empresa_id"] ?? "", "local" => $c["local_id"] ?? "",
    "modulos" => implode(",", $c["modulos"] ?? []), "vida" => ($c["exp"] ?? 0) - ($c["iat"] ?? 0),
    "nbf_igual_iat" => ($c["nbf"] ?? 1) === ($c["iat"] ?? 2), "tiene_jti" => ! empty($c["jti"]),
];'
afirmar "La cabecera dice RS256" RS256 "${H[alg]:-}"
afirmar "El kid es el de la clave pública publicada" "$KID" "${H[kid]:-}"
afirmar "El emisor (iss) es el publicado" "$EMISOR" "${H[iss]:-}"
afirmar "La audiencia (aud) es la publicada" "$AUDIENCIA" "${H[aud]:-}"
afirmar "El rol es admin_local" admin_local "${H[rol]:-}"
afirmar "La empresa es la de ÁUREA" "$EMPRESA" "${H[empresa]:-}"
afirmar "La sede es la del administrador" "$LOCAL" "${H[local]:-}"
cierto "Los módulos del plan incluyen reportes_avanzados (${H[modulos]:-ninguno})" "$([[ ",${H[modulos]:-}," == *,reportes_avanzados,* ]] && echo true || echo false)"
cierto "El token dura poco: ${H[vida]:-?} s, y Kong exige 900 s o menos" "$([ "${H[vida]:-99999}" -le 900 ] && echo true || echo false)"
cierto "Lleva identificador propio (jti) y es válido desde que se emitió (nbf)" "$([ "${H[tiene_jti]:-}" = true ] && [ "${H[nbf_igual_iat]:-}" = true ] && echo true || echo false)"

kong GET "$R_HORAS" "$JWT_REAL" ""
afirmar "Kong y ms-analítica aceptan el JWT real del núcleo (200)" 200 "$HTTP_CODE"
afirmar "La petición sí llegó al servicio" servicio "$(quien_respondio)"

# Renovar no rota la sesión: dos pestañas pueden hacerlo a la vez sin invalidarse entre sí.
kong POST /api/v1/auth/token-servicios "$TOKEN_ADMIN" ""
JWT_SEGUNDO=$(php_eval "$HTTP_BODY" 'return $d["datos"]["jwt"] ?? "";')
cierto "Renovar da un JWT distinto" "$([ -n "$JWT_SEGUNDO" ] && [ "$JWT_SEGUNDO" != "$JWT_REAL" ] && echo true || echo false)"
kong GET /api/v1/auth/me "$TOKEN_ADMIN" ""
afirmar "Renovar no invalida la sesión (sigue en 200)" 200 "$HTTP_CODE"
kong GET "$R_HORAS" "$JWT_REAL" ""
afirmar "El JWT anterior sigue valiendo hasta que caduque (200)" 200 "$HTTP_CODE"

# ------------------------------------------------------------------ 3. los cuatro reportes

titulo "3. Los cuatro reportes de CU-ADMIN-13 a través de Kong"

reporte() { # nombre del archivo, ruta
    kong GET "$2" "$JWT_REAL" ""
    REPORTE_CODIGO=$HTTP_CODE
    REPORTE_TIEMPO=$TIEMPO
    REPORTE_JSON=$HTTP_BODY
    guardar_json "$1" "$REPORTE_JSON"
}
reporte "03-resumen-de-ventas.json" "$R_RESUMEN"; RESUMEN_JSON=$REPORTE_JSON; T_RESUMEN=$REPORTE_TIEMPO
afirmar "ventas/resumen responde (200)" 200 "$REPORTE_CODIGO"
reporte "03-ventas-por-hora.json" "$R_HORAS"; HORAS_JSON=$REPORTE_JSON; T_HORAS=$REPORTE_TIEMPO
afirmar "ventas/por-hora responde (200)" 200 "$REPORTE_CODIGO"
reporte "03-ranking-de-productos.json" "$R_RANKING"; RANKING_JSON=$REPORTE_JSON; T_RANKING=$REPORTE_TIEMPO
afirmar "productos/ranking responde (200)" 200 "$REPORTE_CODIGO"
reporte "03-desempeno-del-personal.json" "$R_EQUIPO"; EQUIPO_JSON=$REPORTE_JSON; T_EQUIPO=$REPORTE_TIEMPO
afirmar "personal/desempeno responde (200)" 200 "$REPORTE_CODIGO"
cierto "Los cuatro responden en menos de 2 s (resumen ${T_RESUMEN}s, por hora ${T_HORAS}s, ranking ${T_RANKING}s, desempeño ${T_EQUIPO}s)" \
    "$(rapido "$T_RESUMEN" 2 && rapido "$T_HORAS" 2 && rapido "$T_RANKING" 2 && rapido "$T_EQUIPO" 2 && echo true || echo false)"

COMBINADO="{\"resumen\":$RESUMEN_JSON,\"horas\":$HORAS_JSON,\"ranking\":$RANKING_JSON,\"equipo\":$EQUIPO_JSON}"
hechos "$COMBINADO" '
$r = $d["resumen"]["datos"]; $h = $d["horas"]["datos"]; $k = $d["ranking"]["datos"]; $e = $d["equipo"]["datos"];
$a = $r["actual"]; $ant = $r["anterior"];
$dias = fn ($x) => (new DateTime($x["hasta"]))->diff(new DateTime($x["desde"]))->days + 1;
$ingresoProductos = array_sum(array_column($k["productos"], "ingreso"));
$ingresoCategorias = array_sum(array_column($k["por_categoria"], "ingreso"));
$grupos = array_unique(array_filter(array_column($k["productos"], "clasificacion")));
return [
    "comprobantes" => $a["comprobantes"], "ventas" => $a["ventas_total"],
    "franjas" => count($h["franjas"]),
    "horas_cuadra" => abs(array_sum(array_column($h["franjas"], "total")) - $a["ventas_total"]) < 1,
    "punta_cuadra" => ($h["hora_punta"]["total"] ?? -1) == max(array_column($h["franjas"], "total")),
    "medios_suman_100" => abs(array_sum(array_column($a["por_medio_pago"], "porcentaje")) - 100) < 0.6,
    "mozos_comprobantes_cuadra" => array_sum(array_column($e["mozos"], "comprobantes")) == $a["comprobantes"],
    "mozos_ventas_cuadra" => abs(array_sum(array_column($e["mozos"], "ventas_total")) - $a["ventas_total"]) < 1,
    "categorias_cuadra" => abs($ingresoProductos - $ingresoCategorias) < 1,
    "productos" => count($k["productos"]), "grupos" => count($grupos), "mozos" => count($e["mozos"]),
    "umbrales" => isset($k["umbrales"]["popularidad_pct"], $k["umbrales"]["margen_unitario"]),
    "anterior_termina_antes" => (new DateTime($ant["hasta"]))->modify("+1 day")->format("Y-m-d") === $r["desde"],
    "misma_duracion" => $dias($ant) === $dias($r),
    "variacion_cuadra" => abs(($r["variacion_pct"]["ventas_total"] ?? 1e9) - round(($a["ventas_total"] - $ant["ventas_total"]) / max(1e-9, $ant["ventas_total"]) * 100, 1)) < 0.11,
];'
COMPROBANTES=${H[comprobantes]:-0}
VENTAS=${H[ventas]:-0}
cierto "ÁUREA tiene ventas en el periodo ($COMPROBANTES cuentas, S/ $VENTAS); si no, cargue el histórico sintético" "$([ "$COMPROBANTES" -gt 0 ] 2> /dev/null && echo true || echo false)"
afirmar "La curva por hora trae siempre las 24 franjas" 24 "${H[franjas]:-}"
cierto "La suma de las 24 franjas es el total del resumen" "${H[horas_cuadra]:-false}"
cierto "La hora punta es la franja de mayor total" "${H[punta_cuadra]:-false}"
cierto "Los medios de pago suman 100 %" "${H[medios_suman_100]:-false}"
cierto "Las cuentas de los mozos suman las del resumen" "${H[mozos_comprobantes_cuadra]:-false}"
cierto "Las ventas de los mozos suman las del resumen" "${H[mozos_ventas_cuadra]:-false}"
cierto "Los ingresos por categoría suman los de los platos" "${H[categorias_cuadra]:-false}"
afirmar "Los platos se reparten en los cuatro grupos de la ingeniería de menú" 4 "${H[grupos]:-}"
cierto "El ranking trae los umbrales de popularidad y de margen" "${H[umbrales]:-false}"
cierto "El periodo anterior termina el día antes de que empiece el elegido" "${H[anterior_termina_antes]:-false}"
cierto "El periodo anterior dura lo mismo" "${H[misma_duracion]:-false}"
cierto "La variación de ventas es la que sale de los dos periodos" "${H[variacion_cuadra]:-false}"

kong GET "${R_RESUMEN}&comparar=false" "$JWT_REAL" ""
hechos "$HTTP_BODY" 'return ["anterior" => var_export($d["datos"]["anterior"], true), "variacion" => var_export($d["datos"]["variacion_pct"], true)];'
cierto "Con comparar=false no hay periodo anterior ni variación" "$([ "${H[anterior]:-}" = NULL ] && [ "${H[variacion]:-}" = NULL ] && echo true || echo false)"

# ------------------------------------------------------------------ 4. tokens fuera de regla

titulo "4. Tokens fuera de regla: quién los rechaza"

echo "  Firmando tokens de prueba con la clave del núcleo (y con otras)..."
acunar_tokens
FALTAN=""
for nombre in admin propietario mozo sin_modulos otra_empresa vencido una_hora aun_no_vale audiencia_ajena emisor_ajeno clave_ajena alg_none hs256_con_clave_publica; do
    [ -z "${JWT[$nombre]:-}" ] && FALTAN="$FALTAN $nombre"
done
if [ -n "$FALTAN" ]; then
    mal "No se pudieron firmar los tokens de prueba:$FALTAN"
else
    ok "13 tokens de prueba firmados"
fi

# El que debe pasar, para que los rechazos no se confundan con una ruta rota.
kong GET "$R_RESUMEN" "${JWT[admin]}" ""
afirmar "El token válido pasa (200)" 200 "$HTTP_CODE"

MITAD=$(( ${#JWT_REAL} - 30 ))
CARACTER=${JWT_REAL:$MITAD:1}
NUEVO=$([ "$CARACTER" = A ] && echo B || echo A)
JWT_ALTERADO="${JWT_REAL:0:$MITAD}$NUEVO${JWT_REAL:$((MITAD + 1))}"

probar_rechazo_de_kong sin_token "Sin cabecera Authorization" "" "$R_RESUMEN"
probar_rechazo_de_kong firma_alterada "Firma alterada" "$JWT_ALTERADO" "$R_RESUMEN"
probar_rechazo_de_kong clave_ajena "Firmado con una clave que no es la del núcleo" "${JWT[clave_ajena]:-}" "$R_RESUMEN"
probar_rechazo_de_kong alg_none "Algoritmo «none» (sin firma)" "${JWT[alg_none]:-}" "$R_RESUMEN"
probar_rechazo_de_kong hs256 "HS256 firmado con la clave pública como secreto" "${JWT[hs256_con_clave_publica]:-}" "$R_RESUMEN"
probar_rechazo_de_kong vencido "Token caducado" "${JWT[vencido]:-}" "$R_RESUMEN"
probar_rechazo_de_kong una_hora "Token con 1 hora de vida (el máximo es 15 minutos)" "${JWT[una_hora]:-}" "$R_RESUMEN"
probar_rechazo_de_kong aun_no_vale "Token que todavía no es válido (nbf futuro)" "${JWT[aun_no_vale]:-}" "$R_RESUMEN"
probar_rechazo_de_kong emisor_ajeno "Emisor desconocido (iss)" "${JWT[emisor_ajeno]:-}" "$R_RESUMEN"
probar_rechazo_de_kong en_la_url "JWT válido enviado en la URL (?jwt=)" "" "${R_RESUMEN}&jwt=${JWT[admin]:-}"
probar_rechazo_de_kong token_de_sesion "Token de sesión del núcleo en una ruta de microservicio" "$TOKEN_ADMIN" "$R_RESUMEN"

# Lo que Kong no mira (audiencia, rol, módulo, sede) lo vuelve a validar el servicio: no confía en que haya pasado por Kong.
probar_respuesta_del_servicio audiencia_ajena "Audiencia equivocada: la rechaza el servicio" 401 ERR_TOKEN_INVALIDO "${JWT[audiencia_ajena]:-}" "" "$R_RESUMEN"
probar_respuesta_del_servicio rol_no_permitido "Rol mozo en un reporte del administrador" 403 ERR_ROL_NO_PERMITIDO "${JWT[mozo]:-}" "" "$R_RESUMEN"

# ms-analítica no confía en que la petición haya pasado por Kong: llamada directamente, también exige el JWT.
directo() { # jwt|"" -> deja el código en HTTP_CODE y el cuerpo en HTTP_BODY
    local args=(-s --max-time 30 "$URL_ANALITICA_DIRECTA$R_RESUMEN" -H 'Accept: application/json' -w $'\n%{http_code}')
    [ -n "$1" ] && args+=(-H "Authorization: Bearer $1")
    local salida; salida=$(curl "${args[@]}")
    HTTP_CODE=${salida##*$'\n'}
    HTTP_BODY=${salida%$'\n'*}
}
directo ""
afirmar "Sin pasar por Kong, ms-analítica también rechaza una petición sin JWT (401)" 401 "$HTTP_CODE"
afirmar "…con su propio código de error" ERR_TOKEN_INVALIDO "$(codigo_de_error)"
directo "${JWT[vencido]:-}"
afirmar "Sin pasar por Kong, ms-analítica rechaza un JWT caducado (401)" 401 "$HTTP_CODE"
afirmar "…y dice que caducó, para que el cliente lo renueve" ERR_TOKEN_EXPIRADO "$(codigo_de_error)"
directo "${JWT[clave_ajena]:-}"
afirmar "Sin pasar por Kong, ms-analítica rechaza un JWT firmado con otra clave (401)" 401 "$HTTP_CODE"
directo "${JWT[admin]:-}"
afirmar "Sin pasar por Kong, el JWT válido del núcleo sí sirve (200)" 200 "$HTTP_CODE"

if [ "$EVIDENCIAS" = 1 ]; then
    {
        echo "# Tokens fuera de regla: quién los rechaza"
        echo
        echo "Cada fila es una petición a \`ventas/resumen\` a través de Kong. «Kong» significa que el gateway la rechazó él mismo (la respuesta lleva \`Server: kong\`); «servicio» significa que llegó a ms-analítica."
        echo
        echo "| Caso | Esperado | Obtenido | |"
        echo "|---|---|---|---|"
        for fila in "${TABLA_TOKENS[@]}"; do IFS='|' read -r a b c d <<< "$fila"; echo "| $a | $b | $c | $d |"; done
    } > "$EV/04-tokens-fuera-de-regla.md"
fi

# ------------------------------------------------------------------ 5. permisos, sedes y plan

titulo "5. Permisos, sedes, empresas y plan"

kong GET "$R_RESUMEN" "${JWT[admin]:-}" "$LOCAL"
afirmar "El administrador puede pedir su propia sede con X-Local-Id (200)" 200 "$HTTP_CODE"
probar_respuesta_del_servicio sede_ajena_del_administrador "Un administrador pide otra sede con X-Local-Id" 403 ERR_SEDE_NO_PERMITIDA "${JWT[admin]:-}" "$SEDE_AJENA" "$R_RESUMEN"

probar_respuesta_del_servicio propietario_sin_sede "El propietario no dice qué sede quiere" 422 ERR_SEDE_REQUERIDA "${JWT[propietario]:-}" "" "$R_RESUMEN"
kong GET "$R_RESUMEN" "${JWT[propietario]:-}" "$LOCAL"
PROPIETARIO_VENTAS=$(php_eval "$HTTP_BODY" 'return $d["datos"]["actual"]["ventas_total"] ?? "";')
afirmar "El propietario elige la sede con X-Local-Id (200)" 200 "$HTTP_CODE"
afirmar "Ve los mismos números que el administrador de esa sede" "$VENTAS" "$PROPIETARIO_VENTAS"

kong GET "$R_RESUMEN" "${JWT[propietario]:-}" "$SEDE_AJENA"
guardar_json "05-sede-inexistente.json" "$HTTP_BODY"
afirmar "El propietario pide una sede que no es de su empresa y recibe 200" 200 "$HTTP_CODE"
afirmar "Sin ventas, igual que una sede vacía: no se revela si existe" 0 "$(php_eval "$HTTP_BODY" 'return $d["datos"]["actual"]["comprobantes"] ?? "";')"

kong GET "$R_RESUMEN" "${JWT[otra_empresa]:-}" ""
afirmar "Un administrador de otra empresa pide la sede de ÁUREA: resumen en 200" 200 "$HTTP_CODE"
afirmar "…y no ve ninguna cuenta de ÁUREA" 0 "$(php_eval "$HTTP_BODY" 'return $d["datos"]["actual"]["comprobantes"] ?? "";')"
kong GET "$R_RANKING" "${JWT[otra_empresa]:-}" ""
afirmar "…ni un solo plato en el ranking" 0 "$(php_eval "$HTTP_BODY" 'return count($d["datos"]["productos"] ?? [1]);')"
kong GET "$R_EQUIPO" "${JWT[otra_empresa]:-}" ""
afirmar "…ni un solo mozo en el desempeño" 0 "$(php_eval "$HTTP_BODY" 'return count($d["datos"]["mozos"] ?? [1]);')"

kong GET "$R_RESUMEN" "${JWT[sin_modulos]:-}" ""
afirmar "Un plan sin reportes avanzados sí ve el resumen (200)" 200 "$HTTP_CODE"
kong GET "$R_HORAS" "${JWT[sin_modulos]:-}" ""
afirmar "…y la curva por hora (200)" 200 "$HTTP_CODE"
probar_respuesta_del_servicio ranking_sin_modulo "…pero no el ranking de platos" 403 ERR_MODULO_NO_INCLUIDO "${JWT[sin_modulos]:-}" "" "$R_RANKING"
probar_respuesta_del_servicio desempeno_sin_modulo "…ni el desempeño del equipo" 403 ERR_MODULO_NO_INCLUIDO "${JWT[sin_modulos]:-}" "" "$R_EQUIPO"

probar_respuesta_del_servicio rango_al_reves "Un rango con el inicio posterior al fin" 422 ERR_RANGO_INVALIDO "${JWT[admin]:-}" "" "/api/v1/analitica/ventas/resumen?desde=2026-11-20&hasta=2026-11-10"
probar_respuesta_del_servicio rango_largo "Un rango de 367 días (el máximo es 366)" 422 ERR_RANGO_INVALIDO "${JWT[admin]:-}" "" "/api/v1/analitica/ventas/resumen?desde=2025-11-20&hasta=2026-11-21"
probar_respuesta_del_servicio sin_parametros "Una consulta sin fechas" 422 ERR_VALIDACION "${JWT[admin]:-}" "" "/api/v1/analitica/ventas/resumen"
kong GET "/api/v1/analitica/ventas/resumen?desde=2025-11-21&hasta=2026-11-21" "${JWT[admin]:-}" ""
afirmar "Un rango de exactamente 366 días sí se acepta (200)" 200 "$HTTP_CODE"

# ------------------------------------------------------------------ 6. lo interno no se ve desde fuera

titulo "6. Lo interno no se expone"

sin_ruta() { # descripción, método, ruta, [argumentos de curl...]
    local descripcion=$1 metodo=$2 ruta=$3
    shift 3
    kong "$metodo" "$ruta" "" "" "$@"
    if [ "$HTTP_CODE" = 404 ] && [ "$(quien_respondio)" = kong ]; then
        ok "$descripcion: 404 de Kong, no llega a ningún servicio"
    else
        mal "$descripcion debía dar 404 de Kong (obtenido: $HTTP_CODE de $(quien_respondio))"
    fi
}
sin_ruta "La serie interna de ms-analítica" GET "/interno/series/ventas-diarias?empresa_id=$EMPRESA&local_id=$LOCAL&desde=$DESDE&hasta=$HASTA"
sin_ruta "El receptor de eventos de ms-analítica" POST /interno/eventos -H 'Content-Type: application/json' --data-binary '{}'
sin_ruta "Los pronósticos internos de ms-pronóstico" POST /interno/pronosticos -H 'Content-Type: application/json' --data-binary '{}'
sin_ruta "El /health de ms-analítica" GET /health
sin_ruta "Subir con «../» desde la ruta de analítica hasta /interno" GET /api/v1/analitica/../../interno/eventos --path-as-is

# Con un JWT válido, bajo el prefijo de analítica tampoco hay nada interno.
kong POST /api/v1/analitica/interno/eventos "${JWT[admin]:-}" "" -H 'Content-Type: application/json' --data-binary '{}'
cierto "/interno bajo el prefijo de analítica, aun con un JWT válido, no acepta eventos ($HTTP_CODE)" "$([ "$HTTP_CODE" = 404 ] || [ "$HTTP_CODE" = 401 ] || [ "$HTTP_CODE" = 405 ] && echo true || echo false)"

# ------------------------------------------------------------------ 7. CORS y X-Request-Id

titulo "7. CORS y X-Request-Id"

ORIGEN=$(docker exec "$KONG" printenv KONG_CORS_ORIGENES | cut -d, -f1 | tr -d '\r')
curl -s -D "$TMPW/cabeceras" -o /dev/null -X OPTIONS "$URL_KONG$R_RESUMEN" -H "Origin: $ORIGEN" \
    -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: authorization,x-local-id'
CODIGO_PREFLIGHT=$(head -1 "$TMP/cabeceras" | grep -o '[0-9]\{3\}' | head -1)
guardar "07-cabeceras-preflight.txt" "$(tr -d '\r' < "$TMP/cabeceras")"
cierto "La preflight del navegador no pide JWT ($CODIGO_PREFLIGHT)" "$([ "$CODIGO_PREFLIGHT" = 200 ] || [ "$CODIGO_PREFLIGHT" = 204 ] && echo true || echo false)"
afirmar "La preflight autoriza el origen del frontend ($ORIGEN)" "$ORIGEN" "$(cabecera access-control-allow-origin)"
afirmar "La preflight permite credenciales" true "$(cabecera access-control-allow-credentials)"
cierto "La preflight permite la cabecera X-Local-Id" "$(cabecera access-control-allow-headers | grep -qi 'x-local-id' && echo true || echo false)"
cierto "La preflight permite GET" "$(cabecera access-control-allow-methods | grep -qi 'GET' && echo true || echo false)"

kong GET "$R_RESUMEN" "${JWT[admin]:-}" "" -H "Origin: $ORIGEN"
guardar "07-cabeceras-respuesta.txt" "$(tr -d '\r' < "$TMP/cabeceras")"
afirmar "Una respuesta real lleva una sola cabecera Access-Control-Allow-Origin (no se duplica)" 1 "$(cuantas_cabeceras access-control-allow-origin)"
afirmar "Esa cabecera es el origen del frontend" "$ORIGEN" "$(cabecera access-control-allow-origin)"
cierto "Expone X-Request-Id al navegador" "$(cabecera access-control-expose-headers | grep -qi 'x-request-id' && echo true || echo false)"
kong GET /up "" "" -H "Origin: $ORIGEN"
afirmar "Lo mismo en una ruta del núcleo: una sola cabecera (Laravel no suma la suya)" 1 "$(cuantas_cabeceras access-control-allow-origin)"

kong GET "$R_RESUMEN" "${JWT[admin]:-}" "" -H 'Origin: https://sitio-ajeno.example'
cierto "Un origen ajeno no recibe su propio origen autorizado" "$([ "$(cabecera access-control-allow-origin)" != 'https://sitio-ajeno.example' ] && echo true || echo false)"

kong GET /up "" ""
cierto "Sin X-Request-Id en la petición, Kong genera uno (UUID)" "$(cabecera x-request-id | grep -Eq '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' && echo true || echo false)"
kong GET "$R_RESUMEN" "${JWT[admin]:-}" "" -H 'X-Request-Id: smoke-gateway-0001'
afirmar "Si la petición trae X-Request-Id, se respeta y vuelve igual" smoke-gateway-0001 "$(cabecera x-request-id)"
kong GET "$R_RESUMEN" "" ""
cierto "Aun un rechazo de Kong lleva X-Request-Id, para poder rastrearlo" "$([ -n "$(cabecera x-request-id)" ] && echo true || echo false)"

kong GET "$R_RESUMEN" "${JWT[admin]:-}" ""
afirmar "Las rutas de microservicios tienen un límite de 120 por minuto" 120 "$(cabecera x-ratelimit-limit-minute)"
kong GET /up "" ""
afirmar "El resto de la API, un límite de 1 200 por minuto" 1200 "$(cabecera x-ratelimit-limit-minute)"

# ------------------------------------------------------------------ 8. caída de ms-analítica

if [ "$RAPIDO" = 1 ]; then
    titulo "8. Caída de ms-analítica (omitida por --rapido)"
else
    titulo "8. Apagar ms-analítica, pedir un reporte y volver a encenderla"
    docker stop "$ANALITICA" > /dev/null && ANALITICA_APAGADA_POR_EL_SCRIPT=1
    ok "ms-analítica apagada"

    kong GET "$R_RESUMEN" "${JWT[admin]:-}" ""
    guardar "08-respuesta-con-el-servicio-caido.txt" "HTTP $HTTP_CODE ($TIEMPO s)
$(tr -d '\r' < "$TMP/cabeceras")

$HTTP_BODY"
    cierto "Con el servicio caído Kong responde un error controlado, 502, 503 o 504 ($HTTP_CODE)" "$([ "$HTTP_CODE" = 502 ] || [ "$HTTP_CODE" = 503 ] || [ "$HTTP_CODE" = 504 ] && echo true || echo false)"
    afirmar "El error es de Kong, no una caída del navegador ni un cuelgue" kong "$(quien_respondio)"
    cierto "Responde rápido, sin colgarse (${TIEMPO}s)" "$(rapido "$TIEMPO" 20 && echo true || echo false)"
    cierto "Aun así lleva X-Request-Id" "$([ -n "$(cabecera x-request-id)" ] && echo true || echo false)"

    kong GET /up "" ""
    afirmar "Mientras tanto el núcleo sigue atendiendo (200)" 200 "$HTTP_CODE"
    kong POST /api/v1/auth/token-servicios "$TOKEN_ADMIN" ""
    afirmar "…y sigue emitiendo JWT (200)" 200 "$HTTP_CODE"
    kong GET /api/v1/auth/me "$TOKEN_ADMIN" ""
    afirmar "…y la sesión sigue valiendo (200)" 200 "$HTTP_CODE"

    docker start "$ANALITICA" > /dev/null && ANALITICA_APAGADA_POR_EL_SCRIPT=0
    RENDIDA=$(ahora)
    servicio_de_vuelta() {
        kong GET "$R_HORAS" "${JWT[admin]:-}" ""
        [ "$HTTP_CODE" = 200 ]
    }
    if esperar_hasta 120 servicio_de_vuelta; then
        ok "ms-analítica volvió a responder a través de Kong en $(($(ahora) - RENDIDA)) s"
    else
        mal "ms-analítica no respondió a través de Kong en 120 s tras encenderla (último código: $HTTP_CODE)"
    fi
    guardar "08-kong-logs.txt" "$(docker logs --tail 30 "$KONG" 2>&1)"
fi

# ------------------------------------------------------------------ 9. límite de peticiones

if [ "$RAPIDO" = 1 ]; then
    titulo "9. Límite de peticiones (omitido por --rapido)"
else
    titulo "9. Límite de peticiones: 120 por minuto en las rutas de microservicios"
    aviso "Se agota a propósito el límite; las pantallas abiertas desde esta IP recibirán 429 hasta que se levante"

    # Un «-o /dev/null» por cada URL: curl aplica cada -o a una sola transferencia.
    URLS=()
    for _ in $(seq 1 130); do URLS+=(-o /dev/null "$URL_KONG$R_HORAS"); done
    CODIGOS=$(curl -s -w '%{http_code}\n' -H "Authorization: Bearer ${JWT[admin]:-}" "${URLS[@]}")
    PASARON=$(printf '%s\n' "$CODIGOS" | grep -c '^200$')
    BLOQUEADAS=$(printf '%s\n' "$CODIGOS" | grep -c '^429$')
    PRIMERA=$(printf '%s\n' "$CODIGOS" | grep -n '^429$' | head -1 | cut -d: -f1)
    guardar "09-limite-de-peticiones.txt" "130 peticiones seguidas a la curva por hora: $PASARON respondieron 200 y $BLOQUEADAS respondieron 429. La primera 429 fue la número ${PRIMERA:-ninguna}."
    cierto "De 130 peticiones seguidas, Kong frenó las que pasaron del límite ($PASARON en 200, $BLOQUEADAS en 429)" "$([ "$BLOQUEADAS" -gt 0 ] && [ "$PASARON" -le 120 ] && echo true || echo false)"
    cierto "La primera 429 llegó antes de la petición 122 (fue la ${PRIMERA:-?}), porque antes ya se habían hecho otras en el minuto" "$([ -n "$PRIMERA" ] && [ "$PRIMERA" -le 121 ] && echo true || echo false)"

    kong GET "$R_HORAS" "${JWT[admin]:-}" ""
    afirmar "Estando bloqueada, la siguiente también es 429" 429 "$HTTP_CODE"
    afirmar "Es una respuesta de Kong" kong "$(quien_respondio)"
    ESPERA=$(cabecera retry-after)
    cierto "Dice cuánto esperar con Retry-After (${ESPERA:-sin dato} s, como mucho 60)" "$([ -n "$ESPERA" ] && [ "$ESPERA" -le 60 ] 2> /dev/null && echo true || echo false)"
    afirmar "Avisa que no quedan peticiones en el minuto" 0 "$(cabecera x-ratelimit-remaining-minute)"
    guardar "09-cabeceras-del-429.txt" "$(tr -d '\r' < "$TMP/cabeceras")"

    kong GET /api/v1/auth/clave-publica "" ""
    afirmar "Mientras ms-analítica está limitada, el núcleo no se frena (200)" 200 "$HTTP_CODE"

    BLOQUEO=$(ahora)
    limite_levantado() {
        kong GET "$R_HORAS" "${JWT[admin]:-}" ""
        [ "$HTTP_CODE" = 200 ]
    }
    if esperar_hasta 90 limite_levantado; then
        ok "El límite se levantó solo a los $(($(ahora) - BLOQUEO)) s: el entorno queda como estaba"
    else
        mal "El límite no se levantó en 90 s"
    fi
fi

# ------------------------------------------------------------------ resumen

titulo "Resumen"
guardar "99-contenedores.txt" "$(docker ps --format '{{.Names}}\t{{.Status}}' | grep restaurantcloudIA | sort)"

TOTAL=${#RESULTADOS[@]}
if [ "$EVIDENCIAS" = 1 ]; then
    {
        echo "# Prueba de humo del gateway: navegador → Kong → núcleo y ms-analítica"
        echo
        echo "- **Fecha:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo "- **Kong:** $(docker exec "$KONG" kong version 2> /dev/null | tr -d '\r')"
        echo "- **Periodo de las consultas:** $DESDE a $HASTA (${COMPROBANTES:-?} cuentas, S/ ${VENTAS:-?})"
        echo "- **JWT:** RS256, kid \`$KID\`, emisor \`$EMISOR\`, audiencia \`$AUDIENCIA\`"
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
