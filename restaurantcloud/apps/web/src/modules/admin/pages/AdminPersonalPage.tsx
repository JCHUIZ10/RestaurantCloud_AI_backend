import React, { useState, useEffect, useCallback } from 'react';
import {
  PersonalHeader,
  PersonalKpis,
  PersonalToolbar,
  PersonalTable,
  ModalRegistrarEditarEmpleado,
  ModalDesactivarEmpleado,
  ModalResetPassword,
  OnboardingPersonalVacio,
  DemoAdminPersonalWidget,
} from '../components/personal';
import {
  EmpleadoResumenDTO,
  EmpleadoDetalleDTO,
  MetricasPersonalDTO,
  RegistrarEmpleadoRequestDTO,
  ActualizarEmpleadoRequestDTO,
  ResetPasswordResponseDTO,
} from '@/types/admin';
import {
  mockAdminService,
  CANONICAL_LOCAL_NOMBRE,
} from '../services/mockAdminService';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const AdminPersonalPage: React.FC = () => {
  const [cargando, setCargando] = useState(true);
  const [empleados, setEmpleados] = useState<EmpleadoResumenDTO[]>([]);
  const [metricas, setMetricas] = useState<MetricasPersonalDTO | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('todos');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalFiltrados, setTotalFiltrados] = useState(0);

  // Modales
  const [modalRegistrarAbierto, setModalRegistrarAbierto] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<EmpleadoResumenDTO | null>(null);

  const [modalDesactivarAbierto, setModalDesactivarAbierto] = useState(false);
  const [empleadoADesactivar, setEmpleadoADesactivar] = useState<EmpleadoResumenDTO | null>(null);

  const [modalResetAbierto, setModalResetAbierto] = useState(false);
  const [empleadoAReset, setEmpleadoAReset] = useState<EmpleadoResumenDTO | null>(null);

  // Toast
  const [toast, setToast] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const mostrarToast = (tipo: 'exito' | 'error', mensaje: string) => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const cargarDatos = useCallback(async () => {
    try {
      const res = await mockAdminService.getPersonal({
        busqueda,
        rol: rolSeleccionado,
        estado: estadoSeleccionado,
        pagina: paginaActual,
        limite: 10,
      });

      if (res.exito && res.datos) {
        setEmpleados(res.datos.empleados);
        setMetricas(res.datos.metricas);
        setTotalPaginas(res.datos.paginacion.total_paginas);
        setTotalFiltrados(res.datos.paginacion.total);
      }
    } finally {
      setCargando(false);
    }
  }, [busqueda, rolSeleccionado, estadoSeleccionado, paginaActual]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejo de Registro
  const handleGuardarNuevo = async (
    req: RegistrarEmpleadoRequestDTO
  ): Promise<EmpleadoDetalleDTO | null> => {
    const res = await mockAdminService.registrarEmpleado(req);
    if (res.exito && res.datos) {
      mostrarToast('exito', `Colaborador ${res.datos.nombre} registrado con éxito.`);
      await cargarDatos();
      return res.datos;
    } else {
      mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al registrar colaborador.');
      return null;
    }
  };

  // Manejo de Edición
  const handleGuardarEdicion = async (
    id: string,
    req: ActualizarEmpleadoRequestDTO
  ): Promise<boolean> => {
    const res = await mockAdminService.actualizarEmpleado(id, req);
    if (res.exito && res.datos) {
      mostrarToast('exito', `Datos de ${res.datos.nombre} actualizados correctamente.`);
      await cargarDatos();
      return true;
    } else {
      mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al actualizar datos.');
      return false;
    }
  };

  // Manejo de Desactivación con Reasignación
  const handleConfirmarDesactivacion = async (
    id: string,
    mozoSustitutoId?: string,
    motivo?: string
  ): Promise<boolean> => {
    const res = await mockAdminService.desactivarEmpleado(id, {
      mozo_sustituto_id: mozoSustitutoId,
      motivo: motivo || 'Desactivación administrativa',
    });

    if (res.exito && res.datos) {
      mostrarToast('exito', res.datos.mensaje);
      await cargarDatos();
      return true;
    } else {
      mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al desactivar colaborador.');
      return false;
    }
  };

  // Manejo de Reactivación
  const handleReactivar = async (emp: EmpleadoResumenDTO) => {
    const res = await mockAdminService.reactivarEmpleado(emp.id);
    if (res.exito && res.datos) {
      mostrarToast('exito', `Colaborador ${emp.nombre} reactivado correctamente.`);
      await cargarDatos();
    } else {
      mostrarToast('error', res.errores?.[0]?.mensaje || 'No se pudo reactivar al colaborador.');
    }
  };

  // Manejo de Reset de Contraseña
  const handleConfirmarReset = async (
    id: string
  ): Promise<ResetPasswordResponseDTO | null> => {
    const res = await mockAdminService.resetPasswordEmpleado(id);
    if (res.exito && res.datos) {
      mostrarToast('exito', `Nueva clave provisional generada para ${res.datos.nombre}.`);
      await cargarDatos();
      return res.datos;
    } else {
      mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al restablecer contraseña.');
      return null;
    }
  };

  // Mozos activos disponibles para actuar de sustituto (excluyendo al que se va a desactivar)
  const mozosDisponibles = empleados.filter(
    (e) => e.rol === 'mozo' && e.estado === 'activo' && e.id !== empleadoADesactivar?.id
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Toast flotante */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.tipo === 'exito'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {toast.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.mensaje}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Encabezado Principal */}
      <PersonalHeader
        localNombre={CANONICAL_LOCAL_NOMBRE}
        metricas={metricas || undefined}
        onAbrirNuevoEmpleado={() => {
          setEmpleadoAEditar(null);
          setModalRegistrarAbierto(true);
        }}
      />

      {/* KPIs de Consumo Cuota y Personal */}
      {metricas && <PersonalKpis metricas={metricas} />}

      {/* Barra de herramientas y filtros */}
      <PersonalToolbar
        busqueda={busqueda}
        onBusquedaChange={(val) => {
          setBusqueda(val);
          setPaginaActual(1);
        }}
        rolSeleccionado={rolSeleccionado}
        onRolChange={(r) => {
          setRolSeleccionado(r);
          setPaginaActual(1);
        }}
        estadoSeleccionado={estadoSeleccionado}
        onEstadoChange={(est) => {
          setEstadoSeleccionado(est);
          setPaginaActual(1);
        }}
        metricas={metricas || undefined}
        totalFiltrados={totalFiltrados}
      />

      {/* Tabla o Estado Vacío */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-aurea-champagne/80 p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-aurea-copper border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando directorio de personal...</p>
        </div>
      ) : empleados.length === 0 && !busqueda && rolSeleccionado === 'todos' && estadoSeleccionado === 'todos' ? (
        <OnboardingPersonalVacio
          onRegistrarPrimero={() => {
            setEmpleadoAEditar(null);
            setModalRegistrarAbierto(true);
          }}
          onRestablecerSemillas={async () => {
            mockAdminService.restablecerSemillasPersonal();
            await cargarDatos();
            mostrarToast('exito', 'Se restableció el equipo demostrativo de Áurea Miraflores.');
          }}
        />
      ) : (
        <PersonalTable
          empleados={empleados}
          onEditar={(emp) => {
            setEmpleadoAEditar(emp);
            setModalRegistrarAbierto(true);
          }}
          onResetPassword={(emp) => {
            setEmpleadoAReset(emp);
            setModalResetAbierto(true);
          }}
          onSolicitarDesactivar={(emp) => {
            setEmpleadoADesactivar(emp);
            setModalDesactivarAbierto(true);
          }}
          onReactivar={handleReactivar}
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onPaginaChange={(p) => setPaginaActual(p)}
        />
      )}

      {/* Modales */}
      <ModalRegistrarEditarEmpleado
        abierto={modalRegistrarAbierto}
        onCerrar={() => setModalRegistrarAbierto(false)}
        empleadoAEditar={empleadoAEditar}
        onGuardarNuevo={handleGuardarNuevo}
        onGuardarEdicion={handleGuardarEdicion}
      />

      <ModalDesactivarEmpleado
        abierto={modalDesactivarAbierto}
        onCerrar={() => setModalDesactivarAbierto(false)}
        empleado={empleadoADesactivar}
        mozosDisponibles={mozosDisponibles}
        onConfirmarDesactivacion={handleConfirmarDesactivacion}
      />

      <ModalResetPassword
        abierto={modalResetAbierto}
        onCerrar={() => setModalResetAbierto(false)}
        empleado={empleadoAReset}
        onConfirmarReset={handleConfirmarReset}
      />

      {/* Widget QA Test Bench flotante */}
      <DemoAdminPersonalWidget
        onSimularCuotaLlena={async () => {
          mockAdminService.simularLimiteCuotaPersonal();
          await cargarDatos();
          mostrarToast('exito', 'Cuota SaaS simulada al 100% (15/15). El botón de nuevo ingreso ha sido bloqueado.');
        }}
        onSimularSedeVacia={async () => {
          mockAdminService.simularDirectorioPersonalVacio();
          await cargarDatos();
          mostrarToast('exito', 'Directorio de personal vaciado. Visualizando pantalla de bienvenida didáctica.');
        }}
        onRestablecerSemillas={async () => {
          mockAdminService.restablecerSemillasPersonal();
          setBusqueda('');
          setRolSeleccionado('todos');
          setEstadoSeleccionado('todos');
          await cargarDatos();
          mostrarToast('exito', 'Semillas restablecidas (12 colaboradores en Áurea Miraflores, 80% cuota).');
        }}
        onFiltrarMozoConMesas={() => {
          setBusqueda('Carlos Huamán');
          setRolSeleccionado('mozo');
          mostrarToast('exito', 'Mozo Carlos Huamán filtrado. Pulsa en el icono de desactivar para ver la reasignación de sus 3 mesas.');
        }}
      />
    </div>
  );
};
