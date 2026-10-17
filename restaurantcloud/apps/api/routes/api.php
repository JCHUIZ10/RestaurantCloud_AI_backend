<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CajaController;
use App\Http\Controllers\Api\CocinaController;
use App\Http\Controllers\Api\MozoController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    // Healthcheck
    Route::get('/health', fn () => response()->json([
        'exito' => true,
        'datos' => ['servicio' => 'restaurantcloud-api', 'status' => 'online'],
        'meta' => ['timestamp' => now()->toIso8601String()],
    ]));

    // Autenticación pública
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/seleccionar-cuenta', [AuthController::class, 'seleccionarCuenta']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Rutas protegidas con Caché de Sesión en Redis (Alta Velocidad)
    Route::middleware('auth.redis')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);


        // Salón / Mozo (CU-MOZO-01, CU-MOZO-02, CU-MOZO-08)
        Route::prefix('mozo')->group(function (): void {
            // CU-MOZO-01: Centro de Salón y Mesas en Vivo
            Route::get('/plano', [MozoController::class, 'getPlano']);
            Route::post('/mesas/{id}/abrir', [MozoController::class, 'abrirMesa']);
            Route::get('/mesas/{id}/detalle', [MozoController::class, 'getDetalleMesa']);
            Route::patch('/items/{id}/servido', [MozoController::class, 'marcarItemServido']);
            Route::post('/mesas/{id}/solicitar-cuenta', [MozoController::class, 'solicitarCuenta']);
            Route::post('/mesas/{id}/liberar', [MozoController::class, 'liberarMesa']);

            // CU-MOZO-02: Catálogo de Carta, Historial y Despacho de Comandas
            Route::get('/carta', [MozoController::class, 'getCarta']);
            Route::get('/mesas/{id}/carta', [MozoController::class, 'getCartaMesa']);
            Route::get('/mesas/{id}/historial', [MozoController::class, 'getHistorialMesa']);
            Route::post('/pedidos', [MozoController::class, 'crearPedido']);
            Route::post('/mesas/{id}/pedidos', [MozoController::class, 'enviarPedidoMesa']);

            // CU-MOZO-08: Precuenta Digital en Salón
            Route::get('/mesas/{id}/precuenta', [MozoController::class, 'getPrecuentaMesa']);
        });

        // Cocina / KDS
        Route::prefix('cocina')->group(function (): void {
            Route::get('/comandas', [CocinaController::class, 'getComandas']);
            Route::patch('/items/{id}/estado', [CocinaController::class, 'cambiarEstadoItem']);
        });

        // Caja / POS
        Route::prefix('caja')->group(function (): void {
            Route::get('/mesas/{id}/cuenta', [CajaController::class, 'getPrecuentaMesa']);
            Route::post('/cobrar', [CajaController::class, 'cobrar']);
        });
    });
});
