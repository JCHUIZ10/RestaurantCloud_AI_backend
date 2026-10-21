import React from 'react';
import { AdministradorItemDTO } from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import type { TabEstadoAdmin } from './AdminsFiltrosBar';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  UserX,
  UserCheck,
  Send,
  XCircle,
  Copy,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Search,
} from 'lucide-react';

interface AdminsTablaProps {
  administradores: AdministradorItemDTO[];
  tabActivo?: TabEstadoAdmin;
  busqueda?: string;
  onLimpiarBusqueda?: () => void;
  onDesactivar: (admin: AdministradorItemDTO) => void;
  onReactivar: (admin: AdministradorItemDTO) => void;
  onReenviar: (admin: AdministradorItemDTO) => void;
  onCancelarInvitacion: (admin: AdministradorItemDTO) => void;
  onVerEnlace: (admin: AdministradorItemDTO) => void;
}

export const AdminsTabla: React.FC<AdminsTablaProps> = ({
  administradores,
  tabActivo = 'activos',
  busqueda = '',
  onLimpiarBusqueda,
  onDesactivar,
  onReactivar,
  onReenviar,
  onCancelarInvitacion,
  onVerEnlace,
}) => {
  // Helper para iniciales de avatar
  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  // Helper de cálculo de tiempo restante de invitación
  const getTiempoRestanteTexto = (expiraEn?: string, expirada?: boolean) => {
    if (!expiraEn) return '24 horas';
    if (expirada) return 'Expirada';

    const diffMs = new Date(expiraEn).getTime() - Date.now();
    if (diffMs <= 0) return 'Expirada';

    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    if (horas > 0) return `Expira en ${horas} h`;
    const minutos = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `Expira en ${minutos} min`;
  };

  if (administradores.length === 0) {
    if (busqueda.trim()) {
      return (
        <div className="bg-white rounded-3xl border-2 border-aurea-copper/25 p-12 text-center shadow-sm">
          <Search className="w-12 h-12 text-aurea-copper/60 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-aurea-navy mb-1">
            Sin resultados de búsqueda
          </h3>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto mb-6">
            No se encontraron administradores que coincidan con <span className="font-semibold text-aurea-navy">"{busqueda}"</span>.
          </p>
          {onLimpiarBusqueda && (
            <Button
              type="button"
              onClick={onLimpiarBusqueda}
              className="bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs py-2 px-4 font-semibold shadow-sm"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      );
    }

    if (tabActivo === 'activos') {
      return (
        <div className="bg-white rounded-3xl border-2 border-aurea-copper/25 p-12 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-aurea-copper/60 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-aurea-navy mb-1">
            Sin Administradores Activos
          </h3>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto">
            Todas tus sedes activas se encuentran actualmente bajo supervisión directa del Propietario (Autogestionadas).
          </p>
        </div>
      );
    }

    if (tabActivo === 'pendientes') {
      return (
        <div className="bg-white rounded-3xl border-2 border-aurea-copper/25 p-12 text-center shadow-sm">
          <Clock className="w-12 h-12 text-amber-500/70 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-aurea-navy mb-1">
            Sin Invitaciones Pendientes
          </h3>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto">
            No tienes invitaciones pendientes ni enlaces temporales por activar en este momento.
          </p>
        </div>
      );
    }

    if (tabActivo === 'desactivados') {
      return (
        <div className="bg-white rounded-3xl border-2 border-aurea-copper/25 p-12 text-center shadow-sm">
          <UserX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-aurea-navy mb-1">
            Sin Administradores Desactivados
          </h3>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto">
            Tu historial está al día: no cuentas con administradores con acceso revocado o inactivo.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl border-2 border-aurea-copper/25 p-12 text-center shadow-sm">
        <Building2 className="w-12 h-12 text-aurea-copper/60 mx-auto mb-3" />
        <h3 className="font-serif text-xl font-bold text-aurea-navy mb-1">
          Sin Administradores de Local
        </h3>
        <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto mb-6">
          Todas tus sedes activas se encuentran actualmente bajo supervisión directa del Propietario (Autogestionadas).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vista Desktop (>= 1024px): Tabla Estructurada */}
      <div className="hidden lg:block bg-white rounded-3xl border-2 border-aurea-copper/25 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-aurea-ivory/60 border-b border-aurea-copper/20 text-[11px] font-mono uppercase tracking-wider text-aurea-navy/70">
                <th className="py-4 px-6 font-bold">Administrador / Correo</th>
                <th className="py-4 px-6 font-bold">Sede Titular Asignada</th>
                <th className="py-4 px-5 font-bold">Estado de Cuenta</th>
                <th className="py-4 px-5 font-bold">Último Acceso</th>
                <th className="py-4 px-6 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurea-copper/15 text-xs font-sans text-aurea-navy">
              {administradores.map((admin) => {
                const esActivo = admin.estado === 'activo';
                const esPendiente = admin.estado === 'pendiente_activacion';
                const esInactivo = admin.estado === 'inactivo';
                const estaExpirada = esPendiente && admin.invitacion_expirada;

                return (
                  <tr
                    key={admin.id}
                    className={`transition-colors hover:bg-aurea-ivory/40 ${
                      esInactivo ? 'bg-slate-50/70 opacity-75' : ''
                    }`}
                  >
                    {/* 1. Administrador / Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                            esActivo
                              ? 'bg-aurea-navy text-aurea-champagne'
                              : esPendiente
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {getInitials(admin.nombre)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-serif text-sm font-bold text-aurea-navy">
                            {admin.nombre}
                          </p>
                          <div className="flex items-center gap-1.5 text-aurea-navy/70">
                            <Mail className="w-3.5 h-3.5 text-aurea-copper" />
                            <span className="font-mono text-[11px]">{admin.correo}</span>
                          </div>
                          {admin.telefono && (
                            <div className="flex items-center gap-1.5 text-aurea-navy/60">
                              <Phone className="w-3 h-3 text-aurea-copper" />
                              <span className="text-[11px]">{admin.telefono}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Sede Titular */}
                    <td className="py-4 px-6">
                      {admin.sede_asignada ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aurea-ivory border border-aurea-copper/25 text-xs font-semibold text-aurea-navy">
                            <Building2 className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                            <span>{admin.sede_asignada.nombre}</span>
                          </div>
                          {admin.sede_asignada.distrito && (
                            <p className="text-[11px] text-aurea-navy/60 flex items-center gap-1 pl-1">
                              <MapPin className="w-3 h-3 text-aurea-copper" />
                              <span>{admin.sede_asignada.distrito}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold"
                          title="Colaborador sin sede física asignada (Configurable desde el módulo de Locales)"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Sin Asignar</span>
                        </span>
                      )}
                    </td>

                    {/* 3. Estado de Cuenta */}
                    <td className="py-4 px-5">
                      {esActivo && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Activo</span>
                        </div>
                      )}

                      {esPendiente && !estaExpirada && (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Invitación pendiente</span>
                          </div>
                          <p className="text-[10px] text-amber-700 font-mono">
                            {getTiempoRestanteTexto(admin.invitacion_expira_en, admin.invitacion_expirada)}
                          </p>
                        </div>
                      )}

                      {esPendiente && estaExpirada && (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Invitación expirada</span>
                          </div>
                          <p className="text-[10px] text-rose-600">
                            Superó las 24 horas
                          </p>
                        </div>
                      )}

                      {esInactivo && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-semibold">
                          <span>Inactivo</span>
                        </div>
                      )}
                    </td>

                    {/* 4. Último Acceso */}
                    <td className="py-4 px-5">
                      {esActivo ? (
                        <div className="space-y-0.5">
                          <span className="font-sans font-medium text-xs text-aurea-navy">
                            {admin.ultimo_login || 'Hoy reciente'}
                          </span>
                        </div>
                      ) : esPendiente ? (
                        <span className="text-slate-400 text-[11px] italic">
                          Esperando activación
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          Sesión revocada
                        </span>
                      )}
                    </td>

                    {/* 5. Acciones */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {esActivo && (
                          <Button
                            type="button"
                            onClick={() => onDesactivar(admin)}
                            className="bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-500" />
                            <span>Desactivar</span>
                          </Button>
                        )}

                        {esPendiente && (
                          <>
                            <Button
                              type="button"
                              onClick={() => onVerEnlace(admin)}
                              className="bg-aurea-ivory text-aurea-navy hover:bg-aurea-champagne/40 border border-aurea-copper/40 font-bold text-xs py-1.5 px-2.5 flex items-center gap-1 shadow-sm"
                              title="Copiar o ver enlace seguro de activación"
                            >
                              <Copy className="w-3.5 h-3.5 text-aurea-copper" />
                              <span>Enlace</span>
                            </Button>

                            <Button
                              type="button"
                              onClick={() => onReenviar(admin)}
                              className="bg-white text-amber-800 hover:bg-amber-50 border border-amber-300 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reenviar</span>
                            </Button>

                            <Button
                              type="button"
                              onClick={() => onCancelarInvitacion(admin)}
                              className="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium text-xs py-1.5 px-2.5 flex items-center gap-1"
                              title="Cancelar invitación y liberar cupo"
                            >
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Cancelar</span>
                            </Button>
                          </>
                        )}

                        {esInactivo && (
                          <Button
                            type="button"
                            onClick={() => onReactivar(admin)}
                            className="bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reactivar</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Mobile (< 1024px): Tarjetas Touch Ergonómicas */}
      <div className="block lg:hidden space-y-4">
        {administradores.map((admin) => {
          const esActivo = admin.estado === 'activo';
          const esPendiente = admin.estado === 'pendiente_activacion';
          const esInactivo = admin.estado === 'inactivo';
          const estaExpirada = esPendiente && admin.invitacion_expirada;

          return (
            <div
              key={admin.id}
              className={`bg-white rounded-2xl border-2 border-aurea-copper/25 p-4 shadow-sm space-y-3.5 ${
                esInactivo ? 'bg-slate-50 opacity-80' : ''
              }`}
            >
              {/* Cabecera de Tarjeta: Avatar + Nombre + Estado */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                      esActivo
                        ? 'bg-aurea-navy text-aurea-champagne'
                        : esPendiente
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {getInitials(admin.nombre)}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-aurea-navy">
                      {admin.nombre}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-aurea-navy/70">
                      <Mail className="w-3 h-3 text-aurea-copper" />
                      <span className="font-mono">{admin.correo}</span>
                    </div>
                  </div>
                </div>

                {/* Badge de Estado */}
                <div>
                  {esActivo && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Activo
                    </span>
                  )}
                  {esPendiente && !estaExpirada && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold">
                      Pendiente
                    </span>
                  )}
                  {esPendiente && estaExpirada && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold">
                      Expirada
                    </span>
                  )}
                  {esInactivo && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[10px]">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              {/* Sede y Datos */}
              <div className="bg-aurea-ivory/50 rounded-xl p-3 border border-aurea-copper/15 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-aurea-navy/60 font-semibold">Sede Titular:</span>
                  {admin.sede_asignada ? (
                    <div className="inline-flex items-center gap-1.5 font-bold text-aurea-navy">
                      <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
                      <span>{admin.sede_asignada.nombre}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Sin Asignar</span>
                    </span>
                  )}
                </div>

                {admin.telefono && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-aurea-navy/60">Teléfono:</span>
                    <span className="font-mono text-aurea-navy">{admin.telefono}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-aurea-navy/60">Acceso:</span>
                  <span className="text-aurea-navy font-medium">
                    {esActivo
                      ? admin.ultimo_login || 'Reciente'
                      : esPendiente
                      ? getTiempoRestanteTexto(admin.invitacion_expira_en, admin.invitacion_expirada)
                      : 'Revocado'}
                  </span>
                </div>
              </div>

              {/* Botones de Acción Móviles (Touch Targets >= 44px) */}
              <div className="pt-1 flex flex-wrap gap-2">
                {esActivo && (
                  <Button
                    type="button"
                    onClick={() => onDesactivar(admin)}
                    className="w-full min-h-[44px] px-4 bg-white text-rose-700 border border-rose-200 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <UserX className="w-4 h-4 text-rose-500" />
                    <span>Desactivar Administrador</span>
                  </Button>
                )}

                {esPendiente && (
                  <>
                    <Button
                      type="button"
                      onClick={() => onVerEnlace(admin)}
                      className="min-h-[44px] px-3 bg-aurea-ivory text-aurea-navy border border-aurea-copper/40 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Copy className="w-4 h-4 text-aurea-copper" />
                      <span>Enlace</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => onReenviar(admin)}
                      className="flex-1 min-h-[44px] bg-white text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-4 h-4 text-amber-600" />
                      <span>Reenviar</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => onCancelarInvitacion(admin)}
                      className="min-h-[44px] px-3 bg-white text-slate-600 border border-slate-200 font-medium text-xs flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 text-slate-400" />
                    </Button>
                  </>
                )}

                {esInactivo && (
                  <Button
                    type="button"
                    onClick={() => onReactivar(admin)}
                    className="w-full min-h-[44px] bg-white text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Reactivar Administrador</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
