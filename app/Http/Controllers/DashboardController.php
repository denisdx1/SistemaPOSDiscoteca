<?php

namespace App\Http\Controllers;

use App\Models\Orden;
use App\Models\Producto;
use App\Models\User;
use App\Models\HistorialCaja;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Obtener fecha de inicio y fin del día actual
        $inicioDelDia = Carbon::today();
        $finDelDia = Carbon::tomorrow();

        // 1. Ventas del día (suma de ingresos por ventas del día actual)
        $ventasDelDia = HistorialCaja::where('tipo_movimiento', 'ingreso')
            ->whereBetween('fecha_movimiento', [$inicioDelDia, $finDelDia])
            ->sum('monto');

        // 2. Productos vendidos hoy (cantidad total de productos vendidos hoy)
        $productosVendidosHoy = DB::table('orden_producto')
            ->join('ordenes', 'ordenes.id', '=', 'orden_producto.orden_id')
            ->whereBetween('ordenes.created_at', [$inicioDelDia, $finDelDia])
            ->where('ordenes.pagado', true)
            ->sum('orden_producto.cantidad');

        // 3. Productos con stock bajo
        $productosStockBajo = Producto::whereHas('stock', function($query) {
            $query->whereColumn('cantidad', '<=', 'stock_minimo');
        })->count();

        // 4. Usuarios activos
        $usuariosActivos = User::where('updated_at', '>=', Carbon::now()->subHours(24))->count();

        // 5. Ventas recientes (últimas 10 órdenes pagadas)
        $ventasRecientes = Orden::with(['mesa:id,numero', 'user:id,name'])
            ->where('pagado', true)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($orden) => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'mesa' => $orden->mesa ? "Mesa {$orden->mesa->numero}" : 'Sin mesa',
                'total' => $orden->total,
                'usuario' => $orden->user->name,
                'fecha' => $orden->updated_at->format('d/m/Y H:i'),
            ]);

        // 6. Productos más vendidos (top 5 productos más vendidos)
        $productosMasVendidos = DB::table('orden_producto')
            ->join('productos', 'productos.id', '=', 'orden_producto.producto_id')
            ->join('ordenes', 'ordenes.id', '=', 'orden_producto.orden_id')
            ->where('ordenes.pagado', true)
            ->select(
                'productos.id',
                'productos.nombre',
                DB::raw('SUM(orden_producto.cantidad) as total_vendido'),
                DB::raw('SUM(orden_producto.subtotal) as total_ventas')
            )
            ->groupBy('productos.id', 'productos.nombre')
            ->orderByDesc('total_vendido')
            ->take(5)
            ->get();

        // Calcular el porcentaje de cambio en ventas respecto al día anterior
        $ventasAyer = HistorialCaja::where('tipo_movimiento', 'ingreso')
            ->whereBetween('fecha_movimiento', [
                Carbon::yesterday()->startOfDay(),
                Carbon::yesterday()->endOfDay()
            ])
            ->sum('monto');

        $porcentajeCambioVentas = $ventasAyer > 0 
            ? (($ventasDelDia - $ventasAyer) / $ventasAyer) * 100 
            : 0;

        return Inertia::render('dashboard', [
            'estadisticas' => [
                'ventasDelDia' => $ventasDelDia,
                'porcentajeCambioVentas' => $porcentajeCambioVentas,
                'productosVendidosHoy' => $productosVendidosHoy,
                'productosStockBajo' => $productosStockBajo,
                'usuariosActivos' => $usuariosActivos,
                'ventasRecientes' => $ventasRecientes,
                'productosMasVendidos' => $productosMasVendidos
            ]
        ]);
    }
}