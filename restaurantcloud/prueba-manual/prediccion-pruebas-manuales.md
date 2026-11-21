# Pruebas manuales: pantallas de predicción

Lista para recorrer a mano las pantallas nuevas de la etapa 5B.5. Cada prueba tiene un **paso**, lo que **debes ver** y una casilla para marcar. Las pantallas se probaron por código (59 pruebas automáticas) pero **nunca se vieron en un navegador**, así que esta lista cubre justo lo que esas pruebas no ven: aspecto, tamaños de pantalla y comportamiento real.

| Pantalla | Quién | Ruta |
|---|---|---|
| Planificar la semana | Administrador de sede | `/admin/planificar-semana` |
| Platos de la semana (Lo que vas a vender) | Administrador de sede | `/admin/planificar-semana/platos` |
| Preparar la compra | Administrador de sede | `/admin/planificar-semana/compra` |
| Registrar compra (ya llenado) | Administrador de sede | `/admin/compras` |
| Predicción de mis sedes | Propietario | `/propietario/prediccion` |

## 0. Preparación

**Servicios y datos** (desde `restaurantcloud/`):

```bash
docker compose up -d                       # todos los servicios arriba
./scripts/smoke-pronostico.sh --rapido     # opcional: comprueba el backend y deja el histórico hasta ayer
cd apps/web && npm run dev                 # la pantalla (la dirección la muestra Vite, normalmente http://localhost:5173)
```

Si el historial no llega hasta ayer, ponlo al día antes (segundos): ver `docs/comandos_datos_sinteticos.md`, sección 3.

**Usuarios de la semilla**

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador de ÁUREA | `admin@aurea.local` | `admin-local2026` |
| Propietario | `propietario@aurea.local` | `propietario2026` |

**Navegador:** abre las herramientas de desarrollo (F12) y la pestaña de consola: **no debe aparecer ningún error rojo** en ninguna prueba. Para los tamaños usa el modo dispositivo (Ctrl+Shift+M).

## A. Planificar la semana (administrador)

Entra como administrador y abre «Planificar la semana» desde el menú lateral.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| A1 | Abrir el menú lateral | Entrada «Planificar la semana» con icono de tendencia | ☐ |
| A2 | Abrir la pantalla por primera vez (sin pronósticos guardados) | Invitación «Calcula tu primera semana» y el botón «Calcular mi semana». Sin errores | ☐ |
| A3 | Pulsar «Calcular mi semana» | Mensaje «Calculando tu semana… esto toma unos segundos.» y luego la pantalla completa | ☐ |
| A4 | Mirar el indicador de nivel | Nivel «Al punto» (ÁUREA tiene modelo) con la frase «Predicción hecha a la medida de tu local…» y la precisión del modelo (±4.9 platos, 24 % mejor). **Sin barra de avance** | ☐ |
| A5 | Mirar la cinta de la semana | 7 días con la fecha de cada uno y cuánto se espera vender; los días que entran en la cobertura elegida se distinguen de los demás | ☐ |
| A6 | Mirar el selector «¿Para cuántos días quieres comprar?» | Opciones de 3, 5 y 7 días; la elegida resaltada | ☐ |
| A7 | Cambiar a 5 días | Aparece «Calculando…» y la pantalla se recalcula; la cinta marca 5 días y las cantidades **cambian** (más días, más cantidad) | ☐ |
| A8 | Mirar el resumen | Totales de insumos por prioridad, costo estimado y número de proveedores, coherentes con las tarjetas de abajo | ☐ |
| A9 | Mirar los grupos | Tres secciones, en este orden: «Comprar cuanto antes» (rojo), «Se acaban en estos días» (ámbar), «Tienes suficiente» (verde). Cada una con su subtítulo | ☐ |
| A10 | Mirar una tarjeta de insumo | Nombre, cantidad a comprar con su unidad (kg, L, botella…), costo aproximado «≈ S/ …», proveedor, cuánto tienes / cuánto usarás / reserva, y cuánto alcanza | ☐ |
| A11 | Revisar los redondeos | Cantidades en unidades contables (botellas, latas, cajas…) **siempre enteras**; en kg y L con **un decimal como máximo** | ☐ |
| A12 | Pulsar «Aceptar» en una tarjeta | Aviso «<insumo>: aceptado», la tarjeta pasa a «Aceptada» y **desaparecen** los botones | ☐ |
| A13 | Pulsar «Descartar» en otra | Aviso «<insumo>: descartado», la tarjeta pasa a «Descartada» | ☐ |
| A14 | Recargar la página (F5) | Las decisiones siguen ahí; no se pueden volver a decidir | ☐ |
| A15 | Pulsar «Recalcular» | Se genera otra semana; las recomendaciones nuevas vuelven a estar pendientes | ☐ |
| A16 | Mirar el bloque «¿De dónde salen estas cantidades?» (al final) | Explicación en lenguaje claro, **sin términos técnicos** (nada de P50, P90, modelo cuantílico, etc.) | ☐ |
| A17 | Mirar el bloque «Tu compra está casi lista» | Cuenta de insumos, días, monto y proveedores; frase «Nada se compra solo: tú revisas y registras la compra.» y el botón «Preparar compra» | ☐ |

