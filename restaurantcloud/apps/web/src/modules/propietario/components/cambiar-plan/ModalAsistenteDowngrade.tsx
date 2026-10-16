import React, { useState, useEffect } from 'react';
import {
  RecursosConciliacionResponseDTO,
  ProgramarDowngradeResponseDTO,
} from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';
import { Button } from '@/components/ui/Button';
import {
  X,
  Building2,
  Layers,
  Grid,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  Shield,
  Loader2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface ModalAsistenteDowngradeProps {
  abierto: boolean;
  nuevoPlanId: number;
  onCerrar: () => void;
  onDowngradeProgramado: (res: ProgramarDowngradeResponseDTO) => void;
}

export const ModalAsistenteDowngrade: React.FC<ModalAsistenteDowngradeProps> = ({
  abierto,
  nuevoPlanId,
  onCerrar,
  onDowngradeProgramado,
}) => {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [datosRecursos, setDatosRecursos] = useState<RecursosConciliacionResponseDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de selección del Wizard
  const [localSeleccionadoId, setLocalSeleccionadoId] = useState<string>('');
  const [pisoSeleccionadoId, setPisoSeleccionadoId] = useState<string>('');
  const [mesasSeleccionadasIds, setMesasSeleccionadasIds] = useState<string[]>([]);
  const [usuariosSeleccionadosIds, setUsuariosSeleccionadosIds] = useState<string[]>([]);

  // Límites según el wireframe para Starter
  const LIMITE_MESAS_STARTER = 10;
  const LIMITE_USUARIOS_STARTER = 3;

  useEffect(() => {
    if (!abierto) return;

    let cancelado = false;
    setCargando(true);
    setPaso(1);
    setErrorMsg(null);

    propietarioSuscripcionService
      .getRecursosConciliacion(nuevoPlanId)
      .then((res) => {
        if (!cancelado && res.exito && res.datos) {
          setDatosRecursos(res.datos);

          // Defaults iniciales
          const localDefault = res.datos.arbol_locales[0];
          setLocalSeleccionadoId(localDefault.id);

          const pisoDefault = localDefault.pisos[0];
          setPisoSeleccionadoId(pisoDefault.id);

          // Mesas por defecto (primeras 10)
          const mesasInit = pisoDefault.mesas.slice(0, LIMITE_MESAS_STARTER).map((m) => m.id);
          setMesasSeleccionadasIds(mesasInit);

          // Usuarios por defecto (propietario + 2 colaboradores)
          const propUser = res.datos.usuarios_staff.find((u) => u.protegido)?.id || 'usr-prop-01';
          const otrosUsers = res.datos.usuarios_staff
            .filter((u) => !u.protegido)
            .slice(0, LIMITE_USUARIOS_STARTER - 1)
            .map((u) => u.id);
          setUsuariosSeleccionadosIds([propUser, ...otrosUsers]);
        }
      })
      .catch(() => {
        if (!cancelado) setErrorMsg('No se pudo cargar el árbol de recursos.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, nuevoPlanId]);

  if (!abierto) return null;

  // Local actual activo
  const localActivo = datosRecursos?.arbol_locales.find((l) => l.id === localSeleccionadoId);
  // Piso actual activo
  const pisoActivo = localActivo?.pisos.find((p) => p.id === pisoSeleccionadoId);

  // Manejo de cambio de local
  const handleCambiarLocal = (localId: string) => {
    setLocalSeleccionadoId(localId);
    const nuevoLocal = datosRecursos?.arbol_locales.find((l) => l.id === localId);
    if (nuevoLocal && nuevoLocal.pisos.length > 0) {
      const nuevoPiso = nuevoLocal.pisos[0];
      setPisoSeleccionadoId(nuevoPiso.id);
      setMesasSeleccionadasIds(nuevoPiso.mesas.slice(0, LIMITE_MESAS_STARTER).map((m) => m.id));
    }
  };

  // Manejo de cambio de piso
  const handleCambiarPiso = (pisoId: string) => {
    setPisoSeleccionadoId(pisoId);
    const nuevoPiso = localActivo?.pisos.find((p) => p.id === pisoId);
    if (nuevoPiso) {
      setMesasSeleccionadasIds(nuevoPiso.mesas.slice(0, LIMITE_MESAS_STARTER).map((m) => m.id));
    }
  };

  // Manejo toggle mesa
  const handleToggleMesa = (mesaId: string) => {
    if (mesasSeleccionadasIds.includes(mesaId)) {
      setMesasSeleccionadasIds(mesasSeleccionadasIds.filter((id) => id !== mesaId));
    } else {
      if (mesasSeleccionadasIds.length >= LIMITE_MESAS_STARTER) {
        return; // tope alcanzado
      }
      setMesasSeleccionadasIds([...mesasSeleccionadasIds, mesaId]);
    }
  };

  // Manejo toggle usuario
  const handleToggleUsuario = (userId: string, protegido: boolean) => {
    if (protegido) return; // Cuenta de propietario no se puede desactivar
    if (usuariosSeleccionadosIds.includes(userId)) {
      setUsuariosSeleccionadosIds(usuariosSeleccionadosIds.filter((id) => id !== userId));
    } else {
      if (usuariosSeleccionadosIds.length >= LIMITE_USUARIOS_STARTER) {
        return; // tope alcanzado
      }
      setUsuariosSeleccionadosIds([...usuariosSeleccionadosIds, userId]);
    }
  };

  // Confirmar y programar en backend
  const handleConfirmarDowngrade = async () => {
    setGuardando(true);
    setErrorMsg(null);
    try {
      const res = await propietarioSuscripcionService.programarDowngrade({
        nuevo_plan_id: nuevoPlanId,
        config_downgrade: {
          local_id_activo: localSeleccionadoId,
          piso_id_activo: pisoSeleccionadoId,
          mesas_ids_activas: mesasSeleccionadasIds,
          usuarios_ids_activos: usuariosSeleccionadosIds,
        },
      });

      if (res.exito && res.datos) {
        onDowngradeProgramado(res.datos);
      } else {
        setErrorMsg(res.errores?.[0]?.mensaje || 'Error al programar el cambio de plan.');
      }
    } catch {
      setErrorMsg('Error de conexión al programar el Subscription Schedule con Stripe.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-downgrade-wizard-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-aurea-navy/15 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-aurea-navy p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2
                id="modal-downgrade-wizard-titulo"
                className="font-serif text-lg font-bold tracking-tight text-white"
              >
                Asistente de Conciliación de Recursos — Downgrade a Plan Starter
              </h2>
              <p className="text-xs text-slate-300">
                Ajuste jerárquico no-destructivo para preservar tus datos históricos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar asistente"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Informativo Superior */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Tu <strong>Plan Pro</strong> se mantiene activo y con todas sus funciones hasta el{' '}
            <strong>31 de Octubre de 2026</strong>. Elige los recursos que seguirán activos el{' '}
            <strong>01 de Noviembre</strong>. <em>No se borrarán ventas pasadas ni comandas históricas.</em>
          </div>
        </div>

        {/* Stepper Progress Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setPaso(1)}
              className={`flex items-center gap-1 py-1 px-2 rounded-md transition-all ${
                paso === 1
                  ? 'bg-aurea-navy text-white font-bold'
                  : paso > 1
                  ? 'text-emerald-700 font-medium'
                  : ''
              }`}
            >
              {paso > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>1.</span>}
              <span>Locales</span>
            </button>

            <button
              type="button"
              onClick={() => setPaso(2)}
              className={`flex items-center gap-1 py-1 px-2 rounded-md transition-all ${
                paso === 2
                  ? 'bg-aurea-navy text-white font-bold'
                  : paso > 2
                  ? 'text-emerald-700 font-medium'
                  : ''
              }`}
            >
              {paso > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>2.</span>}
              <span>Pisos</span>
            </button>

            <button
              type="button"
              onClick={() => setPaso(3)}
              className={`flex items-center gap-1 py-1 px-2 rounded-md transition-all ${
                paso === 3
                  ? 'bg-aurea-navy text-white font-bold'
                  : paso > 3
                  ? 'text-emerald-700 font-medium'
                  : ''
              }`}
            >
              {paso > 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>3.</span>}
              <span>Mesas</span>
            </button>

            <button
              type="button"
              onClick={() => setPaso(4)}
              className={`flex items-center gap-1 py-1 px-2 rounded-md transition-all ${
                paso === 4
                  ? 'bg-aurea-navy text-white font-bold'
                  : paso > 4
                  ? 'text-emerald-700 font-medium'
                  : ''
              }`}
            >
              {paso > 4 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span>4.</span>}
              <span>Personal</span>
            </button>

            <button
              type="button"
              onClick={() => setPaso(5)}
              className={`flex items-center gap-1 py-1 px-2 rounded-md transition-all ${
                paso === 5 ? 'bg-aurea-navy text-white font-bold' : ''
              }`}
            >
              <span>5.</span>
              <span>Resumen</span>
            </button>
          </div>
        </div>

        {/* Body Wizard */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-aurea-navy" />
              <p className="text-xs font-semibold text-slate-600">
                Cargando sedes, pisos, mesas y personal de Áurea...
              </p>
            </div>
          ) : (
            <>
              {/* PASO 1: LOCALES */}
              {paso === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-aurea-copper" />
                        <span>Paso 1: Selecciona la Sede que permanecerá activa (1 de 1)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        El Plan Starter permite únicamente 1 local activo. La sede excluida pasará a inactiva el 01/Nov.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      1 / 1 seleccionado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {datosRecursos?.arbol_locales.map((local) => {
                      const seleccionado = local.id === localSeleccionadoId;
                      return (
                        <div
                          key={local.id}
                          onClick={() => handleCambiarLocal(local.id)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                            seleccionado
                              ? 'border-2 border-aurea-navy bg-white shadow-md ring-2 ring-aurea-navy/10'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-slate-900">
                                {local.nombre}
                              </span>
                              {local.es_casa_matriz && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-aurea-champagne/40 text-aurea-navy">
                                  Casa Matriz
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {local.pisos.length} {local.pisos.length === 1 ? 'piso' : 'pisos'},{' '}
                              {local.pisos.reduce((acc, p) => acc + p.mesas.length, 0)} mesas operativas
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span
                              className={`font-semibold ${
                                seleccionado ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {seleccionado ? '✓ Seguirá Activo' : 'Pasará a Inactivo'}
                            </span>
                            <input
                              type="radio"
                              name="local_activo"
                              checked={seleccionado}
                              onChange={() => handleCambiarLocal(local.id)}
                              className="text-aurea-navy focus:ring-aurea-navy"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 2: PISOS */}
              {paso === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
                        <Layers className="w-4 h-4 text-aurea-copper" />
                        <span>Paso 2: Selecciona el Piso de {localActivo?.nombre} (1 de 1)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        El Plan Starter permite 1 piso por sede. Los ambientes no seleccionados se pausarán.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      1 / 1 seleccionado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {localActivo?.pisos.map((piso) => {
                      const seleccionado = piso.id === pisoSeleccionadoId;
                      return (
                        <div
                          key={piso.id}
                          onClick={() => handleCambiarPiso(piso.id)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                            seleccionado
                              ? 'border-2 border-aurea-navy bg-white shadow-md ring-2 ring-aurea-navy/10'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900 block mb-1">
                              {piso.nombre}
                            </span>
                            <span className="text-xs text-slate-500">
                              {piso.mesas.length} mesas registradas
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span
                              className={`font-semibold ${
                                seleccionado ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {seleccionado ? '✓ Piso Activo' : 'Piso Pausado'}
                            </span>
                            <input
                              type="radio"
                              name="piso_activo"
                              checked={seleccionado}
                              onChange={() => handleCambiarPiso(piso.id)}
                              className="text-aurea-navy focus:ring-aurea-navy"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 3: MESAS */}
              {paso === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
                        <Grid className="w-4 h-4 text-aurea-copper" />
                        <span>Paso 3: Selecciona las Mesas del {pisoActivo?.nombre}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Selecciona hasta {LIMITE_MESAS_STARTER} mesas activas para atención al comensal.
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          mesasSeleccionadasIds.length === LIMITE_MESAS_STARTER
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {mesasSeleccionadasIds.length} de {LIMITE_MESAS_STARTER} seleccionadas
                      </span>
                    </div>
                  </div>

                  {/* Barra visual de progreso */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-aurea-navy h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (mesasSeleccionadasIds.length / LIMITE_MESAS_STARTER) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-h-60 overflow-y-auto pr-1">
                    {pisoActivo?.mesas.map((mesa) => {
                      const seleccionada = mesasSeleccionadasIds.includes(mesa.id);
                      const deshabilitada =
                        !seleccionada && mesasSeleccionadasIds.length >= LIMITE_MESAS_STARTER;

                      return (
                        <div
                          key={mesa.id}
                          onClick={() => !deshabilitada && handleToggleMesa(mesa.id)}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                            deshabilitada
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                              : seleccionada
                              ? 'cursor-pointer border-aurea-navy bg-white shadow-xs font-semibold'
                              : 'cursor-pointer border-slate-200 bg-slate-50 hover:bg-white'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">{mesa.etiqueta}</span>
                            <span className="text-[11px] text-slate-500">
                              Cap: {mesa.capacidad} personas
                            </span>
                          </div>

                          <input
                            type="checkbox"
                            checked={seleccionada}
                            disabled={deshabilitada}
                            onChange={() => handleToggleMesa(mesa.id)}
                            className="text-aurea-navy rounded focus:ring-aurea-navy cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 4: PERSONAL */}
              {paso === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
                        <Users className="w-4 h-4 text-aurea-copper" />
                        <span>Paso 4: Selecciona Colaboradores Activos</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        El Plan Starter permite hasta {LIMITE_USUARIOS_STARTER} cuentas de colaboradores activas.
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        usuariosSeleccionadosIds.length === LIMITE_USUARIOS_STARTER
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {usuariosSeleccionadosIds.length} de {LIMITE_USUARIOS_STARTER} seleccionados
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {datosRecursos?.usuarios_staff.map((usuario) => {
                      const seleccionada = usuariosSeleccionadosIds.includes(usuario.id);
                      const deshabilitada =
                        !seleccionada &&
                        usuariosSeleccionadosIds.length >= LIMITE_USUARIOS_STARTER;

                      return (
                        <div
                          key={usuario.id}
                          onClick={() =>
                            !usuario.protegido &&
                            !deshabilitada &&
                            handleToggleUsuario(usuario.id, usuario.protegido)
                          }
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                            usuario.protegido
                              ? 'bg-amber-50/70 border-amber-200 cursor-default'
                              : deshabilitada
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                              : seleccionada
                              ? 'cursor-pointer border-aurea-navy bg-white shadow-xs'
                              : 'cursor-pointer border-slate-200 bg-slate-50 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                              {usuario.nombre.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <span>{usuario.nombre}</span>
                                {usuario.protegido && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Protegido / Inmutable
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {usuario.rol.toUpperCase()} • {usuario.email}{' '}
                                {usuario.local_asignado && `(${usuario.local_asignado})`}
                              </div>
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={seleccionada}
                            disabled={usuario.protegido || deshabilitada}
                            onChange={() => handleToggleUsuario(usuario.id, usuario.protegido)}
                            className="text-aurea-navy rounded focus:ring-aurea-navy cursor-pointer disabled:opacity-75"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 5: RESUMEN Y CONFIRMACIÓN */}
              {paso === 5 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Paso 5: Resumen de Configuración Programada</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verifica la conciliación de recursos antes de registrar el schedule en Stripe.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Sede Activa a partir del 01/Nov:</span>
                      <strong className="text-slate-900 font-bold">{localActivo?.nombre}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Piso Activo:</span>
                      <strong className="text-slate-900 font-bold">{pisoActivo?.nombre}</strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Mesas que continuarán operativas:</span>
                      <strong className="text-slate-900 font-bold">
                        {mesasSeleccionadasIds.length} mesas seleccionadas
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Colaboradores con acceso activo:</span>
                      <strong className="text-slate-900 font-bold">
                        {usuariosSeleccionadosIds.length} cuentas (Rodrigo + colaboradores)
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 font-semibold text-emerald-800">
                      <span>Tarifa Starter desde 01/Nov:</span>
                      <span className="text-sm font-sans font-extrabold text-aurea-navy">
                        S/ 99.00 PEN / mes
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Garantía de Continuidad:</strong> Tu operación seguirá en Plan Pro con todos sus locales y mesas hasta el último segundo del 31/Octubre. Podrás revertir este cambio en cualquier momento antes de esa fecha.
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de Error */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {paso > 1 ? (
              <Button
                type="button"
                variant="outline"
                disabled={guardando}
                onClick={() => setPaso((prev) => (prev - 1) as any)}
                className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={guardando}
                onClick={onCerrar}
                className="text-xs font-semibold text-slate-600"
              >
                Cancelar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {paso < 5 ? (
              <Button
                type="button"
                onClick={() => setPaso((prev) => (prev + 1) as any)}
                className="bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-bold flex items-center gap-1.5 px-4 shadow-sm"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={guardando}
                onClick={handleConfirmarDowngrade}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2 px-5"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Programando en Stripe...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-white" />
                    <span>Programar Downgrade para el 01/Nov</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
