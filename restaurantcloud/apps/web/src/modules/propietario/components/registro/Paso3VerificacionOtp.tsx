import React, { useState, useEffect, useRef } from 'react';
import { Mail, Clock, RefreshCw, AlertCircle, ArrowRight, Edit3 } from 'lucide-react';
import { ModalModificarCorreo } from './ModalModificarCorreo';

interface Paso3VerificacionOtpProps {
  correo: string;
  otpSugerido?: string | null;
  onVerificarOtp: (otp: string) => Promise<void>;
  onReenviarOtp: () => Promise<void>;
  onModificarCorreo: (nuevoCorreo: string) => Promise<void>;
  cargando: boolean;
  errorOtp: string | null;
}

export const Paso3VerificacionOtp: React.FC<Paso3VerificacionOtpProps> = ({
  correo,
  otpSugerido,
  onVerificarOtp,
  onReenviarOtp,
  onModificarCorreo,
  cargando,
  errorOtp,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [segundosExpiracion, setSegundosExpiracion] = useState(600); // 10 min
  const [cooldownReenvio, setCooldownReenvio] = useState(60); // 60s
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState(false);
  const [shake, setShake] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Temporizador de expiración regresivo
  useEffect(() => {
    if (segundosExpiracion <= 0) return;
    const interval = setInterval(() => {
      setSegundosExpiracion((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [segundosExpiracion]);

  // Temporizador de cooldown para reenvío
  useEffect(() => {
    if (cooldownReenvio <= 0) return;
    const interval = setInterval(() => {
      setCooldownReenvio((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownReenvio]);

  // Sacudir ante error
  useEffect(() => {
    if (errorOtp) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [errorOtp]);

  // Manejo de cambio en casillas
  const handleChangeDigit = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const nextFocus = Math.min(pasted.length, 5);
    inputsRef.current[nextFocus]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = digits.join('');
    if (codigo.length === 6) {
      onVerificarOtp(codigo);
    }
  };

  const handleReenviar = async () => {
    if (cooldownReenvio > 0 || cargando) return;
    await onReenviarOtp();
    setCooldownReenvio(60);
    setDigits(['', '', '', '', '', '']);
    inputsRef.current[0]?.focus();
  };

  const formatTiempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const codigoCompleto = digits.every((d) => d !== '');

  return (
    <div className="max-w-xl mx-auto animate-fadeIn py-4">
      <div className="bg-white rounded-3xl p-7 sm:p-10 border border-aurea-copper/30 shadow-[0_12px_36px_rgba(11,35,64,0.06)] text-center space-y-6">
        {/* Icono central de correo */}
        <div className="w-16 h-16 rounded-3xl bg-aurea-ivory border-2 border-aurea-copper/40 text-aurea-navy mx-auto flex items-center justify-center shadow-sm">
          <Mail className="w-8 h-8 text-aurea-copper" />
        </div>

        {/* Títulos y explicación */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
            Paso 3: Verificación de Seguridad
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold">
            Verifica tu Correo Electrónico
          </h2>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 leading-relaxed max-w-md mx-auto">
            Hemos enviado un código numérico de 6 dígitos a la casilla:{' '}
            <span className="font-bold text-aurea-navy block mt-0.5">{correo}</span>
          </p>

          <button
            type="button"
            onClick={() => setModalCorreoAbierto(true)}
            className="inline-flex items-center gap-1.5 text-xs text-aurea-copper hover:text-aurea-navy font-semibold underline pt-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            ¿Correo incorrecto? Modificar aquí
          </button>
        </div>

        {/* Chip para Entorno de Desarrollo / Pruebas */}
        {otpSugerido && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900 text-xs flex items-center justify-between gap-2 text-left">
            <div>
              <span className="font-bold block text-amber-950">Modo Desarrollo / Test:</span>
              <span>Código OTP en sesión: <strong className="font-mono text-sm tracking-wider">{otpSugerido}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                const arr = otpSugerido.slice(0, 6).split('');
                setDigits(arr);
              }}
              className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-xs transition-colors shrink-0"
            >
              Autocompletar
            </button>
          </div>
        )}

        {/* Formulario de 6 dígitos */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div
            className={`flex items-center justify-center gap-2 sm:gap-3 transition-transform ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChangeDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className={`w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 ${
                  digit
                    ? 'border-aurea-navy bg-aurea-ivory/50 text-aurea-navy focus:ring-aurea-copper/30'
                    : 'border-aurea-copper/30 bg-white text-aurea-navy focus:border-aurea-copper focus:ring-aurea-copper/20'
                } ${errorOtp ? 'border-rose-400 bg-rose-50 text-rose-800' : ''}`}
              />
            ))}
          </div>

          {/* Error inline */}
          {errorOtp && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorOtp}</span>
            </div>
          )}

          {/* Reloj de expiración */}
          <div className="p-3 rounded-2xl bg-aurea-ivory border border-aurea-copper/20 flex items-center justify-center gap-2 text-xs text-aurea-navy/80 font-mono">
            <Clock className="w-4 h-4 text-aurea-copper" />
            <span>Código válido durante: <strong>{formatTiempo(segundosExpiracion)}</strong></span>
          </div>

          {/* Botón principal */}
          <button
            type="submit"
            disabled={cargando || !codigoCompleto || segundosExpiracion === 0}
            className="w-full bg-aurea-navy hover:bg-[#12345e] text-white font-semibold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cargando ? (
              <span>Validando código OTP...</span>
            ) : (
              <>
                <span>Verificar y continuar al pago</span>
                <ArrowRight className="w-4 h-4 text-aurea-copper" />
              </>
            )}
          </button>

          {/* Enlace de Reenvío con Cooldown */}
          <div className="pt-2">
            <button
              type="button"
              disabled={cooldownReenvio > 0 || cargando}
              onClick={handleReenviar}
              className={`text-xs inline-flex items-center gap-1.5 font-medium transition-colors ${
                cooldownReenvio > 0
                  ? 'text-aurea-navy/40 cursor-not-allowed'
                  : 'text-aurea-copper hover:text-aurea-navy underline'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              {cooldownReenvio > 0
                ? `¿No recibiste el código? Reenviar (${cooldownReenvio}s)`
                : '¿No recibiste el código? Reenviar ahora'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal para modificar correo */}
      <ModalModificarCorreo
        abierto={modalCorreoAbierto}
        correoActual={correo}
        onCerrar={() => setModalCorreoAbierto(false)}
        onConfirmar={onModificarCorreo}
      />
    </div>
  );
};
