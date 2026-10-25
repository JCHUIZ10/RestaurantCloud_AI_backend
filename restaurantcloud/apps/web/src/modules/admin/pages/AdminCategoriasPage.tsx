import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '@/services/serviceAdapter';
import {
  CategoriasAdminResponseDTO,
  CategoriaAdminDTO,
  CrearCategoriaRequest,
  ActualizarCategoriaRequest,
  ConflictoCategoriaConProductosDTO,
} from '@/types/admin';

import { CategoriasHeader } from '../components/categorias/CategoriasHeader';
import {
  CategoriasFiltrosTabs,
  FiltroEstadoCategoria,
} from '../components/categorias/CategoriasFiltrosTabs';
import { CategoriasTable } from '../components/categorias/CategoriasTable';
import { ModalCrearEditarCategoria } from '../components/categorias/ModalCrearEditarCategoria';
import { ModalBloqueoReasignacion } from '../components/categorias/ModalBloqueoReasignacion';
import { OnboardingCategoriasVacia } from '../components/categorias/OnboardingCategoriasVacia';

import { EstadoError, ModalConfirmacion, Skeleton, useToast } from '@/components/ui';

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

  // Confirmación de borrado de una categoría sin platos
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<CategoriaAdminDTO | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  const { mostrar } = useToast();
  const mostrarToast = useCallback(
    (mensaje: string, tipo: 'exito' | 'error' = 'exito') => mostrar(mensaje, tipo === 'exito' ? 'ok' : 'error'),
    [mostrar]
  );

  // Cargar Categorías
  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const res = await adminService.obtenerCategorias();
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
  }, []);

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
      const res = await adminService.crearCategoria(payload as CrearCategoriaRequest);
      if (res.exito && res.datos) {
        mostrarToast(`Categoría "${res.datos.nombre}" creada exitosamente.`);
        await cargarCategorias();
        return true;
      } else {
        throw new Error(res.errores?.[0]?.mensaje || 'No se pudo crear la categoría.');
      }
    } else if (modoForm === 'editar' && id) {
      const res = await adminService.actualizarCategoria(id, payload as ActualizarCategoriaRequest);
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
      const res = await adminService.conmutarVisibilidadCategoria(id, activa);
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
      const res = await adminService.reordenarCategorias({ categorias: payloadReorden });
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
      const res = await adminService.reordenarCategorias({ categorias: payloadReorden });
      if (res.exito) {
        mostrarToast('Secuencia de comanda actualizada.');
        await cargarCategorias();
      }
    } catch {
      mostrarToast('Error al actualizar el orden.', 'error');
    }
  };

  // Handler: Eliminar Categoría (con Bloqueo 409 asistido). Las vacías piden confirmación antes.
  const handleEliminarCategoria = (categoria: CategoriaAdminDTO) => {
    if (categoria.total_productos === 0) {
      setCategoriaAEliminar(categoria);
      return;
    }
    void ejecutarEliminacion(categoria);
  };

  const handleConfirmarEliminacion = async () => {
    if (!categoriaAEliminar) return;
    setEliminando(true);
    await ejecutarEliminacion(categoriaAEliminar);
    setEliminando(false);
    setCategoriaAEliminar(null);
  };

  const ejecutarEliminacion = async (categoria: CategoriaAdminDTO) => {
    try {
      const res = await adminService.eliminarCategoria(categoria.id);

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
    const res = await adminService.reasignarYEliminarCategoria(categoriaOrigenId, {
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

  return (
    <div className="space-y-6">
      {/* Carga: la misma forma que la vista final */}
      {cargando && !datosResponse && (
        <div className="space-y-6" aria-busy="true" aria-label="Cargando categorías">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {!cargando && error && (
        <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm max-w-lg mx-auto">
          <EstadoError
            titulo="No se pudieron cargar las categorías"
            mensaje={error}
            onReintentar={() => cargarCategorias()}
          />
        </div>
      )}

      {/* Con datos */}
      {datosResponse && !error && (
        <>
          {/* Cabecera y KPIs */}
          <CategoriasHeader
            resumen={datosResponse.resumen}
            onAbrirNuevaCategoria={handleAbrirNueva}
          />

          {/* Si no hay ninguna categoría registrada (Onboarding inicial) */}
          {todasCategorias.length === 0 ? (
            <OnboardingCategoriasVacia
              onCrearPrimeraCategoria={handleAbrirNueva}
            />
          ) : (
            <CategoriasTable
                cabecera={
                  <CategoriasFiltrosTabs
                    filtroEstado={filtroEstado}
                    onCambiarFiltroEstado={setFiltroEstado}
                    busqueda={busqueda}
                    onCambiarBusqueda={setBusqueda}
                    conteos={conteos}
                  />
                }
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
          )}
        </>
      )}

      <ModalConfirmacion
        abierto={!!categoriaAEliminar}
        onCerrar={() => setCategoriaAEliminar(null)}
        onConfirmar={handleConfirmarEliminacion}
        cargando={eliminando}
        titulo="Eliminar categoría"
        mensaje={<>¿Eliminar la categoría vacía «{categoriaAEliminar?.nombre}»? Esta acción no se puede deshacer.</>}
        textoConfirmar="Eliminar"
      />

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
    </div>
  );
};
