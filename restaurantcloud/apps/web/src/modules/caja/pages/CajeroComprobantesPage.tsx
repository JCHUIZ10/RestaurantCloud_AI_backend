import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Receipt, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { cajaService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import { cn } from '@/shared/utils';
import type {
  ComprobanteHistorialItemDTO,
  EmitirNotaCreditoResponseDTO,
  EstadoHistorialComprobantes,
  HistorialComprobantesResponseDTO,
  MedioPagoCodigo,
} from '@/types/caja';
import { ResumenTurnoComprobantes } from '../components/comprobantes/ResumenTurnoComprobantes';
import { FiltrosHistorialComprobantes } from '../components/comprobantes/FiltrosHistorialComprobantes';
import { TablaHistorialComprobantes } from '../components/comprobantes/TablaHistorialComprobantes';
import { DrawerDetalleComprobante } from '../components/comprobantes/DrawerDetalleComprobante';
import { ModalEmisionNotaCredito } from '../components/comprobantes/ModalEmisionNotaCredito';

const FILAS_POR_PAGINA = 10;

type TipoFiltro = 'todos' | 'boleta' | 'factura' | 'nota_venta';
type MedioFiltro = 'todos' | MedioPagoCodigo;

const ESTADOS: EstadoHistorialComprobantes[] = ['vigente', 'anulado', 'nota_credito', 'todos'];
const TIPOS: TipoFiltro[] = ['todos', 'boleta', 'factura', 'nota_venta'];
const MEDIOS: MedioFiltro[] = ['todos', 'efectivo', 'tarjeta', 'billetera_digital'];

const ESTADO_DEFECTO: EstadoHistorialComprobantes = 'vigente';

/** Valor del parámetro de la URL si es uno de los permitidos; si no, el valor por defecto. */
function elegir<T extends string>(valor: string | null, permitidos: readonly T[], defecto: T): T {
  return permitidos.includes(valor as T) ? (valor as T) : defecto;
}

interface ErrorCarga {
  codigo?: string;
  mensaje: string;
}

interface ToastEstado {
  tipo: 'success' | 'error';
  mensaje: string;
}

export const CajeroComprobantesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Los filtros viven en la URL: sobreviven a un refresco y funcionan con el botón Atrás.
  const estado = elegir(searchParams.get('estado'), ESTADOS, ESTADO_DEFECTO);
  const tipo = elegir(searchParams.get('tipo'), TIPOS, 'todos');
  const medio = elegir(searchParams.get('medio'), MEDIOS, 'todos');
  const busqueda = searchParams.get('q') ?? '';
  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1);

  const [recarga, setRecarga] = useState(0);
  const claveSolicitud = `${searchParams.toString()}#${recarga}`;

  const [datos, setDatos] = useState<HistorialComprobantesResponseDTO | null>(null);
  const [errorCarga, setErrorCarga] = useState<ErrorCarga | null>(null);
  const [claveCargada, setClaveCargada] = useState<string | null>(null);
  const cargando = claveCargada !== claveSolicitud;

  const [seleccionado, setSeleccionado] = useState<ComprobanteHistorialItemDTO | null>(null);
  const [comprobanteParaAnular, setComprobanteParaAnular] = useState<ComprobanteHistorialItemDTO | null>(null);

  const [toast, setToast] = useState<ToastEstado | null>(null);
  const temporizadorToast = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notificar = useCallback((tipoToast: ToastEstado['tipo'], mensaje: string) => {
    if (temporizadorToast.current) clearTimeout(temporizadorToast.current);
    setToast({ tipo: tipoToast, mensaje });
    temporizadorToast.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(
    () => () => {
      if (temporizadorToast.current) clearTimeout(temporizadorToast.current);
    },
    []
  );

  // Carga del historial. Una respuesta de una consulta anterior se descarta si los filtros ya cambiaron.
  useEffect(() => {
    let vigente = true;

    cajaService
      .getHistorialComprobantes({ estado, tipo, medio_pago: medio, q: busqueda, pagina, limite: FILAS_POR_PAGINA })
      .then((res) => {
        if (!vigente) return;
        if (res.exito && res.datos) {
          setDatos(res.datos);
          setErrorCarga(null);
        } else {
          setErrorCarga({
            codigo: res.errores?.[0]?.codigo,
            mensaje: res.errores?.[0]?.mensaje || 'No se pudo cargar el historial de comprobantes.',
          });
        }
        setClaveCargada(claveSolicitud);
      })
      .catch((err) => {
        if (!vigente) return;
        setErrorCarga({ mensaje: mensajeDeErrorApi(err, 'No se pudo cargar el historial de comprobantes.') });
        setClaveCargada(claveSolicitud);
      });

    return () => {
      vigente = false;
    };
  }, [claveSolicitud, estado, tipo, medio, busqueda, pagina]);

  const actualizarFiltros = useCallback(
    (cambios: Partial<{ estado: EstadoHistorialComprobantes; tipo: TipoFiltro; medio: MedioFiltro; q: string; pagina: number }>) => {
      const siguiente = {
        estado,
        tipo,
        medio,
        q: busqueda,
        // Cambiar cualquier filtro vuelve a la primera página
        pagina: cambios.pagina ?? 1,
        ...cambios,
      };

      const params = new URLSearchParams();
      if (siguiente.estado !== ESTADO_DEFECTO) params.set('estado', siguiente.estado);
      if (siguiente.tipo !== 'todos') params.set('tipo', siguiente.tipo);
      if (siguiente.medio !== 'todos') params.set('medio', siguiente.medio);
      if (siguiente.q) params.set('q', siguiente.q);
      if (siguiente.pagina > 1) params.set('pagina', String(siguiente.pagina));
      setSearchParams(params);
    },
    [estado, tipo, medio, busqueda, setSearchParams]
  );

  // F4 vuelve al POS (la misma tecla que lo abre); no actúa mientras se emite una nota de crédito.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== 'F4' || comprobanteParaAnular) return;
      e.preventDefault();
      navigate(ROUTES.CAJERO_POS);
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [navigate, comprobanteParaAnular]);

  const verDocumento = (token?: string | null) => {
    if (!token) {
      notificar('error', 'Este documento todavía no tiene un enlace digital disponible.');
      return;
    }
    window.open(ROUTES.COMPROBANTE_DIRECTO(token), '_blank', 'noopener,noreferrer');
  };

  const iniciarAnulacion = (comprobante: ComprobanteHistorialItemDTO) => {
    // El detalle se cierra: la emisión de la NC se hace sobre una sola capa
    setSeleccionado(null);
    setComprobanteParaAnular(comprobante);
  };

  const alEmitirNotaCredito = (nc: EmitirNotaCreditoResponseDTO) => {
    notificar('success', `Nota de Crédito ${nc.serie_numero} emitida. Comprobante ${nc.documento_modificado} anulado.`);
    setRecarga((n) => n + 1);
  };

  const recargar = () => setRecarga((n) => n + 1);

  // La fila abierta se mantiene al día con la lista recargada
  const filaSeleccionada = seleccionado
    ? datos?.comprobantes.find((c) => c.id === seleccionado.id) ?? seleccionado
    : null;

  const turno = datos?.turno;
  const cajaCerrada = errorCarga?.codigo === 'ERR_CAJA_CERRADA';

  return (
    <div className="relative w-full space-y-4 pb-10">
      {toast && (
        <div
          role="status"
          className={cn(
            'fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium flex items-center gap-2.5 animate-in slide-in-from-top-3 max-w-md',
            toast.tipo === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-600'
              : 'bg-rose-900/90 text-rose-100 border-rose-600'
          )}
        >
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.mensaje}</span>
        </div>
      )}

      {/* Cabecera */}
      <header className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30 hidden sm:flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Comprobantes del turno</h1>
            <p className="text-sm text-slate-500 truncate">
              {turno ? (
                <>
                  <span className="font-mono font-bold text-emerald-700">
                    Turno #{String(turno.correlativo).padStart(3, '0')} abierto
                  </span>{' '}
                  · Cajero: <strong>{turno.cajero_nombre}</strong>
                </>
              ) : (
                'Ventas, trazabilidad fiscal SUNAT y notas de crédito'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={recargar}
            disabled={cargando}
            className="min-h-tactil min-w-tactil px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-700 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            aria-label="Actualizar listado"
          >
            <RefreshCw className={cn('w-4 h-4', cargando && 'animate-spin')} aria-hidden="true" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAJERO_POS)}
            className="min-h-tactil px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-1.5 transition-colors shrink-0"
            title="Volver al punto de venta (F4)"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Volver al POS</span>
          </button>
        </div>
      </header>

      {/* Sin turno abierto */}
      {cajaCerrada && (
        <div className="py-14 px-4 text-center rounded-3xl bg-white border-2 border-dashed border-slate-200 space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-slate-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700">No hay un turno de caja abierto en esta sede</p>
          <p className="text-sm text-slate-500">Abra un turno desde el punto de venta para registrar y consultar comprobantes.</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAJERO_POS)}
            className="min-h-tactil px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors"
          >
            Ir al punto de venta
          </button>
        </div>
      )}

      {/* Error de carga con datos previos o sin ellos */}
      {errorCarga && !cajaCerrada && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {errorCarga.mensaje}
          </span>
          <button
            type="button"
            onClick={recargar}
            className="min-h-10 px-3 rounded-xl border border-rose-300 bg-white hover:bg-rose-100 font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Primera carga */}
      {!datos && !errorCarga && (
        <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Cargando comprobantes">
          <div className="h-24 rounded-2xl bg-white border border-slate-200" />
          <div className="h-24 rounded-2xl bg-white border border-slate-200" />
          <div className="h-72 rounded-2xl bg-white border border-slate-200" />
        </div>
      )}

      {datos && !cajaCerrada && (
        <>
          <ResumenTurnoComprobantes
            resumen={datos.resumen}
            medioActivo={medio}
            onSeleccionarMedio={(m) => actualizarFiltros({ medio: m })}
          />

          <FiltrosHistorialComprobantes
            estado={estado}
            tipo={tipo}
            medio={medio}
            medios={datos.resumen.por_medio}
            busqueda={busqueda}
            conteos={{
              vigentes: datos.resumen.vigentes_count,
              anulados: datos.resumen.anulados_count,
              notasCredito: datos.resumen.notas_credito.count,
            }}
            onCambiarEstado={(e) => actualizarFiltros({ estado: e })}
            onCambiarTipo={(t) => actualizarFiltros({ tipo: t })}
            onCambiarMedio={(m) => actualizarFiltros({ medio: m })}
            onBuscar={(q) => actualizarFiltros({ q })}
          />

          <TablaHistorialComprobantes
            comprobantes={datos.comprobantes}
            paginacion={datos.paginacion}
            seleccionadoId={filaSeleccionada?.id ?? null}
            cargando={cargando}
            onSeleccionar={setSeleccionado}
            onVerDocumento={verDocumento}
            onAnular={iniciarAnulacion}
            onCambiarPagina={(p) => actualizarFiltros({ pagina: p })}
          />

          <p className="text-sm text-slate-500 text-center">
            <span className="font-semibold text-slate-700">Normativa SUNAT:</span> los comprobantes emitidos son
            inmutables; las rectificaciones requieren una Nota de Crédito.
          </p>
        </>
      )}

      <DrawerDetalleComprobante
        comprobante={filaSeleccionada}
        onCerrar={() => setSeleccionado(null)}
        onVerDocumento={verDocumento}
        onAnular={iniciarAnulacion}
        onContactoActualizado={recargar}
      />

      {comprobanteParaAnular && (
        <ModalEmisionNotaCredito
          isOpen
          comprobanteId={comprobanteParaAnular.id}
          onClose={() => setComprobanteParaAnular(null)}
          onNotaCreditoEmitida={alEmitirNotaCredito}
        />
      )}
    </div>
  );
};
