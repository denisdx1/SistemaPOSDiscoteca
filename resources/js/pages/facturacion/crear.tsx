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
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
}

interface Orden {
  id: number;
  numero_orden: string;
  estado: string;
  subtotal: number;
  total: number;
  items: OrdenItem[];
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
  mesa?: Mesa;
  orden?: Orden;
  cajasAbiertas: Caja[];
}

export default function CrearFactura({ mesa, orden, cajasAbiertas }: CrearFacturaProps) {
  const { toast } = useToast();
  const [procesando, setProcesando] = useState(false);
  const [cambio, setCambio] = useState<number | null>(null);
  const [boletaUrl, setBoletaUrl] = useState<string | null>(null);
  const [propina, setPropina] = useState<number>(0);
  const [propinaPercentage, setPropinaPercentage] = useState<number>(0);
  const [step, setStep] = useState<'propina' | 'metodo' | 'confirmacion'>('propina');

  const form = useForm({
    metodo_pago: '',
    monto_recibido: '',
    notas: '',
    caja_id: cajasAbiertas.length > 0 ? cajasAbiertas[0].id.toString() : ''
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
    setPropina(parseFloat(propinaAmount.toFixed(2)));
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

    // Añadir propina al monto si es aplicable
    const montoFinal = calcularTotal(Number(orden.total));
    form.setData('monto_recibido', montoFinal.toString());

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: Detalles de la Orden - Visible solo en pantallas medianas y grandes */}
          <Card className="h-80 overflow-auto hidden md:block">
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
                      {orden.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2">{item.nombre}</td>
                          <td className="text-right">{item.cantidad}</td>
                          <td className="text-right">{formatCurrency(item.precio_unitario)}</td>
                          <td className="text-right">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(orden.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(orden.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Columna derecha: Procesamiento de Pago - Centrada en móviles, a la derecha en escritorio */}
          <div className="flex justify-center md:justify-start lg:justify-center">
            <div className="w-full max-w-sm">
              <Card className="shadow-lg">
                {/* Encabezado */}
                <CardHeader className="text-center border-b py-3">
                  <div className="flex justify-center mb-1">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <Coffee className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">Procesar Pago</CardTitle>
                  <CardDescription className="flex items-center justify-center mt-0.5 text-xs">
                    <Receipt className="h-3 w-3 mr-1" />
                    Mesa #{mesa?.numero}
                  </CardDescription>
                </CardHeader>
                
                {/* Contenido - Paso 1: Propina */}
                {step === 'propina' && (
                  <CardContent className="pt-4 px-4">
                    <div className="text-center mb-6">
                      <p className="text-xs text-muted-foreground">Total de la cuenta</p>
                      <h2 className="text-3xl font-bold">{formatCurrency(orden.total)}</h2>
                    </div>
                    
                    <div className="mb-8">
                      <p className="text-sm mb-3 text-center font-medium">¿Desea agregar propina?</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={propinaPercentage === 10 ? "default" : "outline"} 
                          onClick={() => handlePropina(10)}
                          className="w-full h-12 text-lg"
                        >
                          10%
                        </Button>
                        <Button 
                          variant={propinaPercentage === 15 ? "default" : "outline"} 
                          onClick={() => handlePropina(15)}
                          className="w-full h-12 text-lg"
                        >
                          15%
                        </Button>
                        <Button 
                          variant={propinaPercentage === 20 ? "default" : "outline"} 
                          onClick={() => handlePropina(20)}
                          className="w-full h-12 text-lg"
                        >
                          20%
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 bg-muted/20 p-4 rounded-lg mb-6">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(orden.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Propina ({propinaPercentage}%):</span>
                        <span>{formatCurrency(propina)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(calcularTotal(Number(orden.total)))}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={nextStep}
                      className="w-full h-12 text-base"
                    >
                      Continuar
                    </Button>
                  </CardContent>
                )}

                {/* Contenido - Paso 2: Método de Pago */}
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
                        <span className="font-bold">{formatCurrency(calcularTotal(Number(orden.total)))}</span>
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Contenido - Paso 3: Confirmación */}
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
                      
                      <p className="text-xl font-bold mb-1">{formatCurrency(calcularTotal(Number(orden.total)))}</p>
                      <p className="text-sm text-muted-foreground capitalize">{form.data.metodo_pago}</p>
                    </div>

                    <div className="mt-4 space-y-1 bg-muted/20 p-4 rounded-lg mb-6">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(orden.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Propina ({propinaPercentage}%):</span>
                        <span>{formatCurrency(propina)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(calcularTotal(Number(orden.total)))}</span>
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
                
                {/* Sección de pago exitoso */}
                {cambio !== null && (
                  <CardContent className="pt-4 px-4">
                    <div className="flex flex-col items-center">
                      <div className="bg-green-100 p-4 rounded-full mb-4">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">¡Pago exitoso!</h3>
                      <p className="text-sm text-muted-foreground mb-6">Se ha procesado el pago correctamente</p>
                      
                      <div className="w-full p-4 border rounded-lg bg-primary/5 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total pagado:</span>
                            <span>{formatCurrency(calcularTotal(Number(orden.total)))}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Cambio:</span>
                            <span>{formatCurrency(cambio)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full">
                        <Button 
                          onClick={imprimirBoleta} 
                          className="w-full h-10 text-sm"
                          variant="default"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir Boleta
                        </Button>
                        <Button 
                          onClick={volverAMesas} 
                          className="w-full h-10 text-sm"
                          variant="outline"
                        >
                          Volver a Mesas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

CrearFactura.layout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
