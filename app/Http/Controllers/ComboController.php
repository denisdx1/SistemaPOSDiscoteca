<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\ComboProducto;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ComboController extends Controller
{
    /**
     * Mostrar la página de gestión de combos
     */
    public function index()
    {
        // Cargar todos los combos con sus componentes
        $combos = Producto::where('es_combo', true)
            ->with(['categoria', 'componentesCombo.producto.stock'])
            ->get()
            ->map(function ($combo) {
                $componentes = $combo->componentesCombo->map(function ($componente) {
                    return [
                        'id' => $componente->id,
                        'producto_id' => $componente->producto_id,
                        'nombre' => $componente->producto->nombre,
                        'cantidad' => $componente->cantidad,
                        'precio_unitario' => $componente->producto->precio,
                        'stock_actual' => $componente->producto->stock ? $componente->producto->stock->cantidad : 0,
                        'disponible' => ($componente->producto->stock && $componente->producto->stock->cantidad >= $componente->cantidad),
                    ];
                });
                
                // Verificar si todos los componentes tienen stock suficiente
                $disponible = $combo->combo_disponible;
                
                return [
                    'id' => $combo->id,
                    'nombre' => $combo->nombre,
                    'precio' => $combo->precio,
                    'codigo' => $combo->codigo,
                    'categoria' => $combo->categoria ? [
                        'id' => $combo->categoria->id,
                        'nombre' => $combo->categoria->nombre,
                        'color' => $combo->categoria->color,
                    ] : null,
                    'componentes' => $componentes,
                    'activo' => $combo->activo,
                    'disponible' => $disponible,
                ];
            });
        
        return Inertia::render('combos/index', [
            'combos' => $combos,
        ]);
    }

    /**
     * Mostrar el formulario para crear un nuevo combo
     */
    public function create()
    {
        // Cargar las categorías para el formulario
        $categorias = Categoria::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'color']);
        
        // Cargar los productos que pueden formar parte de combos
        $productos = Producto::where('activo', true)
            ->where(function ($query) {
                $query->where('es_combo', false)
                    ->orWhereNull('es_combo');
            })
            ->with('categoria', 'stock')
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'precio' => $producto->precio,
                    'stock_actual' => $producto->stock_actual,
                    'categoria' => $producto->categoria ? [
                        'id' => $producto->categoria->id,
                        'nombre' => $producto->categoria->nombre,
                        'color' => $producto->categoria->color,
                    ] : null,
                ];
            });
        
        return Inertia::render('combos/create', [
            'categorias' => $categorias,
            'productos' => $productos,
        ]);
    }

    /**
     * Almacenar un nuevo combo
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'categoria_id' => 'required|string',
            'codigo' => 'nullable|string|max:50|unique:productos,codigo',
            'componentes' => 'required|array|min:1',
            'componentes.*.producto_id' => 'required|exists:productos,id',
            'componentes.*.cantidad' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();
            
            // Tratar el valor "0" como null para categoria_id
            $categoria_id = $validated['categoria_id'] !== '0' ? $validated['categoria_id'] : null;
            
            // 1. Crear el producto combo
            $combo = Producto::create([
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'precio' => $validated['precio'],
                'categoria_id' => $categoria_id,
                'codigo' => $validated['codigo'] ?? 'COMBO-' . time(),
                'es_combo' => true,
                'activo' => true,
            ]);
            
            // 2. Crear los componentes del combo
            foreach ($validated['componentes'] as $componente) {
                ComboProducto::create([
                    'combo_id' => $combo->id,
                    'producto_id' => $componente['producto_id'],
                    'cantidad' => $componente['cantidad'],
                ]);
            }
            
            DB::commit();
            
            return redirect()->route('menu.combos.index')
                ->with('success', 'Combo creado con éxito');
                
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear combo:', ['error' => $e->getMessage()]);
            
            return redirect()->back()
                ->with('error', 'Error al crear el combo: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Mostrar el formulario para editar un combo
     */
    public function edit(Producto $combo)
    {
        // Verificar que sea un combo
        if (!$combo->es_combo) {
            return redirect()->route('menu.combos.index')
                ->with('error', 'El producto seleccionado no es un combo');
        }
        
        // Cargar las categorías para el formulario
        $categorias = Categoria::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'color']);
        
        // Cargar los productos que pueden formar parte de combos
        $productos = Producto::where('activo', true)
            ->where(function ($query) use ($combo) {
                $query->where('es_combo', false)
                    ->orWhereNull('es_combo');
            })
            ->where('id', '!=', $combo->id) // Excluir el propio combo
            ->with('categoria', 'stock')
            ->orderBy('nombre')
            ->get()
            ->map(function ($producto) {
                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'precio' => $producto->precio,
                    'stock_actual' => $producto->stock_actual,
                    'categoria' => $producto->categoria ? [
                        'id' => $producto->categoria->id,
                        'nombre' => $producto->categoria->nombre,
                        'color' => $producto->categoria->color,
                    ] : null,
                ];
            });
        
        // Cargar el combo con sus componentes
        $combo->load('componentesCombo.producto');
        
        // Formatear los componentes para React
        $componentes = $combo->componentesCombo->map(function ($componente) {
            return [
                'id' => $componente->id,
                'producto_id' => $componente->producto_id,
                'cantidad' => $componente->cantidad,
                'producto' => [
                    'id' => $componente->producto->id,
                    'nombre' => $componente->producto->nombre,
                    'codigo' => $componente->producto->codigo,
                    'precio' => $componente->producto->precio,
                    'categoria' => $componente->producto->categoria ? [
                        'id' => $componente->producto->categoria->id,
                        'nombre' => $componente->producto->categoria->nombre,
                        'color' => $componente->producto->categoria->color,
                    ] : null,
                ],
            ];
        });
        
        return Inertia::render('combos/edit', [
            'combo' => [
                'id' => $combo->id,
                'nombre' => $combo->nombre,
                'descripcion' => $combo->descripcion,
                'precio' => $combo->precio,
                'categoria_id' => $combo->categoria_id,
                'codigo' => $combo->codigo,
                'activo' => $combo->activo,
                'componentes' => $componentes,
            ],
            'categorias' => $categorias,
            'productos' => $productos,
        ]);
    }

    /**
     * Actualizar un combo existente
     */
    public function update(Request $request, Producto $combo)
    {
        // Verificar que sea un combo
        if (!$combo->es_combo) {
            return redirect()->route('menu.combos.index')
                ->with('error', 'El producto seleccionado no es un combo');
        }
        
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'categoria_id' => 'required|string',
            'codigo' => 'nullable|string|max:50|unique:productos,codigo,' . $combo->id,
            'activo' => 'boolean',
            'componentes' => 'required|array|min:1',
            'componentes.*.producto_id' => 'required|exists:productos,id',
            'componentes.*.cantidad' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();
            
            // Tratar el valor "0" como null para categoria_id
            $categoria_id = $validated['categoria_id'] !== '0' ? $validated['categoria_id'] : null;
            
            // 1. Actualizar el producto combo
            $combo->update([
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'precio' => $validated['precio'],
                'categoria_id' => $categoria_id,
                'codigo' => $validated['codigo'] ?? $combo->codigo,
                'activo' => $validated['activo'],
            ]);
            
            // 2. Eliminar los componentes actuales
            ComboProducto::where('combo_id', $combo->id)->delete();
            
            // 3. Crear los nuevos componentes
            foreach ($validated['componentes'] as $componente) {
                ComboProducto::create([
                    'combo_id' => $combo->id,
                    'producto_id' => $componente['producto_id'],
                    'cantidad' => $componente['cantidad'],
                ]);
            }
            
            DB::commit();
            
            return redirect()->route('menu.combos.index')
                ->with('success', 'Combo actualizado con éxito');
                
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar combo:', ['error' => $e->getMessage()]);
            
            return redirect()->back()
                ->with('error', 'Error al actualizar el combo: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Eliminar un combo
     */
    public function destroy(Producto $combo)
    {
        // Verificar que sea un combo
        if (!$combo->es_combo) {
            return redirect()->route('menu.combos.index')
                ->with('error', 'El producto seleccionado no es un combo');
        }
        
        try {
            DB::beginTransaction();
            
            // 1. Eliminar los componentes del combo
            ComboProducto::where('combo_id', $combo->id)->delete();
            
            // 2. Eliminar el producto combo
            $combo->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Combo eliminado con éxito',
            ]);
                
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar combo:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el combo: ' . $e->getMessage(),
            ], 500);
        }
    }
}
