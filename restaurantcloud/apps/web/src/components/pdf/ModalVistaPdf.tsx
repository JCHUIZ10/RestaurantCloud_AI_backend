import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { guardarBlobComoArchivo } from '@/services/api/client';
import { VisorPdf } from './VisorPdf';

interface ModalVistaPdfProps {
  abierto: boolean;
  titulo: string;
  nombreArchivo: string;
  /** Obtiene el PDF; se ejecuta cada vez que el modal se abre */
  cargarPdf: () => Promise<Blob>;
  onCerrar: () => void;
}

/** Vista previa de un PDF con pantalla de carga; Descargar reutiliza el mismo archivo ya recibido. */
export const ModalVistaPdf: React.FC<ModalVistaPdfProps> = ({
  abierto,
  titulo,
  nombreArchivo,
  cargarPdf,
  onCerrar,
}) => {
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!abierto) return;

    let descartado = false;
    setPdf(null);
    setError(false);

    cargarPdf()
      .then((blob) => {
        if (!descartado) setPdf(blob);
      })
      .catch(() => {
        if (!descartado) setError(true);
      });

    return () => {
      descartado = true;
    };
    // cargarPdf cambia de identidad en cada render del padre; solo importa abrir o reintentar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, intento]);

  const abrirEnPestana = useCallback(() => {
    if (!pdf) return;
    const url = URL.createObjectURL(pdf);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [pdf]);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      icono={FileText}
      etiqueta="Vista previa"
      titulo={titulo}
      tamano="xl"
      pie={
        <>
          <Button variant="ghost" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button variant="outline" leftIcon={<ExternalLink className="w-4 h-4" />} disabled={!pdf} onClick={abrirEnPestana}>
            Abrir en pestaña nueva
          </Button>
          <Button
            leftIcon={<Download className="w-4 h-4" />}
            disabled={!pdf}
            onClick={() => pdf && guardarBlobComoArchivo(pdf, nombreArchivo)}
          >
            Descargar
          </Button>
        </>
      }
    >
      <div className="min-h-[50dvh] bg-slate-100 rounded-xl p-3">
        {!pdf && !error && (
          <div className="py-24 flex flex-col items-center gap-3 text-sm text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin text-aurea-navy" />
            Preparando constancia...
          </div>
        )}

        {error && (
          <div role="alert" className="py-20 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-slate-700">No pudimos cargar la constancia. Intenta nuevamente.</p>
            <Button variant="outline" onClick={() => setIntento((n) => n + 1)}>
              Reintentar
            </Button>
          </div>
        )}

        {pdf && <VisorPdf pdf={pdf} />}
      </div>
    </Modal>
  );
};
