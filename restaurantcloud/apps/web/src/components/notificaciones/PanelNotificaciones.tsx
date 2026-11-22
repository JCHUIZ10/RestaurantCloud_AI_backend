import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { AvisoDTO } from '@/types/notificaciones';
import { detalleDeAviso, ETIQUETA_SEVERIDAD, haceCuanto } from './formato';
import { POR_PAGINA, type EstadoNotificaciones, type Pestana } from './useNotificaciones';

interface PanelProps {
  estado: EstadoNotificaciones;
  /** Nombre de cada sede por id; solo lo trae el propietario, que ve avisos de varias */
  nombresSede?: Record<string, string>;
  onCerrar: () => void;
  onPestana: (p: Pestana) => void;
  onMarcarLeida: (id: string, quitarDeNoLeidas?: boolean) => void;
  onMarcarTodas: () => void;
  onCargarMas: () => void;
  onReintentar: () => void;
}

const ESTILO_SEVERIDAD = {
  critica: 'text-estado-error-700 bg-estado-error-50 border-estado-error-200',
  alerta: 'text-estado-alerta-700 bg-estado-alerta-50 border-estado-alerta-200',
  info: 'text-estado-info-700 bg-estado-info-50 border-estado-info-200',
} as const;

interface TarjetaProps {
  aviso: AvisoDTO;
  sede?: string;
  ahora: number;
  onMarcarLeida: PanelProps['onMarcarLeida'];
}

