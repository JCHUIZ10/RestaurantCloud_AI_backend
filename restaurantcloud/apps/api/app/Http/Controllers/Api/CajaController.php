<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CajaController extends Controller
{
    /**
     * Obtener la precuenta consolidada de una mesa para el terminal POS.
     */
    public function getPrecuentaMesa(Request $request, string $mesaId): JsonResponse
    {
        $mesa = DB::table('mesa')->where('id', $mesaId)->first();
        if (! $mesa) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'La mesa no existe.', 404);
        }

        $pedido = DB::table('pedido as p')
            ->join('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesaId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select([
                'p.id',
                'p.numero_comanda',
                'p.comensales',
                'p.mozo_id',
                'u.nombre as mozo_nombre',
                'p.created_at',
            ])
            ->first();

        if (! $pedido) {
            return ApiResponse::error('PEDIDO_NO_ACTIVO', 'La mesa no tiene consumos activos.', 404);
        }

        $items = DB::table('pedido_item as pi')
            ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->whereNotIn('pi.estado', ['anulado', 'no_disponible'])
            ->select([
                'pi.id',
                'pi.producto_id',
                'pr.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                DB::raw('(pi.cantidad * pi.precio_unitario) as subtotal'),
            ])
            ->get();

        $totalConsumo = (float) $items->sum('subtotal');
        // Cálculo tributario SUNAT Perú (IGV 18% incluido)
        $baseImponible = round($totalConsumo / 1.18, 2);
        $igv = round($totalConsumo - $baseImponible, 2);

        // Marcar en pedido que la precuenta fue generada
        DB::table('pedido')->where('id', $pedido->id)->update([
            'precuenta_generada_at' => now(),
            'estado' => 'cuenta_pedida',
            'updated_at' => now(),
        ]);

        return ApiResponse::ok([
            'mesa' => [
                'id' => $mesa->id,
                'numero' => $mesa->numero,
            ],
            'pedido' => [
                'id' => $pedido->id,
                'numero_comanda' => (int) $pedido->numero_comanda,
                'mozo_nombre' => $pedido->mozo_nombre,
                'comensales' => (int) $pedido->comensales,
            ],
            'items' => $items,
            'totales' => [
                'subtotal_neto' => $baseImponible,
                'igv' => $igv,
                'total' => $totalConsumo,
            ],
        ]);
    }

    /**
     * Registrar cobro del pedido, emitir comprobante y liberar mesa.
     */
    public function cobrar(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'pedido_id' => ['required', 'uuid'],
            'tipo_comprobante' => ['required', 'string', 'in:boleta,factura,nota_venta'],
            'medio_pago' => ['required', 'string', 'in:efectivo,tarjeta,billetera_digital'],
            'monto_recibido' => ['nullable', 'numeric', 'min:0'],
            'documento_cliente' => ['nullable', 'string', 'max:20'],
            'nombre_cliente' => ['nullable', 'string', 'max:150'],
        ]);

        return DB::transaction(function () use ($validated, $user, $localId) {
            $pedido = DB::table('pedido')->where('id', $validated['pedido_id'])->lockForUpdate()->first();

            if (! $pedido) {
                return ApiResponse::error('PEDIDO_NO_ENCONTRADO', 'El pedido no existe.', 404);
            }

            if ($pedido->estado === 'cobrado') {
                return ApiResponse::error('PEDIDO_YA_COBRADO', 'El pedido ya fue cobrado anteriormente.', 409);
            }

            // Calcular monto total
            $totalConsumo = (float) DB::table('pedido_item')
                ->where('pedido_id', $pedido->id)
                ->whereNotIn('estado', ['anulado', 'no_disponible'])
                ->sum(DB::raw('cantidad * precio_unitario'));

            $baseImponible = round($totalConsumo / 1.18, 2);
            $igv = round($totalConsumo - $baseImponible, 2);

            $montoRecibido = isset($validated['monto_recibido']) ? (float) $validated['monto_recibido'] : $totalConsumo;
            $vuelto = max(0, round($montoRecibido - $totalConsumo, 2));

            // Obtener caja abierta para el local
            $caja = DB::table('caja')
                ->where('local_id', $localId)
                ->where('estado', 'abierta')
                ->first();

            $cajaId = $caja ? $caja->id : null;

            // Si no hay caja abierta creada, obtener la primera o asociar id dummy de semilla
            if (! $cajaId) {
                $cajaId = DB::table('caja')->where('local_id', $localId)->value('id');
            }

            // Serie y correlativo deterministas
            $serie = $validated['tipo_comprobante'] === 'factura' ? 'F001' : 'B001';
            $ultimoCorrelativo = (int) DB::table('comprobante')
                ->where('serie', $serie)
                ->max('correlativo');
            $correlativo = $ultimoCorrelativo + 1;

            $comprobanteId = (string) Str::uuid();

            // Insertar comprobante oficial
            DB::table('comprobante')->insert([
                'id' => $comprobanteId,
                'pedido_id' => $pedido->id,
                'caja_id' => $cajaId,
                'tipo' => $validated['tipo_comprobante'],
                'serie' => $serie,
                'correlativo' => $correlativo,
                'documento_cliente' => $validated['documento_cliente'] ?? null,
                'nombre_cliente' => $validated['nombre_cliente'] ?? 'Cliente General',
                'medio_pago' => $validated['medio_pago'],
                'subtotal_consumo' => $baseImponible,
                'base_imponible' => $baseImponible,
                'igv' => $igv,
                'total' => $totalConsumo,
                'monto_recibido' => $montoRecibido,
                'vuelto' => $vuelto,
                'estado' => 'emitido',
                'token_qr' => (string) Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Actualizar pedido a 'cobrado'
            DB::table('pedido')->where('id', $pedido->id)->update([
                'estado' => 'cobrado',
                'updated_at' => now(),
            ]);

            return ApiResponse::ok([
                'comprobante_id' => $comprobanteId,
                'serie' => $serie,
                'correlativo' => $correlativo,
                'total' => $totalConsumo,
                'vuelto' => $vuelto,
                'mensaje' => 'Comprobante emitido y comanda cobrada exitosamente.',
            ]);
        });
    }
}