## B. Lo que vas a vender (administrador)

Desde «Planificar la semana», pulsa «Ver platos de la semana».

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| B1 | Llegar a la pantalla | Título «Lo que vas a vender» y el enlace «Volver a Planificar la semana» | ☐ |
| B2 | Mirar los favoritos | «Los favoritos de la semana»: tres tarjetas («El más pedido», «Segundo», «Tercero») con el plato y cuántos se esperan «en la semana» | ☐ |
| B3 | Mirar la tabla | «Todos los platos, día por día» con la leyenda «Lo más probable» y «Si el día viene muy movido». Cada plato con sus 7 días | ☐ |
| B4 | Comparar una fila | El valor «si el día viene muy movido» **nunca es menor** que el «más probable» | ☐ |
| B5 | Pulsar «Volver a Planificar la semana» | Regresa sin recalcular ni perder la semana | ☐ |
| B6 | Abrir esta ruta con la sesión sin pronósticos | Mensaje «Aún no hay una semana calculada» con la pista de calcularla en «Planificar la semana» | ☐ |

## C. Preparar la compra y registrarla (administrador)

Desde «Planificar la semana», pulsa «Preparar compra». Haz esta parte con un pronóstico recién calculado.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| C1 | Llegar a la pantalla | Título «Preparar la compra» y «Para N días. Revisa las cantidades; puedes cambiar cualquiera.» | ☐ |
| C2 | Mirar los grupos | Un bloque por **proveedor**, cada uno con sus insumos, el subtotal y el botón «Registrar compra» | ☐ |
| C3 | Verificar un subtotal | Suma de (cantidad × precio c/u) de ese proveedor, con formato de soles | ☐ |
| C4 | Cambiar una cantidad | Aviso «Cambiaste 1 cantidad…», la línea dice «Cambiada por ti · sugerimos X» y el subtotal y el total se **recalculan al momento** | ☐ |
| C5 | Escribir una cantidad inválida (negativa o texto) | No se acepta o se corrige; no aparece «NaN» ni un monto roto | ☐ |
| C6 | Mirar el resumen | «Resumen» con «Total estimado» igual a la suma de los subtotales | ☐ |
| C7 | Un insumo sin proveedor conocido | Se muestra «Sin precio» y el total no se rompe | ☐ |
| C8 | Pulsar «Registrar compra» de un proveedor | Se abre **Compras** con el formulario ya lleno: ese proveedor, los insumos, las cantidades (las tuyas, no las sugeridas) y los precios | ☐ |
| C9 | Guardar o cerrar ese formulario | Si guardas, la compra aparece en la lista. Al volver atrás **no** se vuelve a abrir el formulario solo | ☐ |
| C10 | Volver a «Preparar la compra» tras registrar | Las líneas cambiadas figuran como «Ajustada» y las demás «Aceptada»; ya **no se pueden editar** | ☐ |
| C11 | Si todo está decidido o descartado | Mensaje «No hay nada que comprar» | ☐ |
| C12 | Pulsar «Descargar en Excel» y «Descargar en PDF» | Cada botón descarga un archivo. El Excel abre en Excel/LibreOffice agrupado por proveedor; el PDF abre y se lee con el nombre del local y la fecha | ☐ |

## D. Predicción de mis sedes (propietario)

Cierra sesión y entra como propietario. Abre «Predicción» en el menú.

| # | Paso | Debes ver | ✔ |
|---|---|---|---|
| D1 | Abrir el menú | Entrada «Predicción» con icono de tendencia | ☐ |
| D2 | Abrir la pantalla | Título «Predicción de mis sedes» y la descripción «Cuánto venderá cada sede y cuánto tendrá que comprar.» | ☐ |
| D3 | Mirar el panorama | Banner azul «Cerca de N platos y bebidas…» con barras por día y por sede, y una leyenda con el nombre de cada sede | ☐ |
| D4 | Cambiar el periodo | Opciones «Mañana», «Este fin de semana» y «Próximos 7 días»: el título y los totales cambian y los días fuera del periodo se atenúan | ☐ |
| D5 | Comparar totales | El total del banner es la suma de las tarjetas de las sedes | ☐ |
| D6 | Mirar la tarjeta de ÁUREA | Nivel «Al punto», «Venderá N platos y bebidas», «Compra sugerida» con monto y el estado de las decisiones del administrador | ☐ |
| D7 | Sede sin semana calculada | Texto «Esta sede todavía no tiene una semana calculada.» y el botón «Calcular semana» | ☐ |
| D8 | Pulsar «Calcular semana» en esa sede | Se calcula y la tarjeta se llena sin recargar toda la pantalla | ☐ |
| D9 | Mirar los platos comparados | «Los platos más pedidos de la semana, sede por sede»; donde una sede no vende un plato, queda vacío (no 0) | ☐ |
| D10 | Aceptar una recomendación como administrador y volver como propietario | La tarjeta de la sede refleja la decisión (aceptadas / descartadas / pendientes) | ☐ |

