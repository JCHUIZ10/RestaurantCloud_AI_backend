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
} from 'lucide-react';
import {
  MesaCajaMonitorDTO,
  PrecuentaResponseDTO,
  SubcuentaComandaDTO,
  ProcesarCobroFiscalResponseDTO,
} from '@/types/caja';
import { cajaService, IS_REAL_API } from '@/services/serviceAdapter';

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

  // Estado para copia de URL
  const [copiadoUrl, setCopiadoUrl] = useState<boolean>(false);

  // Estados para edición y registro asistido de WhatsApp y Correo
  const [editandoWhatsappId, setEditandoWhatsappId] = useState<string | null>(null);
  const [inputWhatsappTemp, setInputWhatsappTemp] = useState<string>('');
  const [editandoEmailId, setEditandoEmailId] = useState<string | null>(null);
  const [inputEmailTemp, setInputEmailTemp] = useState<string>('');

  // Ref de protección: solo re-inicializar cuentas si cambia de mesa o se reabre el modal
  const mesaIdInicializadaRef = useRef<string | null>(null);

  // Inicializar o sincronizar cuentas al abrir el modal (protegido contra re-inicializaciones por recarga de datos)
  useEffect(() => {
    if (!isOpen || !mesa) {
      mesaIdInicializadaRef.current = null;
      setEditandoWhatsappId(null);
      setEditandoEmailId(null);
      return;
    }

    // Si ya inicializamos las cuentas para esta mesa y el modal sigue abierto, no reiniciar estado
    if (mesaIdInicializadaRef.current === mesa.id) {
      return;
    }

    mesaIdInicializadaRef.current = mesa.id;
    setWhatsappEnviado({});
    setEmailEnviado({});
    setNotificacionFeedback(null);
    setEditandoWhatsappId(null);
    setEditandoEmailId(null);

    const baseCorrelativoBoleta = 12894;
    const baseCorrelativoFactura = 4521;
    const baseCorrelativoNota = 8412;

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
        const corr = isFactura
          ? baseCorrelativoFactura + idx + 1
          : isNota
          ? baseCorrelativoNota + idx + 1
          : baseCorrelativoBoleta + idx + 1;
        const serieNum = `${serie}-${String(corr).padStart(8, '0')}`;

        const totalNeto = s.total_neto;
        const base = Math.round((totalNeto / 1.18) * 100) / 100;
        const igv = Math.round((totalNeto - base) * 100) / 100;
        const token = `0192d2f4-e7b8-8000-${String(idx + 1).padStart(4, '0')}-${String(Date.now()).slice(-8)}`;

        const titular = s.titular_referencia || (idx === 0 ? 'Carlos Mendoza Quispe' : 'Inversiones Gastronómicas S.A.C.');
        const tipoDoc = isFactura ? 'RUC' : 'DNI';
        const numDoc = s.documento_identidad || (isFactura ? '20601234567' : (idx === 0 ? '72819201' : '45892134'));
        const medio = (s.medio_pago_tentativo as any) || (idx === 0 ? 'billetera_digital' : 'tarjeta');

        // Subcuenta 1 viene con teléfono para demostrar [ Guardado ] [ Modificar ]
        // Subcuentas subsiguientes pueden venir sin teléfono para demostrar [ Registrar ]
        const telDefault = idx === 0 ? '+51 987 654 321' : '';
        const correoDefault = idx === 0 ? 'carlos.mendoza@gmail.com' : 'facturacion@gastronomicas.pe';

        return {
          id: s.id || `sub-${idx + 1}`,
          numero_subcuenta: s.numero_subcuenta || idx + 1,
          titular,
          tipo_documento: tipoDoc,
          numero_documento: numDoc,
          tipo_comprobante: tipoComp,
          serie_numero: serieNum,
          total_neto: totalNeto,
          base_imponible: base,
          igv,
          medio_pago: medio,
          numero_operacion: '',
          monto_recibido: totalNeto,
          vuelto: 0,
          token_digital: token,
          url_publica: `https://app.restaurantcloud.pe/c/${token}`,
          telefono_whatsapp: telDefault,
          correo: correoDefault,
          pagado: false,
        };
      });

      setCuentas(items);

      // Si se abrió apuntando a una subcuenta particular
      if (subcuenta) {
        const foundIdx = items.findIndex((x) => x.id === subcuenta.id);
        if (foundIdx >= 0) setIndexCuentaActiva(foundIdx);
        else setIndexCuentaActiva(0);
      } else {
        setIndexCuentaActiva(0);
      }
    } else {
      // Caso 2: Mesa con cuenta consolidada única (Mesa completa)
      const totalNeto = precuenta?.total_cobro_tentativo || precuenta?.tributacion_sunat.total_neto || mesa.total_consumo || 100.0;
      const tipoComp = precuenta?.tipo_comprobante_sugerido || 'boleta';
      const isFactura = tipoComp === 'factura';
      const serie = isFactura ? 'F001' : 'B001';
      const corr = isFactura ? baseCorrelativoFactura + 1 : baseCorrelativoBoleta + 1;
      const serieNum = `${serie}-${String(corr).padStart(8, '0')}`;

      const base = Math.round((totalNeto / 1.18) * 100) / 100;
      const igv = Math.round((totalNeto - base) * 100) / 100;
      const token = `0192d2f4-e7b8-8000-8000-${String(Date.now()).slice(-8)}`;

      const itemUnico: CuentaFiscalItem = {
        id: `cta-unica-${mesa.id}`,
        numero_subcuenta: 1,
        titular: precuenta?.nombre_cliente_sugerido || 'CONSUMIDOR FINAL',
        tipo_documento: isFactura ? 'RUC' : 'DNI',
        numero_documento: precuenta?.documento_cliente_sugerido || '00000000',
        tipo_comprobante: tipoComp,
        serie_numero: serieNum,
        total_neto: totalNeto,
        base_imponible: base,
        igv,
        medio_pago: (precuenta?.metodo_pago_tentativo as CuentaFiscalItem['medio_pago']) || 'efectivo',
        numero_operacion: precuenta?.numero_operacion_tentativo || '',
        monto_recibido: totalNeto,
        vuelto: 0,
        token_digital: token,
        url_publica: `https://app.restaurantcloud.pe/c/${token}`,
        telefono_whatsapp: '+51 987 654 321',
        correo: 'carlos.mendoza@gmail.com',
        pagado: false,
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
  const entregaDigitalDisponible = !IS_REAL_API;

  // Manejador para copiar URL del comprobante
  const handleCopiarUrl = async () => {
    if (!entregaDigitalDisponible) {
      setNotificacionFeedback('El PDF/XML y el enlace QR estarán disponibles al implementar CU-CAJA-03B.');
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

  // Manejadores para edición y registro de WhatsApp
  const handleIniciarEdicionWhatsapp = () => {
    setInputWhatsappTemp(cuentaActiva.telefono_whatsapp || '+51 ');
    setEditandoWhatsappId(cuentaActiva.id);
  };

  const handleGuardarWhatsapp = () => {
    setCuentas((prev) =>
      prev.map((c) =>
        c.id === cuentaActiva.id ? { ...c, telefono_whatsapp: inputWhatsappTemp.trim() } : c
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

  // Enviar WhatsApp asistido
  const handleEnviarWhatsApp = (cuentaId: string) => {
    if (!entregaDigitalDisponible) {
      setNotificacionFeedback('El envío por WhatsApp se habilitará cuando el comprobante digital esté generado.');
      return;
    }

    setWhatsappEnviado((prev) => ({ ...prev, [cuentaId]: true }));
    setNotificacionFeedback('Comprobante enviado por WhatsApp al comensal exitosamente.');
    setTimeout(() => setNotificacionFeedback(null), 3000);
  };

  // Enviar Email asistido
  const handleEnviarEmail = (cuentaId: string) => {
    if (!entregaDigitalDisponible) {
      setNotificacionFeedback('El envío por correo se habilitará cuando el comprobante digital esté generado.');
      return;
    }

    setEmailEnviado((prev) => ({ ...prev, [cuentaId]: true }));
    setNotificacionFeedback('Comprobante enviado por Correo Electrónico exitosamente.');
    setTimeout(() => setNotificacionFeedback(null), 3000);
  };

  // Confirmar Pago de la Cuenta Activa (o avanzar a la siguiente subcuenta)
  const handleConfirmarPago = async () => {
    // Si la cuenta activa ya estaba pagada y quedan subcuentas pendientes, avanzar a la siguiente pendiente
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

    let res;
    try {
      res = await cajaService.emitirComprobanteFiscal({
        mesa_id: mesa.id,
        pedido_id: mesa.pedido_id || 'ped-caja-default',
        subcuenta_id: cuentas.length > 1 ? cuentaActiva.id : undefined,
        tipo_comprobante: cuentaActiva.tipo_comprobante,
        serie: cuentaActiva.tipo_comprobante === 'factura' ? 'F001' : cuentaActiva.tipo_comprobante === 'nota_venta' ? 'NV01' : 'B001',
        cliente_nombre: cuentaActiva.titular,
        cliente_num_doc: cuentaActiva.numero_documento,
        metodo_pago_codigo: cuentaActiva.medio_pago,
        monto_recibido: cuentaActiva.monto_recibido,
        telefono_envio: cuentaActiva.telefono_whatsapp,
        email_envio: cuentaActiva.correo,
      });
    } catch (error: any) {
      setNotificacionFeedback(
        error.response?.data?.errores?.[0]?.mensaje ?? 'No se pudo emitir el comprobante. Intenta nuevamente.'
      );
      return;
    }

    if (!res.exito || !res.datos) {
      setNotificacionFeedback(res.errores?.[0]?.mensaje ?? 'No se pudo emitir el comprobante.');
      return;
    }

    const cuentasActualizadas = cuentas.map((c, idx) => {
      if (idx === indexCuentaActiva || c.id === cuentaActiva.id) {
        return { ...c, pagado: true };
      }
      return c;
    });
    setCuentas(cuentasActualizadas);

    const quedanPendientes = cuentasActualizadas.filter((c) => !c.pagado).length;

    if (quedanPendientes === 0) {
      // Toda la mesa liquidada y liberada
      if (res.exito && res.datos) {
        onComprobanteEmitido({
          ...res.datos,
          mesa_liberada: true,
          subcuentas_pendientes: 0,
        });
      }
      onClose();
    } else {
      // Avanzar automáticamente a la siguiente subcuenta pendiente
      let siguientePendienteIdx = cuentasActualizadas.findIndex((c, i) => i > indexCuentaActiva && !c.pagado);
      if (siguientePendienteIdx === -1) {
        siguientePendienteIdx = cuentasActualizadas.findIndex((c) => !c.pagado);
      }
      if (siguientePendienteIdx >= 0) {
        setIndexCuentaActiva(siguientePendienteIdx);
        setEditandoWhatsappId(null);
        setEditandoEmailId(null);
      }
      if (res.exito && res.datos) {
        onComprobanteEmitido({
          ...res.datos,
          mesa_liberada: false,
          subcuentas_pendientes: quedanPendientes,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[94vh] shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* ========================================================================= */}
        {/* CABECERA: VISTA 2 DEL WIREFRAME OFICIAL CU-CAJA-03                        */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                  {cuentas.length > 1
                    ? `Cobro y Comprobantes Fiscales • Mesa ${mesa.numero}`
                    : `Cobro Confirmado con Éxito • Mesa ${mesa.numero}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                  T#042
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                <span>Comanda #{precuenta?.numero_comanda || '108'}</span>
                <span>•</span>
                <span>Mozo: {mesa.mozo_nombre || 'Marco Valdivia'}</span>
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
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold">
                Lista para Confirmar
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

        {/* FEEDBACK TOAST DE ENVÍO */}
        {notificacionFeedback && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in slide-in-from-top-2 flex items-center justify-center gap-2 shrink-0">
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
                  <strong className="text-amber-600 dark:text-amber-400">{cuentaActiva.serie_numero}</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                10/10/2026 18:35:12 • Turno #042
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
                <span className="text-[11px] text-slate-500">
                  {cuentaActiva.tipo_documento}: {cuentaActiva.numero_documento}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  MEDIO DE PAGO:
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  {cuentaActiva.medio_pago === 'billetera_digital' ? (
                    `Billetera Digital (Yape / Plin) • Op: ${cuentaActiva.numero_operacion}`
                  ) : cuentaActiva.medio_pago === 'tarjeta' ? (
                    'Tarjeta POS Débito/Crédito (+3.5%)'
                  ) : (
                    `Efectivo • Recibido S/ ${cuentaActiva.monto_recibido.toFixed(2)} • Vuelto S/ ${cuentaActiva.vuelto.toFixed(2)}`
                  )}
                </span>
                <span className="text-[11px] text-slate-500">
                  Estado: {cuentaActiva.pagado ? '✓ Confirmado' : 'Pendiente de cobro en caja'}
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

          {/* 2. TOKEN DIGITAL QR • CERO PAPEL (EXACTO A VISTA 2 WIREFRAME) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            {/* Código QR Vectorial de Alta Definición */}
            <div className="w-36 h-36 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center p-2.5 border border-slate-200 dark:border-slate-700 shrink-0 shadow-inner">
              <svg
                className="w-32 h-32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="100" height="100" fill="white" />
                {/* Posicionadores QR */}
                <rect x="6" y="6" width="26" height="26" fill="#0B2340" rx="4" />
                <rect x="10" y="10" width="18" height="18" fill="white" rx="2" />
                <rect x="14" y="14" width="10" height="10" fill="#D5A06F" rx="2" />

                <rect x="68" y="6" width="26" height="26" fill="#0B2340" rx="4" />
                <rect x="72" y="10" width="18" height="18" fill="white" rx="2" />
                <rect x="76" y="14" width="10" height="10" fill="#D5A06F" rx="2" />

                <rect x="6" y="68" width="26" height="26" fill="#0B2340" rx="4" />
                <rect x="10" y="72" width="18" height="18" fill="white" rx="2" />
                <rect x="14" y="76" width="10" height="10" fill="#D5A06F" rx="2" />

                {/* Módulos de datos simulados */}
                <rect x="36" y="10" width="6" height="6" fill="#0B2340" />
                <rect x="46" y="10" width="6" height="6" fill="#0B2340" />
                <rect x="56" y="10" width="6" height="6" fill="#0B2340" />
                <rect x="36" y="24" width="8" height="8" fill="#D5A06F" />
                <rect x="48" y="24" width="14" height="6" fill="#0B2340" />

                <rect x="10" y="38" width="12" height="6" fill="#0B2340" />
                <rect x="26" y="38" width="16" height="6" fill="#0B2340" />
                <rect x="46" y="38" width="8" height="8" fill="#D5A06F" />
                <rect x="58" y="38" width="14" height="6" fill="#0B2340" />
                <rect x="76" y="38" width="16" height="6" fill="#0B2340" />

                <rect x="10" y="50" width="22" height="8" fill="#0B2340" />
                <rect x="36" y="50" width="14" height="8" fill="#0B2340" />
                <rect x="54" y="50" width="12" height="8" fill="#D5A06F" />
                <rect x="70" y="50" width="22" height="8" fill="#0B2340" />

                <rect x="36" y="68" width="8" height="8" fill="#0B2340" />
                <rect x="48" y="68" width="14" height="8" fill="#D5A06F" />
                <rect x="66" y="68" width="10" height="8" fill="#0B2340" />
                <rect x="80" y="68" width="12" height="8" fill="#0B2340" />

                <rect x="36" y="82" width="16" height="8" fill="#0B2340" />
                <rect x="56" y="82" width="10" height="8" fill="#0B2340" />
                <rect x="70" y="82" width="22" height="8" fill="#D5A06F" />
              </svg>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                TOKEN DIGITAL QR • CERO PAPEL
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {entregaDigitalDisponible ? 'Escaneo Directo por el Comensal' : 'Documento digital pendiente'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                El cliente puede escanear este código con la cámara de su smartphone para ver, verificar y descargar su comprobante oficial en formato PDF.
              </p>
              
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {/* Botón Copiar URL a la izquierda */}
                <button
                  type="button"
                  onClick={handleCopiarUrl}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs shrink-0 ${
                    copiadoUrl
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
                      <span>Copiar</span>
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
                  <span className="text-xs font-medium text-slate-500">Pendiente de generación</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. ENTREGA DIGITAL DIRECTA (OPCIONES ASISTIDAS - VISTA 2 WIREFRAME) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
              ENTREGA DIGITAL DIRECTA (OPCIONES ASISTIDAS)
            </span>

            {/* Fila WhatsApp */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>

                {editandoWhatsappId === cuentaActiva.id ? (
                  // Modo Edición / Registro WhatsApp
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <span className="font-mono text-slate-500 text-[11px] shrink-0">📱 WhatsApp:</span>
                    <input
                      type="tel"
                      value={inputWhatsappTemp}
                      onChange={(e) => setInputWhatsappTemp(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-44"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleGuardarWhatsapp}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoWhatsappId(null)}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold"
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
                        <span className="text-[10px] font-normal text-slate-400 font-mono">[ Guardado ]</span>
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
                disabled={!cuentaActiva.telefono_whatsapp || editandoWhatsappId === cuentaActiva.id}
                onClick={() => handleEnviarWhatsApp(cuentaActiva.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${
                  whatsappEnviado[cuentaActiva.id]
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                    : !cuentaActiva.telefono_whatsapp || editandoWhatsappId === cuentaActiva.id
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{whatsappEnviado[cuentaActiva.id] ? 'Enviado' : 'Confirmar y Enviar'}</span>
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
                        <span className="text-[10px] font-normal text-slate-400 font-mono">[ Guardado ]</span>
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
                disabled={!cuentaActiva.correo || editandoEmailId === cuentaActiva.id}
                onClick={() => handleEnviarEmail(cuentaActiva.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${
                  emailEnviado[cuentaActiva.id]
                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300'
                    : !cuentaActiva.correo || editandoEmailId === cuentaActiva.id
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{emailEnviado[cuentaActiva.id] ? 'Enviado' : 'Confirmar y Enviar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PIE DE ACCIONES: BOTÓN OFICIAL 'CONFIRMAR PAGO'                           */}
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
                PDF pendiente (CU-CAJA-03B)
              </span>
            )}

            <button
              type="button"
              disabled
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 flex items-center gap-1.5 cursor-not-allowed hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket (CERO PAPEL)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleConfirmarPago}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                {cuentas.length > 1
                  ? cuentaActiva.pagado
                    ? 'Siguiente Subcuenta Pendiente'
                    : `Confirmar Pago Subcuenta #${cuentaActiva.numero_subcuenta}`
                  : 'Confirmar Pago'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
