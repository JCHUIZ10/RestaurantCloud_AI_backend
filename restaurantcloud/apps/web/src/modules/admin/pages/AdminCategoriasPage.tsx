import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  mockAdminService,
  CANONICAL_LOCAL_ID,
} from '@/modules/admin/services/mockAdminService';
import {
  CategoriasAdminResponseDTO,
  CategoriaAdminDTO,
  CrearCategoriaRequest,
  ActualizarCategoriaRequest,
  ConflictoCategoriaConProductosDTO,
  TipoPlantillaGastronomica,
} from '@/types/admin';

import { CategoriasHeader } from '../components/categorias/CategoriasHeader';
import {
  CategoriasFiltrosTabs,
  FiltroEstadoCategoria,
} from '../components/categorias/CategoriasFiltrosTabs';
import { CategoriasTable } from '../components/categorias/CategoriasTable';
import { ModalCrearEditarCategoria } from '../components/categorias/ModalCrearEditarCategoria';
import { ModalBloqueoReasignacion } from '../components/categorias/ModalBloqueoReasignacion';
import { ModalCargarPlantilla } from '../components/categorias/ModalCargarPlantilla';
import { OnboardingCategoriasVacia } from '../components/categorias/OnboardingCategoriasVacia';
import { DemoAdminCategoriasWidget } from '../components/categorias/DemoAdminCategoriasWidget';

