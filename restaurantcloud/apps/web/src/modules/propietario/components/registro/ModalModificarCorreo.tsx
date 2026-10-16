import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Mail, X, AlertCircle } from 'lucide-react';

interface ModalModificarCorreoProps {
  abierto: boolean;
  correoActual: string;
  onCerrar: () => void;
  onConfirmar: (nuevoCorreo: string) => Promise<void>;
}

export const ModalModificarCorreo: React.FC<ModalModificarCorreoProps> = ({
  abierto,
  correoActual,
  onCerrar,
  onConfirmar,
}) => {
  const [nuevoCorreo, setNuevoCorreo] = useState(correoActual);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCorreo.includes('@') || !nuevoCorreo.includes('.')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await onConfirmar(nuevoCorreo);
      onCerrar();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al actualizar el correo'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 border-2 border-aurea-copper/30 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-5 right-5 text-aurea-navy/40 hover:text-aurea-navy p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-aurea-copper/20 text-aurea-navy flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-aurea-navy">
              Modificar Correo Electrónico
            </h3>
            <p className="text-xs text-aurea-navy/60">
              Corrige errores de tipeo sin perder los datos de tu empresa
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-aurea-navy mb-1">
              Nuevo Correo de Acceso y Facturación
            </label>
            <input
              type="email"
              required
              value={nuevoCorreo}
              onChange={(e) => setNuevoCorreo(e.target.value)}
              placeholder="ejemplo@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
            />
            <p className="text-[10px] text-aurea-navy/60 mt-1">
              Despacharemos un nuevo código OTP de 6 dígitos a esta nueva dirección.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCerrar}
              disabled={guardando}
              className="border-aurea-navy/20 text-aurea-navy"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={guardando || !nuevoCorreo}
              className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold"
            >
              {guardando ? 'Actualizando...' : 'Guardar y Reenviar OTP'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
