<?php

namespace App\Domains\Personal\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PersonalService
{
    private const ROLES_OPERATIVOS = ['mozo', 'cocina', 'cajero'];

    public function listado(string $empresaId, string $localId, array $filtros): array
    {
        $pagina = max(1, (int) ($filtros['pagina'] ?? 1));
        $limite = min(50, max(1, (int) ($filtros['limite'] ?? 10)));
        $consulta = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('local_id', $localId)
            ->whereIn('rol', self::ROLES_OPERATIVOS);

        if (($filtros['rol'] ?? 'todos') !== 'todos') {
            $consulta->where('rol', $filtros['rol']);
        }
        if (($filtros['estado'] ?? 'todos') !== 'todos') {
            $consulta->where('estado', $filtros['estado']);
        }
        if ($busqueda = trim((string) ($filtros['busqueda'] ?? ''))) {
            $consulta->where(function ($query) use ($busqueda): void {
                $query->whereRaw('LOWER(nombre) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhereRaw('LOWER(correo) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhere('telefono', 'like', "%{$busqueda}%");
            });
        }

        $total = $consulta->count();
        $totalPaginas = max(1, (int) ceil($total / $limite));
        $pagina = min($pagina, $totalPaginas);
        $empleados = $consulta
            ->orderBy('nombre')
            ->forPage($pagina, $limite)
            ->get()
            ->map(fn ($usuario) => $this->mapear($usuario))
            ->all();

        return [
            'empleados' => $empleados,
            'metricas' => $this->metricas($empresaId, $localId),
            'paginacion' => [
                'total' => $total,
                'pagina' => $pagina,
                'limite' => $limite,
                'total_paginas' => $totalPaginas,
            ],
        ];
    }

    public function crear(string $empresaId, string $localId, array $data): array
    {
        return DB::transaction(function () use ($empresaId, $localId, $data): array {
            $this->asegurarCupo($empresaId);
            $correo = strtolower(trim($data['correo']));
            if (DB::table('usuario')
                ->where('empresa_id', $empresaId)
                ->whereRaw('LOWER(correo) = LOWER(?)', [$correo])
                ->exists()
            ) {
                throw new \DomainException("El correo \"{$correo}\" ya está registrado en la empresa.");
            }

            $passwordTemporal = 'Rc@' . Str::upper(Str::random(10));
            $id = (string) Str::uuid();
            DB::table('usuario')->insert([
                'id' => $id,
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'nombre' => trim($data['nombre']),
                'correo' => $correo,
                'password_hash' => Hash::make($passwordTemporal),
                'telefono' => trim($data['telefono']),
                'rol' => $data['rol'],
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->detalle($id, $localId, $passwordTemporal);
        });
    }

    public function actualizar(string $id, string $localId, array $data): ?array
    {
        $actualizado = DB::table('usuario')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->whereIn('rol', self::ROLES_OPERATIVOS)
            ->update([
                'nombre' => trim($data['nombre']),
                'telefono' => trim($data['telefono']),
                'rol' => $data['rol'],
                'updated_at' => now(),
            ]);

        return $actualizado ? $this->detalle($id, $localId) : null;
    }

    public function reactivar(string $id, string $empresaId, string $localId): ?array
    {
        return DB::transaction(function () use ($id, $empresaId, $localId): ?array {
            $usuario = DB::table('usuario')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->whereIn('rol', self::ROLES_OPERATIVOS)
                ->lockForUpdate()
                ->first();

            if (! $usuario) {
                return null;
            }

            if ($usuario->estado !== 'activo') {
                $this->asegurarCupo($empresaId);
                DB::table('usuario')->where('id', $id)->update([
                    'estado' => 'activo',
                    'updated_at' => now(),
                ]);
            }

            return $this->detalle($id, $localId);
        });
    }

    public function resetPassword(string $id, string $localId): ?array
    {
        $usuario = DB::table('usuario')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->whereIn('rol', self::ROLES_OPERATIVOS)
            ->first();

        if (! $usuario) {
            return null;
        }

        $passwordTemporal = 'Rc@' . Str::upper(Str::random(10));
        DB::table('usuario')->where('id', $id)->update([
            'password_hash' => Hash::make($passwordTemporal),
            'updated_at' => now(),
        ]);

        return [
            'usuario_id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'correo' => $usuario->correo,
            'password_temporal' => $passwordTemporal,
            'enlace_whatsapp_link' => $this->whatsApp(
                $usuario->telefono,
                $usuario->nombre,
                $usuario->correo,
                $passwordTemporal,
            ),
        ];
    }

    private function detalle(string $id, string $localId, ?string $passwordTemporal = null): array
    {
        $usuario = DB::table('usuario')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();
        $detalle = $this->mapear($usuario);

        if ($passwordTemporal) {
            $detalle['password_temporal'] = $passwordTemporal;
            $detalle['enlace_whatsapp_link'] = $this->whatsApp(
                $usuario->telefono,
                $usuario->nombre,
                $usuario->correo,
                $passwordTemporal,
            );
        }

        return $detalle;
    }

    private function metricas(string $empresaId, string $localId): array
    {
        $plan = DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)
            ->select('p.nombre', 'p.max_usuarios')
            ->first();

        $usuariosActivosEmpresa = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activo')
            ->count();

        $porRol = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('local_id', $localId)
            ->where('estado', 'activo')
            ->whereIn('rol', self::ROLES_OPERATIVOS)
            ->selectRaw(<<<'SQL'
                COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE rol = 'mozo')::int as mozos,
                COUNT(*) FILTER (WHERE rol = 'cocina')::int as cocina,
                COUNT(*) FILTER (WHERE rol = 'cajero')::int as cajeros
                SQL)
            ->first();

        $maximo = (int) $plan->max_usuarios;

        return [
            'total_empleados' => (int) $porRol->total,
            'max_usuarios_plan' => $maximo,
            'cupos_disponibles' => max(0, $maximo - $usuariosActivosEmpresa),
            'mozos_activos' => (int) $porRol->mozos,
            'cocina_activos' => (int) $porRol->cocina,
            'cajeros_activos' => (int) $porRol->cajeros,
            'plan_nombre' => $plan->nombre,
            'porcentaje_ocupacion' => $maximo
                ? (int) round(($usuariosActivosEmpresa / $maximo) * 100)
                : 0,
        ];
    }

    private function asegurarCupo(string $empresaId): void
    {
        $empresa = DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)
            ->select('p.max_usuarios')
            ->lockForUpdate()
            ->first();
        $activos = DB::table('usuario')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activo')
            ->lockForUpdate()
            ->pluck('id')
            ->count();

        if ($activos >= $empresa->max_usuarios) {
            throw new \OverflowException("Se alcanzó el límite de {$empresa->max_usuarios} usuarios activos del plan.");
        }
    }

    private function mapear(object $usuario): array
    {
        return [
            'id' => $usuario->id,
            'local_id' => $usuario->local_id,
            'nombre' => $usuario->nombre,
            'correo' => $usuario->correo,
            'telefono' => $usuario->telefono ?? '',
            'rol' => $usuario->rol,
            'estado' => $usuario->estado,
            'ultimo_login' => $usuario->ultimo_login,
            'created_at' => $usuario->created_at,
            'mesas_activas_count' => 0,
            'tiene_caja_abierta' => false,
        ];
    }

    private function whatsApp(?string $telefono, string $nombre, string $correo, string $password): string
    {
        $numero = preg_replace('/\D/', '', $telefono ?? '');
        $numero = str_starts_with($numero, '51') ? $numero : "51{$numero}";
        $texto = "Hola {$nombre}. Acceso RestaurantCloud AI: usuario {$correo}, clave provisional {$password}.";

        return 'https://wa.me/' . $numero . '?text=' . rawurlencode($texto);
    }
}
