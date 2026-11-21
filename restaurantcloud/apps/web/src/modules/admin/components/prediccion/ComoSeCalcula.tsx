import React from 'react';

const PASOS = [
  { titulo: 'Vemos cuánto vas a vender', texto: 'de cada plato, día por día, según cómo se ha vendido en fechas parecidas.' },
  { titulo: 'Lo pasamos a ingredientes', texto: 'con tus recetas: cada ceviche lleva su pescado, su limón y su cebolla.' },
  { titulo: 'Restamos lo que ya tienes', texto: 'y sumamos una reserva por si llegan más clientes de lo normal.' },
];

/** Explica de dónde salen las cantidades, sin términos técnicos. */
export const ComoSeCalcula: React.FC = () => (
  <section aria-labelledby="titulo-como" className="space-y-3">
    <h2 id="titulo-como" className="text-lg font-bold text-aurea-navy">¿De dónde salen estas cantidades?</h2>
    <ol className="grid gap-3 md:grid-cols-3">
      {PASOS.map((p, i) => (
        <li key={p.titulo} className="flex items-start gap-3 rounded-2xl bg-aurea-champagne/30 p-4">
          <span className="w-8 h-8 rounded-full bg-aurea-navy text-aurea-champagne font-bold flex items-center justify-center shrink-0" aria-hidden="true">
            {i + 1}
          </span>
          <p className="text-sm text-aurea-navy leading-relaxed">
            <strong>{p.titulo}</strong> {p.texto}
          </p>
        </li>
      ))}
    </ol>
  </section>
);
