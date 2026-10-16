import React from 'react';
import { CuotaPersonalDTO } from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import { UserPlus, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface AdminsHeaderProps {
  cuota: CuotaPersonalDTO | null;
  onAbrirInvitar: () => void;
}

export const AdminsHeader: React.FC<AdminsHeaderProps> = ({
  cuota,
  onAbrirInvitar,
}) => {
  const usuariosActivos = cuota?.usuarios_activos ?? 0;
  const usuariosPermitidos = cuota?.usuarios_permitidos ?? 15;
  const cuposDisponibles = cuota?.cupos_disponibles ?? 0;
  const limiteAlcanzado = cuota?.limite_alcanzado ?? false;
  const porcentaje = Math.min(
    100,
    Math.round((usuariosActivos / Math.max(1, usuariosPermitidos)) * 100)
  );

  return (
    <header className="space-y-6">
      {/* Breadcrumb & Titular */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav
            aria-label="Migas de pan"
            className="text-[11px] font-mono uppercase tracking-wider text-aurea-navy/60 mb-1"
          >
            Configuración &gt; Personal &gt;{' '}
            <span className="text-aurea-copper font-semibold">Administradores</span>
          </nav>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-aurea-navy font-bold tracking-tight">
            Gestión de Administradores de Local
          </h1>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 mt-1 max-w-2xl">
            Supervisa las cuentas de administración de tus sedes físicas, envía invitaciones seguras con token efímero de 24 horas y reasigna locales titulares.
          </p>
        </div>

        {/* Botón de Invitación Condicionado */}
        <div>
          {limiteAlcanzado ? (
            <div className="flex flex-col items-end gap-1.5">
              <Button
                type="button"
                disabled
                className="bg-slate-300 text-slate-500 cursor-not-allowed font-bold text-xs sm:text-sm shadow-none flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Invitar Nuevo Administrador</span>
              </Button>
              <Link
                to={ROUTES.PROPIETARIO_SUSCRIPCION}
                className="text-[11px] text-aurea-copper hover:text-aurea-navy font-bold flex items-center gap-1 underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Límite de personal alcanzado ({usuariosActivos}/{usuariosPermitidos}). Mejorar a Enterprise →
              </Link>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onAbrirInvitar}
              className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 py-2.5 px-5"
            >
              <UserPlus className="w-4 h-4 text-aurea-copper" />
              <span>+ Invitar Nuevo Administrador</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Progreso de Cuota de Personal (plan.max_usuarios) */}
      <div className="bg-white rounded-2xl p-5 border-2 border-aurea-copper/25 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-aurea-navy">
            <Users className="w-4 h-4 text-aurea-copper" />
            <span>
              Personal activo: {usuariosActivos} de {usuariosPermitidos} cuentas permitidas en tu Plan {cuota?.plan_nombre || 'Pro'} ({porcentaje}% consumido)
            </span>
          </div>

          <span className="font-mono text-[11px] text-aurea-navy/60">
            {cuposDisponibles > 0
              ? `${cuposDisponibles} cupo(s) disponible(s)`
              : 'Cupos de personal agotados'}
          </span>
        </div>

        {/* Barra Visual */}
        <div
          role="progressbar"
          aria-valuenow={usuariosActivos}
          aria-valuemin={0}
          aria-valuemax={usuariosPermitidos}
          aria-label="Cuentas de colaboradores consumidas"
          className="w-full h-3 bg-aurea-ivory rounded-full overflow-hidden border border-aurea-copper/20"
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              porcentaje >= 100
                ? 'bg-rose-500'
                : porcentaje >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <p className="text-[11px] text-aurea-navy/60 italic">
          El límite incluye a todo el staff registrado (propietario, administradores, mozos, cocina y cajeros) en todas tus sedes.
        </p>
      </div>
    </header>
  );
};
