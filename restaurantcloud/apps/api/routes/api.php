<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => response()->json([
        'exito' => true,
        'datos' => ['servicio' => 'restaurantcloud-api'],
        'meta' => ['timestamp' => now()->toIso8601String()],
    ]));

    Route::get('/user', fn (\Illuminate\Http\Request $request) => $request->user())
        ->middleware('auth:sanctum');
});
