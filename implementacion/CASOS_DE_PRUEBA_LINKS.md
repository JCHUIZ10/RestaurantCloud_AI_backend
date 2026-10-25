# GUÍA RÁPIDA DE ENLACES DE PRUEBA Y DEMOSTRACIÓN
## RestaurantCloud AI — Verificación en Vivo de Pantallas

> **Propósito:**  
> Este documento permite comprobar de forma rápida y directa cada pantalla desarrollada en el frontend (`http://localhost:5173`), explicando en una sola línea qué representa cada escenario de prueba y su alcance de entrega.

---

# PARTE I: MÓDULOS ACTIVOS DEL PRIMER AVANCE (COMPLETAMENTE OPERACIONALES)

(Landing Page SaaS B2B):
- Portal comercial interactivo con métricas 3D en tiempo real, propuesta de valor y planes de suscripción: http://localhost:5173/

(CU-CLIENTE-01: Consultar Carta Digital QR):
- Carta digital pública de sede con menú de platos, categorías, carrusel de promociones y modal informativo: http://localhost:5173/sede/miraflores/carta
- Acceso directo optimizado para escaneo de código QR en mesa desde smartphone: http://localhost:5173/m/miraflores

(CU-CLIENTE-02: Buscar Comprobante de Pago Digital):
- Boleta de venta electrónica emitida para consumidor final con desglose de consumo y propina: http://localhost:5173/c/token-boleta-demo
- Factura electrónica para empresas con RUC, razón social y formato formal A4: http://localhost:5173/c/token-factura-demo
- Comprobante anulado por Nota de Crédito con sello de agua tributario y motivo de rectificación: http://localhost:5173/c/token-anulado-demo
- Buscador manual asistido para comensales que ingresan sin parámetros directos (Zero Dead-Ends): http://localhost:5173/comprobante
- Búsqueda estructurada mediante slug de sede y número de serie correlativo: http://localhost:5173/sede/miraflores/comprobante/B001-0004521
- Pantalla de estado de error cuando el token no existe o ha expirado: http://localhost:5173/c/token-invalido-demo

(CU-AUTH-01: Iniciar Sesión y Resolución Multi-Cuenta):
- Formulario de login con widget flotante en esquina inferior para copiar y probar 7 perfiles en 1 clic: http://localhost:5173/login

(CU-PROP-01: Registrar Empresa y Suscribirse con Verificación OTP y Cobro según Plan):
- Flujo interactivo de autoservicio para nuevos propietarios en 5 pasos (Paso 1 Selección de Plan, Paso 2 RUC 10/20 y datos de empresa con resumen sticky, Paso 3 Verificación OTP con reenvío y modal de corrección de correo, Paso 4 Cobro exacto en Stripe según Plan Starter S/ 99, Pro S/ 249 o Enterprise S/ 499, y Paso 5 Activación con descarga de constancia y soporte 24/7), vinculado a /#planes y con widget flotante de pruebas QA: http://localhost:5173/registro
- Enlace directo con Plan Starter preseleccionado (S/ 99/mes): http://localhost:5173/registro?plan=1
- Enlace directo con Plan Pro preseleccionado (S/ 249/mes): http://localhost:5173/registro?plan=2
- Enlace directo con Plan Enterprise preseleccionado (S/ 499/mes): http://localhost:5173/registro?plan=3

(CU-PROP-02: Gestionar Suscripción y Método de Pago):
- que es : Panel de control corporativo de suscripción SaaS y facturación recurrente en DashboardLayout: visualización del Plan Pro (S/ 249.00 / mes) con fecha de próximo cobro (01 Nov 2026), sincronización reactiva de consumo de recursos en tiempo real (locales 2/3, mesas 26/30, personal 8/15), tarjeta de crédito interactiva en degradé (Visa •••• 4242) con advertencia de vencimiento y protocolo de seguridad PCI-DSS Nivel 1 (cero almacenamiento de PAN/CVC), banner de alerta de periodo de gracia Dunning (5 días de gracia no bloqueantes para la cocina/salón con liquidación automática de deuda pendiente al actualizar tarjeta), tabla responsive e historial de facturas electrónicas con descarga directa de comprobantes oficiales SUNAT en PDF/TXT, modal comparativo de planes (Starter, Pro, Enterprise) con cálculo prorrateado, y widget flotante Sandbox QA para alternar cobro fallido, suspensión de cuenta y tarjeta por vencer en 1 clic: http://localhost:5173/propietario/suscripcion

