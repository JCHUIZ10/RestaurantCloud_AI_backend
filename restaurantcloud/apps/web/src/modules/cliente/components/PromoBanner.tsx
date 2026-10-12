import React from 'react';
import { Sparkles } from 'lucide-react';
import type { PromocionPublicaDTO } from '@/types/carta';

interface PromoBannerProps {
  promociones: PromocionPublicaDTO[];
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ promociones }) => {
  if (!promociones || promociones.length === 0) return null;

  const promo = promociones[0];

  return (
    <div className="rounded-xl p-3 bg-gradient-to-r from-aurea-champagne/60 via-[#FDF0DE] to-aurea-champagne/60 border border-aurea-copper/40 shadow-sm flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-aurea-copper/20 flex items-center justify-center shrink-0 text-aurea-copper">
        <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
      </div>

      <div className="space-y-0.5 flex-1 min-w-0">
        <h4 className="font-semibold text-xs sm:text-sm text-aurea-navy truncate">
          {promo.nombre}
        </h4>
        {promo.descripcion && (
          <p className="text-[11px] text-aurea-navy/70 truncate font-sans">
            {promo.descripcion}
          </p>
        )}
      </div>
    </div>
  );
};
