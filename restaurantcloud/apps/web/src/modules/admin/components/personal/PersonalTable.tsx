import React from 'react';
import {
  Edit2,
  KeyRound,
  UserX,
  UserCheck,
  MessageCircle,
  UtensilsCrossed,
  ChefHat,
  Banknote,
  Clock,
  Layers,
} from 'lucide-react';
import { EmpleadoResumenDTO, RolEmpleadoOperativo } from '@/types/admin';

interface PersonalTableProps {
  empleados: EmpleadoResumenDTO[];
  onEditar: (emp: EmpleadoResumenDTO) => void;
  onResetPassword: (emp: EmpleadoResumenDTO) => void;
  onSolicitarDesactivar: (emp: EmpleadoResumenDTO) => void;
  onReactivar: (emp: EmpleadoResumenDTO) => void;
  paginaActual: number;
  totalPaginas: number;
  onPaginaChange: (pagina: number) => void;
}

export const PersonalTable: React.FC<PersonalTableProps> = ({
  empleados,
  onEditar,
  onResetPassword,
  onSolicitarDesactivar,
  onReactivar,
  paginaActual,
  totalPaginas,
  onPaginaChange,
}) => {
  const getRolBadge = (rol: RolEmpleadoOperativo) => {
    switch (rol) {
      case 'mozo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
            Mozo de Salón
          </span>
        );
      case 'cocina':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            Cocina (KDS)
          </span>
        );
      case 'cajero':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            Cajero
          </span>
        );
      default:
        return null;
    }
  };

  const getIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatearUltimoAcceso = (fecha?: string | null) => {
    if (!fecha) return 'Sin ingresos aún';
    try {
      const d = new Date(fecha);
      const hoy = new Date();
      const esMismoDia = d.toDateString() === hoy.toDateString();
      if (esMismoDia) {
        return `Hoy ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-aurea-champagne/80 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-aurea-navy/60 uppercase tracking-wider">
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-4">Rol Operativo</th>
              <th className="py-3 px-4">Contacto Directo</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Operación Actual</th>
              <th className="py-3 px-4">Último Acceso</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {empleados.map((emp) => {
              const tieneMesas = (emp.mesas_activas_count || 0) > 0;
              const tieneCaja = emp.tiene_caja_abierta;

              return (
                <tr
                  key={emp.id}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    emp.estado === 'inactivo' ? 'opacity-65 bg-slate-50/20' : ''
                  }`}
                >
                  {/* Colaborador */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-aurea-champagne/40 text-aurea-navy font-bold text-xs flex items-center justify-center border border-aurea-copper/20 shrink-0">
                        {getIniciales(emp.nombre)}
                      </div>
                      <div>
                        <div className="font-semibold text-aurea-navy flex items-center gap-1.5">
                          <span>{emp.nombre}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {emp.correo}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="py-3.5 px-4">
                    {getRolBadge(emp.rol)}
                  </td>

                  {/* Contacto WhatsApp */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-700 font-medium">
                        {emp.telefono}
                      </span>
                      <a
                        href={`https://wa.me/${emp.telefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                          emp.nombre
                        )}%2C%20te%20escribimos%20desde%20la%20administraci%C3%B3n%20de%20%C3%81urea%20Miraflores.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="Abrir chat directo en WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4">
                    {emp.estado === 'activo' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Inactivo
                      </span>
                    )}
                  </td>

                  {/* Operación Actual (Mesas / Caja) */}
                  <td className="py-3.5 px-4">
                    {tieneMesas && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        {emp.mesas_activas_count} comanda(s) activas
                      </span>
                    )}
                    {tieneCaja && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Turno de caja abierto
                      </span>
                    )}
                    {!tieneMesas && !tieneCaja && (
                      <span className="text-xs text-slate-400">
                        Sin turno activo
                      </span>
                    )}
                  </td>

                  {/* Último Acceso */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatearUltimoAcceso(emp.ultimo_login)}</span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Editar */}
                      <button
                        onClick={() => onEditar(emp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-aurea-navy hover:bg-slate-100 transition-colors"
                        title="Modificar datos o rol del colaborador"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Reset Clave */}
                      <button
                        onClick={() => onResetPassword(emp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Generar nueva clave provisional y enviar por WhatsApp"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Desactivar / Activar */}
                      {emp.estado === 'activo' ? (
                        <button
                          onClick={() => onSolicitarDesactivar(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Desactivar acceso (con reasignación asistida)"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onReactivar(emp)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Reactivar acceso a la plataforma"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs">
          <span className="text-slate-500 font-medium">
            Página {paginaActual} de {totalPaginas}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPaginaChange(paginaActual - 1)}
              disabled={paginaActual <= 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Anterior
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPaginaChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  paginaActual === p
                    ? 'bg-aurea-copper text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPaginaChange(paginaActual + 1)}
              disabled={paginaActual >= totalPaginas}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
