import React, { useState } from 'react';
import { NotificacionContactoDTO, ReservaConflictoDTO } from '@/types/admin';
import { AlertTriangle, MessageCircle, Phone, Armchair } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

type MetodoAviso = NotificacionContactoDTO['metodo_notificacion'];

interface ModalConflictoReservasProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  descripcion: string;
  /** Explica qué pasará al confirmar. */
  intro: string;
  textoConfirmar: string;
  reservas: ReservaConflictoDTO[];
  /** Recibe la decisión de aviso de cada reserva; se pide una por reserva, nunca por omisión. */
  onConfirmar: (avisos: NotificacionContactoDTO[]) => Promise<void>;
  loading: boolean;
}

const OPCIONES: { valor: MetodoAviso; etiqueta: string }[] = [
  { valor: 'whatsapp', etiqueta: 'WhatsApp' },
  { valor: 'llamada', etiqueta: 'Llamada' },
  { valor: 'presencial', etiqueta: 'Presencial' },
  { valor: 'ninguno', etiqueta: 'No se pudo avisar' },
];

/** Fecha y hora tal como las envía el API (ya en la hora local del restaurante). */
const fechaYHora = (iso: string) => {
  const [fecha, resto = ''] = iso.split('T');
  const [anio, mes, dia] = fecha.split('-');
  return { fecha: anio && mes && dia ? `${dia}/${mes}` : fecha, hora: resto.slice(0, 5) };
};

/**
 * Lista las reservas que no podrán atenderse y exige decidir, para cada una, si el cliente fue avisado
 * (y por qué medio) o si no se pudo avisar. Ninguna reserva se cancela sin esa decisión.
 * Se monta de nuevo (key) cada vez que cambia la lista, para que las decisiones empiecen vacías.
 */
export const ModalConflictoReservas: React.FC<ModalConflictoReservasProps> = ({
  isOpen,
  onClose,
  titulo,
  descripcion,
  intro,
  textoConfirmar,
  reservas,
  onConfirmar,
  loading,
}) => {
  const [decisiones, setDecisiones] = useState<Record<string, MetodoAviso | undefined>>({});

  const decididas = reservas.filter((r) => decisiones[r.id] !== undefined).length;
  const sinAviso = reservas.filter((r) => decisiones[r.id] === 'ninguno').length;
  const todasDecididas = reservas.length > 0 && decididas === reservas.length;
  const totalPax = reservas.reduce((acc, r) => acc + r.num_personas, 0);

  const decidir = (id: string, metodo: MetodoAviso) => setDecisiones((prev) => ({ ...prev, [id]: metodo }));

  const marcarTodasPorWhatsApp = () => {
    const mapa: Record<string, MetodoAviso> = {};
    reservas.forEach((r) => {
      mapa[r.id] = 'whatsapp';
    });
    setDecisiones(mapa);
  };

  const handleConfirmar = async () => {
    if (!todasDecididas) return;
    await onConfirmar(
      reservas.map((r) => {
        const metodo = decisiones[r.id] as MetodoAviso;
        return { reserva_id: r.id, notificado: metodo !== 'ninguno', metodo_notificacion: metodo };
      })
    );
  };

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!loading}
      tamano="lg"
      tono="alerta"
      icono={AlertTriangle}
      titulo={titulo}
      descripcion={descripcion}
      barra={
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
          <span className={cn('font-semibold', todasDecididas ? 'text-emerald-700' : 'text-amber-800')}>
            {decididas} de {reservas.length} con decisión
            {sinAviso > 0 && <span className="text-red-700"> · {sinAviso} sin aviso</span>}
          </span>
          <button
            type="button"
            onClick={marcarTodasPorWhatsApp}
            disabled={loading}
            className="min-h-tactil px-2 text-sm font-semibold text-aurea-copper hover:underline disabled:opacity-50"
          >
            Marcar todas como avisadas por WhatsApp
          </button>
        </div>
      }
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Volver
          </Button>
          <Button variant="danger" onClick={handleConfirmar} disabled={!todasDecididas} loading={loading}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-tinta-700">
          {intro} Hay {totalPax} {totalPax === 1 ? 'comensal' : 'comensales'} con reserva. Avisa a cada cliente y elige
          cómo lo hiciste; si no lo lograste, márcalo como «No se pudo avisar» para que quede registrado.
        </p>

        <ul className="space-y-2.5">
          {reservas.map((res) => {
            const { fecha, hora } = fechaYHora(res.fecha_hora);
            const decision = decisiones[res.id];
            const avisada = decision !== undefined && decision !== 'ninguno';

            return (
              <li
                key={res.id}
                className={cn(
                  'p-3 sm:p-4 rounded-xl border transition-colors space-y-3',
                  decision === undefined && 'bg-white border-tinta-200',
                  avisada && 'bg-emerald-50/50 border-emerald-300',
                  decision === 'ninguno' && 'bg-red-50/50 border-red-300'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-tinta-900">{res.cliente_nombre}</span>
                      <span className="px-2 py-0.5 bg-tinta-100 text-tinta-700 rounded-md text-xs font-semibold">
                        {res.num_personas} pers.
                      </span>
                      <span className="font-mono text-xs text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-md">
                        {fecha} · {hora}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                        {res.cliente_telefono}
                      </span>
                      {res.mesas_asignadas.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5" aria-hidden="true" />
                          {res.mesas_asignadas.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={res.link_whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-tactil px-3 inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    Escribir
                  </a>
                </div>

                <div role="radiogroup" aria-label={`¿Cómo se avisó a ${res.cliente_nombre}?`} className="flex flex-wrap gap-1.5">
                  {OPCIONES.map((opcion) => {
                    const activa = decision === opcion.valor;
                    return (
                      <button
                        key={opcion.valor}
                        type="button"
                        role="radio"
                        aria-checked={activa}
                        onClick={() => decidir(res.id, opcion.valor)}
                        className={cn(
                          'min-h-tactil px-3 rounded-lg border text-sm font-semibold transition-colors',
                          activa && opcion.valor !== 'ninguno' && 'bg-emerald-600 border-emerald-600 text-white',
                          activa && opcion.valor === 'ninguno' && 'bg-red-600 border-red-600 text-white',
                          !activa && 'bg-white border-tinta-300 text-tinta-700 hover:bg-tinta-100'
                        )}
                      >
                        {opcion.etiqueta}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
};
