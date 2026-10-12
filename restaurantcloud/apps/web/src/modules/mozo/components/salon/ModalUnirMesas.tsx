import React, { useState, useEffect } from 'react';
import { X, Link2, Check, AlertCircle, Users, RefreshCw } from 'lucide-react';
import { CandidataUnionMesaDTO, CandidatasUnionResponseDTO } from '@/types/mozo';
import { mockMozoService } from '../../services/mockMozoService';

interface ModalUnirMesasProps {
  isOpen: boolean;
  onClose: () => void;
  mesaTitularId: string;
  onConfirmarUnion: (titularId: string, secundariasIds: string[]) => Promise<void>;
}

export const ModalUnirMesas: React.FC<ModalUnirMesasProps> = ({
  isOpen,
  onClose,
  mesaTitularId,
  onConfirmarUnion,
}) => {
  const [cargando, setCargando] = useState(true);
  const [datosCandidatas, setDatosCandidatas] = useState<CandidatasUnionResponseDTO | null>(null);
  const [seleccionadasIds, setSeleccionadasIds] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && mesaTitularId) {
      cargarCandidatas();
    }
  }, [isOpen, mesaTitularId]);

  const cargarCandidatas = async () => {
    setCargando(true);
    setErrorMsg(null);
    setSeleccionadasIds([]);
    try {
      const res = await mockMozoService.obtenerCandidatasUnion(mesaTitularId);
      if (res.exito && res.datos) {
        setDatosCandidatas(res.datos);
        // Preseleccionar por defecto la contigua recomendada si existe (ej. Mesa 03)
        const contiguaLibre = res.datos.candidatas.find((c) => c.elegible && c.numero === '03');
        if (contiguaLibre) {
          setSeleccionadasIds([contiguaLibre.id]);
        }
      } else {
        setErrorMsg('No se pudieron obtener las mesas del salón.');
      }
    } catch {
      setErrorMsg('Error de red al consultar candidatas de salón.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  const toggleSeleccion = (candidata: CandidataUnionMesaDTO) => {
    if (!candidata.elegible) return;

    setSeleccionadasIds((prev) => {
      if (prev.includes(candidata.id)) {
        return prev.filter((id) => id !== candidata.id);
      } else {
        return [...prev, candidata.id];
      }
    });
  };

  const numeroTitular = datosCandidatas?.numero_origen || '02';
  const capTitular = datosCandidatas?.capacidad_origen || 4;

  const secundariasSeleccionadas =
    datosCandidatas?.candidatas.filter((c) => seleccionadasIds.includes(c.id)) || [];

  const capSecundarias = secundariasSeleccionadas.reduce((sum, c) => sum + c.capacidad, 0);
  const capTotal = capTitular + capSecundarias;

  const numerosAgrupados = [
    numeroTitular,
    ...secundariasSeleccionadas.map((c) => c.numero),
  ].sort((a, b) => Number(a) - Number(b));

  const labelOficial = `Mesa [ ${numerosAgrupados.join(' ; ')} ]`;

  const handleConfirmar = async () => {
    if (seleccionadasIds.length === 0) return;
    setGuardando(true);
    try {
      await onConfirmarUnion(mesaTitularId, seleccionadasIds);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al unir las mesas');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-[720px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera Grayscale Blueprint + Acentos Áurea */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-navy flex items-center justify-center border border-aurea-copper/40 text-aurea-champagne shadow-inner">
              <Link2 className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wide flex items-center gap-2">
                <span>🔗 Unir Mesas con Mesa {numeroTitular}</span>
              </h2>
              <p className="text-xs text-slate-300">
                Mesa Titular: <strong className="text-aurea-champagne">Mesa {numeroTitular}</strong> (Capacidad: 👤 x {capTitular}) • Salón Principal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <p className="text-xs text-slate-600 font-medium">
              Toca en el plano visual la mesa contigua desocupada que deseas anexar para conformar el grupo:
            </p>
          </div>

          {cargando ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-aurea-copper" />
              <span className="text-xs font-medium">Cargando distribución del salón...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <>
              {/* Barra de Distribución Física */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>DISTRIBUCIÓN FÍSICA DEL SALÓN (10 MESAS)</span>
                <span className="text-aurea-copper normal-case font-normal text-xs">
                  Toca una mesa para unir
                </span>
              </div>

              {/* Mini-Plano de Salón: Cuadrícula interactiva 5 columnas x 2 filas */}
              <div className="grid grid-cols-5 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 select-none">
                {/* 1. M-01 */}
                {renderCardCandidata('01', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 2. M-02 (Titular) */}
                {renderCardCandidata('02', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 3. M-03 */}
                {renderCardCandidata('03', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 4. M-04 */}
                {renderCardCandidata('04', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 5. M-05 */}
                {renderCardCandidata('05', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 6. M-06 */}
                {renderCardCandidata('06', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 7. M-07 */}
                {renderCardCandidata('07', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 8. M-08 */}
                {renderCardCandidata('08', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 9. M-09 */}
                {renderCardCandidata('09', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
                {/* 10. M-10 */}
                {renderCardCandidata('10', datosCandidatas?.candidatas, numeroTitular, capTitular, seleccionadasIds, toggleSeleccion)}
              </div>

              {/* Leyenda Visual */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-700 inline-block" />
                  Mesa Titular
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 border border-amber-600 inline-block" />
                  Seleccionada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-white border border-dashed border-emerald-500 inline-block" />
                  Libre Elegible
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300 inline-block" />
                  Bloqueada (Ocupada/Fija)
                </span>
              </div>

              {/* Tarjeta Proyectiva en Vivo (Live Calculation Summary) */}
              <div className="p-4 rounded-xl bg-slate-950 text-white border border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-aurea-champagne">
                    ETIQUETA OFICIAL EN SALÓN, COCINA & CAJA:
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {secundariasSeleccionadas.length > 0 ? labelOficial : `Mesa [ ${numeroTitular} ]`}
                  </span>
                </div>

                {secundariasSeleccionadas.length > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      Titular: <span className="font-semibold text-white">Mesa {numeroTitular} ({capTitular}p)</span>
                      {secundariasSeleccionadas.map((s) => (
                        <span key={s.id} className="text-slate-300">
                          {' '}+ Sec: <span className="font-semibold text-amber-300">Mesa {s.numero} ({s.capacidad}p)</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>CAPACIDAD: 👤 x {capTotal}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Toca al menos una mesa libre del mapa para calcular la capacidad y etiqueta resultante.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer del Modal (Botones Touch-First >= 48px) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors min-h-[44px]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={seleccionadasIds.length === 0 || guardando}
            className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-sm ${
              seleccionadasIds.length === 0 || guardando
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-aurea-navy hover:bg-[#123156] text-[#F4D7B0] border border-[#D5A06F]/60 active:scale-98 shadow-md'
            }`}
          >
            {guardando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-aurea-copper" />
                <span>Vinculando mesas...</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 text-aurea-copper" />
                <span>Confirmar y Crear {labelOficial}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar de renderizado de tarjeta en el Mini-Mapa 5x2
function renderCardCandidata(
  num: string,
  candidatas: CandidataUnionMesaDTO[] | undefined,
  numeroTitular: string,
  capTitular: number,
  seleccionadas: string[],
  onToggle: (c: CandidataUnionMesaDTO) => void
) {
  // Caso 1: Es la mesa titular
  if (num === numeroTitular) {
    return (
      <div
        key={`titular-${num}`}
        className="flex flex-col items-center justify-between p-2 rounded-xl bg-slate-900 border-2 border-slate-700 text-white min-h-[76px] shadow-sm relative ring-2 ring-aurea-copper/40"
      >
        <span className="text-[10px] font-mono font-bold text-aurea-champagne">M-{num} ★</span>
        <span className="text-[9px] text-slate-300">{capTitular}p</span>
        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-aurea-copper text-slate-950 uppercase">
          TITULAR
        </span>
      </div>
    );
  }

  // Buscar la candidata en la lista
  const candidata = candidatas?.find((c) => c.numero === num);
  if (!candidata) {
    return (
      <div
        key={`empty-${num}`}
        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 min-h-[76px] text-xs"
      >
        <span>M-{num}</span>
      </div>
    );
  }

  const estaSeleccionada = seleccionadas.includes(candidata.id);

  if (estaSeleccionada) {
    return (
      <button
        key={candidata.id}
        type="button"
        onClick={() => onToggle(candidata)}
        className="flex flex-col items-center justify-between p-2 rounded-xl bg-amber-500/15 border-2 border-amber-500 text-slate-950 min-h-[76px] shadow-md transition-all active:scale-95"
      >
        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-900">
          <span>M-{num}</span>
          <Check className="w-3 h-3 text-amber-700" />
        </div>
        <span className="text-[9px] text-slate-600 font-semibold">{candidata.capacidad}p</span>
        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500 text-slate-950">
          ✓ UNIR
        </span>
      </button>
    );
  }

  if (candidata.elegible) {
    return (
      <button
        key={candidata.id}
        type="button"
        onClick={() => onToggle(candidata)}
        className="flex flex-col items-center justify-between p-2 rounded-xl bg-white border-2 border-dashed border-emerald-500 hover:border-emerald-600 hover:bg-emerald-50/50 text-slate-800 min-h-[76px] shadow-2xs transition-all cursor-pointer active:scale-95"
      >
        <span className="text-[10px] font-mono font-bold text-emerald-800">M-{num}</span>
        <span className="text-[9px] text-slate-500">{candidata.capacidad}p</span>
        <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          LIBRE
        </span>
      </button>
    );
  }

  // No elegible / Bloqueada
  const badgeText = !candidata.permite_union
    ? 'FIJA'
    : candidata.estado === 'bloqueada'
    ? 'RSV'
    : 'OCUP';

  return (
    <div
      key={candidata.id}
      title={candidata.motivo_bloqueo || 'No disponible para unión'}
      className="flex flex-col items-center justify-between p-2 rounded-xl bg-slate-200/70 border border-slate-300 text-slate-400 min-h-[76px] opacity-70 cursor-not-allowed"
    >
      <span className="text-[10px] font-mono font-bold text-slate-500">M-{num}</span>
      <span className="text-[9px] text-slate-400">{candidata.capacidad}p</span>
      <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-slate-300 text-slate-600">
        [{badgeText}]
      </span>
    </div>
  );
}
