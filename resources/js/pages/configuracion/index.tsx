import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  Database, 
  Server, 
  Printer,
  DollarSign
} from 'lucide-react';

export default function Configuracion() {
  return (
    <>
      <Head title="Configuración del Sistema" />
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Usuarios y Permisos */}
            <Card className="p-6 bg-card hover:bg-accent transition-all duration-300 dark:hover:bg-accent/20">
              <Link href={route('usuarios.lista')} className="flex flex-col items-center">
                <div className="mb-4 p-3 rounded-full bg-background dark:bg-background/80 hover:bg-accent-foreground/10 transition-colors">
                  <Users className="h-12 w-12 text-foreground/80" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Usuarios y Permisos</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Configura usuarios, roles y permisos para controlar el acceso al sistema.
                </p>
              </Link>
            </Card>

            {/* Monedas */}
            <Card className="p-6 bg-card hover:bg-accent transition-all duration-300 dark:hover:bg-accent/20">
              <Link href={route('monedas.index')} className="flex flex-col items-center">
                <div className="mb-4 p-3 rounded-full bg-background dark:bg-background/80 hover:bg-accent-foreground/10 transition-colors">
                  <DollarSign className="h-12 w-12 text-foreground/80" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Monedas</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Gestiona las monedas disponibles y tasas de cambio.
                </p>
              </Link>
            </Card>

            {/* Configuración General */}
            <Card className="p-6 bg-card hover:bg-accent transition-all duration-300 dark:hover:bg-accent/20">
              <Link href={route('configuracion.general')} className="flex flex-col items-center">
                <div className="mb-4 p-3 rounded-full bg-background dark:bg-background/80 hover:bg-accent-foreground/10 transition-colors">
                  <Settings className="h-12 w-12 text-foreground/80" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Configuración General</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Ajusta parámetros generales del sistema.
                </p>
              </Link>
            </Card>

            {/* Base de Datos */}
            <Card className="p-6 bg-card hover:bg-accent/50 transition-all duration-300 dark:hover:bg-accent/20">
              <div className="flex flex-col items-center opacity-60">
                <div className="mb-4 p-3 rounded-full bg-background dark:bg-background/80">
                  <Database className="h-12 w-12 text-foreground/80" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Base de Datos</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Gestión de la base de datos del sistema.
                </p>
                <span className="mt-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Próximamente</span>
              </div>
            </Card>

            {/* Servidor */}
            <Card className="p-6 bg-card hover:bg-accent/50 transition-all duration-300 dark:hover:bg-accent/20">
              <div className="flex flex-col items-center opacity-60">
                <div className="mb-4 p-3 rounded-full bg-background dark:bg-background/80">
                  <Server className="h-12 w-12 text-foreground/80" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Servidor</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Configuración del servidor y recursos.
                </p>
                <span className="mt-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Próximamente</span>
              </div>
            </Card>

            {/* Impresoras */}
            <Card className="p-6 bg-card hover:bg-accent/50 transition-all duration-300 dark:hover:bg-accent/20">
              <div className="flex flex-col items-center opacity-60">
                <div className="mb-4 p-3 rounded-full bg-background dark:bg-background/80">
                  <Printer className="h-12 w-12 text-foreground/80" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Impresoras</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Configuración de impresoras para tickets y comandas.
                </p>
                <span className="mt-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Próximamente</span>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
