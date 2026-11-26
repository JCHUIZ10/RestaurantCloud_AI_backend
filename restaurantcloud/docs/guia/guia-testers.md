# Guía para testers — RestaurantCloud AI (ÁUREA)

Esta guía explica paso a paso cómo instalar, iniciar y probar el entorno de demostración de **RestaurantCloud AI (ÁUREA)** en tu computadora, sin necesidad de conocimientos de programación.

---

## 1. Requisitos previos

- **Sistema operativo:** Windows 10 u Windows 11 (64 bits). *(También funciona en macOS, Linux o Git Bash).*
- **Docker Desktop** instalado y actualizado (incluye **Docker Compose v2**).
- **Memoria RAM:** Docker Desktop debe tener asignados **al menos 4 GB** (recomendado **6 GB** para que las compilaciones sean fluidas).
  - En ejecución normal, los **15 contenedores activos de QA consumen ~1,01 GiB (~1.035 MiB)** en total.
- **Espacio libre en disco:** al menos **10 GB** para las imágenes y volúmenes de prueba.
- **Puerto 80 libre:** ningún otro programa (IIS, Apache, Nginx o el entorno de desarrollo) debe estar usando el puerto 80.
- **Git** para clonar el repositorio (si aún no lo tienes).

---

## 2. Instalación y primer arranque paso a paso

1. **Abre Docker Desktop** y espera hasta que en la esquina inferior izquierda aparezca el estado **Engine running** (en verde).
2. **Clona el repositorio** (o abre la carpeta si ya lo tienes descargado) desde PowerShell:
   ```powershell
   git clone <URL_DEL_REPOSITORIO>
   cd RestaurantCloud_AI_backend\restaurantcloud
   ```
3. **Inicia el entorno de QA con un solo comando:**
   ```powershell
   .\scripts\qa.ps1 iniciar
   ```
   *(Si prefieres Git Bash, macOS o Linux, ejecuta `./scripts/qa.sh iniciar`).*

   Este comando realiza todo de forma automática:
   - Comprueba que Docker esté activo, la memoria asignada sea suficiente y el puerto `80` esté libre.
   - Genera el archivo de configuración `.env` con claves seguras aleatorias (si todavía no existe).
   - Descarga y construye las imágenes de los servicios.
   - Carga el restaurante demo **ÁUREA** con sus cuentas, carta, mesas e insumos.
   - Genera el historial sintético de ventas hasta ayer para activar los modelos de IA.
   - Comprueba que el módulo de predicción responda en **nivel 3 (`modelo`)**.

4. **Ten paciencia la primera vez:**
   - La primera construcción de imágenes (especialmente el frontend y el servicio de pronósticos) puede tardar varios minutos según tu conexión y procesador.
   - La carga del historial sintético inicial toma alrededor de **4 minutos** dentro del contenedor (sin usar internet).
   - **En los siguientes arranques** la caché acelera todo a pocos segundos.

5. Cuando termine, verás en pantalla el mensaje **`Entorno QA listo en: http://localhost`** junto con el resumen de cuentas.

---

## 3. Cómo entrar y cuentas de prueba por rol

Abre tu navegador en:

- **Aplicación principal (ÁUREA):** http://localhost
- **Bandeja de correos de prueba (Mailpit):** http://127.0.0.1:8025 *(aquí llegan los correos de activación e invitación sin enviar nada a correos reales)*

> [!NOTE]
> La primera vez puedes usar directamente cualquiera de las cuentas de demostración de **ÁUREA** (no necesitas registrar una empresa desde cero salvo que quieras probar ese flujo específico).

