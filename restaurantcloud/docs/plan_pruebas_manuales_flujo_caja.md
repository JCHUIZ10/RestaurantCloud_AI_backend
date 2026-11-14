# Pruebas manuales rápidas — Flujo de caja del administrador (CU-ADMIN-14)

Guía corta para validar en el navegador todo lo que cambió en **Flujo de caja y cierres Z**, **Compras** y el cierre de turno del **cajero**. Se recorre de arriba abajo en unos 25–30 minutos: cada caso es un paso y un resultado esperado.

**Cómo usarlo:** marca cada caso (☐ → ✅ / ❌). Si algo falla, anótalo en la tabla final con el número del caso.

---

## 0. Preparación (una sola vez)

1. **Respaldo y migraciones de la base de desarrollo.** Esta base aún no tiene las 3 migraciones nuevas; sin ellas el visado, los pagos de crédito y los tipos de comprobante fallan.

   ```bash
   docker exec saas_postgres_db pg_dump -U saas_admin restaurantcloud_db > respaldo_antes_flujo_caja.sql
   docker exec saas_laravel_api php artisan migrate --force
   docker exec saas_laravel_api php artisan migrate:status | tail -8     # todo en "Ran"
   ```

2. **Servicios y front:** contenedores en marcha (`docker ps`) y `npm run dev` con `VITE_USE_REAL_API=true`.
3. **Cuentas** (Aúrea):

   | Rol | Correo | Contraseña |
   | :--- | :--- | :--- |
   | Administrador | `admin@aurea.local` | `admin-local2026` |
   | Cajero | `cajero@aurea.local` | `cajero2026` |
   | Propietario | `propietario@aurea.local` | `propietario2026` |

   Usa **dos navegadores** (o una ventana privada): administrador en uno, cajero en el otro.
4. **Comandos de apoyo** (ayudan a revisar lo que la pantalla no muestra):

   ```bash
   # Últimos turnos y su estado de visado
   docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select id, correlativo, estado, revisado, visado_resultado, observacion_resuelta_at from caja order by fecha_apertura desc limit 5;"
   # Compras a crédito y su pago
   docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select numero_comprobante, metodo_pago, total, fecha_pago, pago_metodo, estado from ficha_compra order by created_at desc limit 5;"
   # Gastos
   docker exec saas_postgres_db psql -U saas_admin -d restaurantcloud_db -c "select proveedor_nombre, monto, origen_fondos, tipo_comprobante, estado from gasto_manual order by created_at desc limit 5;"
   ```

☐ Preparación terminada (migraciones aplicadas sin error).

---

## 1. Acceso y carga

Entra como **administrador**.

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 1.1 | Menú | Abre el menú lateral. | Existe **Flujo de caja y cierres Z** y abre la pantalla real. | ☐ |
| 1.2 | Sin datos de prueba | Mira la pantalla completa. | No hay widgets "QA", "Sandbox" ni nombres de ejemplo. Se ve el **nombre real de la sede**. | ☐ |
| 1.3 | Periodos | Cambia entre *Hoy*, *Semana* y *Este mes*. | Las cifras cambian y, mientras carga, el contenido se atenúa con una barra "Actualizando…". | ☐ |
| 1.4 | Rango personalizado | Elige un rango de hace 3 meses hasta hoy y aplica. | El gráfico se **agrupa por semana** ("· agrupado por semana" en el título) y no dibuja un día por tarjeta. | ☐ |
| 1.5 | Sin comparativo | Elige un rango sin movimientos en el periodo anterior. | El chip dice **"Sin comparativo"**, no "0 %". | ☐ |
| 1.6 | Seguridad | Sal y entra como **cajero**; escribe `/admin/finanzas/flujo-caja`. | El cajero no ve la pantalla (redirigido o rechazado). | ☐ |

---

## 2. Gastos operativos

Pestaña **Gastos**. Necesitas un **turno abierto** (si no hay, ábrelo con el cajero en `/cajero/apertura`).

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 2.1 | Formulario vacío | Pulsa *Registrar gasto*. | Nace **vacío**; el botón guardar está deshabilitado hasta completar. Categorías con color y tipos de comprobante legibles. | ☐ |
| 2.2 | Por transferencia | Categoría Alquiler, S/ 100, origen *Transferencia*, proveedor y descripción de 10+ letras. Guarda. | Aparece en la tabla con la etiqueta del comprobante (no el código). El total sube S/ 100. | ☐ |
| 2.3 | Con efectivo de la gaveta | Gasto de S/ 20 con origen *Efectivo de caja*. | La fecha queda fija en **hoy**. Se guarda y figura "Caja chica/gaveta" en la tabla. | ☐ |
| 2.4 | Esperado del cajero | En la ventana del cajero abre `/cajero/turno` (cierre). | Su efectivo esperado bajó **S/ 20** y el gasto aparece en "Egresos pagados con efectivo de la gaveta". | ☐ |
| 2.5 | Anular | En la tabla anula el gasto de S/ 20 con un motivo corto (menos de 10 letras) y luego uno válido. | Con motivo corto no deja confirmar. Al anular, el gasto queda tachado y el esperado del cajero **vuelve a subir S/ 20**. | ☐ |

