<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Mesa extends Model
{
    use HasFactory;

    /**
     * La tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'mesas';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        //'id',
        'numero',
        'capacidad',
        'estado',
        'ubicacion',
        'notas',
        'activa',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        //'id' => 'integer',
        'numero' => 'integer',
        'capacidad' => 'integer',
        'activa' => 'boolean',
    ];

    // Estados posibles para una mesa
    const ESTADO_DISPONIBLE = 'disponible';
    const ESTADO_OCUPADA = 'ocupada';
    const ESTADO_RESERVADA = 'reservada';

    /**
     * Obtiene las órdenes asociadas a esta mesa.
     */
    public function ordenes(): HasMany
    {
        return $this->hasMany(Orden::class);
    }

    /**
     * Scope para mesas disponibles
     */
    public function scopeDisponibles(Builder $query): Builder
    {
        return $query->where('estado', self::ESTADO_DISPONIBLE)
                    ->where('activa', true);
    }

    /**
     * Scope para mesas ocupadas
     */
    public function scopeOcupadas(Builder $query): Builder
    {
        return $query->where('estado', self::ESTADO_OCUPADA)
                    ->where('activa', true);
    }

    // Métodos de ayuda
    public function estaDisponible(): bool
    {
        return $this->estado === self::ESTADO_DISPONIBLE && $this->activa;
    }

    public function estaOcupada(): bool
    {
        return $this->estado === self::ESTADO_OCUPADA;
    }

    public function estaReservada(): bool
    {
        return $this->estado === self::ESTADO_RESERVADA;
    }

    public function marcarComoOcupada(): bool
    {
        if (!$this->estaDisponible()) {
            return false;
        }

        $this->update(['estado' => self::ESTADO_OCUPADA]);
        return true;
    }

    public function marcarComoDisponible(): void
    {
        // Verificar si hay órdenes pendientes antes de marcar como disponible
        $ordenesActivas = $this->ordenes()
            ->whereIn('estado', ['pendiente', 'en_proceso'])
            ->count();

        if ($ordenesActivas === 0) {
            $this->update(['estado' => self::ESTADO_DISPONIBLE]);
        }
    }

    /**
     * Obtiene la última orden activa de la mesa
     */
    public function obtenerOrdenActiva()
    {
        return $this->ordenes()
            ->whereIn('estado', ['pendiente', 'en_proceso'])
            ->latest()
            ->first();
    }

    /**
     * Verifica si la mesa puede recibir nuevas órdenes
     */
    public function puedeRecibirOrdenes(): bool
    {
        if (!$this->activa) {
            return false;
        }

        // Si la mesa está ocupada, verificar si ya tiene una orden activa
        if ($this->estaOcupada()) {
            $ordenActiva = $this->obtenerOrdenActiva();
            return $ordenActiva === null;
        }

        // Solo se pueden crear órdenes en mesas disponibles
        return $this->estaDisponible();
    }
}
