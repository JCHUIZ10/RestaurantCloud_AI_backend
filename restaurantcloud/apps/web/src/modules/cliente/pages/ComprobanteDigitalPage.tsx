import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComprobantePorToken } from '../services/mockComprobanteService';
import { ComprobanteTicketMobile } from '../components/ComprobanteTicketMobile';
import { ComprobanteFacturaA4 } from '../components/ComprobanteFacturaA4';
import { ComprobanteSidebarDesktop } from '../components/ComprobanteSidebarDesktop';
import { ComprobanteAnuladoBanner } from '../components/ComprobanteAnuladoBanner';
import { ComprobanteZeroDeadEnd } from '../components/ComprobanteZeroDeadEnd';
import { DemoComprobantesWidget } from '../components/DemoComprobantesWidget';
import type { ComprobantePublicoDTO } from '@/types/comprobante';

export const ComprobanteDigitalPage: React.FC = () => {
  const { token, numero } = useParams<{ token?: string; numero?: string; slug?: string }>();
  const navigate = useNavigate();

  // El token puede provenir de /c/:token o /sede/:slug/comprobante/:numero (o null en /comprobante)
  const tokenParam = token || numero || null;

  const [comprobante, setComprobante] = useState<ComprobantePublicoDTO | null>(null);
  const [cargando, setCargando] = useState<boolean>(!!tokenParam);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [enlaceCopiado, setEnlaceCopiado] = useState<boolean>(false);

  // Consulta reactiva del comprobante únicamente si existe un token en la ruta
  useEffect(() => {
    let isMounted = true;

    if (!tokenParam) {
      setCargando(false);
      setComprobante(null);
      setErrorMensaje(null);
      return;
    }

    setCargando(true);
    setErrorMensaje(null);

    getComprobantePorToken(tokenParam)
      .then((res) => {
        if (!isMounted) return;
        if (res.exito && res.datos) {
          setComprobante(res.datos);
        } else {
          setComprobante(null);
          setErrorMensaje(
            res.errores?.[0]?.mensaje || 'No encontramos el comprobante solicitado.'
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setComprobante(null);
          setErrorMensaje('Ocurrió un error al cargar el comprobante electrónico.');
        }
      })
      .finally(() => {
        if (isMounted) setCargando(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tokenParam]);

  const handleCopiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href);
    setEnlaceCopiado(true);
    setTimeout(() => setEnlaceCopiado(false), 2500);
  };

  const handleSelectDemoToken = (nuevoToken: string) => {
    navigate(`/c/${nuevoToken}`);
  };

  // =========================================================================
  // ESTADO DE CARGA (SKELETON UX)
  // =========================================================================
  if (cargando) {
    return (
      <div className="w-full max-w-4xl mx-auto py-10 px-4 animate-pulse space-y-6">
        <div className="h-28 bg-white/70 rounded-3xl border border-aurea-copper/20" />
        <div className="h-64 bg-white/60 rounded-3xl" />
        <div className="h-32 bg-white/50 rounded-2xl" />
      </div>
    );
  }

  // =========================================================================
  // ESTADO: NO ENCONTRADO O RUTA /comprobante (VISTA 4: ZERO DEAD-ENDS)
  // =========================================================================
  if (!comprobante) {
    return (
      <div className="w-full py-10 px-4 sm:px-6 relative">
        <ComprobanteZeroDeadEnd
          onBuscarCodigo={(codigo) => navigate(`/c/${codigo}`)}
          mensajeError={errorMensaje}
          modoInicial={!tokenParam}
        />
        <DemoComprobantesWidget
          onSelectToken={handleSelectDemoToken}
          tokenActual={tokenParam || ''}
        />
      </div>
    );
  }

  // =========================================================================
  // VISTAS PRINCIPALES: DUALIDAD MOBILE (VISTA 1) Y DESKTOP (VISTA 2 Y 3)
  // =========================================================================
  return (
    <div className="w-full pb-16 relative">
      {/* Banner de Comprobante Anulado (Si corresponde) */}
      {comprobante.estado === 'anulado' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <ComprobanteAnuladoBanner
            notaCredito={comprobante.nota_credito}
            serieNumeroComprobante={comprobante.serie_numero}
          />
        </div>
      )}

      {/* DISPOSITIVOS MÓVILES (< 768px): VISTA 1 TICKET TÉRMICO DIGITAL */}
      <div className="block md:hidden px-4">
        <ComprobanteTicketMobile
          comprobante={comprobante}
          onCopiarEnlace={handleCopiarEnlace}
          enlaceCopiado={enlaceCopiado}
        />
      </div>

      {/* PANTALLAS DESKTOP Y TABLET (>= 768px): VISTA 2 HOJA TRIBUTARIA A4 + SIDEBAR */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Hoja Tributaria Formal A4 (8 columnas) */}
          <section className="lg:col-span-8">
            <ComprobanteFacturaA4 comprobante={comprobante} />
          </section>

          {/* Columna Derecha: Sidebar de Gestión y Descargas (4 columnas, sticky) */}
          <div className="lg:col-span-4">
            <ComprobanteSidebarDesktop
              comprobante={comprobante}
              onCopiarEnlace={handleCopiarEnlace}
              enlaceCopiado={enlaceCopiado}
            />
          </div>
        </div>
      </div>

      {/* Widget Flotante de Demostración para Alternar Comprobantes en 1 Clic */}
      <DemoComprobantesWidget
        onSelectToken={handleSelectDemoToken}
        tokenActual={tokenParam || ''}
      />
    </div>
  );
};
