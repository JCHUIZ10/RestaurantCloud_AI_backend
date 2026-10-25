import React, { useState } from 'react';
import { KeyRound, Copy, Check, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { EmpleadoResumenDTO, ResetPasswordResponseDTO } from '@/types/admin';
import { Button, Modal } from '@/components/ui';

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

  if (!empleado) return null;

  // El resultado solo vale para el colaborador con el que se generó
  const clave = resultado && resultado.usuario_id === empleado.id ? resultado : null;

  const handleReset = async () => {
    setErrorMsg(null);
    setGenerando(true);
    try {
      const res = await onConfirmarReset(empleado.id);
      if (res) {
        setResultado(res);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo generar la nueva contraseña.');
    } finally {
      setGenerando(false);
    }
  };

  const copiarClave = () => {
    if (!clave) return;
    const texto = `Hola ${clave.nombre}, tu nueva contraseña provisional en RestaurantCloud AI es: ${clave.password_temporal}\nAcceso: https://app.restaurantcloud.pe/login`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const cerrar = () => {
    setResultado(null);
    setErrorMsg(null);
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      cerrable={!generando}
      tamano="sm"
      tono="alerta"
      icono={KeyRound}
      etiqueta={empleado.nombre}
      titulo={clave ? 'Nueva contraseña lista' : 'Restablecer contraseña'}
      pie={
        clave ? (
          <>
            <Button
              variant="outline"
              onClick={copiarClave}
              leftIcon={copiado ? <Check className="w-4 h-4 text-estado-ok-600" aria-hidden="true" /> : <Copy className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
            >
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
            <Button onClick={cerrar}>Listo</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={cerrar} disabled={generando}>
              Cancelar
            </Button>
            <Button onClick={handleReset} loading={generando} leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}>
              Generar clave
            </Button>
          </>
        )
      }
    >
      {errorMsg && (
        <p role="alert" className="mb-4 p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          {errorMsg}
        </p>
      )}

      {clave ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 text-center">
            <p className="text-xs text-aurea-navy/60">Clave provisional</p>
            <p className="font-mono font-bold text-2xl tracking-widest text-aurea-copper">{clave.password_temporal}</p>
          </div>
          <a
            href={clave.enlace_whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-tactil inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-estado-ok-600 hover:bg-estado-ok-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Enviar por WhatsApp
          </a>
        </div>
      ) : (
        <p className="text-sm text-aurea-navy/80">
          Su contraseña actual dejará de funcionar y se generará una clave provisional que deberá cambiar al entrar.
        </p>
      )}
    </Modal>
  );
};
