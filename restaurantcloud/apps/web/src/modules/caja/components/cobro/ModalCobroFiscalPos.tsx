import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Smartphone,
  Mail,
  FileText,
  Printer,
  ExternalLink,
  Check,
  Copy,
  Pencil,
  Plus,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MesaCajaMonitorDTO,
  PrecuentaResponseDTO,
  SubcuentaComandaDTO,
  ProcesarCobroFiscalResponseDTO,
} from '@/types/caja';
import {
  extraerDigitosMovilPeru,
  formatearTelefonoPeru,
  generarEnlaceWhatsApp,
} from '@/shared/utils';
import { cajaService } from '@/services/serviceAdapter';

interface ModalCobroFiscalPosProps {
  isOpen: boolean;
  mesa: MesaCajaMonitorDTO | null;
  subcuenta?: SubcuentaComandaDTO | null;
  precuenta: PrecuentaResponseDTO | null;
  onClose: () => void;
  onComprobanteEmitido: (response: ProcesarCobroFiscalResponseDTO) => void;
}

interface CuentaFiscalItem {
  id: string;
  numero_subcuenta: number;
  titular: string;
  tipo_documento: 'DNI' | 'RUC' | 'SIN_DOC';
  numero_documento: string;
  tipo_comprobante: 'boleta' | 'factura' | 'nota_venta';
  serie_numero: string;
  total_neto: number;
  base_imponible: number;
  igv: number;
  medio_pago: 'efectivo' | 'billetera_digital' | 'tarjeta';
  numero_operacion: string;
  monto_recibido: number;
  vuelto: number;
  token_digital: string;
  url_publica: string;
  telefono_whatsapp: string;
  correo: string;
  pagado: boolean;
  cliente_encontrado_en_bd: boolean;
}

