import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, TrendingUp } from 'lucide-react';
import { EstadoError, EstadoVacio, PageHeader, Skeleton, useToast } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import { prediccionService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/shared/utils';
import type { PrediccionPropietarioDTO, SedePrediccionDTO } from '@/types/prediccion';
import { SinPlanPrediccion, fechaLocal } from '@/modules/admin/components/prediccion';
import { ComparacionPlatos } from '../components/prediccion/ComparacionPlatos';
import { PanoramaSedes } from '../components/prediccion/PanoramaSedes';
import { TarjetaSedePrediccion } from '../components/prediccion/TarjetaSedePrediccion';
import { PERIODOS, fechasDelPeriodo, totalDelPanorama, type PeriodoPrediccion } from '../components/prediccion/periodos';

const SIN_PLAN = 'ERR_MODULO_PREDICCION_NO_CONTRATADO';

const TITULOS: Record<PeriodoPrediccion, string> = {
  manana: 'mañana',
  fin_de_semana: 'este fin de semana',
  semana: 'en los próximos 7 días',
};

/** Predicción de todas las sedes de la empresa: cuánto venderá cada una y cuánto tendrá que comprar. */
export const PropietarioPrediccionPage: React.FC = () => {
  const navigate = useNavigate();
  const { mostrar } = useToast();
  const { usuario, setUsuario } = useAuthStore();
  const [datos, setDatos] = useState<PrediccionPropietarioDTO | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'sin_plan' | 'error'>('cargando');
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoPrediccion>('semana');
  const [calculandoId, setCalculandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setEstado((e) => (e === 'ok' ? e : 'cargando'));
    try {
      const res = await prediccionService.propietario();
      if (res.exito) {
        setDatos(res.datos);
        setEstado('ok');
      } else if (res.errores?.[0]?.codigo === SIN_PLAN) {
        setEstado('sin_plan');
      } else {
        setError(res.errores?.[0]?.mensaje ?? 'No se pudo cargar la predicción.');
        setEstado('error');
      }
    } catch (e) {
      setError(mensajeDeErrorApi(e, 'No se pudo conectar con el servidor.'));
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const fechas = useMemo(() => {
    const todas = datos?.panorama.dias.map((d) => d.fecha) ?? [];
    return fechasDelPeriodo(todas, periodo);
  }, [datos, periodo]);

  const calcularSede = async (sede: SedePrediccionDTO) => {
    setCalculandoId(sede.local_id);
    try {
      const res = await prediccionService.generar(3, sede.local_id);
      if (res.exito) await cargar();
      else mostrar(res.errores?.[0]?.mensaje ?? 'No se pudo calcular la semana de esa sede.', 'error');
    } catch (e) {
      mostrar(mensajeDeErrorApi(e, 'No se pudo calcular la semana. Intenta de nuevo.'), 'error');
    } finally {
      setCalculandoId(null);
    }
  };

  /** Entra a la sede (como al administrarla) y abre su semana. */
  const verSede = (sede: SedePrediccionDTO) => {
    if (usuario) setUsuario({ ...usuario, local: { id: sede.local_id, nombre: sede.nombre } });
    localStorage.setItem('active_local_id', sede.local_id);
    localStorage.setItem('active_local_nombre', sede.nombre);
    navigate(ROUTES.ADMIN_PLANIFICAR_SEMANA);
  };

  const cabecera = (
    <PageHeader
      titulo="Predicción de mis sedes"
      icono={TrendingUp}
      descripcion="Cuánto venderá cada sede y cuánto tendrá que comprar."
      acciones={
        estado === 'ok' ? (
          <div role="radiogroup" aria-label="Periodo" className="flex flex-wrap gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                type="button"
                role="radio"
                aria-checked={periodo === p.valor}
                onClick={() => setPeriodo(p.valor)}
                className={cn(
                  'min-h-tactil px-4 rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2',
                  periodo === p.valor ? 'bg-aurea-navy border-aurea-navy text-aurea-ivory' : 'bg-white border-tinta-200 text-aurea-navy hover:border-aurea-copper'
                )}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        ) : undefined
      }
    />
  );

  if (estado === 'cargando') {
    return <div className="space-y-6">{cabecera}<Skeleton className="h-72 rounded-3xl" /><div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div>;
  }
  if (estado === 'sin_plan') return <div className="space-y-6">{cabecera}<SinPlanPrediccion /></div>;
  if (estado === 'error' || datos === null) {
    return <div className="space-y-6">{cabecera}<EstadoError mensaje={error ?? 'No se pudo cargar la predicción.'} onReintentar={() => cargar()} /></div>;
  }
  if (datos.sedes.length === 0) {
    return (
      <div className="space-y-6">
        {cabecera}
        <EstadoVacio icono={Building2} titulo="Aún no tienes sedes activas" descripcion="Cuando registres una sede, aquí verás su predicción." />
      </div>
    );
  }

  const total = totalDelPanorama(datos.panorama, fechas);
  const primera = fechas[0] ? fechaLocal(fechas[0]) : null;

  return (
    <div className="space-y-6">
      {cabecera}

      <PanoramaSedes
        sedes={datos.sedes}
        panorama={datos.panorama}
        fechas={fechas}
        total={total}
        titulo={periodo === 'manana' && primera ? 'mañana' : TITULOS[periodo]}
      />

      <section aria-label="Sedes" className="grid gap-4 lg:grid-cols-2">
        {datos.sedes.map((s) => (
          <TarjetaSedePrediccion
            key={s.local_id}
            sede={s}
            fechas={fechas}
            calculando={calculandoId === s.local_id}
            onCalcular={calcularSede}
            onVer={verSede}
          />
        ))}
      </section>

      <ComparacionPlatos sedes={datos.sedes} />
    </div>
  );
};
