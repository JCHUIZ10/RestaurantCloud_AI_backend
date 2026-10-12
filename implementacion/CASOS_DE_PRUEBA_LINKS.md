# GUÍA RÁPIDA DE ENLACES DE PRUEBA Y DEMOSTRACIÓN
## RestaurantCloud AI — Verificación en Vivo de Pantallas

> **Propósito:**  
> Este documento permite comprobar de forma rápida y directa cada pantalla desarrollada en el frontend (`http://localhost:5173`), explicando en una sola línea qué representa cada escenario de prueba.

---

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

---

### Próximos Casos de Uso (En Desarrollo / Roadmap)

(CU-MOZO-01: Ver Estado de Mesas y Centro de Comandas en Vivo):
- Plano interactivo del salón con estados de mesa, barra de pedidos directos y drawer de atención: http://localhost:5173/mozo/mesas

(CU-COCINA-01: Ver Cola de Pedidos Entrantes KDS):
- Monitor industrial de cocina con 4 columnas FIFO, semáforo de tiempos y avance táctil de preparación: http://localhost:5173/cocina/kds

(CU-MOZO-02: Tomar Pedido y Comanda Móvil en Salón):
- Terminal táctil móvil para tomar pedidos por mesa con control de disponibilidad y notas: http://localhost:5173/mozo/mesas/mesa-101/comanda

(CU-CAJA-01: Apertura de Turno y Control de Efectivo):
- Pantalla de apertura de turno de caja y arqueo de efectivo con bloqueo operativo inicial: http://localhost:5173/caja/apertura

(CU-AUTH-02: Recuperar Contraseña con OTP):
- Flujo de recuperación de acceso mediante correo y validación de código OTP: http://localhost:5173/recuperar-password
