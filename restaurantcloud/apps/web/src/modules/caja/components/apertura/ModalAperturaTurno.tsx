import React, { useState } from 'react';
import {
  Lock,
  Zap,
  Calendar,
  Clock,
  LogOut,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ModalAperturaTurnoProps {
  isOpen: boolean;
  correlativoProyectado: number;
  sedeNombre?: string;
  onConfirmarApertura: (monto: number, notas?: string) => Promise<void>;
  onCerrarSesion: () => void;
  isSubmitting?: boolean;
}

export const ModalAperturaTurno: React.FC<ModalAperturaTurnoProps> = ({
  isOpen,
  correlativoProyectado,
  sedeNombre = 'Sede Principal - Miraflores',
  onConfirmarApertura,
  onCerrarSesion,
  isSubmitting = false,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const cajeroNombre = usuario?.nombre || 'Cajero(a) de Turno';
  const cajeroRol =
    usuario?.rol === 'cajero' ? 'Cajero(a) de Turno' : usuario?.rol || 'Cajero';
  const cajeroIniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : 'CJ';

  const [monto, setMonto] = useState<string>('300.00');
  const [notas, setNotas] = useState<string>('');
  const [errorMonto, setErrorMonto] = useState<string | null>(null);

  if (!isOpen) return null;

  const montoNumero = parseFloat(monto) || 0;

  const handleChipIncrement = (delta: number) => {
    const nuevo = Math.max(0, Math.round((montoNumero + delta) * 100) / 100);
    setMonto(nuevo.toFixed(2));
    setErrorMonto(null);
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonto(val);
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      setErrorMonto('El monto inicial no puede ser negativo ni vacío');
    } else {
      setErrorMonto(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNum = parseFloat(monto);
    if (isNaN(finalNum) || finalNum < 0) {
      setErrorMonto('Ingresa un monto inicial válido (S/ 0.00 o mayor)');
      return;
    }
    onConfirmarApertura(finalNum, notas);
  };

  // Fecha actual formateada
  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaHoy = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-apertura-title"
    >
      <div className="w-full max-w-[560px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Cabecera del Diálogo Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-aurea-navy via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-aurea-copper font-bold">
                  Punto de Venta • CU-CAJA-01
                </span>
              </div>
              <h1 id="modal-apertura-title" className="text-lg font-bold tracking-tight text-white font-serif">
                Apertura de Turno de Caja
              </h1>
              <p className="text-xs text-slate-400">{sedeNombre} • Terminal Única</p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-aurea-copper/20 text-aurea-champagne border border-aurea-copper/40 text-xs font-mono font-bold tracking-wide">
              Turno #{String(correlativoProyectado).padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Formulario de Apertura */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ficha de Identidad del Cajero */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-aurea-navy text-aurea-champagne flex items-center justify-center font-bold text-sm shadow-sm border border-aurea-copper/30">
                {cajeroIniciales}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {cajeroNombre}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {cajeroRol}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5">
              <div className="flex items-center gap-1.5 justify-end">
                <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
                <span>{fechaHoy}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{horaHoy}</span>
              </div>
            </div>
          </div>

          {/* Campo Monetario de Monto Inicial */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Monto Inicial de Efectivo (Fondo de Sencillo) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-slate-400 dark:text-slate-500 select-none">
                PEN S/
              </span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={monto}
                onChange={handleMontoChange}
                placeholder="0.00"
                className={`w-full pl-24 pr-4 py-3 rounded-2xl border text-2xl font-mono font-bold tracking-tight bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 ${
                  errorMonto
                    ? 'border-rose-400 focus:ring-rose-400/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-aurea-copper focus:ring-aurea-copper/20'
                }`}
                required
                autoFocus
              />
            </div>
            {errorMonto && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMonto}
              </p>
            )}

            {/* Chips táctiles de incremento rápido */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {[50, 100, 200].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleChipIncrement(inc)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
                >
                  + S/ {inc}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setMonto('0.00')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-colors flex items-center gap-1 ml-auto"
                title="Restablecer monto a cero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Borrar</span>
              </button>
            </div>
          </div>

          {/* Notas u Observaciones Opcionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observaciones de Apertura (Opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Fondo recibido en sobre cerrado de administración..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 resize-none"
            />
          </div>

          {/* Banner Poka-Yoke de Política Operativa */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block">Política de Terminal Única de Caja:</span>
              <span className="text-[11px] opacity-90">
                Al confirmar la apertura, este terminal quedará habilitado para emitir precuentas y cobrar comprobantes electrónicamente. No se admiten aperturas concurrentes en la misma sede.
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCerrarSesion}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-aurea-navy bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 transition-all shadow-lg shadow-aurea-copper/25 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin" />
                  <span>Aperturando turno...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-aurea-navy" />
                  <span>Confirmar y Abrir Turno de Caja</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
