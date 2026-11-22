# Pruebas manuales: reportes de ventas y gateway

Lista para recorrer a mano la pantalla «Reportes de ventas» (CU-ADMIN-13) y el camino que sigue hasta los datos: navegador → Kong → núcleo y ms-analítica, con el JWT que emite el núcleo. Cada prueba tiene un **paso**, lo que **debes ver** y una casilla para marcar.

Qué ya está probado y qué cubre esta lista:

- **Ya probado por código:** 149 pruebas del frontend, 138 comprobaciones de `scripts/smoke-gateway.sh` (rutas, tokens falsos, permisos, aislamiento entre empresas, límites) y una revisión con capturas automáticas a 360, 768 y 1280 px con datos reales.
- **Lo que esta lista añade:** lo que solo ve una persona (si se entiende, si se lee bien, si los gráficos responden al cursor), el comportamiento real del navegador (sesión, renovación del JWT, teclado) y las fallas provocadas a propósito (servicio caído, plan sin reportes, límite de peticiones).

| Pantalla | Quién | Ruta |
|---|---|---|
| Reportes de ventas: pestañas Ventas, Platos y Equipo de salón | Administrador de sede (y propietario, dentro de una sede) | `/admin/reportes/ventas` |

La pestaña elegida queda en la dirección: `/admin/reportes/ventas?pestana=platos` o `?pestana=equipo`.

## 0. Preparación

**Servicios y pantalla** (desde `restaurantcloud/`):

```bash
docker compose up -d                       # todos los servicios arriba (Kong incluido)
./scripts/smoke-gateway.sh --rapido        # opcional: confirma que el gateway y los reportes están sanos (unos 2 minutos)
cd apps/web && npm run dev                 # la pantalla (normalmente http://localhost:5173)
```

**Usuarios de la semilla**

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador de ÁUREA | `admin@aurea.local` | `admin-local2026` |
| Propietario | `propietario@aurea.local` | `propietario2026` |
| Cajero (para probar acceso denegado) | `cajero@aurea.local` | `cajero2026` |

**Los datos de ÁUREA llegan hasta el 20 de noviembre de 2026.** Es un histórico sintético de 24 meses. Si «hoy» del servidor es posterior, «Hoy» y «Ayer» saldrán **sin ventas** (es lo esperado y sirve para probar el estado vacío). Para comparar con los valores de esta lista, **usa siempre el periodo «Personalizado» del 1 al 20 de nov de 2026**; así los números no cambian con la fecha de hoy.

**Valores de referencia** (1 al 20 de nov de 2026, comparado con el 12 al 31 de oct):

| Qué | Valor |
|---|---|
| Ventas · cuentas · días con ventas | S/ 257,578 · 1,115 · 20 |
| Octubre (periodo anterior) | S/ 222,618 · 1,045 cuentas |
| Variación | ventas +15.7 % · cuentas +6.7 % · ticket promedio +8.4 % · gasto por comensal +4.2 % |
| Ticket promedio · gasto por comensal · comensales | S/ 231.01 · S/ 73.38 · 3,510 |
| Anulados | 1 comprobante por S/ 76 (0.03 % de las ventas) |
| Medios de pago | Tarjeta 43.0 % (S/ 110,829 · 470) · Efectivo 37.7 % (S/ 97,026 · 427) · Billetera digital 19.3 % (S/ 49,723 · 218) |
| Hora punta | 14:00 · S/ 47,238 en total · S/ 2,362 por día |
| Comprobantes | Boleta 922 (S/ 212,360) · Factura 147 (S/ 34,308) · Nota de venta 46 (S/ 10,910) |
| Mozos | Diego Salas 391 cuentas S/ 92,138 · Carlos Huamán 367 S/ 83,873 · Ana Ríos 357 S/ 81,567 |
| Platos | 20 platos: 7 Imprescindibles, 5 Populares, 2 Por impulsar, 6 Por revisar. Umbrales: 3.5 % de las unidades y S/ 17.38 por plato |

**Navegador:** abre las herramientas de desarrollo (F12). En la pestaña **Consola** no debe aparecer **ningún error rojo** en ninguna prueba (los avisos amarillos de React Router sobre «future flag» son normales). Para los tamaños usa el modo dispositivo (Ctrl+Shift+M).

