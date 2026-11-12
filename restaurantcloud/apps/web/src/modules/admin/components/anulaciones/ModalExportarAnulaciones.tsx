import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ListChecks,
  RefreshCw,
  Table2,
} from 'lucide-react';
import { Button, Modal, Skeleton } from '@/components/ui';
import { guardarBlobComoArchivo } from '@/services/api/client';
import { adminService } from '@/services/serviceAdapter';
import { cn, fechaLargaStr, formatPEN, hoyLocalStr, sumarDiasStr } from '@/shared/utils';
import type {
  ModoExportacionAnulaciones,
  ResumenExportacionAnulacionesDTO,
} from '@/types/admin';

const DEBOUNCE_VISTA_PREVIA_MS = 350;
/** Debe coincidir con AnulacionExportacionService::MAX_DIAS del backend */
const MAX_DIAS_RANGO = 366;

interface ModalExportarAnulacionesProps {
  abierto: boolean;
  /** Fecha que el administrador tiene abierta en la bandeja: valor inicial del modal */
  fechaVista: string;
  onCerrar: () => void;
  onExportado: (nombreArchivo: string) => void;
}

interface Periodo {
  desde: string;
  hasta: string;
}

interface VistaPrevia {
  clave: string;
  datos?: ResumenExportacionAnulacionesDTO;
  error?: string;
}

const primerDiaDelMes = (fecha: string): string => `${fecha.slice(0, 8)}01`;

const diasEnRango = ({ desde, hasta }: Periodo): number => {
  const [a1, m1, d1] = desde.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000) + 1;
};

const mesAnterior = (hoy: string): Periodo => {
  const [anio, mes] = hoy.split('-').map(Number);
  // Día 0 del mes actual = último día del mes anterior
  const ultimo = new Date(anio, mes - 1, 0).toLocaleDateString('en-CA');
  return { desde: primerDiaDelMes(ultimo), hasta: ultimo };
};

const validarPeriodo = ({ desde, hasta }: Periodo, hoy: string): string | null => {
  if (!desde || !hasta) return 'Elige las fechas que quieres exportar.';
  if (hasta > hoy || desde > hoy) return 'No se pueden exportar fechas futuras.';
  if (hasta < desde) return 'La fecha «Hasta» no puede ser anterior a «Desde».';
  if (diasEnRango({ desde, hasta }) > MAX_DIAS_RANGO) {
    return `El periodo no puede superar ${MAX_DIAS_RANGO} días. Divide la exportación en varios periodos (por ejemplo, uno por año).`;
  }
  return null;
};

const describirPeriodo = ({ desde, hasta }: Periodo): string =>
  desde === hasta ? `el ${fechaLargaStr(desde)}` : `entre el ${fechaLargaStr(desde)} y el ${fechaLargaStr(hasta)}`;

const CLASE_INPUT_FECHA =
  'w-full h-11 px-3 rounded-xl border border-aurea-champagne/70 bg-white text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper';

const OPCIONES_MODO: {
  valor: ModoExportacionAnulaciones;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
}[] = [
  {
    valor: 'dia',
    titulo: 'Un día',
    descripcion: 'Las anulaciones de una fecha concreta.',
    icono: CalendarDays,
  },
  {
    valor: 'rango',
    titulo: 'Rango de fechas',
    descripcion: 'Ideal para cierres semanales o mensuales.',
    icono: CalendarRange,
  },
];

const Chip: React.FC<{ activo: boolean; onClick: () => void; children: React.ReactNode }> = ({
  activo,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={activo}
    className={cn(
      'px-3 h-8 rounded-full text-xs font-semibold border transition-colors',
      activo
        ? 'bg-aurea-navy text-white border-aurea-navy'
        : 'bg-white text-aurea-navy/80 border-aurea-champagne/70 hover:bg-aurea-champagne/30'
    )}
  >
    {children}
  </button>
);

const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode }> = ({ etiqueta, valor }) => (
  <div className="rounded-xl bg-white/70 border border-estado-ok-200/70 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-estado-ok-800/80">{etiqueta}</p>
    <p className="text-sm font-bold text-aurea-navy tabular-nums">{valor}</p>
  </div>
);

