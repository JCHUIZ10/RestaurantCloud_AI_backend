import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import type { OrigenPagoSaaS } from '@/types/saasTenants';

interface Paso4PagoBancarioProps {
  montoCobrado: number;
  origenPago: OrigenPagoSaaS;
  numeroOperacion: string;
  fechaOperacion: string;
  notaAdministrativa: string;
  enviarEmail: boolean;
  propietarioEmail: string;
  cargando: boolean;
  onChange: (fields: {
    montoCobrado?: number;
    origenPago?: OrigenPagoSaaS;
    numeroOperacion?: string;
    fechaOperacion?: string;
    notaAdministrativa?: string;
    enviarEmail?: boolean;
  }) => void;
  onAnterior: () => void;
  onSubmit: () => Promise<void>;
}

export const Paso4PagoBancario: React.FC<Paso4PagoBancarioProps> = ({
  montoCobrado,
  origenPago,
  numeroOperacion,
  fechaOperacion,
  notaAdministrativa,
  enviarEmail,
  propietarioEmail,
  cargando,
  onChange,
  onAnterior,
  onSubmit,
}) => {
  const esValido =
    montoCobrado > 0 &&
    numeroOperacion.trim().length >= 4 &&
    fechaOperacion.trim().length >= 8 &&
    notaAdministrativa.trim().length >= 10;

  return (
    <div className="bg-white rounded-3xl border border-aurea-copper/25 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-aurea-copper/15">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy">
            4. Liquidación Contable y Asentamiento de Pago Verificado
          </h2>
          <p className="text-xs sm:text-sm text-aurea-navy/70">
            Registro estricto e inmutable en la tabla <code className="font-mono font-bold text-aurea-navy">pago</code> con estado <span className="font-semibold text-emerald-700">'exitoso'</span> (cero altas ficticias).
          </p>
        </div>
      </div>

      {/* Formulario de Pago */}
      <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-300 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monto */}
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
              Monto Cobrado (PEN): *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-emerald-900">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={montoCobrado}
                onChange={(e) => onChange({ montoCobrado: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-emerald-300 font-mono text-base font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {montoCobrado <= 0 && (
              <span className="text-[11px] text-rose-700 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>El monto debe ser mayor a cero. No se admiten altas sin respaldo económico.</span>
              </span>
            )}
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
              Medio de Pago Bancario: *
            </label>
            <select
              value={origenPago}
              onChange={(e) => onChange({ origenPago: e.target.value as OrigenPagoSaaS })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="transferencia_bancaria">Transferencia Bancaria BCP</option>
              <option value="deposito_bancario">Depósito en Cuenta BBVA / Interbank</option>
              <option value="yape_empresa">Yape Empresa</option>
              <option value="efectivo">Efectivo en Oficina Corporativa</option>
            </select>
          </div>

          {/* N° Operación */}
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
              N° de Operación / Constancia Bancaria: *
            </label>
            <input
              type="text"
              value={numeroOperacion}
              onChange={(e) => onChange({ numeroOperacion: e.target.value })}
              placeholder="ej. OP-90481239-BCP"
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-300 font-mono text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-[10px] text-emerald-900/60 block mt-0.5">
              Identificador único de constancia bancaria emitido por la entidad
            </span>
          </div>

          {/* Fecha Operación */}
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
              Fecha de la Operación: *
            </label>
            <input
              type="date"
              value={fechaOperacion}
              onChange={(e) => onChange({ fechaOperacion: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-300 font-mono text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Nota Administrativa */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1">
              Observaciones / Nota de Respaldo de Tesorería: *
            </label>
            <textarea
              rows={2}
              value={notaAdministrativa}
              onChange={(e) => onChange({ notaAdministrativa: e.target.value })}
              placeholder="Detalle de confirmación contable, analista que visó el abono o voucher..."
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-[10px] text-emerald-900/60 block mt-0.5">
              Mínimo 10 caracteres. Se guardará inmutablemente en <code className="font-mono">pago.nota</code>
            </span>
          </div>
        </div>
      </div>

      {/* Checkbox de Envío de Correo */}
      <div className="p-4 rounded-2xl bg-aurea-ivory border border-aurea-copper/25 flex items-start gap-3">
        <input
          type="checkbox"
          id="onboarding-send-mail"
          checked={enviarEmail}
          onChange={(e) => onChange({ enviarEmail: e.target.checked })}
          className="w-4 h-4 text-aurea-navy rounded border-aurea-copper focus:ring-aurea-copper mt-0.5"
        />
        <label htmlFor="onboarding-send-mail" className="text-xs text-aurea-navy cursor-pointer">
          <strong className="block text-aurea-navy">Despachar correo automático de bienvenida al titular:</strong>
          <span>
            El propietario ({propietarioEmail}) recibirá un capability token de un solo uso con 72h
            de vigencia para fijar su contraseña e iniciar la configuración de la carta.
          </span>
        </label>
      </div>

      {/* Botones de Navegación */}
      <div className="pt-4 border-t border-aurea-copper/15 flex items-center justify-between">
        <button
          type="button"
          onClick={onAnterior}
          disabled={cargando}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-aurea-navy/80 border border-aurea-copper/30 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Paso 3</span>
        </button>

        <button
          type="button"
          disabled={!esValido || cargando}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-700 text-white hover:bg-emerald-800 shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <span>Asentando Transacción Atómica...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>Confirmar Pago y Activar Empresa</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
