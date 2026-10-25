import React, { useState, useEffect, useId } from 'react';
import { AlertCircle, UserX, ShieldAlert, Layers, Clock, ArrowRightLeft } from 'lucide-react';
import { EmpleadoResumenDTO, PrecheckDesactivacionDTO } from '@/types/admin';
import { mockAdminService } from '../../services/mockAdminService';
import { Button, Modal, Skeleton } from '@/components/ui';
import { ROLES_PERSONAL } from './rolesPersonal';

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

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';

export const ModalDesactivarEmpleado: React.FC<ModalDesactivarEmpleadoProps> = ({
  abierto,
  onCerrar,
  empleado,
  mozosDisponibles,
  onConfirmarDesactivacion,
}) => {
  const idForm = useId();
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

  if (!empleado) return null;

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (precheck?.requiere_reasignacion && !mozoSustitutoId) {
      setErrorMsg('Elige a quién pasarle sus mesas.');
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
      setErrorMsg(err?.message || 'No se pudo desactivar.');
    } finally {
      setProcesando(false);
    }
  };

  const caja = precheck?.caja_abierta_pendiente;
  const mesas = precheck?.requiere_reasignacion ? precheck.mesas_activas_pendientes : [];
  const rol = ROLES_PERSONAL[empleado.rol];

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!procesando}
      tono={caja ? 'alerta' : 'error'}
      icono={caja ? ShieldAlert : UserX}
      etiqueta={rol ? `${rol.etiqueta} · ${empleado.nombre}` : empleado.nombre}
      titulo={caja ? 'Primero debe cerrar su caja' : 'Desactivar acceso'}
      pie={
        caja ? (
          <Button onClick={onCerrar}>Entendido</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onCerrar} disabled={procesando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={idForm}
              variant="danger"
              loading={procesando}
              disabled={cargandoPrecheck}
              leftIcon={mesas.length > 0 ? <ArrowRightLeft className="w-4 h-4" aria-hidden="true" /> : <UserX className="w-4 h-4" aria-hidden="true" />}
            >
              {mesas.length > 0 ? 'Pasar mesas y desactivar' : 'Desactivar'}
            </Button>
          </>
        )
      }
    >
      {cargandoPrecheck ? (
        <div className="space-y-3" aria-busy="true" aria-label="Revisando turnos y mesas">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      ) : caja ? (
        <div className="space-y-3 text-sm text-aurea-navy/80">
          <p>Tiene una caja abierta con dinero a su cargo. Ciérrala desde el módulo de Caja y vuelve a intentarlo.</p>
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-estado-alerta-50 border border-estado-alerta-200">
            <span>
              <span className="block font-semibold text-estado-alerta-900">{caja.nombre_caja}</span>
              <span className="text-xs text-estado-alerta-800">Abierta {caja.apertura_fecha}</span>
            </span>
            <span className="font-mono font-bold text-estado-alerta-900">S/ {caja.monto_apertura.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <form id={idForm} onSubmit={handleConfirmar} noValidate className="space-y-4">
          {errorMsg && (
            <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {errorMsg}
            </p>
          )}

          {mesas.length > 0 ? (
            <section className="space-y-3">
              <p className="text-sm text-aurea-navy/80">
                Está atendiendo {mesas.length === 1 ? '1 mesa' : `${mesas.length} mesas`}. Pásalas a otro mozo para que nadie se quede sin atención.
              </p>
              <ul className="max-h-40 overflow-y-auto rounded-xl border border-blue-200 divide-y divide-blue-100 bg-blue-50/40">
                {mesas.map((m) => (
                  <li key={m.mesa_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                      <span className="font-semibold text-aurea-navy">{m.mesa_codigo}</span>
                      <span className="text-xs text-aurea-navy/60 truncate">{m.piso_nombre}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-aurea-navy/60">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {m.minutos_activa} min
                      </span>
                      <span className="font-mono font-semibold text-aurea-navy">S/ {m.monto_actual.toFixed(2)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div>
                <label htmlFor={`${idForm}-sustituto`} className="block text-sm font-semibold text-aurea-navy mb-1.5">
                  Pasar sus mesas a
                </label>
                <select
                  id={`${idForm}-sustituto`}
                  value={mozoSustitutoId}
                  onChange={(e) => setMozoSustitutoId(e.target.value)}
                  className={CLASE_CONTROL}
                >
                  {mozosDisponibles.length === 0 && <option value="">No hay otro mozo activo</option>}
                  {mozosDisponibles.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} · {m.mesas_activas_count || 0} {(m.mesas_activas_count || 0) === 1 ? 'mesa' : 'mesas'}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          ) : (
            <p className="text-sm text-aurea-navy/80">
              Perderá el acceso de inmediato y se liberará un cupo de tu plan. Su historial se conserva y puedes reactivarlo cuando quieras.
            </p>
          )}

          <div>
            <label htmlFor={`${idForm}-motivo`} className="block text-sm font-semibold text-aurea-navy mb-1.5">
              Motivo
            </label>
            <input
              id={`${idForm}-motivo`}
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Fin de contrato, descanso médico, cambio de local"
              className={CLASE_CONTROL}
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