const Tarjeta: React.FC<TarjetaProps> = ({ aviso, sede, ahora, onMarcarLeida }) => {
  const [abierta, setAbierta] = useState(false);
  const filas = detalleDeAviso(aviso);
  const alternarDetalle = () => {
    // Abrir el detalle es leer el aviso: se marca sin sacarlo de la lista mientras se está mirando
    if (!abierta && !aviso.leida) onMarcarLeida(aviso.id, false);
    setAbierta(!abierta);
  };

  return (
    <article
      aria-labelledby={`aviso-${aviso.id}`}
      className={cn(
        'rounded-xl border bg-white px-3.5 py-3 grid gap-1.5',
        aviso.leida ? 'border-tinta-200' : 'border-tinta-300 shadow-sm',
        !aviso.leida && aviso.severidad === 'critica' && 'border-estado-error-200 bg-gradient-to-b from-estado-error-50 to-white',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {!aviso.leida && <span className="w-2 h-2 rounded-full bg-aurea-navy shrink-0" aria-label="Sin leer" role="img" />}
        <span className={cn('px-1.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wide', ESTILO_SEVERIDAD[aviso.severidad])}>
          {ETIQUETA_SEVERIDAD[aviso.severidad]}
        </span>
        {sede && <span className="px-1.5 py-0.5 rounded-md bg-tinta-100 text-xs font-semibold text-tinta-500">{sede}</span>}
        <span className="ml-auto text-xs text-tinta-400 whitespace-nowrap">{haceCuanto(aviso.creada_en, ahora)}</span>
      </div>
      <h4 id={`aviso-${aviso.id}`} className="text-[15px] font-bold text-aurea-navy text-balance">
        {aviso.titulo}
      </h4>
      <p className="text-[13.5px] text-tinta-600">{aviso.mensaje}</p>
      {abierta && filas.length > 0 && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 rounded-lg border border-tinta-100 bg-tinta-50 px-3 py-2.5 text-[13px]">
          {filas.map(([etiqueta, valor]) => (
            <React.Fragment key={etiqueta}>
              <dt className="text-tinta-500">{etiqueta}</dt>
              <dd className="m-0 min-w-0 font-semibold text-aurea-navy break-words">{valor}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      <div className="mt-0.5 flex items-center justify-between gap-2 border-t border-dashed border-tinta-100 pt-1.5">
        {filas.length > 0 ? (
          <button
            type="button"
            onClick={alternarDetalle}
            aria-expanded={abierta}
            className="min-h-9 px-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-tinta-600 underline underline-offset-4 hover:text-aurea-navy"
          >
            {abierta ? 'Ocultar detalle' : 'Ver detalle'}
            {abierta ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        ) : (
          <span />
        )}
        {aviso.leida ? (
          <span className="text-xs text-tinta-400">Leída</span>
        ) : (
          <button
            type="button"
            onClick={() => onMarcarLeida(aviso.id)}
            className="min-h-9 px-1.5 text-[13px] font-semibold text-tinta-600 underline underline-offset-4 hover:text-aurea-navy"
          >
            Marcar leída
          </button>
        )}
      </div>
    </article>
  );
};

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'no-leidas', etiqueta: 'No leídas' },
  { id: 'todas', etiqueta: 'Todas' },
];

const TECLA = 'rounded border border-tinta-200 bg-tinta-50 px-1 text-xs';

/** Panel lateral de 440 px sobre la pantalla de trabajo (CU-TRANS-01): se lee y se gestiona sin cambiar de ruta. */
export const PanelNotificaciones: React.FC<PanelProps> = ({
  estado,
  nombresSede,
  onCerrar,
  onPestana,
  onMarcarLeida,
  onMarcarTodas,
  onCargarMas,
  onReintentar,
}) => {
  const { contador, canal, pestana, listas } = estado;
  const lista = listas[pestana];
  const titulo = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => titulo.current?.focus(), []);
  // «Hace 5 min» se mantiene al día mientras el panel está abierto
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // El panel es modal: el foco da la vuelta dentro de él en lugar de irse a la pantalla de atrás
  const alPulsar = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panel.current) return;
    const foco = panel.current.querySelectorAll<HTMLElement>('button:not([disabled])');
    if (foco.length === 0) return;
    const primero = foco[0]!;
    const ultimo = foco[foco.length - 1]!;
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === titulo.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  const hayMas = lista.total !== null && lista.avisos.length < lista.total;
  const sinAvisos = lista.total !== null && lista.avisos.length === 0;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-aurea-navy/35" onClick={onCerrar} aria-hidden="true" />
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-avisos-titulo"
        onKeyDown={alPulsar}
        className="fixed inset-y-0 right-0 z-[71] w-[440px] max-w-full bg-white text-aurea-navy flex flex-col shadow-2xl motion-safe:animate-panel-entra"
      >
        <header className="flex items-center gap-2.5 border-b border-tinta-100 pl-5 pr-3 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <h2 id="panel-avisos-titulo" ref={titulo} tabIndex={-1} className="text-lg font-bold text-aurea-navy outline-none">
            Notificaciones
          </h2>
          {contador.total > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-aurea-navy text-white text-xs font-bold tabular-nums" aria-label={`${contador.total} sin leer`}>
              {contador.total}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {contador.total > 0 && (
              <button
                type="button"
                onClick={onMarcarTodas}
                className="min-h-10 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-tinta-200 text-[13px] font-semibold text-tinta-700 hover:bg-tinta-50"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span className="hidden min-[520px]:inline">Marcar todas leídas</span>
                <span className="min-[520px]:hidden">Todas</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="min-h-tactil min-w-tactil grid place-items-center rounded-lg text-tinta-500 hover:bg-tinta-100 hover:text-aurea-navy"
            >
              <X className="w-[18px] h-[18px]" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div role="tablist" className="grid grid-cols-2 border-b border-tinta-100">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => onPestana(p.id)}
              className={cn(
                'min-h-tactil text-sm font-semibold border-b-2 transition-colors',
                pestana === p.id ? 'text-aurea-navy border-aurea-navy' : 'text-tinta-500 border-transparent hover:text-aurea-navy',
              )}
            >
              {p.etiqueta}
              {p.id === 'no-leidas' && <span className="tabular-nums"> ({contador.total})</span>}
              {p.id === 'todas' && listas.todas.total !== null && <span className="tabular-nums"> ({listas.todas.total})</span>}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="flex-1 overflow-y-auto bg-tinta-50 p-3 grid gap-2.5 content-start">
          {lista.error && lista.avisos.length === 0 ? (
            <div role="alert" className="grid justify-items-center gap-2 p-8 text-center">
              <p className="text-sm text-tinta-600">No se pudieron cargar los avisos.</p>
              <button
                type="button"
                onClick={onReintentar}
                className="min-h-10 px-3.5 rounded-lg border border-tinta-200 bg-white text-[13px] font-semibold text-tinta-700"
              >
                Reintentar
              </button>
            </div>
          ) : lista.total === null ? (
            <p role="status" className="p-8 text-center text-sm text-tinta-400">
              Cargando avisos…
            </p>
          ) : sinAvisos ? (
            <div className="grid justify-items-center gap-2 px-6 py-12 text-center">
              <span className="w-14 h-14 rounded-full grid place-items-center bg-estado-ok-50 text-estado-ok-700 border border-estado-ok-200">
                <Check className="w-7 h-7" aria-hidden="true" />
              </span>
              <h3 className="font-serif text-2xl text-aurea-navy">{pestana === 'no-leidas' ? '¡Estás al día!' : 'Sin avisos todavía'}</h3>
              <p className="max-w-[30ch] text-sm text-tinta-500">
                {pestana === 'no-leidas'
                  ? 'No tienes avisos pendientes. Si pasa algo en tu turno, aparecerá aquí al instante.'
                  : 'Cuando haya movimiento en tu turno, los avisos quedarán guardados aquí.'}
              </p>
              {pestana === 'no-leidas' && (
                <button
                  type="button"
                  onClick={() => onPestana('todas')}
                  className="mt-1 min-h-10 px-3.5 rounded-lg border border-tinta-200 bg-white text-[13px] font-semibold text-tinta-700"
                >
                  Ver todos los avisos
                </button>
              )}
            </div>
          ) : (
            <>
              {lista.avisos.map((aviso) => (
                <Tarjeta key={aviso.id} aviso={aviso} sede={nombresSede?.[aviso.local_id]} ahora={ahora} onMarcarLeida={onMarcarLeida} />
              ))}
              {hayMas && (
                <button
                  type="button"
                  onClick={onCargarMas}
                  disabled={lista.cargando}
                  className="justify-self-center min-h-10 px-3.5 rounded-lg border border-tinta-200 bg-white text-[13px] font-semibold text-tinta-700 disabled:opacity-60"
                >
                  {lista.cargando ? 'Cargando…' : `Cargar más (${Math.min(POR_PAGINA, (lista.total ?? 0) - lista.avisos.length)})`}
                </button>
              )}
            </>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-tinta-100 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-xs text-tinta-500">
          {canal === 'vivo' ? (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-estado-ok-600" aria-hidden="true" />
              En vivo
            </span>
          ) : canal === 'conectando' ? (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-tinta-300" aria-hidden="true" />
              Conectando…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-semibold text-estado-alerta-700">
              <span className="w-2 h-2 rounded-full bg-estado-alerta-600" aria-hidden="true" />
              Sin conexión en vivo · se revisa cada 30 s
            </span>
          )}
          <span className="ml-auto">
            <kbd className={TECLA}>Esc</kbd> cierra · <kbd className={TECLA}>Alt</kbd>+<kbd className={TECLA}>N</kbd>
          </span>
        </footer>
      </section>
    </>
  );
};
