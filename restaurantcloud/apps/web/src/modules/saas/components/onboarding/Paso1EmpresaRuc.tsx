import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { validarRucModulo11 } from '@/modules/saas/services/mockSaasTenantsService';

interface Paso1EmpresaRucProps {
  ruc: string;
  razonSocial: string;
  direccionSede: string;
  onChange: (fields: { ruc?: string; razonSocial?: string; direccionSede?: string }) => void;
  onSiguiente: () => void;
}

export const Paso1EmpresaRuc: React.FC<Paso1EmpresaRucProps> = ({
  ruc,
  razonSocial,
  direccionSede,
  onChange,
  onSiguiente,
}) => {
  const [rucFeedback, setRucFeedback] = useState<{
    valido: boolean;
    mensaje?: string;
    tipoLabel?: string;
  }>({ valido: false });

  useEffect(() => {
    if (ruc.trim().length === 11) {
      const res = validarRucModulo11(ruc);
      setRucFeedback(res);
    } else {
      setRucFeedback({
        valido: false,
        mensaje: 'Debe ingresar exactamente 11 dígitos numéricos.',
      });
    }
  }, [ruc]);

  const esValido =
    rucFeedback.valido && razonSocial.trim().length >= 3 && direccionSede.trim().length >= 5;

  return (
    <div className="bg-white rounded-3xl border border-aurea-copper/25 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-aurea-copper/15">
        <div className="w-10 h-10 rounded-xl bg-aurea-champagne/40 border border-aurea-copper/40 flex items-center justify-center text-aurea-navy">
          <Building2 className="w-5 h-5 text-aurea-navy" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy">
            1. Identificación Legal y Fiscal de la Empresa
          </h2>
          <p className="text-xs sm:text-sm text-aurea-navy/70">
            Ingreso de RUC con validación matemática Módulo 11 en tiempo real (cero llamadas externas).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* RUC */}
        <div className="sm:col-span-1 space-y-1.5">
          <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
            RUC de la Empresa (11 dígitos): *
          </label>
          <input
            type="text"
            maxLength={11}
            value={ruc}
            onChange={(e) => onChange({ ruc: e.target.value.replace(/\D/g, '') })}
            placeholder="ej. 20603849201"
            className={`w-full px-4 py-3 rounded-xl bg-white border text-base font-mono focus:outline-none focus:ring-2 transition-all ${
              rucFeedback.valido
                ? 'border-emerald-400 focus:ring-emerald-200 text-emerald-950 font-bold bg-emerald-50/20'
                : 'border-aurea-copper/30 focus:ring-aurea-copper/40 text-aurea-navy'
            }`}
          />
          <div className="text-xs pt-0.5">
            {rucFeedback.valido ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rucFeedback.tipoLabel} (Módulo 11 conforme)</span>
              </span>
            ) : ruc.length > 0 ? (
              <span className="text-rose-700 font-medium flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{rucFeedback.mensaje}</span>
              </span>
            ) : (
              <span className="text-aurea-navy/50 text-[11px]">
                Prefijo 20: Persona Jurídica • Prefijo 10/15/17: Persona Natural
              </span>
            )}
          </div>
        </div>

        {/* Razón Social */}
        <div className="sm:col-span-1 space-y-1.5">
          <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Razón Social Oficial Registrada: *
          </label>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => onChange({ razonSocial: e.target.value })}
            placeholder="ej. Cevichería Puerto Marino S.A.C."
            className="w-full px-4 py-3 rounded-xl bg-white border border-aurea-copper/30 text-sm font-semibold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
          />
          <span className="text-aurea-navy/50 text-[11px] block">
            Nombre legal que figurará en el expediente y contratos
          </span>
        </div>

        {/* Sede Principal y Dirección */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Dirección Física de la Primera Sede (Local Principal): *
          </label>
          <input
            type="text"
            value={direccionSede}
            onChange={(e) => onChange({ direccionSede: e.target.value })}
            placeholder="ej. Av. Primavera 450, Santiago de Surco, Lima"
            className="w-full px-4 py-3 rounded-xl bg-white border border-aurea-copper/30 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
          />
          <span className="text-aurea-navy/50 text-[11px] block">
            Se registrará atómicamente en la tabla <code className="text-aurea-navy font-mono font-bold">local</code> de PostgreSQL 16
          </span>
        </div>
      </div>

      {/* Botón de Siguiente */}
      <div className="pt-4 border-t border-aurea-copper/15 flex justify-end">
        <button
          type="button"
          disabled={!esValido}
          onClick={onSiguiente}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-aurea-navy text-white hover:bg-opacity-95 shadow-md border border-aurea-copper/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continuar a Datos del Propietario</span>
          <ArrowRight className="w-4 h-4 text-aurea-copper" />
        </button>
      </div>
    </div>
  );
};
