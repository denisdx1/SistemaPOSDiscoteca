import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTextIcon, FileIcon, DownloadIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface ReporteStockProps {
  categoriasDisponibles: { id: number; nombre: string }[];
}

export default function ReporteStock({ categoriasDisponibles }: ReporteStockProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string>('todas');
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  const generarReporte = async () => {
    try {
      setIsLoading(true);
      
      // Configurar la solicitud para descargar un archivo
      const response = await axios.post(
        '/inventario/reportes/stock/diario',
        {
          categoria_id: categoriaId === 'todas' ? null : categoriaId,
          incluir_inactivos: incluirInactivos,
        },
        {
          responseType: 'blob', // Importante para manejar la descarga de archivos
        }
      );
      
      // Crear un objeto URL para el archivo descargado
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determinar el nombre del archivo
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `reporte_stock_${date}.pdf`);
      
      // Simular clic para iniciar la descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Reporte generado",
        description: "El reporte de stock ha sido generado en formato PDF",
      });
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Head title="Reporte de Stock" />
      
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-4">Reporte de Stock Diario</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              <span>Generar Reporte de Stock</span>
            </CardTitle>
            <CardDescription>
              Genera un reporte detallado del stock actual de tus productos
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoria">Filtrar por Categoría (Opcional)</Label>
                  <Select 
                    value={categoriaId} 
                    onValueChange={(value) => setCategoriaId(value)}
                  >
                    <SelectTrigger id="categoria" className="mt-1">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las categorías</SelectItem>
                      {categoriasDisponibles.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="incluir-inactivos" 
                    checked={incluirInactivos}
                    onCheckedChange={(checked) => setIncluirInactivos(checked === true)}
                  />
                  <Label htmlFor="incluir-inactivos" className="text-sm font-normal">
                    Incluir productos inactivos
                  </Label>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">El reporte incluirá:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Código y nombre de cada producto</li>
                  <li>Categoría a la que pertenece</li>
                  <li>Precio y costo actual</li>
                  <li>Stock disponible</li>
                  <li>Stock mínimo configurado</li>
                  <li>Estado del stock (Normal, Bajo, Crítico)</li>
                </ul>
                
                <div className="mt-6">
                  <Button 
                    onClick={generarReporte} 
                    disabled={isLoading}
                    className="w-full flex items-center gap-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    {isLoading ? 'Generando...' : 'Generar y Descargar Reporte'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 