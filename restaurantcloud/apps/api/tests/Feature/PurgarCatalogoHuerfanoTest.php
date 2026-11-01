<?php

namespace Tests\Feature;

use App\Models\Archivo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class PurgarCatalogoHuerfanoTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    /** @var list<string> */
    private array $keys = [];

    /** @var list<string> */
    private array $productos = [];

    protected function tearDown(): void
    {
        foreach ($this->keys as $key) {
            Storage::disk('s3')->delete($key);
            DB::table('archivo')->where('object_key', $key)->delete();
        }
        DB::table('producto')->whereIn('id', $this->productos)->delete();

        parent::tearDown();
    }

    /** Crea el objeto en MinIO y su registro, con la antigüedad indicada. */
    private function crearFoto(
        string $tipo = 'producto',
        string $estado = 'disponible',
        int $horasDeAntiguedad = 0,
        ?string $key = null,
        ?string $productoId = null,
    ): Archivo {
        $productoId ??= (string) Str::uuid();
        $key ??= "catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/{$productoId}/".Str::uuid().'.webp';
        Storage::disk('s3')->put($key, 'contenido-de-prueba');
        $this->keys[] = $key;

        $archivo = Archivo::create([
            'id' => (string) Str::uuid(),
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'bucket' => 'restaurantcloud',
            'object_key' => $key,
            'nombre_original' => 'plato.png',
            'mime_type' => 'image/webp',
            'tamanio_bytes' => 19,
            'visibilidad' => 'catalogo',
            'entidad_tipo' => $tipo,
            'entidad_id' => $productoId,
            'estado' => $estado,
        ]);
        $this->envejecer($archivo, $horasDeAntiguedad);

        return $archivo;
    }

    /** Un trigger de la tabla fuerza updated_at = NOW() en cada UPDATE: se suspende solo para simular antigüedad. */
    private function envejecer(Archivo $archivo, int $horas): void
    {
        $fecha = now()->subHours($horas);

        DB::statement('SET session_replication_role = replica');
        try {
            DB::table('archivo')->where('id', $archivo->id)->update(['created_at' => $fecha, 'updated_at' => $fecha]);
        } finally {
            DB::statement('SET session_replication_role = DEFAULT');
        }
    }

    private function crearProductoConFoto(string $key): string
    {
        $id = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'categoria_id' => DB::table('categoria_producto')->where('local_id', $this->localId)->value('id'),
            'nombre' => 'Plato Purga '.Str::random(6),
            'precio' => 10,
            'foto_url' => $key,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->productos[] = $id;

        return $id;
    }

    private function existe(Archivo $archivo): bool
    {
        return Storage::disk('s3')->exists($archivo->object_key);
    }

    public function test_borra_fotos_huerfanas_y_conserva_las_que_un_producto_usa(): void
    {
        $huerfana = $this->crearFoto(horasDeAntiguedad: 48);
        $miniaturaHuerfana = $this->crearFoto('producto_miniatura', horasDeAntiguedad: 48, key: str_replace('.webp', '_thumb.webp', $huerfana->object_key));

        $enUso = $this->crearFoto(horasDeAntiguedad: 48);
        $miniaturaEnUso = $this->crearFoto('producto_miniatura', horasDeAntiguedad: 48, key: str_replace('.webp', '_thumb.webp', $enUso->object_key));
        $this->crearProductoConFoto($enUso->object_key);

        $recienSubida = $this->crearFoto(horasDeAntiguedad: 1);

        $this->artisan('archivos:purgar-catalogo-huerfano')->assertExitCode(0);

        $this->assertFalse($this->existe($huerfana));
        $this->assertFalse($this->existe($miniaturaHuerfana));
        $this->assertSame('eliminado', $huerfana->fresh()->estado);
        $this->assertSame('eliminado', $miniaturaHuerfana->fresh()->estado);

        $this->assertTrue($this->existe($enUso), 'Una foto usada por un producto no se toca.');
        $this->assertTrue($this->existe($miniaturaEnUso), 'Su miniatura tampoco.');
        $this->assertSame('disponible', $enUso->fresh()->estado);

        $this->assertTrue($this->existe($recienSubida), 'Dentro del periodo de gracia podría estar subiéndose.');
        $this->assertSame('disponible', $recienSubida->fresh()->estado);
    }

    public function test_depura_los_eliminados_antiguos_aunque_su_objeto_siguiera_en_minio(): void
    {
        $antiguo = $this->crearFoto(estado: 'eliminado', horasDeAntiguedad: 24 * 10);
        $reciente = $this->crearFoto(estado: 'eliminado', horasDeAntiguedad: 24);

        $this->artisan('archivos:purgar-catalogo-huerfano')->assertExitCode(0);

        $this->assertFalse($this->existe($antiguo));
        $this->assertNull(Archivo::withTrashed()->find($antiguo->id), 'El registro debe retirarse por completo.');
        $this->assertTrue($this->existe($reciente));
        $this->assertNotNull(Archivo::find($reciente->id));
    }

    public function test_dry_run_informa_pero_no_borra_nada(): void
    {
        $huerfana = $this->crearFoto(horasDeAntiguedad: 48);
        $antiguo = $this->crearFoto(estado: 'eliminado', horasDeAntiguedad: 24 * 10);

        $this->artisan('archivos:purgar-catalogo-huerfano', ['--dry-run' => true])
            ->expectsOutputToContain($huerfana->object_key)
            ->expectsOutputToContain('[dry-run] Huérfanas:')
            ->assertExitCode(0);

        $this->assertTrue($this->existe($huerfana));
        $this->assertTrue($this->existe($antiguo));
        $this->assertSame('disponible', $huerfana->fresh()->estado);
        $this->assertNotNull(Archivo::find($antiguo->id));
    }

    public function test_el_comando_esta_programado_a_diario(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('archivos:purgar-catalogo-huerfano')->assertExitCode(0);
    }
}
