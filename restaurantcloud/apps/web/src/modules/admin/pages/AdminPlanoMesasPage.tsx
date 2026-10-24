import React, { useState, useEffect, useCallback } from 'react';
import { mockAdminService } from '../services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import {
  PlanoMesasResponseDTO,
  PisoAdminDTO,
  MesaAdminDTO,
  CrearMesaLoteRequest,
  CrearMesaIndividualRequest,
  ActualizarMesaRequest,
  CrearPisoRequest,
  ConflictoDesactivacionMesaDTO,
} from '@/types/admin';
import { PlanoHeader } from '../components/plano/PlanoHeader';
import { PisosTabs } from '../components/plano/PisosTabs';
import { PlanoCuadriculaGrid } from '../components/plano/PlanoCuadriculaGrid';
import { ModalGeneradorLote } from '../components/plano/ModalGeneradorLote';
import { DrawerEditarMesa } from '../components/plano/DrawerEditarMesa';
import { ModalMesaIndividual } from '../components/plano/ModalMesaIndividual';
import { ModalNuevoPiso } from '../components/plano/ModalNuevoPiso';
import { ModalEditarPiso } from '../components/plano/ModalEditarPiso';
import { ModalBloqueoDesactivacion } from '../components/plano/ModalBloqueoDesactivacion';
import { OnboardingPisoVacio } from '../components/plano/OnboardingPisoVacio';
import { DemoAdminPlanoWidget } from '../components/plano/DemoAdminPlanoWidget';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminPlanoMesasPage: React.FC = () => {
  const [data, setData] = useState<PlanoMesasResponseDTO | null>(null);
  const [pisoActivoId, setPisoActivoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingDimensions, setIsUpdatingDimensions] = useState(false);

  // Modales y Drawers
  const [modalLoteOpen, setModalLoteOpen] = useState(false);
  const [modalIndividualOpen, setModalIndividualOpen] = useState(false);
  const [posicionNuevaMesa, setPosicionNuevaMesa] = useState<{ x: number; y: number } | null>(null);
  const [mesaEnEdicion, setMesaEnEdicion] = useState<MesaAdminDTO | null>(null);
  const [modalNuevoPisoOpen, setModalNuevoPisoOpen] = useState(false);
  const [pisoParaEditar, setPisoParaEditar] = useState<PisoAdminDTO | null>(null);
  const [conflictoDesactivacion, setConflictoDesactivacion] =
    useState<ConflictoDesactivacionMesaDTO | null>(null);
  const [toastMessage, setToastMessage] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(
    null
  );

  const showToast = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setToastMessage({ texto, tipo });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.obtenerPlanoMesas();
      if (res.exito && res.datos) {
        setData(res.datos);
        setPisoActivoId((actual) => res.datos.pisos.some((p: PisoAdminDTO) => p.id === actual)
          ? actual : res.datos.pisos[0]?.id || '');
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo cargar el plano de mesas.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de comunicación de red.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const pisoActivo = data?.pisos.find((p) => p.id === pisoActivoId) || data?.pisos[0];

  // Total capacidad comensales en toda la sede
  const totalCapacidadSentados =
    data?.pisos.reduce((acc, p) => acc + p.capacidad_total_personas, 0) || 0;

  // Handlers de Acciones
  const handleGenerarLote = async (pisoId: string, payload: CrearMesaLoteRequest) => {
    const res = await adminService.generarMesasEnLote(pisoId, payload);
    if (res.exito && res.datos) {
      showToast(`${res.datos.mesas_creadas} mesas generadas y distribuidas exitosamente en el salón.`);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al generar mesas.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al generar mesas.');
    }
  };

  const handleCrearIndividual = async (pisoId: string, payload: CrearMesaIndividualRequest) => {
    const res = await adminService.crearMesaIndividual(pisoId, payload);
    if (res.exito && res.datos) {
      showToast(`Mesa ${res.datos.numero} creada exitosamente.`);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al crear mesa.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al crear mesa.');
    }
  };

  const handleGuardarMesa = async (mesaId: string, payload: ActualizarMesaRequest) => {
    const res = await adminService.actualizarMesa(mesaId, payload);
    if (res.exito && res.datos) {
      showToast(`Mesa ${res.datos.numero} actualizada exitosamente.`);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al actualizar mesa.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al actualizar mesa.');
    }
  };

  const handleDesactivarMesa = async (mesaId: string) => {
    const res = await adminService.desactivarMesa(mesaId);
    if (res.exito) {
      setMesaEnEdicion(null);
      showToast('Mesa desactivada exitosamente del salón.');
      await cargarDatos();
    } else {
      const err = res.errores?.[0];
      if (err?.codigo === 'ERR_MESA_CON_PEDIDOS_ACTIVOS' && err.detalles) {
        // Disparar Modal de Bloqueo Duro 409
        setMesaEnEdicion(null);
        setConflictoDesactivacion(err.detalles as ConflictoDesactivacionMesaDTO);
      } else {
        showToast(err?.mensaje || 'Error al desactivar mesa.', 'error');
        throw new Error(err?.mensaje || 'Error al desactivar mesa.');
      }
    }
  };

  const handleCrearPiso = async (payload: CrearPisoRequest) => {
    const res = await adminService.crearPiso(data?.local_id || '', payload);
    if (res.exito && res.datos) {
      showToast(`Ambiente "${res.datos.nombre}" creado exitosamente.`);
      setPisoActivoId(res.datos.id);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al crear ambiente.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al crear ambiente.');
    }
  };

  const handleRenombrarPiso = async (pisoId: string, nuevoNombre: string) => {
    const res = await adminService.actualizarNombrePiso(pisoId, nuevoNombre);
    if (res.exito && res.datos) {
      showToast(`Ambiente renombrado a "${res.datos.nombre}" exitosamente.`);
      await cargarDatos();
    } else {
      const msg = res.errores?.[0]?.mensaje || 'Error al renombrar ambiente.';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const handleDesactivarPiso = async (pisoId: string) => {
    const res = await adminService.desactivarPiso(pisoId);
    if (res.exito && res.datos) {
      showToast(res.datos.mensaje);
      const pisosRestantes = data?.pisos.filter((p) => p.id !== pisoId) || [];
      if (pisosRestantes.length > 0 && pisoActivoId === pisoId) {
        setPisoActivoId(pisosRestantes[0].id);
      }
      await cargarDatos();
    } else {
      const msg = res.errores?.[0]?.mensaje || 'Error al eliminar ambiente.';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const handleModificarDimensiones = async (deltaCol: number, deltaFila: number) => {
    if (!pisoActivo) return;
    const nuevasCols = Math.max(1, pisoActivo.columnas + deltaCol);
    const nuevasFilas = Math.max(1, pisoActivo.filas + deltaFila);

    try {
      setIsUpdatingDimensions(true);
      const res = await adminService.actualizarDimensionesPiso(pisoActivo.id, {
        columnas: nuevasCols,
        filas: nuevasFilas,
      });

      if (res.exito) {
        showToast('Dimensiones del salón actualizadas exitosamente.');
        await cargarDatos();
      } else {
        showToast(res.errores?.[0]?.mensaje || 'No se pudo recortar la cuadrícula.', 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo actualizar el salón.', 'error');
    } finally {
      setIsUpdatingDimensions(false);
    }
  };

  const handleAgregarEnPosicion = (posX: number, posY: number) => {
    setPosicionNuevaMesa({ x: posX, y: posY });
    setModalIndividualOpen(true);
  };

  // Handlers del simulador DemoWidget
  const handleRestablecerSemillas = async () => {
    mockAdminService.restablecerSemillasAurea();
    await cargarDatos();
    showToast('Semillas de Sede Áurea restablecidas a su estado canónico.');
  };

  const handleSimularCuotaLlena = async () => {
    mockAdminService.simularCuotaLlena();
    await cargarDatos();
    showToast('Simulación activada: Cuota llena (30 de 30 mesas).');
  };

  const handleSimularPisoVacio = async () => {
    if (pisoActivo) {
      mockAdminService.simularPisoVacio(pisoActivo.id);
      await cargarDatos();
      showToast(`Simulación activada: ${pisoActivo.nombre} vaciado a 0 mesas.`);
    }
  };

  const handleProbarBloqueoMesa04 = async () => {
    // Buscar Mesa 04 en salón y solicitar baja
    const mesa04 = data?.pisos
      .flatMap((p) => p.mesas)
      .find((m) => m.numero === '04' && m.tiene_pedido_activo);
    if (mesa04) {
      await handleDesactivarMesa(mesa04.id);
    } else {
      showToast('La Mesa 04 no está activa o fue alterada. Restablece semillas primero.', 'error');
    }
  };

  const handleSimularErrorRed = () => {
    setError('Error simulado: Timeout de conexión con el servidor Go Core API (504 Gateway Timeout).');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Toast Notificación Flotante */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold animate-slideDown ${
            toastMessage.tipo === 'exito'
              ? 'bg-emerald-900 text-white border-emerald-500'
              : 'bg-rose-900 text-white border-rose-500'
          }`}
        >
          {toastMessage.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.texto}</span>
        </div>
      )}

      {/* ESTADO 1: Cargando / Skeleton (UX State 2) */}
      {loading && !data && (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-slate-200/80 rounded-2xl w-2/3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200/80 rounded-2xl" />
            <div className="h-24 bg-slate-200/80 rounded-2xl" />
            <div className="h-24 bg-slate-200/80 rounded-2xl" />
          </div>
          <div className="h-12 bg-slate-200/80 rounded-xl w-1/2" />
          <div className="h-96 bg-slate-200/80 rounded-3xl" />
        </div>
      )}

      {/* ESTADO 2: Error de Red / Controlado (UX State 4) */}
      {error && (
        <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-900 space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <h3 className="font-serif text-lg font-bold">Error al Cargar el Plano de Mesas</h3>
          </div>
          <p className="text-sm text-rose-700">{error}</p>
          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar Conexión</span>
          </button>
        </div>
      )}

      {/* ESTADO 3: Loaded Exitoso (UX State 3) */}
      {data && (
        <>
          {/* Cabecera y KPIs */}
          <PlanoHeader
            cuota={data.cuota_mesas}
            totalCapacidadSentados={totalCapacidadSentados}
            totalMesasLocal={data.pisos.reduce((sum, p) => sum + p.total_mesas, 0)}
            totalPisosLocal={data.pisos.length}
            localNombre={data.local_nombre}
            onAbrirMesaIndividual={() => {
              setPosicionNuevaMesa(null);
              setModalIndividualOpen(true);
            }}
            onAbrirNuevoPiso={() => setModalNuevoPisoOpen(true)}
          />

          {/* Pestañas de Pisos y Controles de Cuadrícula */}
          <PisosTabs
            pisos={data.pisos}
            pisoActivoId={pisoActivo?.id || ''}
            onSeleccionarPiso={(id) => setPisoActivoId(id)}
            onAbrirNuevoPiso={() => setModalNuevoPisoOpen(true)}
            onAbrirEditarPiso={(piso) => setPisoParaEditar(piso)}
            onModificarDimensiones={handleModificarDimensiones}
            isUpdatingDimensions={isUpdatingDimensions}
          />

          {/* Cuadrícula o Onboarding si está vacío */}
          {pisoActivo && pisoActivo.mesas.filter((m) => m.estado !== 'inactiva').length === 0 ? (
            <OnboardingPisoVacio
              pisoNombre={pisoActivo.nombre}
              onAbrirAsistenteLote={() => setModalLoteOpen(true)}
              onAbrirMesaIndividual={() => {
                setPosicionNuevaMesa(null);
                setModalIndividualOpen(true);
              }}
            />
          ) : (
            pisoActivo && (
              <PlanoCuadriculaGrid
                piso={pisoActivo}
                onEditarMesa={(mesa) => setMesaEnEdicion(mesa)}
                onAgregarMesaEnPosicion={handleAgregarEnPosicion}
              />
            )
          )}
        </>
      )}

      {/* MODAL 1: Asistente en Lote */}
      {data && (
        <ModalGeneradorLote
          pisos={data.pisos}
          pisoSeleccionadoId={pisoActivo?.id || ''}
          cuota={data.cuota_mesas}
          isOpen={modalLoteOpen}
          onClose={() => setModalLoteOpen(false)}
          onSubmit={handleGenerarLote}
        />
      )}

      {/* MODAL 2: Mesa Individual */}
      {data && (
        <ModalMesaIndividual
          pisos={data.pisos}
          pisoSeleccionadoId={pisoActivo?.id || ''}
          cuota={data.cuota_mesas}
          posicionInicial={posicionNuevaMesa}
          isOpen={modalIndividualOpen}
          onClose={() => {
            setModalIndividualOpen(false);
            setPosicionNuevaMesa(null);
          }}
          onSubmit={handleCrearIndividual}
          onModificarDimensiones={async (_pId, deltaC, deltaF) => {
            await handleModificarDimensiones(deltaC, deltaF);
          }}
        />
      )}

      {/* DRAWER: Edición Rápida de Mesa */}
      <DrawerEditarMesa
        mesa={mesaEnEdicion}
        pisos={data?.pisos || []}
        pisoNombre={pisoActivo?.nombre || 'Salón'}
        isOpen={Boolean(mesaEnEdicion)}
        onClose={() => setMesaEnEdicion(null)}
        onGuardar={handleGuardarMesa}
        onDesactivar={handleDesactivarMesa}
      />

      {/* MODAL 3: Nuevo Piso */}
      {data && (
        <ModalNuevoPiso
          cuota={data.cuota_mesas}
          isOpen={modalNuevoPisoOpen}
          onClose={() => setModalNuevoPisoOpen(false)}
          onSubmit={handleCrearPiso}
        />
      )}

      {/* MODAL 4: Bloqueo Duro 409 ante Comanda Activa */}
      <ModalBloqueoDesactivacion
        conflicto={conflictoDesactivacion}
        isOpen={Boolean(conflictoDesactivacion)}
        onClose={() => setConflictoDesactivacion(null)}
      />

      {/* MODAL 5: Editar o Eliminar Ambiente */}
      {data && (
        <ModalEditarPiso
          piso={pisoParaEditar}
          totalPisosActivos={data.pisos.length}
          isOpen={Boolean(pisoParaEditar)}
          onClose={() => setPisoParaEditar(null)}
          onRenombrar={handleRenombrarPiso}
          onDesactivar={handleDesactivarPiso}
        />
      )}

      {/* WIDGET FLOTANTE DEMO (CU-ADMIN-01) */}
      {!IS_REAL_API && <DemoAdminPlanoWidget
        onRestablecerSemillas={handleRestablecerSemillas}
        onSimularCuotaLlena={handleSimularCuotaLlena}
        onSimularPisoVacio={handleSimularPisoVacio}
        onProbarBloqueoMesa04={handleProbarBloqueoMesa04}
        onSimularErrorRed={handleSimularErrorRed}
      />}
    </div>
  );
};
