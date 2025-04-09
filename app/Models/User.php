<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'role',
        'role_id',
        'caja_asignada_id',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relación con el modelo Role
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Relación con la caja asignada
     */
    public function cajaAsignada(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_asignada_id');
    }

    /**
     * Comprobar si el usuario tiene un rol específico
     */
    public function hasRole(string $roleName): bool
    {
        // Si role es un string, comparar directamente
        if (is_string($this->role)) {
            return $this->role === $roleName;
        }
        
        // Si es un objeto Role, usar la propiedad nombre
        return $this->role && $this->role->nombre === $roleName;
    }

    /**
     * Comprobar si el usuario tiene un permiso específico
     */
    public function hasPermission(string $permissionSlug): bool
    {
        // Si role es un string, necesitamos obtener el objeto Role
        if (is_string($this->role)) {
            $role = Role::where('nombre', $this->role)->first();
            return $role && $role->permissions->contains('slug', $permissionSlug);
        }
        
        return $this->role && $this->role->permissions->contains('slug', $permissionSlug);
    }

    /**
     * Comprobar si el usuario tiene acceso a un módulo específico
     */
    public function hasAccessToModule(string $module): bool
    {
        // Si role es un string, necesitamos obtener el objeto Role
        if (is_string($this->role)) {
            $role = Role::where('nombre', $this->role)->first();
            return $role && $role->permissions->where('modulo', $module)->count() > 0;
        }
        
        return $this->role && $this->role->permissions->where('modulo', $module)->count() > 0;
    }
}
