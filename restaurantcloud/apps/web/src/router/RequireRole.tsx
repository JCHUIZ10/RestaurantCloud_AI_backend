import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { RolUsuario } from '@/types/auth';
import { ROUTES } from './routes.constants';
import { homeDeRol } from './accesoPorRol';

interface RequireRoleProps {
  roles: readonly RolUsuario[];
  children?: React.ReactNode;
}

/**
 * Guard de rutas privadas (regla NV1):
 * - Sin sesión: redirige a /login?next=<ruta solicitada>.
 * - Rol no autorizado: redirige al inicio de su propio rol.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const location = useLocation();

  if (!usuario) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?next=${next}`} replace />;
  }

  if (!roles.includes(usuario.rol)) {
    return <Navigate to={homeDeRol(usuario.rol)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
