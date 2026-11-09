<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Reporte Z - Turno #{{ str_pad($reporte['turno_correlativo'] ?? 1, 3, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            margin: 24px;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 10px;
            line-height: 1.4;
        }
        h1 { font-size: 16px; margin: 0; color: #0f172a; }
        h2 { font-size: 12px; margin: 2px 0 6px 0; color: #334155; }
        h3 { font-size: 10px; margin: 12px 0 4px 0; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
        .muted { color: #64748b; font-size: 9px; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th { background: #f1f5f9; text-align: left; font-size: 9px; color: #334155; padding: 5px; border: 1px solid #cbd5e1; }
        td { border: 1px solid #e2e8f0; padding: 4px 6px; }
        .header-table td { border: 0; padding: 2px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; margin-top: 6px; }
        .cuadrada { color: #166534; font-weight: bold; }
        .faltante { color: #991b1b; font-weight: bold; }
        .sobrante { color: #1e40af; font-weight: bold; }
        .total-box { background: #0f172a; color: #ffffff; padding: 8px 12px; margin-top: 8px; border-radius: 4px; }
        .total-box td { border: 0; color: #ffffff; }
        .tag { display: inline-block; padding: 2px 6px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 8.5px; margin-right: 4px; }
        .footer { margin-top: 20px; text-align: center; font-size: 8.5px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    </style>
</head>
<body>
    <table class="header-table" style="width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
        <tr>
            <td style="width: 65%;">
                <h1>{{ $reporte['local_nombre'] ?? 'Áurea Restaurante' }}</h1>
                <div class="muted">RUC: {{ $reporte['empresa_ruc'] ?? '-' }}</div>
                <div class="muted">Cajero: <strong>{{ $reporte['cajero_nombre'] ?? '-' }}</strong></div>
            </td>
            <td class="right" style="width: 35%;">
                <h2>REPORTE Z OFICIAL</h2>
                <div class="bold" style="font-size: 13px;">TURNO #{{ str_pad($reporte['turno_correlativo'] ?? 1, 3, '0', STR_PAD_LEFT) }}</div>
                <div class="muted">Apertura: {{ \Carbon\Carbon::parse($reporte['fecha_apertura'])->format('d/m/Y H:i') }}</div>
                <div class="muted">Cierre: {{ \Carbon\Carbon::parse($reporte['fecha_cierre'])->format('d/m/Y H:i') }}</div>
                <div class="muted">Duración: {{ $reporte['duracion_turno'] ?? '-' }}</div>
            </td>
        </tr>
    </table>

    <!-- Bloque 1: Arqueo Físico de Gaveta -->
    <h3>1. Movimiento y Arqueo Físico de Efectivo en Gaveta</h3>
    <table>
        <thead>
            <tr>
                <th style="width: 25%;">Fondo Apertura</th>
                <th style="width: 25%;">Efectivo Esperado</th>
                <th style="width: 25%;">Efectivo Real Contado</th>
                <th style="width: 25%;" class="right">Discrepancia</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>S/ {{ number_format((float) ($reporte['monto_apertura'] ?? 0), 2) }}</td>
                <td>S/ {{ number_format((float) ($reporte['efectivo_esperado'] ?? 0), 2) }}</td>
                <td class="bold">S/ {{ number_format((float) ($reporte['efectivo_real_contado'] ?? 0), 2) }}</td>
                <td class="right">
                    @php
                        $disc = (float) ($reporte['discrepancia'] ?? 0);
                    @endphp
                    @if(abs($disc) < 0.001)
                        <span class="cuadrada">S/ 0.00 (CUADRADA)</span>
                    @elseif($disc < 0)
                        <span class="faltante">- S/ {{ number_format(abs($disc), 2) }} (FALTANTE)</span>
                    @else
                        <span class="sobrante">+ S/ {{ number_format($disc, 2) }} (SOBRANTE)</span>
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    @if(!empty($reporte['comentario_discrepancia']))
        <div class="box" style="margin-top: 4px; font-size: 8.5px;">
            <strong>Justificación de Discrepancia:</strong> <em>{{ $reporte['comentario_discrepancia'] }}</em>
        </div>
    @endif

    <!-- Bloque 2: Recaudación por Método de Pago -->
    <h3>2. Total Recaudado por Método de Pago</h3>
    @php
        // Un Z anterior a esta regla no trae la lista: se muestran todas las columnas como cuando se cerró.
        $mediosVisibles = $reporte['medios_visibles'] ?? null;
        $verMedio = fn (string $codigo): bool => $mediosVisibles === null || in_array($codigo, $mediosVisibles, true);
        $verOtros = $mediosVisibles === null || (float) ($reporte['otros_medios_total'] ?? 0) !== 0.0;
    @endphp
    <table>
        <thead>
            <tr>
                <th>Efectivo Gaveta</th>
                @if($verMedio('tarjeta'))
                    <th>Tarjetas POS</th>
                @endif
                @if($verMedio('billetera_digital'))
                    <th>Billeteras Digitales</th>
                @endif
                @if($verOtros)
                    <th>Otros Medios</th>
                @endif
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>S/ {{ number_format((float) ($reporte['total_efectivo_neto'] ?? $reporte['total_ventas_efectivo'] ?? 0), 2) }}</td>
                @if($verMedio('tarjeta'))
                    <td>S/ {{ number_format((float) ($reporte['total_tarjetas_pos'] ?? 0), 2) }}</td>
                @endif
                @if($verMedio('billetera_digital'))
                    <td>S/ {{ number_format((float) ($reporte['total_billeteras_digital'] ?? 0), 2) }}</td>
                @endif
                @if($verOtros)
                    <td>S/ {{ number_format((float) ($reporte['otros_medios_total'] ?? 0), 2) }}</td>
                @endif
            </tr>
        </tbody>
    </table>

    <table class="total-box">
        <tr>
            <td class="bold" style="font-size: 11px;">TOTAL FACTURADO NETO DEL TURNO:</td>
            <td class="right bold" style="font-size: 13px;">S/ {{ number_format((float) ($reporte['total_neto_facturado'] ?? 0), 2) }}</td>
        </tr>
    </table>

    <!-- Consumo vs recargos (solo si el Z lo guardó y hubo recargos) -->
    @if((float) ($reporte['total_recargos'] ?? 0) > 0)
        <h3>Del Total Cobrado: Consumo y Recargos</h3>
        <table>
            <tbody>
                <tr>
                    <td>Cobrado neto (todos los medios)</td>
                    <td class="right bold">S/ {{ number_format((float) ($reporte['total_neto_facturado'] ?? 0), 2) }}</td>
                </tr>
                @if((float) ($reporte['recargo_tarjetas'] ?? 0) > 0)
                    <tr>
                        <td>&minus; Recargo por uso de tarjeta</td>
                        <td class="right">S/ {{ number_format((float) $reporte['recargo_tarjetas'], 2) }}</td>
                    </tr>
                @endif
                @if((float) ($reporte['recargo_billeteras'] ?? 0) > 0)
                    <tr>
                        <td>&minus; Recargo por uso de Yape / Plin</td>
                        <td class="right">S/ {{ number_format((float) $reporte['recargo_billeteras'], 2) }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="bold">= Ingreso por consumo</td>
                    <td class="right bold">S/ {{ number_format((float) ($reporte['ingreso_consumo'] ?? 0), 2) }}</td>
                </tr>
            </tbody>
        </table>
        <div style="font-size: 7.5px; color: #64748b; margin-top: 3px;">
            Recargo cobrado al cliente según el porcentaje configurado; la liquidación real del banco o la pasarela puede variar.
        </div>
    @endif

    <!-- Bloque 3: Resumen Tributario Oficial SUNAT -->
    <h3>3. Resumen Tributario Oficial SUNAT</h3>
    <table>
        <thead>
            <tr>
                <th style="width: 34%;">Base Imponible Gravada</th>
                <th style="width: 33%;">IGV (18.00%)</th>
                <th style="width: 33%;" class="right">Inafecto / Exonerado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>S/ {{ number_format((float) ($reporte['base_imponible_gravada'] ?? 0), 2) }}</td>
                <td>S/ {{ number_format((float) ($reporte['igv_18'] ?? 0), 2) }}</td>
                <td class="right">S/ 0.00</td>
            </tr>
        </tbody>
    </table>

    <!-- Bloque 4: Auditoría de Documentos Emitidos -->
    <h3>4. Auditoría de Documentos y Series Emitidas</h3>
    <div style="margin-top: 6px;">
        <span class="tag"><strong>{{ $reporte['boletas_emitidas'] ?? 0 }}</strong> Boletas</span>
        <span class="tag"><strong>{{ $reporte['facturas_emitidas'] ?? 0 }}</strong> Facturas</span>
        <span class="tag"><strong>{{ $reporte['notas_venta_emitidas'] ?? 0 }}</strong> Notas de Venta</span>
        <span class="tag"><strong>{{ $reporte['notas_credito_emitidas'] ?? 0 }}</strong> Notas de Crédito</span>
        <span class="tag"><strong>{{ $reporte['comprobantes_anulados'] ?? 0 }}</strong> Anulados</span>
    </div>

    <!-- Ventas vigentes por tipo de comprobante y descuentos (solo si el Z lo guardó al cerrar) -->
    @if(!empty($reporte['ventas_por_tipo']))
        @php
            $etiquetaTipo = ['boleta' => 'Boletas', 'factura' => 'Facturas', 'nota_venta' => 'Notas de venta (documento interno, no SUNAT)'];
        @endphp
        <h3>Ventas Vigentes por Tipo de Comprobante</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 60%;">Tipo</th>
                    <th style="width: 15%;" class="right">Cantidad</th>
                    <th style="width: 25%;" class="right">Monto</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reporte['ventas_por_tipo'] as $t)
                    <tr>
                        <td>{{ $etiquetaTipo[$t['tipo'] ?? ''] ?? ($t['tipo'] ?? '') }}</td>
                        <td class="right">{{ $t['cantidad'] ?? 0 }}</td>
                        <td class="right">S/ {{ number_format((float) ($t['monto'] ?? 0), 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        @if((float) ($reporte['descuentos_turno']['total'] ?? 0) > 0)
            <div style="font-size: 8.5px; margin-top: 4px;">
                Descuentos y promociones aplicados: <strong>S/ {{ number_format((float) $reporte['descuentos_turno']['total'], 2) }}</strong>
                en {{ (int) ($reporte['descuentos_turno']['comprobantes'] ?? 0) }} comprobante(s).
            </div>
        @endif
    @endif

    <!-- Detalle de notas de crédito (solo si el Z lo guardó al cerrar) -->
    @if(!empty($reporte['notas_credito_detalle']))
        @php
            $etiquetaMedio = ['efectivo' => 'Efectivo', 'tarjeta' => 'Tarjeta', 'billetera_digital' => 'Yape / Plin'];
        @endphp
        <h3>Detalle de Notas de Crédito del Turno</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 20%;">Nota de crédito</th>
                    <th style="width: 20%;">Anula a</th>
                    <th style="width: 20%;">Medio</th>
                    <th style="width: 25%;">Motivo</th>
                    <th style="width: 15%;" class="right">Monto</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reporte['notas_credito_detalle'] as $nc)
                    <tr>
                        <td>{{ $nc['documento'] ?? '' }}</td>
                        <td>{{ $nc['documento_modificado'] ?? '—' }}</td>
                        <td>
                            {{ $etiquetaMedio[$nc['medio_pago'] ?? ''] ?? ($nc['medio_pago'] ?? '') }}<br>
                            <span style="font-size: 7.5px; color: #64748b;">{{ !empty($nc['afecta_gaveta']) ? 'Salió de la gaveta' : 'No afecta la gaveta' }}</span>
                        </td>
                        <td>
                            {{ $nc['motivo_texto'] ?? ($nc['motivo_codigo_sunat'] ?? '—') }}
                            @if(!empty($nc['sustento_motivo']))
                                <br><span style="font-size: 7.5px; color: #64748b;">{{ $nc['sustento_motivo'] }}</span>
                            @endif
                        </td>
                        <td class="right">- S/ {{ number_format((float) ($nc['monto'] ?? 0), 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Bloque 5: Notas de Cierre -->
    @if(!empty($reporte['notas_cierre']))
        <h3>5. Notas de Cierre y Traspaso</h3>
        <div class="box">
            <em>&ldquo;{{ $reporte['notas_cierre'] }}&rdquo;</em>
        </div>
    @endif

    <div class="footer">
        Documento Inmutable de Cierre de Caja • Almacenado en MinIO S3 (CU-CAJA-05) • Generado por RestaurantCloud
    </div>
</body>
</html>
