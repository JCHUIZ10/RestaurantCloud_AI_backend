import React, { useState, useEffect, useCallback } from 'react';
import {
  ComprasHeader,
  ComprasKpis,
  ComprasToolbar,
  ComprasTable,
  ModalRegistrarCompra,
  ModalDetalleAuditoriaCompra,
  ModalAdvertenciaImpactoAnulacion,
  ModalReactivacionPlatos,
  OnboardingComprasVacio,
  CriterioBusquedaCompra,
} from '../components/compras';
import {
  FichaCompraResumenDTO,
  FichasCompraKPIsDTO,
  PlatoReactivableDTO,
} from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { CheckCircle2, X } from 'lucide-react';

const KPIS_INICIALES: FichasCompraKPIsDTO = {
  gasto_mes_total: 0,
  variacion_gasto_mes_pct: 0,
  total_compras_mes: 0,
  facturas_con_igv_monto: 0,
  creditos_pendientes_monto: 0,
};

export const AdminComprasPage: React.FC = () => {
  const [fichas, setFichas] = useState<FichaCompraResumenDTO[]>([]);
  const [kpis, setKpis] = useState<FichasCompraKPIsDTO>(KPIS_INICIALES);
  const [cargando, setCargando] = useState(true);

  // Filtros y paginación
  const [busqueda, setBusqueda] = useState('');
  const [criterioBusqueda, setCriterioBusqueda] = useState<CriterioBusquedaCompra>('TODOS');
  const [tipoComprobante, setTipoComprobante] = useState('TODOS');
  const [estado, setEstado] = useState('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const tamanoPagina = 10;

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [fichaDetalleId, setFichaDetalleId] = useState<string | null>(null);
  const [fichaParaAnular, setFichaParaAnular] = useState<FichaCompraResumenDTO | null>(null);
  const [platosReactivablesPendientes, setPlatosReactivablesPendientes] = useState<PlatoReactivableDTO[]>([]);

  // Alerta de éxito temporal
  const [alertaExito, setAlertaExito] = useState<string | null>(null);

  const mostrarExito = (mensaje: string) => {
    setAlertaExito(mensaje);
    setTimeout(() => {
      setAlertaExito(null);
    }, 4500);
  };

  const cargarFichas = useCallback(async () => {
    try {
      setCargando(true);
      const res = await adminService.getFichasCompra({
        busqueda,
        criterioBusqueda,
        tipoComprobante,
        estado,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        page: paginaActual,
        pageSize: tamanoPagina,
      });

      if (res.exito && res.datos) {
        setFichas(res.datos.fichas);
        setKpis(res.datos.kpis);
        setTotalRegistros(res.datos.paginacion.total);
        setTotalPaginas(res.datos.paginacion.total_paginas);
      }
    } finally {
      setCargando(false);
    }
  }, [busqueda, criterioBusqueda, tipoComprobante, estado, fechaDesde, fechaHasta, paginaActual, tamanoPagina]);

  useEffect(() => {
    cargarFichas();
  }, [cargarFichas]);

  const handleEjecutarBusqueda = (termino: string, criterio: CriterioBusquedaCompra) => {
    setBusqueda(termino);
    setCriterioBusqueda(criterio);
    setPaginaActual(1);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setCriterioBusqueda('TODOS');
    setTipoComprobante('TODOS');
    setEstado('TODOS');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  const handleCompraRegistrada = (
    ficha: FichaCompraResumenDTO,
    platosReactivables: PlatoReactivableDTO[]
  ) => {
    cargarFichas();
    mostrarExito(
      `Ficha #${ficha.numero_comprobante} registrada exitosamente. Se ingresaron los insumos al inventario y se liquidó contablemente.`
    );
    if (platosReactivables && platosReactivables.length > 0) {
      setPlatosReactivablesPendientes(platosReactivables);
    }
  };

  const handleAnulacionConfirmada = (fichaActualizada: FichaCompraResumenDTO) => {
    cargarFichas();
    mostrarExito(
      `Ficha #${fichaActualizada.numero_comprobante} anulada con éxito. Se dedujo el stock y se ajustaron los platos en carta.`
    );
  };

  const handlePlatosReactivados = (cantidad: number) => {
    mostrarExito(`Se reactivaron ${cantidad} plato(s) en la carta de salón exitosamente.`);
    setPlatosReactivablesPendientes([]);
  };

  const esFiltroActivo =
    busqueda.trim() !== '' ||
    criterioBusqueda !== 'TODOS' ||
    tipoComprobante !== 'TODOS' ||
    estado !== 'TODOS' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notificación de Éxito */}
      {alertaExito && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{alertaExito}</span>
          <button
            type="button"
            onClick={() => setAlertaExito(null)}
            className="text-emerald-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <ComprasHeader onNuevaCompra={() => setModalRegistroAbierto(true)} />

      {/* KPIs */}
      <ComprasKpis kpis={kpis} cargando={cargando} />

      {/* Toolbar de Filtros */}
      <ComprasToolbar
        busqueda={busqueda}
        criterioBusqueda={criterioBusqueda}
        onEjecutarBusqueda={handleEjecutarBusqueda}
        cargando={cargando}
        tipoComprobante={tipoComprobante}
        onTipoComprobanteChange={(val) => {
          setTipoComprobante(val);
          setPaginaActual(1);
        }}
        estado={estado}
        onEstadoChange={(val) => {
          setEstado(val);
          setPaginaActual(1);
        }}
        fechaDesde={fechaDesde}
        onFechaDesdeChange={(val) => {
          setFechaDesde(val);
          setPaginaActual(1);
        }}
        fechaHasta={fechaHasta}
        onFechaHastaChange={(val) => {
          setFechaHasta(val);
          setPaginaActual(1);
        }}
        onLimpiarFiltros={handleLimpiarFiltros}
      />

      {/* Tabla o Estado Vacío */}
      {!cargando && fichas.length === 0 ? (
        <OnboardingComprasVacio
          esFiltroSinResultados={esFiltroActivo}
          onLimpiarFiltros={handleLimpiarFiltros}
          onNuevaCompra={() => setModalRegistroAbierto(true)}
        />
      ) : (
        <ComprasTable
          fichas={fichas}
          cargando={cargando}
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          tamanoPagina={tamanoPagina}
          onCambiarPagina={(pag) => setPaginaActual(pag)}
          onVerDetalle={(id) => setFichaDetalleId(id)}
          onSolicitarAnulacion={(f) => setFichaParaAnular(f)}
        />
      )}

      {/* Modal Registrar Compra */}
      <ModalRegistrarCompra
        abierto={modalRegistroAbierto}
        onCerrar={() => setModalRegistroAbierto(false)}
        onCompraRegistrada={handleCompraRegistrada}
      />

      {/* Modal Detalle y Auditoría */}
      <ModalDetalleAuditoriaCompra
        fichaId={fichaDetalleId}
        abierto={fichaDetalleId !== null}
        onCerrar={() => setFichaDetalleId(null)}
      />

      {/* Modal Advertencia Impacto y Anulación */}
      <ModalAdvertenciaImpactoAnulacion
        ficha={fichaParaAnular}
        abierto={fichaParaAnular !== null}
        onCerrar={() => setFichaParaAnular(null)}
        onAnulacionConfirmada={handleAnulacionConfirmada}
      />

      {/* Modal Reactivación de Platos Repuestos */}
      <ModalReactivacionPlatos
        platos={platosReactivablesPendientes}
        abierto={platosReactivablesPendientes.length > 0}
        onCerrar={() => setPlatosReactivablesPendientes([])}
        onReactivados={handlePlatosReactivados}
      />

      
    </div>
  );
};

export default AdminComprasPage;