(CU-PROP-04: Registrar y Administrar Locales (Sedes) con UBIGEO Nacional, Slugs Reactivos, Quota Plan Pro y Autogestión):
- que es : Directorio corporativo de sedes operativas en DashboardLayout con selector territorial en cascada de 3 niveles (Región, Provincia y Distrito con estándar oficial UBIGEO INEI/SUNAT de 6 dígitos, preseleccionado por defecto en Áncash > Santa > Chimbote), barra de progreso de cuota Plan Pro (2/3 sedes, 66% consumido), tabla desktop y cards responsive mobile, badge distintivo [ 👑 Autogestionado ] con botón ergonómico directo [ 🚀 Acceder a Sede ] para cambiar de contexto operativo al panel de administración (/admin/dashboard), enlace directo a la carta digital (/sede/:slug/carta), Wizard de Alta en 2 Pasos (Paso 1: datos comerciales, teléfono y comprobador predictivo reactivo de slug web con sugerencias ante duplicados + selector de modelo de supervisión; Paso 2: selector de 4 plantillas gastronómicas [Pollería, Cevichería, Chifa, En Blanco] con aprovisionamiento atómico de Salón Principal 5x3 mesas, categorías e insumos), Modal de Auditoría de Baja con Bloqueo Duro en tiempo real (invalida la desactivación si hay turnos de caja abiertos o comandas pendientes en salón y exige código de confirmación DESACTIVAR si está limpio), y widget flotante Sandbox QA para alternar bloqueo duro, forzar cuota al 100% (3/3) y alternar autogestión en 1 clic: http://localhost:5173/propietario/sedes

(CU-PROP-05: Crear y Gestionar Administradores de Local):
- que es : Directorio corporativo de administradores de sede en DashboardLayout con barra accesible de consumo de cuota de personal (plan.max_usuarios: 8 de 15 cuentas activas en Plan Pro), tabla desktop y cards táctiles mobile con estados semánticos ([ ✓ Activo ], [ ⏳ Invitación pendiente ] con tiempo restante dinámico, [ ⚠️ Invitación expirada ], [ Inactivo ]), Modal de Invitación Segura (con banner de consumo de cupos, dropdown con sedes disponibles vs ocupadas con regla 1:1 y sin contraseñas provisionales mediante enlaces firmados con token efímero de 24 horas), Modal de Reasignación de Sede Titular (con impacto transparente de permisos y pase de la sede anterior a autogestión del propietario), Modal de Desactivación con revocación inmediata de sesiones JWT en Redis Blacklist, Modal de copia y envío directo de enlace de activación por WhatsApp, y widget Sandbox QA para simular cupo de personal lleno (15/15), invitaciones expiradas y errores 409: http://localhost:5173/propietario/administradores

(CU-MOZO-01: Ver Estado de Mesas y Centro de Comandas en Vivo):
- Pantalla integrada de salón (layout 70/30) con plano táctil, despacho dual en acordeones colapsables (productos de despacho directo como gelatinas/bebidas y pase de cocina), disponibilidad en vivo de mesas libres y ocupadas por piso, Quick-Drawer de 440px y simulador de eventos: http://localhost:5173/mozo/mesas

(CU-MOZO-02: Tomar Pedido y Comanda Móvil en Salón):
- Terminal táctil de toma de comanda (layout 65/35) con catálogo en vivo, split transaccional (cocina KDS vs entrega directa), modal de notas a cocina, segunda ronda de adicionales y resolución de conflictos 409: http://localhost:5173/mozo/mesas/mesa-04/comanda

(CU-MOZO-08: Emisión de Precuenta Digital en Mesa):
- que es : Precuenta digital en mesa con desglose SUNAT Perú, promociones comerciales en 1 clic, código QR de Yape/Plin para pago asistido y notificación a caja vía SSE: http://localhost:5173/mozo/mesas/mesa-04/precuenta

