
import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { 
  CreditCardIcon, 
  ShoppingBagIcon, 
  PackageIcon, 
  UsersIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from 'lucide-react';

interface PageProps {
  estadisticas: {
    ventasDelDia: number;
    porcentajeCambioVentas: number;
    productosVendidosHoy: number;
    productosStockBajo: number;
    usuariosActivos: number;
    ventasRecientes: Array<{
      id: number;
      numero_orden: string;
      mesa: string;
      total: number;
      usuario: string;
      fecha: string;
    }>;
    productosMasVendidos: Array<{
      id: number;
      nombre: string;
      total_vendido: number;
      total_ventas: number;
    }>;
  };
}

export default function Dashboard({ estadisticas }: PageProps) {
  return (
    <>
      <Head title="Dashboard" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido al panel de control del sistema de punto de venta.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas del día
                </CardTitle>
                <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(estadisticas.ventasDelDia)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {estadisticas.porcentajeCambioVentas > 0 ? (
                    <TrendingUpIcon className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDownIcon className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  <span className={estadisticas.porcentajeCambioVentas > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(estadisticas.porcentajeCambioVentas).toFixed(1)}%
                  </span>
                  <span className="ml-1">desde ayer</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Productos vendidos
                </CardTitle>
                <ShoppingBagIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.productosVendidosHoy}</div>
                <p className="text-xs text-muted-foreground">
                  Vendidos hoy
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventario bajo
                </CardTitle>
                <PackageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.productosStockBajo}</div>
                <p className="text-xs text-muted-foreground">
                  Productos con stock bajo
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuarios activos
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.usuariosActivos}</div>
                <p className="text-xs text-muted-foreground">
                  En las últimas 24 horas
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ventas recientes</CardTitle>
                <CardDescription>
                  Las últimas ventas realizadas en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estadisticas.ventasRecientes.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No hay ventas registradas
                  </div>
                ) : (
                  <div className="space-y-8">
                    {estadisticas.ventasRecientes.map((venta) => (
                      <div key={venta.id} className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {venta.numero_orden} - {venta.mesa}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {venta.usuario} - {venta.fecha}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          {formatCurrency(venta.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Productos más vendidos</CardTitle>
                <CardDescription>
                  Top productos por cantidad vendida
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estadisticas.productosMasVendidos.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No hay datos disponibles
                  </div>
                ) : (
                  <div className="space-y-8">
                    {estadisticas.productosMasVendidos.map((producto) => (
                      <div key={producto.id} className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {producto.nombre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {producto.total_vendido} unidades vendidas
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          {formatCurrency(producto.total_ventas)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