**Un cuidado:** las rutas de reportes tienen un límite de 120 peticiones por minuto por IP. No hace falta cuidarlo en el uso normal, pero la prueba I4 lo agota a propósito.

## A. Entrada y cabecera (administrador)

Entra como administrador de ÁUREA.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| A1 | Mirar el menú lateral | Entrada «Reportes de ventas» con icono de barras, junto a «Planificar la semana» | ☐ |
| A2 | Abrir «Reportes de ventas» | Título «Reportes de ventas», la frase «Cómo le va a la sede: ventas, platos y equipo de salón.» y la pestaña «Ventas» activa | ☐ |
| A3 | Mirar la etiqueta de la derecha del título | «Última venta recibida el … a las …». En ÁUREA es la hora en que se cargó el histórico sintético, no una venta real | ☐ |
| A4 | Mirar las tres tarjetas de pestaña | «Ventas» (con el monto del periodo y su variación), «Platos» («Qué se pide y qué deja más») y «Equipo de salón» («Cómo vende cada mozo»); la activa en azul oscuro | ☐ |
| A5 | Pulsar «Platos» y luego «Equipo de salón» | Cambia el contenido sin recargar la página; la dirección cambia a `?pestana=platos` y `?pestana=equipo` | ☐ |
| A6 | Con «Platos» abierta, recargar (F5) | Vuelve a abrirse en «Platos». El periodo vuelve a «Este mes» (no se guarda: es lo esperado) | ☐ |
| A7 | **Carga:** en F12 → Red, poner «Throttling: Slow 3G» y recargar | Mientras llega, formas grises que imitan el contenido (no un círculo a pantalla completa). Al terminar, desaparecen sin saltos bruscos | ☐ |

## B. Periodo y comparador

El comparador es **un solo control**: el interruptor «Comparar con el periodo anterior» y, al activarlo, las fechas de inicio y fin con los días.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| B1 | Abrir la pantalla | «Este mes» elegido, el rango escrito («1 – 22 nov 2026 · 22 días», según la fecha de hoy) y el interruptor **activado** | ☐ |
| B2 | Mirar el comparador | A la derecha del interruptor: «Desde» y «Hasta» con dos fechas y un óvalo con los días. El periodo anterior dura **lo mismo** que el elegido y **termina el día antes** de que empiece (ej. para 1–22 nov: 10 oct → 31 oct, 22 días) | ☐ |
| B3 | Apagar el interruptor | Las fechas desaparecen. Los indicadores pierden las flechas de variación y las barras «Actual / Anterior»; el recuadro azul grande pierde la comparación; la frase de arriba pasa a «Vendiste S/ … en … cuentas, con un ticket promedio de S/ …» | ☐ |
| B4 | Volver a activarlo | Todo reaparece, sin recargar la página | ☐ |
| B5 | Elegir «Últimos 7 días» | Rango «16 – 22 nov 2026 · 7 días» (según hoy); el comparador muestra otros 7 días justo antes (9 nov → 15 nov) | ☐ |
| B6 | Elegir «Ayer» | Rango de un día («1 día»); el comparador muestra el día anterior. Si ÁUREA no tiene ventas ese día: «Todavía no hay ventas en este periodo» y el botón «Ver últimos 7 días» | ☐ |
| B7 | Pulsar «Ver últimos 7 días» | Cambia el periodo a «Últimos 7 días» y aparecen datos | ☐ |
| B8 | Elegir «Hoy» | Igual que «Ayer»: un día; si no hay ventas, el estado vacío con su botón | ☐ |
| B9 | Elegir «Personalizado» | Aparecen los campos «Desde» y «Hasta» con las fechas que se estaban viendo, y el texto «Puedes elegir hasta 366 días.» | ☐ |
| B10 | Poner Desde 01/11/2026 y Hasta 20/11/2026 | Rango «1 – 20 nov 2026 · 20 días»; el comparador muestra 12 oct 2026 → 31 oct 2026, 20 días. **Los números ahora son los de la tabla de referencia** | ☐ |
| B11 | Poner un Desde posterior al Hasta (ej. Desde 25/11/2026) | Mensaje rojo «La fecha de inicio no puede ser posterior a la de fin.», en lugar del rango el texto «Elige un periodo válido» y abajo la tarjeta «Elige un periodo válido». En F12 → Red **no sale ninguna petición nueva** | ☐ |
| B12 | Intentar elegir un Hasta futuro con el calendario | El calendario no deja elegir días después de hoy. Si lo escribes a mano: «La fecha de fin no puede ser futura.» | ☐ |
| B13 | Poner un rango de más de 366 días (ej. 01/11/2025 al 20/11/2026) | «El periodo puede abarcar hasta 366 días.» Con exactamente 366 días (20/11/2025 al 20/11/2026) sí funciona | ☐ |
| B14 | Corregir las fechas | El mensaje desaparece y los datos vuelven | ☐ |
| B15 | Estando en «Platos», cambiar el periodo | La pestaña «Platos» se recalcula con el nuevo periodo (no solo «Ventas») | ☐ |