| Rol | Correo | Contraseña | Área principal que prueba |
|---|---|---|---|
| **Propietario** | `propietario@aurea.local` | `propietario2026` | Panel multi-sede, reportes globales, predicciones consolidadas, gestión de locales y **cambio de plan** |
| **Administración** | `admin@aurea.local` | `admin-local2026` | Carta, insumos, mesas, personal/invitaciones, analítica de sede, **predicción y reposición IA** |
| **Caja** | `cajero@aurea.local` | `cajero2026` | Apertura/cierre de caja, cobro de pedidos, emisión de boleta/factura, notas de crédito |
| **Mozo** | `mozo@aurea.local` | `mozo2026` | Mapa de mesas, toma de pedidos, envío a cocina, división de subcuentas, campana de avisos |
| **Cocina (KDS)** | `cocina@aurea.local` | `cocina2026` | Tablero de comandas en vivo, avance de preparación, marcar platos listos o agotados |

*(Adicionalmente existen `mozo2@aurea.local` / `mozo2-2026` y `mozo3@aurea.local` / `mozo3-2026` para probar concurrencia entre mozos).*

---

## 4. Qué probar en cada rol (casos de uso principales)

Te sugerimos abrir dos ventanas (o una ventana normal y una de incógnito) cuando quieras ver interacciones en tiempo real, por ejemplo **Mozo ↔ Cocina** o **Cocina ↔ Campana de avisos**.

### A. Mozo — Toma de pedidos, envío a cocina y cuenta
1. Inicia sesión como **Mozo** (`mozo@aurea.local`).
2. Entra al mapa de mesas, abre una mesa libre y registra un pedido con 2 o 3 platos y bebidas.
3. Envía la comanda a cocina y verifica que el pedido cambie de estado.
4. Prueba **dividir una cuenta** en subcuentas o agregar ítems adicionales antes de pedir la cuenta.
5. Observa la **campana de avisos** en la parte superior cuando cocina marque un plato listo o agotado.

### B. Cocina (KDS) — Comandas en tiempo real
1. Inicia sesión como **Cocina** (`cocina@aurea.local`) en otra ventana.
2. Verifica que aparezca la comanda que acaba de enviar el mozo **sin recargar la página**.
3. Cambia el estado de los platos a *en preparación* y luego a *listo*.
4. Opcionalmente marca un producto/plato como agotado y comprueba que al mozo le llega el aviso en vivo en su campana y se bloquea en carta.

### C. Caja — Apertura, cobro y comprobantes
1. Inicia sesión como **Caja** (`cajero@aurea.local`).
2. Verifica que haya una caja abierta (o abre una sesión de caja indicando monto inicial).
3. Cobra el pedido generado por el mozo usando efectivo, tarjeta o pago mixto.
4. Emite el comprobante (boleta o factura) y verifica que quede registrado en caja y en el historial.
5. Prueba anular o emitir una nota de crédito sobre un comprobante para validar validaciones y descuentos.
   *(Nota: las consultas de DNI/RUC en QA responden en modo simulado/mock para no depender de tokens externos).*

### D. Administración — Reportes, campana, invitados y Predicción IA (Nivel 3)
1. Inicia sesión como **Administración** (`admin@aurea.local`).
2. **Campana de avisos:** revisa las alertas acumuladas, márcalas como leídas (individualmente o todas) y comprueba que el contador baje a `0`.
3. **Reportes de analítica:** entra a Analítica y verifica que aparezcan ventas, ranking de productos, curva por hora y desempeño del equipo (incluyendo las ventas que acabas de cobrar en Caja tras unos segundos de procesamiento).
4. **Predicción y reposición (IA):**
   - Entra al módulo de **Predicción / Reposición**.
   - Comprueba que ÁUREA esté en **Nivel 3** usando el **modelo de predicción** (`metodo = modelo`), mostrando la demanda esperada para los próximos días y las alertas de reposición por prioridad (*urgente*, *pronto*, *cubierto*).
   - Aprueba o ajusta una sugerencia de compra y prueba descargar la lista de compras en **Excel / PDF**.
5. **Invitación de personal (Mailpit):** invita un usuario nuevo desde Administración y abre http://127.0.0.1:8025 para ver el correo de invitación con su enlace de activación.

