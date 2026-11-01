<?php

namespace Tests\Unit;

use App\Domains\Archivos\Services\ProcesadorImagenService;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class ProcesadorImagenServiceTest extends TestCase
{
    private ProcesadorImagenService $procesador;

    /** @var list<string> */
    private array $temporales = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->procesador = new ProcesadorImagenService;

        if (! $this->procesador->disponible()) {
            $this->markTestSkipped('GD con soporte WebP no está disponible en este entorno.');
        }
    }

    protected function tearDown(): void
    {
        foreach ($this->temporales as $ruta) {
            @unlink($ruta);
        }

        parent::tearDown();
    }

    private function archivo(string $contenido): string
    {
        $ruta = tempnam(sys_get_temp_dir(), 'img');
        file_put_contents($ruta, $contenido);
        $this->temporales[] = $ruta;

        return $ruta;
    }

    private function jpeg(int $ancho, int $alto): string
    {
        $imagen = imagecreatetruecolor($ancho, $alto);
        imagefilledrectangle($imagen, 0, 0, intdiv($ancho, 2), $alto, imagecolorallocate($imagen, 200, 40, 40));
        ob_start();
        imagejpeg($imagen, null, 90);

        return (string) ob_get_clean();
    }

    /** Inserta un segmento EXIF con la orientación indicada justo después del SOI del JPEG. */
    private function conOrientacionExif(string $jpeg, int $orientacion): string
    {
        $entrada = pack('vvV', 0x0112, 3, 1).pack('v', $orientacion)."\x00\x00";
        $tiff = 'II'.pack('v', 42).pack('V', 8).pack('v', 1).$entrada.pack('V', 0);
        $app1 = "Exif\x00\x00".$tiff;

        return substr($jpeg, 0, 2)."\xFF\xE1".pack('n', strlen($app1) + 2).$app1.substr($jpeg, 2);
    }

    /** @return array{0: int, 1: int, 2: int} ancho, alto, tipo */
    private function medidas(string $contenido): array
    {
        $info = getimagesizefromstring($contenido);
        $this->assertIsArray($info);

        return [$info[0], $info[1], $info[2]];
    }

    public function test_reduce_una_foto_grande_a_webp_y_genera_miniatura(): void
    {
        $resultado = $this->procesador->procesarFotoCatalogo($this->archivo($this->jpeg(2000, 1000)));

        $this->assertSame([1200, 600, IMAGETYPE_WEBP], $this->medidas($resultado['principal']));
        $this->assertSame([400, 200, IMAGETYPE_WEBP], $this->medidas($resultado['miniatura']));
        $this->assertLessThan(strlen($this->jpeg(2000, 1000)), strlen($resultado['principal']));
    }

    public function test_nunca_amplia_una_foto_pequena(): void
    {
        $resultado = $this->procesador->procesarFotoCatalogo($this->archivo($this->jpeg(500, 400)));

        $this->assertSame([500, 400, IMAGETYPE_WEBP], $this->medidas($resultado['principal']));
        $this->assertSame([400, 320, IMAGETYPE_WEBP], $this->medidas($resultado['miniatura']));
    }

    public function test_corrige_la_orientacion_exif_y_descarta_los_metadatos(): void
    {
        $conExif = $this->conOrientacionExif($this->jpeg(200, 100), 6);
        $this->assertStringContainsString('Exif', $conExif);

        $resultado = $this->procesador->procesarFotoCatalogo($this->archivo($conExif));

        // Orientación 6 = girada 90°: la foto se guarda ya derecha (alto > ancho) y sin EXIF.
        $this->assertSame([100, 200, IMAGETYPE_WEBP], $this->medidas($resultado['principal']));
        $this->assertStringNotContainsString('Exif', $resultado['principal']);
    }

    public function test_conserva_la_transparencia_de_un_png(): void
    {
        $imagen = imagecreatetruecolor(300, 300);
        imagealphablending($imagen, false);
        imagesavealpha($imagen, true);
        imagefill($imagen, 0, 0, imagecolorallocatealpha($imagen, 0, 0, 0, 127));
        ob_start();
        imagepng($imagen);
        $png = (string) ob_get_clean();

        $resultado = $this->procesador->procesarFotoCatalogo($this->archivo($png));

        $decodificada = imagecreatefromstring($resultado['principal']);
        $this->assertGreaterThan(0, (imagecolorat($decodificada, 10, 10) >> 24) & 0x7F, 'El píxel debía seguir transparente.');
    }

    public function test_rechaza_un_archivo_que_no_es_imagen(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->procesador->procesarFotoCatalogo($this->archivo('%PDF-1.4 esto no es una imagen'));
    }

    public function test_rechaza_una_imagen_con_demasiados_pixeles_sin_decodificarla(): void
    {
        // Solo cabecera PNG que declara 8000x8000 (64 MP): debe frenarse antes de reservar memoria.
        $ihdr = pack('NNCCCCC', 8000, 8000, 8, 2, 0, 0, 0);
        $png = "\x89PNG\r\n\x1a\n".pack('N', strlen($ihdr)).'IHDR'.$ihdr.pack('N', crc32('IHDR'.$ihdr));

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('demasiados píxeles');

        $this->procesador->procesarFotoCatalogo($this->archivo($png));
    }
}