## C. Pestaña Ventas

Pon el periodo **Personalizado del 1 al 20 de nov de 2026**, con la comparación activada, y compara con la tabla de referencia.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| C1 | Leer «Lo más importante del periodo» | «Vendiste 15.7 % más que en los 20 días anteriores. Hubo 6.7 % más cuentas y el ticket promedio subió 8.4 %.» | ☐ |
| C2 | Mirar el recuadro azul grande | «Ventas del periodo» con **S/ 257,578**, un óvalo verde «+15.7 %» y «1,115 cuentas cobradas en 20 días con ventas» | ☐ |
| C3 | Mirar sus dos barras | «1 – 20 nov» con S/ 257,578 (larga, dorada) y «12 – 31 oct» con S/ 222,618 (más corta, gris) | ☐ |
| C4 | Mirar el pie del recuadro | «La hora punta es a las 14:00: se venden S/ 2,362 por día en esa sola hora.» | ☐ |
| C5 | Mirar «Cuentas cobradas» | 1,115 · «+6.7 %» · «55.8 por día» · barras «Actual» (más larga) y «Anterior» | ☐ |
| C6 | Mirar «Ticket promedio» | S/ 231.01 «por cuenta» · «+8.4 %» | ☐ |
| C7 | Mirar «Gasto por comensal» | S/ 73.38 · «+4.2 %» · «3,510 comensales» | ☐ |
| C8 | Mirar «Anulados» | 1 comprobante · «S/ 76 · 0.03 % de las ventas». **Sin** flecha de variación ni barras | ☐ |
| C9 | Mirar la curva «Ventas por hora del día» | Barras de las 11 a las 23 h. Las de **antes de las 18:00** en cobre y las de **desde las 18:00** en azul; la de las 14 h más fuerte y con «S/ 2,362» encima; etiqueta «Hora punta 14:00» | ☐ |
| C10 | Pasar el cursor (o tocar) la barra de las 14 h | Cuadro oscuro: «14:00 a 14:59», «Por día», «Cuentas» y «Total S/ 47,238» | ☐ |
| C11 | Mirar los dos recuadros bajo la curva | «Antes de las 18:00» 56.3 % (S/ 145,024) y «Desde las 18:00» 43.7 % (S/ 112,554); suman S/ 257,578 | ☐ |
| C12 | Mirar «Cómo pagan tus clientes» | Dona con «Total S/ 257.6 mil» al centro. Tarjeta 43.0 % «+4.6 pts», Efectivo 37.7 % «−0.1 pts», Billetera digital 19.3 % «−4.5 pts». Cada medio con su barra de color | ☐ |
| C13 | Pasar el cursor por una porción de la dona | Cuadro con el medio, su parte, el total y las cuentas | ☐ |
| C14 | Mirar «Comprobantes emitidos» | Barra repartida y la lista Boleta 922 · S/ 212,360 · 82.4 %, Factura 147 · S/ 34,308 · 13.3 %, Nota de venta 46 · S/ 10,910 · 4.2 % | ☐ |
| C15 | Mirar «Descuentos y anulaciones» | «Descuentos aplicados» S/ 0 (0.0 % de las ventas), «Comprobantes anulados» S/ 76 (1 comprobante) y la nota «Las anulaciones representan el 0.03 % de las ventas.» | ☐ |
| C16 | Apagar la comparación | Desaparecen flechas, barras «Actual/Anterior», los «pts» de los medios de pago y la comparación del recuadro azul. Nada queda roto ni vacío | ☐ |

