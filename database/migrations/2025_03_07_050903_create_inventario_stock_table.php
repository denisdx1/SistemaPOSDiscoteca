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
        Schema::create('inventario_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->onDelete('cascade');
            $table->integer('cantidad')->default(0);
            $table->integer('stock_minimo')->default(0)->nullable();
            $table->integer('stock_maximo')->default(0)->nullable();
            $table->string('ubicacion')->nullable(); // Para registrar dónde se almacena físicamente
            $table->timestamps();
            
            // Asegurarnos que cada producto tenga una sola entrada en la tabla de stock
            $table->unique('producto_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventario_stock');
    }
};
