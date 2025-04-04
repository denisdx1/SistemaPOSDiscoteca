<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\ProductoComplemento;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductoComplementoController extends Controller
{
    /**
     * Muestra la lista de productos con sus complementos
     */
    public function index()
    {
        $productos = Producto::with(['categoria', 'productosComplementarios'])
            ->orderBy('nombre')
            ->get();
            
        return Inertia::render('menu/complementos', [
            'productos' => $productos
        ]);
    }
    
    /**
     * Muestra el formulario para asignar complementos a un producto
     */
    public function edit(Producto $producto)
    {
        $producto->load(['productosComplementarios']);
        
        // Obtener la categoría de bebidas para priorizar como complementos
        $categoriaBebidas = Categoria::where('nombre', 'like', '%bebida%')
            ->orWhere('nombre', 'like', '%refresco%')
            ->orWhere('nombre', 'like', '%soda%')
            ->orWhere('nombre', 'like', '%mixer%')
            ->first();
        
        // Obtener productos por categoría para facilitar la selección
        $productosPorCategoria = [];
        if ($categoriaBebidas) {
            // Priorizar bebidas en la lista
            $productosBebidas = Producto::where('categoria_id', $categoriaBebidas->id)
                ->where('id', '!=', $producto->id)
                ->orderBy('nombre')
                ->get();
                
            if ($productosBebidas->count() > 0) {
                $productosPorCategoria[$categoriaBebidas->id] = $productosBebidas;
            }
        }
        
        // Obtener el resto de productos agrupados por categoría
        $categorias = Categoria::orderBy('nombre')->get();
        foreach ($categorias as $categoria) {
            if ($categoria->id === $categoriaBebidas?->id) {
                continue; // Ya agregamos las bebidas
            }
            
            $productosCategoria = Producto::where('categoria_id', $categoria->id)
                ->where('id', '!=', $producto->id)
                ->orderBy('nombre')
                ->get();
                
            if ($productosCategoria->count() > 0) {
                $productosPorCategoria[$categoria->id] = $productosCategoria;
            }
        }
        
        return Inertia::render('menu/complementos/edit', [
            'producto' => $producto,
            'productosPorCategoria' => $productosPorCategoria,
            'categorias' => $categorias,
            'categoriaBebidas' => $categoriaBebidas
        ]);
    }
    
    /**
     * Actualiza los complementos de un producto
     */
    public function update(Request $request, Producto $producto)
    {
        $validated = $request->validate([
            'complementos' => 'required|array',
            'complementos.*.id' => 'required|exists:productos,id',
            'complementos.*.cantidad_requerida' => 'required|integer|min:1',
            'complementos.*.es_obligatorio' => 'required|boolean',
            'complementos.*.es_gratuito' => 'boolean'
        ]);
        
        try {
            DB::beginTransaction();
            
            // Eliminar complementos existentes
            ProductoComplemento::where('producto_principal_id', $producto->id)->delete();
            
            // Obtener la categoría de bebidas
            $categoriaBebidas = Categoria::where('nombre', 'like', '%bebida%')
                ->orWhere('nombre', 'like', '%refresco%')
                ->orWhere('nombre', 'like', '%soda%')
                ->orWhere('nombre', 'like', '%mixer%')
                ->first();
                
            // Agregar nuevos complementos
            foreach ($validated['complementos'] as $complemento) {
                // Verificar si el complemento es una bebida
                $esGratuito = false;
                if (isset($complemento['es_gratuito'])) {
                    $esGratuito = $complemento['es_gratuito'];
                } else if ($categoriaBebidas) {
                    $productoComplemento = Producto::find($complemento['id']);
                    if ($productoComplemento && $productoComplemento->categoria_id === $categoriaBebidas->id) {
                        $esGratuito = true;
                    }
                }
                
                ProductoComplemento::create([
                    'producto_principal_id' => $producto->id,
                    'producto_complemento_id' => $complemento['id'],
                    'cantidad_requerida' => $complemento['cantidad_requerida'],
                    'es_obligatorio' => $complemento['es_obligatorio'],
                    'es_gratuito' => $esGratuito
                ]);
            }
            
            DB::commit();
            
            // Limpiar caché
            Cache::forget("producto_complementos_{$producto->id}");
            Cache::forget("todos_los_complementos");
            
            return redirect()->route('menu.complementos.index')
                ->with('success', 'Complementos actualizados correctamente');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->with('error', 'Error al actualizar complementos: ' . $e->getMessage());
        }
    }
    
    /**
     * Obtiene los complementos de un producto específico (para API)
     */
    public function getComplementos(Producto $producto)
    {
        // Limpiar caché siempre durante desarrollo para asegurar datos frescos
        $cacheKey = "producto_complementos_{$producto->id}";
        Cache::forget($cacheKey);
        
        // Añadir logging para depuración
        Log::info('Solicitando complementos para producto', [
            'producto_id' => $producto->id,
            'producto_nombre' => $producto->nombre,
            'categoria_id' => $producto->categoria_id ?? 'sin categoría',
            'categoria_nombre' => $producto->categoria->nombre ?? 'sin categoría'
        ]);
        
        // Obtener desde caché si existe, sino ejecutar la consulta
        $complementos = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($producto) {
            // Cargar el producto con sus complementos y categoría
            $producto->load(['productosComplementarios' => function($query) {
                $query->with('categoria');
            }, 'categoria']);
            
            // Obtener todas las categorías para debug
            $todasCategorias = Categoria::all();
            Log::info('Todas las categorías disponibles:', $todasCategorias->pluck('nombre', 'id')->toArray());
            
            // Buscar la categoría de bebidas (id específico 3 o usar búsqueda por nombre)
            $categoriaBebidas = Categoria::where('id', 3) // ID de la categoría "Bebidas"
                ->orWhere('nombre', 'like', '%bebida%')
                ->orWhere('nombre', 'like', '%refresco%')
                ->orWhere('nombre', 'Bebidas')
                ->orWhere('nombre', 'BEBIDAS')
                ->first();
            
            if (!$categoriaBebidas) {
                Log::warning('No se encontró la categoría de bebidas en la base de datos');
                
                // Último intento: usar la primera categoría disponible como respaldo
                if ($todasCategorias->isNotEmpty()) {
                    $categoriaBebidas = $todasCategorias->first();
                    Log::info('Usando primera categoría como respaldo:', [
                        'id' => $categoriaBebidas->id,
                        'nombre' => $categoriaBebidas->nombre
                    ]);
                } else {
                    return collect([]);
                }
            }
            
            Log::info('Categoría seleccionada para complementos:', [
                'id' => $categoriaBebidas->id,
                'nombre' => $categoriaBebidas->nombre
            ]);
            
            // Obtener todos los productos de la categoría seleccionada como complementos
            $productosComplementos = Producto::where('categoria_id', $categoriaBebidas->id)
                ->where('activo', true)
                ->where('id', '!=', $producto->id)
                ->with('categoria')
                ->get();
            
            Log::info('Productos encontrados como complementos:', [
                'cantidad' => $productosComplementos->count(),
                'primer_producto' => $productosComplementos->first()->nombre ?? 'ninguno'
            ]);
                
            if ($productosComplementos->count() > 0) {
                return $productosComplementos->map(function($prod) {
                    // Agregar la información de pivot para mantener la consistencia con el formato
                    $prod->pivot = [
                        'cantidad_requerida' => 1,
                        'es_obligatorio' => false,
                        'es_gratuito' => true  // marcar como gratuito para no sumar el precio
                    ];
                    return $prod;
                });
            }
            
            // Si no hay productos, devolver array vacío
            Log::warning('No se encontraron productos para mostrar como complementos');
            return collect([]);
        });
        
        return response()->json([
            'success' => true,
            'complementos' => $complementos
        ]);
    }
    
    /**
     * Obtiene todos los complementos en una sola solicitud (para mejorar rendimiento)
     */
    public function getAllComplementos()
    {
        // Limpiar caché para evitar problemas durante desarrollo
        Cache::forget("todos_los_complementos");
        
        // Obtener desde caché si existe, sino ejecutar la consulta
        $complementos = Cache::remember("todos_los_complementos", now()->addMinutes(5), function () {
            // Obtener todas las categorías para debug
            $todasCategorias = Categoria::all();
            Log::info('Todas las categorías disponibles:', $todasCategorias->pluck('nombre', 'id')->toArray());
            
            // Buscar la categoría de bebidas (id específico 3 o usar búsqueda por nombre)
            $categoriaBebidas = Categoria::where('id', 3) // ID de la categoría "Bebidas"
                ->orWhere('nombre', 'like', '%bebida%')
                ->orWhere('nombre', 'like', '%refresco%')
                ->orWhere('nombre', 'Bebidas')
                ->orWhere('nombre', 'BEBIDAS')
                ->first();
                
            if (!$categoriaBebidas) {
                Log::warning('No se encontró la categoría de bebidas en la base de datos');
                
                // Último intento: usar la primera categoría disponible como respaldo
                if ($todasCategorias->isNotEmpty()) {
                    $categoriaBebidas = $todasCategorias->first();
                    Log::info('Usando primera categoría como respaldo:', [
                        'id' => $categoriaBebidas->id,
                        'nombre' => $categoriaBebidas->nombre
                    ]);
                } else {
                    return [];
                }
            }
            
            Log::info('Categoría seleccionada para complementos globales:', [
                'id' => $categoriaBebidas->id,
                'nombre' => $categoriaBebidas->nombre
            ]);
            
            // Obtener todos los productos activos (excepto de la categoría seleccionada)
            $productos = Producto::where('categoria_id', '!=', $categoriaBebidas->id)
                ->where('activo', true)
                ->with('categoria')
                ->get();
                
            // Obtener todos los productos de la categoría seleccionada para usar como complementos
            $complementosProductos = Producto::where('categoria_id', $categoriaBebidas->id)
                ->where('activo', true)
                ->with('categoria')
                ->get();
                
            if ($complementosProductos->isEmpty()) {
                Log::warning('No hay productos disponibles para complementos en la categoría seleccionada');
                return [];
            }
            
            $resultado = [];
            
            // Para cada producto que no es de la categoría seleccionada, asignar como complementos los productos de esa categoría
            foreach ($productos as $producto) {
                $resultado[$producto->id] = $complementosProductos
                    ->filter(function($comp) use ($producto) {
                        return $comp->id != $producto->id; // Evitar que un producto sea complemento de sí mismo
                    })
                    ->map(function($comp) {
                        return [
                            'id' => $comp->id,
                            'nombre' => $comp->nombre,
                            'descripcion' => $comp->descripcion,
                            'precio' => $comp->precio,
                            'categoria' => $comp->categoria,
                            'pivot' => [
                                'cantidad_requerida' => 1,
                                'es_obligatorio' => false,
                                'es_gratuito' => true
                            ]
                        ];
                    })
                    ->values()
                    ->all();
            }
            
            return $resultado;
        });
        
        return response()->json([
            'success' => true,
            'complementos' => $complementos
        ]);
    }
}
