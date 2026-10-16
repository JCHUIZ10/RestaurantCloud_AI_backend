import React, { useState } from 'react';
import { AdministradorItemDTO } from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import {
  X,
  Copy,
  Check,
  Share2,
  Lock,
  Clock,
} from 'lucide-react';

interface ModalCopiarInvitacionProps {
  admin: AdministradorItemDTO | null;
  onCerrar: () => void;
}

export const ModalCopiarInvitacion: React.FC<ModalCopiarInvitacionProps> = ({
  admin,
  onCerrar,
}) => {
  const [copiado, setCopiado] = useState(false);

  if (!admin) return null;

  const token = admin.invitacion_token || 'inv_tok_demo_aurea';
  const urlActivacion = `${window.location.origin}/activar-cuenta?token=${token}`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(urlActivacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleCompartirWhatsapp = () => {
    const texto = encodeURIComponent(
      `Hola ${admin.nombre}, has sido invitado a administrar la sede "${admin.sede_asignada?.nombre || 'de Restaurante'}" en RestaurantCloud AI. Activa tu cuenta aquí (válido por 24h): ${urlActivacion}`
    );
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border-2 border-aurea-copper/30 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-enlace-titulo"
      >
        {/* Cabecera */}
        <div className="bg-aurea-ivory/60 px-6 py-5 border-b border-aurea-copper/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-aurea-navy text-aurea-copper flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="modal-enlace-titulo"
                className="font-serif text-lg font-bold text-aurea-navy"
              >
                Enlace Seguro de Activación
              </h2>
              <p className="text-[11px] text-aurea-navy/70">
                Invitación para {admin.nombre} ({admin.correo})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-copper/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Este enlace criptográfico es efímero y expirará en <strong>24 horas</strong>. Al abrirlo, el colaborador definirá su propia clave privada.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-aurea-navy text-xs">
              URL de Activación Generada
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urlActivacion}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-aurea-copper/30 rounded-xl text-xs font-mono text-aurea-navy select-all focus:outline-none"
              />
              <Button
                type="button"
                onClick={handleCopiar}
                className={`font-bold text-xs py-2.5 px-3.5 flex items-center gap-1.5 transition-all shadow-sm ${
                  copiado
                    ? 'bg-emerald-600 text-white'
                    : 'bg-aurea-navy text-white hover:bg-aurea-navy/90'
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-aurea-copper/15">
            <Button
              type="button"
              onClick={handleCompartirWhatsapp}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </Button>

            <Button
              type="button"
              onClick={onCerrar}
              className="w-full sm:w-auto bg-white text-aurea-navy hover:bg-slate-100 border border-aurea-copper/30 font-semibold text-xs py-2 px-4"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
