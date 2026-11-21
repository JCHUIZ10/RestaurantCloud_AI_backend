#!/bin/sh
# Punto de entrada del contenedor de Kong: genera la configuración declarativa con el entorno,
# la valida y arranca Kong con el entrypoint original de la imagen.
set -eu

CONFIG=/tmp/kong.yml

resty /kong-config/generar-config.lua /kong-config/kong.yml.plantilla "$CONFIG"
kong config parse "$CONFIG"

export KONG_DECLARATIVE_CONFIG="$CONFIG"
exec /docker-entrypoint.sh kong docker-start
