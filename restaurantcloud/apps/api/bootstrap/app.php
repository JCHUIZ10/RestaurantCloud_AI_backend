<?php

use App\Http\Middleware\EnsureModuloReservas;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\RedisTokenAuth;
use App\Http\Middleware\TenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Detrás de Caddy (TLS): respetar X-Forwarded-* para generar URLs https.
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'auth.redis' => RedisTokenAuth::class,
            'tenant.context' => TenantContext::class,
            'role' => EnsureRole::class,
            'modulo.reservas' => EnsureModuloReservas::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
