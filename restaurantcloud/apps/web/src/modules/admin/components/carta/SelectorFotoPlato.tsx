import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import { Button, ImagenPlato } from '@/components/ui';
import { comprimirImagen, ErrorImagen, TIPOS_FOTO_ACEPTADOS, cn } from '@/shared/utils';
import { FOTO_SIN_CAMBIOS, type SeleccionFotoPlato } from './seleccionFotoPlato';

interface SelectorFotoPlatoProps {
  nombrePlato: string;
  /** Foto que el plato tiene guardada hoy (edición) */
  fotoActualUrl?: string | null;
  valor: SeleccionFotoPlato;
  onChange: (valor: SeleccionFotoPlato) => void;
  disabled?: boolean;
}

/** Foto opcional del plato: elegir, arrastrar, cambiar o quitar. Comprime antes de subir. */
export const SelectorFotoPlato: React.FC<SelectorFotoPlatoProps> = ({
  nombrePlato,
  fotoActualUrl,
  valor,
  onChange,
  disabled = false,
}) => {
  const idControl = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(() => {
    if (!valor.nueva) {
      setVistaPrevia(null);
      return;
    }
    const url = URL.createObjectURL(valor.nueva);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [valor.nueva]);

  const fotoGuardada = valor.quitar ? null : fotoActualUrl;
  const imagenMostrada = vistaPrevia ?? fotoGuardada;
  const hayFoto = Boolean(imagenMostrada);
  const ocupado = disabled || procesando;

  const procesarArchivo = async (archivo: File | undefined) => {
    if (!archivo) {
      return;
    }
    setError(null);
    setProcesando(true);
    try {
      onChange({ nueva: await comprimirImagen(archivo), quitar: false });
    } catch (e) {
      setError(e instanceof ErrorImagen ? e.message : 'No pudimos preparar la foto. Prueba con otra.');
    } finally {
      setProcesando(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const manejarSoltar = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    if (!ocupado) {
      void procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <span id={`${idControl}-rotulo`} className="block text-sm font-semibold text-aurea-navy mb-1.5">
        Foto <span className="font-normal text-aurea-navy/50">(opcional)</span>
      </span>

      <div
        role="group"
        aria-labelledby={`${idControl}-rotulo`}
        aria-describedby={`${idControl}-ayuda`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!ocupado) {
            setArrastrando(true);
          }
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={manejarSoltar}
        className={cn(
          'flex items-center gap-4 p-3 rounded-xl border border-dashed bg-white transition-colors',
          arrastrando ? 'border-aurea-copper bg-aurea-champagne/30' : 'border-aurea-champagne'
        )}
      >
        <div className="relative shrink-0">
          <ImagenPlato src={imagenMostrada} nombre={nombrePlato || 'Plato'} className="w-24 h-24 rounded-xl border border-aurea-champagne/70" />
          {procesando && (
            <span className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-aurea-copper animate-spin" aria-hidden="true" />
              <span className="sr-only">Preparando foto…</span>
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => inputRef.current?.click()}
              leftIcon={<Camera className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
            >
              {hayFoto ? 'Cambiar foto' : 'Elegir foto'}
            </Button>

            {valor.nueva && (
              <Button
                size="sm"
                variant="ghost"
                disabled={ocupado}
                onClick={() => onChange({ ...valor, nueva: null })}
                leftIcon={<X className="w-4 h-4" aria-hidden="true" />}
              >
                Descartar
              </Button>
            )}
            {!valor.nueva && fotoActualUrl && !valor.quitar && (
              <Button
                size="sm"
                variant="ghost"
                disabled={ocupado}
                onClick={() => onChange({ nueva: null, quitar: true })}
                leftIcon={<Trash2 className="w-4 h-4" aria-hidden="true" />}
              >
                Quitar foto
              </Button>
            )}
            {!valor.nueva && fotoActualUrl && valor.quitar && (
              <Button
                size="sm"
                variant="ghost"
                disabled={ocupado}
                onClick={() => onChange(FOTO_SIN_CAMBIOS)}
                leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
              >
                Deshacer
              </Button>
            )}
          </div>

          <p id={`${idControl}-ayuda`} className="text-xs text-aurea-navy/60">
            {valor.quitar
              ? 'La foto se quitará al guardar; la carta mostrará una imagen de reemplazo.'
              : 'JPG, PNG o WebP. Se ajusta sola; los platos con foto se piden más.'}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={TIPOS_FOTO_ACEPTADOS.join(',')}
          onChange={(e) => void procesarArchivo(e.target.files?.[0])}
          disabled={ocupado}
          className="sr-only"
          tabIndex={-1}
          aria-label="Seleccionar foto del plato"
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-estado-error-800">
          {error}
        </p>
      )}
    </div>
  );
};
