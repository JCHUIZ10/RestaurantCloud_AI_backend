import React, { useState, useEffect } from 'react';
import { X, Smartphone, Check, Loader2, Sparkles } from 'lucide-react';
import { CategoriaAdminDTO, CrearCategoriaRequest, ActualizarCategoriaRequest } from '@/types/admin';

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

  if (!abierto) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-aurea-champagne/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-aurea-champagne/40 flex items-center justify-between bg-aurea-ivory/50">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-aurea-copper">
              {modo === 'crear' ? 'Nueva Sección Gastronómica' : 'Modificar Sección'}
            </span>
            <h2 className="text-xl font-serif font-bold text-aurea-navy">
              {modo === 'crear' ? 'Crear Categoría de la Carta' : `Editar "${categoriaEditar?.nombre}"`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="p-2 rounded-xl text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorLocal && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorLocal}
            </div>
          )}

          {/* Campo: Nombre de la Categoría */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="nombre-cat" className="text-xs font-semibold text-aurea-navy uppercase tracking-wider">
                Nombre de la Categoría *
              </label>
              <span className={`text-[11px] font-mono ${nombre.length > 50 ? 'text-amber-600 font-bold' : 'text-aurea-navy/40'}`}>
                {nombre.length}/60
              </span>
            </div>
            <input
              id="nombre-cat"
              type="text"
              maxLength={60}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errorLocal) setErrorLocal(null);
              }}
              placeholder="Ej. Entradas Frías, Carnes & Parrillas, Bebidas..."
              autoFocus
              className="w-full px-4 py-2.5 bg-white border border-aurea-champagne/60 rounded-xl text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 focus:border-aurea-copper transition-all"
            />
            <p className="text-[11px] text-aurea-navy/60">
              Debe ser único en el restaurante. Este texto aparecerá en las pestañas del menú digital y comanda móvil.
            </p>
          </div>

          {/* Campo: Switch de Visibilidad */}
          <div className="p-4 rounded-xl border border-aurea-champagne/40 bg-aurea-ivory/30 flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-aurea-navy block">
                Visible en Carta y Comanda
              </span>
              <p className="text-xs text-aurea-navy/60 mt-0.5">
                Si está activa, los clientes podrán verla en la carta digital y los mozos tomar comanda de sus platos.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={activa}
              onClick={() => setActiva(!activa)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                activa ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  activa ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vista Previa Interactiva de Pestaña Mozo (CU-MOZO-01) */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-aurea-navy">
              <Smartphone className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Vista Previa: Pestaña en Comanda Móvil (CU-MOZO-01)</span>
            </div>
            <p className="text-[11px] text-aurea-navy/60">
              Así visualizarán los mozos esta pestaña en la barra superior de selección rápida de productos:
            </p>

            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-inner overflow-x-auto">
              {/* Pestaña simulada activa */}
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activa
                    ? 'bg-aurea-navy text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 line-through'
                }`}
              >
                <Sparkles className="w-3 h-3 text-aurea-champagne" />
                <span>{nombre.trim() || 'Nombre Categoría'}</span>
              </div>

              {/* Pestañas simuladas de ejemplo */}
              <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                Fondos
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                Bebidas
              </div>
            </div>
          </div>
        </form>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 border-t border-aurea-champagne/40 bg-aurea-ivory/50 flex items-center justify-end gap-3">
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
            onClick={handleSubmit}
            disabled={cargando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-sm font-semibold transition-all shadow-md min-h-[44px] disabled:opacity-50"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-aurea-champagne" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-aurea-champagne" />
                <span>{modo === 'crear' ? 'Crear Categoría' : 'Guardar Cambios'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
