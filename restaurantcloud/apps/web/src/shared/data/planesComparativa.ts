export interface CaracteristicaRow {
  nombre: string;
  subtexto?: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

export interface CategoriaPlanes {
  titulo: string;
  filas: CaracteristicaRow[];
}

export const TABLA_COMPARATIVA: CategoriaPlanes[] = [
  {
    titulo: 'Capacidad Operativa del Local',
    filas: [
      {
        nombre: 'Locales y Sedes',
        subtexto: 'Locales gastronómicos administrados bajo una misma cuenta',
        starter: '1 Sede',
        pro: 'Hasta 3 Sedes',
        enterprise: 'Hasta 10 Sedes',
      },
      {
        nombre: 'Ambientes y Pisos',
        subtexto: 'Distribución por terraza, salón principal, barra o segundo piso',
        starter: '1 Piso',
        pro: 'Hasta 2 Pisos',
        enterprise: 'Hasta 5 Pisos',
      },
      {
        nombre: 'Capacidad de Mesas',
        subtexto: 'Mesas activas simultáneas con código QR asignado',
        starter: 'Hasta 25 mesas',
        pro: 'Hasta 30 mesas',
        enterprise: 'Hasta 60 mesas',
      },
      {
        nombre: 'Personal y Mozos concurrentes',
        subtexto: 'Cuentas con rol de mozo, cocina, cajero o administrador',
        starter: 'Hasta 5 usuarios',
        pro: 'Hasta 15 usuarios',
        enterprise: 'Hasta 40 usuarios',
      },
    ],
  },
  {
    titulo: 'Operación de Salón y Cocina',
    filas: [
      {
        nombre: 'Mozo POS en smartphones y tablets',
        subtexto: 'Toma de comandas móvil sin necesidad de hardware propietario',
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        nombre: 'Sistema KDS de Cocina en vivo',
        subtexto: 'Pantalla de preparación en tiempo real con tiempos por plato',
        starter: '1 Pantalla',
        pro: 'Pantallas ilimitadas',
        enterprise: 'Pantallas ilimitadas por estación',
      },
      {
        nombre: 'Carta Digital Interactiva QR',
        subtexto: 'Menú digital para comensales con fotos, precios y alérgenos',
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        nombre: 'Mapa Interactivo de Salón',
        subtexto: 'Vista gráfica de ocupación, comensales sentados y precuentas',
        starter: true,
        pro: true,
        enterprise: true,
      },
      {
        nombre: 'Gestión de Reservas de Salón',
        subtexto: 'Planificación de reservas con asignación de mesa previa',
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        nombre: 'División de Cuentas y Cobros',
        subtexto: 'Cobro dividido entre comensales, propinas y medios de pago',
        starter: true,
        pro: true,
        enterprise: true,
      },
    ],
  },
  {
    titulo: 'Inteligencia Artificial y Analítica',
    filas: [
      {
        nombre: 'Forecasting Predictivo de Demanda',
        subtexto: 'Proyección de afluencia según histórico de ventas, día y clima',
        starter: false,
        pro: 'Almuerzo y cena',
        enterprise: 'Multi-sede en tiempo real',
      },
      {
        nombre: 'Sugerencias Inteligentes de Insumos',
        subtexto: 'Cálculo de compras exactas vinculando recetas y ocupación',
        starter: false,
        pro: true,
        enterprise: 'Automatizado con alertas',
      },
      {
        nombre: 'Control y Desglose de Mermas',
        subtexto: 'Auditoría entre insumos consumidos y platos despachados',
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        nombre: 'Reportes de Ventas y Arqueos Z',
        subtexto: 'Métricas de turnos, ticket promedio y rotación de platos',
        starter: 'Básicos por turno',
        pro: 'Avanzados con exportación',
        enterprise: 'Dashboard ejecutivo central',
      },
    ],
  },
  {
    titulo: 'Facturación, SUNAT y Soporte',
    filas: [
      {
        nombre: 'Facturación Electrónica SUNAT',
        subtexto: 'Emisión directa de Boletas, Facturas y Notas de Crédito',
        starter: true,
        pro: 'Ilimitada',
        enterprise: 'Multi-RUC Ilimitada',
      },
      {
        nombre: 'Carga Asistida de tu Carta Inicial',
        subtexto: 'Digitalización y parametrización de tus platos y precios',
        starter: 'Guía paso a paso',
        pro: 'Asistida en < 24h',
        enterprise: 'Llave en mano personalizada',
      },
      {
        nombre: 'Canal de Soporte y Acompañamiento',
        subtexto: 'Atención técnica para resolver incidencias durante el turno',
        starter: 'Correo (24-48h)',
        pro: 'WhatsApp prioritario',
        enterprise: 'SLA 99.9% + Ejecutivo dedicado',
      },
    ],
  },
];
