import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  MesaDisponibleReservaDTO,
  CrearReservaRequestDTO,
  FranjaReservaDTO,
  JornadaReservaDTO,
  TurnoReserva,
} from '@/types/mozo';
import { mozoService } from '@/services/serviceAdapter';
import { formatearTelefonoPeru, extraerDigitosMovilPeru } from '@/shared/utils/whatsapp';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import { hoyLocalStr, sumarDiasStr } from '@/shared/utils/fechaLocal';

interface ModalNuevaReservaProps {
  abierto: boolean;
  /** Fecha que se está viendo en la bandeja (valor inicial del formulario). */
  fechaInicial: string;
  turnoInicial: TurnoReserva;
  /** Jornada en curso según el servidor (botón "Hoy" y fecha mínima). */
  fechaOperativa: string;
  maxDiasAnticipacion: number;
  onCerrar: () => void;
  /** Devuelve true si la reserva se registró; solo entonces se cierra el modal. */
  onConfirmar: (reserva: CrearReservaRequestDTO) => Promise<boolean>;
}

const ETIQUETA_TURNO: Record<TurnoReserva, string> = { almuerzo: 'Almuerzo', cena: 'Cena' };
const MARGEN_HORA_PASADA_MS = 5 * 60 * 1000;

/** Una franja ya pasada no se ofrece (el backend la rechazaría). */
const franjaVigente = (franja: FranjaReservaDTO): boolean =>
  new Date(franja.fecha_hora).getTime() >= Date.now() - MARGEN_HORA_PASADA_MS;

