<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductoComplemento extends Model
{
    use HasFactory;

    protected $table = 'producto_complementos';

    protected $fillable = [
        'producto_principal_id',
        'producto_complemento_id',
        'cantidad_requerida',
        'es_obligatorio',
        'es_gratuito'
    ];

    protected $casts = [
        'es_obligatorio' => 'boolean',
        'es_gratuito' => 'boolean',
    ];

    /**
     * Obtiene el producto principal al que pertenece este complemento
     */
    public function productoPrincipal(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_principal_id');
    }

    /**
     * Obtiene el producto complemento
     */
    public function productoComplemento(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_complemento_id');
    }
}