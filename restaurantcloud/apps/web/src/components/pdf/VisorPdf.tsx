import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VisorPdfProps {
  pdf: Blob;
}

/**
 * Visor de PDF con pdf.js: dibuja cada página en un canvas, igual en escritorio y móvil.
 * La librería se importa bajo demanda para no pesar en el resto de la app.
 */
export const VisorPdf: React.FC<VisorPdfProps> = ({ pdf }) => {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [leyendo, setLeyendo] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let tarea: { destroy: () => unknown } | null = null;
    const contenedor = contenedorRef.current;

    (async () => {
      try {
        const [pdfjs, worker] = await Promise.all([
          import('pdfjs-dist'),
          import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        const carga = pdfjs.getDocument({ data: await pdf.arrayBuffer() });
        tarea = carga;
        const doc = await carga.promise;
        if (cancelado || !contenedor) return;

        const ancho = contenedor.clientWidth;
        const densidad = window.devicePixelRatio || 1;

        for (let n = 1; n <= doc.numPages; n++) {
          const pagina = await doc.getPage(n);
          if (cancelado) return;

          const base = pagina.getViewport({ scale: 1 });
          const escala = ancho / base.width;
          const viewport = pagina.getViewport({ scale: escala * densidad });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${ancho}px`;
          canvas.className = 'mx-auto mb-3 bg-white shadow-md';
          contenedor.appendChild(canvas);

          await pagina.render({ canvas, viewport }).promise;
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setLeyendo(false);
      }
    })();

    return () => {
      cancelado = true;
      contenedor?.replaceChildren();
      void tarea?.destroy();
    };
  }, [pdf]);

  return (
    <div className="relative">
      {leyendo && (
        <div className="py-16 flex justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      {error && (
        <p role="alert" className="py-10 text-center text-sm text-red-700">
          No se pudo mostrar el documento. Puedes descargarlo con el botón inferior.
        </p>
      )}
      <div ref={contenedorRef} />
    </div>
  );
};