const ContenidoModal: React.FC<Omit<ModalExportarAnulacionesProps, 'abierto'>> = ({
  fechaVista,
  onCerrar,
  onExportado,
}) => {
  const hoy = hoyLocalStr();
  const fechaInicial = fechaVista > hoy ? hoy : fechaVista;

  const [modo, setModo] = useState<ModoExportacionAnulaciones>('dia');
  const [dia, setDia] = useState(fechaInicial);
  const [desde, setDesde] = useState(primerDiaDelMes(fechaInicial));
  const [hasta, setHasta] = useState(fechaInicial);
  const [intento, setIntento] = useState(0);
  const [vista, setVista] = useState<VistaPrevia | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  const periodo: Periodo = modo === 'dia' ? { desde: dia, hasta: dia } : { desde, hasta };
  const errorPeriodo = validarPeriodo(periodo, hoy);
  const clave = `${periodo.desde}|${periodo.hasta}|${intento}`;

  // Vista previa con debounce. Solo se escribe estado dentro del callback asíncrono, y el resultado
  // se asocia a la clave del periodo: una respuesta tardía de otro periodo nunca se muestra.
  useEffect(() => {
    if (errorPeriodo) return;
    let vigente = true;
    const timerId = setTimeout(async () => {
      try {
        const resp = await adminService.getResumenExportacionAnulaciones({
          desde: periodo.desde,
          hasta: periodo.hasta,
        });
        if (!vigente) return;
        setVista(
          resp.exito
            ? { clave, datos: resp.datos }
            : { clave, error: resp.errores?.[0]?.mensaje || 'No se pudo calcular la vista previa.' }
        );
      } catch {
        if (!vigente) return;
        setVista({ clave, error: 'No pudimos comunicarnos con el servidor.' });
      }
    }, DEBOUNCE_VISTA_PREVIA_MS);

    return () => {
      vigente = false;
      clearTimeout(timerId);
    };
  }, [clave, errorPeriodo, periodo.desde, periodo.hasta]);

  const vistaActual = vista?.clave === clave ? vista : null;
  const cargandoVista = !errorPeriodo && vistaActual === null;
  const total = vistaActual?.datos?.total ?? 0;
  const puedeDescargar = !errorPeriodo && !!vistaActual?.datos && total > 0 && !descargando;

  const atajosRango = useMemo(
    () => [
      { etiqueta: 'Últimos 7 días', periodo: { desde: sumarDiasStr(hoy, -6), hasta: hoy } },
      { etiqueta: 'Últimos 30 días', periodo: { desde: sumarDiasStr(hoy, -29), hasta: hoy } },
      { etiqueta: 'Este mes', periodo: { desde: primerDiaDelMes(hoy), hasta: hoy } },
      { etiqueta: 'Mes anterior', periodo: mesAnterior(hoy) },
    ],
    [hoy]
  );

  const cambiarModo = (nuevo: ModoExportacionAnulaciones) => {
    setModo(nuevo);
    setErrorDescarga(null);
  };

  const descargar = async () => {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const { blob, nombreArchivo } = await adminService.exportarAnulacionesExcel(periodo);
      guardarBlobComoArchivo(blob, nombreArchivo);
      onExportado(nombreArchivo);
      onCerrar();
    } catch (err) {
      setErrorDescarga(err instanceof Error ? err.message : 'No se pudo generar el archivo de Excel.');
      setDescargando(false);
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      cerrable={!descargando}
      tamano="lg"
      icono={FileSpreadsheet}
      etiqueta="Auditoría de anulaciones"
      titulo="Exportar a Excel"
      descripcion="Descarga las anulaciones con su resumen, listo para compartir."
      pie={
        <>
          <Button variant="ghost" onClick={onCerrar} disabled={descargando}>
            Cancelar
          </Button>
          <Button
            onClick={descargar}
            loading={descargando}
            disabled={!puedeDescargar}
            leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
          >
            {descargando ? 'Generando…' : 'Descargar Excel'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 1. Qué exportar */}
        <section aria-labelledby="exp-anul-modo">
          <h3 id="exp-anul-modo" className="text-xs font-bold uppercase tracking-wide text-aurea-navy/60 mb-2">
            1. ¿Qué quieres exportar?
          </h3>
          <div role="radiogroup" aria-labelledby="exp-anul-modo" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OPCIONES_MODO.map(({ valor, titulo, descripcion, icono: Icono }) => {
              const activo = modo === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => cambiarModo(valor)}
                  className={cn(
                    'relative flex items-start gap-3 p-4 rounded-2xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper/50',
                    activo
                      ? 'border-aurea-copper bg-aurea-champagne/30 ring-2 ring-aurea-copper/20'
                      : 'border-aurea-champagne/70 bg-white hover:bg-aurea-ivory'
                  )}
                >
                  <span
                    className={cn(
                      'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
                      activo
                        ? 'bg-aurea-navy text-white border-aurea-navy'
                        : 'bg-aurea-champagne/40 text-aurea-navy border-aurea-copper/30'
                    )}
                    aria-hidden="true"
                  >
                    <Icono className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-aurea-navy">{titulo}</span>
                    <span className="block text-xs text-aurea-navy/70 mt-0.5">{descripcion}</span>
                  </span>
                  {activo && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-aurea-copper" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Fechas */}
        <section aria-labelledby="exp-anul-fechas" className="space-y-3">
          <h3 id="exp-anul-fechas" className="text-xs font-bold uppercase tracking-wide text-aurea-navy/60">
            2. {modo === 'dia' ? 'Elige la fecha' : 'Elige el periodo'}
          </h3>

          {modo === 'dia' ? (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-aurea-navy/80 mb-1 block">Fecha</span>
                <input
                  type="date"
                  value={dia}
                  max={hoy}
                  onChange={(e) => setDia(e.target.value)}
                  className={CLASE_INPUT_FECHA}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Chip activo={dia === hoy} onClick={() => setDia(hoy)}>
                  Hoy
                </Chip>
                <Chip activo={dia === sumarDiasStr(hoy, -1)} onClick={() => setDia(sumarDiasStr(hoy, -1))}>
                  Ayer
                </Chip>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-aurea-navy/80 mb-1 block">Desde</span>
                  <input
                    type="date"
                    value={desde}
                    max={hoy}
                    onChange={(e) => setDesde(e.target.value)}
                    className={CLASE_INPUT_FECHA}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-aurea-navy/80 mb-1 block">Hasta</span>
                  <input
                    type="date"
                    value={hasta}
                    max={hoy}
                    onChange={(e) => setHasta(e.target.value)}
                    className={CLASE_INPUT_FECHA}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {atajosRango.map(({ etiqueta, periodo: atajo }) => (
                  <Chip
                    key={etiqueta}
                    activo={desde === atajo.desde && hasta === atajo.hasta}
                    onClick={() => {
                      setDesde(atajo.desde);
                      setHasta(atajo.hasta);
                    }}
                  >
                    {etiqueta}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {errorPeriodo && (
            <p role="alert" className="text-xs font-medium text-estado-error-700 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              {errorPeriodo}
            </p>
          )}
        </section>

        {/* 3. Vista previa */}
        <section aria-labelledby="exp-anul-vista" aria-live="polite" className="space-y-3">
          <h3 id="exp-anul-vista" className="text-xs font-bold uppercase tracking-wide text-aurea-navy/60">
            3. Lo que se exportará
          </h3>

          {errorPeriodo ? (
            <div className="rounded-2xl border border-dashed border-aurea-champagne bg-aurea-ivory/60 px-4 py-5 text-sm text-aurea-navy/60">
              Corrige las fechas para ver cuántas anulaciones se exportarán.
            </div>
          ) : cargandoVista ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : vistaActual?.error ? (
            <div role="alert" className="rounded-2xl border border-estado-error-200 bg-estado-error-50 px-4 py-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-estado-error-800 flex-1 min-w-[12rem]">{vistaActual.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIntento((n) => n + 1)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
              >
                Reintentar
              </Button>
            </div>
          ) : total === 0 ? (
            <div className="rounded-2xl border border-estado-alerta-200 bg-estado-alerta-50 px-4 py-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-estado-alerta-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-estado-alerta-900">
                  No hay anulaciones {describirPeriodo(periodo)}
                </p>
                <p className="text-xs text-estado-alerta-800/80 mt-0.5">
                  Prueba con otro día o amplía el rango de fechas.
                </p>
              </div>
            </div>
          ) : (
            vistaActual?.datos && (
              <div className="rounded-2xl border border-estado-ok-200 bg-estado-ok-50 px-4 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-estado-ok-700 shrink-0" aria-hidden="true" />
                  <p className="text-sm font-bold text-estado-ok-900">
                    {vistaActual.datos.total === 1
                      ? '1 anulación lista para exportar'
                      : `${vistaActual.datos.total} anulaciones listas para exportar`}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Dato etiqueta="Monto" valor={formatPEN(vistaActual.datos.monto_total)} />
                  <Dato etiqueta="Con merma" valor={vistaActual.datos.con_merma} />
                  <Dato etiqueta="Por revisar" valor={vistaActual.datos.pendientes_revision} />
                  <Dato
                    etiqueta={vistaActual.datos.dias_con_anulaciones === 1 ? 'Día con registros' : 'Días con registros'}
                    valor={vistaActual.datos.dias_con_anulaciones}
                  />
                </div>
              </div>
            )
          )}
        </section>

        {/* Contenido del archivo */}
        <section aria-label="Contenido del archivo" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 rounded-2xl border border-aurea-champagne/70 bg-aurea-ivory/60 p-3">
            <ListChecks className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-aurea-navy">Hoja «Resumen»</p>
              <p className="text-xs text-aurea-navy/70">Indicadores del periodo y totales por motivo y por mozo.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-aurea-champagne/70 bg-aurea-ivory/60 p-3">
            <Table2 className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-aurea-navy">Hoja «Detalle»</p>
              <p className="text-xs text-aurea-navy/70">Una fila por anulación, lista para filtrar, ordenar y sumar.</p>
            </div>
          </div>
        </section>

        {errorDescarga && (
          <p
            role="alert"
            className="rounded-xl border border-estado-error-200 bg-estado-error-50 px-3 py-2.5 text-sm text-estado-error-800 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errorDescarga}
          </p>
        )}
      </div>
    </Modal>
  );
};

/**
 * Modal para exportar a Excel las anulaciones de un día o de un rango de fechas.
 * El contenido se monta solo mientras está abierto, así cada apertura parte de la fecha de la vista.
 */
export const ModalExportarAnulaciones: React.FC<ModalExportarAnulacionesProps> = ({ abierto, ...props }) =>
  abierto ? <ContenidoModal {...props} /> : null;
