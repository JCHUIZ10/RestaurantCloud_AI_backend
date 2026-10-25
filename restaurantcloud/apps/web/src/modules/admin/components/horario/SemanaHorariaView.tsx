import React, { useState, useEffect } from 'react';
import { DiaHorarioDTO, TurnoHorarioDTO } from '@/types/admin';
import { Plus, Trash2, Moon, AlertCircle, Save, Copy, UtensilsCrossed, Sun, Timer, Sparkles, type LucideIcon } from 'lucide-react';
import { Button, IconButton, useToast } from '@/components/ui';
import { cn } from '@/shared/utils';

type Plantilla = 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo';

interface SemanaHorariaViewProps {
  dias: DiaHorarioDTO[];
  onGuardar: (dias: DiaHorarioDTO[]) => Promise<void>;
  onAplicarPlantilla?: (plantilla: Plantilla) => Promise<void>;
  guardando: boolean;
}

const PLANTILLAS: Array<{ valor: Plantilla; icono: LucideIcon; titulo: string; detalle: string; color: string; fondo: string }> = [
  { valor: 'restaurante_estandar', icono: UtensilsCrossed, titulo: 'Almuerzo y cena', detalle: '12:00–16:00 y 19:00–23:30', color: 'text-red-600', fondo: 'bg-red-50' },
  { valor: 'solo_almuerzo', icono: Sun, titulo: 'Solo almuerzo', detalle: '12:00–16:30 todos los días', color: 'text-amber-600', fondo: 'bg-amber-50' },
  { valor: 'corrido_continuo', icono: Timer, titulo: 'Horario corrido', detalle: '12:00–23:00 sin pausa', color: 'text-emerald-600', fondo: 'bg-emerald-50' },
];

const CLASE_CAMPO =
  'w-full min-h-tactil px-3 bg-white border border-tinta-300 rounded-lg text-base md:text-sm text-tinta-900 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper';

