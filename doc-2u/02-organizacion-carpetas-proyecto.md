# Organización de carpetas y Docker Compose (Unidad II)

| | |
|---|---|
| **Documento** | 02 — Estructura del repositorio, estructura interna de cada microservicio y nombres de Compose |
| **Estado** | Diseño acordado. Pendiente de aplicar (paso 1 del orden de trabajo). |
| **Rama de trabajo** | `betta` |
| **Depende de** | `01-arquitectura-microservicios.md` |

---

## 1. Organización del repositorio

El proyecto sigue siendo **un solo repositorio**. No cambia la forma cliente-servidor: se amplía. `apps/api` y `apps/web` se quedan donde están y los microservicios entran como carpetas hermanas.

```
restaurantcloud/
├── apps/
│   ├── api/                  Núcleo Laravel (sin mover)
│   └── web/                  Frontend React (sin mover)
├── services/
│   ├── analitica/            Python · FastAPI
│   ├── pronostico/           Python · FastAPI · scikit-learn
│   └── notificaciones/       Node.js · TypeScript · Fastify
├── infra/
│   ├── docker/               Dockerfiles de api y web (ya existe)
│   ├── kong/                 Configuración del API Gateway
│   ├── k8s/                  Manifiestos del laboratorio de GKE
│   └── caddy/                (ya existe)
├── docker-compose.yml        Todo el sistema en local
└── docker-compose.prod.yml   Todo el sistema en la VM
doc-2u/                       Documentación de la Unidad II
```

La carpeta `services/ai` actual solo tiene dos archivos vacíos. Se elimina, porque `services/pronostico` la reemplaza.

## 2. Estructura interna de un microservicio

Cada microservicio es autónomo y tiene la misma forma por dentro:

```
services/analitica/
├── app/
│   ├── api/          Endpoints (rutas públicas e /interno)
│   ├── dominio/      Reglas: qué hacer con cada evento, cómo armar un reporte
│   ├── datos/        Acceso a la base; aquí vive el filtro por empresa y local
│   └── config.py     Lectura de variables de entorno
├── migrations/       Alembic
├── tests/
├── Dockerfile
├── .env.example
└── README.md
```

El servicio de Node usa `src/` en lugar de `app/`, con las mismas capas.

**Ningún servicio importa código de otro.** Lo único que comparten es el contrato documentado en `doc-2u/servicios/`.

## 3. Docker Compose y nombres

Los dos entornos (monolito y `betta`) usarían los mismos nombres de contenedor (`saas_postgres_db`, `saas_laravel_api`…) y los mismos volúmenes (`restaurantcloud_postgres_data`…), así que compartirían la base de datos. Se resuelve con dos cambios:

1. **Nombre del proyecto de Compose: `restaurantcloud-ia`.** Docker exige minúsculas en este nombre, por eso no puede ser `restaurantcloudIA` tal cual. De ahí salen volúmenes y red nuevos (`restaurantcloud-ia_postgres_data`…), separados de los del monolito.
2. **Nombres de contenedor con el prefijo `restaurantcloudIA_`**, que sí admite mayúsculas:

| Contenedor | Qué es |
|---|---|
| `restaurantcloudIA_gateway` | Kong |
| `restaurantcloudIA_api`, `_queue`, `_scheduler` | Núcleo Laravel |
| `restaurantcloudIA_db` | PostgreSQL del núcleo |
| `restaurantcloudIA_redis`, `_minio` | Redis y MinIO |
| `restaurantcloudIA_analitica` + `_db_analitica` | Servicio y su PostgreSQL |
| `restaurantcloudIA_pronostico` + `_db_pronostico` | Servicio y su PostgreSQL |
| `restaurantcloudIA_notificaciones` + `_mongo` | Servicio y su MongoDB |

Cada base va en su propio contenedor, para que "una base por servicio" sea visible y real.

### Consecuencias

- **La base de `betta` empieza vacía.** Al cambiar el nombre del proyecto se crean volúmenes nuevos. Hay que ejecutar `db:seed` y recrear la base de pruebas. Los datos actuales quedan intactos en los volúmenes del monolito.
- **Monolito y `betta` no pueden correr a la vez**, aunque ya no compartan datos, porque ambos publican los mismos puertos (5432, 6379, 8080, 9000). Si hace falta tenerlos encendidos juntos, se cambian los puertos de `betta`.
- **El nombre antiguo aparece en 13 archivos más** (README, guías, `phpunit.xml`, scripts). Se actualizan en el mismo cambio para que las instrucciones sigan funcionando.

## 4. Orden de trabajo

1. Renombrar el Compose y los contenedores, actualizar las referencias y comprobar que la suite sigue en verde.
2. Núcleo: tabla `outbox_entrega` y emisión de `venta.registrada`.
3. `ms-analitica` con su base y sus dos endpoints.
