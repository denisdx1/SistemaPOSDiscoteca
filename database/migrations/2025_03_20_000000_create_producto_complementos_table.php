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
        Schema::create('producto_complementos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_principal_id')->constrained('productos')->onDelete('cascade');
            $table->foreignId('producto_complemento_id')->constrained('productos')->onDelete('cascade');
            $table->integer('cantidad_requerida')->default(1);
            $table->boolean('es_obligatorio')->default(false);
            $table->timestamps();
            
            // Evitar duplicados
            $table->unique(['producto_principal_id', 'producto_complemento_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producto_complementos');
    }
};