import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AdministradorItemDTO,
  CuotaPersonalDTO,
  FormularioDatosInvitacionDTO,
  InvitarAdminRequestDTO,
} from '@/types/propietarioAdmins';
import { propietarioAdminsService } from '@/services/serviceAdapter';
import { AdminsHeader } from '../components/administradores/AdminsHeader';
import { AdminsTabla } from '../components/administradores/AdminsTabla';
import {
  AdminsFiltrosBar,
  TabEstadoAdmin,
} from '../components/administradores/AdminsFiltrosBar';
import { ModalInvitarAdmin } from '../components/administradores/ModalInvitarAdmin';
import { ModalDesactivarAdmin } from '../components/administradores/ModalDesactivarAdmin';
import { ModalCopiarInvitacion } from '../components/administradores/ModalCopiarInvitacion';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

export const PropietarioAdministradoresPage: React.FC = () => {
  const [administradores, setAdministradores] = useState<AdministradorItemDTO[]>([]);
  const [cuota, setCuota] = useState<CuotaPersonalDTO | null>(null);
  const [formularioDatos, setFormularioDatos] = useState<FormularioDatosInvitacionDTO | null>(null);
  const [cargando, setCargando] = useState(true);

  // Filtros y Segmentación por Tabs
  const [tabActivo, setTabActivo] = useState<TabEstadoAdmin>('activos');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalInvitarAbierto, setModalInvitarAbierto] = useState(false);
  const [adminADesactivar, setAdminADesactivar] = useState<AdministradorItemDTO | null>(null);
  const [adminAVerEnlace, setAdminAVerEnlace] = useState<AdministradorItemDTO | null>(null);

  // Notificaciones Toast
  const [toast, setToast] = useState<{
    tipo: 'success' | 'error';
    mensaje: string;
  } | null>(null);

  const mostrarToast = useCallback((tipo: 'success' | 'error', mensaje: string) => {
    setToast({ tipo, mensaje });
  }, []);

  // Ocultar toast tras 4 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cargar datos del directorio y formulario
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resDirectorio, resFormulario] = await Promise.all([
        propietarioAdminsService.getDirectorioAdministradores(),
        propietarioAdminsService.getFormularioDatos(),
      ]);

      if (resDirectorio.exito && resDirectorio.datos) {
        setAdministradores(resDirectorio.datos.administradores);
        setCuota(resDirectorio.datos.cuota_usuarios);
      } else {
        mostrarToast('error', 'No se pudo cargar la lista de administradores.');
      }

      if (resFormulario.exito && resFormulario.datos) {
        setFormularioDatos(resFormulario.datos);
      }
    } catch {
      mostrarToast('error', 'Error de red al consultar el personal administrativo.');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handler: Invitar Administrador
  const handleEnviarInvitacion = async (dto: InvitarAdminRequestDTO): Promise<boolean> => {
    try {
      const res = await propietarioAdminsService.invitarAdministrador(dto);
      if (res.exito && res.datos) {
        mostrarToast(
          'success',
          `Invitación enviada exitosamente a ${res.datos.nombre} (${res.datos.correo}).`
        );
        await cargarDatos();
        return true;
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al enviar invitación.');
        return false;
      }
    } catch {
      mostrarToast('error', 'Ocurrió un error inesperado al procesar la invitación.');
      return false;
    }
  };

  // Handler: Desactivar Administrador
  const handleConfirmarDesactivacion = async (adminId: string): Promise<boolean> => {
    try {
      const res = await propietarioAdminsService.cambiarEstado(adminId, {
        nuevo_estado: 'inactivo',
      });

      if (res.exito && res.datos) {
        mostrarToast('success', res.datos.mensaje);
        await cargarDatos();
        return true;
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al desactivar.');
        return false;
      }
    } catch {
      mostrarToast('error', 'Error al procesar la revocación.');
      return false;
    }
  };

  // Handler: Reenviar Invitación
  const handleReenviarInvitacion = async (admin: AdministradorItemDTO) => {
    try {
      const res = await propietarioAdminsService.reenviarInvitacion(admin.id);
      if (res.exito && res.datos) {
        mostrarToast(
          'success',
          `Se generó un nuevo enlace seguro remitido a ${admin.correo} (Válido por 24h).`
        );
        await cargarDatos();
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'No se pudo reenviar la invitación.');
      }
    } catch {
      mostrarToast('error', 'Error al reenviar la invitación.');
    }
  };

  // Handler: Cancelar Invitación
  const handleCancelarInvitacion = async (admin: AdministradorItemDTO) => {
    if (
      !window.confirm(
        `¿Deseas cancelar la invitación pendiente para ${admin.nombre}? Esta acción liberará el cupo de usuario.`
      )
    ) {
      return;
    }

    try {
      const res = await propietarioAdminsService.cancelarInvitacion(admin.id);
      if (res.exito && res.datos) {
        mostrarToast('success', res.datos.mensaje);
        await cargarDatos();
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'Error al cancelar invitación.');
      }
    } catch {
      mostrarToast('error', 'Error al cancelar la invitación.');
    }
  };

  // Cálculo de Conteos en tiempo real por categoría
  const conteos = useMemo(() => ({
    activos: administradores.filter((a) => a.estado === 'activo').length,
    pendientes: administradores.filter((a) => a.estado === 'pendiente_activacion').length,
    desactivados: administradores.filter((a) => a.estado === 'inactivo').length,
    todos: administradores.length,
  }), [administradores]);

  // Filtrado reactivo en memoria: por pestaña de estado y búsqueda de texto
  const administradoresFiltrados = useMemo(() => {
    return administradores.filter((admin) => {
      // 1. Filtro por pestaña activa
      if (tabActivo === 'activos' && admin.estado !== 'activo') {
        return false;
      }
      if (tabActivo === 'pendientes' && admin.estado !== 'pendiente_activacion') {
        return false;
      }
      if (tabActivo === 'desactivados' && admin.estado !== 'inactivo') {
        return false;
      }

      // 2. Filtro por búsqueda de texto (nombre, correo o sede)
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = admin.nombre.toLowerCase().includes(query);
        const coincideCorreo = admin.correo.toLowerCase().includes(query);
        const coincideSede = admin.sede_asignada?.nombre.toLowerCase().includes(query) ?? false;
        const coincideDistrito = admin.sede_asignada?.distrito?.toLowerCase().includes(query) ?? false;

        if (!coincideNombre && !coincideCorreo && !coincideSede && !coincideDistrito) {
          return false;
        }
      }

      return true;
    });
  }, [administradores, tabActivo, busqueda]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Toast Flotante */}
      {toast && (
        <div className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-in slide-in-from-top-4 duration-200 bg-white border-aurea-copper/40 text-aurea-navy sm:max-w-md">
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
          )}
          <span className="min-w-0">{toast.mensaje}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar notificación"
            className="text-tinta-400 hover:text-tinta-700 ml-auto shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera y Barra de Cuota */}
      <AdminsHeader
        cuota={cuota}
        onAbrirInvitar={() => setModalInvitarAbierto(true)}
      />

      {/* Barra de Filtros (Segmented Pill-Tabs y Buscador Rápido) */}
      <AdminsFiltrosBar
        tabActivo={tabActivo}
        onTabChange={setTabActivo}
        conteos={conteos}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onLimpiarBusqueda={() => setBusqueda('')}
      />

      {/* Contenido Principal: Skeleton vs Tabla */}
      {cargando ? (
        <div className="bg-white rounded-3xl border-2 border-aurea-copper/20 p-12 text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-aurea-copper animate-spin mx-auto" />
          <p className="text-xs font-semibold text-aurea-navy/70">
            Consultando personal y verificando permisos en PostgreSQL...
          </p>
        </div>
      ) : (
        <AdminsTabla
          administradores={administradoresFiltrados}
          tabActivo={tabActivo}
          busqueda={busqueda}
          onLimpiarBusqueda={() => setBusqueda('')}
          onDesactivar={(admin) => setAdminADesactivar(admin)}
          onReenviar={handleReenviarInvitacion}
          onCancelarInvitacion={handleCancelarInvitacion}
          onVerEnlace={(admin) => setAdminAVerEnlace(admin)}
        />
      )}

      {/* Modales */}
      <ModalInvitarAdmin
        abierto={modalInvitarAbierto}
        cuota={cuota}
        formularioDatos={formularioDatos}
        onCerrar={() => setModalInvitarAbierto(false)}
        onEnviarInvitacion={handleEnviarInvitacion}
      />

      <ModalDesactivarAdmin
        admin={adminADesactivar}
        onCerrar={() => setAdminADesactivar(null)}
        onConfirmarDesactivacion={handleConfirmarDesactivacion}
      />

      <ModalCopiarInvitacion
        admin={adminAVerEnlace}
        onCerrar={() => setAdminAVerEnlace(null)}
      />
    </div>
  );
};
