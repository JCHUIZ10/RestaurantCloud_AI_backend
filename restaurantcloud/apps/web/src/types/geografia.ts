/**
 * Catálogo Maestro de Ubicación Geográfica del Perú (UBIGEO INEI / SUNAT)
 * Para RestaurantCloud AI - Módulo de Sedes y Locales (CU-PROP-04)
 * Estándar: 6 dígitos (2 dep, 2 prov, 2 dist)
 */

export interface DepartamentoPeru {
  codigo: string;
  nombre: string;
}

export interface ProvinciaPeru {
  codigo: string;
  departamento_codigo: string;
  nombre: string;
}

export interface DistritoPeru {
  codigo: string;
  provincia_codigo: string;
  departamento_codigo: string;
  nombre: string;
}