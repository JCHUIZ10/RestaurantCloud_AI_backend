<?php

namespace App\Domains\Admin\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\DateTimeCell;
use OpenSpout\Common\Entity\Cell\NumericCell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\AutoFilter;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;
use Throwable;

/**
 * Exportación a Excel de la auditoría de anulaciones (resumen + detalle del periodo).
 */
class AnulacionExportacionService
{
    /** Rango máximo exportable (días corridos, ambos extremos incluidos). */
    public const MAX_DIAS = 366;

    private const COLOR_NAVY = '0B2340';

    private const COLOR_CHAMPAGNE = 'F4D7B0';

    private const COLOR_IVORY = 'FFF9F0';

    private const SIN_DATO = '—';

    private const USUARIO_ELIMINADO = 'Usuario eliminado';

    private const FORMATO_MONEDA = '"S/" #,##0.00';

    private const FORMATO_FECHA = 'dd/mm/yyyy';

    private const FORMATO_HORA = 'hh:mm';

    private const FORMATO_FECHA_HORA = 'dd/mm/yyyy hh:mm';

    private const MOTIVOS = [
        'error_registro' => 'Error de digitación o comanda duplicada',
        'demora_cliente' => 'Demora en entrega / Desistimiento',
        'queja_calidad' => 'Disconformidad / Queja de calidad',
        'cambio_plato' => 'Cambio de plato por cliente',
        'retiro_sin_consumo' => 'Retiro de mesa sin consumo',
        'otro' => 'Otro motivo justificado',
    ];

    private const ESTADOS_ANTERIORES = [
        'en_cola' => 'En cola (KDS)',
        'en_preparacion' => 'En preparación (cocina)',
        'listo' => 'Listo en pase',
        'servido' => 'Servido en mesa',
    ];

    private const TIPOS = [
        'item_individual' => 'Ítem individual',
        'comanda_completa' => 'Comanda completa',
    ];

    public function __construct(private AnulacionAuditoriaService $auditoria) {}

    /**
     * Indica si el rango (ambos extremos incluidos) supera el máximo permitido.
     */
    public function excedeRangoMaximo(string $desde, string $hasta): bool
    {
        $dias = (int) Carbon::parse($desde)->startOfDay()->diffInDays(Carbon::parse($hasta)->startOfDay()) + 1;

        return $dias > self::MAX_DIAS;
    }

    /**
     * Comprobación barata (EXISTS) de que el periodo tiene al menos una anulación.
     */
    public function hayAnulaciones(string $localId, string $desde, string $hasta): bool
    {
        return $this->tablaPeriodo($localId, $desde, $hasta)->exists();
    }

