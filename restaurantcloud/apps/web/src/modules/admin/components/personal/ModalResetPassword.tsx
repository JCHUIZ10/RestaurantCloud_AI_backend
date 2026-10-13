import React, { useState } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  Copy,
  MessageCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  EmpleadoResumenDTO,
  ResetPasswordResponseDTO,
} from '@/types/admin';

interface ModalResetPasswordProps {
  abierto: boolean;
  onCerrar: () => void;
  empleado: EmpleadoResumenDTO | null;
  onConfirmarReset: (id: string) => Promise<ResetPasswordResponseDTO | null>;
}

export const ModalResetPassword: React.FC<ModalResetPasswordProps> = ({
  abierto,
  onCerrar,
  empleado,
  onConfirmarReset,
}) => {
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<ResetPasswordResponseDTO | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!abierto || !empleado) return null;

  const handleReset = async () => {
    setErrorMsg(null);
    setGenerando(true);
    try {
      const res = await onConfirmarReset(empleado.id);
      if (res) {
        setResultado(res);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al restablecer contraseña.');
    } finally {
      setGenerando(false);
    }
  };

  const copiarClave = () => {
    if (!resultado) return;
    const texto = `Hola ${resultado.nombre}, tu nueva contraseña provisional en RestaurantCloud AI es: ${resultado.password_temporal}\nAcceso: https://app.restaurantcloud.pe/login`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-aurea-champagne/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-aurea-navy">
                Restablecer Credenciales
              </h2>
              <p className="text-xs text-slate-500">
                {empleado.nombre} ({empleado.correo})
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultado ? (
            /* Pantalla con la nueva clave generada */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Contraseña Restablecida con Éxito
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Comparte la clave provisional con el colaborador. Deberá cambiarla al iniciar sesión.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-xs text-slate-500 font-medium">Nueva Contraseña Provisional:</span>
                <div className="font-mono font-bold text-xl text-aurea-copper py-1 tracking-wider">
                  {resultado.password_temporal}
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={resultado.enlace_whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notificar por WhatsApp</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copiarClave}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiado ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCerrar}
                    className="px-4 py-2 rounded-xl bg-aurea-navy text-white text-xs font-semibold hover:bg-aurea-navy/90"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Confirmación previa */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Al restablecer la contraseña, se invalidará el acceso actual de <strong>{empleado.nombre}</strong> y se generará una nueva clave provisional de 4 dígitos.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={generando}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${generando ? 'animate-spin' : ''}`} />
                  <span>{generando ? 'Generando...' : 'Generar Nueva Clave'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