**Comprobar contra la base** (desde `restaurantcloud/`; deben dar lo mismo que la pantalla):

```bash
docker exec -i restaurantcloudIA_db_analitica sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At' <<'SQL'
-- Ventas y cuentas (257578.00|1115)
select sum(total), count(*) from venta
where local_id = '00000000-0000-4000-8000-000000000010' and estado = 'vigente'
  and fecha_operativa between '2026-11-01' and '2026-11-20';
-- Medios de pago
select medio_pago, count(*), sum(total) from venta
where local_id = '00000000-0000-4000-8000-000000000010' and estado = 'vigente'
  and fecha_operativa between '2026-11-01' and '2026-11-20' group by 1 order by 3 desc;
-- Hora punta (14|47238.00)
select extract(hour from fecha at time zone 'America/Lima')::int as hora, sum(total) from venta
where local_id = '00000000-0000-4000-8000-000000000010' and estado = 'vigente'
  and fecha_operativa between '2026-11-01' and '2026-11-20' group by 1 order by 2 desc limit 3;
-- Anuladas (1|76.00)
select count(*), sum(total) from venta
where local_id = '00000000-0000-4000-8000-000000000010' and estado = 'anulada'
  and fecha_operativa between '2026-11-01' and '2026-11-20';
SQL
```

## D. Pestaña Platos

Mismo periodo (1 al 20 de nov, Personalizado). Abre «Platos».

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| D1 | Leer «Lo más importante del periodo» | «Tus 7 platos imprescindibles traen el 66 % de los ingresos. Los 6 platos por revisar solo aportan el 9 %: son candidatos a renovar en la carta.» | ☐ |
| D2 | Mirar las cuatro tarjetas de grupo | **Imprescindibles** 7 · **Populares** 5 · **Por impulsar** 2 · **Por revisar** 6, cada una con su icono, su color y un consejo | ☐ |
| D3 | Leer la regla de cada tarjeta | Imprescindibles: «3.5 % o más de las unidades y S/ 17.38 o más por plato». Populares: «3.5 % o más … y menos de S/ 17.38 por plato». Por impulsar: «Menos de 3.5 % … y S/ 17.38 o más por plato». Por revisar: «Menos de 3.5 % … y menos de S/ 17.38 por plato» | ☐ |
| D4 | Mirar el último renglón de cada tarjeta | «% de los ingresos de platos»: 66.5 %, 16.2 %, 8.5 % y 8.9 % (suman 100 % salvo el redondeo) | ☐ |
| D5 | Buscar los nombres antiguos | **No** debe aparecer «Estrellas», «Caballitos de batalla», «Puzles» ni «Rezagados» como nombre de grupo en ninguna parte de la pestaña | ☐ |
| D6 | Mirar «Mapa de la carta» | Puntos de cuatro colores (oro, azul, turquesa, terracota) y cuatro zonas con su nombre en las esquinas: arriba izquierda «Por impulsar», arriba derecha «Imprescindibles», abajo izquierda «Por revisar», abajo derecha «Populares» | ☐ |
| D7 | Mirar las líneas punteadas | Una vertical en 3.5 % y una horizontal marcada «margen medio S/ 17.38» | ☐ |
| D8 | Revisar que cada punto esté en la zona de su color | Ningún punto de color oro fuera de «Imprescindibles», ni uno azul fuera de «Populares», etc. | ☐ |
| D9 | Mirar los rótulos | Solo 3 platos llevan su nombre escrito (los que más ingresan); el resto se ve con el cursor | ☐ |
| D10 | Pasar el cursor por «Jalea Mixta» | Cuadro: grupo «Imprescindible», popularidad, «Margen por unidad S/ 35.00» y «Unidades 591» | ☐ |
| D11 | Mirar «Ingresos por categoría» | Barra repartida y la lista Fondos 54.1 % (S/ 139,276 · 3,154 unidades), Entradas 27.7 %, Bebidas 13.8 %, Postres 4.4 % | ☐ |
| D12 | Leer la nota bajo las categorías | «Bebidas: 34 % de las unidades vendidas, pero solo 14 % de los ingresos.» | ☐ |
| D13 | Mirar «Ranking de platos» | Encabezado «Ordenado por ingresos» y una línea que explica las estrellas: «Rentabilidad: compara cuánto deja cada plato en total … El 20 % que más deja tiene 5 estrellas…» | ☐ |
| D14 | Mirar el primer y segundo plato | 1.º Jalea Mixta · 591 · S/ 34,278 · S/ 35.00 · 5 estrellas · Imprescindible. 2.º Lomo Saltado Criollo · 774 · S/ 32,508 · S/ 23.70 · 5 estrellas | ☐ |
| D15 | Contar las estrellas en las dos páginas | Con 20 platos, **exactamente 4 platos** con 5 estrellas, 4 con 4, 4 con 3, 4 con 2 y 4 con 1 | ☐ |
| D16 | Mirar el pie de la tabla | «1–10 de 20 platos», selector «Mostrar 10» y los botones de página con «Página 1 de 2». El botón de «anterior» está apagado | ☐ |
| D17 | Pulsar «Página siguiente» | «11–20 de 20 platos», «Página 2 de 2»; ahora el botón de «siguiente» está apagado | ☐ |
| D18 | Cambiar «Mostrar» a 5 | «1–5 de 20 platos» y «Página 1 de 4». Con 20: una sola página | ☐ |
| D19 | Pulsar el filtro «Por revisar» (estando en la página 2) | Vuelve a la página 1: «1–6 de 6 platos» y solo platos con la insignia «Por revisar». Los filtros muestran su cantidad | ☐ |
| D20 | Pulsar «Todos» | Vuelven los 20 | ☐ |
| D21 | Pulsar los encabezados «Unidades», «Margen por unidad», «Rentabilidad» e «Ingresos» | La tabla se reordena y el subtítulo dice «Ordenado por …». Por unidades el primero es Lomo Saltado Criollo (774); por margen, Jalea Mixta (S/ 35.00) | ☐ |
| D22 | Cambiar a «Ayer» o «Hoy» (sin ventas) | «Todavía no se vendieron platos en este periodo» con su botón de periodo más amplio | ☐ |

