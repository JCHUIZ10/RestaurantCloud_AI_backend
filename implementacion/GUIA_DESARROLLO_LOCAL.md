# Guía de desarrollo local — RestaurantCloud

Esta guía permite que una persona nueva clone el repositorio, ejecute la API Laravel localmente y levante los servicios de datos compartidos mediante Docker.

> Estado actual: la API Laravel ya existe en `restaurantcloud/apps/api`; Docker Compose levanta PostgreSQL y Redis. React, MinIO, el contenedor de la API y el worker Linux/SSE se incorporarán en iteraciones posteriores. Esta guía diferencia lo que funciona hoy de lo que está planificado.

---

## 1. Versiones estándar del equipo

Instalar y usar las siguientes versiones para evitar diferencias entre máquinas:

| Herramienta | Versión estándar | Uso |
| --- | --- | --- |
| Git | Versión estable actual | Clonar y colaborar |
| Docker Desktop | Versión estable actual con Docker Compose v2 | PostgreSQL y Redis locales |
| PHP | **8.3.16** | Ejecutar Laravel localmente |
| Composer | **2.8.x** | Dependencias PHP |
| Laravel | **13.35.0** (bloqueado en `composer.lock`) | Framework de la API |
| Node.js | **22.23.3 LTS** | Vite actual y futura SPA React |
| npm | El incluido con Node 22 | Dependencias JavaScript |

En Windows se puede usar Laragon para PHP/Composer o cualquier instalación equivalente. PHP debe tener activadas, como mínimo, las extensiones `pdo_pgsql`, `pgsql`, `curl`, `mbstring`, `openssl`, `fileinfo`, `dom`, `xml`, `zip` y `intl`.

Redis no requiere extensión PHP porque la API usa `predis/predis`.

---

## 2. Revisión rápida de prerrequisitos

En PowerShell, comprueba las herramientas antes de clonar:

```powershell
git --version
docker --version
docker compose version
php --version
composer --version
node --version
npm.cmd --version
```

> En algunas instalaciones de PowerShell, `npm` puede estar bloqueado por la política de ejecución de scripts. En ese caso usar `npm.cmd` en lugar de `npm`.

---

## 3. Clonar el repositorio

```powershell
git clone <URL_DEL_REPOSITORIO>
cd RestaurantCloud_AI_backend
```

La estructura importante es:

```text
RestaurantCloud_AI_backend/
├── context/                     # Diseño, modelo de datos y casos de uso
├── implementacion/              # Guías de incorporación y desarrollo
├── restaurantcloud/
│   ├── apps/
│   │   ├── api/                 # Laravel 13 API
│   │   └── web/                 # Reservado para React + TypeScript
│   ├── services/ai/             # Reservado para FastAPI
│   ├── infra/                   # Nginx, Docker y scripts futuros
│   └── docker-compose.yml       # PostgreSQL y Redis actuales
└── wireframe/                   # Referencia visual de los casos de uso
```

Antes de implementar un módulo, revisar siempre:

1. `context/proyect_context.md` — arquitectura y reglas de negocio.
2. `context/modelo_datos.md` — modelo relacional y RLS.
3. `context/cu.md` — casos de uso y flujos.
4. `restaurantcloud/apps/api/app/Domains/README.md` — límites de los módulos Laravel.

---

## 4. Configurar PostgreSQL y Redis con Docker

### 4.1 Crear el archivo de entorno de infraestructura

```powershell
cd restaurantcloud
Copy-Item .env.example .env
```

No subir `restaurantcloud/.env` al repositorio. Cada persona debe usar credenciales locales propias. En el archivo recién creado, definir al menos:

```env
POSTGRES_DB=restaurantcloud_db
POSTGRES_USER=saas_admin
POSTGRES_PASSWORD=<clave-local-segura>
POSTGRES_PORT=5432

REDIS_PORT=6379
REDIS_PASSWORD=<clave-local-segura>
```

> El `.env.example` histórico contiene valores de ejemplo. Sustituirlos antes de levantar servicios nuevos y nunca publicar claves reales en commits, tickets o chats.

### 4.2 Levantar los servicios

```powershell
docker compose up -d
docker compose ps
```

El resultado esperado es que los contenedores `saas_postgres_db` y `saas_redis` estén en estado `running` o `healthy`.

Para inspeccionar errores:

```powershell
docker compose logs -f db
docker compose logs -f redis
```

Para detener los servicios sin borrar datos:

```powershell
docker compose down
```

No usar `docker compose down -v` salvo que se quiera eliminar intencionalmente la base de datos local y Redis, porque también elimina sus volúmenes.

### 4.3 Puertos ocupados

Docker expone PostgreSQL en `5432` y Redis en `6379`. Si alguno ya está ocupado en la máquina, cambiar solamente el puerto izquierdo en `restaurantcloud/.env`, por ejemplo:

```env
POSTGRES_PORT=5433
REDIS_PORT=6380
```

Esos mismos valores deben usarse luego en `apps/api/.env`.

---

## 5. Configurar la API Laravel

```powershell
cd apps/api
Copy-Item .env.example .env
composer install
```

La API se ejecutará desde Windows/Laragon, mientras PostgreSQL y Redis se ejecutan en Docker. Por esa razón, editar `apps/api/.env` y reemplazar los hosts de contenedor por `127.0.0.1`:

