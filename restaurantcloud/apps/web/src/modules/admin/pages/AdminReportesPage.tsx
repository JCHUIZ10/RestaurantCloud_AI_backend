import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, CalendarDays, Users, UtensilsCrossed } from 'lucide-react';
import { EstadoVacio, PageHeader } from '@/components/ui';
import { reportesService } from '@/services/serviceAdapter';
import { modulosDelJwt, obtenerJwt } from '@/services/api/jwtServicios';
import { hoyServidorStr } from '@/shared/utils/fechaServidor';
import type { RangoDTO } from '@/types/reportes';
import {
  COLOR,
  ETIQUETA_PERIODO,
  FiltrosReporte,
  NavegacionReportes,
  VistaEquipo,
  VistaPlatos,
  VistaVentas,
  errorDeRango,
  porcentaje,
  rangoDePeriodo,
  soles,
  textoUltimaVenta,
  useReporte,
  type OpcionPeriodo,
  type OtroPeriodo,
  type PestanaReporte,
} from '../components/reportes';

type Pestana = 'ventas' | 'platos' | 'equipo';
const PESTANAS_VALIDAS: Pestana[] = ['ventas', 'platos', 'equipo'];
const MODULO_AVANZADO = 'reportes_avanzados';

/** Reportes de ventas y desempeño (CU-ADMIN-13): ms-analítica por Kong, con el JWT del núcleo. */
export const AdminReportesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const pestana: Pestana = PESTANAS_VALIDAS.find((p) => p === params.get('pestana')) ?? 'ventas';

  const hoy = useMemo(() => hoyServidorStr(), []);
  const [opcion, setOpcion] = useState<OpcionPeriodo>('mes');
  const [personalizado, setPersonalizado] = useState<RangoDTO>(() => rangoDePeriodo('mes', hoy));
  const [comparando, setComparando] = useState(true);
  // Módulos del plan según el JWT: solo adelantan qué pestañas están bloqueadas; el servicio decide el acceso
  const [modulos, setModulos] = useState<string[] | null>(null);

  const rango = rangoDePeriodo(opcion, hoy, personalizado);
  const errorRango = opcion === 'personalizado' ? errorDeRango(rango, hoy) : null;
  const avanzadosIncluidos = modulos === null || modulos.includes(MODULO_AVANZADO);

  useEffect(() => {
    let vigente = true;
    obtenerJwt()
      .then((jwt) => vigente && setModulos(modulosDelJwt(jwt)))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, []);

  const resumen = useReporte(() => reportesService.resumen(rango, comparando), [rango.desde, rango.hasta, comparando], {
    habilitado: !errorRango,
    estaVacio: (d) => d.actual.comprobantes === 0,
  });

  const cambiarOpcion = (nueva: OpcionPeriodo) => {
    // Al pasar a «Personalizado» se parte de lo que se estaba viendo
    if (nueva === 'personalizado' && opcion !== 'personalizado') setPersonalizado(rango);
    setOpcion(nueva);
  };

  const otroPeriodo: OtroPeriodo | null =
    opcion === 'hoy' || opcion === 'ayer'
      ? { etiqueta: `Ver ${ETIQUETA_PERIODO.siete_dias.toLowerCase()}`, alElegir: () => setOpcion('siete_dias') }
      : opcion === 'siete_dias'
        ? { etiqueta: `Ver ${ETIQUETA_PERIODO.mes.toLowerCase()}`, alElegir: () => setOpcion('mes') }
        : null;

  const actual = resumen.datos?.actual;
  const variacion = resumen.datos?.variacion_pct?.ventas_total ?? null;
  const pestanas: PestanaReporte<Pestana>[] = [
    {
      valor: 'ventas',
      nombre: 'Ventas',
      descripcion: actual && actual.comprobantes > 0 ? `${soles(actual.ventas_total)}${comparando && variacion !== null ? ` · ${variacion > 0 ? '+' : ''}${porcentaje(variacion)}` : ''}` : 'Ingresos, horas punta y pagos',
      icono: BarChart3,
      color: COLOR.cobre,
    },
    { valor: 'platos', nombre: 'Platos', descripcion: 'Qué se pide y qué deja más', icono: UtensilsCrossed, color: COLOR.oro, bloqueada: !avanzadosIncluidos },
    { valor: 'equipo', nombre: 'Equipo de salón', descripcion: 'Cómo vende cada mozo', icono: Users, color: COLOR.turquesa, bloqueada: !avanzadosIncluidos },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Reportes de ventas"
        icono={BarChart3}
        descripcion="Cómo le va a la sede: ventas, platos y equipo de salón."
        acciones={
          resumen.datos ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-aurea-champagne bg-white px-3 py-1.5 text-sm text-aurea-navy/75 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-estado-ok-500" aria-hidden="true" />
              {textoUltimaVenta(resumen.datos.ultimo_evento_en, hoy)}
            </span>
          ) : undefined
        }
      />

      <FiltrosReporte
        opcion={opcion}
        onOpcion={cambiarOpcion}
        rango={rango}
        personalizado={personalizado}
        onPersonalizado={setPersonalizado}
        hoy={hoy}
        errorRango={errorRango}
        comparando={comparando}
        onComparar={setComparando}
      />

      <NavegacionReportes pestanas={pestanas} activa={pestana} onCambiar={(p) => setParams({ pestana: p }, { replace: true })} />

      {errorRango ? (
        <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm">
          <EstadoVacio icono={CalendarDays} titulo="Elige un periodo válido" descripcion="Corrige las fechas de arriba para ver los reportes." />
        </div>
      ) : (
        <>
          {pestana === 'ventas' && <VistaVentas rango={rango} comparando={comparando} resumen={resumen} otroPeriodo={otroPeriodo} />}
          {pestana === 'platos' && <VistaPlatos rango={rango} incluido={avanzadosIncluidos} otroPeriodo={otroPeriodo} />}
          {pestana === 'equipo' && <VistaEquipo rango={rango} incluido={avanzadosIncluidos} ticketSede={actual?.ticket_promedio ?? null} otroPeriodo={otroPeriodo} />}
        </>
      )}
    </div>
  );
};
