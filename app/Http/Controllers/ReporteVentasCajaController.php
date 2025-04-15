<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Categoria;
use App\Models\HistorialCaja;
use App\Models\Orden;
use App\Models\Producto;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReporteVentasCajaController extends Controller
{
    /**
     * Mostrar la página de generación de reportes de ventas por caja
     */
    public function index()
    {
        return Inertia::render('reportes/reporte-ventas-caja', [
            'cajas' => Caja::select('id', 'numero_caja')
                ->orderBy('numero_caja')
                ->get(),
        ]);
    }

    /**
     * Generar reporte de ventas de tragos y cócteles por caja
     */
    public function generarReporte(Request $request)
    {
        // Validar parámetros
        $request->validate([
            'caja_id' => 'nullable|exists:cajas,id',
            'fecha_desde' => 'required|date',
            'fecha_hasta' => 'required|date|after_or_equal:fecha_desde',
            'hora_desde' => 'nullable|date_format:H:i',
            'hora_hasta' => 'nullable|date_format:H:i',
        ]);

        // Procesar fechas y horas
        $fechaDesde = Carbon::parse($request->fecha_desde);
        $fechaHasta = Carbon::parse($request->fecha_hasta);
        
        // Si se proporcionan horas, añadirlas a las fechas
        if ($request->filled('hora_desde')) {
            list($horas, $minutos) = explode(':', $request->hora_desde);
            $fechaDesde->setTime($horas, $minutos, 0);
        } else {
            $fechaDesde->startOfDay();
        }
        
        if ($request->filled('hora_hasta')) {
            list($horas, $minutos) = explode(':', $request->hora_hasta);
            // Si la hora final es menor que la hora inicial, asumimos que es del día siguiente
            $fechaHasta = ($request->hora_hasta < $request->hora_desde) 
                ? $fechaHasta->addDay()->setTime($horas, $minutos, 0)
                : $fechaHasta->setTime($horas, $minutos, 0);
        } else {
            $fechaHasta->endOfDay();
        }
        
        // Si la hora de inicio es mayor que la hora de fin (ej. 22:00 a 06:00), 
        // entonces necesitamos tratar los rangos de fechas de manera especial
        $horaInicioMayorQueFin = false;
        if ($request->filled('hora_desde') && $request->filled('hora_hasta')) {
            $horaInicioMayorQueFin = $request->hora_desde > $request->hora_hasta;
        }
        
        // Obtener categorías de tragos y cócteles
        $categoriasTragos = Categoria::where('nombre', 'like', '%Tragos%')
            ->orWhere('nombre', 'like', '%Bebidas Alcohólicas%')
            ->orWhere('nombre', 'like', '%Cócteles%')
            ->pluck('id');
            
        // Definir el precio de promoción
        $precioPromocion = 10.00;
            
        // Inicializar la consulta
        $query = DB::table('orden_producto')
            ->join('productos', 'productos.id', '=', 'orden_producto.producto_id')
            ->join('ordenes', 'ordenes.id', '=', 'orden_producto.orden_id')
            ->join('historial_cajas', function($join) {
                $join->on('historial_cajas.referencia', '=', 'ordenes.numero_orden')
                    ->where('historial_cajas.tipo_movimiento', '=', 'ingreso');
            })
            ->join('cajas', 'cajas.id', '=', 'historial_cajas.caja_id')
            ->whereIn('productos.categoria_id', $categoriasTragos)
            ->where('ordenes.pagado', true);
            
        // Si la hora de inicio es mayor que la hora de fin (ej. 22:00 a 06:00)
        if ($horaInicioMayorQueFin) {
            // Necesitamos dos condiciones OR para cubrir el rango nocturno
            $query->where(function($q) use ($fechaDesde, $fechaHasta) {
                // Desde la fecha inicial a medianoche del día inicial
                $primerDiaMedianoche = Carbon::parse($fechaDesde->format('Y-m-d'))->endOfDay();
                $q->whereBetween('historial_cajas.fecha_movimiento', [$fechaDesde, $primerDiaMedianoche]);
                
                // O desde el inicio del día final hasta la hora final
                $ultimoDiaInicio = Carbon::parse($fechaHasta->format('Y-m-d'))->startOfDay();
                $q->orWhereBetween('historial_cajas.fecha_movimiento', [$ultimoDiaInicio, $fechaHasta]);
                
                // Si hay más de un día entre las fechas, incluir los días completos intermedios
                if ($fechaDesde->diffInDays($fechaHasta) > 1) {
                    $inicioIntermedios = Carbon::parse($fechaDesde->format('Y-m-d'))->addDay()->startOfDay();
                    $finIntermedios = Carbon::parse($fechaHasta->format('Y-m-d'))->subDay()->endOfDay();
                    
                    if ($inicioIntermedios->lt($finIntermedios)) {
                        $q->orWhereBetween('historial_cajas.fecha_movimiento', [$inicioIntermedios, $finIntermedios]);
                    }
                }
            });
        } else {
            // Filtro normal para rango completo de fecha/hora
            $query->whereBetween('historial_cajas.fecha_movimiento', [$fechaDesde, $fechaHasta]);
        }
            
        // Filtrar por caja específica si se proporciona
        if ($request->filled('caja_id')) {
            $query->where('cajas.id', $request->caja_id);
        }
        
        // Agrupar y contar
        $resultados = $query->select(
                'cajas.numero_caja',
                'productos.nombre as producto_nombre',
                'productos.categoria_id',
                'productos.precio as precio_normal',
                'orden_producto.precio_unitario',
                DB::raw('SUM(orden_producto.cantidad) as cantidad_vendida'),
                DB::raw('SUM(orden_producto.subtotal) as total_vendido')
            )
            ->groupBy('cajas.numero_caja', 'productos.nombre', 'productos.categoria_id', 'productos.precio', 'orden_producto.precio_unitario')
            ->orderBy('cajas.numero_caja')
            ->orderBy('cantidad_vendida', 'desc')
            ->get();
            
        // Agrupar resultados por caja
        $cajas = [];
        foreach ($resultados as $resultado) {
            $numeroCaja = $resultado->numero_caja;
            
            if (!isset($cajas[$numeroCaja])) {
                $cajas[$numeroCaja] = [
                    'numero_caja' => $numeroCaja,
                    'productos' => [],
                    'total_productos' => 0,
                    'total_vendido' => 0,
                    'total_promociones' => 0,
                    'total_individual' => 0,
                ];
            }
            
            // Determinar si es una venta en promoción basado en el precio unitario
            $esPromocion = abs($resultado->precio_unitario - $precioPromocion) < 0.01;
            $precioNormal = $resultado->precio_normal;
            
            // Si no existe el producto en la lista, inicializarlo
            $productoExistente = false;
            foreach ($cajas[$numeroCaja]['productos'] as &$producto) {
                if ($producto['nombre'] === $resultado->producto_nombre) {
                    $productoExistente = true;
                    
                    // Actualizar cantidades según el tipo de venta
                    if ($esPromocion) {
                        $producto['cantidad_promocion'] += $resultado->cantidad_vendida;
                        $producto['total_promocion'] += $resultado->total_vendido;
                    } else {
                        $producto['cantidad_individual'] += $resultado->cantidad_vendida;
                        $producto['total_individual'] += $resultado->total_vendido;
                    }
                    
                    $producto['cantidad_vendida'] += $resultado->cantidad_vendida;
                    $producto['total_vendido'] += $resultado->total_vendido;
                    
                    break;
                }
            }
            
            // Si no existe, agregar el producto
            if (!$productoExistente) {
                $cajas[$numeroCaja]['productos'][] = [
                    'nombre' => $resultado->producto_nombre,
                    'categoria_id' => $resultado->categoria_id,
                    'precio_normal' => $precioNormal,
                    'cantidad_vendida' => $resultado->cantidad_vendida,
                    'total_vendido' => $resultado->total_vendido,
                    'cantidad_promocion' => $esPromocion ? $resultado->cantidad_vendida : 0,
                    'total_promocion' => $esPromocion ? $resultado->total_vendido : 0,
                    'cantidad_individual' => $esPromocion ? 0 : $resultado->cantidad_vendida,
                    'total_individual' => $esPromocion ? 0 : $resultado->total_vendido,
                ];
            }
            
            // Actualizar totales de la caja
            $cajas[$numeroCaja]['total_productos'] += $resultado->cantidad_vendida;
            $cajas[$numeroCaja]['total_vendido'] += $resultado->total_vendido;
            
            if ($esPromocion) {
                $cajas[$numeroCaja]['total_promociones'] += $resultado->cantidad_vendida;
            } else {
                $cajas[$numeroCaja]['total_individual'] += $resultado->cantidad_vendida;
            }
        }
        
        // Ordenar cajas por número
        ksort($cajas);
        
        // Convertir a array indexado
        $cajasArray = array_values($cajas);
        
        // Categorías para incluir en el reporte
        $categorias = Categoria::whereIn('id', $categoriasTragos)
            ->select('id', 'nombre')
            ->get();
        
        return response()->json([
            'cajas' => $cajasArray,
            'categorias' => $categorias,
            'periodo' => [
                'desde' => $fechaDesde->format('Y-m-d H:i'),
                'hasta' => $fechaHasta->format('Y-m-d H:i'),
            ],
        ]);
    }
} 