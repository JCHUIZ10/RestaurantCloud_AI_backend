import React from 'react';
import { PlanComparativoDTO } from '@/types/propietarioCambiarPlan';
import { Check, X, Sparkles } from 'lucide-react';

interface MatrizComparativaPlanesProps {
  planes: PlanComparativoDTO[];
  planActualId: number;
}

interface ItemCaracteristica {
  nombre: string;
  descripcion: string;
  valores: Record<number, boolean | string>;
  destacado?: boolean;
}

interface CategoriaCaracteristica {
  categoria: string;
  items: ItemCaracteristica[];
}

export const MatrizComparativaPlanes: React.FC<MatrizComparativaPlanesProps> = ({
  planes,
  planActualId,
}) => {
  const caracteristicas: CategoriaCaracteristica[] = [
    {
      categoria: 'Capacidad Operativa y Dimensionamiento',
      items: [
        {
          nombre: 'Locales físicos permitidos',
          descripcion: 'Sedes o sucursales gastronómicas conectadas a la misma cuenta corporativa',
          valores: { 1: '1 Sede', 2: 'Hasta 3 Sedes', 3: 'Hasta 10 Sedes' },
        },
        {
          nombre: 'Pisos / Ambientes por local',
          descripcion: 'Pisos o zonas diferenciadas (Salón, Terraza, Planta Baja)',
          valores: { 1: '1 Piso', 2: 'Hasta 2 Pisos', 3: 'Hasta 5 Pisos' },
        },
        {
          nombre: 'Mesas por local',
          descripcion: 'Capacidad de mesas físicas simultáneas con carta digital y comandero',
          valores: { 1: 'Hasta 25 Mesas', 2: 'Hasta 30 Mesas', 3: 'Hasta 60 Mesas' },
        },
        {
          nombre: 'Colaboradores / Cuentas staff',
          descripcion: 'Cuentas para Mozos, Cocineros, Cajeros y Administradores de Sede',
          valores: { 1: 'Hasta 5 Cuentas', 2: 'Hasta 15 Cuentas', 3: 'Hasta 40 Cuentas' },
        },
      ],
    },
    {
      categoria: 'Experiencia de Servicio y Salón',
      items: [
        {
          nombre: 'Carta Digital y Menú QR por Mesa',
          descripcion: 'Acceso instantáneo para comensales sin necesidad de descargar app',
          valores: { 1: true, 2: true, 3: true },
        },
        {
          nombre: 'Comandero Digital para Mozos',
          descripcion: 'Toma rápida de pedidos desde tablets y smartphones Android/iOS',
          valores: { 1: true, 2: true, 3: true },
        },
        {
          nombre: 'Módulo de Reservas y Políticas',
          descripcion: 'Gestión de reservas de salón con límites por franja horaria y tolerancia',
          valores: { 1: false, 2: true, 3: true },
        },
        {
          nombre: 'Pantallas KDS de Cocina en Tiempo Real',
          descripcion: 'Despacho de comandas por tiempo transcurrido y división por partida',
          valores: { 1: '1 Pantalla', 2: 'Multiuso Salón/Bar', 3: 'Multi-centro Dedicado' },
        },
      ],
    },
    {
      categoria: 'Inteligencia Artificial y Analítica Gastronómica',
      items: [
        {
          nombre: 'Asistente IA de Salón',
          descripcion: 'Recomendaciones inteligentes de maridaje y venta sugerida para mozos',
          valores: { 1: false, 2: true, 3: true },
          destacado: true,
        },
        {
          nombre: 'Predicción de Demanda IA (Forecasting)',
          descripcion: 'Modelos predictivos diarios para cálculo de insumos y prevención de merma',
          valores: { 1: false, 2: false, 3: true },
          destacado: true,
        },
        {
          nombre: 'Reportes y Exportación Financiera',
          descripcion: 'Informes de ventas, costos, arqueos de caja y conciliación SUNAT',
          valores: { 1: 'Básico (CSV)', 2: 'Avanzado (PDF/Excel)', 3: 'Auditoría + BI Multi-sede' },
        },
        {
          nombre: 'Soporte Técnico y SLA',
          descripcion: 'Atención a incidencias y acompañamiento operativo',
          valores: { 1: 'Correo (48h)', 2: 'Chat Prioritario (24h)', 3: 'Dedicado 24/7 + SLA 99.9%' },
        },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-aurea-navy">
            Matriz Detallada de Comparación de Recursos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compara especificaciones técnicas y límites operativos para elegir la escala adecuada
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-600">
              <th className="py-3.5 px-4 sm:px-6 w-2/5">Característica / Dimensión</th>
              {planes.map((p) => {
                const esActual = p.id === planActualId;
                return (
                  <th
                    key={p.id}
                    className={`py-3.5 px-4 text-center w-1/5 ${
                      esActual ? 'bg-aurea-navy/5 text-aurea-navy font-extrabold' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold">{p.nombre}</span>
                      {esActual && (
                        <span className="mt-0.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-aurea-navy text-white">
                          Actual
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {caracteristicas.map((cat, idxCat) => (
              <React.Fragment key={idxCat}>
                <tr className="bg-slate-100/70">
                  <td
                    colSpan={4}
                    className="py-2 px-4 sm:px-6 font-bold uppercase tracking-wider text-[11px] text-aurea-navy"
                  >
                    {cat.categoria}
                  </td>
                </tr>

                {cat.items.map((item, idxItem) => (
                  <tr
                    key={idxItem}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        {item.destacado && (
                          <Sparkles className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                        )}
                        <span>{item.nombre}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.descripcion}
                      </div>
                    </td>

                    {[1, 2, 3].map((planId) => {
                      const val = (item.valores as any)[planId];
                      const esActual = planId === planActualId;

                      return (
                        <td
                          key={planId}
                          className={`py-3 px-4 text-center ${
                            esActual ? 'bg-aurea-navy/5 font-semibold text-slate-900' : ''
                          }`}
                        >
                          {typeof val === 'boolean' ? (
                            val ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-3.5 h-3.5" />
                              </div>
                            )
                          ) : (
                            <span className="font-medium text-slate-800">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
