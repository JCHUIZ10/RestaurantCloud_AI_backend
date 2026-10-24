import React, { useState, useEffect } from 'react';
import { PisoAdminDTO } from '@/types/admin';
import { X, Settings, AlertTriangle, Trash2, Check, LayoutGrid, Users } from 'lucide-react';

interface ModalEditarPisoProps {
  piso: PisoAdminDTO | null;
  totalPisosActivos: number;
  isOpen: boolean;
  onClose: () => void;
  onRenombrar: (pisoId: string, nuevoNombre: string) => Promise<void>;
  onDesactivar: (pisoId: string) => Promise<void>;
}

export const ModalEditarPiso: React.FC<ModalEditarPisoProps> = ({
  piso,
  totalPisosActivos,
  isOpen,
  onClose,
  onRenombrar,
  onDesactivar,
}) => {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (piso) {
      setNombre(piso.nombre);
      setConfirmandoEliminar(false);
      setErrorLocal(null);
    }
  }, [piso, isOpen]);

  if (!isOpen || !piso) return null;

  const mesasActivas = piso.mesas.filter((m) => m.estado !== 'inactiva');
  const tieneMesasActivas = mesasActivas.length > 0;
  const esUnicoPiso = totalPisosActivos <= 1;

  const handleRenombrarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorLocal('El nombre del ambiente no puede estar vacío.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorLocal(null);
      await onRenombrar(piso.id, nombre.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al renombrar ambiente.';
      setErrorLocal(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesactivarSubmit = async () => {
    if (esUnicoPiso || tieneMesasActivas) return;

    try {
      setIsDeleting(true);
      setErrorLocal(null);
      await onDesactivar(piso.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desactivar ambiente.';
      setErrorLocal(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-aurea-copper/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-6 bg-aurea-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center">
              <Settings className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">Configuración del Ambiente</h3>
              <p className="text-xs text-white/70">
                {piso.nombre} · Ajustes físicos y ciclo de vida del salón
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorLocal && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Resumen de Métricas del Salón */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-aurea-ivory border border-aurea-copper/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-aurea-champagne/30 border border-aurea-copper/30 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-aurea-navy" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-aurea-navy/60 uppercase block">
                  Mesas Activas
                </span>
                <span className="font-serif text-lg font-bold text-aurea-navy">
                  {mesasActivas.length} mesas
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-aurea-ivory border border-aurea-copper/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-aurea-navy/60 uppercase block">
                  Capacidad Total
                </span>
                <span className="font-serif text-lg font-bold text-aurea-navy">
                  {piso.capacidad_total_personas} comensales
                </span>
              </div>
            </div>
          </div>

          {/* Sección 1: Renombrar Ambiente */}
          <form onSubmit={handleRenombrarSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                Nombre del Ambiente
              </label>
              <input
                type="text"
                required
                value={nombre}
                maxLength={60}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Salón Principal, Terraza Lounge..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-copper/40 text-sm font-semibold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper"
              />
              <p className="text-[11px] text-aurea-navy/60 mt-1">
                El nombre debe ser único entre los ambientes de esta sede.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || nombre.trim() === piso.nombre || !nombre.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy text-white text-xs sm:text-sm font-semibold hover:bg-aurea-navy/90 disabled:opacity-40 transition-all shadow-sm active:scale-95"
              >
                <Check className="w-4 h-4 text-aurea-champagne" />
                <span>{isSubmitting ? 'Guardando...' : 'Guardar Nombre'}</span>
              </button>
            </div>
          </form>

          <div className="h-px bg-aurea-copper/20 my-2" />

          {/* Sección 2: Zona de Peligro (Eliminar Ambiente) */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Zona de Peligro: Eliminar Ambiente</span>
            </div>

            {esUnicoPiso ? (
              <div className="text-xs text-rose-800 bg-white/80 p-3 rounded-xl border border-rose-200">
                <span className="font-semibold block">⚠️ Ambiente Mínimo Protegido</span>
                Este es el único ambiente activo en la sede. El restaurante debe contar con al menos un ambiente.
              </div>
            ) : tieneMesasActivas ? (
              <div className="text-xs text-rose-800 bg-white/80 p-3 rounded-xl border border-rose-200 space-y-1">
                <span className="font-semibold block">
                  🚫 Bloqueo de Seguridad: Contiene {mesasActivas.length} mesas activas
                </span>
                <p>
                  No puedes eliminar este ambiente mientras contenga mesas configuradas. Para darlo
                  de baja, primero debes vaciar el salón o eliminar sus mesas individuales.
                </p>
                <p className="text-[11px] text-rose-700/80 font-medium pt-1">
                  Mesas en este ambiente: {mesasActivas.map((m) => `Mesa ${m.numero}`).slice(0, 6).join(', ')}
                  {mesasActivas.length > 6 ? ` y ${mesasActivas.length - 6} más` : ''}.
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-700 space-y-3">
                <p>
                  Este ambiente no tiene mesas activas. Al darlo de baja, se ocultará del plano y de
                  la asignación de comandas de salón.
                </p>

                {!confirmandoEliminar ? (
                  <button
                    type="button"
                    onClick={() => setConfirmandoEliminar(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-semibold transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar este Ambiente</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2.5 animate-fadeIn">
                    <p className="font-bold text-rose-800 text-xs text-center">
                      ¿Estás seguro de eliminar el ambiente &ldquo;{piso.nombre}&rdquo;?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmandoEliminar(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDesactivarSubmit}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
                      >
                        {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
