import React, { useState, useEffect } from 'react';
import {
  X,
  Split,
  ArrowRight,
  ArrowLeft,
  Send,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  ItemParaDividirDTO,
  SubcuentaConfigDTO,
  PromocionSedeDTO,
  DividirCuentaResponseDTO,
} from '@/types/mozo';
import { mockMozoService } from '../../services/mockMozoService';
import { Paso1AsignacionItems } from './Paso1AsignacionItems';
import { Paso2ConfiguracionComprobantes } from './Paso2ConfiguracionComprobantes';

interface ModalDividirCuentaProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  onDivisionConfirmada: (datos: DividirCuentaResponseDTO) => void;
}

export const ModalDividirCuenta: React.FC<ModalDividirCuentaProps> = ({
  isOpen,
  onClose,
  mesaId,
  onDivisionConfirmada,
}) => {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const [mesaInfo, setMesaInfo] = useState({
    numero: '04',
    comensales: 4,
    pedidoId: 'ped-149',
    totalBruto: 100.0,
  });

  const [items, setItems] = useState<ItemParaDividirDTO[]>([]);
  const [subcuentas, setSubcuentas] = useState<SubcuentaConfigDTO[]>([]);
  const [promociones, setPromociones] = useState<PromocionSedeDTO[]>([]);

  useEffect(() => {
    if (isOpen && mesaId) {
      cargarDatosIniciales();
    }
  }, [isOpen, mesaId]);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    setErrorGlobal(null);
    setPaso(1);

    try {
      // 1. Cargar ítems disponibles para dividir
      const resItems = await mockMozoService.obtenerItemsParaDividir(mesaId);
      // 2. Cargar precuenta para promociones disponibles
      const resPrecuenta = await mockMozoService.obtenerPrecuentaMesa(mesaId);

      if (resItems.exito && resItems.datos) {
        setMesaInfo({
          numero: resItems.datos.mesa_numero,
          comensales: resItems.datos.comensales,
          pedidoId: resItems.datos.pedido_id,
          totalBruto: resItems.datos.total_bruto,
        });
        setItems(resItems.datos.items);

        // Inicializar 2 subcuentas por defecto
        const sub1: SubcuentaConfigDTO = {
          id: 'sub-1',
          numero_subcuenta: 1,
          nombre_referencia: 'Comensal A',
          items: [],
          tipo_comprobante: 'factura',
          documento_cliente: '',
          nombre_cliente: '',
          direccion_cliente: '',
          medio_pago: 'tarjeta',
          subtotal_bruto: 0,
          descuento: 0,
          monto_recargo: 0,
          total_neto: 0,
          base_imponible: 0,
          igv: 0,
        };

        const sub2: SubcuentaConfigDTO = {
          id: 'sub-2',
          numero_subcuenta: 2,
          nombre_referencia: 'Comensal B',
          items: [],
          tipo_comprobante: 'boleta',
          documento_cliente: '',
          nombre_cliente: '',
          medio_pago: 'billetera_digital',
          subtotal_bruto: 0,
          descuento: 0,
          monto_recargo: 0,
          total_neto: 0,
          base_imponible: 0,
          igv: 0,
        };

        setSubcuentas([sub1, sub2]);
      }

      if (resPrecuenta.exito && resPrecuenta.datos) {
        setPromociones(resPrecuenta.datos.promociones_disponibles || []);
      }
    } catch {
      setErrorGlobal('Error al cargar la comanda de la mesa.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  // Validación para pasar a Paso 2 (todos los ítems deben estar asignados)
  const itemsPendientes = items.filter((i) => !i.subcuenta_asignada_id);
  const puedeAvanzarAPaso2 = itemsPendientes.length === 0 && subcuentas.some((s) => s.items.length > 0);

  // Validación final antes de enviar a caja
  const validarPaso2 = (): string | null => {
    for (const sub of subcuentas) {
      if (sub.items.length === 0) continue;

      if (sub.tipo_comprobante === 'factura') {
        if (!sub.documento_cliente || sub.documento_cliente.length !== 11) {
          return `Subcuenta ${sub.numero_subcuenta}: Se requiere un RUC válido de 11 dígitos para Factura.`;
        }
        if (!sub.nombre_cliente || sub.nombre_cliente.trim().length === 0) {
          return `Subcuenta ${sub.numero_subcuenta}: Consulta o ingresa la Razón Social de la empresa.`;
        }
      }

      if (sub.tipo_comprobante === 'boleta' && !sub.consumidor_final_sin_doc) {
        if (!sub.documento_cliente || sub.documento_cliente.length !== 8) {
          return `Subcuenta ${sub.numero_subcuenta}: Se requiere un DNI válido de 8 dígitos para Boleta.`;
        }
        if (!sub.nombre_cliente || sub.nombre_cliente.trim().length === 0) {
          return `Subcuenta ${sub.numero_subcuenta}: Consulta o ingresa el Nombre del comensal.`;
        }
      }

      if (sub.tipo_comprobante === 'nota_venta') {
        if (!sub.nombre_cliente || sub.nombre_cliente.trim().length < 3) {
          return `Subcuenta ${sub.numero_subcuenta}: Ingresa el Nombre del Cliente (mínimo 3 caracteres) para Nota de Venta.`;
        }
      }
    }
    return null;
  };

  const handleEnviarSubcuentasACaja = async () => {
    const errorValidacion = validarPaso2();
    if (errorValidacion) {
      setErrorGlobal(errorValidacion);
      return;
    }

    setEnviando(true);
    setErrorGlobal(null);

    // Filtrar subcuentas activas que contengan ítems
    const subcuentasActivas = subcuentas.filter((s) => s.items.length > 0);

    try {
      const res = await mockMozoService.dividirCuentaMesa({
        mesa_id: mesaId,
        pedido_id: mesaInfo.pedidoId,
        subcuentas: subcuentasActivas,
      });

      if (res.exito && res.datos) {
        onDivisionConfirmada(res.datos);
        onClose();
      } else {
        setErrorGlobal(res.errores?.[0]?.mensaje || 'Error al enviar las subcuentas a Caja.');
      }
    } catch {
      setErrorGlobal('Error de red al procesar la división de la comanda.');
    } finally {
      setEnviando(false);
    }
  };

  const totalAsignadoNeto = subcuentas.reduce((sum, s) => sum + s.total_neto, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-[1100px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Wizard (1100px) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-navy flex items-center justify-center border border-aurea-copper/40 text-aurea-champagne shadow-inner">
              <Split className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  Paso {paso} de 2: {paso === 1 ? 'Distribución Determinista de Ítems' : 'Comprobantes, Promociones y Pasarela'}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300">
                  Mesa {mesaInfo.numero} — Salón
                </span>
              </div>
              <h2 className="font-serif text-lg font-bold tracking-wide flex items-center gap-2 mt-0.5">
                <span>➗ Subdividir Comanda en Mesa</span>
                <span className="text-slate-400 font-normal text-xs">
                  (👥 {mesaInfo.comensales} Comensales • 🧾 Comanda #{mesaInfo.pedidoId.replace(/\D/g, '') || '108'} • 💰 Consumo: S/ {mesaInfo.totalBruto.toFixed(2)})
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          {cargando ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-aurea-copper" />
              <span className="text-xs font-medium">Cargando ítems consumidos de la mesa...</span>
            </div>
          ) : (
            <>
              {errorGlobal && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorGlobal}</span>
                </div>
              )}

              {paso === 1 ? (
                <Paso1AsignacionItems
                  items={items}
                  subcuentas={subcuentas}
                  onActualizarItems={setItems}
                  onActualizarSubcuentas={setSubcuentas}
                />
              ) : (
                <Paso2ConfiguracionComprobantes
                  subcuentas={subcuentas.filter((s) => s.items.length > 0)}
                  promocionesDisponibles={promociones}
                  onActualizarSubcuentas={(actualizadas) => {
                    // Mantener subcuentas vacías si las hubiere
                    const mapa = new Map(actualizadas.map((s) => [s.id, s]));
                    const unificadas = subcuentas.map((s) => mapa.get(s.id) || s);
                    setSubcuentas(unificadas);
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer del Wizard */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            {paso === 2 && (
              <button
                type="button"
                onClick={() => {
                  setErrorGlobal(null);
                  setPaso(1);
                }}
                disabled={enviando}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Distribución de Platos</span>
              </button>
            )}

            {paso === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {paso === 1 ? (
              <button
                type="button"
                disabled={!puedeAvanzarAPaso2}
                onClick={() => {
                  setErrorGlobal(null);
                  setPaso(2);
                }}
                className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-sm ${
                  !puedeAvanzarAPaso2
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-aurea-navy hover:bg-[#123156] text-aurea-champagne border border-aurea-copper/50 active:scale-98 shadow-md'
                }`}
              >
                <span>Continuar a Comprobantes y Promociones (Paso 2)</span>
                <ArrowRight className="w-4 h-4 text-aurea-copper" />
              </button>
            ) : (
              <button
                type="button"
                disabled={enviando}
                onClick={handleEnviarSubcuentasACaja}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-md active:scale-98 font-mono"
              >
                {enviando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitiendo a Caja...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>📤 Confirmar y Enviar Subcuentas a Caja (S/ {totalAsignadoNeto.toFixed(2)})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
