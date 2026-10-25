import React, { useState, useEffect, useId } from 'react';
import { Check, FolderTree, Smartphone } from 'lucide-react';
import { CategoriaAdminDTO, CrearCategoriaRequest, ActualizarCategoriaRequest } from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalCrearEditarCategoriaProps {
  abierto: boolean;
  modo: 'crear' | 'editar';
  categoriaEditar?: CategoriaAdminDTO | null;
  onCerrar: () => void;
  onGuardar: (
    payload: CrearCategoriaRequest | ActualizarCategoriaRequest,
    id?: string
  ) => Promise<boolean>;
}

export const ModalCrearEditarCategoria: React.FC<ModalCrearEditarCategoriaProps> = ({
  abierto,
  modo,
  categoriaEditar,
  onCerrar,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState('');
  const [activa, setActiva] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const idForm = useId();
  const idAyuda = useId();

  useEffect(() => {
    if (abierto) {
      if (modo === 'editar' && categoriaEditar) {
        setNombre(categoriaEditar.nombre);
        setActiva(categoriaEditar.activa);
      } else {
        setNombre('');
        setActiva(true);
      }
      setErrorLocal(null);
    }
  }, [abierto, modo, categoriaEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      setErrorLocal('El nombre de la categoría es obligatorio.');
      return;
    }
    if (nombreLimpio.length < 2) {
      setErrorLocal('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (nombreLimpio.length > 60) {
      setErrorLocal('El nombre no puede superar los 60 caracteres.');
      return;
    }

    setCargando(true);
    setErrorLocal(null);

    try {
      const exitoso = await onGuardar(
        { nombre: nombreLimpio, activa },
        modo === 'editar' && categoriaEditar ? categoriaEditar.id : undefined
      );

      if (exitoso) {
        onCerrar();
      }
    } catch (err: any) {
      setErrorLocal(err?.message || 'Ocurrió un error al procesar la categoría.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!cargando}
      icono={FolderTree}
      titulo={modo === 'crear' ? 'Nueva categoría' : `Editar «${categoriaEditar?.nombre ?? ''}»`}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            loading={cargando}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            {modo === 'crear' ? 'Crear categoría' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-5">
        {errorLocal && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm">
            {errorLocal}
          </p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={`${idForm}-nombre`} className="text-sm font-semibold text-aurea-navy">
              Nombre
            </label>
            <span className={cn('text-xs tabular-nums', nombre.length > 50 ? 'text-estado-alerta-700 font-semibold' : 'text-aurea-navy/40')}>
              {nombre.length}/60
            </span>
          </div>
          <input
            id={`${idForm}-nombre`}
            type="text"
            maxLength={60}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errorLocal) setErrorLocal(null);
            }}
            placeholder="Ej. Entradas frías, Parrillas, Bebidas"
            autoFocus
            aria-describedby={idAyuda}
            aria-invalid={!!errorLocal || undefined}
            className="w-full min-h-tactil px-4 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper"
          />
          <p id={idAyuda} className="text-xs text-aurea-navy/60">
            Debe ser único en la sede. Aparece en la carta digital y en la comanda.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-aurea-champagne/70 bg-aurea-ivory flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-aurea-navy">Visible en carta y comanda</p>
            <p className="text-sm text-aurea-navy/70 mt-0.5">
              Los comensales la ven en la carta QR y los mozos pueden pedir sus platos.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activa}
            aria-label="Visible en carta y comanda"
            onClick={() => setActiva(!activa)}
            className="min-h-tactil min-w-tactil flex items-center justify-center shrink-0"
          >
            <span
              className={cn(
                'relative inline-flex h-6 w-11 rounded-full transition-colors',
                activa ? 'bg-estado-ok-600' : 'bg-aurea-navy/20'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  activa && 'translate-x-5'
                )}
              />
            </span>
          </button>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
            <Smartphone className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            Así se verá en la comanda del mozo
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/50 overflow-x-auto" aria-hidden="true">
            <span
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap',
                activa ? 'bg-aurea-navy text-white' : 'bg-aurea-champagne/40 text-aurea-navy/60 line-through'
              )}
            >
              {nombre.trim() || 'Nombre de la categoría'}
            </span>
            <span className="px-3 py-1.5 rounded-lg text-sm bg-white text-aurea-navy/60 border border-aurea-champagne/50">Fondos</span>
            <span className="px-3 py-1.5 rounded-lg text-sm bg-white text-aurea-navy/60 border border-aurea-champagne/50">Bebidas</span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
