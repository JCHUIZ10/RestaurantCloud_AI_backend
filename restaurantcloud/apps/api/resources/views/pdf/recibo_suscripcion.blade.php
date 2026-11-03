@php
    $fechaPago = \Carbon\Carbon::parse($pago->fecha)->timezone('America/Lima');
    $esAnual = ($pago->ciclo_facturacion ?? 'mensual') === 'anual';
    $periodoHasta = $esAnual ? $fechaPago->copy()->addYear() : $fechaPago->copy()->addMonth();
    $origenes = [
        'stripe' => 'Tarjeta (Stripe)',
        'transferencia_bancaria' => 'Transferencia bancaria',
        'deposito_bancario' => 'Depósito bancario',
        'yape_empresa' => 'Yape empresarial',
        'efectivo' => 'Efectivo',
    ];
@endphp
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 11px; }
        h1 { font-size: 19px; margin: 0; } h2 { font-size: 14px; margin: 4px 0; }
        .muted { color: #6b7280; } .right { text-align: right; } .center { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f3f4f6; text-align: left; } th, td { border: 1px solid #d1d5db; padding: 7px; }
        .total { font-size: 14px; font-weight: bold; } .header { width: 100%; }
        .estado { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #d1fae5; color: #065f46; font-weight: bold; }
    </style>
</head>
<body>
    <table class="header" style="margin-top: 0; border: 0;">
        <tr>
            <td style="border: 0; width: 63%; padding: 0;">
                <h1>RestaurantCloud AI</h1>
                <div class="muted">Plataforma SaaS para restaurantes</div>
                <div class="muted">soporte@restaurantcloud.pe · WhatsApp +51 930 723 537</div>
            </td>
            <td class="right" style="border: 0; padding: 0;">
                <h2>CONSTANCIA DE PAGO DE SUSCRIPCIÓN</h2>
                <strong>{{ $pago->numero_recibo }}</strong>
                <div class="muted">Fecha de pago: {{ $fechaPago->format('d/m/Y H:i') }}</div>
            </td>
        </tr>
    </table>

    <p>
        <strong>Empresa:</strong> {{ $pago->razon_social }}<br>
        <strong>{{ $pago->tipo_identidad_fiscal === 'RUC_10' ? 'RUC (persona natural)' : 'RUC' }}:</strong> {{ $pago->ruc }}<br>
        <strong>Correo de contacto:</strong> {{ $pago->correo_contacto }}
    </p>

    <table>
        <thead><tr><th>Descripción</th><th>Periodo cubierto</th><th class="right">Importe</th></tr></thead>
        <tbody>
            <tr>
                <td>
                    Suscripción RestaurantCloud — Plan {{ $pago->plan_nombre }} ({{ $esAnual ? 'Anual' : 'Mensual' }})
                    @if($pago->nota)
                        <div class="muted">{{ $pago->nota }}</div>
                    @endif
                </td>
                <td>{{ $fechaPago->format('d/m/Y') }} — {{ $periodoHasta->format('d/m/Y') }}</td>
                <td class="right">S/ {{ number_format((float) $pago->monto, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table style="width: 42%; margin-left: auto;">
        <tr><td class="total">Total pagado</td><td class="right total">S/ {{ number_format((float) $pago->monto, 2) }}</td></tr>
    </table>

    <table>
        <tr><th style="width: 35%;">Estado</th><td><span class="estado">{{ strtoupper($pago->estado) }}</span></td></tr>
        <tr><th>Medio de pago</th><td>{{ $origenes[$pago->origen_pago] ?? $pago->origen_pago }}</td></tr>
        @if($pago->stripe_payment_id)
            <tr><th>Referencia Stripe</th><td>{{ $pago->stripe_payment_id }}</td></tr>
        @endif
        @if($pago->numero_operacion)
            <tr><th>N.º de operación</th><td>{{ $pago->numero_operacion }}</td></tr>
        @endif
    </table>

    <p class="muted center" style="margin-top: 28px;">
        Documento de control interno que acredita el pago de la suscripción. No reemplaza al comprobante electrónico SUNAT.
    </p>
</body>
</html>
