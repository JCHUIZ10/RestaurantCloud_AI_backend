import React, { useState, useEffect, useCallback } from 'react';
import {
  ProveedorResumenDTO,
  ProveedoresKPIsDTO,
  CrearProveedorRequestDTO,
  ActualizarProveedorRequestDTO,
  InsumoAdminDTO,
  ProveedorHistorialComprasDTO,
} from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import { ProveedoresHeader } from '../components/proveedores/ProveedoresHeader';
import { ProveedoresKpis } from '../components/proveedores/ProveedoresKpis';
import { ProveedoresToolbar } from '../components/proveedores/ProveedoresToolbar';
import { ProveedoresTable } from '../components/proveedores/ProveedoresTable';
import { ModalCrearEditarProveedor } from '../components/proveedores/ModalCrearEditarProveedor';
import { ModalConfirmarEliminarProveedor } from '../components/proveedores/ModalConfirmarEliminarProveedor';
import { DrawerHistorialCompras } from '../components/proveedores/DrawerHistorialCompras';
import { OnboardingProveedoresVacio } from '../components/proveedores/OnboardingProveedoresVacio';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';
import { useToast } from '@/components/ui';

const FALLBACK_LOCAL_ID = '00000000-0000-4000-8000-000000000010';

export const AdminProveedoresPage: React.FC = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const localId = usuario?.local?.id ?? FALLBACK_LOCAL_ID;

  // Estados de datos
  const [proveedores, setProveedores] = useState<ProveedorResumenDTO[]>([]);
  const [kpis, setKpis] = useState<ProveedoresKPIsDTO>({
    total_activos: 0,
    compras_mes_total: 0,
    fichas_mes_total: 0,
    proveedores_frecuentes: 0,
  });
  const [catalogoInsumos, setCatalogoInsumos] = useState<InsumoAdminDTO[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados de filtrado y paginación
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [limitePorPagina, setLimitePorPagina] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [conteos, setConteos] = useState({ activos: 0, inactivos: 0, todos: 0 });

  // Estados de modales y drawers
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorParaEditar, setProveedorParaEditar] = useState<ProveedorResumenDTO | null>(null);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [proveedorParaEliminar, setProveedorParaEliminar] = useState<ProveedorResumenDTO | null>(null);

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [proveedorParaHistorial, setProveedorParaHistorial] = useState<ProveedorResumenDTO | null>(null);
  const [historialCompras, setHistorialCompras] = useState<ProveedorHistorialComprasDTO | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const { mostrar } = useToast();
  const mostrarToast = useCallback(
    (mensaje: string, tipo: 'exito' | 'error' | 'advertencia' = 'exito') =>
      mostrar(mensaje, tipo === 'exito' ? 'ok' : tipo === 'advertencia' ? 'alerta' : 'error'),
    [mostrar]
  );

  // Cargar catálogo de insumos de bodega
  const cargarInsumos = useCallback(async () => {
    try {
      const res = await adminService.obtenerInsumos(localId, 'todos', '', 1, 100);
      if (res.exito && res.datos) {
        setCatalogoInsumos(res.datos.insumos);
      }
    } catch {
      // Silenciar error secundario de catálogo
    }
  }, [localId]);

  // Cargar proveedores según filtros y paginación
  const cargarProveedores = useCallback(async () => {
    setCargando(true);
    try {
      const res = await adminService.getProveedores(localId, {
        estado: estadoFiltro,
        query: busqueda,
        pagina: paginaActual,
        limite: limitePorPagina,
      });

      if (res.exito && res.datos) {
        setProveedores(res.datos.proveedores);
        setKpis(res.datos.kpis);
        setTotalItems(res.datos.total_items);
        setTotalPaginas(res.datos.total_paginas);

        // Actualizar conteos para las pestañas de estado
        const [resActivos, resInactivos, resTodos] = await Promise.all([
          adminService.getProveedores(localId, { estado: 'activos', query: busqueda, limite: 1 }),
          adminService.getProveedores(localId, { estado: 'inactivos', query: busqueda, limite: 1 }),
          adminService.getProveedores(localId, { estado: 'todos', query: busqueda, limite: 1 }),
        ]);

        setConteos({
          activos: resActivos.datos?.total_items ?? 0,
          inactivos: resInactivos.datos?.total_items ?? 0,
          todos: resTodos.datos?.total_items ?? 0,
        });
      } else {
        const errorMsg = res.errores?.[0]?.mensaje || 'No se pudo obtener el directorio de proveedores.';
        mostrarToast(errorMsg, 'error');
      }
    } catch (err: any) {
      mostrarToast('Error al cargar proveedores: ' + (err.message || 'Error de red'), 'error');
    } finally {
      setCargando(false);
    }
  }, [localId, estadoFiltro, busqueda, paginaActual, limitePorPagina, mostrarToast]);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  useEffect(() => {
    cargarInsumos();
  }, [cargarInsumos]);

  // Manejadores de filtros
  const handleBuscar = (texto: string) => {
    setBusqueda(texto);
    setPaginaActual(1);
  };

  const handleCambiarEstadoFiltro = (estado: 'activos' | 'inactivos' | 'todos') => {
    setEstadoFiltro(estado);
    setPaginaActual(1);
  };

  const handleAbrirNuevoProveedor = () => {
    setProveedorParaEditar(null);
    setModalAbierto(true);
  };

  const handleEditarProveedor = (p: ProveedorResumenDTO) => {
    setProveedorParaEditar(p);
    setModalAbierto(true);
  };

  const handleGuardarProveedor = async (
    datos: CrearProveedorRequestDTO | ActualizarProveedorRequestDTO
  ): Promise<{ success: boolean; mensajeError?: string }> => {
    try {
      if (proveedorParaEditar) {
        const res = await adminService.actualizarProveedor(
          proveedorParaEditar.id,
          datos as ActualizarProveedorRequestDTO
        );
        if (res.exito) {
          mostrarToast(`Proveedor "${res.datos.nombre}" actualizado correctamente.`);
          await cargarProveedores();
          return { success: true };
        } else {
          return {
            success: false,
            mensajeError: res.errores?.[0]?.mensaje || 'Error al actualizar proveedor.',
          };
        }
      } else {
        const res = await adminService.crearProveedor(
          localId,
          datos as CrearProveedorRequestDTO
        );
        if (res.exito) {
          mostrarToast(`Proveedor "${res.datos.nombre}" registrado en agenda exitosamente.`);
          await cargarProveedores();
          return { success: true };
        } else {
          return {
            success: false,
            mensajeError: res.errores?.[0]?.mensaje || 'Error al registrar proveedor.',
          };
        }
      }
    } catch (err: any) {
      return {
        success: false,
        mensajeError: err.message || 'Error inesperado de comunicación.',
      };
    }
  };

  // Abre el modal contextual de confirmación
  const handleEliminarProveedor = (p: ProveedorResumenDTO) => {
    setProveedorParaEliminar(p);
    setModalEliminarAbierto(true);
  };

  // Procesa la acción confirmada dentro del modal (desactivación amigable si tiene compras o borrado físico si no tiene)
  const handleConfirmarAccionModal = async (p: ProveedorResumenDTO) => {
    if (p.total_compras > 0) {
      const res = await adminService.conmutarEstadoProveedor(p.id, false);
      if (res.exito) {
        mostrarToast(`Proveedor "${p.nombre}" desactivado para futuras compras.`);
        await cargarProveedores();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo desactivar el proveedor.', 'error');
      }
    } else {
      const res = await adminService.eliminarProveedor(p.id);
      if (res.exito) {
        mostrarToast(`Proveedor "${p.nombre}" eliminado definitivamente de tu directorio.`);
        await cargarProveedores();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo eliminar el proveedor.', 'error');
      }
    }
  };

  // Reactivar un proveedor inactivo
  const handleReactivarProveedor = async (p: ProveedorResumenDTO) => {
    try {
      const res = await adminService.conmutarEstadoProveedor(p.id, true);
      if (res.exito) {
        mostrarToast(`Proveedor "${p.nombre}" reactivado para compras exitosamente.`);
        await cargarProveedores();
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo reactivar el proveedor.', 'error');
      }
    } catch {
      mostrarToast('Error al reactivar el proveedor.', 'error');
    }
  };

  const handleAbrirHistorial = async (p: ProveedorResumenDTO) => {
    setProveedorParaHistorial(p);
    setDrawerAbierto(true);
    setCargandoHistorial(true);
    try {
      const res = await adminService.getHistorialComprasProveedor(p.id);
      if (res.exito && res.datos) {
        setHistorialCompras(res.datos);
      } else {
        mostrarToast(res.errores?.[0]?.mensaje || 'No se pudo cargar el historial de compras.', 'error');
      }
    } catch {
      mostrarToast('Error al cargar historial de compras.', 'error');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const handleNuevaCompraDesdeDrawer = (_p: ProveedorResumenDTO) => {
    setDrawerAbierto(false);
    navigate(ROUTES.ADMIN_COMPRAS);
  };

  const directorioCompletamenteVacio =
    !cargando && conteos.todos === 0 && !busqueda;

  return (
    <div className="space-y-6">
      <ProveedoresHeader onAbrirNuevoProveedor={handleAbrirNuevoProveedor} />

      {directorioCompletamenteVacio ? (
        <OnboardingProveedoresVacio onAbrirNuevoProveedor={handleAbrirNuevoProveedor} />
      ) : (
        <>
          <ProveedoresKpis kpis={kpis} />

          <ProveedoresTable
            proveedores={proveedores}
            totalItems={totalItems}
            paginaActual={paginaActual}
            limitePorPagina={limitePorPagina}
            totalPaginas={totalPaginas}
            cargando={cargando}
            onCambiarPagina={(pag) => setPaginaActual(pag)}
            onCambiarLimite={(lim) => {
              setLimitePorPagina(lim);
              setPaginaActual(1);
            }}
            onAbrirHistorial={handleAbrirHistorial}
            onEditar={handleEditarProveedor}
            onReactivar={handleReactivarProveedor}
            onEliminar={handleEliminarProveedor}
            cabecera={
              <ProveedoresToolbar
                busqueda={busqueda}
                onBuscar={handleBuscar}
                estadoFiltro={estadoFiltro}
                onChangeEstadoFiltro={handleCambiarEstadoFiltro}
                conteos={conteos}
              />
            }
          />
        </>
      )}

      {/* Modal de Alta / Edición Ágil de Proveedor */}
      <ModalCrearEditarProveedor
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        proveedorParaEditar={proveedorParaEditar}
        catalogoInsumos={catalogoInsumos}
        onGuardar={handleGuardarProveedor}
      />

      {/* Modal Inteligente y Amigable de Confirmación para Eliminar / Desactivar */}
      <ModalConfirmarEliminarProveedor
        abierto={modalEliminarAbierto}
        onCerrar={() => setModalEliminarAbierto(false)}
        proveedor={proveedorParaEliminar}
        onConfirmarAccion={handleConfirmarAccionModal}
      />

      {/* Quick-Drawer Lateral de Historial de Compras y Precios */}
      <DrawerHistorialCompras
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        proveedor={proveedorParaHistorial}
        historial={historialCompras}
        cargando={cargandoHistorial}
        onNuevaCompra={handleNuevaCompraDesdeDrawer}
      />
    </div>
  );
};
