<?php

namespace Tests\Feature;

use App\Domains\Admin\Services\AnulacionExportacionService;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use OpenSpout\Reader\XLSX\Reader;
use Tests\Concerns\CreaAnulaciones;
use Tests\TestCase;
use ZipArchive;

class AdminAnulacionesExportacionTest extends TestCase
{
    use CreaAnulaciones;

    private function anularEn(array $base, string $fechaHora, array $extra = []): string
    {
        $momento = Carbon::parse($fechaHora);

        return $this->crearAnulacion($base, array_merge([
            'anulado_at' => $momento,
            'created_at' => $momento,
            'pedido_created_at' => $momento->copy()->subMinutes(25),
        ], $extra));
    }

    private function exportar(string $desde, string $hasta): TestResponse
    {
        return $this->get("/api/v1/admin/anulaciones/exportar?desde={$desde}&hasta={$hasta}", $this->headers());
    }

    private function resumen(string $desde, string $hasta): TestResponse
    {
        return $this->getJson("/api/v1/admin/anulaciones/exportar/resumen?desde={$desde}&hasta={$hasta}", $this->headers());
    }

    /**
     * Lee el .xlsx descargado: filas de cada hoja (por nombre) y el XML crudo de cada hoja.
     *
     * @return array{0: array<string, list<array<int, mixed>>>, 1: array<int, string>}
     */
    private function abrirLibro(TestResponse $response): array
    {
        $ruta = tempnam(sys_get_temp_dir(), 'anul_').'.xlsx';
        file_put_contents($ruta, $response->streamedContent());

        $reader = new Reader;
        $reader->open($ruta);
        $hojas = [];
        foreach ($reader->getSheetIterator() as $hoja) {
            $filas = [];
            foreach ($hoja->getRowIterator() as $fila) {
                $filas[] = $fila->toArray();
            }
            $hojas[$hoja->getName()] = $filas;
        }
        $reader->close();

        $zip = new ZipArchive;
        $zip->open($ruta);
        $xml = [1 => (string) $zip->getFromName('xl/worksheets/sheet1.xml'), 2 => (string) $zip->getFromName('xl/worksheets/sheet2.xml')];
        $zip->close();
        unlink($ruta);

        return [$hojas, $xml];
    }

    public function test_resumen_cuenta_el_periodo_con_montos_merma_y_dias(): void
    {
        $base = $this->crearEntornoBase();
        $this->anularEn($base, '2019-05-10 12:00:00', ['monto_total' => 45.00]);
        $this->anularEn($base, '2019-05-10 18:00:00', ['monto_total' => 45.00, 'es_merma' => true, 'costo_merma' => 18.50]);
        $this->anularEn($base, '2019-05-12 09:00:00', ['monto_total' => 30.00, 'revisado' => true]);

        $response = $this->resumen('2019-05-10', '2019-05-12');

        $response->assertOk()
            ->assertJsonPath('datos.total', 3)
            ->assertJsonPath('datos.monto_total', 120)
            ->assertJsonPath('datos.con_merma', 1)
            ->assertJsonPath('datos.costo_merma_total', 18.5)
            ->assertJsonPath('datos.pendientes_revision', 2)
            ->assertJsonPath('datos.dias_con_anulaciones', 2);
    }

    public function test_el_periodo_incluye_el_ultimo_dia_completo_y_excluye_el_siguiente(): void
    {
        $base = $this->crearEntornoBase();
        $this->anularEn($base, '2019-05-10 00:00:00');
        $this->anularEn($base, '2019-05-10 23:30:00');
        $this->anularEn($base, '2019-05-09 23:59:00');
        $this->anularEn($base, '2019-05-11 00:10:00');

        $this->resumen('2019-05-10', '2019-05-10')->assertJsonPath('datos.total', 2);
    }

