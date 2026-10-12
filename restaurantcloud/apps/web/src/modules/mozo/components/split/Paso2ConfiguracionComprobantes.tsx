import React, { useState } from 'react';
import {
  FileText,
  Search,
  AlertCircle,
  Tag,
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Building2,
  User,
  Info,
} from 'lucide-react';
import {
  SubcuentaConfigDTO,
  TipoComprobanteSplit,
  CodigoMetodoPago,
  PromocionSedeDTO,
} from '@/types/mozo';
import { mockMozoService } from '../../services/mockMozoService';

interface Paso2ConfiguracionComprobantesProps {
  subcuentas: SubcuentaConfigDTO[];
  promocionesDisponibles: PromocionSedeDTO[];
  onActualizarSubcuentas: (subcuentas: SubcuentaConfigDTO[]) => void;
}

export const Paso2ConfiguracionComprobantes: React.FC<Paso2ConfiguracionComprobantesProps> = ({
  subcuentas,
  promocionesDisponibles,
  onActualizarSubcuentas,
}) => {
  const [buscandoDoc, setBuscandoDoc] = useState<Record<string, boolean>>({});
  const [docErrores, setDocErrores] = useState<Record<string, string | null>>({});

  // Recalcular montos de una subcuenta cuando cambian promos, pasarela o comprobante
  const recalcularSubcuenta = (
    sub: SubcuentaConfigDTO,
    promoId: string | null,
    medioPago: CodigoMetodoPago
  ): SubcuentaConfigDTO => {
    const bruto = sub.items.reduce((acc, it) => acc + it.subtotal, 0);

    // Calcular descuento de promoción
    let descuento = 0;
    if (promoId) {
      const promo = promocionesDisponibles.find((p) => p.id === promoId);
      if (promo) {
        descuento = Math.round(((bruto * promo.porcentaje_descuento) / 100) * 100) / 100;
      }
    }

    const subtotalConDescuento = Math.max(0, bruto - descuento);

    // Calcular comisión de pasarela (Tarjeta POS +3.5%)
    let recargo = 0;
    if (medioPago === 'tarjeta') {
      recargo = Math.round(subtotalConDescuento * 0.035 * 100) / 100;
    }

    const totalNeto = Math.round((subtotalConDescuento + recargo) * 100) / 100;

    // Desglose SUNAT (Base + IGV 18%)
    const baseImponible = Math.round((subtotalConDescuento / 1.18) * 100) / 100;
    const igv = Math.round((subtotalConDescuento - baseImponible) * 100) / 100;

    return {
      ...sub,
      promocion_id: promoId,
      medio_pago: medioPago,
      subtotal_bruto: bruto,
      descuento,
      monto_recargo: recargo,
      total_neto: totalNeto,
      base_imponible: baseImponible,
      igv,
    };
  };

  // Cambio de Promoción en una subcuenta
  const handleCambiarPromocion = (subId: string, promoId: string) => {
    const valorPromo = promoId === 'sin_promo' ? null : promoId;
    const actualizadas = subcuentas.map((s) => {
      if (s.id === subId) {
        return recalcularSubcuenta(s, valorPromo, s.medio_pago);
      }
      return s;
    });
    onActualizarSubcuentas(actualizadas);
  };

  // Cambio de Tipo de Comprobante
  const handleCambiarTipoComprobante = (subId: string, tipo: TipoComprobanteSplit) => {
    const actualizadas = subcuentas.map((s) => {
      if (s.id === subId) {
        return {
          ...s,
          tipo_comprobante: tipo,
          documento_cliente: '',
          nombre_cliente: '',
          direccion_cliente: '',
          consumidor_final_sin_doc: false,
        };
      }
      return s;
    });
    setDocErrores((prev) => ({ ...prev, [subId]: null }));
    onActualizarSubcuentas(actualizadas);
  };

  // Cambio de Medio de Pago Previsto
  const handleCambiarMedioPago = (subId: string, medio: CodigoMetodoPago) => {
    const actualizadas = subcuentas.map((s) => {
      if (s.id === subId) {
        return recalcularSubcuenta(s, s.promocion_id || null, medio);
      }
      return s;
    });
    onActualizarSubcuentas(actualizadas);
  };

  // Cambio de texto en inputs
  const handleCambiarCampoTexto = (
    subId: string,
    campo: 'documento_cliente' | 'nombre_cliente' | 'direccion_cliente',
    valor: string
  ) => {
    const actualizadas = subcuentas.map((s) => {
      if (s.id === subId) {
        return { ...s, [campo]: valor };
      }
      return s;
    });
    onActualizarSubcuentas(actualizadas);
  };

  // Checkbox Consumidor Final sin Documento (< S/ 700)
  const handleToggleConsumidorFinal = (subId: string) => {
    const actualizadas = subcuentas.map((s) => {
      if (s.id === subId) {
        const nuevoValor = !s.consumidor_final_sin_doc;
        return {
          ...s,
          consumidor_final_sin_doc: nuevoValor,
          documento_cliente: nuevoValor ? '00000000' : '',
          nombre_cliente: nuevoValor ? 'CONSUMIDOR FINAL' : '',
        };
      }
      return s;
    });
    onActualizarSubcuentas(actualizadas);
  };

  // Consulta de RUC ante SUNAT
  const handleConsultarRuc = async (subId: string, ruc: string) => {
    if (!ruc || ruc.trim().length !== 11) {
      setDocErrores((prev) => ({
        ...prev,
        [subId]: 'El RUC debe tener 11 dígitos numéricos.',
      }));
      return;
    }

    setBuscandoDoc((prev) => ({ ...prev, [subId]: true }));
    setDocErrores((prev) => ({ ...prev, [subId]: null }));

    try {
      const res = await mockMozoService.consultarRuc(ruc.trim());
      if (res.exito && res.datos) {
        const actualizadas = subcuentas.map((s) => {
          if (s.id === subId) {
            return {
              ...s,
              documento_cliente: res.datos.ruc,
              nombre_cliente: res.datos.razon_social,
              direccion_cliente: res.datos.direccion,
            };
          }
          return s;
        });
        onActualizarSubcuentas(actualizadas);
      } else {
        setDocErrores((prev) => ({
          ...prev,
          [subId]: res.errores?.[0]?.mensaje || 'No se encontró el RUC en SUNAT.',
        }));
      }
    } finally {
      setBuscandoDoc((prev) => ({ ...prev, [subId]: false }));
    }
  };

  // Consulta de DNI ante RENIEC
  const handleConsultarDni = async (subId: string, dni: string) => {
    if (!dni || dni.trim().length !== 8) {
      setDocErrores((prev) => ({
        ...prev,
        [subId]: 'El DNI debe contener exactamente 8 dígitos.',
      }));
      return;
    }

    setBuscandoDoc((prev) => ({ ...prev, [subId]: true }));
    setDocErrores((prev) => ({ ...prev, [subId]: null }));

    try {
      const res = await mockMozoService.consultarDni(dni.trim());
      if (res.exito && res.datos) {
        const actualizadas = subcuentas.map((s) => {
          if (s.id === subId) {
            return {
              ...s,
              documento_cliente: res.datos.dni,
              nombre_cliente: res.datos.nombre_completo,
            };
          }
          return s;
        });
        onActualizarSubcuentas(actualizadas);
      } else {
        setDocErrores((prev) => ({
          ...prev,
          [subId]: res.errores?.[0]?.mensaje || 'No se encontró el DNI en RENIEC.',
        }));
      }
    } finally {
      setBuscandoDoc((prev) => ({ ...prev, [subId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Cabecera Informativa */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <span className="text-slate-600">
          Configura de forma individual el comprobante de pago, promoción y modalidad acordada para cada comensal:
        </span>
        <span className="font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 font-mono">
          {subcuentas.length} Subcuentas a Registrar
        </span>
      </div>

      {/* 2. Grilla de Configuración por Subcuenta (2 Columnas o scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subcuentas.map((sub) => {
          const promoSeleccionada = promocionesDisponibles.find((p) => p.id === sub.promocion_id);
          const esBuscando = buscandoDoc[sub.id] || false;
          const errorDoc = docErrores[sub.id];

          return (
            <div
              key={sub.id}
              className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3.5">
                {/* Cabecera de la Subcuenta */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
                      SUB-0{sub.numero_subcuenta}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        Subcuenta {sub.numero_subcuenta} ({sub.nombre_referencia})
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {sub.items.length} {sub.items.length === 1 ? 'plato asignado' : 'platos asignados'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-serif font-bold text-base text-aurea-navy block">
                      S/ {sub.total_neto.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Total Neto</span>
                  </div>
                </div>

                {/* Resumen de platos en esta subcuenta */}
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                  <div className="text-slate-500 font-medium">Platos incluidos:</div>
                  <div className="flex flex-wrap gap-1">
                    {sub.items.map((it) => (
                      <span
                        key={it.id}
                        className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-[10px] font-medium"
                      >
                        {it.cantidad}x {it.nombre} (S/ {it.subtotal.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>

                {/* BLOQUE A: Promoción Comercial Independiente (CU-ADMIN-17) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-aurea-copper" />
                    <span>Promoción Comercial (CU-ADMIN-17)</span>
                  </label>
                  <select
                    value={sub.promocion_id || 'sin_promo'}
                    onChange={(e) => handleCambiarPromocion(sub.id, e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-aurea-copper/40"
                  >
                    <option value="sin_promo">Sin promoción comercial aplicada</option>
                    {promocionesDisponibles.map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.nombre}
                      </option>
                    ))}
                  </select>

                  {promoSeleccionada && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <span>✓ Descuento aplicado ({promoSeleccionada.porcentaje_descuento}%):</span>
                      <strong className="font-mono">- S/ {sub.descuento.toFixed(2)}</strong>
                    </p>
                  )}
                </div>

                {/* BLOQUE B: Tipo de Comprobante (Factura, Boleta, Nota de Venta) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-aurea-copper" />
                    <span>Tipo de Comprobante Oficial</span>
                  </label>

                  {/* Selector de Píldoras */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleCambiarTipoComprobante(sub.id, 'boleta')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        sub.tipo_comprobante === 'boleta'
                          ? 'bg-aurea-navy text-aurea-champagne shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Boleta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambiarTipoComprobante(sub.id, 'factura')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        sub.tipo_comprobante === 'factura'
                          ? 'bg-aurea-navy text-aurea-champagne shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Factura
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambiarTipoComprobante(sub.id, 'nota_venta')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        sub.tipo_comprobante === 'nota_venta'
                          ? 'bg-aurea-navy text-aurea-champagne shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Nota Venta
                    </button>
                  </div>

                  {/* Formulario Dinámico según Comprobante */}
                  {sub.tipo_comprobante === 'factura' && (
                    <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-semibold text-slate-800">
                          Factura Electrónica (RUC Empresa)
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="Ej: 20601234567"
                          value={sub.documento_cliente || ''}
                          onChange={(e) =>
                            handleCambiarCampoTexto(
                              sub.id,
                              'documento_cliente',
                              e.target.value.replace(/\D/g, '')
                            )
                          }
                          className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900"
                        />
                        <button
                          type="button"
                          disabled={esBuscando || !sub.documento_cliente}
                          onClick={() => handleConsultarRuc(sub.id, sub.documento_cliente || '')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{esBuscando ? 'Consultando...' : 'SUNAT'}</span>
                        </button>
                      </div>

                      {sub.nombre_cliente && (
                        <div className="pt-1 border-t border-slate-200 space-y-0.5 text-[11px]">
                          <div className="text-slate-800 font-semibold truncate">
                            {sub.nombre_cliente}
                          </div>
                          {sub.direccion_cliente && (
                            <div className="text-slate-500 truncate text-[10px]">
                              {sub.direccion_cliente}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {sub.tipo_comprobante === 'boleta' && (
                    <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-semibold text-slate-800">
                          Boleta de Venta (DNI Titular)
                        </span>
                      </div>

                      {!sub.consumidor_final_sin_doc && (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            maxLength={8}
                            placeholder="DNI de 8 dígitos"
                            value={sub.documento_cliente || ''}
                            onChange={(e) =>
                              handleCambiarCampoTexto(
                                sub.id,
                                'documento_cliente',
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900"
                          />
                          <button
                            type="button"
                            disabled={esBuscando || !sub.documento_cliente}
                            onClick={() => handleConsultarDni(sub.id, sub.documento_cliente || '')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>{esBuscando ? 'Buscando...' : 'RENIEC'}</span>
                          </button>
                        </div>
                      )}

                      {sub.nombre_cliente && !sub.consumidor_final_sin_doc && (
                        <div className="pt-1 border-t border-slate-200 text-[11px] font-semibold text-slate-800 truncate">
                          {sub.nombre_cliente}
                        </div>
                      )}

                      {/* Checkbox Consumidor final sin doc */}
                      {sub.total_neto < 700 && (
                        <label className="flex items-center gap-2 pt-1 border-t border-slate-200 cursor-pointer text-[11px] text-slate-600">
                          <input
                            type="checkbox"
                            checked={sub.consumidor_final_sin_doc || false}
                            onChange={() => handleToggleConsumidorFinal(sub.id)}
                            className="rounded border-slate-300 text-aurea-navy focus:ring-aurea-copper"
                          />
                          <span>Consumidor Final sin documento (&lt; S/ 700.00)</span>
                        </label>
                      )}
                    </div>
                  )}

                  {sub.tipo_comprobante === 'nota_venta' && (
                    <div className="space-y-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                        <span>Nota de Venta (Control Interno • Sin SUNAT)</span>
                      </div>

                      <input
                        type="text"
                        placeholder="Nombre del Cliente (ej. Carlos Gómez)"
                        value={sub.nombre_cliente || ''}
                        onChange={(e) =>
                          handleCambiarCampoTexto(sub.id, 'nombre_cliente', e.target.value)
                        }
                        className="w-full py-1.5 px-2.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-900"
                      />
                      <p className="text-[10px] text-amber-800 italic">
                        No exige documento ni reporte fiscal. Emisión directa simplificada.
                      </p>
                    </div>
                  )}

                  {errorDoc && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errorDoc}</span>
                    </p>
                  )}
                </div>

                {/* BLOQUE C: Medio de Pago Previsto */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-aurea-copper" />
                    <span>Medio de Pago Previsto</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCambiarMedioPago(sub.id, 'efectivo')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        sub.medio_pago === 'efectivo'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-3 h-3 text-emerald-600" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCambiarMedioPago(sub.id, 'tarjeta')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        sub.medio_pago === 'tarjeta'
                          ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-3 h-3 text-sky-600" />
                      <span>Tarjeta (+3.5%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCambiarMedioPago(sub.id, 'billetera_digital')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        sub.medio_pago === 'billetera_digital'
                          ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-3 h-3 text-purple-600" />
                      <span>Yape/Plin</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BLOQUE D: Desglose Fiscal SUNAT de la Subcuenta */}
              <div className="pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl mt-2 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Consumo Bruto:</span>
                  <span>S/ {sub.subtotal_bruto.toFixed(2)}</span>
                </div>

                {sub.descuento > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 text-[11px]">
                    <span>Descuento Comercial:</span>
                    <span>- S/ {sub.descuento.toFixed(2)}</span>
                  </div>
                )}

                {sub.monto_recargo > 0 && (
                  <div className="flex items-center justify-between text-sky-700 text-[11px]">
                    <span>Comisión Tarjeta (+3.5%):</span>
                    <span>+ S/ {sub.monto_recargo.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-200">
                  <span>TOTAL A PAGAR:</span>
                  <span className="font-serif text-sm font-bold text-aurea-navy">
                    S/ {sub.total_neto.toFixed(2)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 text-right pt-0.5">
                  (Base Imponible: S/ {sub.base_imponible.toFixed(2)} • IGV 18%: S/ {sub.igv.toFixed(2)})
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Banner de Seguridad: Límite Operativo Mozo */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex items-start gap-3 border border-slate-800">
        <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-aurea-champagne">
            🔒 Límite Operativo Mozo: Recopilación y Envío Digital
          </span>
          <p className="text-[11px] text-slate-300">
            El mozo estructura las subcuentas y modalidades acordadas en mesa, pero{' '}
            <strong>NO emite comprobantes fiscales ante SUNAT ni liquida pagos</strong>. Al confirmar, la mesa transicionará a estado &apos;cuenta_pedida&apos; y el cajero en counter liquidará cada subcuenta en Caja POS (CU-CAJA-03).
          </p>
        </div>
      </div>
    </div>
  );
};
