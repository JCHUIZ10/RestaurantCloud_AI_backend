<?php

namespace Tests\Feature\Propietario;

use App\Domains\Archivos\Services\TenantStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class LocalTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localMirafloresId = '00000000-0000-4000-8000-000000000010';
    private string $propietarioId = '00000000-0000-4000-8000-000000000101';
    private string $propietarioCorreo = 'propietario@aurea.local';
    private string $tokenPropietario;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear sesión de prueba en Redis para el Propietario
        $rawToken = 'test_token_prop_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->propietarioId,
            'nombre' => 'Rodrigo De Las Casas',
            'correo' => $this->propietarioCorreo,
            'rol' => 'propietario',
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenPropietario = $rawToken;

        // Limpiar locales residuales de pruebas previas
        DB::table('local')
            ->where('empresa_id', $this->empresaId)
            ->where('id', '!=', $this->localMirafloresId)
            ->delete();
    }

    private function headers(string $token = null): array
    {
        return [
            'Authorization' => 'Bearer ' . ($token ?: $this->tokenPropietario),
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test 1: GET /propietario/locales lista las sedes y calcula métricas
     */
    public function test_propietario_puede_listar_locales_con_cuota_y_metricas(): void
    {
        $response = $this->getJson('/api/v1/propietario/locales', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'cuota_plan' => [
                    'plan_id',
                    'plan_nombre',
                    'locales_permitidos',
                    'locales_activos',
                    'cupos_disponibles',
                    'limite_alcanzado',
                ],
                'locales' => [
                    '*' => [
                        'id',
                        'empresa_id',
                        'nombre',
                        'slug',
                        'url_carta_digital',
                        'direccion',
                        'ubigeo_cod',
                        'departamento',
                        'provincia',
                        'distrito',
                        'telefono',
                        'giro_negocio',
                        'estado',
                        'es_autogestionado',
                        'metricas' => ['total_pisos', 'total_mesas'],
                        'puede_desactivar',
                    ],
                ],
            ],
            'meta' => ['timestamp'],
        ]);
    }

    /**
     * Test 2: GET /propietario/locales/verificar-disponibilidad
     */
    public function test_propietario_puede_consultar_disponibilidad_y_administradores(): void
    {
        $response = $this->getJson('/api/v1/propietario/locales/verificar-disponibilidad', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'puede_crear',
                'cupos_disponibles',
                'max_permitido',
                'administradores_disponibles',
            ],
            'meta' => ['timestamp'],
        ]);
    }

    /**
     * Test 3: GET /propietario/locales/verificar-slug
     */
    public function test_propietario_puede_verificar_slug_disponible_y_detectar_colisiones(): void
    {
        // 1. Slug duplicado
        $resDuplicado = $this->getJson('/api/v1/propietario/locales/verificar-slug?slug=aurea-miraflores', $this->headers());
        $resDuplicado->assertStatus(200);
        $resDuplicado->assertJsonPath('datos.disponible', false);
        $resDuplicado->assertJsonPath('datos.sugerencia', 'aurea-miraflores-2');

        // 2. Slug disponible
        $resDisponible = $this->getJson('/api/v1/propietario/locales/verificar-slug?slug=san-isidro-financiero', $this->headers());
        $resDisponible->assertStatus(200);
        $resDisponible->assertJsonPath('datos.disponible', true);
        $resDisponible->assertJsonPath('datos.sugerencia', null);
    }

    /**
     * Test 4: POST /propietario/locales crea sede con plantilla Chifa e inicializa MinIO
     */
    public function test_propietario_puede_crear_local_con_plantilla_chifa_e_inicializar_minio(): void
    {
        $slugTest = 'test-api-chifa-' . time();

        $payload = [
            'nombre' => 'Chifa Central Lima',
            'slug' => $slugTest,
            'direccion' => 'Av. Javier Prado Este 2050',
            'ubigeo_cod' => '150130', // San Borja
            'departamento' => 'Lima',
            'provincia' => 'Lima',
            'distrito' => 'San Borja',
            'ciudad' => 'Lima',
            'referencia' => 'Frente a la biblioteca',
            'telefono' => '+51 987 111 222',
            'modo_administracion' => 'propietario',
            'giro_negocio' => 'chifa',
        ];

        $response = $this->postJson('/api/v1/propietario/locales', $payload, $this->headers());

        $response->assertStatus(201);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.nombre', 'Chifa Central Lima');
        $response->assertJsonPath('datos.slug', $slugTest);
        $response->assertJsonPath('datos.giro_negocio', 'chifa');
        $response->assertJsonPath('datos.resumen_inicializacion.categorias_creadas', 5);
        $response->assertJsonPath('datos.resumen_inicializacion.insumos_creados', 15);

        $localId = $response->json('datos.id');
        $this->assertNotEmpty($localId);

        // Limpieza controlada
        Storage::disk('s3')->delete("tenants/{$this->empresaId}/locales/{$localId}/manifest.json");
        DB::table('local')->where('id', $localId)->delete();
    }

    /**
     * Test 5: POST /propietario/locales rechaza slug duplicado con HTTP 409
     */
    public function test_crear_local_rechaza_slug_duplicado(): void
    {
        $payload = [
            'nombre' => 'Áurea Duplicada',
            'slug' => 'aurea-miraflores',
            'direccion' => 'Av. Larco 450',
            'ubigeo_cod' => '150122',
            'telefono' => '+51 987 654 321',
            'modo_administracion' => 'propietario',
            'giro_negocio' => 'cevicheria',
        ];

        $response = $this->postJson('/api/v1/propietario/locales', $payload, $this->headers());

        $response->assertStatus(409);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'LOCAL_SLUG_DUPLICADO');
    }

    /**
     * Test 6: PUT /propietario/locales/{id} actualiza datos comerciales
     */
    public function test_propietario_puede_actualizar_local(): void
    {
        $payload = [
            'nombre' => 'ÁUREA Miraflores (Editado)',
            'slug' => 'aurea-miraflores',
            'direccion' => 'Av. Larco 452',
            'ubigeo_cod' => '150122',
            'telefono' => '+51 987 333 444',
            'modo_administracion' => 'propietario',
        ];

        $response = $this->putJson("/api/v1/propietario/locales/{$this->localMirafloresId}", $payload, $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.nombre', 'ÁUREA Miraflores (Editado)');
        $response->assertJsonPath('datos.direccion', 'Av. Larco 452');

        // Restaurar nombre original
        DB::table('local')->where('id', $this->localMirafloresId)->update([
            'nombre' => 'ÁUREA Miraflores',
            'direccion' => 'Av. Larco 450',
        ]);
    }

    /**
     * Test 7: GET /propietario/locales/{id}/validar-baja aplica regla de sede única
     */
    public function test_validar_baja_aplica_regla_de_sede_unica_si_es_ultimo_activo(): void
    {
        $response = $this->getJson("/api/v1/propietario/locales/{$this->localMirafloresId}/validar-baja", $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.puede_desactivar', false);
        $response->assertJsonPath('datos.es_ultimo_local_activo', true);
    }

    /**
     * Test 8: PATCH /propietario/locales/{id}/cambiar-estado rechaza desactivar con HTTP 422 si hay bloqueos
     */
    public function test_cambiar_estado_rechaza_desactivar_si_hay_bloqueo_operativo(): void
    {
        $response = $this->patchJson("/api/v1/propietario/locales/{$this->localMirafloresId}/cambiar-estado", [
            'nuevo_estado' => 'inactivo',
        ], $this->headers());

        $response->assertStatus(422);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'LOCAL_BLOQUEO_OPERATIVO');
    }

    /**
     * Test 9: Acceso denegado a usuarios sin rol de propietario ni admin_saas
     */
    public function test_mozo_no_puede_acceder_a_rutas_de_propietario(): void
    {
        $rawTokenMozo = 'test_token_mozo_' . Str::random(32);
        $tokenHashMozo = hash('sha256', $rawTokenMozo);

        $sessionMozo = [
            'id' => '00000000-0000-4000-8000-000000000103',
            'nombre' => 'Carlos Huamán',
            'correo' => 'mozo@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localMirafloresId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHashMozo}", 3600, json_encode($sessionMozo));

        $response = $this->getJson('/api/v1/propietario/locales', $this->headers($rawTokenMozo));

        $response->assertStatus(403);
    }

    /**
     * Test 10: Validación de teléfono móvil Perú (+51 9XX XXX XXX)
     */
    public function test_crear_local_rechaza_telefono_fijo_o_invalido(): void
    {
        $payload = [
            'nombre' => 'Local Teléfono Inválido',
            'slug' => 'local-tel-invalido',
            'direccion' => 'Av. Larco 450',
            'ubigeo_cod' => '150122',
            'telefono' => '014458920', // Teléfono fijo antiguo de Lima sin formato móvil de 9 dígitos
            'modo_administracion' => 'propietario',
            'giro_negocio' => 'polleria',
        ];

        $response = $this->postJson('/api/v1/propietario/locales', $payload, $this->headers());

        $response->assertStatus(422);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'LOCAL_DATOS_INVALIDOS');
    }

    /**
     * Test 11: Desvincular administrador de sede lo desactiva y revoca sesión en Redis
     */
    public function test_desvincular_administrador_lo_desactiva_y_revoca_sesion(): void
    {
        $adminId = (string) Str::uuid();
        $correo = 'admin.desvincular.' . Str::random(5) . '@aurea.pe';

        // 1. Crear admin activo vinculado a Miraflores
        DB::table('usuario')->insert([
            'id' => $adminId,
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localMirafloresId,
            'nombre' => 'Admin Desvincular Test',
            'correo' => $correo,
            'password_hash' => 'hash_test',
            'telefono' => '+51 987 654 321',
            'rol' => 'admin_local',
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Modificar el local a modo 'propietario' (autogestionado)
        $payload = [
            'nombre' => 'ÁUREA Miraflores',
            'slug' => 'aurea-miraflores',
            'direccion' => 'Av. Larco 450',
            'ubigeo_cod' => '150122',
            'telefono' => '+51 987 654 321',
            'modo_administracion' => 'propietario',
        ];

        $response = $this->putJson("/api/v1/propietario/locales/{$this->localMirafloresId}", $payload, $this->headers());
        $response->assertStatus(200);

        // 3. Verificar que el administrador quedó sin local y DESACTIVADO
        $adminActualizado = DB::table('usuario')->where('id', $adminId)->first();
        $this->assertNull($adminActualizado->local_id);
        $this->assertEquals('inactivo', $adminActualizado->estado);

        // 4. Verificar que su sesión fue revocada en Blacklist de Redis
        $this->assertEquals('revocado', Redis::get("jwt:blacklist:{$adminId}"));

        // Limpiar
        DB::table('usuario')->where('id', $adminId)->delete();
        Redis::del("jwt:blacklist:{$adminId}");
    }

    /**
     * Test 12: Asignar administrador inactivo a un local lo activa
     */
    public function test_asignar_administrador_inactivo_a_local_lo_activa(): void
    {
        $adminId = (string) Str::uuid();
        $correo = 'admin.reactivar.' . Str::random(5) . '@aurea.pe';

        // 1. Crear admin inactivo sin local asignado
        DB::table('usuario')->insert([
            'id' => $adminId,
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'nombre' => 'Admin Inactivo Test',
            'correo' => $correo,
            'password_hash' => 'hash_test',
            'telefono' => '+51 987 654 321',
            'rol' => 'admin_local',
            'estado' => 'inactivo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Asignar el administrador a Miraflores
        $payload = [
            'nombre' => 'ÁUREA Miraflores',
            'slug' => 'aurea-miraflores',
            'direccion' => 'Av. Larco 450',
            'ubigeo_cod' => '150122',
            'telefono' => '+51 987 654 321',
            'modo_administracion' => 'asignar_admin',
            'administrador_usuario_id' => $adminId,
        ];

        $response = $this->putJson("/api/v1/propietario/locales/{$this->localMirafloresId}", $payload, $this->headers());
        $response->assertStatus(200);

        // 3. Verificar que ahora tiene el local asignado y su estado pasó a 'activo'
        $adminActualizado = DB::table('usuario')->where('id', $adminId)->first();
        $this->assertEquals($this->localMirafloresId, $adminActualizado->local_id);
        $this->assertEquals('activo', $adminActualizado->estado);

        // Restaurar modo autogestionado en Miraflores
        DB::table('usuario')->where('id', $adminId)->update(['local_id' => null, 'estado' => 'inactivo']);
        DB::table('usuario')->where('id', $adminId)->delete();
    }
}
