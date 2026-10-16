/**
 * Servicio Mock para CU-PROP-05: Crear y Gestionar Administradores de Local
 * Sincronizado con PostgreSQL 16 (02_schema_ddl.sql y 07_seed_local_aurea_completo.sql)
 * Persiste datos en localStorage con claves segregadas por tenant.
 */

import type { ApiResponse } from '@/types/api';
import type {
  AdministradorItemDTO,
  DirectorioAdminsApiResponse,
  FormularioDatosApiResponse,
  InvitarAdminRequestDTO,
  InvitarAdminApiResponse,
  ReenviarInvitacionApiResponse,
  ReasignarSedeRequestDTO,
  ReasignarSedeApiResponse,
  CambiarEstadoAdminRequestDTO,
  CambiarEstadoAdminApiResponse,
  CuotaPersonalDTO,
  SedeResumenAsignacionDTO,
} from '@/types/propietarioAdmins';

const ADMINS_STORAGE_KEY = 'restaurantcloud_propietario_admins_db';
const LOCALES_STORAGE_KEY = 'restaurantcloud_locales_propietario_db';

// Semilla canónica de sedes de ÁUREA
const SEDES_CANONICAS: SedeResumenAsignacionDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000010',
    nombre: 'ÁUREA Miraflores (Principal)',
    distrito: 'Miraflores',
    provincia: 'Lima',
    departamento: 'Lima',
    tiene_administrador: true,
    administrador_actual: 'Valeria Mendoza',
    total_pisos: 2,
    total_mesas: 18,
  },
  {
    id: '00000000-0000-4000-8000-000000000020',
    nombre: 'ÁUREA San Isidro (Financiero)',
    distrito: 'San Isidro',
    provincia: 'Lima',
    departamento: 'Lima',
    tiene_administrador: false,
    administrador_actual: null,
    total_pisos: 1,
    total_mesas: 8,
  },
  {
    id: '00000000-0000-4000-8000-000000000030',
    nombre: 'ÁUREA Chimbote (Costa)',
    distrito: 'Chimbote',
    provincia: 'Santa',
    departamento: 'Áncash',
    tiene_administrador: false,
    administrador_actual: null,
    total_pisos: 1,
    total_mesas: 12,
  },
];

// Semilla canónica de administradores
const ADMINS_SEED: AdministradorItemDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000102',
    nombre: 'Valeria Mendoza',
    correo: 'admin@aurea.local',
    telefono: '+51 900 000 102',
    estado: 'activo',
    sede_asignada: {
      id: '00000000-0000-4000-8000-000000000010',
      nombre: 'ÁUREA Miraflores (Principal)',
      distrito: 'Miraflores',
    },
    ultimo_login: 'Hoy 14:20',
    created_at: '2026-09-15T12:00:00Z',
  },
  {
    id: 'usr-adm-02-carlos',
    nombre: 'Carlos Rojas Pardo',
    correo: 'carlos.rojas@aurea.local',
    telefono: '+51 987 654 321',
    estado: 'pendiente_activacion',
    sede_asignada: {
      id: '00000000-0000-4000-8000-000000000020',
      nombre: 'ÁUREA San Isidro (Financiero)',
      distrito: 'San Isidro',
    },
    ultimo_login: null,
    invitacion_token: 'inv_tok_9b2e4f71a',
    invitacion_expira_en: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    invitacion_expirada: false,
    created_at: '2026-10-15T10:00:00Z',
  },
];

class PropietarioAdminsService {
  private forzarCupoLleno = false;
  private simularConflictoCorreo = false;

