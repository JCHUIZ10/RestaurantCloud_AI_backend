<?php

namespace Tests\Feature;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Domains\Carta\Services\CartaPublicaService;
use App\Domains\Inventario\Services\InsumoService;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class CartaPublicaTest extends TestCase
{
    private const CLAVES_INTERNAS = [
        'costo_estandar', 'costo_teorico', 'margen_bruto_pct', 'receta', 'motivo_agotado',
        'requiere_preparacion', 'empresa_id', 'local_id', 'codigo', 'limite_usos', 'usos_actuales',
    ];

    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $slug = 'aurea-miraflores';

    /** @var list<string> */
    private array $categorias = [];

    /** @var list<string> */
    private array $productos = [];

    /** @var list<string> */
    private array $promociones = [];

    /** @var list<string> */
    private array $clavesSubidas = [];

    protected function setUp(): void
    {
        parent::setUp();

        // La caché puede ser Redis compartido entre tests: se descarta solo la clave de esta sede.
        CartaPublicaService::invalidar($this->localId);
    }

    protected function tearDown(): void
    {
        CartaPublicaService::invalidar($this->localId);
        Carbon::setTestNow();
        foreach ($this->clavesSubidas as $clave) {
            Storage::disk('s3')->delete($clave);
            DB::table('archivo')->where('object_key', $clave)->delete();
        }
        DB::table('promocion')->whereIn('id', $this->promociones)->delete();
        DB::table('producto')->whereIn('id', $this->productos)->delete();
        DB::table('categoria_producto')->whereIn('id', $this->categorias)->delete();
        DB::table('horario_excepcion')->where('local_id', $this->localId)->where('motivo', 'like', 'Test carta%')->delete();
        DB::table('local')->where('id', $this->localId)->update(['estado' => 'activo']);

        parent::tearDown();
    }

    private function crearCategoria(bool $activa = true): string
    {
        $id = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'nombre' => 'Cat Test '.Str::random(8),
            'orden' => 900 + count($this->categorias),
            'activa' => $activa,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->categorias[] = $id;

        return $id;
    }

    private function crearProducto(string $categoriaId, array $atributos = []): string
    {
        $id = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'categoria_id' => $categoriaId,
            'nombre' => 'Plato Test '.Str::random(8),
            'precio' => 31.50,
            'costo_estandar' => 7.25,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
            ...$atributos,
        ]);
        $this->productos[] = $id;

        return $id;
    }

    private function crearPromocion(array $atributos = []): string
    {
        $id = (string) Str::uuid();
        DB::table('promocion')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'codigo' => 'T'.strtoupper(Str::random(8)),
            'nombre' => 'Promo Test '.Str::random(8),
            'tipo_descuento' => 'porcentaje',
            'valor' => 10,
            'dias_semana' => '{1,2,3,4,5,6,7}',
            'fecha_inicio' => Carbon::now('America/Lima')->subDay()->toDateString(),
            'fecha_fin' => Carbon::now('America/Lima')->addDays(5)->toDateString(),
            'tipo_limite_usos' => 'sin_limite',
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
            ...$atributos,
        ]);
        $this->promociones[] = $id;

        return $id;
    }

    private function carta(): TestResponse
    {
        return $this->getJson("/api/v1/public/locales/{$this->slug}/carta");
    }

    /** @return array<string, mixed>|null */
    private function categoriaEnRespuesta(TestResponse $respuesta, string $id): ?array
    {
        return collect($respuesta->json('datos.categorias'))->firstWhere('id', $id);
    }

    public function test_devuelve_la_carta_de_la_sede_con_la_forma_que_espera_el_frontend(): void
    {
        $categoriaId = $this->crearCategoria();
        $productoId = $this->crearProducto($categoriaId, ['descripcion' => 'Con ají limo']);

        $respuesta = $this->carta()->assertOk()->assertJsonPath('exito', true);

        $respuesta->assertJsonStructure(['datos' => [
            'sede' => ['id', 'nombre', 'slug', 'direccion', 'distrito', 'telefono', 'moneda', 'horario', 'abierto'],
            'promociones',
            'categorias',
        ]]);
        $respuesta->assertJsonPath('datos.sede.slug', $this->slug);

        $plato = collect($this->categoriaEnRespuesta($respuesta, $categoriaId)['platos'])->firstWhere('id', $productoId);
        $this->assertSame('Con ají limo', $plato['descripcion']);
        $this->assertSame(31.5, $plato['precio']);
        $this->assertSame('disponible', $plato['disponibilidad']);
        $this->assertSame(['id', 'nombre', 'descripcion', 'precio', 'foto_url', 'foto_thumb_url', 'disponibilidad'], array_keys($plato));
    }

    public function test_incluye_miniatura_solo_en_las_fotos_que_la_tienen(): void
    {
        $categoriaId = $this->crearCategoria();
        $imagen = imagecreatetruecolor(400, 400);
        ob_start();
        imagepng($imagen);
        $ruta = tempnam(sys_get_temp_dir(), 'foto');
        file_put_contents($ruta, ob_get_clean());

        $conMiniatura = $this->crearProducto($categoriaId);
        $subida = app(TenantStorageService::class)->guardarFotoProducto(
            $this->empresaId,
            $this->localId,
            $conMiniatura,
            new UploadedFile($ruta, 'plato.png', null, null, true),
        );
        DB::table('producto')->where('id', $conMiniatura)->update(['foto_url' => $subida['object_key']]);
        $this->clavesSubidas = array_filter([$subida['object_key'], $subida['miniatura_key']]);

        // Foto WebP anterior a las miniaturas y foto externa de las semillas: sin miniatura.
        $anterior = $this->crearProducto($categoriaId, ['foto_url' => "catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/x/anterior.webp"]);
        $externa = $this->crearProducto($categoriaId, ['foto_url' => 'https://images.unsplash.com/foto.jpg']);

        $platos = collect($this->categoriaEnRespuesta($this->carta()->assertOk(), $categoriaId)['platos'])->keyBy('id');
        @unlink($ruta);

        $this->assertStringEndsWith($subida['miniatura_key'], $platos[$conMiniatura]['foto_thumb_url']);
        $this->assertStringEndsWith($subida['object_key'], $platos[$conMiniatura]['foto_url']);
        $this->assertNull($platos[$anterior]['foto_thumb_url']);
        $this->assertNotNull($platos[$anterior]['foto_url']);
        $this->assertNull($platos[$externa]['foto_thumb_url']);
    }

    public function test_no_expone_costos_recetas_ni_identificadores_internos(): void
    {
        $this->crearProducto($this->crearCategoria());

        $datos = $this->carta()->assertOk()->json('datos');
        $claves = [];
        array_walk_recursive(
            $datos,
            function ($valor, $clave) use (&$claves): void {
                $claves[] = $clave;
            },
        );

        $this->assertSame([], array_values(array_intersect(self::CLAVES_INTERNAS, $claves)));
    }

    public function test_omite_categorias_inactivas_vacias_y_productos_archivados(): void
    {
        $inactiva = $this->crearCategoria(activa: false);
        $this->crearProducto($inactiva);
        $vacia = $this->crearCategoria();
        $conArchivado = $this->crearCategoria();
        $archivado = $this->crearProducto($conArchivado, ['activo' => false]);
        $visible = $this->crearProducto($conArchivado);

        $respuesta = $this->carta()->assertOk();

        $this->assertNull($this->categoriaEnRespuesta($respuesta, $inactiva));
        $this->assertNull($this->categoriaEnRespuesta($respuesta, $vacia));
        $ids = collect($this->categoriaEnRespuesta($respuesta, $conArchivado)['platos'])->pluck('id')->all();
        $this->assertSame([$visible], $ids);
        $this->assertNotContains($archivado, $ids);
    }

    public function test_resuelve_la_foto_a_url_publica_y_respeta_urls_externas(): void
    {
        $categoriaId = $this->crearCategoria();
        $key = "catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/x/foto.webp";
        $propia = $this->crearProducto($categoriaId, ['foto_url' => $key]);
        $externa = $this->crearProducto($categoriaId, ['foto_url' => 'https://images.unsplash.com/foto.jpg']);
        $sinFoto = $this->crearProducto($categoriaId);

        $platos = collect($this->categoriaEnRespuesta($this->carta()->assertOk(), $categoriaId)['platos'])->keyBy('id');

        $this->assertStringStartsWith('http', $platos[$propia]['foto_url']);
        $this->assertStringEndsWith($key, $platos[$propia]['foto_url']);
        $this->assertSame('https://images.unsplash.com/foto.jpg', $platos[$externa]['foto_url']);
        $this->assertNull($platos[$sinFoto]['foto_url']);
    }

    public function test_slug_inexistente_invalido_o_de_local_inactivo_responde_404(): void
    {
        $this->getJson('/api/v1/public/locales/no-existe-este-local/carta')
            ->assertNotFound()
            ->assertJsonPath('errores.0.codigo', 'ERR_CARTA_NO_ENCONTRADA');
        $this->getJson('/api/v1/public/locales/SLUG_INVALIDO!/carta')->assertNotFound();

        DB::table('local')->where('id', $this->localId)->update(['estado' => 'inactivo']);

        $this->carta()->assertNotFound()->assertJsonPath('errores.0.codigo', 'ERR_CARTA_NO_ENCONTRADA');
    }

    public function test_solo_muestra_promociones_vigentes_hoy(): void
    {
        $hoy = Carbon::now('America/Lima');
        $vigente = $this->crearPromocion();
        $vencida = $this->crearPromocion(['fecha_inicio' => $hoy->copy()->subDays(9)->toDateString(), 'fecha_fin' => $hoy->copy()->subDays(2)->toDateString()]);
        $programada = $this->crearPromocion(['fecha_inicio' => $hoy->copy()->addDays(2)->toDateString(), 'fecha_fin' => $hoy->copy()->addDays(8)->toDateString()]);
        $pausada = $this->crearPromocion(['activa' => false]);
        $agotada = $this->crearPromocion(['tipo_limite_usos' => 'global', 'limite_usos' => 5, 'usos_actuales' => 5]);
        $otrosDias = collect([1, 2, 3, 4, 5, 6, 7])->reject(fn ($dia) => $dia === $hoy->dayOfWeekIso)->implode(',');
        $otroDia = $this->crearPromocion(['dias_semana' => '{'.$otrosDias.'}']);

        $ids = collect($this->carta()->assertOk()->json('datos.promociones'))->pluck('id')->all();

        $this->assertContains($vigente, $ids);
        foreach ([$vencida, $programada, $pausada, $agotada, $otroDia] as $oculta) {
            $this->assertNotContains($oculta, $ids);
        }
    }

    public function test_calcula_horario_y_si_esta_abierto_considerando_excepciones(): void
    {
        // Miércoles 4 de noviembre de 2026.
        $fecha = '2026-11-04';
        DB::table('horario_excepcion')->where('local_id', $this->localId)->where('fecha', $fecha)->delete();
        DB::table('horario_excepcion')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'fecha' => $fecha,
            'cerrado' => false,
            'hora_inicio' => '12:00',
            'hora_fin' => '23:00',
            'motivo' => 'Test carta horario especial',
            'created_at' => now(),
        ]);

        Carbon::setTestNow(Carbon::parse("{$fecha} 13:00", 'America/Lima'));
        $this->carta()->assertOk()
            ->assertJsonPath('datos.sede.horario', '12:00 PM - 11:00 PM')
            ->assertJsonPath('datos.sede.abierto', true);

        CartaPublicaService::invalidar($this->localId);
        Carbon::setTestNow(Carbon::parse("{$fecha} 10:00", 'America/Lima'));
        $this->carta()->assertOk()->assertJsonPath('datos.sede.abierto', false);

        DB::table('horario_excepcion')->where('local_id', $this->localId)->where('fecha', $fecha)
            ->update(['cerrado' => true, 'hora_inicio' => null, 'hora_fin' => null]);
        CartaPublicaService::invalidar($this->localId);
        Carbon::setTestNow(Carbon::parse("{$fecha} 13:00", 'America/Lima'));
        $this->carta()->assertOk()
            ->assertJsonPath('datos.sede.horario', 'Cerrado hoy')
            ->assertJsonPath('datos.sede.abierto', false);
    }

    public function test_cambiar_la_disponibilidad_desde_admin_invalida_la_carta_cacheada(): void
    {
        $categoriaId = $this->crearCategoria();
        $productoId = $this->crearProducto($categoriaId);

        $antes = collect($this->categoriaEnRespuesta($this->carta()->assertOk(), $categoriaId)['platos'])->firstWhere('id', $productoId);
        $this->assertSame('disponible', $antes['disponibilidad']);

        $this->patchJson("/api/v1/admin/productos/{$productoId}/disponibilidad", ['disponibilidad' => 'agotado'], $this->headersAdmin())
            ->assertOk();

        $despues = collect($this->categoriaEnRespuesta($this->carta()->assertOk(), $categoriaId)['platos'])->firstWhere('id', $productoId);
        $this->assertSame('agotado', $despues['disponibilidad']);
    }

    public function test_quiebre_de_stock_en_funcion_de_inventario_invalida_la_carta_cacheada(): void
    {
        $categoriaId = $this->crearCategoria();
        $productoId = $this->crearProducto($categoriaId);
        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Insumo Test '.Str::random(6),
            'unidad_medida' => 'kg',
            'stock_actual' => 5,
            'stock_minimo' => 1,
            'costo_unitario' => 10,
        ]);
        DB::table('producto_insumo')->insert([
            'producto_id' => $productoId,
            'insumo_id' => $insumoId,
            'modo_calculo' => 'exacto',
            'cantidad_descuenta' => 0.5,
        ]);
        $this->carta()->assertOk();

        // fn_inventario_ajustar_stock agota el plato dentro de PostgreSQL, sin pasar por ProductoService
        app(InsumoService::class)->ajustarStock($insumoId, $this->localId, $this->adminId, [
            'stock_fisico' => 0,
            'motivo' => 'conteo_fisico_inventario',
        ]);

        $plato = collect($this->categoriaEnRespuesta($this->carta()->assertOk(), $categoriaId)['platos'])->firstWhere('id', $productoId);
        $this->assertSame('agotado', $plato['disponibilidad']);
    }

    public function test_la_segunda_consulta_se_sirve_desde_cache_sin_releer_productos(): void
    {
        $categoriaId = $this->crearCategoria();
        $productoId = $this->crearProducto($categoriaId);
        $this->carta()->assertOk();

        // Cambio directo en BD, sin pasar por los servicios: la carta cacheada no lo ve hasta que expire.
        DB::table('producto')->where('id', $productoId)->update(['disponibilidad' => 'agotado']);

        $plato = collect($this->categoriaEnRespuesta($this->carta()->assertOk(), $categoriaId)['platos'])->firstWhere('id', $productoId);
        $this->assertSame('disponible', $plato['disponibilidad']);
    }

    private function headersAdmin(): array
    {
        $token = 'test_token_carta_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => 'admin@aurea.local',
            'rol' => 'admin_local',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }
}
