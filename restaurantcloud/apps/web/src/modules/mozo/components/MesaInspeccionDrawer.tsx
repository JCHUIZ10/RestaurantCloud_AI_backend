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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MesaDetalleMozoDTO, ItemDetalleComandaDTO } from '@/types/mozo';
import { ROUTES } from '@/router/routes.constants';

interface MesaInspeccionDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  detalle: MesaDetalleMozoDTO | null;
  cargando: boolean;
  onSolicitarCuenta: (mesaId: string) => void;
  onMarcarItemServido: (itemId: string) => void;
  onAbrirModalUnir?: (mesaId: string) => void;
  onAbrirModalAnular?: (item: ItemDetalleComandaDTO) => void;
}

export const MesaInspeccionDrawer: React.FC<MesaInspeccionDrawerProps> = ({
  abierto,
  onCerrar,
  detalle,
  cargando,
  onSolicitarCuenta,
  onMarcarItemServido,
  onAbrirModalUnir,
  onAbrirModalAnular,
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
                Mesa {detalle?.etiqueta_union || detalle?.numero || '--'}
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
                          {item.estado === 'listo' ? (
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

                      {/* Botón de anulación táctica si aún no fue cobrado */}
                      {item.estado !== 'entregado' && onAbrirModalAnular && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => onAbrirModalAnular(item)}
                            className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Anular plato</span>
                          </button>
                        </div>
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

          {/* Fila 2: Solicitar Cuenta a Caja + Unir Mesas */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => detalle?.mesa_id && onSolicitarCuenta(detalle.mesa_id)}
              disabled={detalle?.estado === 'cuenta_pedida'}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                detalle?.estado === 'cuenta_pedida'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 opacity-80 cursor-not-allowed'
                  : 'bg-aurea-navy hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-aurea-copper" />
              <span>
                {detalle?.estado === 'cuenta_pedida' ? 'Cuenta en Caja' : '🧾 Solicitar Cuenta'}
              </span>
            </button>

            <button
              onClick={() => detalle?.mesa_id && onAbrirModalUnir && onAbrirModalUnir(detalle.mesa_id)}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5 text-slate-600" />
              <span>🔗 Unir Mesas</span>
            </button>
          </div>

          {/* Fila 3: Precuenta Digital en Mesa (CU-MOZO-08) & Dividir Cuenta (CU-MOZO-09) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => {
                if (detalle?.mesa_id) {
                  navigate(ROUTES.MOZO_PRECUENTA(detalle.mesa_id));
                }
              }}
              className="py-1.5 px-3 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all flex items-center justify-center gap-1"
            >
              <span>📱 Precuenta QR Mesa</span>
            </button>

            <button
              onClick={() => {
                alert('División de cuenta CU-MOZO-09: Abre asignador determinista de comprobantes (Factura/Boleta).');
              }}
              className="py-1.5 px-3 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center justify-center gap-1"
            >
              <Split className="w-3 h-3 text-slate-500" />
              <span>➗ Dividir Cuenta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
