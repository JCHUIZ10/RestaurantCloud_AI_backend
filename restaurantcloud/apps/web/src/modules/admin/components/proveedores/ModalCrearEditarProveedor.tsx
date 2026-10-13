import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  ProveedorResumenDTO,
  CrearProveedorRequestDTO,
  ActualizarProveedorRequestDTO,
  InsumoAdminDTO,
} from '@/types/admin';

interface ModalCrearEditarProveedorProps {
  abierto: boolean;
  onCerrar: () => void;
  proveedorParaEditar: ProveedorResumenDTO | null;
  catalogoInsumos: InsumoAdminDTO[];
  onGuardar: (
    datos: CrearProveedorRequestDTO | ActualizarProveedorRequestDTO
  ) => Promise<{ success: boolean; mensajeError?: string }>;
}

export const ModalCrearEditarProveedor: React.FC<ModalCrearEditarProveedorProps> = ({
  abierto,
  onCerrar,
  proveedorParaEditar,
  catalogoInsumos,
  onGuardar,
}) => {
  const esEdicion = Boolean(proveedorParaEditar);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<string[]>([]);

  // Estados de validación y carga
  const [guardando, setGuardando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [busquedaInsumo, setBusquedaInsumo] = useState('');

  useEffect(() => {
    if (proveedorParaEditar) {
      setNombre(proveedorParaEditar.nombre);
      setContacto(proveedorParaEditar.contacto || '');
      setTelefono(proveedorParaEditar.telefono || '');
      setEmail(proveedorParaEditar.email || '');
      setDireccion(proveedorParaEditar.direccion || '');
      setInsumosSeleccionados(
        (proveedorParaEditar.insumos_habituales || []).map((ih) => ih.insumo_id)
      );
    } else {
      setNombre('');
      setContacto('');
      setTelefono('+51 ');
      setEmail('');
      setDireccion('');
      setInsumosSeleccionados([]);
    }
    setErrorGlobal(null);
    setBusquedaInsumo('');
  }, [proveedorParaEditar, abierto]);

  if (!abierto) return null;

  const toggleInsumo = (insumoId: string) => {
    setInsumosSeleccionados((prev) =>
      prev.includes(insumoId)
        ? prev.filter((id) => id !== insumoId)
        : [...prev, insumoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal(null);

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || nombreLimpio.length < 3) {
      setErrorGlobal('El nombre comercial o razón social debe tener al menos 3 caracteres.');
      return;
    }

    const telLimpio = telefono.trim();
    if (!telLimpio || telLimpio.length < 6) {
      setErrorGlobal('Ingresa un número telefónico o celular válido.');
      return;
    }

    setGuardando(true);

    const payload: CrearProveedorRequestDTO = {
      nombre: nombreLimpio,
      contacto: contacto.trim() || undefined,
      telefono: telLimpio,
      email: email.trim() || undefined,
      direccion: direccion.trim() || undefined,
      insumos_ids: insumosSeleccionados,
    };

    const res = await onGuardar(payload);
    setGuardando(false);

    if (!res.success) {
      setErrorGlobal(res.mensajeError || 'Ocurrió un error al guardar el proveedor.');
    } else {
      onCerrar();
    }
  };

  // Filtrar insumos disponibles según el buscador local de tags
  const insumosFiltrados = catalogoInsumos.filter((ins) =>
    ins.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-aurea-copper/20 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-proveedor-titulo"
      >
        {/* Cabecera */}
        <div className="px-6 py-4.5 bg-aurea-ivory/60 border-b border-aurea-champagne/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center text-aurea-copper shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-proveedor-titulo"
                className="text-lg font-serif font-bold text-aurea-navy"
              >
                {esEdicion ? 'Editar Proveedor Comercial' : 'Alta Rápida de Proveedor'}
              </h2>
              <p className="text-xs text-aurea-navy/60">
                {esEdicion
                  ? 'Actualiza los datos comerciales y catálogo de insumos.'
                  : 'Registro sin burocracia de RUC en menos de 10 segundos.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-xl text-aurea-navy/50 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {errorGlobal && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Nombre Comercial */}
          <div>
            <label className="block text-xs font-semibold text-aurea-navy mb-1">
              Nombre Comercial o Razón Social <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Distribuidora San Fernando, Casero Don Lucho..."
                className="w-full px-3.5 py-2 text-sm bg-aurea-ivory/30 border border-aurea-copper/30 rounded-xl focus:outline-none focus:border-aurea-copper focus:bg-white text-aurea-navy placeholder:text-aurea-navy/40 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-aurea-navy/50 mt-1">
              Unicidad validada a nivel de sede gastronómica. No se requiere RUC obligatorio.
            </p>
          </div>

          {/* Grilla 2 columnas: Persona de Contacto y Teléfono/WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-aurea-navy mb-1">
                Persona de Contacto / Vendedor
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-aurea-copper/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Ej. Carlos Meneses"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-aurea-ivory/30 border border-aurea-copper/30 rounded-xl focus:outline-none focus:border-aurea-copper focus:bg-white text-aurea-navy placeholder:text-aurea-navy/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-aurea-navy mb-1">
                Teléfono / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600/70 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-aurea-ivory/30 border border-aurea-copper/30 rounded-xl focus:outline-none focus:border-aurea-copper focus:bg-white text-aurea-navy placeholder:text-aurea-navy/40 font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Grilla 2 columnas: Email y Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-aurea-navy mb-1">
                Correo Electrónico Comercial (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-aurea-copper/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.pe"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-aurea-ivory/30 border border-aurea-copper/30 rounded-xl focus:outline-none focus:border-aurea-copper focus:bg-white text-aurea-navy placeholder:text-aurea-navy/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-aurea-navy mb-1">
                Dirección Física / Mercado / Puesto
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-aurea-copper/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Mdo. Santa Anita Pab. B Puesto 14"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-aurea-ivory/30 border border-aurea-copper/30 rounded-xl focus:outline-none focus:border-aurea-copper focus:bg-white text-aurea-navy placeholder:text-aurea-navy/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Insumos que suministra habitualmente (Multi-selector de chips) */}
          <div className="pt-2 border-t border-aurea-champagne/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-aurea-navy flex items-center gap-1.5">
                <Package className="w-4 h-4 text-aurea-copper" />
                <span>Insumos que Suministra Habitualmente</span>
              </label>
              <span className="text-[11px] text-aurea-navy/60">
                {insumosSeleccionados.length} seleccionado(s)
              </span>
            </div>
            <p className="text-[11px] text-aurea-navy/60 mb-2">
              Vincula los insumos de bodega para agilizar cotizaciones y filtros de reposición en compras.
            </p>

            {/* Buscador de insumos rápido */}
            <input
              type="text"
              value={busquedaInsumo}
              onChange={(e) => setBusquedaInsumo(e.target.value)}
              placeholder="Filtrar insumos de bodega..."
              className="w-full px-3 py-1.5 text-xs bg-aurea-ivory/20 border border-aurea-copper/20 rounded-lg mb-2 focus:outline-none focus:border-aurea-copper text-aurea-navy"
            />

            {/* Contenedor de chips seleccionables */}
            <div className="max-h-36 overflow-y-auto p-2 bg-aurea-ivory/30 rounded-xl border border-aurea-champagne/80 flex flex-wrap gap-1.5">
              {insumosFiltrados.length === 0 ? (
                <span className="text-xs text-aurea-navy/50 p-2 italic">
                  No se encontraron insumos con ese nombre.
                </span>
              ) : (
                insumosFiltrados.map((ins) => {
                  const seleccionado = insumosSeleccionados.includes(ins.id);
                  return (
                    <button
                      key={ins.id}
                      type="button"
                      onClick={() => toggleInsumo(ins.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        seleccionado
                          ? 'bg-aurea-navy text-white shadow-xs'
                          : 'bg-white border border-aurea-champagne/80 text-aurea-navy hover:bg-aurea-champagne/30'
                      }`}
                    >
                      {seleccionado ? (
                        <Check className="w-3 h-3 text-aurea-champagne" />
                      ) : (
                        <Plus className="w-3 h-3 text-aurea-copper" />
                      )}
                      <span>{ins.nombre}</span>
                      <span className="text-[10px] opacity-70 font-mono">({ins.unidad_medida})</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Botones de Acción al Pie */}
          <div className="pt-3 border-t border-aurea-champagne/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="px-4 py-2 rounded-xl border border-aurea-copper/30 bg-white hover:bg-aurea-champagne/20 text-aurea-navy text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-xs font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{esEdicion ? 'Actualizar Proveedor' : 'Guardar Proveedor'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
