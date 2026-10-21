# Pendiente 6B: sincronizacion SSE de configuracion KDS

## Alcance implementado en 6A

- Lectura, actualizacion y restauracion de parametros KDS por sede.
- Validacion de rangos y coherencia entre umbral verde y ambar.
- Acceso de edicion exclusivo para `admin_local`.
- Persistencia en `configuracion_kds` y consumo posterior por Cocina.

## Pendiente cuando se implemente SSE unificado

1. Publicar `configuracion_kds_actualizada` despues de confirmar la transaccion.
2. Suscribir las pantallas de Cocina y Mozo al canal de su sede.
3. Actualizar umbrales y preferencias en memoria sin recargar la pagina.
4. Reintentar conexiones SSE y reconciliar la configuracion con un GET al reconectar.

Mientras 6B no exista, los valores guardados se aplican cuando Cocina o Mozo vuelven a
consultar la configuracion; la interfaz administrativa no promete sincronizacion inmediata.