---

## 3. Compras y pago de créditos

Entra a **Compras** (`/admin/compras`).

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 3.1 | Compra en efectivo de la gaveta | *Nueva compra*, pago **Efectivo → De la gaveta del turno**, total pequeño (S/ 30). | Se registra; el cajero ve su esperado bajar S/ 30. Con la gaveta la fecha debe ser hoy. | ☐ |
| 3.2 | Compra en caja chica | Otra compra en **Efectivo → Caja chica**. | Se registra; el esperado del cajero **no** cambia. | ☐ |
| 3.3 | Compra a crédito | Compra con pago **Crédito** de S/ 60. | Sale con la insignia ámbar **"Por pagar"** y arriba aparece el aviso "las compras a crédito cuentan como egreso cuando se pagan". | ☐ |
| 3.4 | El crédito aún no cuenta | Ve a *Flujo de caja → Hoy*. | La compra a crédito **no** suma a Egresos ni a Compras. La tarjeta de liquidez muestra una insignia **"Deuda con proveedores (por pagar): S/ 60"**. | ☐ |
| 3.5 | Pagar con fecha pasada | En el detalle de la compra, **Marcar como pagada** → Transferencia, fecha de **hace 2 días**. | Queda "Pagada el …" y el KPI "Por pagar" baja. En el flujo, el egreso aparece en el periodo que contiene esa fecha y no en hoy. | ☐ |
| 3.6 | Validación de fecha | En otro crédito intenta una fecha **futura** (el campo tiene tope) o anterior a la emisión. | No permite elegirla; el botón de pagar queda deshabilitado. | ☐ |
| 3.7 | Pagar con la gaveta | Otro crédito → **Efectivo → De la gaveta**. | La fecha se fija en **hoy**; al pagar, el esperado del cajero baja por el total. | ☐ |
| 3.8 | Créditos anteriores | Revisa si había compras a crédito antiguas. | Siguen **"Por pagar"** (no se marcaron pagadas); se regularizan con *Marcar como pagada* y su fecha real. | ☐ |

---

## 4. Tarjeta "Efectivo y digital (neto)"

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 4.1 | Cierra con el balance | Con los movimientos anteriores, en *Hoy* compara el **balance neto** con la tarjeta *Efectivo y digital (neto)*. | El total de la tarjeta es **igual al balance neto**. Muestra bancos, gavetas y, si hubo, "Caja chica pagada". | ☐ |
| 4.2 | Porcentaje no engañoso | Registra un gasto por transferencia mayor a lo cobrado digitalmente. | El monto en bancos es negativo y los porcentajes desaparecen (sin "120 %" ni cifras raras). | ☐ |

---

## 5. Cierres Z y visado

Primero **cierra un turno con el cajero** (`/cajero/turno` → contar efectivo → cerrar). Anota la diferencia si hay.

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 5.1 | Reporte Z del cajero | Revisa el Z que ve el cajero al cerrar. | Muestra las ventas, la fórmula del efectivo y los egresos pagados con la gaveta. **No** dice que se notificó a nadie. | ☐ |
| 5.2 | Mismo Z para el admin | Admin → pestaña **Cierres Z**. El turno figura *Pendiente*; pulsa **Auditar Reporte Z**. | El visor muestra el **mismo documento** y se puede **descargar el PDF**. | ☐ |
| 5.3 | Pendientes de toda la sede | Con el periodo en *Hoy*, deja un turno sin visar de otro día (o espera al día siguiente). | La pestaña muestra el contador y aparece el banner ámbar **"Hay N turnos sin visar fuera de este periodo"**. | ☐ |
| 5.4 | Ver pendientes | Pulsa **Ver pendientes**. | La vista pasa al rango que contiene al turno más antiguo y ahí se ve. | ☐ |
| 5.5 | Visar conforme | Visa un turno como *Conforme* (con o sin notas). | Pasa a **Auditado** y el contador baja. | ☐ |
| 5.6 | Observar | En otro turno elige *Observado* con una nota corta y luego una válida (10+ letras). | La nota corta no deja guardar. Con nota válida queda **"Observado — por resolver"** y aparece el banner rosa de observados. | ☐ |
| 5.7 | Levantar la observación | En ese turno pulsa **Levantar observación** y escribe cómo se resolvió (10+ letras). | Pasa a **"Observado y resuelto"**, con quién y cuándo, y el banner rosa desaparece. | ☐ |
| 5.8 | Ver observados | Deja un turno observado sin resolver y en *Hoy* pulsa **Ver observados**. | Lleva al rango donde está y su botón rosa está disponible. | ☐ |
| 5.9 | Turno sin Reporte Z (opcional) | Borra el Z de un turno cerrado: `delete from auditoria_caja_cierre where caja_id='<ID>';` y recarga. | Aparece la insignia **"Sin Z archivado"**. Al auditarlo se pide **nota de 10+ letras** incluso para conforme. | ☐ |