```env
APP_NAME="RestaurantCloud API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=restaurantcloud_db
DB_USERNAME=saas_admin
DB_PASSWORD=<la-misma-clave-de-POSTGRES_PASSWORD>

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<la-misma-clave-de-REDIS_PASSWORD>
```

Si se modificaron los puertos en la sección anterior, reflejarlos en `DB_PORT` y `REDIS_PORT`.

Generar la clave de aplicación y crear las tablas disponibles:

```powershell
php artisan key:generate
php artisan migrate
```

Por ahora las migraciones crean la base técnica inicial de Laravel y los tokens de Sanctum. Las migraciones del modelo RestaurantCloud se crearán por dominios conforme se implemente cada caso de uso.

### MinIO

La API ya tiene el adaptador S3 instalado y las variables para MinIO, pero el servicio MinIO aún no está agregado al `docker-compose.yml`. No intentar todavía cargas de archivos, comprobantes o PDFs: ese flujo se habilitará cuando MinIO se incorpore a infraestructura.

---

## 6. Ejecutar y verificar la API

Iniciar Laravel:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

En otra terminal, comprobar el endpoint de salud:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

Respuesta esperada:

```json
{
  "exito": true,
  "datos": { "servicio": "restaurantcloud-api" },
  "meta": { "timestamp": "..." }
}
```

También se pueden verificar las rutas y pruebas base:

```powershell
php artisan route:list --path=api
php artisan test
```

---

## 7. Assets JavaScript actuales y futura SPA React

Laravel incluye Vite/Tailwind como herramientas base. Para instalar sus dependencias actuales:

```powershell
npm.cmd install
npm.cmd run dev
```

La aplicación React aún **no ha sido creada**; se ubicará en `restaurantcloud/apps/web` y tendrá su propio `package.json`. Cuando exista, se instalarán allí sus dependencias:

```text
React + TypeScript + Vite
React Router
Axios
TanStack Query
Zustand
React Hook Form + Zod
```

No agregar esas dependencias al `package.json` de `apps/api`: backend y frontend conservan instalaciones independientes.

---

## 8. Colas, Octane y SSE

La API ya incluye Sanctum, Predis, Octane y el adaptador S3/MinIO. Redis debe estar activo para sesiones, caché y futuras colas.

Durante el desarrollo local actual se puede procesar colas con:

```powershell
php artisan queue:work redis
```

Octane/FrankenPHP y los streams SSE persistentes se ejecutarán dentro de Docker/Linux. No se ejecutan nativamente en Windows porque FrankenPHP y Horizon requieren componentes de Linux en la configuración elegida. Esto no impide desarrollar ni probar endpoints REST, acciones de dominio, eventos y trabajos de cola.

Horizon se incorporará al contenedor Linux del worker cuando se prepare esa imagen. No debe instalarse manualmente en PHP de Windows.

---

## 9. Forma de trabajo del equipo

1. Actualizar la rama principal antes de comenzar.
2. Crear una rama con nombre descriptivo, por ejemplo `feature/pedidos-crear-comanda` o `fix/auth-login-tenant`.
3. Implementar dentro del dominio correspondiente en `app/Domains/<Dominio>`.
4. Mantener controladores delgados; la regla de negocio vive en acciones o servicios transaccionales.
5. Crear o actualizar pruebas con cada regla relevante.
6. Ejecutar antes de abrir una integración:

   ```powershell
   php artisan test
   php artisan route:list --path=api
   ```

7. No modificar archivos `.env`, `vendor/`, `node_modules/`, `storage/logs/` ni archivos de caché para compartirlos mediante Git.
8. Sí incluir en el commit las migraciones, pruebas, cambios a `composer.json`/`composer.lock` y, cuando corresponda, los cambios a `package.json`/lockfile.

---

## 10. Problemas frecuentes

### `could not find driver`

Falta activar `pdo_pgsql` o `pgsql` en el `php.ini` usado por la terminal. Confirmar con:

```powershell
php -m | Select-String "pgsql"
```

### `Connection refused` a PostgreSQL o Redis

Verificar primero:

```powershell
docker compose ps
```

Después comprobar que `DB_HOST` y `REDIS_HOST` sean `127.0.0.1` cuando Laravel se ejecute en el host, y que puertos y contraseñas coincidan con `restaurantcloud/.env`.

### `npm.ps1 cannot be loaded`

Usar `npm.cmd install` y `npm.cmd run dev`. No es necesario cambiar la política global de PowerShell para trabajar con el proyecto.

### Error de permisos en `storage` o `bootstrap/cache`

Laravel debe poder escribir en ambos directorios. En Windows, ejecutar la terminal con el mismo usuario dueño del repositorio. En Docker/Linux, el usuario del contenedor debe tener permisos de escritura sobre esos directorios.

### Los cambios de configuración no se reflejan

Ejecutar:

```powershell
php artisan optimize:clear
```

---

## 11. Próximas mejoras de infraestructura

Estas tareas están planificadas, pero aún no forman parte del arranque local obligatorio:

- Añadir MinIO al `docker-compose.yml`.
- Crear imagen Docker de Laravel con FrankenPHP/Octane.
- Crear contenedor worker Linux con Horizon.
- Crear la SPA React en `apps/web`.
- Añadir Nginx como punto de entrada único.
- Incorporar el servicio FastAPI de IA cuando forecasting o RAG entre en alcance.

