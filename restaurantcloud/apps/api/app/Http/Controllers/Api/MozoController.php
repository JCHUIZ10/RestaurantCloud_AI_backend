<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MozoController extends Controller
{
    /**
     * CU-MOZO-01: Obtener el plano del salón completo con pisos, mesas y despacho en vivo.
     */
    public function getPlano(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;
        $pisoSolicitadoId = $request->query('piso_id');

        // 1. Pisos activos del local
        $pisosRaw = DB::table('piso')
            ->where('local_id', $localId)
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get();

        if ($pisosRaw->isEmpty()) {
            return ApiResponse::ok([
                'piso_activo' => null,
                'pisos_disponibles' => [],
                'mesas' => [],
                'items_despacho' => [],
                'comandas_preparacion' => [],
                'alertas_operativas' => [],
                'mesas_libres' => 0,
                'mesas_ocupadas' => 0,
                'total_mesas' => 0,
                'mis_mesas_activas' => 0,
                'total_venta_turno' => 0.0,
                'mozo_actual' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'rol' => $user->rol,
                ],
            ]);
        }

        $pisoActivo = $pisosRaw->firstWhere('id', $pisoSolicitadoId) ?? $pisosRaw->first();

        // 2. Mesas del local con su pedido activo
        $mesasRaw = DB::table('mesa as m')
            ->leftJoin('pedido as p', function ($join) {
                $join->on('p.mesa_id', '=', 'm.id')
                    ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador']);
            })
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('m.local_id', $localId)
            ->where('m.estado', 'activa')
            ->select([
                'm.id',
                'm.piso_id',
                'm.numero',
                'm.capacidad',
                'm.forma',
                'm.posicion_x',
                'm.posicion_y',
                'm.permite_union',
                'm.mesa_principal_id',
                'p.id as pedido_id',
                'p.numero_comanda',
                'p.estado as pedido_estado',
                'p.comensales',
                'p.mozo_id',
                'p.created_at as pedido_created_at',
                'p.precuenta_generada_at',
                'u.nombre as mozo_nombre',
            ])
            ->orderBy('m.numero')
            ->get();

        // Obtener ítems de todos los pedidos activos para calcular métricas por mesa
        $pedidoIds = $mesasRaw->pluck('pedido_id')->filter()->unique();
        $itemsPorPedido = collect();
        if ($pedidoIds->isNotEmpty()) {
            $itemsPorPedido = DB::table('pedido_item as pi')
                ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
                ->whereIn('pi.pedido_id', $pedidoIds)
                ->where('pi.estado', '!=', 'anulado')
                ->select([
                    'pi.id',
                    'pi.pedido_id',
                    'pi.producto_id',
                    'pi.cantidad',
                    'pi.precio_unitario',
                    'pi.estado',
                    'pi.nota_cocina',
                    'pi.fecha_listo_cocina',
                    'pi.created_at',
                    'prod.nombre as producto_nombre',
                    'prod.requiere_preparacion',
                ])
                ->get()
                ->groupBy('pedido_id');
        }

        // Consultar reservas confirmadas próximas (dentro de 30 minutos)
        $reservasProximas = DB::table('reserva as r')
            ->join('reserva_mesa as rm', 'rm.reserva_id', '=', 'r.id')
            ->where('r.local_id', $localId)
            ->where('r.estado', 'confirmada')
            ->where('r.fecha_hora', '>=', now())
            ->where('r.fecha_hora', '<=', now()->addMinutes(35))
            ->select([
                'rm.mesa_id',
                'r.cliente_nombre',
                'r.fecha_hora',
            ])
            ->get()
            ->keyBy('mesa_id');

        $mesas = $mesasRaw->map(function ($m) use ($user, $itemsPorPedido, $reservasProximas) {
            $pedidoItems = $m->pedido_id ? ($itemsPorPedido->get($m->pedido_id) ?? collect()) : collect();

            $platosListos = $pedidoItems->where('requiere_preparacion', true)->where('estado', 'listo')->count();
            $platosEnCocina = $pedidoItems->where('requiere_preparacion', true)->whereIn('estado', ['en_cola', 'en_preparacion'])->count();
            $despachoDirecto = $pedidoItems->where('requiere_preparacion', false)->where('estado', 'listo')->count();
            $totalConsumo = (float) $pedidoItems->sum(fn ($i) => (float) $i->cantidad * (float) $i->precio_unitario);

            $estadoMesa = 'libre';
            $reservaCliente = null;
            $reservaHora = null;
            $minutosReserva = null;

            if ($m->pedido_id) {
                $estadoMesa = $m->precuenta_generada_at ? 'cuenta_pedida' : 'ocupada';
            } elseif ($reservasProximas->has($m->id)) {
                $res = $reservasProximas->get($m->id);
                $estadoMesa = 'bloqueada';
                $reservaCliente = $res->cliente_nombre;
                $reservaHora = date('H:i', strtotime($res->fecha_hora));
                $minutosReserva = (int) max(1, round((strtotime($res->fecha_hora) - now()->timestamp) / 60));
            }

            $minutosOcupada = $m->pedido_created_at
                ? (int) max(0, round((now()->timestamp - strtotime($m->pedido_created_at)) / 60))
                : null;

            return [
                'id' => $m->id,
                'piso_id' => $m->piso_id,
                'numero' => $m->numero,
                'capacidad' => (int) $m->capacidad,
                'forma' => $m->forma,
                'posicion_x' => (int) $m->posicion_x,
                'posicion_y' => (int) $m->posicion_y,
                'permite_union' => (bool) $m->permite_union,
                'mesa_principal_id' => $m->mesa_principal_id,
                'estado' => $estadoMesa,
                'pedido_id' => $m->pedido_id,
                'comensales_sentados' => $m->pedido_id ? (int) $m->comensales : null,
                'minutos_ocupada' => $minutosOcupada,
                'total_consumo' => $m->pedido_id ? round($totalConsumo, 2) : null,
                'mozo_id' => $m->mozo_id,
                'mozo_nombre' => $m->mozo_nombre,
                'es_mi_mesa' => $m->mozo_id === $user->id,
                'platos_listos' => $platosListos,
                'platos_en_cocina' => $platosEnCocina,
                'despacho_directo_pendiente' => $despachoDirecto,
                'bebidas_pendientes' => $despachoDirecto,
                'reserva_cliente' => $reservaCliente,
                'reserva_hora' => $reservaHora,
                'minutos_para_reserva' => $minutosReserva,
            ];
        });

        // 3. Contadores por piso
        $pisosDTO = $pisosRaw->map(function ($p) use ($mesas) {
            $mesasPiso = $mesas->where('piso_id', $p->id);
            $ocupadas = $mesasPiso->whereIn('estado', ['ocupada', 'cuenta_pedida'])->count();
            $libres = $mesasPiso->where('estado', 'libre')->count();

            return [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'total_mesas' => $mesasPiso->count(),
                'mesas_ocupadas' => $ocupadas,
                'mesas_libres' => $libres,
            ];
        });

        $pisoActivoDTO = $pisosDTO->firstWhere('id', $pisoActivo->id);

        // 4. Barra Lateral: Ítems Despacho en Vivo (Cocina KDS listos + Bebidas Salón listas)
        $itemsDespachoRaw = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->where('pi.estado', 'listo')
            ->select([
                'pi.id as item_id',
                'pi.pedido_id',
                'm.id as mesa_id',
                'm.numero as mesa_numero',
                'pis.nombre as ambiente',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.nota_cocina as nota_especial',
                'prod.requiere_preparacion',
                'pi.fecha_listo_cocina',
                'pi.created_at',
                'u.nombre as mozo_nombre',
                'p.mozo_id',
            ])
            ->orderBy('pi.updated_at', 'desc')
            ->get();

        $itemsDespacho = $itemsDespachoRaw->map(function ($it) use ($user) {
            $segundos = $it->fecha_listo_cocina
                ? (int) max(0, now()->timestamp - strtotime($it->fecha_listo_cocina))
                : (int) max(0, now()->timestamp - strtotime($it->created_at));

            return [
                'item_id' => $it->item_id,
                'pedido_id' => $it->pedido_id,
                'mesa_id' => $it->mesa_id,
                'mesa_numero' => $it->mesa_numero,
                'ambiente' => $it->ambiente,
                'producto_nombre' => $it->producto_nombre,
                'cantidad' => (int) $it->cantidad,
                'nota_especial' => $it->nota_especial,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
                'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                'pase_cocina' => $it->requiere_preparacion ? 'Pase Caliente #01' : null,
                'segundos_listo' => $segundos,
                'mozo_nombre' => $it->mozo_nombre,
                'es_mi_mesa' => $it->mozo_id === $user->id,
            ];
        });

        // 5. Comandas en Preparación KDS
        $comandasPrepRaw = DB::table('pedido as p')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('pedido_item as pi', 'pi.pedido_id', '=', 'p.id')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'borrador'])
            ->where('prod.requiere_preparacion', true)
            ->whereIn('pi.estado', ['en_cola', 'en_preparacion'])
            ->select([
                'p.id as pedido_id',
                'm.numero as mesa_numero',
                'p.numero_comanda',
                'p.created_at',
                DB::raw('COUNT(pi.id) as total_items'),
                DB::raw("COUNT(CASE WHEN pi.estado = 'en_preparacion' THEN 1 END) as items_en_fuego"),
            ])
            ->groupBy('p.id', 'm.numero', 'p.numero_comanda', 'p.created_at')
            ->get();

        $comandasPreparacion = $comandasPrepRaw->map(function ($cp) {
            $minutos = (int) max(0, round((now()->timestamp - strtotime($cp->created_at)) / 60));
            return [
                'pedido_id' => $cp->pedido_id,
                'mesa_numero' => $cp->mesa_numero,
                'numero_comanda' => (int) $cp->numero_comanda,
                'minutos_transcurridos' => $minutos,
                'total_items' => (int) $cp->total_items,
                'items_en_fuego' => (int) $cp->items_en_fuego,
            ];
        });

        // 6. Alertas operativas (productos agotados o demoras)
        $alertasOperativas = [];
        $productosAgotados = DB::table('producto')
            ->where('local_id', $localId)
            ->where('disponibilidad', 'agotado')
            ->select('id', 'nombre')
            ->limit(3)
            ->get();

        foreach ($productosAgotados as $pa) {
            $alertasOperativas[] = [
                'id' => 'alerta-agotado-' . $pa->id,
                'tipo' => 'quiebre_insumo',
                'titulo' => 'Plato Agotado en Cocina',
                'descripcion' => "{$pa->nombre} no disponible para comandar.",
                'hora' => date('H:i'),
            ];
        }

        // 7. Métricas del piso activo y turno
        $mesasPisoActivo = $mesas->where('piso_id', $pisoActivo->id);
        $mesasLibres = $mesasPisoActivo->where('estado', 'libre')->count();
        $mesasOcupadas = $mesasPisoActivo->whereIn('estado', ['ocupada', 'cuenta_pedida'])->count();
        $totalMesas = $mesasPisoActivo->count();
        $misMesasActivas = $mesas->where('es_mi_mesa', true)->whereIn('estado', ['ocupada', 'cuenta_pedida'])->count();
        $totalVentaTurno = (float) $mesas->whereIn('estado', ['ocupada', 'cuenta_pedida'])->sum('total_consumo');

        return ApiResponse::ok([
            'piso_activo' => $pisoActivoDTO,
            'pisos_disponibles' => $pisosDTO,
            'mesas' => $mesas->values(),
            'items_despacho' => $itemsDespacho->values(),
            'comandas_preparacion' => $comandasPreparacion->values(),
            'alertas_operativas' => $alertasOperativas,
            'mesas_libres' => $mesasLibres,
            'mesas_ocupadas' => $mesasOcupadas,
            'total_mesas' => $totalMesas,
            'mis_mesas_activas' => $misMesasActivas,
            'total_venta_turno' => round($totalVentaTurno, 2),
            'mozo_actual' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'rol' => $user->rol,
            ],
        ]);
    }

    /**
     * CU-MOZO-01: Abrir una mesa libre sentando comensales.
     */
    public function abrirMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('La mesa especificada no existe en esta sede.', 404);
        }

        $comensales = (int) $request->input('comensales', $mesa->capacidad ?: 2);

        return DB::transaction(function () use ($mesa, $comensales, $user, $localId) {
            // Verificar si ya tiene pedido activo
            $pedidoExistente = DB::table('pedido')
                ->where('mesa_id', $mesa->id)
                ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
                ->first();

            if ($pedidoExistente) {
                return ApiResponse::ok([
                    'pedido_id' => $pedidoExistente->id,
                    'pedidoId' => $pedidoExistente->id,
                    'mensaje' => 'La mesa ya contaba con un pedido activo.',
                ]);
            }

            $siguienteComanda = ((int) DB::table('pedido')
                ->where('local_id', $localId)
                ->max('numero_comanda')) + 1;

            $pedidoId = (string) Str::uuid();

            DB::table('pedido')->insert([
                'id' => $pedidoId,
                'local_id' => $localId,
                'numero_comanda' => $siguienteComanda,
                'mesa_id' => $mesa->id,
                'mozo_id' => $user->id,
                'estado' => 'enviado',
                'comensales' => $comensales,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return ApiResponse::ok([
                'pedido_id' => $pedidoId,
                'pedidoId' => $pedidoId,
                'mensaje' => "Mesa {$mesa->numero} abierta exitosamente con {$comensales} comensales.",
            ], 201);
        });
    }

    /**
     * CU-MOZO-01: Obtener detalle de mesa para el Quick-Drawer táctil.
     */
    public function getDetalleMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa as m')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.id', $id)
            ->where('m.local_id', $localId)
            ->select('m.*', 'pis.nombre as ambiente_nombre')
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesa->id)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select('p.*', 'u.nombre as mozo_nombre')
            ->orderBy('p.created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'numero' => $mesa->numero,
                'ambiente' => $mesa->ambiente_nombre,
                'estado' => 'libre',
                'comanda_id' => null,
                'mozo_nombre' => $user->nombre,
                'minutos_en_mesa' => 0,
                'comensales' => (int) $mesa->capacidad,
                'items' => [],
                'total_subtotal' => 0.0,
            ]);
        }

        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->select([
                'pi.id',
                'pi.producto_id',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'prod.requiere_preparacion',
                'pi.estado',
                'pi.numero_ronda',
                'pi.updated_at',
            ])
            ->orderBy('pi.created_at')
            ->get();

        $items = $itemsRaw->map(function ($it) {
            $subtotal = (float) $it->cantidad * (float) $it->precio_unitario;
            $minutosEstado = (int) max(0, round((now()->timestamp - strtotime($it->updated_at)) / 60));

            return [
                'id' => $it->id,
                'producto_id' => $it->producto_id,
                'producto_nombre' => $it->producto_nombre,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => round($subtotal, 2),
                'nota_cocina' => $it->nota_cocina,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
                'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                'estado' => $it->estado,
                'minutos_en_estado' => $minutosEstado,
                'numero_ronda' => (int) $it->numero_ronda,
            ];
        });

        $totalSubtotal = (float) $items->sum('subtotal');
        $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'numero' => $mesa->numero,
            'ambiente' => $mesa->ambiente_nombre,
            'estado' => $pedido->precuenta_generada_at ? 'cuenta_pedida' : 'ocupada',
            'comanda_id' => $pedido->id,
            'mozo_nombre' => $pedido->mozo_nombre ?? $user->nombre,
            'minutos_en_mesa' => $minutosEnMesa,
            'comensales' => (int) $pedido->comensales,
            'items' => $items->values(),
            'total_subtotal' => round($totalSubtotal, 2),
        ]);
    }

    /**
     * CU-MOZO-01: Marcar plato o bebida servido en salón en 1 toque.
     */
    public function marcarItemServido(string $id, Request $request): JsonResponse
    {
        $user = $request->user();

        $item = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('pi.id', $id)
            ->where('p.local_id', $user->local_id)
            ->select('pi.id', 'pi.estado')
            ->first();

        if (! $item) {
            return ApiResponse::error('Ítem de pedido no encontrado.', 404);
        }

        DB::table('pedido_item')
            ->where('id', $id)
            ->update([
                'estado' => 'entregado',
                'updated_at' => now(),
            ]);

        return ApiResponse::ok([
            'item_id' => $id,
            'estado' => 'entregado',
            'mensaje' => 'Ítem marcado como servido al comensal.',
        ]);
    }

    /**
     * CU-MOZO-01: Solicitar cuenta a caja en 1 toque (pasa comanda a cuenta_pedida).
     */
    public function solicitarCuenta(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $pedido = DB::table('pedido')
            ->where('mesa_id', $id)
            ->where('local_id', $localId)
            ->whereIn('estado', ['enviado', 'borrador'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('No hay una comanda activa para solicitar la cuenta en esta mesa.', 404);
        }

        DB::table('pedido')
            ->where('id', $pedido->id)
            ->update([
                'precuenta_generada_at' => now(),
                'estado' => 'cuenta_pedida',
                'updated_at' => now(),
            ]);

        return ApiResponse::ok([
            'mesa_id' => $id,
            'pedido_id' => $pedido->id,
            'mensaje' => 'Cuenta solicitada exitosamente. Se ha alertado al personal de Caja.',
        ]);
    }

    /**
     * CU-MOZO-01 / CU-MOZO-06: Liberar mesa cuando el cliente se retiró sin consumir (0 ítems).
     */
    public function liberarMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('La mesa no existe en esta sede.', 404);
        }

        $pedido = DB::table('pedido')
            ->where('mesa_id', $mesa->id)
            ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'numero' => $mesa->numero,
                'mensaje' => 'La mesa ya se encuentra libre.',
            ]);
        }

        // Verificar si existen ítems activos registrados
        $itemsActivos = DB::table('pedido_item')
            ->where('pedido_id', $pedido->id)
            ->where('estado', '!=', 'anulado')
            ->count();

        if ($itemsActivos > 0) {
            return ApiResponse::error(
                'No se puede liberar la mesa directamente porque posee platos o bebidas registrados. Debe anular los ítems o la comanda mediante el procedimiento regular.',
                422
            );
        }

        // Anular la comanda vacía
        DB::table('pedido')
            ->where('id', $pedido->id)
            ->update([
                'estado' => 'anulado',
                'updated_at' => now(),
            ]);

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'numero' => $mesa->numero,
            'mensaje' => "Mesa {$mesa->numero} liberada exitosamente. Vuelve a estar disponible para nuevos comensales.",
        ]);
    }

    /**
     * CU-MOZO-02: Obtener catálogo de la carta para el mozo.
     */
    public function getCarta(Request $request): JsonResponse
    {
        return $this->getCartaMesa('', $request);
    }

    /**
     * CU-MOZO-02: Obtener catálogo de la carta en contexto de una mesa específica.
     */
    public function getCartaMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesaNumero = '04';
        $ambienteNombre = 'Salón Principal';

        if (! empty($id)) {
            $mesa = DB::table('mesa as m')
                ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
                ->where('m.id', $id)
                ->where('m.local_id', $localId)
                ->select('m.numero', 'pis.nombre as ambiente_nombre')
                ->first();

            if ($mesa) {
                $mesaNumero = $mesa->numero;
                $ambienteNombre = $mesa->ambiente_nombre;
            }
        }

        $categorias = DB::table('categoria_producto')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->orderBy('orden')
            ->get();

        $productosRaw = DB::table('producto as p')
            ->join('categoria_producto as c', 'c.id', '=', 'p.categoria_id')
            ->where('c.local_id', $localId)
            ->where('p.activo', true)
            ->select([
                'p.id',
                'p.categoria_id',
                'c.nombre as categoria_nombre',
                'p.nombre',
                'p.descripcion',
                'p.precio',
                'p.foto_url',
                'p.disponibilidad',
                'p.requiere_preparacion',
            ])
            ->orderBy('p.nombre')
            ->get();

        $productos = $productosRaw->map(function ($p) {
            return [
                'id' => $p->id,
                'categoria_id' => $p->categoria_id,
                'categoria_nombre' => $p->categoria_nombre,
                'nombre' => $p->nombre,
                'descripcion' => $p->descripcion ?? '',
                'precio' => (float) $p->precio,
                'foto_url' => $p->foto_url,
                'disponibilidad' => $p->disponibilidad,
                'requiere_preparacion' => (bool) $p->requiere_preparacion,
            ];
        });

        $categoriasDTO = $categorias->map(function ($c) use ($productos) {
            return [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'total_platos' => $productos->where('categoria_id', $c->id)->count(),
            ];
        });

        return ApiResponse::ok([
            'mesa_id' => $id,
            'mesa_numero' => $mesaNumero,
            'ambiente_nombre' => $ambienteNombre,
            'categorias' => $categoriasDTO->values(),
            'productos' => $productos->values(),
        ]);
    }

    /**
     * CU-MOZO-02: Obtener historial de consumos y rondas previas de la mesa.
     */
    public function getHistorialMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $pedido = DB::table('pedido')
            ->where('mesa_id', $mesa->id)
            ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::ok([
                'mesa_id' => $mesa->id,
                'mesa_numero' => $mesa->numero,
                'comensales' => (int) $mesa->capacidad,
                'comanda_id' => null,
                'numero_comanda' => null,
                'ronda_actual' => 1,
                'rondas_previas' => [],
                'total_acumulado' => 0.0,
            ]);
        }

        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->select([
                'pi.id',
                'pi.numero_ronda',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'prod.requiere_preparacion',
                'pi.estado',
                'pi.created_at',
            ])
            ->orderBy('pi.numero_ronda')
            ->orderBy('pi.created_at')
            ->get();

        $maxRonda = $itemsRaw->max('numero_ronda') ?: 0;
        $rondaActual = $maxRonda + 1;

        $rondasAgrupadas = $itemsRaw->groupBy('numero_ronda')->map(function ($items, $numRonda) {
            $primero = $items->first();
            $minutosHace = (int) max(0, round((now()->timestamp - strtotime($primero->created_at)) / 60));

            return [
                'numero_ronda' => (int) $numRonda,
                'enviada_a' => date('H:i', strtotime($primero->created_at)),
                'minutos_hace' => $minutosHace,
                'items' => $items->map(fn ($it) => [
                    'id' => $it->id,
                    'producto_nombre' => $it->producto_nombre,
                    'cantidad' => (int) $it->cantidad,
                    'precio_unitario' => (float) $it->precio_unitario,
                    'subtotal' => round((float) $it->cantidad * (float) $it->precio_unitario, 2),
                    'nota_cocina' => $it->nota_cocina,
                    'requiere_preparacion' => (bool) $it->requiere_preparacion,
                    'tipo_despacho' => $it->requiere_preparacion ? 'cocina' : 'directo_salon',
                    'estado' => $it->estado,
                ])->values(),
            ];
        });

        $totalAcumulado = (float) $itemsRaw->sum(fn ($i) => (float) $i->cantidad * (float) $i->precio_unitario);

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'comensales' => (int) $pedido->comensales,
            'comanda_id' => $pedido->id,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'ronda_actual' => $rondaActual,
            'rondas_previas' => $rondasAgrupadas->values(),
            'total_acumulado' => round($totalAcumulado, 2),
        ]);
    }

    /**
     * Alias de envío para /mozo/mesas/{id}/pedidos.
     */
    public function enviarPedidoMesa(string $id, Request $request): JsonResponse
    {
        $request->merge(['mesa_id' => $id]);
        return $this->crearPedido($request);
    }

    /**
     * CU-MOZO-02: Envío de comanda a cocina y salón con validación de agotados (409 Conflict).
     */
    public function crearPedido(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'mesa_id' => ['required', 'uuid'],
            'comensales' => ['nullable', 'integer', 'min:1'],
            'numero_ronda' => ['nullable', 'integer', 'min:1'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => ['required', 'uuid'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.nota_cocina' => ['nullable', 'string', 'max:200'],
        ]);

        $mesa = DB::table('mesa')->where('id', $validated['mesa_id'])->where('local_id', $localId)->first();
        if (! $mesa) {
            return ApiResponse::error('La mesa especificada no existe en esta sede.', 404);
        }

        // 1. Validación de Disponibilidad / Stock Concurrente
        $productoIds = collect($validated['items'])->pluck('producto_id')->unique();
        $productosDB = DB::table('producto')
            ->whereIn('id', $productoIds)
            ->where('local_id', $localId)
            ->get()
            ->keyBy('id');

        foreach ($validated['items'] as $it) {
            $prod = $productosDB->get($it['producto_id']);
            if (! $prod) {
                return ApiResponse::error("El producto {$it['producto_id']} no existe en el catálogo.", 400);
            }
            if ($prod->disponibilidad === 'agotado') {
                return response()->json([
                    'exito' => false,
                    'datos' => null,
                    'errores' => [
                        [
                            'codigo' => 'ERR_PRODUCTO_AGOTADO',
                            'mensaje' => "El insumo o plato '{$prod->nombre}' se agotó en cocina hace segundos. Por favor coordina una sustitución con el comensal.",
                            'producto_id' => $prod->id,
                            'producto_nombre' => $prod->nombre,
                        ],
                    ],
                    'meta' => ['timestamp' => now()->toIso8601String()],
                ], 409);
            }
        }

        // 2. Transacción de inserción
        return DB::transaction(function () use ($validated, $user, $localId, $productosDB, $mesa) {
            $pedidoExistente = DB::table('pedido')
                ->where('mesa_id', $validated['mesa_id'])
                ->whereIn('estado', ['enviado', 'cuenta_pedida', 'borrador'])
                ->first();

            $comensales = $validated['comensales'] ?? ($pedidoExistente?->comensales ?? $mesa->capacidad ?: 2);
            $pedidoId = $pedidoExistente ? $pedidoExistente->id : (string) Str::uuid();

            if (! $pedidoExistente) {
                $siguienteComanda = ((int) DB::table('pedido')
                    ->where('local_id', $localId)
                    ->max('numero_comanda')) + 1;

                DB::table('pedido')->insert([
                    'id' => $pedidoId,
                    'local_id' => $localId,
                    'numero_comanda' => $siguienteComanda,
                    'mesa_id' => $validated['mesa_id'],
                    'mozo_id' => $user->id,
                    'estado' => 'enviado',
                    'comensales' => $comensales,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Calcular número de ronda
            $rondaMax = (int) DB::table('pedido_item')
                ->where('pedido_id', $pedidoId)
                ->max('numero_ronda');
            $numeroRonda = $validated['numero_ronda'] ?? ($rondaMax + 1);

            $itemsInsertados = 0;
            $itemsCocina = 0;
            $itemsSalon = 0;

            foreach ($validated['items'] as $item) {
                $prod = $productosDB->get($item['producto_id']);
                if (! $prod) continue;

                $requiereCocina = (bool) $prod->requiere_preparacion;
                // Si requiere preparación va a la cola KDS, si es bebida/postre de salón nace listo de inmediato
                $estadoInicial = $requiereCocina ? 'en_cola' : 'listo';
                $fechaListo = $requiereCocina ? null : now();

                DB::table('pedido_item')->insert([
                    'id' => (string) Str::uuid(),
                    'pedido_id' => $pedidoId,
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $prod->precio,
                    'nota_cocina' => $item['nota_cocina'] ?? null,
                    'estado' => $estadoInicial,
                    'numero_ronda' => $numeroRonda,
                    'fecha_listo_cocina' => $fechaListo,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $itemsInsertados++;
                if ($requiereCocina) {
                    $itemsCocina++;
                } else {
                    $itemsSalon++;
                }
            }

            return ApiResponse::ok([
                'pedido_id' => $pedidoId,
                'ronda' => $numeroRonda,
                'items_cocina' => $itemsCocina,
                'items_salon' => $itemsSalon,
                'mensaje' => "Comanda enviada exitosamente ({$itemsCocina} a cocina, {$itemsSalon} a salón).",
            ], 201);
        });
    }

    /**
     * CU-MOZO-08: Precuenta digital de mesa en salón.
     */
    public function getPrecuentaMesa(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa as m')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.id', $id)
            ->where('m.local_id', $localId)
            ->select('m.*', 'pis.nombre as ambiente_nombre')
            ->first();

        if (! $mesa) {
            return ApiResponse::error('Mesa no encontrada.', 404);
        }

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesa->id)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select('p.*', 'u.nombre as mozo_nombre')
            ->orderBy('p.created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('No existe un pedido activo para generar la precuenta de esta mesa.', 404);
        }

        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->select([
                'pi.id',
                'prod.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'pi.numero_ronda',
                'prod.requiere_preparacion',
                'pi.estado',
            ])
            ->get();

        $items = $itemsRaw->map(function ($it) {
            $subtotal = round((float) $it->cantidad * (float) $it->precio_unitario, 2);
            return [
                'id' => $it->id,
                'producto_nombre' => $it->producto_nombre,
                'nota_cocina' => $it->nota_cocina,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => $subtotal,
                'estado_cocina' => $it->estado,
                'numero_ronda' => (int) $it->numero_ronda,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
            ];
        });

        $total = (float) $items->sum('subtotal');
        $baseImponible = round($total / 1.18, 2);
        $igv = round($total - $baseImponible, 2);

        $tieneCocinaPendiente = $itemsRaw->where('requiere_preparacion', true)->whereIn('estado', ['en_cola', 'en_preparacion'])->isNotEmpty();

        $metodosPagoRaw = DB::table('metodo_pago_local')
            ->where('local_id', $localId)
            ->where('activo', true)
            ->orderBy('orden')
            ->get();

        $opcionesPago = $metodosPagoRaw->map(function ($mp) use ($total) {
            $comision = round($total * ((float) $mp->comision_porcentaje / 100), 2);
            return [
                'codigo' => $mp->codigo,
                'nombre' => $mp->nombre,
                'comision_porcentaje' => (float) $mp->comision_porcentaje,
                'monto_comision' => $comision,
                'total_estimado' => round($total + $comision, 2),
                'detalle_billetera' => $mp->codigo === 'billetera_digital' ? [
                    'telefono' => '+51 987 654 321',
                    'titular' => 'AUREA RESTAURANTE',
                    'ruc' => '20601234567',
                    'monto_exacto' => round($total, 2),
                ] : null,
            ];
        });

        $promociones = DB::table('promocion')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->select('id', 'nombre', 'valor as porcentaje_descuento', 'descripcion')
            ->get();

        $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'ambiente' => $mesa->ambiente_nombre,
            'es_mesa_unida' => ! empty($mesa->mesa_principal_id),
            'mozo_nombre' => $pedido->mozo_nombre ?? $user->nombre,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'comensales' => (int) $pedido->comensales,
            'minutos_en_mesa' => $minutosEnMesa,
            'items' => $items->values(),
            'consumos' => $items->values(),
            'tiene_cocina_pendiente' => $tieneCocinaPendiente,
            'alerta_cocina' => $tieneCocinaPendiente ? 'Existen platos pendientes de salida en cocina.' : null,
            'promociones_disponibles' => $promociones,
            'promocion_activa' => null,
            'tributacion_sunat' => [
                'consumo_bruto' => round($total, 2),
                'descuento_comercial' => 0.0,
                'total_neto' => round($total, 2),
                'base_imponible' => $baseImponible,
                'igv' => $igv,
                'tasa_igv' => 18.0,
            ],
            'opciones_pago' => $opcionesPago->values(),
            'subtotal' => $baseImponible,
            'descuento' => 0.0,
            'base_imponible' => $baseImponible,
            'igv' => $igv,
            'total' => round($total, 2),
            'calculada_at' => now()->toIso8601String(),
        ]);
    }
}
