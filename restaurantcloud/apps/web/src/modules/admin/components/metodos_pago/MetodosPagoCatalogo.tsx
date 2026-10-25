import React from 'react';
import { Banknote, CreditCard, Smartphone, Building2, Minus, Plus, Save, Settings, type LucideIcon } from 'lucide-react';
import { MetodoPagoLocalDTO, CodigoMetodoPagoLocal } from '@/types/admin';
import { Button } from '@/components/ui';
import { cn } from '@/shared/utils';

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

/** Color propio de cada método: verde efectivo, azul tarjeta, morado Yape/Plin, gris transferencia. */
const ESTILO: Record<CodigoMetodoPagoLocal, { nombre: string; detalle: string; etiqueta: string; icono: LucideIcon; caja: string; tag: string; switchOn: string; foco: string }> = {
  efectivo: {
    nombre: 'Efectivo',
    detalle: 'Fondo de caja y vuelto en salón.',
    etiqueta: 'Obligatorio',
    icono: Banknote,
    caja: 'bg-emerald-100 text-emerald-700',
    tag: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    switchOn: 'bg-emerald-600',
    foco: 'focus-visible:ring-emerald-500',
  },
  tarjeta: {
    nombre: 'Tarjeta (POS)',
    detalle: 'Débito y crédito en terminal física.',
    etiqueta: 'Niubiz / Izipay',
    icono: CreditCard,
    caja: 'bg-blue-100 text-blue-700',
    tag: 'bg-blue-50 text-blue-700 border-blue-200',
    switchOn: 'bg-blue-600',
    foco: 'focus-visible:ring-blue-500',
  },
  billetera_digital: {
    nombre: 'Yape / Plin',
    detalle: 'Cobro con QR o al celular del local.',
    etiqueta: 'QR',
    icono: Smartphone,
    caja: 'bg-purple-100 text-purple-700',
    tag: 'bg-purple-50 text-purple-700 border-purple-200',
    switchOn: 'bg-purple-600',
    foco: 'focus-visible:ring-purple-500',
  },
  transferencia: {
    nombre: 'Transferencia bancaria',
    detalle: 'Abonos a la cuenta de la empresa.',
    etiqueta: 'Eventos / Reservas',
    icono: Building2,
    caja: 'bg-tinta-200 text-tinta-700',
    tag: 'bg-tinta-100 text-tinta-600 border-tinta-200',
    switchOn: 'bg-tinta-700',
    foco: 'focus-visible:ring-tinta-500',
  },
};

const ORDEN: CodigoMetodoPagoLocal[] = ['efectivo', 'tarjeta', 'billetera_digital', 'transferencia'];

