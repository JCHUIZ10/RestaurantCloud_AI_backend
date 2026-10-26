# RestaurantCloud AI — Plataforma SaaS Multiempresa para Gestión Integral de Restaurantes

Bienvenido al repositorio de **RestaurantCloud AI**. Este sistema es una plataforma SaaS modular de alta concurrencia diseñada para la gestión integral de operaciones gastronómicas: salón interactivo con distribución gráfica de mesas, toma de comandas, cocina KDS en tiempo real con Server-Sent Events (SSE), facturación electrónica SUNAT, control de inventario y recetas por porción, caja, compras y reportes analíticos multi-sede.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto está diseñado bajo una arquitectura desacoplada y moderna:

- **Backend (API)**: [Laravel 11](https://laravel.com/) sobre **PHP 8.3** optimizado con **FrankenPHP y Laravel Octane** para ejecución asíncrona de alto rendimiento.
- **Frontend (Web SPA)**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) impulsado por [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/query) y [Zustand](https://github.com/pmndrs/zustand).
- **Base de Datos**: [PostgreSQL 16](https://www.postgresql.org/) con aislamiento estricto multi-tenant mediante **Row Level Security (RLS)** por `empresa_id`, UUID v8 y funciones PL/pgSQL nativas.
- **Caché y Mensajería**: [Redis 7](https://redis.io/) para autenticación ultrarrápida en memoria (`auth.redis`), colas de emisión de comprobantes y publicación de eventos.
- **Almacenamiento de Archivos**: [MinIO](https://min.io/) (compatible con Amazon S3) para almacenamiento privado de PDFs, comprobantes, logos y adjuntos.

---

## 📁 Estructura del Repositorio

```text
RestaurantCloud_AI_backend/
├── context/                     # Especificaciones funcionales, modelo de datos y reglas de negocio
├── implementacion/              # Guías técnicas, contratos de rutas y diseño responsive
├── restaurantcloud/             # Raíz de la plataforma ejecutable
│   ├── apps/
│   │   ├── api/                 # Backend Laravel modular (Domains, Http, Database)
│   │   └── web/                 # Frontend SPA React + Vite + TypeScript (¡Aquí se ejecuta el frontend!)
│   ├── infra/
│   │   ├── docker/              # Dockerfile de la API (FrankenPHP) y scripts de arranque
│   │   └── sql/                 # Scripts de inicialización DDL, RLS, funciones y seeds
│   ├── scripts/                 # Scripts de aprovisionamiento de storage MinIO
│   ├── services/
│   │   └── ai/                  # Servicio opcional de IA (FastAPI / RAG)
│   └── docker-compose.yml       # Orquestador de contenedores (DB, Redis, MinIO, API, Queue, Scheduler)
└── README.md                    # Esta guía de instalación y uso
```

---

## 💻 Programas que Necesitas Descargar e Instalar

Para preparar una computadora nueva desde cero, descarga e instala los siguientes programas oficiales:

| Software | Descripción | Enlace Oficial de Descarga |
| :--- | :--- | :--- |
| **Git** | Control de versiones para clonar y gestionar el repositorio | [Descargar Git para Windows/Mac/Linux](https://git-scm.com/downloads) |
| **Docker Desktop** | Motor de contenedores para la base de datos, Redis, MinIO y la API | [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Node.js** | Entorno JavaScript (incluye `npm`). Instalar versión **20 LTS** o **22 LTS** | [Descargar Node.js LTS](https://nodejs.org/) |
| **Visual Studio Code** *(Recomendado)* | Editor de código ligero y recomendado para el proyecto | [Descargar VS Code](https://code.visualstudio.com/) |
| **DBeaver Community** *(Opcional)* | Gestor visual para explorar la base de datos PostgreSQL | [Descargar DBeaver](https://dbeaver.io/download/) |

> [!IMPORTANT]
> **Requisito crítico en Windows para Docker Desktop:**  
> Asegúrate de tener instalado y actualizado el componente **WSL2** (Windows Subsystem for Linux).  
> Puedes instalarlo abriendo **PowerShell como Administrador** y ejecutando:  
> ```powershell
> wsl --install
> wsl --update
> ```  
> Luego reinicia la PC y abre Docker Desktop para asegurarte de que arranque sin errores.

---

## 📥 Paso a Paso Detallado: Clonación e Instalación Desde Cero

### Paso 1: Configurar Git y Clonar el Repositorio

Abre tu terminal (**PowerShell** o **Git Bash** en Windows, o **Terminal** en macOS/Linux).

1. **Configurar tu identidad de Git** (si es una PC nueva):
   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```

2. **Clonar el repositorio oficial**:
   ```bash
   git clone https://github.com/JCHUIZ10/RestaurantCloud_AI_backend.git
   ```

3. **Entrar a la carpeta raíz del proyecto**:
   ```bash
   cd RestaurantCloud_AI_backend
   ```

4. **Verificar y cambiar a la rama activa de desarrollo (`betta`)**:
   ```bash
   # Comprobar las ramas disponibles
   git branch -a
   
   # Cambiar a la rama activa de trabajo 'betta'
   git checkout betta
   
   # Asegurar que tienes los últimos cambios actualizados del repositorio
   git pull origin betta
   ```

---

### Paso 2: Crear los Archivos de Configuración (`.env`)

El proyecto requiere 3 archivos `.env` (uno para Docker, otro para la API y otro para el Frontend Web). Debes crearlos copiando los ejemplos `.env.example`:

#### 2.1 Archivo `.env` general de Infraestructura / Docker

Desde la raíz del repositorio (`RestaurantCloud_AI_backend`), entra a `restaurantcloud`:

**En Windows (PowerShell):**
```powershell
cd restaurantcloud
Copy-Item .env.example .env
```
**En Linux / macOS (Bash):**
```bash
cd restaurantcloud
cp .env.example .env
```

*(Este archivo define las credenciales de PostgreSQL `saas_admin` / `123`, puertos y claves de MinIO y Redis).*

#### 2.2 Archivo `.env` de la API Laravel

Desde la carpeta `restaurantcloud`:

**En Windows (PowerShell):**
```powershell
cd apps/api
Copy-Item .env.example .env
cd ../..
```
**En Linux / macOS (Bash):**
```bash
cd apps/api
cp .env.example .env
cd ../..
```

*(El contenedor Docker de la API leerá este archivo y generará su clave `APP_KEY` automáticamente).*

#### 2.3 Archivo `.env` del Frontend Web

Desde la carpeta `restaurantcloud`:

**En Windows (PowerShell):**
```powershell
cd apps/web
Copy-Item .env.example .env
cd ../..
```
**En Linux / macOS (Bash):**
```bash
cd apps/web
cp .env.example .env
cd ../..
```

Asegúrate de que en `restaurantcloud/apps/web/.env` estén estas líneas:
```env
VITE_API_URL=/api/v1
VITE_USE_REAL_API=true
```

---

### Paso 3: Levantar el Backend y Servicios con Docker

Abre una terminal en la carpeta `restaurantcloud` para levantar toda la infraestructura:

```bash
cd restaurantcloud
docker compose up -d --build
```

#### ¿Qué contenedores se crean y levantan automáticamente?
- **`saas_postgres_db` (PostgreSQL 16)**: Corre en el puerto `5432`. En su primer arranque ejecuta los scripts de `infra/sql/` que configuran la estructura DDL, políticas RLS de seguridad, planes comerciales y la sede demo **"Áurea"** con sus productos, mesas, inventario y usuarios.
- **`saas_redis` (Redis 7)**: Corre en el puerto `6379` para caché de alta velocidad, sesiones y colas.
- **`saas_minio` & `saas_minio_init`**: Corre en los puertos `9000` (API S3) y `9001` (Consola Web). Crea automáticamente el bucket `restaurantcloud`.
- **`saas_laravel_api` (API con FrankenPHP / Octane)**: Corre en el puerto `8080`. Instala dependencias con Composer si faltan, genera `APP_KEY` y levanta el servidor API de alto rendimiento.
- **`saas_laravel_queue` & `saas_laravel_scheduler`**: Procesamiento asíncrono en segundo plano.

#### Verificar que todo esté corriendo
```bash
docker compose ps
```
Todos los contenedores deben figurar en estado `running` o `healthy`.

Para ver los registros en tiempo real de la API:
```bash
docker compose logs -f api
```

---

### Paso 4: Inicializar el Almacenamiento MinIO para la Empresa Demo

Ejecuta el siguiente comando para crear las carpetas de almacenamiento de comprobantes y archivos en MinIO para la empresa de prueba:

```bash
docker exec -it saas_laravel_api php artisan tenant:init-storage --test
```

---

### Paso 5: Correr la Aplicación Web (Frontend SPA)

> [!IMPORTANT]
> **UBICACIÓN OBLIGATORIA PARA CORRER EL PROYECTO WEB:**  
> Para ejecutar la interfaz de usuario debes posicionarte **específicamente dentro de la carpeta `restaurantcloud/apps/web`**.

Abre una **segunda terminal** y navega a la ubicación del frontend:

#### 1. Navegar a la carpeta `web`:
```bash
cd restaurantcloud/apps/web
```

> Si te encuentras en cualquier otra parte del sistema o en la raíz del repositorio, asegúrate de ingresar con la ruta relativa o absoluta:  
> `cd C:\Ruta\Hasta\RestaurantCloud_AI_backend\restaurantcloud\apps\web` (en Windows)

#### 2. Instalar dependencias de Node.js:
```bash
npm install
```

#### 3. Iniciar el servidor de desarrollo Vite:
```bash
npm run dev
```

La consola mostrará el enlace local para abrir la aplicación en tu navegador:
```text
  VITE v5.4.14  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Abre tu navegador web e ingresa a: **[http://localhost:5173](http://localhost:5173)**

---

## 🌐 URLs y Puertos del Ecosistema

| Servicio | URL / Puerto | Función |
| :--- | :--- | :--- |
| **Frontend Web (SPA)** | [http://localhost:5173](http://localhost:5173) | Interfaz visual interactiva (Salón, Mesas, Caja, KDS) |
| **API REST (Healthcheck)** | [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) | Verificación de que la API está online |
| **Consola MinIO S3** | [http://localhost:9001](http://localhost:9001) | Panel web de archivos S3 (`saas_minio_admin` / `rC_minio_secret_2026!`) |
| **API S3 MinIO** | [http://localhost:9000](http://localhost:9000) | Almacenamiento directo S3 |
| **PostgreSQL** | `localhost:5432` | Base de datos (`restaurantcloud_db`, usuario: `saas_admin`, clave: `123`) |
| **Redis** | `localhost:6379` | Caché y sesiones en memoria (clave: `rC_redis_secret_2026!`) |

---

## 🔐 Credenciales de Prueba Precargadas

La base de datos viene precargada con usuarios listos para iniciar sesión en **http://localhost:5173**:

### 1. Administrador Global de la Plataforma SaaS
- **Correo:** `admin@restaurantcloud.pe`
- **Contraseña:** `admin-saas2026`
- **Rol:** `admin_saas` (Administración de empresas registradas y planes).

### 2. Sede Demo: Restaurante "Áurea"
| Rol en el Restaurante | Correo de Acceso | Contraseña | ¿Qué puede hacer? |
| :--- | :--- | :--- | :--- |
| **Propietario** | `propietario@aurea.local` | `propietario2026` | Acceso total a finanzas, sedes, configuración y reportes |
| **Administrador de Sede** | `admin@aurea.local` | `admin-local2026` | Configuración de salón, turnos, carta, personal e inventario |
| **Mozo** | `mozo@aurea.local` | `mozo2026` | Mapa de mesas, apertura de pedidos, comanda rápida |
| **Cocina (KDS)** | `cocina@aurea.local` | `cocina2026` | Pantalla de comandas en preparación con despacho en tiempo real |
| **Cajero** | `cajero@aurea.local` | `cajero2026` | Apertura/cierre de turnos de caja, cobro y facturación |

---

## 🛠️ Comandos Frecuentes de Mantenimiento

### Control de Docker (desde la carpeta `restaurantcloud`)
```bash
# Ver estado de los contenedores
docker compose ps

# Apagar contenedores sin perder datos
docker compose down

# Ver logs de la API en vivo
docker compose logs -f api

# Reiniciar la base de datos limpia desde cero (elimina volúmenes y reejecuta los seeds SQL)
docker compose down -v
docker compose up -d
docker exec -it saas_laravel_api php artisan tenant:init-storage --test
```

### Comandos de la API Laravel (a través de Docker)
```bash
# Correr las pruebas automatizadas del backend
docker exec -it saas_laravel_api php artisan test

# Ver listado de rutas de la API
docker exec -it saas_laravel_api php artisan route:list

# Entrar a la consola interactiva Tinker
docker exec -it saas_laravel_api php artisan tinker

# Limpiar caché de Laravel
docker exec -it saas_laravel_api php artisan optimize:clear
```

### Comandos del Frontend (desde `restaurantcloud/apps/web`)
```bash
# Verificar consistencia visual y de TypeScript
npm run check:ui

# Compilar para producción
npm run build
```

---

## ❓ Solución de Problemas Frecuentes

1. **PowerShell bloquea los comandos `npm` en Windows:**  
   Ejecuta en PowerShell:  
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```  
   O usa `npm.cmd run dev` en su lugar.

2. **Conflicto de puertos (5432 o 6379 ocupados):**  
   Si ya tienes PostgreSQL o Redis instalado localmente en tu sistema operativo fuera de Docker, cambia los puertos en `restaurantcloud/.env` (por ejemplo `POSTGRES_PORT=5433` y `REDIS_PORT=6380`) y reinicia con `docker compose up -d`.

3. **La API muestra error 500 o falta la clave:**  
   Genera la clave de la aplicación con:  
   ```bash
   docker exec -it saas_laravel_api php artisan key:generate --force
   ```
