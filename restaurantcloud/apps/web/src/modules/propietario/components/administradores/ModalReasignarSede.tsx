import React, { useState, useEffect } from 'react';
import {
  AdministradorItemDTO,
  SedeResumenAsignacionDTO,
} from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import {
  X,
  ArrowRightLeft,
  Building2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ModalReasignarSedeProps {
  admin: AdministradorItemDTO | null;
  sedesDisponibles: SedeResumenAsignacionDTO[];
  onCerrar: () => void;
  onConfirmarReasignacion: (adminId: string, nuevoLocalId: string) => Promise<boolean>;
}

export const ModalReasignarSede: React.FC<ModalReasignarSedeProps> = ({
  admin,
  sedesDisponibles,
  onCerrar,
  onConfirmarReasignacion,
}) => {
  const [nuevoLocalId, setNuevoLocalId] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Filtrar las sedes que no son la actual del administrador
  const sedesElegibles = sedesDisponibles.filter(
    (s) => s.id !== admin?.sede_asignada?.id && !s.tiene_administrador
  );

  useEffect(() => {
    if (admin) {
      setErrorLocal(null);
      if (sedesElegibles.length > 0) {
        setNuevoLocalId(sedesElegibles[0].id);
      } else {
        setNuevoLocalId('');
      }
    }
  }, [admin]);

  if (!admin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoLocalId) {
      setErrorLocal('Selecciona una sede destino disponible.');
      return;
    }

    setProcesando(true);
    try {
      const exito = await onConfirmarReasignacion(admin.id, nuevoLocalId);
      if (exito) {
        onCerrar();
      }
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al reasignar sede titular.');
    } finally {
      setProcesando(false);
    }
  };

  const sedeActualNombre = admin.sede_asignada?.nombre || 'Sin Sede Asignada';
  const nuevaSedeInfo = sedesDisponibles.find((s) => s.id === nuevoLocalId);
  const nuevaSedeNombre = nuevaSedeInfo ? nuevaSedeInfo.nombre : 'la nueva sede';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border-2 border-aurea-copper/30 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-reasignar-titulo"
      >
        {/* Cabecera del Modal */}
        <div className="bg-aurea-ivory/60 px-6 py-5 border-b border-aurea-copper/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-aurea-navy text-aurea-copper flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="modal-reasignar-titulo"
                className="font-serif text-lg sm:text-xl font-bold text-aurea-navy"
              >
                Reasignar Sede Titular
              </h2>
              <p className="text-[11px] text-aurea-navy/70">
                {admin.nombre} • {admin.correo}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="w-8 h-8 rounded-full flex items-center justify-center text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-copper/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorLocal && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-[11px] font-semibold">
              {errorLocal}
            </div>
          )}

          {/* Tarjeta de Sede Actual */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
              Sede actual supervisada:
            </span>
            <div className="flex items-center gap-2 font-serif text-sm font-bold text-aurea-navy">
              <Building2 className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>{sedeActualNombre}</span>
            </div>
          </div>

          {/* Selector de Nueva Sede Titular */}
          <div className="space-y-1.5">
            <label className="block font-bold text-aurea-navy text-xs">
              Seleccionar Nueva Sede Titular <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={nuevoLocalId}
                onChange={(e) => setNuevoLocalId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 font-medium"
              >
                {sedesElegibles.length === 0 ? (
                  <option value="">No hay otras sedes disponibles para reasignar</option>
                ) : (
                  sedesElegibles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.distrito}) — Disponible
                    </option>
                  ))
                )}
              </select>
            </div>
            <p className="text-[10px] text-aurea-copper font-medium">
              Regla de negocio: Cada sede cuenta con 1 administrador titular exclusivo.
            </p>
          </div>

          {/* Consecuencias Transparentes de la Reasignación */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Impacto de la reasignación inmediata:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-amber-900/90 pl-5 list-disc leading-relaxed">
              <li>
                <strong>{admin.nombre}</strong> perderá acceso administrativo a la gestión de <strong>{sedeActualNombre}</strong>.
              </li>
              <li>
                <strong>{sedeActualNombre}</strong> pasará a supervisión directa del Propietario (Autogestionada) hasta nombrar un nuevo titular.
              </li>
              <li>
                El administrador asumirá el control operativo de <strong>{nuevaSedeNombre}</strong> en su próximo inicio de sesión.
              </li>
            </ul>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-3 border-t border-aurea-copper/15 flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={onCerrar}
              disabled={procesando}
              className="bg-white text-aurea-navy hover:bg-slate-100 border border-aurea-copper/30 font-semibold text-xs py-2 px-4"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={procesando || !nuevoLocalId || sedesElegibles.length === 0}
              className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold text-xs py-2 px-5 shadow-md flex items-center gap-2"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 text-aurea-copper animate-spin" />
                  <span>Reasignando sede...</span>
                </>
              ) : (
                <span>Confirmar Reasignación</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
