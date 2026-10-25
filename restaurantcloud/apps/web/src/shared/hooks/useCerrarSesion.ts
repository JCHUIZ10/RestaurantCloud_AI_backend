import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { IS_REAL_API } from '@/services/serviceAdapter';
import { realAuthService } from '@/services/api/realApiServices';
import { ROUTES } from '@/router/routes.constants';

/**
 * Cierre de sesión único para toda la app (regla NV3): invalida la sesión en el
 * backend cuando hay API real, limpia el store y vuelve al login sin dejar
 * la pantalla privada en el historial.
 */
export function useCerrarSesion() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(async () => {
    if (IS_REAL_API) {
      try {
        await realAuthService.logout();
      } catch {
        // La sesión local se limpia aunque el backend no responda
      }
    }
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);
}
