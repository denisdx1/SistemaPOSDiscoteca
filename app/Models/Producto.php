<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;

class Producto extends Model
{
    use HasFactory;

    /**
     * La tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'productos';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'precio',
        'costo',
        'codigo',
        'imagen_url',
        'activo',
        'categoria_id',
        'es_combo'
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'precio' => 'decimal:2',
        'costo' => 'decimal:2',
        'activo' => 'boolean',
        'es_combo' => 'boolean',
    ];

    /**
     * Obtiene la categoría a la que pertenece este producto.
     */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    /**
     * Obtiene las órdenes asociadas a este producto.
     */
    public function ordenes(): BelongsToMany
    {
        return $this->belongsToMany(Orden::class, 'orden_producto')
                    ->withPivot('cantidad', 'precio_unitario', 'subtotal', 'notas', 'es_complemento_gratuito', 'complemento_de')
                    ->withTimestamps();
    }
    
    /**
     * Obtiene la entrada de stock en inventario para este producto.
     */
    public function stock(): HasOne
    {
        return $this->hasOne(InventarioStock::class);
    }
    
    /**
     * Obtiene los movimientos de inventario de este producto.
     */
    public function movimientosInventario(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class);
    }
    
    /**
     * Obtiene los detalles de pedido que contienen este producto.
     */
    public function detallesPedido(): HasMany
    {
        return $this->hasMany(DetallePedido::class);
    }
    
    /**
     * Método auxiliar para obtener la cantidad actual en stock
     */
    public function getStockActualAttribute()
    {
        // Para combos, retornar 1 si está disponible, 0 si no
        if ($this->es_combo) {
            return $this->getComboDisponibleAttribute() ? 1 : 0;
        }
        
        // Para productos normales, continuar con la lógica existente
        if (is_object($this->stock)) {
            return $this->stock->cantidad;
        } elseif (is_numeric($this->stock)) {
            return (int)$this->stock;
        } else {
            return 0;
        }
    }
    
    /**
     * Obtiene los productos complementarios asociados a este producto
     */
    public function complementos(): HasMany
    {
        return $this->hasMany(ProductoComplemento::class, 'producto_principal_id');
    }
    
    /**
     * Obtiene los productos a los que este producto sirve como complemento
     */
    public function productosComoComplemento(): HasMany
    {
        return $this->hasMany(ProductoComplemento::class, 'producto_complemento_id');
    }
    
    /**
     * Obtiene los productos complementarios directamente
     */
    public function productosComplementarios(): BelongsToMany
    {
        return $this->belongsToMany(
            Producto::class,
            'producto_complementos',
            'producto_principal_id',
            'producto_complemento_id'
        )->withPivot('cantidad_requerida', 'es_obligatorio', 'es_gratuito');
    }
    
    /**
     * Obtiene los productos principales a los que este producto sirve como complemento
     */
    public function productosPrincipales(): BelongsToMany
    {
        return $this->belongsToMany(
            Producto::class,
            'producto_complementos',
            'producto_complemento_id',
            'producto_principal_id'
        )->withPivot('cantidad_requerida', 'es_obligatorio', 'es_gratuito');
    }
    
    /**
     * Scope para filtrar productos que tienen complementos
     */
    public function scopeConComplementos(Builder $query): Builder
    {
        return $query->whereHas('complementos');
    }
    
    /**
     * Obtiene los componentes de este combo (cuando es_combo = true)
     */
    public function componentesCombo()
    {
        return $this->hasMany(ComboProducto::class, 'combo_id');
    }
    
    /**
     * Obtiene los combos que contienen este producto como componente
     */
    public function combosQueLoIncluyen()
    {
        return $this->hasMany(ComboProducto::class, 'producto_id');
    }
    
    /**
     * Scope para filtrar solo combos
     */
    public function scopeSoloCombos(Builder $query): Builder
    {
        return $query->where('es_combo', true);
    }
    
    /**
     * Scope para filtrar los productos que no son combos
     */
    public function scopeNoCombo(Builder $query): Builder
    {
        return $query->where(function($q) {
            $q->where('es_combo', false)->orWhereNull('es_combo');
        });
    }

    /**
     * Verifica si un combo tiene stock disponible
     * Un combo tiene stock si todos sus componentes tienen suficiente stock
     * 
     * @return bool
     */
    public function getComboDisponibleAttribute(): bool
    {
        // Si no es un combo, retornar null
        if (!$this->es_combo) {
            return false;
        }
        
        // Cargar los componentes del combo si no están cargados
        if (!$this->relationLoaded('componentesCombo')) {
            $this->load('componentesCombo.producto.stock');
        }
        
        // Verificar el stock de cada componente
        foreach ($this->componentesCombo as $componente) {
            // Si no existe el producto, no está disponible
            if (!$componente->producto) {
                return false;
            }
            
            // Si el producto componente es inactivo, no está disponible
            if (!$componente->producto->activo) {
                return false;
            }
            
            // Obtener el stock actual del componente
            $stockComponente = $componente->producto->stock ? $componente->producto->stock->cantidad : 0;
            
            // Si el stock es menor que la cantidad requerida, el combo no está disponible
            if ($stockComponente < $componente->cantidad) {
                return false;
            }
        }
        
        // Si todos los componentes tienen stock suficiente, el combo está disponible
        return true;
    }
}
