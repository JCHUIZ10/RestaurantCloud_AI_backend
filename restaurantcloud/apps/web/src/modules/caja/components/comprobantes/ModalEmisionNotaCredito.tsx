import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  CheckCircle2,
  QrCode,
  Copy,
  Printer,
  Send,
  Mail,
  Edit2,
  Plus,
  RotateCcw,
  ShieldCheck,
  DollarSign,
  PackageCheck,
  Smartphone,
  Pencil,
} from 'lucide-react';
import {
  PrepararAnulacionResponseDTO,
  EmitirNotaCreditoResponseDTO,
  MotivoNotaCreditoSUNAT,
  ComprobanteItemAnulacionDTO,
} from '@/types/caja';
import { cajaService } from '@/services/serviceAdapter';
import {
  extraerDigitosMovilPeru,
  formatearTelefonoPeru,
  generarEnlaceWhatsApp,
} from '@/shared/utils';

interface ModalEmisionNotaCreditoProps {
  isOpen: boolean;
  comprobanteId: string | null;
  onClose: () => void;
  onNotaCreditoEmitida: (nc: EmitirNotaCreditoResponseDTO) => void;
}

const MOTIVOS_SUNAT: { codigo: MotivoNotaCreditoSUNAT; titulo: string; descripcion: string }[] = [
  {
    codigo: '01',
    titulo: '01 — Anulación de la operación',
    descripcion: 'Reemisión por cambio de comprobante, modificación global o anulación total de la venta.',
  },
  {
    codigo: '02',
    titulo: '02 — Anulación por error en el RUC / Documento',
    descripcion: 'Error en la identificación del titular o razón social del comensal.',
  },
  {
    codigo: '06',
    titulo: '06 — Devolución total del consumo',
    descripcion: 'Restitución completa de fondos por inconformidad o retiro del salón.',
  },
];

