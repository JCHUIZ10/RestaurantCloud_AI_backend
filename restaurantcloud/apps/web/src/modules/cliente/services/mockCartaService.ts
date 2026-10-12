import type { ApiResponse } from '@/types/api';
import type { CatalogoCartaPublicoDTO } from '@/types/carta';

// 1. Carta para ÁUREA - Sede Miraflores (Gourmet de Carta Variada)
const CARTA_AUREA: CatalogoCartaPublicoDTO = {
  sede: {
    id: '018f3a22-9b2a-7d43-8512-4c28e932b101',
    nombre: 'ÁUREA Restaurante',
    slug: 'aurea-miraflores',
    direccion: 'Av. Primavera 1024',
    distrito: 'Surco, Lima',
    telefono: '987654321',
    moneda: 'PEN',
    horario: '12:30 PM - 11:30 PM',
    abierto: true,
  },
  promociones: [
    {
      id: '018f3a22-9b2a-7d43-8512-4c28e932b102',
      nombre: '🔥 15% dscto en Almuerzos Ejecutivos',
      descripcion: 'Válido de Lunes a Viernes de 12:30 a 16:00 para platos de fondo seleccionados.',
      tipo_descuento: 'porcentaje',
      valor: 15.0,
    },
  ],
  categorias: [
    {
      id: 'cat-1',
      nombre: '✨ Entradas & Tapas',
      orden: 1,
      platos: [
        {
          id: 'p-1',
          nombre: 'Ceviche Clásico de Pesca del Día',
          descripcion: 'Pesca fresca en dados, leche de tigre aromática al ají limo, camote glaseado, choclo desgranado y canchita chulpi.',
          precio: 38.0,
          foto_url: 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'p-2',
          nombre: 'Carpaccio de Lomo con Alcaparras',
          descripcion: 'Finas láminas de lomo fino, emulsión de oliva virgen extra, láminas de parmesano madurado y tostadas finas.',
          precio: 36.0,
          foto_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'p-3',
          nombre: 'Pulpo a la Parrilla en Chimichurri',
          descripcion: 'Tentáculos de pulpo macerados en ají panca y hierbas andinas, dorados a la brasa con papas cóctel al romero.',
          precio: 46.0,
          foto_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
      ],
    },
    {
      id: 'cat-2',
      nombre: '🥩 Fondos de Autor',
      orden: 2,
      platos: [
        {
          id: 'p-4',
          nombre: 'Lomo Saltado Criollo al Wok',
          descripcion: 'Trozos selectos de lomo fino flambeados al pisco con cebolla morada crujiente, tomate en gajos, papas amarillas fritas y arroz con choclo.',
          precio: 58.0,
          foto_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'p-5',
          nombre: 'Bife Angosto a la Leña (350g)',
          descripcion: 'Corte premium madurado a punto deseado, acompañado de mantequilla de ajo asado y vegetales glaseados.',
          precio: 68.0,
          foto_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'agotado', // Simulación de plato agotado en cocina (CU-COCINA-04)
        },
        {
          id: 'p-6',
          nombre: 'Arroz con Pato Deshuesado al Cilantro',
          descripcion: 'Arroz meloso cocido en chicha de jora y cerveza negra con magret de pato tierno y salsa criolla de rabanito.',
          precio: 54.0,
          foto_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
      ],
    },
    {
      id: 'cat-3',
      nombre: '🍝 Pastas & Risottos',
      orden: 3,
      platos: [
        {
          id: 'p-7',
          nombre: 'Risotto de Hongos Silvestres & Trufa',
          descripcion: 'Arroz carnaroli al dente desglasado con vino blanco, setas porcini silvestres, mantequilla trufada y queso reggiano.',
          precio: 52.0,
          foto_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'p-8',
          nombre: 'Ravioles Artesanales de Asado de Tira',
          descripcion: 'Masa hecha a mano rellena de asado estofado durante 8 horas en reducción de vino tinto y pomodoro rústico.',
          precio: 49.0,
          foto_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
      ],
    },
    {
      id: 'cat-4',
      nombre: '🍸 Coctelería & Bebidas',
      orden: 4,
      platos: [
        {
          id: 'p-9',
          nombre: 'Cóctel Áurea Golden Sour',
          descripcion: 'Pisco quebranta macerado en hierbaluisa, cordial de maracuyá fresco, licor de saúco y polvo de oro comestible.',
          precio: 34.0,
          foto_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'p-10',
          nombre: 'Chicha Morada de Maíz Morado de Valle',
          descripcion: 'Hervida con manzana de agua, membrillo, piña dorada, canela de chanchamayo y gotas de limón sutil.',
          precio: 14.0,
          foto_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'p-11',
          nombre: 'Gin Tonic de Frutos Rojos Silvestres',
          descripcion: 'Gin botánico amazónico, tónica premium, bayas de enebro y zarzamoras frescas.',
          precio: 36.0,
          foto_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'agotado',
        },
      ],
    },
  ],
};

// 2. Carta para El Carbón & Leña - Sede Miraflores (Pollos & Brasas del Wireframe Oficial)
const CARTA_EL_CARBON: CatalogoCartaPublicoDTO = {
  sede: {
    id: '018f3a22-9b2a-7d43-8512-4c28e932b102',
    nombre: 'El Carbón & Leña',
    slug: 'el-carbon-surco',
    direccion: 'Av. Larco 450',
    distrito: 'Miraflores, Lima',
    telefono: '987654321',
    moneda: 'PEN',
    horario: '12:00 PM - 11:00 PM',
    abierto: true,
  },
  promociones: [
    {
      id: 'promo-carbon-1',
      nombre: '🔥 15% dscto en Almuerzos Ejecutivos',
      descripcion: 'Válido de Lunes a Viernes de 12:00 a 16:00',
      tipo_descuento: 'porcentaje',
      valor: 15.0,
    },
  ],
  categorias: [
    {
      id: 'cat-pollos',
      nombre: '🔥 Pollos & Brasas',
      orden: 1,
      platos: [
        {
          id: 'carb-1',
          nombre: '1/4 Pollo a la Brasa con Papas',
          descripcion: 'Pierna o pecho con papas fritas crocantes y ensalada clásica fresca con vinagreta de la casa.',
          precio: 24.5,
          foto_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'carb-2',
          nombre: '1/2 Pollo a la Brasa Familiar',
          descripcion: 'Medio pollo dorado al carbón de algarrobo con porción familiar de papas fritas y cremas artesanales.',
          precio: 46.0,
          foto_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
        {
          id: 'carb-3',
          nombre: 'Anticuchos de Corazón (2 porciones)',
          descripcion: 'Tiernos trozos de corazón de res macerados en ají panca tradicional, servidos con papa dorada y choclo.',
          precio: 28.0,
          foto_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'agotado', // Plato marcado como agotado en el wireframe oficial
        },
      ],
    },
    {
      id: 'cat-parrillas',
      nombre: '🥩 Parrillas & Carnes',
      orden: 2,
      platos: [
        {
          id: 'carb-4',
          nombre: 'Lomo Saltado Criollo',
          descripcion: 'Lomo fino al wok con cebolla, tomate en gajos y papas crocantes.',
          precio: 42.0,
          foto_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          disponibilidad: 'disponible',
        },
      ],
    },
  ],
};

/**
 * Servicio simulador de la API GET /api/v1/public/sedes/{slug}/carta
 * Respeta rigurosamente el envoltorio ApiResponse<CatalogoCartaPublicoDTO>
 */
export async function getCartaPublicaPorSlug(slug: string): Promise<ApiResponse<CatalogoCartaPublicoDTO>> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const cleanSlug = slug.toLowerCase().trim();

  if (cleanSlug === 'el-carbon-surco' || cleanSlug === 'miraflores' || cleanSlug === 'el-carbon') {
    return {
      exito: true,
      datos: CARTA_EL_CARBON,
      errores: undefined,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  if (cleanSlug === 'aurea-miraflores' || cleanSlug === 'aurea' || cleanSlug === 'default') {
    return {
      exito: true,
      datos: CARTA_AUREA,
      errores: undefined,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  return {
    exito: false,
    datos: null as unknown as CatalogoCartaPublicoDTO,
    errores: [
      {
        codigo: 'ERR_SEDE_NO_ENCONTRADA',
        mensaje: `La sede con identificador '${slug}' no existe o se encuentra temporalmente inactiva.`,
      },
    ],
    meta: { timestamp: new Date().toISOString() },
  };
}
