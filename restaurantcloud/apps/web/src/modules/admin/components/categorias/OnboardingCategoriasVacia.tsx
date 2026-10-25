import React from 'react';
import { FolderTree, Plus, Smartphone, QrCode, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Button, EstadoVacio } from '@/components/ui';

interface OnboardingCategoriasVaciaProps {
  onCrearPrimeraCategoria: () => void;
}

const BENEFICIOS: Array<{ icono: LucideIcon; titulo: string; texto: string }> = [
  { icono: Smartphone, titulo: 'Comanda del mozo', texto: 'Las pestañas siguen el orden que definas aquí.' },
  { icono: QrCode, titulo: 'Carta QR', texto: 'Decides qué secciones ven los comensales.' },
  { icono: ShieldCheck, titulo: 'Sin platos sueltos', texto: 'Cada plato pertenece siempre a una categoría.' },
];

export const OnboardingCategoriasVacia: React.FC<OnboardingCategoriasVaciaProps> = ({
  onCrearPrimeraCategoria,
}) => (
  <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm max-w-3xl mx-auto px-4 sm:px-8 pb-8">
    <EstadoVacio
      icono={FolderTree}
      titulo="Crea las categorías de tu carta"
      descripcion="Las categorías agrupan los platos, ordenan la carta QR y definen las pestañas que usan los mozos al tomar la comanda."
      accion={
        <Button size="lg" onClick={onCrearPrimeraCategoria} leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}>
          Crear primera categoría
        </Button>
      }
    />
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
        <li key={titulo} className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne/50 space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-aurea-navy">
            <Icono className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            {titulo}
          </p>
          <p className="text-sm text-aurea-navy/70">{texto}</p>
        </li>
      ))}
    </ul>
  </div>
);
