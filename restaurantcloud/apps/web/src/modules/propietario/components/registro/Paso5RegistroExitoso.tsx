import React, { useState } from 'react';
import { CompletarRegistroResponseDTO } from '@/types/registroEmpresa';
import { formatPEN } from '@/shared/utils';
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Mail,
  ShieldCheck,
  Calendar,
  Receipt,
  MessageCircle,
} from 'lucide-react';

interface Paso5RegistroExitosoProps {
  resultado: CompletarRegistroResponseDTO;
  onDescargarConstancia: () => void;
  onIrAlDashboard: () => void;
}

export const Paso5RegistroExitoso: React.FC<Paso5RegistroExitosoProps> = ({
  resultado,
  onDescargarConstancia,
  onIrAlDashboard,
}) => {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = () => {
    setDescargando(true);
    onDescargarConstancia();
    setTimeout(() => setDescargando(false), 1000);
  };

  const whatsappUrl = `https://wa.me/51930723537?text=Hola,%20acabo%20de%20activar%20mi%20empresa%20${encodeURIComponent(
    resultado.empresa.razon_social
  )}%20(RUC:%20${resultado.empresa.ruc})%20en%20RestaurantCloud%20AI%20y%20requiero%20asistencia.`;

  const proximoCobroFormateado = new Date(
    resultado.constancia.proximo_cobro
  ).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn py-4 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-aurea-copper/25 shadow-xl text-center space-y-6">
        {/* Check verde animado */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        {/* Título de Confirmación */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-aurea-navy bg-aurea-champagne/40 px-3.5 py-1 rounded-full border border-aurea-copper/30">
            Alta Completada & Pago Confirmado
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-aurea-navy font-bold">
            ¡Tu Restaurante está Activo!
          </h2>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 max-w-md mx-auto leading-relaxed">
            Hemos aprovisionado tu espacio multi-tenant con éxito y despachado tus credenciales a:{' '}
            <strong className="text-aurea-navy block mt-0.5">{resultado.usuario.correo}</strong>
          </p>
        </div>

        {/* Ficha: Resumen de Suscripción */}
        <div className="bg-aurea-ivory rounded-2xl p-5 border border-aurea-copper/30 text-left space-y-3.5">
          <div className="flex items-center justify-between border-b border-aurea-copper/20 pb-2.5">
            <span className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
              <Receipt className="w-4 h-4 text-aurea-copper" />
              Resumen de Suscripción Oficial
            </span>
            <span className="font-mono text-xs font-bold text-aurea-navy bg-white px-2 py-0.5 rounded border border-aurea-copper/30">
              {resultado.constancia.numero_comprobante}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-aurea-navy/60 block text-[10px] uppercase font-mono">
                Empresa Registrada:
              </span>
              <span className="font-bold text-aurea-navy text-sm">
                {resultado.empresa.razon_social}
              </span>
            </div>

            <div>
              <span className="text-aurea-navy/60 block text-[10px] uppercase font-mono">
                Número de RUC:
              </span>
              <span className="font-bold font-mono text-aurea-navy text-sm">
                {resultado.empresa.ruc}
              </span>
            </div>

            <div>
              <span className="text-aurea-navy/60 block text-[10px] uppercase font-mono">
                Plan Seleccionado:
              </span>
              <span className="font-bold text-aurea-navy">
                Plan {resultado.empresa.plan.nombre} ({formatPEN(resultado.constancia.monto_pagado)} /{' '}
                {resultado.constancia.periodo?.toLowerCase() === 'anual' ? 'año' : 'mes'})
              </span>
            </div>

            <div>
              <span className="text-aurea-navy/60 block text-[10px] uppercase font-mono">
                Próxima Facturación:
              </span>
              <span className="font-medium text-aurea-navy flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
                {proximoCobroFormateado}
              </span>
            </div>
          </div>

          {/* Botón de Descarga de Constancia */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDescargar}
              disabled={descargando}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-aurea-navy bg-white hover:bg-aurea-navy hover:text-white text-aurea-navy font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>
                {descargando
                  ? 'Generando documento oficial...'
                  : 'Descargar Constancia de Registro (PDF / TXT)'}
              </span>
            </button>
          </div>
        </div>

        {/* Ficha: Soporte y Emergencias 24/7 */}
        <div className="p-4 rounded-2xl bg-white border border-aurea-copper/30 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurea-navy flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Soporte & Acompañamiento 24/7
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {resultado.soporte_emergencia.disponibilidad}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-2 font-medium"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp: {resultado.soporte_emergencia.whatsapp}</span>
            </a>

            <a
              href={`mailto:${resultado.soporte_emergencia.correo}`}
              className="p-2.5 rounded-xl bg-aurea-ivory border border-aurea-copper/30 text-aurea-navy hover:bg-white transition-colors flex items-center gap-2 font-medium"
            >
              <Mail className="w-4 h-4 text-aurea-copper" />
              <span>{resultado.soporte_emergencia.correo}</span>
            </a>
          </div>
        </div>

        {/* Botón Principal: Ir al Panel de Control */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onIrAlDashboard}
            className="w-full bg-aurea-navy hover:bg-[#12345e] text-white font-semibold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-base transition-all cursor-pointer"
          >
            <span>Ir a mi panel de control</span>
            <ArrowRight className="w-5 h-5 text-aurea-copper" />
          </button>
          <p className="text-[11px] text-aurea-navy/60 mt-2">
            Tu sesión como Propietario se iniciará automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};
