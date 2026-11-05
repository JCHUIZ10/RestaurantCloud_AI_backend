import React from 'react';
import { Building2, Check, Sparkles, X } from 'lucide-react';
import type { LimitesPlanDTO, PlanComparativoDTO } from '@/types/propietarioCambiarPlan';

interface MatrizComparativaPlanesProps {
  planes: PlanComparativoDTO[];
}

interface FilaMatriz {
  nombre: string;
  valor: (limites: LimitesPlanDTO) => boolean | string;
}

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

const CATEGORIAS: { categoria: string; icono: React.ElementType; filas: FilaMatriz[] }[] = [
  {
    categoria: 'Capacidad operativa',
    icono: Building2,
    filas: [
      { nombre: 'Locales permitidos', valor: (l) => plural(l.max_locales, 'local', 'locales') },
      { nombre: 'Pisos por local', valor: (l) => plural(l.max_pisos, 'piso', 'pisos') },
      { nombre: 'Mesas por local', valor: (l) => plural(l.max_mesas, 'mesa', 'mesas') },
      { nombre: 'Personal por local', valor: (l) => plural(l.max_usuarios, 'cuenta', 'cuentas') },
    ],
  },
  {
    categoria: 'Funciones y herramientas incluidas',
    icono: Sparkles,
    filas: [
      { nombre: 'Módulo de reservas', valor: (l) => l.incluye_reservas },
      { nombre: 'Reportes avanzados', valor: (l) => l.incluye_reportes_avanzados },
      { nombre: 'Asistente IA de salón', valor: (l) => l.incluye_asistente_ia },
      { nombre: 'Predicción de demanda IA', valor: (l) => l.incluye_prediccion_ia },
    ],
  },
];

/** Matriz derivada de los límites reales de cada plan en la BD: no hay valores escritos a mano. */
export const MatrizComparativaPlanes: React.FC<MatrizComparativaPlanesProps> = ({ planes }) => (
  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
    <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="font-serif text-lg font-bold text-aurea-navy flex items-center gap-2">
          Comparación detallada de características por plan
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Los locales se limitan por empresa; pisos, mesas y personal, en cada local por separado.
        </p>
      </div>
      <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto">
        Valores oficiales del sistema
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[34rem]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-600">
            <th className="py-4 px-4 sm:px-6">Característica</th>
            {planes.map((p) => (
              <th
                key={p.id}
                className={`py-4 px-4 text-center transition-colors ${
                  p.es_plan_actual ? 'bg-aurea-navy/[0.04] text-aurea-navy font-bold' : ''
                }`}
              >
                <span className="text-sm font-bold block">{p.nombre}</span>
                {p.es_plan_actual ? (
                  <span className="mt-1 inline-block text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-aurea-navy text-white shadow-xs">
                    Tu plan actual
                  </span>
                ) : (
                  <span className="mt-1 inline-block text-[10px] font-medium text-slate-400">
                    S/ {p.precio_mensual.toFixed(0)}/mes
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {CATEGORIAS.map((cat) => {
            const CatIcon = cat.icono;
            return (
              <React.Fragment key={cat.categoria}>
                <tr className="bg-slate-100/60">
                  <td
                    colSpan={planes.length + 1}
                    className="py-2.5 px-4 sm:px-6 font-bold uppercase tracking-wider text-[11px] text-aurea-navy"
                  >
                    <span className="flex items-center gap-2">
                      <CatIcon className="w-3.5 h-3.5 text-aurea-copper" />
                      {cat.categoria}
                    </span>
                  </td>
                </tr>
                {cat.filas.map((fila) => (
                  <tr key={fila.nombre} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-medium text-slate-900">{fila.nombre}</td>
                    {planes.map((p) => {
                      const valor = fila.valor(p.limites);
                      return (
                        <td
                          key={p.id}
                          className={`py-3 px-4 text-center ${
                            p.es_plan_actual ? 'bg-aurea-navy/[0.03] font-semibold' : ''
                          }`}
                        >
                          {typeof valor === 'boolean' ? (
                            valor ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" aria-label="Incluido" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-3.5 h-3.5" aria-label="No incluido" />
                              </span>
                            )
                          ) : (
                            <span className="text-slate-800 font-medium">{valor}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