### E. Propietario — Multi-sede y cambio de plan
1. Inicia sesión como **Propietario** (`propietario@aurea.local`).
2. Revisa la vista consolidada de **Analítica** y **Pronósticos** seleccionando la sede ÁUREA.
3. Entra a **Suscripción / Planes** y prueba el flujo de **cambio de plan** (o consulta de límites por sede).

---

## 5. Cómo reportar un fallo correctamente

Cuando encuentres un error, un comportamiento inesperado o una pantalla que no carga, recopila estos datos antes de reportarlo:

1. **Rol y correo** con el que estabas conectado (ej. `admin@aurea.local`).
2. **Pasos exactos** que hiciste antes del error (1, 2, 3...).
3. **Qué esperabas que pasara** y **qué pasó en realidad** (mensaje en pantalla, botón que no responde, etc.).
4. **Fecha y hora aproximada** en tu reloj.
5. **Captura de pantalla** donde se vea toda la ventana.
6. **El código `X-Request-Id` de la petición fallida** (muy importante para rastrear el error exacto en el servidor):
   - Antes o justo al ocurrir el error, presiona **`F12`** en el navegador (Chrome / Edge) para abrir las herramientas de desarrollo.
   - Haz clic en la pestaña **Red** (**Network**).
   - Repite la acción que falla: aparecerá una fila nueva en rojo (código `4xx` o `5xx`).
   - Haz clic sobre esa fila roja → ve a la pestaña **Encabezados** (**Headers**) → baja hasta **Encabezados de respuesta** (**Response Headers**).
   - Busca la línea **`X-Request-Id`** y copia su valor completo (por ejemplo, `8f2c...`).

---

## 6. Comandos diarios, reinicio y problemas comunes

Ejecuta siempre estos comandos dentro de la carpeta `restaurantcloud`:

| Qué quieres hacer | PowerShell (Windows) | Git Bash / Linux / macOS |
|---|---|---|
| Iniciar o encender QA tras apagar la PC | `.\scripts\qa.ps1 iniciar` | `./scripts/qa.sh iniciar` |
| Ver si todos los contenedores están sanos | `.\scripts\qa.ps1 estado` | `./scripts/qa.sh estado` |
| Apagar QA **sin perder tus datos de prueba** | `.\scripts\qa.ps1 detener` | `./scripts/qa.sh detener` |
| Completar días faltantes si dejaste pasar varios días | `.\scripts\qa.ps1 preparar` | `./scripts/qa.sh preparar` |
| **Reiniciar desde cero** (borra tus cambios y vuelve al seed limpio) | `.\scripts\qa.ps1 reiniciar` | `./scripts/qa.sh reiniciar` |

### Problemas comunes

- **«Docker no está en marcha o no responde»:** Abre **Docker Desktop**, espera a que el ícono deje de parpadear (estado verde) y vuelve a ejecutar `.\scripts\qa.ps1 iniciar`.
- **«El puerto 80 ya está ocupado»:** Otro programa está usando el puerto 80 (por ejemplo, IIS de Windows, otro servidor web o un entorno previo encendido). Detén ese servicio y reintenta.
- **«Docker solo tiene X GiB de memoria asignada»:** En Docker Desktop abre **Settings → Resources** (o edita `%USERPROFILE%\.wslconfig` en Windows con WSL2), sube la memoria a **6 GB** (mínimo 4 GB), aplica los cambios y reinicia Docker.
- **Dejaste el entorno varios días apagado y el pronóstico avisa datos atrasados:** Ejecuta `.\scripts\qa.ps1 preparar`. El script completará únicamente los días que faltan hasta ayer en ~segundos y volverá a verificar el nivel 3.
- **El correo de registro o invitación no llega a Gmail:** En QA todos los correos se interceptan de forma segura en **Mailpit**. Ábrelo en http://127.0.0.1:8025 para verlos al instante.
- **Modificaste muchos platos/pedidos y quieres volver al estado original:** Ejecuta `.\scripts\qa.ps1 reiniciar` y confirma con `s`. En unos minutos tendrás el entorno exactamente igual que recién instalado.
