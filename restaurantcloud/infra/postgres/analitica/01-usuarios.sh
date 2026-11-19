#!/bin/sh
# Crea (o reconcilia) el usuario de la aplicación de ms-analítica, sin privilegios de administración,
# y la base de pruebas.
#
# Es idempotente: se puede ejecutar cuantas veces haga falta y deja siempre el mismo resultado.
#   - Rol y base de pruebas: se crean solo si no existen.
#   - Contraseña y permisos: se reaplican en cada ejecución.
#
# PostgreSQL lo ejecuta automáticamente solo al inicializar un volumen vacío. Para aplicarlo sobre un
# volumen que ya existe (por ejemplo, tras cambiar la contraseña en el .env):
#   docker compose exec db-analitica sh /docker-entrypoint-initdb.d/01-usuarios.sh
#
# El administrador (POSTGRES_USER) crea las tablas mediante las migraciones de Alembic;
# el usuario de la aplicación solo lee y escribe filas en ellas.
set -eu

: "${ANALITICA_DB_APP_USER:?Falta ANALITICA_DB_APP_USER}"
: "${ANALITICA_DB_APP_PASSWORD:?Falta ANALITICA_DB_APP_PASSWORD}"

BASE_PRUEBAS="${POSTGRES_DB}_test"

# \gexec ejecuta como sentencia cada fila que devuelve el SELECT; sin filas, no hace nada.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -v app_user="$ANALITICA_DB_APP_USER" \
    -v app_pass="$ANALITICA_DB_APP_PASSWORD" \
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

# Mismos permisos en la base del servicio y en la de pruebas (GRANT y REVOKE ya son idempotentes).
for base in "$POSTGRES_DB" "$BASE_PRUEBAS"; do
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$base" \
        -v app_user="$ANALITICA_DB_APP_USER" \
        -v admin_user="$POSTGRES_USER" \
        -v base="$base" <<'SQL'
REVOKE ALL ON DATABASE :"base" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"base" TO :"app_user";

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO :"app_user";

-- Las tablas las crea el administrador; lo que cree en adelante queda accesible al usuario de la aplicación.
ALTER DEFAULT PRIVILEGES FOR ROLE :"admin_user" IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES FOR ROLE :"admin_user" IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO :"app_user";

-- Tablas que ya existan (volumen con migraciones aplicadas antes de reconciliar).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
SQL
done
