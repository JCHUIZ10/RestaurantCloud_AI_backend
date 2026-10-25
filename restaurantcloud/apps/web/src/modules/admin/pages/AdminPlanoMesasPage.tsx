import React, { useState, useEffect, useCallback } from 'react';
import { planoService } from '@/services/serviceAdapter';
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
import { EstadoError, Skeleton, useToast } from '@/components/ui';

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
  const { mostrar } = useToast();
  const showToast = (texto: string, tipo: 'exito' | 'error' = 'exito') =>
    mostrar(texto, tipo === 'exito' ? 'ok' : 'error');

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await planoService.obtenerPlanoMesas();
      if (res.exito && res.datos) {
        setData(res.datos);
        setPisoActivoId((actual) =>
          res.datos.pisos.some((p: PisoAdminDTO) => p.id === actual)
            ? actual
            : res.datos.pisos[0]?.id || ''
        );
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

  // Handlers de Acciones (100% Backend Directo)
  const handleGenerarLote = async (pisoId: string, payload: CrearMesaLoteRequest) => {
    const res = await planoService.generarMesasEnLote(pisoId, payload);
    if (res.exito && res.datos) {
      showToast(`${res.datos.mesas_creadas} mesas generadas y distribuidas exitosamente en el salón.`);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al generar mesas.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al generar mesas.');
    }
  };

  const handleCrearIndividual = async (pisoId: string, payload: CrearMesaIndividualRequest) => {
    const res = await planoService.crearMesaIndividual(pisoId, payload);
    if (res.exito && res.datos) {
      showToast(`Mesa ${res.datos.numero} creada exitosamente.`);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al crear mesa.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al crear mesa.');
    }
  };

  const handleGuardarMesa = async (mesaId: string, payload: ActualizarMesaRequest) => {
    const res = await planoService.actualizarMesa(mesaId, payload);
    if (res.exito && res.datos) {
      showToast(`Mesa ${res.datos.numero} actualizada exitosamente.`);
      await cargarDatos();
    } else {
      showToast(res.errores?.[0]?.mensaje || 'Error al actualizar mesa.', 'error');
      throw new Error(res.errores?.[0]?.mensaje || 'Error al actualizar mesa.');
    }
  };

  const handleDesactivarMesa = async (mesaId: string) => {
    const res = await planoService.desactivarMesa(mesaId);
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
    const res = await planoService.crearPiso(data?.local_id || '', payload);
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
    const res = await planoService.actualizarNombrePiso(pisoId, nuevoNombre);
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
    const res = await planoService.desactivarPiso(pisoId);
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
      const res = await planoService.actualizarDimensionesPiso(pisoActivo.id, {
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

  return (
    <div className="space-y-6">
      {loading && !data && (
        <div className="space-y-6" aria-busy="true" aria-label="Cargando plano de mesas">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {error && (
        <EstadoError
          titulo="No se pudo cargar el plano de mesas"
          mensaje={error}
          onReintentar={cargarDatos}
          reintentando={loading}
        />
      )}

      {data && (
        <>
          <PlanoHeader
            cuota={data.cuota_mesas}
            totalCapacidadSentados={totalCapacidadSentados}
            totalMesasLocal={data.pisos.reduce((sum, p) => sum + p.total_mesas, 0)}
            totalPisosLocal={data.pisos.length}
            onAbrirMesaIndividual={() => {
              setPosicionNuevaMesa(null);
              setModalIndividualOpen(true);
            }}
            onRecargar={cargarDatos}
            isReloading={loading}
          />

          <section
            aria-label="Plano del ambiente"
            className="bg-white rounded-2xl border border-aurea-copper/30 border-t-4 border-t-aurea-copper shadow-md overflow-hidden"
          >
            <PisosTabs
              pisos={data.pisos}
              pisoActivoId={pisoActivo?.id || ''}
              onSeleccionarPiso={(id) => setPisoActivoId(id)}
              onAbrirNuevoPiso={() => setModalNuevoPisoOpen(true)}
              onAbrirEditarPiso={(piso) => setPisoParaEditar(piso)}
              onModificarDimensiones={handleModificarDimensiones}
              isUpdatingDimensions={isUpdatingDimensions}
              puedeCrearPiso={data.cuota_mesas.pisos_activos_empresa < data.cuota_mesas.max_pisos_plan}
            />

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
          </section>
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
    </div>
  );
};
