<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtenemos las categorías por nombre para asociar los productos correctamente
        $categorias = Categoria::all()->keyBy('nombre');

        // Productos para Bebidas Alcohólicas
        $bebidasAlcoholicas = [
            [
                'nombre' => 'Cerveza Nacional',
                'descripcion' => 'Cerveza nacional de 355ml',
                'precio' => 60.00,
                'costo' => 30.00,
                'codigo' => 'BA-001',
                'activo' => true,
            ],
            [
                'nombre' => 'Cerveza Importada',
                'descripcion' => 'Cerveza importada de 355ml',
                'precio' => 80.00,
                'costo' => 45.00,
                'codigo' => 'BA-002',
                'activo' => true,
            ],
            [
                'nombre' => 'Whisky',
                'descripcion' => 'Whisky por trago',
                'precio' => 120.00,
                'costo' => 60.00,
                'codigo' => 'BA-003',
                'activo' => true,
            ],
            [
                'nombre' => 'Vodka',
                'descripcion' => 'Vodka por trago',
                'precio' => 100.00,
                'costo' => 50.00,
                'codigo' => 'BA-004',
                'activo' => true,
            ],
        ];

        // Productos para Bebidas No Alcohólicas
        $bebidasNoAlcoholicas = [
            [
                'nombre' => 'Refresco',
                'descripcion' => 'Refresco de 355ml',
                'precio' => 35.00,
                'costo' => 15.00,
                'codigo' => 'BNA-001',
                'activo' => true,
            ],
            [
                'nombre' => 'Agua Mineral',
                'descripcion' => 'Agua mineral de 355ml',
                'precio' => 30.00,
                'costo' => 10.00,
                'codigo' => 'BNA-002',
                'activo' => true,
            ],
            [
                'nombre' => 'Jugo Natural',
                'descripcion' => 'Jugo natural recién exprimido',
                'precio' => 45.00,
                'costo' => 20.00,
                'codigo' => 'BNA-003',
                'activo' => true,
            ],
        ];

        // Productos para Botanas
        $botanas = [
            [
                'nombre' => 'Nachos con Queso',
                'descripcion' => 'Nachos con queso y jalapeños',
                'precio' => 90.00,
                'costo' => 40.00,
                'codigo' => 'BOT-001',
                'activo' => true,
            ],
            [
                'nombre' => 'Alitas BBQ',
                'descripcion' => 'Alitas de pollo con salsa BBQ (10 piezas)',
                'precio' => 150.00,
                'costo' => 70.00,
                'codigo' => 'BOT-002',
                'activo' => true,
            ],
            [
                'nombre' => 'Dedos de Queso',
                'descripcion' => 'Dedos de queso fritos (8 piezas)',
                'precio' => 110.00,
                'costo' => 50.00,
                'codigo' => 'BOT-003',
                'activo' => true,
            ],
        ];

        // Productos para Cócteles Especiales
        $coctelesEspeciales = [
            [
                'nombre' => 'Margarita',
                'descripcion' => 'Cóctel de tequila, limón y triple sec',
                'precio' => 120.00,
                'costo' => 60.00,
                'codigo' => 'COC-001',
                'activo' => true,
            ],
            [
                'nombre' => 'Piña Colada',
                'descripcion' => 'Cóctel de ron, piña y crema de coco',
                'precio' => 130.00,
                'costo' => 65.00,
                'codigo' => 'COC-002',
                'activo' => true,
            ],
            [
                'nombre' => 'Mojito',
                'descripcion' => 'Cóctel de ron, menta y limón',
                'precio' => 110.00,
                'costo' => 55.00,
                'codigo' => 'COC-003',
                'activo' => true,
            ],
        ];

        // Productos para Platillos
        $platillos = [
            [
                'nombre' => 'Hamburguesa Clásica',
                'descripcion' => 'Hamburguesa con carne, queso, lechuga y tomate',
                'precio' => 140.00,
                'costo' => 70.00,
                'codigo' => 'PLA-001',
                'activo' => true,
            ],
            [
                'nombre' => 'Pizza Margarita',
                'descripcion' => 'Pizza con queso y tomate',
                'precio' => 180.00,
                'costo' => 90.00,
                'codigo' => 'PLA-002',
                'activo' => true,
            ],
            [
                'nombre' => 'Ensalada César',
                'descripcion' => 'Ensalada con lechuga romana, crutones, parmesano y aderezo césar',
                'precio' => 120.00,
                'costo' => 60.00,
                'codigo' => 'PLA-003',
                'activo' => true,
            ],
        ];

        // Guardar productos por categoría
        $this->guardarProductosPorCategoria($bebidasAlcoholicas, $categorias['Bebidas Alcohólicas']->id);
        $this->guardarProductosPorCategoria($bebidasNoAlcoholicas, $categorias['Bebidas No Alcohólicas']->id);
        $this->guardarProductosPorCategoria($botanas, $categorias['Botanas']->id);
        $this->guardarProductosPorCategoria($coctelesEspeciales, $categorias['Cócteles Especiales']->id);
        $this->guardarProductosPorCategoria($platillos, $categorias['Platillos']->id);
    }

    /**
     * Guarda una lista de productos para una categoría específica.
     */
    private function guardarProductosPorCategoria(array $productos, int $categoriaId): void
    {
        foreach ($productos as $producto) {
            $producto['categoria_id'] = $categoriaId;
            Producto::create($producto);
        }
    }
}
