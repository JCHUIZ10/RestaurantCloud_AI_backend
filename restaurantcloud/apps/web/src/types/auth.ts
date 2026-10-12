export type RolUsuario =
  | 'saas_admin'
  | 'propietario'
  | 'administrador'
  | 'mozo'
  | 'cocina'
  | 'cajero';

export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  empresaId: string;
  empresaNombre: string;
  localId?: string;
  localNombre?: string;
}

export interface AuthState {
  usuario: UsuarioSesion | null;
  token: string | null;
  autenticado: boolean;
  cargando: boolean;
}
