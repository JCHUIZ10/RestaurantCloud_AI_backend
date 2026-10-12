import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Utensils, Smartphone, Monitor } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aurea-champagne/40 border border-aurea-copper/30 text-xs font-medium text-aurea-navy mb-6">
        <Utensils className="w-3.5 h-3.5 text-aurea-copper" />
        Identidad Oficial ÁUREA & Frontend React + Vite
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-aurea-navy mb-4 max-w-2xl leading-tight">
        Una experiencia para disfrutar
      </h1>

      <p className="text-base sm:text-lg text-aurea-navy/80 max-w-xl mb-8 leading-relaxed">
        Plataforma SaaS multiempresa con arquitectura modular, diseño adaptable Mobile-First y escritorio.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-8 text-left">
        <Card variant="default">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone className="w-5 h-5 text-aurea-copper" />
            <h3 className="font-semibold text-base text-aurea-navy">Mobile-First</h3>
          </div>
          <p className="text-sm text-aurea-navy/70">
            Optimizado para celulares (carta cliente QR, toma de comandas de mozo en sala).
          </p>
        </Card>

        <Card variant="default">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-5 h-5 text-aurea-copper" />
            <h3 className="font-semibold text-base text-aurea-navy">Escritorio & Tablet</h3>
          </div>
          <p className="text-sm text-aurea-navy/70">
            Paneles de administración, cocina KDS, reportes y gestión integral.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary">
          Ver Carta Digital
        </Button>
        <Button variant="secondary">
          Panel de Gestión
        </Button>
      </div>
    </div>
  );
};
