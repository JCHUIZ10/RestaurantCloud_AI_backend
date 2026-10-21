import { realPropietarioLocalesService } from '@/services/api/realApiServices';

export type {
  LocalItemDTO,
  DirectorioLocalesApiResponse,
  VerificarDisponibilidadApiResponse,
  VerificarSlugApiResponse,
  CrearLocalRequestDTO,
  CrearLocalApiResponse,
  ActualizarLocalRequestDTO,
  ActualizarLocalApiResponse,
  ValidarBajaApiResponse,
  CambiarEstadoLocalRequestDTO,
  CambiarEstadoApiResponse,
  AdministradorResumenDTO,
} from '@/types/propietarioLocales';

export type {
  DepartamentoPeru,
  ProvinciaPeru,
  DistritoPeru,
} from '@/types/geografia';

export {
  DEPARTAMENTOS_PERU,
  PROVINCIAS_PERU,
  DISTRITOS_PERU,
  DEFAULT_DEPARTAMENTO_COD,
  DEFAULT_PROVINCIA_COD,
  DEFAULT_DISTRITO_COD,
  getProvinciasByDepartamento,
  getDistritosByProvincia,
  getUbigeoCompleto,
} from '@/shared/data/ubigeoPeru';

/**
 * Conexión Directa al Backend (CU-PROP-04 - 100% API Real Laravel)
 */
export const propietarioLocalesService = {
  ...realPropietarioLocalesService,
  // Métodos de compatibilidad para widgets auxiliares (sin mock)
  setSimularBloqueoDuro(_val: boolean): void {},
  getSimularBloqueoDuro(): boolean { return false; },
  setForzarCupoLleno(_val: boolean): void {},
  getForzarCupoLleno(): boolean { return false; },
  toggleAutogestion(_localId: string): void {},
  restablecerSemillas(): void {},
};
