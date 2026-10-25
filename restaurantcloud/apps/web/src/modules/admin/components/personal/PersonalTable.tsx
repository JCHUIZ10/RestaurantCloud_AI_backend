import React from 'react';
import { Edit2, KeyRound, UserX, UserCheck, MessageCircle, Banknote, Clock, Layers, Search, Mail } from 'lucide-react';
import { EmpleadoResumenDTO } from '@/types/admin';
import {
  EstadoBadge,
  EstadoVacio,
  IconButton,
  ListaResponsive,
  Paginacion,
  Skeleton,
  type ColumnaTabla,
} from '@/components/ui';
import { cn, generarEnlaceWhatsApp } from '@/shared/utils';
import { ROLES_PERSONAL, iniciales } from './rolesPersonal';

interface PersonalTableProps {
  empleados: EmpleadoResumenDTO[];
  cargando: boolean;
  onEditar: (emp: EmpleadoResumenDTO) => void;
  onResetPassword: (emp: EmpleadoResumenDTO) => void;
  onSolicitarDesactivar: (emp: EmpleadoResumenDTO) => void;
  onReactivar: (emp: EmpleadoResumenDTO) => void;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
  onPaginaChange: (pagina: number) => void;
  onLimiteChange: (limite: number) => void;
  /** Filtros que van dentro de la tarjeta */
  cabecera?: React.ReactNode;
}

const formatearUltimoAcceso = (fecha?: string | null) => {
  if (!fecha) return 'Nunca ingresó';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '-';
  if (d.toDateString() === new Date().toDateString()) {
    return `Hoy ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const TagRol: React.FC<{ emp: EmpleadoResumenDTO }> = ({ emp }) => {
  const r = ROLES_PERSONAL[emp.rol];
  if (!r) return null;
  const Icono = r.icono;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap', r.tag)}>
      <Icono className={cn('w-3.5 h-3.5', r.iconoColor)} aria-hidden="true" />
      {r.etiqueta}
    </span>
  );
};

const Colaborador: React.FC<{ emp: EmpleadoResumenDTO }> = ({ emp }) => (
  <div className="flex items-center gap-3 min-w-0">
    <span
      className={cn(
        'w-10 h-10 rounded-full ring-1 flex items-center justify-center text-sm font-bold shrink-0',
        ROLES_PERSONAL[emp.rol]?.avatar ?? 'bg-aurea-champagne/40 text-aurea-navy ring-aurea-copper/30'
      )}
      aria-hidden="true"
    >
      {iniciales(emp.nombre)}
    </span>
    <div className="min-w-0">
      <p className="font-semibold text-aurea-navy truncate">{emp.nombre}</p>
      <p className="flex items-center gap-1 text-xs text-aurea-navy/60 truncate">
        <Mail className="w-3 h-3 text-aurea-copper shrink-0" aria-hidden="true" />
        <span className="truncate">{emp.correo}</span>
      </p>
    </div>
  </div>
);

const Contacto: React.FC<{ emp: EmpleadoResumenDTO }> = ({ emp }) => {
  if (!emp.telefono) return <span className="text-xs text-aurea-navy/40">Sin celular</span>;
  const wsp = generarEnlaceWhatsApp(emp.telefono, `Hola ${emp.nombre}, te escribimos desde la administración del local.`);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {wsp && (
        <a
          href={wsp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Escribir por WhatsApp a ${emp.nombre}`}
          className="min-h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-estado-ok-50 hover:bg-estado-ok-100 text-estado-ok-700 border border-estado-ok-200 text-xs font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          WhatsApp
        </a>
      )}
      <span className="text-xs font-mono text-aurea-navy/70">{emp.telefono}</span>
    </div>
  );
};

/** Lo que tiene en curso ahora mismo: mesas atendidas o caja abierta. */
const EnCurso: React.FC<{ emp: EmpleadoResumenDTO }> = ({ emp }) => {
  const mesas = emp.mesas_activas_count || 0;
  if (!mesas && !emp.tiene_caja_abierta) return <span className="text-xs text-aurea-navy/40">Nada en curso</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {mesas > 0 && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium bg-blue-50 text-blue-800 border-blue-200 whitespace-nowrap">
          <Layers className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          {mesas} {mesas === 1 ? 'mesa' : 'mesas'}
        </span>
      )}
      {emp.tiene_caja_abierta && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium bg-emerald-50 text-emerald-800 border-emerald-200 whitespace-nowrap">
          <Banknote className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          Caja abierta
        </span>
      )}
    </div>
  );
};

