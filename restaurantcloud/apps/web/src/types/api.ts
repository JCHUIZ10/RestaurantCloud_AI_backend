export interface ApiResponse<T> {
  exito: boolean;
  datos: T;
  errores?: AppError[];
  meta?: ResponseMeta;
}

export interface AppError {
  codigo: string;
  mensaje: string;
  campo?: string;
}

export interface ResponseMeta {
  timestamp: string;
  total?: number;
  pagina?: number;
  limite?: number;
}
