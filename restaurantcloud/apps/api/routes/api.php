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


        // Salón / Mozo
        Route::prefix('mozo')->group(function (): void {
            Route::get('/plano', [MozoController::class, 'getPlano']);
            Route::get('/carta', [MozoController::class, 'getCarta']);
            Route::post('/pedidos', [MozoController::class, 'crearPedido']);
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
