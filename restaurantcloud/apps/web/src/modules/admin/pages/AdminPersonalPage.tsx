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
import { mockAdminService } from '../services/mockAdminService';
import { adminService, IS_REAL_API } from '@/services/serviceAdapter';
import { SoloDemo, useToast } from '@/components/ui';

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
  const [limite, setLimite] = useState(10);

  // Modales
  const [modalRegistrarAbierto, setModalRegistrarAbierto] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<EmpleadoResumenDTO | null>(null);

  const [modalDesactivarAbierto, setModalDesactivarAbierto] = useState(false);
  const [empleadoADesactivar, setEmpleadoADesactivar] = useState<EmpleadoResumenDTO | null>(null);

  const [modalResetAbierto, setModalResetAbierto] = useState(false);
  const [empleadoAReset, setEmpleadoAReset] = useState<EmpleadoResumenDTO | null>(null);

  const { mostrar } = useToast();
  const mostrarToast = useCallback(
    (tipo: 'exito' | 'error', mensaje: string) => mostrar(mensaje, tipo === 'exito' ? 'ok' : 'error'),
    [mostrar]
  );

  const cargarDatos = useCallback(async () => {
    try {
      const res = await adminService.getPersonal({
        busqueda,
        rol: rolSeleccionado,
        estado: estadoSeleccionado,
        pagina: paginaActual,
        limite,
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
  }, [busqueda, rolSeleccionado, estadoSeleccionado, paginaActual, limite]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejo de Registro
  const handleGuardarNuevo = async (
    req: RegistrarEmpleadoRequestDTO
  ): Promise<EmpleadoDetalleDTO | null> => {
    const res = await adminService.registrarEmpleado(req);
    if (res.exito && res.datos) {
      mostrarToast('exito', `${res.datos.nombre} ya forma parte del equipo.`);
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
    const res = await adminService.actualizarEmpleado(id, req);
    if (res.exito && res.datos) {
      mostrarToast('exito', `Datos de ${res.datos.nombre} actualizados.`);
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
    const res = await adminService.reactivarEmpleado(emp.id);
    if (res.exito && res.datos) {
      mostrarToast('exito', `${emp.nombre} vuelve a tener acceso.`);
      await cargarDatos();
    } else {
      mostrarToast('error', res.errores?.[0]?.mensaje || 'No se pudo reactivar al colaborador.');
    }
  };

  // Manejo de Reset de Contraseña
  const handleConfirmarReset = async (
    id: string
  ): Promise<ResetPasswordResponseDTO | null> => {
    const res = await adminService.resetPasswordEmpleado(id);
    if (res.exito && res.datos) {
      mostrarToast('exito', `Nueva clave provisional para ${res.datos.nombre}.`);
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

  const sinPersonal =
    !cargando && empleados.length === 0 && !busqueda && rolSeleccionado === 'todos' && estadoSeleccionado === 'todos';

  const abrirNuevo = () => {
    setEmpleadoAEditar(null);
    setModalRegistrarAbierto(true);
  };

  return (
    <div className="space-y-6">
      <PersonalHeader metricas={metricas || undefined} onAbrirNuevoEmpleado={abrirNuevo} />

      {sinPersonal ? (
        <OnboardingPersonalVacio
          onRegistrarPrimero={abrirNuevo}
          onRestablecerSemillas={
            IS_REAL_API
              ? undefined
              : async () => {
                  mockAdminService.restablecerSemillasPersonal();
                  await cargarDatos();
                  mostrarToast('exito', 'Se cargó el equipo de ejemplo.');
                }
          }
        />
      ) : (
        <>
          {metricas && <PersonalKpis metricas={metricas} />}

          <PersonalTable
            empleados={empleados}
            cargando={cargando}
            onEditar={(emp) => {
              setEmpleadoAEditar(emp);
              setModalRegistrarAbierto(true);
            }}
            onResetPassword={(emp) => {
              setEmpleadoAReset(emp);
              setModalResetAbierto(true);
            }}
            onSolicitarDesactivar={(emp) => {
              if (IS_REAL_API) {
                mostrarToast('error', 'La desactivación de personal todavía no está disponible.');
                return;
              }
              setEmpleadoADesactivar(emp);
              setModalDesactivarAbierto(true);
            }}
            onReactivar={handleReactivar}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalFiltrados}
            limite={limite}
            onPaginaChange={(p) => setPaginaActual(p)}
            onLimiteChange={(l) => {
              setLimite(l);
              setPaginaActual(1);
            }}
            cabecera={
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
              />
            }
          />
        </>
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

      {/* Laboratorio de pruebas (solo demo) */}
      <SoloDemo>
        {!IS_REAL_API && <DemoAdminPersonalWidget
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
        />}
      </SoloDemo>
    </div>
  );
};