**Comprobar los platos contra la base** (el primero debe ser Lomo Saltado Criollo con 774 unidades y S/ 32,508):

```bash
docker exec -i restaurantcloudIA_db_analitica sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At' <<'SQL'
select i.producto_nombre, sum(i.cantidad), sum(i.subtotal)
from venta_item i join venta v on v.comprobante_id = i.comprobante_id
where i.local_id = '00000000-0000-4000-8000-000000000010' and v.estado = 'vigente'
  and i.fecha_operativa between '2026-11-01' and '2026-11-20'
group by 1 order by 2 desc limit 3;
SQL
```

## E. Pestaña Equipo de salón

Mismo periodo. Abre «Equipo de salón».

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| E1 | Leer «Lo más importante del periodo» | «Diego Salas lidera con el 35.8 % de las ventas. Todos están a menos del 3 % del ticket promedio de la sede, así que el equipo vende parejo.» | ☐ |
| E2 | Mirar las tres tarjetas | En orden de ventas: Diego Salas (1.º, con trofeo) S/ 92,138 · 35.8 %; Carlos Huamán (2.º) S/ 83,873 · 32.6 %; Ana Ríos (3.º) S/ 81,567 · 31.7 %. Cada una con sus iniciales en un círculo de color distinto | ☐ |
| E3 | Mirar los datos de cada tarjeta | Ticket S/ 236, S/ 229 y S/ 228; comensales 1,248, 1,151 y 1,111; «Por cuenta» 3.2, 3.1 y 3.1 | ☐ |
| E4 | Mirar el aviso al pie de cada tarjeta | Carlos Huamán: «1 comprobante anulado» (ámbar). Los otros dos: «Sin anulaciones en el periodo» (verde) | ☐ |
| E5 | Mirar «Ventas por mozo» | Tres barras de colores (los mismos de las tarjetas) con «S/ 92.1 mil», «S/ 83.9 mil» y «S/ 81.6 mil» | ☐ |
| E6 | Pasar el cursor por una barra | Cuadro con el nombre, las ventas y las cuentas | ☐ |
| E7 | Mirar «Ticket promedio frente a la sede» | Una marca vertical en el promedio de la sede (S/ 231.01) y, por mozo: Diego S/ 235.65 «+S/ 4.64» (verde), Carlos S/ 228.54 «−S/ 2.47» (rojo), Ana S/ 228.48 «−S/ 2.53» (rojo) | ☐ |
| E8 | Mirar «Anulaciones antes del cobro» | Mensaje verde «Ningún mozo anuló platos en este periodo…». El histórico sintético no trae anulaciones previas al cobro, por eso aquí no hay tabla | ☐ |
| E9 | Cambiar a «Ayer» o «Hoy» (sin ventas) | «Todavía no hay ventas del equipo en este periodo» | ☐ |

