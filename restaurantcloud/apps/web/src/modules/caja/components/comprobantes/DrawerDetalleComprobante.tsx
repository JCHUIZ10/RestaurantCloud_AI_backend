import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Ban, ExternalLink, FileMinus2, Mail, Phone, RotateCcw, X } from 'lucide-react';
import { cn, formatPEN } from '@/shared/utils';
import { useCapaModal } from '@/shared/hooks/useCapaModal';
import { cajaService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import type { ComprobanteDetalleDTO, ComprobanteHistorialItemDTO } from '@/types/caja';
import { EstadoFiscalBadge, MedioPagoChip } from './ComprobanteBadges';
import { etiquetaBotonVer, etiquetaTipo, montoMostrado } from './comprobanteFormato';

interface DrawerDetalleComprobanteProps {
  /** Fila seleccionada del listado; null mantiene el panel cerrado */
  comprobante: ComprobanteHistorialItemDTO | null;
  onCerrar: () => void;
  onVerDocumento: (token?: string | null) => void;
  onAnular: (comprobante: ComprobanteHistorialItemDTO) => void;
  /** Se invoca tras guardar el contacto, para refrescar el listado */
  onContactoActualizado: () => void;
}

const Seccion: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="space-y-2.5">
    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500">{titulo}</h3>
    {children}
  </section>
);

const Fila: React.FC<{ etiqueta: string; valor: React.ReactNode; destacado?: boolean; tono?: string }> = ({
  etiqueta,
  valor,
  destacado,
  tono,
}) => (
  <div className={cn('flex items-baseline justify-between gap-3', destacado && 'pt-2 border-t border-slate-200')}>
    <span className={cn('text-sm', destacado ? 'font-bold text-slate-900' : 'text-slate-600')}>{etiqueta}</span>
    <span className={cn('font-mono text-right', destacado ? 'text-lg font-extrabold text-slate-900' : 'text-sm text-slate-800', tono)}>
      {valor}
    </span>
  </div>
);

interface ContactoFormProps {
  detalle: ComprobanteDetalleDTO;
  onGuardado: (telefono: string, email: string) => void;
}

const ContactoForm: React.FC<ContactoFormProps> = ({ detalle, onGuardado }) => {
  const [telefono, setTelefono] = useState(detalle.telefono_envio ?? '');
  const [email, setEmail] = useState(detalle.email_envio ?? '');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const sinCambios = telefono === (detalle.telefono_envio ?? '') && email === (detalle.email_envio ?? '');

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await cajaService.actualizarContactoComprobante(detalle.id, {
        telefono_envio: telefono.trim(),
        email_envio: email.trim(),
      });
      if (res.exito) {
        setMensaje({ tipo: 'ok', texto: 'Contacto actualizado.' });
        onGuardado(telefono.trim(), email.trim());
      } else {
        setMensaje({ tipo: 'error', texto: res.errores?.[0]?.mensaje || 'No se pudo guardar el contacto.' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeDeErrorApi(err, 'No se pudo guardar el contacto.') });
    } finally {
      setGuardando(false);
    }
  };

  const claseInput =
    'w-full min-h-tactil pl-9 pr-3 text-sm rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50';

  return (
    <form onSubmit={guardar} className="space-y-2.5">
      <label className="relative block">
        <span className="sr-only">Teléfono o WhatsApp</span>
        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono / WhatsApp"
          maxLength={20}
          className={claseInput}
        />
      </label>
      <label className="relative block">
        <span className="sr-only">Correo electrónico</span>
        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          maxLength={100}
          className={claseInput}
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <span
          role="status"
          className={cn('text-sm', mensaje?.tipo === 'error' ? 'text-rose-600' : 'text-emerald-700')}
        >
          {mensaje?.texto}
        </span>
        <button
          type="submit"
          disabled={guardando || sinCambios}
          className="min-h-tactil px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
        >
          {guardando ? 'Guardando…' : 'Guardar contacto'}
        </button>
      </div>
    </form>
  );
};

interface ContenidoProps {
  fila: ComprobanteHistorialItemDTO;
  onVerDocumento: (token?: string | null) => void;
  onAnular: (comprobante: ComprobanteHistorialItemDTO) => void;
  onContactoActualizado: () => void;
}

