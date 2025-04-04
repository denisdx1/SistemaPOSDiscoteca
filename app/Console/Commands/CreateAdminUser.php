<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create {--name= : Nombre del usuario} {--email= : Email del usuario} {--password= : Contraseña del usuario}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crea un usuario con rol de administrador';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Obtener el rol de administrador
        $adminRole = Role::where('nombre', 'administrador')->first();
        
        if (!$adminRole) {
            $this->error('El rol de administrador no existe en la base de datos');
            return 1;
        }

        // Obtener o solicitar los datos del usuario
        $name = $this->option('name') ?? $this->ask('Introduce el nombre del usuario');
        $email = $this->option('email') ?? $this->ask('Introduce el email del usuario');
        $password = $this->option('password') ?? $this->secret('Introduce la contraseña');

        // Verificar si el email ya existe
        if (User::where('email', $email)->exists()) {
            $this->error('El email ya está en uso');
            return 1;
        }

        // Crear el usuario
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role_id' => $adminRole->id,
            'role' => $adminRole->nombre,
            'status' => 'activo',
        ]);

        $this->info("Usuario administrador creado correctamente:");
        $this->table(
            ['Nombre', 'Email', 'Rol'],
            [[$user->name, $user->email, $adminRole->nombre]]
        );

        return 0;
    }
}
