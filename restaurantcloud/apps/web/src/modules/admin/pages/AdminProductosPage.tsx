import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ProductoAdminDTO,
  KpisCartaDTO,
  CategoriaAdminDTO,
  InsumoAdminDTO,
  CrearProductoRequest,
  ActualizarRecetaRequest,
  SimulacionCapacidadDTO,
} from '@/types/admin';
import {
  mockAdminService,
  CANONICAL_LOCAL_ID,
  CANONICAL_LOCAL_NOMBRE,
} from '../services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import { ProductosHeader } from '../components/carta/ProductosHeader';
import { ProductosKpis } from '../components/carta/ProductosKpis';
import { ProductosToolbar } from '../components/carta/ProductosToolbar';
import { ProductosTable } from '../components/carta/ProductosTable';
import { ModalCrearEditarProducto } from '../components/carta/ModalCrearEditarProducto';
import { DrawerCalibrarReceta } from '../components/carta/DrawerCalibrarReceta';
import { OnboardingCartaVacia } from '../components/carta/OnboardingCartaVacia';
import { DemoAdminProductosWidget } from '../components/carta/DemoAdminProductosWidget';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';

export const AdminProductosPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales de datos
  const [productos, setProductos] = useState<ProductoAdminDTO[]>([]);
  const [kpis, setKpis] = useState<KpisCartaDTO>({
    total_productos: 0,
    disponibles: 0,
    agotados: 0,
    margen_promedio: 0,
  });
  const [categorias, setCategorias] = useState<CategoriaAdminDTO[]>([]);
  const [insumos, setInsumos] = useState<InsumoAdminDTO[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados de filtrado y paginación
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [disponibilidadSeleccionada, setDisponibilidadSeleccionada] = useState<'todos' | 'disponible' | 'agotado'>('todos');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Modales y Drawers
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<ProductoAdminDTO | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [productoParaReceta, setProductoParaReceta] = useState<ProductoAdminDTO | null>(null);
  const [simulacionCapacidad, setSimulacionCapacidad] = useState<SimulacionCapacidadDTO | null>(null);

  // Notificación Toast
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar categorías e insumos para selectores
  const cargarCatalogosSecundarios = useCallback(async () => {
    try {
      const resCat = await adminService.obtenerCategorias(CANONICAL_LOCAL_ID);
      if (resCat.exito && resCat.datos) {
        setCategorias(resCat.datos.categorias || []);
      }

      if (IS_REAL_API) {
        setInsumos([]);
      } else {
        const resIns = await mockAdminService.obtenerInsumos(CANONICAL_LOCAL_ID, 'todos', '', 1, 100);
        if (resIns.exito && resIns.datos) {
          setInsumos(resIns.datos.insumos || []);
        }
      }
    } catch (err) {
      console.error('Error cargando catálogos secundarios:', err);
    }
  }, []);

  // Cargar productos con filtros actuales
  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await adminService.obtenerProductos(
        CANONICAL_LOCAL_ID,
        categoriaSeleccionada,
        disponibilidadSeleccionada,
        busqueda,
        pagina,
        limite
      );

      if (res.exito && res.datos) {
        setProductos(res.datos.productos);
        setKpis(res.datos.kpis);
        setTotalRegistros(res.datos.paginacion.total);
        setTotalPaginas(res.datos.paginacion.total_paginas);
      }
    } catch (err) {
      console.error('Error cargando catálogo de productos:', err);
      mostrarToast('Error al consultar el catálogo de productos', 'error');
    } finally {
      setCargando(false);
    }
  }, [categoriaSeleccionada, disponibilidadSeleccionada, busqueda, pagina, limite]);

  useEffect(() => {
    cargarCatalogosSecundarios();
  }, [cargarCatalogosSecundarios]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Manejadores de Filtros
  const handleBuscar = (termino: string) => {
    setBusqueda(termino);
    setPagina(1);
  };

  const handleSeleccionarCategoria = (catId: string) => {
    setCategoriaSeleccionada(catId);
    setPagina(1);
  };

  const handleSeleccionarDisponibilidad = (disp: 'todos' | 'disponible' | 'agotado') => {
    setDisponibilidadSeleccionada(disp);
    setPagina(1);
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    setPagina(nuevaPagina);
  };

  const handleCambiarLimite = (nuevoLimite: number) => {
    setLimite(nuevoLimite);
    setPagina(1);
  };

  // Manejadores de Modales
  const handleAbrirNuevoProducto = () => {
    setProductoEditar(null);
    setModalAbierto(true);
  };

  const handleEditarProducto = (prod: ProductoAdminDTO) => {
    setProductoEditar(prod);
    setModalAbierto(true);
  };

  const handleGuardarProducto = async (req: CrearProductoRequest): Promise<boolean> => {
    try {
      if (productoEditar) {
        const res = await adminService.actualizarProducto(productoEditar.id, req);
        if (res.exito) {
          mostrarToast(`Plato "${req.nombre}" actualizado exitosamente.`);
          await cargarProductos();
          return true;
        } else {
          mostrarToast(res.errores?.[0]?.mensaje || 'Error al actualizar plato.', 'error');
          return false;
        }
      } else {
        const res = await adminService.crearProducto(CANONICAL_LOCAL_ID, req);
        if (res.exito) {
          mostrarToast(
            IS_REAL_API
              ? `Plato "${req.nombre}" registrado exitosamente.`
              : `Plato "${req.nombre}" registrado exitosamente con su receta culinaria.`
          );
          await cargarProductos();
          return true;
        } else {
          mostrarToast(res.errores?.[0]?.mensaje || 'Error al crear plato.', 'error');
          return false;
        }
      }
    } catch (err) {
      console.error('Error guardando producto:', err);
      mostrarToast('Ocurrió un error inesperado al procesar la solicitud.', 'error');
      return false;
    }
  };

  // Quick-Drawer de Receta y Capacidad
  const handleVerReceta = async (prod: ProductoAdminDTO) => {
    setProductoParaReceta(prod);
    setDrawerAbierto(true);
    try {
      const resSim = await mockAdminService.simularCapacidadBodega(prod.id);
      if (resSim.exito) {
        setSimulacionCapacidad(resSim.datos);
      }
    } catch (err) {
      console.error('Error calculando simulación de capacidad:', err);
    }
  };

  const handleGuardarReceta = async (
    productoId: string,
    req: ActualizarRecetaRequest
  ): Promise<boolean> => {
    try {
      const res = await mockAdminService.actualizarReceta(productoId, req);
      if (res.exito) {
        mostrarToast(res.datos.mensaje || 'Receta calibrada correctamente.');
        await cargarProductos();
        // Refrescar plato seleccionado en drawer
        const resProd = await mockAdminService.obtenerProductoPorId(productoId);
        if (resProd.exito) {
          setProductoParaReceta(resProd.datos);
        }
        return true;
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'Error al actualizar receta.', 'error');
        return false;
      }
    } catch (err) {
      console.error('Error calibrando receta:', err);
      mostrarToast('Error al calibrar receta.', 'error');
      return false;
    }
  };

  // Conmutar Disponibilidad Rápida
  const handleConmutarDisponibilidad = async (prod: ProductoAdminDTO) => {
    const nuevoEstado = prod.disponibilidad === 'disponible' ? 'agotado' : 'disponible';
    try {
      const res = await adminService.conmutarDisponibilidadProducto(
        prod.id,
        nuevoEstado,
        nuevoEstado === 'agotado' ? 'decision_admin' : undefined
      );
      if (res.exito) {
        mostrarToast(
          `Plato "${prod.nombre}" marcado como ${nuevoEstado === 'disponible' ? 'Disponible' : 'Agotado'}.`
        );
        await cargarProductos();
      }
    } catch (err) {
      console.error('Error conmutando disponibilidad:', err);
      mostrarToast('Error al actualizar disponibilidad.', 'error');
    }
  };

  // Archivado Lógico Seguro (activo = false)
  const handleArchivarProducto = async (prod: ProductoAdminDTO) => {
    const confirmar = window.confirm(
      `¿Deseas archivar "${prod.nombre}" de la carta comercial?\n\nEl plato no se borrará físicamente para preservar las auditorías de ventas y comandas históricas.`
    );
    if (!confirmar) return;

    try {
      const res = await adminService.archivarProducto(prod.id);
      if (res.exito) {
        mostrarToast(res.datos.mensaje);
        await cargarProductos();
      }
    } catch (err) {
      console.error('Error archivando producto:', err);
      mostrarToast('Error al archivar el producto.', 'error');
    }
  };

  // Simulaciones de Demostración
  const handleSimularQuiebreLimon = async () => {
    mockAdminService.simularQuiebreInsumoReceta();
    mostrarToast('Simulación activada: Limón puesto en stock 0. Ceviche y Causa pasan a Agotado.');
    await cargarProductos();
    await cargarCatalogosSecundarios();
  };

  const handleSimularReposicionLimon = async () => {
    mockAdminService.simularReposicionInsumoReceta();
    mostrarToast('Simulación activada: Limón reabastecido con 10 kg. Platos reactivados.');
    await cargarProductos();
    await cargarCatalogosSecundarios();
  };

  const handleSimularCartaVacia = async () => {
    mockAdminService.simularCartaVacia();
    mostrarToast('Simulación activada: Carta vaciada para probar el onboarding guiado.');
    await cargarProductos();
  };

  const handleRestablecerAurea = async () => {
    mockAdminService.restablecerCartaAurea();
    mockAdminService.restablecerInsumosAurea();
    mostrarToast('Semillas canónicas de Áurea restauradas completamente.');
    await cargarProductos();
    await cargarCatalogosSecundarios();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Notificación Toast Flotante */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-top-4 duration-200 ${
            toast.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.mensaje}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-full hover:bg-black/5 text-current/60 hover:text-current"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera Principal */}
      <ProductosHeader
        localNombre={CANONICAL_LOCAL_NOMBRE}
        onAbrirNuevoProducto={handleAbrirNuevoProducto}
      />

      {/* Tarjetas KPI */}
      <ProductosKpis
        kpis={kpis}
        totalCategorias={categorias.length}
      />

      {/* Si no hay productos en la sede y no hay búsqueda activa, mostrar onboarding */}
      {!cargando && kpis.total_productos === 0 && !busqueda ? (
        <OnboardingCartaVacia
          onCrearPrimerPlato={handleAbrirNuevoProducto}
          onCargarSemillasAurea={handleRestablecerAurea}
          habilitarReceta={!IS_REAL_API}
        />
      ) : (
        <>
          {/* Barra de Herramientas y Filtros */}
          <ProductosToolbar
            categorias={categorias}
            categoriaSeleccionada={categoriaSeleccionada}
            onSeleccionarCategoria={handleSeleccionarCategoria}
            disponibilidadSeleccionada={disponibilidadSeleccionada}
            onSeleccionarDisponibilidad={handleSeleccionarDisponibilidad}
            busquedaActiva={busqueda}
            onBuscar={handleBuscar}
            totalProductos={kpis.total_productos}
          />

          {/* Tabla de Productos de la Carta */}
          <ProductosTable
            productos={productos}
            cargando={cargando}
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            limitePorPagina={limite}
            onCambiarPagina={handleCambiarPagina}
            onCambiarLimite={handleCambiarLimite}
            onVerReceta={handleVerReceta}
            onEditarProducto={handleEditarProducto}
            onArchivarProducto={handleArchivarProducto}
            onConmutarDisponibilidad={handleConmutarDisponibilidad}
            mostrarDatosReceta={!IS_REAL_API}
          />
        </>
      )}

      {/* Modal de Alta y Edición de Producto */}
      <ModalCrearEditarProducto
        abierto={modalAbierto}
        productoEditar={productoEditar}
        categorias={categorias}
        insumosDisponibles={insumos}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={handleGuardarProducto}
        onIrACategorias={() => {
          setModalAbierto(false);
          navigate(ROUTES.ADMIN_CATEGORIAS);
        }}
        habilitarReceta={!IS_REAL_API}
      />

      {/* Drawer de Calibración Rápida de Recetas y Capacidad */}
      {!IS_REAL_API && (
        <DrawerCalibrarReceta
          abierto={drawerAbierto}
          producto={productoParaReceta}
          insumosDisponibles={insumos}
          simulacion={simulacionCapacidad}
          onCerrar={() => setDrawerAbierto(false)}
          onGuardarReceta={handleGuardarReceta}
        />
      )}

      {/* Widget Interactivo de Pruebas */}
      {!IS_REAL_API && (
        <DemoAdminProductosWidget
          onSimularQuiebreLimon={handleSimularQuiebreLimon}
          onSimularReposicionLimon={handleSimularReposicionLimon}
          onSimularCartaVacia={handleSimularCartaVacia}
          onRestablecerAurea={handleRestablecerAurea}
        />
      )}
    </div>
  );
};
