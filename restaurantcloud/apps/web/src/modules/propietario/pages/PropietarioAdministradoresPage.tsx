import React, { useState, useEffect, useCallback } from 'react';
import {
  AdministradorItemDTO,
  CuotaPersonalDTO,
  FormularioDatosInvitacionDTO,
  InvitarAdminRequestDTO,
} from '@/types/propietarioAdmins';
import { propietarioAdminsService } from '../services/propietarioAdminsService';
import { AdminsHeader } from '../components/administradores/AdminsHeader';
import { AdminsTabla } from '../components/administradores/AdminsTabla';
import { ModalInvitarAdmin } from '../components/administradores/ModalInvitarAdmin';
import { ModalReasignarSede } from '../components/administradores/ModalReasignarSede';
import { ModalDesactivarAdmin } from '../components/administradores/ModalDesactivarAdmin';
import { ModalCopiarInvitacion } from '../components/administradores/ModalCopiarInvitacion';
import { DemoAdminsWidget } from '../components/administradores/DemoAdminsWidget';
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

  // Modales
  const [modalInvitarAbierto, setModalInvitarAbierto] = useState(false);
  const [adminAReasignar, setAdminAReasignar] = useState<AdministradorItemDTO | null>(null);
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

  // Handler: Reasignar Sede
  const handleConfirmarReasignacion = async (
    adminId: string,
    nuevoLocalId: string
  ): Promise<boolean> => {
    try {
      const res = await propietarioAdminsService.reasignarSede(adminId, {
        nuevo_local_id: nuevoLocalId,
      });

      if (res.exito && res.datos) {
        mostrarToast('success', res.datos.mensaje);
        await cargarDatos();
        return true;
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'No se pudo reasignar la sede.');
        return false;
      }
    } catch {
      mostrarToast('error', 'Error de red al reasignar la sede titular.');
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

  // Handler: Reactivar Administrador
  const handleReactivarAdmin = async (admin: AdministradorItemDTO) => {
    try {
      const res = await propietarioAdminsService.cambiarEstado(admin.id, {
        nuevo_estado: 'activo',
      });

      if (res.exito && res.datos) {
        mostrarToast('success', res.datos.mensaje);
        await cargarDatos();
      } else {
        mostrarToast('error', res.errores?.[0]?.mensaje || 'No se pudo reactivar el usuario.');
      }
    } catch {
      mostrarToast('error', 'Error al reactivar administrador.');
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Toast Flotante */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-in slide-in-from-top-4 duration-200 bg-white border-aurea-copper/40 text-aurea-navy">
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="max-w-md">{toast.mensaje}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 ml-2"
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
          administradores={administradores}
          onReasignar={(admin) => setAdminAReasignar(admin)}
          onDesactivar={(admin) => setAdminADesactivar(admin)}
          onReactivar={handleReactivarAdmin}
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

      <ModalReasignarSede
        admin={adminAReasignar}
        sedesDisponibles={formularioDatos?.sedes_disponibles || []}
        onCerrar={() => setAdminAReasignar(null)}
        onConfirmarReasignacion={handleConfirmarReasignacion}
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

      {/* Widget Sandbox QA Flotante */}
      <DemoAdminsWidget onRecargar={cargarDatos} />
    </div>
  );
};
