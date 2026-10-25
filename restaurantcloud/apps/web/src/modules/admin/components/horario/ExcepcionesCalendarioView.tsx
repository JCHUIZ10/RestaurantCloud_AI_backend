import React, { useState, useMemo } from 'react';
import { ExcepcionHorarioDTO } from '@/types/admin';
import { Plus, Trash2, Calendar, Clock, AlertTriangle, Search, CalendarPlus } from 'lucide-react';
import {
  Button,
  CampoBusqueda,
  EstadoVacio,
  IconButton,
  ListaResponsive,
  ModalConfirmacion,
  Paginacion,
  Pestanas,
  type ColumnaTabla,
} from '@/components/ui';
import { cn } from '@/shared/utils';

interface ExcepcionesCalendarioViewProps {
  excepciones: ExcepcionHorarioDTO[];
  onNuevoCierre: () => void;
  onCargarFeriadosPeru?: () => void;
  onEliminarExcepcion: (id: string) => Promise<void>;
}

type Vigencia = 'todos' | 'vigentes' | 'pasados';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const partesFecha = (fechaStr: string) => {
  const [year, month, day] = fechaStr.split('-').map(Number);
  if (!year || !month || !day) return { dia: '', mes: '', semana: '', larga: fechaStr };
  const d = new Date(year, month - 1, day);
  const semana = d.toLocaleDateString('es-PE', { weekday: 'long' });
  return {
    dia: String(day).padStart(2, '0'),
    mes: MESES[month - 1],
    semana: semana.charAt(0).toUpperCase() + semana.slice(1),
    larga: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
  };
};

const TagTipo: React.FC<{ exc: ExcepcionHorarioDTO }> = ({ exc }) =>
  exc.cerrado ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
      Cerrado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="font-mono">
        {exc.hora_inicio || '00:00'}–{exc.hora_fin || '23:59'}
      </span>
    </span>
  );

const Reservas: React.FC<{ exc: ExcepcionHorarioDTO }> = ({ exc }) =>
  exc.reservas_canceladas_count ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md whitespace-nowrap">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
      {exc.reservas_canceladas_count} cancelada{exc.reservas_canceladas_count > 1 ? 's' : ''}
    </span>
  ) : null;