(CU-MOZO-05: Recepción y Gestión Operativa de Reservas en Salón):
- Bandeja de reservas del día en salón para mozo y anfitriona: http://localhost:5173/mozo/reservas

(CU-COCINA-01 & CU-COCINA-02: Monitor KDS de Cocina y Despacho):
- Sistema KDS de producción gastronómica con colas de comanda FIFO y semáforo de tiempos: http://localhost:5173/cocina/kds
- Control de quiebre rápido de stock en cocina: http://localhost:5173/cocina/stock-rapido

(CU-ADMIN-01: Diseñar y Distribuir Plano de Mesas por Pisos):
- Diseñador visual de salón con drag & drop de mesas, numeración, capacidades y pisos de atención: http://localhost:5173/admin/plano-mesas

(CU-ADMIN-02: Gestionar Categorías del Menú):
- Jerarquía de categorías con ordenamiento drag & drop, plantillas gastronómicas y estados de carta: http://localhost:5173/admin/categorias

(CU-ADMIN-03: Administrar Catálogo de Productos y Recetas con Escandallo):
- Maestro de platos y bebidas con ficha de costeo (escandallo), insumos requeridos y cálculo de margen: http://localhost:5173/admin/carta

(CU-ADMIN-05: Gestionar Inventario e Insumos Culinarios):
- Kardex de insumos, stock mínimo, mermas, alertas de reposición y auditoría de almacén: http://localhost:5173/admin/inventario

(CU-ADMIN-06: Gestionar Directorio de Proveedores):
- Cartera de proveedores gastronómicos con RUC, términos de pago y evaluación de entregas: http://localhost:5173/admin/proveedores

(CU-ADMIN-07: Registrar Fichas de Compra y Recepción de Mercadería):
- Ingreso de comprobantes de compra que abastece el stock culinario automáticamente: http://localhost:5173/admin/compras

(CU-ADMIN-08: Administrar Personal y Roles de la Sede):
- Gestión de mozos, cocineros y cajeros con credenciales, estados y reinicio seguro de accesos: http://localhost:5173/admin/personal

(CU-ADMIN-09: Configurar Horario de Atención y Feriados del Local):
- que es : Configuración y control de horarios operativos y feriados en DashboardLayout: Grilla semanal de 7 días (Lunes a Domingo) con soporte para turnos partidos (Almuerzo y Cena), turnos continuos y turnos trasnochadores (+1 día madrugada), botón de aceleración operativa [ Copiar horario de Lunes a toda la semana ], contador en vivo de horas semanales operativas, directorio y calendario de excepciones con soporte dual de Cierre Total vs Horario Especial acotado, botón de 1 clic para Cargar Feriados Nacionales de Perú 2026 (16 feriados oficiales), detección asistida (precheck) de reservas de salón (CU-MOZO-05) que pudieran verse afectadas ante un cierre extraordinario, Modal de Conflicto de Reservas (680px) con botón de enlace directo a WhatsApp (wa.me/51...) precargado con mensaje de cortesía para coordinar reprogramaciones, checkboxes de control de comensales notificados y cancelación atómica de reservas, onboarding asistido para sedes sin turnos con recomendación de plantilla gastronómica estándar y widget flotante QA para simular conflictos en Navidad (25/12 con 3 reservas), vaciado de horario y restablecimiento de semillas en 1 clic: http://localhost:5173/admin/horario

(CU-ADMIN-12: Recibir Notificación de Anulación de Pedido y Auditoría de Sala):
- que es : Bandeja central de auditoría de novedades y anulaciones en DashboardLayout basada estrictamente en la tabla especializada pedido_anulacion (02_schema_ddl.sql líneas 751-781): selector táctil de fechas ([ < Hoy, 09 Octubre 2026 > ]), 4 tarjetas KPI del día (Total Anulaciones, Monto Acumulado S/, Platos con Merma y Costo Perdido S/, y Mesas Afectadas), filtros rápidos en píldora (Todas, Pendientes, Con Merma, Sin Merma, Comandas Totales) y selector de mozo, tabla con soporte para mesas combinadas Mesa [ 02 ; 03 ] y semáforo de merma, Ficha de Auditoría de 680px con trazabilidad temporal fáctica (pedido_created_at vs anulado_at = minutos_espera) y control de merma contable, marcado de conformidad de supervisión (revisado = true), diálogo de escalamiento asistido prellenado vinculando pedido_anulacion.incidente_id, Campana interactiva [ 🔔 2 ] con menú dropdown de 390px en topbar y Toast flotante SSE en tiempo real: http://localhost:5173/admin/anulaciones

