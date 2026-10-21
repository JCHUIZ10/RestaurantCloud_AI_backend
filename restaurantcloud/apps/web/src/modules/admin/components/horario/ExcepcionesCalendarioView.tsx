import React, { useState, useMemo, useEffect } from 'react';
import { ExcepcionHorarioDTO } from '@/types/admin';
import { Plus, Trash2, Calendar, Clock, AlertTriangle, Search, ChevronLeft, ChevronRight, CheckCircle2, History } from 'lucide-react';

interface ExcepcionesCalendarioViewProps {
  excepciones: ExcepcionHorarioDTO[];
  onNuevoCierre: () => void;
  onCargarFeriadosPeru?: () => void;
  onEliminarExcepcion: (id: string) => Promise<void>;
}

export const ExcepcionesCalendarioView: React.FC<ExcepcionesCalendarioViewProps> = ({
  excepciones,
  onNuevoCierre,
  onCargarFeriadosPeru,
  onEliminarExcepcion,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroVigencia, setFiltroVigencia] = useState<'todos' | 'vigentes' | 'pasados'>('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [idEliminando, setIdEliminando] = useState<string | null>(null);

  const ELEMENTOS_POR_PAGINA = 6;

  // Fecha de referencia actual en formato ISO (YYYY-MM-DD)
  const hoyISO = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  }, []);

  const formatearFecha = (fechaStr: string) => {
    try {
      const [year, month, day] = fechaStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const nombreDia = d.toLocaleDateString('es-PE', { weekday: 'long' });
      const fechaFormateada = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      return {
        diaSemana: nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1),
        fecha: fechaFormateada,
      };
    } catch {
      return { diaSemana: '', fecha: fechaStr };
    }
  };

  // Contadores instantáneos en memoria (O(N) < 0.05ms)
  const totalVigentes = useMemo(() => excepciones.filter((e) => e.fecha >= hoyISO).length, [excepciones, hoyISO]);
  const totalPasados = useMemo(() => excepciones.filter((e) => e.fecha < hoyISO).length, [excepciones, hoyISO]);

  // Filtrado reactivo en memoria
  const filtradas = useMemo(() => {
    return excepciones.filter((exc) => {
      // 1. Filtro temporal de vigencia
      if (filtroVigencia === 'vigentes' && exc.fecha < hoyISO) return false;
      if (filtroVigencia === 'pasados' && exc.fecha >= hoyISO) return false;

      // 2. Buscador libre
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return exc.motivo.toLowerCase().includes(q) || exc.fecha.includes(q);
    });
  }, [excepciones, filtroVigencia, hoyISO, busqueda]);

  // Reset a página 1 cuando cambia filtro o término de búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroVigencia, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ELEMENTOS_POR_PAGINA));
  const indiceInicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
  const elementosPaginados = filtradas.slice(indiceInicio, indiceInicio + ELEMENTOS_POR_PAGINA);

  const handleConfirmarEliminar = async (id: string, motivo: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la excepción "${motivo}"?`)) {
      try {
        setIdEliminando(id);
        await onEliminarExcepcion(id);
      } finally {
        setIdEliminando(null);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Barra de Controles y Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Pestañas de Filtro Temporal: Todos / Vigentes / Pasados */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFiltroVigencia('todos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filtroVigencia === 'todos'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({excepciones.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroVigencia('vigentes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filtroVigencia === 'vigentes'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
            title="Fechas a partir de hoy en adelante"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Vigentes / Próximos ({totalVigentes})
          </button>

          <button
            type="button"
            onClick={() => setFiltroVigencia('pasados')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              filtroVigencia === 'pasados'
                ? 'bg-white text-gray-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Fechas concluidas en el pasado"
          >
            <History className="w-3.5 h-3.5 text-gray-500" />
            Pasados / Históricos ({totalPasados})
          </button>
        </div>

        {/* Buscador y Botón Nuevo Cierre */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por fecha o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {onCargarFeriadosPeru && (
            <button
              type="button"
              onClick={onCargarFeriadosPeru}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition shrink-0"
            >
              <Calendar className="w-4 h-4" />
              Cargar feriados 2026
            </button>
          )}

          <button
            type="button"
            onClick={onNuevoCierre}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cierre / Feriado
          </button>
        </div>
      </div>

      {/* Tabla de Excepciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No hay excepciones registradas en esta vista
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              {busqueda
                ? `No se encontraron coincidencias para "${busqueda}".`
                : filtroVigencia === 'vigentes'
                ? 'No tienes cierres ni feriados programados para fechas futuras.'
                : 'No se registran excepciones históricas archivadas.'}
            </p>
            <button
              type="button"
              onClick={onNuevoCierre}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              <Plus className="w-4 h-4" />
              Registrar Fecha Manual
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5">Fecha</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5">Tipo de Excepción</th>
                    <th className="px-6 py-3.5">Motivo / Descripción</th>
                    <th className="px-6 py-3.5">Horario Permitido</th>
                    <th className="px-6 py-3.5">Impacto en Reservas</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {elementosPaginados.map((exc) => {
                    const { diaSemana, fecha } = formatearFecha(exc.fecha);
                    const esVigente = exc.fecha >= hoyISO;

                    return (
                      <tr key={exc.id} className="hover:bg-gray-50/70 transition">
                        {/* Fecha */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-700 font-mono text-xs">
                              <span className="text-[10px] uppercase font-bold text-gray-500 leading-none">
                                {fecha.split('/')[1]}
                              </span>
                              <span className="font-bold text-sm leading-none mt-0.5">
                                {fecha.split('/')[0]}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 block">{fecha}</span>
                              <span className="text-xs text-gray-500">{diaSemana}</span>
                            </div>
                          </div>
                        </td>

                        {/* Estado Temporal (Vigente / Pasado) */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {esVigente ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Vigente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Pasado
                            </span>
                          )}
                        </td>

                        {/* Tipo */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {exc.cerrado ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Cierre Total
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Horario Especial
                            </span>
                          )}
                        </td>

                        {/* Motivo */}
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 block">{exc.motivo}</span>
                          {exc.created_by && (
                            <span className="text-[11px] text-gray-400">Registrado por: {exc.created_by}</span>
                          )}
                        </td>

                        {/* Horario Permitido */}
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                          {exc.cerrado ? (
                            <span className="text-gray-400">No aplica (Cerrado)</span>
                          ) : (
                            <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                              {exc.hora_inicio || '00:00'} - {exc.hora_fin || '23:59'}
                            </span>
                          )}
                        </td>

                        {/* Impacto en Reservas */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {exc.reservas_canceladas_count !== undefined && exc.reservas_canceladas_count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              {exc.reservas_canceladas_count} reserva(s) canceladas
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Sin conflictos</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => handleConfirmarEliminar(exc.id, exc.motivo)}
                            disabled={idEliminando === exc.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar excepción"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Mostrando <span className="font-semibold text-gray-800">{indiceInicio + 1}</span> a{' '}
                  <span className="font-semibold text-gray-800">
                    {Math.min(indiceInicio + ELEMENTOS_POR_PAGINA, filtradas.length)}
                  </span>{' '}
                  de <span className="font-semibold text-gray-800">{filtradas.length}</span> excepciones
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="p-1.5 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200 transition"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numPag) => (
                    <button
                      key={numPag}
                      type="button"
                      onClick={() => setPaginaActual(numPag)}
                      className={`w-7 h-7 text-xs font-semibold rounded-lg transition ${
                        paginaActual === numPag
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {numPag}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="p-1.5 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200 transition"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