export const ExcepcionesCalendarioView: React.FC<ExcepcionesCalendarioViewProps> = ({
  excepciones,
  onNuevoCierre,
  onCargarFeriadosPeru,
  onEliminarExcepcion,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroVigencia, setFiltroVigencia] = useState<Vigencia>('vigentes');
  const [paginaActual, setPaginaActual] = useState(1);
  const [limite, setLimite] = useState(10);
  const [porEliminar, setPorEliminar] = useState<ExcepcionHorarioDTO | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Fecha de referencia actual en formato ISO (YYYY-MM-DD)
  const hoyISO = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  }, []);

  const totalVigentes = useMemo(() => excepciones.filter((e) => e.fecha >= hoyISO).length, [excepciones, hoyISO]);
  const totalPasados = excepciones.length - totalVigentes;

  // Filtrado en memoria; las próximas primero y las pasadas de la más reciente a la más antigua
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return excepciones
      .filter((exc) => {
        if (filtroVigencia === 'vigentes' && exc.fecha < hoyISO) return false;
        if (filtroVigencia === 'pasados' && exc.fecha >= hoyISO) return false;
        if (!q) return true;
        return exc.motivo.toLowerCase().includes(q) || exc.fecha.includes(q) || partesFecha(exc.fecha).larga.includes(q);
      })
      .sort((a, b) => {
        const aVig = a.fecha >= hoyISO;
        const bVig = b.fecha >= hoyISO;
        if (aVig !== bVig) return aVig ? -1 : 1;
        return aVig ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha);
      });
  }, [excepciones, filtroVigencia, hoyISO, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / limite));
  const pagina = Math.min(paginaActual, totalPaginas);
  const elementosPaginados = filtradas.slice((pagina - 1) * limite, pagina * limite);

  const cambiarVigencia = (v: Vigencia) => {
    setFiltroVigencia(v);
    setPaginaActual(1);
  };
  const cambiarBusqueda = (texto: string) => {
    setBusqueda(texto);
    setPaginaActual(1);
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    try {
      setEliminando(true);
      await onEliminarExcepcion(porEliminar.id);
    } finally {
      setEliminando(false);
      setPorEliminar(null);
    }
  };

  const botonEliminar = (exc: ExcepcionHorarioDTO) => (
    <IconButton variant="danger" icono={Trash2} etiqueta={`Eliminar ${exc.motivo}`} onClick={() => setPorEliminar(exc)} />
  );

  const celdaFecha = (exc: ExcepcionHorarioDTO) => {
    const f = partesFecha(exc.fecha);
    const pasada = exc.fecha < hoyISO;
    return (
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'w-11 h-11 rounded-xl border flex flex-col items-center justify-center shrink-0',
            pasada ? 'bg-tinta-100 border-tinta-200 text-tinta-500' : exc.cerrado ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
          )}
          aria-hidden="true"
        >
          <span className="text-xs uppercase font-bold leading-none">{f.mes}</span>
          <span className="text-base font-bold leading-none mt-0.5">{f.dia}</span>
        </span>
        <div className="min-w-0">
          <span className="font-semibold text-tinta-900 block">{f.larga}</span>
          <span className="text-xs text-tinta-500">
            {f.semana}
            {pasada && ' · pasada'}
          </span>
        </div>
      </div>
    );
  };

  const columnas: ColumnaTabla<ExcepcionHorarioDTO>[] = [
    { id: 'fecha', cabecera: 'Fecha', celda: celdaFecha },
    { id: 'motivo', cabecera: 'Motivo', celda: (exc) => <span className="font-medium text-tinta-900">{exc.motivo}</span> },
    { id: 'tipo', cabecera: 'Atención', celda: (exc) => <TagTipo exc={exc} /> },
    { id: 'reservas', cabecera: 'Reservas', celda: (exc) => (exc.reservas_canceladas_count ? <Reservas exc={exc} /> : <span className="text-tinta-400">—</span>) },
    { id: 'acciones', cabecera: <span className="sr-only">Acciones</span>, alinear: 'derecha', celda: botonEliminar },
  ];

  const tarjeta = (exc: ExcepcionHorarioDTO) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        {celdaFecha(exc)}
        {botonEliminar(exc)}
      </div>
      <p className="text-sm font-medium text-tinta-900">{exc.motivo}</p>
      <div className="flex flex-wrap items-center gap-2">
        <TagTipo exc={exc} />
        <Reservas exc={exc} />
      </div>
    </div>
  );

  const cabecera = (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <Pestanas
        etiqueta="Filtrar por fecha"
        valor={filtroVigencia}
        onCambiar={cambiarVigencia}
        opciones={[
          { valor: 'vigentes', etiqueta: 'Próximas', conteo: totalVigentes, punto: 'bg-emerald-500' },
          { valor: 'pasados', etiqueta: 'Pasadas', conteo: totalPasados, punto: 'bg-tinta-400' },
          { valor: 'todos', etiqueta: 'Todas', conteo: excepciones.length },
        ]}
      />
      <CampoBusqueda
        valor={busqueda}
        onCambiar={cambiarBusqueda}
        placeholder="Buscar motivo o fecha"
        etiqueta="Buscar feriados y cierres"
        className="lg:flex-1 lg:max-w-xs"
      />
      <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
        {onCargarFeriadosPeru && (
          <Button variant="outline" onClick={onCargarFeriadosPeru} className="w-full sm:w-auto">
            <CalendarPlus className="w-4 h-4 text-red-600" aria-hidden="true" />
            Cargar feriados nacionales
          </Button>
        )}
        <Button onClick={onNuevoCierre} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva fecha
        </Button>
      </div>
    </div>
  );

  const vacio =
    filtradas.length > 0 ? undefined : busqueda.trim() ? (
      <EstadoVacio icono={Search} titulo="Nada coincide con la búsqueda" descripcion="Prueba con otro motivo o fecha." />
    ) : (
      <EstadoVacio
        icono={Calendar}
        titulo={filtroVigencia === 'pasados' ? 'Sin fechas pasadas' : 'Sin feriados ni cierres programados'}
        descripcion={filtroVigencia === 'pasados' ? undefined : 'Los días registrados aquí reemplazan al horario semanal.'}
      />
    );

  return (
    <>
      <ListaResponsive
        etiqueta="Feriados y cierres"
        filas={elementosPaginados}
        columnas={columnas}
        claveFila={(e) => e.id}
        claseFila={(e) => (e.fecha < hoyISO ? 'bg-tinta-50/60' : undefined)}
        cabecera={cabecera}
        tarjeta={tarjeta}
        vacio={vacio}
        pie={
          <Paginacion
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalRegistros={filtradas.length}
            limite={limite}
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(l) => {
              setLimite(l);
              setPaginaActual(1);
            }}
            unidad="fechas"
          />
        }
      />

      <ModalConfirmacion
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="¿Eliminar esta fecha?"
        mensaje={
          porEliminar && (
            <>
              <strong>{porEliminar.motivo}</strong> ({partesFecha(porEliminar.fecha).larga}). Ese día volverá a regirse por el horario
              semanal. Las reservas ya canceladas no se restauran.
            </>
          )
        }
        textoConfirmar="Eliminar"
        cargando={eliminando}
      />
    </>
  );
};
