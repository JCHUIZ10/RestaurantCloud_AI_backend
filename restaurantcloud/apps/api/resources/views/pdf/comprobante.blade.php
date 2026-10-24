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
    </style>
</head>
<body>
    <table class="header" style="margin-top: 0; border: 0;">
        <tr>
            <td style="border: 0; width: 63%; padding: 0;">
                <h1>{{ $comprobante->empresa_razon_social }}</h1>
                <div>RUC: {{ $comprobante->empresa_ruc }}</div>
                <div>{{ $comprobante->local_nombre }} · {{ $comprobante->local_direccion }}</div>
                <div class="muted">{{ $comprobante->local_distrito }}, {{ $comprobante->local_ciudad }}</div>
            </td>
            <td class="right" style="border: 0; padding: 0;">
                <h2>{{ strtoupper(str_replace('_', ' ', $comprobante->tipo)) }}</h2>
                <strong>{{ $comprobante->serie }}-{{ str_pad($comprobante->correlativo, 8, '0', STR_PAD_LEFT) }}</strong>
                <div class="muted">Emitido: {{ \Carbon\Carbon::parse($comprobante->fecha)->format('d/m/Y H:i') }}</div>
            </td>
        </tr>
    </table>

    <p>
        <strong>Cliente:</strong> {{ $comprobante->nombre_cliente }}<br>
        @if($comprobante->documento_cliente)
            <strong>Documento:</strong> {{ $comprobante->documento_cliente }}<br>
        @endif
        @if($comprobante->mesa_numero)
            <strong>Mesa:</strong> {{ $comprobante->mesa_numero }}
        @endif
    </p>

    <table>
        <thead><tr><th>Descripción</th><th class="right">Cant.</th><th class="right">P. unitario</th><th class="right">Importe</th></tr></thead>
        <tbody>
            @foreach($items as $item)
                <tr><td>{{ $item['descripcion'] }}</td><td class="right">{{ $item['cantidad'] }}</td><td class="right">S/ {{ number_format($item['precio_unitario'], 2) }}</td><td class="right">S/ {{ number_format($item['subtotal'], 2) }}</td></tr>
            @endforeach
        </tbody>
    </table>

    <table style="width: 42%; margin-left: auto;">
        <tr><td>Base imponible</td><td class="right">S/ {{ number_format($comprobante->base_imponible, 2) }}</td></tr>
        <tr><td>IGV</td><td class="right">S/ {{ number_format($comprobante->igv, 2) }}</td></tr>
        @if((float) $comprobante->monto_recargo > 0)
            <tr><td>Recargo</td><td class="right">S/ {{ number_format($comprobante->monto_recargo, 2) }}</td></tr>
        @endif
        <tr class="total"><td>TOTAL</td><td class="right">S/ {{ number_format($comprobante->total, 2) }}</td></tr>
    </table>

    <p class="muted center" style="margin-top: 32px;">Representación digital interna generada por RestaurantCloud.</p>
</body>
</html>