const UltimoAcceso: React.FC<{ emp: EmpleadoResumenDTO }> = ({ emp }) => (
  <span className="inline-flex items-center gap-1 text-xs text-aurea-navy/70 whitespace-nowrap">
    <Clock className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
    {formatearUltimoAcceso(emp.ultimo_login)}
  </span>
);

const Estado: React.FC<{ emp: EmpleadoResumenDTO }> = ({ emp }) =>
  emp.estado === 'activo' ? <EstadoBadge tono="ok">Activo</EstadoBadge> : <EstadoBadge tono="neutro">Inactivo</EstadoBadge>;

export const PersonalTable: React.FC<PersonalTableProps> = ({
  empleados,
  cargando,
  onEditar,
  onResetPassword,
  onSolicitarDesactivar,
  onReactivar,
  paginaActual,
  totalPaginas,
  totalRegistros,
  limite,
  onPaginaChange,
  onLimiteChange,
  cabecera,
}) => {
  const acciones = (emp: EmpleadoResumenDTO, tamano: 'sm' | 'md') => (
    <div className="flex items-center justify-end gap-1">
      <IconButton size={tamano} icono={Edit2} etiqueta={`Editar a ${emp.nombre}`} onClick={() => onEditar(emp)} />
      <IconButton size={tamano} icono={KeyRound} etiqueta={`Nueva contraseña para ${emp.nombre}`} onClick={() => onResetPassword(emp)} />
      {emp.estado === 'activo' ? (
        <IconButton size={tamano} variant="danger" icono={UserX} etiqueta={`Desactivar a ${emp.nombre}`} onClick={() => onSolicitarDesactivar(emp)} />
      ) : (
        <IconButton size={tamano} icono={UserCheck} etiqueta={`Reactivar a ${emp.nombre}`} onClick={() => onReactivar(emp)} />
      )}
    </div>
  );

  const columnas: ColumnaTabla<EmpleadoResumenDTO>[] = [
    { id: 'colaborador', cabecera: 'Colaborador', celda: (e) => <Colaborador emp={e} /> },
    { id: 'rol', cabecera: 'Rol', celda: (e) => <TagRol emp={e} /> },
    { id: 'contacto', cabecera: 'Contacto', celda: (e) => <Contacto emp={e} /> },
    { id: 'curso', cabecera: 'En curso', celda: (e) => <EnCurso emp={e} /> },
    { id: 'acceso', cabecera: 'Último ingreso', celda: (e) => <UltimoAcceso emp={e} /> },
    { id: 'estado', cabecera: 'Estado', alinear: 'centro', celda: (e) => <Estado emp={e} /> },
    { id: 'acciones', cabecera: <span className="sr-only">Acciones</span>, alinear: 'derecha', celda: (e) => acciones(e, 'sm') },
  ];

  const tarjeta = (emp: EmpleadoResumenDTO) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Colaborador emp={emp} />
        <Estado emp={emp} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TagRol emp={emp} />
        <EnCurso emp={emp} />
      </div>
      <Contacto emp={emp} />
      <div className="flex items-center justify-between gap-3">
        <UltimoAcceso emp={emp} />
        {acciones(emp, 'md')}
      </div>
    </div>
  );

  const vacio = cargando ? (
    <div className="p-4 space-y-3" aria-busy="true" aria-label="Cargando personal">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  ) : empleados.length === 0 ? (
    <EstadoVacio icono={Search} titulo="Nadie coincide con estos filtros" descripcion="Prueba con otro rol, estado o nombre." />
  ) : undefined;

  return (
    <ListaResponsive
      etiqueta="Personal"
      filas={empleados}
      columnas={columnas}
      claveFila={(e) => e.id}
      claseFila={(e) => (e.estado === 'inactivo' ? 'bg-aurea-ivory/70 [&_td]:opacity-70' : undefined)}
      cabecera={cabecera}
      tarjeta={tarjeta}
      vacio={vacio}
      pie={
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          limite={limite}
          onCambiarPagina={onPaginaChange}
          onCambiarLimite={onLimiteChange}
          unidad="colaboradores"
          opcionesLimite={[10, 20, 50]}
        />
      }
    />
  );
};