## F. Propietario

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| F1 | Cerrar sesión y entrar como propietario. Abrir «Mis sedes» y entrar a la sede ÁUREA | Se ve el menú de administración con «Reportes de ventas» y el enlace «Volver a mis sedes» | ☐ |
| F2 | Abrir «Reportes de ventas» con el periodo del 1 al 20 de nov | Los **mismos números** que ve el administrador (S/ 257,578 · 1,115 cuentas); las tres pestañas funcionan | ☐ |
| F3 | En F12 → Red, mirar una petición a `analitica` | Lleva la cabecera `X-Local-Id` (la sede elegida). La del administrador **no** la lleva | ☐ |
| F4 | Sin sede elegida: en F12 → Aplicación → Almacenamiento local, borrar `active_local_id`, abrir `/admin/reportes/ventas` directamente | Tarjeta «No pudimos cargar los reportes» con el mensaje que da el servicio («Indica la sede con la cabecera X-Local-Id.»), o bien que la aplicación te lleve a «Mis sedes». Esta ruta directa no se recorrió antes: anota lo que veas. Si sale el mensaje, es un texto técnico y te pido que lo marques como poco claro | ☐ |
| F5 | Volver a «Mis sedes» y entrar de nuevo a la sede | Los reportes vuelven | ☐ |

## G. Plan sin reportes avanzados

El plan **Starter** no incluye reportes avanzados; **Pro** y **Enterprise** sí. «Ventas» está en todos los planes; «Platos» y «Equipo de salón», solo con reportes avanzados. ÁUREA está en Pro, así que hay que quitarle el módulo a propósito (solo en la base de desarrollo).

**Quitar el módulo** (desde `restaurantcloud/`):

```bash
docker exec -i restaurantcloudIA_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At' <<'SQL'
update plan set incluye_reportes_avanzados = false where id = 2;
select id, nombre, incluye_reportes_avanzados from plan where id = 2;
SQL
```

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| G1 | **Recargar la página** como administrador (el JWT se vuelve a pedir y trae el plan nuevo) | Las tarjetas «Platos» y «Equipo de salón» llevan un candado y dicen «No incluido en tu plan» | ☐ |
| G2 | Pulsar «Platos» | Recuadro azul «Descubre qué platos te hacen ganar» con tres beneficios y «Está en los planes que incluyen reportes avanzados.». Para el administrador: «Pídele al propietario de la empresa que cambie de plan.» (sin botón) | ☐ |
| G3 | En F12 → Red, buscar `ranking` | **No hay** ninguna petición a `productos/ranking` | ☐ |
| G4 | Pulsar «Equipo de salón» | «Conoce cómo vende tu equipo» y, en Red, **ninguna** petición a `personal/desempeno` | ☐ |
| G5 | Pulsar «Ventas» | Sigue funcionando completo (resumen, curva por hora, medios de pago) | ☐ |
| G6 | Entrar como propietario a la sede y abrir «Platos» | El mismo recuadro, pero con el botón «Ver planes» que lleva a «Cambiar plan» | ☐ |

**Devolver el módulo** (no te olvides):

```bash
docker exec -i restaurantcloudIA_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At' <<'SQL'
update plan set incluye_reportes_avanzados = true where id = 2;
select id, nombre, incluye_reportes_avanzados from plan where id = 2;
SQL
```

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| G7 | Recargar la página | Los candados desaparecen y «Platos» y «Equipo de salón» vuelven a mostrar datos | ☐ |

## H. Sesión y JWT (con las herramientas del navegador)