const Interruptor: React.FC<{ activo: boolean; etiqueta: string; colorOn: string; foco: string; onCambiar: () => void }> = ({
  activo,
  etiqueta,
  colorOn,
  foco,
  onCambiar,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={activo}
    aria-label={etiqueta}
    onClick={onCambiar}
    className={cn('min-h-tactil min-w-tactil px-1 flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2', foco)}
  >
    <span className={cn('w-12 h-6 rounded-full transition-colors flex items-center', activo ? colorOn : 'bg-tinta-300')}>
      <span className={cn('w-4 h-4 rounded-full bg-white shadow-md transition-transform', activo ? 'translate-x-7' : 'translate-x-1')} />
    </span>
  </button>
);

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
  const ajustarComision = (m: MetodoPagoLocalDTO, delta: number) => {
    const nuevo = Math.min(50.0, Math.max(0.0, Math.round((m.comision_porcentaje + delta) * 100) / 100));
    onCambiarComision(m.codigo, nuevo);
  };

  const handleInputComision = (codigo: CodigoMetodoPagoLocal, valStr: string) => {
    const num = parseFloat(valStr);
    if (isNaN(num)) return;
    onCambiarComision(codigo, Math.min(50.0, Math.max(0.0, Math.round(num * 100) / 100)));
  };

  // Pie de cada tarjeta según el método: recargo, celular o cuenta
  const pie = (m: MetodoPagoLocalDTO) => {
    const d = m.datos_adicionales;
    switch (m.codigo) {
      case 'efectivo':
        return (
          <div className="flex items-center justify-between gap-2 text-xs text-tinta-600">
            <span>Recargo al cliente</span>
            <span className="font-mono font-bold text-tinta-700 bg-white px-2 py-0.5 rounded border border-tinta-200">0.00%</span>
          </div>
        );
      case 'tarjeta':
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-tinta-700 block">Recargo al cliente</span>
              <span className="text-tinta-500">
                {m.comision_porcentaje > 0 ? `+S/ ${m.comision_porcentaje.toFixed(2)} por cada S/ 100` : 'Sin recargo'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => ajustarComision(m, -0.5)}
                disabled={!m.activo || m.comision_porcentaje <= 0}
                aria-label="Bajar recargo 0.5%"
                className="w-10 h-10 rounded-xl bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-sm transition-all"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  inputMode="decimal"
                  disabled={!m.activo}
                  value={m.comision_porcentaje}
                  onChange={(e) => handleInputComision(m.codigo, e.target.value)}
                  aria-label="Recargo con tarjeta en porcentaje"
                  className="w-20 h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-center text-base md:text-sm font-mono font-bold pr-4 bg-white rounded-xl border border-tinta-300 text-tinta-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-tinta-100"
                />
                <span className="text-xs text-tinta-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">%</span>
              </div>
              <button
                type="button"
                onClick={() => ajustarComision(m, 0.5)}
                disabled={!m.activo || m.comision_porcentaje >= 50}
                aria-label="Subir recargo 0.5%"
                className="w-10 h-10 rounded-xl bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      case 'billetera_digital':
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="text-tinta-700">
                Celular:{' '}
                <span className={cn('font-mono font-bold', d?.telefono ? 'text-purple-700' : 'text-tinta-400')}>
                  {d?.telefono || 'Sin configurar'}
                </span>
              </p>
              {d?.titular && <p className="text-tinta-500 truncate">{d.titular}</p>}
            </div>
            <button
              type="button"
              onClick={onOpenModalBilletera}
              className="min-h-10 ml-auto px-3 rounded-xl bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Settings className="w-4 h-4 text-purple-600" aria-hidden="true" />
              Celular y QR
            </button>
          </div>
        );
      case 'transferencia': {
        const cuenta = d?.cuenta || d?.cci;
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-tinta-700 min-w-0">
              {d?.banco && cuenta ? (
                <>
                  <span className="font-semibold">{d.banco}</span>
                  <span className="font-mono text-tinta-800 ml-1.5 break-all">{cuenta}</span>
                </>
              ) : (
                <span className="text-tinta-400">Sin cuenta registrada</span>
              )}
            </p>
            <button
              type="button"
              onClick={onOpenModalTransferencia}
              className="min-h-10 ml-auto px-3 rounded-xl bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-50 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Settings className="w-4 h-4 text-tinta-500" aria-hidden="true" />
              Cuenta bancaria
            </button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-tinta-200/80 shadow-sm">
      <header className="px-4 sm:px-6 pt-5 pb-4 border-b border-tinta-100">
        <h2 className="text-lg font-serif font-bold text-aurea-navy">Formas de pago</h2>
        <p className="text-xs text-tinta-500 mt-0.5">Debe quedar al menos una activa.</p>
      </header>

      <ul className="p-4 sm:p-6 space-y-3">
        {ORDEN.map((codigo) => {
          const m = metodos.find((x) => x.codigo === codigo);
          if (!m) return null;
          const e = ESTILO[codigo];
          const Icono = e.icono;
          return (
            <li
              key={codigo}
              className={cn(
                'p-4 rounded-xl border transition-all',
                m.activo ? 'bg-tinta-50/70 border-tinta-200' : 'bg-tinta-100/50 border-tinta-200 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', e.caja)} aria-hidden="true">
                    <Icono className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-bold text-tinta-800">{e.nombre}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded border font-semibold', e.tag)}>{e.etiqueta}</span>
                    </p>
                    <p className="text-xs text-tinta-500 mt-0.5">{e.detalle}</p>
                  </div>
                </div>
                <Interruptor
                  activo={m.activo}
                  etiqueta={`${m.activo ? 'Desactivar' : 'Activar'} ${e.nombre}`}
                  colorOn={e.switchOn}
                  foco={e.foco}
                  onCambiar={() => onToggleActivo(codigo)}
                />
              </div>
              <div className="mt-3 pt-3 border-t border-tinta-200/60">{pie(m)}</div>
            </li>
          );
        })}
      </ul>

      {/* Fijo al pie de la pantalla mientras hay cambios sin guardar */}
      <footer
        className={cn(
          'px-4 sm:px-6 py-4 border-t border-tinta-200 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2',
          isDirty && 'sticky bottom-0 bg-white/95 backdrop-blur-sm'
        )}
      >
        {isDirty && (
          <Button variant="outline" onClick={onDescartar} disabled={isGuardando} className="w-full sm:w-auto">
            Descartar
          </Button>
        )}
        <button
          type="button"
          onClick={onGuardar}
          disabled={!isDirty || isGuardando}
          className="w-full sm:w-auto min-h-tactil px-6 rounded-xl bg-aurea-copper text-aurea-navy hover:bg-aurea-copper/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          {isGuardando ? (
            <>
              <span className="w-4 h-4 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              Guardar cambios
            </>
          )}
        </button>
      </footer>
    </section>
  );
};
