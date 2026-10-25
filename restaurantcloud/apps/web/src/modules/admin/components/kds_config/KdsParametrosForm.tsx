import React from 'react';
import {
  Minus,
  Plus,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Save,
  LayoutGrid,
  ListOrdered,
  Clock,
  Bell,
  Siren,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { ConfiguracionKdsDTO } from '@/types/admin';
import { Button } from '@/components/ui';
import { cn } from '@/shared/utils';

interface KdsParametrosFormProps {
  config: ConfiguracionKdsDTO;
  onChange: (nuevaConfig: ConfiguracionKdsDTO) => void;
  onGuardar: () => void;
  onDescartar: () => void;
  onRestaurarDefaults: () => void;
  onTestAudio: (tipo: 'chime' | 'alarma') => void;
  isDirty: boolean;
  isGuardando: boolean;
  errorValidacion: string | null;
}

type CampoNumerico = 'tiempo_optimo_verde_min' | 'tiempo_alerta_ambar_min' | 'tiempo_maximo_pase_min' | 'intervalo_sonido_rojo_seg';

const Seccion: React.FC<{ icono: LucideIcon; titulo: string; descripcion: string; children: React.ReactNode }> = ({
  icono: Icono,
  titulo,
  descripcion,
  children,
}) => (
  <section className="px-4 sm:px-6 py-5 space-y-4 border-b border-tinta-100 last-of-type:border-b-0">
    <header>
      <h2 className="flex items-center gap-2 text-lg font-serif font-bold text-aurea-navy">
        <Icono className="w-5 h-5 text-aurea-copper shrink-0" aria-hidden="true" />
        {titulo}
      </h2>
      <p className="text-sm text-tinta-500 mt-0.5">{descripcion}</p>
    </header>
    {children}
  </section>
);

interface ContadorProps {
  id: string;
  rotulo: React.ReactNode;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  unidad: string;
  ayuda: React.ReactNode;
  invalido?: boolean;
  foco: string;
  caja: string;
  onCambiar: (valor: number) => void;
}

const Contador: React.FC<ContadorProps> = ({ id, rotulo, valor, min, max, paso = 1, unidad, ayuda, invalido, foco, caja, onCambiar }) => {
  const acotar = (n: number) => Math.min(max, Math.max(min, n));
  const claseBoton =
    'w-12 h-12 shrink-0 rounded-xl bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-sm transition-all';

  return (
    <div className={cn('p-4 rounded-xl border', caja)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label htmlFor={id} className="text-sm font-semibold flex items-center gap-1.5">
          {rotulo}
        </label>
        <span className="text-xs font-mono text-tinta-500 whitespace-nowrap">
          {min}–{max} {unidad}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onCambiar(acotar(valor - paso))} disabled={valor <= min} aria-label="Disminuir" className={claseBoton}>
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="relative flex-1 min-w-0">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={paso}
            value={valor}
            aria-invalid={invalido || undefined}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n)) onCambiar(acotar(n));
            }}
            className={cn(
              'w-full h-12 pr-10 text-center text-2xl font-mono font-bold bg-white rounded-xl border text-tinta-800 focus:outline-none focus:ring-2',
              invalido ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-rose-500' : cn('border-tinta-300', foco)
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tinta-400 pointer-events-none">{unidad}</span>
        </div>
        <button type="button" onClick={() => onCambiar(acotar(valor + paso))} disabled={valor >= max} aria-label="Aumentar" className={claseBoton}>
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-tinta-600 mt-2">{ayuda}</p>
    </div>
  );
};

interface AlertaSonoraProps {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  activo: boolean;
  tono: 'emerald' | 'red';
  onProbar: () => void;
  onCambiar: () => void;
  children?: React.ReactNode;
}

const TONO_ALERTA = {
  emerald: { icono: 'bg-emerald-100 text-emerald-700', probar: 'text-emerald-600', on: 'bg-emerald-600', foco: 'focus-visible:ring-emerald-500' },
  red: { icono: 'bg-red-100 text-red-700', probar: 'text-red-600', on: 'bg-red-600', foco: 'focus-visible:ring-red-500' },
};

