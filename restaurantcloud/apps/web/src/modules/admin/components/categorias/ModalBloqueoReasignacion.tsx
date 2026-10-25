import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { ConflictoCategoriaConProductosDTO, CategoriaAdminDTO } from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn, formatPEN } from '@/shared/utils';

interface ModalBloqueoReasignacionProps {
  abierto: boolean;
  conflicto: ConflictoCategoriaConProductosDTO | null;
  otrasCategoriasDisponibles: CategoriaAdminDTO[];
  onCerrar: () => void;
  onReasignarYEliminar: (
    categoriaOrigenId: string,
    nuevaCategoriaId: string,
    productoIds?: string[]
  ) => Promise<{ categoria_eliminada: boolean; platos_restantes: number }>;
}

export const ModalBloqueoReasignacion: React.FC<ModalBloqueoReasignacionProps> = ({
  abierto,
  conflicto,
  otrasCategoriasDisponibles,
  onCerrar,
  onReasignarYEliminar,
}) => {
  const [categoriaDestinoId, setCategoriaDestinoId] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeParcial, setMensajeParcial] = useState<string | null>(null);

  // Lista local de productos que aún están asociados a la categoría de origen
  const [productosPendientes, setProductosPendientes] = useState<
    Array<{
      id: string;
      nombre: string;
      precio: number;
      disponibilidad: string;
    }>
  >([]);

  // IDs de productos seleccionados con checkbox
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // Inicializar estado cuando se abre el modal o cambia el conflicto
  useEffect(() => {
    if (abierto && conflicto) {
      setProductosPendientes(conflicto.productos_muestras);
      // Por defecto, seleccionar todos para facilitar la reasignación en 1 clic
      setSeleccionados(new Set(conflicto.productos_muestras.map((p) => p.id)));
      setCategoriaDestinoId('');
      setErrorLocal(null);
      setMensajeParcial(null);
    }
  }, [abierto, conflicto]);

  if (!conflicto) return null;

  const todosSeleccionados =
    productosPendientes.length > 0 && seleccionados.size === productosPendientes.length;
  const algunoSeleccionado =
    seleccionados.size > 0 && seleccionados.size < productosPendientes.length;

  const categoriaDestinoSeleccionada = otrasCategoriasDisponibles.find(
    (c) => c.id === categoriaDestinoId
  );

  // Alternar "Seleccionar todos"
  const handleToggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosPendientes.map((p) => p.id)));
    }
    if (errorLocal) setErrorLocal(null);
  };

  // Alternar selección de un producto individual
  const handleToggleProducto = (prodId: string) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(prodId)) {
        nuevo.delete(prodId);
      } else {
        nuevo.add(prodId);
      }
      return nuevo;
    });
    if (errorLocal) setErrorLocal(null);
  };

  // Ejecutar transferencia
  const handleConfirmar = async () => {
    if (seleccionados.size === 0) {
      setErrorLocal('Debes marcar al menos un plato con el checkbox para transferirlo.');
      return;
    }

    if (!categoriaDestinoId) {
      setErrorLocal('Debes seleccionar una categoría de destino para transferir los platos marcados.');
      return;
    }

    setCargando(true);
    setErrorLocal(null);

    try {
      const arrayIds = Array.from(seleccionados);
      const resultado = await onReasignarYEliminar(
        conflicto.categoria_id,
        categoriaDestinoId,
        arrayIds
      );

      if (resultado.categoria_eliminada) {
        // Se transfirieron todos los platos y la categoría fue eliminada
        onCerrar();
      } else {
        // Reasignación parcial: solo quedan los que aún están asociados a la categoría
        const restantes = productosPendientes.filter((p) => !seleccionados.has(p.id));
        setProductosPendientes(restantes);
        // Seleccionar los platos restantes por defecto
        setSeleccionados(new Set(restantes.map((p) => p.id)));
        setCategoriaDestinoId('');
        setMensajeParcial(
          `Se transfirieron ${arrayIds.length} plato(s) a "${categoriaDestinoSeleccionada?.nombre}". Quedan ${resultado.platos_restantes} plato(s) en esta sección.`
        );
      }
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al reasignar platos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!cargando}
      icono={AlertTriangle}
      tono="alerta"
      etiqueta="La categoría tiene platos"
      titulo={`Reasignar platos de «${conflicto.categoria_nombre}»`}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            variant={todosSeleccionados ? 'danger' : 'primary'}
            onClick={handleConfirmar}
            loading={cargando}
            disabled={seleccionados.size === 0 || !categoriaDestinoId || otrasCategoriasDisponibles.length === 0}
            leftIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
          >
            {todosSeleccionados
              ? `Mover ${seleccionados.size} y eliminar categoría`
              : `Mover ${seleccionados.size} plato(s)`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {errorLocal && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm">
            {errorLocal}
          </p>
        )}

        {mensajeParcial && (
          <p role="status" className="p-3 rounded-xl bg-estado-ok-50 border border-estado-ok-200 text-estado-ok-800 text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{mensajeParcial}</span>
          </p>
        )}

        <div className="space-y-2 text-sm text-aurea-navy/80">
          <p>
            «{conflicto.categoria_nombre}» tiene{' '}
            <strong className="font-semibold text-aurea-navy">{productosPendientes.length} plato(s)</strong>. Elige
            cuáles mover y a qué categoría.
          </p>
          <p className="flex items-start gap-2 text-aurea-navy/70">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-aurea-copper" aria-hidden="true" />
            <span>Puedes repartirlos entre varias categorías. Al mover el último plato, esta categoría se elimina.</span>
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="sr-only">Platos a mover</legend>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 min-h-tactil cursor-pointer select-none">
              <input
                type="checkbox"
                checked={todosSeleccionados}
                ref={(el) => {
                  if (el) el.indeterminate = algunoSeleccionado;
                }}
                onChange={handleToggleTodos}
                disabled={cargando}
                className="w-5 h-5 rounded border-aurea-copper/50 accent-aurea-navy"
              />
              <span className="text-sm font-semibold text-aurea-navy">Seleccionar todos</span>
            </label>
            <span className="text-xs text-aurea-navy/60 tabular-nums">
              {seleccionados.size} de {productosPendientes.length}
            </span>
          </div>

          <ul className="max-h-56 overflow-y-auto rounded-xl border border-aurea-champagne/70 divide-y divide-aurea-champagne/40">
            {productosPendientes.map((prod) => {
              const isSelected = seleccionados.has(prod.id);
              return (
                <li key={prod.id}>
                  <label
                    className={cn(
                      'flex items-center gap-3 min-h-tactil px-3 py-2 cursor-pointer transition-colors',
                      isSelected ? 'bg-aurea-champagne/25' : 'hover:bg-aurea-ivory'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProducto(prod.id)}
                      disabled={cargando}
                      className="w-5 h-5 rounded border-aurea-copper/50 accent-aurea-navy shrink-0"
                    />
                    <span className={cn('flex-1 min-w-0 text-sm truncate', isSelected ? 'font-semibold text-aurea-navy' : 'text-aurea-navy/80')}>
                      {prod.nombre}
                    </span>
                    <span className="text-sm tabular-nums text-aurea-navy/70 shrink-0">{formatPEN(prod.precio)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="categoria-destino" className="text-sm font-semibold text-aurea-navy block">
            Mover a
          </label>
          {otrasCategoriasDisponibles.length > 0 ? (
            <select
              id="categoria-destino"
              value={categoriaDestinoId}
              onChange={(e) => {
                setCategoriaDestinoId(e.target.value);
                if (errorLocal) setErrorLocal(null);
              }}
              disabled={cargando}
              className="w-full min-h-tactil px-3 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy focus:outline-none focus:border-aurea-copper"
            >
              <option value="">Selecciona la categoría de destino</option>
              {otrasCategoriasDisponibles.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} ({cat.total_productos} platos)
                </option>
              ))}
            </select>
          ) : (
            <p className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm">
              No hay otras categorías en esta sede. Crea una antes de eliminar esta.
            </p>
          )}
          <p className="text-xs text-aurea-navy/60">
            {seleccionados.size === productosPendientes.length
              ? 'Se moverán todos los platos y la categoría de origen se eliminará.'
              : 'Solo se moverán los platos seleccionados.'}
          </p>
        </div>
      </div>
    </Modal>
  );
};