Entra como administrador, abre F12 y ve a la pestaña **Red**. Usa el filtro `token-servicios` o `analitica`.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| H1 | Recargar la pantalla de reportes | Una llamada `POST …/auth/token-servicios` (200) y después las llamadas a `…/analitica/…` (200). En desarrollo cada consulta puede verse repetida: es el modo estricto de React, en producción no | ☐ |
| H2 | Abrir una llamada a `analitica` → Cabeceras de la petición | `Authorization: Bearer eyJ…`. Es un JWT, distinto del token de sesión (que empieza por `rc_live_`) | ☐ |
| H3 | F12 → Aplicación → Almacenamiento local | Existen `auth_token` (empieza por `rc_live_`) y `refresh_token`, pero **ninguna entrada con un JWT** (nada que empiece por `eyJ`). El JWT vive solo en memoria | ☐ |
| H4 | Cambiar de periodo y de pestaña varias veces | **No** aparece otra llamada a `token-servicios`: se reutiliza el mismo JWT | ☐ |
| H5 | Recargar (F5) | Aparece una llamada nueva a `token-servicios` (el JWT no sobrevive a la recarga) | ☐ |
| H6 | Mirar los claims: copiar el JWT de H2 y pegar en la consola de F12 `JSON.parse(atob(JWT.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))` (con `const JWT = '…'` antes) | `rol: "admin_local"`, `empresa_id` y `local_id` de ÁUREA, `modulos` con `reportes_avanzados`, y `exp − iat` = 600 (10 minutos). Son tokens de desarrollo; no pegues JWT de producción en sitios externos | ☐ |
| H7 | **Renovación por vencimiento:** dejar la pantalla abierta unos 9 minutos y medio y entonces cambiar de periodo | Antes de la consulta aparece una nueva llamada a `token-servicios` y los datos llegan sin ningún error en pantalla | ☐ |
| H8 | **Sesión vencida:** F12 → Aplicación → Almacenamiento local, borrar `auth_token` y `refresh_token` y cambiar de periodo | Tarjeta de error «Tu sesión venció. Vuelve a iniciar sesión.». Al recargar, te lleva al inicio de sesión | ☐ |
| H9 | Entrar como administrador, cerrar sesión y entrar como propietario | Se pide un JWT nuevo (llamada a `token-servicios`); los reportes son de la sede elegida, sin mezclar con la sesión anterior | ☐ |

## I. Estados especiales

| # | Cómo provocarlo | Debes ver | ✔ |
|---|---|---|---|
| I1 | **Servicio caído:** `docker stop restaurantcloudIA_analitica`, luego cambiar de periodo | En unos 6 segundos (no 30 ni 60) aparece «No pudimos cargar los reportes» con «El servicio de reportes no responde en este momento. Tus ventas siguen guardándose y aparecerán aquí cuando vuelva.» y el botón «Reintentar» | ☐ |
| I2 | Con el servicio aún caído, abrir otra pantalla que no use reportes (por ejemplo «Plano de mesas» o «Compras») | Funciona con normalidad: la caída de reportes no arrastra al resto de la aplicación | ☐ |
| I3 | `docker start restaurantcloudIA_analitica`, esperar unos segundos y pulsar «Reintentar» | Vuelven los datos sin recargar el navegador | ☐ |
| I4 | **Límite de peticiones:** en F12 → Red copiar el JWT de una llamada a `analitica` y pegarlo en la consola: `const JWT = '…'; for (let i = 0; i < 130; i++) fetch('/api/v1/analitica/ventas/por-hora?desde=2026-11-01&hasta=2026-11-20', { headers: { Authorization: 'Bearer ' + JWT } });`. Después cambiar de periodo | «Hiciste muchas consultas seguidas. Espera un momento y vuelve a intentar.» con «Reintentar». **Durante este minuto, todas las pantallas de reportes abiertas desde tu IP recibirán el mismo aviso** | ☐ |
| I5 | Esperar hasta un minuto y pulsar «Reintentar» | Los datos vuelven solos: el límite se levanta | ☐ |
| I6 | **Sin ventas:** elegir «Hoy» o «Ayer» (sin ventas) en cada pestaña | «Ventas»: «Todavía no hay ventas en este periodo». «Platos» y «Equipo de salón»: su propio texto («Todavía no se vendieron platos…», «Todavía no hay ventas del equipo…»). Con «Hoy» o «Ayer», el botón «Ver últimos 7 días»; con «Últimos 7 días», el botón «Ver este mes» | ☐ |
| I7 | **Rol equivocado:** entrar como cajero (`cajero@aurea.local`) y abrir `/admin/reportes/ventas` | No se ve la pantalla: te lleva al inicio de tu rol | ☐ |
| I8 | **Sin sesión:** cerrar sesión y abrir `/admin/reportes/ventas` | Te lleva al inicio de sesión y, al entrar, vuelve a los reportes | ☐ |

