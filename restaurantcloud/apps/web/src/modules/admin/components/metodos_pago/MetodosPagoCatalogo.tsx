import React from 'react';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Minus,
  Plus,
  Save,
  Settings,
} from 'lucide-react';
import { MetodoPagoLocalDTO, CodigoMetodoPagoLocal } from '@/types/admin';

interface MetodosPagoCatalogoProps {
  metodos: MetodoPagoLocalDTO[];
  onToggleActivo: (codigo: CodigoMetodoPagoLocal) => void;
  onCambiarComision: (codigo: CodigoMetodoPagoLocal, comision: number) => void;
  onOpenModalBilletera: () => void;
  onOpenModalTransferencia: () => void;
  onGuardar: () => void;
  onDescartar: () => void;
  isDirty: boolean;
  isGuardando: boolean;
}

export const MetodosPagoCatalogo: React.FC<MetodosPagoCatalogoProps> = ({
  metodos,
  onToggleActivo,
  onCambiarComision,
  onOpenModalBilletera,
  onOpenModalTransferencia,
  onGuardar,
  onDescartar,
  isDirty,
  isGuardando,
}) => {
  const getMetodo = (codigo: CodigoMetodoPagoLocal) => metodos.find((m) => m.codigo === codigo);

  const efectivo = getMetodo('efectivo');
  const tarjeta = getMetodo('tarjeta');
  const billetera = getMetodo('billetera_digital');
  const transferencia = getMetodo('transferencia');

  const ajustarComision = (codigo: CodigoMetodoPagoLocal, delta: number) => {
    const m = getMetodo(codigo);
    if (!m) return;
    const actual = m.comision_porcentaje;
    const nuevo = Math.min(50.0, Math.max(0.0, Math.round((actual + delta) * 100) / 100));
    onCambiarComision(codigo, nuevo);
  };

  const handleInputComision = (codigo: CodigoMetodoPagoLocal, valStr: string) => {
    const num = parseFloat(valStr);
    if (isNaN(num)) return;
    const acotado = Math.min(50.0, Math.max(0.0, Math.round(num * 100) / 100));
    onCambiarComision(codigo, acotado);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Cabecera del Catálogo */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-serif font-bold text-aurea-navy flex items-center gap-2">
            <span>💳 Catálogo de Formas de Pago</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura qué métodos están disponibles en el POS del cajero y los recargos aplicados al comensal.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Regla: Min 1 Activo
        </span>
      </div>

      {/* Lista de Métodos */}
      <div className="space-y-4">
        {/* 1. EFECTIVO (CASH) */}
        {efectivo && (
          <div
            className={`p-4 rounded-xl border transition-all ${
              efectivo.activo ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Efectivo (Cash)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Legal Obligatorio
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Medio de curso legal obligatorio. Fondo de caja y vuelto en salón.
                  </p>
                </div>
              </div>

              {/* Switch de activación */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={efectivo.activo}
                  onClick={() => onToggleActivo('efectivo')}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    efectivo.activo ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-md ${
                      efectivo.activo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span className="text-[11px] text-slate-500">Recargo al comensal:</span>
              <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                0.00% (Fijo por ley)
              </span>
            </div>
          </div>
        )}

        {/* 2. TARJETA DÉBITO / CRÉDITO (POS) */}
        {tarjeta && (
          <div
            className={`p-4 rounded-xl border transition-all ${
              tarjeta.activo ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Tarjeta Débito / Crédito (POS)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Niubiz / Izipay
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Terminales POS físicas. Permite trasladar el costo de pasarela al comensal.
                  </p>
                </div>
              </div>

              {/* Switch de activación */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={tarjeta.activo}
                  onClick={() => onToggleActivo('tarjeta')}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tarjeta.activo ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-md ${
                      tarjeta.activo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Stepper de Comisión */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block">Comisión trasladada al comensal:</span>
                <span className="text-[11px] text-slate-500">
                  {tarjeta.comision_porcentaje > 0
                    ? `+S/ ${(tarjeta.comision_porcentaje).toFixed(2)} por cada S/ 100 de consumo`
                    : 'Sin recargo adicional (0%)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => ajustarComision('tarjeta', -0.5)}
                  disabled={!tarjeta.activo || tarjeta.comision_porcentaje <= 0}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-sm shadow-sm transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    inputMode="decimal"
                    disabled={!tarjeta.activo}
                    value={tarjeta.comision_porcentaje}
                    onChange={(e) => handleInputComision('tarjeta', e.target.value)}
                    className="w-20 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-center text-sm font-mono font-bold py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  />
                  <span className="text-[11px] text-slate-400 absolute right-2 top-2.5 pointer-events-none">%</span>
                </div>

                <button
                  type="button"
                  onClick={() => ajustarComision('tarjeta', 0.5)}
                  disabled={!tarjeta.activo || tarjeta.comision_porcentaje >= 50}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-sm shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. BILLETERA DIGITAL (YAPE / PLIN) */}
        {billetera && (
          <div
            className={`p-4 rounded-xl border transition-all ${
              billetera.activo ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Billetera Digital (Yape / Plin)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Móvil QR
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cobros rápidos vía código QR interoperable y número telefónico.
                  </p>
                </div>
              </div>

              {/* Switch de activación */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={billetera.activo}
                  onClick={() => onToggleActivo('billetera_digital')}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    billetera.activo ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-md ${
                      billetera.activo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Datos configurados y botón de edición */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="font-semibold">Celular de Sede:</span>
                  <span className="font-mono text-purple-700 font-bold">
                    {billetera.datos_adicionales?.telefono || 'No configurado'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Titular: {billetera.datos_adicionales?.titular || 'Sin titular'}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={onOpenModalBilletera}
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-600" />
                  <span>Configurar Celular & QR</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRANSFERENCIA BANCARIA */}
        {transferencia && (
          <div
            className={`p-4 rounded-xl border transition-all ${
              transferencia.activo ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Transferencia Bancaria</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Eventos / Reservas
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Abonos bancarios a cuenta corriente de la empresa.
                  </p>
                </div>
              </div>

              {/* Switch de activación */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={transferencia.activo}
                  onClick={() => onToggleActivo('transferencia')}
                  className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                    transferencia.activo ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-md ${
                      transferencia.activo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Datos configurados */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="text-slate-700">
                  <span className="font-semibold">Banco:</span> {transferencia.datos_adicionales?.banco || 'BCP'} •
                  <span className="font-mono text-slate-800 ml-1">
                    {transferencia.datos_adicionales?.cuenta || '191-88421033-0-45'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={onOpenModalTransferencia}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cuentas Bancarias</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER DE ACCIONES (SIN BOTÓN DE RESTAURAR VALORES, CONFORME A INSTRUCCIÓN) */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
        {isDirty && (
          <button
            type="button"
            onClick={onDescartar}
            disabled={isGuardando}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 text-xs font-semibold transition-all shadow-sm"
          >
            Descartar Cambios
          </button>
        )}

        <button
          type="button"
          onClick={onGuardar}
          disabled={!isDirty || isGuardando}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-aurea-copper text-aurea-navy hover:bg-aurea-copper/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          {isGuardando ? (
            <>
              <span className="w-4 h-4 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin"></span>
              <span>Guardando y transmitiendo SSE...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-aurea-navy" />
              <span>Guardar Parámetros de Pago</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
