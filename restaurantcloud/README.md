# RestaurantCloud — estructura de aplicaciones

Este directorio es el punto de entrada de la plataforma y contiene los componentes desplegables del MVP.

```text
apps/api       Laravel API modular; único escritor de PostgreSQL.
apps/web       SPA Vue 3; consume REST `/api/v1` y SSE.
services/ai    FastAPI opcional para forecasting y RAG; solo lectura.
infra          Nginx, Docker y scripts de operación.
docs/adr       Decisiones de arquitectura que cambian el diseño.
```

## Reglas de organización

- Cada dominio de `apps/api/app/Domains` conserva sus acciones, reglas, DTOs, Policies, eventos y persistencia. No crear módulos técnicos globales para lógica de negocio.
- Las rutas HTTP son delgadas y versionadas bajo `/api/v1`; las reglas críticas se ejecutan en acciones o servicios transaccionales.
- `Tenancy` fija el contexto de PostgreSQL con `SET LOCAL app.current_empresa_id` dentro de cada transacción. El frontend nunca suministra el tenant.
- Las mutaciones críticas registran eventos en Outbox; `Realtime` los publica en Redis y los streams SSE se sirven mediante Octane.
- El frontend se organiza por dominio en `src/modules`; las piezas reutilizables van en `shared` o `components`.
- `services/ai` no se inicializa hasta que forecasting o RAG entren al alcance y no puede escribir en PostgreSQL.

## Inicialización posterior

Cuando se creen los proyectos reales, Laravel se inicializa dentro de `apps/api` y Vue/Vite dentro de `apps/web`, respetando los directorios de dominio creados aquí. No instalar dependencias ni generar código en la raíz del repositorio.
