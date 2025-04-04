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
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique();
            $table->string('valor')->nullable();
            $table->string('descripcion')->nullable();
            $table->string('tipo')->default('string')->comment('string, integer, boolean, json');
            $table->string('grupo')->default('general');
            $table->boolean('es_privado')->default(false)->comment('Si contiene información sensible');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};
