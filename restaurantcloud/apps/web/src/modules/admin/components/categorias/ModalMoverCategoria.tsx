import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Check, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { CategoriaAdminDTO } from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalMoverCategoriaProps {
  abierto: boolean;
  categoria: CategoriaAdminDTO | null;
  totalCategorias: number;
  onCerrar: () => void;
  onMover: (categoriaId: string, nuevaPosicion: number) => Promise<void>;
}

export const ModalMoverCategoria: React.FC<ModalMoverCategoriaProps> = ({
  abierto,
  categoria,
  totalCategorias,
  onCerrar,
  onMover,
}) => {
  const [posicionDeseada, setPosicionDeseada] = useState<number>(1);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (abierto && categoria) {
      setPosicionDeseada(categoria.orden);
      setErrorLocal(null);
    }
  }, [abierto, categoria]);

  if (!categoria) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posicionDeseada === categoria.orden) {
      onCerrar();
      return;
    }

    if (posicionDeseada < 1 || posicionDeseada > totalCategorias) {
      setErrorLocal(`La posición debe estar entre 1 y ${totalCategorias}.`);
      return;
    }

    setCargando(true);
    setErrorLocal(null);

    try {
      await onMover(categoria.id, posicionDeseada);
      onCerrar();
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al reubicar la categoría.');
    } finally {
      setCargando(false);
    }
  };

  const handleMoverDirecto = (pos: number) => {
    const clamped = Math.max(1, Math.min(totalCategorias, pos));
    setPosicionDeseada(clamped);
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!cargando}
      icono={ArrowUpDown}
      titulo="Reubicar categoría"
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-mover-categoria"
            loading={cargando}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            Aplicar cambio
          </Button>
        </>
      }
    >
      <form id="form-mover-categoria" onSubmit={handleSubmit} className="space-y-5">
        {errorLocal && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm">
            {errorLocal}
          </p>
        )}

        <div className="p-4 rounded-xl border border-aurea-champagne/70 bg-aurea-ivory/60 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">Categoría seleccionada</p>
          <p className="text-base font-bold text-aurea-navy">{categoria.nombre}</p>
          <p className="text-sm text-aurea-navy/70">
            Posición actual: <span className="font-semibold text-aurea-navy">#{categoria.orden}</span> de {totalCategorias}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-aurea-navy">
            Atajos rápidos
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleMoverDirecto(1)}
              className={cn(
                'p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2',
                posicionDeseada === 1
                  ? 'border-aurea-copper bg-aurea-champagne/30 text-aurea-navy ring-1 ring-aurea-copper'
                  : 'border-aurea-champagne/70 bg-white text-aurea-navy/80 hover:bg-aurea-ivory/40'
              )}
            >
              <ArrowUpToLine className="w-4 h-4 text-aurea-copper shrink-0" aria-hidden="true" />
              <div>
                <span className="font-semibold block">Al inicio</span>
                <span className="text-aurea-navy/60">Puesto #1</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMoverDirecto(totalCategorias)}
              className={cn(
                'p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2',
                posicionDeseada === totalCategorias
                  ? 'border-aurea-copper bg-aurea-champagne/30 text-aurea-navy ring-1 ring-aurea-copper'
                  : 'border-aurea-champagne/70 bg-white text-aurea-navy/80 hover:bg-aurea-ivory/40'
              )}
            >
              <ArrowDownToLine className="w-4 h-4 text-aurea-copper shrink-0" aria-hidden="true" />
              <div>
                <span className="font-semibold block">Al final</span>
                <span className="text-aurea-navy/60">Puesto #{totalCategorias}</span>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label htmlFor="input-posicion-deseada" className="text-sm font-semibold text-aurea-navy">
            Elegir posición numérica específica
          </label>
          <div className="flex items-center gap-3">
            <input
              id="input-posicion-deseada"
              type="number"
              min={1}
              max={totalCategorias}
              value={posicionDeseada}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setPosicionDeseada(Math.max(1, Math.min(totalCategorias, val)));
                }
              }}
              className="w-24 px-3 py-2 bg-white border border-aurea-champagne/70 rounded-xl text-center text-lg font-bold text-aurea-navy focus:outline-none focus:border-aurea-copper tabular-nums"
            />
            <span className="text-sm text-aurea-navy/70">
              de {totalCategorias} categorías en total
            </span>
          </div>
          <p className="text-xs text-aurea-navy/60">
            {posicionDeseada === categoria.orden ? (
              'La categoría se mantiene en su posición actual.'
            ) : posicionDeseada < categoria.orden ? (
              `Subirá del puesto #${categoria.orden} al #${posicionDeseada}. Las categorías intermedias descenderán 1 puesto.`
            ) : (
              `Bajará del puesto #${categoria.orden} al #${posicionDeseada}. Las categorías intermedias ascenderán 1 puesto.`
            )}
          </p>
        </div>
      </form>
    </Modal>
  );
};
