<?php

namespace Tests\Feature;

use App\Domains\Archivos\Services\ProcesadorImagenService;
use App\Domains\Archivos\Services\TenantStorageService;
use App\Models\Archivo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\TestCase;

class TenantStorageFotoProductoTest extends TestCase
{
    private TenantStorageService $service;

    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $productoId;

    /** @var list<string> */
    private array $keysCreadas = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(TenantStorageService::class);
        $this->productoId = (string) Str::uuid();
    }

    protected function tearDown(): void
    {
        foreach ($this->keysCreadas as $key) {
            Storage::disk('s3')->delete($key);
            DB::table('archivo')->where('object_key', $key)->delete();
        }

        parent::tearDown();
    }

    private function pngBytes(): string
    {
        $imagen = imagecreatetruecolor(400, 400);
        imagefilledrectangle($imagen, 0, 0, 200, 400, imagecolorallocate($imagen, 200, 40, 40));
        ob_start();
        imagepng($imagen);

        return (string) ob_get_clean();
    }

    private function fotoPng(string $nombre = 'plato.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($nombre, $this->pngBytes());
    }

    private function guardarFoto(?UploadedFile $foto = null): array
    {
        $resultado = $this->service->guardarFotoProducto(
            $this->empresaId,
            $this->localId,
            $this->productoId,
            $foto ?? $this->fotoPng(),
        );
        foreach (array_filter([$resultado['object_key'], $resultado['miniatura_key']]) as $key) {
            $this->keysCreadas[] = $key;
        }

        return $resultado;
    }

    private function urlPublica(string $objectKey): string
    {
        return rtrim((string) config('filesystems.disks.s3.endpoint'), '/')
            .'/'.config('filesystems.disks.s3.bucket').'/'.$objectKey;
    }

    public function test_guarda_foto_en_catalogo_como_webp_y_registra_metadato(): void
    {
        $resultado = $this->guardarFoto();

        $prefijo = "catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/{$this->productoId}/";
        $this->assertStringStartsWith($prefijo, $resultado['object_key']);
        $this->assertStringEndsWith("{$resultado['archivo_id']}.webp", $resultado['object_key']);
        $this->assertTrue(Storage::disk('s3')->exists($resultado['object_key']));
        $this->assertLessThanOrEqual(255, strlen($resultado['object_key']));

        $guardado = Storage::disk('s3')->get($resultado['object_key']);
        $this->assertSame(IMAGETYPE_WEBP, getimagesizefromstring($guardado)[2], 'Debe re-codificarse a WebP aunque suban PNG.');

        $archivo = Archivo::find($resultado['archivo_id']);
        $this->assertNotNull($archivo);
        $this->assertSame('catalogo', $archivo->visibilidad);
        $this->assertSame('producto', $archivo->entidad_tipo);
        $this->assertSame($this->productoId, $archivo->entidad_id);
        $this->assertSame('image/webp', $archivo->mime_type);
        $this->assertSame('disponible', $archivo->estado);
        $this->assertSame('plato.png', $archivo->nombre_original);
        $this->assertSame(strlen($guardado), $archivo->tamanio_bytes);
        $this->assertSame(hash('sha256', $guardado), $archivo->sha256);
    }

    public function test_guarda_tambien_una_miniatura_registrada_aparte(): void
    {
        $resultado = $this->guardarFoto();

        $this->assertSame(
            str_replace('.webp', '_thumb.webp', $resultado['object_key']),
            $resultado['miniatura_key'],
        );
        $this->assertTrue(Storage::disk('s3')->exists($resultado['miniatura_key']));

        $miniatura = Archivo::where('object_key', $resultado['miniatura_key'])->first();
        $this->assertSame('producto_miniatura', $miniatura->entidad_tipo);
        $this->assertSame('catalogo', $miniatura->visibilidad);
        $this->assertSame($this->productoId, $miniatura->entidad_id);
        $this->assertSame(
            [$resultado['object_key'] => $resultado['miniatura_key']],
            $this->service->miniaturasDisponibles([$resultado['object_key'], 'catalogo/x/sin-miniatura.webp', 'https://externa/f.jpg']),
        );
    }

    public function test_foto_y_miniatura_son_publicas_e_inmutables_sin_firma(): void
    {
        $resultado = $this->guardarFoto();

        foreach ([$resultado['object_key'], $resultado['miniatura_key']] as $key) {
            $respuesta = Http::get($this->urlPublica($key));

            $this->assertSame(200, $respuesta->status());
            $this->assertSame('image/webp', $respuesta->header('Content-Type'));
            $this->assertStringContainsString('immutable', $respuesta->header('Cache-Control'));
        }
    }

    public function test_sin_gd_guarda_la_foto_tal_cual_y_sin_miniatura(): void
    {
        $this->app->instance(ProcesadorImagenService::class, new class extends ProcesadorImagenService
        {
            public function disponible(): bool
            {
                return false;
            }
        });
        $this->app->forgetInstance(TenantStorageService::class);
        $this->service = app(TenantStorageService::class);

        $resultado = $this->guardarFoto();

        $this->assertStringEndsWith("{$resultado['archivo_id']}.png", $resultado['object_key']);
        $this->assertNull($resultado['miniatura_key']);
        $this->assertSame($this->pngBytes(), Storage::disk('s3')->get($resultado['object_key']));
        $this->assertSame('image/png', Archivo::find($resultado['archivo_id'])->mime_type);
    }

    public function test_rechaza_archivo_que_no_es_imagen_aunque_tenga_extension_jpg(): void
    {
        // UploadedFile::fake() deduce el MIME por la extensión; un archivo real lo detecta por contenido.
        $ruta = tempnam(sys_get_temp_dir(), 'foto');
        file_put_contents($ruta, '%PDF-1.4 contenido que no es una imagen');
        $falsa = new UploadedFile($ruta, 'plato.jpg', null, null, true);

        try {
            $this->guardarFoto($falsa);
            $this->fail('Debió rechazar un archivo que no es imagen.');
        } catch (InvalidArgumentException) {
            $this->assertSame(0, Archivo::where('entidad_id', $this->productoId)->count());
        } finally {
            @unlink($ruta);
        }
    }

    public function test_elimina_foto_propia_y_marca_metadato_como_eliminado(): void
    {
        $resultado = $this->guardarFoto();

        $this->assertTrue($this->service->eliminarArchivoPorKey($this->empresaId, $resultado['object_key']));
        $this->assertFalse(Storage::disk('s3')->exists($resultado['object_key']));
        $this->assertFalse(Storage::disk('s3')->exists($resultado['miniatura_key']), 'La miniatura debe borrarse junto con la foto.');
        $this->assertSame('eliminado', Archivo::find($resultado['archivo_id'])->estado);
        $this->assertSame('eliminado', Archivo::where('object_key', $resultado['miniatura_key'])->value('estado'));

        // Idempotente: repetir no falla.
        $this->assertTrue($this->service->eliminarArchivoPorKey($this->empresaId, $resultado['object_key']));
    }

    public function test_no_elimina_claves_de_otra_empresa_ni_urls_externas(): void
    {
        $resultado = $this->guardarFoto();
        $otraEmpresa = (string) Str::uuid();

        $this->assertFalse($this->service->eliminarArchivoPorKey($otraEmpresa, $resultado['object_key']));
        $this->assertFalse($this->service->eliminarArchivoPorKey($this->empresaId, 'https://images.unsplash.com/foto.jpg'));
        $this->assertFalse($this->service->eliminarArchivoPorKey($this->empresaId, "privado/empresas/{$this->empresaId}/x.pdf"));
        $this->assertTrue(Storage::disk('s3')->exists($resultado['object_key']));
        $this->assertSame('disponible', Archivo::find($resultado['archivo_id'])->estado);
    }

    public function test_resolver_url_catalogo_maneja_nulo_clave_y_url_absoluta(): void
    {
        $this->assertNull($this->service->resolverUrlCatalogo(null));
        $this->assertNull($this->service->resolverUrlCatalogo(''));
        $this->assertSame(
            'https://images.unsplash.com/foto.jpg',
            $this->service->resolverUrlCatalogo('https://images.unsplash.com/foto.jpg'),
        );

        $url = $this->service->resolverUrlCatalogo('catalogo/empresas/e/locales/l/productos/p/a.webp');
        $this->assertStringStartsWith('http', $url);
        $this->assertStringEndsWith('/catalogo/empresas/e/locales/l/productos/p/a.webp', $url);
    }
}