---

## 6. Cierre forzado y turno sin cerrar

Deja un **turno abierto** con el cajero (venta o dos en efectivo).

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 6.1 | Aviso "Turno sin cerrar" | Simula un turno viejo: `update caja set fecha_apertura = now() - interval '2 days' where estado='abierta';` y recarga el admin. | La cabecera dice **"Turno sin cerrar"** y el banner de *Cierres Z* indica que sigue abierto pasada la hora de cierre. Es solo un aviso: **el turno sigue abierto**. | ☐ |
| 6.2 | Abrir el cierre forzado | Pulsa **Cierre administrativo forzado**. | Se abre el modal con las cifras reales del turno (esperado, ventas, egresos). | ☐ |
| 6.3 | Esperado en vivo | Con el modal abierto, el cajero cobra una venta en efectivo. Espera ~5 s. | El esperado se actualiza solo y aparece el aviso ámbar **"El efectivo esperado cambió de S/ X a S/ Y"**. | ☐ |
| 6.4 | Justificación obligatoria | Ingresa el contado y una justificación de menos de 15 letras. | El botón de confirmar sigue deshabilitado hasta tener 15+ letras. | ☐ |
| 6.5 | Confirmar | Confirma el cierre. | Aviso con la diferencia (faltante/sobrante/sin diferencia), la terminal queda libre y se **abre el Reporte Z** del turno para visarlo. El Z indica "cierre forzado" y la justificación. | ☐ |
| 6.6 | Cajero cerró antes | Repite 6.2, y mientras el modal está abierto el cajero cierra su turno. | En unos segundos el modal se cierra con el aviso "El turno se cerró mientras lo revisabas". | ☐ |

---

## 7. Propietario

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 7.1 | Sin sede activa | Entra como **propietario** y abre el flujo de caja sin haber elegido sede. | Mensaje "Elige una sede…" con el botón **Ir a Mis sedes**. | ☐ |
| 7.2 | Con sede | Entra a una sede desde *Mis sedes* y vuelve al flujo de caja. | Carga los datos de esa sede y puede descargar el PDF del Z. | ☐ |

---

## 8. El cajero no se rompió

Con la cuenta de **cajero** (zona que más se tocó por dentro):

| # | Caso | Pasos | Resultado esperado | ✔ |
| :-: | :--- | :--- | :--- | :-: |
| 8.1 | Apertura y cobro | Abre un turno y cobra una venta en efectivo y otra con tarjeta. | Funciona igual que antes. | ☐ |
| 8.2 | Cierre normal | Cierra el turno con el conteo exacto. | Z sin diferencia, con la fórmula y los egresos de la gaveta. Botón de PDF funciona. | ☐ |
| 8.3 | Consulta del último Z | Entra a la consulta del último Reporte Z. | Se ve el documento con banner de "consulta" y el botón *Volver*. | ☐ |

---

## 9. Chequeos técnicos (opcional, 2 minutos)

```bash
# Backend (dentro del contenedor)
docker exec -w /app saas_laravel_api php artisan test --compact tests/Feature/AdminFlujoCajaTest.php tests/Feature/CajaCoreOperativoTest.php tests/Feature/FichaCompraTest.php

# Front (desde restaurantcloud/apps/web)
npx tsc --noEmit -p tsconfig.app.json && npm test && npm run build
```

Resultado esperado: backend `54 + … passed`, front `18 passed`, `tsc` y build sin errores.

---

## 10. Cierre de la prueba

1. Deja el entorno como lo necesites (turno abierto o cerrado). Si usaste el comando de 6.1, el turno quedó con fecha vieja: ciérralo.
2. Anota abajo cualquier diferencia:

| Caso | Qué pasó | Gravedad (alta / media / baja) |
| :-: | :--- | :-: |
|  |  |  |
|  |  |  |
|  |  |  |
