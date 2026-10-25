<?php

namespace App\Domains\Tenant\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Domains\Mesas\Services\CuotaSalonService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LocalProvisioningService
{
    private const PLANTILLAS_CATEGORIAS = [
        'polleria' => [
            'Pollos a la Brasa',
            'Guarniciones y Papas',
            'Ensaladas Frescas',
            'Bebidas & Gaseosas',
            'Cervezas & Tragos',
        ],
        'cevicheria' => [
            'Ceviches y Tiraditos',
            'Causas y Entradas Frías',
            'Chicharrones y Jaleas',
            'Arroces y Sudados',
            'Chilcanos y Bebidas',
        ],
        'chifa' => [
            'Sopas y Wantanes',
            'Arroz Chaufa',
            'Tallarines y Wantán Frito',
            'Especialidades al Wok',
            'Bebidas y Té Jazmín',
        ],
    ];

    private const PLANTILLAS_INSUMOS = [
        'polleria' => [
            ['nombre' => 'Pollo entero eviscerado', 'unidad_medida' => 'und', 'costo_unitario' => 14.50, 'stock_actual' => 30, 'stock_minimo' => 10],
            ['nombre' => 'Papa Canchán / Yungay', 'unidad_medida' => 'kg', 'costo_unitario' => 2.80, 'stock_actual' => 100, 'stock_minimo' => 30],
            ['nombre' => 'Aceite vegetal', 'unidad_medida' => 'L', 'costo_unitario' => 6.50, 'stock_actual' => 40, 'stock_minimo' => 15],
            ['nombre' => 'Ají panca en pasta', 'unidad_medida' => 'kg', 'costo_unitario' => 8.00, 'stock_actual' => 10, 'stock_minimo' => 3],
            ['nombre' => 'Ajo molido', 'unidad_medida' => 'kg', 'costo_unitario' => 9.50, 'stock_actual' => 8, 'stock_minimo' => 2],
            ['nombre' => 'Cerveza negra', 'unidad_medida' => 'botella', 'costo_unitario' => 5.50, 'stock_actual' => 24, 'stock_minimo' => 6],
            ['nombre' => 'Sillao / Salsa de soya', 'unidad_medida' => 'L', 'costo_unitario' => 7.20, 'stock_actual' => 15, 'stock_minimo' => 5],
            ['nombre' => 'Comino y pimienta molida', 'unidad_medida' => 'kg', 'costo_unitario' => 25.00, 'stock_actual' => 3, 'stock_minimo' => 1],
            ['nombre' => 'Sal de mesa', 'unidad_medida' => 'kg', 'costo_unitario' => 1.80, 'stock_actual' => 25, 'stock_minimo' => 5],
            ['nombre' => 'Lechuga americana', 'unidad_medida' => 'und', 'costo_unitario' => 2.00, 'stock_actual' => 20, 'stock_minimo' => 5],
            ['nombre' => 'Tomate riñón', 'unidad_medida' => 'kg', 'costo_unitario' => 3.50, 'stock_actual' => 15, 'stock_minimo' => 4],
            ['nombre' => 'Pepino fresco', 'unidad_medida' => 'kg', 'costo_unitario' => 2.50, 'stock_actual' => 10, 'stock_minimo' => 3],
            ['nombre' => 'Mayonesa base', 'unidad_medida' => 'kg', 'costo_unitario' => 12.00, 'stock_actual' => 12, 'stock_minimo' => 4],
            ['nombre' => 'Ají amarillo fresco', 'unidad_medida' => 'kg', 'costo_unitario' => 4.50, 'stock_actual' => 15, 'stock_minimo' => 4],
            ['nombre' => 'Inca Kola 500ml', 'unidad_medida' => 'botella', 'costo_unitario' => 3.20, 'stock_actual' => 48, 'stock_minimo' => 12],
        ],
        'cevicheria' => [
            ['nombre' => 'Pescado fresco bonito/perico', 'unidad_medida' => 'kg', 'costo_unitario' => 24.00, 'stock_actual' => 25, 'stock_minimo' => 8],
            ['nombre' => 'Limón sutil de Chulucanas', 'unidad_medida' => 'kg', 'costo_unitario' => 5.50, 'stock_actual' => 30, 'stock_minimo' => 10],
            ['nombre' => 'Cebolla roja criolla', 'unidad_medida' => 'kg', 'costo_unitario' => 3.20, 'stock_actual' => 35, 'stock_minimo' => 10],
            ['nombre' => 'Ají limo seleccionado', 'unidad_medida' => 'kg', 'costo_unitario' => 9.00, 'stock_actual' => 8, 'stock_minimo' => 2],
            ['nombre' => 'Culantro fresco', 'unidad_medida' => 'kg', 'costo_unitario' => 4.00, 'stock_actual' => 6, 'stock_minimo' => 2],
            ['nombre' => 'Camote morado dulce', 'unidad_medida' => 'kg', 'costo_unitario' => 3.00, 'stock_actual' => 30, 'stock_minimo' => 8],
            ['nombre' => 'Choclo desgranado', 'unidad_medida' => 'kg', 'costo_unitario' => 4.20, 'stock_actual' => 25, 'stock_minimo' => 8],
            ['nombre' => 'Cancha serrana seca', 'unidad_medida' => 'kg', 'costo_unitario' => 6.00, 'stock_actual' => 20, 'stock_minimo' => 5],
            ['nombre' => 'Calamares / Pota limpia', 'unidad_medida' => 'kg', 'costo_unitario' => 14.00, 'stock_actual' => 20, 'stock_minimo' => 5],
            ['nombre' => 'Mixtura de mariscos', 'unidad_medida' => 'kg', 'costo_unitario' => 22.00, 'stock_actual' => 15, 'stock_minimo' => 5],
            ['nombre' => 'Arroz extra', 'unidad_medida' => 'kg', 'costo_unitario' => 4.50, 'stock_actual' => 50, 'stock_minimo' => 15],
            ['nombre' => 'Ajo y jengibre en pasta', 'unidad_medida' => 'kg', 'costo_unitario' => 11.00, 'stock_actual' => 8, 'stock_minimo' => 2],
            ['nombre' => 'Fondo / Fumet de pescado', 'unidad_medida' => 'L', 'costo_unitario' => 3.50, 'stock_actual' => 20, 'stock_minimo' => 5],
            ['nombre' => 'Yuca amarilla harinosa', 'unidad_medida' => 'kg', 'costo_unitario' => 3.20, 'stock_actual' => 25, 'stock_minimo' => 6],
            ['nombre' => 'Cusqueña Dorada 330ml', 'unidad_medida' => 'botella', 'costo_unitario' => 5.20, 'stock_actual' => 48, 'stock_minimo' => 12],
        ],
        'chifa' => [
            ['nombre' => 'Arroz extra grano largo', 'unidad_medida' => 'kg', 'costo_unitario' => 4.50, 'stock_actual' => 80, 'stock_minimo' => 25],
            ['nombre' => 'Pechuga de pollo filete', 'unidad_medida' => 'kg', 'costo_unitario' => 17.50, 'stock_actual' => 30, 'stock_minimo' => 10],
            ['nombre' => 'Carne de cerdo pierna', 'unidad_medida' => 'kg', 'costo_unitario' => 18.00, 'stock_actual' => 20, 'stock_minimo' => 6],
            ['nombre' => 'Huevo fresco de gallina', 'unidad_medida' => 'jaba', 'costo_unitario' => 18.00, 'stock_actual' => 4, 'stock_minimo' => 1],
            ['nombre' => 'Cebolla china fresca', 'unidad_medida' => 'kg', 'costo_unitario' => 3.80, 'stock_actual' => 15, 'stock_minimo' => 5],
            ['nombre' => 'Kion / Jengibre fresco', 'unidad_medida' => 'kg', 'costo_unitario' => 6.50, 'stock_actual' => 10, 'stock_minimo' => 3],
            ['nombre' => 'Sillao claro', 'unidad_medida' => 'L', 'costo_unitario' => 7.00, 'stock_actual' => 25, 'stock_minimo' => 8],
            ['nombre' => 'Sillao oscuro / Hongo', 'unidad_medida' => 'L', 'costo_unitario' => 9.50, 'stock_actual' => 15, 'stock_minimo' => 5],
            ['nombre' => 'Aceite de ajonjolí puro', 'unidad_medida' => 'L', 'costo_unitario' => 28.00, 'stock_actual' => 5, 'stock_minimo' => 2],
            ['nombre' => 'Salsa de ostión', 'unidad_medida' => 'botella', 'costo_unitario' => 14.00, 'stock_actual' => 12, 'stock_minimo' => 4],
            ['nombre' => 'Fideos wantán masa', 'unidad_medida' => 'kg', 'costo_unitario' => 8.50, 'stock_actual' => 15, 'stock_minimo' => 5],
            ['nombre' => 'Col china / Pak choi', 'unidad_medida' => 'kg', 'costo_unitario' => 4.20, 'stock_actual' => 18, 'stock_minimo' => 5],
            ['nombre' => 'Holantao fresco', 'unidad_medida' => 'kg', 'costo_unitario' => 9.00, 'stock_actual' => 8, 'stock_minimo' => 2],
            ['nombre' => 'Frijolito chino fresco', 'unidad_medida' => 'kg', 'costo_unitario' => 4.50, 'stock_actual' => 12, 'stock_minimo' => 4],
            ['nombre' => 'Té jazmín importado', 'unidad_medida' => 'caja', 'costo_unitario' => 16.00, 'stock_actual' => 10, 'stock_minimo' => 3],
        ],
    ];

