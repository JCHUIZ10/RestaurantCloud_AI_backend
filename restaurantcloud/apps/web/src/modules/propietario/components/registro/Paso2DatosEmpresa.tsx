import React, { useState } from 'react';
import { PlanSaaSDTO, IniciarRegistroRequestDTO } from '@/types/registroEmpresa';
import { Button } from '@/components/ui/Button';
import { formatPEN } from '@/shared/utils';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Paso2DatosEmpresaProps {
  plan: PlanSaaSDTO;
  formData: IniciarRegistroRequestDTO;
  onChangeForm: (fields: Partial<IniciarRegistroRequestDTO>) => void;
  onSubmit: (e: React.FormEvent) => void;
  cargando: boolean;
  errorRucDuplicado: string | null;
  onVolverAPlan: () => void;
}

export const Paso2DatosEmpresa: React.FC<Paso2DatosEmpresaProps> = ({
  plan,
  formData,
  onChangeForm,
  onSubmit,
  cargando,
  errorRucDuplicado,
  onVolverAPlan,
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(true);

  // Validación rápida de fortaleza de contraseña
  const getFuerzaPassword = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const fuerza = getFuerzaPassword(formData.password);

  return (
    <form onSubmit={onSubmit} className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================
            COLUMNA IZQUIERDA (8 COLS): FORMULARIO DE CAPTURA
            ============================================================ */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-aurea-copper/25 shadow-sm space-y-6">
          <div className="border-b border-aurea-copper/20 pb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
              Paso 2: Registro Fiscal & Credenciales
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold mt-1">
              Datos de tu Empresa Gastronómica
            </h2>
            <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 mt-1">
              Ingresa los datos oficiales de tu restaurante en Perú y tus credenciales de propietario para habilitar el acceso administrativo.
            </p>
          </div>

          {/* Banner de Conflicto 409 si el RUC ya existe */}
          {errorRucDuplicado && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Conflicto de Registro Fiscal</p>
                <p className="mt-0.5">{errorRucDuplicado}</p>
                <div className="mt-2">
                  <a
                    href="/login"
                    className="font-bold underline text-rose-900 hover:text-rose-700"
                  >
                    ¿Ya tienes una cuenta? Iniciar Sesión aquí →
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Tipo de Contribuyente */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-aurea-navy mb-1.5">
                Tipo de Contribuyente (SUNAT)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onChangeForm({ tipo_contribuyente: 'RUC_20' })}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    formData.tipo_contribuyente === 'RUC_20'
                      ? 'border-aurea-navy bg-aurea-ivory text-aurea-navy font-bold ring-2 ring-aurea-copper/30'
                      : 'border-aurea-copper/30 bg-white text-aurea-navy/70 hover:border-aurea-copper'
                  }`}
                >
                  <div>
                    <span className="block text-sm">RUC 20 — Persona Jurídica</span>
                    <span className="text-[11px] text-aurea-navy/60 font-normal">
                      S.A.C., S.R.L., E.I.R.L.
                    </span>
                  </div>
                  {formData.tipo_contribuyente === 'RUC_20' && (
                    <CheckCircle className="w-4 h-4 text-aurea-copper" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onChangeForm({ tipo_contribuyente: 'RUC_10' })}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    formData.tipo_contribuyente === 'RUC_10'
                      ? 'border-aurea-navy bg-aurea-ivory text-aurea-navy font-bold ring-2 ring-aurea-copper/30'
                      : 'border-aurea-copper/30 bg-white text-aurea-navy/70 hover:border-aurea-copper'
                  }`}
                >
                  <div>
                    <span className="block text-sm">RUC 10 — Persona Natural</span>
                    <span className="text-[11px] text-aurea-navy/60 font-normal">
                      Con Negocio Propio / RER / RUS
                    </span>
                  </div>
                  {formData.tipo_contribuyente === 'RUC_10' && (
                    <CheckCircle className="w-4 h-4 text-aurea-copper" />
                  )}
                </button>
              </div>
            </div>

            {/* Fila: RUC y Razón Social */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-aurea-navy mb-1 flex items-center justify-between">
                  <span>Número de RUC</span>
                  <span className="text-[10px] text-aurea-navy/50 font-mono">11 dígitos</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurea-navy/40">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={formData.ruc}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      onChangeForm({ ruc: val });
                    }}
                    placeholder="20601234567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-mono focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[10px] text-aurea-navy/60 mt-1 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-aurea-copper" />
                  Prefijo {formData.tipo_contribuyente === 'RUC_20' ? '20' : '10'} reglamentario.
                </p>
              </div>

              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Razón Social / Nombre Comercial
                </label>
                <input
                  type="text"
                  required
                  value={formData.razon_social}
                  onChange={(e) => onChangeForm({ razon_social: e.target.value })}
                  placeholder="Ej. El Tenedor Gourmet S.A.C."
                  className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Fila: Nombre del Propietario y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Nombre Completo del Propietario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurea-navy/40">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nombre_propietario}
                    onChange={(e) => onChangeForm({ nombre_propietario: e.target.value })}
                    placeholder="Manuel García Pardo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Teléfono de Contacto (+51)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurea-navy/40">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => onChangeForm({ telefono: e.target.value })}
                    placeholder="+51 987 654 321"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Fila: Correo y Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Correo Electrónico (Login y OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurea-navy/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.correo}
                    onChange={(e) => onChangeForm({ correo: e.target.value })}
                    placeholder="manuel.garcia@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[10px] text-aurea-navy/60 mt-1">
                  Enviaremos el código de verificación a esta casilla.
                </p>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Contraseña de Acceso (mín. 8 caracteres)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurea-navy/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => onChangeForm({ password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-aurea-navy/40 hover:text-aurea-navy"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Medidor de fortaleza de contraseña */}
                {formData.password.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 ${
                          fuerza >= 1 ? (fuerza <= 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-rose-400'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 ${
                          fuerza >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 ${
                          fuerza >= 4 ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-aurea-navy/60 font-semibold">
                      {fuerza <= 2 ? 'Básica' : fuerza === 3 ? 'Segura' : 'Excelente'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox de Términos */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={terminosAceptados}
                  onChange={(e) => setTerminosAceptados(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-aurea-copper/40 text-aurea-navy focus:ring-aurea-copper"
                />
                <span className="text-xs text-aurea-navy/80 leading-relaxed font-sans">
                  Acepto los{' '}
                  <span className="font-semibold text-aurea-navy underline">
                    Términos y Condiciones del Servicio SaaS
                  </span>{' '}
                  y la Política de Privacidad de Datos conforme a la Ley N° 29733 de Perú.
                </span>
              </label>
            </div>

            {/* Botón de Envío */}
            <div className="pt-4 border-t border-aurea-copper/20">
              <Button
                type="submit"
                disabled={cargando || !terminosAceptados || formData.ruc.length !== 11}
                className="w-full sm:w-auto px-8 py-3 bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold shadow-lg flex items-center justify-center gap-2"
              >
                {cargando ? (
                  <span>Validando RUC y despachando código OTP...</span>
                ) : (
                  <>
                    <span>CONTINUAR A VERIFICACIÓN DE CORREO</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ============================================================
            COLUMNA DERECHA (4 COLS): RESUMEN STICKY DEL REGISTRO
            ============================================================ */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="bg-aurea-navy text-aurea-ivory rounded-3xl p-6 border-2 border-aurea-copper shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-aurea-copper/20 pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-aurea-champagne">
                Resumen del Registro
              </span>
              <button
                type="button"
                onClick={onVolverAPlan}
                className="text-xs text-aurea-copper hover:text-white underline font-medium"
              >
                Cambiar plan
              </button>
            </div>

            {/* Tarjeta de Plan */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-aurea-champagne flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-aurea-copper" />
                  {plan.nombre}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurea-copper text-aurea-navy uppercase">
                  ID: {plan.id}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-sans">
                  {formatPEN(plan.precio_mensual)}
                </span>
                <span className="text-xs text-white/70">/ mes + IGV</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                {plan.descripcion}
              </p>
            </div>

            {/* Datos tipeados en tiempo real */}
            <div className="space-y-3 text-xs pt-1">
              <div>
                <span className="opacity-60 block text-[10px] uppercase font-mono">Restaurante:</span>
                <span className="font-bold text-sm">
                  {formData.razon_social || 'Por completar en el formulario...'}
                </span>
              </div>

              <div>
                <span className="opacity-60 block text-[10px] uppercase font-mono">RUC:</span>
                <span className="font-bold font-mono">
                  {formData.ruc || 'Pendiente de digitación'}
                </span>
              </div>

              <div>
                <span className="opacity-60 block text-[10px] uppercase font-mono">Propietario:</span>
                <span className="font-medium">
                  {formData.nombre_propietario || 'No especificado'}
                </span>
              </div>
            </div>

            {/* Medidas de Seguridad */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 text-[11px] text-white/80 space-y-1.5">
              <div className="font-bold text-aurea-copper flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Aislamiento RLS en PostgreSQL
              </div>
              <p className="text-[10px] leading-relaxed text-white/70">
                Tu restaurante opera con base de datos particionada lógicamente mediante Row-Level Security. Ningún dato es visible para otros restaurantes.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
};
