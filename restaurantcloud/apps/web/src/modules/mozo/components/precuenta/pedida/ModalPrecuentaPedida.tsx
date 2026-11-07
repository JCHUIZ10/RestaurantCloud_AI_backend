import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ChefHat,
  Clock,
  Layers,
  Loader2,
  ReceiptText,
  RotateCcw,
  Split,
  User,
  Users,
  X,
} from 'lucide-react';
import { mozoService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils';
import type { PrecuentaMozoResponseDTO } from '../../../../../types/mozo';
import { VistaCuentaUnica } from './VistaCuentaUnica';
import { VistaCuentaDividida } from './VistaCuentaDividida';

interface ModalPrecuentaPedidaProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  /** Solo se pasa cuando la cuenta todavía se puede reabrir (nada cobrado). */
  onReabrirCuenta?: (mesaId: string) => void;
}

const minutosDesde = (fechaIso?: string | null): number | null => {
  if (!fechaIso) return null;
  const marca = new Date(fechaIso).getTime();
  if (Number.isNaN(marca)) return null;
  return Math.max(0, Math.round((Date.now() - marca) / 60000));
};

/**
 * Vista de solo lectura de una mesa en CUENTA PEDIDA: muestra lo ya registrado,
 * sea una cuenta única o una cuenta dividida en subcuentas.
 */
export const ModalPrecuentaPedida: React.FC<ModalPrecuentaPedidaProps> = ({
  isOpen,
  onClose,
  mesaId,
  onReabrirCuenta,
}) => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PrecuentaMozoResponseDTO | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let montado = true;
    setCargando(true);
    setError(null);

    mozoService
      .obtenerPrecuentaMesa(mesaId)
      .then((res) => {
        if (!montado) return;
        if (res.exito && res.datos) {
          setData(res.datos);
        } else {
          setError(res.errores?.[0]?.mensaje || 'No se pudo cargar la precuenta de la mesa.');
        }
      })
      .catch((err: unknown) => {
        if (montado) setError(mensajeDeErrorApi(err, 'Error de conexión'));
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [isOpen, mesaId]);

  useEffect(() => {
    if (!isOpen) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subcuentas = data?.subcuentas ?? [];
  const esDividida = subcuentas.length > 0;
  const minutosCuenta = minutosDesde(data?.cuenta_registrada?.registrada_at);
  const IconoCabecera = esDividida ? Split : ReceiptText;
  const hayPlatosPorServir =
    Boolean(data?.cobro_final_bloqueado) || Boolean(data?.tiene_cocina_pendiente);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-precuenta-pedida"
    >
      <div className="bg-[#07172B] border-0 sm:border border-[#D5A06F]/50 sm:rounded-2xl w-full sm:max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92vh] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        <header className="bg-[#0B2340] border-b border-[#D5A06F]/30 px-4 sm:px-5 py-3.5 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-xl bg-[#D5A06F]/20 text-[#D5A06F] border border-[#D5A06F]/40 shrink-0">
              <IconoCabecera className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D5A06F]">
                  {esDividida ? 'Cuenta dividida' : 'Precuenta registrada'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  Cuenta pedida
                  {minutosCuenta !== null && ` · hace ${minutosCuenta} min`}
                </span>
              </div>
              <h2
                id="titulo-precuenta-pedida"
                className="font-serif text-xl sm:text-2xl text-[#FFF9F0] tracking-tight truncate"
              >
                Mesa {data?.mesa_numero ?? ''}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {data && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-200">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <User className="w-3.5 h-3.5 text-[#D5A06F]" />
                  {data.mozo_nombre}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Users className="w-3.5 h-3.5 text-[#D5A06F]" />
                  {data.comensales} pax
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#D5A06F]" />
                  {data.minutos_en_mesa} min en mesa
                </span>
                {esDividida && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <Layers className="w-3.5 h-3.5 text-[#D5A06F]" />
                    {subcuentas.length} comprobantes
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar precuenta"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A06F]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {hayPlatosPorServir && data && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 sm:px-5 py-2.5 text-amber-100 text-xs sm:text-sm flex items-start gap-2 shrink-0">
            <ChefHat className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Hay platos sin servir.</strong>{' '}
              {data.alerta_cocina || 'Caja no podrá cerrar la cuenta hasta que todo esté servido o anulado.'}
            </span>
          </div>
        )}

        <main className="p-4 sm:p-6 overflow-y-auto flex-1">
          {cargando ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-3">
              <Loader2 className="w-9 h-9 text-[#D5A06F] animate-spin" />
              <p className="text-sm">Cargando la precuenta de la mesa...</p>
            </div>
          ) : error || !data ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="text-sm text-rose-200">{error || 'No se pudo obtener la precuenta.'}</p>
            </div>
          ) : esDividida ? (
            <VistaCuentaDividida data={data} />
          ) : (
            <VistaCuentaUnica data={data} />
          )}
        </main>

        <footer className="px-4 sm:px-5 py-3.5 border-t border-[#D5A06F]/20 bg-[#0B2340] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
          {onReabrirCuenta ? (
            <button
              type="button"
              onClick={() => onReabrirCuenta(mesaId)}
              className="min-h-[44px] px-4 rounded-xl bg-[#F4D7B0] hover:bg-[#ecc89a] text-[#0B2340] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A06F]"
            >
              <RotateCcw className="w-4 h-4" />
              Reabrir cuenta para modificar
            </button>
          ) : (
            <span className="text-xs text-slate-400">Vista de solo lectura</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 rounded-xl bg-[#FFF9F0] hover:bg-white text-[#0B2340] font-bold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A06F]"
          >
            Volver al salón
          </button>
        </footer>
      </div>
    </div>
  );
};
