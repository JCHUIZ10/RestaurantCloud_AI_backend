import React, { useState, useEffect, useCallback } from 'react';
import {
  mockAdminService,
  CANONICAL_LOCAL_ID,
  CANONICAL_LOCAL_NOMBRE,
} from '@/modules/admin/services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import {
  InsumosAdminResponseDTO,
  InsumoAdminDTO,
  CrearInsumoRequest,
  ActualizarInsumoRequest,
  AjustarStockInsumoRequest,
  EstadoInsumo,
  AjusteStockResultDTO,
} from '@/types/admin';

import { InsumosHeader } from '../components/inventario/InsumosHeader';
import {
  InsumosToolbar,
  FiltroEstadoInsumo,
} from '../components/inventario/InsumosToolbar';
import { InsumosTable } from '../components/inventario/InsumosTable';
import { ModalCrearEditarInsumo } from '../components/inventario/ModalCrearEditarInsumo';
import { ModalAjustarStock } from '../components/inventario/ModalAjustarStock';
import { OnboardingInsumosVacio } from '../components/inventario/OnboardingInsumosVacio';
import { DemoAdminInsumosWidget } from '../components/inventario/DemoAdminInsumosWidget';

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminInsumosPage: React.FC = () => {
  // Estado de Datos y Carga
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [datosResponse, setDatosResponse] = useState<InsumosAdminResponseDTO | null>(null);

  // Filtros de Vista (Filtro por defecto: 'activo' según especificación técnica)
  const [filtroActual, setFiltroActual] = useState<FiltroEstadoInsumo>('activo');
  const [busqueda, setBusqueda] = useState<string>('');

  // Paginación interactiva
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);

  // Modales
  const [modalCrearEditarAbierto, setModalCrearEditarAbierto] = useState<boolean>(false);
  const [insumoParaEditar, setInsumoParaEditar] = useState<InsumoAdminDTO | null>(null);

  const [modalAjusteAbierto, setModalAjusteAbierto] = useState<boolean>(false);
  const [insumoParaAjuste, setInsumoParaAjuste] = useState<InsumoAdminDTO | null>(null);

  // Contador de auditorías para el widget
  const [totalAuditorias, setTotalAuditorias] = useState<number>(1);

  // Notificación Toast
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast((prev) => (prev?.mensaje === mensaje ? null : prev));
    }, 4500);
  }, []);

  // Cargar Insumos
  const cargarInsumos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const res = await adminService.obtenerInsumos(
        CANONICAL_LOCAL_ID,
        filtroActual,
        busqueda,
        paginaActual,
        limitePorPagina
      );

      if (res.exito && res.datos) {
        setDatosResponse(res.datos);
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudieron cargar los insumos de inventario.');
      }

      // Cargar conteo de auditorías
      const auditRes = await adminService.obtenerAuditoriaAjustes();
      if (auditRes.exito && auditRes.datos) {
        setTotalAuditorias(auditRes.datos.length);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado de red al consultar el inventario.');
      }
    } finally {
      setCargando(false);
    }
  }, [filtroActual, busqueda, paginaActual, limitePorPagina]);

  useEffect(() => {
    cargarInsumos();
    // Polling ligero cada 30 segundos si la pestaña está activa
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !modalCrearEditarAbierto && !modalAjusteAbierto) {
        cargarInsumos();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarInsumos, modalCrearEditarAbierto, modalAjusteAbierto]);

  // Manejadores de Filtro, Búsqueda y Paginación
  const handleCambiarFiltro = (nuevoFiltro: FiltroEstadoInsumo) => {
    setFiltroActual(nuevoFiltro);
    setPaginaActual(1);
  };

  const handleEjecutarBusqueda = (texto: string) => {
    setBusqueda(texto);
    setPaginaActual(1);
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
  };

  const handleCambiarLimite = (nuevoLimite: number) => {
    setLimitePorPagina(nuevoLimite);
    setPaginaActual(1);
  };

  // Manejadores de Modales
  const handleAbrirNuevoInsumo = () => {
    setInsumoParaEditar(null);
    setModalCrearEditarAbierto(true);
  };

  const handleAbrirEditarInsumo = (insumo: InsumoAdminDTO) => {
    setInsumoParaEditar(insumo);
    setModalCrearEditarAbierto(true);
  };

  const handleAbrirAjusteStock = (insumo: InsumoAdminDTO) => {
    setInsumoParaAjuste(insumo);
    setModalAjusteAbierto(true);
  };

  // Guardar Insumo (Crear)
  const handleGuardarCrear = async (req: CrearInsumoRequest): Promise<boolean> => {
    try {
      const res = await adminService.crearInsumo(CANONICAL_LOCAL_ID, req);
      if (res.exito && res.datos) {
        mostrarToast(`Insumo "${res.datos.nombre}" registrado correctamente (< 8s).`, 'exito');
        await cargarInsumos();
        return true;
      } else {
        const errorMsg = res.errores?.[0]?.mensaje || 'No se pudo registrar el insumo.';
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Error de red al guardar nuevo insumo.');
    }
  };

  // Guardar Insumo (Editar)
  const handleGuardarEditar = async (
    id: string,
    req: ActualizarInsumoRequest
  ): Promise<boolean> => {
    try {
      const res = await adminService.actualizarInsumo(id, req);
      if (res.exito && res.datos) {
        mostrarToast(`Insumo "${res.datos.nombre}" actualizado con éxito.`, 'exito');
        await cargarInsumos();
        return true;
      } else {
        const errorMsg = res.errores?.[0]?.mensaje || 'No se pudo actualizar el insumo.';
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Error al actualizar insumo.');
    }
  };

  // Aplicar Ajuste Físico de Stock
  const handleAplicarAjuste = async (
    id: string,
    req: AjustarStockInsumoRequest
  ): Promise<AjusteStockResultDTO | null> => {
    try {
      const res = await adminService.ajustarStockInsumo(id, req);
      if (res.exito && res.datos) {
        mostrarToast(res.datos.mensaje, 'exito');
        await cargarInsumos();
        return res.datos;
      } else {
        const errorMsg = res.errores?.[0]?.mensaje || 'No se pudo aplicar el ajuste de stock.';
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Error al registrar ajuste de stock.');
    }
  };

  // Conmutar Estado Operativo
  const handleConmutarEstado = async (
    insumo: InsumoAdminDTO,
    nuevoEstado: EstadoInsumo
  ) => {
    try {
      const res = await adminService.conmutarEstadoInsumo(insumo.id, {
        estado: nuevoEstado,
      });
      if (res.exito && res.datos) {
        const etiqueta = nuevoEstado === 'inactivo' ? 'archivado como inactivo' : 'reactivado';
        mostrarToast(`Insumo "${insumo.nombre}" ${etiqueta}.`, 'exito');
        await cargarInsumos();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo cambiar el estado.', 'error');
      }
    } catch {
      mostrarToast('Error al modificar estado del insumo.', 'error');
    }
  };

  // Simulación QA
  const handleVaciarInsumos = async () => {
    mockAdminService.simularInsumosVacios(CANONICAL_LOCAL_ID);
    mostrarToast('Despensa vaciada. Mostrando pantalla de Onboarding inicial.', 'exito');
    await cargarInsumos();
  };

  const handleRestablecerSemillas = async () => {
    mockAdminService.restablecerInsumosAurea();
    mostrarToast('Semillas canónicas de Miraflores restablecidas con éxito.', 'exito');
    await cargarInsumos();
  };

  const handleSimularQuiebreLimon = async () => {
    mockAdminService.simularQuiebreInsumo();
    mostrarToast('Simulado: Limón con stock 0 kg (Agotado). Ceviche Clásico bloqueado en carta.', 'exito');
    await cargarInsumos();
  };

  const handleSimularQuiebreLomo = async () => {
    mockAdminService.simularQuiebreInsumo('00000000-0000-4000-8000-000000000422');
    mostrarToast('Simulado: Lomo Fino con stock 0 kg. Lomo Saltado bloqueado en carta.', 'exito');
    await cargarInsumos();
  };

  const handleSimularReposicion = async () => {
    mockAdminService.simularReposicionInsumo();
    mostrarToast('Simulado: Limón reabastecido con 8.0 kg (Óptimo). Reactivado en cocina.', 'exito');
    await cargarInsumos();
  };

  const totalInsumosBodega = datosResponse
    ? datosResponse.kpis.total_activos +
      datosResponse.kpis.total_agotados +
      datosResponse.kpis.total_inactivos
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
              toast.tipo === 'exito'
                ? 'bg-emerald-900/90 text-white border-emerald-700/50 backdrop-blur-md'
                : 'bg-rose-900/90 text-white border-rose-700/50 backdrop-blur-md'
            }`}
          >
            {toast.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="leading-tight">{toast.mensaje}</span>
          </div>
        </div>
      )}

      {/* Cabecera y KPIs */}
      <InsumosHeader
        localNombre={CANONICAL_LOCAL_NOMBRE}
        kpis={
          datosResponse?.kpis || {
            total_activos: 0,
            total_agotados: 0,
            total_inactivos: 0,
            valorizacion_total: 0,
          }
        }
        onAbrirNuevoInsumo={handleAbrirNuevoInsumo}
      />

      {/* Mensaje de Error de Carga */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={cargarInsumos}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Si la bodega está completamente en blanco (0 insumos), mostrar Onboarding */}
      {!cargando && totalInsumosBodega === 0 ? (
        <OnboardingInsumosVacio onAbrirNuevoInsumo={handleAbrirNuevoInsumo} />
      ) : (
        <>
          {/* Barra de Filtros y Búsqueda */}
          {datosResponse && (
            <InsumosToolbar
              filtroActual={filtroActual}
              onCambiarFiltro={handleCambiarFiltro}
              busqueda={busqueda}
              onEjecutarBusqueda={handleEjecutarBusqueda}
              kpis={datosResponse.kpis}
            />
          )}

          {/* Tabla y Tarjetas de Insumos con Paginación Interactiva */}
          <InsumosTable
            insumos={datosResponse?.insumos || []}
            cargando={cargando}
            paginacion={datosResponse?.paginacion}
            onCambiarPagina={handleCambiarPagina}
            onCambiarLimite={handleCambiarLimite}
            onAbrirAjusteStock={handleAbrirAjusteStock}
            onAbrirEditarInsumo={handleAbrirEditarInsumo}
            onConmutarEstado={handleConmutarEstado}
          />
        </>
      )}

      {/* Modal Crear / Editar Insumo */}
      <ModalCrearEditarInsumo
        abierto={modalCrearEditarAbierto}
        onCerrar={() => setModalCrearEditarAbierto(false)}
        insumoEditar={insumoParaEditar}
        onGuardarCrear={handleGuardarCrear}
        onGuardarEditar={handleGuardarEditar}
      />

      {/* Modal Ajuste Físico de Stock & Auditoría */}
      <ModalAjustarStock
        abierto={modalAjusteAbierto}
        onCerrar={() => setModalAjusteAbierto(false)}
        insumo={insumoParaAjuste}
        onAplicarAjuste={handleAplicarAjuste}
      />

      {/* Widget QA Flotante para Evaluación de Casos de Prueba */}
      {!IS_REAL_API && (
        <DemoAdminInsumosWidget
        onVaciarInsumos={handleVaciarInsumos}
        onRestablecerSemillas={handleRestablecerSemillas}
        onSimularQuiebreLimon={handleSimularQuiebreLimon}
        onSimularQuiebreLomo={handleSimularQuiebreLomo}
        onSimularReposicion={handleSimularReposicion}
        totalAuditorias={totalAuditorias}
      />
      )}
    </div>
  );
};
