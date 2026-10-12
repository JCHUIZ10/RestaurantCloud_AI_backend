import React from 'react';
import {
  X,
  Clock,
  User,
  Utensils,
  PackageCheck,
  CheckCircle2,
  Receipt,
  PlusCircle,
  Link2,
  Split,
  Trash2,
  Scissors,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MesaDetalleMozoDTO, ItemDetalleComandaDTO } from '@/types/mozo';
import { ROUTES } from '@/router/routes.constants';

interface MesaInspeccionDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  detalle: MesaDetalleMozoDTO | null;
  cargando: boolean;
  onSolicitarOVerCuenta: (mesaId: string) => void;
  onMarcarItemServido: (itemId: string) => void;
  onAbrirModalUnir?: (mesaId: string) => void;
  onAbrirModalSeparar?: (mesaId: string) => void;
  onAbrirModalDividir?: (mesaId: string) => void;
  onAbrirModalAnular?: (item: ItemDetalleComandaDTO) => void;
  onAbrirModalAnularComanda?: (mesaId: string) => void;
  onAtenderQuiebre?: (item: ItemDetalleComandaDTO) => void;
  onSustituirPlato?: (item: ItemDetalleComandaDTO) => void;
  onAnularPorQuiebre?: (item: ItemDetalleComandaDTO) => void;
}

