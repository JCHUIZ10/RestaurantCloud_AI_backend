import React from 'react';
import { MesaAdminDTO } from '@/types/admin';
import { Users, Link2 } from 'lucide-react';
import { EstadoBadge } from '@/components/ui';
import { cn } from '@/shared/utils';

interface MesaAdminCardProps {
  mesa: MesaAdminDTO;
  onEditarMesa: (mesa: MesaAdminDTO) => void;
}

const FORMA: Record<MesaAdminDTO['forma'], string> = {
  cuadrada: 'rounded-2xl min-h-[128px]',
  redonda: 'rounded-full aspect-square',
  rectangular: 'rounded-xl min-h-[96px] self-center',
};

export const MesaAdminCard: React.FC<MesaAdminCardProps> = ({ mesa, onEditarMesa }) => {
  const bloqueada = mesa.estado === 'bloqueada';
  const ocupada = mesa.tiene_pedido_activo;
  const enGrupo = Boolean(mesa.mesa_principal_id);
  const nombre = /^(mesa\b)/i.test(mesa.numero) ? mesa.numero : `Mesa ${mesa.numero}`;

  return (
    <button
      type="button"
      onClick={() => onEditarMesa(mesa)}
      aria-label={`Editar ${nombre}, ${mesa.capacidad} personas, ${ocupada ? 'ocupada' : bloqueada ? 'bloqueada' : 'libre'}`}
      className={cn(
        'relative w-full p-3 flex flex-col items-center justify-center gap-1.5 text-center border-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        FORMA[mesa.forma] ?? FORMA.cuadrada,
        ocupada
          ? 'bg-estado-error-50 border-estado-error-300'
          : bloqueada
            ? 'bg-estado-alerta-50 border-estado-alerta-300'
            : 'bg-white border-aurea-copper/40 hover:border-aurea-copper'
      )}
    >
      <span className="flex items-center gap-1 font-serif font-bold text-lg leading-tight text-aurea-navy">
        {nombre}
        {mesa.permite_union && <Link2 className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />}
      </span>

      <span className="flex items-center gap-1 text-xs font-medium text-aurea-navy/70">
        <Users className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
        {mesa.capacidad} pers.
      </span>

      {bloqueada ? (
        <EstadoBadge tono="alerta">Bloqueada</EstadoBadge>
      ) : ocupada ? (
        <EstadoBadge tono="error">Ocupada</EstadoBadge>
      ) : (
        <EstadoBadge tono="ok">Libre</EstadoBadge>
      )}

      {enGrupo && <EstadoBadge tono="info" icono={Link2}>En grupo</EstadoBadge>}

      {ocupada && mesa.comanda_activa_codigo && (
        <span className="text-xs font-semibold tabular-nums text-estado-error-800 truncate max-w-full">
          S/ {(mesa.total_cuenta_activa || 0).toFixed(2)}
        </span>
      )}
    </button>
  );
};
