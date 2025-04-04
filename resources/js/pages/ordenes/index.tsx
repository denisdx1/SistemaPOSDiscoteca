import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { PlusCircle, History, ArrowRight } from 'lucide-react';

const OrdenesIndex = () => {
  const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
  const userRole = auth.user.role;
  const isMesero = userRole === 'mesero';

  return (
    <DashboardLayout>
      <Head title="Órdenes" />
      
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Gestión de Órdenes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xl font-bold flex items-center">
                <PlusCircle className="w-6 h-6 mr-2 text-primary" />
                Nueva Orden
              </CardTitle>
              <CardDescription>Crear una nueva orden de consumo</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-4">Registra una nueva orden de productos y bebidas para tus clientes.</p>
              <Link href={route('ordenes.nueva')}>
                <Button className="w-full">
                  Crear nueva orden
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {!isMesero && (
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-secondary/5">
                <CardTitle className="text-xl font-bold flex items-center">
                  <History className="w-6 h-6 mr-2 text-secondary" />
                  Historial de Órdenes
                </CardTitle>
                <CardDescription>Consulta órdenes anteriores</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">Revisa, gestiona y consulta el estado de órdenes anteriores y actuales.</p>
                <Link href={route('ordenes.history')}>
                  <Button variant="outline" className="w-full">
                    Ver historial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrdenesIndex; 