    public function test_un_periodo_sin_anulaciones_devuelve_resumen_en_cero_y_error_al_descargar(): void
    {
        $this->resumen('2018-01-01', '2018-01-31')
            ->assertOk()
            ->assertJsonPath('datos.total', 0)
            ->assertJsonPath('datos.monto_total', 0);

        $this->exportar('2018-01-01', '2018-01-31')
            ->assertStatus(404)
            ->assertJsonPath('exito', false)
            ->assertJsonPath('errores.0.codigo', 'ERR_SIN_ANULACIONES');
    }

    public function test_el_mensaje_sin_anulaciones_nombra_el_periodo(): void
    {
        $this->exportar('2018-03-05', '2018-03-05')
            ->assertStatus(404)
            ->assertJsonPath('errores.0.mensaje', 'No hay anulaciones registradas el 05/03/2018.');

        $this->exportar('2018-03-01', '2018-03-31')
            ->assertJsonPath('errores.0.mensaje', 'No hay anulaciones registradas entre el 01/03/2018 y el 31/03/2018.');
    }

    public function test_valida_fechas_y_rango_maximo(): void
    {
        $this->getJson('/api/v1/admin/anulaciones/exportar/resumen', $this->headers())->assertStatus(422);
        $this->resumen('2019-05-12', '2019-05-10')->assertStatus(422);
        $this->resumen('10/05/2019', '12/05/2019')->assertStatus(422);

        // 366 días corridos (ambos extremos incluidos) es el máximo permitido
        $this->resumen('2019-01-01', '2020-01-01')->assertOk();
        $this->resumen('2019-01-01', '2020-01-02')
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_RANGO_EXCEDIDO');
        $this->exportar('2018-01-01', '2019-06-01')
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_RANGO_EXCEDIDO');
    }

    public function test_la_exportacion_descarga_un_xlsx_con_nombre_del_local_y_periodo_y_se_registra(): void
    {
        $base = $this->crearEntornoBase();
        $this->anularEn($base, '2019-05-10 12:00:00');

        $response = $this->exportar('2019-05-10', '2019-05-12');

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $disposicion = $response->headers->get('Content-Disposition');
        $this->assertMatchesRegularExpression('/filename=anulaciones_[A-Za-z0-9_]+_2019-05-10_al_2019-05-12\.xlsx/', $disposicion);

        $ruta = $response->baseResponse->getFile()->getPathname();
        $this->assertFileExists($ruta);
        $response->streamedContent();
        $this->assertFileDoesNotExist($ruta, 'El archivo temporal debe borrarse después de enviarse');

        $log = DB::table('log_auditoria')
            ->where('accion', 'anulacion.exportada')
            ->where('entidad_id', $this->localId)
            ->where('usuario_id', $this->adminId)
            ->first();
        $this->assertNotNull($log);
        $this->assertSame(['desde' => '2019-05-10', 'hasta' => '2019-05-12', 'registros' => 1], json_decode($log->detalle, true));
    }

    public function test_el_nombre_del_archivo_de_un_dia_usa_una_sola_fecha_y_limpia_el_nombre_del_local(): void
    {
        $servicio = app(AnulacionExportacionService::class);

        $this->assertSame('anulaciones_Aurea_Centro_2026-11-12.xlsx', $servicio->nombreArchivo('Áurea  Centro', '2026-11-12', '2026-11-12'));
        $this->assertSame(
            'anulaciones_Cevicheria_El_Muelle_Sur_2026-11-01_al_2026-11-12.xlsx',
            $servicio->nombreArchivo('Cevichería "El Muelle"/Sur?', '2026-11-01', '2026-11-12')
        );
        $this->assertSame('anulaciones_Local_2026-11-12.xlsx', $servicio->nombreArchivo('???', '2026-11-12', '2026-11-12'));
    }

