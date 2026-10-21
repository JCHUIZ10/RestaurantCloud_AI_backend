<?php

namespace Tests\Feature;

use App\Console\Commands\InitTenantStorageCommand;
use App\Domains\Archivos\Services\TenantStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantStorageTest extends TestCase
{
    private TenantStorageService $service;
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(TenantStorageService::class);
    }

    /**
     * Test 1: Las claves canónicas generadas cumplen con la especificación de ESTRATEGIA_ARCHIVOS_MINIO.md
     */
    public function test_generadores_de_keys_cumplen_especificacion_estrategia_archivos_minio(): void
    {
        $archivoId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
        $entidadId = 'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e';

        // 1. Producto (Catálogo)
        $keyProducto = $this->service->generarKeyProducto($this->empresaId, $this->localId, $entidadId, 'webp', $archivoId);
        $this->assertEquals(
            "catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/{$entidadId}/{$archivoId}.webp",
            $keyProducto
        );

        // 2. Incidente (Privado)
        $keyIncidente = $this->service->generarKeyIncidente($this->empresaId, $this->localId, $entidadId, 'jpg', $archivoId);
        $this->assertEquals(
            "privado/empresas/{$this->empresaId}/locales/{$this->localId}/incidentes/{$entidadId}/{$archivoId}.jpg",
            $keyIncidente
        );

        // 3. Comprobante (Privado)
        $keyComprobante = $this->service->generarKeyComprobante($this->empresaId, $this->localId, $entidadId, 'pdf', $archivoId);
        $this->assertEquals(
            "privado/empresas/{$this->empresaId}/locales/{$this->localId}/comprobantes/{$entidadId}/{$archivoId}.pdf",
            $keyComprobante
        );

        // 4. Reporte Z (Privado, fijo .pdf)
        $keyReporteZ = $this->service->generarKeyReporteZ($this->empresaId, $this->localId, $entidadId, $archivoId);
        $this->assertEquals(
            "privado/empresas/{$this->empresaId}/locales/{$this->localId}/reportes-z/{$entidadId}/{$archivoId}.pdf",
            $keyReporteZ
        );

        // 5. Portabilidad (Privado, fijo .zip, sin local)
        $keyPortabilidad = $this->service->generarKeyPortabilidad($this->empresaId, $entidadId, $archivoId);
        $this->assertEquals(
            "privado/empresas/{$this->empresaId}/portabilidad/{$entidadId}/{$archivoId}.zip",
            $keyPortabilidad
        );

        // 6. Exportación Temporal (Privado, con prefijo temporales/exportaciones)
        $keyExportacion = $this->service->generarKeyExportacionTemporal($this->empresaId, $entidadId, 'xlsx', $archivoId);
        $this->assertEquals(
            "privado/empresas/{$this->empresaId}/temporales/exportaciones/{$entidadId}/{$archivoId}.xlsx",
            $keyExportacion
        );
    }

    /**
     * Test 2: Si no se provee un archivo_id, se autogenera un UUID válido
     */
    public function test_generadores_autogeneran_uuid_si_no_se_provee(): void
    {
        $key = $this->service->generarKeyProducto($this->empresaId, $this->localId, 'prod-123', 'png');

        $this->assertStringStartsWith("catalogo/empresas/{$this->empresaId}/locales/{$this->localId}/productos/prod-123/", $key);
        $this->assertStringEndsWith('.png', $key);
    }

    /**
     * Test 3: Generación de URL firmada temporal de descarga
     */
    public function test_generar_url_descarga_temporal_genera_url_firmada_valida(): void
    {
        $url = $this->service->generarUrlDescargaTemporal("privado/empresas/{$this->empresaId}/documento.pdf", 15);

        $this->assertStringContainsString('restaurantcloud/privado/empresas/', $url);
        $this->assertStringContainsString('X-Amz-Signature=', $url);
        $this->assertStringContainsString('X-Amz-Expires=', $url);
    }

    /**
     * Test 4: Comando tenant:init-storage con --test inicializa Áurea y evita duplicidad
     */
    public function test_comando_init_storage_inicializa_empresa_de_prueba_y_evita_duplicidad(): void
    {
        $manifestKey = "tenants/{$this->empresaId}/manifest.json";

        // Limpieza previa controlada para simular empresa de prueba recién sembrada
        Storage::disk('s3')->delete($manifestKey);
        DB::table('archivo')->where('empresa_id', $this->empresaId)->where('object_key', $manifestKey)->delete();

        $this->assertFalse($this->service->estaInicializado($this->empresaId));

        // 1. Primera ejecución: Debe aprovisionar el espacio
        $this->artisan('tenant:init-storage', ['--test' => true])
            ->expectsOutputToContain("Inicializando espacio MinIO para 'Restaurante ÁUREA S.A.C.'")
            ->expectsOutputToContain('✓ Espacio de almacenamiento MinIO registrado exitosamente')
            ->assertExitCode(0);

        // Validar en MinIO y en DB
        $this->assertTrue(Storage::disk('s3')->exists($manifestKey));
        $this->assertTrue($this->service->estaInicializado($this->empresaId));

        $archivoBd = DB::table('archivo')->where('empresa_id', $this->empresaId)->where('object_key', $manifestKey)->first();
        $this->assertNotNull($archivoBd);
        $this->assertEquals('privado', $archivoBd->visibilidad);
        $this->assertEquals('tenant_manifest', $archivoBd->entidad_tipo);
        $this->assertEquals($this->empresaId, $archivoBd->entidad_id);

        // 2. Segunda ejecución: Debe detectar que ya existe y evitar duplicidad (requisito del usuario)
        $this->artisan('tenant:init-storage', ['--test' => true])
            ->expectsOutputToContain("ya cuenta con su espacio MinIO inicializado")
            ->expectsOutputToContain("Omitiendo para evitar duplicidad")
            ->assertExitCode(0);
    }

    /**
     * Test 5: Inicialización de espacio de local en MinIO genera manifiesto y registro en archivo
     */
    public function test_inicializar_espacio_local_genera_manifiesto_minio_y_registro_archivo(): void
    {
        $manifestKey = "tenants/{$this->empresaId}/locales/{$this->localId}/manifest.json";

        // Limpieza previa
        Storage::disk('s3')->delete($manifestKey);
        DB::table('archivo')
            ->where('empresa_id', $this->empresaId)
            ->where('object_key', $manifestKey)
            ->delete();

        $this->assertFalse($this->service->estaLocalInicializado($this->empresaId, $this->localId));

        $metadata = [
            'nombre' => 'ÁUREA Miraflores',
            'slug' => 'aurea-miraflores',
            'giro_negocio' => 'cevicheria',
        ];

        $resultado = $this->service->inicializarEspacioLocal($this->empresaId, $this->localId, $metadata);
        $this->assertTrue($resultado);

        // 1. Validar en MinIO S3
        $this->assertTrue(Storage::disk('s3')->exists($manifestKey));
        $this->assertTrue($this->service->estaLocalInicializado($this->empresaId, $this->localId));

        // 2. Validar contenido del manifiesto
        $manifiesto = $this->service->obtenerManifiestoLocal($this->empresaId, $this->localId);
        $this->assertNotNull($manifiesto);
        $this->assertEquals($this->empresaId, $manifiesto['empresa_id']);
        $this->assertEquals($this->localId, $manifiesto['local_id']);
        $this->assertEquals('ÁUREA Miraflores', $manifiesto['metadata']['nombre']);
        $this->assertEquals('cevicheria', $manifiesto['metadata']['giro_negocio']);
        $this->assertArrayHasKey('prefijos_asignados', $manifiesto);
        $this->assertStringContainsString("locales/{$this->localId}/productos/", $manifiesto['prefijos_asignados']['catalogo_productos']);

        // 3. Validar en PostgreSQL (tabla archivo)
        $archivoBd = DB::table('archivo')
            ->where('empresa_id', $this->empresaId)
            ->where('object_key', $manifestKey)
            ->first();

        $this->assertNotNull($archivoBd);
        $this->assertEquals($this->localId, $archivoBd->local_id);
        $this->assertEquals('privado', $archivoBd->visibilidad);
        $this->assertEquals('local_manifest', $archivoBd->entidad_tipo);
        $this->assertEquals($this->localId, $archivoBd->entidad_id);
        $this->assertEquals('manifest.json', $archivoBd->nombre_original);
        $this->assertEquals('application/json', $archivoBd->mime_type);
        $this->assertEquals('disponible', $archivoBd->estado);
    }
}
