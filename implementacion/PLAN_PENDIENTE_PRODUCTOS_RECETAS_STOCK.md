# Plan pendiente: productos, recetas y stock

## Estado actual: punto 3A implementado

El catálogo comercial de productos ya puede operar con API Laravel cuando `VITE_USE_REAL_API=true`:

- listar, buscar, filtrar y paginar productos activos;
- crear y editar categoría, nombre, descripción, precio, foto y destino operativo;
- marcar manualmente un producto como disponible o agotado;
- archivar lógicamente un producto sin eliminar su historial;
- limitar las operaciones a `admin_local`, `propietario` y `admin_saas` y al `local_id` de la sesión.

Los endpoints del punto 3A son:

```text
GET    /api/v1/admin/productos
POST   /api/v1/admin/productos
GET    /api/v1/admin/productos/{id}
PATCH  /api/v1/admin/productos/{id}
PATCH  /api/v1/admin/productos/{id}/disponibilidad
DELETE /api/v1/admin/productos/{id}
```

## Comportamiento temporal del frontend

| Modo | `VITE_USE_REAL_API` | Comportamiento |
| --- | --- | --- |
| Mock | `false` | Conserva el flujo completo actual: recetas, insumos, costos, márgenes, capacidad y simulaciones QA. |
| API real | `true` | Usa Laravel y PostgreSQL para el catálogo comercial. No muestra receta, costos, márgenes, drawer de calibración ni simulaciones de stock. |

Esta diferencia es intencional: las simulaciones modifican solo arreglos en memoria del mock y no deben aparentar cambios sobre datos persistentes.

## Punto 3B: recetas e inventario

Retomar este punto cuando el módulo de insumos/stock y sus mockups estén estabilizados. El trabajo pendiente incluye:

1. Implementar la relación `producto_insumo` y los endpoints para crear, reemplazar y consultar recetas.
2. Validar que cada insumo pertenezca al mismo `local_id` del producto.
3. Calcular `costo_teorico` y `margen_bruto_pct` desde la receta real.
4. Implementar capacidad de producción y detección del insumo limitante.
5. Sincronizar disponibilidad automática por quiebre de insumos, respetando también la decisión manual del administrador.
6. Conectar `DrawerCalibrarReceta`, la barra de rentabilidad, las columnas de costo/margen y los controles QA a la API real.
7. Eliminar las condiciones temporales de interfaz que distinguen modo mock y API para receta/stock.

## Regla de seguridad

No reactivar en modo API real los controles de simulación (`quiebre`, `reposición`, `capacidad`) hasta que sus operaciones tengan endpoints transaccionales, auditoría y reglas de inventario implementadas. De lo contrario se produciría una interfaz visualmente funcional con resultados no persistentes.