  private loadAdmins(): AdministradorItemDTO[] {
    try {
      const data = localStorage.getItem(ADMINS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    this.saveAdmins(ADMINS_SEED);
    return [...ADMINS_SEED];
  }

  private saveAdmins(admins: AdministradorItemDTO[]): void {
    try {
      localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
    } catch {
      // ignore
    }
  }

  private getSedesDisponibles(): SedeResumenAsignacionDTO[] {
    try {
      const localesData = localStorage.getItem(LOCALES_STORAGE_KEY);
      if (localesData) {
        const parsed = JSON.parse(localesData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const admins = this.loadAdmins();
          return parsed.map((loc: any) => {
            const adminAsignado = admins.find(
              (a) => a.sede_asignada?.id === loc.id && a.estado !== 'inactivo'
            );
            return {
              id: loc.id,
              nombre: loc.nombre,
              distrito: loc.distrito || 'Lima',
              provincia: loc.provincia || 'Lima',
              departamento: loc.departamento || 'Lima',
              tiene_administrador: !!adminAsignado,
              administrador_actual: adminAsignado?.nombre || null,
              total_pisos: loc.metricas?.total_pisos || 1,
              total_mesas: loc.metricas?.total_mesas || 10,
            };
          });
        }
      }
    } catch {
      // fallback to canonical
    }

    const admins = this.loadAdmins();
    return SEDES_CANONICAS.map((sede) => {
      const adminAsignado = admins.find(
        (a) => a.sede_asignada?.id === sede.id && a.estado !== 'inactivo'
      );
      return {
        ...sede,
        tiene_administrador: !!adminAsignado,
        administrador_actual: adminAsignado?.nombre || null,
      };
    });
  }

  private calcularCuota(admins: AdministradorItemDTO[]): CuotaPersonalDTO {
    const usuariosPermitidos = 15; // Plan Pro canónico en 06_seed_initial_data.sql
    // Colaboradores base: Rodrigo (propietario) + mozo + cocina + cajero + personal staff base = 6
    const baseStaff = 6;
    const adminsActivos = admins.filter((a) => a.estado !== 'inactivo').length;
    let usuariosActivos = baseStaff + adminsActivos;

    if (this.forzarCupoLleno) {
      usuariosActivos = usuariosPermitidos;
    }

    const cuposDisponibles = Math.max(0, usuariosPermitidos - usuariosActivos);
    const limiteAlcanzado = cuposDisponibles === 0;

    return {
      plan_id: 2,
      plan_nombre: 'Pro',
      usuarios_permitidos: usuariosPermitidos,
      usuarios_activos: usuariosActivos,
      cupos_disponibles: cuposDisponibles,
      limite_alcanzado: limiteAlcanzado,
    };
  }

  // 1. Listar Administradores y Cuota de Usuarios
  async getDirectorioAdministradores(): Promise<DirectorioAdminsApiResponse> {
    await new Promise((r) => setTimeout(r, 120));
    const admins = this.loadAdmins();

    // Actualizar estado de expiración de invitaciones
    const now = Date.now();
    admins.forEach((admin) => {
      if (admin.estado === 'pendiente_activacion' && admin.invitacion_expira_en) {
        admin.invitacion_expirada = new Date(admin.invitacion_expira_en).getTime() < now;
      }
    });

    const cuota = this.calcularCuota(admins);

    return {
      exito: true,
      datos: {
        cuota_usuarios: cuota,
        administradores: admins,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 2. Obtener Datos Previos y Sedes para Formulario de Invitación
  async getFormularioDatos(): Promise<FormularioDatosApiResponse> {
    await new Promise((r) => setTimeout(r, 100));
    const admins = this.loadAdmins();
    const cuota = this.calcularCuota(admins);
    const todasLasSedes = this.getSedesDisponibles();

    const sedesDisponibles = todasLasSedes.filter((s) => !s.tiene_administrador);
    const sedesOcupadas = todasLasSedes.filter((s) => s.tiene_administrador);

    return {
      exito: true,
      datos: {
        puede_invitar: !cuota.limite_alcanzado,
        cupos_libres: cuota.cupos_disponibles,
        sedes_disponibles: sedesDisponibles,
        sedes_ocupadas: sedesOcupadas,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 3. Invitar Nuevo Administrador de Local
  async invitarAdministrador(dto: InvitarAdminRequestDTO): Promise<InvitarAdminApiResponse> {
    await new Promise((r) => setTimeout(r, 350));
    const admins = this.loadAdmins();
    const cuota = this.calcularCuota(admins);

    if (cuota.limite_alcanzado) {
      return {
        exito: false,
        datos: null as unknown as InvitarAdminApiResponse['datos'],
        errores: [
          {
            codigo: 'PERSONAL_LIMITE_PLAN_ALCANZADO',
            mensaje:
              'Has alcanzado el límite de 15 cuentas de personal de tu Plan Pro. Por favor escala tu suscripción a Plan Enterprise.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    if (this.simularConflictoCorreo || admins.some((a) => a.correo.toLowerCase() === dto.correo.toLowerCase())) {
      return {
        exito: false,
        datos: null as unknown as InvitarAdminApiResponse['datos'],
        errores: [
          {
            codigo: 'ADMIN_CORREO_EXISTE_MISMA_EMPRESA',
            mensaje: `El correo "${dto.correo}" ya se encuentra registrado para otro colaborador en la empresa.`,
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Regla de unicidad 1:1 de titular
    const adminExistente = admins.find(
      (a) => a.sede_asignada?.id === dto.local_id && a.estado !== 'inactivo'
    );
    if (adminExistente) {
      return {
        exito: false,
        datos: null as unknown as InvitarAdminApiResponse['datos'],
        errores: [
          {
            codigo: 'ADMIN_SEDE_YA_TIENE_TITULAR',
            mensaje: `La sede seleccionada ya cuenta con ${adminExistente.nombre} como administrador titular.`,
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const todasLasSedes = this.getSedesDisponibles();
    const sedeElegida = todasLasSedes.find((s) => s.id === dto.local_id);
    const sedeNombre = sedeElegida ? sedeElegida.nombre : 'Sede Asignada';
    const sedeDistrito = sedeElegida?.distrito || 'Lima';

    const token = 'inv_tok_' + Math.random().toString(36).substring(2, 10);
    const expiraEn = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const nuevoAdmin: AdministradorItemDTO = {
      id: 'usr-adm-' + Date.now().toString(36),
      nombre: dto.nombre.trim(),
      correo: dto.correo.trim().toLowerCase(),
      telefono: dto.telefono?.trim() || undefined,
      estado: 'pendiente_activacion',
      sede_asignada: {
        id: dto.local_id,
        nombre: sedeNombre,
        distrito: sedeDistrito,
      },
      ultimo_login: null,
      invitacion_token: token,
      invitacion_expira_en: expiraEn,
      invitacion_expirada: false,
      created_at: new Date().toISOString(),
    };

    admins.unshift(nuevoAdmin);
    this.saveAdmins(admins);

    return {
      exito: true,
      datos: {
        id: nuevoAdmin.id,
        nombre: nuevoAdmin.nombre,
        correo: nuevoAdmin.correo,
        rol: 'admin_local',
        estado: 'pendiente_activacion',
        local_id: dto.local_id,
        sede_nombre: sedeNombre,
        invitacion_token: token,
        invitacion_expira_en: expiraEn,
        mensaje:
          'Invitación enviada exitosamente por correo electrónico. El enlace es válido por 24 horas.',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 4. Reenviar Enlace de Invitación
  async reenviarInvitacion(id: string): Promise<ReenviarInvitacionApiResponse> {
    await new Promise((r) => setTimeout(r, 250));
    const admins = this.loadAdmins();
    const index = admins.findIndex((a) => a.id === id);

    if (index === -1) {
      return {
        exito: false,
        datos: null as unknown as ReenviarInvitacionApiResponse['datos'],
        errores: [
          {
            codigo: 'ADMIN_NO_ENCONTRADO',
            mensaje: 'No se encontró el administrador especificado.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const admin = admins[index];
    const nuevoToken = 'inv_tok_' + Math.random().toString(36).substring(2, 10);
    const nuevaExp = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    admin.invitacion_token = nuevoToken;
    admin.invitacion_expira_en = nuevaExp;
    admin.invitacion_expirada = false;
    admin.estado = 'pendiente_activacion';

    admins[index] = admin;
    this.saveAdmins(admins);

    return {
      exito: true,
      datos: {
        usuario_id: admin.id,
        correo: admin.correo,
        nueva_expiracion: nuevaExp,
        invitacion_token: nuevoToken,
        mensaje: 'Se ha generado y reenviado un nuevo enlace seguro de activación válido por 24 horas.',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 5. Cancelar / Revocar Invitación Pendiente
  async cancelarInvitacion(id: string): Promise<ApiResponse<{ mensaje: string }>> {
    await new Promise((r) => setTimeout(r, 200));
    const admins = this.loadAdmins();
    const filtrados = admins.filter((a) => a.id !== id);

    if (filtrados.length === admins.length) {
      return {
        exito: false,
        datos: null as unknown as { mensaje: string },
        errores: [
          {
            codigo: 'ADMIN_NO_ENCONTRADO',
            mensaje: 'No se encontró la invitación a cancelar.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    this.saveAdmins(filtrados);

    return {
      exito: true,
      datos: {
        mensaje: 'Invitación cancelada. El cupo de usuario ha sido liberado de inmediato.',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // 6. Reasignar Sede Titular (1:1)
  async reasignarSede(id: string, dto: ReasignarSedeRequestDTO): Promise<ReasignarSedeApiResponse> {
    await new Promise((r) => setTimeout(r, 300));
    const admins = this.loadAdmins();
    const index = admins.findIndex((a) => a.id === id);

    if (index === -1) {
      return {
        exito: false,
        datos: null as unknown as ReasignarSedeApiResponse['datos'],
        errores: [
          {
            codigo: 'ADMIN_NO_ENCONTRADO',
            mensaje: 'El administrador no existe en la empresa.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validar que la nueva sede no esté ocupada por otro administrador
    const ocupante = admins.find(
      (a) => a.id !== id && a.sede_asignada?.id === dto.nuevo_local_id && a.estado !== 'inactivo'
    );
    if (ocupante) {
      return {
        exito: false,
        datos: null as unknown as ReasignarSedeApiResponse['datos'],
        errores: [
          {
            codigo: 'ADMIN_SEDE_YA_TIENE_TITULAR',
            mensaje: `La sede destino ya cuenta con ${ocupante.nombre} como titular.`,
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const admin = admins[index];
    const sedeAnterior = admin.sede_asignada?.nombre || 'Sin Sede';
    const todasLasSedes = this.getSedesDisponibles();
    const nuevaSedeInfo = todasLasSedes.find((s) => s.id === dto.nuevo_local_id);
    const nuevaSedeNombre = nuevaSedeInfo ? nuevaSedeInfo.nombre : 'Sede Reasignada';

    admin.sede_asignada = {
      id: dto.nuevo_local_id,
      nombre: nuevaSedeNombre,
      distrito: nuevaSedeInfo?.distrito || 'Lima',
    };

    admins[index] = admin;
    this.saveAdmins(admins);

    return {
      exito: true,
      datos: {
        usuario_id: admin.id,
        nombre: admin.nombre,
        sede_anterior: sedeAnterior,
        nueva_sede: nuevaSedeNombre,
        mensaje: `Sede reasignada exitosamente. ${admin.nombre} asumirá el control de "${nuevaSedeNombre}" en su próxima sesión.`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 7. Cambiar Estado (Desactivar o Reactivar)
  async cambiarEstado(id: string, dto: CambiarEstadoAdminRequestDTO): Promise<CambiarEstadoAdminApiResponse> {
    await new Promise((r) => setTimeout(r, 250));
    const admins = this.loadAdmins();
    const index = admins.findIndex((a) => a.id === id);

    if (index === -1) {
      return {
        exito: false,
        datos: null as unknown as CambiarEstadoAdminApiResponse['datos'],
        errores: [
          {
            codigo: 'ADMIN_NO_ENCONTRADO',
            mensaje: 'Administrador no encontrado.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const admin = admins[index];

    // Si se reactiva, validar que haya cupo disponible
    if (dto.nuevo_estado === 'activo') {
      const cuota = this.calcularCuota(admins);
      if (cuota.limite_alcanzado) {
        return {
          exito: false,
          datos: null as unknown as CambiarEstadoAdminApiResponse['datos'],
          errores: [
            {
              codigo: 'PERSONAL_LIMITE_PLAN_ALCANZADO',
              mensaje: 'No tienes cupos disponibles en tu plan para reactivar este usuario.',
            },
          ],
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    admin.estado = dto.nuevo_estado;
    admins[index] = admin;
    this.saveAdmins(admins);

    const mensaje =
      dto.nuevo_estado === 'inactivo'
        ? `Administrador ${admin.nombre} desactivado. Se revocaron sus sesiones en tiempo real (Redis JWT Blacklist).`
        : `Administrador ${admin.nombre} reactivado exitosamente.`;

    return {
      exito: true,
      datos: {
        usuario_id: admin.id,
        nombre: admin.nombre,
        estado: dto.nuevo_estado,
        sesiones_revocadas: dto.nuevo_estado === 'inactivo',
        mensaje,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Métodos Sandbox QA
  toggleForzarCupoLleno(): boolean {
    this.forzarCupoLleno = !this.forzarCupoLleno;
    return this.forzarCupoLleno;
  }

  toggleConflictoCorreo(): boolean {
    this.simularConflictoCorreo = !this.simularConflictoCorreo;
    return this.simularConflictoCorreo;
  }

  simularInvitacionExpirada(id: string): boolean {
    const admins = this.loadAdmins();
    const admin = admins.find((a) => a.id === id);
    if (admin && admin.estado === 'pendiente_activacion') {
      admin.invitacion_expira_en = new Date(Date.now() - 3600 * 1000).toISOString();
      admin.invitacion_expirada = true;
      this.saveAdmins(admins);
      return true;
    }
    return false;
  }

  resetDatabase(): void {
    this.forzarCupoLleno = false;
    this.simularConflictoCorreo = false;
    this.saveAdmins(ADMINS_SEED);
  }
}

export const propietarioAdminsService = new PropietarioAdminsService();
