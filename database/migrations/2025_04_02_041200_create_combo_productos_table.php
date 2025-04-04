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
        Schema::create('combo_productos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('combo_id')->comment('ID del producto que es combo');
            $table->unsignedBigInteger('producto_id')->comment('ID del producto incluido en el combo');
            $table->integer('cantidad')->default(1)->comment('Cantidad del producto en el combo');
            $table->timestamps();

            // Foreign keys
            $table->foreign('combo_id')->references('id')->on('productos')->onDelete('cascade');
            $table->foreign('producto_id')->references('id')->on('productos')->onDelete('cascade');
            
            // Un producto solo puede aparecer una vez en un combo específico
            $table->unique(['combo_id', 'producto_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combo_productos');
    }
};
