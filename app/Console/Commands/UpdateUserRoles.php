<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;

class UpdateUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:update-roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualiza los role_id de todos los usuarios basados en su campo role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Actualizando roles de usuarios...');

        // Obtener todos los roles
        $roles = Role::all()->keyBy('nombre');
        
        if ($roles->isEmpty()) {
            $this->error('No hay roles definidos en la base de datos');
            return 1;
        }

        // Obtener todos los usuarios
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->warn('No hay usuarios en la base de datos');
            return 0;
        }

        $updated = 0;
        $errors = 0;

        foreach ($users as $user) {
            $roleName = $user->role;
            
            // Si el usuario no tiene un role definido, asignarle cajero por defecto
            if (empty($roleName)) {
                $roleName = 'cajero';
                $user->role = $roleName;
            }
            
            // Buscar el role_id correspondiente
            $role = $roles->get($roleName);
            
            if ($role) {
                $user->role_id = $role->id;
                $user->save();
                $updated++;
            } else {
                $this->warn("No se encontró el rol '{$roleName}' para el usuario {$user->name} ({$user->email})");
                $errors++;
            }
        }

        $this->info("Se actualizaron {$updated} usuarios correctamente");
        
        if ($errors > 0) {
            $this->warn("{$errors} usuarios no pudieron ser actualizados");
        }

        return 0;
    }
} 