import React, { useState, useEffect } from 'react';
import { X, Truck, Loader2, Save, MessageCircle, User, Mail, MapPin } from 'lucide-react';
import { adminService } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import { ProveedorResumenDTO } from '@/types/admin';
import { extraerDigitosMovilPeru, formatearTelefonoPeru } from '@/shared/utils';

interface ModalProveedorAlVueloProps {
  abierto: boolean;
  onCerrar: () => void;
  onProveedorCreado: (proveedor: ProveedorResumenDTO) => void;
}

export const ModalProveedorAlVuelo: React.FC<ModalProveedorAlVueloProps> = ({
  abierto,
  onCerrar,
  onProveedorCreado,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const localId = usuario?.local?.id || '';

  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setNombre('');
      setContacto('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setError(null);
      setGuardando(false);
    }
  }, [abierto]);

  if (!abierto) return null;

  const digitosTelefono = extraerDigitosMovilPeru(telefono);
  const telefonoValido = digitosTelefono.length === 9 && digitosTelefono.startsWith('9');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!localId) {
      setError("No se identificó una sede activa en la sesión del usuario para asociar el proveedor.");
      return;
    }

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || nombreLimpio.length < 3) {
      setError('El nombre comercial o razón social debe tener al menos 3 caracteres.');
      return;
    }

    if (!digitosTelefono || digitosTelefono.length !== 9) {
      setError('Ingresa un número móvil peruano válido de 9 dígitos para WhatsApp y contacto.');
      return;
    }

    if (!digitosTelefono.startsWith('9')) {
      setError('El número de celular debe iniciar con el dígito 9 según el estándar móvil de Perú.');
      return;
    }

    try {
      setGuardando(true);
      const res = await adminService.crearProveedor(localId, {
        nombre: nombreLimpio,
        contacto: contacto.trim() || undefined,
        telefono: `+51 ${formatearTelefonoPeru(digitosTelefono)}`,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });

      if (res.exito && res.datos) {
        onProveedorCreado(res.datos);
        onCerrar();
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo registrar el proveedor.');
      }
    } catch {
      setError('Ocurrió un error inesperado al registrar el proveedor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-aurea-navy text-white shadow-sm">
              <Truck className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Crear Proveedor al Vuelo</h3>
              <p className="text-xs text-gray-500">Alta ágil de proveedor sin exigencia de RUC</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Nombre Comercial */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre Comercial o Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Distribuidora Los Andes, Casero Don Lucho..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-aurea-navy focus:outline-none placeholder:text-gray-400 font-medium"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Unicidad validada a nivel de sede gastronómica.
            </p>
          </div>

          {/* Teléfono / WhatsApp (Estándar Perú) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Teléfono / WhatsApp</span>
                <span className="text-rose-500">*</span>
              </label>
              {telefonoValido ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span>WhatsApp Válido</span>
                </span>
              ) : digitosTelefono.length > 0 ? (
                <span className="text-[11px] text-gray-500 font-mono">
                  {digitosTelefono.length}/9 dígitos
                </span>
              ) : null}
            </div>
            <div className="flex rounded-xl border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-aurea-navy focus-within:border-aurea-navy transition-all">
              {/* Prefijo Fijo No Editable */}
              <div className="inline-flex items-center gap-1 px-3 bg-gray-50 border-r border-gray-200 text-gray-700 font-semibold text-xs select-none shrink-0">
                <span>🇵🇪</span>
                <span className="font-mono text-xs">+51</span>
              </div>

              {/* Input de Dígitos */}
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={11}
                value={formatearTelefonoPeru(telefono)}
                onChange={(e) => {
                  const digits = extraerDigitosMovilPeru(e.target.value);
                  const formatted = formatearTelefonoPeru(digits);
                  setTelefono(digits ? `+51 ${formatted}` : '');
                }}
                placeholder="987 654 321"
                className="w-full px-3 py-2 text-sm font-mono text-gray-800 bg-transparent focus:outline-none placeholder:text-gray-400"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Móvil peruano de 9 dígitos iniciando con 9. Se utilizará para cotizaciones y pedidos.
            </p>
          </div>

          {/* Contacto Principal */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Contacto Principal / Vendedor (Opcional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-aurea-navy focus:outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Email y Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.pe"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-aurea-navy focus:outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Dirección de Despacho (Opcional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Mercado Santa Anita Pab. 4"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-aurea-navy focus:outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-aurea-navy hover:bg-aurea-navy/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-aurea-champagne" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-aurea-champagne" />
                  <span>Guardar Proveedor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
