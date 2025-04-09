import React from 'react';
import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Movimiento {
  id: number;
  tipo_movimiento: 'ingreso' | 'egreso';
  monto: number;
  metodo_pago: string;
  concepto: string;
  fecha_movimiento: string;
}

interface Usuario {
  id: number;
  name: string;
}

interface EstadoCaja {
  id: number;
  monto_inicial: number;
  fecha_apertura: string;
  usuario: Usuario;
  movimientos: Movimiento[];
}

interface Caja {
  numero: number;
  estado: EstadoCaja | null;
}

interface CajaAsignada {
  id: number;
  numero_caja: number;
}

interface PageProps {
  cajas: Caja[];
  isAdmin: boolean;
  cajaAsignada: CajaAsignada | null;
  cajaActualInicial: number;
  userRole: string;
}

export default function OperacionesCaja({ cajas, isAdmin, cajaAsignada, cajaActualInicial, userRole }: PageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cajaActual, setCajaActual] = useState<number>(cajaActualInicial || 1);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const movimientosPorPagina = 5;

  // Estados para el formulario de apertura
  const [formApertura, setFormApertura] = useState({
    numero_caja: cajaActualInicial?.toString() || '1',
    monto_inicial: '',
    observaciones: ''
  });

  // Estados para el formulario de cierre
  const [formCierre, setFormCierre] = useState({
    caja_id: '',
    monto_final: '',
    observaciones: ''
  });

  // Estado para controlar la apertura múltiple de cajas
  const [aperturaMultiple, setAperturaMultiple] = useState({
    monto_inicial: '',
    observaciones: ''
  });
  const [loadingMultiple, setLoadingMultiple] = useState(false);

  // Estados para el formulario de movimientos
  const [formMovimiento, setFormMovimiento] = useState({
    caja_id: '',
    tipo_movimiento: 'ingreso',
    monto: '',
    metodo_pago: 'efectivo',
    concepto: '',
    referencia: ''
  });

  // Función para actualizar la caja actual y el formulario correspondiente
  const actualizarCajaActual = (numeroCaja: number) => {
    setCajaActual(numeroCaja);
    // Actualizar el número de caja en el formulario de apertura
    setFormApertura(prev => ({ ...prev, numero_caja: numeroCaja.toString() }));
  };

  useEffect(() => {
    const cajaActiva = cajas.find(c => c.numero === cajaActual)?.estado;
    if (cajaActiva) {
      setFormCierre(prev => ({ ...prev, caja_id: cajaActiva.id.toString() }));
      setFormMovimiento(prev => ({ ...prev, caja_id: cajaActiva.id.toString() }));
    }
  }, [cajaActual, cajas]);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Depuración detallada
      console.log('Estado del formulario:', formApertura);
      console.log('Caja actual seleccionada:', cajaActual);
      console.log('Abriendo caja número:', formApertura.numero_caja);
      
      const response = await axios.post('/caja/abrir', formApertura);

      if (response.data.success) {
        toast({
          title: "Éxito",
          description: response.data.message,
        });
        // Recargar la página para mostrar la caja abierta
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error al abrir caja:', error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al abrir la caja",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir las 3 cajas simultáneamente
  const handleAbrirTodasLasCajas = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingMultiple(true);

    try {
      // Obtener las cajas que no están abiertas
      const cajasNoAbiertas = cajas.filter(caja => !caja.estado).map(caja => caja.numero);
      
      if (cajasNoAbiertas.length === 0) {
        toast({
          title: "Información",
          description: "Todas las cajas ya están abiertas.",
        });
        setLoadingMultiple(false);
        return;
      }

      // Abrir cada caja no abierta en secuencia
      for (const numeroCaja of cajasNoAbiertas) {
        const cajaData = {
          numero_caja: numeroCaja.toString(),
          monto_inicial: aperturaMultiple.monto_inicial,
          observaciones: aperturaMultiple.observaciones
        };

        const response = await axios.post('/caja/abrir', cajaData);
        
        if (response.data.success) {
          toast({
            title: "Éxito",
            description: response.data.message,
          });
        }
      }
      
      // Recargar la página para mostrar las cajas abiertas
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al abrir las cajas",
        variant: "destructive",
      });
    } finally {
      setLoadingMultiple(false);
    }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/caja/cerrar', formCierre);

      toast({
        title: "Éxito",
        description: response.data.message,
      });

      // Recargar la página para mostrar la caja cerrada
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || 'Error al cerrar la caja',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Asegurarse de que el monto sea un número válido
      const montoNumerico = parseFloat(formMovimiento.monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: 'El monto debe ser un número mayor que cero',
        });
        setLoading(false);
        return;
      }

      // Crear una copia del formulario con el monto como número
      const datosMovimiento = {
        ...formMovimiento,
        monto: montoNumerico
      };

      const response = await axios.post('/caja/movimiento', datosMovimiento);

      toast({
        title: "Éxito",
        description: response.data.message,
      });

      // Recargar la página para mostrar el nuevo movimiento
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || 'Error al registrar el movimiento',
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularSaldo = (caja: EstadoCaja) => {
    // Asegurarse de que monto_inicial sea un número
    const montoInicial = parseFloat(caja.monto_inicial.toString()) || 0;
    
    // Calcular ingresos asegurándose de que cada monto sea un número
    const ingresos = caja.movimientos
      .filter(m => m.tipo_movimiento === 'ingreso')
      .reduce((sum, m) => {
        const monto = parseFloat(m.monto.toString()) || 0;
        return sum + monto;
      }, 0);

    // Calcular egresos asegurándose de que cada monto sea un número
    const egresos = caja.movimientos
      .filter(m => m.tipo_movimiento === 'egreso')
      .reduce((sum, m) => {
        const monto = parseFloat(m.monto.toString()) || 0;
        return sum + monto;
      }, 0);

    // Calcular el saldo final
    const saldoFinal = montoInicial + ingresos - egresos;
    
    // Verificar que el resultado no sea NaN
    return isNaN(saldoFinal) ? 0 : saldoFinal;
  };

  // Función para paginar los movimientos
  const paginarMovimientos = (movimientos: Movimiento[], pagina: number, porPagina: number) => {
    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;
    return movimientos.slice(inicio, fin);
  };
  
  // Resetear la página actual al cambiar de caja
  useEffect(() => {
    setPaginaActual(1);
  }, [cajaActual]);

  return (
    <>
      <Head title="Operaciones de Caja" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Operaciones de Caja</h1>
            <p className="text-muted-foreground">
              Gestiona las operaciones de las cajas registradoras.
            </p>
          </div>

          {/* Formulario para abrir todas las cajas - solo visible para administradores */}
          {isAdmin && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Abrir todas las cajas</CardTitle>
                <CardDescription>
                  Abre todas las cajas cerradas con el mismo monto inicial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAbrirTodasLasCajas} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto_inicial_multiple">Monto Inicial</Label>
                    <Input
                      id="monto_inicial_multiple"
                      type="number"
                      step="0.01"
                      required
                      value={aperturaMultiple.monto_inicial}
                      onChange={(e) =>
                        setAperturaMultiple({ ...aperturaMultiple, monto_inicial: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones_multiple">Observaciones</Label>
                    <Textarea
                      id="observaciones_multiple"
                      value={aperturaMultiple.observaciones}
                      onChange={(e) =>
                        setAperturaMultiple({ ...aperturaMultiple, observaciones: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" disabled={loadingMultiple} className="w-full">
                    {loadingMultiple ? 'Abriendo cajas...' : 'Abrir todas las cajas'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="1" value={cajaActual.toString()} onValueChange={(value) => actualizarCajaActual(parseInt(value))} className="space-y-6">
            <TabsList>
              {cajas.map((caja) => (
                <TabsTrigger
                  key={caja.numero}
                  value={caja.numero.toString()}
                >
                  Caja #{caja.numero}
                </TabsTrigger>
              ))}
            </TabsList>

            {cajas.map((caja) => (
              <TabsContent key={caja.numero} value={caja.numero.toString()}>
                {!caja.estado ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Abrir Caja #{caja.numero}</CardTitle>
                      <CardDescription>
                        Registra la apertura de la caja con el monto inicial.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAbrirCaja} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="monto_inicial">Monto Inicial</Label>
                          <Input
                            id="monto_inicial"
                            type="number"
                            step="0.01"
                            required
                            value={formApertura.monto_inicial}
                            onChange={(e) =>
                              setFormApertura({ ...formApertura, monto_inicial: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="observaciones">Observaciones</Label>
                          <Textarea
                            id="observaciones"
                            value={formApertura.observaciones}
                            onChange={(e) =>
                              setFormApertura({ ...formApertura, observaciones: e.target.value })
                            }
                          />
                        </div>

                        <Button type="submit" disabled={loading}>
                          {loading ? 'Abriendo...' : 'Abrir Caja'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                ):(
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Estado de Caja #{caja.numero}</CardTitle>
                          <CardDescription>
                            Abierta por {caja.estado.usuario.name} el {caja.estado.fecha_apertura}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Monto Inicial</p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(caja.estado.monto_inicial)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Saldo Actual</p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(calcularSaldo(caja.estado))}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Registrar Movimiento</CardTitle>
                          <CardDescription>
                            Registra un ingreso o egreso de dinero en la caja.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
                            <input
                              type="hidden"
                              name="caja_id"
                              value={caja.estado.id}
                              onChange={(e) =>
                                setFormMovimiento({ ...formMovimiento, caja_id: e.target.value })
                              }
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="tipo_movimiento">Tipo de Movimiento</Label>
                                <Select
                                  value={formMovimiento.tipo_movimiento}
                                  onValueChange={(value) =>
                                    setFormMovimiento({ ...formMovimiento, tipo_movimiento: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ingreso">Ingreso</SelectItem>
                                    <SelectItem value="egreso">Egreso</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="monto">Monto</Label>
                                <Input
                                  id="monto"
                                  type="number"
                                  step="0.01"
                                  required
                                  value={formMovimiento.monto}
                                  onChange={(e) =>
                                    setFormMovimiento({ ...formMovimiento, monto: e.target.value })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="metodo_pago">Método de Pago</Label>
                              <Select
                                value={formMovimiento.metodo_pago}
                                onValueChange={(value) =>
                                  setFormMovimiento({ ...formMovimiento, metodo_pago: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona el método" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="efectivo">Efectivo</SelectItem>
                                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                  <SelectItem value="transferencia">Transferencia</SelectItem>
                                  <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="concepto">Concepto</Label>
                              <Input
                                id="concepto"
                                required
                                value={formMovimiento.concepto}
                                onChange={(e) =>
                                  setFormMovimiento({ ...formMovimiento, concepto: e.target.value })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="referencia">Referencia (opcional)</Label>
                              <Input
                                id="referencia"
                                value={formMovimiento.referencia}
                                onChange={(e) =>
                                  setFormMovimiento({ ...formMovimiento, referencia: e.target.value })
                                }
                              />
                            </div>

                            <Button type="submit" disabled={loading}>
                              {loading ? 'Registrando...' : 'Registrar Movimiento'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Movimientos Recientes</CardTitle>
                          <CardDescription>
                            Últimos movimientos registrados en la caja.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Concepto</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {caja.estado.movimientos.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center">
                                    No hay movimientos registrados
                                  </TableCell>
                                </TableRow>
                              ) : (
                                paginarMovimientos(
                                  caja.estado.movimientos, 
                                  paginaActual, 
                                  movimientosPorPagina
                                ).map((movimiento) => (
                                  <TableRow key={movimiento.id}>
                                    <TableCell>{movimiento.fecha_movimiento}</TableCell>
                                    <TableCell className="capitalize">{movimiento.tipo_movimiento}</TableCell>
                                    <TableCell>{movimiento.concepto}</TableCell>
                                    <TableCell className="capitalize">{movimiento.metodo_pago}</TableCell>
                                    <TableCell className="text-right">
                                      <span className={movimiento.tipo_movimiento === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                        {movimiento.tipo_movimiento === 'ingreso' ? '+' : '-'}
                                        {formatCurrency(movimiento.monto)}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                          
                          {/* Controles de paginación */}
                          {caja.estado && caja.estado.movimientos.length > movimientosPorPagina && (
                            <div className="flex items-center justify-center space-x-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                disabled={paginaActual === 1}
                              >
                                Anterior
                              </Button>
                              
                              <div className="text-sm">
                                Página {paginaActual} de {caja.estado && Math.ceil(caja.estado.movimientos.length / movimientosPorPagina)}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (caja.estado) {
                                    setPaginaActual(prev => 
                                      Math.min(prev + 1, Math.ceil(caja.estado!.movimientos.length / movimientosPorPagina))
                                    );
                                  }
                                }}
                                disabled={!caja.estado || paginaActual >= Math.ceil(caja.estado.movimientos.length / movimientosPorPagina)}
                              >
                                Siguiente
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Cerrar Caja</CardTitle>
                          <CardDescription>
                            Realiza el cierre de la caja registrando el monto final.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleCerrarCaja} className="space-y-4">
                            <input
                              type="hidden"
                              name="caja_id"
                              value={caja.estado.id}
                              onChange={(e) =>
                                setFormCierre({ ...formCierre, caja_id: e.target.value })
                              }
                            />

                            <div className="space-y-2">
                              <Label htmlFor="monto_final">Monto Final</Label>
                              <Input
                                id="monto_final"
                                type="number"
                                step="0.01"
                                required
                                value={formCierre.monto_final}
                                onChange={(e) =>
                                  setFormCierre({ ...formCierre, monto_final: e.target.value })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="observaciones_cierre">Observaciones</Label>
                              <Textarea
                                id="observaciones_cierre"
                                value={formCierre.observaciones}
                                onChange={(e) =>
                                  setFormCierre({ ...formCierre, observaciones: e.target.value })
                                }
                              />
                            </div>

                            <Button variant="destructive" type="submit" disabled={loading}>
                              {loading ? 'Cerrando...' : 'Cerrar Caja'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
}

