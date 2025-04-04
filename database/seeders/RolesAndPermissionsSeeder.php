<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncar las tablas para evitar duplicados
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('role_permission')->truncate();
        DB::table('permissions')->truncate();
        DB::table('roles')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Crear roles
        $administrador = Role::create([
            'nombre' => 'administrador',
            'descripcion' => 'Acceso completo a todos los módulos del sistema',
        ]);

        $cajero = Role::create([
            'nombre' => 'cajero',
            'descripcion' => 'Acceso a dashboard, inventario, mesas y caja',
        ]);

        $mesero = Role::create([
            'nombre' => 'mesero',
            'descripcion' => 'Acceso a dashboard, mesas y órdenes',
        ]);

        $bartender = Role::create([
            'nombre' => 'bartender',
            'descripcion' => 'Acceso a dashboard, inventario y órdenes',
        ]);

        // Crear permisos por módulo
        // Dashboard
        $dashboardAccess = Permission::create([
            'nombre' => 'Acceso al Dashboard',
            'slug' => 'dashboard.access',
            'modulo' => 'dashboard',
            'descripcion' => 'Permite acceder al dashboard',
        ]);

        // Inventario
        $inventarioAccess = Permission::create([
            'nombre' => 'Acceso al Inventario',
            'slug' => 'inventario.access',
            'modulo' => 'inventario',
            'descripcion' => 'Permite acceder al módulo de inventario',
        ]);

        $inventarioEdit = Permission::create([
            'nombre' => 'Editar Inventario',
            'slug' => 'inventario.edit',
            'modulo' => 'inventario',
            'descripcion' => 'Permite modificar el inventario',
        ]);

        // Mesas
        $mesasAccess = Permission::create([
            'nombre' => 'Acceso a Mesas',
            'slug' => 'mesas.access',
            'modulo' => 'mesas',
            'descripcion' => 'Permite acceder al módulo de mesas',
        ]);

        $mesasEdit = Permission::create([
            'nombre' => 'Gestionar Mesas',
            'slug' => 'mesas.edit',
            'modulo' => 'mesas',
            'descripcion' => 'Permite crear y modificar mesas',
        ]);

        // Caja
        $cajaAccess = Permission::create([
            'nombre' => 'Acceso a Caja',
            'slug' => 'caja.access',
            'modulo' => 'caja',
            'descripcion' => 'Permite acceder al módulo de caja',
        ]);

        $cajaOperaciones = Permission::create([
            'nombre' => 'Operaciones de Caja',
            'slug' => 'caja.operations',
            'modulo' => 'caja',
            'descripcion' => 'Permite realizar operaciones en caja',
        ]);

        // Órdenes
        $ordenesAccess = Permission::create([
            'nombre' => 'Acceso a Órdenes',
            'slug' => 'ordenes.access',
            'modulo' => 'ordenes',
            'descripcion' => 'Permite acceder al módulo de órdenes',
        ]);

        $ordenesEdit = Permission::create([
            'nombre' => 'Gestionar Órdenes',
            'slug' => 'ordenes.edit',
            'modulo' => 'ordenes',
            'descripcion' => 'Permite crear y modificar órdenes',
        ]);

        // Usuarios
        $usuariosAccess = Permission::create([
            'nombre' => 'Acceso a Usuarios',
            'slug' => 'usuarios.access',
            'modulo' => 'usuarios',
            'descripcion' => 'Permite acceder al módulo de usuarios',
        ]);

        $usuariosEdit = Permission::create([
            'nombre' => 'Gestionar Usuarios',
            'slug' => 'usuarios.edit',
            'modulo' => 'usuarios',
            'descripcion' => 'Permite crear y modificar usuarios',
        ]);

        // Configuración
        $configAccess = Permission::create([
            'nombre' => 'Acceso a Configuración',
            'slug' => 'config.access',
            'modulo' => 'configuracion',
            'descripcion' => 'Permite acceder al módulo de configuración',
        ]);

        // Facturación
        $facturacionAccess = Permission::create([
            'nombre' => 'Acceso a Facturación',
            'slug' => 'facturacion.access',
            'modulo' => 'facturacion',
            'descripcion' => 'Permite acceder al módulo de facturación',
        ]);

        // Asignar permisos a roles
        // Administrador: todos los permisos
        $administrador->permissions()->attach(Permission::all());

        // Cajero: dashboard, inventario (solo lectura), mesas, caja, facturación
        $cajero->permissions()->attach([
            $dashboardAccess->id,
            $inventarioAccess->id,
            $mesasAccess->id,
            $cajaAccess->id,
            $cajaOperaciones->id,
            $facturacionAccess->id,
        ]);

        // Mesero: dashboard, mesas, órdenes
        $mesero->permissions()->attach([
            $dashboardAccess->id,
            $mesasAccess->id,
            $ordenesAccess->id,
            $ordenesEdit->id,
        ]);

        // Bartender: dashboard, inventario (lectura), órdenes
        $bartender->permissions()->attach([
            $dashboardAccess->id,
            $inventarioAccess->id,
            $ordenesAccess->id,
            $ordenesEdit->id,
        ]);
    }
}
