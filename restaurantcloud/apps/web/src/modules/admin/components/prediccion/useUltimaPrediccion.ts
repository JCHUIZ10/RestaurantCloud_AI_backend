import { useCallback, useEffect, useRef, useState } from 'react';
import { prediccionService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import type { CoberturaDias, PrediccionDTO } from '@/types/prediccion';

export type EstadoPrediccion = 'cargando' | 'ok' | 'vacio' | 'sin_plan' | 'error';

const SIN_PLAN = 'ERR_MODULO_PREDICCION_NO_CONTRATADO';
const SIN_PRONOSTICO = 'ERR_SIN_PRONOSTICO';

export interface ResultadoCalculo {
  exito: boolean;
  mensaje?: string;
}

/**
 * Último pronóstico de la sede y sus acciones. Lo usan las tres pantallas de la sede: cada una lo pide al
 * abrirse, y calcular uno nuevo reemplaza lo que se ve.
 */
export function useUltimaPrediccion() {
  const [estado, setEstado] = useState<EstadoPrediccion>('cargando');
  const [datos, setDatos] = useState<PrediccionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setEstado('cargando');
    try {
      const res = await prediccionService.ultimo();
      if (!montado.current) return;
      if (res.exito) {
        setDatos(res.datos);
        setError(null);
        setEstado('ok');
        return;
      }
      const codigo = res.errores?.[0]?.codigo;
      if (codigo === SIN_PRONOSTICO) {
        setDatos(null);
        setEstado('vacio');
      } else if (codigo === SIN_PLAN) {
        setEstado('sin_plan');
      } else {
        setError(res.errores?.[0]?.mensaje ?? 'No se pudo cargar la predicción.');
        setEstado(silencioso && datos ? 'ok' : 'error');
      }
    } catch (e) {
      if (!montado.current) return;
      setError(mensajeDeErrorApi(e, 'No se pudo conectar con el servidor.'));
      setEstado(silencioso && datos ? 'ok' : 'error');
    }
    // `datos` solo decide qué mostrar si falla una recarga silenciosa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Calcula una semana nueva. Si falla, se conserva lo que ya se veía y se devuelve el motivo. */
  const calcular = useCallback(async (cobertura: CoberturaDias): Promise<ResultadoCalculo> => {
    setCalculando(true);
    try {
      const res = await prediccionService.generar(cobertura);
      if (!montado.current) return { exito: false };
      if (res.exito) {
        setDatos(res.datos);
        setError(null);
        setEstado('ok');
        return { exito: true };
      }
      if (res.errores?.[0]?.codigo === SIN_PLAN) setEstado('sin_plan');
      return { exito: false, mensaje: res.errores?.[0]?.mensaje ?? 'No se pudo calcular la semana.' };
    } catch (e) {
      return { exito: false, mensaje: mensajeDeErrorApi(e, 'No se pudo calcular la semana. Intenta de nuevo.') };
    } finally {
      if (montado.current) setCalculando(false);
    }
  }, []);

  return { estado, datos, error, calculando, calcular, recargar: cargar };
}
