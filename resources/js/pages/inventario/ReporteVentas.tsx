import React from 'react';

import { Head } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
}

interface InventarioCaja {
  id: number;
  producto: Producto;
  cantidad_inicial: number;
  cantidad_actual: number;
  cantidad_vendida: number;
  fecha_inicio: string;
  fecha_cierre: string;
}

interface Props {
  ventasPorCaja: Record<string, InventarioCaja[]>;
}

export default function ReporteVentas({ ventasPorCaja }: Props) {
  const calcularTotalVentas = (inventarios: InventarioCaja[]) => {
    return inventarios.reduce((total, inv) => {
      return total + (inv.cantidad_vendida * inv.producto.precio);
    }, 0);
  };

  return (
    <>
      <Head title="Reporte de Ventas por Caja" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reporte de Ventas por Caja</h1>
            <p className="text-muted-foreground">
              Resumen de ventas por caja y totales generales.
            </p>
          </div>

          {[1, 2, 3].map((numeroCaja) => (
            <Card key={numeroCaja}>
              <CardHeader>
                <CardTitle>
                  Caja #{numeroCaja} {numeroCaja === 1 && '(Principal)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!ventasPorCaja[numeroCaja] || ventasPorCaja[numeroCaja].length === 0 ? (
                  <p className="text-muted-foreground">No hay registros de ventas para esta caja</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {ventasPorCaja[numeroCaja].map((inventario) => (
                        <div key={inventario.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{inventario.producto.nombre}</h3>
                            <p className="text-sm text-muted-foreground">
                              Período: {new Date(inventario.fecha_inicio).toLocaleDateString()} - {new Date(inventario.fecha_cierre).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-sm font-medium">Inicial</p>
                              <p>{inventario.cantidad_inicial}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Vendido</p>
                              <p>{inventario.cantidad_vendida}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total Vendido</p>
                              <p className="font-medium text-green-600">
                                {formatCurrency(inventario.cantidad_vendida * inventario.producto.precio)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-lg font-medium">
                        Total Ventas Caja #{numeroCaja}:{' '}
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(calcularTotalVentas(ventasPorCaja[numeroCaja]))}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Total General de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  Object.values(ventasPorCaja).reduce((total, inventarios) => {
                    return total + calcularTotalVentas(inventarios);
                  }, 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
