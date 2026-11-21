<?php

namespace App\Domains\Pronostico\Services;

use App\Support\Identificador;
use Dompdf\Dompdf;
use Dompdf\Options as OpcionesPdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Cell\NumericCell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;
use Throwable;

/**
 * Lista de compra sugerida para llevar al proveedor: lo que el administrador no descartó, agrupado por
 * proveedor. Usa la cantidad que decidió (`cantidad_final`) o, si aún no decide, la sugerida.
 */
class ReposicionExportacionService
{
    private const COLOR_NAVY = '0B2340';

    private const COLOR_CHAMPAGNE = 'F4D7B0';

    private const COLOR_IVORY = 'FFF9F0';

    private const SIN_PROVEEDOR = 'Sin proveedor registrado';

    private const FORMATO_MONEDA = '"S/" #,##0.00';

    /**
     * Líneas a comprar, agrupadas por proveedor y ordenadas por nombre de proveedor.
     *
     * @param  list<array<string, mixed>>  $reposicion
     * @return array<string, list<array<string, mixed>>>
     */
    public function agrupar(array $reposicion): array
    {
        $grupos = [];
        foreach ($reposicion as $linea) {
            $cantidad = $linea['cantidad_final'] ?? $linea['cantidad_sugerida'];
            if ($linea['estado'] === 'descartada' || $cantidad <= 0) {
                continue;
            }
            $grupos[$linea['proveedor']['nombre'] ?? self::SIN_PROVEEDOR][] = [...$linea, 'cantidad_a_comprar' => $cantidad];
        }
        uksort($grupos, fn (string $a, string $b): int => ($a === self::SIN_PROVEEDOR) <=> ($b === self::SIN_PROVEEDOR) ?: strcmp($a, $b));

        return $grupos;
    }

    public function hayQueComprar(array $reposicion): bool
    {
        return $this->agrupar($reposicion) !== [];
    }

    /**
     * @param  list<array<string, mixed>>  $reposicion
     * @return array{ruta: string, nombre: string}
     */
    public function xlsx(array $reposicion, string $localNombre, int $cobertura, string $generadoPor): array
    {
        $directorio = storage_path('app/tmp/exportaciones');
        File::ensureDirectoryExists($directorio);
        $ruta = $directorio.'/'.Identificador::aleatorio().'.xlsx';

        try {
            $this->escribirLibro($ruta, $this->agrupar($reposicion), $localNombre, $cobertura, $generadoPor);
        } catch (Throwable $e) {
            File::delete($ruta);
            throw $e;
        }

        return ['ruta' => $ruta, 'nombre' => $this->nombreArchivo($localNombre, 'xlsx')];
    }

    /**
     * @param  list<array<string, mixed>>  $reposicion
     * @return array{contenido: string, nombre: string}
     */
    public function pdf(array $reposicion, string $localNombre, int $cobertura, string $generadoPor): array
    {
        $opciones = new OpcionesPdf;
        $opciones->set('isRemoteEnabled', false);
        $opciones->set('defaultFont', 'DejaVu Sans');

        $pdf = new Dompdf($opciones);
        $pdf->loadHtml($this->html($this->agrupar($reposicion), $localNombre, $cobertura, $generadoPor), 'UTF-8');
        $pdf->setPaper('A4');
        $pdf->render();

        return ['contenido' => $pdf->output(), 'nombre' => $this->nombreArchivo($localNombre, 'pdf')];
    }

    public function nombreArchivo(string $localNombre, string $extension): string
    {
        $local = trim((string) preg_replace('/[^A-Za-z0-9]+/', '_', Str::ascii($localNombre)), '_');

        return 'compra_sugerida_'.($local !== '' ? $local : 'Local').'_'.now()->format('Y-m-d').'.'.$extension;
    }

