<?php

namespace Tests\Feature\Public;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class ActivacionCuentaTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    /**
     * Test 1: Validar token inexistente o expirado retorna 404
     */
    public function test_validar_token_inexistente_retorna_404(): void
    {
        $response = $this->getJson('/api/v1/public/activar-cuenta/validar?token=token_inventado_de_mas_de_veinte_caracteres');

        $response->assertStatus(404);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'TOKEN_INVALIDO_O_EXPIRADO');
    }

    /**
     * Test 2: Validar sin parámetro token retorna 400
     */
    public function test_validar_sin_parametro_token_retorna_400(): void
    {
        $response = $this->getJson('/api/v1/public/activar-cuenta/validar');

        $response->assertStatus(400);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'TOKEN_INVALIDO_O_EXPIRADO');
    }

    /**
     * Test 3: Validar token activo retorna datos del invitado y empresa
     */
    public function test_validar_token_activo_retorna_datos_de_invitacion(): void
    {
        $usuarioId = (string) Str::uuid();
        $correo = 'diego.' . Str::random(5) . '@aurea.pe';
        $token = 'inv_test_' . Str::random(32);

        DB::table('usuario')->insert([
            'id' => $usuarioId,
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'nombre' => 'Diego Salazar',
            'correo' => $correo,
            'password_hash' => Hash::make(Str::random(30)),
            'telefono' => '+51 912 345 678',
            'rol' => 'admin_local',
            'estado' => 'pendiente_activacion',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Redis::setex("invitacion:admin:{$token}", 86400, json_encode([
            'usuario_id' => $usuarioId,
            'empresa_id' => $this->empresaId,
            'correo' => $correo,
            'nombre' => 'Diego Salazar',
            'rol' => 'admin_local',
            'token' => $token,
            'expira_en' => now()->addHours(24)->toIso8601String(),
        ]));

        $response = $this->getJson("/api/v1/public/activar-cuenta/validar?token={$token}");

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.valido', true);
        $response->assertJsonPath('datos.usuario.nombre', 'Diego Salazar');
        $response->assertJsonPath('datos.usuario.correo', $correo);
        $response->assertJsonPath('datos.empresa.nombre', 'Restaurante ÁUREA S.A.C.');

        // Limpiar
        DB::table('usuario')->where('id', $usuarioId)->delete();
        Redis::del("invitacion:admin:{$token}");
    }

    /**
     * Test 4: Completar activación actualiza contraseña, activa usuario y genera sesión
     */
    public function test_completar_activacion_actualiza_password_y_genera_sesion(): void
    {
        $usuarioId = (string) Str::uuid();
        $correo = 'carlos.activa.' . Str::random(5) . '@aurea.pe';
        $token = 'inv_activa_' . Str::random(32);

        DB::table('usuario')->insert([
            'id' => $usuarioId,
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'nombre' => 'Carlos Activado',
            'correo' => $correo,
            'password_hash' => Hash::make(Str::random(30)),
            'telefono' => '+51 987 654 321',
            'rol' => 'admin_local',
            'estado' => 'pendiente_activacion',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Redis::setex("invitacion:admin:{$token}", 86400, json_encode([
            'usuario_id' => $usuarioId,
            'empresa_id' => $this->empresaId,
            'correo' => $correo,
            'nombre' => 'Carlos Activado',
            'rol' => 'admin_local',
            'token' => $token,
            'expira_en' => now()->addHours(24)->toIso8601String(),
        ]));
        Redis::setex("usuario:invitacion:{$usuarioId}", 86400, json_encode([
            'token' => $token,
            'expira_en' => now()->addHours(24)->toIso8601String(),
        ]));

        $payload = [
            'token' => $token,
            'password' => 'PasswordSegura2026!',
            'password_confirmation' => 'PasswordSegura2026!',
        ];

        $response = $this->postJson('/api/v1/public/activar-cuenta/completar', $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $this->assertNotEmpty($response->json('datos.token'));
        $this->assertNotEmpty($response->json('datos.refresh_token'));
        $this->assertEquals($usuarioId, $response->json('datos.usuario.id'));

        // 1. Verificar estado en PostgreSQL
        $usuarioActualizado = DB::table('usuario')->where('id', $usuarioId)->first();
        $this->assertEquals('activo', $usuarioActualizado->estado);
        $this->assertTrue(password_verify('PasswordSegura2026!', $usuarioActualizado->password_hash));

        // 2. Verificar que el token en Redis fue eliminado
        $this->assertNull(Redis::get("invitacion:admin:{$token}"));
        $this->assertNull(Redis::get("usuario:invitacion:{$usuarioId}"));

        // 3. Verificar sesión en Redis
        $sessionToken = $response->json('datos.token');
        $sessionHash = hash('sha256', $sessionToken);
        $this->assertNotNull(Redis::get("auth:session:{$sessionHash}"));

        // Limpiar
        DB::table('usuario')->where('id', $usuarioId)->delete();
        Redis::del("auth:session:{$sessionHash}");
    }

    /**
     * Test 5: Reutilizar token ya consumido es rechazado con 404
     */
    public function test_reutilizar_token_ya_consumido_retorna_404(): void
    {
        $payload = [
            'token' => 'token_que_ya_fue_consumido_anteriormente',
            'password' => 'PasswordSegura2026!',
            'password_confirmation' => 'PasswordSegura2026!',
        ];

        $response = $this->postJson('/api/v1/public/activar-cuenta/completar', $payload);

        $response->assertStatus(404);
        $response->assertJsonPath('errores.0.codigo', 'TOKEN_INVALIDO_O_EXPIRADO');
    }

    /**
     * Test 6: Validación de confirmación de contraseña
     */
    public function test_completar_activacion_valida_confirmacion_de_password(): void
    {
        $payload = [
            'token' => 'token_de_prueba_con_longitud_valida_12345',
            'password' => 'PasswordSegura2026!',
            'password_confirmation' => 'NoCoincide123!',
        ];

        $response = $this->postJson('/api/v1/public/activar-cuenta/completar', $payload);

        $response->assertStatus(422);
    }
}
