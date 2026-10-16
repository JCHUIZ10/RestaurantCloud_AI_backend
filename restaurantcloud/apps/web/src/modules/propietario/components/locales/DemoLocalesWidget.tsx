import React, { useState } from 'react';
import { propietarioLocalesService } from '../../services/propietarioLocalesService';
import { Button } from '@/components/ui/Button';
import {
  FlaskConical,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Crown,
  ChevronUp,
} from 'lucide-react';

interface DemoLocalesWidgetProps {
  onRefresh: () => void;
  mostrarToast: (tipo: 'success' | 'error', mensaje: string) => void;
}

export const DemoLocalesWidget: React.FC<DemoLocalesWidgetProps> = ({
  onRefresh,
  mostrarToast,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [bloqueoDuro, setBloqueoDuro] = useState(() =>
    propietarioLocalesService.getSimularBloqueoDuro()
  );
  const [cupoLleno, setCupoLleno] = useState(() =>
    propietarioLocalesService.getForzarCupoLleno()
  );

  const toggleBloqueoDuro = () => {
    const nuevo = !bloqueoDuro;
    propietarioLocalesService.setSimularBloqueoDuro(nuevo);
    setBloqueoDuro(nuevo);
    mostrarToast(
      'success',
      nuevo
        ? 'QA: Bloqueo duro activado (Auditoría detectará caja abierta y pedidos pendientes)'
        : 'QA: Auditoría limpia (Se permitirá desactivar sin bloqueos con código DESACTIVAR)'
    );
  };

  const toggleCupoLleno = () => {
    const nuevo = !cupoLleno;
    propietarioLocalesService.setForzarCupoLleno(nuevo);
    setCupoLleno(nuevo);
    mostrarToast(
      'success',
      nuevo
        ? 'QA: Límite de cuota forzado (3/3 locales alcanzados, botón de registro inhabilitado)'
        : 'QA: Cuota normal restaurada (Cupos disponibles en Plan Pro)'
    );
    onRefresh();
  };

  const toggleSanIsidroAutogestion = () => {
    // ID de ÁUREA San Isidro en LOCALES_SEED
    const sanIsidroId = '00000000-0000-4000-8000-000000000020';
    propietarioLocalesService.toggleAutogestion(sanIsidroId);
    mostrarToast(
      'success',
      'QA: Alternada la autogestión de ÁUREA San Isidro (Verifica el badge 👑 y botón Acceder a Sede)'
    );
    onRefresh();
  };

  const handleRestablecer = () => {
    propietarioLocalesService.restablecerSemillas();
    setBloqueoDuro(true);
    setCupoLleno(false);
    mostrarToast('success', 'QA: Semillas y configuración de locales restauradas a estado original.');
    onRefresh();
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-aurea-navy text-white shadow-xl hover:bg-aurea-navy/90 border-2 border-aurea-gold/40 transition-all hover:scale-105"
        >
          <FlaskConical className="w-4 h-4 text-aurea-gold animate-pulse" />
          <span className="text-xs font-bold tracking-wide">QA Sandbox &bull; Locales</span>
          <ChevronUp className="w-3.5 h-3.5 text-aurea-gold" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white rounded-3xl border-2 border-aurea-navy/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-aurea-navy text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-aurea-gold" />
              <span className="text-xs font-bold font-mono tracking-wider">
                SIMULADOR QA &bull; CU-PROP-04
              </span>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls Body */}
          <div className="p-5 space-y-4 text-xs">
            {/* Toggle Bloqueo Duro */}
            <div className="p-3 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/20 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-aurea-navy flex items-center gap-1.5">
                  {bloqueoDuro ? (
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Bloqueo Duro de Desactivación</span>
                </div>
                <p className="text-[11px] text-aurea-navy/60 mt-0.5">
                  {bloqueoDuro
                    ? 'Simula 1 caja abierta + 2 mesas en comanda'
                    : 'Simula sede limpia sin operaciones pendientes'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleBloqueoDuro}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  bloqueoDuro
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {bloqueoDuro ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            {/* Toggle Cuota Llena */}
            <div className="p-3 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/20 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-aurea-navy flex items-center gap-1.5">
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${
                      cupoLleno ? 'text-amber-600' : 'text-aurea-navy/40'
                    }`}
                  />
                  <span>Forzar Límite de Cuota (3/3)</span>
                </div>
                <p className="text-[11px] text-aurea-navy/60 mt-0.5">
                  {cupoLleno
                    ? 'Simula Plan Pro al 100% (botón crear deshabilitado)'
                    : 'Muestra cupos disponibles (2/3 locales)'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleCupoLleno}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  cupoLleno
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-aurea-copper/20 text-aurea-navy'
                }`}
              >
                {cupoLleno ? 'Lleno' : 'Libre'}
              </button>
            </div>

            {/* Botón Alternar Autogestión en San Isidro */}
            <div className="p-3 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/20 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-aurea-navy">
                <Crown className="w-3.5 h-3.5 text-aurea-gold" />
                <span>Autogestión San Isidro (Requisito UX)</span>
              </div>
              <p className="text-[11px] text-aurea-navy/60">
                Alterna entre sede administrada por Propietario (con botón directo de acceso) o con
                administrador externo.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSanIsidroAutogestion}
                className="w-full text-xs border-aurea-copper/40 text-aurea-navy hover:bg-aurea-gold/15"
              >
                Alternar Autogestión San Isidro
              </Button>
            </div>

            {/* Reset semillas */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRestablecer}
              className="w-full text-xs text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-copper/10 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Semillas Predeterminadas</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
