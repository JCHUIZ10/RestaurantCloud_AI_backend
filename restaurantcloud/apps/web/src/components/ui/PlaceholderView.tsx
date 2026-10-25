import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExternalLink, ShieldCheck, Smartphone, Monitor, Clock4, Info } from 'lucide-react';

interface PlaceholderViewProps {
  codigoCu: string;
  nombrePantalla: string;
  rol: string;
  layoutNombre: string;
  descripcion: string;
  viewportSugerido?: 'mobile' | 'desktop' | 'fullscreen';
  enlacesRelacionados?: Array<{ label: string; to: string }>;
  proximoEntregable?: boolean;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  codigoCu,
  nombrePantalla,
  rol,
  layoutNombre,
  descripcion,
  viewportSugerido = 'desktop',
  enlacesRelacionados = [],
  proximoEntregable = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Encabezado del Caso de Uso */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-aurea-copper/20">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-aurea-navy text-aurea-champagne shadow-sm">
              {codigoCu}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
              Rol: {rol}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-aurea-copper/20 text-aurea-copper">
              Layout: {layoutNombre}
            </span>
            {proximoEntregable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                <Clock4 className="w-3.5 h-3.5 text-amber-700" />
                <span>Próximo Entregable (Fase 2)</span>
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-aurea-navy pt-1">
            {nombrePantalla}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-aurea-navy/70 bg-white/70 px-3 py-1.5 rounded-lg border border-aurea-copper/20">
          {viewportSugerido === 'mobile' ? (
            <>
              <Smartphone className="w-4 h-4 text-aurea-copper" />
              <span>Diseñado para Smartphone (Mobile-First)</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 text-aurea-copper" />
              <span>Optimizado para Escritorio & Tablet</span>
            </>
          )}
        </div>
      </div>

      {/* Tarjeta de Especificación y Estado UX */}
      <Card variant="elevated" className={`space-y-4 border-2 ${proximoEntregable ? 'border-amber-300 bg-amber-50/20' : 'border-aurea-copper/30'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${proximoEntregable ? 'bg-amber-100 text-amber-800' : 'bg-aurea-champagne/30 text-aurea-copper'}`}>
            {proximoEntregable ? <Info className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-aurea-navy">
              {proximoEntregable ? 'Módulo Planificado para Próximo Entregable' : 'Vista Registrada en el Árbol de Rutas'}
            </h3>
            <p className="font-sans text-sm text-aurea-navy/80 leading-relaxed">
              {descripcion}
            </p>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border text-xs font-sans text-aurea-navy/85 space-y-1.5 ${proximoEntregable ? 'bg-white border-amber-200' : 'bg-aurea-ivory border-aurea-copper/20'}`}>
          <p>
            <strong>Estado de Entrega:</strong>{' '}
            {proximoEntregable
              ? 'Diferido de forma planificada para la Fase 2 (Próximo Entregable). Su contrato de endpoints, modelos DDL y especificación funcional se encuentran consolidados.'
              : `Enrutamiento conectado con éxito bajo ${layoutNombre}.`}
          </p>
          <p className="text-aurea-navy/70">
            {proximoEntregable
              ? 'Este módulo se mantendrá no visible en la navegación lateral durante el primer avance para garantizar una experiencia focalizada en los flujos principales.'
              : 'Esta vista está lista para que implementemos su diseño en alta fidelidad y sus componentes reactivos.'}
          </p>
        </div>
      </Card>

      {/* Enlaces Rápidos de Navegación del Sistema */}
      {enlacesRelacionados.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="font-serif text-base text-aurea-navy">Navegación Rápida a Módulos Activos:</h4>
          <div className="flex flex-wrap gap-2.5">
            {enlacesRelacionados.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <span>{item.label}</span>
                  <ExternalLink className="w-3 h-3 text-aurea-copper" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
