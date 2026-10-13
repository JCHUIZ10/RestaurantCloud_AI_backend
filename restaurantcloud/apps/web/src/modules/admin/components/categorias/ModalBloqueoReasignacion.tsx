import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  ArrowRight,
  Loader2,
  UtensilsCrossed,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { ConflictoCategoriaConProductosDTO, CategoriaAdminDTO } from '@/types/admin';

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

  if (!abierto || !conflicto) return null;

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
          `✓ Se transfirieron ${arrayIds.length} plato(s) a "${categoriaDestinoSeleccionada?.nombre}". Quedan ${resultado.platos_restantes} plato(s) en esta sección.`
        );
      }
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al reasignar platos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-amber-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera de Alerta */}
        <div className="px-6 py-5 border-b border-amber-200 bg-amber-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Bloqueo de Integridad Relacional (409)
              </span>
              <h2 className="text-lg font-serif font-bold text-aurea-navy">
                Reasignar Platos de "{conflicto.categoria_nombre}"
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="p-2 rounded-xl text-aurea-navy/60 hover:text-aurea-navy hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Detalle del Conflicto */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorLocal && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorLocal}
            </div>
          )}

          {mensajeParcial && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeParcial}</span>
            </div>
          )}

          {/* Explicación técnica y comercial */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-aurea-navy leading-relaxed">
              La categoría <strong className="font-bold text-aurea-navy">"{conflicto.categoria_nombre}"</strong>{' '}
              tiene <strong className="text-amber-800 font-bold">{productosPendientes.length} plato(s)</strong>{' '}
              asociado(s). Selecciona cuáles deseas mover y a qué sección enviarlos:
            </p>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Puedes mover platos a distintas categorías según corresponda. La categoría de origen se eliminará automáticamente una vez reasignado el último plato.
              </span>
            </div>
          </div>

          {/* Listado de Platos con Checkboxes */}
          <div className="space-y-2">
            {/* Control Maestro: Seleccionar Todos */}
            <div className="flex items-center justify-between pb-1.5 border-b border-aurea-champagne/30">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  ref={(el) => {
                    if (el) el.indeterminate = algunoSeleccionado;
                  }}
                  onChange={handleToggleTodos}
                  disabled={cargando}
                  className="w-4 h-4 rounded border-aurea-copper/60 text-aurea-navy focus:ring-aurea-copper/40 cursor-pointer"
                />
                <span className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
                  Seleccionar todos
                </span>
              </label>
              <span className="text-[11px] font-mono font-semibold text-aurea-navy/80 bg-aurea-champagne/30 px-2 py-0.5 rounded-md">
                {seleccionados.size} de {productosPendientes.length} seleccionados
              </span>
            </div>

            {/* Lista de Filas de Productos Pendientes */}
            <div className="max-h-44 overflow-y-auto rounded-xl border border-aurea-champagne/40 bg-aurea-ivory/20 p-1.5 space-y-1.5">
              {productosPendientes.map((prod) => {
                const isSelected = seleccionados.has(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => !cargando && handleToggleProducto(prod.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-aurea-champagne/25 border-aurea-copper/50 shadow-2xs'
                        : 'bg-white border-gray-100 hover:border-aurea-copper/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleProducto(prod.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={cargando}
                        className="w-4 h-4 rounded border-aurea-copper/60 text-aurea-navy focus:ring-aurea-copper/40 cursor-pointer shrink-0"
                      />
                      <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                      <span
                        className={`text-xs truncate ${
                          isSelected ? 'font-bold text-aurea-navy' : 'font-medium text-aurea-navy/80'
                        }`}
                      >
                        {prod.nombre}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-aurea-navy/90 shrink-0 ml-2">
                      S/ {prod.precio.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selector de Categoría Destino */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="categoria-destino"
              className="text-xs font-bold text-aurea-navy uppercase tracking-wider block"
            >
              Transferir seleccionados ({seleccionados.size}) a: *
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
                className="w-full px-3.5 py-2.5 bg-white border border-aurea-champagne/60 rounded-xl text-sm font-medium text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 focus:border-aurea-copper transition-all"
              >
                <option value="">-- Selecciona la categoría destino --</option>
                {otrasCategoriasDisponibles.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre} ({cat.total_productos} platos actuales)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                No existen otras categorías disponibles en esta sede. Crea una nueva categoría antes de eliminar esta.
              </div>
            )}
            <p className="text-[11px] text-aurea-navy/60">
              {seleccionados.size === productosPendientes.length
                ? 'Todos los platos restantes se moverán a esta sección y la categoría de origen será eliminada.'
                : 'Solo los platos seleccionados se transferirán a esta categoría.'}
            </p>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 border-t border-amber-200 bg-amber-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="px-4 py-2.5 rounded-xl border border-aurea-copper/40 bg-white hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-semibold transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={
              cargando ||
              seleccionados.size === 0 ||
              !categoriaDestinoId ||
              otrasCategoriasDisponibles.length === 0
            }
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md min-h-[44px] disabled:opacity-50 ${
              todosSeleccionados
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-aurea-navy hover:bg-aurea-navy/90'
            }`}
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>
                  {todosSeleccionados ? 'Eliminando...' : 'Transfiriendo platos...'}
                </span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 text-white" />
                <span>
                  {todosSeleccionados
                    ? `Reasignar todos (${seleccionados.size}) y Eliminar`
                    : `Transferir ${seleccionados.size} plato(s) a ${
                        categoriaDestinoSeleccionada?.nombre || 'Destino'
                      }`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
