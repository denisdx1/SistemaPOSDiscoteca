import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { MonedaSelector } from '@/components/ui/moneda-selector';
import { Moneda } from '@/types/global';
import { loadCurrentCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  monedas: Moneda[];
  monedaActual: string;
}

export default function ConfiguracionMonedas({ monedas, monedaActual }: Props) {
  const [editando, setEditando] = useState<Record<number, boolean>>({});
  const [tasasCambio, setTasasCambio] = useState<Record<number, number>>(
    Object.fromEntries(monedas.map(m => [m.id, m.tasa_cambio]))
  );
  const [cargando, setCargando] = useState<Record<number, boolean>>({});

  const handleEditarTasa = (id: number) => {
    setEditando(prev => ({ ...prev, [id]: true }));
  };

  const handleCancelarEdicion = (id: number) => {
    setEditando(prev => ({ ...prev, [id]: false }));
    // Restaurar valor original
    const moneda = monedas.find(m => m.id === id);
    if (moneda) {
      setTasasCambio(prev => ({ ...prev, [id]: moneda.tasa_cambio }));
    }
  };

  const handleGuardarTasa = async (moneda: Moneda) => {
    setCargando(prev => ({ ...prev, [moneda.id]: true }));
    try {
      const response = await axios.put(route('monedas.update', moneda.id), {
        tasa_cambio: tasasCambio[moneda.id]
      });
      
      toast({
        title: "Tasa de cambio actualizada",
        description: response.data.message,
      });
      
      setEditando(prev => ({ ...prev, [moneda.id]: false }));
      
      // Actualizar los datos de moneda localmente
      const index = monedas.findIndex(m => m.id === moneda.id);
      if (index !== -1) {
        monedas[index].tasa_cambio = tasasCambio[moneda.id];
      }
      
      // Recargar la moneda actual en la caché global
      await loadCurrentCurrency();
    } catch (error) {
      console.error('Error al actualizar tasa de cambio:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tasa de cambio",
        variant: "destructive"
      });
    } finally {
      setCargando(prev => ({ ...prev, [moneda.id]: false }));
    }
  };

  const handleTasaChange = (id: number, valor: string) => {
    const valorNumerico = parseFloat(valor);
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
      setTasasCambio(prev => ({ ...prev, [id]: valorNumerico }));
    }
  };

  const handleCambiarMoneda = async (codigo: string) => {
    try {
      const response = await axios.post<{ message: string, moneda: Moneda }>(
        route('monedas.cambiar'),
        { codigo }
      );
      
      toast({
        title: "Moneda actualizada",
        description: response.data.message,
      });
      
      // Actualizar la moneda actual en la caché global
      await loadCurrentCurrency();
      
      // Recargar la página para aplicar los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error al cambiar moneda:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la moneda",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Head title="Configuración de Monedas" />
      <DashboardLayout>
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Configuración de Monedas</h1>
            <div className="ml-auto">
              <Select value={monedaActual} onValueChange={handleCambiarMoneda}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {monedas && monedas.length > 0 ? (
                    monedas.map((moneda) => (
                      <SelectItem 
                        key={moneda.codigo} 
                        value={moneda.codigo}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">{moneda.simbolo}</span>
                          <span>{moneda.codigo} - {moneda.nombre}</span>
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="PEN" disabled>
                      <span className="text-muted-foreground">No hay monedas disponibles</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Moneda Actual</CardTitle>
              <CardDescription>
                La moneda predeterminada utilizada en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium">Moneda Base:</p>
                  <p className="text-lg font-bold">
                    {monedas.find(m => m.codigo === monedaActual)?.nombre} ({monedaActual})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Símbolo:</p>
                  <p className="text-lg font-bold">
                    {monedas.find(m => m.codigo === monedaActual)?.simbolo}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Monedas</CardTitle>
              <CardDescription>
                Configure las tasas de cambio para las diferentes monedas disponibles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead>Tasa de Cambio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monedas.map((moneda) => (
                    <TableRow key={moneda.id}>
                      <TableCell className="font-medium">{moneda.nombre}</TableCell>
                      <TableCell>{moneda.codigo}</TableCell>
                      <TableCell>{moneda.simbolo}</TableCell>
                      <TableCell>
                        {editando[moneda.id] ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              step="0.000001"
                              min="0.000001"
                              value={tasasCambio[moneda.id]}
                              onChange={(e) => handleTasaChange(moneda.id, e.target.value)}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <span>{moneda.tasa_cambio}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={moneda.activo ? "default" : "destructive"}>
                          {moneda.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {moneda.es_predeterminada ? (
                          <Badge variant="outline">Predeterminada</Badge>
                        ) : editando[moneda.id] ? (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleGuardarTasa(moneda)}
                              disabled={cargando[moneda.id]}
                            >
                              Guardar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleCancelarEdicion(moneda.id)}
                              disabled={cargando[moneda.id]}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditarTasa(moneda.id)}
                          >
                            Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
} 