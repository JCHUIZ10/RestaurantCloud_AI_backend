import React, { useId, useState } from 'react';
import { AlertCircle, Banknote, CalendarDays, CheckCircle2 } from 'lucide-react';
import { FichaCompraResumenDTO, MetodoPagoRealizadoCompra, OrigenEfectivoCompra } from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { Button, Modal } from '@/components/ui';
import { cn, hoyServidorStr, mensajeDeErrorApi } from '@/shared/utils';
import { formatoFecha, identificadorComprobante, soles } from './formatoCompra';

interface ModalPagarCompraCreditoProps {
  ficha: FichaCompraResumenDTO | null;
  abierto: boolean;
  onCerrar: () => void;
  onPagada: (ficha: FichaCompraResumenDTO) => void;
}

const CLASE_CONTROL =
  'w-full px-3.5 py-2.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy focus:outline-none focus:border-aurea-copper disabled:opacity-60';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';

const FORMAS_PAGO: ReadonlyArray<{ valor: MetodoPagoRealizadoCompra; etiqueta: string }> = [
  { valor: 'transferencia', etiqueta: 'Transferencia / Yape / Plin' },
  { valor: 'tarjeta_debito', etiqueta: 'Tarjeta de débito' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
];

/**
 * Registra el pago completo de una compra a crédito del proveedor. El egreso cuenta en el flujo de caja en la
 * fecha de pago elegida; si el efectivo sale de la gaveta del turno, la fecha es hoy y se descuenta del cajero.
 */
export const ModalPagarCompraCredito: React.FC<ModalPagarCompraCreditoProps> = ({ ficha, abierto, onCerrar, onPagada }) => {
  const idForm = useId();
  const [metodo, setMetodo] = useState<MetodoPagoRealizadoCompra>('transferencia');
  const [origenEfectivo, setOrigenEfectivo] = useState<OrigenEfectivoCompra | ''>('');
  const [fechaPago, setFechaPago] = useState(hoyServidorStr);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El formulario se limpia al cerrarse, así cada apertura nace con valores nuevos
  const cerrar = () => {
    setMetodo('transferencia');
    setOrigenEfectivo('');
    setFechaPago(hoyServidorStr());
    setError(null);
    onCerrar();
  };

  const salePorGaveta = metodo === 'efectivo' && origenEfectivo === 'gaveta_turno';
  const fechaEfectiva = salePorGaveta ? hoyServidorStr() : fechaPago;
  const emision = ficha?.fecha_emision ?? '';
  const fechaValida = fechaEfectiva !== '' && fechaEfectiva <= hoyServidorStr() && (emision === '' || fechaEfectiva >= emision);
  const formularioValido = fechaValida && (metodo !== 'efectivo' || origenEfectivo !== '');

  const handlePagar = async () => {
    if (!ficha || !formularioValido || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await adminService.pagarFichaCompra(ficha.id, {
        metodo,
        origen_efectivo: metodo === 'efectivo' && origenEfectivo !== '' ? origenEfectivo : undefined,
        fecha_pago: fechaEfectiva,
      });
      if (res.exito && res.datos) {
        onPagada(res.datos);
        cerrar();
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo registrar el pago de la compra.');
      }
    } catch (err) {
      setError(mensajeDeErrorApi(err, 'Ocurrió un error inesperado al registrar el pago.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto && ficha !== null}
      onCerrar={guardando ? () => undefined : cerrar}
      tamano="md"
      icono={Banknote}
      titulo="Marcar compra como pagada"
      pie={
        <>
          <Button variant="outline" onClick={cerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handlePagar} disabled={!formularioValido || guardando} leftIcon={<CheckCircle2 className="w-4 h-4" aria-hidden="true" />}>
            {guardando ? 'Registrando…' : `Pagar ${ficha ? soles(ficha.total) : ''}`}
          </Button>
        </>
      }
    >
      {ficha && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-aurea-ivory to-aurea-champagne/40 border border-aurea-champagne/70 text-sm text-aurea-navy">
            <p className="font-semibold">
              {identificadorComprobante(ficha)} · {ficha.proveedor_nombre}
            </p>
            <p className="text-xs text-aurea-navy/70">
              Emitida el {formatoFecha(ficha.fecha_emision)} · Total a pagar {soles(ficha.total)} (pago completo)
            </p>
          </div>

          <div>
            <label htmlFor={`${idForm}-metodo`} className={CLASE_ROTULO}>
              ¿Con qué se pagó?
            </label>
            <select id={`${idForm}-metodo`} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagoRealizadoCompra)} className={CLASE_CONTROL} disabled={guardando}>
              {FORMAS_PAGO.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {metodo === 'efectivo' && (
            <fieldset className="space-y-2">
              <legend className={CLASE_ROTULO}>¿De dónde sale el efectivo?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { valor: 'gaveta_turno', titulo: 'De la gaveta del turno', detalle: 'Se descuenta del efectivo esperado del cajero. Requiere un turno abierto; la fecha es hoy.' },
                    { valor: 'caja_chica', titulo: 'De una caja chica fuera del POS', detalle: 'No toca la gaveta del cajero.' },
                  ] as const
                ).map((opcion) => (
                  <label
                    key={opcion.valor}
                    className={cn(
                      'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors',
                      origenEfectivo === opcion.valor ? 'border-aurea-copper bg-aurea-champagne/30' : 'border-aurea-champagne/70 bg-white hover:bg-aurea-ivory/60'
                    )}
                  >
                    <input
                      type="radio"
                      name={`${idForm}-origen`}
                      value={opcion.valor}
                      checked={origenEfectivo === opcion.valor}
                      onChange={() => setOrigenEfectivo(opcion.valor)}
                      className="mt-0.5 accent-aurea-copper"
                      disabled={guardando}
                    />
                    <span className="text-sm text-aurea-navy">
                      <span className="font-semibold block">{opcion.titulo}</span>
                      <span className="text-xs text-aurea-navy/70">{opcion.detalle}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor={`${idForm}-fecha`} className={cn(CLASE_ROTULO, 'flex items-center gap-1.5')}>
              <CalendarDays className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
              Fecha de pago
            </label>
            <input
              id={`${idForm}-fecha`}
              type="date"
              value={fechaEfectiva}
              min={emision || undefined}
              max={hoyServidorStr()}
              onChange={(e) => setFechaPago(e.target.value)}
              disabled={guardando || salePorGaveta}
              className={CLASE_CONTROL}
            />
            <p className="mt-1 text-xs text-aurea-navy/60">
              {salePorGaveta
                ? 'Con efectivo de la gaveta la fecha es hoy: el dinero sale de la caja en este momento.'
                : 'El egreso cuenta en el flujo de caja en esta fecha (hasta hoy y desde la emisión de la compra).'}
            </p>
          </div>

          {error && (
            <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};
