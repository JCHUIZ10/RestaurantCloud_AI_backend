<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CartaExportarTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    /** @return array<string, mixed> */
    private function exportar(string $localId): array
    {
        $this->assertSame(0, Artisan::call('carta:exportar', ['local_id' => $localId]));

        return json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
    }

    public function test_entrega_la_carta_los_mozos_y_las_promociones_del_local(): void
    {
        $carta = $this->exportar($this->localId);

        $this->assertSame($this->empresaId, $carta['empresa_id']);
        $this->assertSame($this->localId, $carta['local_id']);

        $this->assertGreaterThanOrEqual(20, count($carta['productos']));
        $this->assertSame(
            ['producto_id', 'nombre', 'categoria_id', 'categoria_nombre', 'precio', 'costo_estandar'],
            array_keys($carta['productos'][0]),
        );
        $ceviche = collect($carta['productos'])->firstWhere('producto_id', '00000000-0000-4000-8000-000000000431');
        $this->assertSame('Ceviche Clásico', $ceviche['nombre']);
        $this->assertSame('Entradas', $ceviche['categoria_nombre']);
        $this->assertEquals(38.00, $ceviche['precio']);

        $this->assertGreaterThanOrEqual(3, count($carta['mozos']));
        $this->assertSame(['id', 'nombre'], array_keys($carta['mozos'][0]));

        $promocion = collect($carta['promociones'])->firstWhere('id', '00000000-0000-4000-8000-000000000441');
        $this->assertSame('porcentaje', $promocion['tipo_descuento']);
        $this->assertSame([1, 2, 3, 4, 5], $promocion['dias_semana']);
        $this->assertSame('12:00:00', $promocion['hora_inicio']);
        $this->assertSame('16:00:00', $promocion['hora_fin']);
        $this->assertEquals(15.00, $promocion['valor']);
        $this->assertEquals(50.00, $promocion['monto_minimo_consumo']);
    }

    public function test_no_incluye_productos_inactivos_ni_mozos_inactivos_ni_promociones_apagadas(): void
    {
        DB::statement("SELECT set_config('app.current_user_role', 'admin_saas', true)");
        DB::table('producto')->where('id', '00000000-0000-4000-8000-000000000431')->update(['activo' => false]);
        DB::table('usuario')->where('id', '00000000-0000-4000-8000-000000000106')->update(['estado' => 'inactivo']);
        DB::table('promocion')->where('id', '00000000-0000-4000-8000-000000000441')->update(['activa' => false]);

        $carta = $this->exportar($this->localId);

        $this->assertNotContains('00000000-0000-4000-8000-000000000431', array_column($carta['productos'], 'producto_id'));
        $this->assertNotContains('00000000-0000-4000-8000-000000000106', array_column($carta['mozos'], 'id'));
        $this->assertNotContains('00000000-0000-4000-8000-000000000441', array_column($carta['promociones'], 'id'));
    }

    public function test_el_rol_de_plataforma_no_queda_en_la_conexion(): void
    {
        $this->exportar($this->localId);

        $this->assertNotSame('admin_saas', DB::scalar("SELECT current_setting('app.current_user_role', true)"));
    }

    public function test_falla_si_el_local_no_existe_o_el_id_no_es_un_uuid(): void
    {
        $this->artisan('carta:exportar', ['local_id' => '00000000-0000-4000-8000-0000000000ff'])
            ->expectsOutputToContain('No existe el local')
            ->assertFailed();

        $this->artisan('carta:exportar', ['local_id' => 'no-es-un-uuid'])
            ->expectsOutputToContain('no es un UUID')
            ->assertFailed();
    }
}
