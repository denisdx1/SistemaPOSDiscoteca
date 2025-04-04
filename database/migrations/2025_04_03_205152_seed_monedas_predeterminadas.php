<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Crear monedas predeterminadas
        $monedas = [
            [
                'codigo' => 'PEN',
                'nombre' => 'Sol Peruano',
                'simbolo' => 'S/',
                'tasa_cambio' => 1.0, // Moneda base
                'es_predeterminada' => true,
                'activo' => true,
                'formato_numero' => 'S/0,0.00',
                'decimales' => 2,
                'separador_decimal' => '.',
                'separador_miles' => ',',
                'codigo_pais' => 'PE',
                'locale' => 'es-PE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'USD',
                'nombre' => 'Dólar Estadounidense',
                'simbolo' => '$',
                'tasa_cambio' => 0.27, // 1 PEN = 0.27 USD (aproximado)
                'es_predeterminada' => false,
                'activo' => true,
                'formato_numero' => '$0,0.00',
                'decimales' => 2,
                'separador_decimal' => '.',
                'separador_miles' => ',',
                'codigo_pais' => 'US',
                'locale' => 'en-US',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'EUR',
                'nombre' => 'Euro',
                'simbolo' => '€',
                'tasa_cambio' => 0.25, // 1 PEN = 0.25 EUR (aproximado)
                'es_predeterminada' => false,
                'activo' => true,
                'formato_numero' => '€0,0.00',
                'decimales' => 2,
                'separador_decimal' => ',',
                'separador_miles' => '.',
                'codigo_pais' => 'EU',
                'locale' => 'es-ES',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'COP',
                'nombre' => 'Peso Colombiano',
                'simbolo' => '$',
                'tasa_cambio' => 1046.50, // 1 PEN = 1046.50 COP (aproximado)
                'es_predeterminada' => false,
                'activo' => true,
                'formato_numero' => '$ 0,0',
                'decimales' => 0,
                'separador_decimal' => '.',
                'separador_miles' => ',',
                'codigo_pais' => 'CO',
                'locale' => 'es-CO',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'MXN',
                'nombre' => 'Peso Mexicano',
                'simbolo' => '$',
                'tasa_cambio' => 4.58, // 1 PEN = 4.58 MXN (aproximado)
                'es_predeterminada' => false,
                'activo' => true,
                'formato_numero' => '$ 0,0.00',
                'decimales' => 2,
                'separador_decimal' => '.',
                'separador_miles' => ',',
                'codigo_pais' => 'MX',
                'locale' => 'es-MX',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insertar las monedas
        DB::table('monedas')->insert($monedas);

        // Agregar configuración predeterminada
        DB::table('configuraciones')->insert([
            'clave' => 'moneda_predeterminada',
            'valor' => 'PEN',
            'descripcion' => 'Código de la moneda predeterminada del sistema',
            'tipo' => 'string',
            'grupo' => 'sistema',
            'es_privado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar las monedas predeterminadas
        DB::table('monedas')->whereIn('codigo', ['PEN', 'USD', 'EUR', 'COP', 'MXN'])->delete();

        // Eliminar configuración
        DB::table('configuraciones')->where('clave', 'moneda_predeterminada')->delete();
    }
};
