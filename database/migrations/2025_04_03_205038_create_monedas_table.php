<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('monedas', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 3)->unique()->comment('Código ISO de la moneda (USD, EUR, PEN)');
            $table->string('nombre', 50)->comment('Nombre de la moneda (Dólar, Euro, Sol)');
            $table->string('simbolo', 5)->comment('Símbolo de la moneda ($, €, S/)');
            $table->decimal('tasa_cambio', 12, 6)->default(1)->comment('Tasa de cambio respecto a la moneda base');
            $table->boolean('es_predeterminada')->default(false)->comment('Indica si es la moneda predeterminada');
            $table->boolean('activo')->default(true);
            $table->string('formato_numero', 20)->nullable()->comment('Formato de números para esta moneda');
            $table->string('decimales', 2)->default('2')->comment('Número de decimales a mostrar');
            $table->string('separador_decimal', 1)->default('.')->comment('Caracter para separador decimal');
            $table->string('separador_miles', 1)->default(',')->comment('Caracter para separador de miles');
            $table->string('codigo_pais', 5)->nullable()->comment('Código del país asociado (PE, US, etc)');
            $table->string('locale', 10)->nullable()->comment('Configuración regional para formateo (es-PE, en-US)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monedas');
    }
};
