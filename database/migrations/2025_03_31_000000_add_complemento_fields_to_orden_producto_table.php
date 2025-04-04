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
        if (Schema::hasTable('orden_producto')) {
            Schema::table('orden_producto', function (Blueprint $table) {
                // Añadir campos para los complementos gratuitos
                $table->boolean('es_complemento_gratuito')->default(false)->after('notas');
                $table->unsignedBigInteger('complemento_de')->nullable()->after('es_complemento_gratuito');
                
                // Añadir la clave foránea a productos (el producto principal)
                $table->foreign('complemento_de')
                    ->references('id')
                    ->on('productos')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orden_producto')) {
            Schema::table('orden_producto', function (Blueprint $table) {
                // Eliminar la clave foránea primero
                $table->dropForeign(['complemento_de']);
                
                // Luego eliminar las columnas
                $table->dropColumn('es_complemento_gratuito');
                $table->dropColumn('complemento_de');
            });
        }
    }
}; 