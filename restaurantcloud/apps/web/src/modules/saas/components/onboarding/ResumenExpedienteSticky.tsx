import React from 'react';
import {
  FileText,
  Building2,
  User,
  CreditCard,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { AltaManualTenantRequestDTO } from '@/types/saasTenants';

interface ResumenExpedienteStickyProps {
  pasoActual: number;
  formData: AltaManualTenantRequestDTO;
}

const NOMBRES_PLANES: Record<number, { nombre: string; color: string }> = {
  1: { nombre: 'Starter', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  2: { nombre: 'Plan Pro', color: 'bg-aurea-champagne/40 text-aurea-navy border-aurea-copper/40' },
  3: { nombre: 'Enterprise', color: 'bg-purple-100 text-purple-900 border-purple-300' },
};

export const ResumenExpedienteSticky: React.FC<ResumenExpedienteStickyProps> = ({
  pasoActual,
  formData,
}) => {
  const planInfo = NOMBRES_PLANES[formData.plan_id] || NOMBRES_PLANES[2];
  const esAnual = formData.ciclo_facturacion === 'anual';

  return (
    <aside className="lg:sticky lg:top-24 space-y-4">
      {/* Tarjeta Principal de Resumen */}
      <div className="bg-white rounded-3xl border border-aurea-copper/25 shadow-sm overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-aurea-navy to-aurea-navy/90 p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-aurea-gold/20 text-aurea-gold border border-aurea-gold/30">
              <Sparkles className="w-3.5 h-3.5" />
              Expediente en Trámite
            </span>
            <span className="text-xs font-medium text-white/70">
              Paso {Math.min(pasoActual, 4)} de 4
            </span>
          </div>
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-aurea-copper" />
            Resumen de Contratación
          </h3>
          <p className="text-xs text-white/75 mt-0.5">
            Liquidación en tiempo real para PostgreSQL 16
          </p>
        </div>

        <div className="p-5 space-y-4 text-xs divide-y divide-aurea-copper/15">
          {/* Bloque 1: Empresa & RUC */}
          <div className="space-y-1.5 pt-1 first:pt-0">
            <div className="flex items-center gap-2 text-aurea-navy font-bold">
              <Building2 className="w-4 h-4 text-aurea-copper" />
              <span>1. Identidad Fiscal</span>
            </div>
            {formData.ruc ? (
              <div className="pl-6 space-y-1">
                <p className="font-mono font-bold text-aurea-navy text-sm">
                  RUC: {formData.ruc}
                </p>
                <p className="font-medium text-slate-800 truncate" title={formData.razon_social}>
                  {formData.razon_social || 'Razón social pendiente...'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  📍 Sedes: Se registrará tras la activación del propietario
                </p>
              </div>
            ) : (
              <p className="pl-6 text-slate-400 italic">Pendiente de ingreso en Paso 1...</p>
            )}
          </div>

          {/* Bloque 2: Titular */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 text-aurea-navy font-bold">
              <User className="w-4 h-4 text-aurea-copper" />
              <span>2. Titular Administrador</span>
            </div>
            {formData.propietario_nombre || formData.propietario_email ? (
              <div className="pl-6 space-y-1">
                <p className="font-semibold text-slate-800">
                  {formData.propietario_nombre || 'Nombre no especificado'}
                </p>
                <p className="text-slate-600 truncate" title={formData.propietario_email}>
                  ✉️ {formData.propietario_email || 'correo@ejemplo.com'}
                </p>
                <p className="text-slate-600">
                  📞 {formData.propietario_telefono || '+51 900 000 000'}
                </p>
              </div>
            ) : (
              <p className="pl-6 text-slate-400 italic">Pendiente de ingreso en Paso 2...</p>
            )}
          </div>

          {/* Bloque 3: Plan y Ciclo */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 text-aurea-navy font-bold">
              <CreditCard className="w-4 h-4 text-aurea-copper" />
              <span>3. Plan y Vigencia</span>
            </div>
            <div className="pl-6 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${planInfo.color}`}>
                  {planInfo.nombre}
                </span>
                <span className="capitalize font-semibold text-aurea-navy">
                  Ciclo {formData.ciclo_facturacion}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
                <span>
                  {formData.fecha_inicio} al {formData.fecha_fin_periodo}
                </span>
              </div>
              {esAnual && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  🎉 Bonificación anual: 2 meses gratis aplicados
                </div>
              )}
            </div>
          </div>

          {/* Bloque 4: Liquidación Económica */}
          <div className="space-y-2 pt-3">
            <div className="flex items-center gap-2 text-aurea-navy font-bold">
              <Receipt className="w-4 h-4 text-aurea-copper" />
              <span>4. Liquidación Contable</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-aurea-ivory/80 border border-aurea-copper/20 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-aurea-navy/80 font-medium">Monto a Asentar:</span>
                <span className="text-base font-mono font-bold text-emerald-700">
                  S/ {Number(formData.monto_cobrado_pen || 0).toFixed(2)} PEN
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Medio de Pago:</span>
                <span className="font-semibold text-aurea-navy capitalize">
                  {formData.origen_pago.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>N° Operación:</span>
                <span className="font-mono font-bold text-aurea-navy">
                  {formData.numero_operacion || 'PENDIENTE'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fecha Abono:</span>
                <span>{formData.fecha_operacion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Salvaguarda PostgreSQL 16 (Cero Datos Inventados) */}
      <div className="bg-white rounded-3xl border border-aurea-copper/20 p-5 shadow-sm space-y-3 text-xs">
        <h4 className="font-serif font-bold text-aurea-navy flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Salvaguarda de Integridad PostgreSQL 16
        </h4>
        <p className="text-slate-600">
          Esta alta manual impactará atómicamente 4 tablas maestras de <code className="font-mono text-aurea-navy font-bold">02_schema_ddl.sql</code>:
        </p>

        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${formData.ruc.length === 11 ? 'text-emerald-600' : 'text-slate-300'}`} />
            <div>
              <span className="font-mono font-bold text-aurea-navy">empresa</span>
              <p className="text-slate-500">RUC verificado con Módulo 11, razón social y estado activo.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${formData.propietario_email.includes('@') ? 'text-emerald-600' : 'text-slate-300'}`} />
            <div>
              <span className="font-mono font-bold text-aurea-navy">usuario</span>
              <p className="text-slate-500">Titular propietario con capability token de activación (72h).</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${formData.plan_id > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
            <div>
              <span className="font-mono font-bold text-aurea-navy">suscripcion</span>
              <p className="text-slate-500">Plan comercial vinculado con fechas de vigencia y ciclo.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${formData.monto_cobrado_pen > 0 && formData.numero_operacion.length >= 4 ? 'text-emerald-600' : 'text-slate-300'}`} />
            <div>
              <span className="font-mono font-bold text-aurea-navy">pago</span>
              <p className="text-slate-500">Comprobante con estado 'exitoso' y auditoría contable.</p>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
};
