import React from 'react';
import { User, Mail, Phone, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';

interface Paso2TitularPropietarioProps {
  propietarioNombre: string;
  propietarioEmail: string;
  propietarioTelefono: string;
  onChange: (fields: {
    propietarioNombre?: string;
    propietarioEmail?: string;
    propietarioTelefono?: string;
  }) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}

export const Paso2TitularPropietario: React.FC<Paso2TitularPropietarioProps> = ({
  propietarioNombre,
  propietarioEmail,
  propietarioTelefono,
  onChange,
  onAnterior,
  onSiguiente,
}) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const esValido =
    propietarioNombre.trim().length >= 3 &&
    emailRegex.test(propietarioEmail) &&
    propietarioTelefono.trim().length >= 9;

  return (
    <div className="bg-white rounded-3xl border border-aurea-copper/25 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-aurea-copper/15">
        <div className="w-10 h-10 rounded-xl bg-aurea-champagne/40 border border-aurea-copper/40 flex items-center justify-center text-aurea-navy">
          <User className="w-5 h-5 text-aurea-navy" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy">
            2. Datos del Propietario y Credenciales Iniciales
          </h2>
          <p className="text-xs sm:text-sm text-aurea-navy/70">
            Registro del titular legal de la cuenta y despacho seguro de invitación mediante capability token.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nombre Completo */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Nombres y Apellidos del Titular: *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={propietarioNombre}
              onChange={(e) => onChange({ propietarioNombre: e.target.value })}
              placeholder="ej. Jorge Medina Castro"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-aurea-copper/30 text-sm font-semibold text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
            />
          </div>
        </div>

        {/* Teléfono / WhatsApp */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Teléfono Móvil / WhatsApp Corporativo: *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={propietarioTelefono}
              onChange={(e) => onChange({ propietarioTelefono: e.target.value })}
              placeholder="ej. +51 991 882 334"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-aurea-copper/30 text-sm font-mono text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
            />
          </div>
          <span className="text-aurea-navy/50 text-[11px] block">
            Canal de contacto directo para validación de cuenta
          </span>
        </div>

        {/* Correo Electrónico */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Correo Electrónico Oficial: *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={propietarioEmail}
              onChange={(e) => onChange({ propietarioEmail: e.target.value })}
              placeholder="admin@puertomarino.pe"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-aurea-copper/30 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
            />
          </div>
          <span className="text-aurea-navy/50 text-[11px] block">
            El titular recibirá aquí su capability token de 72h
          </span>
        </div>
      </div>

      {/* Tarjeta de Seguridad Capability Token */}
      <div className="p-4 rounded-2xl bg-aurea-ivory border border-aurea-copper/25 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" />
        <div className="text-xs text-aurea-navy/80 space-y-1">
          <span className="font-bold block text-aurea-navy">
            Protocolo de Invitación Segura (Sin Contraseñas Provisionales):
          </span>
          <p>
            Al finalizar el alta, el backend generará un token firmado en Redis con expiración de 72
            horas (<code className="font-mono text-aurea-navy">EX 259200</code>). El propietario podrá
            fijar su propia clave privada sin intervención de terceros.
          </p>
        </div>
      </div>

      {/* Botones de Navegación */}
      <div className="pt-4 border-t border-aurea-copper/15 flex items-center justify-between">
        <button
          type="button"
          onClick={onAnterior}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-aurea-navy/80 border border-aurea-copper/30 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Paso 1</span>
        </button>

        <button
          type="button"
          disabled={!esValido}
          onClick={onSiguiente}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-aurea-navy text-white hover:bg-opacity-95 shadow-md border border-aurea-copper/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continuar a Selección de Plan</span>
          <ArrowRight className="w-4 h-4 text-aurea-copper" />
        </button>
      </div>
    </div>
  );
};
