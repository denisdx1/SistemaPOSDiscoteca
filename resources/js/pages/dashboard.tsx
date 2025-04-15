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
  TrendingDownIcon,
  BarChart3Icon,
  PieChartIcon,
  FileSpreadsheetIcon
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

// Registrar los componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

interface PageProps {
  estadisticas: {
    ventasDelDia: number;
    porcentajeCambioVentas: number;
    productosVendidosHoy: number;
    productosStockBajo: number;
    usuariosActivos: number;
    listaProductosStockBajo: Array<{
      id: number;
      nombre: string;
      codigo: string;
      stock_actual: number;
      stock_minimo: number;
      categoria: string;
    }>;
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
  // Preparar datos para el gráfico de productos más vendidos
  const productosChartData = {
    labels: estadisticas.productosMasVendidos.map(p => p.nombre),
    datasets: [
      {
        label: 'Unidades vendidas',
        data: estadisticas.productosMasVendidos.map(p => p.total_vendido),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Opciones para el gráfico de productos
  const productosChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Productos más vendidos',
      },
    },
  };

  // Datos para gráfico de ventas vs inventario
  const comparativaData = {
    labels: ['Productos'],
    datasets: [
      {
        label: 'Vendidos hoy',
        data: [estadisticas.productosVendidosHoy],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Stock bajo',
        data: [estadisticas.productosStockBajo],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  };

  const comparativaOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Ventas vs Inventario',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

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
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Visualización de ventas</CardTitle>
                <CardDescription>
                  Gráfico de barras de los productos más vendidos
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Bar 
                  options={productosChartOptions} 
                  data={productosChartData} 
                />
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribución de ventas</CardTitle>
                <CardDescription>
                  Distribución porcentual de productos vendidos
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Pie 
                  data={productosChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    }
                  }} 
                />
              </CardContent>
            </Card>

            <Card >
              <CardHeader>
                <CardTitle>Ventas vs Inventario</CardTitle>
                <CardDescription>
                  Comparativa entre productos vendidos y stock bajo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <Bar 
                  options={comparativaOptions} 
                  data={comparativaData} 
                />
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Productos con Stock Bajo</CardTitle>
                <CardDescription>
                  Estos productos necesitan reposición
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estadisticas.listaProductosStockBajo.length > 0 ? (
                  <div className="space-y-4">
                    {estadisticas.listaProductosStockBajo.map((producto) => (
                      <div key={producto.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Código: {producto.codigo}</span>
                            <span>•</span>
                            <span>{producto.categoria}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">
                            Stock: {producto.stock_actual} / {producto.stock_minimo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Se necesitan {Math.max(0, producto.stock_minimo - producto.stock_actual)} unidades
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-2 text-center">
                      <a href="/inventario/stock" className="text-sm text-primary hover:underline">
                        Ver todos los productos con stock bajo →
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay productos con stock bajo en este momento
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          
          
        </div>
      </DashboardLayout>
    </>
  );
}
