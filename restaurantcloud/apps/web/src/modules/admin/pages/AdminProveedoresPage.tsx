import React, { useState, useEffect, useCallback } from 'react';
import {
  ProveedorResumenDTO,
  ProveedoresKPIsDTO,
  CrearProveedorRequestDTO,
  ActualizarProveedorRequestDTO,
  InsumoAdminDTO,
  ProveedorHistorialComprasDTO,
} from '@/types/admin';
import {
  mockAdminService,
  CANONICAL_LOCAL_ID,
  CANONICAL_LOCAL_NOMBRE,
  PROV_SAN_FERNANDO_ID,
} from '../services/mockAdminService';
import { ProveedoresHeader } from '../components/proveedores/ProveedoresHeader';
import { ProveedoresKpis } from '../components/proveedores/ProveedoresKpis';
import { ProveedoresToolbar } from '../components/proveedores/ProveedoresToolbar';
import { ProveedoresTable } from '../components/proveedores/ProveedoresTable';
import { ModalCrearEditarProveedor } from '../components/proveedores/ModalCrearEditarProveedor';
import { DrawerHistorialCompras } from '../components/proveedores/DrawerHistorialCompras';
import { OnboardingProveedoresVacio } from '../components/proveedores/OnboardingProveedoresVacio';
import { DemoAdminProveedoresWidget } from '../components/proveedores/DemoAdminProveedoresWidget';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export const AdminProveedoresPage: React.FC = () => {
  const navigate = useNavigate();
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

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [proveedorParaHistorial, setProveedorParaHistorial] = useState<ProveedorResumenDTO | null>(null);
  const [historialCompras, setHistorialCompras] = useState<ProveedorHistorialComprasDTO | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Notificación Toast
  const [toast, setToast] = useState<{
    tipo: 'exito' | 'error' | 'advertencia';
    mensaje: string;
  } | null>(null);

  const mostrarToast = useCallback(
    (mensaje: string, tipo: 'exito' | 'error' | 'advertencia' = 'exito') => {
      setToast({ tipo, mensaje });
      setTimeout(() => {
        setToast((prev) => (prev?.mensaje === mensaje ? null : prev));
      }, 5000);
    },
    []
  );

  // Cargar catálogo de insumos de bodega
  const cargarInsumos = useCallback(async () => {
    try {
      const res = await mockAdminService.obtenerInsumos(CANONICAL_LOCAL_ID, 'todos', '', 1, 100);
      if (res.exito && res.datos) {
        setCatalogoInsumos(res.datos.insumos);
      }
    } catch {
      // Silenciar error secundario
    }
  }, []);

  // Cargar proveedores según filtros y paginación
  const cargarProveedores = useCallback(async () => {
    setCargando(true);
    try {
      const res = await mockAdminService.getProveedores(CANONICAL_LOCAL_ID, {
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

        // Actualizar conteos para los tabs
        const [resActivos, resInactivos, resTodos] = await Promise.all([
          mockAdminService.getProveedores(CANONICAL_LOCAL_ID, { estado: 'activos', query: busqueda, limite: 1 }),
          mockAdminService.getProveedores(CANONICAL_LOCAL_ID, { estado: 'inactivos', query: busqueda, limite: 1 }),
          mockAdminService.getProveedores(CANONICAL_LOCAL_ID, { estado: 'todos', query: busqueda, limite: 1 }),
        ]);

        setConteos({
          activos: resActivos.datos?.total_items ?? 0,
          inactivos: resInactivos.datos?.total_items ?? 0,
          todos: resTodos.datos?.total_items ?? 0,
        });
      }
    } catch (err: any) {
      mostrarToast('Error al cargar proveedores: ' + (err.message || 'Error de red'), 'error');
    } finally {
      setCargando(false);
    }
  }, [estadoFiltro, busqueda, paginaActual, limitePorPagina, mostrarToast]);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  useEffect(() => {
    cargarInsumos();
  }, [cargarInsumos]);

  // Manejadores de acciones
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
        const res = await mockAdminService.actualizarProveedor(
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
        const res = await mockAdminService.crearProveedor(
          CANONICAL_LOCAL_ID,
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

  const handleToggleEstado = async (p: ProveedorResumenDTO) => {
    const nuevoEstado = !p.activo;
    try {
      const res = await mockAdminService.conmutarEstadoProveedor(p.id, nuevoEstado);
      if (res.exito) {
        mostrarToast(
          nuevoEstado
            ? `Proveedor "${p.nombre}" reactivado en agenda comercial.`
            : `Proveedor "${p.nombre}" desactivado para compras.`
        );
        await cargarProveedores();
      }
    } catch {
      mostrarToast('Error al cambiar estado del proveedor.', 'error');
    }
  };

  const handleEliminarProveedor = async (p: ProveedorResumenDTO) => {
    try {
      const res = await mockAdminService.eliminarProveedor(p.id);
      if (res.exito) {
        mostrarToast(`Proveedor "${p.nombre}" eliminado del directorio.`);
        await cargarProveedores();
      } else {
        // Bloqueo por integridad contable ON DELETE RESTRICT
        const err = res.errores?.[0];
        if (err?.codigo === 'ERR_PROVEEDOR_TIENE_COMPRAS') {
          mostrarToast(
            `⚠️ Integridad Contable (ON DELETE RESTRICT): ${err.mensaje}`,
            'advertencia'
          );
        } else {
          mostrarToast(err?.mensaje || 'No se pudo eliminar el proveedor.', 'error');
        }
      }
    } catch {
      mostrarToast('Error al procesar la solicitud.', 'error');
    }
  };

  const handleAbrirHistorial = async (p: ProveedorResumenDTO) => {
    setProveedorParaHistorial(p);
    setDrawerAbierto(true);
    setCargandoHistorial(true);
    try {
      const res = await mockAdminService.getHistorialComprasProveedor(p.id);
      if (res.exito && res.datos) {
        setHistorialCompras(res.datos);
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

  // Escenarios del widget QA
  const handleSimularDirectorioVacio = () => {
    mockAdminService.simularDirectorioVacio(CANONICAL_LOCAL_ID);
    cargarProveedores();
    mostrarToast('Directorio vaciado: se despliega la pantalla de bienvenida asistida.', 'advertencia');
  };

  const handleProbarDuplicidad = async () => {
    const res = await mockAdminService.crearProveedor(CANONICAL_LOCAL_ID, {
      nombre: 'Distribuidora San Fernando',
      telefono: '+51 999 888 777',
    });
    if (!res.exito) {
      mostrarToast(`Validación de Duplicidad Atómica: ${res.errores?.[0]?.mensaje}`, 'advertencia');
    }
  };

  const handleProbarBloqueoEliminacion = async () => {
    const res = await mockAdminService.eliminarProveedor(PROV_SAN_FERNANDO_ID);
    if (!res.exito && res.errores?.[0]?.codigo === 'ERR_PROVEEDOR_TIENE_COMPRAS') {
      mostrarToast(`Bloqueo Referencial (ON DELETE RESTRICT): ${res.errores?.[0]?.mensaje}`, 'advertencia');
    }
  };

  const handleRestablecerSemillas = () => {
    mockAdminService.restablecerSemillasProveedores();
    cargarProveedores();
    mostrarToast('Semillas de proveedores canónicos restablecidas.', 'exito');
  };

  const directorioCompletamenteVacio =
    !cargando && conteos.todos === 0 && !busqueda;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notificación */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm animate-in slide-in-from-top-3 max-w-md ${
            toast.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toast.tipo === 'advertencia'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {toast.tipo === 'exito' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.tipo === 'advertencia' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
          {toast.tipo === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="flex-1 font-medium leading-tight">{toast.mensaje}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-black/40 hover:text-black p-0.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera del Caso de Uso */}
      <ProveedoresHeader
        localNombre={CANONICAL_LOCAL_NOMBRE}
        onAbrirNuevoProveedor={handleAbrirNuevoProveedor}
      />

      {directorioCompletamenteVacio ? (
        <OnboardingProveedoresVacio onAbrirNuevoProveedor={handleAbrirNuevoProveedor} />
      ) : (
        <>
          {/* Tarjetas KPI de Abastecimiento */}
          <ProveedoresKpis kpis={kpis} />

          {/* Barra de Filtros, Búsqueda y Estados */}
          <ProveedoresToolbar
            busqueda={busqueda}
            onBuscar={handleBuscar}
            estadoFiltro={estadoFiltro}
            onChangeEstadoFiltro={handleCambiarEstadoFiltro}
            conteos={conteos}
          />

          {/* Tabla Directorio Comercial */}
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
            onToggleEstado={handleToggleEstado}
            onEliminar={handleEliminarProveedor}
          />
        </>
      )}

      {/* Modal de Alta / Edición Ágil sin RUC */}
      <ModalCrearEditarProveedor
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        proveedorParaEditar={proveedorParaEditar}
        catalogoInsumos={catalogoInsumos}
        onGuardar={handleGuardarProveedor}
      />

      {/* Quick-Drawer Lateral de Historial de Compras */}
      <DrawerHistorialCompras
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        proveedor={proveedorParaHistorial}
        historial={historialCompras}
        cargando={cargandoHistorial}
        onNuevaCompra={handleNuevaCompraDesdeDrawer}
      />

      {/* Laboratorio QA Flotante */}
      <DemoAdminProveedoresWidget
        onSimularDirectorioVacio={handleSimularDirectorioVacio}
        onProbarDuplicidad={handleProbarDuplicidad}
        onProbarBloqueoEliminacion={handleProbarBloqueoEliminacion}
        onRestablecerSemillas={handleRestablecerSemillas}
      />
    </div>
  );
};
