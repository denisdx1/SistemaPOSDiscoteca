import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Usuario {
  id: number;
  name: string;
}

interface Caja {
  id: number;
  numero_caja: number;
  usuario: Usuario;
  monto_inicial: number;
  monto_final: number;
  diferencia: number;
  estado: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  total_ingresos: number;
  total_egresos: number;
}

interface Filtros {
  numero_caja?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
}

interface OpcionesCajas {
  [key: string]: string;
}

interface HistorialCajaProps {
  cajas: {
    data: Caja[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filtros: Filtros;
  opciones_cajas: OpcionesCajas;
}

export default function HistorialCaja({ cajas, filtros, opciones_cajas }: HistorialCajaProps) {
  const [filtroActual, setFiltroActual] = useState<Filtros>({
    ...filtros,
    numero_caja: filtros.numero_caja || 'all',
    estado: filtros.estado || 'all'
  });

  const aplicarFiltros = () => {
    const filtrosParaEnviar = {
      ...filtroActual,
      numero_caja: filtroActual.numero_caja === 'all' ? '' : filtroActual.numero_caja,
      estado: filtroActual.estado === 'all' ? '' : filtroActual.estado,
    };
    router.get('/caja/historial', filtrosParaEnviar);
  };

  type TotalType = 'ingresos' | 'egresos' | 'diferencias';

  const calcularTotal = (tipo: TotalType) => {
    return cajas.data.reduce((sum, caja) => {
      switch (tipo) {
        case 'ingresos':
          return sum + (parseFloat(caja.total_ingresos?.toString() || '0') || 0);
        case 'egresos':
          return sum + (parseFloat(caja.total_egresos?.toString() || '0') || 0);
        case 'diferencias':
          return sum + (parseFloat(caja.diferencia?.toString() || '0') || 0);
        default:
          return sum;
      }
    }, 0);
  };

  return (
    <>
      <Head title="Historial de Cajas" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Cajas</h1>
            <p className="text-muted-foreground">
              Consulta el historial de aperturas y cierres de cajas registradoras.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Filtra el historial por diferentes criterios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_caja">Número de Caja</Label>
                  <Select
                    value={filtroActual.numero_caja || ''}
                    onValueChange={(value) => {
                      setFiltroActual((prev) => ({ ...prev, numero_caja: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las cajas" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(opciones_cajas).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {value === 'all' ? 'Todas' : `Caja #${label}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={filtroActual.estado || 'all'}
                    onValueChange={(value) => {
                      setFiltroActual((prev) => ({ ...prev, estado: value === 'all' ? '' : value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="abierta">Abierta</SelectItem>
                      <SelectItem value="cerrada">Cerrada</SelectItem>
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
            <CardHeader>
              <CardTitle>Resumen General</CardTitle>
              <CardDescription>
                Totales y diferencias acumuladas del período.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calcularTotal('ingresos'))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Egresos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(calcularTotal('egresos'))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Diferencias</p>
                  <p className={`text-2xl font-bold ${
                    calcularTotal('diferencias') >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(calcularTotal('diferencias'))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Cajas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caja #</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Monto Inicial</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Egresos</TableHead>
                    <TableHead>Monto Final</TableHead>
                    <TableHead>Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cajas.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        No hay registros de caja disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    cajas.data.map((caja) => (
                      <TableRow key={caja.id}>
                        <TableCell>#{caja.numero_caja}</TableCell>
                        <TableCell>{caja.usuario.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>Apertura: {new Date(caja.fecha_apertura).toLocaleString()}</p>
                            {caja.fecha_cierre && (
                              <p className="text-muted-foreground">
                                Cierre: {new Date(caja.fecha_cierre).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`capitalize ${
                            caja.estado === 'abierta' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {caja.estado}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(caja.monto_inicial)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(caja.total_ingresos)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(caja.total_egresos)}
                        </TableCell>
                        <TableCell>
                          {caja.monto_final ? formatCurrency(caja.monto_final) : '-'}
                        </TableCell>
                        <TableCell>
                          {caja.diferencia !== null ? (
                            <span className={caja.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(caja.diferencia)}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {cajas.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  {cajas.links.map((link, i) => (
                    <Button
                      key={i}
                      variant={link.active ? "default" : "outline"}
                      onClick={() => link.url && router.get(link.url)}
                      disabled={!link.url}
                    >
                      <span dangerouslySetInnerHTML={{ __html: link.label }} />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
