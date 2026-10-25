import React, { useState } from 'react';
import { Sparkles, Check, Utensils } from 'lucide-react';
import { PlatoReactivableDTO } from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalReactivacionPlatosProps {
  platos: PlatoReactivableDTO[];
  abierto: boolean;
  onCerrar: () => void;
  onReactivados: (cantidad: number) => void;
}

export const ModalReactivacionPlatos: React.FC<ModalReactivacionPlatosProps> = ({
  platos,
  abierto,
  onCerrar,
  onReactivados,
}) => {
  // La página lo remonta con una key por lista de platos, así todos llegan marcados
  const [seleccionados, setSeleccionados] = useState<string[]>(() => platos.map((p) => p.id));
  const [procesando, setProcesando] = useState(false);

  const togglePlato = (id: string) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleReactivar = async () => {
    if (seleccionados.length === 0) {
      onCerrar();
      return;
    }

    try {
      setProcesando(true);
      const res = await adminService.reactivarPlatosCompra(seleccionados);
      if (res.exito && res.datos) {
        onReactivados(res.datos.actualizados);
        onCerrar();
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal
      abierto={abierto && platos.length > 0}
      onCerrar={onCerrar}
      cerrable={!procesando}
      icono={Sparkles}
      titulo="Platos disponibles otra vez"
      descripcion="Esta compra repuso los insumos de platos que estaban agotados."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={procesando}>
            Dejarlos agotados
          </Button>
          <Button
            onClick={handleReactivar}
            loading={procesando}
            disabled={seleccionados.length === 0}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            Reactivar {seleccionados.length} en carta
          </Button>
        </>
      }
    >
      <ul className="space-y-2">
        {platos.map((plato) => {
          const marcado = seleccionados.includes(plato.id);
          return (
            <li key={plato.id}>
              <label
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                  marcado
                    ? 'bg-estado-ok-50 border-estado-ok-200'
                    : 'bg-white border-aurea-champagne/70 hover:border-aurea-copper/60'
                )}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => togglePlato(plato.id)}
                  className="w-5 h-5 rounded accent-estado-ok-600 shrink-0"
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 font-semibold text-aurea-navy">
                    <Utensils className="w-4 h-4 text-aurea-copper shrink-0" aria-hidden="true" />
                    <span className="truncate">{plato.nombre}</span>
                  </span>
                  <span className="block text-xs text-aurea-navy/60 truncate">
                    {plato.categoria_nombre} · Repuesto: {plato.insumos_reposicionados.join(', ')}
                  </span>
                </span>
                <span className="font-mono text-sm font-semibold text-aurea-navy whitespace-nowrap">
                  S/ {plato.precio.toFixed(2)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
};