import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminCategoriasPage: React.FC = () => {
  // Estado de Datos y Carga
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [datosResponse, setDatosResponse] = useState<CategoriasAdminResponseDTO | null>(null);

  // Filtros de Vista
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoCategoria>('todas');
  const [busqueda, setBusqueda] = useState<string>('');

  // Estados de Modales
  const [modalFormAbierto, setModalFormAbierto] = useState<boolean>(false);
  const [modoForm, setModoForm] = useState<'crear' | 'editar'>('crear');
  const [categoriaAEditar, setCategoriaAEditar] = useState<CategoriaAdminDTO | null>(null);

  const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState<boolean>(false);
  const [conflictoActual, setConflictoActual] =
    useState<ConflictoCategoriaConProductosDTO | null>(null);

  const [modalPlantillaAbierto, setModalPlantillaAbierto] = useState<boolean>(false);

  // Notificación Toast
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  // Simulación de error interactivo
  const [simulandoError, setSimulandoError] = useState<boolean>(false);

  const mostrarToast = useCallback((mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast((prev) => (prev?.mensaje === mensaje ? null : prev));
    }, 4000);
  }, []);

  // Cargar Categorías
  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    setError(null);

    if (simulandoError) {
      setTimeout(() => {
        setError('Error al conectar con el servidor de carta. Verifica tu conexión de red (Simulado).');
        setCargando(false);
      }, 500);
      return;
    }

    try {
      const res = await mockAdminService.obtenerCategorias(CANONICAL_LOCAL_ID);
      if (res.exito && res.datos) {
        setDatosResponse(res.datos);
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudieron cargar las categorías del restaurante.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado de red al consultar categorías.');
    } finally {
      setCargando(false);
    }
  }, [simulandoError]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // Lista general ordenada por secuencia correlativa
  const todasCategorias = useMemo(() => {
    if (!datosResponse) return [];
    return [...datosResponse.categorias].sort((a, b) => a.orden - b.orden);
  }, [datosResponse]);

  // Conteos para tabs
  const conteos = useMemo(() => {
    return {
      todas: todasCategorias.length,
      activas: todasCategorias.filter((c) => c.activa).length,
      ocultas: todasCategorias.filter((c) => !c.activa).length,
    };
  }, [todasCategorias]);

  // Categorías filtradas según tab y texto de búsqueda
  const categoriasFiltradas = useMemo(() => {
    let filtradas = todasCategorias;

    // Filtro por tab
    if (filtroEstado === 'activas') {
      filtradas = filtradas.filter((c) => c.activa);
    } else if (filtroEstado === 'ocultas') {
      filtradas = filtradas.filter((c) => !c.activa);
    }

    // Filtro por texto
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      filtradas = filtradas.filter((c) => c.nombre.toLowerCase().includes(q));
    }

    return filtradas;
  }, [todasCategorias, filtroEstado, busqueda]);

  // Handler: Abrir modal de nueva categoría
  const handleAbrirNueva = () => {
    setModoForm('crear');
    setCategoriaAEditar(null);
    setModalFormAbierto(true);
  };

  // Handler: Abrir modal para editar categoría
  const handleAbrirEditar = (categoria: CategoriaAdminDTO) => {
    setModoForm('editar');
    setCategoriaAEditar(categoria);
    setModalFormAbierto(true);
  };

  // Handler: Guardar (Crear o Editar)
  const handleGuardarCategoria = async (
    payload: CrearCategoriaRequest | ActualizarCategoriaRequest,
    id?: string
  ): Promise<boolean> => {
    if (modoForm === 'crear') {
      const res = await mockAdminService.crearCategoria(payload as CrearCategoriaRequest);
      if (res.exito && res.datos) {
        mostrarToast(`Categoría "${res.datos.nombre}" creada exitosamente.`);
        await cargarCategorias();
        return true;
      } else {
        throw new Error(res.errores?.[0]?.mensaje || 'No se pudo crear la categoría.');
      }
    } else if (modoForm === 'editar' && id) {
      const res = await mockAdminService.actualizarCategoria(id, payload as ActualizarCategoriaRequest);
      if (res.exito && res.datos) {
        mostrarToast(`Categoría "${res.datos.nombre}" actualizada exitosamente.`);
        await cargarCategorias();
        return true;
      } else {
        throw new Error(res.errores?.[0]?.mensaje || 'No se pudo actualizar la categoría.');
      }
    }
    return false;
  };

  // Handler: Conmutar Visibilidad inmediata
  const handleConmutarVisibilidad = async (id: string, activa: boolean) => {
    // Optimista en el cliente
    setDatosResponse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categorias: prev.categorias.map((c) => (c.id === id ? { ...c, activa } : c)),
      };
    });

    try {
      const res = await mockAdminService.conmutarVisibilidadCategoria(id, activa);
      if (res.exito && res.datos) {
        mostrarToast(
          `Categoría "${res.datos.nombre}" ahora está ${activa ? 'visible' : 'oculta'} en salón y comanda.`
        );
        await cargarCategorias();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo actualizar la visibilidad.', 'error');
        await cargarCategorias();
      }
    } catch {
      mostrarToast('Error al comunicar cambio de visibilidad.', 'error');
      await cargarCategorias();
    }
  };

  // Handler: Reordenar categorías (Subir)
  const handleSubirOrden = async (id: string) => {
    const currentIndex = todasCategorias.findIndex((c) => c.id === id);
    if (currentIndex <= 0) return;

    const copia = [...todasCategorias];
    const prevItem = copia[currentIndex - 1];
    const currItem = copia[currentIndex];

    // Intercambiar orden
    const ordenTemp = prevItem.orden;
    prevItem.orden = currItem.orden;
    currItem.orden = ordenTemp;

    const payloadReorden = [
      { id: currItem.id, orden: currItem.orden },
      { id: prevItem.id, orden: prevItem.orden },
    ];

    try {
      const res = await mockAdminService.reordenarCategorias({ categorias: payloadReorden });
      if (res.exito) {
        mostrarToast('Secuencia de comanda actualizada.');
        await cargarCategorias();
      }
    } catch {
      mostrarToast('Error al actualizar el orden.', 'error');
    }
  };

  // Handler: Reordenar categorías (Bajar)
  const handleBajarOrden = async (id: string) => {
    const currentIndex = todasCategorias.findIndex((c) => c.id === id);
    if (currentIndex < 0 || currentIndex >= todasCategorias.length - 1) return;

    const copia = [...todasCategorias];
    const nextItem = copia[currentIndex + 1];
    const currItem = copia[currentIndex];

    // Intercambiar orden
    const ordenTemp = nextItem.orden;
    nextItem.orden = currItem.orden;
    currItem.orden = ordenTemp;

    const payloadReorden = [
      { id: currItem.id, orden: currItem.orden },
      { id: nextItem.id, orden: nextItem.orden },
    ];

    try {
      const res = await mockAdminService.reordenarCategorias({ categorias: payloadReorden });
      if (res.exito) {
        mostrarToast('Secuencia de comanda actualizada.');
        await cargarCategorias();
      }
    } catch {
      mostrarToast('Error al actualizar el orden.', 'error');
    }
  };

  // Handler: Eliminar Categoría (con Bloqueo 409 asistido)
  const handleEliminarCategoria = async (categoria: CategoriaAdminDTO) => {
    if (categoria.total_productos === 0) {
      const confirmacion = window.confirm(
        `¿Estás seguro de que deseas eliminar la sección vacía "${categoria.nombre}"?`
      );
      if (!confirmacion) return;
    }

    try {
      const res = await mockAdminService.eliminarCategoria(categoria.id);

      if (res.exito) {
        mostrarToast(res.datos?.mensaje || `Categoría "${categoria.nombre}" eliminada.`);
        await cargarCategorias();
      } else {
        // Bloqueo 409 relacional
        if (res.errores?.[0]?.codigo === 'ERR_CATEGORIA_CON_PRODUCTOS') {
          setConflictoActual(res.datos as any);
          setModalBloqueoAbierto(true);
        } else {
          mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo eliminar la categoría.', 'error');
        }
      }
    } catch {
      mostrarToast('Error inesperado al intentar eliminar la categoría.', 'error');
    }
  };

  // Handler: Reasignar Platos y Eliminar
  const handleReasignarYEliminar = async (
    categoriaOrigenId: string,
    nuevaCategoriaId: string,
    productoIds?: string[]
  ): Promise<{ categoria_eliminada: boolean; platos_restantes: number }> => {
    const res = await mockAdminService.reasignarYEliminarCategoria(categoriaOrigenId, {
      nueva_categoria_id: nuevaCategoriaId,
      producto_ids: productoIds,
    });

    if (res.exito && res.datos) {
      if (res.datos.categoria_eliminada) {
        mostrarToast(res.datos.mensaje);
        await cargarCategorias();
      } else {
        // En reasignación parcial, recargamos el catálogo en background para actualizar los conteos de la categoría destino
        await cargarCategorias();
      }
      return {
        categoria_eliminada: res.datos.categoria_eliminada,
        platos_restantes: res.datos.platos_restantes,
      };
    } else {
      throw new Error(res.errores?.[0]?.mensaje || 'No se pudo completar la reasignación de platos.');
    }
  };

  // Handler: Aplicar Plantilla Gastronómica
  const handleCargarPlantilla = async (
    tipoPlantilla: TipoPlantillaGastronomica,
    reemplazarExistentes: boolean
  ): Promise<boolean> => {
    const res = await mockAdminService.cargarPlantillaGastronomica({
      tipo_plantilla: tipoPlantilla,
      reemplazar_existentes: reemplazarExistentes,
    });

    if (res.exito && res.datos) {
      mostrarToast('Plantilla gastronómica aplicada exitosamente.');
      setDatosResponse(res.datos);
      return true;
    } else {
      throw new Error(res.errores?.[0]?.mensaje || 'Error al aplicar plantilla gastronómica.');
    }
  };

  // Demostración QA: Vaciar Categorías
  const handleQAVaciar = () => {
    mockAdminService.simularCategoriasVacias();
    cargarCategorias();
    mostrarToast('Simulación: Todas las categorías fueron vaciadas (Modo Onboarding).');
  };

  // Demostración QA: Simular 409 directo
  const handleQASimular409 = () => {
    const catConPlatos = todasCategorias.find((c) => c.total_productos > 0);
    if (catConPlatos) {
      handleEliminarCategoria(catConPlatos);
    } else {
      mostrarToast('No hay categorías con platos para simular el bloqueo 409.', 'error');
    }
  };

  // Demostración QA: Restablecer Semillas
  const handleQARestablecer = () => {
    mockAdminService.restablecerCategoriasAurea();
    cargarCategorias();
    mostrarToast('Semillas canónicas de Sede Miraflores restablecidas.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in relative">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-slide-in ${
            toast.tipo === 'exito'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toast.mensaje}</span>
        </div>
      )}

      {/* =====================================================================
          1. ESTADO UX: SKELETON LOADING
          ===================================================================== */}
      {cargando && !datosResponse && (
        <div className="space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-40 bg-aurea-champagne/30 rounded" />
            <div className="h-8 w-64 bg-aurea-champagne/40 rounded-lg" />
            <div className="h-4 w-96 bg-aurea-champagne/20 rounded" />
          </div>

          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-aurea-champagne/30 p-4" />
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="h-72 bg-white rounded-2xl border border-aurea-champagne/30" />
        </div>
      )}

      {/* =====================================================================
          2. ESTADO UX: ERROR DE RED CON REINTENTO
          ===================================================================== */}
      {!cargando && error && (
        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-serif font-bold text-aurea-navy">Error al cargar la carta</h3>
            <p className="text-sm text-aurea-navy/70">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSimulandoError(false);
              cargarCategorias();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-navy text-white text-sm font-semibold hover:bg-aurea-navy/90 transition-all shadow-md min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4 text-aurea-champagne" />
            <span>Reintentar Conexión</span>
          </button>
        </div>
      )}

      {/* =====================================================================
          3. ESTADO UX: CARGADO REACTIVO (LOADED STATE)
          ===================================================================== */}
      {datosResponse && !error && (
        <>
          {/* Cabecera y KPIs */}
          <CategoriasHeader
            localNombre={datosResponse.local_nombre}
            resumen={datosResponse.resumen}
            onAbrirNuevaCategoria={handleAbrirNueva}
            onAbrirPlantillas={() => setModalPlantillaAbierto(true)}
          />

          {/* Si no hay ninguna categoría registrada (Onboarding inicial) */}
          {todasCategorias.length === 0 ? (
            <OnboardingCategoriasVacia
              onCrearPrimeraCategoria={handleAbrirNueva}
              onExplorarPlantillas={() => setModalPlantillaAbierto(true)}
            />
          ) : (
            <div className="space-y-4">
              {/* Filtros por pestaña y buscador */}
              <CategoriasFiltrosTabs
                filtroEstado={filtroEstado}
                onCambiarFiltroEstado={setFiltroEstado}
                busqueda={busqueda}
                onCambiarBusqueda={setBusqueda}
                conteos={conteos}
              />

              {/* Directorio de categorías (Tabla / Cards) */}
              <CategoriasTable
                categorias={categoriasFiltradas}
                todasCategoriasOrdenadas={todasCategorias}
                onSubirOrden={handleSubirOrden}
                onBajarOrden={handleBajarOrden}
                onConmutarVisibilidad={handleConmutarVisibilidad}
                onEditar={handleAbrirEditar}
                onEliminar={handleEliminarCategoria}
                onLimpiarBusqueda={() => {
                  setBusqueda('');
                  setFiltroEstado('todas');
                }}
                filtroActivo={filtroEstado !== 'todas' || busqueda.trim().length > 0}
              />
            </div>
          )}
        </>
      )}

      {/* Modales Interactivos */}
      <ModalCrearEditarCategoria
        abierto={modalFormAbierto}
        modo={modoForm}
        categoriaEditar={categoriaAEditar}
        onCerrar={() => setModalFormAbierto(false)}
        onGuardar={handleGuardarCategoria}
      />

      <ModalBloqueoReasignacion
        abierto={modalBloqueoAbierto}
        conflicto={conflictoActual}
        otrasCategoriasDisponibles={todasCategorias.filter(
          (c) => c.id !== conflictoActual?.categoria_id
        )}
        onCerrar={() => {
          setModalBloqueoAbierto(false);
          setConflictoActual(null);
        }}
        onReasignarYEliminar={handleReasignarYEliminar}
      />

      <ModalCargarPlantilla
        abierto={modalPlantillaAbierto}
        onCerrar={() => setModalPlantillaAbierto(false)}
        onCargarPlantilla={handleCargarPlantilla}
      />

      {/* Floating Demo Widget */}
      <DemoAdminCategoriasWidget
        onVaciarCategorias={handleQAVaciar}
        onRestablecerSemillas={handleQARestablecer}
        onSimularConflicto409={handleQASimular409}
        onAlternarErrorSimulado={() => {
          setSimulandoError((prev) => !prev);
        }}
        simulandoError={simulandoError}
      />
    </div>
  );
};
