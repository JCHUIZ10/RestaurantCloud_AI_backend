import React, { useState, useEffect } from 'react';
import {
  FormularioDatosInvitacionDTO,
  InvitarAdminRequestDTO,
  CuotaPersonalDTO,
} from '@/types/propietarioAdmins';
import { Button } from '@/components/ui/Button';
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
  CheckCircle2,
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
  const [localId, setLocalId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Inicializar local seleccionado con la primera sede disponible
  useEffect(() => {
    if (abierto) {
      setNombre('');
      setCorreo('');
      setTelefono('');
      setErrorLocal(null);

      if (formularioDatos?.sedes_disponibles && formularioDatos.sedes_disponibles.length > 0) {
        setLocalId(formularioDatos.sedes_disponibles[0].id);
      } else {
        setLocalId('');
      }
    }
  }, [abierto, formularioDatos]);

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

    if (!localId) {
      setErrorLocal('Debes seleccionar una sede titular para el administrador.');
      return;
    }

    setEnviando(true);
    try {
      const exito = await onEnviarInvitacion({
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || undefined,
        local_id: localId,
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
  const sedesDisponibles = formularioDatos?.sedes_disponibles || [];
  const sedesOcupadas = formularioDatos?.sedes_ocupadas || [];

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

          {/* Campo: Teléfono */}
          <div className="space-y-1.5">
            <label className="block font-bold text-aurea-navy text-xs">
              Teléfono de contacto (opcional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 912 345 678"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50"
              />
            </div>
          </div>

          {/* Campo: Sede Titular a Supervisar */}
          <div className="space-y-1.5">
            <label className="block font-bold text-aurea-navy text-xs">
              Sede Titular a supervisar <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-aurea-copper/30 rounded-xl text-xs text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 appearance-none font-medium"
              >
                {sedesDisponibles.length === 0 && sedesOcupadas.length === 0 && (
                  <option value="">No hay sedes registradas</option>
                )}

                {sedesDisponibles.length > 0 && (
                  <optgroup label="Sedes Disponibles (Sin Administrador Titular)">
                    {sedesDisponibles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.distrito}) — Disponible
                      </option>
                    ))}
                  </optgroup>
                )}

                {sedesOcupadas.length > 0 && (
                  <optgroup label="Sedes Ocupadas (Ya cuentan con titular)">
                    {sedesOcupadas.map((s) => (
                      <option key={s.id} value={s.id} disabled>
                        {s.nombre} (Titular: {s.administrador_actual || 'Asignado'})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <p className="text-[10px] text-aurea-copper font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Regla de negocio: Cada sede cuenta con 1 administrador titular exclusivo.</span>
            </p>
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
              disabled={enviando || sedesDisponibles.length === 0}
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
