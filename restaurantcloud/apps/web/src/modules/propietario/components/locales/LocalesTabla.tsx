import React from 'react';
import { LocalItemDTO } from '@/types/propietarioLocales';
import { Button } from '@/components/ui/Button';
import {
  ExternalLink,
  MapPin,
  Phone,
  Layers,
  UtensilsCrossed,
  ArrowRight,
  Shield,
  User,
  AlertTriangle,
  QrCode,
  Edit,
  Power,
  PowerOff,
} from 'lucide-react';

interface LocalesTablaProps {
  locales: LocalItemDTO[];
  onAccederSede: (local: LocalItemDTO) => void;
  onEditar: (local: LocalItemDTO) => void;
  onDesactivar: (local: LocalItemDTO) => void;
  onReactivar: (local: LocalItemDTO) => void;
}

export const LocalesTabla: React.FC<LocalesTablaProps> = ({
  locales,
  onAccederSede,
  onEditar,
  onDesactivar,
  onReactivar,
}) => {
  const getGiroLabel = (giro: string) => {
    switch (giro) {
      case 'polleria':
        return '🍗 Pollería & Brasas';
      case 'cevicheria':
        return '🐟 Cevichería & Mariscos';
      case 'chifa':
        return '🥢 Chifa & Comida China';
      default:
        return '⚪ Carta en Blanco';
    }
  };

  return (
    <div className="space-y-4">
      {/* Vista Desktop (>= 1024px): Tabla Rica */}
      <div className="hidden lg:block bg-white rounded-3xl border-2 border-aurea-copper/25 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-aurea-ivory/60 border-b border-aurea-copper/20 text-[11px] font-mono uppercase tracking-wider text-aurea-navy/70">
                <th className="py-4 px-6 font-bold">Local / Sede</th>
                <th className="py-4 px-5 font-bold">Estado & Giro</th>
                <th className="py-4 px-6 font-bold">Administración / Asignación</th>
                <th className="py-4 px-5 font-bold">Capacidad</th>
                <th className="py-4 px-6 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurea-copper/15 text-xs font-sans text-aurea-navy">
              {locales.map((local) => {
                const activo = local.estado === 'activo';

                return (
                  <tr
                    key={local.id}
                    className={`transition-colors hover:bg-aurea-ivory/40 ${
                      !activo ? 'bg-slate-50/70 opacity-75' : ''
                    }`}
                  >
                    {/* 1. Local / Sede */}
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-bold text-aurea-navy">
                          {local.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-aurea-navy/70 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                        <span>
                          {local.direccion}, {local.distrito}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-aurea-navy/60 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                        <span>{local.telefono}</span>
                      </div>
                      {/* Enlace público a carta digital */}
                      <div className="pt-1">
                        <a
                          href={local.url_carta_digital}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-aurea-copper hover:text-aurea-navy underline transition-colors"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>app.restaurantcloud.pe{local.url_carta_digital}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </td>

                    {/* 2. Estado & Giro */}
                    <td className="py-4 px-5 space-y-2">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            activo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activo ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-aurea-navy/80 block">
                        {getGiroLabel(local.giro_negocio)}
                      </span>
                    </td>

                    {/* 3. Columna Clave: Administración / Asignación */}
                    <td className="py-4 px-6 space-y-2">
                      {local.es_autogestionado ? (
                        <div className="space-y-1.5">
                          {/* Badge Autogestionado */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-aurea-champagne/40 border border-aurea-copper/60 text-aurea-navy font-bold text-xs shadow-xs">
                            <Shield className="w-3.5 h-3.5 text-aurea-copper fill-aurea-copper/20" />
                            <span>Autogestionado</span>
                          </div>

                          {/* Botón de Acceso Directo a la Sede */}
                          <div>
                            <button
                              type="button"
                              onClick={() => onAccederSede(local)}
                              disabled={!activo}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                                activo
                                  ? 'bg-aurea-navy hover:bg-aurea-copper hover:text-aurea-navy text-white hover:shadow-md cursor-pointer group'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <span>Acceder a Sede</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      ) : local.administrador ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                            <span className="font-bold text-aurea-navy">
                              {local.administrador.nombre}
                            </span>
                          </div>
                          <span className="text-[11px] text-aurea-navy/60 block">
                            {local.administrador.correo}
                          </span>
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => onEditar(local)}
                              className="text-[11px] text-aurea-copper hover:text-aurea-navy underline font-medium"
                            >
                              Reasignar
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => onAccederSede(local)}
                              disabled={!activo}
                              className="text-[11px] text-aurea-navy hover:text-aurea-copper font-bold underline flex items-center gap-0.5"
                            >
                              <span>Supervisar</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            Sin administrador
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => onEditar(local)}
                              className="text-xs text-aurea-copper hover:text-aurea-navy font-bold underline"
                            >
                              + Asignar / Autogestionar
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 4. Capacidad */}
                    <td className="py-4 px-5 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-aurea-copper" />
                        <span>{local.metricas.total_pisos} Piso(s)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
                        <span>{local.metricas.total_mesas} Mesas</span>
                      </div>
                    </td>

                    {/* 5. Acciones */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEditar(local)}
                          className="border-aurea-navy/20 text-aurea-navy hover:bg-aurea-ivory text-xs px-2.5"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>

                        {activo ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onDesactivar(local)}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs px-2.5"
                          >
                            <PowerOff className="w-3.5 h-3.5 mr-1" />
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onReactivar(local)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-2.5"
                          >
                            <Power className="w-3.5 h-3.5 mr-1" />
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Mobile (< 1024px): Tarjetas Apiladas Fluidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {locales.map((local) => {
          const activo = local.estado === 'activo';

          return (
            <div
              key={local.id}
              className={`bg-white rounded-3xl p-5 border-2 border-aurea-copper/25 shadow-sm space-y-4 ${
                !activo ? 'bg-slate-50 opacity-80' : ''
              }`}
            >
              {/* Cabecera de tarjeta */}
              <div className="flex items-start justify-between gap-2 border-b border-aurea-copper/15 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-aurea-navy">
                    {local.nombre}
                  </h3>
                  <span className="text-xs text-aurea-navy/70 block mt-0.5">
                    {getGiroLabel(local.giro_negocio)}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activo
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activo ? 'bg-emerald-600' : 'bg-slate-500'
                    }`}
                  />
                  {activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Datos de contacto y carta */}
              <div className="space-y-1.5 text-xs text-aurea-navy/80">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                  <span>
                    {local.direccion}, {local.distrito}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                  <span>{local.telefono}</span>
                </div>
                <div>
                  <a
                    href={local.url_carta_digital}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-aurea-copper underline"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver Carta Digital QR →</span>
                  </a>
                </div>
              </div>

              {/* Sección Autogestión / Administración en Mobile */}
              <div className="p-3.5 rounded-2xl bg-aurea-ivory border border-aurea-copper/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-aurea-copper tracking-wider block">
                  Administración de la Sede:
                </span>

                {local.es_autogestionado ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-aurea-champagne/60 text-aurea-navy font-bold text-xs w-fit">
                      <Shield className="w-3 h-3 text-aurea-copper fill-aurea-copper/20" />
                      <span>Autogestionado</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAccederSede(local)}
                      disabled={!activo}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
                        activo
                          ? 'bg-aurea-navy text-white hover:bg-aurea-copper hover:text-aurea-navy'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Acceder a Sede</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : local.administrador ? (
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-aurea-navy block">
                        {local.administrador.nombre}
                      </span>
                      <span className="text-[11px] text-aurea-navy/60">
                        {local.administrador.correo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAccederSede(local)}
                      className="text-xs font-bold text-aurea-navy hover:text-aurea-copper underline"
                    >
                      Supervisar →
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-800 text-[11px]">
                      ⚠️ Sin administrador
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditar(local)}
                      className="text-xs text-aurea-copper font-bold underline"
                    >
                      + Asignar
                    </button>
                  </div>
                )}
              </div>

              {/* Botones de acción inferiores */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-aurea-copper/15">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditar(local)}
                  className="flex-1 text-xs border-aurea-navy/20"
                >
                  Editar
                </Button>

                {activo ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDesactivar(local)}
                    className="flex-1 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Desactivar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onReactivar(local)}
                    className="flex-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Reactivar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
