import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Users,
  Clock,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { propietarioAdminsService } from '../../services/propietarioAdminsService';

interface DemoAdminsWidgetProps {
  onRecargar: () => void;
}

export const DemoAdminsWidget: React.FC<DemoAdminsWidgetProps> = ({
  onRecargar,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [cupoLleno, setCupoLleno] = useState(false);
  const [conflictoCorreo, setConflictoCorreo] = useState(false);

  const handleToggleCupoLleno = () => {
    const estado = propietarioAdminsService.toggleForzarCupoLleno();
    setCupoLleno(estado);
    onRecargar();
  };

  const handleToggleConflictoCorreo = () => {
    const estado = propietarioAdminsService.toggleConflictoCorreo();
    setConflictoCorreo(estado);
  };

  const handleSimularExpirada = () => {
    // Buscar la invitación de Carlos Rojas o la primera pendiente
    propietarioAdminsService.simularInvitacionExpirada('usr-adm-02-carlos');
    onRecargar();
  };

  const handleReset = () => {
    propietarioAdminsService.resetDatabase();
    setCupoLleno(false);
    setConflictoCorreo(false);
    onRecargar();
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans text-xs">
      <div className="bg-aurea-navy text-white rounded-2xl shadow-2xl border-2 border-aurea-copper/50 overflow-hidden max-w-xs transition-all duration-300">
        {/* Cabecera del Widget */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-full px-4 py-2.5 bg-aurea-navy hover:bg-aurea-navy/90 flex items-center justify-between gap-3 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurea-copper animate-spin-slow" />
            <span className="font-bold text-xs tracking-wide">
              Sandbox QA: Administradores
            </span>
          </div>
          {abierto ? (
            <ChevronDown className="w-4 h-4 text-aurea-champagne" />
          ) : (
            <ChevronUp className="w-4 h-4 text-aurea-champagne" />
          )}
        </button>

        {/* Panel de Controles */}
        {abierto && (
          <div className="p-3.5 space-y-2 bg-[#081B31] border-t border-aurea-copper/20">
            <p className="text-[10px] text-aurea-champagne/80 pb-1">
              Simulador interactivo de escenarios de personal y estados UX (CU-PROP-05):
            </p>

            {/* Botón 1: Forzar Cupo Lleno */}
            <Button
              type="button"
              onClick={handleToggleCupoLleno}
              className={`w-full py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-between transition-all ${
                cupoLleno
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-aurea-copper" />
                <span>{cupoLleno ? 'Liberar Cupo' : 'Forzar Cupo Lleno (15/15)'}</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">
                {cupoLleno ? '[LLENO]' : '[DISP]'}
              </span>
            </Button>

            {/* Botón 2: Simular Invitación Expirada */}
            <Button
              type="button"
              onClick={handleSimularExpirada}
              className="w-full py-1.5 px-3 rounded-xl font-bold text-[11px] bg-white/10 text-white hover:bg-white/20 flex items-center gap-2 transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular Invitación Expirada</span>
            </Button>

            {/* Botón 3: Simular Conflicto Correo 409 */}
            <Button
              type="button"
              onClick={handleToggleConflictoCorreo}
              className={`w-full py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-between transition-all ${
                conflictoCorreo
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>Simular Error 409 Correo</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">
                {conflictoCorreo ? '[ON]' : '[OFF]'}
              </span>
            </Button>

            {/* Botón 4: Restablecer Semillas */}
            <Button
              type="button"
              onClick={handleReset}
              className="w-full py-1.5 px-3 rounded-xl font-bold text-[11px] bg-aurea-copper/20 text-aurea-champagne hover:bg-aurea-copper/30 flex items-center justify-center gap-2 transition-all mt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Semillas Áurea</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