    /**
     * @param  array<string, list<array<string, mixed>>>  $grupos
     */
    private function escribirLibro(string $ruta, array $grupos, string $localNombre, int $cobertura, string $generadoPor): void
    {
        $writer = new Writer(new Options);
        $writer->openToFile($ruta);
        $writer->setCreator('RestaurantCloud');

        $hoja = $writer->getCurrentSheet();
        $hoja->setName('Compra sugerida');
        foreach ([34, 12, 14, 16, 14, 16] as $i => $ancho) {
            $hoja->setColumnWidth($ancho, $i + 1);
        }
        $hoja->setSheetView((new SheetView)->setShowGridLines(false));

        $titulo = (new Style)->setFontBold()->setFontSize(16)->setFontColor(self::COLOR_NAVY);
        $etiqueta = (new Style)->setFontBold()->setFontColor(self::COLOR_NAVY);
        $proveedor = (new Style)->setFontBold()->setFontColor(self::COLOR_NAVY)->setBackgroundColor(self::COLOR_CHAMPAGNE);
        $encabezado = (new Style)->setFontBold()->setFontColor(Color::WHITE)->setBackgroundColor(self::COLOR_NAVY);
        $encabezadoNumero = (clone $encabezado)->setCellAlignment(CellAlignment::RIGHT);
        $moneda = (new Style)->setFormat(self::FORMATO_MONEDA);
        $cantidad = (new Style)->setFormat('#,##0.0');
        $zebra = (new Style)->setBackgroundColor(self::COLOR_IVORY);
        $total = (new Style)->setFontBold()->setFontColor(self::COLOR_NAVY)->setFormat(self::FORMATO_MONEDA);

        $writer->addRow(new Row([new StringCell('Compra sugerida', $titulo)]));
        $writer->addRow(new Row([new StringCell('Local', $etiqueta), new StringCell($localNombre, null)]));
        $writer->addRow(new Row([new StringCell('Cubre', $etiqueta), new StringCell("{$cobertura} días", null)]));
        $writer->addRow(new Row([new StringCell('Generado por', $etiqueta), new StringCell($generadoPor, null)]));
        $writer->addRow(new Row([new StringCell('Generado el', $etiqueta), new StringCell(now()->format('d/m/Y H:i'), null)]));
        $writer->addRow(new Row([]));

        $totalGeneral = 0.0;
        foreach ($grupos as $nombre => $lineas) {
            $writer->addRow(new Row([new StringCell($nombre, $proveedor), ...array_fill(0, 5, new StringCell('', $proveedor))]));
            $writer->addRow(new Row([
                new StringCell('Insumo', $encabezado),
                new StringCell('Unidad', $encabezado),
                new StringCell('Tienes', $encabezadoNumero),
                new StringCell('Comprar', $encabezadoNumero),
                new StringCell('Precio', $encabezadoNumero),
                new StringCell('Subtotal', $encabezadoNumero),
            ]));

            $subtotal = 0.0;
            foreach ($lineas as $i => $linea) {
                $estilo = $i % 2 === 1 ? $zebra : null;
                $importe = (float) $linea['costo_estimado'];
                $subtotal += $importe;
                $writer->addRow(new Row([
                    new StringCell($linea['insumo'], $estilo),
                    new StringCell($linea['unidad_medida'], $estilo),
                    new NumericCell($linea['stock_al_calcular'], $this->conFondo($cantidad, $estilo)),
                    new NumericCell($linea['cantidad_a_comprar'], $this->conFondo($cantidad, $estilo)),
                    new NumericCell((float) ($linea['proveedor']['precio'] ?? 0), $this->conFondo($moneda, $estilo)),
                    new NumericCell($importe, $this->conFondo($moneda, $estilo)),
                ]));
            }
            $totalGeneral += $subtotal;
            $writer->addRow(new Row([new StringCell('Subtotal '.$nombre, $etiqueta), ...array_fill(0, 4, new StringCell('', null)), new NumericCell($subtotal, $total)]));
            $writer->addRow(new Row([]));
        }

        $writer->addRow(new Row([new StringCell('Total estimado', $etiqueta), ...array_fill(0, 4, new StringCell('', null)), new NumericCell($totalGeneral, $total)]));
        $writer->close();
    }

    private function conFondo(Style $base, ?Style $fondo): Style
    {
        return $fondo === null ? $base : (clone $base)->setBackgroundColor(self::COLOR_IVORY);
    }

    /**
     * @param  array<string, list<array<string, mixed>>>  $grupos
     */
    private function html(array $grupos, string $localNombre, int $cobertura, string $generadoPor): string
    {
        $e = fn (mixed $v): string => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $n = fn (float $v): string => number_format($v, 1, '.', ',');
        $s = fn (float $v): string => 'S/ '.number_format($v, 2, '.', ',');

        $total = 0.0;
        $cuerpo = '';
        foreach ($grupos as $nombre => $lineas) {
            $subtotal = array_sum(array_column($lineas, 'costo_estimado'));
            $total += $subtotal;
            $filas = '';
            foreach ($lineas as $linea) {
                $filas .= '<tr><td>'.$e($linea['insumo']).'</td><td>'.$e($linea['unidad_medida']).'</td>'
                    .'<td class="n">'.$n($linea['stock_al_calcular']).'</td><td class="n"><b>'.$n($linea['cantidad_a_comprar']).'</b></td>'
                    .'<td class="n">'.$s((float) ($linea['proveedor']['precio'] ?? 0)).'</td><td class="n">'.$s((float) $linea['costo_estimado']).'</td></tr>';
            }
            $cuerpo .= '<h2>'.$e($nombre).'</h2><table><thead><tr><th>Insumo</th><th>Unidad</th><th class="n">Tienes</th>'
                .'<th class="n">Comprar</th><th class="n">Precio</th><th class="n">Subtotal</th></tr></thead><tbody>'.$filas
                .'<tr class="sub"><td colspan="5">Subtotal</td><td class="n">'.$s($subtotal).'</td></tr></tbody></table>';
        }

        $fecha = Carbon::now()->format('d/m/Y H:i');

        return <<<HTML
            <!doctype html><html lang="es"><head><meta charset="utf-8"><style>
            body{font-family:'DejaVu Sans',sans-serif;color:#0B2340;font-size:11px}
            h1{font-size:20px;margin:0 0 4px} h2{font-size:13px;background:#F4D7B0;padding:6px 8px;margin:18px 0 0}
            p{margin:2px 0;color:#334359} table{width:100%;border-collapse:collapse}
            th{background:#0B2340;color:#fff;text-align:left;padding:5px 8px;font-size:10px}
            td{padding:5px 8px;border-bottom:1px solid #E7EAEF} .n{text-align:right} .sub td{font-weight:bold;border-bottom:none}
            .total{margin-top:18px;text-align:right;font-size:14px;font-weight:bold}
            </style></head><body>
            <h1>Compra sugerida</h1>
            <p>{$e($localNombre)} · cubre {$cobertura} días</p>
            <p>Generado por {$e($generadoPor)} el {$fecha}</p>
            {$cuerpo}
            <div class="total">Total estimado: {$s($total)}</div>
            </body></html>
            HTML;
    }
}
