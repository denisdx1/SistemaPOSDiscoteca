<?php

namespace Database\Seeders;

use App\Models\Pedido;
use App\Models\DetallePedido;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PedidoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener usuarios para asignar a los pedidos
        $usuarios = User::all();
        if ($usuarios->isEmpty()) {
            // Si no hay usuarios, crear uno para los seeders
            $usuario = User::factory()->create([
                'name' => 'Admin Seeder',
                'email' => 'admin@example.com',
            ]);
            $usuarios = collect([$usuario]);
        }
        
        // Obtener proveedores 
        $proveedores = Proveedor::where('activo', true)->get();
        if ($proveedores->isEmpty()) {
            $this->command->info('No hay proveedores disponibles. Ejecute el seeder de proveedores primero.');
            return;
        }
        
        // Obtener productos
        $productos = Producto::where('activo', true)->get();
        if ($productos->isEmpty()) {
            $this->command->info('No hay productos disponibles. Ejecute el seeder de productos primero.');
            return;
        }
        
        // Fechas para distribuir los pedidos
        $fechaInicio = Carbon::now()->subDays(90);
        $fechaFin = Carbon::now();
        
        // Crear entre 5 y 15 pedidos
        $numPedidos = rand(5, 15);
        
        for ($i = 0; $i < $numPedidos; $i++) {
            // Fecha aleatoria en el rango
            $dias = $fechaInicio->diffInDays($fechaFin);
            $fechaPedido = $fechaInicio->copy()->addDays(rand(0, $dias));
            
            // Fecha esperada de entrega (entre 3 y 15 días después del pedido)
            $fechaEsperada = $fechaPedido->copy()->addDays(rand(3, 15));
            
            // Proveedor aleatorio
            $proveedor = $proveedores->random();
            
            // Usuario aleatorio
            $usuario = $usuarios->random();
            
            // Estado del pedido
            $estados = ['pendiente', 'recibido', 'parcial', 'cancelado'];
            $pesos = [30, 40, 20, 10]; // Probabilidades relativas
            $estado = $this->getRandomWeighted($estados, $pesos);
            
            // Fecha de recepción (solo si el estado es recibido o parcial)
            $fechaRecepcion = null;
            if (in_array($estado, ['recibido', 'parcial'])) {
                $fechaRecepcion = $fechaEsperada->copy()->subDays(rand(-3, 3)); // ±3 días de la fecha esperada
                if ($fechaRecepcion->gt(Carbon::now())) {
                    $fechaRecepcion = Carbon::now(); // No puede ser en el futuro
                }
            }
            
            // Crear el pedido
            $numeroPedido = 'PED-' . $fechaPedido->format('Ymd') . '-' . Str::padLeft($i + 1, 4, '0');
            
            $pedido = Pedido::create([
                'numero_pedido' => $numeroPedido,
                'proveedor_id' => $proveedor->id,
                'user_id' => $usuario->id,
                'estado' => $estado,
                'fecha_pedido' => $fechaPedido,
                'fecha_esperada' => $fechaEsperada,
                'fecha_recepcion' => $fechaRecepcion,
                'total' => 0, // Se actualizará después
                'observaciones' => 'Pedido de prueba generado automáticamente',
                'created_at' => $fechaPedido,
                'updated_at' => $fechaPedido,
            ]);
            
            // Crear entre 2 y 8 detalles para el pedido
            $numDetalles = rand(2, 8);
            $productosSeleccionados = $productos->random($numDetalles);
            $total = 0;
            
            foreach ($productosSeleccionados as $producto) {
                $cantidad = rand(5, 30);
                $precioUnitario = $producto->costo ?: $producto->precio * 0.7;
                $subtotal = $cantidad * $precioUnitario;
                $total += $subtotal;
                
                // Calcular cantidad recibida según el estado del pedido
                $cantidadRecibida = 0;
                if ($estado === 'recibido') {
                    $cantidadRecibida = $cantidad;
                } elseif ($estado === 'parcial') {
                    $cantidadRecibida = rand(1, $cantidad - 1);
                }
                
                DetallePedido::create([
                    'pedido_id' => $pedido->id,
                    'producto_id' => $producto->id,
                    'cantidad' => $cantidad,
                    'cantidad_recibida' => $cantidadRecibida,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotal,
                    'observaciones' => null,
                    'created_at' => $fechaPedido,
                    'updated_at' => $fechaPedido,
                ]);
            }
            
            // Actualizar el total del pedido
            $pedido->update(['total' => $total]);
        }
    }
    
    /**
     * Obtener un elemento aleatorio con pesos
     * 
     * @param array $items
     * @param array $weights
     * @return mixed
     */
    private function getRandomWeighted(array $items, array $weights)
    {
        $weightSum = array_sum($weights);
        $randomValue = rand(1, $weightSum);
        $weightCounter = 0;
        
        foreach ($items as $index => $item) {
            $weightCounter += $weights[$index];
            if ($randomValue <= $weightCounter) {
                return $item;
            }
        }
        
        return $items[0]; // Por si acaso
    }
}
