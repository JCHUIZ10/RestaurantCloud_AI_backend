import React, { useState, useEffect } from 'react';
import {
  FormularioDatosInvitacionDTO,
  InvitarAdminRequestDTO,
  CuotaPersonalDTO,
} from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
import { extraerDigitosMovilPeru, formatearTelefonoPeru } from '@/shared/utils';
import {
  X,
  Mail,
  User,
  Phone,
  Building2,
  Lock,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ModalInvitarAdminProps {
  abierto: boolean;
  cuota: CuotaPersonalDTO | null;
  formularioDatos: FormularioDatosInvitacionDTO | null;
  onCerrar: () => void;
  onEnviarInvitacion: (dto: InvitarAdminRequestDTO) => Promise<boolean>;
}

export const ModalInvitarAdmin: React.FC<ModalInvitarAdminProps> = ({
  abierto,
  cuota,
  formularioDatos,
  onCerrar,
  onEnviarInvitacion,
}) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setNombre('');
      setCorreo('');
      setTelefono('');
      setErrorLocal(null);
    }
  }, [abierto]);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setErrorLocal('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      setErrorLocal('Ingresa un correo electrónico con formato válido.');
      return;
    }

    // Validación opcional de teléfono (Estándar Móvil Perú E.164: 9 dígitos iniciando con 9)
    if (telefono.trim()) {
      const phoneDigits = extraerDigitosMovilPeru(telefono);
      if (phoneDigits.length > 0) {
        if (!phoneDigits.startsWith('9')) {
          setErrorLocal('El número de celular en Perú debe iniciar con el dígito 9.');
          return;
        }
        if (phoneDigits.length !== 9) {
          setErrorLocal('El número de celular móvil debe contener exactamente 9 dígitos.');
          return;
        }
      }
    }

    setEnviando(true);
    try {
      const exito = await onEnviarInvitacion({
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || undefined,
      });

      if (exito) {
        onCerrar();
      }
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al procesar la invitación.');
    } finally {
      setEnviando(false);
    }
  };

  const cuposLibres = formularioDatos?.cupos_libres ?? cuota?.cupos_disponibles ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border-2 border-aurea-copper/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-invitar-titulo"
      >
        {/* Cabecera del Modal */}
        <div className="bg-aurea-ivory/60 px-6 py-5 border-b border-aurea-copper/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-aurea-navy text-aurea-champagne flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="modal-invitar-titulo"
                className="font-serif text-lg sm:text-xl font-bold text-aurea-navy"
              >
                Invitar Administrador de Local
              </h2>
              <p className="text-[11px] text-aurea-navy/70">
                Alta de nuevo colaborador administrativo de sede
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="w-8 h-8 rounded-full flex items-center justify-center text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-copper/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Banner de Consumo de Cuota */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Consumirás <strong>1 de {cuposLibres}</strong> cuentas de personal disponibles en tu Plan {cuota?.plan_nombre || 'Pro'}.
            </p>
          </div>

          {/* Error Message */}
          {errorLocal && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold">{errorLocal}</p>
            </div>
          )}

          {/* Campo: Nombre Completo */}
          <div className="space-y-1.5">
            <label className="block font-bold text-aurea-navy text-xs">
              Nombre completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Pedro Ramos Morales"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
              />
            </div>
          </div>

          {/* Campo: Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="block font-bold text-aurea-navy text-xs">
              Correo electrónico corporativo / personal <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="pedro.ramos@restaurante.pe"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 font-mono"
              />
            </div>
            <p className="text-[10px] text-aurea-navy/60">
              A este correo se remitirá el enlace de invitación cifrado.
            </p>
          </div>

          {/* Campo: Teléfono (Estándar de Teléfono Móvil Perú) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-bold text-aurea-navy text-xs">
              <Phone className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Teléfono de contacto (opcional)</span>
            </label>
            <div className="flex rounded-xl border border-aurea-copper/30 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-aurea-copper/50">
              {/* Prefijo Fijo No Editable */}
              <div className="inline-flex items-center gap-1.5 px-3 bg-aurea-ivory border-r border-aurea-copper/20 text-aurea-navy font-semibold text-xs select-none">
                <span>🇵🇪</span>
                <span className="font-mono text-xs">+51</span>
              </div>

              {/* Input de Dígitos */}
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={formatearTelefonoPeru(telefono)}
                onChange={(e) => {
                  const digits = extraerDigitosMovilPeru(e.target.value);
                  const formatted = formatearTelefonoPeru(digits);
                  setTelefono(digits ? `+51 ${formatted}` : '');
                }}
                placeholder="987 654 321"
                className="w-full px-3 py-2.5 bg-transparent text-xs font-mono text-aurea-navy placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-aurea-navy/60">
              Número móvil peruano de 9 dígitos. Utilizado para enlaces directos a WhatsApp y contacto rápido.
            </p>
          </div>

          {/* Aviso: Asignación de Sede en Locales */}
          <div className="bg-aurea-ivory/60 border border-aurea-copper/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-aurea-navy">
            <Building2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs text-aurea-navy">
                Asignación de Sede Física
              </p>
              <p className="text-[11px] text-aurea-navy/70 leading-relaxed">
                Una vez que el colaborador acepte la invitación y active su contraseña personal, podrás asignarlo a cualquiera de tus sedes directamente desde el módulo de <strong>Locales</strong>.
              </p>
            </div>
          </div>

          {/* Tarjeta de Seguridad (Sin envío de contraseñas provisionales) */}
          <div className="bg-aurea-ivory/80 rounded-2xl p-4 border border-aurea-copper/25 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-aurea-navy text-xs">
              <Lock className="w-4 h-4 text-aurea-copper" />
              <span>Invitación Segura con Cero Fuga de Credenciales</span>
            </div>
            <p className="text-[11px] text-aurea-navy/70 leading-relaxed">
              No se generan contraseñas provisionales. El colaborador recibirá un enlace firmado temporal válido por <strong>24 horas</strong> para definir su propia clave con validación de fortaleza.
            </p>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-3 border-t border-aurea-copper/15 flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="bg-white text-aurea-navy hover:bg-slate-100 border border-aurea-copper/30 font-semibold text-xs py-2 px-4"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={enviando}
              className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold text-xs py-2 px-5 shadow-md flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-4 h-4 text-aurea-copper animate-spin" />
                  <span>Enviando invitación...</span>
                </>
              ) : (
                <span>Enviar Invitación</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