    public function __construct(
        private TenantStorageService $tenantStorage
    ) {}

    /**
     * Aprovisiona atómicamente una nueva sede/local y su ecosistema inicial (CU-PROP-04).
     */
    public function provisionar(string $empresaId, array $datos): array
    {
        $slug = strtolower(trim($datos['slug']));
        $giro = $datos['giro_negocio'] ?? 'en_blanco';
        $modoAdmin = $datos['modo_administracion'] ?? 'propietario';
        $adminId = $datos['administrador_usuario_id'] ?? null;

        return DB::transaction(function () use ($empresaId, $datos, $slug, $giro, $modoAdmin, $adminId) {
            // 1. Validar cuota de locales según plan de la empresa
            $empresa = DB::table('empresa as e')
                ->join('plan as p', 'p.id', '=', 'e.plan_id')
                ->where('e.id', $empresaId)
                ->select(['e.id', 'e.plan_id', 'p.nombre as plan_nombre', 'p.max_locales'])
                ->lockForUpdate()
                ->first();

            if (! $empresa) {
                throw new \OutOfBoundsException('La empresa especificada no existe.');
            }

            $localesActivos = DB::table('local')
                ->where('empresa_id', $empresaId)
                ->where('estado', 'activo')
                ->count();

            if ($localesActivos >= $empresa->max_locales) {
                throw new \OverflowException("Has alcanzado el límite máximo de locales de tu Plan {$empresa->plan_nombre} ({$empresa->max_locales} locales).");
            }

            app(CuotaSalonService::class)->asegurar($empresaId, 1, $giro === 'en_blanco' ? 0 : 15);

            // 2. Validar unicidad global del slug
            $existeSlug = DB::table('local')->whereRaw('LOWER(slug) = ?', [$slug])->exists();
            if ($existeSlug) {
                throw new \DomainException("La dirección web \"{$slug}\" ya está ocupada por otro establecimiento.");
            }

            // 3. Asegurar UBIGEO (resuelve FK hacia distrito)
            $ubigeoCod = $this->asegurarUbigeo($datos);

            // 4. Normalizar teléfono móvil conforme a estandar_telefono_whatsapp.md
            $telefonoNormalizado = $this->normalizarTelefonoPeru($datos['telefono'] ?? null);

            // 5. Crear registro en tabla local
            $localId = (string) Str::uuid();
            $esAutogestionado = ($modoAdmin === 'propietario');

            DB::table('local')->insert([
                'id' => $localId,
                'empresa_id' => $empresaId,
                'nombre' => trim($datos['nombre']),
                'slug' => $slug,
                'direccion' => trim($datos['direccion']),
                'ubigeo_cod' => $ubigeoCod,
                'departamento' => trim($datos['departamento'] ?? 'Áncash'),
                'provincia' => trim($datos['provincia'] ?? 'Santa'),
                'distrito' => trim($datos['distrito'] ?? 'Chimbote'),
                'ciudad' => trim($datos['ciudad'] ?? 'Chimbote'),
                'referencia' => isset($datos['referencia']) ? trim($datos['referencia']) : null,
                'telefono' => $telefonoNormalizado,
                'zona_horaria' => 'America/Lima',
                'moneda' => 'PEN',
                'giro_negocio' => $giro,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 5. Crear Piso inicial ("Salón Principal", cuadrícula 5x3)
            $pisoId = (string) Str::uuid();
            DB::table('piso')->insert([
                'id' => $pisoId,
                'local_id' => $localId,
                'nombre' => 'Salón Principal',
                'columnas' => 5,
                'filas' => 3,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 6. Crear mesas base (si no es 'en_blanco')
            $mesasCreadas = 0;
            if ($giro !== 'en_blanco') {
                $mesasCreadas = $this->crearMesasBase($localId, $pisoId);
            }

            // 7. Configuración KDS
            DB::table('configuracion_kds')->insert([
                'local_id' => $localId,
                'tiempo_optimo_verde_min' => 15,
                'tiempo_alerta_ambar_min' => 25,
                'tiempo_maximo_pase_min' => 3,
                'alerta_sonora_nueva_comanda' => true,
                'alerta_sonora_comanda_roja' => true,
                'intervalo_sonido_rojo_seg' => 60,
                'vista_predeterminada' => 'fifo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 8. Políticas de Reserva
            DB::table('politicas_reserva')->insert([
                'local_id' => $localId,
                'acepta_reservas' => true,
                'duracion_reserva_min' => 90,
                'buffer_reserva_min' => 15,
                'tolerancia_no_show_min' => 15,
                'minutos_bloqueo_previo' => 30,
                'margen_recordatorio_min' => 120,
                'anticipacion_minima_horas' => 2,
                'anticipacion_maxima_dias' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 9. Horario de Atención estándar (Lunes a Domingo, 12:00 a 23:00)
            for ($dia = 1; $dia <= 7; $dia++) {
                DB::table('horario_atencion')->insert([
                    'id' => (string) Str::uuid(),
                    'local_id' => $localId,
                    'dia_semana' => $dia,
                    'nombre_turno' => 'Principal',
                    'atiende' => true,
                    'hora_inicio' => '12:00',
                    'hora_fin' => '23:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 10. Series Electrónicas Iniciales de Comprobantes (SUNAT)
            $this->inicializarSeriesComprobantes($localId);

            // 11. Poblar Categorías e Insumos según giro seleccionado
            $categoriasCreadas = 0;
            $insumosCreados = 0;

            if ($giro !== 'en_blanco' && isset(self::PLANTILLAS_CATEGORIAS[$giro])) {
                $categoriasCreadas = $this->poblarCategorias($localId, self::PLANTILLAS_CATEGORIAS[$giro]);
                $insumosCreados = $this->poblarInsumos($localId, self::PLANTILLAS_INSUMOS[$giro] ?? []);
            }

            // 12. Asignación de Administrador de Local (si aplica)
            if (! $esAutogestionado && $adminId) {
                $admin = DB::table('usuario')
                    ->where('id', $adminId)
                    ->where('empresa_id', $empresaId)
                    ->where('rol', 'admin_local')
                    ->where('estado', '!=', 'pendiente_activacion')
                    ->first();

                if (! $admin) {
                    throw new \InvalidArgumentException('El colaborador administrativo seleccionado no es válido o aún no ha completado la activación de su cuenta.');
                }

                DB::table('usuario')->where('id', $adminId)->update([
                    'local_id' => $localId,
                    'estado' => 'activo',
                    'updated_at' => now(),
                ]);
            }

            // 13. Inicializar Espacio y Manifiesto en MinIO S3
            $this->tenantStorage->inicializarEspacioLocal($empresaId, $localId, [
                'nombre' => trim($datos['nombre']),
                'slug' => $slug,
                'giro_negocio' => $giro,
                'es_autogestionado' => $esAutogestionado,
                'origen' => 'LocalProvisioningService',
            ]);

            return [
                'id' => $localId,
                'nombre' => trim($datos['nombre']),
                'slug' => $slug,
                'url_carta_digital' => "/sede/{$slug}/carta",
                'giro_negocio' => $giro,
                'estado' => 'activo',
                'zona_horaria' => 'America/Lima',
                'moneda' => 'PEN',
                'es_autogestionado' => $esAutogestionado,
                'resumen_inicializacion' => [
                    'pisos_creados' => 1,
                    'piso_nombre' => 'Salón Principal',
                    'mesas_creadas' => $mesasCreadas,
                    'categorias_creadas' => $categoriasCreadas,
                    'insumos_creados' => $insumosCreados,
                ],
                'mensaje' => 'Sede "'.trim($datos['nombre']).'" registrada exitosamente. Salón Principal y carta inicial aprovisionados.',
            ];
        });
    }

    /**
     * Asegura la presencia del ubigeo en las tablas maestras si no existe aún.
     */
    private function asegurarUbigeo(array $datos): string
    {
        $distritoCod = $datos['ubigeo_cod'] ?? '021801';
        $distrito = DB::table('distrito')->where('codigo', $distritoCod)->first();

        if ($distrito) {
            return $distritoCod;
        }

        // Si no existe el código, derivar jerarquía
        $depCod = substr($distritoCod, 0, 2);
        $provCod = substr($distritoCod, 0, 4);
        $depNombre = trim($datos['departamento'] ?? 'Áncash');
        $provNombre = trim($datos['provincia'] ?? 'Santa');
        $distNombre = trim($datos['distrito'] ?? 'Chimbote');

        DB::table('departamento')->insertOrIgnore([
            'codigo' => $depCod,
            'nombre' => $depNombre,
        ]);

        DB::table('provincia')->insertOrIgnore([
            'codigo' => $provCod,
            'departamento_codigo' => $depCod,
            'nombre' => $provNombre,
        ]);

        DB::table('distrito')->insertOrIgnore([
            'codigo' => $distritoCod,
            'provincia_codigo' => $provCod,
            'departamento_codigo' => $depCod,
            'nombre' => $distNombre,
        ]);

        return $distritoCod;
    }

    /**
     * Genera la cuadrícula inicial de 15 mesas para el Salón Principal (5 columnas x 3 filas).
     */
    private function crearMesasBase(string $localId, string $pisoId): int
    {
        $numero = 1;
        for ($fila = 0; $fila < 3; $fila++) {
            for ($col = 0; $col < 5; $col++) {
                $numStr = str_pad((string) $numero, 2, '0', STR_PAD_LEFT);
                DB::table('mesa')->insert([
                    'id' => (string) Str::uuid(),
                    'local_id' => $localId,
                    'piso_id' => $pisoId,
                    'numero' => $numStr,
                    'capacidad' => ($numero % 4 === 0) ? 6 : (($numero % 3 === 0) ? 2 : 4),
                    'forma' => ($numero % 4 === 0) ? 'rectangular' : (($numero % 5 === 0) ? 'redonda' : 'cuadrada'),
                    'posicion_x' => $col,
                    'posicion_y' => $fila,
                    'permite_union' => true,
                    'estado' => 'activa',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $numero++;
            }
        }

        return 15;
    }

    /**
     * Inicializa las series correlativas de comprobantes para el local.
     */
    private function inicializarSeriesComprobantes(string $localId): void
    {
        $series = [
            ['tipo' => 'boleta', 'serie' => 'B001'],
            ['tipo' => 'factura', 'serie' => 'F001'],
            ['tipo' => 'nota_venta', 'serie' => 'NV01'],
        ];

        foreach ($series as $s) {
            DB::table('comprobante_serie')->insert([
                'id' => (string) Str::uuid(),
                'local_id' => $localId,
                'tipo_comprobante' => $s['tipo'],
                'serie' => $s['serie'],
                'correlativo_actual' => 0,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Puebla las categorías de carta iniciales.
     */
    private function poblarCategorias(string $localId, array $categorias): int
    {
        $orden = 1;
        foreach ($categorias as $nombre) {
            DB::table('categoria_producto')->insert([
                'id' => (string) Str::uuid(),
                'local_id' => $localId,
                'nombre' => $nombre,
                'orden' => $orden++,
                'activa' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return count($categorias);
    }

    /**
     * Puebla los insumos de inventario base para el local.
     */
    private function poblarInsumos(string $localId, array $insumos): int
    {
        foreach ($insumos as $insumo) {
            DB::table('insumo')->insert([
                'id' => (string) Str::uuid(),
                'local_id' => $localId,
                'nombre' => $insumo['nombre'],
                'unidad_medida' => $insumo['unidad_medida'],
                'stock_actual' => $insumo['stock_actual'],
                'stock_minimo' => $insumo['stock_minimo'],
                'costo_unitario' => $insumo['costo_unitario'],
                'moneda' => 'PEN',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return count($insumos);
    }

    /**
     * Valida y normaliza el teléfono móvil conforme a estandar_telefono_whatsapp.md.
     */
    public function normalizarTelefonoPeru(?string $telefono): string
    {
        if (! $telefono) {
            throw new \InvalidArgumentException('El teléfono de contacto es obligatorio.');
        }

        $limpio = trim($telefono);
        $soloDigitos = preg_replace('/\D/', '', $limpio);

        if (strlen($soloDigitos) === 11 && str_starts_with($soloDigitos, '51')) {
            $soloDigitos = substr($soloDigitos, 2);
        }

        if (strlen($soloDigitos) !== 9 || ! str_starts_with($soloDigitos, '9')) {
            throw new \InvalidArgumentException('El teléfono de contacto debe ser un número celular peruano de 9 dígitos que inicie con 9.');
        }

        return '+51 '.substr($soloDigitos, 0, 3).' '.substr($soloDigitos, 3, 3).' '.substr($soloDigitos, 6, 3);
    }
}
