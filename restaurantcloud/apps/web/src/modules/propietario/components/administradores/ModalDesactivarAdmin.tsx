import React, { useState } from 'react';
import { AdministradorItemDTO } from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import {
  X,
  UserX,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface ModalDesactivarAdminProps {
  admin: AdministradorItemDTO | null;
  onCerrar: () => void;
  onConfirmarDesactivacion: (adminId: string) => Promise<boolean>;
}

export const ModalDesactivarAdmin: React.FC<ModalDesactivarAdminProps> = ({
  admin,
  onCerrar,
  onConfirmarDesactivacion,
}) => {
  const [procesando, setProcesando] = useState(false);

  if (!admin) return null;

  const handleConfirmar = async () => {
    setProcesando(true);
    try {
      const exito = await onConfirmarDesactivacion(admin.id);
      if (exito) {
        onCerrar();
      }
    } finally {
      setProcesando(false);
    }
  };

  const sedeNombre = admin.sede_asignada?.nombre || 'su sede asignada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl border-2 border-rose-300 shadow-2xl overflow-hidden flex flex-col"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-desactivar-titulo"
      >
        {/* Cabecera de Alerta */}
        <div className="bg-rose-50 px-6 py-5 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-desactivar-titulo"
                className="font-serif text-lg font-bold text-rose-950"
              >
                ¿Desactivar Administrador?
              </h2>
              <p className="text-[11px] text-rose-700">
                Revocación de credenciales y acceso operativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="w-8 h-8 rounded-full flex items-center justify-center text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-aurea-navy leading-relaxed">
            Estás a punto de desactivar la cuenta de{' '}
            <strong className="text-aurea-navy font-bold">{admin.nombre}</strong> (
            <span className="font-mono text-slate-600">{admin.correo}</span>).
          </p>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Consecuencias de seguridad inmediatas:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-rose-900/90 pl-5 list-disc leading-relaxed">
              <li>
                <strong>Cierre forzoso de sesiones:</strong> Su token JWT será revocado de inmediato en la lista negra de Redis.
              </li>
              <li>
                <strong>Supervisión de sede:</strong> La sede <strong>{sedeNombre}</strong> pasará automáticamente a control autogestionado por el Propietario.
              </li>
              <li>
                <strong>Liberación de cuota:</strong> Se liberará 1 cupo de colaborador en tu Plan Pro.
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Podrás reactivar y asignar a este administrador en cualquier momento desde el módulo de Locales.
          </p>

          {/* Footer de Acciones */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={onCerrar}
              disabled={procesando}
              className="bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold text-xs py-2 px-4"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={procesando}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-5 shadow-md flex items-center gap-2"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Desactivando...</span>
                </>
              ) : (
                <span>Confirmar Desactivación</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
