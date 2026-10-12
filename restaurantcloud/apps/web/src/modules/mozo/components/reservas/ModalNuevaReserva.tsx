import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { MesaDisponibleReservaDTO, CrearReservaRequestDTO } from '@/types/mozo';
import { mockMozoService } from '../../services/mockMozoService';

interface ModalNuevaReservaProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (reserva: CrearReservaRequestDTO) => Promise<void>;
}

export const ModalNuevaReserva: React.FC<ModalNuevaReservaProps> = ({
  abierto,
  onCerrar,
  onConfirmar,
}) => {
  // Parámetros de Cita (Paso 1)
  const [fecha, setFecha] = useState('2026-10-09');
  const [hora, setHora] = useState('14:00');
  const [numPersonas, setNumPersonas] = useState(4);

  // Mini-Mapa (Paso 2)
  const [mesasMapa, setMesasMapa] = useState<MesaDisponibleReservaDTO[]>([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [mesasSeleccionadasIds, setMesasSeleccionadasIds] = useState<string[]>(['mesa-08']);

  // Datos del Cliente (Paso 3)
  const [clienteNombre, setClienteNombre] = useState('Fam. Gómez');
  const [clienteTelefono, setClienteTelefono] = useState('+51 987 654 321');
  const [notas, setNotas] = useState('Viene con niño pequeño, requiere silla alta');
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const franjasHorarias = ['13:00', '13:30', '14:00', '14:30', '15:00', '20:00', '20:30', '21:00'];

  // Cargar disponibilidad cuando cambian fecha, hora o comensales
  useEffect(() => {
    if (abierto) {
      cargarDisponibilidad();
    }
  }, [abierto, fecha, hora, numPersonas]);

  const cargarDisponibilidad = async () => {
    setCargandoMesas(true);
    try {
      const res = await mockMozoService.obtenerMesasDisponiblesReserva(fecha, hora, numPersonas);
      if (res.exito) {
        setMesasMapa(res.datos.mesas);
      }
    } finally {
      setCargandoMesas(false);
    }
  };

  if (!abierto) return null;

  // Toggle de selección en el Mini-Mapa
  const handleToggleMesa = (mesa: MesaDisponibleReservaDTO) => {
    if (!mesa.disponible) return;

    if (mesasSeleccionadasIds.includes(mesa.mesa_id)) {
      if (mesasSeleccionadasIds.length > 1) {
        setMesasSeleccionadasIds(mesasSeleccionadasIds.filter((id) => id !== mesa.mesa_id));
      }
    } else {
      // Si seleccionamos una mesa con capacidad suficiente para el aforo, reemplazamos
      if (mesa.capacidad >= numPersonas) {
        setMesasSeleccionadasIds([mesa.mesa_id]);
      } else {
        // Si no alcanza o el usuario quiere agrupar mesas contiguas
        setMesasSeleccionadasIds([...mesasSeleccionadasIds, mesa.mesa_id]);
      }
    }
  };

  const handleConfirmarSubmit = async () => {
    setErrorValidacion(null);
    if (!clienteNombre.trim() || clienteNombre.length < 3) {
      setErrorValidacion('Por favor ingresa el nombre completo del cliente (mínimo 3 caracteres).');
      return;
    }
    if (!clienteTelefono.trim() || clienteTelefono.length < 8) {
      setErrorValidacion('Por favor ingresa un teléfono móvil de contacto válido (+51 ...).');
      return;
    }
    if (mesasSeleccionadasIds.length === 0) {
      setErrorValidacion('Debes seleccionar al menos una mesa en el mini-mapa de salón.');
      return;
    }

    setGuardando(true);
    try {
      const payload: CrearReservaRequestDTO = {
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim(),
        fecha_hora: `${fecha}T${hora}:00Z`,
        num_personas: numPersonas,
        mesa_ids: mesasSeleccionadasIds,
        notas: notas.trim() || undefined,
      };
      await onConfirmar(payload);
      onCerrar();
    } catch {
      setErrorValidacion('Ocurrió un error al registrar la reserva. Intenta nuevamente.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '760px' }}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-aurea-navy text-white flex items-center justify-between border-b border-aurea-copper/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne">
                Asignación Espacial Táctil • Salón Principal
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-aurea-copper/20 text-aurea-champagne font-mono">
                760px
              </span>
            </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Fecha */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fecha del Servicio:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFecha('2026-10-09')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      fecha === '2026-10-09'
                        ? 'bg-aurea-navy text-white border-aurea-navy'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFecha('2026-10-10')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      fecha === '2026-10-10'
                        ? 'bg-aurea-navy text-white border-aurea-navy'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Mañana
                  </button>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-800"
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
                    {numPersonas} personas
                  </div>
                  <button
                    type="button"
                    onClick={() => setNumPersonas(Math.min(20, numPersonas + 1))}
                    className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Franja Horaria */}
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hora de Cita:
                </label>
                <div className="flex flex-wrap gap-1">
                  {franjasHorarias.slice(0, 4).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHora(h)}
                      className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
                        hora === h
                          ? 'bg-aurea-copper text-aurea-navy font-bold shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {franjasHorarias.slice(4).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHora(h)}
                      className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
                        hora === h
                          ? 'bg-aurea-copper text-aurea-navy font-bold shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PASO 2: Mini-Mapa Espacial de Salón (5x2) */}
          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-aurea-navy text-white text-[10px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>Mini-Mapa de Salón — Selecciona la Mesa Física</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Topología: 10 mesas (5x2)
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Las mesas atenuadas tienen conflicto en la franja seleccionada. Toca una mesa disponible para asignarla a la cita:
            </p>

            {cargandoMesas ? (
              <div className="p-8 text-center text-slate-400">Consultando disponibilidad de salón...</div>
            ) : (
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                {mesasMapa.map((mesa) => {
                  const seleccionada = mesasSeleccionadasIds.includes(mesa.mesa_id);
                  return (
                    <button
                      key={mesa.mesa_id}
                      type="button"
                      onClick={() => handleToggleMesa(mesa)}
                      disabled={!mesa.disponible}
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
                          {seleccionada ? '✓ ELEGIR' : mesa.disponible ? 'LIBRE' : 'OCUP'}
                        </span>
                      </div>

                      <div className="font-serif text-lg font-bold my-0.5">
                        {mesa.numero}
                      </div>

                      <div
                        className={`text-[10px] truncate ${
                          seleccionada ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        Cap: {mesa.capacidad}p
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Resumen de Asignación Espacial */}
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
              {capacidadTotal < numPersonas && (
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-aurea-copper focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Teléfono Móvil (+51 Perú): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white text-slate-800 focus:ring-2 focus:ring-aurea-copper focus:border-transparent"
                />
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-aurea-copper focus:border-transparent"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Pie de Acciones Táctiles */}
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
            disabled={guardando || mesasSeleccionadasIds.length === 0}
            className="px-6 py-2.5 rounded-xl bg-aurea-navy hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            style={{ minHeight: '44px' }}
          >
            {guardando ? (
              <span>Confirmando...</span>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-aurea-copper" />
                <span>📅 Confirmar y Asignar Mesa ({etiquetaMesas})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