## J. Tamaños de pantalla y uso con teclado

Repite A4, C2, C9, D6, D14 y E2 en cada tamaño.

| # | Tamaño | Debes ver | ✔ |
|---|---|---|---|
| J1 | **360 px** (móvil) | Sin desplazamiento horizontal de la **página**. Los botones de periodo se desplazan de lado dentro de su caja («Este mes» puede verse cortado: es lo esperado). El comparador ocupa todo el ancho y sus fechas quedan bajo el interruptor. Las tres pestañas en una fila, solo con icono y nombre. Los indicadores en una columna. El ranking pasa a **lista de tarjetas** con estrellas e insignia de grupo. El mapa de la carta se desplaza de lado dentro de su tarjeta. Botones de al menos 44 px de alto | ☐ |
| J2 | **768 px** (tableta) | El ranking es una tabla **sin** la columna «Grupo»: el grupo aparece bajo el nombre del plato. Los cuatro grupos en 2×2. Nada cortado ni montado | ☐ |
| J3 | **1024 a 1280 px** (escritorio) | Tabla con la columna «Grupo». El recuadro azul y los indicadores lado a lado. La dona de medios de pago sobre su lista o al lado, según el ancho de su tarjeta | ☐ |
| J4 | **1920 px o más** | Los gráficos **no agrandan el texto** (sigue pequeño y legible). Las barras de la curva tienen un ancho máximo. En «Cómo pagan tus clientes», los porcentajes quedan junto a su nombre y no lejos | ☐ |
| J5 | Navegar solo con **Tab** | El foco es visible (anillo cobre) y recorre en orden: periodos, interruptor (la barra espaciadora lo cambia), pestañas, filtros del ranking, encabezados ordenables y paginación. Enter activa los botones | ☐ |
| J6 | Estrellas y variaciones | Inspeccionando una fila: las estrellas tienen la etiqueta «5 de 5 estrellas»; las variaciones llevan texto oculto «Subió» o «Bajó» para lectores de pantalla | ☐ |
| J7 | Color y significado | Subidas y bajadas llevan flecha y signo; los grupos llevan icono y nombre; ningún estado se distingue **solo** por color | ☐ |

## K. Lenguaje y datos (revisión transversal)

| # | Qué revisar | ✔ |
|---|---|---|
| K1 | Ninguna pantalla muestra palabras técnicas: JWT, Kong, token, HTTP, ERR_…, P50, «clasificación» (salvo el texto del servicio de la prueba F4) | ☐ |
| K2 | Los montos van en soles con coma de miles y punto decimal (`S/ 257,578`, `S/ 231.01`) y los porcentajes como `15.7 %` | ☐ |
| K3 | Los nombres nuevos de los grupos (Imprescindibles, Populares, Por impulsar, Por revisar) se usan en todas partes: tarjetas, filtros, insignias, leyenda y zonas del mapa | ☐ |
| K4 | Sin emojis; los iconos acompañan siempre a un texto | ☐ |
| K5 | Consola de F12 sin errores rojos durante todo el recorrido | ☐ |

## Si algo falla

1. Corre `./scripts/smoke-gateway.sh --rapido` (desde `restaurantcloud/`). Si **pasa**, el gateway, el JWT y los reportes están bien y el problema está en la pantalla. Si **falla**, dice en qué escenario: rutas, tokens, permisos, cabeceras.
2. Mira los registros: `docker logs restaurantcloudIA_kong --tail 50` y `docker logs restaurantcloudIA_analitica --tail 50`.
3. Si algo se ve raro con los números, compárelos con las consultas de las secciones C y D antes de sospechar de la pantalla.
4. Anota el número de la prueba, lo que viste y lo que esperabas, con una captura si puedes.

**Registro de esta ronda**

| | |
|---|---|
| Fecha | |
| Navegador y versión | |
| Quién probó | |
| Pruebas con ✘ (número y qué se vio) | |
| Observaciones | |
