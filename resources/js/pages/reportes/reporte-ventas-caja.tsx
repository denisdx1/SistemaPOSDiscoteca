import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileTextIcon, 
  DownloadIcon, 
  BarChart2Icon,
  SearchIcon 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';
import axios from 'axios';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Caja {
  id: number;
  numero_caja: number;
}

interface CategoriaReporte {
  id: number;
  nombre: string;
}

interface ProductoVendido {
  nombre: string;
  categoria_id: number;
  precio_normal: number;
  cantidad_vendida: number;
  total_vendido: number;
  cantidad_promocion: number;
  total_promocion: number; 
  cantidad_individual: number;
  total_individual: number;
}

interface CajaReporte {
  numero_caja: number;
  productos: ProductoVendido[];
  total_productos: number;
  total_vendido: number;
  total_promociones: number;
  total_individual: number;
}

interface ReporteVentasCajaProps {
  cajas: Caja[];
}

export default function ReporteVentasCaja({ cajas }: ReporteVentasCajaProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cajaId, setCajaId] = useState<string>('todas');
  const [fechaDesde, setFechaDesde] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaDesde, setHoraDesde] = useState<string>("22:00"); // 10:00 PM por defecto
  const [horaHasta, setHoraHasta] = useState<string>("06:00"); // 6:00 AM por defecto
  
  // Datos del reporte
  const [reporteData, setReporteData] = useState<{
    cajas: CajaReporte[],
    categorias: CategoriaReporte[],
    periodo: { desde: string, hasta: string }
  } | null>(null);

  const generarReporte = async () => {
    try {
      setIsLoading(true);
      
      const params: Record<string, string> = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        hora_desde: horaDesde,
        hora_hasta: horaHasta
      };
      
      // Agregar caja_id solo si se ha seleccionado una específica
      if (cajaId && cajaId !== 'todas') {
        params.caja_id = cajaId;
      }
      
      const response = await axios.get('/caja/reportes/ventas-caja/generar', { params });
      setReporteData(response.data);
      
      toast({
        title: "Reporte generado",
        description: "El reporte de ventas por caja ha sido generado exitosamente",
      });
    } catch (error: any) {
      console.error("Error al generar el reporte:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo generar el reporte. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Construir datos para el gráfico
  const chartData = reporteData ? {
    labels: reporteData.cajas.map(caja => `Caja #${caja.numero_caja}`),
    datasets: [
      {
        label: 'Tragos y cocteles vendidos',
        data: reporteData.cajas.map(caja => caja.total_productos),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tragos y cocteles vendidos por caja',
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
      <Head title="Reporte de Ventas por Caja" />
      <DashboardLayout>
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold mb-4">Reporte de Ventas de Tragos y Cocteles por Caja</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                <span>Filtros del Reporte</span>
              </CardTitle>
              <CardDescription>
                Seleccione los filtros para generar el reporte
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="caja">Caja</Label>
                  <Select 
                    value={cajaId} 
                    onValueChange={setCajaId}
                  >
                    <SelectTrigger id="caja">
                      <SelectValue placeholder="Todas las cajas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las cajas</SelectItem>
                      {cajas.map((caja) => (
                        <SelectItem key={caja.id} value={caja.id.toString()}>
                          Caja #{caja.numero_caja}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha_desde">Fecha Desde</Label>
                  <Input
                    id="fecha_desde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha_hasta">Fecha Hasta</Label>
                  <Input
                    id="fecha_hasta"
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_desde">Hora Desde</Label>
                  <Input
                    id="hora_desde"
                    type="time"
                    value={horaDesde}
                    onChange={(e) => setHoraDesde(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Por defecto: 10:00 PM</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hora_hasta">Hora Hasta</Label>
                  <Input
                    id="hora_hasta"
                    type="time"
                    value={horaHasta}
                    onChange={(e) => setHoraHasta(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Por defecto: 6:00 AM</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={generarReporte} 
                  disabled={isLoading || !fechaDesde || !fechaHasta}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Generando...' : 'Generar Reporte'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {reporteData && (
            <>
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Reporte</CardTitle>
                    <CardDescription>
                      Periodo: {new Date(reporteData.periodo.desde).toLocaleString()} al {new Date(reporteData.periodo.hasta).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {chartData && <Bar options={chartOptions} data={chartData} />}
                  </CardContent>
                </Card>
              </div>
              
              {reporteData.cajas.map((caja) => (
                <Card key={caja.numero_caja} className="mb-6">
                  <CardHeader>
                    <CardTitle>Caja #{caja.numero_caja}</CardTitle>
                    <CardDescription>
                      Total de tragos y cócteles vendidos: {caja.total_productos} - Importe total: {formatCurrency(caja.total_vendido)}
                      <div className="mt-1 text-sm">
                        <span className="mr-4">En promoción: {caja.total_promociones}</span>
                        <span>Individuales: {caja.total_individual}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Precio</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center" colSpan={2}>En Promoción (10 soles)</TableHead>
                          <TableHead className="text-center" colSpan={2}>Individual (Precio normal)</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead className="text-center">Normal</TableHead>
                          <TableHead className="text-center">Cant.</TableHead>
                          <TableHead className="text-center">Cant.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-center">Cant.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {caja.productos.map((producto, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{producto.nombre}</TableCell>
                            <TableCell className="text-center">{formatCurrency(producto.precio_normal)}</TableCell>
                            <TableCell className="text-center">{producto.cantidad_vendida}</TableCell>
                            <TableCell className="text-center">{producto.cantidad_promocion}</TableCell>
                            <TableCell className="text-right">{formatCurrency(producto.total_promocion)}</TableCell>
                            <TableCell className="text-center">{producto.cantidad_individual}</TableCell>
                            <TableCell className="text-right">{formatCurrency(producto.total_individual)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={2} className="font-semibold">Totales</TableCell>
                          <TableCell className="text-center font-semibold">{caja.total_productos}</TableCell>
                          <TableCell className="text-center font-semibold">{caja.total_promociones}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(caja.productos.reduce((sum, p) => sum + (Number(p.total_promocion) || 0), 0))}</TableCell>
                          <TableCell className="text-center font-semibold">{caja.total_individual}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(caja.productos.reduce((sum, p) => sum + (Number(p.total_individual) || 0), 0))}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
} 