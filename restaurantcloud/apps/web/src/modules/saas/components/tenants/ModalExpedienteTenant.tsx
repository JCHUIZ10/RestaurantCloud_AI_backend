import React, { useEffect } from 'react';
import {
  X,
  Building2,
  CreditCard,
  History,
  Activity,
  Mail,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { TenantDetailResponseDTO } from '@/types/saasTenants';

interface ModalExpedienteTenantProps {
  expediente: TenantDetailResponseDTO | null;
  onClose: () => void;
  onReenviarNotificacion: (empresaId: string) => void;
  onSuspenderPreventivo: (empresaId: string) => void;
  cargandoAccion?: boolean;
}

export const ModalExpedienteTenant: React.FC<ModalExpedienteTenantProps> = ({
  expediente,
  onClose,
  onReenviarNotificacion,
  onSuspenderPreventivo,
  cargandoAccion = false,
}) => {
  // Manejo de cierre con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!expediente) return null;

  const esGracia = expediente.estado_suscripcion === 'periodo_gracia';
  const esSuspendida = expediente.estado_suscripcion === 'suspendida';

  const formatearFecha = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const calcPorcentaje = (actual: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((actual / max) * 100));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-expediente-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-aurea-copper/30 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 bg-aurea-navy text-aurea-ivory border-b border-aurea-copper/30 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-aurea-copper/20 text-aurea-champagne border border-aurea-copper/30">
                Expediente Corporativo 360°
              </span>
              {esGracia && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                  ⚠️ En Período de Gracia (Día {expediente.dia_gracia_actual ?? 2} de 5)
                </span>
              )}
              {esSuspendida && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                  🚫 Cuenta Suspendida por Impago
                </span>
              )}
            </div>
            <h2
              id="modal-expediente-titulo"
              className="font-serif text-xl sm:text-2xl font-bold text-white mt-1.5"
            >
              {expediente.razon_social}
            </h2>
            <p className="text-xs text-white/70 font-mono mt-0.5">
              ID: {expediente.empresa_id} • Código: {expediente.codigo_display} • Registro:{' '}
              {formatearFecha(expediente.fecha_registro)}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar expediente"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-aurea-copper hover:text-white transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrollable con los 4 Bloques Canónicos */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-aurea-navy font-sans">
          {/* BLOQUE 1: Identidad de Empresa & Titular Propietario */}
          <div className="p-4 sm:p-5 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/20 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-aurea-copper/15">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy">
                <Building2 className="w-4 h-4 text-aurea-copper" />
                <span>1. Identidad de Empresa & Titular Propietario</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Cuenta Activa & Operativa</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-aurea-navy/60 block font-medium">Razón Social Registrada:</span>
                <span className="font-semibold text-sm text-aurea-navy">{expediente.razon_social}</span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">RUC & Clasificación Fiscal:</span>
                <span className="font-mono font-bold text-sm text-aurea-navy">
                  {expediente.ruc}{' '}
                  <span className="text-xs font-sans font-normal text-aurea-navy/70">
                    ({expediente.tipo_contribuyente_label})
                  </span>
                </span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Sede Principal / Dirección:</span>
                <span className="font-semibold text-aurea-navy">
                  {expediente.direccion_sede_principal}
                </span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Teléfono de Contacto:</span>
                <span className="font-semibold text-aurea-navy">{expediente.telefono_contacto}</span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Titular Propietario:</span>
                <span className="font-semibold text-aurea-navy">
                  {expediente.propietario_titular.nombre}{' '}
                  <span className="text-[10px] text-aurea-copper font-mono font-bold">(rol: propietario)</span>
                </span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Correo Electrónico Oficial:</span>
                <span className="font-semibold text-aurea-navy">
                  {expediente.propietario_titular.correo}
                </span>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: Contrato SaaS & Pasarela Stripe */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-aurea-copper/15">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy">
                <CreditCard className="w-4 h-4 text-aurea-copper" />
                <span>2. Contrato SaaS & Pasarela de Pagos</span>
              </div>
              <span className="text-xs text-aurea-navy/60">
                Origen:{' '}
                {expediente.origen_alta === 'manual_admin'
                  ? 'B2B Manual Directo'
                  : 'Autoservicio Stripe (CU-PROP-01)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-aurea-navy/60 block font-medium">Plan Contratado:</span>
                <span className="font-bold text-sm text-aurea-navy">
                  {expediente.plan.nombre} — S/ {expediente.plan.precio_mensual.toFixed(2)} / mes
                </span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Próximo Cobro / Vencimiento:</span>
                <span className="font-semibold text-aurea-navy">
                  {formatearFecha(expediente.fecha_proximo_cobro)}{' '}
                  {esGracia && (
                    <span className="text-amber-700 font-bold">(En reintento Stripe)</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Método de Pago Vinculado:</span>
                <span className="font-semibold text-aurea-navy flex items-center gap-1.5 mt-0.5">
                  <CreditCard className="w-4 h-4 text-aurea-copper" />
                  <span>{expediente.metodo_pago_detalle}</span>
                </span>
              </div>
              <div>
                <span className="text-aurea-navy/60 block font-medium">Estado de Cobro / Dunning:</span>
                {esGracia ? (
                  <span className="text-amber-800 font-bold">
                    3 días restantes de gracia (Corte definitivo:{' '}
                    {formatearFecha(expediente.fecha_corte_gracia)})
                  </span>
                ) : esSuspendida ? (
                  <span className="text-rose-700 font-bold">Servicio suspendido por impago</span>
                ) : (
                  <span className="text-emerald-700 font-bold">Al día con facturación periódica</span>
                )}
              </div>
            </div>

            {expediente.stripe_customer_id && (
              <div className="pt-2 border-t border-aurea-copper/10 flex items-center gap-4 text-xs font-mono text-aurea-navy/70">
                <span>Stripe Customer: {expediente.stripe_customer_id}</span>
                <span>Sub ID: {expediente.stripe_subscription_id}</span>
              </div>
            )}
          </div>

          {/* BLOQUE 3: Historial de Transacciones (Tabla 'pago') */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-aurea-copper/15">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy">
                <History className="w-4 h-4 text-aurea-copper" />
                <span>3. Historial de Transacciones (Tabla pago)</span>
              </div>
              <span className="text-xs text-aurea-navy/60">Sincronizado vía Webhooks / Depósitos</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-aurea-champagne/20 text-aurea-navy/70 font-semibold border-b border-aurea-copper/20">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Comprobante</th>
                    <th className="py-2.5 px-3">Monto (PEN)</th>
                    <th className="py-2.5 px-3">Medio / Origen</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Referencia / Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aurea-copper/10 font-sans">
                  {expediente.historial_pagos.map((pago) => {
                    const esFallido = pago.estado === 'fallido';
                    return (
                      <tr
                        key={pago.id}
                        className={esFallido ? 'bg-rose-50/70 text-rose-900' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">{formatearFecha(pago.fecha)}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{pago.comprobante_codigo}</td>
                        <td className="py-2.5 px-3 font-bold">
                          S/ {pago.monto_pen.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 capitalize">{pago.medio_detalle}</td>
                        <td className="py-2.5 px-3">
                          {pago.estado === 'exitoso' ? (
                            <span className="font-semibold text-emerald-700">✓ Exitoso</span>
                          ) : (
                            <span className="font-semibold text-rose-700">❌ Fallido</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-aurea-navy/70 text-[11px]">
                          {pago.nota || pago.stripe_payment_id || 'Sin observaciones'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BLOQUE 4: Uso de Recursos vs Límites del Plan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/20 space-y-4">
            <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy pb-2 border-b border-aurea-copper/15">
              <Activity className="w-4 h-4 text-aurea-copper" />
              <span>4. Uso de Recursos vs Límites del {expediente.plan.nombre}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sedes */}
              <div className="p-3.5 bg-white rounded-xl border border-aurea-copper/20 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-aurea-navy/70">Sedes / Locales</span>
                  <span className="text-aurea-navy">
                    {expediente.consumo.locales_actuales} / {expediente.consumo.locales_limite} (
                    {calcPorcentaje(
                      expediente.consumo.locales_actuales,
                      expediente.consumo.locales_limite
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-aurea-copper h-2.5 rounded-full transition-all"
                    style={{
                      width: `${calcPorcentaje(
                        expediente.consumo.locales_actuales,
                        expediente.consumo.locales_limite
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Mesas */}
              <div className="p-3.5 bg-white rounded-xl border border-aurea-copper/20 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-aurea-navy/70">Mesas Activas</span>
                  <span className="text-aurea-navy">
                    {expediente.consumo.mesas_actuales} / {expediente.consumo.mesas_limite} (
                    {calcPorcentaje(
                      expediente.consumo.mesas_actuales,
                      expediente.consumo.mesas_limite
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-aurea-navy h-2.5 rounded-full transition-all"
                    style={{
                      width: `${calcPorcentaje(
                        expediente.consumo.mesas_actuales,
                        expediente.consumo.mesas_limite
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Personal */}
              <div className="p-3.5 bg-white rounded-xl border border-aurea-copper/20 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-aurea-navy/70">Cuentas de Personal</span>
                  <span className="text-aurea-navy">
                    {expediente.consumo.usuarios_actuales} / {expediente.consumo.usuarios_limite} (
                    {calcPorcentaje(
                      expediente.consumo.usuarios_actuales,
                      expediente.consumo.usuarios_limite
                    )}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${calcPorcentaje(
                        expediente.consumo.usuarios_actuales,
                        expediente.consumo.usuarios_limite
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-aurea-copper/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {!esSuspendida && (
              <button
                disabled={cargandoAccion}
                onClick={() => onSuspenderPreventivo(expediente.empresa_id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Suspender Preventivamente</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {esGracia && (
              <button
                disabled={cargandoAccion}
                onClick={() => onReenviarNotificacion(expediente.empresa_id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Reenviar Notificación de Cobro</span>
              </button>
            )}

            <button
              onClick={() => {
                alert(`Abriendo consola Stripe para Customer: ${expediente.stripe_customer_id || 'N/A'}`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-champagne/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Ver en Stripe</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-aurea-navy text-white hover:bg-opacity-90 shadow-sm"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
