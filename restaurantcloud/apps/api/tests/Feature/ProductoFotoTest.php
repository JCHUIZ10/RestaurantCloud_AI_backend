<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductoFotoTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    /** @var list<string> */
    private array $productosCreados = [];

    /** @var list<string> */
    private array $archivosTemporales = [];

    protected function setUp(): void
    {
        parent::setUp();
    }

    protected function tearDown(): void
    {
        $keys = DB::table('archivo')->whereIn('entidad_id', $this->productosCreados)->pluck('object_key')->all();
        foreach ($keys as $key) {
            Storage::disk('s3')->delete($key);
        }
        DB::table('archivo')->whereIn('entidad_id', $this->productosCreados)->delete();
        DB::table('log_auditoria')->whereIn('entidad_id', $this->productosCreados)->delete();
        DB::table('producto')->whereIn('id', $this->productosCreados)->delete();

        foreach ($this->archivosTemporales as $ruta) {
            @unlink($ruta);
        }

        parent::tearDown();
    }

    private function headers(?string $localId = null, ?string $empresaId = null): array
    {
        $token = 'test_token_foto_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => 'admin@aurea.local',
            'rol' => 'admin_local',
            'empresa_id' => $empresaId ?? $this->empresaId,
            'local_id' => $localId ?? $this->localId,
            'estado' => 'activo',
        ]));

        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    private function crearProducto(?string $fotoUrl = null): string
    {
        $id = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'categoria_id' => DB::table('categoria_producto')->where('local_id', $this->localId)->value('id'),
            'nombre' => 'Plato Foto Test '.Str::random(6),
            'precio' => 25.00,
            'foto_url' => $fotoUrl,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->productosCreados[] = $id;

        return $id;
    }

    private function png(int $ancho, int $alto): string
    {
        $chunk = fn (string $tipo, string $datos): string => pack('N', strlen($datos)).$tipo.$datos.pack('N', crc32($tipo.$datos));
        $filas = str_repeat("\0".str_repeat("\x80", $ancho), $alto);

        return "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', pack('NNCCCCC', $ancho, $alto, 8, 0, 0, 0, 0))
            .$chunk('IDAT', gzcompress($filas))
            .$chunk('IEND', '');
    }

    /** Archivo real en disco: el tipo MIME se detecta por contenido, como en producción. */
    private function archivo(string $contenido, string $nombre = 'plato.png'): UploadedFile
    {
        $ruta = tempnam(sys_get_temp_dir(), 'foto');
        file_put_contents($ruta, $contenido);
        $this->archivosTemporales[] = $ruta;

        return new UploadedFile($ruta, $nombre, null, null, true);
    }

    private function subir(string $productoId, UploadedFile $foto, ?array $headers = null)
    {
        return $this->post("/api/v1/admin/productos/{$productoId}/foto", ['foto' => $foto], $headers ?? $this->headers());
    }

    public function test_admin_sube_foto_y_el_producto_queda_con_url_publica(): void
    {
        $productoId = $this->crearProducto();

        $respuesta = $this->subir($productoId, $this->archivo($this->png(400, 400)));

        $respuesta->assertOk()->assertJsonPath('exito', true);
        $key = DB::table('producto')->where('id', $productoId)->value('foto_url');
        $this->assertStringStartsWith("catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/{$productoId}/", $key);
        $this->assertTrue(Storage::disk('s3')->exists($key));
        $this->assertStringEndsWith($key, $respuesta->json('datos.foto_url'));
        $this->assertStringStartsWith('http', $respuesta->json('datos.foto_url'));
        $this->assertSame('catalogo', DB::table('archivo')->where('object_key', $key)->value('visibilidad'));
    }

    public function test_reemplazar_foto_elimina_la_anterior(): void
    {
        $productoId = $this->crearProducto();
        $this->subir($productoId, $this->archivo($this->png(400, 400)))->assertOk();
        $primera = DB::table('producto')->where('id', $productoId)->value('foto_url');

        $this->subir($productoId, $this->archivo($this->png(500, 500)))->assertOk();

        $segunda = DB::table('producto')->where('id', $productoId)->value('foto_url');
        $this->assertNotSame($primera, $segunda);
        $this->assertFalse(Storage::disk('s3')->exists($primera));
        $this->assertFalse(Storage::disk('s3')->exists(str_replace('.webp', '_thumb.webp', $primera)), 'La miniatura anterior debe borrarse.');
        $this->assertTrue(Storage::disk('s3')->exists($segunda));
        $this->assertTrue(Storage::disk('s3')->exists(str_replace('.webp', '_thumb.webp', $segunda)));
        $this->assertSame('eliminado', DB::table('archivo')->where('object_key', $primera)->value('estado'));
    }

    public function test_cada_cambio_de_foto_queda_en_la_auditoria(): void
    {
        $productoId = $this->crearProducto();

        $this->subir($productoId, $this->archivo($this->png(400, 400)))->assertOk();
        $key = DB::table('producto')->where('id', $productoId)->value('foto_url');
        $this->delete("/api/v1/admin/productos/{$productoId}/foto", [], $this->headers())->assertOk();

        $registros = DB::table('log_auditoria')->where('entidad_id', $productoId)->orderBy('fecha')->get();
        $this->assertSame(['PRODUCTO_FOTO_ACTUALIZADA', 'PRODUCTO_FOTO_ELIMINADA'], $registros->pluck('accion')->all());
        $this->assertSame($this->adminId, $registros[0]->usuario_id);
        $this->assertSame($this->localId, $registros[0]->local_id);
        $this->assertSame($key, json_decode($registros[0]->detalle, true)['foto_nueva']);
        $this->assertNull(json_decode($registros[0]->detalle, true)['foto_anterior']);
        $this->assertSame($key, json_decode($registros[1]->detalle, true)['foto_anterior']);
        $this->assertNull(json_decode($registros[1]->detalle, true)['foto_nueva']);
    }

    public function test_un_rechazo_de_foto_no_deja_auditoria(): void
    {
        $productoId = $this->crearProducto();

        $this->subir($productoId, $this->archivo('%PDF-1.4 falso', 'plato.jpg'))->assertStatus(422);

        $this->assertSame(0, DB::table('log_auditoria')->where('entidad_id', $productoId)->count());
    }

    public function test_reemplazar_una_url_externa_no_falla_ni_borra_nada(): void
    {
        $productoId = $this->crearProducto('https://images.unsplash.com/foto.jpg');

        $this->subir($productoId, $this->archivo($this->png(400, 400)))->assertOk();

        $this->assertStringStartsWith('catalogo/', DB::table('producto')->where('id', $productoId)->value('foto_url'));
    }

    public function test_rechaza_archivos_invalidos_y_no_modifica_el_producto(): void
    {
        $productoId = $this->crearProducto();

        $casos = [
            'no es imagen' => $this->archivo('%PDF-1.4 no soy una imagen', 'plato.jpg'),
            'demasiado pequeña' => $this->archivo($this->png(100, 100)),
            'demasiado grande en píxeles' => $this->archivo($this->png(4100, 400)),
        ];

        foreach ($casos as $descripcion => $foto) {
            $this->subir($productoId, $foto)
                ->assertStatus(422)
                ->assertJsonPath('errores.0.codigo', 'ERR_FOTO_INVALIDA');
        }

        $this->assertNull(DB::table('producto')->where('id', $productoId)->value('foto_url'));
        $this->assertSame(0, DB::table('archivo')->where('entidad_id', $productoId)->count());
    }

    public function test_exige_el_campo_foto(): void
    {
        $productoId = $this->crearProducto();

        $this->post("/api/v1/admin/productos/{$productoId}/foto", [], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_FOTO_INVALIDA');
    }

    public function test_no_permite_subir_foto_a_producto_de_otro_local(): void
    {
        $productoId = $this->crearProducto();
        $otroLocal = '1a89370a-0425-4cfc-9d7f-74e83e0523f7';
        $otraEmpresa = DB::table('local')->where('id', $otroLocal)->value('empresa_id');

        $this->subir($productoId, $this->archivo($this->png(400, 400)), $this->headers($otroLocal, $otraEmpresa))
            ->assertNotFound()
            ->assertJsonPath('errores.0.codigo', 'ERR_PRODUCTO_NO_ENCONTRADO');

        $this->assertNull(DB::table('producto')->where('id', $productoId)->value('foto_url'));
        $this->assertSame(0, DB::table('archivo')->where('entidad_id', $productoId)->count());
    }

    public function test_producto_archivado_responde_404_y_no_deja_objetos(): void
    {
        $productoId = $this->crearProducto();
        DB::table('producto')->where('id', $productoId)->update(['activo' => false]);

        $this->subir($productoId, $this->archivo($this->png(400, 400)))->assertNotFound();

        $this->assertSame(0, DB::table('archivo')->where('entidad_id', $productoId)->count());
    }

    public function test_quitar_foto_deja_foto_url_nula_y_borra_el_objeto(): void
    {
        $productoId = $this->crearProducto();
        $this->subir($productoId, $this->archivo($this->png(400, 400)))->assertOk();
        $key = DB::table('producto')->where('id', $productoId)->value('foto_url');

        $this->delete("/api/v1/admin/productos/{$productoId}/foto", [], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.foto_url', null);

        $this->assertNull(DB::table('producto')->where('id', $productoId)->value('foto_url'));
        $this->assertFalse(Storage::disk('s3')->exists($key));
    }

    public function test_patch_de_datos_conserva_la_foto_aunque_envien_foto_url(): void
    {
        $productoId = $this->crearProducto();
        $this->subir($productoId, $this->archivo($this->png(400, 400)))->assertOk();
        $key = DB::table('producto')->where('id', $productoId)->value('foto_url');
        $producto = DB::table('producto')->where('id', $productoId)->first();

        $this->patchJson("/api/v1/admin/productos/{$productoId}", [
            'categoria_id' => $producto->categoria_id,
            'nombre' => $producto->nombre,
            'precio' => 30,
            'requiere_preparacion' => true,
            'foto_url' => 'https://evil.example/x.jpg',
        ], $this->headers())->assertOk();

        $this->assertSame($key, DB::table('producto')->where('id', $productoId)->value('foto_url'));
    }
}
