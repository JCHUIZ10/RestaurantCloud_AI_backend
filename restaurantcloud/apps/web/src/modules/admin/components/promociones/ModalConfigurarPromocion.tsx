import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import {
  PromocionAdminDTO,
  CrearPromocionRequest,
  TipoDescuentoPromocion,
  TipoLimiteUsosPromocion,
} from '@/types/admin';

interface ModalConfigurarPromocionProps {
  isOpen: boolean;
  onClose: () => void;
  promocionParaEditar: PromocionAdminDTO | null;
  onGuardar: (req: CrearPromocionRequest) => Promise<boolean>;
}

export const ModalConfigurarPromocion: React.FC<ModalConfigurarPromocionProps> = ({
  isOpen,
  onClose,
  promocionParaEditar,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<TipoDescuentoPromocion>('porcentaje');
  const [valor, setValor] = useState<number>(15);
  const [tieneTope, setTieneTope] = useState(false);
  const [topeMaximo, setTopeMaximo] = useState<number | null>(40);
  const [fechaInicio, setFechaInicio] = useState('2026-10-01');
  const [fechaFin, setFechaFin] = useState('2026-10-31');

  // Toggles limpios
  const [exigeMinimo, setExigeMinimo] = useState(false);
  const [montoMinimo, setMontoMinimo] = useState<number>(60);

  const [limitaUsos, setLimitaUsos] = useState(false);
  const [tipoLimiteUsos, setTipoLimiteUsos] = useState<TipoLimiteUsosPromocion>('global');
  const [limiteUsos, setLimiteUsos] = useState<number>(50);

  const [restringeHorario, setRestringeHorario] = useState(false);
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [horaInicio, setHoraInicio] = useState('18:00');
  const [horaFin, setHoraFin] = useState('21:00');

  // Simulador de Caja en Vivo
  const [consumoPrueba, setConsumoPrueba] = useState<number>(120);

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    if (promocionParaEditar) {
      setNombre(promocionParaEditar.nombre);
      setDescripcion(promocionParaEditar.descripcion || '');
      setTipoDescuento(promocionParaEditar.tipo_descuento);
      setValor(promocionParaEditar.valor);
      setTieneTope(promocionParaEditar.tope_maximo_descuento != null);
      setTopeMaximo(promocionParaEditar.tope_maximo_descuento || 40);
      setFechaInicio(promocionParaEditar.fecha_inicio);
      setFechaFin(promocionParaEditar.fecha_fin);

      setExigeMinimo(promocionParaEditar.monto_minimo_consumo > 0);
      setMontoMinimo(promocionParaEditar.monto_minimo_consumo || 60);

      setLimitaUsos(promocionParaEditar.limite_usos != null && promocionParaEditar.tipo_limite_usos !== 'sin_limite');
      setTipoLimiteUsos(promocionParaEditar.tipo_limite_usos || 'global');
      setLimiteUsos(promocionParaEditar.limite_usos || 50);

      const tieneRestriccionDias =
        promocionParaEditar.dias_semana.length < 7 ||
        Boolean(promocionParaEditar.hora_inicio && promocionParaEditar.hora_fin);
      setRestringeHorario(tieneRestriccionDias);
      setDiasSemana(promocionParaEditar.dias_semana || [1, 2, 3, 4, 5, 6, 7]);
      setHoraInicio(promocionParaEditar.hora_inicio || '18:00');
      setHoraFin(promocionParaEditar.hora_fin || '21:00');
      setErrorValidacion(null);
    } else {
      // Valores por defecto para nueva promoción
      setNombre('');
      setDescripcion('');
      setTipoDescuento('porcentaje');
      setValor(15);
      setTieneTope(false);
      setTopeMaximo(40);
      setFechaInicio('2026-10-01');
      setFechaFin('2026-10-31');
      setExigeMinimo(false);
      setMontoMinimo(60);
      setLimitaUsos(false);
      setTipoLimiteUsos('global');
      setLimiteUsos(50);
      setRestringeHorario(false);
      setDiasSemana([1, 2, 3, 4, 5, 6, 7]);
      setHoraInicio('18:00');
      setHoraFin('21:00');
      setErrorValidacion(null);
    }
  }, [promocionParaEditar, isOpen]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !guardando) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, guardando]);

  if (!isOpen) return null;

  const toggleDia = (d: number) => {
    if (diasSemana.includes(d)) {
      if (diasSemana.length === 1) return; // Al menos un día seleccionado
      setDiasSemana(diasSemana.filter((item) => item !== d));
    } else {
      setDiasSemana([...diasSemana, d].sort());
    }
  };

  // Cálculo en tiempo real del simulador
  const cumpleMinimo = !exigeMinimo || consumoPrueba >= (montoMinimo || 0);

  let descuentoSimulado = 0;
  let topeAplicado = false;

  if (cumpleMinimo) {
    if (tipoDescuento === 'porcentaje') {
      const calculo = (consumoPrueba * (valor || 0)) / 100;
      if (tieneTope && topeMaximo && calculo > topeMaximo) {
        descuentoSimulado = topeMaximo;
        topeAplicado = true;
      } else {
        descuentoSimulado = calculo;
      }
    } else {
      descuentoSimulado = Math.min(valor || 0, consumoPrueba);
    }
  }

  const totalNetoSimulado = Math.max(0, consumoPrueba - descuentoSimulado);
  const baseImponibleSimulada = Math.round((totalNetoSimulado / 1.18) * 100) / 100;
  const igvSimulado = Math.round((totalNetoSimulado - baseImponibleSimulada) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setErrorValidacion('El nombre de la promoción debe tener al menos 3 caracteres.');
      return;
    }

    if (fechaInicio > fechaFin) {
      setErrorValidacion('La fecha de inicio no puede ser posterior a la fecha de finalización.');
      return;
    }

    if (valor <= 0) {
      setErrorValidacion('El valor del descuento debe ser mayor a 0.');
      return;
    }

    if (tipoDescuento === 'porcentaje' && valor > 100) {
      setErrorValidacion('El porcentaje de descuento no puede ser superior a 100%.');
      return;
    }

    if (restringeHorario && diasSemana.length === 0) {
      setErrorValidacion('Debes seleccionar al menos un día de la semana.');
      return;
    }

    const payload: CrearPromocionRequest = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo_descuento: tipoDescuento,
      valor: Number(valor),
      tope_maximo_descuento: tipoDescuento === 'porcentaje' && tieneTope ? Number(topeMaximo) : null,
      monto_minimo_consumo: exigeMinimo ? Number(montoMinimo) : 0,
      dias_semana: restringeHorario ? diasSemana : [1, 2, 3, 4, 5, 6, 7],
      hora_inicio: restringeHorario ? horaInicio : null,
      hora_fin: restringeHorario ? horaFin : null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      tipo_limite_usos: limitaUsos ? tipoLimiteUsos : 'sin_limite',
      limite_usos: limitaUsos ? Number(limiteUsos) : null,
      activa: promocionParaEditar ? promocionParaEditar.activa : true,
    };

    setGuardando(true);
    try {
      const ok = await onGuardar(payload);
      if (ok) {
        onClose();
      }
    } finally {
      setGuardando(false);
    }
  };

  const nombresDiasCompletos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto transition-all transform max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {promocionParaEditar ? `Editar Promoción: ${promocionParaEditar.codigo}` : 'Crear Nueva Promoción de Sede'}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">
              Configura el descuento, vigencia y reglas de aplicación automática en caja (<code className="text-slate-300">CU-CAJA-02</code>)
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Bloque 1: Identificación Comercial */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre Comercial de la Promoción *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Martes de Brasas Criollas (20% OFF)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800 text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Descripción para Comprobante / Ticket (Opcional)
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Descuento especial de 20% en consumo de salón..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700 text-xs"
              />
            </div>
          </div>

          {/* Bloque 2: Tipo de Descuento (Selector de Tarjetas) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tipo de Descuento *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoDescuento('porcentaje')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  tipoDescuento === 'porcentaje'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${tipoDescuento === 'porcentaje' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                    Descuento Porcentual (%)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Deduce un % sobre el subtotal de la comanda
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoDescuento('monto_fijo')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  tipoDescuento === 'monto_fijo'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${tipoDescuento === 'monto_fijo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                    Descuento Monto Fijo (S/)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Deduce una cantidad exacta fija en Soles
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Bloque 3: Valores Numéricos y Vigencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {tipoDescuento === 'porcentaje' ? 'Valor Descuento (%) *' : 'Valor Descuento (S/) *'}
              </label>
              <input
                type="number"
                min={tipoDescuento === 'porcentaje' ? 1 : 0.5}
                max={tipoDescuento === 'porcentaje' ? 100 : 9999}
                step={tipoDescuento === 'porcentaje' ? 1 : 0.5}
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-xs sm:text-sm"
                required
              />
            </div>

            {/* Tope Máximo (solo para porcentaje) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tope Máx (S/)
                </label>
                {tipoDescuento === 'porcentaje' && (
                  <button
                    type="button"
                    onClick={() => setTieneTope(!tieneTope)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {tieneTope ? 'Quitar tope' : '+ Añadir tope'}
                  </button>
                )}
              </div>
              {tipoDescuento === 'porcentaje' ? (
                tieneTope ? (
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={topeMaximo || ''}
                    onChange={(e) => setTopeMaximo(Number(e.target.value))}
                    placeholder="Ej. S/ 40.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-xs sm:text-sm"
                  />
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium italic">
                    Sin tope máximo
                  </div>
                )
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium italic">
                  No aplica a monto fijo
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 text-xs"
                required
              />
            </div>
          </div>

          {/* Bloque 4: Toggles Limpios de Condiciones Operativas */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Condiciones Operativas Adicionales (Toggles Limpios)
            </h4>

            {/* Toggle 1: Consumo Mínimo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exigeMinimo}
                  onChange={(e) => setExigeMinimo(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Exigir consumo mínimo en cuenta de salón
                </span>
              </label>
              {exigeMinimo && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-xs text-slate-500 font-medium">Mínimo:</span>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      S/
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={5}
                      value={montoMinimo}
                      onChange={(e) => setMontoMinimo(Number(e.target.value))}
                      className="w-full pl-7 pr-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 2: Límite de Usos (Cuponera / Frecuencia) */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limitaUsos}
                    onChange={(e) => setLimitaUsos(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                    Limitar cupo de usos (Desactivar en caja automáticamente al agotarse)
                  </span>
                </label>
                {!limitaUsos && (
                  <span className="text-[11px] text-slate-400 italic">Ilimitada (Sin cuota de canje)</span>
                )}
              </div>

              {limitaUsos && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 mt-1 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Frecuencia del Límite de Cupo:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTipoLimiteUsos('diario')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            tipoLimiteUsos === 'diario'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🔄 Cupo Diario Recurrente
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoLimiteUsos('global')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            tipoLimiteUsos === 'global'
                              ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🌐 Cupo Global de Campaña
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs text-slate-600 font-bold">
                        {tipoLimiteUsos === 'diario' ? 'Mesas por día:' : 'Mesas en total:'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={5}
                        value={limiteUsos}
                        onChange={(e) => setLimiteUsos(Math.max(1, Number(e.target.value)))}
                        className="w-24 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-right"
                      />
                      <span className="text-xs text-slate-400">mesas</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">💡 Regla en Caja:</span>
                    <span>
                      Al completarse los <strong>{limiteUsos} canjes</strong>, la promoción se desactivará automáticamente en el POS y figurará como{' '}
                      <strong>{tipoLimiteUsos === 'diario' ? 'NO DISPONIBLE HOY (se renovará mañana en 0)' : 'AGOTADA DEFINITIVAMENTE'}</strong>.
                      {tieneTope && (
                        <span className="block mt-0.5 text-slate-600">
                          (El tope en Soles de S/ {Number(topeMaximo).toFixed(2)} aplica como techo por cuenta individual).
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 3: Restringir a días de semana y horario */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restringeHorario}
                  onChange={(e) => setRestringeHorario(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Restringir a días de semana y franja horaria (Happy Hour)
                </span>
              </label>

              {restringeHorario && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 mt-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Días Válidos de Aplicación en Salón:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7].map((d, idx) => {
                        const activo = diasSemana.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDia(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              activo
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {nombresDiasCompletos[idx]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-600">Franja Horaria:</span>
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                    <span className="text-xs text-slate-400">a</span>
                    <input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bloque 5: ⚡ SIMULADOR EN TIEMPO REAL PARA CAJA (CU-CAJA-02) */}
          <div className="bg-amber-50/70 rounded-2xl border border-amber-300/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-700" />
                ⚡ Simulador en Tiempo Real para Caja (CU-CAJA-02)
              </h4>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded font-bold">
                Cálculo predictivo en 1 clic
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-amber-900 whitespace-nowrap">
                  Consumo comanda prueba:
                </label>
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                    S/
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={10}
                    value={consumoPrueba}
                    onChange={(e) => setConsumoPrueba(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              {exigeMinimo && (
                <div className="text-xs">
                  {cumpleMinimo ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cumple mínimo de S/ {montoMinimo.toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-100/80 px-2.5 py-1 rounded-md">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      No alcanza consumo mínimo (S/ {montoMinimo.toFixed(2)})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Resultado de la simulación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-amber-800 font-medium block">
                  Descuento Calculado
                </span>
                <span className="text-sm font-extrabold text-amber-900 block mt-0.5">
                  - S/ {descuentoSimulado.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {tipoDescuento === 'porcentaje'
                    ? `${valor}% sobre S/ ${consumoPrueba.toFixed(2)}`
                    : 'Deducción fija'}
                  {topeAplicado && ' (Limitado al tope)'}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-amber-800 font-medium block">
                  Total Neto a Cobrar (Caja)
                </span>
                <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                  S/ {totalNetoSimulado.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Ahorro cliente: S/ {descuentoSimulado.toFixed(2)}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[10px] text-amber-800 font-medium block">
                  Desglose Fiscal SUNAT
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 block mt-0.5">
                  Base: S/ {baseImponibleSimulada.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  IGV 18%: S/ {igvSimulado.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción del Modal */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {guardando ? 'Guardando...' : promocionParaEditar ? 'Guardar Cambios' : 'Guardar y Activar Promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
