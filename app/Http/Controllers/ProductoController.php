<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Producto;
use App\Models\InventarioStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProductoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Producto::query()
            ->with(['categoria:id,nombre,color', 'stock:id,producto_id,cantidad,stock_minimo,stock_maximo'])
            ->select('id', 'nombre', 'descripcion', 'precio', 'costo', 'codigo', 'imagen_url', 'activo', 'categoria_id', 'created_at');

        // Búsqueda
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(codigo) LIKE ?', ["%{$search}%"]);
            });
        }

        // Filtrado por categoría
        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->input('categoria_id'));
        }

        return Inertia::render('menu/productos', [
            'productos' => $query->orderBy('created_at', 'asc')->paginate(10)->withQueryString()->through(fn ($producto) => [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'descripcion' => $producto->descripcion,
                'precio' => $producto->precio,
                'costo' => $producto->costo,
                'stock' => $producto->stock ? $producto->stock->cantidad : 0,
                'stock_minimo' => $producto->stock ? $producto->stock->stock_minimo : 0,
                'stock_maximo' => $producto->stock ? $producto->stock->stock_maximo : 0,
                'codigo' => $producto->codigo,
                'imagen_url' => $producto->imagen_url,
                'activo' => $producto->activo,
                'categoria' => $producto->categoria ? [
                    'id' => $producto->categoria->id,
                    'nombre' => $producto->categoria->nombre,
                    'color' => $producto->categoria->color,
                ] : null,
                'created_at' => $producto->created_at->format('d/m/Y'),
            ]),
            'categorias' => Categoria::select('id', 'nombre', 'color')
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'costo' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'stock_minimo' => 'nullable|integer|min:0',
            'stock_maximo' => 'nullable|integer|min:0',
            'imagen_url' => 'nullable|string|max:255',
            'activo' => 'boolean',
            'categoria_id' => 'required|exists:categorias,id',
        ]);

        // Extraer datos de stock
        $stockData = [
            'cantidad' => $validated['stock'] ?? 0,
            'stock_minimo' => $validated['stock_minimo'] ?? 0,
            'stock_maximo' => $validated['stock_maximo'] ?? 0,
        ];
        
        // Eliminar campos de stock del array de productos
        unset($validated['stock']);
        unset($validated['stock_minimo']);
        unset($validated['stock_maximo']);

        DB::beginTransaction();
        try {
            // Generar código automático
            $categoria = Categoria::find($validated['categoria_id']);
            $prefix = strtoupper(substr($categoria->nombre, 0, 3));
            $count = Producto::where('codigo', 'LIKE', $prefix . '%')->count();
            $codigo = $prefix . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);
            
            // Agregar el código al array de datos validados
            $validated['codigo'] = $codigo;

            // Crear el producto
            $producto = Producto::create($validated);
            
            // Crear la entrada de stock
            $producto->stock()->create($stockData);
            
            DB::commit();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Producto creado con éxito',
                    'producto' => $producto
                ]);
            }
            
            return redirect()->back()->with('success', 'Producto creado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al crear el producto: ' . $e->getMessage()
                ], 422);
            }
            
            return redirect()->back()->with('error', 'Error al crear el producto: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Producto $producto)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'costo' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'stock_minimo' => 'nullable|integer|min:0',
            'stock_maximo' => 'nullable|integer|min:0',
            'codigo' => 'nullable|string|max:255|unique:productos,codigo,' . $producto->id,
            'imagen_url' => 'nullable|string|max:255',
            'activo' => 'boolean',
            'categoria_id' => 'required|exists:categorias,id',
        ]);

        // Extraer datos de stock
        $stockData = [
            'cantidad' => $validated['stock'] ?? 0,
            'stock_minimo' => $validated['stock_minimo'] ?? 0,
            'stock_maximo' => $validated['stock_maximo'] ?? 0,
        ];
        
        // Eliminar campos de stock del array de productos
        unset($validated['stock']);
        unset($validated['stock_minimo']);
        unset($validated['stock_maximo']);

        DB::beginTransaction();
        try {
            // Actualizar el producto
            $producto->update($validated);
            
            // Actualizar o crear la entrada de stock
            if ($producto->stock) {
                $producto->stock->update($stockData);
            } else {
                $producto->stock()->create($stockData);
            }
            
            DB::commit();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Producto actualizado con éxito',
                    'producto' => $producto->fresh(['categoria', 'stock'])
                ]);
            }
            
            return redirect()->back()->with('success', 'Producto actualizado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al actualizar el producto: ' . $e->getMessage()
                ], 422);
            }
            
            return redirect()->back()->with('error', 'Error al actualizar el producto: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Producto $producto)
    {
        DB::beginTransaction();
        try {
            // Eliminar el stock asociado (se hará automáticamente por la relación con onDelete('cascade'))
            $producto->delete();
            
            DB::commit();
            return redirect()->back()->with('success', 'Producto eliminado con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error al eliminar el producto: ' . $e->getMessage());
        }
    }

    /**
     * Obtiene el stock actual de un producto específico
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getStock($id)
    {
        try {
            $producto = Producto::with('stock')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'producto' => [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'codigo' => $producto->codigo,
                        'precio' => $producto->precio,
                    ],
                    'stock_actual' => $producto->stock_actual,
                    'stock_info' => $producto->stock ? [
                        'stock_minimo' => $producto->stock->stock_minimo,
                        'stock_maximo' => $producto->stock->stock_maximo,
                        'ubicacion' => $producto->stock->ubicacion,
                    ] : null,
                ],
                'message' => 'Stock del producto obtenido correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener stock del producto: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el stock del producto',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Obtiene información de stock de todos los productos
     *
     * @return \Illuminate\Http\Response
     */
    public function getAllStock()
    {
        try {
            // Cargar componentes para combos
            $productos = Producto::with(['stock', 'categoria', 'componentesCombo.producto.stock'])->get();
            
            $data = $productos->map(function($producto) {
                // Para combos, verificar disponibilidad basada en componentes
                if ($producto->es_combo) {
                    $stock_actual = $producto->combo_disponible ? 1 : 0;
                } else {
                    // Usar el método accessor para productos normales
                    $stock_actual = $producto->getStockActualAttribute();
                }
                
                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'codigo' => $producto->codigo,
                    'precio' => $producto->precio,
                    'descripcion' => $producto->descripcion,
                    'stock_actual' => $stock_actual,
                    'stock_minimo' => $producto->stock ? $producto->stock->stock_minimo : null,
                    'stock_maximo' => $producto->stock ? $producto->stock->stock_maximo : null,
                    'categoria_id' => $producto->categoria_id,
                    'activo' => $producto->activo,
                    'imagen_url' => $producto->imagen_url,
                    'es_combo' => $producto->es_combo,
                    'categoria' => $producto->categoria ? [
                        'id' => $producto->categoria->id,
                        'nombre' => $producto->categoria->nombre,
                        'color' => $producto->categoria->color
                    ] : null
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Stock de productos obtenido correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener stock de productos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el stock de productos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Genera un código automático para un producto basado en su categoría
     */
    public function generarCodigo(Request $request)
    {
        $request->validate([
            'categoria_id' => 'required|exists:categorias,id'
        ]);

        try {
            $categoria = Categoria::find($request->categoria_id);
            $prefix = strtoupper(substr($categoria->nombre, 0, 3));
            $count = Producto::where('codigo', 'LIKE', $prefix . '%')->count();
            $codigo = $prefix . '-' . str_pad(($count + 1), 4, '0', STR_PAD_LEFT);

            return response()->json([
                'success' => true,
                'codigo' => $codigo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar el código: ' . $e->getMessage()
            ], 500);
        }
    }
}