(CU-ADMIN-14: Gestión de Flujo de Caja, Gastos Operativos y Auditoría de Cierres Z):
- que es : Centro de control financiero integral y supervisión de cajas de sede en DashboardLayout (alineado 100% con 02_schema_ddl.sql tablas caja, gasto_manual, caja_movimiento y auditoria_caja_cierre): Pestaña 1 (Flujo de Caja & Balance Neto con selector de períodos [Hoy, Semana, Este Mes, Rango], 4 KPIs estratégicos [Ingresos Salón S/ 28,450.00 ▲12.4% con desglose POS 54%, Efectivo 32%, Yape 14%; Egresos Totales S/ 16,820.00 ▼-3.1%; Balance Neto +S/ 11,630.00 con margen 40.8% y ratio cobertura 1.69; Conciliación Liquidez Bancos S/ 19,346 vs Gaveta S/ 9,104], gráfica de evolución periódica de entradas vs salidas y desglose de egresos en insumos culinarios directos ficha_compra S/ 11,250 vs gastos manuales de sede gasto_manual S/ 5,570); Pestaña 2 (Auditoría de Turnos & Cierres Z con barra de control interno [42 turnos, 40 cuadrados 95.2%, 2 con discrepancia subsanada, 41 auditados], banner reactivo de monitoreo de terminal que detecta turnos abiertos y botón de rescate [ ⚠️ Cierre Administrativo Forzado ], y directorio de turnos con estado de cuadratura y visado); Pestaña 3 (Directorio detallado de gastos operativos de sede con desglose de bancos vs caja chica con vínculo a turno); Vista 3 (Modal de 900px con Visor Oficial del Reporte Z Digital RUC 20609876543 con cuadratura de gaveta vs lotes POS, formulario de visado gerencial con notas de auditoría y descarga en PDF); Vista 4 (Modal de 700px para registrar gasto manual con categorías limpias sin insumos de cocina, selector de origen de fondos y callout de cuadratura automática de gaveta); Vista 5 (Modal de Cierre Forzado de 600px para liberar terminales abandonadas con justificación >= 15 carac y liberación de uq_caja_abierta_local); y Widget Sandbox QA flotante para alternar entre Superávit, Déficit Temporal, Discrepancia Pendiente y Terminal Bloqueada: http://localhost:5173/admin/finanzas/flujo-caja

(CU-ADMIN-17: Gestionar Promociones del Local):
- que es : Centro de administración comercial y configuración predictiva de descuentos de sede en DashboardLayout (alineado 100% con 02_schema_ddl.sql tabla promocion líneas 427-452 y operaciones de caja CU-CAJA-02/03): 4 KPIs consolidados de sede (Vigentes Hoy, Campañas Programadas, Descuentos del Mes en Soles y Cuentas Beneficiadas), barra de filtros con píldoras dinámicas de estado (Todas, Vigentes, Programadas, Pausadas, Vencidas, Agotadas), selector de tipo (Porcentaje, Monto Fijo) y buscador optimizado bajo demanda con botón explícito [ 🔍 Buscar ], soporte para tecla Enter y botón [ ✕ ] para limpiar respaldado por endpoint dedicado (GET /api/v1/admin/promociones/buscar), tabla densa con insignias de tipo, chips de días de semana, condiciones/topes, switch en caliente [ En Caja ] con bloqueo estricto por vigencia expirada (today > fecha_fin con badge rojo Expirada y candado) y cupo agotado, paginación condicional limpia (5 registros/pág, oculta si hay <=1 página o lista vacía), Modal de Configuración (Vista 2, 740px) con distinción entre tope por ticket vs cupo de canjes y frecuencia Zero-Cron O(1) (diario vs global), Simulador en Vivo para Caja que valida fórmulas SUNAT Perú (Total Neto = Consumo - Descuento, Base = Total Neto / 1.18, IGV 18% = Total Neto - Base), Modal de Métricas de Rendimiento y Auditoría de Comprobantes SUNAT (Vista 3, 740px) con tabla paginada limpia y botón de reactivación protegido, advertencia contable ON DELETE RESTRICT (bloqueo de borrado si existen comprobantes históricos), Onboarding para sedes nuevas (Vista 4) con Plantilla de Gran Apertura (15% OFF por 30 días) en 1 clic y Widget QA interactivo para simular ventas en caja y cupo agotado: http://localhost:5173/admin/promociones

