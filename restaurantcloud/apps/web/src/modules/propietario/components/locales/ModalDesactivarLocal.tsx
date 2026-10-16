import React, { useState, useEffect } from 'react';
import {
  LocalItemDTO,
  ValidarBajaResponseDTO,
} from '@/types/propietarioLocales';
import { propietarioLocalesService } from '../../services/propietarioLocalesService';
import { Button } from '@/components/ui/Button';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Receipt,
  UtensilsCrossed,
  Info,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModalDesactivarLocalProps {
  isOpen: boolean;
  local: LocalItemDTO | null;
  onClose: () => void;
  onLocalDesactivado: () => void;
  mostrarToast: (tipo: 'success' | 'error', mensaje: string) => void;
}

export const ModalDesactivarLocal: React.FC<ModalDesactivarLocalProps> = ({
  isOpen,
  local,
  onClose,
  onLocalDesactivado,
  mostrarToast,
}) => {
  const navigate = useNavigate();
  const [validando, setValidando] = useState(true);
  const [auditoria, setAuditoria] = useState<ValidarBajaResponseDTO | null>(null);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (isOpen && local) {
      setValidando(true);
      setConfirmacionTexto('');
      setAuditoria(null);

      propietarioLocalesService
        .validarBajaLocal(local.id)
        .then((res) => {
          if (res.exito && res.datos) {
            setAuditoria(res.datos);
          } else {
            mostrarToast('error', 'Error al auditar el estado de la sede.');
          }
        })
        .catch(() => {
          mostrarToast('error', 'No se pudo conectar con el servicio de auditoría.');
        })
        .finally(() => {
          setValidando(false);
        });
    }
  }, [isOpen, local, mostrarToast]);

  const handleConfirmarBaja = async () => {
    if (!local || confirmacionTexto !== 'DESACTIVAR') return;
    setProcesando(true);
    try {
      const res = await propietarioLocalesService.cambiarEstadoLocal(local.id, {
        nuevo_estado: 'inactivo',
        codigo_confirmacion: 'DESACTIVAR',
      });
      if (res.exito && res.datos) {
        mostrarToast('success', res.datos.mensaje);
        onLocalDesactivado();
        onClose();
      } else {
        const err = res.errores?.[0]?.mensaje || 'No se pudo desactivar el local.';
        mostrarToast('error', err);
      }
    } catch {
      mostrarToast('error', 'Error al procesar la baja de la sede.');
    } finally {
      setProcesando(false);
    }
  };

  if (!isOpen || !local) return null;

  const tieneBloqueos = (auditoria?.bloqueos_operativos.length ?? 0) > 0;
  const esUltimoActivo = auditoria?.es_ultimo_local_activo ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-aurea-navy/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl border-2 border-rose-200/80 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="bg-rose-50/70 border-b border-rose-200/60 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300">
              <AlertOctagon className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-rose-950">
                Desactivar Sede &bull; {local.nombre}
              </h3>
              <p className="text-xs text-rose-800/70">
                Auditoría operativa de seguridad previa a la baja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-800/50 hover:text-rose-900 hover:bg-rose-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[calc(85vh-180px)] overflow-y-auto space-y-5">
          {validando ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-aurea-navy">
              <Loader2 className="w-8 h-8 animate-spin text-aurea-gold" />
              <p className="text-sm font-semibold">
                Verificando estado operativo de la sede en tiempo real...
              </p>
              <p className="text-xs text-aurea-navy/60">
                Auditando cajas abiertas, sesiones de turno y comandas en salón
              </p>
            </div>
          ) : esUltimoActivo ? (
            /* Caso Borde: Es el único local activo */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-sm text-amber-950">
                    Regla de Negocio: Sede Única Activa
                  </h4>
                  <p>
                    {auditoria?.aviso ||
                      'No puedes desactivar la única sede activa de tu restaurante. Tu empresa requiere al menos una sede operativa para funcionar.'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-aurea-navy/70">
                Si deseas suspender toda la suscripción de tu empresa o cambiar de plan, debes
                realizarlo desde la sección <strong>Mi Plan y Facturación</strong>.
              </p>
            </div>
          ) : tieneBloqueos ? (
            /* ================================================================= */
            /* CASO BLOQUEO DURO: CAJAS O PEDIDOS ACTIVOS                        */
            /* ================================================================= */
            <div className="space-y-4">
              {/* Badge Bloqueado */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                  <Lock className="w-4 h-4 text-rose-700" />
                  <span>Desactivación Bloqueada — Actividad Operativa en Curso</span>
                </div>
                <p className="text-xs text-rose-900/80">
                  No es posible desactivar este local mientras existan cajas registradoras abiertas o
                  pedidos pendientes de cobro en el salón.
                </p>
              </div>

              {/* Lista de Bloqueos en tiempo real */}
              <div className="p-4 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/25 space-y-3">
                <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
                  Auditoría Operativa en Tiempo Real
                </h4>

                <div className="space-y-2.5">
                  {auditoria?.bloqueos_operativos.map((bloqueo, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {bloqueo.tipo === 'CAJA_ABIERTA' ? (
                          <Receipt className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <UtensilsCrossed className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-aurea-navy">
                            {bloqueo.tipo === 'CAJA_ABIERTA' ? 'Turno de Caja' : 'Comandas en Salón'}
                          </div>
                          <p className="text-xs text-rose-900 font-semibold mt-0.5">
                            {bloqueo.descripcion}
                          </p>
                          {bloqueo.responsable && (
                            <p className="text-[11px] text-aurea-navy/70">
                              Responsable: {bloqueo.responsable} &bull; S/.{' '}
                              {bloqueo.monto_acumulado?.toFixed(2)}
                            </p>
                          )}
                          {bloqueo.mesas_afectadas && (
                            <p className="text-[11px] text-aurea-navy/70">
                              Mesas comprometidas: {bloqueo.mesas_afectadas.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClose();
                          navigate('/admin/dashboard');
                        }}
                        className="text-xs shrink-0 border-aurea-copper/30 text-aurea-navy hover:bg-aurea-ivory flex items-center gap-1"
                      >
                        <span>
                          {bloqueo.tipo === 'CAJA_ABIERTA' ? 'Ir a Caja' : 'Ver Comandas'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mensaje de desbloqueo */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Una vez cerrados los turnos y liquidadas las comandas podrás desactivar la sede sin
                  perder datos históricos ni reportes.
                </span>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* CASO LIMPIO: DESACTIVABLE (CONFIRMACIÓN EXPLÍCITA 'DESACTIVAR')   */
            /* ================================================================= */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-800 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Consecuencias de la desactivación</span>
                </div>
                <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc list-inside">
                  <li>
                    La <strong>carta digital pública</strong> ({local.slug}) quedará suspendida.
                  </li>
                  <li>
                    El personal asignado a este local no podrá iniciar turnos operativos.
                  </li>
                  <li>
                    Se <strong>liberará 1 cupo</strong> de tu plan para registrar una nueva sede.
                  </li>
                  <li>
                    Tus ventas históricas, boletas y reportes tributarios continuarán 100% seguros y
                    disponibles en Propietario.
                  </li>
                </ul>
              </div>

              {/* Input Challenge: 'DESACTIVAR' */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-aurea-navy mb-1.5">
                  Para confirmar, escribe exactamente <span className="font-mono text-rose-600">DESACTIVAR</span> en el campo inferior:
                </label>
                <input
                  type="text"
                  placeholder="DESACTIVAR"
                  value={confirmacionTexto}
                  onChange={(e) => setConfirmacionTexto(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 text-sm font-mono tracking-wider rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-rose-50/50 border-t border-rose-200/50 px-6 py-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-aurea-navy/70 hover:bg-rose-100"
          >
            {tieneBloqueos || esUltimoActivo ? 'Cerrar' : 'Cancelar'}
          </Button>

          {tieneBloqueos || esUltimoActivo ? (
            <Button
              type="button"
              disabled={true}
              className="text-xs px-5 py-2.5 bg-rose-100 text-rose-400 font-bold border border-rose-200 cursor-not-allowed flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Desactivar (Bloqueado)</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConfirmarBaja}
              disabled={confirmacionTexto !== 'DESACTIVAR' || procesando}
              className="text-xs px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-sm disabled:opacity-40"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Desactivando...</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-4 h-4" />
                  <span>Confirmar Desactivación</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
