import React, { useState } from 'react';
import { Calculator, QrCode } from 'lucide-react';
import { MetodoPagoLocalDTO, CodigoMetodoPagoLocal } from '@/types/admin';
import { cn } from '@/shared/utils';

interface MetodosPagoSimuladorProps {
  metodos: MetodoPagoLocalDTO[];
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Espejo de la botonera de caja: muestra cuánto paga el cliente con cada forma de pago. */
export const MetodosPagoSimulador: React.FC<MetodosPagoSimuladorProps> = ({ metodos }) => {
  const [montoConsumo, setMontoConsumo] = useState<number>(100.0);

  const metodosActivos = metodos.filter((m) => m.activo);
  const metodoInicial = metodosActivos.find((m) => m.codigo === 'tarjeta') || metodosActivos[0] || metodos[0];
  const [metodoSeleccionadoCodigo, setMetodoSeleccionadoCodigo] = useState<CodigoMetodoPagoLocal>(
    metodoInicial?.codigo || 'tarjeta'
  );

  const metodoSeleccionado = metodos.find((m) => m.codigo === metodoSeleccionadoCodigo) || metodos[0] || null;

  const consumoValido = Math.max(0, montoConsumo || 0);
  const comisionPorc = metodoSeleccionado?.activo ? metodoSeleccionado.comision_porcentaje : 0.0;
  const montoRecargo = redondear((consumoValido * comisionPorc) / 100);
  const totalFinal = redondear(consumoValido + montoRecargo);
  const baseImponible = redondear(totalFinal / 1.18);
  const igv = redondear(totalFinal - baseImponible);

  if (!metodos.length || !metodoSeleccionado) {
    return (
      <div className="bg-tinta-900 rounded-2xl border border-tinta-700/80 shadow-xl p-8 text-tinta-100 flex flex-col items-center justify-center text-center gap-3 min-h-[20rem]">
        <span className="w-12 h-12 rounded-2xl bg-tinta-800 text-aurea-copper border border-tinta-700 flex items-center justify-center" aria-hidden="true">
          <Calculator className="w-6 h-6" />
        </span>
        <h3 className="font-bold text-base text-tinta-200">Sin formas de pago</h3>
        <p className="text-sm text-tinta-400 max-w-sm">Activa al menos una para ver cómo se cobra en caja.</p>
      </div>
    );
  }

  const d = metodoSeleccionado.datos_adicionales;

  return (
    <section className="bg-tinta-900 rounded-2xl border border-tinta-700/80 shadow-xl p-4 sm:p-6 text-tinta-100 space-y-5">
      <header className="flex items-center gap-2.5 pb-3 border-b border-tinta-800">
        <span className="w-9 h-9 rounded-lg bg-aurea-copper/20 text-aurea-copper border border-aurea-copper/30 flex items-center justify-center shrink-0" aria-hidden="true">
          <Calculator className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-tinta-100">Simulador de cobro</h2>
          <p className="text-xs text-tinta-400">Así se ve en caja y en la precuenta con tu configuración.</p>
        </div>
      </header>

      <div className="p-4 rounded-xl bg-tinta-950/70 border border-tinta-800 space-y-2.5">
        <label htmlFor="sim-monto" className="block text-xs font-semibold text-tinta-300">
          Consumo de prueba
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-tinta-500 pointer-events-none">S/</span>
          <input
            id="sim-monto"
            type="number"
            step="5"
            min="1"
            inputMode="decimal"
            value={montoConsumo}
            onChange={(e) => setMontoConsumo(parseFloat(e.target.value) || 0)}
            className="w-full min-h-tactil pl-10 pr-4 bg-tinta-900 border border-tinta-700 rounded-xl text-tinta-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-aurea-copper"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[50, 100, 200, 350].map((monto) => (
            <button
              key={monto}
              type="button"
              onClick={() => setMontoConsumo(monto)}
              className={cn(
                'min-h-9 px-3 rounded-lg text-xs font-mono transition-all border',
                montoConsumo === monto
                  ? 'bg-aurea-copper text-aurea-navy font-bold border-aurea-copper'
                  : 'bg-tinta-800 text-tinta-300 border-tinta-700 hover:bg-tinta-700'
              )}
            >
              S/ {monto}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wider text-tinta-400 mb-2">Forma de pago</legend>
        {metodos.map((m) => {
          const isSelected = metodoSeleccionadoCodigo === m.codigo;
          const recargoOpcion = m.activo ? redondear((consumoValido * m.comision_porcentaje) / 100) : 0;
          const totalOpcion = redondear(consumoValido + recargoOpcion);

          return (
            <button
              key={m.codigo}
              type="button"
              aria-pressed={isSelected}
              disabled={!m.activo}
              onClick={() => setMetodoSeleccionadoCodigo(m.codigo)}
              className={cn(
                'w-full min-h-tactil p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all',
                !m.activo
                  ? 'opacity-40 bg-tinta-950/40 border-tinta-800 cursor-not-allowed'
                  : isSelected
                    ? 'bg-tinta-800 border-aurea-copper shadow-md ring-1 ring-aurea-copper/40'
                    : 'bg-tinta-950/70 border-tinta-800 hover:bg-tinta-800/60'
              )}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                    isSelected ? 'border-aurea-copper bg-aurea-copper' : 'border-tinta-600'
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-tinta-900" />}
                </span>
                <span className="min-w-0">
                  <span className="text-sm font-bold text-tinta-200 block truncate">
                    {m.nombre}
                    {!m.activo && <span className="text-xs text-tinta-500 font-normal ml-1.5">(inactivo)</span>}
                  </span>
                  <span className="text-xs text-tinta-400 font-mono">
                    {m.comision_porcentaje > 0 ? `+${m.comision_porcentaje.toFixed(2)}% (S/ ${recargoOpcion.toFixed(2)})` : 'Sin recargo'}
                  </span>
                </span>
              </span>
              <span className="text-sm font-mono font-bold text-tinta-100 shrink-0">S/ {totalOpcion.toFixed(2)}</span>
            </button>
          );
        })}
      </fieldset>

      {/* Precuenta térmica */}
      <div className="bg-white rounded-xl p-4 text-tinta-900 font-mono text-xs border border-tinta-300 shadow-lg space-y-1.5">
        <p className="text-center pb-2 mb-1 border-b border-dashed border-tinta-300 font-sans font-bold text-sm uppercase tracking-wider">Precuenta</p>
        <div className="flex justify-between text-tinta-600">
          <span>Consumo</span>
          <span>S/ {consumoValido.toFixed(2)}</span>
        </div>
        {montoRecargo > 0 && (
          <div className="flex justify-between gap-2 text-amber-800 font-semibold bg-amber-50 px-1 py-0.5 rounded">
            <span>Recargo {comisionPorc}%</span>
            <span>+ S/ {montoRecargo.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-tinta-500">
          <span>Op. gravada</span>
          <span>S/ {baseImponible.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-tinta-500">
          <span>IGV 18%</span>
          <span>S/ {igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-baseline text-sm font-bold pt-1.5 border-t border-tinta-900">
          <span>TOTAL</span>
          <span className="text-base">S/ {totalFinal.toFixed(2)}</span>
        </div>

        {metodoSeleccionado.codigo === 'billetera_digital' && (
          <div className="mt-2 pt-2 border-t border-dashed border-tinta-300 text-center space-y-1 bg-purple-50/70 p-2 rounded-lg">
            <p className="text-xs font-bold text-purple-900 uppercase">Yape / Plin</p>
            <span className="w-16 h-16 mx-auto bg-white border border-purple-200 rounded flex items-center justify-center shadow-sm" aria-hidden="true">
              <QrCode className="w-12 h-12 text-purple-800" />
            </span>
            <p className="font-bold text-purple-950">{d?.telefono || 'Celular sin configurar'}</p>
            {d?.titular && <p className="text-purple-700">{d.titular}</p>}
          </div>
        )}

        {metodoSeleccionado.codigo === 'transferencia' && (
          <div className="mt-2 pt-2 border-t border-dashed border-tinta-300 text-tinta-700 space-y-0.5 bg-tinta-100 p-2 rounded-lg break-all">
            {d?.banco ? (
              <>
                <p className="font-bold text-tinta-900">{d.banco}</p>
                {d.cuenta && <p>Cta: {d.cuenta}</p>}
                {d.cci && <p>CCI: {d.cci}</p>}
              </>
            ) : (
              <p>Cuenta bancaria sin registrar</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
