import { create } from 'zustand';
import type { AuthState, UsuarioSesionDTO } from '@/types/auth';

interface AuthStore extends AuthState {
  setUsuario: (usuario: UsuarioSesionDTO | null, token?: string) => void;
  logout: () => void;
}

const getStoredUser = (): UsuarioSesionDTO | null => {
  try {
    const raw = localStorage.getItem('auth_usuario');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set) => ({
  usuario: getStoredUser(),
  token: localStorage.getItem('auth_token'),
  autenticado: !!localStorage.getItem('auth_token') && !!getStoredUser(),
  cargando: false,

  setUsuario: (usuario, token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    if (usuario) {
      localStorage.setItem('auth_usuario', JSON.stringify(usuario));
    } else {
      localStorage.removeItem('auth_usuario');
    }
    set({ usuario, token: token ?? null, autenticado: !!usuario });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
    set({ usuario: null, token: null, autenticado: false });
  },
}));
