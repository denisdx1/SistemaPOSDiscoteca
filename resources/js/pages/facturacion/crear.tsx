import React from 'react';
import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Coffee, DollarSign, Smartphone, Receipt, ArrowLeft, Printer, CheckCircle, CreditCard as CreditCardIcon, Banknote } from 'lucide-react';

interface OrdenItem {
  id: number;
  nombre: string;
  cantidad?: number;
  precio_unitario?: number;
  subtotal?: number;
  notas?: string;
  pivot?: {
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    notas: string;
  };
}

interface Orden {
  id: number;
  numero_orden: string;
  estado: string;
  subtotal: number;
  total: number;
  productos: OrdenItem[];
}

interface Mesa {
  id: number;
  numero: number;
  estado: string;
}

interface Caja {
  id: number;
  numero_caja: number;
  usuario: string;
  monto_inicial: number;
  fecha_apertura: string;
}

interface CrearFacturaProps {
  mesa: Mesa | null;
  orden: Orden | null;
  cajasAbiertas: Caja[];
  userInfo: {
    isCajero: boolean;
    cajaAsignada: Caja | null;
    error?: string;
  };
}

export default function CrearFactura({ mesa, orden, cajasAbiertas, userInfo }: CrearFacturaProps) {
  const { toast } = useToast();
  const [procesando, setProcesando] = useState(false);
  const [cambio, setCambio] = useState<number | null>(null);
  const [boletaUrl, setBoletaUrl] = useState<string | null>(null);
  const [propina, setPropina] = useState<number>(0);
  const [propinaPercentage, setPropinaPercentage] = useState<number>(0);
  const [step, setStep] = useState<'propina' | 'metodo' | 'confirmacion'>('propina');
  const [pedirSinMesa, setPedirSinMesa] = useState<boolean>(false);
  const [ordenSinMesa, setOrdenSinMesa] = useState<boolean>(false);
  const [redireccionando, setRedireccionando] = useState<boolean>(false);

  // Establecer caja asignada para cajeros automáticamente
  const cajaInicial = userInfo.isCajero && userInfo.cajaAsignada ? 
    userInfo.cajaAsignada.id.toString() : 
    (cajasAbiertas.length > 0 ? cajasAbiertas[0].id.toString() : '');

  const form = useForm({
    metodo_pago: '',
    monto_recibido: '',
    notas: '',
    caja_id: cajaInicial,
    propina: '0'
  });

  // Calcular el total incluyendo propina
  const calcularTotal = (subtotal: number | string): number => {
    return Number(subtotal) + propina;
  };

  // Manejar cambio de porcentaje de propina
  const handlePropina = (percentage: number) => {
    if (!orden) return;
    
    setPropinaPercentage(percentage);
    const propinaAmount = Number(orden.total) * (percentage / 100);
    const propinaRedondeada = parseFloat(propinaAmount.toFixed(2));
    setPropina(propinaRedondeada);
    form.setData('propina', propinaRedondeada.toString());
  };

  // Manejar selección de método de pago
  const handleMetodoPago = (metodo: string) => {
    // Establecer método de pago
    form.setData('metodo_pago', metodo);
    
    // Asegurarnos de establecer también el monto recibido
    if (orden) {
      const montoFinal = calcularTotal(Number(orden.total));
      form.setData('monto_recibido', montoFinal.toString());
    }
    
    setStep('confirmacion');
  };

  // Ir al paso anterior
  const goBack = () => {
    if (step === 'metodo') {
      setStep('propina');
    } else if (step === 'confirmacion') {
      setStep('metodo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden) return;

    // Validar que se haya seleccionado una caja
    if (!form.data.caja_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una caja para procesar el pago",
        variant: "destructive"
      });
      return;
    }

    // Si es cajero con caja asignada, asegurarse de que use esa caja
    if (userInfo.isCajero && userInfo.cajaAsignada) {
      form.setData('caja_id', userInfo.cajaAsignada.id.toString());
    }

    // Añadir propina al monto si es aplicable
    const montoFinal = calcularTotal(Number(orden.total));
    form.setData('monto_recibido', montoFinal.toString());
    form.setData('propina', propina.toString());

    setProcesando(true);
    try {
      const response = await axios.post(`/facturacion/cobrar/${orden.id}`, form.data);
      
      if (response.data.success) {
        toast({
          title: "Éxito",
          description: "Orden cobrada correctamente",
        });
        
        setCambio(response.data.cambio);
        if (response.data.boleta_url) {
          setBoletaUrl(response.data.boleta_url);
        }
        
        // Si hay una redirección automática indicada, usarla después de un breve retraso
        // para permitir al usuario ver el mensaje de éxito y el cambio
        if (response.data.redirect && !mesa) {
          setRedireccionando(true);
          setTimeout(() => {
            window.location.href = response.data.redirect;
          }, 3000); // 3 segundos de retraso para mostrar el mensaje y el cambio
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al procesar el pago",
        variant: "destructive"
      });
    } finally {
      setProcesando(false);
    }
  };

  // Función para imprimir la boleta en una ventana nueva
  const imprimirBoleta = () => {
    if (boletaUrl) {
      const nuevaVentana = window.open(boletaUrl, '_blank');
      if (nuevaVentana) {
        nuevaVentana.focus();
      } else {
        toast({
          title: "Advertencia",
          description: "Por favor, permita las ventanas emergentes para imprimir la boleta",
          variant: "default"
        });
      }
    }
  };

  // Función para volver a la vista de mesas
  const volverAMesas = () => {
    window.location.href = '/mesas';
  };

  // Continuar al siguiente paso
  const nextStep = () => {
    if (step === 'propina') {
      setStep('metodo');
    }
  };

  // Función para crear nuevo pedido sin mesa
  const crearPedidoSinMesa = () => {
    window.location.href = '/ordenes/nueva';
  };

  // Función para volver a pedidos
  const verPedidos = () => {
    window.location.href = '/ordenes/gestion';
  };

  // Función para obtener el nombre de la caja seleccionada
  const getCajaSeleccionadaInfo = () => {
    const caja = cajasAbiertas.find(c => c.id.toString() === form.data.caja_id);
    return caja ? `Caja #${caja.numero_caja} - ${caja.usuario}` : 'No seleccionada';
  };

  const renderCajaSelection = () => {
    if (userInfo.isCajero && userInfo.cajaAsignada) {
      // Para cajeros con caja asignada, mostrar información pero no selector
      const caja = userInfo.cajaAsignada;
      return (
        <div className="mb-4">
          <Label htmlFor="caja" className="text-sm mb-2 block">Caja asignada</Label>
          <Alert className="bg-slate-100">
            <AlertDescription className="font-medium">
              Usando Caja #{caja.numero_caja} - {caja.usuario || 'Cajero'}
            </AlertDescription>
          </Alert>
        </div>
      );
    } else if (userInfo.isCajero && !userInfo.cajaAsignada) {
      // Para cajeros sin caja asignada, mostrar mensaje de error específico
      return (
        <div className="mb-4">
          <Alert className="bg-red-50">
            <AlertDescription className="text-red-500">
              {userInfo.error || "No tiene una caja asignada abierta. Por favor contacte al administrador."}
            </AlertDescription>
          </Alert>
          {userInfo.error && userInfo.error.includes("no está abierta") && (
            <Button 
              onClick={() => window.location.href = '/caja'}
              className="w-full mt-2"
              variant="outline"
            >
              Ir al Módulo de Cajas
            </Button>
          )}
        </div>
      );
    } else {
      // Para administradores, mostrar selector completo
      return (
        <div className="mb-4">
          <Label htmlFor="caja" className="text-sm mb-2 block">Seleccionar caja</Label>
          <Select
            value={form.data.caja_id}
            onValueChange={(value) => form.setData('caja_id', value)}
          >
            <SelectTrigger id="caja" className="w-full mb-4">
              <SelectValue placeholder="Seleccione una caja" />
            </SelectTrigger>
            <SelectContent>
              {cajasAbiertas.map((caja) => (
                <SelectItem key={caja.id} value={caja.id.toString()}>
                  Caja #{caja.numero_caja} - {caja.usuario}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
  };

  // Función para renderizar el paso de propina
  const renderPropinaStep = () => {
    if (!orden) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Propina</h3>
        
        {/* Botones de porcentaje */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => handlePropina(0)}
            variant={propinaPercentage === 0 ? "default" : "outline"}
            size="sm"
          >
            0%
          </Button>
          <Button
            onClick={() => handlePropina(5)}
            variant={propinaPercentage === 5 ? "default" : "outline"}
            size="sm"
          >
            5%
          </Button>
          <Button
            onClick={() => handlePropina(10)}
            variant={propinaPercentage === 10 ? "default" : "outline"}
            size="sm"
          >
            10%
          </Button>
          <Button
            onClick={() => handlePropina(15)}
            variant={propinaPercentage === 15 ? "default" : "outline"}
            size="sm"
          >
            15%
          </Button>
        </div>
        
        {/* Monto de propina personalizado */}
        <div className="mb-4">
          <Label htmlFor="propina" className="text-sm mb-2 block">Propina (opcional)</Label>
          <Input
            id="propina"
            type="number"
            value={propina}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const propinaValor = isNaN(value) ? 0 : value;
              setPropina(propinaValor);
              form.setData('propina', propinaValor.toString());
              setPropinaPercentage(0); // Reset percentage when manual input
            }}
            className="mb-4"
          />
        </div>
        
        {/* Render de selección de caja */}
        {renderCajaSelection()}
        
        {/* Totales */}
        <div className="space-y-2 p-4 bg-black-100 rounded-md">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(orden.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Propina:</span>
            <span>{formatCurrency(propina)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total a pagar:</span>
            <span>{formatCurrency(calcularTotal(orden.subtotal))}</span>
          </div>
        </div>
        
        {/* Botón para continuar - Deshabilitado si es cajero sin caja asignada */}
        <Button 
          onClick={nextStep} 
          className="w-full"
          disabled={userInfo.isCajero && !userInfo.cajaAsignada}
        >
          Continuar
        </Button>
        
        {/* Mensaje informativo para cajeros sin caja */}
        {userInfo.isCajero && !userInfo.cajaAsignada && (
          <p className="text-center text-sm text-red-500 mt-2">
            No puede continuar sin una caja asignada. Por favor contacte al administrador.
          </p>
        )}
      </div>
    );
  };

  if (!orden) {
    return (
      <>
        <Head title="Cobrar Orden" />
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertDescription>
              No se encontró una orden activa para cobrar
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  // Verificar si hay cajas abiertas
  if (cajasAbiertas.length === 0) {
    return (
      <>
        <Head title="Cobrar Orden" />
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertDescription>
              No hay cajas abiertas. Debe abrir al menos una caja antes de cobrar.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Procesar Pago" />
      <div className="container mx-auto py-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Procesar Pago</h1>
          
          {/* Botones para crear pedido sin mesa o ver pedidos */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={crearPedidoSinMesa}
              className="flex items-center gap-2"
            >
              <Coffee className="h-4 w-4" />
              Nuevo Pedido sin Mesa
            </Button>
            
            <Button 
              variant="outline" 
              onClick={verPedidos}
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Ver Pedidos
            </Button>
          </div>
        </div>
        
        {!orden && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sin orden seleccionada</CardTitle>
              <CardDescription>
                Puede crear un nuevo pedido sin mesa o ver los pedidos existentes para cobrarlos.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="flex gap-4">
                <Button 
                  onClick={crearPedidoSinMesa}
                  className="flex items-center gap-2"
                >
                  <Coffee className="h-4 w-4" />
                  Crear Pedido sin Mesa
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={verPedidos}
                  className="flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Ver Pedidos
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
        
        {orden && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Detalles de la Orden - Visible solo en pantallas medianas y grandes */}
            <Card className="h-150 overflow-auto hidden md:block">
              <CardHeader className="pb-3">
                <CardTitle>Detalles de la Orden #{orden.numero_orden}</CardTitle>
                <CardDescription>
                  {mesa ? `Mesa #${mesa.numero}` : 'Orden para llevar'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Producto</th>
                          <th className="text-right py-2">Cant.</th>
                          <th className="text-right py-2">Precio</th>
                          <th className="text-right py-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden?.productos?.map((item) => {
                          const cantidad = item.pivot ? item.pivot.cantidad : (item.cantidad || 0);
                          const precioUnitario = item.pivot ? item.pivot.precio_unitario : (item.precio_unitario || 0);
                          const subtotal = item.pivot ? item.pivot.subtotal : (item.subtotal || 0);
                          
                          return (
                            <tr key={item.id} className="border-b">
                              <td className="py-2">{item.nombre}</td>
                              <td className="text-right">{cantidad}</td>
                              <td className="text-right">{formatCurrency(precioUnitario)}</td>
                              <td className="text-right">{formatCurrency(subtotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(orden?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(orden?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Columna derecha: Procesamiento de Pago - Centrada en móviles, a la derecha en escritorio */}
            <div className="flex justify-center md:justify-start lg:justify-center">
              <div className="w-full max-w-sm">
                <Card className="shadow-lg">
                  {/* Encabezado - Visible solo si no hay pago exitoso */}
                  {cambio === null && (
                    <CardHeader className="text-center border-b py-3">
                      <div className="flex justify-center mb-1">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <Coffee className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">Procesar Pago</CardTitle>
                      {mesa && (
                        <CardDescription className="flex items-center justify-center mt-0.5 text-xs">
                          <Receipt className="h-3 w-3 mr-1" />
                          Mesa #{mesa.numero}
                        </CardDescription>
                      )}
                    </CardHeader>
                  )}
                  
                  {/* Si hay pago exitoso, mostrar solo esa sección */}
                  {cambio !== null ? (
                    <CardContent className="pt-4 px-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-3 w-full justify-center">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-lg font-bold">¡Pago exitoso!</h3>
                        </div>
                        
                        <div className="w-full p-3 border rounded-lg bg-primary/5 mb-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Total pagado:</span>
                              <span>{orden ? formatCurrency(calcularTotal(Number(orden.total))) : formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Cambio:</span>
                              <span>{formatCurrency(cambio)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full mt-1">
                          <Button 
                            onClick={imprimirBoleta} 
                            className="w-full h-10 text-sm"
                            variant="default"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir Boleta
                          </Button>
                          
                          {mesa ? (
                            <Button 
                              onClick={volverAMesas} 
                              className="w-full h-10 text-sm"
                              variant="outline"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Volver a Mesas
                            </Button>
                          ) : (
                            <>
                              <Button 
                                onClick={verPedidos}
                                className="w-full h-10 text-sm"
                                variant="outline"
                              >
                                <Receipt className="h-4 w-4 mr-2" />
                                Ver Pedidos
                              </Button>
                              {redireccionando && (
                                <p className="text-center text-sm text-muted-foreground mt-2">
                                  Redirigiendo automáticamente en unos segundos...
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  ) : (
                    /* Contenidos de los pasos - Solo mostrar si no hay pago exitoso */
                    <>
                      {/* Paso 1: Propina */}
                      {step === 'propina' && (
                        <CardContent className="pt-4 px-4">
                          {renderPropinaStep()}
                        </CardContent>
                      )}

                      {/* Paso 2: Método de Pago */}
                      {step === 'metodo' && (
                        <CardContent className="pt-4 px-4">
                          <div className="mb-2 flex items-center">
                            <Button 
                              variant="ghost" 
                              className="p-1 mr-2"
                              onClick={goBack}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="text-lg font-medium">Seleccione método de pago</h3>
                          </div>
                          
                          <div className="mt-6 mb-8 grid grid-cols-2 gap-4">
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleMetodoPago('efectivo')}
                            >
                              <Banknote className="h-10 w-10 mb-2" />
                              <span className="text-xs">Efectivo</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleMetodoPago('tarjeta')}
                            >
                              <CreditCardIcon className="h-10 w-10 mb-2" />
                              <span className="text-xs">Tarjeta</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleMetodoPago('yape')}
                            >
                              <Smartphone className="h-10 w-10 mb-2" />
                              <span className="text-xs">Yape</span>
                            </Button>
                            
                            <Button 
                              variant="outline"
                              className="flex flex-col items-center justify-center h-24 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleMetodoPago('transferencia')}
                            >
                              <CreditCard className="h-10 w-10 mb-2" />
                              <span className="text-xs">Transferencia</span>
                            </Button>
                          </div>

                          <div className="mt-4 space-y-1 bg-muted/20 p-4 rounded-lg">
                            <div className="flex justify-between">
                              <span>Total a pagar:</span>
                              <span className="font-bold">{orden ? formatCurrency(calcularTotal(Number(orden.total))) : formatCurrency(0)}</span>
                            </div>
                          </div>
                        </CardContent>
                      )}

                      {/* Paso 3: Confirmación */}
                      {step === 'confirmacion' && (
                        <CardContent className="pt-4 px-4">
                          <div className="mb-2 flex items-center">
                            <Button 
                              variant="ghost" 
                              className="p-1 mr-2"
                              onClick={goBack}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="text-lg font-medium">Confirmar pago</h3>
                          </div>
                          
                          <div className="my-8 flex flex-col items-center">
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                              {form.data.metodo_pago === 'efectivo' && <Banknote className="h-12 w-12 text-primary" />}
                              {form.data.metodo_pago === 'tarjeta' && <CreditCardIcon className="h-12 w-12 text-primary" />}
                              {form.data.metodo_pago === 'yape' && <Smartphone className="h-12 w-12 text-primary" />}
                              {form.data.metodo_pago === 'transferencia' && <CreditCard className="h-12 w-12 text-primary" />}
                            </div>
                            
                            <p className="text-xl font-bold mb-1">
                              {orden ? formatCurrency(calcularTotal(Number(orden.total))) : formatCurrency(0)}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">{form.data.metodo_pago}</p>
                          </div>

                          <div className="mt-4 space-y-1 bg-muted/20 p-4 rounded-lg mb-6">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{orden ? formatCurrency(orden.subtotal) : formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Propina ({propinaPercentage}%):</span>
                              <span>{formatCurrency(propina)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{orden ? formatCurrency(calcularTotal(Number(orden.total))) : formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-muted-foreground/20">
                              <span>Caja:</span>
                              <span className="font-medium">
                                {getCajaSeleccionadaInfo()}
                              </span>
                            </div>
                          </div>

                          <Button 
                            onClick={handleSubmit}
                            className="w-full h-12 text-base"
                            disabled={procesando}
                          >
                            {procesando ? 'Procesando...' : 'Procesar Pago'}
                          </Button>
                        </CardContent>
                      )}
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </>
  );
}

CrearFactura.layout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
