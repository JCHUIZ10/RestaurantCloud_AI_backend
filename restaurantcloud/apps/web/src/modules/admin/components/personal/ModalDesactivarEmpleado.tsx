import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  UserX,
  UtensilsCrossed,
  ShieldAlert,
  Layers,
  Clock,
} from 'lucide-react';
import {
  EmpleadoResumenDTO,
  PrecheckDesactivacionDTO,
} from '@/types/admin';
import { mockAdminService } from '../../services/mockAdminService';

interface ModalDesactivarEmpleadoProps {
  abierto: boolean;
  onCerrar: () => void;
  empleado: EmpleadoResumenDTO | null;
  mozosDisponibles: EmpleadoResumenDTO[];
  onConfirmarDesactivacion: (
    id: string,
    mozoSustitutoId?: string,
    motivo?: string
  ) => Promise<boolean>;
}

export const ModalDesactivarEmpleado: React.FC<ModalDesactivarEmpleadoProps> = ({
  abierto,
  onCerrar,
  empleado,
  mozosDisponibles,
  onConfirmarDesactivacion,
}) => {
  const [cargandoPrecheck, setCargandoPrecheck] = useState(false);
  const [precheck, setPrecheck] = useState<PrecheckDesactivacionDTO | null>(null);
  const [mozoSustitutoId, setMozoSustitutoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (abierto && empleado) {
      setCargandoPrecheck(true);
      setErrorMsg(null);
      setMozoSustitutoId(mozosDisponibles[0]?.id || '');
      setMotivo('Fin de turno o reestructuración operativa');

      mockAdminService
        .precheckDesactivarEmpleado(empleado.id)
        .then((res) => {
          if (res.exito && res.datos) {
            setPrecheck(res.datos);
          }
        })
        .finally(() => {
          setCargandoPrecheck(false);
        });
    } else {
      setPrecheck(null);
      setErrorMsg(null);
    }
  }, [abierto, empleado, mozosDisponibles]);

  if (!abierto || !empleado) return null;

  const handleConfirmar = async () => {
    setErrorMsg(null);

    if (precheck?.requiere_reasignacion && !mozoSustitutoId) {
      setErrorMsg('Debes seleccionar un mozo sustituto para reasignar las comandas activas.');
      return;
    }

    setProcesando(true);
    try {
      const ok = await onConfirmarDesactivacion(
        empleado.id,
        precheck?.requiere_reasignacion ? mozoSustitutoId : undefined,
        motivo.trim()
      );
      if (ok) {
        onCerrar();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al procesar la desactivación.');
    } finally {
      setProcesando(false);
    }
  };

  const tieneCajaAbierta = !!precheck?.caja_abierta_pendiente;
  const tieneMesasPendientes = !!precheck?.requiere_reasignacion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-aurea-champagne/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-aurea-navy">
                Desactivar Colaborador
              </h2>
              <p className="text-xs text-slate-500">
                {empleado.nombre} • Rol: {empleado.rol.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {cargandoPrecheck ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
              <div className="w-6 h-6 border-2 border-aurea-copper border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Verificando turnos y comandas activas...</span>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* CASO 1: BLOQUEO POR CAJA ABIERTA */}
              {tieneCajaAbierta && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        Acción Bloqueada: Turno de Caja Abierto
                      </h4>
                      <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                        El colaborador mantiene una caja chica en operación con dinero en custodia. Para salvaguardar la integridad contable, primero debe cerrarse el turno en el módulo de Caja.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/80 border border-amber-200/80 text-xs text-amber-950 flex items-center justify-between">
                    <div>
                      <span className="font-semibold block">{precheck?.caja_abierta_pendiente?.nombre_caja}</span>
                      <span className="text-[11px] text-slate-500">
                        Apertura: {precheck?.caja_abierta_pendiente?.apertura_fecha}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-700">
                      S/ {precheck?.caja_abierta_pendiente?.monto_apertura.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* CASO 2: MOZO CON MESAS PENDIENTES - EXIGIR REASIGNACIÓN */}
              {tieneMesasPendientes && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <AlertTriangle className="w-4 h-4 text-blue-600" />
                      <span>Comandas Activas en Salón ({precheck?.mesas_activas_pendientes.length})</span>
                    </div>
                    <p className="text-blue-800/90 leading-relaxed">
                      El mozo tiene pedidos en curso. Es obligatorio seleccionar un mozo sustituto para transferir las comandas sin interrupciones para los clientes ni para cocina.
                    </p>
                  </div>

                  {/* Detalle de comandas */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    {precheck?.mesas_activas_pendientes.map((m) => (
                      <div
                        key={m.mesa_id}
                        className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <div>
                            <span className="font-semibold text-slate-800">{m.mesa_codigo}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5">({m.piso_nombre})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-slate-800">
                            S/ {m.monto_actual.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block flex items-center justify-end gap-1">
                            <Clock className="w-2.5 h-2.5" /> {m.minutos_activa} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selector de Mozo Sustituto */}
                  <div>
                    <label className="block text-xs font-bold text-aurea-navy mb-1 uppercase tracking-wider">
                      Reasignar mesas a Mozo Sustituto *
                    </label>
                    <div className="relative">
                      <UtensilsCrossed className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={mozoSustitutoId}
                        onChange={(e) => setMozoSustitutoId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper"
                      >
                        {mozosDisponibles.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre} ({m.mesas_activas_count || 0} mesas actuales)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* CASO 3: DESACTIVACIÓN DIRECTA SIN IMPACTO */}
              {!tieneCajaAbierta && !tieneMesasPendientes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  Al desactivar a <strong>{empleado.nombre}</strong>, se revocará de inmediato su acceso a la sede y se <strong>liberará 1 cupo</strong> en el Plan Pro. Sus registros históricos permanecerán intactos y podrás reactivarlo en cualquier momento.
                </div>
              )}

              {/* Motivo de desactivación */}
              {!tieneCajaAbierta && (
                <div>
                  <label className="block text-xs font-bold text-aurea-navy mb-1 uppercase tracking-wider">
                    Motivo de la Desactivación
                  </label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej. Fin de turno, descanso médico, cambio de sede..."
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper"
                  />
                </div>
              )}
            </>
          )}

          {/* Botones inferiores */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
            >
              Cancelar
            </button>
            {tieneCajaAbierta ? (
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
              >
                Cerrar Caja Primero
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={procesando || cargandoPrecheck}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {procesando
                  ? 'Desactivando...'
                  : tieneMesasPendientes
                  ? 'Confirmar y Reasignar Mesas'
                  : 'Desactivar Colaborador'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
