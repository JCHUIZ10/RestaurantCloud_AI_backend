<?php

namespace Tests\Feature\Propietario;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdministradorTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $propietarioId = '00000000-0000-4000-8000-000000000101';
    private string $propietarioCorreo = 'propietario@aurea.local';
    private string $tokenPropietario;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear sesión de prueba en Redis para el Propietario
        $rawToken = 'test_token_' . Str::random(32);
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
    }

    private function headers(string $token = null): array
    {
        return [
            'Authorization' => 'Bearer ' . ($token ?: $this->tokenPropietario),
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test 1: Propietario lista administradores y recibe cuota de plan
     */
    public function test_propietario_puede_listar_administradores_y_ver_cuota_plan(): void
    {
        $response = $this->getJson('/api/v1/propietario/administradores', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'cuota_usuarios' => [
                    'plan_id',
                    'plan_nombre',
                    'usuarios_permitidos',
                    'usuarios_activos',
                    'cupos_disponibles',
                    'limite_alcanzado',
                ],
                'administradores',
            ],
            'meta' => ['timestamp'],
        ]);

        $this->assertIsArray($response->json('datos.administradores'));
    }

    /**
     * Test 2: Disponibilidad de cupos en cuota-personal
     */
    public function test_propietario_obtiene_cuota_personal_con_cupos_libres(): void
    {
        $response = $this->getJson('/api/v1/propietario/administradores/cuota-personal', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $this->assertTrue($response->json('datos.puede_invitar'));
        $this->assertGreaterThan(0, $response->json('datos.cupos_libres'));
    }

    /**
     * Test 3: Invitación exitosa desacoplada de sedes (local_id = NULL)
     */
    public function test_propietario_puede_invitar_administrador_exitosamente_sin_sede(): void
    {
        $correo = 'carlos.invitado.' . Str::random(6) . '@aurea.pe';
        $payload = [
            'nombre' => 'Carlos Ramos',
            'correo' => $correo,
            'telefono' => '987654321',
        ];

        $response = $this->postJson('/api/v1/propietario/administradores', $payload, $this->headers());

        $response->assertStatus(201);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.nombre', 'Carlos Ramos');
        $response->assertJsonPath('datos.correo', strtolower($correo));
        $response->assertJsonPath('datos.estado', 'pendiente_activacion');
        $response->assertJsonPath('datos.local_id', null);
        $response->assertJsonPath('datos.sede_asignada', null);

        $token = $response->json('datos.invitacion_token');
        $this->assertNotEmpty($token);

        // Verificar que el token existe en Redis con TTL de 24 horas
        $redisData = Redis::get("invitacion:admin:{$token}");
        $this->assertNotNull($redisData);
        $parsed = json_decode($redisData, true);
        $this->assertEquals(strtolower($correo), $parsed['correo']);

        // Limpiar para no ensuciar BD
        $usuarioId = $response->json('datos.id');
        DB::table('usuario')->where('id', $usuarioId)->delete();
        Redis::del("invitacion:admin:{$token}");
        Redis::del("usuario:invitacion:{$usuarioId}");
    }

    /**
     * Test 4: Rechazo de auto-invitación del propietario
     */
    public function test_propietario_no_puede_auto_invitarse_como_admin_local(): void
    {
        $payload = [
            'nombre' => 'Rodrigo Propietario',
            'correo' => $this->propietarioCorreo,
            'telefono' => '912345678',
        ];

        $response = $this->postJson('/api/v1/propietario/administradores', $payload, $this->headers());

        $response->assertStatus(422);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'PROPIETARIO_NO_PUEDE_SER_ADMIN_LOCAL');
    }

    /**
     * Test 5: Rechazo de correo duplicado en la misma empresa
     */
    public function test_invitacion_rechaza_correo_duplicado_en_misma_empresa(): void
    {
        $payload = [
            'nombre' => 'Valeria Duplicada',
            'correo' => 'admin@aurea.local', // Ya existe en la empresa
            'telefono' => '912345678',
        ];

        $response = $this->postJson('/api/v1/propietario/administradores', $payload, $this->headers());

        $response->assertStatus(409);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'ADMIN_CORREO_EXISTE_MISMA_EMPRESA');
    }

    /**
     * Test 6: Validación de formato móvil Perú (9 dígitos iniciando con 9)
     */
    public function test_invitacion_valida_formato_telefono_peru(): void
    {
        $payload = [
            'nombre' => 'Juan Perez',
            'correo' => 'juan.' . Str::random(5) . '@aurea.pe',
            'telefono' => '123456789', // No inicia con 9
        ];

        $response = $this->postJson('/api/v1/propietario/administradores', $payload, $this->headers());

        $response->assertStatus(422);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'TELEFONO_INVALIDO');
    }

    /**
     * Test 7: Reenviar invitación respeta cooldown de 60 segundos
     */
    public function test_reenviar_invitacion_respeta_cooldown_de_60_segundos(): void
    {
        // 1. Crear usuario invitado
        $correo = 'carlos.reenvio.' . Str::random(6) . '@aurea.pe';
        $resCreate = $this->postJson('/api/v1/propietario/administradores', [
            'nombre' => 'Carlos Reenvio',
            'correo' => $correo,
        ], $this->headers());

        $usuarioId = $resCreate->json('datos.id');
        $token1 = $resCreate->json('datos.invitacion_token');

        // Limpiar cooldown inicial si se hubiera seteado
        Redis::del("invitacion:cooldown:{$usuarioId}");

        // 2. Primer reenvío exitoso
        $resReenvio1 = $this->postJson("/api/v1/propietario/administradores/{$usuarioId}/reenviar-invitacion", [], $this->headers());
        $resReenvio1->assertStatus(200);
        $token2 = $resReenvio1->json('datos.invitacion_token');
        $this->assertNotEquals($token1, $token2);

        // 3. Segundo reenvío inmediato debe fallar con 429 Too Many Requests
        $resReenvio2 = $this->postJson("/api/v1/propietario/administradores/{$usuarioId}/reenviar-invitacion", [], $this->headers());
        $resReenvio2->assertStatus(429);
        $resReenvio2->assertJsonPath('errores.0.codigo', 'ADMIN_REENVIO_EN_ENFRIAMIENTO');

        // Limpiar
        DB::table('usuario')->where('id', $usuarioId)->delete();
        Redis::del("invitacion:admin:{$token2}");
        Redis::del("usuario:invitacion:{$usuarioId}");
        Redis::del("invitacion:cooldown:{$usuarioId}");
    }

    /**
     * Test 8: Cancelar invitación pendiente
     */
    public function test_propietario_puede_cancelar_invitacion_pendiente(): void
    {
        // 1. Crear invitado
        $correo = 'cancelar.' . Str::random(6) . '@aurea.pe';
        $resCreate = $this->postJson('/api/v1/propietario/administradores', [
            'nombre' => 'Para Cancelar',
            'correo' => $correo,
        ], $this->headers());

        $usuarioId = $resCreate->json('datos.id');
        $token = $resCreate->json('datos.invitacion_token');

        // 2. Cancelar
        $resCancel = $this->postJson("/api/v1/propietario/administradores/{$usuarioId}/cancelar-invitacion", [], $this->headers());
        $resCancel->assertStatus(200);
        $resCancel->assertJsonPath('exito', true);

        // 3. Confirmar que ya no existe en BD ni en Redis
        $this->assertNull(DB::table('usuario')->where('id', $usuarioId)->first());
        $this->assertNull(Redis::get("invitacion:admin:{$token}"));
        $this->assertNull(Redis::get("usuario:invitacion:{$usuarioId}"));
    }

    /**
     * Test 9: Cambiar estado (desactivar y reactivar)
     */
    public function test_propietario_puede_cambiar_estado_desactivar_y_reactivar(): void
    {
        $valeriaId = '00000000-0000-4000-8000-000000000102';

        // 1. Desactivar
        $resDesactivar = $this->patchJson("/api/v1/propietario/administradores/{$valeriaId}/cambiar-estado", [
            'nuevo_estado' => 'inactivo',
        ], $this->headers());

        $resDesactivar->assertStatus(200);
        $resDesactivar->assertJsonPath('datos.estado', 'inactivo');
        $resDesactivar->assertJsonPath('datos.sesiones_revocadas', true);

        // 2. Reactivar
        $resReactivar = $this->patchJson("/api/v1/propietario/administradores/{$valeriaId}/cambiar-estado", [
            'nuevo_estado' => 'activo',
        ], $this->headers());

        $resReactivar->assertStatus(200);
        $resReactivar->assertJsonPath('datos.estado', 'activo');
    }

    /**
     * Test 10: Roles operativos sin permiso son rechazados con 403
     */
    public function test_rol_no_autorizado_es_rechazado(): void
    {
        // Sesión como 'mozo'
        $mozoToken = 'mozo_token_' . Str::random(32);
        $mozoHash = hash('sha256', $mozoToken);
        Redis::setex("auth:session:{$mozoHash}", 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000103',
            'nombre' => 'Carlos Mozo',
            'correo' => 'mozo@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => '00000000-0000-4000-8000-000000000010',
            'estado' => 'activo',
        ]));

        $response = $this->getJson('/api/v1/propietario/administradores', $this->headers($mozoToken));

        $response->assertStatus(403);
    }
}