(CU-ADMIN-18: Configurar Parámetros Operativos de Comanda y Tiempos de KDS):
- que es : Calibración reactiva de umbrales cromáticos y tiempos operativos de cocina y salón en DashboardLayout (alineado 100% con 02_schema_ddl.sql tabla configuracion_kds con local_id como PRIMARY KEY líneas 186-199): estructura en 2 columnas (50% Formulario Izquierda / 50% Simulador KDS Derecha), steppers numéricos táctiles (>= 48px) para Tiempo Óptimo Verde (3-60 min) y Tiempo Alerta Ámbar (5-120 min) con cálculo automático del estado Rojo Crítico (> ámbar), salvaguarda Poka-Yoke de coherencia temporal (tiempo_alerta_ambar_min > tiempo_optimo_verde_min) con banner de advertencia visual y bloqueo estricto 422 (ERR_UMBRALES_KDS_INCOHERENTES), calibración de Tolerancia Máxima en Pase Caliente (1-30 min) para tablets de mozo (CU-MOZO-01 / CU-COCINA-02), configuración de alertas acústicas (Timbre Chime sinusoidal ascendente 587Hz -> 880Hz y Sirena roja de advertencia 320Hz -> 200Hz) con prueba de sonido integrada en el navegador mediante Web Audio API nativa sin dependencias externas, intervalo de repetición en rojo (15 a 300s), selector visual de Vista Inicial KDS ([⊞ Comandas FIFO] vs [☰ Consolidado All-Day]), botón de 1 toque [ Restaurar Valores Recomendados ] (15m/25m/3m/60s/FIFO), Simulador de Semáforo en Vivo con tema oscuro KDS (bg-slate-900) que proyecta 3 comandas reales (Mesa 04 con 10m 20s, Mesa 01 con 19m 40s y Mesa 07 demorada con 28m 15s) recalculando sus contrastes cromáticos y badges en < 16ms (60 FPS), scrubber/calibrador interactivo de tiempo continuo (0 a 45 min) para observar las transiciones exactas de color, sincronización en caliente con la pantalla operativa de cocina (/cocina/kds) y widget QA flotante con presets gastronómicos en 1 clic: http://localhost:5173/admin/configuracion-kds

(CU-ADMIN-19: Configurar Métodos de Pago y Comisiones de Cobro del Local):
- que es : Centro de administración de canales de pago y políticas de comisión por sede en DashboardLayout (alineado 100% con 02_schema_ddl.sql tabla metodo_pago_local con clave foránea a local(id), restricción uq_metodo_pago_local, comision_porcentaje DECIMAL(5,2) <= 50.00% e integración con comprobantes y precuenta de salón): 4 KPIs consolidados (Métodos Habilitados 3/4, Con Recargo 1, Ventas Tarjeta Mes S/ 24,850.00 y Recargos Percibidos S/ 869.75), Split 50/50 Panel Principal con Catálogo de métodos táctil (steppers >= 48px, interruptores en caliente, inputs de comisión acotados 0.00%-50.00% con Efectivo legal 0.00% inalterable), Simulador Espejo de Caja & Precuenta en tiempo real con selector de importe de prueba (S/ 100.00 por defecto o ajustable), comparación simultánea de las 4 opciones de cobro con desglose tributario SUNAT en centavos (Subtotal, Recargo de Comisión, Total Final, Base Imponible e IGV 18%) y renderizado dinámico del ticket térmico con leyenda fiscal obligatoria y QR de cobro, Modal de Configuración de Billetera Digital (Vista 2, 680px) con validación estricta de 9 dígitos peruanos para Yape/Plin y previsualización de sticker con QR para mostrador, Modal de Transferencias Bancarias (620px) con autocompletado de entidades peruanas, validación de CCI de 20 dígitos con botón de copia rápida y protocolo de seguridad para cajeros, Modal de Bloqueo de Seguridad Poka-Yoke 409 Conflict (Vista 3, 540px) para la regla RN-PAGO-06 (ERR_MINIMO_UN_PAGO) que previene dejar la sede sin vías de cobro con reactivación guiada en 1 toque, Onboarding Inicial para Sedes Nuevas (Vista 4, 920px) con aprovisionamiento estándar en 1 clic (Efectivo, POS y Yape al 0%) y Widget QA flotante con escenarios preconfigurados: http://localhost:5173/admin/metodos-pago

