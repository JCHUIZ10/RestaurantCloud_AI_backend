#!/bin/sh
# Crea (o reconcilia) el usuario de la aplicación de ms-pronóstico, sin privilegios de administración,
# y la base de pruebas.
#
# Es idempotente: se puede ejecutar cuantas veces haga falta y deja siempre el mismo resultado.
#   - Rol y base de pruebas: se crean solo si no existen.
#   - Contraseña y permisos de conexión: se reaplican en cada ejecución.
#
# PostgreSQL lo ejecuta automáticamente solo al inicializar un volumen vacío. Para aplicarlo sobre un
# volumen que ya existe (por ejemplo, el primer día, o tras cambiar la contraseña en el .env):
#   docker compose exec db-pronostico sh /docker-entrypoint-initdb.d/01-usuarios.sh
#
# A diferencia de ms-analítica, aquí NO se conceden permisos sobre las tablas: las ejecuciones y las
# predicciones solo se agregan, así que cada tabla recibe sus permisos exactos en la migración 0002
# (services/pronostico/migrations), que ejecuta el administrador. Este script solo deja al usuario
# conectarse y ver el esquema.
set -eu

: "${PRONOSTICO_DB_APP_USER:?Falta PRONOSTICO_DB_APP_USER}"
: "${PRONOSTICO_DB_APP_PASSWORD:?Falta PRONOSTICO_DB_APP_PASSWORD}"

BASE_PRUEBAS="${POSTGRES_DB}_test"

# \gexec ejecuta como sentencia cada fila que devuelve el SELECT; sin filas, no hace nada.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -v app_user="$PRONOSTICO_DB_APP_USER" \
    -v app_pass="$PRONOSTICO_DB_APP_PASSWORD" \
    -v base_pruebas="$BASE_PRUEBAS" \
    -v admin_user="$POSTGRES_USER" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
\gexec

-- La contraseña y los atributos se reaplican siempre, por si cambiaron en el .env.
ALTER ROLE :"app_user" LOGIN PASSWORD :'app_pass' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

SELECT format('CREATE DATABASE %I OWNER %I', :'base_pruebas', :'admin_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'base_pruebas')
\gexec
SQL

# Mismos permisos de conexión en la base del servicio y en la de pruebas (GRANT y REVOKE ya son idempotentes).
for base in "$POSTGRES_DB" "$BASE_PRUEBAS"; do
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$base" \
        -v app_user="$PRONOSTICO_DB_APP_USER" \
        -v base="$base" <<'SQL'
REVOKE ALL ON DATABASE :"base" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"base" TO :"app_user";

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO :"app_user";
SQL
done
