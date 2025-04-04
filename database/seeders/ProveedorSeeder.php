<?php

namespace Database\Seeders;

use App\Models\Proveedor;
use Illuminate\Database\Seeder;

class ProveedorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $proveedores = [
            [
                'nombre' => 'Distribuidora Central S.A.',
                'ruc' => '20123456789',
                'direccion' => 'Av. Central 123, Lima',
                'telefono' => '01-3456789',
                'email' => 'ventas@distcentral.com',
                'contacto' => 'Juan Pérez',
                'observaciones' => 'Proveedor principal de bebidas alcohólicas',
                'activo' => true,
            ],
            [
                'nombre' => 'Importadora de Licores Premium',
                'ruc' => '20987654321',
                'direccion' => 'Jr. Los Cedros 456, Lima',
                'telefono' => '01-9876543',
                'email' => 'contacto@importadorapremium.com',
                'contacto' => 'María García',
                'observaciones' => 'Especializada en licores importados',
                'activo' => true,
            ],
            [
                'nombre' => 'Distribuidora Nacional E.I.R.L.',
                'ruc' => '20567891234',
                'direccion' => 'Av. Las Palmeras 789, Lima',
                'telefono' => '01-5678912',
                'email' => 'ventas@distnacional.com',
                'contacto' => 'Carlos Rodríguez',
                'observaciones' => 'Proveedor de cervezas nacionales',
                'activo' => true,
            ],
            [
                'nombre' => 'Comercializadora de Bebidas S.A.C.',
                'ruc' => '20345678912',
                'direccion' => 'Jr. Los Pinos 234, Lima',
                'telefono' => '01-3456789',
                'email' => 'ventas@combebidas.com',
                'contacto' => 'Ana Torres',
                'observaciones' => 'Distribuidor de bebidas no alcohólicas',
                'activo' => true,
            ],
            [
                'nombre' => 'Mayorista de Insumos Barman',
                'ruc' => '20891234567',
                'direccion' => 'Calle Las Orquídeas 567, Lima',
                'telefono' => '01-8912345',
                'email' => 'info@insumosbarman.com',
                'contacto' => 'Roberto Díaz',
                'observaciones' => 'Especializado en insumos para bar',
                'activo' => true,
            ],
        ];

        foreach ($proveedores as $proveedor) {
            Proveedor::create($proveedor);
        }
    }
}
