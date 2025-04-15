<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $titulo }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
        }
        .subtitle {
            font-size: 14px;
            margin: 5px 0 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table th {
            background-color: #f2f2f2;
            text-align: left;
            padding: 8px;
            font-size: 12px;
            border-bottom: 1px solid #ddd;
        }
        table td {
            padding: 8px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
        }
        .estado-normal {
            color: #008000; /* Verde */
        }
        .estado-bajo {
            color: #FFA500; /* Naranja */
        }
        .estado-critico {
            color: #FF0000; /* Rojo */
        }
        .estado-agotado {
            color: #FF0000; /* Rojo */
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            font-size: 10px;
            text-align: center;
            color: #666;
        }
        .page-number {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">{{ $titulo }}</h1>
        <p class="subtitle">Fecha de generación: {{ date('d/m/Y H:i') }}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Stock Actual</th>
                <th>Stock Mín.</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @forelse($productos as $producto)
            <tr>
                <td>{{ $producto['codigo'] }}</td>
                <td>{{ $producto['nombre'] }}</td>
                <td>{{ $producto['categoria'] }}</td>
                <td>{{ number_format($producto['precio'], 2) }}</td>
                <td>{{ number_format($producto['costo'], 2) }}</td>
                <td>{{ $producto['stock_actual'] }}</td>
                <td>{{ $producto['stock_minimo'] ?? '-' }}</td>
                <td class="estado-{{ strtolower($producto['estado_stock']) }}">
                    {{ $producto['estado_stock'] }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" style="text-align: center;">No hay productos para mostrar</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    
    <div class="footer">
        <p>Este reporte fue generado automáticamente por el sistema POS.</p>
    </div>
    
    <div class="page-number">
        Página <span class="pagenum"></span>
    </div>
</body>
</html> 