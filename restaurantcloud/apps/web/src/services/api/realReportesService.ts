import { microserviciosGet } from './clienteMicroservicios';
import type {
  DesempenoPersonalDTO,
  RangoDTO,
  RankingProductosDTO,
  ResumenVentasDTO,
  VentasPorHoraDTO,
} from '@/types/reportes';

/** Reportes de ventas y desempeño (CU-ADMIN-13): ms-analítica, por Kong. */
export const realReportesService = {
  /** Indicadores del periodo; con `comparar`, también los del periodo anterior de igual duración. */
  resumen: (rango: RangoDTO, comparar: boolean) =>
    microserviciosGet<ResumenVentasDTO>('/analitica/ventas/resumen', { ...rango, comparar }),

  porHora: (rango: RangoDTO) => microserviciosGet<VentasPorHoraDTO>('/analitica/ventas/por-hora', { ...rango }),

  /** Exige el módulo `reportes_avanzados`: sin él responde 403 `ERR_MODULO_NO_INCLUIDO`. */
  ranking: (rango: RangoDTO) => microserviciosGet<RankingProductosDTO>('/analitica/productos/ranking', { ...rango }),

  /** Exige el módulo `reportes_avanzados`. */
  desempeno: (rango: RangoDTO) => microserviciosGet<DesempenoPersonalDTO>('/analitica/personal/desempeno', { ...rango }),
};
