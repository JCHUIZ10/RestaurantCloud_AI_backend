import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import type { ApiResponse } from '@/types/api';

export type EstadoReporte = 'cargando' | 'ok' | 'vacio' | 'sin_plan' | 'error';

/** El plan de la empresa no incluye el módulo del reporte (403). */
export const ERR_MODULO_NO_INCLUIDO = 'ERR_MODULO_NO_INCLUIDO';

/** Mensaje para quien usa la pantalla cuando la llamada falla antes de llegar a la respuesta del servicio. */
export function mensajeDeFalla(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const estado = error.response?.status;
    if (estado === 429) return 'Hiciste muchas consultas seguidas. Espera un momento y vuelve a intentar.';
    if (estado === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
    if (estado !== undefined && estado >= 500) {
      return 'El servicio de reportes no responde en este momento. Tus ventas siguen guardándose y aparecerán aquí cuando vuelva.';
    }
    if (!error.response) return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  if (error instanceof Error && error.name === 'SinSesionError') return 'Tu sesión venció. Vuelve a iniciar sesión.';
  return 'No se pudieron cargar los reportes.';
}

interface Opciones<T> {
  /** Si es `false`, no consulta (por ejemplo, rango inválido o módulo no incluido en el plan) */
  habilitado?: boolean;
  /** Respuesta correcta pero sin nada que mostrar */
  estaVacio: (datos: T) => boolean;
}

/**
 * Carga un reporte y lo vuelve a pedir cuando cambian sus dependencias (periodo, comparación…). Una respuesta
 * que llega tarde, de una consulta que ya cambió, se descarta.
 */
export function useReporte<T>(cargar: () => Promise<ApiResponse<T>>, dependencias: ReadonlyArray<unknown>, opciones: Opciones<T>) {
  const { habilitado = true } = opciones;
  const [estado, setEstado] = useState<EstadoReporte>('cargando');
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const secuencia = useRef(0);
  const cargarRef = useRef(cargar);
  const vacioRef = useRef(opciones.estaVacio);
  cargarRef.current = cargar;
  vacioRef.current = opciones.estaVacio;

  const consultar = useCallback(async () => {
    const mia = ++secuencia.current;
    setEstado('cargando');
    try {
      const respuesta = await cargarRef.current();
      if (mia !== secuencia.current) return;
      if (respuesta.exito) {
        setDatos(respuesta.datos);
        setError(null);
        setEstado(vacioRef.current(respuesta.datos) ? 'vacio' : 'ok');
        return;
      }
      if (respuesta.errores?.[0]?.codigo === ERR_MODULO_NO_INCLUIDO) {
        setEstado('sin_plan');
        return;
      }
      setError(respuesta.errores?.[0]?.mensaje ?? 'No se pudieron cargar los reportes.');
      setEstado('error');
    } catch (falla) {
      if (mia !== secuencia.current) return;
      setError(mensajeDeFalla(falla));
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    if (habilitado) void consultar();
    else secuencia.current += 1;
    // Las dependencias del llamador son las que deciden cuándo se vuelve a consultar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habilitado, consultar, ...dependencias]);

  return { estado, datos, error, recargar: consultar };
}
