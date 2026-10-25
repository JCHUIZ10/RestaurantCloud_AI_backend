import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ProductoAdminDTO,
  KpisCartaDTO,
  CategoriaAdminDTO,
  InsumoAdminDTO,
  CrearProductoRequest,
    SimulacionCapacidadDTO,
} from '@/types/admin';
import { mockAdminService, CANONICAL_LOCAL_ID } from '../services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import { ProductosHeader } from '../components/carta/ProductosHeader';
import { ProductosKpis } from '../components/carta/ProductosKpis';
import { ProductosToolbar } from '../components/carta/ProductosToolbar';
import { ProductosTable } from '../components/carta/ProductosTable';
import { ModalCrearEditarProducto } from '../components/carta/ModalCrearEditarProducto';
import { DrawerCalibrarReceta } from '../components/carta/DrawerCalibrarReceta';
import { OnboardingCartaVacia } from '../components/carta/OnboardingCartaVacia';
import { DemoAdminProductosWidget } from '../components/carta/DemoAdminProductosWidget';
import { ROUTES } from '@/router/routes.constants';
import { ModalConfirmacion, SoloDemo, useToast } from '@/components/ui';

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
  const [pasoInicialModal, setPasoInicialModal] = useState<1 | 2>(1);
  const [productoEditar, setProductoEditar] = useState<ProductoAdminDTO | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [productoParaReceta, setProductoParaReceta] = useState<ProductoAdminDTO | null>(null);
  const [simulacionCapacidad, setSimulacionCapacidad] = useState<SimulacionCapacidadDTO | null>(null);

  const [productoAArchivar, setProductoAArchivar] = useState<ProductoAdminDTO | null>(null);
  const [archivando, setArchivando] = useState(false);

  const { mostrar } = useToast();
  const mostrarToast = useCallback(
    (mensaje: string, tipo: 'exito' | 'error' = 'exito') => mostrar(mensaje, tipo === 'exito' ? 'ok' : 'error'),
    [mostrar]
  );

  // Cargar categorías e insumos para selectores
  const cargarCatalogosSecundarios = useCallback(async () => {
    try {
      const resCat = await adminService.obtenerCategorias(CANONICAL_LOCAL_ID);
      if (resCat.exito && resCat.datos) {
        setCategorias(resCat.datos.categorias || []);
      }

      const resIns = await adminService.obtenerInsumos(CANONICAL_LOCAL_ID, 'todos', '', 1, 100);
      if (resIns.exito && resIns.datos) {
        setInsumos(resIns.datos.insumos || []);
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
  }, [categoriaSeleccionada, disponibilidadSeleccionada, busqueda, pagina, limite, mostrarToast]);

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
    setPasoInicialModal(1);
    setProductoEditar(null);
    setModalAbierto(true);
  };

  const handleEditarProducto = async (prod: ProductoAdminDTO, paso: 1 | 2 = 1) => {
    setPasoInicialModal(paso);
    if (!prod.receta || prod.receta.length === 0) {
      try {
        const resReceta = await adminService.obtenerReceta(prod.id);
        if (resReceta.exito && resReceta.datos) {
          prod = {
            ...prod,
            receta: resReceta.datos.receta || resReceta.datos.items || [],
          };
        }
      } catch (e) {
        console.error('Error cargando receta para edición:', e);
      }
    }
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
      const [resReceta, resSim] = await Promise.all([
        adminService.obtenerReceta(prod.id),
        adminService.simularCapacidadBodega(prod.id),
      ]);
      if (resReceta.exito && resReceta.datos) {
        setProductoParaReceta({
          ...prod,
          costo_teorico: resReceta.datos.costo_teorico,
          margen_bruto_pct: resReceta.datos.margen_bruto_pct,
          disponibilidad: resReceta.datos.disponibilidad,
          motivo_agotado: resReceta.datos.motivo_agotado,
          total_ingredientes: resReceta.datos.total_ingredientes,
          receta: resReceta.datos.receta || resReceta.datos.items || prod.receta || [],
        });
      }
      if (resSim.exito && resSim.datos) {
        setSimulacionCapacidad(resSim.datos);
      }
    } catch (err) {
      console.error('Error calculando simulación de capacidad:', err);
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
  const handleArchivarProducto = (prod: ProductoAdminDTO) => setProductoAArchivar(prod);

  const handleConfirmarArchivado = async () => {
    if (!productoAArchivar) return;
    setArchivando(true);
    try {
      const res = await adminService.archivarProducto(productoAArchivar.id);
      if (res.exito) {
        mostrarToast(res.datos.mensaje);
        await cargarProductos();
      }
    } catch (err) {
      console.error('Error archivando producto:', err);
      mostrarToast('Error al archivar el producto.', 'error');
    } finally {
      setArchivando(false);
      setProductoAArchivar(null);
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
    <div className="space-y-6">
      <ProductosHeader onAbrirNuevoProducto={handleAbrirNuevoProducto} />

      <ProductosKpis kpis={kpis} totalCategorias={categorias.length} />

      {!cargando && kpis.total_productos === 0 && !busqueda ? (
        <OnboardingCartaVacia
          onCrearPrimerPlato={handleAbrirNuevoProducto}
          onCargarSemillasAurea={handleRestablecerAurea}
          habilitarReceta={true}
        />
      ) : (
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
          mostrarDatosReceta={true}
          cabecera={
            <ProductosToolbar
              categorias={categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              onSeleccionarCategoria={handleSeleccionarCategoria}
              disponibilidadSeleccionada={disponibilidadSeleccionada}
              onSeleccionarDisponibilidad={handleSeleccionarDisponibilidad}
              busquedaActiva={busqueda}
              onBuscar={handleBuscar}
              totalProductos={kpis.total_productos}
              disponibles={kpis.disponibles}
              agotados={kpis.agotados}
            />
          }
        />
      )}

      <ModalConfirmacion
        abierto={!!productoAArchivar}
        onCerrar={() => setProductoAArchivar(null)}
        onConfirmar={handleConfirmarArchivado}
        cargando={archivando}
        tono="alerta"
        titulo="Archivar plato"
        mensaje={
          <>
            «{productoAArchivar?.nombre}» saldrá de la carta. Su historial de ventas y comandas se conserva.
          </>
        }
        textoConfirmar="Archivar"
      />

      {/* Modal de Alta y Edición de Producto */}
      <ModalCrearEditarProducto
        abierto={modalAbierto}
        productoEditar={productoEditar}
        categorias={categorias}
        insumosDisponibles={insumos}
        onCerrar={() => {
          setModalAbierto(false);
          setPasoInicialModal(1);
        }}
        onGuardar={handleGuardarProducto}
        onIrACategorias={() => {
          setModalAbierto(false);
          navigate(ROUTES.ADMIN_CATEGORIAS);
        }}
        habilitarReceta={true}
        pasoInicial={pasoInicialModal}
      />

      {/* Drawer de Calibración Rápida de Recetas y Capacidad */}
      <DrawerCalibrarReceta
        abierto={drawerAbierto}
        producto={productoParaReceta}
        insumosDisponibles={insumos}
        simulacion={simulacionCapacidad}
        onCerrar={() => setDrawerAbierto(false)}
        onEditarReceta={(prod) => {
          setDrawerAbierto(false);
          handleEditarProducto(prod, 2);
        }}
      />

      {/* Widget Interactivo de Pruebas */}
      <SoloDemo>
        {!IS_REAL_API && (
          <DemoAdminProductosWidget
            onSimularQuiebreLimon={handleSimularQuiebreLimon}
            onSimularReposicionLimon={handleSimularReposicionLimon}
            onSimularCartaVacia={handleSimularCartaVacia}
            onRestablecerAurea={handleRestablecerAurea}
          />
        )}
      </SoloDemo>
    </div>
  );
};