    /**
     * Totales del periodo para la vista previa del modal de exportación.
     *
     * @return array{total: int, monto_total: float, con_merma: int, costo_merma_total: float, pendientes_revision: int, dias_con_anulaciones: int}
     */
    public function resumen(string $localId, string $desde, string $hasta): array
    {
        $fila = $this->tablaPeriodo($localId, $desde, $hasta)->selectRaw('
            COUNT(*)::INT AS total,
            COALESCE(SUM(monto_total), 0) AS monto_total,
            COUNT(*) FILTER (WHERE es_merma = true)::INT AS con_merma,
            COALESCE(SUM(costo_merma) FILTER (WHERE es_merma = true), 0) AS costo_merma_total,
            COUNT(*) FILTER (WHERE revisado = false)::INT AS pendientes_revision,
            COUNT(DISTINCT anulado_at::date)::INT AS dias_con_anulaciones
        ')->first();

        return [
            'total' => (int) ($fila->total ?? 0),
            'monto_total' => round((float) ($fila->monto_total ?? 0), 2),
            'con_merma' => (int) ($fila->con_merma ?? 0),
            'costo_merma_total' => round((float) ($fila->costo_merma_total ?? 0), 2),
            'pendientes_revision' => (int) ($fila->pendientes_revision ?? 0),
            'dias_con_anulaciones' => (int) ($fila->dias_con_anulaciones ?? 0),
        ];
    }

    /**
     * Genera el .xlsx en un archivo temporal y registra la exportación en log_auditoria.
     * Quien llama debe borrar el archivo después de enviarlo.
     *
     * @return array{ruta: string, nombre: string, total: int}
     */
    public function generar(string $localId, string $desde, string $hasta, object $usuario): array
    {
        $local = DB::table('local')->where('id', $localId)->first(['nombre', 'empresa_id']);
        $localNombre = (string) ($local->nombre ?? 'Local');

        $directorio = storage_path('app/tmp/exportaciones');
        File::ensureDirectoryExists($directorio);
        $ruta = $directorio.'/'.Str::uuid().'.xlsx';

        try {
            $total = $this->escribirLibro($ruta, $localId, $localNombre, $desde, $hasta, (string) ($usuario->nombre ?? 'Administrador'));
        } catch (Throwable $e) {
            File::delete($ruta);
            throw $e;
        }

        if ($local?->empresa_id) {
            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $local->empresa_id,
                'local_id' => $localId,
                'usuario_id' => $usuario->id,
                'accion' => 'anulacion.exportada',
                'entidad_tipo' => 'local',
                'entidad_id' => $localId,
                'detalle' => json_encode(['desde' => $desde, 'hasta' => $hasta, 'registros' => $total]),
                'fecha' => now(),
            ]);
        }

