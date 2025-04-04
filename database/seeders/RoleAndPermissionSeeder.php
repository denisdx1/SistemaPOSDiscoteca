<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear roles principales
        $roles = [
            [
                'nombre' => 'administrador',
                'descripcion' => 'Acceso completo a todas las funcionalidades',
            ],
            [
                'nombre' => 'cajero',
                'descripcion' => 'Gestión de ventas y operaciones de caja',
            ],
            [
                'nombre' => 'mesero',
                'descripcion' => 'Gestión de mesas y órdenes',
            ],
            [
                'nombre' => 'bartender',
                'descripcion' => 'Preparación de bebidas y gestión de inventario',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::create($roleData);
        }

        // Crear permisos por módulos
        $permisos = [
            // Dashboard
            [
                'nombre' => 'Ver Dashboard',
                'slug' => 'dashboard.view',
                'modulo' => 'dashboard',
                'descripcion' => 'Permite ver el dashboard principal',
            ],
            
            // Menú
            [
                'nombre' => 'Ver Productos',
                'slug' => 'menu.productos.view',
                'modulo' => 'menu',
                'descripcion' => 'Permite ver la lista de productos',
            ],
            [
                'nombre' => 'Crear Productos',
                'slug' => 'menu.productos.create',
                'modulo' => 'menu',
                'descripcion' => 'Permite crear nuevos productos',
            ],
            [
                'nombre' => 'Editar Productos',
                'slug' => 'menu.productos.edit',
                'modulo' => 'menu',
                'descripcion' => 'Permite editar productos existentes',
            ],
            [
                'nombre' => 'Eliminar Productos',
                'slug' => 'menu.productos.delete',
                'modulo' => 'menu',
                'descripcion' => 'Permite eliminar productos',
            ],
            
            // Inventario
            [
                'nombre' => 'Ver Inventario',
                'slug' => 'inventario.view',
                'modulo' => 'inventario',
                'descripcion' => 'Permite ver el inventario',
            ],
            [
                'nombre' => 'Gestionar Inventario',
                'slug' => 'inventario.manage',
                'modulo' => 'inventario',
                'descripcion' => 'Permite añadir, editar y eliminar registros de inventario',
            ],
            
            // Mesas
            [
                'nombre' => 'Ver Mesas',
                'slug' => 'mesas.view',
                'modulo' => 'mesas',
                'descripcion' => 'Permite ver las mesas',
            ],
            [
                'nombre' => 'Gestionar Mesas',
                'slug' => 'mesas.manage',
                'modulo' => 'mesas',
                'descripcion' => 'Permite reservar, liberar y asignar mesas',
            ],
            
            // Órdenes
            [
                'nombre' => 'Crear Órdenes',
                'slug' => 'ordenes.create',
                'modulo' => 'ordenes',
                'descripcion' => 'Permite crear nuevas órdenes',
            ],
            [
                'nombre' => 'Ver Órdenes',
                'slug' => 'ordenes.view',
                'modulo' => 'ordenes',
                'descripcion' => 'Permite ver las órdenes',
            ],
            [
                'nombre' => 'Gestionar Órdenes',
                'slug' => 'ordenes.manage',
                'modulo' => 'ordenes',
                'descripcion' => 'Permite editar y cancelar órdenes',
            ],
            
            // Caja
            [
                'nombre' => 'Abrir/Cerrar Caja',
                'slug' => 'caja.apertura-cierre',
                'modulo' => 'caja',
                'descripcion' => 'Permite abrir y cerrar la caja',
            ],
            [
                'nombre' => 'Ver Historial de Caja',
                'slug' => 'caja.historial',
                'modulo' => 'caja',
                'descripcion' => 'Permite ver el historial de operaciones de caja',
            ],
            
            // Usuarios
            [
                'nombre' => 'Ver Usuarios',
                'slug' => 'usuarios.view',
                'modulo' => 'usuarios',
                'descripcion' => 'Permite ver la lista de usuarios',
            ],
            [
                'nombre' => 'Gestionar Usuarios',
                'slug' => 'usuarios.manage',
                'modulo' => 'usuarios',
                'descripcion' => 'Permite crear, editar y eliminar usuarios',
            ],
            
            // Roles y Permisos
            [
                'nombre' => 'Ver Roles',
                'slug' => 'roles.view',
                'modulo' => 'roles',
                'descripcion' => 'Permite ver los roles del sistema',
            ],
            [
                'nombre' => 'Gestionar Roles',
                'slug' => 'roles.manage',
                'modulo' => 'roles',
                'descripcion' => 'Permite crear, editar y eliminar roles',
            ],
            [
                'nombre' => 'Asignar Permisos',
                'slug' => 'permisos.assign',
                'modulo' => 'roles',
                'descripcion' => 'Permite asignar permisos a los roles',
            ],
            
            // Configuración
            [
                'nombre' => 'Ver Configuración',
                'slug' => 'configuracion.view',
                'modulo' => 'configuracion',
                'descripcion' => 'Permite ver la configuración del sistema',
            ],
            [
                'nombre' => 'Editar Configuración',
                'slug' => 'configuracion.edit',
                'modulo' => 'configuracion',
                'descripcion' => 'Permite modificar la configuración del sistema',
            ],
        ];

        foreach ($permisos as $permisoData) {
            Permission::create($permisoData);
        }

        // Asignar todos los permisos al rol de administrador
        $adminRole = Role::where('nombre', 'administrador')->first();
        $allPermissions = Permission::all();
        
        $adminRole->permissions()->attach($allPermissions->pluck('id'));
        
        // Asignar permisos al cajero
        $cajeroRole = Role::where('nombre', 'cajero')->first();
        $cajeroPermisos = [
            'dashboard.view', 
            'caja.apertura-cierre', 
            'caja.historial',
            'ordenes.create',
            'ordenes.view',
            'ordenes.manage',
            'mesas.view'
        ];
        
        $cajeroRole->permissions()->attach(
            Permission::whereIn('slug', $cajeroPermisos)->pluck('id')
        );
        
        // Asignar permisos al mesero
        $meseroRole = Role::where('nombre', 'mesero')->first();
        $meseroPermisos = [
            'dashboard.view', 
            'mesas.view', 
            'mesas.manage',
            'ordenes.create',
            'ordenes.view'
        ];
        
        $meseroRole->permissions()->attach(
            Permission::whereIn('slug', $meseroPermisos)->pluck('id')
        );
        
        // Asignar permisos al bartender
        $bartenderRole = Role::where('nombre', 'bartender')->first();
        $bartenderPermisos = [
            'dashboard.view', 
            'menu.productos.view',
            'inventario.view',
            'ordenes.view'
        ];
        
        $bartenderRole->permissions()->attach(
            Permission::whereIn('slug', $bartenderPermisos)->pluck('id')
        );
    }
} 