export type RolUsuario =
  | 'admin_saas'
  | 'propietario'
  | 'admin_local'
  | 'mozo'
  | 'cocina'
  | 'cajero';

export interface LoginRequestDTO {
  correo: string;
  password: string;
}

export interface SeleccionarCuentaRequestDTO {
  usuario_id: string;
}

export interface CuentaItemDTO {
  usuario_id: string;
  empresa_id: string;
  empresa_nombre: string;
  local_id: string | null;
  local_nombre: string;
  rol: RolUsuario;
  estado_empresa: 'activa' | 'periodo_gracia' | 'suspendida' | 'pendiente_baja';
  acceso_habilitado: boolean;
  motivo_bloqueo?: string;
}

export interface UsuarioSesionDTO {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  empresa: {
    id: string;
    nombre: string;
  };
  local?: {
    id: string;
    nombre: string;
  };
}

export interface LoginResponseDTO {
  requiere_seleccion: boolean;
  token?: string;
  refresh_token?: string;
  temp_token?: string;
  expira_en_segundos?: number;
  usuario?: UsuarioSesionDTO;
  cuentas?: CuentaItemDTO[];
}

export interface BetaCredentialPreset {
  rol: RolUsuario | 'multi_cuenta';
  rolLabel: string;
  nombrePersona: string;
  correo: string;
  password: string;
  descripcion: string;
  destinoDashboard: string;
  badgeColor: string;
}

export interface AuthState {
  usuario: UsuarioSesionDTO | null;
  token: string | null;
  autenticado: boolean;
  cargando: boolean;
}
