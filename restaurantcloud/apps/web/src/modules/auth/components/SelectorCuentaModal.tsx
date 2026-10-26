import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Building2, MapPin, ArrowRight, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import type { CuentaItemDTO } from '@/types/auth';

interface SelectorCuentaModalProps {
  cuentas: CuentaItemDTO[];
  expiraEnSegundos: number;
  onSeleccionarCuenta: (usuarioId: string) => void;
  onVolverALogin: () => void;
  cargando: boolean;
}

export const SelectorCuentaModal: React.FC<SelectorCuentaModalProps> = ({
  cuentas,
  expiraEnSegundos,
  onSeleccionarCuenta,
  onVolverALogin,
  cargando,
}) => {
  // Cuenta regresiva basada en el tiempo emitido por el backend
  const [tiempoRestante, setTiempoRestante] = useState<number>(expiraEnSegundos || 300);

  useEffect(() => {
    if (tiempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTiempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [tiempoRestante]);

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  const esTiempoCritico = tiempoRestante < 60;
  const expirado = tiempoRestante <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-aurea-copper/30 shadow-[0_12px_36px_rgba(11,35,64,0.06)] space-y-6"
    >
      {/* Cabecera del Selector Multi-Tenant */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Resolución Multi-Tenant</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold leading-tight">
          Seleccionar Restaurante
        </h2>
        <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto">
          Tu correo está asociado a múltiples empresas gastronómicas. Elige la sede con la que deseas operar este turno:
        </p>
      </div>

      {/* Reloj Regresivo de Seguridad del Token Temporal */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
          expirado
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : esTiempoCritico
            ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
            : 'bg-[#FFF9F0] text-aurea-navy border-aurea-copper/25'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-aurea-copper" />
          <span>
            {expirado
              ? 'La sesión de selección ha expirado'
              : 'Tiempo restante de selección:'}
          </span>
        </div>
        <span className="font-mono text-sm font-bold">{tiempoFormateado}</span>
      </div>

      {/* Lista de Tarjetas de Empresas y Sedes */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {cuentas.map((cuenta) => {
          const bloqueado = !cuenta.acceso_habilitado || expirado;

          return (
            <div
              key={cuenta.usuario_id}
              onClick={() => {
                if (!bloqueado && !cargando) {
                  onSeleccionarCuenta(cuenta.usuario_id);
                }
              }}
              className={`p-4.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                bloqueado
                  ? 'border-slate-200 bg-slate-50 opacity-65 cursor-not-allowed'
                  : 'border-aurea-copper/25 hover:border-aurea-copper hover:bg-[#FFF9F0]/60 hover:shadow-md cursor-pointer group'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-aurea-navy group-hover:text-aurea-navy">
                    {cuenta.empresa_nombre}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-aurea-navy text-aurea-champagne">
                    {cuenta.rol}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-aurea-navy/70 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                  <span>{cuenta.local_nombre}</span>
                </div>

                {cuenta.motivo_bloqueo && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cuenta.motivo_bloqueo}</span>
                  </div>
                )}
              </div>

              {/* Botón de Entrada */}
              <div className="shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  disabled={bloqueado || cargando}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    bloqueado
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-aurea-navy text-white group-hover:bg-[#12345e]'
                  }`}
                >
                  {cargando ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-aurea-copper" />
                  ) : (
                    <>
                      <span>{bloqueado ? 'Acceso Bloqueado' : 'Entrar a este local'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-aurea-copper" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón para volver o reiniciar */}
      <div className="pt-3 border-t border-aurea-copper/15 flex items-center justify-between">
        <button
          type="button"
          onClick={onVolverALogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-aurea-navy/70 hover:text-aurea-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-aurea-copper" />
          <span>Iniciar con otro correo</span>
        </button>

        {expirado && (
          <button
            type="button"
            onClick={onVolverALogin}
            className="text-xs font-bold text-rose-600 underline"
          >
            Reintentar inicio de sesión
          </button>
        )}
      </div>
    </motion.div>
  );
};