**Para ver una sede nueva sin ventas (nivel 0)** sin crearla a mano: corre `./scripts/smoke-pronostico.sh --conservar` y abre la vista del propietario; verás «SMOKE Sede …» en «Esperando tus primeras ventas», con un insumo bajo su mínimo. Al terminar, bórrala corriendo el script otra vez sin `--conservar`… o con la limpieza manual que indica el propio script al salir.

## E. Estados especiales (los dos roles)

| # | Cómo provocarlo | Debes ver | ✔ |
|---|---|---|---|
| E1 | **Servicio caído:** `docker stop restaurantcloudIA_pronostico`, luego pulsar «Recalcular» (admin) o «Calcular semana» (propietario) | Aviso claro en español, **sin** códigos ni «503». La pantalla sigue mostrando la última lista | ☐ |
| E2 | Con el servicio aún caído, recargar la pantalla | «La predicción no está disponible ahora» con el botón «Reintentar», o la última lista si ya existía | ☐ |
| E3 | `docker start restaurantcloudIA_pronostico`, esperar unos segundos y pulsar «Reintentar» | Todo vuelve a funcionar sin recargar el navegador | ☐ |
| E4 | **Ventas atrasadas:** dejar sin completar el histórico unos días (o `smoke-pronostico.sh --sin-extender` el día siguiente) y recalcular | Aviso «No vemos ventas desde el …» con la opción de reintentar; el aviso **no** sale si el POS tampoco tiene ventas nuevas | ☐ |
| E5 | **Plan sin predicción:** como propietario, cambia el plan de la empresa a uno sin IA (Básico/Estándar) en «Cambiar plan»; vuelve a entrar como administrador | Invitación «Anticípate a tu semana» con «Incluida en los planes Pro y Enterprise.». Al administrador: «Pídele al propietario de la empresa que cambie de plan.» | ☐ |
| E6 | Volver al plan Pro | La pantalla vuelve a funcionar con sus datos | ☐ |
| E7 | **Sin sesión / sesión vencida:** borrar la sesión y abrir `/admin/planificar-semana` | Te lleva al inicio de sesión | ☐ |
| E8 | **Rol equivocado:** como cajero o mozo abrir `/admin/planificar-semana`; como administrador abrir `/propietario/prediccion` | No se ve la pantalla (acceso denegado o redirección) | ☐ |

## F. Tamaños de pantalla y uso con teclado

Repite A4, A9, B3, C2 y D3 en cada tamaño.

| # | Tamaño | Debes ver | ✔ |
|---|---|---|---|
| F1 | **360 px** (móvil) | Sin desplazamiento horizontal de la página. Las tablas pasan a **lista de tarjetas**. Botones de al menos 44 px de alto. Textos sin cortarse | ☐ |
| F2 | **768 px** (tableta) | Distribución intermedia sin huecos raros ni elementos montados | ☐ |
| F3 | **1280 px** (escritorio) | El contenido aprovecha el ancho sin estirarse de más; las barras del banner de sedes se leen bien | ☐ |
| F4 | Navegar solo con **Tab** | El foco es visible (anillo cobre) y recorre en orden lógico; Enter activa botones y enlaces | ☐ |
| F5 | Cuerpo del texto | Se lee sin esfuerzo; ningún texto gris pálido sobre fondo claro. Sin emojis; los iconos acompañan al texto | ☐ |
| F6 | Colores | Rojo/ámbar/verde de las prioridades **siempre acompañados de texto** (no solo color) | ☐ |

## G. Lenguaje y datos (revisión transversal)

| # | Qué revisar | ✔ |
|---|---|---|
| G1 | Ninguna pantalla muestra palabras técnicas: P50, P90, baseline, ejecución, HTTP, ERR_… | ☐ |
| G2 | Los montos van en soles con separador de miles (`S/ 1,372.00`) y los decimales con punto | ☐ |
| G3 | Los nombres de nivel son los culinarios: «Esperando tus primeras ventas», «En preparación», «Casi a punto», «Al punto» | ☐ |
| G4 | Las fechas y días de la semana están en español y coinciden con el calendario real | ☐ |
| G5 | Los números de la pantalla coinciden con la base: cantidad sugerida, costo y proveedor de un insumo elegido al azar (ver `doc-2u/evidencias/smoke-pronostico/` o consultar `recomendacion_reposicion`) | ☐ |

## Cómo registrar un problema

Anota para cada fallo: el número de la prueba, el tamaño de pantalla, qué hiciste, qué viste y una captura. Si el error viene del servidor, copia también el mensaje de la pestaña **Red** (F12) y las últimas líneas de `docker logs restaurantcloudIA_api`.
