import React, { useState } from 'react';
import {
  CheckCircle2,
  Building2,
  Eye,
  ArrowLeft,
  Download,
  Mail,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Lock,
  Clock,
} from 'lucide-react';
import type { AltaManualTenantResponseDTO, AltaManualTenantRequestDTO } from '@/types/saasTenants';
import { generarEnlaceWhatsApp } from '@/shared/utils';

interface Paso5TenantActivadoProps {
  resultado: AltaManualTenantResponseDTO;
  formData: AltaManualTenantRequestDTO;
  onVerExpediente: (empresaId: string) => void;
  onVolverBandeja: () => void;
}

export const Paso5TenantActivado: React.FC<Paso5TenantActivadoProps> = ({
  resultado,
  formData,
  onVerExpediente,
  onVolverBandeja,
}) => {
  const [copiado, setCopiado] = useState(false);
  const planNombres: Record<number, string> = { 1: 'Starter', 2: 'Plan Pro', 3: 'Enterprise' };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const urlActivacion =
    resultado.invitacion_url ||
    `${baseUrl}/activar-cuenta?token=${resultado.invitacion_token || 'tok_corp_' + resultado.empresa_id}`;

  const handleCopiar = () => {
    if (!urlActivacion) return;
    navigator.clipboard.writeText(urlActivacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleCompartirWhatsapp = () => {
    if (!urlActivacion) return;
    const texto = `Hola ${formData.propietario_nombre}, se ha completado el alta de ${formData.razon_social} en RestaurantCloud AI. Activa tu cuenta personal y define tu contraseña segura aquí (enlace válido por 72 horas): ${urlActivacion}`;
    if (formData.propietario_telefono) {
      window.open(generarEnlaceWhatsApp(formData.propietario_telefono, texto), '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  const handleAbrirActivacion = () => {
    window.open(urlActivacion, '_blank');
  };

  const handleDescargarConstancia = () => {
    const texto = `
================================================================================
RESTAURANTCLOUD AI — CONSTANCIA OFICIAL DE ACTIVACIÓN CORPORATIVA B2B
================================================================================
Fecha de Emisión: ${new Date().toLocaleString('es-PE')}
ID Empresa:       ${resultado.empresa_id}
Código Display:   ${resultado.codigo_display}
Razón Social:     ${formData.razon_social}
RUC:              ${formData.ruc}
Sede Principal:   ${formData.direccion_sede}

--------------------------------------------------------------------------------
DATOS DEL PROPIETARIO TITULAR
--------------------------------------------------------------------------------
Nombre:           ${formData.propietario_nombre}
Correo:           ${formData.propietario_email}
Teléfono:         ${formData.propietario_telefono}
Capability Token: Despachado a casilla electrónica (Vigencia: 72 horas)

--------------------------------------------------------------------------------
ACCESO Y ACTIVACIÓN DIGITAL DE CUENTA (CAPABILITY TOKEN)
--------------------------------------------------------------------------------
URL de Activación:  ${urlActivacion}
Vigencia del Token: 72 horas (Expiración: Redis EX 259200)
Protocolo:          Sin contraseñas provisionales. El titular fija su propia clave.

--------------------------------------------------------------------------------
CONTRATO SAAS Y CONDICIONES
--------------------------------------------------------------------------------
Plan Contratado:  ${planNombres[formData.plan_id] || 'Plan Pro'} (${formData.ciclo_facturacion.toUpperCase()})
Vigencia:         ${formData.fecha_inicio} hasta ${formData.fecha_fin_periodo}

--------------------------------------------------------------------------------
DETALLE DEL PAGO VERIFICADO (TABLA PAGO - POSTGRESQL 16)
--------------------------------------------------------------------------------
ID Pago:          ${resultado.pago_id}
Monto Liquidado:  S/ ${formData.monto_cobrado_pen.toFixed(2)} PEN
Medio de Pago:    ${formData.origen_pago.replace('_', ' ').toUpperCase()}
N° Operación:     ${formData.numero_operacion}
Fecha Abono:      ${formData.fecha_operacion}
Estado Contable:  EXITOSO (Conforme por tesorería)
Observaciones:    ${formData.nota_administrativa}

================================================================================
RestaurantCloud AI — Plataforma SaaS Multitenant Gastronómica
================================================================================
`;
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Constancia_Alta_${formData.ruc}_${resultado.codigo_display}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl border border-aurea-copper/25 p-6 sm:p-10 shadow-sm space-y-8 text-center max-w-3xl mx-auto my-4">
      {/* Icono de Celebración */}
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-md">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
          ● Empresa Activada & Pago Asentado
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">
          ¡{formData.razon_social} ha sido Registrada Exitosamente!
        </h2>
        <p className="text-sm text-aurea-navy/70 max-w-xl mx-auto">
          La empresa y su primera sede han sido aprovisionadas en la base de datos PostgreSQL 16. La
          transacción contable por <strong>S/ {formData.monto_cobrado_pen.toFixed(2)}</strong> quedó
          asentada bajo la operación <strong>{formData.numero_operacion}</strong>.
        </p>
      </div>

      {/* Tarjeta de Resumen de Credenciales */}
      <div className="p-5 rounded-2xl bg-aurea-ivory/80 border border-aurea-copper/25 text-left space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-aurea-copper/20">
          <div className="flex items-center gap-2 font-bold text-sm text-aurea-navy font-serif">
            <Building2 className="w-4 h-4 text-aurea-copper" />
            <span>Ficha del Tenant Creado</span>
          </div>
          <span className="font-mono text-xs font-bold text-aurea-navy bg-white px-2 py-0.5 rounded border border-aurea-copper/20">
            {resultado.codigo_display}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-aurea-navy/80">
          <div>
            <span className="text-aurea-navy/50 block font-medium">Razón Social:</span>
            <span className="font-bold text-aurea-navy text-sm">{formData.razon_social}</span>
          </div>
          <div>
            <span className="text-aurea-navy/50 block font-medium">RUC Fiscal:</span>
            <span className="font-mono font-bold text-aurea-navy">{formData.ruc}</span>
          </div>
          <div>
            <span className="text-aurea-navy/50 block font-medium">Sede Principal:</span>
            <span className="font-semibold text-aurea-navy">{formData.direccion_sede}</span>
          </div>
          <div>
            <span className="text-aurea-navy/50 block font-medium">Plan Contratado:</span>
            <span className="font-bold text-emerald-800">
              {planNombres[formData.plan_id]} — {formData.ciclo_facturacion.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-aurea-navy/50 block font-medium">Titular Propietario:</span>
            <span className="font-semibold text-aurea-navy">{formData.propietario_nombre}</span>
          </div>
          <div>
            <span className="text-aurea-navy/50 block font-medium">Correo Electrónico:</span>
            <span className="font-semibold text-aurea-navy">{formData.propietario_email}</span>
          </div>
        </div>

        {resultado.email_enviado && (
          <div className="pt-2 border-t border-aurea-copper/15 flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Capability token de un solo uso despachado a {formData.propietario_email} (72h para fijar contraseña).
            </span>
          </div>
        )}
      </div>

      {/* Tarjeta de Enlace Seguro de Activación para el Titular */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-aurea-ivory/90 via-white to-amber-50/40 border-2 border-aurea-copper/35 text-left space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-aurea-copper/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-aurea-navy text-aurea-gold flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="w-4 h-4 text-aurea-copper" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-aurea-navy">
                Enlace Seguro de Activación para el Titular
              </h3>
              <p className="text-[11px] text-aurea-navy/70">
                Invitación directa para {formData.propietario_nombre} ({formData.propietario_email})
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-[10px] font-bold font-mono self-start sm:self-auto">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Válido por 72h (Redis EX 259200)</span>
          </div>
        </div>

        {/* Input con enlace y botón Copiar */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-aurea-navy uppercase tracking-wider">
            URL de Activación Generada:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urlActivacion}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-aurea-copper/30 rounded-xl text-xs font-mono text-aurea-navy select-all focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
            />
            <button
              type="button"
              onClick={handleCopiar}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
                copiado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-aurea-navy text-white hover:bg-opacity-90 active:scale-[0.98]'
              }`}
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Acciones de Despacho Rápido: WhatsApp y Abrir en pestaña nueva */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-aurea-copper/15">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCompartirWhatsapp}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all shadow-sm active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleAbrirActivacion}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-ivory transition-colors shadow-sm active:scale-[0.98]"
            >
              <ExternalLink className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Abrir Enlace de Activación</span>
            </button>
          </div>

          <span className="text-[10px] text-aurea-navy/60 font-sans text-center sm:text-right">
            El titular definirá su propia clave privada sin contraseñas provisionales.
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleDescargarConstancia}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-champagne/30 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-aurea-copper" />
          <span>Descargar Constancia Oficial (.txt)</span>
        </button>

        <button
          type="button"
          onClick={() => onVerExpediente(resultado.empresa_id)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-aurea-navy text-white hover:bg-opacity-95 shadow-md border border-aurea-copper/40 transition-all"
        >
          <Eye className="w-4 h-4 text-aurea-copper" />
          <span>Abrir Expediente 360°</span>
        </button>

        <button
          type="button"
          onClick={onVolverBandeja}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-aurea-navy/80 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Bandeja de Tenants</span>
        </button>
      </div>
    </div>
  );
};
