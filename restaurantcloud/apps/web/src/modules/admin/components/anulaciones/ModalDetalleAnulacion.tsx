import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CookingPot,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { PedidoAnulacionItemDTO } from '@/types/admin';

interface ModalDetalleAnulacionProps {
  isOpen: boolean;
  onClose: () => void;
  anulacion: PedidoAnulacionItemDTO | null;
  onMarcarRevisado: (id: string, notas?: string) => Promise<boolean>;
  onEscalarIncidente: (anulacion: PedidoAnulacionItemDTO) => void;
}

export const ModalDetalleAnulacion: React.FC<ModalDetalleAnulacionProps> = ({
  isOpen,
  onClose,
  anulacion,
  onMarcarRevisado,
  onEscalarIncidente,
}) => {
  const [notasSupervision, setNotasSupervision] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mostrarCampoNotas, setMostrarCampoNotas] = useState(false);

  useEffect(() => {
    if (anulacion) {
      setNotasSupervision(anulacion.notas_supervision || '');
      setMostrarCampoNotas(false);
    }
  }, [anulacion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !procesando) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, procesando]);

  if (!isOpen || !anulacion) return null;

  const handleRevisarSubmit = async () => {
    setProcesando(true);
    try {
      const ok = await onMarcarRevisado(anulacion.id, notasSupervision.trim() || undefined);
      if (ok) {
        onClose();
      }
    } finally {
      setProcesando(false);
    }
  };

  const formatearHora = (iso: string) => {
    return new Date(iso).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getCategoriaLabel = (cat: string) => {
    switch (cat) {
      case 'demora_cliente':
        return 'Demora en entrega / Desistimiento';
      case 'error_registro':
        return 'Error de digitación o comanda duplicada';
      case 'queja_calidad':
        return 'Disconformidad / Queja de calidad';
      case 'cambio_plato':
        return 'Cambio de plato por cliente';
      case 'retiro_sin_consumo':
        return 'Retiro de mesa sin consumo';
      default:
        return 'Otro motivo justificado';
    }
  };

  const getEstadoAnteriorLabel = (est: string) => {
    switch (est) {
      case 'en_cola':
        return 'En Cola (KDS)';
      case 'en_preparacion':
        return 'En Preparación (Cocina)';
      case 'listo':
        return 'Listo en Pase';
      case 'servido':
        return 'Servido en Mesa';
      default:
        return est;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto transition-all transform max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-500/20 text-amber-400 font-mono text-xs px-2 py-0.5 rounded-md font-bold tracking-wider border border-amber-500/30">
                {anulacion.codigo}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ficha de Auditoría de Anulación
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
              Registro inmutable en tabla especializada <code className="text-slate-300">pedido_anulacion</code> (PostgreSQL 16 RLS)
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={procesando}
            aria-label="Cerrar modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Banner de Estado de Auditoría */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estado de Supervisión:
              </span>
              {anulacion.revisado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  REVISADO Y AUDITADO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  PENDIENTE DE REVISIÓN
                </span>
              )}
            </div>

            {anulacion.incidente_codigo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                Incidente: {anulacion.incidente_codigo}
              </span>
            )}
          </div>

          {/* Bloque 1: Identificación y Responsables */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              1. Identificación y Responsables en Sala
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Mesa de Origen</span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {anulacion.mesa_numero}
                </span>
              </div>
              <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Tipo Anulación</span>
                <span className="font-bold text-slate-800 text-xs sm:text-sm capitalize">
                  {anulacion.tipo_anulacion === 'item_individual' ? 'Ítem Individual' : 'Comanda Completa'}
                </span>
              </div>
              <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Mozo Titular</span>
                <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate block" title={anulacion.mozo_nombre}>
                  {anulacion.mozo_nombre}
                </span>
              </div>
              <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Anulado Por</span>
                <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate block" title={anulacion.anulado_por_nombre}>
                  {anulacion.anulado_por_nombre}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 2: Trazabilidad Temporal de Auditoría */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              2. Trazabilidad Temporal de Auditoría
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/80">
                <span className="text-[11px] font-medium text-blue-700/80 block">Hora Pedido</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
                  {formatearHora(anulacion.pedido_created_at)}
                </span>
                <span className="text-[10px] text-slate-500 block">pedido_created_at</span>
              </div>

              <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/80">
                <span className="text-[11px] font-medium text-amber-700/80 block">Hora Anulación</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
                  {formatearHora(anulacion.anulado_at)}
                </span>
                <span className="text-[10px] text-slate-500 block">anulado_at</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-600 block">Tiempo de Espera</span>
                <span
                  className={`font-bold text-xs sm:text-sm font-mono flex items-center gap-1 ${
                    anulacion.minutos_espera >= 20
                      ? 'text-rose-600'
                      : anulacion.minutos_espera >= 10
                      ? 'text-amber-600'
                      : 'text-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 inline" />
                  {anulacion.minutos_espera} min
                </span>
                <span className="text-[10px] text-slate-500 block">minutos_espera</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-600 block">Estado al Corte</span>
                <span className="font-semibold text-slate-800 text-xs sm:text-sm block">
                  {getEstadoAnteriorLabel(anulacion.estado_anterior)}
                </span>
                <span className="text-[10px] text-slate-500 block">estado_anterior</span>
              </div>
            </div>

            {/* Evaluación contextual del sistema */}
            <div
              className={`p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 border ${
                anulacion.minutos_espera >= 20
                  ? 'bg-amber-50/80 text-amber-900 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  anulacion.minutos_espera >= 20 ? 'text-amber-600' : 'text-slate-400'
                }`}
              />
              <div>
                {anulacion.minutos_espera >= 20 ? (
                  <span>
                    <strong>Demora confirmada:</strong> El plato superó el umbral estándar de 20 minutos de preparación en cocina. La justificación de retiro o molestia del cliente se encuentra respaldada por la cronología objetiva del sistema.
                  </span>
                ) : anulacion.minutos_espera <= 3 ? (
                  <span>
                    <strong>Anulación temprana (≤ 3 min):</strong> Corrección inmediata en comanda comúnmente atribuible a rectificación rápida por digitación o cambio inmediato pedido por el comensal.
                  </span>
                ) : (
                  <span>
                    <strong>Espera moderada:</strong> El pedido avanzó {anulacion.minutos_espera} minutos en el flujo operativo antes de ejecutarse la anulación.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 3: Motivo y Justificación Textual */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              3. Motivo y Justificación Textual del Mozo
            </h4>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Categoría:</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {getCategoriaLabel(anulacion.motivo_categoria)}
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 relative">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Declaración Justificada (Obligatoria según CU-MOZO-06):
              </span>
              <p className="text-slate-800 text-xs sm:text-sm italic leading-relaxed whitespace-pre-wrap font-serif">
                &ldquo;{anulacion.motivo_detalle}&rdquo;
              </p>
            </div>
          </div>

          {/* Bloque 4: Impacto Culinario y Merma Contable */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CookingPot className="w-4 h-4 text-emerald-600" />
              4. Impacto Culinario y Merma Contable
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] text-slate-500 font-medium block">Ítem / Comanda</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {anulacion.cantidad}x {anulacion.producto_nombre}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Valor de Carta: S/ {anulacion.monto_total.toFixed(2)}
                  {anulacion.partida_cocina && ` • Partida: ${anulacion.partida_cocina}`}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  anulacion.es_merma
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Auditoría de Merma en Cocina
                </span>
                <span className="font-bold text-xs sm:text-sm block mt-0.5">
                  {anulacion.es_merma ? '⚠️ Con Merma Culinaria' : '🍳 Sin Merma Contable'}
                </span>
                <p className="text-xs mt-1 leading-snug">
                  {anulacion.es_merma ? (
                    <>
                      Se imputa un costo directo de insumos de <strong>S/ {(anulacion.costo_merma || 0).toFixed(2)}</strong> por plato ya preparado o en fuego avanzado que no pudo reaprovecharse.
                    </>
                  ) : (
                    <>
                      La preparación fue abortada a tiempo en KDS o la comanda no llegó a cocción; no existe pérdida de insumos en bodega.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Bloque 5: Notas de Supervisión Administrativa */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                5. Dictamen y Notas de Supervisión
              </h4>
              {!anulacion.revisado && !mostrarCampoNotas && (
                <button
                  type="button"
                  onClick={() => setMostrarCampoNotas(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  + Agregar nota de revisión
                </button>
              )}
            </div>

            {anulacion.revisado ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Auditado por: <strong>{anulacion.revisado_por_nombre || 'Administración'}</strong></span>
                  <span>{anulacion.revisado_at ? new Date(anulacion.revisado_at).toLocaleString('es-PE') : ''}</span>
                </div>
                {anulacion.notas_supervision ? (
                  <p className="text-slate-700 font-medium pt-1 italic">
                    &ldquo;{anulacion.notas_supervision}&rdquo;
                  </p>
                ) : (
                  <p className="text-slate-400 italic">Sin observaciones adicionales.</p>
                )}
              </div>
            ) : mostrarCampoNotas ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Observación o instrucción de supervisión (Opcional):
                </label>
                <textarea
                  value={notasSupervision}
                  onChange={(e) => setNotasSupervision(e.target.value)}
                  rows={2}
                  placeholder="Ej. Se conversó con mozo sobre tiempos en salón; verificado con jefe de cocina..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Esta anulación aún no cuenta con acuse de recibo de la administración de sede.
              </p>
            )}
          </div>
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {!anulacion.incidente_codigo ? (
              <button
                type="button"
                onClick={() => onEscalarIncidente(anulacion)}
                disabled={procesando}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Escalar a Incidente (CU-ADMIN-11)
              </button>
            ) : (
              <span className="text-xs text-purple-700 font-semibold inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vinculado a expediente {anulacion.incidente_codigo}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={procesando}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/80 transition-colors"
            >
              Cerrar
            </button>

            {!anulacion.revisado && (
              <button
                type="button"
                onClick={handleRevisarSubmit}
                disabled={procesando}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {procesando ? 'Guardando...' : 'Marcar como Revisado'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
