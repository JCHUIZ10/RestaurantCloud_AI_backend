<?php

namespace Tests\Feature\Propietario;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Domains\Tenant\Services\LocalService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LocalServiceTest extends TestCase
{
    private LocalService $service;
    private TenantStorageService $storageService;
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localMirafloresId = '00000000-0000-4000-8000-000000000010';

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(LocalService::class);
        $this->storageService = app(TenantStorageService::class);
    }

    /**
     * Test 1: listado retorna cuota del plan y locales con estructura de CU-PROP-04
     */
    public function test_listado_retorna_cuota_plan_y_locales_con_metricas(): void
    {
        $res = $this->service->listado($this->empresaId);

        $this->assertArrayHasKey('cuota_plan', $res);
        $this->assertArrayHasKey('locales', $res);

        $cuota = $res['cuota_plan'];
        $this->assertEquals(2, $cuota['plan_id']); // Plan Pro
        $this->assertEquals('Pro', $cuota['plan_nombre']);
        $this->assertEquals(3, $cuota['locales_permitidos']);
        $this->assertGreaterThanOrEqual(1, $cuota['locales_activos']);
        $this->assertArrayHasKey('cupos_disponibles', $cuota);

        $locales = $res['locales'];
        $this->assertNotEmpty($locales);

        $miraflores = collect($locales)->firstWhere('id', $this->localMirafloresId);
        $this->assertNotNull($miraflores);
        $this->assertEquals('ÁUREA Miraflores', $miraflores['nombre']);
        $this->assertEquals('aurea-miraflores', $miraflores['slug']);
        $this->assertEquals('/sede/aurea-miraflores/carta', $miraflores['url_carta_digital']);
        $this->assertArrayHasKey('metricas', $miraflores);
        $this->assertArrayHasKey('total_pisos', $miraflores['metricas']);
        $this->assertArrayHasKey('total_mesas', $miraflores['metricas']);
    }

    /**
     * Test 2: verificarDisponibilidad calcula cupos y lista administradores asignables
     */
    public function test_verificar_disponibilidad_retorna_cupos_y_admins(): void
    {
        $res = $this->service->verificarDisponibilidad($this->empresaId);

        $this->assertArrayHasKey('puede_crear', $res);
        $this->assertArrayHasKey('cupos_disponibles', $res);
        $this->assertArrayHasKey('max_permitido', $res);
        $this->assertArrayHasKey('administradores_disponibles', $res);

        $this->assertIsArray($res['administradores_disponibles']);
    }

    /**
     * Test 3: verificarSlug detecta colisión y genera sugerencia alternativa
     */
    public function test_verificar_slug_detecta_duplicado_y_genera_sugerencia(): void
    {
        // 1. Slug ya existente
        $colision = $this->service->verificarSlug('aurea-miraflores');
        $this->assertFalse($colision['disponible']);
        $this->assertNotNull($colision['sugerencia']);
        $this->assertEquals('aurea-miraflores-2', $colision['sugerencia']);

        // 2. Slug nuevo y disponible
        $nuevo = $this->service->verificarSlug('sede-nueva-san-borja');
        $this->assertTrue($nuevo['disponible']);
        $this->assertNull($nuevo['sugerencia']);
    }

    /**
     * Test 4: Aprovisionamiento atómico de sede con plantilla Pollería & Brasas
     */
    public function test_aprovisionar_local_con_plantilla_polleria_crea_ecosistema_completo_y_minio(): void
    {
        $slugTest = 'test-sede-polleria-' . time();

        $datos = [
            'nombre' => 'Test Pollería Brasas',
            'slug' => $slugTest,
            'direccion' => 'Av. Los Próceres 123',
            'ubigeo_cod' => '150140', // Santiago de Surco
            'departamento' => 'Lima',
            'provincia' => 'Lima',
            'distrito' => 'Santiago de Surco',
            'ciudad' => 'Lima',
            'referencia' => 'A media cuadra de la avenida',
            'telefono' => '+51 912 345 678',
            'modo_administracion' => 'propietario',
            'giro_negocio' => 'polleria',
        ];

        try {
            $nuevo = $this->service->crear($this->empresaId, $datos);
            $localId = $nuevo['id'];

            $this->assertNotEmpty($localId);
            $this->assertEquals($slugTest, $nuevo['slug']);
            $this->assertEquals('polleria', $nuevo['giro_negocio']);
            $this->assertTrue($nuevo['es_autogestionado']);
            $this->assertEquals(1, $nuevo['resumen_inicializacion']['pisos_creados']);
            $this->assertEquals(15, $nuevo['resumen_inicializacion']['mesas_creadas']);
            $this->assertEquals(5, $nuevo['resumen_inicializacion']['categorias_creadas']);
            $this->assertEquals(15, $nuevo['resumen_inicializacion']['insumos_creados']);

            // 1. Verificar registros en BD
            $this->assertTrue(DB::table('piso')->where('local_id', $localId)->exists());
            $this->assertEquals(15, DB::table('mesa')->where('local_id', $localId)->count());
            $this->assertEquals(5, DB::table('categoria_producto')->where('local_id', $localId)->count());
            $this->assertEquals(15, DB::table('insumo')->where('local_id', $localId)->count());
            $this->assertTrue(DB::table('configuracion_kds')->where('local_id', $localId)->exists());
            $this->assertTrue(DB::table('politicas_reserva')->where('local_id', $localId)->exists());
            $this->assertEquals(7, DB::table('horario_atencion')->where('local_id', $localId)->count());
            $this->assertEquals(3, DB::table('comprobante_serie')->where('local_id', $localId)->count());

            // 2. Verificar manifiesto en MinIO y metadatos en tabla archivo
            $this->assertTrue($this->storageService->estaLocalInicializado($this->empresaId, $localId));
            $manifiesto = $this->storageService->obtenerManifiestoLocal($this->empresaId, $localId);
            $this->assertNotNull($manifiesto);
            $this->assertEquals('polleria', $manifiesto['metadata']['giro_negocio']);

            $archivoBd = DB::table('archivo')
                ->where('empresa_id', $this->empresaId)
                ->where('local_id', $localId)
                ->where('entidad_tipo', 'local_manifest')
                ->first();
            $this->assertNotNull($archivoBd);

            // 3. Probar actualizar sede
            $actualizado = $this->service->actualizar($localId, $this->empresaId, [
                'nombre' => 'Test Pollería Actualizada',
                'direccion' => 'Av. Los Próceres 456',
                'telefono' => '+51 999 888 777',
            ]);
            $this->assertEquals('Test Pollería Actualizada', $actualizado['nombre']);
            $this->assertEquals('Av. Los Próceres 456', $actualizado['direccion']);

            // 4. Probar validarBaja sin bloqueos y cambiarEstado a inactivo
            $auditoria = $this->service->validarBaja($localId, $this->empresaId);
            $this->assertTrue($auditoria['puede_desactivar']);
            $this->assertFalse($auditoria['es_ultimo_local_activo']);

            $desactivado = $this->service->cambiarEstado($localId, $this->empresaId, 'inactivo');
            $this->assertEquals('inactivo', $desactivado['estado']);

            // 5. Probar reactivar
            $reactivado = $this->service->cambiarEstado($localId, $this->empresaId, 'activo');
            $this->assertEquals('activo', $reactivado['estado']);

        } finally {
            // Limpieza controlada del local creado durante el test
            if (isset($localId)) {
                Storage::disk('s3')->delete("tenants/{$this->empresaId}/locales/{$localId}/manifest.json");
                DB::table('local')->where('id', $localId)->delete();
            }
        }
    }

    /**
     * Test 5: No se puede desactivar la única sede activa de la empresa (Regla de Sede Única)
     */
    public function test_regla_de_sede_unica_impide_desactivar_ultimo_local_activo(): void
    {
        // En el escenario de prueba solo está ÁUREA Miraflores activa
        $auditoria = $this->service->validarBaja($this->localMirafloresId, $this->empresaId);

        $this->assertFalse($auditoria['puede_desactivar']);
        $this->assertTrue($auditoria['es_ultimo_local_activo']);
        $this->assertStringContainsString('única sede activa', $auditoria['aviso']);
    }
}