/** Contenido del panel; se monta de nuevo por comprobante (key), así el detalle nunca queda desfasado. */
const Contenido: React.FC<ContenidoProps> = ({ fila, onVerDocumento, onAnular, onContactoActualizado }) => {
  const [detalle, setDetalle] = useState<ComprobanteDetalleDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    cajaService
      .getDetalleComprobante(fila.id)
      .then((res) => {
        if (!vigente) return;
        if (res.exito && res.datos) {
          setDetalle(res.datos);
          setError(null);
        } else {
          setError(res.errores?.[0]?.mensaje || 'No se pudo cargar el detalle del comprobante.');
        }
      })
      .catch((err) => {
        if (vigente) setError(mensajeDeErrorApi(err, 'No se pudo cargar el detalle del comprobante.'));
      });

    return () => {
      vigente = false;
    };
  }, [fila.id, intento]);

  const esNotaCredito = fila.tipo_comprobante === 'nota_credito';
  const esAnulado = fila.estado === 'anulado';
  const d = detalle;

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Referencia fiscal: qué anuló a este comprobante o qué anula esta nota de crédito */}
        {d?.nota_credito && esAnulado && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 text-sm text-rose-900">
            <p className="flex items-center gap-2 font-bold">
              <Ban className="w-4 h-4" aria-hidden="true" />
              Anulado por la nota de crédito {d.nota_credito.serie_numero}
            </p>
            {d.nota_credito.motivo_codigo_sunat && (
              <p>
                Motivo SUNAT ({d.nota_credito.motivo_codigo_sunat}): {d.nota_credito.motivo_texto}
              </p>
            )}
            {d.nota_credito.sustento_motivo && <p className="italic">“{d.nota_credito.sustento_motivo}”</p>}
            <button
              type="button"
              onClick={() => onVerDocumento(d.nota_credito?.token)}
              className="min-h-10 px-3 rounded-xl border border-rose-300 bg-white hover:bg-rose-100 text-rose-800 text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Ver nota de crédito
            </button>
          </div>
        )}

        {d?.documento_afectado && esNotaCredito && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-1.5 text-sm text-amber-950">
            <p className="flex items-center gap-2 font-bold">
              <FileMinus2 className="w-4 h-4" aria-hidden="true" />
              Anula {etiquetaTipo(d.documento_afectado.tipo_comprobante).toLowerCase()} {d.documento_afectado.serie_numero}
            </p>
            {d.documento_afectado.motivo_codigo_sunat && (
              <p>
                Motivo SUNAT ({d.documento_afectado.motivo_codigo_sunat}): {d.documento_afectado.motivo_texto}
              </p>
            )}
            {d.documento_afectado.sustento_motivo && (
              <p className="italic">“{d.documento_afectado.sustento_motivo}”</p>
            )}
            <button
              type="button"
              onClick={() => onVerDocumento(d.documento_afectado?.token)}
              className="min-h-10 px-3 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Ver comprobante original
            </button>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIntento((n) => n + 1);
              }}
              className="min-h-10 px-3 rounded-xl border border-rose-300 bg-white hover:bg-rose-100 font-semibold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {!d && !error && (
          <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Cargando detalle">
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-32 rounded-2xl bg-slate-100" />
          </div>
        )}

        {d && (
          <>
            <Seccion titulo={esNotaCredito ? 'Monto acreditado' : 'Cobro'}>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <Fila etiqueta="Subtotal consumo" valor={formatPEN(montoMostrado(d.desglose.subtotal_consumo))} />
                {Math.abs(d.desglose.descuento) > 0 && (
                  <Fila
                    etiqueta={d.desglose.promocion_nombre ? `Descuento (${d.desglose.promocion_nombre})` : 'Descuento'}
                    valor={`- ${formatPEN(montoMostrado(d.desglose.descuento))}`}
                    tono="text-rose-600"
                  />
                )}
                {Math.abs(d.desglose.monto_recargo) > 0 && (
                  <Fila
                    etiqueta={`Recargo${d.desglose.porcentaje_recargo > 0 ? ` (${d.desglose.porcentaje_recargo}%)` : ''}`}
                    valor={formatPEN(montoMostrado(d.desglose.monto_recargo))}
                  />
                )}
                <Fila etiqueta="Operación gravada" valor={formatPEN(montoMostrado(d.desglose.base_imponible))} />
                <Fila etiqueta="IGV (18%)" valor={formatPEN(montoMostrado(d.desglose.igv))} />
                <Fila
                  etiqueta={esNotaCredito ? 'Total acreditado' : 'Total'}
                  valor={formatPEN(montoMostrado(d.desglose.total))}
                  destacado
                />
              </div>
            </Seccion>

            <Seccion titulo={esNotaCredito ? 'Medio de pago original' : 'Pago'}>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <MedioPagoChip medio={d.medio_pago} nombre={d.metodo_pago_nombre} numeroOperacion={d.numero_operacion} />
                {!esNotaCredito && d.medio_pago === 'efectivo' && d.desglose.monto_recibido != null && (
                  <div className="space-y-1.5 pt-1">
                    <Fila etiqueta="Monto recibido" valor={formatPEN(d.desglose.monto_recibido)} />
                    <Fila etiqueta="Vuelto" valor={formatPEN(d.desglose.vuelto ?? 0)} />
                  </div>
                )}
              </div>
            </Seccion>

            <Seccion titulo="Cliente y entrega">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{d.cliente_nombre}</p>
                  <p className="text-slate-500 font-mono text-xs">
                    {d.cliente_documento ? `DOC: ${d.cliente_documento}` : 'Consumidor final'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Mesa {d.mesa_numero}
                    {d.subcuenta_numero ? ` · Subcuenta #${d.subcuenta_numero}` : ''} · Comanda #{d.comanda_numero}
                  </p>
                </div>
                <ContactoForm
                  detalle={d}
                  onGuardado={(telefono, email) => {
                    setDetalle({ ...d, telefono_envio: telefono, email_envio: email });
                    onContactoActualizado();
                  }}
                />
              </div>
            </Seccion>

            <Seccion titulo="Consumo">
              <ul className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100">
                {d.items.map((item, indice) => (
                  <li key={`${item.descripcion}-${indice}`} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-sm">
                    <span className="text-slate-800 min-w-0">
                      <span className="font-bold text-amber-600 mr-1.5">{item.cantidad}x</span>
                      {item.descripcion}
                    </span>
                    <span className="font-mono text-slate-700 shrink-0">{formatPEN(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </Seccion>

            <p className="text-xs text-slate-500 font-mono">
              Emitido el {new Date(d.fecha_emision).toLocaleDateString('es-PE')} a las {d.hora} · Impreso:{' '}
              {d.impreso ? 'sí' : 'no'}
            </p>
          </>
        )}
      </div>

      <footer className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 [&>*]:w-full sm:[&>*]:w-auto">
        {!esAnulado && !esNotaCredito && (
          <button
            type="button"
            onClick={() => onAnular(fila)}
            className="min-h-tactil px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            Anular con NC
          </button>
        )}
        <button
          type="button"
          onClick={() => onVerDocumento(fila.token_digital)}
          className="min-h-tactil px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          {etiquetaBotonVer(fila.tipo_comprobante)}
        </button>
      </footer>
    </>
  );
};

export const DrawerDetalleComprobante: React.FC<DrawerDetalleComprobanteProps> = ({
  comprobante,
  onCerrar,
  onVerDocumento,
  onAnular,
  onContactoActualizado,
}) => {
  const idTitulo = useId();
  const abierto = comprobante !== null;
  const panelRef = useCapaModal<HTMLDivElement>(abierto, onCerrar, true);

  if (!comprobante) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="relative w-full md:max-w-xl h-dvh flex flex-col bg-slate-50 shadow-2xl focus:outline-hidden md:border-l border-slate-200"
      >
        <header className="shrink-0 flex items-start gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex-1 min-w-0 space-y-1.5">
            <h2
              id={idTitulo}
              className={cn(
                'font-mono text-xl font-extrabold',
                comprobante.estado === 'anulado' ? 'line-through text-slate-400' : 'text-slate-900'
              )}
            >
              {comprobante.serie_numero}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">{etiquetaTipo(comprobante.tipo_comprobante)}</span>
              <EstadoFiscalBadge comprobante={comprobante} />
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-tactil min-w-tactil -mr-2 -mt-1 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <Contenido
          key={comprobante.id}
          fila={comprobante}
          onVerDocumento={onVerDocumento}
          onAnular={onAnular}
          onContactoActualizado={onContactoActualizado}
        />
      </div>
    </div>,
    document.body
  );
};