const AlertaSonora: React.FC<AlertaSonoraProps> = ({ icono: Icono, titulo, descripcion, activo, tono, onProbar, onCambiar, children }) => {
  const t = TONO_ALERTA[tono];
  return (
    <div className="p-4 rounded-xl border border-tinta-200 bg-tinta-50/50">
      <div className="flex items-start gap-3">
        <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', t.icono)} aria-hidden="true">
          <Icono className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-tinta-800">{titulo}</p>
          <p className="text-xs text-tinta-500 mt-0.5">{descripcion}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label={titulo}
          onClick={onCambiar}
          className={cn('-my-2 -mr-1 min-h-tactil min-w-tactil px-1 flex items-center justify-center rounded-xl shrink-0 focus:outline-none focus-visible:ring-2', t.foco)}
        >
          <span className={cn('w-12 h-6 rounded-full transition-colors flex items-center', activo ? t.on : 'bg-tinta-300')}>
            <span className={cn('w-4 h-4 rounded-full bg-white shadow-md transition-transform', activo ? 'translate-x-7' : 'translate-x-1')} />
          </span>
        </button>
      </div>
      <div className="mt-3 pl-12 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onProbar}
          className="min-h-tactil px-3 rounded-lg bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-100 active:scale-95 text-sm font-medium inline-flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Volume2 className={cn('w-4 h-4', t.probar)} aria-hidden="true" />
          Probar
        </button>
        {children}
      </div>
    </div>
  );
};

const VISTAS: Array<{ valor: ConfiguracionKdsDTO['vista_predeterminada']; icono: LucideIcon; titulo: string; texto: string }> = [
  { valor: 'fifo', icono: LayoutGrid, titulo: 'Por mesa, en orden de llegada', texto: 'Cada comanda en su tarjeta; la más antigua primero.' },
  { valor: 'all_day', icono: ListOrdered, titulo: 'Consolidado de producción', texto: 'Suma los platos pendientes por partida para cocinar en lote.' },
];

