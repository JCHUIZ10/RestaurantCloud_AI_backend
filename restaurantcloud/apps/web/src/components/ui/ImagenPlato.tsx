import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ImagenPlatoProps {
  /** URL de la foto; si falta o no carga se dibuja la imagen de reemplazo */
  src?: string | null;
  nombre: string;
  /** El contenedor define el tamaño (ej. `w-10 h-10`); la imagen lo rellena */
  className?: string;
  /** Clases de la foto misma (zoom, escala de grises…); no afectan a la imagen de reemplazo */
  imgClassName?: string;
  /** Tamaño del ícono de reemplazo */
  iconoClassName?: string;
  /** Carga la foto de inmediato en lugar de diferirla (imagen principal visible al abrir) */
  eager?: boolean;
  /** Capas encima de la imagen (insignias, degradados); deben posicionarse solas */
  children?: React.ReactNode;
}

/**
 * Foto de un plato con imagen de reemplazo. La foto es opcional: sin ella (o si la URL falla)
 * se muestra un fondo de marca con un ícono, de modo que las tarjetas siempre queden alineadas.
 */
export const ImagenPlato: React.FC<ImagenPlatoProps> = ({
  src,
  nombre,
  className,
  imgClassName,
  iconoClassName,
  eager = false,
  children,
}) => {
  // Se recuerda la URL que falló (no un booleano): al cambiar de foto vuelve a intentarse sin efectos.
  const [srcFallida, setSrcFallida] = useState<string | null>(null);

  const mostrarFoto = Boolean(src) && src !== srcFallida;

  return (
    <div className={cn('relative overflow-hidden bg-aurea-ivory flex items-center justify-center shrink-0', className)}>
      {mostrarFoto ? (
        <img
          src={src as string}
          alt={nombre}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setSrcFallida(src ?? null)}
          className={cn('absolute inset-0 w-full h-full object-cover', imgClassName)}
        />
      ) : (
        <UtensilsCrossed
          className={cn('w-1/2 h-1/2 max-w-10 max-h-10 text-aurea-copper/60', iconoClassName)}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
};