export const SemanaHorariaView: React.FC<SemanaHorariaViewProps> = ({
  dias,
  onGuardar,
  guardando,
}) => {
  const { mostrar } = useToast();
  const [diasLocales, setDiasLocales] = useState<DiaHorarioDTO[]>([]);
  const [hayCambios, setHayCambios] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

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

  const generarDiasPlantilla = (plantilla: Plantilla): DiaHorarioDTO[] => {
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

  const handleAplicarPlantillaBorrador = (plantilla: Plantilla) => {
    setDiasLocales(generarDiasPlantilla(plantilla));
    setHayCambios(true);
    setErrorValidacion(null);
    mostrar('Plantilla cargada. Revisa los turnos y guarda para aplicarla.', 'info');
  };

  const handleCopiarLunesATodos = () => {
    if (diasLocales.length === 0) return;
    const lunes = diasLocales[0];
    if (!lunes || !lunes.atiende || !lunes.turnos || lunes.turnos.length === 0) {
      setErrorValidacion('Para copiar el lunes, primero ábrelo y configura al menos un turno.');
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
    mostrar('Horario del lunes copiado a toda la semana. Guarda para aplicarlo.', 'info');
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
          setErrorValidacion(`${d.nombre_dia} está abierto pero no tiene turnos.`);
          return;
        }
        for (const t of d.turnos) {
          if (!t.hora_inicio || !t.hora_fin) {
            setErrorValidacion(`Completa la hora de apertura y cierre de todos los turnos del ${d.nombre_dia.toLowerCase()}.`);
            return;
          }
          if (t.hora_inicio === t.hora_fin) {
            setErrorValidacion(`El turno «${t.nombre_turno}» del ${d.nombre_dia.toLowerCase()} abre y cierra a la misma hora.`);
            return;
          }
        }
      }
    }

    try {
      await onGuardar(diasLocales);
      setHayCambios(false);
    } catch (err) {
      setErrorValidacion(err instanceof Error && err.message ? err.message : 'No se pudo guardar el horario.');
    }
  };

  const totalHoras = calcularHorasTotales();

  return (
    <div className="space-y-4">
      {/* Plantillas rápidas: cargan un horario completo como borrador */}
      <section className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex items-center gap-3 xl:max-w-xs">
          <span className="p-2.5 bg-red-100 rounded-xl text-red-600 shrink-0" aria-hidden="true">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-tinta-900">Plantillas rápidas</h2>
            <p className="text-xs text-tinta-600">Carga un horario completo en un clic y ajústalo antes de guardar.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
          {PLANTILLAS.map(({ valor, icono: Icono, titulo, detalle, color, fondo }) => (
            <button
              key={valor}
              type="button"
              onClick={() => handleAplicarPlantillaBorrador(valor)}
              className="min-h-tactil px-3 py-2 rounded-xl bg-white border border-tinta-200 shadow-sm hover:border-aurea-copper hover:shadow-md text-left flex items-center gap-3 transition-all"
            >
              <span className={cn('p-2 rounded-lg shrink-0', fondo, color)} aria-hidden="true">
                <Icono className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-tinta-900">{titulo}</span>
                <span className="block text-xs font-mono text-tinta-500">{detalle}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="bg-white rounded-2xl border border-tinta-200 shadow-sm">
        {/* Cabecera de la semana: copiar lunes */}
        <div className="px-4 sm:px-6 py-3 border-b border-tinta-200 bg-aurea-ivory/60 rounded-t-2xl flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-tinta-500">Turnos por día</span>
          <button
            type="button"
            onClick={handleCopiarLunesATodos}
            className="min-h-tactil px-3 rounded-lg text-sm font-semibold text-aurea-copper hover:bg-aurea-champagne/30 inline-flex items-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            Copiar lunes a toda la semana
          </button>
        </div>

        {errorValidacion && (
          <p role="alert" className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            {errorValidacion}
          </p>
        )}

        {/* Los 7 días */}
        <ul className="divide-y divide-tinta-100">
          {diasLocales.map((dia, diaIdx) => {
            const horasDia = Math.round(calcularHorasDia(dia) * 10) / 10;

            return (
              <li key={dia.dia_semana} className={cn('px-4 sm:px-6 py-4 flex flex-col lg:flex-row gap-3 lg:gap-6', !dia.atiende && 'bg-tinta-50/60')}>
                {/* Día, estado y switch */}
                <div className="lg:w-48 shrink-0 flex items-center justify-between lg:items-start gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-base font-bold', dia.atiende ? 'text-aurea-navy' : 'text-tinta-500')}>{dia.nombre_dia}</span>
                    {dia.atiende ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{horasDia} h</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-tinta-100 text-tinta-500 border border-tinta-200">Cerrado</span>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dia.atiende}
                    aria-label={`Abrir los ${dia.nombre_dia.toLowerCase()}`}
                    onClick={() => handleToggleAtiende(diaIdx)}
                    className="-my-2 -mr-1 min-h-tactil min-w-tactil px-1 flex items-center justify-center rounded-xl shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 lg:order-first lg:-ml-1 lg:mr-0"
                  >
                    <span className={cn('w-12 h-6 rounded-full transition-colors flex items-center', dia.atiende ? 'bg-emerald-600' : 'bg-tinta-300')}>
                      <span className={cn('w-4 h-4 rounded-full bg-white shadow-md transition-transform', dia.atiende ? 'translate-x-7' : 'translate-x-1')} />
                    </span>
                  </button>
                </div>

                {/* Turnos */}
                {dia.atiende && (
                  <div className="flex-1 min-w-0 space-y-2">
                    {dia.turnos.map((turno, turnoIdx) => {
                      const duracion = calcularHorasTurno(turno.hora_inicio, turno.hora_fin);
                      const esTrasnochador = esTurnoTrasnochador(turno.hora_inicio, turno.hora_fin);
                      const idBase = `turno-${dia.dia_semana}-${turnoIdx}`;

                      return (
                        <div
                          key={turno.id || turnoIdx}
                          className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] gap-2 sm:gap-3 items-end p-3 bg-aurea-ivory/50 rounded-xl border border-aurea-champagne/60"
                        >
                          <div className="col-span-2 sm:col-span-1">
                            <label htmlFor={`${idBase}-nombre`} className="block text-xs font-semibold text-tinta-600 mb-1">
                              Turno
                            </label>
                            <input
                              id={`${idBase}-nombre`}
                              type="text"
                              value={turno.nombre_turno}
                              onChange={(e) => handleActualizarTurno(diaIdx, turnoIdx, 'nombre_turno', e.target.value)}
                              placeholder="Ej. Almuerzo"
                              className={CLASE_CAMPO}
                            />
                          </div>
                          <div>
                            <label htmlFor={`${idBase}-ini`} className="block text-xs font-semibold text-tinta-600 mb-1">
                              Abre
                            </label>
                            <input
                              id={`${idBase}-ini`}
                              type="time"
                              value={turno.hora_inicio}
                              onChange={(e) => handleActualizarTurno(diaIdx, turnoIdx, 'hora_inicio', e.target.value)}
                              className={cn(CLASE_CAMPO, 'font-mono')}
                            />
                          </div>
                          <div>
                            <label htmlFor={`${idBase}-fin`} className="block text-xs font-semibold text-tinta-600 mb-1">
                              Cierra
                            </label>
                            <input
                              id={`${idBase}-fin`}
                              type="time"
                              value={turno.hora_fin}
                              onChange={(e) => handleActualizarTurno(diaIdx, turnoIdx, 'hora_fin', e.target.value)}
                              className={cn(CLASE_CAMPO, 'font-mono')}
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 min-h-tactil">
                            <span className="text-xs font-semibold text-tinta-700 bg-white border border-tinta-200 px-2 py-1 rounded-md whitespace-nowrap">
                              {duracion} h
                            </span>
                            {esTrasnochador && (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md whitespace-nowrap"
                                title="Cierra en la madrugada del día siguiente"
                              >
                                <Moon className="w-3 h-3" aria-hidden="true" />
                                +1 día
                              </span>
                            )}
                            {dia.turnos.length > 1 && (
                              <IconButton
                                variant="danger"
                                icono={Trash2}
                                etiqueta={`Quitar el turno ${turno.nombre_turno || turnoIdx + 1} del ${dia.nombre_dia.toLowerCase()}`}
                                onClick={() => handleEliminarTurno(diaIdx, turnoIdx)}
                                className="ml-auto"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {dia.turnos.length < 3 && (
                      <button
                        type="button"
                        onClick={() => handleAgregarTurno(diaIdx)}
                        className="min-h-tactil px-3 rounded-lg border border-dashed border-aurea-copper/50 text-sm font-medium text-aurea-copper hover:bg-aurea-champagne/20 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Añadir turno
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Pie: total y acciones; fijo mientras hay cambios */}
        <div
          className={cn(
            'px-4 sm:px-6 py-4 border-t border-tinta-200 rounded-b-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
            hayCambios && 'sticky bottom-0 bg-white/95 backdrop-blur-sm'
          )}
        >
          <p className="text-sm text-tinta-700">
            Total semanal: <span className="font-bold text-emerald-700">{totalHoras} h</span>
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            {hayCambios && (
              <Button variant="outline" onClick={handleDescartar} disabled={guardando} className="w-full sm:w-auto">
                Descartar
              </Button>
            )}
            <button
              type="button"
              onClick={handleGuardarSubmit}
              disabled={!hayCambios || guardando}
              className="w-full sm:w-auto min-h-tactil px-6 rounded-xl bg-aurea-copper text-aurea-navy hover:bg-aurea-copper/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {guardando ? (
                <>
                  <span className="w-4 h-4 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  Guardar horario
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