export const MesaInspeccionDrawer: React.FC<MesaInspeccionDrawerProps> = ({
  abierto,
  onCerrar,
  detalle,
  cargando,
  onSolicitarOVerCuenta,
  onMarcarItemServido,
  onAbrirModalUnir,
  onAbrirModalSeparar,
  onAbrirModalDividir,
  onAbrirModalAnular,
  onAbrirModalAnularComanda,
  onAtenderQuiebre,
  onSustituirPlato,
  onAnularPorQuiebre,
}) => {
  const navigate = useNavigate();

  if (!abierto) return null;

  const platosCocina = detalle?.items.filter((i) => i.requiere_preparacion) || [];
  const bebidasSalon = detalle?.items.filter((i) => !i.requiere_preparacion) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop oscuro translúcido */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onCerrar}
      />

      {/* Panel lateral 440px táctil */}
      <div className="relative w-full max-w-[440px] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left select-none">
        {/* Encabezado del Drawer */}
        <div className="p-4 bg-aurea-navy text-white flex items-start justify-between border-b border-aurea-copper/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                {detalle?.etiqueta_union ? detalle.etiqueta_union : `Mesa ${detalle?.numero || '--'}`}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  detalle?.estado === 'cuenta_pedida'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-aurea-copper/20 text-aurea-champagne border border-aurea-copper/40'
                }`}
              >
                {detalle?.estado === 'cuenta_pedida' ? 'CUENTA PEDIDA' : 'OCUPADA'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>{detalle?.ambiente || 'Salón Principal'}</span>
              <span>•</span>
              <span className="font-mono">Comanda #{detalle?.numero_comanda || '149'}</span>
            </p>

            <div className="flex items-center gap-3 text-[11px] text-aurea-champagne/90 mt-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-aurea-copper" />
                {detalle?.minutos_en_mesa || 0} min en mesa
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-aurea-copper" />
                {detalle?.comensales || 1} comensales
              </span>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Mesas Agrupadas si es mesa unida */}
        {detalle?.es_mesa_unida && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900 flex items-center gap-1.5 truncate max-w-[300px]">
              <Link2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="truncate">{detalle.mesas_agrupadas_detalle || 'Mesas Agrupadas en Salón'}</span>
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shrink-0">
              🔗 UNIFICADA
            </span>
          </div>
        )}

        {/* Contenido scrolleable del pedido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {cargando ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-aurea-copper border-t-transparent rounded-full animate-spin" />
              <span>Cargando detalle de comanda...</span>
            </div>
          ) : (
            <>
              {/* Información del Mozo responsable */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-slate-600">
                <span>Mozo asignado:</span>
                <strong className="text-slate-900 font-semibold">
                  {detalle?.mozo_nombre} {detalle?.es_mi_mesa ? '(Tú)' : ''}
                </strong>
              </div>

              {/* BLOQUE A: Platos en Cocina KDS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-aurea-copper" />
                    Cocina KDS ({platosCocina.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Requiere cocción</span>
                </div>

                <div className="space-y-2">
                  {platosCocina.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-colors shadow-2xs ${
                        item.estado === 'no_disponible'
                          ? 'border-amber-400 bg-amber-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="font-mono text-aurea-copper font-bold">
                              {item.cantidad}x
                            </span>
                            <span>{item.producto_nombre}</span>
                          </div>
                          {item.nota_cocina && (
                            <p className="text-[11px] text-amber-700 italic mt-0.5">
                              ↳ Nota: {item.nota_cocina}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="font-serif font-bold text-slate-900 text-xs">
                            S/ {item.subtotal.toFixed(2)}
                          </span>

                          {/* Badge de estado del ítem */}
                          {item.estado === 'no_disponible' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 flex items-center gap-0.5 animate-pulse border border-amber-600">
                              ⚠️ QUIEBRE
                            </span>
                          ) : item.estado === 'listo' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-slate-950 flex items-center gap-0.5 animate-pulse">
                              🔔 LISTO
                            </span>
                          ) : item.estado === 'en_preparacion' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-orange-100 text-orange-800 border border-orange-200">
                              ⏳ PREP {item.minutos_en_estado}m
                            </span>
                          ) : item.estado === 'entregado' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800">
                              ✓ SERVIDO
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-600">
                              En cola
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bloque especial de resolución para platos con quiebre (CU-MOZO-07) */}
                      {item.estado === 'no_disponible' ? (
                        <div className="mt-2 pt-2 border-t border-amber-200 bg-amber-50/90 -mx-2.5 -mb-2.5 p-2.5 rounded-b-xl space-y-2">
                          <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Stock agotado en Cocina. Resolver en mesa:</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => (onSustituirPlato ? onSustituirPlato(item) : onAtenderQuiebre && onAtenderQuiebre(item))}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>🔄 Sustituir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => (onAnularPorQuiebre ? onAnularPorQuiebre(item) : onAtenderQuiebre && onAtenderQuiebre(item))}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>✕ Anular</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Botón de anulación táctica ordinaria (CU-MOZO-06) */
                        onAbrirModalAnular && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.estado === 'entregado' ? '⚠️ Califica como merma' : '🛑 Cancela en KDS'}
                            </span>
                            <button
                              onClick={() => onAbrirModalAnular(item)}
                              className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium hover:underline"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Anular plato</span>
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE B: Productos de Despacho Directo (Entrega directa) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-aurea-copper" />
                    Productos de Despacho Directo ({bebidasSalon.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Entrega directa</span>
                </div>

                <div className="space-y-2">
                  {bebidasSalon.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="font-mono text-aurea-copper font-bold">
                              {item.cantidad}x
                            </span>
                            <span>{item.producto_nombre}</span>
                          </div>
                          {item.nota_cocina && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              ↳ {item.nota_cocina}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="font-serif font-bold text-slate-900 text-xs">
                            S/ {item.subtotal.toFixed(2)}
                          </span>

                          {item.estado === 'listo' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              ⚡ ENTREGA DIRECTA
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800">
                              ✓ SERVIDO
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón rápido para marcar producto servido */}
                      {item.estado === 'listo' && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={() => onMarcarItemServido(item.id)}
                            className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>✓ Marcar Producto Servido</span>
                          </button>
                        </div>
                      )}

                      {/* Botón de anulación táctica para bebidas / salón */}
                      {onAbrirModalAnular && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.estado === 'entregado' ? '⚠️ Califica como merma' : 'Salón'}
                          </span>
                          <button
                            onClick={() => onAbrirModalAnular(item)}
                            className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium hover:underline"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Anular producto</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota General de la Comanda */}
              {detalle?.nota_general && (
                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-semibold">📝 Nota de Salón: </span>
                  {detalle.nota_general}
                </div>
              )}

              {/* BLOQUE DIVISIÓN: Subcuentas en Caja POS (CU-MOZO-09) */}
              {detalle?.es_cuenta_dividida && detalle?.subcuentas_resumen && detalle.subcuentas_resumen.length > 0 && (
                <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5 text-amber-700" />
                      Cuenta Dividida ({detalle.partes_subcuentas || detalle.subcuentas_resumen.length} Comprobantes)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">
                      EN CAJA POS
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {detalle.subcuentas_resumen.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2 bg-white rounded-lg border border-amber-200 text-xs flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                              {sub.tipo_comprobante}
                            </span>
                            <span>{sub.cliente}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {sub.documento ? `Doc: ${sub.documento}` : 'Sin doc'} • {sub.medio_pago.toUpperCase()} • {sub.total_items} ítems
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-serif font-bold text-slate-900 text-xs">
                            S/ {sub.total.toFixed(2)}
                          </span>
                          <span className="block text-[9px] text-amber-700 font-medium">
                            {sub.estado === 'cobrado' ? '✓ Cobrado' : '⏳ Pendiente cobro'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Total Acumulado */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-xs">TOTAL CONSUMO ACTUAL:</span>
          <span className="font-serif text-xl font-bold text-aurea-navy">
            S/ {detalle?.total_subtotal?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Barra de Acciones Rápidas Integradas (Conecta los otros CUs) */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2">
          {/* Botón Primario: Tomar Más Pedidos / Adicionales (CU-MOZO-02) */}
          <button
            onClick={() => {
              if (detalle?.mesa_id) {
                navigate(ROUTES.MOZO_COMANDA(detalle.mesa_id));
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-aurea-copper hover:bg-[#c48e5d] text-aurea-navy transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-aurea-navy" />
            <span>＋ Tomar Más Pedidos / Adicionales (CU-MOZO-02)</span>
          </button>

          {/* Fila 2: Acción Unificada de Cuenta (Solicitar Cuenta / Ver Cuenta) */}
          <button
            onClick={() => detalle?.mesa_id && onSolicitarOVerCuenta(detalle.mesa_id)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98 ${
              detalle?.estado === 'cuenta_pedida'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 border border-amber-400 font-bold'
                : 'bg-aurea-navy hover:bg-[#123156] text-[#F4D7B0] border border-[#D5A06F]/50'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#D5A06F]" />
            <span>
              {detalle?.estado === 'cuenta_pedida' ? '🧾 Ver Cuenta' : '🧾 Solicitar Cuenta'}
            </span>
          </button>

          {/* Fila 3: Operaciones Especiales de Salón (Unir Mesas & Dividir Cuenta) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {detalle?.es_mesa_unida ? (
              <button
                onClick={() =>
                  detalle?.mesa_id && onAbrirModalSeparar && onAbrirModalSeparar(detalle.mesa_id)
                }
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Scissors className="w-3.5 h-3.5 text-rose-600" />
                <span>✂️ Separar Mesas</span>
              </button>
            ) : (
              <button
                onClick={() =>
                  detalle?.mesa_id && onAbrirModalUnir && onAbrirModalUnir(detalle.mesa_id)
                }
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Link2 className="w-3.5 h-3.5 text-slate-600" />
                <span>🔗 Unir Mesas</span>
              </button>
            )}

            <button
              onClick={() => {
                if (detalle?.mesa_id && onAbrirModalDividir) {
                  onAbrirModalDividir(detalle.mesa_id);
                }
              }}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center justify-center gap-1 active:scale-98"
            >
              <Split className="w-3.5 h-3.5 text-slate-500" />
              <span>➗ Dividir Cuenta</span>
            </button>
          </div>

          {/* Fila 4: Anulación Total de Comanda Destructiva (CU-MOZO-06 Vista 1) */}
          {detalle?.items && detalle.items.length > 0 && onAbrirModalAnularComanda && (
            <button
              onClick={() => detalle?.mesa_id && onAbrirModalAnularComanda(detalle.mesa_id)}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 hover:border-rose-300 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>⚠️ Anular Comanda Completa de Mesa {detalle.numero}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