export const ModalEmisionNotaCredito: React.FC<ModalEmisionNotaCreditoProps> = ({
  isOpen,
  comprobanteId,
  onClose,
  onNotaCreditoEmitida,
}) => {
  // Estado de fases: 'formulario' (Vista 2) | 'emitido' (Vista 3)
  const [paso, setPaso] = useState<'formulario' | 'emitido'>('formulario');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Datos de preparación
  const [preparacion, setPreparacion] = useState<PrepararAnulacionResponseDTO | null>(null);

  // Parámetros de formulario (Vista 2)
  const [motivo, setMotivo] = useState<MotivoNotaCreditoSUNAT>('01');
  const [sustento, setSustento] = useState<string>('');
  const [devolucionMetodo, setDevolucionMetodo] = useState<'efectivo' | 'extorno_tarjeta' | 'transferencia'>('efectivo');

  // Resultado de emisión (Vista 3)
  const [itemsAReingresar, setItemsAReingresar] = useState<string[]>([]);
  const [ncEmitida, setNcEmitida] = useState<EmitirNotaCreditoResponseDTO | null>(null);
  const [copiadoUrl, setCopiadoUrl] = useState<boolean>(false);

  // Datos de contacto de entrega asistida (Vista 3)
  const [telefonoEnvio, setTelefonoEnvio] = useState<string>('');
  const [emailEnvio, setEmailEnvio] = useState<string>('');
  const [editandoTelefono, setEditandoTelefono] = useState<boolean>(false);
  const [editandoEmail, setEditandoEmail] = useState<boolean>(false);
  const [tempTelefono, setTempTelefono] = useState<string>('');
  const [tempEmail, setTempEmail] = useState<string>('');
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState<boolean>(false);
  const [enviadoWhatsApp, setEnviadoWhatsApp] = useState<boolean>(false);
  const [enviandoEmail, setEnviandoEmail] = useState<boolean>(false);
  const [enviadoEmail, setEnviadoEmail] = useState<boolean>(false);

  // Cargar datos del comprobante para anular
  const cargarPreparacion = useCallback(async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await cajaService.prepararAnulacionComprobante(id);
      if (res.exito && res.datos) {
        setPreparacion(res.datos);
        setTelefonoEnvio(res.datos.telefono_envio || '');
        setEmailEnvio(res.datos.email_envio || '');
        setDevolucionMetodo(res.datos.medio_pago_codigo === 'efectivo' ? 'efectivo' : 'extorno_tarjeta');
        setSustento('');
        const itemsList: ComprobanteItemAnulacionDTO[] = res.datos.items || [];
        const elegibles = itemsList
          .filter((it: ComprobanteItemAnulacionDTO) => it.es_sellado_elegible)
          .map((it: ComprobanteItemAnulacionDTO) => it.id);
        setItemsAReingresar(elegibles);
      } else {
        const msg = res.errores?.[0]?.mensaje || 'No se pudo cargar la información del comprobante';
        setErrorMsg(msg);
      }
    } catch {
      setErrorMsg('Error de conexión al preparar la anulación.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && comprobanteId) {
      setPaso('formulario');
      setNcEmitida(null);
      setCopiadoUrl(false);
      setEnviadoWhatsApp(false);
      setEnviadoEmail(false);
      cargarPreparacion(comprobanteId);
    }
  }, [isOpen, comprobanteId, cargarPreparacion]);

  // Atajos de teclado (F9 emitir, Esc salir)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'F9' && paso === 'formulario' && !isSubmitting && sustento.trim().length >= 5) {
        e.preventDefault();
        handleConfirmarEmision();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Confirmar y Emitir Nota de Crédito
  const handleConfirmarEmision = async () => {
    if (!comprobanteId || !preparacion) return;
    if (sustento.trim().length < 5) {
      setErrorMsg('El sustento debe tener al menos 5 caracteres obligatorios por normativa tributaria.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await cajaService.emitirNotaCredito(comprobanteId, {
        motivo_codigo_sunat: motivo,
        sustento_motivo: sustento.trim(),
        devolucion_metodo: devolucionMetodo,
        telefono_envio: telefonoEnvio.trim() || undefined,
        email_envio: emailEnvio.trim() || undefined,
        items_reingresar_stock: itemsAReingresar.length > 0 ? itemsAReingresar : undefined,
      });

      if (res.exito && res.datos) {
        setNcEmitida(res.datos);
        setPaso('emitido');
        onNotaCreditoEmitida(res.datos);
      } else {
        const msg = res.errores?.[0]?.mensaje || 'Error al emitir la Nota de Crédito.';
        setErrorMsg(msg);
      }
    } catch {
      setErrorMsg('Fallo de comunicación en la transacción ACID de anulación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL Pública Canónica de la Nota de Crédito
  const urlPublicaNC = ncEmitida?.token_digital
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${ncEmitida.token_digital}`
    : ncEmitida?.url_publica_qr || '';

  // Determinar si el cliente está registrado en BD (o si es Boleta < 700 / Consumidor Final sin cliente)
  const clienteEncontradoEnBd = Boolean(
    preparacion?.cliente_encontrado_en_bd ||
    (preparacion?.cliente_numero_doc && preparacion.cliente_numero_doc.trim() !== '')
  );

  // Copiar URL pública
  const handleCopiarUrl = () => {
    if (!urlPublicaNC) return;
    navigator.clipboard.writeText(urlPublicaNC);
    setCopiadoUrl(true);
    setTimeout(() => setCopiadoUrl(false), 2500);
  };

  // Iniciar edición de teléfono
  const handleIniciarEdicionTelefono = () => {
    setTempTelefono(extraerDigitosMovilPeru(telefonoEnvio));
    setEditandoTelefono(true);
  };

  // Guardar teléfono inline con estándar Perú
  const handleGuardarTelefono = async () => {
    if (!ncEmitida) return;
    const digits = extraerDigitosMovilPeru(tempTelefono);
    if (!digits || digits.length !== 9) {
      setErrorMsg('Por favor registra un número celular válido de 9 dígitos.');
      return;
    }
    const nuevoTel = `+51 ${formatearTelefonoPeru(digits)}`;
    await cajaService.actualizarContactoComprobante(ncEmitida.nota_credito_id, {
      telefono_envio: nuevoTel,
    });
    setTelefonoEnvio(nuevoTel);
    setEditandoTelefono(false);
    setErrorMsg(null);
  };

  // Guardar email inline
  const handleGuardarEmail = async () => {
    if (!ncEmitida) return;
    const nuevoEmail = tempEmail.trim();
    await cajaService.actualizarContactoComprobante(ncEmitida.nota_credito_id, {
      email_envio: nuevoEmail,
    });
    setEmailEnvio(nuevoEmail);
    setEditandoEmail(false);
  };

  // Despacho WhatsApp con enlace oficial wa.me
  const handleEnviarWhatsApp = async () => {
    if (!ncEmitida) return;
    const digits = extraerDigitosMovilPeru(telefonoEnvio);
    if (!digits || digits.length !== 9) {
      setErrorMsg('Por favor registra un número celular válido de 9 dígitos para enviar por WhatsApp.');
      return;
    }
    setEnviandoWhatsApp(true);
    try {
      const mensaje = `Hola ${preparacion?.cliente_nombre || 'Estimado(a)'}, aquí tienes tu Nota de Crédito oficial de ÁUREA: ${urlPublicaNC}`;
      const urlWa = generarEnlaceWhatsApp(telefonoEnvio, mensaje);
      window.open(urlWa, '_blank');
      setEnviadoWhatsApp(true);
    } finally {
      setEnviandoWhatsApp(false);
    }
  };

  // Despacho Correo
  const handleEnviarEmail = async () => {
    if (!ncEmitida) return;
    setEnviandoEmail(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setEnviadoEmail(true);
    } finally {
      setEnviandoEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-anulacion-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        {/* ========================================================================= */}
        {/* FASE 1: FORMULARIO DE EMISIÓN DE NOTA DE CRÉDITO (VISTA 2)               */}
        {/* ========================================================================= */}
        {paso === 'formulario' && (
          <>
            {/* Cabecera */}
            <div className="px-6 py-4 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="modal-anulacion-titulo" className="text-base font-bold text-slate-900 dark:text-white">
                      Emisión de Nota de Crédito Electrónica
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      ⚠️ Operación Irreversible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Rectificación tributaria formal de comprobante emitido • Anulación contable con reversión en gaveta.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Cancelar y cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido en 2 Columnas */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RotateCcw className="w-7 h-7 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs">Cargando datos del comprobante original...</p>
                </div>
              ) : errorMsg && !preparacion ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {errorMsg}
                </div>
              ) : preparacion ? (
                  <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* COLUMNA 1: Comprobante Original Afectado */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                          1. Comprobante Afectado
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          DOC. OFICIAL
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tipo y Serie:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {preparacion.serie_numero_original}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Documento:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {preparacion.tipo_comprobante_original.replace('_', ' ')} Electrónica
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Titular / Pagador:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                            {preparacion.cliente_nombre}
                            {preparacion.cliente_numero_doc ? (
                              <span className="text-slate-400 block text-[10px] font-mono">
                                DOC: {preparacion.cliente_numero_doc}
                              </span>
                            ) : (
                              <span className="text-slate-400 block text-[10px] italic">
                                Consumidor Final (&lt; S/ 700)
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Mesa / Comanda:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            Mesa {preparacion.mesa_numero}
                            {preparacion.subcuenta_numero && ` (Sub #${preparacion.subcuenta_numero})`}
                            {' • '}#{preparacion.comanda_numero}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Medio de Pago:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {preparacion.medio_pago_codigo === 'efectivo' && '💵 Efectivo'}
                            {preparacion.medio_pago_codigo === 'tarjeta' && '💳 Tarjeta POS'}
                            {preparacion.medio_pago_codigo === 'billetera_digital' && '📱 Billetera Digital'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 font-mono">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Base Imponible:</span>
                            <span>S/ {preparacion.base_imponible.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>I.G.V. (18% Incluido):</span>
                            <span>S/ {preparacion.igv.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                            <span>TOTAL A RECTIFICAR:</span>
                            <span className="text-rose-600 dark:text-rose-400">
                              - S/ {preparacion.total_original.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Serie NC asignada:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                        {preparacion.serie_nota_credito_sugerida} (Nota de Crédito)
                      </span>
                    </div>
                  </div>

                  {/* COLUMNA 2: Parámetros de Anulación y Devolución */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div>
                      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                          2. Motivo SUNAT (Catálogo 09)
                        </span>
                      </div>

                      {/* Opciones de Motivo SUNAT */}
                      <div className="mt-3 space-y-2">
                        {MOTIVOS_SUNAT.map((m) => (
                          <label
                            key={m.codigo}
                            className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                              motivo === m.codigo
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-slate-900 dark:text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="motivo_sunat"
                              value={m.codigo}
                              checked={motivo === m.codigo}
                              onChange={() => setMotivo(m.codigo)}
                              className="mt-0.5 text-amber-600 focus:ring-amber-500"
                            />
                            <div>
                              <strong className="block text-slate-900 dark:text-white">
                                {m.titulo}
                              </strong>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                                {m.descripcion}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Sustento Textual Obligatorio */}
                      <div className="mt-3.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Sustento / Motivo Detallado (Obligatorio para Auditoría SUNAT):
                        </label>
                        <textarea
                          rows={2}
                          value={sustento}
                          onChange={(e) => setSustento(e.target.value)}
                          placeholder="Ej. Comensal solicita cambio a Factura con RUC de empresa..."
                          className="w-full p-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>Mínimo 5 caracteres requeridos.</span>
                          <span className={sustento.length >= 5 ? 'text-emerald-500' : 'text-slate-400'}>
                            {sustento.length}/255
                          </span>
                        </div>
                      </div>

                      {/* Ficha de Devolución de Gaveta */}
                      {preparacion.medio_pago_codigo === 'efectivo' ? (
                        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4 text-amber-600" />
                              DEVOLUCIÓN DE EFECTIVO DE GAVETA
                            </span>
                            <span className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                              - S/ {preparacion.total_original.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 font-mono">
                            Efectivo disminuirá de S/ {preparacion.efectivo_gaveta_actual.toFixed(2)} a{' '}
                            <strong>S/ {preparacion.efectivo_gaveta_proyectado.toFixed(2)}</strong>.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                          <p>
                            Pago original fue con <strong>{preparacion.medio_pago_codigo}</strong>. La anulación
                            extorna la venta sin afectar el efectivo físico en gaveta.
                          </p>
                        </div>
                      )}
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
                    )}
                  </div>
                </div>

                {/* BLOQUE 3: Restitución Asistida a Bodega (Ítems y Bebidas Selladas) */}
                {preparacion.items && preparacion.items.length > 0 && (
                  <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider font-mono">
                          3. Restitución Asistida de Stock a Bodega
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {itemsAReingresar.length} ítem(s) seleccionado(s) para reingreso
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3">
                      Seleccione los productos sellados devueltos intactos (bebidas, botellas, latas) para restituir su inventario en bodega. Los platos preparados en cocina se registran como merma y no devuelven insumos para evitar descuadres.
                    </p>

                    <div className="space-y-2">
                      {preparacion.items.map((item: ComprobanteItemAnulacionDTO) => {
                        const estaSeleccionado = itemsAReingresar.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              item.es_sellado_elegible
                                ? estaSeleccionado
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 opacity-75'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {item.es_sellado_elegible ? (
                                <input
                                  type="checkbox"
                                  id={`item-reingreso-${item.id}`}
                                  checked={estaSeleccionado}
                                  onChange={() => {
                                    setItemsAReingresar((prev) =>
                                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                    );
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
                                />
                              ) : (
                                <div className="w-4 h-4 flex items-center justify-center text-slate-400">
                                  <span className="text-xs font-mono">•</span>
                                </div>
                              )}
                              <div>
                                <label
                                  htmlFor={item.es_sellado_elegible ? `item-reingreso-${item.id}` : undefined}
                                  className={`text-xs font-semibold block ${
                                    item.es_sellado_elegible ? 'cursor-pointer text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {item.cantidad}x {item.nombre}
                                </label>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  S/ {item.precio_unitario.toFixed(2)} c/u • Subtotal: S/ {item.subtotal.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              {item.es_sellado_elegible ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                    estaSeleccionado
                                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {estaSeleccionado ? '✓ Reingresa a Bodega' : 'No devolver a stock'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                  {item.requiere_preparacion ? 'Cocina / Merma culinaria' : 'Stock no descontado'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                  </>
              ) : null}
            </div>

            {/* Footer Formulario */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                🔒 Transacción ACID atómica: conmuta comprobante y genera NC
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || sustento.trim().length < 5}
                  onClick={handleConfirmarEmision}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Emitiendo NC...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Emitir Nota de Crédito {preparacion?.serie_nota_credito_sugerida} (F9)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* FASE 2: NOTA DE CRÉDITO EMITIDA Y TOKEN QR (VISTA 3 - CERO PAPEL)         */}
        {/* ========================================================================= */}
        {paso === 'emitido' && ncEmitida && (
          <>
            {/* Banner Superior Verde */}
            <div className="px-6 py-4 bg-emerald-900/90 text-emerald-100 border-b border-emerald-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">
                      [ ✓ ] Nota de Crédito {ncEmitida.serie_numero} Emitida
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Comprobante {ncEmitida.documento_modificado} anulado formalmente • Transacción contable asentada
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 block">
                  Gaveta Actualizada
                </span>
                <span className="text-sm font-bold text-white">
                  S/ {ncEmitida.efectivo_gaveta_nuevo.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Contenido Central Vista 3 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Ficha Resumen de la Nota de Crédito */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Comprobante Modificado
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {ncEmitida.documento_modificado}
                  </span>
                  <span className="text-[10px] text-rose-500 block font-semibold">[ 🚫 ANULADA ]</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Motivo Oficial SUNAT
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Catálogo 09 — {ncEmitida.motivo_codigo_sunat}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Sustento Declarado
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 line-clamp-1" title={ncEmitida.sustento_motivo}>
                    {ncEmitida.sustento_motivo}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Importe Rectificado
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                    S/ {ncEmitida.importe_rectificado.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Token QR Dinámico y Enlace Público con Botón Copiar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                {/* Gran QR Simulado */}
                <div className="w-28 h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-2 text-center shrink-0">
                  <QrCode className="w-16 h-16 text-slate-800 dark:text-slate-200" />
                  <span className="text-[9px] font-mono text-slate-500 font-bold mt-1">
                    TOKEN DIGITAL
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono">
                      TOKEN NOTA DE CRÉDITO • CERO PAPEL
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    Constancia Digital Oficial para el Comensal
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    El cliente puede escanear este código con su smartphone para descargar el PDF de la Nota de Crédito.
                  </p>

                  {/* Barra de URL con Botón Copiar al externo izquierdo */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopiarUrl}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
                        copiadoUrl
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                      }`}
                      title="Copiar enlace al portapapeles"
                    >
                      {copiadoUrl ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-600 dark:text-slate-300 truncate flex-1 select-all">
                      {urlPublicaNC}
                    </div>
                  </div>
                </div>
              </div>

              {/* Entrega Digital Asistida Directa (WhatsApp y Correo) - SOLO SI EL CLIENTE FUE ENCONTRADO EN LA BD */}
              {clienteEncontradoEnBd && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
                      ENTREGA DIGITAL DIRECTA (OPCIONES ASISTIDAS)
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      ✓ Cliente Registrado en BD
                    </span>
                  </div>

                  {/* Fila WhatsApp según estandar_telefono_whatsapp.md */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>

                      {editandoTelefono ? (
                        // Modo Edición / Registro WhatsApp
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          <span className="font-mono text-slate-500 text-[11px] shrink-0">📱 WhatsApp:</span>
                          <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                            {/* Prefijo Fijo No Editable */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs select-none">
                              <span>🇵🇪</span>
                              <span className="font-mono text-[11px]">+51</span>
                            </div>
                            {/* Input de Dígitos */}
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={11}
                              value={formatearTelefonoPeru(tempTelefono)}
                              onChange={(e) => {
                                const digits = extraerDigitosMovilPeru(e.target.value);
                                setTempTelefono(digits);
                              }}
                              placeholder="987 654 321"
                              className="w-36 px-2.5 py-1 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden"
                              autoFocus
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleGuardarTelefono}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoTelefono(false)}
                            className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        // Modo Visualización WhatsApp
                        <div className="min-w-0">
                          <span className="font-mono text-slate-500 text-[11px] block">📱 WhatsApp:</span>
                          {telefonoEnvio ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                {telefonoEnvio.startsWith('+51') ? telefonoEnvio : `+51 ${formatearTelefonoPeru(telefonoEnvio)}`}
                              </span>
                              <span className="text-[10px] font-normal text-slate-400 font-mono">[ Registrado ]</span>
                              <button
                                type="button"
                                onClick={handleIniciarEdicionTelefono}
                                className="px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                              >
                                <Pencil className="w-3 h-3 text-slate-400" />
                                <span>Modificar</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-slate-400 italic">No registrado</span>
                              <button
                                type="button"
                                onClick={handleIniciarEdicionTelefono}
                                className="px-2.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Registrar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!editandoTelefono && telefonoEnvio && (
                      <button
                        type="button"
                        disabled={enviandoWhatsApp || enviadoWhatsApp}
                        onClick={handleEnviarWhatsApp}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
                          enviadoWhatsApp
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {enviadoWhatsApp ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Enviado</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{enviandoWhatsApp ? 'Abriendo...' : 'Enviar WhatsApp'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                {/* Fila Correo Electrónico */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        ✉️ Correo Electrónico
                      </span>
                      {editandoEmail ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            placeholder="cliente@ejemplo.com"
                            className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 w-48 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleGuardarEmail}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoEmail(false)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : emailEnvio ? (
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {emailEnvio}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No registrado</span>
                      )}
                    </div>
                  </div>

                  {!editandoEmail && (
                    <div className="flex items-center gap-2">
                      {emailEnvio ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setTempEmail(emailEnvio);
                              setEditandoEmail(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Modificar</span>
                          </button>
                          <button
                            type="button"
                            disabled={enviandoEmail || enviadoEmail}
                            onClick={handleEnviarEmail}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                              enviadoEmail
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-sky-600 hover:bg-sky-500 text-white'
                            }`}
                          >
                            {enviadoEmail ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Enviado</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>{enviandoEmail ? 'Enviando...' : 'Confirmar y Enviar'}</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTempEmail('');
                            setEditandoEmail(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Registrar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Botón Imprimir Físico (Deshabilitado - Cero Papel) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => window.open(urlPublicaNC, '_blank')}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Ver PDF Oficial de Nota de Crédito</span>
                </button>

                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-2 cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Ticket Físico (DESHABILITADO)</span>
                  </button>
                  <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block w-56 p-2 rounded-xl bg-slate-900 text-white text-[10px] leading-tight shadow-xl z-20">
                    Política Cero Papel activa: la constancia oficial se entrega mediante token digital QR y envío asistido.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Vista 3 */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Evento de auditoría transmitido a Administración (CU-ADMIN-12).</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>Finalizar y Volver al Historial (Esc)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
