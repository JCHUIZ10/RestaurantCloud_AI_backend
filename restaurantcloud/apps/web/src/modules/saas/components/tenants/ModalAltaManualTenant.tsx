import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Building2, User, CreditCard, ShieldCheck } from 'lucide-react';
import { validarRucModulo11 } from '@/modules/saas/services/mockSaasTenantsService';
import type { AltaManualTenantRequestDTO, OrigenPagoSaaS } from '@/types/saasTenants';

interface ModalAltaManualTenantProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AltaManualTenantRequestDTO) => Promise<void>;
  cargando?: boolean;
  datosPrellenados?: Partial<AltaManualTenantRequestDTO> | null;
}

export const ModalAltaManualTenant: React.FC<ModalAltaManualTenantProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cargando = false,
  datosPrellenados,
}) => {
  const hoy = new Date().toISOString().split('T')[0];
  const proximoAno = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const [ruc, setRuc] = useState('20603849201');
  const [razonSocial, setRazonSocial] = useState('Cevichería Puerto Marino S.A.C.');
  const [direccionSede, setDireccionSede] = useState('Av. Primavera 450, Surco, Lima');

  const [propietarioNombre, setPropietarioNombre] = useState('Jorge Medina Castro');
  const [propietarioEmail, setPropietarioEmail] = useState('admin@puertomarino.pe');
  const [propietarioTelefono, setPropietarioTelefono] = useState('+51 991 882 334');

  const [planId, setPlanId] = useState<number>(2); // Plan Pro
  const [ciclo, setCiclo] = useState<'mensual' | 'anual'>('anual');
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFinPeriodo, setFechaFinPeriodo] = useState(proximoAno);

  const [montoCobrado, setMontoCobrado] = useState<number>(800.0);
  const [origenPago, setOrigenPago] = useState<OrigenPagoSaaS>('transferencia_bancaria');
  const [numeroOperacion, setNumeroOperacion] = useState('OP-90481239-BCP');
  const [fechaOperacion, setFechaOperacion] = useState(hoy);
  const [notaAdministrativa, setNotaAdministrativa] = useState(
    'Cliente formalizó suscripción anual BCP. Abono confirmado por tesorería en estado de cuenta.'
  );
  const [enviarEmail, setEnviarEmail] = useState(true);

  const [rucFeedback, setRucFeedback] = useState<{
    valido: boolean;
    mensaje?: string;
    tipoLabel?: string;
  }>({ valido: true, tipoLabel: 'RUC 20 — Persona Jurídica (Empresa)' });

  // Carga de datos prellenados desde QA Sandbox
  useEffect(() => {
    if (datosPrellenados) {
      if (datosPrellenados.ruc) setRuc(datosPrellenados.ruc);
      if (datosPrellenados.razon_social) setRazonSocial(datosPrellenados.razon_social);
      if (datosPrellenados.direccion_sede) setDireccionSede(datosPrellenados.direccion_sede);
      if (datosPrellenados.propietario_nombre) setPropietarioNombre(datosPrellenados.propietario_nombre);
      if (datosPrellenados.propietario_email) setPropietarioEmail(datosPrellenados.propietario_email);
      if (datosPrellenados.propietario_telefono) setPropietarioTelefono(datosPrellenados.propietario_telefono);
      if (datosPrellenados.monto_cobrado_pen) setMontoCobrado(datosPrellenados.monto_cobrado_pen);
      if (datosPrellenados.numero_operacion) setNumeroOperacion(datosPrellenados.numero_operacion);
      if (datosPrellenados.nota_administrativa) setNotaAdministrativa(datosPrellenados.nota_administrativa);
    }
  }, [datosPrellenados]);

  // Validación en tiempo real del RUC con Módulo 11
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

  // Ajuste automático de monto sugerido según plan y ciclo
  const handleCambioPlanOCiclo = (nuevoPlanId: number, nuevoCiclo: 'mensual' | 'anual') => {
    setPlanId(nuevoPlanId);
    setCiclo(nuevoCiclo);

    let monto = 80;
    if (nuevoPlanId === 1) monto = 40;
    if (nuevoPlanId === 3) monto = 160;

    if (nuevoCiclo === 'anual') {
      monto = monto * 10; // 10 meses (2 meses de bonificación)
    }

    setMontoCobrado(monto);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rucFeedback.valido) {
      alert('Corrija el RUC antes de continuar. Debe ser válido conforme a Módulo 11.');
      return;
    }

    if (montoCobrado <= 0) {
      alert('Integridad contable requerida: El monto cobrado debe ser mayor a S/ 0.00.');
      return;
    }

    if (!numeroOperacion.trim()) {
      alert('El número de operación bancaria es obligatorio.');
      return;
    }

    await onSubmit({
      ruc,
      razon_social: razonSocial,
      direccion_sede: direccionSede,
      propietario_nombre: propietarioNombre,
      propietario_email: propietarioEmail,
      propietario_telefono: propietarioTelefono,
      plan_id: planId,
      ciclo_facturacion: ciclo,
      fecha_inicio: fechaInicio,
      fecha_fin_periodo: fechaFinPeriodo,
      monto_cobrado_pen: montoCobrado,
      origen_pago: origenPago,
      numero_operacion: numeroOperacion,
      fecha_operacion: fechaOperacion,
      nota_administrativa: notaAdministrativa,
      enviar_email_bienvenida: enviarEmail,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-alta-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-aurea-copper/30 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-5 sm:p-6 bg-aurea-navy text-aurea-ivory border-b border-aurea-copper/30 flex items-start justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aurea-copper/20 text-aurea-champagne border border-aurea-copper/40">
              <ShieldCheck className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Alta Manual B2B Corporativa</span>
            </div>
            <h2 id="modal-alta-titulo" className="font-serif text-xl sm:text-2xl font-bold text-white mt-1.5">
              Nueva Alta Manual con Pago Directo Verificado
            </h2>
            <p className="text-xs text-white/70 mt-0.5">
              Registro para clientes corporativos con pago por transferencia bancaria (sin pasarela Stripe).
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal de alta"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-aurea-copper hover:text-white transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con los 4 Bloques Canónicos */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-aurea-navy font-sans">
          {/* BLOQUE 1: Identificación de la Empresa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-aurea-ivory/60 border border-aurea-copper/20 space-y-3">
            <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy pb-2 border-b border-aurea-copper/15">
              <Building2 className="w-4 h-4 text-aurea-copper" />
              <span>1. Identificación de la Empresa (Ingreso Directo & Validación Módulo 11)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  RUC de la Empresa (11 dígitos): *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  placeholder="ej. 20603849201"
                  required
                  className={`w-full px-3 py-2 rounded-xl bg-white border text-sm font-mono focus:outline-none focus:ring-2 ${
                    rucFeedback.valido
                      ? 'border-emerald-400 focus:ring-emerald-200 text-emerald-950 font-bold'
                      : 'border-rose-400 focus:ring-rose-200 text-rose-950'
                  }`}
                />
                <div className="mt-1 text-xs">
                  {rucFeedback.valido ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{rucFeedback.tipoLabel} (Módulo 11 conforme)</span>
                    </span>
                  ) : (
                    <span className="text-rose-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{rucFeedback.mensaje}</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Razón Social Oficial: *
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="ej. Cevichería Puerto Marino S.A.C."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Dirección de la Sede Principal: *
                </label>
                <input
                  type="text"
                  value={direccionSede}
                  onChange={(e) => setDireccionSede(e.target.value)}
                  placeholder="ej. Av. Primavera 450, Santiago de Surco, Lima"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 2: Datos del Propietario Administrador */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy pb-2 border-b border-aurea-copper/15">
              <User className="w-4 h-4 text-aurea-copper" />
              <span>2. Datos del Propietario Administrador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Nombres y Apellidos: *
                </label>
                <input
                  type="text"
                  value={propietarioNombre}
                  onChange={(e) => setPropietarioNombre(e.target.value)}
                  placeholder="ej. Jorge Medina Castro"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Teléfono / WhatsApp: *
                </label>
                <input
                  type="text"
                  value={propietarioTelefono}
                  onChange={(e) => setPropietarioTelefono(e.target.value)}
                  placeholder="ej. +51 991 882 334"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Correo Electrónico Corporativo: *
                </label>
                <input
                  type="email"
                  value={propietarioEmail}
                  onChange={(e) => setPropietarioEmail(e.target.value)}
                  placeholder="admin@puertomarino.pe"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
                <span className="text-[10px] text-aurea-navy/60 block mt-0.5">
                  Recibirá capability token para fijar clave
                </span>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: Plan Contratado y Vigencia */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/25 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-serif font-bold text-base text-aurea-navy pb-2 border-b border-aurea-copper/15">
              <CreditCard className="w-4 h-4 text-aurea-copper" />
              <span>3. Plan Contratado y Vigencia de Servicio</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Plan SaaS: *
                </label>
                <select
                  value={planId}
                  onChange={(e) => handleCambioPlanOCiclo(Number(e.target.value), ciclo)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm font-semibold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                >
                  <option value={1}>Starter — S/ 40.00 / mes (Hasta 1 sede, 25 mesas)</option>
                  <option value={2}>Plan Pro — S/ 80.00 / mes (Hasta 3 sedes, 30 mesas)</option>
                  <option value={3}>Enterprise — S/ 160.00 / mes (Hasta 10 sedes, 60 mesas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Periodicidad de Facturación:
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="radio"
                      name="ciclo"
                      checked={ciclo === 'mensual'}
                      onChange={() => handleCambioPlanOCiclo(planId, 'mensual')}
                      className="text-aurea-navy focus:ring-aurea-copper"
                    />
                    <span>Mensual</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-aurea-navy">
                    <input
                      type="radio"
                      name="ciclo"
                      checked={ciclo === 'anual'}
                      onChange={() => handleCambioPlanOCiclo(planId, 'anual')}
                      className="text-aurea-navy focus:ring-aurea-copper"
                    />
                    <span>Anual (2 meses gratis)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Fecha Inicio de Vigencia: *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-aurea-navy/80 mb-1">
                  Fecha Fin de Periodo: *
                </label>
                <input
                  type="date"
                  value={fechaFinPeriodo}
                  onChange={(e) => setFechaFinPeriodo(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/25 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 4: Registro del Pago Verificado (Tabla 'pago') */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-300 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>4. Registro del Pago Verificado (Tabla pago con estado 'exitoso')</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Integridad Contable Obligatoria
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Monto Cobrado (PEN): *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-emerald-900">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={montoCobrado}
                    onChange={(e) => setMontoCobrado(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-emerald-300 text-sm font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Medio de Pago Bancario: *
                </label>
                <select
                  value={origenPago}
                  onChange={(e) => setOrigenPago(e.target.value as OrigenPagoSaaS)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-sm font-medium text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="transferencia_bancaria">Transferencia Bancaria BCP</option>
                  <option value="deposito_bancario">Depósito en Cuenta BBVA / Interbank</option>
                  <option value="yape_empresa">Yape Empresa</option>
                  <option value="efectivo">Efectivo en Oficina Corporativa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  N° de Operación / Constancia: *
                </label>
                <input
                  type="text"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  placeholder="ej. OP-90481239-BCP"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-sm font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Fecha de la Operación: *
                </label>
                <input
                  type="date"
                  value={fechaOperacion}
                  onChange={(e) => setFechaOperacion(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-sm font-mono text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-emerald-950 mb-1">
                  Observaciones / Nota de Respaldo de Tesorería: *
                </label>
                <textarea
                  rows={2}
                  value={notaAdministrativa}
                  onChange={(e) => setNotaAdministrativa(e.target.value)}
                  placeholder="Detalle de confirmación contable y comprobante..."
                  required
                  minLength={10}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Checkbox de Enviar Correo */}
          <div className="p-3 bg-aurea-ivory rounded-xl border border-aurea-copper/20 flex items-center gap-3">
            <input
              type="checkbox"
              id="check-email-bienvenida"
              checked={enviarEmail}
              onChange={(e) => setEnviarEmail(e.target.checked)}
              className="w-4 h-4 text-aurea-navy rounded border-aurea-copper focus:ring-aurea-copper"
            />
            <label htmlFor="check-email-bienvenida" className="text-xs text-aurea-navy cursor-pointer font-medium">
              Despachar correo automático de bienvenida al propietario ({propietarioEmail}) con capability token activo por 72 horas para fijar contraseña.
            </label>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-3 border-t border-aurea-copper/20 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-aurea-navy/80 border border-aurea-copper/30 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={cargando || !rucFeedback.valido || montoCobrado <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{cargando ? 'Registrando...' : 'Confirmar Pago y Activar Empresa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