export const KdsParametrosForm: React.FC<KdsParametrosFormProps> = ({
  config,
  onChange,
  onGuardar,
  onDescartar,
  onRestaurarDefaults,
  onTestAudio,
  isDirty,
  isGuardando,
  errorValidacion,
}) => {
  const fijar = (campo: CampoNumerico) => (valor: number) => onChange({ ...config, [campo]: valor });
  const verde = config.tiempo_optimo_verde_min;
  const ambar = config.tiempo_alerta_ambar_min;
  const intervalo = config.intervalo_sonido_rojo_seg;

  return (
    <div className="bg-white rounded-2xl border border-tinta-200 shadow-sm">
      <Seccion icono={Clock} titulo="Semáforo de comandas" descripcion="Minutos de espera en que cada comanda cambia de color en la pantalla de cocina.">
        {errorValidacion && (
          <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            {errorValidacion}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Contador
            id="kds-verde"
            rotulo={
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="text-emerald-800">Verde hasta</span>
              </>
            }
            valor={verde}
            min={3}
            max={60}
            unidad="min"
            caja="bg-emerald-50/50 border-emerald-200"
            foco="focus:ring-emerald-500"
            ayuda={<>A tiempo: hasta {verde} min de espera.</>}
            onCambiar={fijar('tiempo_optimo_verde_min')}
          />
          <Contador
            id="kds-ambar"
            rotulo={
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                <span className="text-amber-800">Ámbar hasta</span>
              </>
            }
            valor={ambar}
            min={5}
            max={120}
            unidad="min"
            invalido={Boolean(errorValidacion)}
            caja="bg-amber-50/50 border-amber-200"
            foco="focus:ring-amber-500"
            ayuda={ambar > verde ? <>Se retrasa: de {verde + 1} a {ambar} min.</> : 'Debe ser mayor que el verde.'}
            onCambiar={fijar('tiempo_alerta_ambar_min')}
          />
        </div>

        <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
          <span>
            <strong>Rojo</strong> a partir de los {ambar + 1} min: la comanda parpadea y sube al primer lugar.
          </span>
        </p>
      </Seccion>

      <Seccion icono={UtensilsCrossed} titulo="Platos listos en el pase" descripcion="Cuánto puede esperar un plato terminado antes de avisar al mozo.">
        <div className="sm:max-w-sm">
          <Contador
            id="kds-pase"
            rotulo={<span className="text-tinta-700">Espera máxima</span>}
            valor={config.tiempo_maximo_pase_min}
            min={1}
            max={30}
            unidad="min"
            caja="bg-orange-50/50 border-orange-200"
            foco="focus:ring-aurea-copper"
            ayuda={<>Pasados {config.tiempo_maximo_pase_min} min, el plato parpadea en la tablet del mozo.</>}
            onCambiar={fijar('tiempo_maximo_pase_min')}
          />
        </div>
      </Seccion>

      <Seccion icono={Volume2} titulo="Sonidos y pantalla" descripcion="Avisos sonoros de la pantalla de cocina y la vista con la que abre.">
        <AlertaSonora
          icono={Bell}
          tono="emerald"
          titulo="Timbre al llegar una comanda"
          descripcion="Suena una vez cada vez que salón envía un pedido."
          activo={config.alerta_sonora_nueva_comanda}
          onProbar={() => onTestAudio('chime')}
          onCambiar={() => onChange({ ...config, alerta_sonora_nueva_comanda: !config.alerta_sonora_nueva_comanda })}
        />

        <AlertaSonora
          icono={Siren}
          tono="red"
          titulo="Alarma con comandas en rojo"
          descripcion="Se repite mientras haya al menos una comanda en rojo."
          activo={config.alerta_sonora_comanda_roja}
          onProbar={() => onTestAudio('alarma')}
          onCambiar={() => onChange({ ...config, alerta_sonora_comanda_roja: !config.alerta_sonora_comanda_roja })}
        >
          {config.alerta_sonora_comanda_roja && (
            <div className="flex items-center gap-2" role="group" aria-label="Repetir la alarma cada">
              <span className="text-sm text-tinta-600">Cada</span>
              <button
                type="button"
                onClick={() => fijar('intervalo_sonido_rojo_seg')(Math.max(15, intervalo - 15))}
                disabled={intervalo <= 15}
                aria-label="15 segundos menos"
                className="w-11 h-11 rounded-lg bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-100 active:scale-95 disabled:opacity-30 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-sm font-mono font-bold w-12 text-center text-tinta-800" aria-live="polite">
                {intervalo} s
              </span>
              <button
                type="button"
                onClick={() => fijar('intervalo_sonido_rojo_seg')(Math.min(300, intervalo + 15))}
                disabled={intervalo >= 300}
                aria-label="15 segundos más"
                className="w-11 h-11 rounded-lg bg-white border border-tinta-300 text-tinta-700 hover:bg-tinta-100 active:scale-95 disabled:opacity-30 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </AlertaSonora>

        <fieldset>
          <legend className="text-sm font-semibold text-tinta-700 mb-2">Vista al abrir la pantalla de cocina</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VISTAS.map(({ valor, icono: Icono, titulo, texto }) => {
              const elegida = config.vista_predeterminada === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={elegida}
                  onClick={() => onChange({ ...config, vista_predeterminada: valor })}
                  className={cn(
                    'p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all',
                    elegida ? 'border-aurea-copper bg-amber-50/40 ring-2 ring-aurea-copper/20' : 'border-tinta-200 bg-white hover:border-tinta-300'
                  )}
                >
                  <Icono className={cn('w-5 h-5 shrink-0 mt-0.5', elegida ? 'text-aurea-copper' : 'text-tinta-400')} aria-hidden="true" />
                  <span>
                    <span className="text-sm font-bold text-tinta-800 block">{titulo}</span>
                    <span className="text-xs text-tinta-500 block mt-0.5">{texto}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </Seccion>

      <div
        className={cn(
          'px-4 sm:px-6 py-4 border-t border-tinta-200 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2',
          isDirty && 'sticky bottom-0 bg-white/95 backdrop-blur-sm'
        )}
      >
        <Button variant="ghost" onClick={onRestaurarDefaults} disabled={isGuardando} className="w-full sm:w-auto">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Valores recomendados
        </Button>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {isDirty && (
            <Button variant="outline" onClick={onDescartar} disabled={isGuardando} className="w-full sm:w-auto">
              Descartar
            </Button>
          )}
          <button
            type="button"
            onClick={onGuardar}
            disabled={!isDirty || Boolean(errorValidacion) || isGuardando}
            className="w-full sm:w-auto min-h-tactil px-6 rounded-xl bg-aurea-copper text-aurea-navy hover:bg-aurea-copper/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            {isGuardando ? (
              <>
                <span className="w-4 h-4 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
