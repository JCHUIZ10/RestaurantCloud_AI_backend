import { create } from 'zustand';
import type { AuthState, UsuarioSesion } from '@/types/auth';

interface AuthStore extends AuthState {
  setUsuario: (usuario: UsuarioSesion | null, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  token: localStorage.getItem('auth_token'),
  autenticado: !!localStorage.getItem('auth_token'),
  cargando: false,

  setUsuario: (usuario, token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    set({ usuario, token: token ?? null, autenticado: !!usuario });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ usuario: null, token: null, autenticado: false });
  },
}));
