import React, { useState } from 'react';
import { Calculator, QrCode } from 'lucide-react';
import { MetodoPagoLocalDTO, CodigoMetodoPagoLocal } from '@/types/admin';

interface MetodosPagoSimuladorProps {
  metodos: MetodoPagoLocalDTO[];
  sedeNombre?: string;
}

export const MetodosPagoSimulador: React.FC<MetodosPagoSimuladorProps> = ({
  metodos,
  sedeNombre = 'Miraflores (Principal)',
}) => {
  // Monto de consumo de prueba
  const [montoConsumo, setMontoConsumo] = useState<number>(100.0);

  // Método de pago seleccionado en la simulación
  const metodosActivos = metodos.filter((m) => m.activo);
  const metodoInicial = metodosActivos.find((m) => m.codigo === 'tarjeta') || metodosActivos[0] || metodos[0];
  const [metodoSeleccionadoCodigo, setMetodoSeleccionadoCodigo] = useState<CodigoMetodoPagoLocal>(
    metodoInicial?.codigo || 'tarjeta'
  );

  const metodoSeleccionado =
    metodos.find((m) => m.codigo === metodoSeleccionadoCodigo) || metodos[0] || null;

  // Cálculos financieros SUNAT
  const consumoValido = Math.max(0, montoConsumo || 0);
  const comisionPorc = metodoSeleccionado?.activo ? metodoSeleccionado.comision_porcentaje : 0.0;
  const montoRecargo = Math.round(((consumoValido * comisionPorc) / 100) * 100) / 100;
  const totalFinal = Math.round((consumoValido + montoRecargo) * 100) / 100;

  // Desglose IGV 18% SUNAT
  const baseImponible = Math.round((totalFinal / 1.18) * 100) / 100;
  const igv = Math.round((totalFinal - baseImponible) * 100) / 100;

  if (!metodos.length || !metodoSeleccionado) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-xl p-8 text-slate-100 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-aurea-copper border border-slate-700 flex items-center justify-center">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-200">Simulador de Cobro en Espera</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          No hay métodos de pago registrados en esta sede. Habilita o aprovisiona al menos una vía de cobro para proyectar los cálculos SUNAT y la precuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-xl p-6 text-slate-100 flex flex-col justify-between space-y-6">
      {/* Cabecera del Simulador */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aurea-copper/20 text-aurea-copper border border-aurea-copper/30 flex items-center justify-center font-bold text-sm">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                Simulador de Cobro & Precuenta
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Espejo POS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Así calcula el sistema los recargos en caja y en la precuenta digital de los mozos.
              </p>
            </div>
          </div>
        </div>

        {/* Control de Monto de Consumo Simulado */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Monto de Consumo de Prueba:</span>
            <span className="font-mono text-aurea-copper font-bold text-sm">PEN S/ {consumoValido.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-500">PEN S/</span>
              <input
                type="number"
                step="5"
                min="1"
                value={montoConsumo}
                onChange={(e) => setMontoConsumo(parseFloat(e.target.value) || 0)}
                className="w-full pl-20 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-aurea-copper"
              />
            </div>
          </div>

          {/* Botones de montos rápidos */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {[50, 100, 200, 350].map((monto) => (
              <button
                key={monto}
                type="button"
                onClick={() => setMontoConsumo(monto)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                  montoConsumo === monto
                    ? 'bg-aurea-copper text-aurea-navy font-bold border-aurea-copper'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                S/ {monto}.00
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selector de Medios de Pago en Caja (Simulación de Botonera) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Botonera de Cobro del Cajero (CU-CAJA-02)
        </span>

        <div className="space-y-2">
          {metodos.map((m) => {
            const isSelected = metodoSeleccionadoCodigo === m.codigo;
            const recargoOpcion = m.activo ? Math.round(((consumoValido * m.comision_porcentaje) / 100) * 100) / 100 : 0;
            const totalOpcion = Math.round((consumoValido + recargoOpcion) * 100) / 100;

            return (
              <button
                key={m.codigo}
                type="button"
                disabled={!m.activo}
                onClick={() => setMetodoSeleccionadoCodigo(m.codigo)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  !m.activo
                    ? 'opacity-40 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                    : isSelected
                    ? 'bg-slate-800 border-aurea-copper shadow-md ring-1 ring-aurea-copper/40'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-aurea-copper bg-aurea-copper' : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {m.nombre}
                      {!m.activo && <span className="text-[10px] text-slate-500 font-normal ml-1.5">(Inactivo)</span>}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {m.comision_porcentaje > 0 ? `Recargo ${m.comision_porcentaje.toFixed(2)}% (+S/ ${recargoOpcion.toFixed(2)})` : 'Sin recargo (0.00%)'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-100">
                    S/ {totalOpcion.toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket de Precuenta de Salón Simulado (Estilo Térmico Blanco) */}
      <div className="bg-white rounded-xl p-4 text-slate-900 font-mono text-xs border border-slate-300 shadow-lg space-y-2.5">
        <div className="text-center pb-2 border-b border-dashed border-slate-300">
          <span className="font-bold text-sm uppercase block tracking-wider font-sans">RESTAURANTCLOUD AI</span>
          <span className="text-[10px] text-slate-600 block">SEDE: {sedeNombre.toUpperCase()}</span>
          <span className="text-[10px] text-slate-500 block">RUC: 20601234567 • PRECUENTA DE SALÓN</span>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>MESA: 04</span>
            <span>MOZO: Carlos M.</span>
            <span>14/10/2026 21:45</span>
          </div>
        </div>

        {/* Detalle de ítems de prueba */}
        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
          <div className="flex justify-between">
            <span>1x Lomo Saltado Criollo</span>
            <span>S/ 48.00</span>
          </div>
          <div className="flex justify-between">
            <span>1x Causa de Pulpo al Olivo</span>
            <span>S/ 36.00</span>
          </div>
          <div className="flex justify-between">
            <span>2x Chicha Morada Jarra 1L</span>
            <span>S/ 16.00</span>
          </div>
        </div>

        {/* Fórmulas SUNAT y desglose contable */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span>CONSUMO BRUTO:</span>
            <span>S/ {consumoValido.toFixed(2)}</span>
          </div>

          {montoRecargo > 0 && (
            <div className="flex justify-between text-amber-800 font-semibold bg-amber-50 px-1 py-0.5 rounded">
              <span>RECARGO {metodoSeleccionado.nombre.toUpperCase()} ({comisionPorc}%):</span>
              <span>+ S/ {montoRecargo.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500 text-[10px]">
            <span>OP. GRAVADA (Base):</span>
            <span>S/ {baseImponible.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[10px]">
            <span>IGV (18%):</span>
            <span>S/ {igv.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-slate-900 text-slate-900">
            <span>TOTAL A PAGAR:</span>
            <span className="text-base">S/ {totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Proyección adicional si es Billetera Digital (QR y Teléfono) */}
        {metodoSeleccionado.codigo === 'billetera_digital' && (
          <div className="pt-2 border-t border-dashed border-slate-300 text-center space-y-1 bg-purple-50/70 p-2 rounded-lg">
            <span className="text-[10px] font-bold text-purple-900 block uppercase">
              📱 Pago Rápido Yape / Plin
            </span>
            <div className="w-16 h-16 mx-auto bg-white border border-purple-200 rounded flex items-center justify-center p-1 shadow-sm">
              <QrCode className="w-12 h-12 text-purple-800" />
            </div>
            <div className="text-[11px] font-bold text-purple-950 font-mono">
              {metodoSeleccionado.datos_adicionales?.telefono || '987 654 321'}
            </div>
            <div className="text-[9px] text-purple-700">
              Titular: {metodoSeleccionado.datos_adicionales?.titular || 'ÁUREA S.A.C.'}
            </div>
          </div>
        )}

        {/* Proyección adicional si es Transferencia Bancaria */}
        {metodoSeleccionado.codigo === 'transferencia' && (
          <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-700 space-y-0.5 bg-slate-100 p-2 rounded-lg">
            <div className="font-bold text-slate-900">CUENTA BANCARIA DE LA EMPRESA:</div>
            <div>Banco: {metodoSeleccionado.datos_adicionales?.banco || 'BCP'}</div>
            <div>Cta: {metodoSeleccionado.datos_adicionales?.cuenta || '191-88421033-0-45'}</div>
            <div>CCI: {metodoSeleccionado.datos_adicionales?.cci || '00219100884210330451'}</div>
          </div>
        )}
      </div>
    </div>
  );
};
