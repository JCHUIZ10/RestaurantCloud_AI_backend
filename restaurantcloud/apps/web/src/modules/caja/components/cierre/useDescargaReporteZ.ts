import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/services/api/client';
import type { ReporteZDTO } from '@/types/caja';

interface DescargaReporteZ {
  descargando: boolean;
  /** Solo es true cuando el PDF realmente se descargó; se apaga solo a los 3 segundos. */
  descargadoExito: boolean;
  errorDescarga: boolean;
  descargar: () => Promise<void>;
}

/**
 * Descarga el PDF oficial del Reporte Z. Lo usan el cajero y la administración con el mismo
 * comportamiento: el aviso de éxito aparece únicamente si el archivo se bajó de verdad.
 */
export const useDescargaReporteZ = (reporte: ReporteZDTO | null, rutaPdf?: string): DescargaReporteZ => {
  const [descargando, setDescargando] = useState<boolean>(false);
  const [descargadoExito, setDescargadoExito] = useState<boolean>(false);
  const [errorDescarga, setErrorDescarga] = useState<boolean>(false);
  const avisoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (avisoTimerRef.current) clearTimeout(avisoTimerRef.current);
    };
  }, []);

  const descargar = useCallback(async () => {
    if (!reporte) return;
    setDescargando(true);
    setErrorDescarga(false);
    setDescargadoExito(false);
    if (avisoTimerRef.current) clearTimeout(avisoTimerRef.current);
    try {
      // `rutaPdf` permite a otro rol usar su propia ruta (la administración descarga por /admin/finanzas)
      const endpoint =
        rutaPdf ||
        reporte.url_descarga_pdf ||
        (reporte.caja_id ? `/caja/turnos/${reporte.caja_id}/reporte-z/pdf` : null);

      if (!endpoint) {
        // Sin enlace de descarga no hay archivo que confirmar: se ofrece la impresión del navegador
        setErrorDescarga(true);
        return;
      }

      const response = await apiClient.get(endpoint, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `reporte-z-turno-${String(reporte.turno_correlativo).padStart(3, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDescargadoExito(true);
      avisoTimerRef.current = setTimeout(() => setDescargadoExito(false), 3000);
    } catch (err) {
      console.warn('Fallo al descargar el PDF del Reporte Z:', err);
      setErrorDescarga(true);
    } finally {
      setDescargando(false);
    }
  }, [reporte, rutaPdf]);

  return { descargando, descargadoExito, errorDescarga, descargar };
};
