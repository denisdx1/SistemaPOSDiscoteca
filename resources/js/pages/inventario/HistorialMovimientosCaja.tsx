
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';

interface Producto {
  id: number;
  nombre: string;
}

interface InventarioCaja {
  id: number;
  producto: Producto;
  numero_caja: number;
  cantidad_inicial: number;
  cantidad_actual: number;
  cantidad_vendida: number;
  fecha_inicio: string;
  fecha_cierre: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  movimientos: InventarioCaja[];
  filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
    numero_caja?: string;
  };
}

export default function HistorialMovimientosCaja({ movimientos, filtros }: Props) {
  const [filtroActual, setFiltroActual] = useState(filtros);

  const aplicarFiltros = () => {
    router.get('/inventario/historial-movimientos', filtroActual);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString();
  };

  const obtenerEstado = (movimiento: InventarioCaja) => {
    if (movimiento.fecha_cierre) return 'Cerrado';
    return movimiento.activo ? 'Activo' : 'Inactivo';
  };

  return (
    <>
      <Head title="Historial de Movimientos por Caja" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Movimientos por Caja</h1>
            <p className="text-muted-foreground">
              Consulta todos los movimientos de inventario realizados en las cajas
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_desde">Desde</Label>
                  <Input
                    type="date"
                    id="fecha_desde"
                    value={filtroActual.fecha_desde || ''}
                    onChange={(e) =>
                      setFiltroActual((prev) => ({ ...prev, fecha_desde: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_hasta">Hasta</Label>
                  <Input
                    type="date"
                    id="fecha_hasta"
                    value={filtroActual.fecha_hasta || ''}
                    onChange={(e) =>
                      setFiltroActual((prev) => ({ ...prev, fecha_hasta: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_caja">Número de Caja</Label>
                  <Select
                    value={filtroActual.numero_caja || 'all'}
                    onValueChange={(value) =>
                      setFiltroActual((prev) => ({ ...prev, numero_caja: value === 'all' ? '' : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las cajas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="1">Caja #1</SelectItem>
                      <SelectItem value="2">Caja #2</SelectItem>
                      <SelectItem value="3">Caja #3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={aplicarFiltros}>Aplicar Filtros</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Caja</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cant. Inicial</TableHead>
                    <TableHead>Cant. Actual</TableHead>
                    <TableHead>Cant. Vendida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell>{formatearFecha(movimiento.fecha_inicio)}</TableCell>
                        <TableCell>#{movimiento.numero_caja}</TableCell>
                        <TableCell>{movimiento.producto.nombre}</TableCell>
                        <TableCell>{movimiento.cantidad_inicial}</TableCell>
                        <TableCell>{movimiento.cantidad_actual}</TableCell>
                        <TableCell>{movimiento.cantidad_vendida}</TableCell>
                        <TableCell>{obtenerEstado(movimiento)}</TableCell>
                        <TableCell>{formatearFecha(movimiento.updated_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
