/** Tipos de imagen que acepta el backend (POST /admin/productos/{id}/foto). */
export const TIPOS_FOTO_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Peso máximo de la foto original antes de comprimirla. */
export const MAX_BYTES_FOTO_ORIGINAL = 10 * 1024 * 1024;

/** Lado mínimo exigido por el backend; una foto más chica se vería pixelada en la carta. */
export const MIN_LADO_FOTO = 300;

export class ErrorImagen extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorImagen';
  }
}

interface OpcionesCompresion {
  /** Lado mayor máximo en píxeles; nunca se amplía una imagen más pequeña */
  maxLado?: number;
  calidad?: number;
}

function canvasABlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, calidad));
}

function nombreConExtension(nombre: string, extension: string): string {
  const base = nombre.replace(/\.[^.]+$/, '') || 'plato';
  return `${base}.${extension}`;
}

/**
 * Valida y reduce una foto de plato antes de subirla: respeta la orientación EXIF, limita el lado
 * mayor y la exporta a WebP (o JPEG si el navegador no lo soporta). Una foto de celular de varios
 * MB queda en unos cientos de KB. Al redibujar en un canvas se descartan los metadatos EXIF (GPS).
 *
 * @throws ErrorImagen con un mensaje listo para mostrar al usuario.
 */
export async function comprimirImagen(
  archivo: File,
  { maxLado = 1200, calidad = 0.82 }: OpcionesCompresion = {}
): Promise<File> {
  if (!(TIPOS_FOTO_ACEPTADOS as readonly string[]).includes(archivo.type)) {
    throw new ErrorImagen('Usa una foto JPEG, PNG o WebP.');
  }
  if (archivo.size > MAX_BYTES_FOTO_ORIGINAL) {
    throw new ErrorImagen('La foto pesa más de 10 MB. Elige una más liviana.');
  }

  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    throw new ErrorImagen('No pudimos leer esa foto. Prueba con otra.');
  }

  try {
    if (Math.min(imagen.width, imagen.height) < MIN_LADO_FOTO) {
      throw new ErrorImagen(`La foto es muy pequeña: debe medir al menos ${MIN_LADO_FOTO} px por lado.`);
    }

    const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
    const ancho = Math.round(imagen.width * escala);
    const alto = Math.round(imagen.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const contexto = canvas.getContext('2d');
    if (!contexto) {
      throw new ErrorImagen('Tu navegador no pudo procesar la foto.');
    }
    contexto.drawImage(imagen, 0, 0, ancho, alto);

    // Si el navegador no soporta WebP, toBlob devuelve PNG (pesado): se reintenta con JPEG.
    let blob = await canvasABlob(canvas, 'image/webp', calidad);
    if (blob?.type !== 'image/webp') {
      blob = await canvasABlob(canvas, 'image/jpeg', calidad);
    }
    if (!blob) {
      throw new ErrorImagen('No pudimos preparar la foto. Prueba con otra.');
    }

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], nombreConExtension(archivo.name, extension), { type: blob.type });
  } finally {
    imagen.close();
  }
}
