import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  Database, 
  Server, 
  Globe,
  DollarSign
} from 'lucide-react';

export default function Configuracion() {
  return (
    <>
      <Head title="Configuración del Sistema" />
      <DashboardLayout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Configuración del Sistema</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Configuración de Usuarios */}
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Usuarios y Permisos</CardTitle>
                <CardDescription>
                  Gestiona los usuarios del sistema y sus permisos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configura usuarios, roles y permisos para controlar el acceso al sistema.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={route('usuarios.lista')}>
                    Gestionar Usuarios
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Configuración de Monedas */}
            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Monedas</CardTitle>
                <CardDescription>
                  Configura las monedas y tasas de cambio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestiona las monedas disponibles, establece la moneda predeterminada y configura tasas de cambio.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={route('monedas.index')}>
                    Gestionar Monedas
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Configuración del Sistema */}
            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Configuración general del sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ajusta parámetros generales como el tema de la aplicación, nombre del negocio, impuestos, y otras configuraciones.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={route('configuracion.general')}>
                    Gestionar Configuración
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Base de Datos */}
            <Card>
              <CardHeader>
                <Database className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Base de Datos</CardTitle>
                <CardDescription>
                  Gestión de la base de datos del sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Realiza copias de seguridad, restaura datos y optimiza la base de datos.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">
                  Próximamente
                </Button>
              </CardFooter>
            </Card>
            
            {/* Configuración de Servidor */}
            <Card>
              <CardHeader>
                <Server className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Servidor</CardTitle>
                <CardDescription>
                  Configuración del servidor y recursos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualiza y gestiona los recursos del servidor, caché y rendimiento.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">
                  Próximamente
                </Button>
              </CardFooter>
            </Card>
            
            {/* Configuración de Impresoras */}
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Impresoras</CardTitle>
                <CardDescription>
                  Configuración de impresoras para tickets y comandas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configura las impresoras para los diferentes tipos de documentos del sistema.
                </p>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">
                  Próximamente
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