        return [
            'ruta' => $ruta,
            'nombre' => $this->nombreArchivo($localNombre, $desde, $hasta),
            'total' => $total,
        ];
    }

    /**
     * anulaciones_Nombre_Del_Local_2026-11-12.xlsx o ..._2026-11-01_al_2026-11-12.xlsx
     */
    public function nombreArchivo(string $localNombre, string $desde, string $hasta): string
    {
        $local = trim((string) preg_replace('/[^A-Za-z0-9]+/', '_', Str::ascii($localNombre)), '_');
        $local = $local !== '' ? $local : 'Local';
        $periodo = $desde === $hasta ? $desde : "{$desde}_al_{$hasta}";

        return "anulaciones_{$local}_{$periodo}.xlsx";
    }

    /**
     * Límites [inicio, fin) del periodo en la zona horaria de la aplicación. Se compara contra
     * anulado_at sin envolverlo en funciones para poder usar el índice (local_id, anulado_at).
     *
     * @return array{0: string, 1: string}
     */
    private function limites(string $desde, string $hasta): array
    {
        return [
            Carbon::parse($desde)->startOfDay()->toDateTimeString(),
            Carbon::parse($hasta)->addDay()->startOfDay()->toDateTimeString(),
        ];
    }

    private function tablaPeriodo(string $localId, string $desde, string $hasta): Builder
    {
        [$inicio, $fin] = $this->limites($desde, $hasta);

        return DB::table('pedido_anulacion')
            ->where('local_id', $localId)
            ->where('anulado_at', '>=', $inicio)
            ->where('anulado_at', '<', $fin);
    }

    private function vistaPeriodo(string $localId, string $desde, string $hasta): Builder
    {
        [$inicio, $fin] = $this->limites($desde, $hasta);

        return $this->auditoria->consultaDetallada($localId)
            ->where('pa.anulado_at', '>=', $inicio)
            ->where('pa.anulado_at', '<', $fin);
    }

    private function escribirLibro(string $ruta, string $localId, string $localNombre, string $desde, string $hasta, string $generadoPor): int
    {
        $writer = new Writer(new Options);
        $writer->openToFile($ruta);
        $writer->setCreator('RestaurantCloud');

        $this->escribirHojaResumen($writer, $localId, $localNombre, $desde, $hasta, $generadoPor);
        $total = $this->escribirHojaDetalle($writer, $localId, $desde, $hasta);

        $writer->close();

        return $total;
    }

    private function escribirHojaResumen(Writer $writer, string $localId, string $localNombre, string $desde, string $hasta, string $generadoPor): void
    {
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Resumen');
        $sheet->setColumnWidth(36, 1);
        $sheet->setColumnWidth(18, 2);
        $sheet->setColumnWidth(18, 3);
        $sheet->setColumnWidth(16, 4);
        $sheet->setColumnWidth(24, 5);
        $sheet->setSheetView((new SheetView)->setShowGridLines(false));

        $titulo = (new Style)->setFontBold()->setFontSize(16)->setFontColor(self::COLOR_NAVY);
        $etiqueta = (new Style)->setFontBold()->setFontColor(self::COLOR_NAVY);
        $seccion = (new Style)->setFontBold()->setFontColor(self::COLOR_NAVY)->setBackgroundColor(self::COLOR_CHAMPAGNE);
        $encabezado = (new Style)->setFontBold()->setFontColor(Color::WHITE)->setBackgroundColor(self::COLOR_NAVY);
        $encabezadoNumero = (clone $encabezado)->setCellAlignment(CellAlignment::RIGHT);
        $moneda = (new Style)->setFormat(self::FORMATO_MONEDA);
        $entero = (new Style)->setFormat('#,##0');
        $decimal = (new Style)->setFormat('#,##0.0');
        $zebra = (new Style)->setBackgroundColor(self::COLOR_IVORY);

        $periodo = $desde === $hasta
            ? Carbon::parse($desde)->format('d/m/Y')
            : Carbon::parse($desde)->format('d/m/Y').' al '.Carbon::parse($hasta)->format('d/m/Y');

        $writer->addRow(new Row([new StringCell('Auditoría de anulaciones', $titulo)]));
        $writer->addRow(new Row([new StringCell('Local', $etiqueta), new StringCell($localNombre, null)]));
        $writer->addRow(new Row([new StringCell('Periodo', $etiqueta), new StringCell($periodo, null)]));
        $writer->addRow(new Row([new StringCell('Generado por', $etiqueta), new StringCell($generadoPor, null)]));
        $writer->addRow(new Row([new StringCell('Generado el', $etiqueta), new StringCell(now()->format('d/m/Y H:i'), null)]));
        $writer->addRow(new Row([]));

        $kpis = $this->resumen($localId, $desde, $hasta);

        $writer->addRow(new Row([new StringCell('Indicadores del periodo', $seccion), new StringCell('', $seccion)]));
        $writer->addRow(new Row([new StringCell('Total de anulaciones', $etiqueta), new NumericCell($kpis['total'], $entero)]));
        $writer->addRow(new Row([new StringCell('Monto cancelado', $etiqueta), new NumericCell($kpis['monto_total'], $moneda)]));
        $writer->addRow(new Row([new StringCell('Anulaciones con merma', $etiqueta), new NumericCell($kpis['con_merma'], $entero)]));
        $writer->addRow(new Row([new StringCell('Costo teórico de merma', $etiqueta), new NumericCell($kpis['costo_merma_total'], $moneda)]));
        $writer->addRow(new Row([new StringCell('Pendientes de revisión', $etiqueta), new NumericCell($kpis['pendientes_revision'], $entero)]));
        $writer->addRow(new Row([new StringCell('Días con anulaciones', $etiqueta), new NumericCell($kpis['dias_con_anulaciones'], $entero)]));
        $writer->addRow(new Row([]));

        $columnas = ['Anulaciones', 'Monto', 'Con merma', 'Espera promedio (min)'];

        $porMotivo = $this->tablaPeriodo($localId, $desde, $hasta)
            ->selectRaw('motivo_categoria AS grupo, COUNT(*)::INT AS cantidad, COALESCE(SUM(monto_total), 0) AS monto, COUNT(*) FILTER (WHERE es_merma = true)::INT AS con_merma, COALESCE(AVG(minutos_espera), 0) AS espera')
            ->groupBy('motivo_categoria')
            ->orderByDesc('cantidad')
            ->get();

        $this->escribirTablaAgrupada($writer, 'Por motivo', 'Motivo', $columnas, $porMotivo->map(fn ($f) => [
            self::MOTIVOS[$f->grupo] ?? Str::headline((string) $f->grupo), $f,
        ])->all(), $seccion, $encabezado, $encabezadoNumero, $entero, $moneda, $decimal, $zebra);

        $writer->addRow(new Row([]));

        $porMozo = $this->vistaPeriodo($localId, $desde, $hasta)
            ->selectRaw('pa.mozo_id, MAX(pa.mozo_nombre) AS mozo_nombre, COUNT(*)::INT AS cantidad, COALESCE(SUM(pa.monto_total), 0) AS monto, COUNT(*) FILTER (WHERE pa.es_merma = true)::INT AS con_merma, COALESCE(AVG(pa.minutos_espera), 0) AS espera')
            ->groupBy('pa.mozo_id')
            ->orderByDesc('cantidad')
            ->get();

        $this->escribirTablaAgrupada($writer, 'Por mozo', 'Mozo', $columnas, $porMozo->map(fn ($f) => [
            $f->mozo_nombre ?: self::USUARIO_ELIMINADO, $f,
        ])->all(), $seccion, $encabezado, $encabezadoNumero, $entero, $moneda, $decimal, $zebra);
    }

    /**
     * @param  list<string>  $columnas
     * @param  list<array{0: string, 1: object}>  $filas
     */
    private function escribirTablaAgrupada(Writer $writer, string $titulo, string $primeraColumna, array $columnas, array $filas, Style $seccion, Style $encabezado, Style $encabezadoNumero, Style $entero, Style $moneda, Style $decimal, Style $zebra): void
    {
        $writer->addRow(new Row([new StringCell($titulo, $seccion), new StringCell('', $seccion), new StringCell('', $seccion), new StringCell('', $seccion), new StringCell('', $seccion)]));
        $writer->addRow(new Row([
            new StringCell($primeraColumna, $encabezado),
            ...array_map(fn (string $c) => new StringCell($c, $encabezadoNumero), $columnas),
        ]));

        foreach ($filas as $indice => [$nombre, $fila]) {
            $fondo = $indice % 2 === 1 ? $zebra : null;
            $writer->addRow(new Row([
                new StringCell($nombre, $fondo),
                new NumericCell((int) $fila->cantidad, $this->conFondo($entero, $fondo)),
                new NumericCell((float) $fila->monto, $this->conFondo($moneda, $fondo)),
                new NumericCell((int) $fila->con_merma, $this->conFondo($entero, $fondo)),
                new NumericCell(round((float) $fila->espera, 1), $this->conFondo($decimal, $fondo)),
            ]));
        }
    }

    private function conFondo(Style $base, ?Style $fondo): Style
    {
        if ($fondo === null) {
            return $base;
        }

        return (clone $base)->setBackgroundColor(self::COLOR_IVORY);
    }

    private function escribirHojaDetalle(Writer $writer, string $localId, string $desde, string $hasta): int
    {
        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Detalle');
        $sheet->setSheetView((new SheetView)->setFreezeRow(2));

        $anchos = [20, 12, 8, 16, 22, 22, 18, 30, 22, 10, 14, 14, 36, 48, 12, 24, 10, 14, 14, 22, 18, 40];
        foreach ($anchos as $indice => $ancho) {
            $sheet->setColumnWidth($ancho, $indice + 1);
        }

        $encabezados = [
            'Código', 'Fecha', 'Hora', 'Mesa', 'Mozo', 'Anulado por', 'Tipo', 'Plato / Comanda', 'Partida',
            'Cantidad', 'Precio unit.', 'Monto', 'Motivo', 'Justificación', 'Espera (min)', 'Estado al anular',
            'Merma', 'Costo merma', 'Revisión', 'Revisado por', 'Revisado el', 'Notas de supervisión',
        ];

        $encabezado = (new Style)->setFontBold()->setFontColor(Color::WHITE)->setBackgroundColor(self::COLOR_NAVY)
            ->setCellVerticalAlignment('center')->setShouldWrapText();
        $writer->addRow(new Row(array_map(fn (string $t) => new StringCell($t, $encabezado), $encabezados)));

        $texto = (new Style)->setShouldWrapText()->setCellVerticalAlignment('top');
        $fecha = (new Style)->setFormat(self::FORMATO_FECHA);
        $hora = (new Style)->setFormat(self::FORMATO_HORA);
        $fechaHora = (new Style)->setFormat(self::FORMATO_FECHA_HORA);
        $entero = (new Style)->setFormat('#,##0');
        $moneda = (new Style)->setFormat(self::FORMATO_MONEDA);

        $total = 0;
        $filas = $this->vistaPeriodo($localId, $desde, $hasta)
            ->orderBy('pa.anulado_at')
            ->orderBy('pa.id')
            ->lazy(500);

        foreach ($filas as $r) {
            $anuladoAt = Carbon::parse($r->anulado_at)->setTimezone(config('app.timezone'));
            $revisado = (bool) $r->revisado;

            $writer->addRow(new Row([
                $this->celdaTexto($this->auditoria->codigoVisible($r)),
                new DateTimeCell($anuladoAt, $fecha),
                new DateTimeCell($anuladoAt, $hora),
                $this->celdaTexto($r->mesa_numero),
                $this->celdaTexto($r->mozo_nombre ?? self::USUARIO_ELIMINADO),
                $this->celdaTexto($r->anulador_nombre ?? self::USUARIO_ELIMINADO),
                $this->celdaTexto(self::TIPOS[$r->tipo_anulacion] ?? Str::headline((string) $r->tipo_anulacion)),
                $this->celdaTexto($r->producto_nombre ?? 'Comanda completa', $texto),
                $this->celdaTexto($r->categoria_nombre),
                new NumericCell((int) $r->cantidad, $entero),
                new NumericCell((float) $r->precio_unitario, $moneda),
                new NumericCell((float) $r->monto_total, $moneda),
                $this->celdaTexto(self::MOTIVOS[$r->motivo_categoria] ?? Str::headline((string) $r->motivo_categoria), $texto),
                $this->celdaTexto($r->motivo_detalle, $texto),
                new NumericCell((int) $r->minutos_espera, $entero),
                $this->celdaTexto(self::ESTADOS_ANTERIORES[$r->estado_anterior] ?? Str::headline((string) $r->estado_anterior)),
                $this->celdaTexto($r->es_merma ? 'Sí' : 'No'),
                $r->es_merma ? new NumericCell((float) ($r->costo_merma ?? 0), $moneda) : $this->celdaTexto(null),
                $this->celdaTexto($revisado ? 'Revisada' : 'Pendiente'),
                $this->celdaTexto($revisado ? ($r->revisor_nombre ?? self::USUARIO_ELIMINADO) : null),
                $revisado && $r->revisado_at
                    ? new DateTimeCell(Carbon::parse($r->revisado_at)->setTimezone(config('app.timezone')), $fechaHora)
                    : $this->celdaTexto(null),
                $this->celdaTexto($r->notas_supervision, $texto),
            ]));

            $total++;
        }

        $sheet->setAutoFilter(new AutoFilter(0, 1, count($encabezados) - 1, max(2, $total + 1)));

        return $total;
    }

    /**
     * Siempre escribe el valor como texto: nunca como fórmula, aunque empiece con "=", "+", "-" o "@"
     * (los motivos y notas son texto libre del personal).
     */
    private function celdaTexto(?string $valor, ?Style $estilo = null): Cell
    {
        $valor = trim((string) $valor);

        return new StringCell($valor !== '' ? $valor : self::SIN_DATO, $estilo);
    }
}
