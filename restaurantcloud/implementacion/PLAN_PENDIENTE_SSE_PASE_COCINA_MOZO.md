# Pendiente: sincronización SSE del pase Cocina ↔ Mozo

## Contexto

El ciclo `listo → entregado` (Mozo) y la ventana de 30 s de `listo → en_preparacion` (Deshacer en KDS) compiten sobre el mismo `pedido_item`. La etapa actual resuelve la colisión en el backend con transiciones condicionales y bloqueo de fila: solo una de las dos acciones gana y la otra recibe un `409` que la interfaz muestra al usuario. Lo que todavía no existe es el **aviso proactivo**: cada pantalla descubre el cambio solo al intentar actuar o al recargar.

## Qué falta cuando exista el canal SSE común

Publicar eventos versionados **después del commit** de la transacción (`DB::afterCommit`), nunca dentro de ella:

| Evento | Origen | Consumidor | Efecto en la interfaz |
|---|---|---|---|
| `pase.item_listo` | `cambiarEstadoItem`, `marcarListoTanda`, `despacharPedido` | Mozo | Agrega la tarjeta al sidebar de despacho. |
| `pase.item_revertido` | `deshacerItem` | Mozo | Quita la tarjeta del sidebar y del drawer de la mesa; muestra el aviso "Cocina regresó el plato al fuego". |
| `pase.item_servido` | `marcarItemServido` | KDS | Oculta el botón Deshacer del ítem al instante y lo marca como retirado del pase. |

Payload mínimo: `{ version, local_id, pedido_id, item_id, estado, ocurrido_en }`. El canal se filtra por `local_id`.

## Reglas a respetar

- El SSE es una optimización de la experiencia, no la garantía de consistencia. Los `409` de la etapa actual (`ITEM_YA_SERVIDO`, `ITEM_NO_DISPONIBLE_EN_PASE`) se mantienen como red de seguridad ante eventos perdidos o reconexiones.
- Al reconectar, cada pantalla debe recargar su estado completo (`GET /cocina/comandas`, plano de Mozo) en vez de reproducir eventos.
- Mientras el SSE no exista, la interfaz no debe afirmar sincronización en tiempo real.
