import React, { useState, useEffect } from 'react';
import { AdministradorItemDTO } from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import { generarEnlaceWhatsApp } from '@/shared/utils';
import { propietarioAdminsService } from '@/services/serviceAdapter';
import {
  X,
  Copy,
  Check,
  Share2,
  Lock,
  Clock,
  AlertTriangle,
  Loader2,
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
  const [cargando, setCargando] = useState(false);
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);
  const [urlActivacion, setUrlActivacion] = useState<string>('');

  useEffect(() => {
    if (!admin) {
      setUrlActivacion('');
      setErrorEnlace(null);
      return;
    }

    // Si ya viene con token activo desde el directorio
    if (admin.invitacion_token && !admin.invitacion_expirada) {
      setUrlActivacion(`${window.location.origin}/activar-cuenta?token=${admin.invitacion_token}`);
      setErrorEnlace(null);
      return;
    }

    // Si no está disponible en memoria o figura expirado, consultar directamente a la API en Redis
    const consultarEnlaceReal = async () => {
      setCargando(true);
      setErrorEnlace(null);
      try {
        const res = await propietarioAdminsService.obtenerEnlaceInvitacion(admin.id);
        if (res.exito && res.datos?.invitacion_token) {
          setUrlActivacion(
            res.datos.invitacion_url ||
              `${window.location.origin}/activar-cuenta?token=${res.datos.invitacion_token}`
          );
        } else {
          setErrorEnlace(
            res.errores?.[0]?.mensaje ||
              'La invitación ha expirado o no se encuentra activa en Redis. Utiliza la opción "Reenviar" para emitir un nuevo enlace.'
          );
        }
      } catch {
        setErrorEnlace('No se pudo verificar el enlace con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    consultarEnlaceReal();
  }, [admin]);

  if (!admin) return null;

  const handleCopiar = () => {
    if (!urlActivacion) return;
    navigator.clipboard.writeText(urlActivacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleCompartirWhatsapp = () => {
    if (!urlActivacion) return;
    const texto = `Hola ${admin.nombre}, has sido invitado como Administrador de Local en RestaurantCloud AI. Activa tu cuenta personal aquí (enlace seguro válido por 24 horas): ${urlActivacion}`;
    if (admin.telefono) {
      window.open(generarEnlaceWhatsApp(admin.telefono, texto), '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    }
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
          {cargando ? (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-aurea-copper animate-spin mx-auto" />
              <p className="text-xs text-aurea-navy/70">Consultando token seguro en Redis...</p>
            </div>
          ) : errorEnlace ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs">Invitación no disponible</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">{errorEnlace}</p>
              </div>
            </div>
          ) : (
            <>
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
                    disabled={!urlActivacion}
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
            </>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-aurea-copper/15">
            <Button
              type="button"
              onClick={handleCompartirWhatsapp}
              disabled={!urlActivacion || cargando || !!errorEnlace}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
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