(CU-CAJA-01: Apertura de Turno de Caja y Terminal Única de Salón):
- que es : Terminal táctil de caja para inicio de jornada y gating de facturación en TerminalLayout (alineado 100% con 02_schema_ddl.sql tablas caja y caja_movimiento líneas 524-545 y 03_indexes.sql uq_caja_abierta_local): 3 Vistas Canónicas integradas: Vista 1 (Modal Central de Apertura de Turno de 560px con overlay bloqueante rgba(15, 23, 42, 0.75) y backdrop blur, proyección correlativa secuencial Turno #042, perfil del cajero en turno Carlos Mendoza, input monetario PEN S/ 300.00 con chips táctiles de incremento rápido [+S/50, +S/100, +S/200, Borrar], textarea para observaciones y banner Poka-Yoke de política operativa de terminal única); Vista 2 (Bloqueo de Pantalla por Conflicto 409 ERR_TURNO_PREVIO_NO_CERRADO ante turno saliente de Juan Pérez sin cerrar hace 5h con 24 ventas por S/ 2,480.00 y saldo esperado en gaveta S/ 2,730.00, con botón [ 🔔 Notificar al Administrador ] con enlace WhatsApp a Mariana Ramos para que gestione el cierre y arqueo en la vista especializada CU-ADMIN-14, botón [ 🚪 Cerrar Sesión ] para liberar la terminal y acción para simular la resolución de administración); Vista 3 (Monitor POS Desbloqueado y Operativo en Salón con barra superior de turno activo Turno #042 • S/ 300.00 inicial, 4 KPIs dinámicos: Cuentas Pedidas con alerta pulsante, Monto por Cobrar S/ 245.00, Efectivo en Caja S/ 300.00 y Ocupación del Salón 63% con barra de progreso, pestañas de filtrado de mesas [Todas 16, Cuenta Pedida 2, Ocupadas 8, Libres 6], selector por ambiente y buscador reactivo, tarjetas de mesa con alerta prioritaria y botón directo [ ⚡ Cobrar / Precuenta ] en Mesa 04 / 08 que despliega el sub-modal de cobro interactivo con métodos Efectivo/Tarjeta/Yape liberando la mesa e incrementando las ventas del turno en vivo), y Widget Flotante Sandbox QA en la esquina inferior derecha para alternar en 1 clic entre Caja Cerrada (Vista 1), Provocar 409 (Vista 2), POS Desbloqueado (Vista 3), Simular Cierre en CU-ADMIN-14 y Restablecer Semillas: http://localhost:5173/cajero/pos

(CU-CAJA-05: Cerrar Caja (Arqueo Z) y Rendición de Cuentas del Turno):
- que es : Terminal táctil de arqueo de caja y cierre formal de turno Z en TerminalLayout (alineado 100% con 02_schema_ddl.sql tabla caja líneas 524-545 y liberación de uq_caja_abierta_local): 3 Vistas Canónicas integradas: Vista 1 (Pre-Arqueo y Balance Operativo del Turno #042 con 3 KPIs superiores de fondo S/ 300.00, facturado S/ 1,485.00 y 15 comprobantes, banner Poka-Yoke de bloqueo condicional por mesas activas con botón demostrativo para liquidar mesas, desglose contable de medios de pago [Efectivo S/ 85.00, Devolución NC -S/ 85.00, Tarjetas POS S/ 245.00, Billeteras S/ 54.00, Otros S/ 1,186.00], resumen tributario SUNAT [Base Gravada S/ 1,258.47 + IGV 18% S/ 226.53 = S/ 1,485.00], checklist Poka-Yoke de rendición física y botón de acción principal [ 📋 Iniciar Arqueo y Cierre de Caja (F8) ]); Vista 2 (Modal de Arqueo y Conteo Físico Ciego de 1040px con 2 columnas: Columna 1 Flujo de Efectivo esperado por el sistema S/ 300.00 con conciliación de vouchers POS físicos y capturas Yape/Plin vs Columna 2 Registro de Efectivo Físico Contado con chips de ajuste rápido [S/ 300 Exacto, S/ 285 Faltante, S/ 320 Sobrante], cuadro dinámico de discrepancia con semáforo cromático [Verde: Cuadrada, Ámbar: Faltante, Azul: Sobrante], contador dinámico y justificación obligatoria >= 10 caracteres si existe diferencia [ERR_DISCREPANCIA_SIN_JUSTIFICAR], notas de entrega y botón [ 🔒 Confirmar y Cerrar Turno Definitivamente (F9) ]); Vista 3 (Reporte Z Oficial Digital SUNAT emitido con cabecera tributaria RUC 20609876543, duración del turno 8h 15m, arqueo físico registrado, desglose de comprobantes [11 Boletas, 3 Facturas, 1 Nota de Venta, 1 Nota de Crédito], simulación de descarga de documento PDF oficial /api/v1/caja/turnos/.../reporte-z/pdf, ticket térmico fiscal con watermark "TURNO FINALIZADO", botón [ ⚡ Ir a Apertura de Nuevo Turno ] para iniciar Turno #043 en /cajero/pos y botón [ 🚪 Cerrar Sesión ]); y Widget Flotante Sandbox QA en la esquina inferior derecha para alternar en 1 clic entre Salón al Día (Arqueo F8), Mesas Pendientes (Poka-Yoke), Simular Faltante (-S/ 15.00), Simular Sobrante (+S/ 20.00), Ver Reporte Z Emitido (Vista 3) y Restablecer Semillas: http://localhost:5173/cajero/turno

(CU-SAAS-01: Supervisar Empresas Registradas, Activaciones y Renovaciones de Suscripción):
- que es : Consola maestra de supervisión de clientes gastronómicos para el rol Administrador Global SaaS en DashboardLayout: 4 tarjetas KPI en tiempo real (Total Empresas 48 con MRR, Suscripciones Activas 41 [85.4%], En Período de Gracia 3 con S/ 747 MRR en riesgo y Sedes Conectadas 112 con ratio 2.3 sedes/cliente), barra de filtros interactiva con pestañas de estado (Todos, Activos, En Gracia, Suspendidos, Baja), buscador reactivo con debounce y selector de planes (Starter, Pro, Enterprise), tabla de auditoría desktop con conteo regresivo de gracia (Día X de 5 de gracia) y cards táctiles para smartphones (< 1024px), Modal de Expediente 360° (Vista 2) con 4 bloques canónicos (Identidad fiscal, Contrato Stripe, Historial de pagos en tabla pago y consumo de recursos vs cuotas de plan) con acciones para reenviar notificación de cobro con capability token y suspensión preventiva, Estado Vacío Positivo con escudo de conformidad 🛡️ (Vista 4) cuando no hay cobros en gracia, y widget Sandbox QA flotante en la esquina inferior derecha para alternar escenarios en 1 clic: http://localhost:5173/saas/tenants
- Onboarding B2B Dedicado : Página dedicada oficial de Onboarding Corporativo B2B (`/saas/tenants/nuevo`) con layout de 2 columnas maestro-detalle (8 cols formulario guiado en 4 pasos + 4 cols sticky para resumen analítico en vivo según GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md): Stepper responsive dual (horizontal para desktop y barra compacta para móvil), Paso 1 (Validación sintáctica matemática Módulo 11 en tiempo real para RUC peruano de 11 dígitos, deducción automática RUC 20 Jurídica vs RUC 10 Natural, razón social y primera sede física obligatoria), Paso 2 (Datos del propietario titular con aviso de capability token efímero de 72h), Paso 3 (Selector interactivo de planes Starter S/ 99, Pro S/ 249, Enterprise S/ 499 con conmutador mensual/anual con 2 meses gratis y cálculo de vigencia), Paso 4 (Asentamiento contable estricto e inmutable en tabla pago de PostgreSQL 16 con validación Poka-Yoke [monto > 0, medio de pago, N° de operación y nota de auditoría contable]), Paso 5 (Pantalla de activación exitosa con código EMP-XXXXX, descarga de constancia en formato TXT y botones para abrir expediente o volver a la bandeja), panel lateral sticky con checklist de integridad PostgreSQL 16, persistencia ante F5 en sessionStorage y parámetro QA Sandbox (`?demo=true`): http://localhost:5173/saas/tenants/nuevo

---

# PARTE II: MÓDULOS PLANIFICADOS PARA EL PRÓXIMO ENTREGABLE (FASE 2)

> **Nota de Gobernanza de Producto:**  
> Los siguientes 6 módulos han sido retirados de los menús laterales (Sidebars) de Administrador, Propietario y SaaS Admin para focalizar la evaluación del **Primer Avance** en el núcleo transaccional.  
> Sus rutas web se encuentran formalmente registradas en el router y protegidas con la vista institucional `[⏳ Próximo Entregable (Fase 2)]`. Sus modelos DDL, endpoints de backend y contratos DTO se encuentran completamente preservados.

(CU-PROP-01/04: Resumen General / Dashboard Consolidado del Propietario):
- **Ruta Web:** http://localhost:5173/propietario/dashboard
- **Estado:** Oculto del sidebar de Propietario. El botón de cambio de entorno `Dueño` redirige directamente al módulo activo de Sedes (`/propietario/sedes`).
- **Alcance Planificado:** Consolidado multi-sede de ventas en PEN, uso de cuota de recursos según plan contratado (locales, mesas, personal) y estado de facturación Stripe.

(CU-PROP-06: Ver Incidentes de la Empresa — Supervisión Corporativa Multi-Sede):
- **Ruta Web:** http://localhost:5173/propietario/incidentes
- **Estado:** Oculto del sidebar de Propietario.
- **Alcance Planificado:** Consola ejecutiva de supervisión de incidentes y anomalías de sedes con trazabilidad inmutable de bitácora, acuse de lectura transparente y emisión de directivas corporativas a administradores de local.

(CU-ADMIN-10: Configurar Políticas y Parámetros de Reservas de Mesas):
- **Ruta Web:** http://localhost:5173/admin/politicas-reserva
- **Estado:** Oculto del sidebar de Administrador de Local.
- **Alcance Planificado:** Parametrización operativa de reservas de salón: switch maestro, buffer de limpieza, tolerancia no-show, bloqueo preventivo walk-in y simulador visual de rotación de mesa.

(CU-ADMIN-11: Registrar y Consultar Historial de Incidentes Internos):
- **Ruta Web:** http://localhost:5173/admin/incidentes
- **Estado:** Oculto del sidebar de Administrador de Local.
- **Alcance Planificado:** Registro, control operativo y resolución inmutable de anomalías de salón, cocina y caja alineado con la tabla `incidente_bitacora` y escalamiento hacia directivas de dueño.

(CU-ADMIN-13: Reportes de Venta & Productos Más Vendidos):
- **Ruta Web:** http://localhost:5173/admin/reportes/ventas
- **Estado:** Oculto del sidebar de Administrador de Local.
- **Alcance Planificado:** Análisis estadístico de ventas por rango de fechas, productos de mayor rotación y ticket promedio de sede.

(CU-SAAS-03: Catálogo de Planes SaaS):
- **Ruta Web:** http://localhost:5173/saas/planes
- **Estado:** Oculto del sidebar de Administrador SaaS Global.
- **Alcance Planificado:** Mantenimiento de planes comerciales (Starter, Pro, Enterprise), tarifas PEN/USD y límites de recursos de plataforma.

---

### Casos de Uso Complementarios en Roadmap

(CU-AUTH-02: Recuperar Contraseña con OTP):
- Flujo de recuperación de acceso mediante correo y validación de código OTP: http://localhost:5173/recuperar-password
