<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class ReporteStockController extends Controller
{
    /**
     * Mostrar la página de generación de reportes
     */
    public function index()
    {
        return Inertia::render('reportes/reporte-stock', [
            'categoriasDisponibles' => $this->getCategoriasDisponibles(),
        ]);
    }

    /**
     * Generar reporte diario de stock
     */
    public function generarReporteDiario(Request $request)
    {
        // Validar parámetros
        $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'incluir_inactivos' => 'boolean',
        ]);

        // Obtener fecha actual
        $fecha = Carbon::now()->format('Y-m-d');
        
        // Construir query base
        $query = Producto::with(['categoria:id,nombre,color', 'stock'])
            ->select('id', 'nombre', 'descripcion', 'precio', 'costo', 'codigo', 'imagen_url', 'activo', 'categoria_id');
        
        // Aplicar filtros
        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->input('categoria_id'));
        }
        
        // Incluir o no productos inactivos
        if (!$request->boolean('incluir_inactivos', false)) {
            $query->where('activo', true);
        }
        
        // Obtener productos
        $productos = $query->get()->map(function ($producto) {
            return [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'codigo' => $producto->codigo,
                'precio' => $producto->precio,
                'costo' => $producto->costo,
                'stock_actual' => $producto->stock_actual, // Utilizando el accessor
                'stock_minimo' => $producto->stock ? $producto->stock->stock_minimo : null,
                'stock_maximo' => $producto->stock ? $producto->stock->stock_maximo : null,
                'categoria' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
                'activo' => $producto->activo ? 'Sí' : 'No',
                'estado_stock' => $this->getEstadoStock($producto),
            ];
        });
        
        // Generar el reporte en PDF
        return $this->generarPDF($productos, $fecha);
    }
    
    /**
     * Obtener el estado del stock (Normal, Bajo, Crítico)
     */
    private function getEstadoStock($producto)
    {
        if (!$producto->stock) {
            return 'Sin control';
        }
        
        $stockActual = $producto->stock_actual;
        $stockMinimo = $producto->stock->stock_minimo;
        
        if ($stockActual === 0) {
            return 'Agotado';
        } elseif ($stockActual <= $stockMinimo * 0.5) {
            return 'Crítico';
        } elseif ($stockActual <= $stockMinimo) {
            return 'Bajo';
        } else {
            return 'Normal';
        }
    }
    
    /**
     * Generar reporte en PDF
     */
    private function generarPDF($productos, $fecha)
    {
        // Para generar PDF podemos usar una biblioteca como MPDF o TCPDF
        // En este ejemplo usaremos una vista y el método download de Laravel
        
        $data = [
            'productos' => $productos,
            'fecha' => $fecha,
            'titulo' => 'Reporte de Stock al ' . Carbon::parse($fecha)->format('d/m/Y'),
        ];
        
        $pdf = \PDF::loadView('reportes.stock', $data);
        
        return $pdf->download('reporte_stock_' . $fecha . '.pdf');
    }
    
    /**
     * Obtener categorías disponibles para filtrado
     */
    private function getCategoriasDisponibles()
    {
        return DB::table('categorias')
            ->select('id', 'nombre')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get();
    }
} 