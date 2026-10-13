import React, { useState, useEffect } from 'react';
import { DiaHorarioDTO, TurnoHorarioDTO } from '@/types/admin';
import { Plus, Trash2, Moon, AlertCircle, Save, RotateCcw, Copy, Sparkles, Check } from 'lucide-react';

interface SemanaHorariaViewProps {
  dias: DiaHorarioDTO[];
  onGuardar: (dias: DiaHorarioDTO[]) => Promise<void>;
  onAplicarPlantilla?: (plantilla: 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo') => Promise<void>;
  guardando: boolean;
}

export const SemanaHorariaView: React.FC<SemanaHorariaViewProps> = ({
  dias,
  onGuardar,
  guardando,
}) => {
  const [diasLocales, setDiasLocales] = useState<DiaHorarioDTO[]>([]);
  const [hayCambios, setHayCambios] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    setDiasLocales(JSON.parse(JSON.stringify(dias)));
    setHayCambios(false);
    setErrorValidacion(null);
  }, [dias]);

  const calcularHorasTurno = (inicio: string, fin: string): number => {
    if (!inicio || !fin) return 0;
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin, mFin] = fin.split(':').map(Number);
    if (isNaN(hIni) || isNaN(mIni) || isNaN(hFin) || isNaN(mFin)) return 0;
    const minIni = hIni * 60 + mIni;
    const minFin = hFin * 60 + mFin;
    let diff = minFin - minIni;
    if (diff < 0) diff += 24 * 60; // Trasnochador
    return Math.round((diff / 60) * 10) / 10;
  };

  const calcularHorasDia = (dia: DiaHorarioDTO): number => {
    if (!dia.atiende || !dia.turnos) return 0;
    return dia.turnos.reduce((acc, t) => acc + calcularHorasTurno(t.hora_inicio, t.hora_fin), 0);
  };

  const calcularHorasTotales = (): number => {
    return Math.round(diasLocales.reduce((acc, d) => acc + calcularHorasDia(d), 0) * 10) / 10;
  };

  const esTurnoTrasnochador = (inicio: string, fin: string): boolean => {
    if (!inicio || !fin) return false;
    return fin < inicio;
  };

  const handleToggleAtiende = (index: number) => {
    const copia = JSON.parse(JSON.stringify(diasLocales));
    copia[index].atiende = !copia[index].atiende;
    if (copia[index].atiende && (!copia[index].turnos || copia[index].turnos.length === 0)) {
      copia[index].turnos = [
        { id: `t-${index + 1}-1`, nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
        { id: `t-${index + 1}-2`, nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
      ];
    }
    setDiasLocales(copia);
    setHayCambios(true);
    setErrorValidacion(null);
  };

  const handleActualizarTurno = (
    diaIndex: number,
    turnoIndex: number,
    campo: keyof TurnoHorarioDTO,
    valor: string
  ) => {
    const copia = JSON.parse(JSON.stringify(diasLocales));
    copia[diaIndex].turnos[turnoIndex][campo] = valor;
    setDiasLocales(copia);
    setHayCambios(true);
    setErrorValidacion(null);
  };

  const handleAgregarTurno = (diaIndex: number) => {
    const copia = JSON.parse(JSON.stringify(diasLocales));
    const cant = copia[diaIndex].turnos.length;
    copia[diaIndex].turnos.push({
      id: `t-${diaIndex + 1}-${cant + 1}`,
      nombre_turno: cant === 1 ? 'Cena' : `Turno ${cant + 1}`,
      hora_inicio: '19:00',
      hora_fin: '23:30',
    });
    setDiasLocales(copia);
    setHayCambios(true);
    setErrorValidacion(null);
  };

  const handleEliminarTurno = (diaIndex: number, turnoIndex: number) => {
    const copia = JSON.parse(JSON.stringify(diasLocales));
    copia[diaIndex].turnos.splice(turnoIndex, 1);
    setDiasLocales(copia);
    setHayCambios(true);
    setErrorValidacion(null);
  };

  const generarDiasPlantilla = (plantilla: 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo'): DiaHorarioDTO[] => {
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    if (plantilla === 'restaurante_estandar') {
      return nombresDias.map((nombre, idx) => {
        const diaSemana = idx + 1;
        if (diaSemana <= 4) {
          // Lunes a Jueves
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
              { id: `t-${diaSemana}-2`, nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
            ],
          };
        } else if (diaSemana === 5) {
          // Viernes
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
              { id: `t-${diaSemana}-2`, nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '00:30' },
            ],
          };
        } else if (diaSemana === 6) {
          // Sábado
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Horario Continuo', hora_inicio: '12:00', hora_fin: '00:30' },
            ],
          };
        } else {
          // Domingo
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Almuerzo Familiar', hora_inicio: '12:00', hora_fin: '18:00' },
            ],
          };
        }
      });
    } else if (plantilla === 'solo_almuerzo') {
      return nombresDias.map((nombre, idx) => ({
        dia_semana: idx + 1,
        nombre_dia: nombre,
        atiende: true,
        turnos: [
          { id: `t-${idx + 1}-1`, nombre_turno: 'Almuerzo Ejecutivo', hora_inicio: '12:00', hora_fin: '16:30' },
        ],
      }));
    } else {
      // corrido_continuo
      return nombresDias.map((nombre, idx) => ({
        dia_semana: idx + 1,
        nombre_dia: nombre,
        atiende: true,
        turnos: [
          { id: `t-${idx + 1}-1`, nombre_turno: 'Turno Continuo', hora_inicio: '12:00', hora_fin: '23:00' },
        ],
      }));
    }
  };

  const handleAplicarPlantillaBorrador = (plantilla: 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo') => {
    const nuevosDias = generarDiasPlantilla(plantilla);
    setDiasLocales(nuevosDias);
    setHayCambios(true);
    setErrorValidacion(null);
    setMensajeExito('Plantilla cargada en borrador. Revisa los turnos y pulsa "Guardar Horario Semanal" para confirmar los cambios.');
    setTimeout(() => setMensajeExito(null), 5000);
  };

  const handleCopiarLunesATodos = () => {
    if (diasLocales.length === 0) return;
    const lunes = diasLocales[0];
    if (!lunes || !lunes.atiende || !lunes.turnos || lunes.turnos.length === 0) {
      setErrorValidacion('Para esta funcionalidad se debe tener el lunes habilitado como referencia con al menos un turno configurado.');
      setMensajeExito(null);
      return;
    }
    const copia = diasLocales.map((d, idx) => {
      if (idx === 0) return d;
      return {
        ...d,
        atiende: lunes.atiende,
        turnos: JSON.parse(JSON.stringify(lunes.turnos)),
      };
    });
    setDiasLocales(copia);
    setHayCambios(true);
    setErrorValidacion(null);
    setMensajeExito('Horario de Lunes copiado a toda la semana. Recuerda pulsar "Guardar Horario Semanal" para confirmar.');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleDescartar = () => {
    setDiasLocales(JSON.parse(JSON.stringify(dias)));
    setHayCambios(false);
    setErrorValidacion(null);
  };

  const handleGuardarSubmit = async () => {
    setErrorValidacion(null);

    // Validaciones de consistencia
    for (const d of diasLocales) {
      if (d.atiende) {
        if (!d.turnos || d.turnos.length === 0) {
          setErrorValidacion(`El día ${d.nombre_dia} está marcado como abierto pero no tiene ningún turno configurado.`);
          return;
        }
        for (const t of d.turnos) {
          if (!t.hora_inicio || !t.hora_fin) {
            setErrorValidacion(`Debes ingresar la hora de inicio y fin para todos los turnos en ${d.nombre_dia}.`);
            return;
          }
          if (t.hora_inicio === t.hora_fin) {
            setErrorValidacion(`La hora de inicio y fin no pueden ser idénticas en el turno "${t.nombre_turno}" de ${d.nombre_dia}.`);
            return;
          }
        }
      }
    }

    try {
      await onGuardar(diasLocales);
      setHayCambios(false);
      setMensajeExito('Horario semanal guardado exitosamente.');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorValidacion(err.message || 'Error al guardar el horario semanal.');
    }
  };

  const totalHoras = calcularHorasTotales();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Barra superior de productividad y plantillas rápidas */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 rounded-lg text-red-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Plantillas Operativas Rápidas</h4>
            <p className="text-xs text-gray-600">
              Aplica esquemas preconfigurados en un solo clic y ajústalos según tus turnos de cocina y salón.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAplicarPlantillaBorrador('restaurante_estandar')}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
          >
            🍽️ Estándar (Almuerzo + Cena)
          </button>
          <button
            type="button"
            onClick={() => handleAplicarPlantillaBorrador('solo_almuerzo')}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
          >
            ☀️ Solo Almuerzos (12:00 - 16:30)
          </button>
          <button
            type="button"
            onClick={() => handleAplicarPlantillaBorrador('corrido_continuo')}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
          >
            ⚡ Corrido Continuo (12:00 - 23:00)
          </button>
        </div>
      </div>

      {/* Banner de mensajes de éxito o validación */}
      {mensajeExito && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {errorValidacion && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {/* Tarjeta con los 7 días de la semana */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-200">
        <div className="p-4 bg-gray-50/80 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Día de la Semana
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              Gestión de Apertura y Turnos Partidos
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopiarLunesATodos}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar horario de Lunes a toda la semana
          </button>
        </div>

        {diasLocales.map((dia, diaIdx) => {
          const horasDia = calcularHorasDia(dia);

          return (
            <div
              key={dia.dia_semana}
              className={`p-5 transition ${dia.atiende ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Switch y Nombre del Día */}
                <div className="lg:w-48 shrink-0 flex items-center lg:items-start justify-between lg:justify-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">{dia.nombre_dia}</span>
                      {dia.atiende ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {horasDia}h
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Cerrado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dia.atiende
                        ? `${dia.turnos.length} turno${dia.turnos.length > 1 ? 's' : ''} configurado${dia.turnos.length > 1 ? 's' : ''}`
                        : 'No atiende al público'}
                    </p>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleAtiende(diaIdx)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dia.atiende ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={dia.atiende}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        dia.atiende ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Contenido de turnos del día */}
                <div className="flex-1">
                  {!dia.atiende ? (
                    <div className="bg-gray-100/70 border border-dashed border-gray-300 rounded-lg p-3 text-xs text-gray-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>
                        El local permanecerá cerrado los {dia.nombre_dia}s. El sistema de reservas y comandas bloqueará pedidos para este día.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dia.turnos.map((turno, turnoIdx) => {
                        const duracion = calcularHorasTurno(turno.hora_inicio, turno.hora_fin);
                        const esTrasnochador = esTurnoTrasnochador(turno.hora_inicio, turno.hora_fin);

                        return (
                          <div
                            key={turno.id || turnoIdx}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            {/* Nombre del Turno */}
                            <div className="w-full sm:w-36">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                Etiqueta Turno
                              </label>
                              <input
                                type="text"
                                value={turno.nombre_turno}
                                onChange={(e) =>
                                  handleActualizarTurno(diaIdx, turnoIdx, 'nombre_turno', e.target.value)
                                }
                                placeholder="ej. Almuerzo"
                                className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>

                            {/* Hora Inicio */}
                            <div className="w-32">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                Apertura
                              </label>
                              <input
                                type="time"
                                value={turno.hora_inicio}
                                onChange={(e) =>
                                  handleActualizarTurno(diaIdx, turnoIdx, 'hora_inicio', e.target.value)
                                }
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 font-mono"
                              />
                            </div>

                            <span className="text-gray-400 text-xs mt-4 hidden sm:inline">a</span>

                            {/* Hora Fin */}
                            <div className="w-32">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                Cierre
                              </label>
                              <input
                                type="time"
                                value={turno.hora_fin}
                                onChange={(e) =>
                                  handleActualizarTurno(diaIdx, turnoIdx, 'hora_fin', e.target.value)
                                }
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 font-mono"
                              />
                            </div>

                            {/* Badges de Duración y Trasnochador */}
                            <div className="flex items-center gap-2 mt-4 sm:mt-4">
                              <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded-md shrink-0">
                                {duracion} hrs
                              </span>

                              {esTrasnochador && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded-md shrink-0" title="Cierra en la madrugada del día siguiente">
                                  <Moon className="w-3 h-3 text-purple-600" />
                                  +1 día
                                </span>
                              )}
                            </div>

                            {/* Botón eliminar turno si hay más de 1 */}
                            {dia.turnos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleEliminarTurno(diaIdx, turnoIdx)}
                                className="mt-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition ml-auto"
                                title="Eliminar este turno"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Botón Añadir Turno (Turno partido) */}
                      {dia.turnos.length < 3 && (
                        <button
                          type="button"
                          onClick={() => handleAgregarTurno(diaIdx)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-dashed border-red-300 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Añadir Turno Partido (ej. Turno Cena)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra fija inferior con resumen y acciones */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            🕒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Total Operativo Semanal:</span>
              <span className="text-sm font-bold text-emerald-600">{totalHoras} horas</span>
            </div>
            <p className="text-xs text-gray-500">
              {hayCambios ? 'Tienes cambios pendientes de guardar en la grilla horaria.' : 'La configuración actual está sincronizada.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {hayCambios && (
            <button
              type="button"
              onClick={handleDescartar}
              disabled={guardando}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RotateCcw className="w-4 h-4 text-gray-500" />
              Descartar
            </button>
          )}

          <button
            type="button"
            onClick={handleGuardarSubmit}
            disabled={!hayCambios || guardando}
            className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg text-white transition shadow-sm ${
              hayCambios && !guardando
                ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando Horario...' : 'Guardar Horario Semanal'}
          </button>
        </div>
      </div>
    </div>
  );
};