    public function test_el_libro_tiene_resumen_y_detalle_legibles(): void
    {
        $base = $this->crearEntornoBase();
        $nombreAdmin = DB::table('usuario')->where('id', $this->adminId)->value('nombre');

        $this->anularEn($base, '2019-05-10 12:00:00', [
            'monto_total' => 45.00,
            'es_merma' => true,
            'costo_merma' => 18.50,
            'revisado' => true,
            'revisado_por' => $this->adminId,
            'revisado_at' => Carbon::parse('2019-05-10 13:00:00'),
            'notas_supervision' => 'Se conversó con el mozo.',
        ]);
        $this->anularEn($base, '2019-05-11 20:15:00', [
            'motivo_categoria' => 'queja_calidad',
            'revisado' => true,
            'revisado_por' => null,
            'revisado_at' => Carbon::parse('2019-05-11 21:00:00'),
        ]);
        $this->anularEn($base, '2019-05-12 09:00:00', ['motivo_detalle' => '=HYPERLINK("http://x")']);

        [$hojas, $xml] = $this->abrirLibro($this->exportar('2019-05-10', '2019-05-12'));

        $this->assertSame(['Resumen', 'Detalle'], array_keys($hojas));

        // Hoja Resumen: indicadores, tabla por motivo y por mozo
        $resumen = collect($hojas['Resumen'])->map(fn ($f) => $f[0] ?? null);
        $this->assertTrue($resumen->contains('Auditoría de anulaciones'));
        $this->assertTrue($resumen->contains('Por motivo'));
        $this->assertTrue($resumen->contains('Por mozo'));
        $this->assertTrue($resumen->contains('Demora en entrega / Desistimiento'));
        $this->assertTrue($resumen->contains('Disconformidad / Queja de calidad'));

        // Hoja Detalle: encabezado + 3 filas ordenadas por fecha
        $detalle = $hojas['Detalle'];
        $this->assertCount(4, $detalle);
        $this->assertSame('Código', $detalle[0][0]);
        $this->assertSame('Notas de supervisión', $detalle[0][21]);

        [$primera, $segunda, $tercera] = [$detalle[1], $detalle[2], $detalle[3]];

        $this->assertMatchesRegularExpression('/^ANUL-2019-[0-9A-F]{8}$/', $primera[0]);
        $this->assertInstanceOf(DateTimeInterface::class, $primera[1]);
        $this->assertSame('2019-05-10', $primera[1]->format('Y-m-d'));
        $this->assertSame('12:00', $primera[2]->format('H:i'));
        $this->assertSame('Ítem individual', $primera[6]);
        $this->assertSame('Demora en entrega / Desistimiento', $primera[12]);
        $this->assertSame('En preparación (cocina)', $primera[15]);
        $this->assertSame('Sí', $primera[16]);
        $this->assertSame(18.5, (float) $primera[17]);
        $this->assertSame('Revisada', $primera[18]);
        $this->assertSame($nombreAdmin, $primera[19]);
        $this->assertSame('Se conversó con el mozo.', $primera[21]);

        // Revisada por un usuario que ya no existe: nombre legible, no un UUID ni un vacío
        $this->assertSame('Disconformidad / Queja de calidad', $segunda[12]);
        $this->assertSame('Usuario eliminado', $segunda[19]);
        $this->assertSame('—', $segunda[21]);

        // Sin merma ni revisión: valores legibles, no celdas vacías
        $this->assertSame('No', $tercera[16]);
        $this->assertSame('—', $tercera[17]);
        $this->assertSame('Pendiente', $tercera[18]);
        $this->assertSame('—', $tercera[19]);

        // Ninguna celda del Detalle expone un UUID
        foreach ($detalle as $fila) {
            foreach ($fila as $celda) {
                $this->assertDoesNotMatchRegularExpression('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i', (string) ($celda instanceof DateTimeInterface ? '' : $celda));
            }
        }

        // El texto libre que empieza con "=" queda como texto, nunca como fórmula
        $this->assertSame('=HYPERLINK("http://x")', $tercera[13]);
        $this->assertStringNotContainsString('<f>', $xml[2]);
        $this->assertStringNotContainsString('<f ', $xml[2]);

        // Hoja Detalle usable: columnas con ancho, fila de encabezado fija y filtro automático
        $this->assertStringContainsString('<cols>', $xml[1]);
        $this->assertStringContainsString('<cols>', $xml[2]);
        $this->assertStringContainsString('<pane', $xml[2]);
        $this->assertStringContainsString('<autoFilter ref="A1:V4"', $xml[2]);
    }
}