export const ModalNuevaReserva: React.FC<ModalNuevaReservaProps> = ({
  abierto,
  fechaInicial,
  turnoInicial,
  fechaOperativa,
  maxDiasAnticipacion,
  onCerrar,
  onConfirmar,
}) => {
  // Paso 1: Fecha, franja y comensales
  const [fecha, setFecha] = useState(fechaInicial);
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<FranjaReservaDTO | null>(null);
  const [numPersonas, setNumPersonas] = useState(2);
  const [jornada, setJornada] = useState<JornadaReservaDTO | null>(null);
  const [cargandoJornada, setCargandoJornada] = useState(false);

  // Paso 2: Mini-mapa
  const [mesasMapa, setMesasMapa] = useState<MesaDisponibleReservaDTO[]>([]);
  const [bloqueoHorario, setBloqueoHorario] = useState<string | null>(null);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [mesasSeleccionadasIds, setMesasSeleccionadasIds] = useState<string[]>([]);

  // Paso 3: Datos del cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Descarta respuestas de consultas que ya no corresponden a la selección actual
  const peticionJornadaRef = useRef(0);
  const peticionMesasRef = useRef(0);

  const fechaMaxima = sumarDiasStr(hoyLocalStr(), maxDiasAnticipacion);
  const fechaManana = sumarDiasStr(fechaOperativa, 1);

  // Al abrir: formulario limpio en la fecha de la bandeja
  useEffect(() => {
    if (!abierto) return;
    setFecha(fechaInicial);
    setFranjaSeleccionada(null);
    setNumPersonas(2);
    setMesasMapa([]);
    setMesasSeleccionadasIds([]);
    setBloqueoHorario(null);
    setClienteNombre('');
    setClienteTelefono('');
    setNotas('');
    setErrorValidacion(null);
  }, [abierto, fechaInicial]);

  // Jornada (turnos, franjas, feriados y excepciones) de la fecha elegida
  useEffect(() => {
    if (!abierto || !fecha) return;
    const peticion = ++peticionJornadaRef.current;
    setCargandoJornada(true);
    setJornada(null);
    mozoService
      .obtenerPoliticasReserva(fecha)
      .then((res) => {
        if (peticion !== peticionJornadaRef.current) return;
        if (res.exito && res.datos) {
          setJornada(res.datos.jornada);
        } else {
          setErrorValidacion('No se pudo consultar el horario de atención de la fecha.');
        }
      })
      .catch((error) => {
        if (peticion !== peticionJornadaRef.current) return;
        setErrorValidacion(mensajeDeErrorApi(error, 'No se pudo consultar el horario de atención de la fecha.'));
      })
      .finally(() => {
        if (peticion === peticionJornadaRef.current) setCargandoJornada(false);
      });
  }, [abierto, fecha]);

  // Franjas vigentes por turno según el horario real
  const franjasPorTurno = useMemo(() => {
    const resultado: Record<TurnoReserva, FranjaReservaDTO[]> = { almuerzo: [], cena: [] };
    if (!jornada) return resultado;
    (Object.keys(resultado) as TurnoReserva[]).forEach((turno) => {
      resultado[turno] = (jornada.turnos[turno]?.franjas ?? []).filter(franjaVigente);
    });
    return resultado;
  }, [jornada]);

  // Mantener la franja elegida si sigue disponible; si no, proponer la primera del turno de la bandeja
  useEffect(() => {
    if (!jornada) return;
    const todas = [...franjasPorTurno.almuerzo, ...franjasPorTurno.cena];
    setFranjaSeleccionada((actual) => {
      if (actual && todas.some((f) => f.fecha_hora === actual.fecha_hora)) return actual;
      return franjasPorTurno[turnoInicial][0] ?? todas[0] ?? null;
    });
  }, [jornada, franjasPorTurno, turnoInicial]);

  // Disponibilidad de mesas para la franja y el aforo
  useEffect(() => {
    if (!abierto || !franjaSeleccionada) {
      setMesasMapa([]);
      setMesasSeleccionadasIds([]);
      setBloqueoHorario(null);
      return;
    }
    const peticion = ++peticionMesasRef.current;
    const fechaFranja = franjaSeleccionada.fecha_hora.slice(0, 10);
    setCargandoMesas(true);
    mozoService
      .obtenerMesasDisponiblesReserva(fechaFranja, franjaSeleccionada.hora, numPersonas)
      .then((res) => {
        if (peticion !== peticionMesasRef.current || !res.exito || !res.datos) return;
        const mesas = res.datos.mesas;
        setMesasMapa(mesas);
        setBloqueoHorario(res.datos.bloqueo_horario ?? null);
        setMesasSeleccionadasIds((prev) => {
          const vigentes = prev.filter((id) => mesas.some((m) => m.mesa_id === id && m.disponible));
          if (vigentes.length > 0) return vigentes;
          const primeraLibre =
            mesas.find((m) => m.disponible && m.capacidad >= numPersonas) || mesas.find((m) => m.disponible);
          return primeraLibre ? [primeraLibre.mesa_id] : [];
        });
      })
      .catch((error) => {
        if (peticion !== peticionMesasRef.current) return;
        setMesasMapa([]);
        setErrorValidacion(mensajeDeErrorApi(error, 'No se pudo consultar la disponibilidad de mesas.'));
      })
      .finally(() => {
        if (peticion === peticionMesasRef.current) setCargandoMesas(false);
      });
  }, [abierto, franjaSeleccionada, numPersonas]);

  if (!abierto) return null;

  const handleToggleMesa = (mesa: MesaDisponibleReservaDTO) => {
    if (!mesa.disponible) return;

    if (mesasSeleccionadasIds.includes(mesa.mesa_id)) {
      if (mesasSeleccionadasIds.length > 1) {
        setMesasSeleccionadasIds(mesasSeleccionadasIds.filter((id) => id !== mesa.mesa_id));
      }
    } else if (mesa.capacidad >= numPersonas) {
      // Una mesa con capacidad suficiente reemplaza la selección
      setMesasSeleccionadasIds([mesa.mesa_id]);
    } else {
      // Si no alcanza, se agrupan mesas
      setMesasSeleccionadasIds([...mesasSeleccionadasIds, mesa.mesa_id]);
    }
  };

  const handleConfirmarSubmit = async () => {
    setErrorValidacion(null);
    if (clienteNombre.trim().length < 3) {
      setErrorValidacion('Por favor ingresa el nombre completo del cliente (mínimo 3 caracteres).');
      return;
    }

    const digitosMovil = extraerDigitosMovilPeru(clienteTelefono);
    if (digitosMovil.length !== 9) {
      setErrorValidacion('Por favor ingresa un teléfono móvil de Perú válido (9 dígitos, ej. 987 654 321).');
      return;
    }
    if (!digitosMovil.startsWith('9')) {
      setErrorValidacion('El número celular debe iniciar con el dígito 9 (formato móvil Perú).');
      return;
    }

    if (!franjaSeleccionada) {
      setErrorValidacion('Selecciona una hora de llegada dentro del horario de atención.');
      return;
    }

    if (mesasSeleccionadasIds.length === 0) {
      setErrorValidacion('Debes seleccionar al menos una mesa en el mini-mapa de salón.');
      return;
    }

    setGuardando(true);
    try {
      const ok = await onConfirmar({
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: `+51 ${formatearTelefonoPeru(digitosMovil)}`,
        // Hora local del local, sin desfase: el backend la interpreta en su zona horaria
        fecha_hora: franjaSeleccionada.fecha_hora,
        num_personas: numPersonas,
        mesa_ids: mesasSeleccionadasIds,
        notas: notas.trim() || undefined,
      });
      if (ok) onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  // Resumen de mesas seleccionadas
  const mesasElegidas = mesasMapa.filter((m) => mesasSeleccionadasIds.includes(m.mesa_id));
  const capacidadTotal = mesasElegidas.reduce((acc, m) => acc + m.capacidad, 0);
  const etiquetaMesas =
    mesasElegidas.length > 1
      ? `Mesa [ ${mesasElegidas.map((m) => m.numero).join(' ; ')} ]`
      : mesasElegidas.length === 1
      ? `Mesa ${mesasElegidas[0].numero}`
      : 'Ninguna';

  const diaCerrado = jornada !== null && !jornada.atiende;
  const sinFranjas =
    jornada !== null && jornada.atiende && franjasPorTurno.almuerzo.length === 0 && franjasPorTurno.cena.length === 0;
  const puedeConfirmar =
    !guardando && !diaCerrado && !bloqueoHorario && franjaSeleccionada !== null && mesasSeleccionadasIds.length > 0;

  const botonFecha = (valor: string, etiqueta: string) => (
    <button
      type="button"
      onClick={() => setFecha(valor)}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        fecha === valor
          ? 'bg-aurea-navy text-white border-aurea-navy'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '760px' }}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-aurea-navy text-white flex items-center justify-between border-b border-aurea-copper/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne">
              Asignación de Mesa • Recepción
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
              <span>📅 Registrar Nueva Reserva de Salón</span>
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* PASO 1: Fecha, Hora y Personas */}
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-aurea-navy text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              <span>Fecha, Hora y Comensales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fecha */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fecha del Servicio:
                </label>
                <div className="flex items-center gap-1.5">
                  {botonFecha(fechaOperativa, 'Hoy')}
                  {botonFecha(fechaManana, 'Mañana')}
                  <input
                    type="date"
                    value={fecha}
                    min={fechaOperativa}
                    max={fechaMaxima}
                    onChange={(e) => e.target.value && setFecha(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Comensales Stepper */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Comensales (PAX):
                </label>
                <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setNumPersonas(Math.max(1, numPersonas - 1))}
                    className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-serif text-base font-bold text-slate-900">
                    {numPersonas} {numPersonas === 1 ? 'persona' : 'personas'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNumPersonas(Math.min(50, numPersonas + 1))}
                    className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Franjas horarias según el horario real del local */}
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hora de Llegada:
              </label>

              {cargandoJornada ? (
                <div className="text-slate-400 py-2">Consultando horario de atención...</div>
              ) : diaCerrado ? (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {jornada?.cerrado_por_excepcion
                      ? `Local cerrado esta fecha: ${jornada.motivo_excepcion}`
                      : 'El local no atiende en esta fecha según su horario semanal.'}
                  </span>
                </div>
              ) : sinFranjas ? (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                  Ya no quedan horas de llegada disponibles para esta fecha. Elige otro día.
                </div>
              ) : (
                <div className="space-y-2">
                  {jornada?.es_horario_especial && (
                    <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Horario especial: {jornada.motivo_excepcion}</span>
                    </div>
                  )}
                  {(Object.keys(ETIQUETA_TURNO) as TurnoReserva[]).map((turno) => {
                    const datosTurno = jornada?.turnos[turno];
                    const franjas = franjasPorTurno[turno];
                    if (!datosTurno || franjas.length === 0) return null;
                    return (
                      <div key={turno}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          {ETIQUETA_TURNO[turno]} · {datosTurno.inicio} a {datosTurno.fin}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {franjas.map((franja) => {
                            const activa = franjaSeleccionada?.fecha_hora === franja.fecha_hora;
                            return (
                              <button
                                key={franja.fecha_hora}
                                type="button"
                                onClick={() => setFranjaSeleccionada(franja)}
                                className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
                                  activa
                                    ? 'bg-aurea-copper text-aurea-navy font-bold shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {franja.hora}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* PASO 2: Mini-Mapa de Salón */}
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-aurea-navy text-white text-[10px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>Mini-Mapa de Salón — Selecciona la Mesa</span>
              </h3>
              {mesasMapa.length > 0 && (
                <span className="text-[11px] text-slate-500">{mesasMapa.length} mesas</span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Las mesas atenuadas no están disponibles en la hora elegida. Toca una mesa libre para asignarla:
            </p>

            {bloqueoHorario ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                {bloqueoHorario}
              </div>
            ) : !franjaSeleccionada ? (
              <div className="p-6 text-center text-slate-400">Elige una hora de llegada para ver las mesas.</div>
            ) : cargandoMesas ? (
              <div className="p-8 text-center text-slate-400">Consultando disponibilidad de salón...</div>
            ) : mesasMapa.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No hay mesas activas registradas en el salón.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
                {mesasMapa.map((mesa) => {
                  const seleccionada = mesasSeleccionadasIds.includes(mesa.mesa_id);
                  return (
                    <button
                      key={mesa.mesa_id}
                      type="button"
                      onClick={() => handleToggleMesa(mesa)}
                      disabled={!mesa.disponible}
                      title={mesa.motivo_bloqueo ?? undefined}
                      className={`p-2 sm:p-2.5 rounded-xl border-2 flex flex-col justify-between text-left transition-all min-h-[74px] touch-manipulation ${
                        seleccionada
                          ? 'bg-aurea-navy text-white border-aurea-copper ring-2 ring-aurea-copper/40 shadow-sm'
                          : mesa.disponible
                          ? 'bg-white hover:bg-emerald-50 text-slate-800 border-emerald-400/80 shadow-2xs cursor-pointer'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            seleccionada ? 'text-aurea-champagne' : 'text-slate-400'
                          }`}
                        >
                          Mesa
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                            seleccionada
                              ? 'bg-aurea-copper text-aurea-navy'
                              : mesa.disponible
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {seleccionada ? '✓ ELEGIDA' : mesa.disponible ? 'LIBRE' : 'NO DISP.'}
                        </span>
                      </div>

                      <div className="font-serif text-lg font-bold my-0.5">{mesa.numero}</div>

                      <div className={`text-[10px] truncate ${seleccionada ? 'text-slate-200' : 'text-slate-500'}`}>
                        {!mesa.disponible && mesa.motivo_bloqueo ? mesa.motivo_bloqueo : `Cap: ${mesa.capacidad}p`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Resumen de Asignación */}
            <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>
                  Mesa seleccionada: <strong>{etiquetaMesas}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">
                  Capacidad total: <strong>{capacidadTotal} personas</strong>
                </span>
              </div>
              {mesasElegidas.length > 0 && capacidadTotal < numPersonas && (
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚠️ Capacidad menor al aforo ({numPersonas}p requeridos)
                </span>
              )}
            </div>
          </section>

          {/* PASO 3: Ficha del Comensal */}
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-aurea-navy text-white text-[10px] flex items-center justify-center font-bold">
                3
              </span>
              <span>Ficha de Contacto del Comensal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nombre Completo / Titular: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Ej. Familia Gómez o Carlos Alva"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-aurea-copper focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Teléfono Móvil (WhatsApp Perú): <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex rounded-lg shadow-2xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-2 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-mono font-semibold select-none">
                    <span>🇵🇪</span>
                    <span>+51</span>
                  </span>
                  <input
                    type="tel"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(formatearTelefonoPeru(e.target.value))}
                    placeholder="987 654 321"
                    maxLength={11}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border border-slate-300 text-xs font-mono bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-aurea-copper focus:border-transparent"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  9 dígitos móviles (inician con 9). Se usará para confirmación de cortesía vía WhatsApp.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Notas de Cortesía o Preferencias (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Viene con niño pequeño, requiere silla alta, mesa tranquila..."
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-aurea-copper focus:border-transparent"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Pie de Acciones */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmarSubmit}
            disabled={!puedeConfirmar}
            className="px-6 py-2.5 rounded-xl bg-aurea-navy hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            style={{ minHeight: '44px' }}
          >
            {guardando ? (
              <span>Confirmando...</span>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-aurea-copper" />
                <span>
                  Confirmar {franjaSeleccionada ? `${franjaSeleccionada.hora} · ` : ''}
                  {etiquetaMesas}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