export const ModalCobroFiscalPos: React.FC<ModalCobroFiscalPosProps> = ({
  isOpen,
  mesa,
  subcuenta,
  precuenta,
  onClose,
  onComprobanteEmitido,
}) => {
  const [cuentas, setCuentas] = useState<CuentaFiscalItem[]>([]);
  const [indexCuentaActiva, setIndexCuentaActiva] = useState<number>(0);
  const [whatsappEnviado, setWhatsappEnviado] = useState<Record<string, boolean>>({});
  const [emailEnviado, setEmailEnviado] = useState<Record<string, boolean>>({});
  const [notificacionFeedback, setNotificacionFeedback] = useState<string | null>(null);
  const [cobrando, setCobrando] = useState<boolean>(false);
  const [ultimoCobroResponse, setUltimoCobroResponse] = useState<ProcesarCobroFiscalResponseDTO | null>(null);

  // Estado para copia de URL
  const [copiadoUrl, setCopiadoUrl] = useState<boolean>(false);

  // Estados para edición y registro asistido de WhatsApp y Correo
  const [editandoWhatsappId, setEditandoWhatsappId] = useState<string | null>(null);
  const [inputWhatsappTemp, setInputWhatsappTemp] = useState<string>('');
  const [editandoEmailId, setEditandoEmailId] = useState<string | null>(null);
  const [inputEmailTemp, setInputEmailTemp] = useState<string>('');

  // Ref de protección: solo re-inicializar cuentas si cambia de mesa o se reabre el modal
  const mesaIdInicializadaRef = useRef<string | null>(null);

  // Inicializar o sincronizar cuentas al abrir el modal
  useEffect(() => {
    if (!isOpen || !mesa) {
      mesaIdInicializadaRef.current = null;
      setEditandoWhatsappId(null);
      setEditandoEmailId(null);
      setCobrando(false);
      setUltimoCobroResponse(null);
      return;
    }

    if (mesaIdInicializadaRef.current === mesa.id) {
      return;
    }

    mesaIdInicializadaRef.current = mesa.id;
    setWhatsappEnviado({});
    setEmailEnviado({});
    setNotificacionFeedback(null);
    setEditandoWhatsappId(null);
    setEditandoEmailId(null);
    setCobrando(false);
    setUltimoCobroResponse(null);

    // Caso 1: La mesa tiene subcuentas de comanda dividida (CU-MOZO-09)
    if (precuenta?.subcuentas && precuenta.subcuentas.length > 0) {
      const items: CuentaFiscalItem[] = precuenta.subcuentas.map((s, idx) => {
        const isFactura =
          s.tipo_comprobante === 'factura' ||
          s.tipo_comprobante_sugerido?.toUpperCase() === 'FACTURA';
        const isNota =
          s.tipo_comprobante === 'nota_venta' ||
          s.tipo_comprobante_sugerido?.toUpperCase() === 'NOTA_VENTA';

        const tipoComp = isFactura ? 'factura' : isNota ? 'nota_venta' : 'boleta';
        const serie = isFactura ? 'F001' : isNota ? 'NV01' : 'B001';

        const totalNeto = s.total_neto;
        const base = Math.round((totalNeto / 1.18) * 100) / 100;
        const igv = Math.round((totalNeto - base) * 100) / 100;

        const titular = s.titular_referencia || (isFactura ? 'Razón Social' : 'Cliente General');
        const tipoDoc = isFactura ? 'RUC' : s.documento_identidad ? 'DNI' : 'SIN_DOC';
        const numDoc = s.documento_identidad || '';
        const medio = (s.medio_pago_tentativo as any) || 'efectivo';

        const clienteSubEnBd = Boolean(s.cliente_encontrado_en_bd);
        const telDefault = s.telefono_sugerido || (clienteSubEnBd ? precuenta?.telefono_cliente_sugerido || '' : '');
        const correoDefault = s.email_sugerido || (clienteSubEnBd ? precuenta?.email_cliente_sugerido || '' : '');

        return {
          id: s.id || `sub-${idx + 1}`,
          numero_subcuenta: s.numero_subcuenta || idx + 1,
          titular,
          tipo_documento: tipoDoc,
          numero_documento: numDoc,
          tipo_comprobante: tipoComp,
          serie_numero: `Pendiente (${serie})`,
          total_neto: totalNeto,
          base_imponible: base,
          igv,
          medio_pago: medio,
          numero_operacion: '',
          monto_recibido: totalNeto,
          vuelto: 0,
          token_digital: '',
          url_publica: '',
          telefono_whatsapp: telDefault,
          correo: correoDefault,
          pagado: false,
          cliente_encontrado_en_bd: clienteSubEnBd,
        };
      });

      setCuentas(items);

      if (subcuenta) {
        const foundIdx = items.findIndex((x) => x.id === subcuenta.id);
        if (foundIdx >= 0) setIndexCuentaActiva(foundIdx);
        else setIndexCuentaActiva(0);
      } else {
        setIndexCuentaActiva(0);
      }
    } else {
      // Caso 2: Mesa con cuenta consolidada única (Mesa completa)
      const totalNeto = precuenta?.total_cobro_tentativo || precuenta?.tributacion_sunat.total_neto || mesa.total_consumo || 0.0;
      const tipoComp = precuenta?.tipo_comprobante_sugerido || 'boleta';
      const isFactura = tipoComp === 'factura';
      const serie = isFactura ? 'F001' : tipoComp === 'nota_venta' ? 'NV01' : 'B001';

      const base = Math.round((totalNeto / 1.18) * 100) / 100;
      const igv = Math.round((totalNeto - base) * 100) / 100;

      const clienteEnBd = Boolean(precuenta?.cliente_encontrado_en_bd);
      const itemUnico: CuentaFiscalItem = {
        id: `cta-unica-${mesa.id}`,
        numero_subcuenta: 1,
        titular: precuenta?.nombre_cliente_sugerido || 'CONSUMIDOR FINAL',
        tipo_documento: isFactura ? 'RUC' : precuenta?.documento_cliente_sugerido ? 'DNI' : 'SIN_DOC',
        numero_documento: precuenta?.documento_cliente_sugerido || '',
        tipo_comprobante: tipoComp,
        serie_numero: `Pendiente (${serie})`,
        total_neto: totalNeto,
        base_imponible: base,
        igv,
        medio_pago: (precuenta?.metodo_pago_tentativo as CuentaFiscalItem['medio_pago']) || 'efectivo',
        numero_operacion: precuenta?.numero_operacion_tentativo || '',
        monto_recibido: totalNeto,
        vuelto: 0,
        token_digital: '',
        url_publica: '',
        telefono_whatsapp: clienteEnBd ? (precuenta?.telefono_cliente_sugerido || '') : '',
        correo: clienteEnBd ? (precuenta?.email_cliente_sugerido || '') : '',
        pagado: false,
        cliente_encontrado_en_bd: clienteEnBd,
      };

      setCuentas([itemUnico]);
      setIndexCuentaActiva(0);
    }
  }, [isOpen, mesa, subcuenta, precuenta]);

  if (!isOpen || !mesa) return null;

  const cuentaActiva = cuentas[indexCuentaActiva] || cuentas[0];
  if (!cuentaActiva) return null;

  const totalMesa = cuentas.reduce((acc, c) => acc + c.total_neto, 0);
  const numPagadas = cuentas.filter((c) => c.pagado).length;
  const todasPagadas = cuentas.length > 0 && numPagadas === cuentas.length;
  const entregaDigitalDisponible = cuentaActiva.pagado && Boolean(cuentaActiva.token_digital);
  const quedanPendientes = cuentas.filter((c) => !c.pagado).length;

  // Manejador para copiar URL del comprobante
  const handleCopiarUrl = async () => {
    if (!entregaDigitalDisponible || !cuentaActiva.url_publica) {
      setNotificacionFeedback('El enlace del comprobante estará disponible al confirmar el pago.');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cuentaActiva.url_publica);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = cuentaActiva.url_publica;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiadoUrl(true);
      setTimeout(() => setCopiadoUrl(false), 2000);
    } catch {
      setCopiadoUrl(true);
      setTimeout(() => setCopiadoUrl(false), 2000);
    }
  };

  // Manejadores para edición y registro de WhatsApp según estandar_telefono_whatsapp.md
  const handleIniciarEdicionWhatsapp = () => {
    const raw = cuentaActiva.telefono_whatsapp || '';
    const digits = extraerDigitosMovilPeru(raw);
    setInputWhatsappTemp(digits);
    setEditandoWhatsappId(cuentaActiva.id);
  };

  const handleGuardarWhatsapp = () => {
    const digits = extraerDigitosMovilPeru(inputWhatsappTemp);
    if (digits.length > 0 && digits.length !== 9) {
      setNotificacionFeedback('El número celular en el Perú debe tener exactamente 9 dígitos.');
      return;
    }
    if (digits.length === 9 && !digits.startsWith('9')) {
      setNotificacionFeedback('El número celular en el Perú debe comenzar con el dígito 9.');
      return;
    }
    const formatted = digits ? ('+51 ' + formatearTelefonoPeru(digits)) : '';
    setCuentas((prev) =>
      prev.map((c) =>
        c.id === cuentaActiva.id ? { ...c, telefono_whatsapp: formatted } : c
      )
    );
    setEditandoWhatsappId(null);
  };

  // Manejadores para edición y registro de Correo
  const handleIniciarEdicionEmail = () => {
    setInputEmailTemp(cuentaActiva.correo || '');
    setEditandoEmailId(cuentaActiva.id);
  };

  const handleGuardarEmail = () => {
    setCuentas((prev) =>
      prev.map((c) =>
        c.id === cuentaActiva.id ? { ...c, correo: inputEmailTemp.trim() } : c
      )
    );
    setEditandoEmailId(null);
  };

  // Enviar WhatsApp asistido con enlace canónico wa.me según estandar_telefono_whatsapp.md
  const handleEnviarWhatsApp = (cuentaId: string) => {
    if (!entregaDigitalDisponible || !cuentaActiva.url_publica) {
      setNotificacionFeedback('El envío por WhatsApp se habilitará al confirmar el comprobante.');
      return;
    }

    const digits = extraerDigitosMovilPeru(cuentaActiva.telefono_whatsapp || '');
    if (!digits || digits.length !== 9) {
      setNotificacionFeedback('Por favor registra un número celular válido de 9 dígitos para enviar.');
      return;
    }

    const mensaje = `Hola ${cuentaActiva.titular}, aquí tienes tu comprobante electrónico oficial de ÁUREA: ${cuentaActiva.url_publica}`;
    const urlWa = generarEnlaceWhatsApp(cuentaActiva.telefono_whatsapp, mensaje);
    window.open(urlWa, '_blank');

    setWhatsappEnviado((prev) => ({ ...prev, [cuentaId]: true }));
    setNotificacionFeedback('Comprobante abierto para envío por WhatsApp.');
    setTimeout(() => setNotificacionFeedback(null), 3500);
  };

  // Enviar Email asistido
  const handleEnviarEmail = (cuentaId: string) => {
    if (!entregaDigitalDisponible) {
      setNotificacionFeedback('El envío por correo se habilitará al confirmar el comprobante.');
      return;
    }

    if (!cuentaActiva.correo) {
      setNotificacionFeedback('Por favor registra un correo electrónico.');
      return;
    }

    setEmailEnviado((prev) => ({ ...prev, [cuentaId]: true }));
    setNotificacionFeedback(`Comprobante programado para envío a ${cuentaActiva.correo}.`);
    setTimeout(() => setNotificacionFeedback(null), 3500);
  };

  // Confirmar Pago de la Cuenta Activa
  const handleConfirmarPago = async () => {
    if (cuentaActiva.pagado) {
      let sigIdx = cuentas.findIndex((c, i) => i > indexCuentaActiva && !c.pagado);
      if (sigIdx === -1) {
        sigIdx = cuentas.findIndex((c) => !c.pagado);
      }
      if (sigIdx >= 0) {
        setIndexCuentaActiva(sigIdx);
      }
      return;
    }

    const pedidoEfectivoId = precuenta?.pedido_id || mesa.pedido_id;
    if (!pedidoEfectivoId) {
      setNotificacionFeedback('No se identificó un pedido activo asociado a esta mesa.');
      return;
    }

    setCobrando(true);
    setNotificacionFeedback(null);

    let res;
    try {
      res = await cajaService.emitirComprobanteFiscal({
        mesa_id: mesa.id,
        pedido_id: pedidoEfectivoId,
        subcuenta_id: cuentas.length > 1 && !cuentaActiva.id.startsWith('sub-') ? cuentaActiva.id : undefined,
        tipo_comprobante: cuentaActiva.tipo_comprobante,
        serie: cuentaActiva.tipo_comprobante === 'factura' ? 'F001' : cuentaActiva.tipo_comprobante === 'nota_venta' ? 'NV01' : 'B001',
        cliente_nombre: cuentaActiva.titular,
        cliente_num_doc: cuentaActiva.numero_documento || undefined,
        metodo_pago_codigo: cuentaActiva.medio_pago,
        monto_recibido: cuentaActiva.monto_recibido,
        telefono_envio: cuentaActiva.telefono_whatsapp ? cuentaActiva.telefono_whatsapp.trim() : undefined,
        email_envio: cuentaActiva.correo ? cuentaActiva.correo.trim() : undefined,
      });
    } catch (error: any) {
      setCobrando(false);
      const msg = error.response?.data?.errores?.[0]?.mensaje ||
        error.response?.data?.message ||
        'No se pudo emitir el comprobante. Intenta nuevamente.';
      setNotificacionFeedback(msg);
      return;
    }

    setCobrando(false);

    if (!res.exito || !res.datos) {
      setNotificacionFeedback(res.errores?.[0]?.mensaje || 'No se pudo emitir el comprobante.');
      return;
    }

    const tokenDigital = res.datos.token_digital || '';
    const urlPublica = res.datos.url_publica_qr || (tokenDigital ? `${window.location.origin}/c/${tokenDigital}` : '');

    const cuentasActualizadas = cuentas.map((c, idx) => {
      if (idx === indexCuentaActiva || c.id === cuentaActiva.id) {
        return {
          ...c,
          pagado: true,
          serie_numero: res.datos?.serie_numero || c.serie_numero,
          token_digital: tokenDigital,
          url_publica: urlPublica,
        };
      }
      return c;
    });

    setCuentas(cuentasActualizadas);
    setUltimoCobroResponse(res.datos);

    setNotificacionFeedback(`Comprobante ${res.datos.serie_numero} emitido exitosamente.`);
    setTimeout(() => setNotificacionFeedback(null), 4000);
  };

  // Finalizar cobro y cerrar modal
  const handleFinalizarCobro = () => {
    if (ultimoCobroResponse) {
      onComprobanteEmitido({
        ...ultimoCobroResponse,
        mesa_liberada: todasPagadas || quedanPendientes === 0,
        subcuentas_pendientes: quedanPendientes,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[94vh] shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* ========================================================================= */}
        {/* CABECERA: VISTA 2 DEL WIREFRAME OFICIAL CU-CAJA-03                        */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
              cuentaActiva.pagado
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  {cuentaActiva.pagado
                    ? `Cobro Confirmado con Éxito • Mesa ${mesa.numero}`
                    : `Cobro Fiscal POS • Mesa ${mesa.numero}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  Mesa {mesa.numero}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                <span>Comanda #{precuenta?.numero_comanda || '001'}</span>
                <span>•</span>
                <span>Mozo: {mesa.mozo_nombre || precuenta?.mozo_nombre || 'Mozo Asignado'}</span>
                <span>•</span>
                <span>Total Mesa: <strong>S/ {totalMesa.toFixed(2)}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {todasPagadas ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold font-mono tracking-wide animate-pulse">
                MESA {mesa.numero} LIBERADA
              </span>
            ) : cuentas.length > 1 ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold">
                {numPagadas} de {cuentas.length} pagadas
              </span>
            ) : cuentaActiva.pagado ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold">
                Comprobante Emitido
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold">
                Lista para Cobro
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST DE ENVÍO O ERROR */}
        {notificacionFeedback && (
          <div className={`text-white text-xs font-bold px-4 py-2 text-center animate-in slide-in-from-top-2 flex items-center justify-center gap-2 shrink-0 ${
            notificacionFeedback.includes('No se pudo') || notificacionFeedback.includes('Error')
              ? 'bg-rose-600'
              : 'bg-emerald-600'
          }`}>
            <Check className="w-4 h-4" />
            <span>{notificacionFeedback}</span>
          </div>
        )}

        {/* SELECTOR DE SUBCUENTAS (SI HAY MÁS DE 1 CUENTA) */}
        {cuentas.length > 1 && (
          <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider shrink-0 mr-1">
              Cuentas:
            </span>
            {cuentas.map((c, idx) => {
              const isSelected = indexCuentaActiva === idx;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setIndexCuentaActiva(idx);
                    setEditandoWhatsappId(null);
                    setEditandoEmailId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                      : c.pagado
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span>Subcuenta #{c.numero_subcuenta}: {c.titular}</span>
                  <span className="font-mono text-[11px] opacity-90">S/ {c.total_neto.toFixed(2)}</span>
                  {c.pagado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CUERPO CENTRAL: FICHA FISCAL + TOKEN DIGITAL QR + ENTREGA DIGITAL         */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* 1. FICHA FISCAL DEL COMPROBANTE (EXACTA A VISTA 2 WIREFRAME) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {cuentaActiva.tipo_comprobante === 'factura'
                    ? 'Factura de Venta Electrónica'
                    : cuentaActiva.tipo_comprobante === 'nota_venta'
                    ? 'Nota de Venta Interna'
                    : 'Boleta de Venta Electrónica'}{' '}
                  <strong className={cuentaActiva.pagado ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {cuentaActiva.serie_numero}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {cuentaActiva.pagado ? 'Emitido formalmente' : 'Pendiente de emisión'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  COMENSAL / TITULAR:
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  {cuentaActiva.titular}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {cuentaActiva.numero_documento
                      ? `${cuentaActiva.tipo_documento}: ${cuentaActiva.numero_documento}`
                      : 'Consumidor Final (Sin documento)'}
                  </span>
                  {cuentaActiva.cliente_encontrado_en_bd ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      ✓ Cliente en BD
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Boleta &lt; S/ 700 • Sin cliente en BD
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  MEDIO DE PAGO:
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  {cuentaActiva.medio_pago === 'billetera_digital' ? (
                    `Billetera Digital (Yape / Plin)${cuentaActiva.numero_operacion ? ` • Op: ${cuentaActiva.numero_operacion}` : ''}`
                  ) : cuentaActiva.medio_pago === 'tarjeta' ? (
                    'Tarjeta POS Débito/Crédito'
                  ) : (
                    `Efectivo • Recibido S/ ${cuentaActiva.monto_recibido.toFixed(2)} • Vuelto S/ ${cuentaActiva.vuelto.toFixed(2)}`
                  )}
                </span>
                <span className="text-[11px] text-slate-500">
                  Estado: {cuentaActiva.pagado ? '✓ Confirmado e Inmutable' : 'Listo para cobro'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  DESGLOSE FISCAL SUNAT (D.S. 055-99-EF):
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  Base Imponible: S/ {cuentaActiva.base_imponible.toFixed(2)} • IGV (18%): S/ {cuentaActiva.igv.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  TOTAL LIQUIDADO:
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-serif">
                  S/ {cuentaActiva.total_neto.toFixed(2)} NETO
                </span>
              </div>
            </div>
          </div>

          {/* 2. TOKEN DIGITAL QR • CERO PAPEL CON QRCODE REAL */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            {entregaDigitalDisponible && cuentaActiva.url_publica ? (
              <div className="w-36 h-36 bg-white rounded-2xl flex items-center justify-center p-2.5 border border-slate-200 dark:border-slate-700 shrink-0 shadow-inner">
                <QRCodeSVG
                  value={cuentaActiva.url_publica}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#0B2340"
                  level="M"
                />
              </div>
            ) : (
              <div className="w-36 h-36 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-700 shrink-0 text-center">
                <Smartphone className="w-8 h-8 text-slate-400 mb-1.5" />
                <span className="text-[10px] text-slate-500 font-mono font-medium leading-tight">
                  Código QR se generará al confirmar cobro
                </span>
              </div>
            )}

            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                TOKEN DIGITAL QR • CERO PAPEL
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {entregaDigitalDisponible ? 'Escaneo Directo por el Comensal' : 'Documento Digital'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {entregaDigitalDisponible
                  ? 'El cliente puede escanear este código con su smartphone para ver, verificar y descargar su comprobante oficial en formato PDF.'
                  : 'Al confirmar el pago se emitirá el comprobante oficial en SUNAT y se generará el enlace QR público e inmutable.'}
              </p>
              
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={!entregaDigitalDisponible}
                  onClick={handleCopiarUrl}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs shrink-0 ${
                    !entregaDigitalDisponible
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                      : copiadoUrl
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Copiar URL del comprobante"
                >
                  {copiadoUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-mono">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                {entregaDigitalDisponible ? (
                  <a
                    href={cuentaActiva.url_publica}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-amber-600 dark:text-amber-400 underline font-semibold truncate max-w-xs hover:text-amber-700"
                  >
                    {cuentaActiva.url_publica}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-slate-400 italic">
                    Disponible tras confirmar pago
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. ENTREGA DIGITAL DIRECTA (OPCIONES ASISTIDAS) - SOLO SI EL CLIENTE FUE ENCONTRADO EN LA BD */}
          {cuentaActiva.cliente_encontrado_en_bd && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                  ENTREGA DIGITAL DIRECTA (OPCIONES ASISTIDAS)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  ✓ Cliente Registrado en BD
                </span>
              </div>

              {/* Fila WhatsApp */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>

                  {editandoWhatsappId === cuentaActiva.id ? (
                    // Modo Edición / Registro WhatsApp según estandar_telefono_whatsapp.md
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
                          value={formatearTelefonoPeru(inputWhatsappTemp)}
                          onChange={(e) => {
                            const digits = extraerDigitosMovilPeru(e.target.value);
                            setInputWhatsappTemp(digits);
                          }}
                          placeholder="987 654 321"
                          className="w-36 px-2.5 py-1 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGuardarWhatsapp}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoWhatsappId(null)}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                  // Modo Visualización WhatsApp
                  <div className="min-w-0">
                    <span className="font-mono text-slate-500 text-[11px] block">📱 WhatsApp:</span>
                    {cuentaActiva.telefono_whatsapp ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {cuentaActiva.telefono_whatsapp}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400 font-mono">[ Registrado ]</span>
                        <button
                          type="button"
                          onClick={handleIniciarEdicionWhatsapp}
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
                          onClick={handleIniciarEdicionWhatsapp}
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

              {/* Botón Enviar WhatsApp */}
              <button
                type="button"
                disabled={!entregaDigitalDisponible || !cuentaActiva.telefono_whatsapp || editandoWhatsappId === cuentaActiva.id}
                onClick={() => handleEnviarWhatsApp(cuentaActiva.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${
                  whatsappEnviado[cuentaActiva.id]
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                    : !entregaDigitalDisponible || !cuentaActiva.telefono_whatsapp || editandoWhatsappId === cuentaActiva.id
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{whatsappEnviado[cuentaActiva.id] ? 'Enviado' : 'Enviar por WhatsApp'}</span>
              </button>
            </div>

            {/* Fila Correo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>

                {editandoEmailId === cuentaActiva.id ? (
                  // Modo Edición / Registro Correo
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <span className="font-mono text-slate-500 text-[11px] shrink-0">✉️ Correo:</span>
                    <input
                      type="email"
                      value={inputEmailTemp}
                      onChange={(e) => setInputEmailTemp(e.target.value)}
                      placeholder="cliente@ejemplo.pe"
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 w-52"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleGuardarEmail}
                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-2xs"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoEmailId(null)}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  // Modo Visualización Correo
                  <div className="min-w-0">
                    <span className="font-mono text-slate-500 text-[11px] block">✉️ Correo:</span>
                    {cuentaActiva.correo ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate max-w-xs">
                          {cuentaActiva.correo}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400 font-mono">[ Registrado ]</span>
                        <button
                          type="button"
                          onClick={handleIniciarEdicionEmail}
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
                          onClick={handleIniciarEdicionEmail}
                          className="px-2.5 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 border border-sky-300 dark:border-sky-800 text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          <span>Registrar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Enviar Correo */}
              <button
                type="button"
                disabled={!entregaDigitalDisponible || !cuentaActiva.correo || editandoEmailId === cuentaActiva.id}
                onClick={() => handleEnviarEmail(cuentaActiva.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${
                  emailEnviado[cuentaActiva.id]
                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300'
                    : !entregaDigitalDisponible || !cuentaActiva.correo || editandoEmailId === cuentaActiva.id
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{emailEnviado[cuentaActiva.id] ? 'Enviado' : 'Enviar por Correo'}</span>
              </button>
            </div>
          </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PIE DE ACCIONES: BOTÓN OFICIAL 'CONFIRMAR PAGO' / 'FINALIZAR Y LIBERAR'   */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {entregaDigitalDisponible ? (
              <a
                href={cuentaActiva.url_publica}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                <span>Ver Comprobante PDF</span>
              </a>
            ) : (
              <span className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold">
                PDF se genera al cobrar
              </span>
            )}

            <button
              type="button"
              disabled={!cuentaActiva.pagado}
              onClick={() => window.print()}
              className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                cuentaActiva.pagado
                  ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed hidden sm:flex'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              {cuentaActiva.pagado ? 'Cerrar' : 'Cancelar'}
            </button>

            {cuentaActiva.pagado ? (
              <button
                type="button"
                onClick={handleFinalizarCobro}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {todasPagadas || quedanPendientes === 0
                    ? `Finalizar y Liberar Mesa ${mesa.numero}`
                    : 'Avanzar a Siguiente Subcuenta'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={cobrando}
                onClick={handleConfirmarPago}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-amber-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                {cobrando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Emitiendo Comprobante...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {cuentas.length > 1
                        ? `Confirmar Pago Subcuenta #${cuentaActiva.numero_subcuenta}`
                        : 'Confirmar Pago'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
