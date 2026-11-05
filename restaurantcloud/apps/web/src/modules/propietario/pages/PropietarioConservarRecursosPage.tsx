import React, { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useBlocker, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ListChecks } from 'lucide-react';
import { Button, EstadoError, EstadoVacio, ModalConfirmacion, PageHeader, Skeleton, useToast } from '@/components/ui';
import { ROUTES } from '@/router/routes.constants';
import type { RecursosConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../services/propietarioSuscripcionService';
import { PasosConservar } from '../components/conservar/PasosConservar';
import { PasoDiagnostico } from '../components/conservar/PasoDiagnostico';
import { PasoLocales } from '../components/conservar/PasoLocales';
import { PasoSede } from '../components/conservar/PasoSede';
import { PasoResumen } from '../components/conservar/PasoResumen';
import { useSeleccionConservar } from '../components/conservar/useSeleccionConservar';

interface AsistenteProps {
  datos: RecursosConciliacionDTO;
}

/** Recorrido guiado; vive aparte de la carga para inicializar la selección una sola vez con los datos ya listos. */
const Asistente: React.FC<AsistenteProps> = ({ datos }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const s = useSeleccionConservar(datos);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const bloquear = s.modificado && !guardado;
  const bloqueador = useBlocker(
    ({ currentLocation, nextLocation }) => bloquear && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!bloquear) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [bloquear]);

  const sedes = s.pasos.filter((p) => p.tipo === 'sede');

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await propietarioSuscripcionService.guardarSeleccionConservar(s.dto());
      if (res.exito) {
        // Render síncrono: el bloqueador debe ver «guardado» antes de la navegación que sigue
        flushSync(() => setGuardado(true));
        toast.mostrar('Selección guardada. Se aplicará cuando entre el nuevo plan.', 'ok');
        navigate(ROUTES.PROPIETARIO_SUSCRIPCION);
        return;
      }
      setError(res.errores?.[0]?.mensaje ?? 'No se pudo guardar la selección.');
    } catch {
      setError('No pudimos conectar con el servidor. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <PasosConservar datos={datos} sel={s.sel} pasos={s.pasos} indice={s.indice} onIr={s.irA} />

      <section className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6" aria-live="polite">
        {s.paso.tipo === 'diagnostico' && <PasoDiagnostico datos={datos} />}
        {s.paso.tipo === 'locales' && <PasoLocales datos={datos} sel={s.sel} alternarLocal={s.alternarLocal} />}
        {s.paso.tipo === 'sede' && s.sedeActual && (
          <PasoSede
            key={s.sedeActual.id}
            datos={datos}
            local={s.sedeActual}
            posicion={{ actual: sedes.findIndex((p) => p.clave === s.paso.clave) + 1, total: sedes.length }}
            sel={s.sel}
            acciones={s}
          />
        )}
        {s.paso.tipo === 'resumen' && <PasoResumen datos={datos} sel={s.sel} />}

        {error && (
          <div role="alert" className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
      </section>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 mt-5 px-4 sm:px-0 py-3 bg-aurea-ivory/95 backdrop-blur border-t border-aurea-champagne/60 sm:border-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
        <Button variant="ghost" disabled={guardando} onClick={() => navigate(ROUTES.PROPIETARIO_SUSCRIPCION)}>
          Salir
        </Button>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {s.indice > 0 && (
            <Button variant="outline" disabled={guardando} leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={s.anterior}>
              Atrás
            </Button>
          )}
          {s.esUltimo ? (
            <Button loading={guardando} disabled={!s.valido} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={guardar}>
              Guardar selección
            </Button>
          ) : (
            <Button disabled={!s.puedeAvanzar} onClick={s.siguiente}>
              {s.paso.tipo === 'diagnostico' ? 'Empezar' : 'Siguiente'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <ModalConfirmacion
        abierto={bloqueador.state === 'blocked'}
        onCerrar={() => bloqueador.reset?.()}
        onConfirmar={() => bloqueador.proceed?.()}
        titulo="¿Salir sin guardar?"
        mensaje="Cambiaste qué conservar pero no guardaste la selección. Si sales, se perderán esos cambios."
        textoConfirmar="Salir sin guardar"
        tono="alerta"
      />
    </>
  );
};

type Estado = { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'sin_cambio' } | { tipo: 'listo'; datos: RecursosConciliacionDTO };

export const PropietarioConservarRecursosPage: React.FC = () => {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    try {
      const res = await propietarioSuscripcionService.getRecursosConciliacion();
      if (res.exito && res.datos) {
        setEstado({ tipo: 'listo', datos: res.datos });
      } else if (res.errores?.[0]?.codigo === 'SIN_CAMBIO_PROGRAMADO') {
        setEstado({ tipo: 'sin_cambio' });
      } else {
        setEstado({ tipo: 'error', mensaje: res.errores?.[0]?.mensaje ?? 'No se pudieron cargar tus recursos.' });
      }
    } catch {
      setEstado({ tipo: 'error', mensaje: 'No pudimos conectar con el servidor. Intenta nuevamente.' });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        icono={ListChecks}
        titulo="Elegir qué conservar"
        descripcion="Decide qué seguirá activo cuando entre tu nuevo plan. Hasta entonces conservas todo."
        volver={{ etiqueta: 'Suscripción', to: ROUTES.PROPIETARIO_SUSCRIPCION }}
      />

      {estado.tipo === 'cargando' && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </div>
      )}

      {estado.tipo === 'error' && <EstadoError mensaje={estado.mensaje} onReintentar={cargar} />}

      {estado.tipo === 'sin_cambio' && (
        <EstadoVacio
          icono={ListChecks}
          titulo="No tienes un cambio de plan programado"
          descripcion="Este asistente se habilita cuando programas un cambio a un plan menor."
          accion={
            <Link to={ROUTES.PROPIETARIO_CAMBIAR_PLAN} className="text-sm font-bold text-aurea-navy underline">
              Ir a cambiar de plan
            </Link>
          }
        />
      )}

      {estado.tipo === 'listo' && <Asistente datos={estado.datos} />}
    </div>
  );
};
