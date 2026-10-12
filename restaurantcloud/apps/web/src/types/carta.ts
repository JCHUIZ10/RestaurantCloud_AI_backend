export interface SedePublicaInfoDTO {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  distrito: string;
  telefono: string; // Utilizado para WhatsApp (wa.me/51...) y llamadas telefónicas
  moneda: string;   // 'PEN'
  horario: string;  // Ej. '12:00 PM - 11:00 PM'
  abierto: boolean;
}

export interface PromocionPublicaDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor: number;
}

export interface ProductoPublicoDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  foto_url?: string | null;
  disponibilidad: 'disponible' | 'agotado';
}

export interface CategoriaPublicaDTO {
  id: string;
  nombre: string;
  orden: number;
  platos: ProductoPublicoDTO[];
}

export interface CatalogoCartaPublicoDTO {
  sede: SedePublicaInfoDTO;
  promociones: PromocionPublicaDTO[];
  categorias: CategoriaPublicaDTO[];
}
