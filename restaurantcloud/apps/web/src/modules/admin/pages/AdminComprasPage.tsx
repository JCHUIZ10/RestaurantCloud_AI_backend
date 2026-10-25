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
import { useToast } from '@/components/ui';

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
  // Solo la primera carga muestra esqueletos en los indicadores; los filtros no los hacen parpadear
  const [primeraCarga, setPrimeraCarga] = useState(true);

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
  const [tamanoPagina, setTamanoPagina] = useState(10);

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [fichaDetalleId, setFichaDetalleId] = useState<string | null>(null);
  const [fichaParaAnular, setFichaParaAnular] = useState<FichaCompraResumenDTO | null>(null);
  const [platosReactivablesPendientes, setPlatosReactivablesPendientes] = useState<PlatoReactivableDTO[]>([]);

  const { mostrar } = useToast();
  const mostrarExito = useCallback((mensaje: string) => mostrar(mensaje, 'ok'), [mostrar]);

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
      setPrimeraCarga(false);
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

  // Todo cambio de filtro vuelve a la primera página
  const conPaginaInicial = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setPaginaActual(1);
  };

  const handleCompraRegistrada = (
    ficha: FichaCompraResumenDTO,
    platosReactivables: PlatoReactivableDTO[]
  ) => {
    cargarFichas();
    mostrarExito(`Compra ${ficha.numero_comprobante} registrada. Los insumos ya están en el inventario.`);
    if (platosReactivables && platosReactivables.length > 0) {
      setPlatosReactivablesPendientes(platosReactivables);
    }
  };

  const handleAnulacionConfirmada = (fichaActualizada: FichaCompraResumenDTO) => {
    cargarFichas();
    mostrarExito(`Compra ${fichaActualizada.numero_comprobante} anulada. Se descontó el stock ingresado.`);
  };

  const handlePlatosReactivados = (cantidad: number) => {
    mostrarExito(`${cantidad === 1 ? 'Se reactivó 1 plato' : `Se reactivaron ${cantidad} platos`} en la carta.`);
    setPlatosReactivablesPendientes([]);
  };

  const esFiltroActivo =
    busqueda.trim() !== '' ||
    criterioBusqueda !== 'TODOS' ||
    tipoComprobante !== 'TODOS' ||
    estado !== 'TODOS' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  const sinComprasRegistradas = !primeraCarga && !cargando && fichas.length === 0 && !esFiltroActivo;

  return (
    <div className="space-y-6">
      <ComprasHeader onNuevaCompra={() => setModalRegistroAbierto(true)} />

      {sinComprasRegistradas ? (
        <OnboardingComprasVacio onNuevaCompra={() => setModalRegistroAbierto(true)} />
      ) : (
        <>
          <ComprasKpis kpis={kpis} cargando={primeraCarga} />

          <ComprasTable
            fichas={fichas}
            cargando={cargando}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            tamanoPagina={tamanoPagina}
            onCambiarPagina={(pag) => setPaginaActual(pag)}
            onCambiarTamanoPagina={(tam) => {
              setTamanoPagina(tam);
              setPaginaActual(1);
            }}
            onVerDetalle={(id) => setFichaDetalleId(id)}
            onSolicitarAnulacion={(f) => setFichaParaAnular(f)}
            onLimpiarFiltros={esFiltroActivo ? handleLimpiarFiltros : undefined}
            cabecera={
              <ComprasToolbar
                busqueda={busqueda}
                criterioBusqueda={criterioBusqueda}
                onEjecutarBusqueda={handleEjecutarBusqueda}
                cargando={cargando}
                tipoComprobante={tipoComprobante}
                onTipoComprobanteChange={conPaginaInicial(setTipoComprobante)}
                estado={estado}
                onEstadoChange={conPaginaInicial(setEstado)}
                fechaDesde={fechaDesde}
                onFechaDesdeChange={conPaginaInicial(setFechaDesde)}
                fechaHasta={fechaHasta}
                onFechaHastaChange={conPaginaInicial(setFechaHasta)}
                onLimpiarFiltros={handleLimpiarFiltros}
              />
            }
          />
        </>
      )}

      <ModalRegistrarCompra
        abierto={modalRegistroAbierto}
        onCerrar={() => setModalRegistroAbierto(false)}
        onCompraRegistrada={handleCompraRegistrada}
      />

      <ModalDetalleAuditoriaCompra
        fichaId={fichaDetalleId}
        abierto={fichaDetalleId !== null}
        onCerrar={() => setFichaDetalleId(null)}
      />

      <ModalAdvertenciaImpactoAnulacion
        ficha={fichaParaAnular}
        abierto={fichaParaAnular !== null}
        onCerrar={() => setFichaParaAnular(null)}
        onAnulacionConfirmada={handleAnulacionConfirmada}
      />

      <ModalReactivacionPlatos
        key={platosReactivablesPendientes.map((p) => p.id).join('|')}
        platos={platosReactivablesPendientes}
        abierto={platosReactivablesPendientes.length > 0}
        onCerrar={() => setPlatosReactivablesPendientes([])}
        onReactivados={handlePlatosReactivados}
      />
    </div>
  );
};

export default AdminComprasPage;
